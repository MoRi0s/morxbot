import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "..", "data");
const QUESTION_FILE = path.join(DATA_DIR, "questions.json");

export const data = new SlashCommandBuilder()
    .setName("questioncreate")
    .setDescription("ランダムクイズ用の問題を登録します");

export async function execute(interaction) {

    const modal = new ModalBuilder()
        .setCustomId("questioncreate")
        .setTitle("問題登録");

    const input = new TextInputBuilder()
        .setCustomId("questions")
        .setLabel("問題を1行ずつ入力（最大10問）")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(
`日本の首都は？
Discordを開発した会社は？
1+1は？
...
`
        )
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(input)
    );

    await interaction.showModal(modal);
}

export async function handleModal(interaction) {

    const text = interaction.fields.getTextInputValue("questions");

    const questions = text
        .split("\n")
        .map(q => q.trim())
        .filter(q => q.length > 0)
        .slice(0, 10);

    if (questions.length === 0) {
        return interaction.reply({
            content: "❌ 問題を入力してください。",
            ephemeral: true
        });
    }

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(
        QUESTION_FILE,
        JSON.stringify(questions, null, 2),
        "utf8"
    );

    await interaction.reply({
        content: `✅ ${questions.length}問保存しました。`,
        ephemeral: true
    });
}