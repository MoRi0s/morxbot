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


const QUIZ_FILE = path.join(
    __dirname,
    "..",
    "data",
    "questions.json"
);


// 一時保存
const quizSessions = new Map();



export const data = new SlashCommandBuilder()
    .setName("randomquiz")
    .setDescription("ランダムクイズを開始します");




// ======================
// /randomquiz
// ======================
export async function execute(interaction) {


    if (!fs.existsSync(QUIZ_FILE)) {

        return interaction.reply({
            content:"❌ 問題データがありません",
            flags:64
        });

    }


    let questions =
        JSON.parse(
            fs.readFileSync(
                QUIZ_FILE,
                "utf8"
            )
        );


    questions =
        questions
        .sort(() => Math.random() - 0.5)
        .slice(0,10);



    quizSessions.set(
        interaction.user.id,
        {
            questions,
            answers:[],
            page:0,
            show:false
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
        "🎲 ランダムクイズ開始\n\n問題を表示しますか？",

        components:[
            row
        ]

    });

}



// ======================
// 問題を見る
// ======================
export async function showQuestionModal(interaction){


    const session =
        quizSessions.get(
            interaction.user.id
        );


    if(!session)
        return;


    session.show = true;


    await createQuizModal(
        interaction,
        session
    );

}



// ======================
// 問題を見ない
// ======================
export async function showAnswerModal(interaction){


    const session =
        quizSessions.get(
            interaction.user.id
        );


    if(!session)
        return;


    session.show = false;


    await createQuizModal(
        interaction,
        session
    );

}



// ======================
// Modal作成
// ======================
async function createQuizModal(
    interaction,
    session
){


    const start =
        session.page * 5;


    const modal =
        new ModalBuilder()
        .setCustomId(
            `randomquiz_answer_${session.page}`
        )
        .setTitle(
            `クイズ ${start+1}〜${start+5}`
        );



    const rows = [];



    for(
        let i=0;
        i<5;
        i++
    ){

        const index =
            start+i;


        if(
            !session.questions[index]
        )
            break;



        const question =
            session.questions[index];



        const input =
            new TextInputBuilder()
            .setCustomId(
                `answer_${index}`
            )
            .setLabel(
                session.show
                ?
                `${index+1}. ${question}`
                :
                `${index+1}. 回答`
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(
                true
            );



        rows.push(

            new ActionRowBuilder()
            .addComponents(
                input
            )

        );

    }



    modal.addComponents(
        rows
    );



    await interaction.showModal(
        modal
    );

}



// ======================
// 回答処理
// ======================
export async function handleModal(interaction){


    if(
        !interaction.customId.startsWith(
            "randomquiz_answer_"
        )
    )
        return;



    const session =
        quizSessions.get(
            interaction.user.id
        );


    if(!session){

        return interaction.reply({
            content:
            "❌ セッションがありません",
            flags:64
        });

    }



    const start =
        session.page * 5;



    for(
        let i=0;
        i<5;
        i++
    ){

        const index =
            start+i;


        if(
            !session.questions[index]
        )
            break;



        const answer =
            interaction.fields
            .getTextInputValue(
                `answer_${index}`
            );


        session.answers[index] =
            answer;

    }



    session.page++;



    // 次のページ
    if(
        session.page * 5 <
        session.questions.length
    ){


        const row =
            new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                .setCustomId(
                    "randomquiz_next"
                )
                .setLabel(
                    "次の5問"
                )
                .setStyle(
                    ButtonStyle.Primary
                )

            );



        return interaction.reply({

            content:
            "✅ 回答を保存しました\n次の問題へ",

            components:[
                row
            ],

            flags:64

        });

    }




    // 結果表示

    let result = "";



    session.questions.forEach(
        (q,i)=>{

            result +=
            `**Q${i+1}. ${q}**\n`;

            result +=
            `${session.answers[i] ?? "未回答"}\n\n`;

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
            result.slice(0,4000)
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



// ======================
// 次へ
// ======================
export async function showNextQuestion(interaction){


    const session =
        quizSessions.get(
            interaction.user.id
        );


    if(!session)
        return;


    await createQuizModal(
        interaction,
        session
    );

}