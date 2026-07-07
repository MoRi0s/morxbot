import fs from "fs";
import path from "path";
import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";

export const category = "Game";
export const permissionLevel = 1;

export const data = new SlashCommandBuilder()
    .setName("iphoneaki")
    .setDescription("iPhoneアキネーター");

export async function execute(interaction, context) {

    try {

        const akiFile = path.join(
            context.dataDir,
            "iphoneAkiFlow.json"
        );

        if (!fs.existsSync(akiFile)) {

            if (!interaction.replied && !interaction.deferred) {
                return interaction.reply({
                    content:"❌ iphoneAkiFlow.json が見つかりません",
                    flags:64
                });
            }

            return interaction.editReply({
                content:"❌ iphoneAkiFlow.json が見つかりません"
            });
        }

        const aki = JSON.parse(
            fs.readFileSync(akiFile,"utf8")
        );

        const startState=aki.states[aki.start];

        const embed=new EmbedBuilder()
            .setTitle("📱 iPhoneアキネーター")
            .setDescription(startState.question)
            .setColor(0x0099ff);

        const row=new ActionRowBuilder();

        const ownerId=interaction.user.id;

        for(const label of Object.keys(startState.options)){

            row.addComponents(
                new ButtonBuilder()
                    .setLabel(label)
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(
                        `iphoneaki:${aki.start}:${label}:${ownerId}`
                    )
            );

        }

        const payload={
            embeds:[embed],
            components:[row]
        };

        // 既に応答済みか自動判定
        if(interaction.deferred||interaction.replied){
            return interaction.editReply(payload);
        }

        return interaction.reply(payload);

    }
    catch(err){

        console.error("iphoneaki:",err);

        if(interaction.deferred||interaction.replied){
            return interaction.editReply({
                content:"❌ エラー発生"
            }).catch(()=>{});
        }

        return interaction.reply({
            content:"❌ エラー発生",
            flags:64
        }).catch(()=>{});
    }

}