import fs from "fs";
import path from "path";
import {
    SlashCommandBuilder,
    PermissionsBitField
} from "discord.js";

export const category = "Moderation";
export const permissionLevel = 3;


export const data = new SlashCommandBuilder()

    .setName("roleconfig")
    .setDescription("サーバーごとのロール設定")

    .addRoleOption(option =>
        option
            .setName("memberrole")
            .setDescription("通常メンバーロール")
            .setRequired(true)
    )

    .addRoleOption(option =>
        option
            .setName("punishrole")
            .setDescription("処罰ロール")
            .setRequired(true)
    )

    .addRoleOption(option =>
        option
            .setName("adminrole1")
            .setDescription("管理者ロール1")
            .setRequired(false)
    )

    .addRoleOption(option =>
        option
            .setName("adminrole2")
            .setDescription("管理者ロール2")
            .setRequired(false)
    )

    .addRoleOption(option =>
        option
            .setName("adminrole3")
            .setDescription("管理者ロール3")
            .setRequired(false)
    )

    .addRoleOption(option =>
        option
            .setName("adminrole4")
            .setDescription("管理者ロール4")
            .setRequired(false)
    )

    .addRoleOption(option =>
        option
            .setName("adminrole5")
            .setDescription("管理者ロール5")
            .setRequired(false)
    );


export async function execute(interaction, context) {


    // roleconfig変更はDiscord管理者のみ

    if(
        !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
        )
    ){

        return interaction.reply({
            content:"❌ roleconfigは管理者のみ使用できます",
            flags:64
        });

    }



    const memberRole =
        interaction.options.getRole("memberrole");


    const punishRole =
        interaction.options.getRole("punishrole");



    const adminRoles = [];


    for(let i = 1; i <= 5; i++){

        const role =
            interaction.options.getRole(
                `adminrole${i}`
            );


        if(role){
            adminRoles.push(role.id);
        }

    }




    const file =
        path.join(
            context.dataDir,
            "roleconfig.json"
        );



    let roleConfigs = {};



    if(fs.existsSync(file)){

        roleConfigs =
            JSON.parse(
                fs.readFileSync(
                    file,
                    "utf8"
                )
            );

    }



    roleConfigs[interaction.guild.id] = {

        memberRole:
            memberRole.id,

        punishRole:
            punishRole.id,

        adminRoles

    };



    fs.writeFileSync(
        file,
        JSON.stringify(
            roleConfigs,
            null,
            2
        )
    );



    return interaction.reply({

        content:
`✅ ${interaction.guild.name} の設定を保存しました

👤 メンバーロール:
<@&${memberRole.id}>

⚔️ 処罰ロール:
<@&${punishRole.id}>

🛡 管理ロール:
${
    adminRoles.length
    ? adminRoles.map(id=>`<@&${id}>`).join(", ")
    : "なし"
}`,

        flags:64

    });

}