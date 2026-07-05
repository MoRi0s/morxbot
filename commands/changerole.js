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

// ======================
// Slash Command（5個ずつ）
// ======================
export const data = new SlashCommandBuilder()
    .setName("changerole")
    .setDescription("複数ロール変更");

// 付与ロール（5個）
for (let i = 1; i <= 5; i++) {
    data.addRoleOption(opt =>
        opt.setName(`addrole${i}`)
            .setDescription(`付与ロール${i}`)
            .setRequired(i === 1)
    );
}

// 削除ロール（5個）
for (let i = 1; i <= 5; i++) {
    data.addRoleOption(opt =>
        opt.setName(`removerole${i}`)
            .setDescription(`削除ロール${i}`)
            .setRequired(false)
    );
}

// ======================
// SLASH ONLY
// ======================
export async function execute(interaction) {

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
            content: "❌ 管理者のみ",
            flags: 64
        });
    }

    const addIds = [];
    const removeIds = [];

    // 付与ロールまとめ
    for (let i = 1; i <= 5; i++) {
        const role = interaction.options.getRole(`addrole${i}`);
        if (role) addIds.push(role.id);
    }

    // 削除ロールまとめ
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
        components: [new ActionRowBuilder().addComponents(button)]
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

    return interaction.showModal(
        new ActionRowBuilder().addComponents(
            input
        )
    ).catch(() => {});
}

// ======================
// MODAL
// ======================
export async function handleModal(interaction) {

    try {

        await interaction.deferReply({ flags: 64 });

        const parts = interaction.customId.split("|");

        const addIds = parts[1] ? parts[1].split(",").filter(Boolean) : [];
        const removeIds = parts[2] ? parts[2].split(",").filter(Boolean) : [];

        const raw = interaction.fields.getTextInputValue("userInput");
        const userInput = raw.trim().replace(/[<@!>]/g, "");

        let member = null;

        // ID検索
        if (/^\d{17,20}$/.test(userInput)) {
            member = await interaction.guild.members.fetch(userInput).catch(() => null);
        }

        // 名前検索（軽量）
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

        // ロール削除
        for (const id of removeIds) {
            await member.roles.remove(id).catch(() => {});
        }

        // ロール追加
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