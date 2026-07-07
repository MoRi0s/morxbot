import {
    SlashCommandBuilder,
    PermissionsBitField
} from "discord.js";

import fs from "fs";
import path from "path";


export const data = new SlashCommandBuilder()

    .setName("chaos")
    .setDescription("ほんとうに危険なコマンド")

    .addBooleanOption(option =>
        option
            .setName("enable")
            .setDescription("TrueかFalseか")
            .setRequired(true)
    );



export async function execute(interaction, context) {


    // 管理者のみ変更可能

    if(
        !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
        )
    ){

        return interaction.reply({
            content:"❌ 管理者のみ使用できます",
            flags:64
        });

    }



    const file =
        path.join(
            context.dataDir,
            "chaos.json"
        );



    let data = {};



    if(fs.existsSync(file)){

        data =
        JSON.parse(
            fs.readFileSync(
                file,
                "utf8"
            )
        );

    }



    const enable =
        interaction.options.getBoolean("enable");



    data[interaction.guild.id] = {

        enabled: enable

    };



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
`⚔️ TO権限設定を変更しました

管理者制限スキップ:
${enable ? "有効 ✅" : "無効 ❌"}`,

        flags:64

    });

}