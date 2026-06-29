const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { generateModelFromImage, waitForModel } = require("../services/neural4d");
const { downloadModel } = require("../utils/download");

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Neural4D's recommended max input size is 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPEG, and WebP images are allowed"));
    }
  }
});

router.post("/upload", upload.single("image"), async (req, res, next) => {
  let localImagePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    localImagePath = req.file.path;

    console.log("Sending image to Neural4D...");
    const generation = await generateModelFromImage(localImagePath, { modelCount: 1 });
    const uuid = generation.uuids[0];

    console.log("Waiting for Neural4D to finish generating:", uuid);
    const result = await waitForModel(uuid);

    console.log("Saving model locally...");
    const localModelUrl = await downloadModel(result.modelUrl, uuid);

    res.json({
      success: true,
      modelURL: localModelUrl,
      uuid,
      previewImageUrl: result.imageUrl
    });
  } catch (error) {
    console.error("Generation failed:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || "Generation failed"
    });
  } finally {
    if (localImagePath && fs.existsSync(localImagePath)) {
      fs.unlinkSync(localImagePath);
    }
  }
});

module.exports = router;
