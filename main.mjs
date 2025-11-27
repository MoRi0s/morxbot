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

// -------------------------
// Interaction dispatcher
// -------------------------
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return interaction.reply({ content: 'Unknown command', ephemeral: true });

try {
  await cmd.execute(interaction, context);
} catch (err) {
  console.error('Command execute error:', err);

  // まだ返信していない場合だけ reply
  if (!interaction.replied && !interaction.deferred) {
    try {
      await interaction.reply({
        content: '⚠ コマンド実行中にエラーが発生しました',
        flags: 64
      });
    } catch (e) {
      console.error('Reply error', e);
    }
  }
}


}
});


// -------------------------
// ボタン押下処理（owner-alarm / himajin-call）
// -------------------------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const cooldownFile = path.join(context.dataDir, 'alarmCooldown.json');
  const rolesFile = path.join(context.dataDir, 'roles.json');
  const messagesFile = path.join(context.dataDir, 'himajinMessages.json');

  const cooldowns = fs.existsSync(cooldownFile) ? JSON.parse(fs.readFileSync(cooldownFile, 'utf8')) : {};
  const rolesData = fs.existsSync(rolesFile) ? JSON.parse(fs.readFileSync(rolesFile, 'utf8')) : {};
  const messagesData = fs.existsSync(messagesFile) ? JSON.parse(fs.readFileSync(messagesFile, 'utf8')) : {};

  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // -------------------------
  // owner-alarm ボタン（変更なし）
  // -------------------------
  if (interaction.customId === `owner-alarm-${guildId}`) {
    const lastUsed = cooldowns[guildId]?.[userId]?.ownerAlarm || 0;

    if (now - lastUsed >= DAY) {
      const ownerRoleId = rolesData[guildId]?.ownerRoleId;
      if (!ownerRoleId) {
        await interaction.reply({ content: "⚠ 鯖主ロールが未設定です", ephemeral: true });
      } else {
        cooldowns[guildId] = cooldowns[guildId] || {};
        cooldowns[guildId][userId] = cooldowns[guildId][userId] || {};
        cooldowns[guildId][userId].ownerAlarm = now;
        fs.writeFileSync(cooldownFile, JSON.stringify(cooldowns, null, 2));

        await interaction.reply({ content: `<@&${ownerRoleId}> 鯖主かもーん`, ephemeral: false });
      }
    } else {
      const remaining = DAY - (now - lastUsed);
      await interaction.reply({ content: `⏳ クールタイム中です (${Math.ceil(remaining / 1000 / 60 / 60)}時間)`, ephemeral: true });
    }
    return;
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