import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder
} from "discord.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const QUESTION_FILE = path.join(
    __dirname,
    "..",
    "data",
    "questions.json"
);


// ユーザーごとの一時セッション
const quizSessions = new Map();



// ======================
// Slash Command
// ======================

export const data = new SlashCommandBuilder()
    .setName("randomquiz")
    .setDescription("ランダムクイズを開始します");



// ======================
// /randomquiz 実行
// ======================

export async function execute(interaction) {


    if (!fs.existsSync(QUESTION_FILE)) {

        return interaction.reply({
            content: "❌ 問題が登録されていません。",
            flags: 64
        });

    }


    const questions =
        JSON.parse(
            fs.readFileSync(
                QUESTION_FILE,
                "utf8"
            )
        );


    if (!questions.length) {

        return interaction.reply({
            content: "❌ 問題がありません。",
            flags: 64
        });

    }



    // Fisher-Yatesシャッフル

    for (
        let i = questions.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );


        [
            questions[i],
            questions[j]
        ] =
        [
            questions[j],
            questions[i]
        ];

    }



    const quiz =
        questions.slice(0, 10);



    quizSessions.set(
        interaction.user.id,
        {
            questions: quiz,
            answers: [],
            index: 0,
            showQuestion: false
        }
    );



    const row =
        new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId(
                    "randomquiz_view"
                )
                .setLabel(
                    "問題を見る"
                )
                .setStyle(
                    ButtonStyle.Primary
                ),


            new ButtonBuilder()
                .setCustomId(
                    "randomquiz_hide"
                )
                .setLabel(
                    "問題を見ない"
                )
                .setStyle(
                    ButtonStyle.Secondary
                )

        );



    await interaction.reply({

        content:
        "🎲 ランダムクイズ開始\n\n回答方式を選択してください。",

        components: [
            row
        ]

    });

}



// ======================
// 問題を見る
// ======================

export async function showQuestionModal(interaction) {


    const session =
        quizSessions.get(
            interaction.user.id
        );


    if (!session) return;


    session.showQuestion = true;


    await showModal(
        interaction,
        session
    );

}



// ======================
// 問題を見ない
// ======================

export async function showAnswerModal(interaction) {


    const session =
        quizSessions.get(
            interaction.user.id
        );


    if (!session) return;


    session.showQuestion = false;


    const modal =
        new ModalBuilder()
        .setCustomId(
            "randomquiz_all_answer"
        )
        .setTitle(
            "回答入力"
        );



    const input =
        new TextInputBuilder()
        .setCustomId(
            "answers"
        )
        .setLabel(
            `回答を入力 (${session.questions.length}問)`
        )
        .setStyle(
            TextInputStyle.Paragraph
        )
        .setPlaceholder(
`回答1
回答2
回答3`
        )
        .setRequired(true);



    modal.addComponents(

        new ActionRowBuilder()
        .addComponents(input)

    );


    await interaction.showModal(modal);

}



// ======================
// 1問ずつモーダル
// ======================

async function showModal(
    interaction,
    session
) {


    const index =
        session.index;


    const modal =
        new ModalBuilder()
        .setCustomId(
            `randomquiz_question`
        )
        .setTitle(
            `問題 ${index + 1}`
        );



    const input =
        new TextInputBuilder()
        .setCustomId(
            "answer"
        )
        .setLabel(
            session.questions[index]
        )
        .setStyle(
            TextInputStyle.Short
        )
        .setRequired(true);



    modal.addComponents(

        new ActionRowBuilder()
        .addComponents(input)

    );



    await interaction.showModal(modal);

}



// ======================
// Modal処理
// ======================

export async function handleModal(interaction) {



    const session =
        quizSessions.get(
            interaction.user.id
        );



    if (!session) {

        return interaction.reply({

            content:
            "❌ クイズセッションがありません。",

            flags:64

        });

    }



    // 問題を見る方式

    if (
        interaction.customId ===
        "randomquiz_question"
    ) {


        const answer =
            interaction.fields
            .getTextInputValue(
                "answer"
            );


        session.answers.push(answer);


        session.index++;



        if (
            session.index <
            session.questions.length
        ) {


            const row =
                new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                    .setCustomId(
                        "randomquiz_next"
                    )
                    .setLabel(
                        "次の問題"
                    )
                    .setStyle(
                        ButtonStyle.Primary
                    )

                );



            return interaction.reply({

                content:
                "✅ 回答保存しました。",

                components:[
                    row
                ]

            });


        }


        return finishQuiz(
            interaction,
            session
        );

    }



    // 問題を見ない方式

    if (
        interaction.customId ===
        "randomquiz_all_answer"
    ) {


        session.answers =
            interaction.fields
            .getTextInputValue(
                "answers"
            )
            .split("\n")
            .map(v=>v.trim());


        return finishQuiz(
            interaction,
            session
        );

    }

}



// ======================
// 次の問題
// ======================

export async function showNextQuestion(interaction) {


    const session =
        quizSessions.get(
            interaction.user.id
        );


    if (!session) return;


    await showModal(
        interaction,
        session
    );

}



// ======================
// 結果表示
// ======================

async function finishQuiz(
    interaction,
    session
) {


    let text = "";


    session.questions.forEach(
        (q,i)=>{

            text +=
`**Q${i+1}. ${q}**
回答: ${session.answers[i] ?? "未回答"}

`;

        }
    );



    const embed =
        new EmbedBuilder()
        .setColor(
            0x0099ff
        )
        .setTitle(
            "🎉 クイズ結果"
        )
        .setDescription(
            text
        );



    quizSessions.delete(
        interaction.user.id
    );



    await interaction.reply({

        embeds:[
            embed
        ]

    });

}