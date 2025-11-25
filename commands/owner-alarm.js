// commands/owner-alarm.js
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";

const rolesFile = path.join("./data/roles.json");
const cooldownFile = path.join("./data/alarmCooldown.json");

function loadJSON(file) {
    if (!fs.existsSync(file)) return {};
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export const data = new SlashCommandBuilder()
    .setName("owner-alarm")
    .setDescription("サーバー管理者にアラームを送信（管理者限定）")
    .addStringOption(option =>
        option.setName("message")
            .setDescription("カスタムメッセージ")
            .setRequired(true)
    );

export async function execute(interaction) {
    // 管理者チェック
    if (!interaction.member.permissions.has("Administrator")) {
        return interaction.reply({ content: "⛔ 管理者のみ使用可能です", ephemeral: true });
    }

    const guildId = interaction.guild.id;
    const rolesData = loadJSON(rolesFile);
    const ownerId = rolesData[guildId]?.ownerId;

    if (!ownerId) return interaction.reply({ content: "⚠ 鯖主IDが設定されていません", ephemeral: true });

    const embed = new EmbedBuilder()
        .setTitle("管理者を呼ぶボタン")
        .setDescription(interaction.options.getString("message"))
        .setColor("Red");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`owner-alarm-${guildId}`) // ギルドIDを入れてボタン特定
            .setLabel("アラーム確認")
            .setStyle(ButtonStyle.Danger)
    );

    // 埋め込み＋ボタンを送信（メンションも）
    await interaction.reply({ content: `<@&${ownerId}>`, embeds: [embed], components: [row] });
}
