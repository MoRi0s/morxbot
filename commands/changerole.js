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
        opt.setName(`addrole${i}`)
            .setDescription(`付与ロール${i}`)
            .setRequired(i === 1)
    );
}

for (let i = 1; i <= 10; i++) {
    command.addRoleOption(opt =>
        opt.setName(`removerole${i}`)
            .setDescription(`削除ロール${i}`)
            .setRequired(false)
    );
}

export const data = command;

// ======================
// MAIN
// ======================
export async function execute(interaction, client) {

    console.log("changerole:", interaction.type, interaction.customId);

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
            .setCustomId(`changeRole`)
            .setLabel("ロール変更")
            .setStyle(ButtonStyle.Primary);

        client.changeRoleData ??= new Map();
        client.changeRoleData.set(interaction.user.id, {
            addRoles,
            removeRoles
        });

        const row = new ActionRowBuilder().addComponents(button);

        return interaction.reply({
            content: "👇 ボタンを押してください",
            components: [row]
        });
    }

    // ======================
    // BUTTON → MODAL
    // ======================
    if (interaction.isButton() && interaction.customId === "changeRole") {

        const modal = new ModalBuilder()
            .setCustomId("changeRoleModal")
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
    if (interaction.isModalSubmit() && interaction.customId === "changeRoleModal") {

        try {

            await interaction.deferReply({ flags: 64 });

            const data = client.changeRoleData?.get(interaction.user.id);

            if (!data) {
                return interaction.editReply("❌ データが失われました。もう一度実行してください");
            }

            const userInput = interaction.fields
                .getTextInputValue("userInput")
                .trim()
                .replace(/[<@!>]/g, "");

            let member = null;

            // ======================
            // ID
            // ======================
            if (/^\d{17,20}$/.test(userInput)) {
                member = await interaction.guild.members.fetch(userInput).catch(() => null);
            }

            // ======================
            // cache + fallback fetch
            // ======================
            if (!member) {
                const inputLower = userInput.toLowerCase();

                member =
                    interaction.guild.members.cache.find(m =>
                        m.user.username?.toLowerCase() === inputLower ||
                        m.displayName?.toLowerCase() === inputLower
                    ) ||
                    await interaction.guild.members.fetch()
                        .then(members =>
                            members.find(m =>
                                m.user.username?.toLowerCase() === inputLower ||
                                m.displayName?.toLowerCase() === inputLower
                            )
                        )
                        .catch(() => null);
            }

            if (!member) {
                return interaction.editReply("❌ ユーザーが見つかりません");
            }

            // ======================
            // REMOVE
            // ======================
            for (const id of data.removeRoles) {
                await member.roles.remove(id).catch(() => {});
            }

            // ======================
            // ADD
            // ======================
            for (const id of data.addRoles) {
                await member.roles.add(id).catch(() => {});
            }

            return interaction.editReply(`✅ ${member.user.tag} のロール更新完了`);

        } catch (err) {
            console.error(err);
            return interaction.editReply("❌ エラー発生");
        }
    }
}