import fs from "fs";
import path from "path";
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("iphoneaki")
  .setDescription("iPhoneアキネーターであなたのiPhoneを特定します");

export async function execute(interaction, context) {
  const akiFile = path.join(context.dataDir, "iphoneAkiFlow.json");
  if (!fs.existsSync(akiFile)) {
    return interaction.reply({
      content: "❌ iphoneAkiFlow.json が見つかりません",
      flags: 64
    });
  }

  const aki = JSON.parse(fs.readFileSync(akiFile, "utf8"));
  const startState = aki.states[aki.start];

  const embed = new EmbedBuilder()
    .setTitle("📱 iPhoneアキネーター")
    .setDescription(startState.question)
    .setColor(0x0099ff);

  const row = new ActionRowBuilder();
  const ownerId = interaction.user.id;
  for (const label of Object.keys(startState.options)) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(label)
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`iphoneaki:${aki.start}:${label}:${ownerId}`)
    );
  }

  await interaction.reply({
    embeds: [embed],
    components: [row]
  });
}
