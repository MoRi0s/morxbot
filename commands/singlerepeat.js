import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction } from "discord.js";
import { enableSingleRepeat, disableSingleRepeat, getSingleRepeatStatus } from "../singlerepeat.js";

export default {
  data: new SlashCommandBuilder()
    .setName("singlerepeat")
    .setDescription("再生中の1曲リピートを切り替え")
    .addStringOption(option =>
      option
        .setName("mode")
        .setDescription("repeatモード")
        .setRequired(true)
        .addChoices(
          { name: "有効", value: "on" },
          { name: "無効", value: "off" }
        )
    ),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const mode = interaction.options.getString("mode");
    const guildId = interaction.guildId;

    if (mode === "on") {
      enableSingleRepeat(guildId);
      await interaction.reply("再生中の1曲リピートを有効にしました。");
    } else {
      disableSingleRepeat(guildId);
      await interaction.reply("再生中の1曲リピートを無効にしました。");
    }
  },
};
