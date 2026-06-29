const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a local image file to Cloudinary and returns a public HTTPS URL.
 * Tripo's API needs a publicly reachable URL — it can't see files on your disk.
 */
async function uploadImage(localImagePath) {
  const result = await cloudinary.uploader.upload(localImagePath, {
    folder: "image-to-3d"
  });

  return result.secure_url;
}

module.exports = { uploadImage };
