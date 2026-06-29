const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const BASE_URL = "https://alb.neural4d.com:3000/api";

function getToken() {
  const token = process.env.NEURAL4D_API_TOKEN;
  if (!token) {
    throw new Error(
      "NEURAL4D_API_TOKEN is missing. Add it to your .env file (get it from the Neural4D website)."
    );
  }
  return token;
}

/**
 * Sends a local image file straight to Neural4D's image-to-3D endpoint.
 * Neural4D wants the raw file via multipart/form-data — it does NOT accept
 * a hosted URL for this endpoint — so there's no need to upload to
 * Cloudinary first.
 *
 * Docs: POST /api/generateModelWithImage
 */
async function generateModelFromImage(localImagePath, { modelCount = 1, disablePbr = 0 } = {}) {
  const form = new FormData();
  form.append("image", fs.createReadStream(localImagePath));
  form.append("modelCount", String(modelCount));
  form.append("disablePbr", String(disablePbr));

  let data;
  try {
    const response = await axios.post(`${BASE_URL}/generateModelWithImage`, form, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        ...form.getHeaders()
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    data = response.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to reach Neural4D (generateModelWithImage)"
    );
  }

  if (!data?.uuids?.length) {
    throw new Error(data?.message || "Neural4D did not return any model UUIDs");
  }

  return data; // { type, message, uuids: [...], uploadedImageUrl }
}

/**
 * Docs: POST /api/retrieveModel
 * codeStatus: 0 = done, 1 = still generating, -1 = bad/expired token,
 *             -2 = uuid not found, -3 = generation failed
 */
async function retrieveModel(uuid) {
  let data;
  try {
    const response = await axios.post(
      `${BASE_URL}/retrieveModel`,
      { uuid },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json;charset=utf-8"
        }
      }
    );
    data = response.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to reach Neural4D (retrieveModel)"
    );
  }

  return data;
}

const FAILURE_MESSAGES = {
  "-1": "Your Neural4D token is invalid or expired",
  "-2": "Neural4D could not find a model for that UUID",
  "-3": "Neural4D failed to generate the model"
};

/**
 * Polls /retrieveModel until the model is ready (codeStatus === 0),
 * fails (codeStatus < 0), or we hit the timeout.
 */
async function waitForModel(uuid, { intervalMs = 4000, timeoutMs = 5 * 60 * 1000 } = {}) {
  const startedAt = Date.now();

  while (true) {
    const result = await retrieveModel(uuid);

    if (result.codeStatus === 0) {
      return result; // { modelUrl, imageUrl, prompts, createdAt, sourcePage, ... }
    }

    if (result.codeStatus < 0) {
      const key = String(result.codeStatus);
      throw new Error(FAILURE_MESSAGES[key] || result.message || "Model generation failed");
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Timed out waiting for Neural4D to finish generating the model");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/**
 * Optional: convert/download the model in a non-default format
 * (glb is already returned by retrieveModel, so this is only needed
 * if you want fbx/obj/stl/blend/usdz).
 * Docs: POST /api/convertToFormat
 */
async function convertToFormat(uuid, { modelType = "glb", modelSize = 2 } = {}) {
  let data;
  try {
    const response = await axios.post(
      `${BASE_URL}/convertToFormat`,
      { uuid, modelType, modelSize },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json;charset=utf-8"
        }
      }
    );
    data = response.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to reach Neural4D (convertToFormat)"
    );
  }

  return data; // { statusType, modelUrl, message }
}

module.exports = {
  generateModelFromImage,
  retrieveModel,
  waitForModel,
  convertToFormat
};
