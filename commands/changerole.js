import {
    SlashCommandBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionsBitField
} from "discord.js";

export const data = new SlashCommandBuilder()
.setName("changerole")
.setDescription("複数ロール変更");

// ===== 付与ロール 最大10 =====
for(let i=1;i<=10;i++){

    data.addRoleOption(opt =>
        opt
        .setName(`addrole${i}`)
        .setDescription(`付与ロール${i}`)
        .setRequired(i===1)
    );

}

// ===== 削除ロール 最大10 =====
for(let i=1;i<=10;i++){

    data.addRoleOption(opt =>
        opt
        .setName(`removerole${i}`)
        .setDescription(`削除ロール${i}`)
        .setRequired(false)
    );

}


export async function execute(interaction){

try{

// ======================
// スラッシュコマンド
// ======================

if(
interaction.isChatInputCommand() &&
interaction.commandName==="changerole"
){

// 管理者限定
if(
!interaction.member.permissions.has(
PermissionsBitField.Flags.Administrator
)
){

return interaction.reply({

content:"❌ 管理者のみ使用可能です",
ephemeral:true

});

}

const addRoles=[];
const removeRoles=[];

for(let i=1;i<=10;i++){

const addRole=
interaction.options.getRole(
`addrole${i}`
);

if(addRole){

addRoles.push(
addRole.id
);

}

const removeRole=
interaction.options.getRole(
`removerole${i}`
);

if(removeRole){

removeRoles.push(
removeRole.id
);

}

}

const button=
new ButtonBuilder()
.setCustomId(
`changeRole|${addRoles.join(",")}|${removeRoles.join(",")}`
)
.setLabel(
"ロール変更"
)
.setStyle(
ButtonStyle.Primary
);

const row=
new ActionRowBuilder()
.addComponents(
button
);

return interaction.reply({

content:
"👇 ボタンを押してください",

components:[
row
]

});

}



// ======================
// ボタン押下
// ======================

if(
interaction.isButton() &&
interaction.customId.startsWith(
"changeRole|"
)
){

const modal=
new ModalBuilder()
.setCustomId(
interaction.customId
)
.setTitle(
"ロール変更"
);

const input=
new TextInputBuilder()
.setCustomId(
"username"
)
.setLabel(
"ユーザー名"
)
.setPlaceholder(
"username(@省略)"
)
.setStyle(
TextInputStyle.Short
)
.setRequired(true);

const row=
new ActionRowBuilder()
.addComponents(
input
);

modal.addComponents(
row
);

return interaction.showModal(
modal
);

}



// ======================
// モーダル送信
// ======================

if(
interaction.isModalSubmit() &&
interaction.customId.startsWith(
"changeRole|"
)
){

await interaction.deferReply({
ephemeral:true
});

const parts=
interaction.customId.split("|");

const addIds=
parts[1]
? parts[1].split(",").filter(Boolean)
:[];

const removeIds=
parts[2]
? parts[2].split(",").filter(Boolean)
:[];

const username=
interaction.fields.getTextInputValue(
"username"
);

const member=
interaction.guild.members.cache.find(
m =>
m.user.username===username ||
m.user.tag===username
);

if(!member){

return interaction.editReply({

content:
"❌ ユーザーが見つかりません"

});

}

for(const id of removeIds){

if(
member.roles.cache.has(id)
){

await member.roles.remove(
id
);

}

}

for(const id of addIds){

if(
!member.roles.cache.has(id)
){

await member.roles.add(
id
);

}

}

return interaction.editReply({

content:
`✅ ${member.user.tag} のロール更新完了`

});

}

}catch(err){

console.error(err);

if(!interaction.replied){

return interaction.reply({

content:
"❌ エラー発生",

ephemeral:true

});

}

}

}