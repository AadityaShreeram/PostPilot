# PostPilot 
Automated social media posting bot with WhatsApp-based workflow.  

## ✨ Features
- 📱 Send media + captions directly from WhatsApp  
- 🎬 Upload videos automatically to **YouTube (Shorts / Full videos)**  
- 🔑 Secure Google OAuth2 authentication & token refresh  
- 🧹 Automatic cleanup of uploaded media files  
- 📂 Simple config using `.env`  

## 🛠️ Tech Stack
- [Node.js](https://nodejs.org/)  
- [Baileys](https://github.com/WhiskeySockets/Baileys) – WhatsApp Web API  
- [Google APIs](https://www.npmjs.com/package/googleapis) – YouTube Data API  
- [dotenv](https://www.npmjs.com/package/dotenv) – Config management  

## 🚀 Getting Started

1️⃣ Clone the repo
```bash
git clone https://github.com/your-username/PostPilot.git
cd postpilot
```


2️⃣ Install dependencies
```bash
npm install
```

3️⃣ Setup environment variables

Create a .env file:

```env
SESSION_FOLDER=./auth
MEDIA_FOLDER=./media

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=your-redirect-uri
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
```

4️⃣ Run the bot

```bash
node index.js
```

Scan the QR code with your WhatsApp

Send a video/photo with caption + YouTube details

Example message:

```yaml
Caption: Have a great day!
Youtube: Yes
Youtube format: shorts
```

📂 Project Structure

```bash
postpilot/
├── handlers/        # WhatsApp message + media handlers
├── uploader/        # Upload logic (YouTube etc.)
├── utils/           # Utility helpers
├── index.js         # Entry point
├── config.js        # Config loader
└── README.md
```

📌 Roadmap

 Add Instagram, Facebook, Twitter upload

 Support scheduling posts

 Add database (SQLite/Postgres) for user sessions

 Web dashboard for analytics

🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to change.

📜 License

MIT License – free to use, modify, and share.
