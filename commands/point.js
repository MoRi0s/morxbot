const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('point')
    .setDescription('点数を表示します')
    .addIntegerOption(option =>
      option
        .setName('max')
        .setDescription('点数の上限')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const max = interaction.options.getInteger('max');

    const point = Math.floor(Math.random() * (max + 1));

    await interaction.reply(
      `${max}点中${point}点`
    );
  },
};