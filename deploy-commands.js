import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import "dotenv/config";

const TOKEN = process.env.DISCORD_TOKEN;  // ← ここ修正
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error("❌ DISCORD_TOKEN または CLIENT_ID が .env に設定されていません。");
    process.exit(1);
}

const commands = [];
const commandsPath = path.join(process.cwd(), "commands");
const files = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of files) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);

    if ("data" in command) {
        commands.push(command.data.toJSON());
    } else {
        console.warn(`⚠️ ${file} は "data" を export していません。スキップします。`);
    }
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        console.log(`⏳ Discord にスラッシュコマンドを登録中…`);

        await rest.put(
            Routes.applicationCommands(CLIENT_ID), // ← グローバル
            { body: commands }
        );

        console.log("✅ スラッシュコマンド登録完了！");
    } catch (err) {
        console.error("❌ 登録中にエラー:", err);
    }
})();
