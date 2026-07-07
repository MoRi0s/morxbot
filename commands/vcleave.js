// commands/vcleave.js
import { SlashCommandBuilder } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";

export const category = "Music";
export const permissionLevel = 1;

export const data = new SlashCommandBuilder()
    .setName("vcleave")
    .setDescription("Bot をVCから退出させる");

export async function execute(interaction) {
    const conn = getVoiceConnection(interaction.guild.id);

    if (!conn) {
        return interaction.reply("Bot は VC にいません！");
    }

    conn.destroy();

    return interaction.reply("👋 VC から退室しました！");
}
