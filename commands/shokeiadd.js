import fs from "fs";
import path from "path";
import {
    SlashCommandBuilder,
    PermissionsBitField
} from "discord.js";


export const data = new SlashCommandBuilder()

    .setName("shokeiadd")
    .setDescription("処刑対象を登録します")

    .addUserOption(option =>
        option
            .setName("user")
            .setDescription("登録するメンバー")
            .setRequired(true)
    )

    .addStringOption(option =>
        option
            .setName("reason")
            .setDescription("理由")
            .setRequired(false)
    );



export async function execute(interaction, context) {


    // =====================
    // roleconfig取得
    // =====================

    const configFile =
        path.join(
            context.dataDir,
            "roleconfig.json"
        );


    if (!fs.existsSync(configFile)) {

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



    // =====================
    // 権限チェック
    // =====================

    const isAdmin =
        interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
        );


    const hasAdminRole =
        interaction.member.roles.cache.some(role =>
            config.adminRoles?.includes(role.id)
        );


    if (!isAdmin && !hasAdminRole) {

        return interaction.reply({
            content:
            "❌ 管理者または設定された管理ロールのみ使用可能です",
            flags:64
        });

    }



    // =====================
    // 対象取得
    // =====================

    const user =
        interaction.options.getUser("user");


    const reason =
        interaction.options.getString("reason")
        ||
        "理由なし";



    // =====================
    // shokeilist保存
    // =====================

    const file =
        path.join(
            context.dataDir,
            "shokeilist.json"
        );



    let data = {
        users:[]
    };



    if(fs.existsSync(file)){

        try {

            data =
            JSON.parse(
                fs.readFileSync(
                    file,
                    "utf8"
                )
            );

        } catch {

            data = {
                users:[]
            };

        }

    }



    // 重複チェック

    const exists =
        data.users.some(
            u => u.id === user.id
        );


    if(exists){

        return interaction.reply({
            content:
            "⚠️ このユーザーは既に登録されています",
            flags:64
        });

    }



    // 追加

    data.users.push({

        id:user.id,

        reason:reason,

        addedBy:
        interaction.user.id,

        date:
        new Date().toISOString()

    });



    fs.writeFileSync(

        file,

        JSON.stringify(
            data,
            null,
            2
        )

    );



    return interaction.reply({

        content:
`✅ 処刑対象に登録しました

対象:
${user}

理由:
${reason}`

    });

}