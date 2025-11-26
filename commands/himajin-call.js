import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, InteractionResponseType } from "discord.js";
import fs from "fs";
import path from "path";

const rolesFile = path.join("./data/roles.json");
const messagesFile = path.join("./data/himajinMessages.json");

function loadJSON(file) {
  if (!fs.existsSync(file)) return {};
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } 
  catch { return {}; }
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
  if (!himajinRoleId) {
    // ephemeral 送信の新しい書き方
    return interaction.reply({ content: "⚠ 暇人ロールが設定されていません", flags: 64 });
  }

  // メッセージを保存
  const messages = loadJSON(messagesFile);
  messages[guildId] = messages[guildId] || {};
  messages[guildId][userId] = interaction.options.getString("message");
  saveJSON(messagesFile, messages);

  const embed = new EmbedBuilder()
    .setTitle("暇人を呼ぶ魔法のボタン")
    .setDescription("ボタンを押すと暇人ロールに通知されます")
    .setColor("Blue");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`himajin-call-${guildId}-${userId}`)
      .setLabel("暇人コール")
      .setStyle(ButtonStyle.Primary)
  );

  // 初回応答は一度だけ
  await interaction.reply({ embeds: [embed], components: [row] });
}
