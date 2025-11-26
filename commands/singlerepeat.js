import { SlashCommandBuilder } from "@discordjs/builders";
import { enableSingleRepeat, disableSingleRepeat } from "../utils/audioPlayer.js";

export const data = new SlashCommandBuilder()
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
  );

export async function execute(interaction) {
  const mode = interaction.options.getString("mode");
  const guildId = interaction.guildId;

  if (mode === "on") {
    enableSingleRepeat(guildId);
    await interaction.reply("再生中の1曲リピートを有効にしました。");
  } else {
    disableSingleRepeat(guildId);
    await interaction.reply("再生中の1曲リピートを無効にしました。");
  }
}
