import {
    SlashCommandBuilder,
    PermissionFlagsBits
} from "discord.js";


export const data = new SlashCommandBuilder()

    .setName("invite")
    .setDescription("Botの招待リンクを表示します");



export async function execute(interaction) {


    const clientId =
        interaction.client.user.id;



    const inviteURL =
        `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;



    return interaction.reply({

        content:
`🤖 Bot招待リンク

${inviteURL}`,

        flags:64

    });

}