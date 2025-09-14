const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const readline = require("readline");
const ffmpeg = require("fluent-ffmpeg");
const config = require("../config"); // adjust path if needed
console.log("Google config loaded:", config.google);

// Scopes required to upload videos
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

// Token storage path
const TOKEN_PATH = path.join(__dirname, "../token.json");

// Validate Shorts video
async function validateShorts(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(new Error(`FFprobe error: ${err.message}`));
      const { width, height, duration } = metadata.streams.find(s => s.codec_type === "video") || {};
      if (!width || !height) return reject(new Error("Unable to detect video dimensions"));
      const aspectRatio = width / height;
      const isVerticalOrSquare = aspectRatio <= 1;
      if (duration > 60) return reject(new Error(`Video duration (${duration}s) exceeds 60 seconds for Shorts`));
      if (!isVerticalOrSquare) return reject(new Error(`Invalid aspect ratio (${aspectRatio}). Shorts require vertical (9:16) or square (1:1)`));
      resolve(true);
    });
  });
}

// Create OAuth2 client from config
function createOAuthClient() {
  const { clientId, clientSecret, redirectUri } = config.google;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google API credentials in config.js");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Load credentials and authorize client
async function authenticate() {
  try {
    const oAuth2Client = createOAuthClient();

    if (fs.existsSync(TOKEN_PATH)) {
      const tokenData = fs.readFileSync(TOKEN_PATH);
      const tokens = JSON.parse(tokenData);
      oAuth2Client.setCredentials(tokens);

      if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
        console.log("🔄 Refreshing expired YouTube token...");
        try {
          const { credentials: newTokens } = await oAuth2Client.refreshAccessToken();
          oAuth2Client.setCredentials(newTokens);
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(newTokens));
          console.log("✅ YouTube token refreshed");
        } catch (refreshError) {
          console.log("❌ Token refresh failed, need to re-authenticate");
          return await getNewToken(oAuth2Client);
        }
      }
      return oAuth2Client;
    }

    return await getNewToken(oAuth2Client);
  } catch (error) {
    console.error("❌ YouTube authentication error:", error.message);
    throw error;
  }
}

async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("\n🔐 YouTube Authorization Required:");
  console.log("1. Visit this URL:", authUrl);
  console.log("2. Complete the authorization");
  console.log("3. Copy the authorization code");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise((resolve) => {
    rl.question("\nPaste the authorization code here: ", (code) => {
      rl.close();
      resolve(code.trim());
    });
  });

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log("✅ YouTube token saved successfully");
    return oAuth2Client;
  } catch (error) {
    console.error("❌ Failed to get YouTube token:", error.message);
    throw error;
  }
}

async function uploadVideo({ filePath, title, description, isShort, categoryId = "22" }) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Video file not found: ${filePath}`);
    }

    if (isShort) await validateShorts(filePath);

    const stats = fs.statSync(filePath);
    console.log(`📹 Uploading video: ${path.basename(filePath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    const auth = await authenticate();
    const youtube = google.youtube({ version: "v3", auth });

    const tags = isShort ? ["shorts", "short"] : [];
    const finalDescription = isShort ? (description ? `${description}\n#shorts` : "#shorts") : (description || "");
    let finalTitle = title || "Untitled Video";
    if (isShort && !finalTitle.toLowerCase().includes("#shorts")) {
      finalTitle = `${finalTitle} #shorts`;
    }

    console.log("🚀 Starting YouTube upload...");

    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (err) => {
      throw new Error(`File stream error: ${err.message}`);
    });

    const res = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: { title: finalTitle, description: finalDescription, tags, categoryId },
        status: { privacyStatus: "public" },
      },
      media: { body: fileStream },
    }).catch((err) => {
      fileStream.destroy();
      throw err;
    });

    fileStream.destroy();

    if (!res.data.id) throw new Error("Upload completed but no video ID returned");

    const videoId = res.data.id;
    const url = isShort ? `https://www.youtube.com/shorts/${videoId}` : `https://www.youtube.com/watch?v=${videoId}`;

    console.log("✅ YouTube upload successful!");
    console.log("📺 Video URL:", url);

    return url;
  } catch (error) {
    console.error("❌ YouTube upload failed:", error.message);
    throw new Error(`YouTube upload failed: ${error.message}`);
  }
}

async function testAuth() {
  try {
    await authenticate();
    console.log("✅ YouTube authentication test successful");
    return true;
  } catch (error) {
    console.error("❌ YouTube authentication test failed:", error.message);
    return false;
  }
}

module.exports = { uploadVideo, testAuth };
