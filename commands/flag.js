import {
    SlashCommandBuilder
} from "discord.js";

import fs from "fs";
import path from "path";


export const data = new SlashCommandBuilder()

    .setName("flag")
    .setDescription("Bot設定フラグ変更")

    .addBooleanOption(option =>
        option
            .setName("global")
            .setDescription("全体公開コマンドを有効化")
            .setRequired(true)
    );



export async function execute(interaction, context) {


    const file =
        path.join(
            context.dataDir,
            "flag.json"
        );


    if(!fs.existsSync(file)){

        return interaction.reply({
            content:
            "❌ flag.json がありません",
            flags:64
        });

    }



    let config;


    try {

        config =
        JSON.parse(
            fs.readFileSync(
                file,
                "utf8"
            )
        );

    } catch(err){

        console.error(err);

        return interaction.reply({
            content:
            "❌ flag.json が壊れています",
            flags:64
        });

    }



    // ==========================
    // 権限チェック
    // ==========================


    // 設定されたサーバーか確認

    if(
        !config.allowGuilds?.includes(
            interaction.guild.id
        )
    ){

        return interaction.reply({
            content:
            "❌ このサーバーでは使用できません",
            flags:64
        });

    }



    // 設定されたロール確認

    const hasRole =
        interaction.member.roles.cache.some(role =>
            config.adminRoles?.includes(role.id)
        );



    if(!hasRole){

        return interaction.reply({
            content:
            "❌ 設定された管理ロールのみ使用できます",
            flags:64
        });

    }



    // ==========================
    // 設定変更
    // ==========================


    const value =
        interaction.options.getBoolean("global");



    config.globalCommand =
        value;



    fs.writeFileSync(

        file,

        JSON.stringify(
            config,
            null,
            2
        )

    );



    return interaction.reply({

        content:
`✅ 設定変更しました

Global Command:
${value ? "ON 🌐" : "OFF 🔒"}

※反映にはBot再起動が必要です`,

        flags:64

    });


}