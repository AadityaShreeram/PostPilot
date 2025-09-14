const { google } = require("googleapis");
const fs = require("fs");
const readline = require("readline");
require("dotenv").config();

const TOKEN_PATH = "token.json";
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

async function getOAuthClient() {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect_uri = process.env.GOOGLE_REDIRECT_URI;

  if (!client_id || !client_secret || !redirect_uri) {
    throw new Error("❌ Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI in .env");
  }

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

  // Reuse existing token if available
  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    oAuth2Client.setCredentials(tokens);
    return oAuth2Client;
  }

  // Otherwise, request manual paste
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("🔑 Authorize this app by visiting this URL:");
  console.log(authUrl);

  // Wait for manual code entry
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question("Paste the authorization code here: ", async (code) => {
      rl.close();
      try {
        const { tokens } = await oAuth2Client.getToken(code);

        if (!tokens.refresh_token) {
          throw new Error("❌ No refresh token received. Ensure access_type=offline & prompt=consent.");
        }

        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log("✅ Refresh token saved to token.json");

        oAuth2Client.setCredentials(tokens);
        resolve(oAuth2Client);
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = { getOAuthClient };
