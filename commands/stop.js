// commands/stop.js
import { SlashCommandBuilder } from "discord.js";
import { stop } from "../utils/audioPlayer.js"; // playerではなく個別関数をimport

export const data = new SlashCommandBuilder()
    .setName("stop")
    .setDescription("再生を停止し、キューをクリア");

export async function execute(interaction) {
    const guildId = interaction.guild.id;

    stop(guildId);

    return interaction.reply("⏹️ 再生を停止し、キューをクリアしました。");
}
