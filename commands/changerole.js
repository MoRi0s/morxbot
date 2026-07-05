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

    return interaction.reply({
        content: "👇 ボタンを押してください",
        components: [row],
        flags: 64
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
        .setLabel("ユーザー名 または ID")
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

        const parts = interaction.customId.split("|");

        const addIds = parts[1] ? parts[1].split(",").filter(Boolean) : [];
        const removeIds = parts[2] ? parts[2].split(",").filter(Boolean) : [];

const userInput = interaction.fields
  .getTextInputValue("userInput")
  .trim()
  .replace(/[<@!>]/g, "");

let member = null;

// ID優先
if (/^\d{17,20}$/.test(userInput)) {
    member = await interaction.guild.members.fetch(userInput).catch(() => null);
}

// username検索
if (!member) {
    const members = await interaction.guild.members.fetch();

    member = members.find(m =>
        m.user.username.toLowerCase() === userInput.toLowerCase()
    );
}

if (!member) {
    return interaction.reply({
        content: "❌ ユーザーが見つかりません（IDかusernameを確認してください）",
        flags: 64
    });
}

        // 削除
        for (const id of removeIds) {
            if (member.roles.cache.has(id)) {
                await member.roles.remove(id);
            }
        }

        // 追加
        for (const id of addIds) {
            if (!member.roles.cache.has(id)) {
                await member.roles.add(id);
            }
        }

        return interaction.reply({
            content: `✅ ${member.user.tag} のロール更新完了`,
            flags: 64
        });

    } catch (err) {
        console.error(err);

        return interaction.reply({
            content: "❌ エラー発生",
            flags: 64
        }).catch(() => {});
    }
}

}