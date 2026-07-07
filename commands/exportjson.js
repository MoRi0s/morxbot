// commands/exportjson.js
import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

export const category = "Music";
export const permissionLevel = 1;

export const data = new SlashCommandBuilder()
  .setName('exportjson')
  .setDescription('JSONデータをファイルとして出力');

export async function execute(interaction) {
  const filePath = path.join('./data', 'db.json');

  if (!fs.existsSync(filePath)) {
    return interaction.reply({
      content: '❌ JSONファイルがまだありません！',
      ephemeral: true
    });
  }

  const file = new AttachmentBuilder(filePath);

  await interaction.reply({
    content: '📤 JSONエクスポート完了！',
    files: [file]
  });
}
