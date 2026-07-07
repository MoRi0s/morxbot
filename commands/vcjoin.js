// commands/vcjoin.js
import { SlashCommandBuilder } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";

export const category = "Music";
export const permissionLevel = 1;

export const data = new SlashCommandBuilder()
    .setName("vcjoin")
    .setDescription("Bot をVCに参加させる");

export async function execute(interaction) {
    const member = interaction.member;
    const voice = member.voice.channel;

    if (!voice) {
        return interaction.reply({ content: "VCに入ってから使って！", ephemeral: true });
    }

    joinVoiceChannel({
        channelId: voice.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator
    });

    return interaction.reply("🔊 VCに参加しました！");
}
