import fs from "fs";
import path from "path";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("iphoneakirank")
  .setDescription("iPhoneアキネーターのランキングを表示します");

export async function execute(interaction, context) {
  const rankFile = path.join(context.dataDir, "iphoneAkiRank.json");

  if (!fs.existsSync(rankFile)) {
    return interaction.reply({
      content: "📊 ランキングデータがまだありません",
      flags: 64
    });
  }

  const rankData = JSON.parse(fs.readFileSync(rankFile, "utf8"));
  const users = Object.values(rankData.users ?? {});

  if (users.length === 0) {
    return interaction.reply({
      content: "📊 まだ誰もプレイしていません",
      flags: 64
    });
  }

  // 勝利数 → 的中率 → プレイ数 の順でソート
  users.sort((a, b) => {
    if (b.win !== a.win) return b.win - a.win;
    const rateA = a.win / a.play;
    const rateB = b.win / b.play;
    if (rateB !== rateA) return rateB - rateA;
    return b.play - a.play;
  });

  const top = users.slice(0, 10);

  const description = top
    .map((u, i) => {
      const rate = ((u.win / u.play) * 100).toFixed(1);
      return `**${i + 1}. ${u.name}**  
🎯 的中: ${u.win} / ${u.play}（${rate}%）`;
    })
    .join("\n\n");

  const embed = new EmbedBuilder()
    .setTitle("🏆 iPhoneアキネーターランキング")
    .setDescription(description)
    .setColor(0xffd700)
    .setFooter({ text: "上位10名まで表示" });

  await interaction.reply({
    embeds: [embed]
  });
}
