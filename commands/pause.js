// commands/pause.js
import { SlashCommandBuilder } from "discord.js";
import { pause } from "../utils/audioPlayer.js"; // playerではなく個別関数をimport

export const data = new SlashCommandBuilder()
    .setName("pause")
    .setDescription("再生を一時停止");

export async function execute(interaction) {
    const guildId = interaction.guild.id;

    const ok = pause(guildId);
    if (!ok) {
        return interaction.reply("⛔ 一時停止できる曲がありません！");
    }

    return interaction.reply("⏸️ 一時停止しました！");
}
