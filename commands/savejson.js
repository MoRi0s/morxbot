// commands/savejson.js
import { SlashCommandBuilder } from "discord.js";
import { jsonDB } from "../utils/jsonStore.js";

export const category = "Music";
export const permissionLevel = 1;

export const data = new SlashCommandBuilder()
    .setName("savejson")
    .setDescription("JSONデータを保存");

export async function execute(interaction) {
    jsonDB.save();
    return interaction.reply("💾 JSONデータを保存しました！");
}
