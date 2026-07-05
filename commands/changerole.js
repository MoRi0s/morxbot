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
// Slash
// ======================
export const data = new SlashCommandBuilder()
    .setName("changerole")
    .setDescription("複数ロール変更")
    .addRoleOption(opt =>
        opt.setName("addrole1")
            .setDescription("付与ロール")
            .setRequired(true)
    )
    .addRoleOption(opt =>
        opt.setName("removerole1")
            .setDescription("削除ロール")
            .setRequired(false)
    );

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

    const add = interaction.options.getRole("addrole1");
    const remove = interaction.options.getRole("removerole1");

    const button = new ButtonBuilder()
        .setCustomId(`changeRole|${add?.id || ""}|${remove?.id || ""}`)
        .setLabel("ロール変更")
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    return interaction.reply({
        content: "👇 ボタンを押してください",
        components: [row]
    });
}

// ======================
// BUTTON ONLY
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
// MODAL ONLY
// ======================
export async function handleModal(interaction) {

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

        // ID
        if (/^\d{17,20}$/.test(userInput)) {
            member = await interaction.guild.members.fetch(userInput).catch(() => null);
        }

        // username / displayName
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

        for (const id of removeIds) {
            await member.roles.remove(id).catch(() => {});
        }

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