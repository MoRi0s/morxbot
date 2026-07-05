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
// スラッシュコマンド
// ======================
const command = new SlashCommandBuilder()
    .setName("changerole")
    .setDescription("複数ロール変更");

for (let i = 1; i <= 10; i++) {
    command.addRoleOption(opt =>
        opt
            .setName(`addrole${i}`)
            .setDescription(`付与ロール${i}`)
            .setRequired(i === 1)
    );
}

for (let i = 1; i <= 10; i++) {
    command.addRoleOption(opt =>
        opt
            .setName(`removerole${i}`)
            .setDescription(`削除ロール${i}`)
            .setRequired(false)
    );
}

export const data = command;

// ======================
// MAIN
// ======================
export async function execute(interaction, client) {

    console.log("changerole:", interaction.type, interaction.customId, interaction.commandName);

    // ======================
    // SLASH
    // ======================
    if (interaction.isChatInputCommand()) {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: "❌ 管理者のみ使用可能です",
                flags: 64
            });
        }

        const addRoles = [];
        const removeRoles = [];

        for (let i = 1; i <= 10; i++) {
            const addRole = interaction.options.getRole(`addrole${i}`);
            if (addRole) addRoles.push(addRole.id);

            const removeRole = interaction.options.getRole(`removerole${i}`);
            if (removeRole) removeRoles.push(removeRole.id);
        }

        const button = new ButtonBuilder()
            .setCustomId(`changeRole|${addRoles.join(",")}|${removeRoles.join(",")}`)
            .setLabel("ロール変更")
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        // ★全員に見えるように ephemeral削除
        return interaction.reply({
            content: "👇 ボタンを押してください",
            components: [row]
        });
    }

    // ======================
    // BUTTON → MODAL
    // ======================
    if (interaction.isButton() && interaction.customId.startsWith("changeRole|")) {

        const modal = new ModalBuilder()
            .setCustomId(interaction.customId)
            .setTitle("ロール変更");

        const input = new TextInputBuilder()
            .setCustomId("userInput")
            .setLabel("ユーザー名 / ID / @mention")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        return interaction.showModal(modal);
    }

    // ======================
    // MODAL SUBMIT
    // ======================
    if (interaction.isModalSubmit() && interaction.customId.startsWith("changeRole|")) {

        try {

            await interaction.deferReply({ flags: 64 });

            const parts = interaction.customId.split("|");

            const addIds = parts[1] ? parts[1].split(",").filter(Boolean) : [];
            const removeIds = parts[2] ? parts[2].split(",").filter(Boolean) : [];

            const userInput = interaction.fields
                .getTextInputValue("userInput")
                .trim()
                .replace(/[<@!>]/g, "");

            let member = null;

            // ①ID
            if (/^\d{17,20}$/.test(userInput)) {
                member = await interaction.guild.members.fetch(userInput).catch(() => null);
            }

            // ②軽量検索（全部fetchしない）
            if (!member) {
                const inputLower = userInput.toLowerCase();

                member = interaction.guild.members.cache.find(m =>
                    m.user.username?.toLowerCase() === inputLower ||
                    m.displayName?.toLowerCase() === inputLower
                );
            }

            if (!member) {
                return interaction.editReply({
                    content: "❌ ユーザーが見つかりません（ID / username / 表示名を確認）"
                });
            }

            // ======================
            // ロール削除
            // ======================
            for (const id of removeIds) {
                if (member.roles.cache.has(id)) {
                    await member.roles.remove(id).catch(() => { });
                }
            }

            // ======================
            // ロール追加
            // ======================
            for (const id of addIds) {
                if (!member.roles.cache.has(id)) {
                    await member.roles.add(id).catch(() => { });
                }
            }

            return interaction.editReply({
                content: `✅ ${member.user.tag} のロール更新完了`
            });

        } catch (err) {
            console.error(err);

            if (interaction.deferred || interaction.replied) {
                return interaction.editReply("❌ エラー発生");
            }

            return interaction.reply({
                content: "❌ エラー発生",
                flags: 64
            }).catch(() => { });
        }
    }
}