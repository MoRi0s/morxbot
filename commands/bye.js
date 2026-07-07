import {
    SlashCommandBuilder,
    PermissionsBitField
} from "discord.js";

import fs from "fs";
import path from "path";

export const category = "Moderation";
export const permissionLevel = 3;

export const data = new SlashCommandBuilder()

    .setName("bye")
    .setDescription("Botをこのサーバーから退出させます");



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
            content:
            "❌ roleconfig.json がありません",
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






    if(!isAdmin ){

        return interaction.reply({
            content:
            "❌ 管理者のみ使用可能です",
            flags:64
        });

    }



    // =====================
    // 退出
    // =====================

    await interaction.reply({

        content:
`👋 Botが退出します

サーバー:
${interaction.guild.name}`

    });



    setTimeout(async()=>{

        try{

            await interaction.guild.leave();

        }catch(err){

            console.error(
                "bye error:",
                err
            );

        }

    },1500);


}