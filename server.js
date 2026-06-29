require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const uploadRoute = require("./routes/upload");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static("public"));
app.use("/models", express.static("models"));

// Make sure required folders exist
["uploads", "models"].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

// All upload + generation logic lives in routes/upload.js
app.use("/", uploadRoute);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/test", (req, res) => {
  res.json({ success: true, message: "Backend Working" });
});

// Generic error handler (catches multer errors like bad file type / too large,
// and anything else that calls next(err))
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({
    success: false,
    message: err.message || "Something went wrong"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  const token = process.env.NEURAL4D_API_TOKEN;
  if (token) {
    console.log(`✅ NEURAL4D_API_TOKEN loaded (${token.slice(0, 6)}...${token.slice(-4)})`);
  } else {
    console.log("❌ NEURAL4D_API_TOKEN is NOT loaded in this process — check your .env file and RESTART the server (Ctrl+C then npm start again).");
  }
});
