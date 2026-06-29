const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function downloadModel(modelUrl) {

    const fileName = `model-${Date.now()}.glb`;

    const filePath = path.join(__dirname, "..", "models", fileName);

    const response = await axios({

        url: modelUrl,

        method: "GET",

        responseType: "stream"

    });

    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {

        writer.on("finish", () => {

            resolve(`/models/${fileName}`);

        });

        writer.on("error", reject);

    });

}

module.exports = {
    downloadModel
};