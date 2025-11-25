import { SlashCommandBuilder } from "discord.js";
import { playSound } from "../utils/soundPlayer.js";
import { jsonDB } from "../utils/jsonStore.js";

export const data = new SlashCommandBuilder()
    .setName("sound")
    .setDescription("任意の音声URL(mp3/wav/ogg/Discord URL)を再生")
    .addStringOption(opt =>
        opt.setName("url")
            .setDescription("音声ファイルURL")
            .setRequired(true)
    );

export async function execute(interaction) {
    const url = interaction.options.getString("url");
    const member = interaction.member;
    if (!member.voice.channel) return interaction.reply({ content: "VCに入ってから使って！", ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    try {
        await playSound(member, url, interaction.channel);

        // 履歴保存
        jsonDB.addSoundHistory(member.guild.id, { url, time: Date.now() });

        await interaction.editReply(`🔊 サウンドを再生開始！\n${url}`);
    } catch (err) {
        console.error("sound command error:", err);
        await interaction.editReply("❌ サウンド再生中にエラーが発生しました");
    }
}
