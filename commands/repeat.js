import { SlashCommandBuilder } from "@discordjs/builders";
import { enableQueueRepeat, disableQueueRepeat } from "../utils/audioPlayer.js";

export const data = new SlashCommandBuilder()
  .setName("repeat")
  .setDescription("キュー全体リピートを切り替え")
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
    enableQueueRepeat(guildId);
    await interaction.reply("キュー全体リピートを有効にしました。");
  } else {
    disableQueueRepeat(guildId);
    await interaction.reply("キュー全体リピートを無効にしました。");
  }
}
