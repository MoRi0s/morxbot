// commands/soundlist.js
import { SlashCommandBuilder } from "discord.js";
import { jsonDB } from "../utils/jsonStore.js";

export const category = "Music";
export const permissionLevel = 1;


export const data = new SlashCommandBuilder()
    .setName("soundlist")
    .setDescription("最近再生したサウンドリスト（最大100件）");

export async function execute(interaction) {
    const list = jsonDB.getSoundHistory(interaction.guild.id);

    if (!list.length) {
        return interaction.reply("履歴がありません！");
    }

    const text = list
        .slice(-100)
        .reverse()
        .map((s, i) => `${i + 1}. ${s.url}`)
        .join("\n");

    return interaction.reply(`🎧 **サウンド履歴（最大100件）**\n${text}`);
}
