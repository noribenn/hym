require("dotenv").config();
const http = require('http');
const querystring = require('querystring');
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// --- HTTPサーバー追加 (RenderのWebサービス判定用) ---
const PORT = process.env.PORT || 3000;
http.createServer(function (req, res) {
  if (req.method === 'POST') {
    let data = "";
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      const parsed = querystring.parse(data);
      if (parsed.type === "wake") {
        console.log("Woken up by external ping");
      }
      res.end();
    });
  } else if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Bot is running!\n");
  }
}).listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

// --- Bot起動・メッセージ応答 ---
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.content === "!ping") {
    message.reply("Pong!");
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
