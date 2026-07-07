// commands/soundfavorite.js
import { SlashCommandBuilder } from "discord.js";
import { jsonDB } from "../utils/jsonStore.js";

export const category = "Music";
export const permissionLevel = 1;

export const data = new SlashCommandBuilder()
    .setName("soundfavorite")
    .setDescription("サウンドURLをお気に入りに追加")
    .addStringOption(opt =>
        opt.setName("url")
            .setDescription("登録したいURL")
            .setRequired(true)
    );

export async function execute(interaction) {
    const url = interaction.options.getString("url");
    const guildId = interaction.guild.id;

    jsonDB.addFavorite(guildId, url);

    return interaction.reply(`💛 お気に入りに追加しました！\n${url}`);
}
