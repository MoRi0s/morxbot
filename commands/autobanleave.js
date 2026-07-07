import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    SlashCommandBuilder,
    PermissionsBitField
} from "discord.js";

export const category = "Moderation";
export const permissionLevel = 2;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../data");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CONFIG_FILE = path.join(DATA_DIR, "autobanleave.json");
const ROLE_CACHE = path.join(DATA_DIR, "memberRoles.json");

function loadConfig() {
    if (!fs.existsSync(CONFIG_FILE)) return {};
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
}

function saveConfig(data) {
    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(data, null, 2)
    );
}

export const data = new SlashCommandBuilder()
    .setName("autobanleave")
    .setDescription("自主退出自動BAN ON/OFF")
    .addBooleanOption(opt =>
        opt
            .setName("enabled")
            .setDescription("ON=true OFF=false")
            .setRequired(true)
    )
    .addRoleOption(opt =>
        opt.setName("exclude1")
            .setDescription("除外ロール1")
    )
    .addRoleOption(opt =>
        opt.setName("exclude2")
            .setDescription("除外ロール2")
    )
    .addRoleOption(opt =>
        opt.setName("exclude3")
            .setDescription("除外ロール3")
    )
    .addRoleOption(opt =>
        opt.setName("exclude4")
            .setDescription("除外ロール4")
    )
    .addRoleOption(opt =>
        opt.setName("exclude5")
            .setDescription("除外ロール5")
    );

export async function execute(interaction) {

    const roleConfigs = JSON.parse(
        fs.readFileSync("./data/roleconfig.json", "utf8")
    );

    const roleConfig = roleConfigs[interaction.guild.id] ?? {
        adminRoles: []
    };


    const isAdmin =
        interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
        );


    const hasAdminRole =
        interaction.member.roles.cache.some(role =>
            roleConfig.adminRoles.includes(role.id)
        );


    if (!isAdmin && !hasAdminRole) {
        return interaction.reply({
            content: "❌ 管理者または設定された管理ロールのみ使用可能です",
            flags: 64
        });
    }

    const enabled =
        interaction.options.getBoolean("enabled");

    const excludes = [];

    for (let i = 1; i <= 5; i++) {

        const role =
            interaction.options.getRole(
                `exclude${i}`
            );

        if (role) {
            excludes.push(role.id);
        }
    }

    const config = loadConfig();

    config[interaction.guild.id] = {
        enabled,
        excludes
    };

    saveConfig(config);

    return interaction.reply({
        content:
            `✅ 自主退出BAN: ${enabled ? "ON" : "OFF"}

除外ロール:
${excludes.length ? excludes.map(x => `<@&${x}>`).join("\n") : "なし"}`,
        flags: 64
    });

}