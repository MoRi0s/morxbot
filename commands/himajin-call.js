// commands/himajin-call.js
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";

const rolesFile = path.join("./data/roles.json");
const messagesFile = path.join("./data/himajinMessages.json");

function loadJSON(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export const data = new SlashCommandBuilder()
  .setName("himajin-call")
  .setDescription("暇人を呼ぶ魔法のボタン")
  .addStringOption(option =>
    option.setName("message")
      .setDescription("ボタン押下時に送るメッセージ")
      .setRequired(true)
  );

export async function execute(interaction) {
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const rolesData = loadJSON(rolesFile);
  const himajinRoleId = rolesData[guildId]?.himajinRoleId;

  if (!himajinRoleId) return interaction.reply({ content: "⚠ 暇人ロールが設定されていません", ephemeral: true });

  // メッセージを保存（ユーザー単位）
  const messages = loadJSON(messagesFile);
  messages[guildId] = messages[guildId] || {};
  messages[guildId][userId] = interaction.options.getString("message");
  saveJSON(messagesFile, messages);

  const embed = new EmbedBuilder()
    .setTitle("暇人を呼ぶ魔法のボタン")  // 固定タイトル
    .setColor("Blue");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`himajin-call-${guildId}-${userId}`) // ユーザー単位で識別
      .setLabel("呼び出し確認")
      .setStyle(ButtonStyle.Primary)
  );

  // 埋め込み＋ボタンのみ送信
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
}
