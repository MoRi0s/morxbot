import fs from "fs";
import path from "path";

import {
    SlashCommandBuilder,
    PermissionsBitField
} from "discord.js";

export const category = "Moderation";
export const permissionLevel = 2;

export const data = new SlashCommandBuilder()

.setName("shokei")
.setDescription("処罰コマンド")

.addUserOption(option =>
    option
    .setName("user")
    .setDescription("対象ユーザー")
    .setRequired(true)
)

.addStringOption(option =>
    option
    .setName("type")
    .setDescription("処罰種類")
    .setRequired(true)
    .addChoices(
        {
            name:"タイムアウト",
            value:"timeout"
        },
        {
            name:"キック",
            value:"kick"
        },
        {
            name:"BAN",
            value:"ban"
        },
        {
            name:"ロール処刑",
            value:"role"
        }
    )
)

.addStringOption(option =>
    option
    .setName("time")
    .setDescription("タイムアウト時間 (例: 10m / 2h / 1d / 1mo)")
    .setRequired(false)
)

.addStringOption(option =>
    option
    .setName("reason")
    .setDescription("理由")
    .setRequired(false)
);



export async function execute(interaction, context){


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



const roleConfigs =
JSON.parse(
    fs.readFileSync(
        configFile,
        "utf8"
    )
);



const config =
roleConfigs[interaction.guild.id];



if(!config){

    return interaction.reply({
        content:"❌ このサーバーの設定がありません",
        flags:64
    });

}



// =================
// 権限
// =================

const isAdmin =
interaction.member.permissions.has(
    PermissionsBitField.Flags.Administrator
);


const hasRole =
interaction.member.roles.cache.some(role =>
    config.adminRoles?.includes(role.id)
);



if(!isAdmin && !hasRole){

    return interaction.reply({
        content:
        "❌ 管理者または設定された管理ロールのみ使用可能です",
        flags:64
    });

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
        content:"❌ 処刑リストがありません",
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
        content:"❌ 処刑リストが壊れています",
        flags:64
    });

}



const user =
    interaction.options.getUser("user");


// JSON登録確認
const punishTarget =
    list.users.find(
        u => u.id === user.id
    );


// 登録されていない場合拒否
if(!punishTarget){

    return interaction.reply({
        content:
        "❌ このユーザーはshokeiaddで登録されていません",
        flags:64
    });

}


// Discord Member取得
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



// =================
// 安全確認
// =================


// 自分自身禁止
if(member.id === interaction.user.id){

    return interaction.reply({
        content:
        "❌ 自分自身には使用できません",
        flags:64
    });

}


// BOT禁止
if(member.user.bot){

    return interaction.reply({
        content:
        "❌ BOTには使用できません",
        flags:64
    });

}


// 自分より上位ロール禁止
if(
    member.roles.highest.position >=
    interaction.member.roles.highest.position
    &&
    !isAdmin
){

    return interaction.reply({
        content:
        "❌ 自分以上のロールを持つユーザーには使用できません",
        flags:64
    });

}




const type =
interaction.options.getString("type");


const reason =
interaction.options.getString("reason")
||
"理由なし";




try{


// =================
// Timeout
// =================

if(type==="timeout"){


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



if(time < 1)
time = 1;



await target.timeout(
    time * 60 * 1000,
    reason
);

const displayTime = (() => {

    let minutes = time;
    let result = "";


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

return interaction.reply({

content:
`⏳ タイムアウトしました

対象:
${target}

時間:
${displayTime}

理由:
${reason}`

});

}




// =================
// Kick
// =================

if(type==="kick"){


await target.kick(reason);


return interaction.reply({

content:
`👢 キックしました

対象:
${target.user.tag}

理由:
${reason}`

});


}





// =================
// BAN
// =================

if(type==="ban"){


await target.ban({
    reason
});


return interaction.reply({

content:
`🔨 BANしました

対象:
${target.user.tag}

期間:
永久

理由:
${reason}`

});


}





// =================
// ロール処刑
// =================

if(type==="role"){



if(!config.punishRole){

return interaction.reply({
content:
"❌ 処罰ロール未設定",
flags:64
});

}



if(config.memberRole){

await target.roles
.remove(
    config.memberRole
)
.catch(()=>{});

}



await target.roles.add(
    config.punishRole
);



return interaction.reply({

content:
`⚔️ 処刑しました

対象:
${target}

付与:
<@&${config.punishRole}>

理由:
${reason}`

});


}



}catch(err){

console.error(
"shokei error:",
err
);


return interaction.reply({

content:
"❌ 処罰失敗\nBOTのロール位置を確認してください",

flags:64

});

}

}