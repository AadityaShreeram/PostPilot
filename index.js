require("dotenv").config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const P = require("pino");

const config = require("./config");
const { handleMessage } = require("./handlers/messageHandler");
const { handleMedia } = require("./handlers/mediaHandler");
const { getOAuthClient } = require("./utils/googleAuth");

const userMedia = {};

async function startBot() {
  console.log("Bot is starting...");

  const { state, saveCreds } = await useMultiFileAuthState(config.sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: "fatal" }),
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) console.log("📱 Scan this QR Code in WhatsApp:", qr);

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("❌ Connection closed. Reconnecting?", shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ WhatsApp bot is connected!");
    }
  });

  const youtubeAuth = await getOAuthClient();
  console.log("✅ Google OAuth is ready");

  sock.ev.on("messages.upsert", async ({ messages }) => {
    if (!messages || !messages[0]?.message) return;

    let msg = messages[0];

    if (msg.message?.ephemeralMessage?.message) {
      msg.message = msg.message.ephemeralMessage.message;
    }

    const sender = msg.key.participant || msg.key.remoteJid;

    if (msg.key.fromMe) return;

    if (await handleMessage(sock, msg, sender, userMedia)) return;

    if (
      msg.message?.imageMessage ||
      msg.message?.videoMessage ||
      msg.message?.documentMessage
    ) {
      if (await handleMedia(sock, msg, sender, userMedia)) return;
    }
  });
}

startBot();
