// =============================
// Sound Player Utility (効果音 / 単発再生)
// =============================
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, entersState, VoiceConnectionStatus } from "@discordjs/voice";

let soundPlayers = {};

// =============================
// 効果音再生
// =============================
export async function playSound(member, filePath, channel) {
  const guildId = member.guild.id;
  const connection = joinVoiceChannel({
    channelId: member.voice.channel.id,
    guildId,
    adapterCreator: member.guild.voiceAdapterCreator
  });

  const player = createAudioPlayer();
  const resource = createAudioResource(filePath);
  connection.subscribe(player);
  player.play(resource);

  // 2分後に自動切断
  if (soundPlayers[guildId]?.timeout) clearTimeout(soundPlayers[guildId].timeout);
  soundPlayers[guildId] = { connection, player };
  soundPlayers[guildId].timeout = setTimeout(() => {
    player.stop();
    connection.destroy();
    delete soundPlayers[guildId];
  }, 2 * 60 * 1000);

  // 再生終了で切断
  player.on(AudioPlayerStatus.Idle, () => {
    if (soundPlayers[guildId]) {
      clearTimeout(soundPlayers[guildId].timeout);
      connection.destroy();
      delete soundPlayers[guildId];
    }
  });

  player.on("error", (err) => {
    console.error("SoundPlayer error:", err);
    if (soundPlayers[guildId]) {
      clearTimeout(soundPlayers[guildId].timeout);
      connection.destroy();
      delete soundPlayers[guildId];
    }
  });

  await entersState(player, AudioPlayerStatus.Playing, 5_000).catch(() => {});
}
