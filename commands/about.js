import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";


export const data = new SlashCommandBuilder()

    .setName("about")
    .setDescription("Botと製作者について表示します");


export const category = "Info";

export const permissionLevel = 1;



export async function execute(interaction, context) {


    const client =
        interaction.client;



    // =====================
    // URL設定
    // =====================

    const botHP =
        "https://bot.morixxx.com";


    const github =
        "https://github.com/MoRi0s";


    const supportServer =
        "https://discord.gg/AtsyBu4NRs";


    const ownerHP =
        "https://morixxx.com";



    const commandCount =
        client.commands.size;



    const guildCount =
        client.guilds.cache.size;



    const userCount =
        client.guilds.cache.reduce(
            (a, g) =>
                a + g.memberCount,
            0
        );



    function botEmbed() {


        return new EmbedBuilder()

            .setTitle(
                "🤖 Bot Information"
            )


            .setDescription(
                `
**盛岡さんBot**

便利機能や管理機能を搭載した
Discord Botです。


📌 コマンド数
${commandCount}個


🌐 導入サーバー
${guildCount}サーバー


👥 総ユーザー数
約${userCount}人


🔗 Bot HP
${botHP}


💻 GitHub
${github}


💬 サポートサーバー
${supportServer}
`
            )


            .setThumbnail(
                client.user.displayAvatarURL()
            )


            .setColor(
                0x00ffff
            )


            .setTimestamp();

    }





    function ownerEmbed() {


        return new EmbedBuilder()

            .setTitle(
                "👤 Creator Information"
            )


            .setDescription(
                `
**製作者: 盛岡**

音楽と技術が好きな大学生

スマートフォンやPC、プログラムなど
コンピューター関連の技術が好きで、
Discord Bot開発やWeb制作などをしています。


このBotでは、
便利な機能やサーバー管理機能を中心に
日々アップデートを行っています。


🌐 Website
${ownerHP}


💻 Skills

・Node.js
・discord.js
・C（勉強中）
・Web制作
・サーバー管理（合計 12 サーバー）
`
            )


            .setColor(
                0x4500ff
            )


            .setTimestamp();

    }





    const row =
        new ActionRowBuilder()

            .addComponents(

                new ButtonBuilder()

                    .setCustomId(
                        "about_bot"
                    )

                    .setLabel(
                        "🤖 Bot"
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    ),


                new ButtonBuilder()

                    .setCustomId(
                        "about_owner"
                    )

                    .setLabel(
                        "👤 製作者"
                    )

                    .setStyle(
                        ButtonStyle.Secondary
                    )

            );





    await interaction.reply({

        embeds: [
            botEmbed()
        ],

        components: [
            row
        ]

    });


    const msg =
        await interaction.fetchReply();




    const collector =
        msg.createMessageComponentCollector({

            time: 60000

        });





    collector.on(
        "collect",
        async i => {


            if (i.user.id !== interaction.user.id) {

                return i.reply({

                    content:
                        "❌ この操作は実行者のみ可能です",

                    flags: 64

                });

            }



            if (i.customId === "about_bot") {

                await i.update({

                    embeds: [
                        botEmbed()
                    ]

                });

            }



            if (i.customId === "about_owner") {

                await i.update({

                    embeds: [
                        ownerEmbed()
                    ]

                });

            }


        }
    );


}