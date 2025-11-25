// utils/jsonStore.js
import fs from "fs";
import path from "path";

const DATA_DIR = "./data";
const DB_FILE = path.join(DATA_DIR, "db.json");

// データ構造初期化
let db = {
    history: {},     // guildId → [{title,url,time}]
    soundHistory: {}, // guildId → [{url,time}]
    favorites: {}    // guildId → [url]
};

// =============================
// ディレクトリとファイル初期化
// =============================
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DB_FILE)) save();

// =============================
// 保存 / ロード
// =============================
export function save() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 4));
    } catch (err) {
        console.error("DB保存エラー:", err);
    }
}

export function load() {
    try {
        if (fs.existsSync(DB_FILE)) {
            db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        }
    } catch (err) {
        console.error("DBロードエラー:", err);
    }
}

// =============================
// 履歴関連
// =============================
export const jsonDB = {
    addHistory(guildId, item) {
        if (!db.history[guildId]) db.history[guildId] = [];
        db.history[guildId].push(item);
        if (db.history[guildId].length > 100) {
            db.history[guildId].splice(0, db.history[guildId].length - 100);
        }
        save();
    },

    getHistory(guildId) {
        return db.history[guildId] || [];
    },

    addSoundHistory(guildId, item) {
        if (!db.soundHistory[guildId]) db.soundHistory[guildId] = [];
        db.soundHistory[guildId].push(item);
        if (db.soundHistory[guildId].length > 100) {
            db.soundHistory[guildId].splice(0, db.soundHistory[guildId].length - 100);
        }
        save();
    },

    getSoundHistory(guildId) {
        return db.soundHistory[guildId] || [];
    },

    addFavorite(guildId, url) {
        if (!db.favorites[guildId]) db.favorites[guildId] = [];
        if (!db.favorites[guildId].includes(url)) db.favorites[guildId].push(url);
        save();
    },

    getFavorites(guildId) {
        return db.favorites[guildId] || [];
    },

    save,
    load,
    export() {
        return JSON.stringify(db, null, 4);
    }
};
