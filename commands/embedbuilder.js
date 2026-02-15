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

  input = input.trim();

  if (input.startsWith("#")) return parseInt(input.slice(1), 16);
  if (input.startsWith("0x")) return parseInt(input, 16);
  if (/^\d+$/.test(input)) return parseInt(input);

  const colorNames = {
    red: 0xff0000,
    blue: 0x0000ff,
    green: 0x00ff00,
    yellow: 0xffff00,
    purple: 0x800080,
    pink: 0xff69b4,
    orange: 0xffa500,
    black: 0x000000,
    white: 0xffffff
  };

  return colorNames[input.toLowerCase()] || 0x00ff00;
}

function parseButtonStyle(style) {
  if (!style) return ButtonStyle.Primary;

  const styles = {
    primary: ButtonStyle.Primary,
    secondary: ButtonStyle.Secondary,
    success: ButtonStyle.Success,
    danger: ButtonStyle.Danger,
    link: ButtonStyle.Link
  };

  return styles[style.toLowerCase()] || ButtonStyle.Primary;
}

/* -----------------------
   SlashCommand
----------------------- */
export const data = new SlashCommandBuilder()
  .setName("embedbuilder")
  .setDescription("埋め込みメッセージを作成")

  .addStringOption(opt =>
    opt.setName("title").setDescription("タイトル")
    .setRequired(true)
  )

  .addStringOption(opt =>
    opt.setName("description").setDescription("本文")
    .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("color").setDescription("Embedカラー (#ff0000)")
  )

  // ボタン1
  .addStringOption(opt =>
    opt.setName("button1_label").setDescription("ボタン1の名前")
  )
  .addStringOption(opt =>
    opt.setName("button1_url").setDescription("ボタン1のURL")
  )

  // ボタン2
  .addStringOption(opt =>
    opt.setName("button2_label").setDescription("ボタン2の名前")
  )
  .addStringOption(opt =>
    opt.setName("button2_url").setDescription("ボタン2のURL")
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

  function createLinkButton(label, url) {
    if (!label || !url) return null;
    if (!url.startsWith("http://") && !url.startsWith("https://")) return null;

    return new ButtonBuilder()
      .setLabel(label)
      .setStyle(ButtonStyle.Link)
      .setURL(url)
      .setEmoji("🔗");
  }

  const btn1 = createLinkButton(
    interaction.options.getString("button1_label"),
    interaction.options.getString("button1_url")
  );

  const btn2 = createLinkButton(
    interaction.options.getString("button2_label"),
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
