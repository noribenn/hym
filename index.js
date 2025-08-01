require("dotenv").config();
const http = require("http");
const querystring = require("querystring");
const { Client, GatewayIntentBits } = require("discord.js");
const Parser = require("rss-parser");
const parser = new Parser();

// --- Discordクライアント設定 ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- HTTPサーバー (RenderのPing用) ---
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    if (req.method === "POST") {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => {
        const parsed = querystring.parse(data);
        if (parsed.type === "wake") {
          console.log("Woken up by external ping");
        }
        res.end();
      });
    } else if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Bot is running!\n");
    }
  })
  .listen(PORT, () => {
    console.log(`HTTP server listening on port ${PORT}`);
  });

// --- ツイート監視用設定 ---
const TWITTER_RSS = "https://nitter.privacydev.net/elonmusk/rss"; // ←対象ユーザーを変更
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
let lastTweet = "";

// --- 定期的にRSSをチェックして新しいツイートがあれば送信 ---
async function checkTwitter() {
  try {
    const feed = await parser.parseURL(TWITTER_RSS);
    const latest = feed.items[0];

    if (latest && latest.link !== lastTweet) {
      lastTweet = latest.link;

      const channel = client.channels.cache.get(CHANNEL_ID);
      if (channel) {
        await channel.send(`🕊️ 新しいツイート:\n${latest.title}\n${latest.link}`);
      } else {
        console.warn("指定されたチャンネルが見つかりません");
      }
    }
  } catch (err) {
    console.error("RSS取得失敗:", err);
  }
}

// --- Bot起動時処理 ---
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

  // 初回チェック + 定期実行
  checkTwitter();
  setInterval(checkTwitter, 5 * 60 * 1000); // 5分ごと
});

// --- メッセージ応答機能 ---
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.content === "!ping") {
    message.reply("Pong!");
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
