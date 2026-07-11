// =============================
// Load .env before everything
// =============================
import "dotenv/config";

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
  ButtonStyle,
  ActivityType
} from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

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
const rest = new REST({ version: "10" })
  .setToken(process.env.DISCORD_TOKEN);

  rest.on("rateLimited", info => {
  console.log("RATE LIMITED", info);
});

const flagFile = path.join(
  __dirname,
  "data",
  "flag.json"
);


console.log("flag path:", flagFile);
console.log("flag exists:", fs.existsSync(flagFile));


let flagConfig = {
  globalCommand: false
};


// flag.json読み込み

if (fs.existsSync(flagFile)) {

  try {

    flagConfig =
      JSON.parse(
        fs.readFileSync(
          flagFile,
          "utf8"
        )
      );

  } catch (err) {

    console.error(
      "flag.json error:",
      err
    );

  }

}


// =========================
// login
// =========================
client.once("clientReady", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`📦 Commands: ${client.commands.size}`);

 console.log(
      `Logged in ${client.user.tag}`
    );


    const updateStatus = () => {

      client.user.setActivity(
        `Bot is Working... | /help | Servers: ${client.guilds.cache.size} `,
        {
          type: ActivityType.Playing
        }
      );

    };



    updateStatus();


    // 10分ごとに更新
    setInterval(
      updateStatus,
      10 * 60 * 1000
    );

});





// ==========================
// コマンド登録
// ==========================


if(flagConfig.globalCommand){


  console.log(
    "START GLOBAL MODE"
  );



  // --------------------------
  // 既存GLOBAL削除
  // --------------------------

  try{


    console.log(
      "Deleting old GLOBAL commands..."
    );


    await rest.put(

      Routes.applicationCommands(
        process.env.CLIENT_ID
      ),

      {
        body:[]
      }

    );


    console.log(
      "Deleted old GLOBAL commands"
    );


  }catch(e){

    console.error(
      "Global delete error:",
      e
    );

  }




  // --------------------------
  // GLOBAL登録
  // --------------------------

  try{


console.log("COMMAND COUNT:", commandsForRegister.length);
console.log(JSON.stringify(commandsForRegister).length);
console.log("GLOBAL register start");

await rest.put(
  Routes.applicationCommands(
    process.env.CLIENT_ID
  ),
  {
    body: commandsForRegister
  }
);

console.log("GLOBAL register done");


    console.log(
      "Registered: GLOBAL COMMAND"
    );


  }catch(e){

    console.error(
      "Global register error:",
      e
    );

  }




}else{


  console.log(
    "START GUILD MODE"
  );



  // --------------------------
  // GLOBAL削除
  // --------------------------

  try{


    await rest.put(

      Routes.applicationCommands(
        process.env.CLIENT_ID
      ),

      {
        body:[]
      }

    );


    console.log(
      "Deleted: GLOBAL COMMAND"
    );


  }catch(e){

    console.error(
      "Global delete error:",
      e
    );

  }





  // --------------------------
  // GUILD登録
  // --------------------------

  const guildIds =
    process.env.GUILD_IDS
      .split(",")
      .map(g=>g.trim());



  console.log(
    `📡 Local Guild Count: ${guildIds.length}`
  );




  for(const guildId of guildIds){


    try{


      // --------------------------
      // 既存GUILD削除
      // --------------------------

      await rest.put(

        Routes.applicationGuildCommands(

          process.env.CLIENT_ID,

          guildId

        ),

        {
          body:[]
        }

      );


      console.log(
        "Deleted old guild:",
        guildId
      );




      // --------------------------
      // GUILD再登録
      // --------------------------

      await rest.put(

        Routes.applicationGuildCommands(

          process.env.CLIENT_ID,

          guildId

        ),

        {
          body:commandsForRegister
        }

      );



      console.log(
        "Registered:",
        guildId
      );



    }catch(e){


      console.error(

        "Guild register error:",

        guildId,

        e

      );


    }


  }


}



console.log(
  "FLAG:",
  flagConfig.globalCommand
);



// -------------------------
// Context
// -------------------------

const context = {

  client,

  dataDir:
    path.join(
      __dirname,
      "data"
    )

};





// =========================
// AutoBan Leave
// =========================

const ROLE_CACHE = path.join(context.dataDir, "memberRoles.json");
const CONFIG_FILE = path.join(context.dataDir, "autobanleave.json");

function loadJson(file) {
  if (!fs.existsSync(file)) return {};

  return JSON.parse(
    fs.readFileSync(file, "utf8")
  );
}

function saveJson(file, data) {
  fs.writeFileSync(
    file,
    JSON.stringify(data, null, 2)
  );
}

