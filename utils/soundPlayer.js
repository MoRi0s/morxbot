// =============================
// Sound Player Utility (効果音 / 単発再生)
// =============================
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus
} from "@discordjs/voice";

let soundPlayers = {};
let leaveTimeouts = {};

const ENABLE_VC_EMPTY_CHECK = true; // ← audioPlayer と競合するなら false にする

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

  // 古いデータ削除
  if (soundPlayers[guildId]?.timeout) clearTimeout(soundPlayers[guildId].timeout);
  if (leaveTimeouts[guildId]) clearTimeout(leaveTimeouts[guildId]);

  soundPlayers[guildId] = { connection, player };

  // =============================
  // VCに誰もいなくなったら即抜ける
  // =============================
  if (ENABLE_VC_EMPTY_CHECK) {
    const interval = setInterval(() => {
      const ch = member.guild.channels.cache.get(connection.joinConfig.channelId);
      if (!ch || ch.members.filter(m => !m.user.bot).size === 0) {
        cleanup(guildId);
        clearInterval(interval);
      }
    }, 5000);
    soundPlayers[guildId].vcCheck = interval;
  }

  // =============================
  // 再生終了 → 15分後に退出
  // =============================
  player.on(AudioPlayerStatus.Idle, () => {
    scheduleLeave(guildId);
  });

  // =============================
  // エラー → 即切断
  // =============================
  player.on("error", (err) => {
    console.error("SoundPlayer error:", err);
    cleanup(guildId);
  });

  await entersState(player, AudioPlayerStatus.Playing, 5000).catch(() => {});
}

// =============================
// 15分後に退出
// =============================
function scheduleLeave(guildId) {
  if (leaveTimeouts[guildId]) clearTimeout(leaveTimeouts[guildId]);

  leaveTimeouts[guildId] = setTimeout(() => {
    cleanup(guildId);
  }, 15 * 60 * 1000);
}

// =============================
// 接続削除処理（統一）
// =============================
function cleanup(guildId) {
  const data = soundPlayers[guildId];
  if (!data) return;

  const { connection, vcCheck } = data;

  try {
    if (vcCheck) clearInterval(vcCheck);
    connection.destroy();
  } catch (e) {}

  delete soundPlayers[guildId];

  if (leaveTimeouts[guildId]) {
    clearTimeout(leaveTimeouts[guildId]);
    delete leaveTimeouts[guildId];
  }
}
