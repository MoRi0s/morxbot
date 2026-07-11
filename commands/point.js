import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('point')
  .setDescription('n点中何点なのかを表示します')
  .addIntegerOption(option =>
    option
      .setName('max')
      .setDescription('点数の上限')
      .setRequired(true)
      .setMinValue(1)
  );

export async function execute(interaction) {
  const max = interaction.options.getInteger('max');

  const point = Math.floor(Math.random() * (max + 1));

  await interaction.reply(`${max}点中${point}点`);
}
