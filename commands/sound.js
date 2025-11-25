// commands/sound.js
import { SlashCommandBuilder } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";

import { player } from "../utils/audioPlayer.js";
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
    const guildId = interaction.guild.id;
    const member = interaction.member;

    const voice = member.voice.channel;
    if (!voice) {
        return interaction.reply({ content: "VC に入ってから使って！", ephemeral: true });
    }

    joinVoiceChannel({
        channelId: voice.id,
        guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator
    });

    player.playSound(guildId, url, interaction.channel);

    jsonDB.addSoundHistory(guildId, {
        url,
        time: Date.now()
    });

    return interaction.reply(`🔊 サウンドを再生開始！\n${url}`);
}
