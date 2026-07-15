import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUESTION_FILE = path.join(__dirname, "..", "data", "questions.json");

// ユーザーごとの回答を一時保存
const quizCache = new Map();

export const data = new SlashCommandBuilder()
    .setName("randomquiz")
    .setDescription("ランダムクイズに回答します。");

export async function execute(interaction) {

    if (!fs.existsSync(QUESTION_FILE)) {
        return interaction.reply({
            content: "❌ 問題が登録されていません。",
            flags: 64
        });
    }

    const questions = JSON.parse(
        fs.readFileSync(QUESTION_FILE, "utf8")
    );

    // インデックスだけシャッフル
    const order = [...questions.keys()];

    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }

    const orderString = order.join(",");

    const row = new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId(`randomquiz_show:${orderString}`)
                .setLabel("👀 問題を見る")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`randomquiz_hide:${orderString}`)
                .setLabel("🙈 問題を見ない")
                .setStyle(ButtonStyle.Secondary)

        );

    await interaction.reply({
        content: "問題を表示しますか？",
        components: [row],
        flags: 64
    });

}


export async function handleButton(interaction) {

    if (!fs.existsSync(QUESTION_FILE)) {
        return interaction.reply({
            content: "❌ 問題が登録されていません。",
            flags: 64
        });
    }

    const questions = JSON.parse(
        fs.readFileSync(QUESTION_FILE, "utf8")
    );

    const [mode, orderString] = interaction.customId.split(":");

    const order = orderString
        .split(",")
        .map(Number);

    const showQuestions = mode === "randomquiz_show";

    // 一時保存
    quizCache.set(interaction.user.id, {
        order,
        showQuestions,
        answers: []
    });

    const modal = new ModalBuilder()
        .setCustomId("randomquiz_page1")
        .setTitle("ランダムクイズ (1/2)");

    for (let i = 0; i < Math.min(5, order.length); i++) {

        const label = showQuestions
            ? questions[order[i]]
            : `回答 ${i + 1}`;

        const input = new TextInputBuilder()
            .setCustomId(`answer${i}`)
            .setLabel(label.length > 45 ? label.substring(0, 45) : label)
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(input)
        );
    }

    await interaction.showModal(modal);

}

export async function handleModal(interaction) {

    // -----------------------
    // 1ページ目
    // -----------------------
    if (interaction.customId === "randomquiz_page1") {

        const cache = quizCache.get(interaction.user.id);

        if (!cache) {
            return interaction.reply({
                content: "❌ クイズ情報が見つかりません。",
                flags: 64
            });
        }

        for (let i = 0; i < Math.min(5, cache.order.length); i++) {

            cache.answers.push(
                interaction.fields.getTextInputValue(`answer${i}`) || ""
            );

        }

        quizCache.set(interaction.user.id, cache);

        const questions = JSON.parse(
            fs.readFileSync(QUESTION_FILE, "utf8")
        );

        const modal = new ModalBuilder()
            .setCustomId("randomquiz_page2")
            .setTitle("ランダムクイズ (2/2)");

        for (let i = 5; i < Math.min(10, cache.order.length); i++) {

            const label = cache.showQuestions
                ? questions[cache.order[i]]
                : `回答 ${i + 1}`;

            const input = new TextInputBuilder()
                .setCustomId(`answer${i}`)
                .setLabel(label.length > 45 ? label.substring(0, 45) : label)
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(input)
            );
        }

        return interaction.showModal(modal);

    }


    // -----------------------
    // 2ページ目
    // -----------------------
    if (interaction.customId === "randomquiz_page2") {

        const cache = quizCache.get(interaction.user.id);

        if (!cache) {
            return interaction.reply({
                content: "❌ クイズ情報が見つかりません。",
                flags: 64
            });
        }

        for (let i = 5; i < Math.min(10, cache.order.length); i++) {

            cache.answers.push(
                interaction.fields.getTextInputValue(`answer${i}`) || ""
            );

        }

        const questions = JSON.parse(
            fs.readFileSync(QUESTION_FILE, "utf8")
        );

        let description = "";

        for (let i = 0; i < cache.order.length; i++) {

            description += `**${i + 1}. ${questions[cache.order[i]]}**\n`;
            description += `${cache.answers[i] || "（未入力）"}\n\n`;

        }

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("🎲 ランダムクイズ")
            .setDescription(description)
            .setTimestamp();

        quizCache.delete(interaction.user.id);

        return interaction.reply({
            embeds: [embed]
        });

    }

}