// メンバー参加
client.on("guildMemberAdd", (member) => {

  const data = loadJson(ROLE_CACHE);

  data[member.id] = {
    roles: [...member.roles.cache.keys()]
  };

  saveJson(ROLE_CACHE, data);

});

// ロール更新
client.on(
  "guildMemberUpdate",
  (oldMember, newMember) => {

    const data = loadJson(ROLE_CACHE);

    data[newMember.id] = {
      roles: [...newMember.roles.cache.keys()]
    };

    saveJson(ROLE_CACHE, data);

  }
);

// 自主退出検知
client.on(
  "guildMemberRemove",
  async (member) => {

    try {

      const config = loadJson(CONFIG_FILE);

      const guildConfig =
        config[member.guild.id];

      if (
        !guildConfig ||
        !guildConfig.enabled
      ) return;

      // 少し待って監査ログ反映
      await new Promise(
        r => setTimeout(r, 3000)
      );

      // キック判定
      const logs =
        await member.guild.fetchAuditLogs({
          type: 20,
          limit: 5
        });

      const kicked =
        logs.entries.find(
          e =>
            e.target?.id === member.id &&
            Date.now() -
            e.createdTimestamp < 5000
        );

      if (kicked) {
        console.log(
          "キックなのでBANしない"
        );
        return;
      }

      const cache =
        loadJson(ROLE_CACHE);

      const savedRoles =
        cache[member.id]?.roles || [];

      const excluded =
        savedRoles.some(
          role =>
            guildConfig.excludes.includes(
              role
            )
        );

      if (excluded) {

        console.log(
          "除外ロールなので無視"
        );

        return;
      }

      await member.guild.members.ban(
        member.id,
        {
          reason: "自主退出自動BAN"
        }
      );

      console.log(
        `${member.user.tag} 自動BAN`
      );

    } catch (err) {

      console.error(
        "AutoBan:",
        err
      );

    }

  }
);




console.log("interaction listener loaded");

// =========================
// INTERACTION CREATE
// =========================
client.on("interactionCreate", async (interaction) => {

  console.log(
    "受信:",
    interaction.type,
    interaction.customId,
    interaction.commandName
  );

  try {

    // ======================
    // slash command
    // ======================
    if (interaction.isChatInputCommand()) {

      const cmd = client.commands.get(
        interaction.commandName
      );

      if (!cmd) return;

      await cmd.execute(
        interaction,
        context
      );

      return;
    }


    // ======================
    // changerole BUTTON
    // ======================
    if (
      interaction.isButton() &&
      interaction.customId?.startsWith("changeRole|")
    ) {

      const cmd =
        client.commands.get("changerole");

      if (!cmd?.handleButton) return;

      await cmd.handleButton(
        interaction,
        context
      );

      return;
    }


    // ======================
    // changerole MODAL
    // ======================
    if (
      interaction.isModalSubmit() &&
      interaction.customId?.startsWith("changeRole|")
    ) {

      const cmd =
        client.commands.get("changerole");

      if (!cmd?.handleModal) return;

      await cmd.handleModal(
        interaction,
        context
      );

      return;
    }



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
                .setDescription(`( ˶¯ ꒳¯˵)⟡ふふ〜ん！特定完了〜！君のiPhoneは${model}なんだね！✨`)
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

  }
  catch (error) {

    console.error(
      "❌ Discord error:",
      error
    );

    // 二重返信防止
    if (
      !interaction.replied &&
      !interaction.deferred
    ) {

      await interaction.reply({
        content: "❌ エラー発生",
        flags: 64
      }).catch(() => { });

    }
  }

});




console.log("Before login");
console.log("TOKEN exists:", !!process.env.DISCORD_TOKEN);
console.log("TOKEN length:", process.env.DISCORD_TOKEN?.length);

client.on("debug", console.log);
client.on("warn", console.warn);

client.on("error", console.error);
client.on("shardError", console.error);
client.on("shardDisconnect", console.log);
client.on("shardReconnecting", console.log);
client.on("shardReady", id => console.log("Shard ready", id));

fetch("https://discord.com/api/v10/gateway")
  .then(async (r) => {
    console.log("Gateway status:", r.status);
    console.log("Gateway content-type:", r.headers.get("content-type"));

    const text = await r.text();
    console.log(text);
  })
  .catch(console.error);
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("Login OK"))
  .catch(err => console.error("Login Error:", err));

// ★これを追加
setTimeout(() => {
  console.log("WS Status:", client.ws.status);
}, 5000);

console.log("After login");

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(port, () => {
  console.log("Listening on port", port);
});



