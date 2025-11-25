// commands/stop.js
import { SlashCommandBuilder } from "discord.js";
import { player } from "../utils/audioPlayer.js";

export const data = new SlashCommandBuilder()
    .setName("stop")
    .setDescription("再生を停止し、キューをクリア");

export async function execute(interaction) {
    const guildId = interaction.guild.id;

    player.stop(guildId);

    return interaction.reply("⏹️ 再生を停止し、キューをクリアしました。");
}
