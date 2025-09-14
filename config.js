require("dotenv").config();

module.exports = {
  sessionFolder: process.env.SESSION_FOLDER || "./auth",
  mediaFolder: process.env.MEDIA_FOLDER || "./media",
  projectId: process.env.GOOGLE_PROJECT_ID,
  authUri: process.env.GOOGLE_AUTH_URI,
  tokenUri: process.env.GOOGLE_TOKEN_URI,
  certUrl: process.env.GOOGLE_CERT_URL,
   google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
       redirectUri: process.env.GOOGLE_REDIRECT_URI
   }
};
