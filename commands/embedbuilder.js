// commands/embedbuilder.js
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

function parseColor(input) {
  if (!input) return 0x00ff00;

  input = input.trim();

  // #ffffff → 0xffffff
  if (input.startsWith("#")) {
    return parseInt(input.slice(1), 16);
  }

  // 0xffffff
  if (input.startsWith("0x")) {
    return parseInt(input, 16);
  }

  // 数字だけ
  if (/^\d+$/.test(input)) {
    return parseInt(input);
  }

  // 色名対応
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

export const data = new SlashCommandBuilder()
  .setName("embedbuilder")
  .setDescription("埋め込みメッセージを作成")
  .addStringOption(opt =>
    opt.setName("title")
      .setDescription("タイトル")
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("description")
      .setDescription("本文")
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("color")
      .setDescription("カラー（#ff0000 / red など）")
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName("button_label")
      .setDescription("ボタンの表示名（任意）")
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName("button_url")
      .setDescription("ボタンのリンクURL（任意）")
      .setRequired(false)
  );

export async function execute(interaction) {

  const title = interaction.options.getString("title");
  const description = interaction.options.getString("description");
  const colorInput = interaction.options.getString("color");

  const buttonLabel = interaction.options.getString("button_label");
  const buttonUrl = interaction.options.getString("button_url");

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(parseColor(colorInput));

  // ボタン処理
  if (buttonLabel && buttonUrl) {

    if (!buttonUrl.startsWith("http://") && !buttonUrl.startsWith("https://")) {
      return interaction.reply({
        content: "❌ URLは http:// または https:// で始めてください",
        ephemeral: true
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel(buttonLabel)
        .setStyle(ButtonStyle.Link)
        .setURL(buttonUrl)
    );

    return interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }

  await interaction.reply({
    embeds: [embed]
  });
}
