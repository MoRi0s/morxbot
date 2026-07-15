import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder
} from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUESTION_FILE = path.join(__dirname, "..", "data", "questions.json");

export const data = new SlashCommandBuilder()
    .setName("randomquiz")
    .setDescription("ランダムクイズを作成します");

export async function execute(interaction) {

    if (!fs.existsSync(QUESTION_FILE)) {
        return interaction.reply({
            content: "❌ 問題が登録されていません。",
            ephemeral: true
        });
    }

    const questions = JSON.parse(fs.readFileSync(QUESTION_FILE, "utf8"));

    const modal = new ModalBuilder()
        .setCustomId("randomquiz")
        .setTitle("回答入力");

    const input = new TextInputBuilder()
        .setCustomId("answers")
        .setLabel(`回答を1行ずつ入力（${questions.length}個）`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(
`回答1
回答2
回答3`
        )
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(input)
    );

    await interaction.showModal(modal);
}

export async function handleModal(interaction) {

    if (!fs.existsSync(QUESTION_FILE)) {
        return interaction.reply({
            content: "❌ 問題がありません。",
            ephemeral: true
        });
    }

    const questions = JSON.parse(fs.readFileSync(QUESTION_FILE, "utf8"));

    const answers = interaction.fields
        .getTextInputValue("answers")
        .split("\n")
        .map(v => v.trim());

    // 問題だけシャッフル
    const shuffled = [...questions];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let description = "";

    for (let i = 0; i < shuffled.length; i++) {
        description += `**${shuffled[i]}**\n`;
        description += `${answers[i] ?? "（未入力）"}\n\n`;
    }

    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("🎲 ランダムクイズ")
        .setDescription(description);

    await interaction.reply({
        embeds: [embed]
    });
}