// utils/youtube.js
import ytSearch from "yt-search";
import ytdl from "@distube/ytdl-core";

/**
 * YouTube検索
 * @param {string} query - 検索キーワード
 * @returns {object|null} 最初の動画情報 (title, url, duration, etc.) または null
 */
export async function searchYouTube(query) {
    const search = await ytSearch(query);
    if (!search.videos.length) return null;
    return search.videos[0]; // 最初の動画を返す
}

/**
 * YouTube URLかどうかチェック
 * @param {string} url
 * @returns {boolean}
 */
export function validateYouTubeURL(url) {
    return ytdl.validateURL(url);
}

/**
 * YouTube動画の基本情報取得
 * @param {string} url - YouTube動画URL
 * @returns {Promise<object>} { title, url, lengthSeconds }
 */
export async function getVideoInfo(url) {
    if (!validateYouTubeURL(url)) return null;
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;
    return {
        title: videoDetails.title,
        url: videoDetails.video_url,
        lengthSeconds: parseInt(videoDetails.lengthSeconds, 10)
    };
}
