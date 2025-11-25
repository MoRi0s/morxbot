// commands/embedbuilder.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("embedbuilder")
    .setDescription("埋め込みメッセージを作成")
    .addStringOption(opt => opt.setName("title").setDescription("タイトル").setRequired(true))
    .addStringOption(opt => opt.setName("description").setDescription("本文").setRequired(true))
    .addStringOption(opt => opt.setName("color").setDescription("カラー（HEX）").setRequired(false));

export async function execute(interaction) {
    const title = interaction.options.getString("title");
    const description = interaction.options.getString("description");
    const color = interaction.options.getString("color") || "#00ff00";

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color);

    await interaction.reply({ embeds: [embed] });
}
