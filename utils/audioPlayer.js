// =============================
//  Audio Player Utility (Full)
// =============================

import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus
} from "@discordjs/voice";

import ytdl from "@distube/ytdl-core";
import playDl from "play-dl";
import fs from "fs";

// =============================
//   永続化ファイル
// =============================
const QUEUE_FILE = "./data/queue.json";

// =============================
//   メモリ上のデータ
// =============================
let queues = {};
let players = {};

// =============================
//   JSON読み込み
// =============================
function loadQueue() {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      queues = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
    }
  } catch (err) {
    console.error("Queue load error:", err);
    queues = {};
  }
}
loadQueue();

// =============================
//   JSON保存
// =============================
function saveQueue() {
  try {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queues, null, 2));
  } catch (err) {
    console.error("Queue save error:", err);
  }
}

// =============================
//   ギルドのキュー取得
// =============================
function getQueue(guildId) {
  if (!queues[guildId]) queues[guildId] = [];
  return queues[guildId];
}

// =============================
// 🔽 次の曲を再生
// =============================
async function playNext(guildId) {
  const queue = getQueue(guildId);
  const state = players[guildId];

  if (!queue || queue.length === 0) {
    console.log(`[AudioPlayer] queue empty in ${guildId}`);
    return;
  }

  const next = queue[0];
  let stream;

  try {
    if (next.type === "yt") {
      stream = ytdl(next.url, {
        filter: "audioonly",
        highWaterMark: 1 << 25
      });
    } else if (next.type === "raw") {
      const s = await playDl.stream(next.url);
      stream = s.stream;
    } else {
      throw new Error("Unknown sound type");
    }

    state.resource = createAudioResource(stream, { inlineVolume: true });
    state.resource.volume.setVolume(0.9);

    state.player.play(state.resource);
    console.log(`[AudioPlayer] Playing: ${next.title} in ${guildId}`);

  } catch (e) {
    console.error("playNext error:", e);
    queue.shift();
    saveQueue();
    playNext(guildId);
  }
}

// =============================
// 🔽 再生イベント
// =============================
function registerPlayerEvents(guildId) {
  const state = players[guildId];
  if (!state) return;

  state.player.on(AudioPlayerStatus.Idle, () => {
    const queue = getQueue(guildId);

    if (queue.length > 0) {
      queue.shift();
      saveQueue();
    }

    playNext(guildId);
  });

  state.player.on("error", (err) => {
    console.error("AudioPlayer Error:", err);
  });
}

// =============================
// 🔽 VC参加
// =============================
export async function joinVC(member) {
  const channel = member.voice.channel;
  if (!channel) throw new Error("VCに入っていません");

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  return connection;
}

// =============================
// 🔽 VC退出
// =============================
export function leaveVC(guildId) {
  const state = players[guildId];
  if (state?.connection) {
    try {
      state.connection.destroy();
    } catch {}
    delete players[guildId];
  }
}

// =============================
// 🔽 キューに追加
// =============================
export async function addToQueue(guildId, item) {
  const q = getQueue(guildId);
  q.push(item);
  saveQueue();

  if (!players[guildId]) {
    const player = createAudioPlayer();
    players[guildId] = { player, connection: null, resource: null };
    registerPlayerEvents(guildId);
  }

  if (players[guildId].player._state.status === "idle") {
    playNext(guildId);
  }
}

// =============================
// 🔽 キュー取得
// =============================
export function getQueueList(guildId) {
  return getQueue(guildId);
}

// =============================
// 🔽 スキップ
// =============================
export function skip(guildId) {
  const p = players[guildId]?.player;
  if (!p) return false;
  p.stop();
  return true;
}

// =============================
// 🔽 停止
// =============================
export function stop(guildId) {
  queues[guildId] = [];
  saveQueue();
  const p = players[guildId]?.player;
  if (p) p.stop();
}

// =============================
// 🔽 一時停止
// =============================
export function pause(guildId) {
  const p = players[guildId]?.player;
  if (!p) return false;
  p.pause();
  return true;
}

// =============================
// 🔽 再開
// =============================
export function resume(guildId) {
  const p = players[guildId]?.player;
  if (!p) return false;
  p.unpause();
  return true;
}

// =============================
// 🔽 まとめてエクスポート
// =============================
export const player = {
  joinVC,
  leaveVC,
  addToQueue,
  getQueueList,
  skip,
  stop,
  pause,
  resume
};
