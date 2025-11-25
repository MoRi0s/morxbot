// commands/resume.js
import { SlashCommandBuilder } from "discord.js";
import { player } from "../utils/audioPlayer.js";

export const data = new SlashCommandBuilder()
    .setName("resume")
    .setDescription("一時停止中の曲を再開");

export async function execute(interaction) {
    const guildId = interaction.guild.id;

    const ok = player.resume(guildId);
    if (!ok) {
        return interaction.reply("⛔ 再開できる曲がありません！");
    }

    return interaction.reply("▶️ 再生再開しました！");
}
