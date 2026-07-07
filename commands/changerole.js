import {
    SlashCommandBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionsBitField
} from "discord.js";

import fs from "fs";
import path from "path";

export const category = "Moderation";
export const permissionLevel = 2;

// ======================
// Slash Command（5個）
// ======================
export const data = new SlashCommandBuilder()
    .setName("changerole")
    .setDescription("複数ロール変更");

// 付与ロール（最大5）
for (let i = 1; i <= 5; i++) {
    data.addRoleOption(opt =>
        opt.setName(`addrole${i}`)
            .setDescription(`付与ロール${i}`)
            .setRequired(i === 1)
    );
}

// 削除ロール（最大5）
for (let i = 1; i <= 5; i++) {
    data.addRoleOption(opt =>
        opt.setName(`removerole${i}`)
            .setDescription(`削除ロール${i}`)
            .setRequired(false)
    );
}

// ======================
// SLASH
// ======================
export async function execute(interaction) {

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

    const addIds = [];
    const removeIds = [];

    for (let i = 1; i <= 5; i++) {
        const role = interaction.options.getRole(`addrole${i}`);
        if (role) addIds.push(role.id);
    }

    for (let i = 1; i <= 5; i++) {
        const role = interaction.options.getRole(`removerole${i}`);
        if (role) removeIds.push(role.id);
    }

    const button = new ButtonBuilder()
        .setCustomId(`changeRole|${addIds.join(",")}|${removeIds.join(",")}`)
        .setLabel("ロール変更")
        .setStyle(ButtonStyle.Primary);

    return interaction.reply({
        content: "👇 ボタンを押してください",
        components: [
            new ActionRowBuilder().addComponents(button)
        ]
    });
}

// ======================
// BUTTON
// ======================
export async function handleButton(interaction) {

    const modal = new ModalBuilder()
        .setCustomId(interaction.customId)
        .setTitle("ロール変更");

    const input = new TextInputBuilder()
        .setCustomId("userInput")
        .setLabel("ユーザー名 / ID / @mention")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(input)
    );

    return interaction.showModal(modal);
}

// ======================
// MODAL
// ======================
export async function handleModal(interaction) {

    try {

        await interaction.deferReply({ flags: 64 });

        const parts = interaction.customId.split("|");

        const addIds = parts[1]
            ? parts[1].split(",").filter(Boolean)
            : [];

        const removeIds = parts[2]
            ? parts[2].split(",").filter(Boolean)
            : [];

        const userInput = interaction.fields
            .getTextInputValue("userInput")
            .trim()
            .replace(/[<@!>]/g, "");

        let member = null;

        // ID検索
        if (/^\d{17,20}$/.test(userInput)) {
            member = await interaction.guild.members.fetch(userInput).catch(() => null);
        }

        // username / displayName検索
        if (!member) {
            const input = userInput.toLowerCase();

            member = interaction.guild.members.cache.find(m =>
                m.user.username?.toLowerCase() === input ||
                m.displayName?.toLowerCase() === input
            );
        }

        if (!member) {
            return interaction.editReply("❌ ユーザーが見つかりません");
        }

        // 削除
        for (const id of removeIds) {
            await member.roles.remove(id).catch(() => {});
        }

        // 追加
        for (const id of addIds) {
            await member.roles.add(id).catch(() => {});
        }

        return interaction.editReply(
            `✅ ${member.user.tag} のロール更新完了`
        );

    } catch (err) {
        console.error(err);

        return interaction.editReply("❌ エラー発生").catch(() => {});
    }
}