// commands/jirai.js
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('jirai')
  .setDescription('地雷コマンド');

export async function execute(interaction) {
  const channel = interaction.channel;

  // メッセージ1
  await channel.send('本当に押していいの？後悔しない？？');

  // メッセージ2
  await channel.send('後悔しないなら自分の @ユーザー名 を送ってください');

  try {
    // ユーザーの入力待ち
    const collected = await channel.awaitMessages({
      filter: msg => msg.author.id === interaction.user.id,
      max: 1,
      time: 20000
    });

    if (!collected.size) {
      return interaction.reply({
        content: '⌛ 時間切れです！',
        ephemeral: true
      });
    }

    const reply = collected.first().content;
    const expected = `<@${interaction.user.id}>`;

    // 一致判定
    if (reply === expected) {
      await channel.send('ばいばーいｗｗｗｗｗｗｗ');
      await new Promise(res => setTimeout(res, 2000));

      const member = interaction.guild.members.cache.get(interaction.user.id);

      // Kick
      await member.kick('地雷コマンド');
      return;
    } else {
      return interaction.reply({
        content: '名前が一致しません。キャンセルしました。',
        ephemeral: true
      });
    }
  } catch (e) {
    return interaction.reply({
      content: 'エラーが発生しました: ' + e,
      ephemeral: true
    });
  }
}
