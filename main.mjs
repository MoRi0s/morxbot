// =============================
// Load .env before everything
// =============================
import "dotenv/config";

console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN);
console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('GUILD_IDS:', process.env.GUILD_IDS);

// main.mjs - Discord Bot Entry Point
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
} from "discord.js";

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
// Load commands
// -------------------------
const commandsDir = path.join(__dirname, "commands");
const commandFiles = fs.existsSync(commandsDir)
  ? fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"))
  : [];

const commandsForRegister = [];

for (const file of commandFiles) {
  try {
    const full = path.join(commandsDir, file);
    const mod = await import(pathToFileURL(full).href);

    if (!mod?.data || !mod?.execute) continue;

    client.commands.set(mod.data.name, mod);
    commandsForRegister.push(mod.data.toJSON());

    console.log("Loaded command:", mod.data.name);
  } catch (e) {
    console.error("Load error:", file, e);
  }
}

// -------------------------
// Slash register
// -------------------------
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
const guildIds = process.env.GUILD_IDS.split(",").map(g => g.trim());

for (const guildId of guildIds) {
  (async () => {
    try {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commandsForRegister }
      );
      console.log("Registered:", guildId);
    } catch (e) {
      console.error(e);
    }
  })();
}

// -------------------------
const context = {
  client,
  dataDir: path.join(__dirname, "data")
};

// =========================
// INTERACTION CREATE
// =========================
client.on("interactionCreate", async (interaction) => {

  console.log("受信:", interaction.type, interaction.customId, interaction.commandName);

  try {

    // ======================
    // slash command
    // ======================
    if (interaction.isChatInputCommand()) {

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      return await command.execute(interaction, context);
    }

    // ======================
    // changerole BUTTON
    // ======================
    if (interaction.isButton() && interaction.customId?.startsWith("changeRole|")) {

      const command = client.commands.get("changerole");
      if (!command) return;

      // 🔥重要：これで「二重呼び防止」
      return await command.execute(interaction, context);
    }

    // ======================
    // changerole MODAL
    // ======================


    // ======================
    // iphoneaki（完全維持）
    // ======================
    if (interaction.isButton() && interaction.customId?.startsWith("iphoneaki:")) {

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

      if (stateId === "confirm") {
        result = decodeURIComponent(parts[3]);
        ownerId = parts[4];
      } else {
        ownerId = parts[3];
      }

      if (interaction.user.id !== ownerId) {
        return interaction.reply({
          content: "⛔ 他の人のアキネーターです",
          flags: 64
        });
      }

      let state = aki.states[stateId];

      if (!state && stateId !== "confirm") {
        return interaction.update({
          content: "❌ 状態が見つかりません",
          embeds: [],
          components: []
        });
      }

      // confirm
      if (stateId === "confirm") {

        const model = result;
        const rankFile = path.join(context.dataDir, "iphoneAkiRank.json");

        let rankData = { totalPlay: 0, models: {} };

        if (fs.existsSync(rankFile)) {
          rankData = JSON.parse(fs.readFileSync(rankFile, "utf8"));
        }

        rankData.totalPlay += 1;

        if (answer === "yes") {
          rankData.models[model] = (rankData.models[model] ?? 0) + 1;
        }

        fs.writeFileSync(rankFile, JSON.stringify(rankData, null, 2));

        if (answer === "yes") {
          return interaction.update({
            embeds: [
              new EmbedBuilder()
                .setTitle("🎉 やったー！")
                .setDescription(`君のiPhoneは${model}`)
                .setColor(0x00ff00)
            ],
            components: []
          });
        }

        const startId = aki.start;
        const startState = aki.states[startId];

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
          embeds: [
            new EmbedBuilder()
              .setTitle("iPhoneアキネーター")
              .setDescription(startState.question)
              .setColor(0x0099ff)
          ],
          components: [row]
        });
      }

      const nextStateId = state.options?.[answer];

      if (!nextStateId) {
        return interaction.update({
          content: "❌ 次の状態なし",
          embeds: [],
          components: []
        });
      }

      const nextState = aki.states[nextStateId];

      if (nextState.result) {

        const template =
          aki.confirmMessages[
            Math.floor(Math.random() * aki.confirmMessages.length)
          ];

        const message = template.replace("{result}", nextState.result);

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
          embeds: [
            new EmbedBuilder()
              .setTitle("判定結果")
              .setDescription(message)
              .setColor(0xffcc00)
          ],
          components: [row]
        });
      }

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
        embeds: [
          new EmbedBuilder()
            .setTitle("iPhoneアキネーター")
            .setDescription(nextState.question)
            .setColor(0x0099ff)
        ],
        components: [row]
      });
    }

  } catch (error) {
    console.error("❌ Discord error:", error);
  }
});
// =========================
// login
// =========================
client.login(process.env.DISCORD_TOKEN);