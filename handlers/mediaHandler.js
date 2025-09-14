const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

async function handleMedia(sock, msg, sender, userMedia) {
  if (userMedia[sender]?.step !== "awaiting_media") return false;

  const mediaDir = path.join(__dirname, "../media");
  if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);

  let ext = ".bin";
  if (msg.message.imageMessage) {
    const mimetype = msg.message.imageMessage.mimetype || "";
    if (mimetype.includes("png")) ext = ".png";
    else if (mimetype.includes("jpeg")) ext = ".jpeg";
    else ext = ".jpg";
  } else if (msg.message.videoMessage) {
    const mimetype = msg.message.videoMessage.mimetype || "";
    if (mimetype.includes("quicktime")) ext = ".mov";
    else ext = ".mp4"; 
  }

  const mediaPath = path.join(mediaDir, `${Date.now()}${ext}`);

  try {
    const buffer = await downloadMediaMessage(
      msg,
      "buffer",
      {},
      { reuploadRequest: sock.updateMediaMessage }
    );
    fs.writeFileSync(mediaPath, buffer);

    userMedia[sender] = {
      step: "awaiting_details",
      mediaPath,
      chatId: msg.key.remoteJid,
    };

    await sock.sendMessage(msg.key.remoteJid, {
      text:
        `📝 Now send your caption and YouTube details in this format:\n\n` +
        `Caption: Your caption text here\n` +
        `Youtube: Yes\n` +
        `Youtube format: shorts/video`,
    });

    return true;
  } catch (err) {
    console.error("❌ Failed to handle media:", err);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Failed to process media. Please try again.",
    });
    delete userMedia[sender];
    return true;
  }
}

module.exports = { handleMedia };
