import fs from "fs";
import path from "path";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const category = "Game";
export const permissionLevel = 1;

export const data = new SlashCommandBuilder()
  .setName("iphoneakirank")
  .setDescription("iPhoneアキネーターの機種別ランキングを表示します");

export async function execute(interaction, context) {
  await interaction.deferReply();
  const rankFile = path.join(context.dataDir, "iphoneAkiRank.json");

  if (!fs.existsSync(rankFile)) {
    return interaction.editReply({
      content: "📊 まだランキングデータがありません",
      flags: 64
    });
  }

  const rankData = JSON.parse(fs.readFileSync(rankFile, "utf8"));
  const models = Object.entries(rankData.models ?? {});

  if (models.length === 0) {
    return interaction.editReply({
      content: "📊 まだ的中データがありません",
      flags: 64
    });
  }

  models.sort((a, b) => b[1] - a[1]); // 回数順

  const top = models.slice(0, 10);

  const description = top
    .map(([model, count], i) => {
      return `**${i + 1}. ${model}**  
🎯 的中回数: ${count}`;
    })
    .join("\n\n");

const totalPlay = rankData.totalPlay ?? 0;

const embed = new EmbedBuilder()
  .setTitle("📱 iPhone 機種別ランキング")
  .setDescription(description)
  .setColor(0x00bfff)
  .setFooter({
    text: `総プレイ回数: ${totalPlay} 回`
  });


  await interaction.editReply({
    embeds: [embed]
  });
}
