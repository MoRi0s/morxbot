import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} from "discord.js";


export const data = new SlashCommandBuilder()

    .setName("help")
    .setDescription("コマンド一覧を表示します");


export const category = "ヘルプ";
export const permissionLevel = 1;



export async function execute(interaction, context) {


    const commands =
        interaction.client.commands;



    const categories = {};



    for (const command of commands.values()) {


        const commandCategory =
            command.category
            ??
            "その他";


        if (!categories[commandCategory]) {

            categories[commandCategory] = [];

        }



        categories[commandCategory].push({

            name:
                command.data.name,

            description:
                command.data.description,

            permission:
                command.permissionLevel ?? 1

        });

    }



    const pages =
        Object.entries(categories);


    // 権限ページ追加
    pages.push([
        "🔑 権限一覧",
        [
            {
                name: "permission",
                description:
                    `
🌐 レベル1
全ユーザー使用可能


🛡️ レベル2
管理者 または
設定された管理ロール


🔒 レベル3
Discord Administrator権限のみ


👑 レベル4
Bot所有者のみ
`
            }
        ]
    ]);


    const permissionIcon = {

        1: "🌐",

        2: "🛡️",

        3: "🔒",

        4: "👑"

    };



    function createEmbed(index) {


        const [
            categoryName,
            cmds
        ] = pages[index];



        return new EmbedBuilder()

            .setTitle(
                `📖 ${categoryName}`
            )


            .setDescription(

                cmds.map(cmd => {

                    if (cmd.name === "permission") {

                        return cmd.description;

                    }


                    return `
${permissionIcon[cmd.permission] ?? "🌐"} \`/${cmd.name}\`
${cmd.description}
`;

                })
                    .join("\n")

            )


            .setColor(0x00aaff)


            .setFooter({

                text:
                    `${index + 1}/${pages.length} ページ`

            })


            .setTimestamp();

    }



    const menu =

        new StringSelectMenuBuilder()

            .setCustomId(
                "help_category"
            )

            .setPlaceholder(
                "カテゴリを選択"
            )

            .addOptions(

                pages.map(
                    ([name], index) => ({

                        label: name,

                        value: String(index),

                        emoji:
                            name === "🔑 権限一覧"
                                ? "🔑"
                                : "📂"

                    })
                )

            );



    const row =

        new ActionRowBuilder()

            .addComponents(
                menu
            );



    await interaction.reply({

        embeds: [
            createEmbed(0)
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
                        "❌ このヘルプは実行者のみ操作できます",

                    flags: 64

                });

            }



            if (
                i.customId === "help_category"
            ) {

                const index =
                    Number(
                        i.values[0]
                    );



                await i.update({

                    embeds: [
                        createEmbed(index)
                    ]

                });

            }


        }
    );

}