import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";

const rolesFile = path.join("./data/roles.json");

function loadJSON(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export const data = new SlashCommandBuilder()
  .setName("owner-alarm")
  .setDescription("サーバー管理者にアラームを送信（管理者限定）");

export async function execute(interaction) {
  // 管理者チェック
  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({ content: "⛔ 管理者のみ使用可能です", ephemeral: true });
  }

  const guildId = interaction.guild.id;
  const rolesData = loadJSON(rolesFile);
  const ownerRoleId = rolesData[guildId]?.ownerRoleId;

  if (!ownerRoleId) return interaction.reply({ content: "⚠ 鯖主ロールIDが設定されていません", ephemeral: true });

  const embed = new EmbedBuilder()
    .setTitle("鯖主目覚ましボタン")
    .setDescription("ボタンを押すと鯖主が来るよ") // 完全固定化
    .setColor("4500ff");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`owner-alarm-${guildId}`)
      .setLabel("鯖主ボタン")
      .setStyle(ButtonStyle.Primary)
  );

  // ボタン付き埋め込み送信
  await interaction.reply({ embeds: [embed], components: [row] });
}
