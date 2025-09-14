const { uploadVideo } = require("./youtube");
const fs = require("fs");

async function uploadToPlatforms({ mediaPath, caption, platforms, formats }) {
  console.log("🔍 [uploadToPlatforms] Starting upload process...");
  console.log("🔍 Input Parameters:", { mediaPath, caption, platforms, formats });

  if (!mediaPath || !fs.existsSync(mediaPath)) {
    console.error("❌ [uploadToPlatforms] Media file is missing or does not exist:", mediaPath);
    throw new Error("Media file is missing or does not exist");
  }
  if (!caption) {
    console.error("❌ [uploadToPlatforms] Caption is missing");
    throw new Error("Caption is missing");
  }
  if (!platforms || typeof platforms !== "object") {
    console.error("❌ [uploadToPlatforms] Invalid platforms object:", platforms);
    throw new Error("Invalid platforms object");
  }
  if (!formats || typeof formats !== "object") {
    console.error("❌ [uploadToPlatforms] Invalid formats object:", formats);
    throw new Error("Invalid formats object");
  }

  const urls = {};

  try {
    if (platforms.youtube) {
      console.log("🔍 [uploadToPlatforms] Attempting YouTube upload...");
      const isShort = formats.youtube === "shorts";
      console.log("🔍 YouTube upload parameters:", {
        filePath: mediaPath,
        title: caption,
        description: caption,
        isShort,
        categoryId: "22",
      });

      const url = await uploadVideo({
        filePath: mediaPath,
        title: caption,
        description: caption,
        isShort,
        categoryId: "22", 
      });

      if (!url) {
        console.error("❌ [uploadToPlatforms] YouTube upload returned no URL");
        throw new Error("YouTube upload returned no URL");
      }

      console.log("🔍 [uploadToPlatforms] YouTube upload successful, URL:", url);
      urls.youtube = url;
    } else {
      console.log("🔍 [uploadToPlatforms] YouTube upload skipped (platforms.youtube is false)");
    }

    if (fs.existsSync(mediaPath)) {
      fs.unlinkSync(mediaPath);
      console.log("🧹 [uploadToPlatforms] Cleaned up local file:", mediaPath);
    }

  } catch (error) {
    console.error("❌ [uploadToPlatforms] Error during upload:", error.message);
    console.error("❌ [uploadToPlatforms] Stack trace:", error.stack);
    throw new Error(`Upload failed: ${error.message}`);
  }

  console.log("🔍 [uploadToPlatforms] Final URLs:", urls);
  return urls;
}

module.exports = { uploadToPlatforms };
