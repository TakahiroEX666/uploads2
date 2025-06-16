const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const upload = multer();

// 👇 เชื่อมต่อกับ Cloudflare R2 (API แบบ S3)
const s3 = new AWS.S3({
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.CF_ACCESS_KEY,
  secretAccessKey: process.env.CF_SECRET_KEY,
  signatureVersion: "v4",
  region: "auto"
});

const BUCKET_NAME = process.env.CF_BUCKET;

app.use(cors());
app.use(express.static("public")); // serve index.html

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "ไม่มีไฟล์" });

  const filename = `${Date.now()}_${req.file.originalname}`;

  try {
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: req.file.buffer,
        ACL: "public-read",
        ContentType: req.file.mimetype
      })
      .promise();

    //const publicUrl = `https://${BUCKET_NAME}.${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com/${filename}`;
    const publicUrl = `https://pub-bcd0954facce440ca60e0171468dafc9.r2.dev/${filename}`;
    
    res.json({ url: publicUrl });
  } catch (err) {
    console.error("❌ Upload to R2 failed:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
