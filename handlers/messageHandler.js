const fs = require("fs");
const { uploadToPlatforms } = require("../uploader/index");

async function handleMessage(sock, msg, sender, userMedia) {
const rawText =
  msg.message?.conversation ||
  msg.message?.extendedTextMessage?.text ||
  "";
const text = rawText.trim();
if (!text) return false;

  // Step 1: User initiates posting
  if (text.toLowerCase() === "post content") {
    userMedia[sender] = { step: "awaiting_media" };
    await sock.sendMessage(msg.key.remoteJid, {
      text: "📎 Please upload an image or video file to continue.",
    });
    return true;
  }

  // Step 2: If awaiting caption & YouTube details
  if (userMedia[sender]?.step === "awaiting_details") {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    let caption = "";
    let youtube = { enabled: false, format: "shorts" };

    for (let line of lines) {
      if (line.toLowerCase().startsWith("caption:")) {
        caption = line.replace(/caption:/i, "").trim();
      }

      if (line.toLowerCase().startsWith("youtube:")) {
        const val = line.replace(/youtube:/i, "").trim().toLowerCase();
        youtube.enabled = val === "yes" || val === "y" || val === "true";
      }

      if (line.toLowerCase().startsWith("youtube format:")) {
        const fmt = line.replace(/youtube format:/i, "").trim().toLowerCase();
        if (["shorts", "video"].includes(fmt)) {
          youtube.format = fmt;
        }
      }
    }

    if (!caption) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠️ Please include a caption in your message (e.g., `Caption: My cool video`).",
      });
      return true;
    }

    if (!youtube.enabled) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠️ You must enable YouTube to proceed (add `Youtube: Yes`).",
      });
      return true;
    }

    // Save parsed data into state
    userMedia[sender] = {
      ...userMedia[sender],
      step: "ready_to_post",
      caption,
      youtube,
    };

    await sock.sendMessage(msg.key.remoteJid, {
      text: `✅ Got it!\n\n📄 Caption: *${caption}*\n📺 YouTube: Yes (${youtube.format})\n\nType *confirm* to post or *cancel* to discard.`,
    });

    return true;
  }

  // Step 3: Confirm posting
  if (userMedia[sender]?.step === "ready_to_post" && text.toLowerCase() === "confirm") {
    const { caption, youtube, mediaPath } = userMedia[sender];
    const chatId = msg.key.remoteJid;

    if (!mediaPath || !fs.existsSync(mediaPath)) {
      await sock.sendMessage(chatId, {
        text: "❌ Media file not found. Please start again with *post content*.",
      });
      delete userMedia[sender];
      return true;
    }

    await sock.sendMessage(chatId, {
      text: "🚀 Uploading to YouTube... This may take a moment.",
    });

    try {
      const urls = await uploadToPlatforms({
        mediaPath,
        caption,
        platforms: { youtube: true },
        formats: { youtube: youtube.format },
      });

      let reply = "✅ Upload complete!\n\n";
      if (urls.youtube) reply += `📺 YouTube: ${urls.youtube}\n`;

      await sock.sendMessage(chatId, { text: reply.trim() });
    } catch (err) {
      console.error("❌ Upload error:", err);
      await sock.sendMessage(chatId, {
        text: `❌ Upload failed: ${err.message || "Unknown error"}`,
      });
    } finally {
      // Reset state
      delete userMedia[sender];
    }

    return true;
  }

  // Step 4: Cancel posting
  if (userMedia[sender]?.step === "ready_to_post" && text.toLowerCase() === "cancel") {
    delete userMedia[sender];
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Upload canceled. Start again by typing *post content*.",
    });
    return true;
  }

  return false; 
}

module.exports = { handleMessage };
