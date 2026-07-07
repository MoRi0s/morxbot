import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";

export const category = "Others";
export const permissionLevel = 2;

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



const roleConfigs = JSON.parse(
    fs.readFileSync("./data/roleconfig.json", "utf8")
);

const roleConfig = roleConfigs[interaction.guild.id] ?? {
    adminRoles: []
};


const isAdmin =
    interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
    );


const hasAdminRole =
    interaction.member.roles.cache.some(role =>
        roleConfig.adminRoles.includes(role.id)
    );


if (!isAdmin && !hasAdminRole) {
    return interaction.reply({
        content:"❌ 管理者または設定された管理ロールのみ使用可能です",
        flags:64
    });
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
