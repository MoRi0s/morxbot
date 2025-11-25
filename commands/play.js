// commands/play.js
import { SlashCommandBuilder } from "discord.js";
import { addToQueue, joinVC } from "../utils/audioPlayer.js";
import { searchYouTube, validateYouTubeURL, getVideoInfo } from "../utils/youtube.js";
import { jsonDB } from "../utils/jsonStore.js";

export const data = new SlashCommandBuilder()
    .setName("play")
    .setDescription("YouTube URLまたは検索ワードで再生")
    .addStringOption(option =>
        option.setName("query")
            .setDescription("YouTube URL もしくは検索ワード")
            .setRequired(true)
    );

export async function execute(interaction) {
    const query = interaction.options.getString("query");
    const member = interaction.member;

    if (!member.voice.channel) {
        return interaction.reply({ content: "⚠ VCに入ってから使ってね！", ephemeral: true });
    }

    await interaction.deferReply();

    let videoInfo;

    // URLの場合
    if (validateYouTubeURL(query)) {
        videoInfo = await getVideoInfo(query);
    } else {
        const video = await searchYouTube(query);
        if (!video) {
            return interaction.editReply("❌ YouTube検索で見つかりませんでした。");
        }
        videoInfo = {
            title: video.title,
            url: video.url,
            lengthSeconds: video.seconds
        };
    }

    // VC接続
    await joinVC(member);

    // キューに追加
    await addToQueue(interaction.guild.id, {
        type: "youtube",
        url: videoInfo.url,
        title: videoInfo.title
    });

    // 履歴保存
    jsonDB.addHistory(interaction.guild.id, {
        title: videoInfo.title,
        url: videoInfo.url,
        time: Date.now()
    });

    return interaction.editReply(`▶️ **${videoInfo.title}** をキューに追加しました！`);
}
