// commands/himajin-call.js
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
    .setName("himajin-call")
    .setDescription("暇人を呼ぶ魔法のボタン")
    .addStringOption(option =>
        option.setName("message")
            .setDescription("メッセージ")
            .setRequired(true)
    );

export async function execute(interaction) {
    const guildId = interaction.guild.id;
    const rolesData = loadJSON(rolesFile);
    const himajinRoleId = rolesData[guildId]?.himajinRoleId;

    if (!himajinRoleId) return interaction.reply({ content: "⚠ 暇人ロールが設定されていません", ephemeral: true });

    const cooldowns = loadJSON(cooldownFile);
    const lastUsed = cooldowns[guildId]?.[interaction.user.id] || 0;
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    if (now - lastUsed < DAY) {
        const remaining = DAY - (now - lastUsed);
        return interaction.reply({ content: `⏳ クールタイム中です (${Math.ceil(remaining/1000/60/60)}時間)`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle("📢 暇人呼び出し")
        .setDescription(interaction.options.getString("message"))
        .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("himajin-call-btn")
            .setLabel("呼び出し確認")
            .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ content: `<@&${himajinRoleId}>`, embeds: [embed], components: [row] });

    cooldowns[guildId] = cooldowns[guildId] || {};
    cooldowns[guildId][interaction.user.id] = now;
    saveJSON(cooldownFile, cooldowns);
}
