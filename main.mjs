// main.mjs - Discord Bot Main Program

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';

// Load environment variables
dotenv.config();

// === Discord Client ===
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // <-- MESSAGE CONTENT INTENT 必須
        GatewayIntentBits.GuildMembers
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember
    ]
});

// Bot Ready
client.once('ready', () => {
    console.log(`🎉 ${client.user.tag} が起動しました`);
    console.log(`📊 参加サーバー数: ${client.guilds.cache.size}`);
});

// Message Listener
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === 'ping') {
        message.reply('🏓 pong!');
        console.log(`📩 ${message.author.tag} の ping コマンド`);
    }
});

// Error Handling
client.on('error', (err) => {
    console.error('❌ Discord エラー:', err);
});

// Graceful Exit
process.on('SIGINT', () => {
    console.log('🛑 Bot を停止します...');
    client.destroy();
    process.exit(0);
});

// === Login ===
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN が設定されていません！');
    process.exit(1);
}

console.log('🔄 Discord に接続中...');
client.login(process.env.DISCORD_TOKEN)
    .catch(err => {
        console.error('❌ Discord ログイン失敗:', err);
        process.exit(1);
    });


// === Express Web Server (Render 用) ===
const app = express();
const port = process.env.PORT || 3000;

// Health Check
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Discord Bot Running 🤖',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.listen(port, () => {
    console.log(`🌐 Express サーバー起動: ポート ${port}`);
});
