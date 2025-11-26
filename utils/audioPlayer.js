// =============================
// Audio Player Utility (YouTube / キュー管理)
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

const QUEUE_FILE = "./data/queue.json";

let queues = {};
let players = {};

// 自動離脱タイマー（15分）
let leaveTimers = {};

// VC無人チェック用
let emptyCheckIntervals = {};

let queueRepeat = {};       // guildId -> true/false
let singleRepeat = {};      // guildId -> true/false



// =============================
// JSON読み込み・保存
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

function saveQueue() {
  try {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queues, null, 2));
  } catch (err) {
    console.error("Queue save error:", err);
  }
}

// =============================
// ギルドのキュー取得
// =============================
function getQueue(guildId) {
  if (!queues[guildId]) queues[guildId] = [];
  return queues[guildId];
}


// =============================
// VC参加
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

  if (!players[channel.guild.id]) {
    const player = createAudioPlayer();
    players[channel.guild.id] = { player, connection, resource: null };
    registerPlayerEvents(channel.guild.id);
  } else {
    players[channel.guild.id].connection = connection;
  }

  players[channel.guild.id].connection.subscribe(players[channel.guild.id].player);

  startEmptyCheck(channel.guild.id, channel.id);

  return connection;
}



// =============================
// VC 無人チェック
// =============================
function startEmptyCheck(guildId, channelId) {
  if (emptyCheckIntervals[guildId]) clearInterval(emptyCheckIntervals[guildId]);

  emptyCheckIntervals[guildId] = setInterval(() => {
    const state = players[guildId];
    if (!state || !state.connection) return;

    const guild = state.connection.joinConfig.guildId;
    const channel = state.connection.joinConfig.channelId;
    const vc = state.connection.joinConfig.voiceAdapterCreator?.guild?.channels?.cache?.get(channel);

    if (!vc) return;

    // Bot 自身を除いた人数が 0 なら即抜け
    const humanCount = vc.members.filter(m => !m.user.bot).size;

    if (humanCount === 0) {
      console.log(`[AudioPlayer] VC empty in ${guildId}, leaving immediately.`);
      leaveVC(guildId);
    }
  }, 5000);
}



// =============================
// 次の曲再生
// =============================
async function playNext(guildId) {
  const queue = getQueue(guildId);
  const state = players[guildId];

  if (!queue || queue.length === 0) return;

  const next = queue[0];
  let stream;

  try {
    if (next.type === "yt") {
      stream = ytdl(next.url, { filter: "audioonly", highWaterMark: 1 << 25 });
    } else if (next.type === "raw") {
      const s = await playDl.stream(next.url);
      stream = s.stream;
    } else throw new Error("Unknown sound type");

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
// 再生イベント登録
// =============================
function registerPlayerEvents(guildId) {
  const state = players[guildId];
  if (!state) return;

  state.player.on(AudioPlayerStatus.Idle, () => {
    const queue = getQueue(guildId);

    // ------------------------
    // リピート処理
    // ------------------------
    if (singleRepeat[guildId]) {
      // 同じ曲を繰り返す
      playNext(guildId);
      return;
    }

    if (queueRepeat[guildId]) {
      // キューの先頭を末尾に回す
      queue.push(queue.shift());
      saveQueue();
      playNext(guildId);
      return;
    }

    // 通常処理
    if (queue.length > 0) {
      queue.shift();
      saveQueue();
      playNext(guildId);
      return;
    }

    console.log(`[AudioPlayer] Queue finished in ${guildId}. Start 15min auto-leave timer.`);

    if (leaveTimers[guildId]) clearTimeout(leaveTimers[guildId]);

    leaveTimers[guildId] = setTimeout(() => {
      console.log(`[AudioPlayer] Auto leave after 15min idle in ${guildId}`);
      leaveVC(guildId);
    }, 15 * 60 * 1000);
  });

  state.player.on("error", (err) => {
    console.error("AudioPlayer Error:", err);
  });
}






// =============================
// キューに追加
// =============================
export async function addToQueue(guildId, item) {

  if (leaveTimers[guildId]) {
    clearTimeout(leaveTimers[guildId]);
    delete leaveTimers[guildId];
  }

  const q = getQueue(guildId);
  q.push(item);
  saveQueue();

  if (!players[guildId]) {
    const player = createAudioPlayer();
    players[guildId] = { player, connection: null, resource: null };
    registerPlayerEvents(guildId);
  }

  if (players[guildId].player.state.status === "idle") {
    playNext(guildId);
  }
}



// =============================
// その他操作
// =============================
export function getQueueList(guildId) {
  return getQueue(guildId);
}

export function skip(guildId) {
  const p = players[guildId]?.player;
  if (!p) return false;
  p.stop();
  return true;
}

export function stop(guildId) {
  queues[guildId] = [];
  saveQueue();
  const p = players[guildId]?.player;
  if (p) p.stop();
}

export function pause(guildId) {
  const p = players[guildId]?.player;
  if (!p) return false;
  p.pause();
  return true;
}

export function resume(guildId) {
  const p = players[guildId]?.player;
  if (!p) return false;
  p.unpause();
  return true;
}

export function enableQueueRepeat(guildId) { queueRepeat[guildId] = true; }
export function disableQueueRepeat(guildId) { queueRepeat[guildId] = false; }
export function getQueueRepeatStatus(guildId) { return !!queueRepeat[guildId]; }

export function enableSingleRepeat(guildId) { singleRepeat[guildId] = true; }
export function disableSingleRepeat(guildId) { singleRepeat[guildId] = false; }
export function getSingleRepeatStatus(guildId) { return !!singleRepeat[guildId]; }




// =============================
// VC退出
// =============================
export function leaveVC(guildId) {
  const state = players[guildId];

  if (state?.connection) {
    try { state.connection.destroy(); } catch {}
  }

  if (leaveTimers[guildId]) {
    clearTimeout(leaveTimers[guildId]);
    delete leaveTimers[guildId];
  }

  if (emptyCheckIntervals[guildId]) {
    clearInterval(emptyCheckIntervals[guildId]);
    delete emptyCheckIntervals[guildId];
  }

  delete players[guildId];

  console.log(`[AudioPlayer] Left VC in ${guildId}`);
}
