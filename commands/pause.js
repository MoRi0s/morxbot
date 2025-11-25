// commands/pause.js
import { SlashCommandBuilder } from "discord.js";
import { player } from "../utils/audioPlayer.js";

export const data = new SlashCommandBuilder()
    .setName("pause")
    .setDescription("再生を一時停止");

export async function execute(interaction) {
    const guildId = interaction.guild.id;

    const ok = player.pause(guildId);
    if (!ok) {
        return interaction.reply("⛔ 一時停止できる曲がありません！");
    }

    return interaction.reply("⏸️ 一時停止しました！");
}
