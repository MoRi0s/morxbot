import {
    SlashCommandBuilder,
    PermissionsBitField
} from "discord.js";

import fs from "fs";
import path from "path";

export const category = "Moderation";
export const permissionLevel = 2;


export const data = new SlashCommandBuilder()

    .setName("to")
    .setDescription("登録された処刑対象をタイムアウトします")

    .addUserOption(option =>
        option
            .setName("user")
            .setDescription("対象ユーザー")
            .setRequired(true)
    )

    .addStringOption(option =>
        option
            .setName("time")
            .setDescription("時間 (例: 10m / 2h / 1d / 1mo)")
            .setRequired(true)
    )

    .addStringOption(option =>
        option
            .setName("reason")
            .setDescription("理由")
            .setRequired(false)
    );



export async function execute(interaction, context) {


    // ==========================
    // 管理者不要サーバー
    // ==========================

const chaosFile =
    path.join(
        context.dataDir,
        "chaos.json"
    );


let chaos = {};


if(fs.existsSync(chaosFile)){

    chaos =
    JSON.parse(
        fs.readFileSync(
            chaosFile,
            "utf8"
        )
    );

}


const noAdmin =
    chaos[interaction.guild.id]?.enabled === true;



    // ==========================
    // 権限チェック
    // ==========================

    if(!noAdmin){


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

    }



    // ==========================
    // shokeilist確認
    // ==========================

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


    try {

        list =
        JSON.parse(
            fs.readFileSync(
                file,
                "utf8"
            )
        );

    } catch {

        return interaction.reply({
            content:
            "❌ 処刑リストが壊れています",
            flags:64
        });

    }



    const user =
        interaction.options.getUser("user");



    const target =
        list.users.find(
            u => u.id === user.id
        );



    if(!target){

        return interaction.reply({
            content:
            "❌ このユーザーはshokeiaddで登録されていません",
            flags:64
        });

    }



    const member =
        await interaction.guild.members
        .fetch(user.id)
        .catch(()=>null);



    if(!member){

        return interaction.reply({
            content:
            "❌ サーバーメンバーではありません",
            flags:64
        });

    }



let timeInput =
    interaction.options.getString("time");


let time = 0;


const match =
    timeInput.match(/^(\d+)(mo|m|h|d)$/i);


if(!match){

    return interaction.reply({
        content:
        "❌ 時間形式が違います\n例: 10m / 2h / 1d / 1mo",
        flags:64
    });

}



const value =
    Number(match[1]);


const unit =
    match[2].toLowerCase();



switch(unit){

    case "m":
        // 分
        time = value;
        break;


    case "h":
        // 時間
        time = value * 60;
        break;


    case "d":
        // 日
        time = value * 1440;
        break;


    case "mo":
        // 1ヶ月 = 28日
        time = value * 40320;
        break;

}



// Discord最大28日

if(time > 40320){

    time = 40320;

}



    if(time < 1){
        time = 1;
    }





    const reason =
        interaction.options.getString("reason")
        ||
        target.reason
        ||
        "処刑対象";

const displayTime = (() => {

    let result = "";

    let minutes = time;


    const months = Math.floor(minutes / 40320);
    minutes %= 40320;


    const days = Math.floor(minutes / 1440);
    minutes %= 1440;


    const hours = Math.floor(minutes / 60);
    minutes %= 60;


    if(months > 0){
        result += `${months}か月 `;
    }

    if(days > 0){
        result += `${days}日 `;
    }

    if(hours > 0){
        result += `${hours}時間 `;
    }

    if(minutes > 0){
        result += `${minutes}分`;
    }


    return result.trim();

})();

    try{


        await member.timeout(
            time * 60 * 1000,
            reason
        );



        return interaction.reply({

            

            content:
`⏳ タイムアウトしました

対象:
${user}

時間:

${displayTime}

理由:
${reason}`

        });
        



    }catch(err){

        console.error(
            "to error:",
            err
        );


        return interaction.reply({

            content:
            "❌ タイムアウト失敗\nBOTのロール位置または権限を確認してください",

            flags:64

        })
    }

}