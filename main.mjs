// =============================
// Load .env before everything
// =============================
import "dotenv/config";


console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN);
console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('GUILD_IDS:', process.env.GUILD_IDS);


// main.mjs - Discord Bot Entry Point (Commands + Utils compatible, Windows ESM fixed)
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import express from "express";

import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------
// Discord Client
// -------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

client.commands = new Collection();

// -------------------------
// Load commands dynamically (Windows-safe)
// -------------------------
const commandsDir = path.join(__dirname, 'commands');
const commandFiles = fs.existsSync(commandsDir)
  ? fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'))
  : [];

const commandsForRegister = [];

for (const file of commandFiles) {
  try {
    const full = path.join(commandsDir, file);
    const mod = await import(pathToFileURL(full).href); // ← Windows対応
    if (!mod || !mod.data || !mod.execute) {
      console.warn(`commands/${file} が不正 (data または execute が未定義)`);
      continue;
    }
    client.commands.set(mod.data.name, mod);
    commandsForRegister.push(mod.data.toJSON());
    console.log(`Loaded command: ${mod.data.name}`);
  } catch (e) {
    console.error(`Failed to load command ${file}:`, e);
  }
}

// -------------------------
// Register slash commands per guild (for small number of servers)
// -------------------------
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_IDS) {
  console.error('DISCORD_TOKEN, CLIENT_ID or GUILD_IDS not set in .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const guildIds = process.env.GUILD_IDS.split(',').map(g => g.trim());

for (const guildId of guildIds) {
  (async () => {
    try {
      console.log(`Registering ${commandsForRegister.length} commands to guild ${guildId}...`);
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), { body: commandsForRegister });
      console.log(`✅ Commands registered for guild ${guildId}`);
    } catch (e) {
      console.error(`Slash command registration failed for guild ${guildId}:`, e);
    }
  })();
}


// -------------------------
// Context for commands (shared utils)
// -------------------------
const context = {
  client,
  dataDir: path.join(__dirname, 'data')
};

client.on("interactionCreate", async (interaction) => {

if (interaction.isChatInputCommand()) {

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, context);
    } catch (error) {
      console.error("Command error:", error);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: "❌ エラーが発生しました" });
      } else {
        await interaction.reply({ content: "❌ エラーが発生しました", flags: 64 });
      }
    }

    return; // ← これ超重要
  }

  if (!interaction.isButton()) return;
  if (!interaction.customId?.startsWith("iphoneaki:")) return;

  const akiFile = path.join(context.dataDir, "iphoneAkiFlow.json");
  if (!fs.existsSync(akiFile)) {
    return interaction.update({
      content: "❌ アキネーターデータが見つかりません",
      embeds: [],
      components: []
    });
  }

  const aki = JSON.parse(fs.readFileSync(akiFile, "utf8"));
  const parts = interaction.customId.split(":");

  const stateId = parts[1];
  const answer = parts[2];

  let result = null;
  let ownerId;

  // confirmのときだけ構造が違う
  if (stateId === "confirm") {
    result = decodeURIComponent(parts[3]);
    ownerId = parts[4];
  } else {
    ownerId = parts[3];
  }


  // 他人ブロック
  if (interaction.user.id !== ownerId) {
    return interaction.reply({
      content: "⛔ これは他の人のアキネーターです",
      flags: 64
    });
  }

let state = aki.states[stateId];

// confirmはstatesに存在しないのでスキップ
if (!state && stateId !== "confirm") {
  return interaction.update({
    content: "❌ 状態が見つかりません",
    embeds: [],
    components: []
  });
}


  /* =============================
     確認フェーズ
  ============================= */
  if (stateId === "confirm") {
    const model = result;
    const rankFile = path.join(context.dataDir, "iphoneAkiRank.json");
    let rankData = { totalPlay: 0, models: {} };

    if (fs.existsSync(rankFile)) {
      rankData = JSON.parse(fs.readFileSync(rankFile, "utf8"));
    }

    // 総プレイ回数は必ず+1
    rankData.totalPlay += 1;

    if (answer === "yes") {
      const model = result;
      rankData.models[model] = (rankData.models[model] ?? 0) + 1;
    }

    fs.writeFileSync(rankFile, JSON.stringify(rankData, null, 2));

    // YES → 終了
    if (answer === "yes") {
      const embed = new EmbedBuilder()
        .setTitle("🎉 やったー！😊")
        .setDescription(`( ˶¯ ꒳¯˵)⟡ふふ〜ん！特定完了〜！君のiPhoneは${model}なんだね！✨`)
        .setColor(0x00ff00);

      return interaction.update({
        embeds: [embed],
        components: []
      });
    }

    // NO → 最初に戻る
    if (answer === "no") {

      const startId = aki.start;
      const startState = aki.states[startId];

      const embed = new EmbedBuilder()
        .setTitle("📱 iPhoneアキネーター")
        .setDescription(startState.question)
        .setColor(0x0099ff);

      const row = new ActionRowBuilder();
      for (const label of Object.keys(startState.options)) {
        row.addComponents(
          new ButtonBuilder()
            .setLabel(label)
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`iphoneaki:${startId}:${label}:${ownerId}`)
        );
      }

      return interaction.update({
        embeds: [embed],
        components: [row]
      });
    }
  }

  /* =============================
     通常質問フェーズ
  ============================= */
