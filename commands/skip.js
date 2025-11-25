// commands/skip.js
import { SlashCommandBuilder } from "discord.js";
import { player } from "../utils/audioPlayer.js";

export const data = new SlashCommandBuilder()
    .setName("skip")
    .setDescription("次の曲にスキップ");

export async function execute(interaction) {
    const guildId = interaction.guild.id;

    const result = player.skip(guildId);

    if (!result) {
        return interaction.reply("⛔ スキップできる曲がありません！");
    }

    return interaction.reply("⏭️ スキップしました！");
}
