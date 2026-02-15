// commands/msgban.js
import { SlashCommandBuilder, PermissionsBitField } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, "../msgban.json");

// 初期化
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({}, null, 2));
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function saveConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

export const data = new SlashCommandBuilder()
  .setName("msgban")
  .setDescription("特定チャンネルで発言したらBAN")
  .addSubcommand(sub =>
    sub.setName("set")
      .setDescription("監視チャンネルを設定")
      .addChannelOption(opt =>
        opt.setName("channel")
          .setDescription("監視するチャンネル")
          .setRequired(true)
      )
      .addRoleOption(opt =>
        opt.setName("ignore_role")
          .setDescription("BAN除外ロール（任意）")
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub.setName("off")
      .setDescription("無効化する")
  );

export async function execute(interaction) {

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: "❌ 管理者のみ使用可能", ephemeral: true });
  }

  const config = loadConfig();

  if (interaction.options.getSubcommand() === "set") {

    const channel = interaction.options.getChannel("channel");
    const ignoreRole = interaction.options.getRole("ignore_role");

    config[interaction.guild.id] = {
      channelId: channel.id,
      ignoreRoleId: ignoreRole ? ignoreRole.id : null
    };

    saveConfig(config);

    return interaction.reply(
      `✅ ${channel} を監視対象に設定しました\n` +
      (ignoreRole ? `🚫 除外ロール: <@&${ignoreRole.id}>` : "🚫 除外ロールなし")
    );
  }

  if (interaction.options.getSubcommand() === "off") {
    delete config[interaction.guild.id];
    saveConfig(config);

    return interaction.reply("✅ 無効化しました");
  }
}

/*
---------------------------------------
自動BAN処理
main.mjsは変更しない前提
→ 既存の messageCreate に処理を追加する必要あり
---------------------------------------
*/

export async function messageCreate(message) {
  if (!message.guild || message.author.bot) return;

  const config = loadConfig();
  const guildConfig = config[message.guild.id];
  if (!guildConfig) return;

  if (message.channel.id !== guildConfig.channelId) return;

  // 除外ロールチェック
  if (guildConfig.ignoreRoleId) {
    if (message.member.roles.cache.has(guildConfig.ignoreRoleId)) {
      return;
    }
  }

  try {
    await message.delete().catch(() => {});

    await message.guild.members.ban(message.author.id, {
      reason: "禁止チャンネルで発言"
    });

    console.log(`[MSG BAN] ${message.author.tag} をBAN`);
  } catch (err) {
    console.error("BAN失敗:", err);
  }
}
