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

// Ensure data dir exists
if (!fs.existsSync(context.dataDir)) fs.mkdirSync(context.dataDir, { recursive: true });

client.on("interactionCreate", async (interaction) => {

  /* =============================
   * Slash Commands
   * ============================= */
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, context);
    } catch (err) {
  console.error("❌ Command execute error:", err);
  // ❗ ここでは絶対に reply しない
}
    return;
  }

  /* =============================
   * Buttons
   * ============================= */
  if (!interaction.isButton()) return;

  /* ===== iPhone Akinator ===== */
  if (interaction.customId.startsWith("iphoneaki:")) {
    const akiFile = path.join(context.dataDir, "iphoneAkiFlow.json");
    if (!fs.existsSync(akiFile)) {
      return interaction.update({
        content: "❌ アキネーターデータが見つかりません",
        components: []
      });
    }

    const aki = JSON.parse(fs.readFileSync(akiFile, "utf8"));
    const [, stateId, answer] = interaction.customId.split(":");

    /* === 確認 YES === */
    if (stateId === "confirm" && answer === "yes") {
      const embed = new EmbedBuilder()
        .setTitle("🎉 やった！")
        .setDescription("正解できてよかった！")
        .setColor(0x00ff00);

      return interaction.update({
        embeds: [embed],
        components: []
      });
    }

    /* === 確認 NO → 最初に戻す === */
    if (stateId === "confirm" && answer === "no") {
      const start = aki.start;
      const startState = aki.states[start];

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
            .setCustomId(`iphoneaki:${start}:${label}`)
        );
      }

      return interaction.update({
        embeds: [embed],
        components: [row]
      });
    }

    const state = aki.states[stateId];
    const next = state?.options?.[answer];
    if (!next) {
      return interaction.update({
        content: "❌ 次の状態が見つかりません",
        components: []
      });
    }

    /* === 結果 → 確認フェーズ === */
    if (typeof next === "object" && next.result) {
      const embed = new EmbedBuilder()
        .setTitle("📱 判定結果")
        .setDescription(`あなたのiPhoneは **${next.result}** ですか？`)
        .setColor(0xffcc00);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("はい")
          .setStyle(ButtonStyle.Success)
          .setCustomId("iphoneaki:confirm:yes"),
        new ButtonBuilder()
          .setLabel("いいえ")
          .setStyle(ButtonStyle.Danger)
          .setCustomId("iphoneaki:confirm:no")
      );

      return interaction.update({
        embeds: [embed],
        components: [row]
      });
    }

    /* === 次の質問 === */
    const nextState = aki.states[next];
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
          .setCustomId(`iphoneaki:${next}:${label}`)
      );
    }

    return interaction.update({
      embeds: [embed],
      components: [row]
    });
  }
});





// -------------------------
// Basic message listener
// -------------------------
client.on('messageCreate', (msg) => {
  if (msg.author.bot) return;
  if (msg.content.toLowerCase() === 'ping') msg.reply('🏓 pong!');
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