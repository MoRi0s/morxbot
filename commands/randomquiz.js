import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUESTION_FILE = path.join(__dirname, "..", "data", "questions.json");

export const data = new SlashCommandBuilder()
    .setName("randomquiz")
    .setDescription("クイズに回答します。");

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

    // シャッフル順（インデックス）
    const order = [...questions.keys()];

    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }

    const orderString = order.join(",");

    const row = new ActionRowBuilder().addComponents(
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

    const questions = JSON.parse(
        fs.readFileSync(QUESTION_FILE, "utf8")
    );

    const [mode, orderString] = interaction.customId.split(":");

    const order = orderString
        .split(",")
        .map(Number);

    const modal = new ModalBuilder()
        .setCustomId(`randomquiz:${orderString}`)
        .setTitle("回答入力");

    let label;

    if (mode === "randomquiz_show") {

        label = order
            .map((index, i) => `${i + 1}. ${questions[index]}`)
            .join("\n");

    } else {

        label = `回答を1行ずつ入力（${questions.length}個）`;

    }

    if (label.length > 45) {
        label = label.substring(0, 42) + "...";
    }

    const input = new TextInputBuilder()
        .setCustomId("answers")
        .setLabel(label)
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
            flags: 64
        });
    }

    const questions = JSON.parse(
        fs.readFileSync(QUESTION_FILE, "utf8")
    );

    // customId: randomquiz:2,0,3,1,...
    const orderString = interaction.customId.split(":")[1];

    const order = orderString
        .split(",")
        .map(Number);

    const answers = interaction.fields
        .getTextInputValue("answers")
        .split("\n")
        .map(v => v.trim());

    let description = "";

    for (let i = 0; i < order.length; i++) {

        const question = questions[order[i]];
        const answer = answers[i] || "（未入力）";

        description += `**${i + 1}. ${question}**\n`;
        description += `${answer}\n\n`;
    }

    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("ランダムクイズ")
        .setDescription(description)
        .setTimestamp();

    await interaction.reply({
        embeds: [embed]
    });
}