const nextStateId = state.options?.[answer];

if (!nextStateId) {
  return interaction.update({
    content: "❌ 次の状態が見つかりません",
    embeds: [],
    components: []
  });
}

// 通常ステート取得
const nextState = aki.states[nextStateId];

if (!nextState) {
  return interaction.update({
    content: "❌ 次の状態データが見つかりません",
    embeds: [],
    components: []
  });
}

// ✅ resultステートならここで処理
if (nextState.result) {

  const template =
    aki.confirmMessages[
      Math.floor(Math.random() * aki.confirmMessages.length)
    ];

  const message = template.replace("{result}", nextState.result);

  const embed = new EmbedBuilder()
    .setTitle("📱 判定結果")
    .setDescription(message)
    .setColor(0xffcc00);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("はい")
      .setStyle(ButtonStyle.Success)
      .setCustomId(`iphoneaki:confirm:yes:${encodeURIComponent(nextState.result)}:${ownerId}`),
    new ButtonBuilder()
      .setLabel("いいえ")
      .setStyle(ButtonStyle.Danger)
      .setCustomId(`iphoneaki:confirm:no:${encodeURIComponent(nextState.result)}:${ownerId}`)
  );

  return interaction.update({
    embeds: [embed],
    components: [row]
  });
}


  // 通常質問
  const embed = new EmbedBuilder()
    .setTitle("📱 iPhoneアキネーター")
    .setDescription(nextState.question)
    .setColor(0x0099ff);

  const row = new ActionRowBuilder();
  for (const label of Object.keys(nextState.options)) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(label)
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`iphoneaki:${nextStateId}:${label}:${ownerId}`)
    );
  }

  return interaction.update({
    embeds: [embed],
    components: [row]
  });

});

// -------------------------
// Basic message listener
// -------------------------
// -------------------------
// Message dispatcher (all command modules対応)
// -------------------------
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // 既存の ping 機能を残したいならここに書く
  if (message.content.toLowerCase() === "ping") {
    await message.reply("🏓 pong!");
  }

  // 各コマンドの messageCreate を実行
  for (const command of client.commands.values()) {
    if (typeof command.messageCreate === "function") {
      try {
        await command.messageCreate(message);
      } catch (err) {
        console.error(`messageCreate error in ${command.data?.name}`, err);
      }
    }
  }
});


// -------------------------
// Ready + Login
// -------------------------
client.once('ready', () => {
  console.log(`🎉 ${client.user.tag} is ready. Guilds: ${client.guilds.cache.size}`);
});

client.on('error', (err) => console.error('❌ Discord error:', err));

process.on('SIGINT', () => {
  console.log('🛑 Bot shutting down...');
  client.destroy();
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN).catch(e => { console.error('Login failed', e); process.exit(1); });

// -------------------------
// Express health endpoint
// -------------------------
const app = express();
app.get('/', (req, res) => res.json({
  status: 'OK',
  message: 'Discord Bot Running 🤖',
  uptime: process.uptime(),
  timestamp: new Date().toISOString()
}));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🌐 Express listening on port ${port}`));

// -------------------------
// Notes
// - Place commands in ./commands/*.js
// - Each command module: export const data = new SlashCommandBuilder()..., export async function execute(interaction, context)
// - Utils (audioManager, jsonStore, youtube) in ./utils
// - This main.mjs is Windows-safe with pathToFileURL()
// -------------------------
