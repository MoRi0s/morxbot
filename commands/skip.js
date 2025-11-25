// commands/skip.js
import { SlashCommandBuilder } from "discord.js";
import { skip } from "../utils/audioPlayer.js"; // playerではなく個別関数をimport

export const data = new SlashCommandBuilder()
    .setName("skip")
    .setDescription("次の曲にスキップ");

export async function execute(interaction) {
    const guildId = interaction.guild.id;

    const result = skip(guildId);

    if (!result) {
        return interaction.reply("⛔ スキップできる曲がありません！");
    }

    return interaction.reply("⏭️ スキップしました！");
}
