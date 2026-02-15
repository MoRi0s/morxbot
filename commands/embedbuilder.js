import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

/* -----------------------
   Embedカラー解析
----------------------- */
function parseColor(input) {
  if (!input) return 0x00ff00;
  if (input.startsWith("#")) return parseInt(input.slice(1), 16);
  return parseInt(input) || 0x00ff00;
}

/* -----------------------
   SlashCommand
----------------------- */
export const data = new SlashCommandBuilder()
  .setName("embedbuilder")
  .setDescription("埋め込みメッセージを作成")

  .addStringOption(opt =>
    opt.setName("title").setDescription("タイトル").setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("description").setDescription("本文").setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("color").setDescription("Embedカラー(#ff0000)")
  )

  // ボタン1
  .addStringOption(opt =>
    opt.setName("button1_label").setDescription("ボタン1の名前")
  )
  .addStringOption(opt =>
    opt.setName("button1_style")
      .setDescription("ボタン1の色")
      .addChoices(
        { name: "青 (Primary)", value: "primary" },
        { name: "緑 (Success)", value: "success" },
        { name: "赤 (Danger)", value: "danger" },
        { name: "灰 (Secondary)", value: "secondary" },
        { name: "リンク (URL)", value: "link" }
      )
  )
  .addStringOption(opt =>
    opt.setName("button1_url").setDescription("URL（link選択時のみ）")
  )

  // ボタン2
  .addStringOption(opt =>
    opt.setName("button2_label").setDescription("ボタン2の名前")
  )
  .addStringOption(opt =>
    opt.setName("button2_style")
      .setDescription("ボタン2の色")
      .addChoices(
        { name: "青 (Primary)", value: "primary" },
        { name: "緑 (Success)", value: "success" },
        { name: "赤 (Danger)", value: "danger" },
        { name: "灰 (Secondary)", value: "secondary" },
        { name: "リンク (URL)", value: "link" }
      )
  )
  .addStringOption(opt =>
    opt.setName("button2_url").setDescription("URL（link選択時のみ）")
  );

/* -----------------------
   Execute
----------------------- */
export async function execute(interaction) {

  const title = interaction.options.getString("title");
  const description = interaction.options.getString("description");
  const colorInput = interaction.options.getString("color");

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(parseColor(colorInput));

  const row = new ActionRowBuilder();

  // ボタン生成関数
  function createButton(label, styleInput, url) {
    if (!label) return null;

    const styleMap = {
      primary: ButtonStyle.Primary,
      success: ButtonStyle.Success,
      danger: ButtonStyle.Danger,
      secondary: ButtonStyle.Secondary,
      link: ButtonStyle.Link
    };

    const style = styleMap[styleInput] || ButtonStyle.Primary;

    const button = new ButtonBuilder()
      .setLabel(label)
      .setStyle(style);

    if (style === ButtonStyle.Link) {
      if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
        return null;
      }
      button.setURL(url);
    } else {
      button.setCustomId(`embedbtn_${Date.now()}_${Math.random()}`);
    }

    return button;
  }

  // ボタン1
  const btn1 = createButton(
    interaction.options.getString("button1_label"),
    interaction.options.getString("button1_style"),
    interaction.options.getString("button1_url")
  );

  // ボタン2
  const btn2 = createButton(
    interaction.options.getString("button2_label"),
    interaction.options.getString("button2_style"),
    interaction.options.getString("button2_url")
  );

  if (btn1) row.addComponents(btn1);
  if (btn2) row.addComponents(btn2);

  if (row.components.length > 0) {
    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  } else {
    await interaction.reply({
      embeds: [embed]
    });
  }
}
