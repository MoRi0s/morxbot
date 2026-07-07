import {
    SlashCommandBuilder,
    PermissionsBitField
} from "discord.js";

import fs from "fs";
import path from "path";


export const data = new SlashCommandBuilder()

    .setName("shokeiremove")
    .setDescription("処刑対象から削除します")

    .addUserOption(option =>
        option
            .setName("user")
            .setDescription("削除するユーザー")
            .setRequired(true)
    );



export async function execute(interaction, context) {


    // =====================
    // 権限確認
    // =====================

    const configFile =
        path.join(
            context.dataDir,
            "roleconfig.json"
        );


    if(!fs.existsSync(configFile)){

        return interaction.reply({
            content:"❌ roleconfig.json がありません",
            flags:64
        });

    }


    const configs =
        JSON.parse(
            fs.readFileSync(
                configFile,
                "utf8"
            )
        );


    const config =
        configs[interaction.guild.id] ?? {
            adminRoles:[]
        };


    const isAdmin =
        interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
        );


    const hasAdminRole =
        interaction.member.roles.cache.some(role =>
            config.adminRoles?.includes(role.id)
        );



    if(!isAdmin && !hasAdminRole){

        return interaction.reply({
            content:
            "❌ 管理者または設定された管理ロールのみ使用可能です",
            flags:64
        });

    }



    // =====================
    // JSON読み込み
    // =====================

    const file =
        path.join(
            context.dataDir,
            "shokeilist.json"
        );


    if(!fs.existsSync(file)){

        return interaction.reply({
            content:
            "❌ 処刑リストがありません",
            flags:64
        });

    }



    let list;


    try{

        list =
        JSON.parse(
            fs.readFileSync(
                file,
                "utf8"
            )
        );

    }catch{

        return interaction.reply({
            content:
            "❌ shokeilist.json が壊れています",
            flags:64
        });

    }



    const user =
        interaction.options.getUser("user");



    const before =
        list.users.length;



    list.users =
        list.users.filter(
            u => u.id !== user.id
        );



    if(before === list.users.length){

        return interaction.reply({
            content:
            "❌ このユーザーは登録されていません",
            flags:64
        });

    }



    // =====================
    // 保存
    // =====================

    fs.writeFileSync(
        file,
        JSON.stringify(
            list,
            null,
            2
        )
    );



    return interaction.reply({

        content:
`✅ 処刑対象から削除しました

対象:
${user}`

    });

}