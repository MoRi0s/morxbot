// commands/soundfavoritelist.js
import { SlashCommandBuilder } from "discord.js";
import { jsonDB } from "../utils/jsonStore.js";

export const data = new SlashCommandBuilder()
    .setName("soundfavoritelist")
    .setDescription("お気に入りサウンド一覧");

export async function execute(interaction) {
    const list = jsonDB.getFavorites(interaction.guild.id);

    if (!list.length) {
        return interaction.reply("お気に入りは登録されていません！");
    }

    const text = list.map((url, i) => `${i + 1}. ${url}`).join("\n");

    return interaction.reply(`⭐ **お気に入りリスト**\n${text}`);
}
