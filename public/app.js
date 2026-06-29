// Elements
const imageInput = document.getElementById("imageInput");
const uploadBtn = document.getElementById("uploadBtn");
const convertBtn = document.getElementById("convertBtn");

const previewImage = document.getElementById("previewImage");
const fileName = document.getElementById("fileName");

const loading = document.getElementById("loading");
const downloadBtn = document.getElementById("downloadBtn");

let selectedFile = null;

// =============================
// Select Image
// =============================

uploadBtn.addEventListener("click", () => {
    imageInput.click();
});

imageInput.addEventListener("change", () => {
    if (!imageInput.files.length) return;

    selectedFile = imageInput.files[0];

    fileName.textContent = selectedFile.name;

    previewImage.src = URL.createObjectURL(selectedFile);
    previewImage.style.display = "block";

    // Hide any previous result so it's clear a new conversion is needed
    downloadBtn.style.display = "none";
});

// =============================
// Upload + Convert
// =============================

convertBtn.addEventListener("click", async () => {
    if (!selectedFile) {
        alert("Please select an image first.");
        return;
    }

    loading.style.display = "block";
    downloadBtn.style.display = "none";
    convertBtn.disabled = true;

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        console.log(data);

        if (!data.success) {
            alert(data.message || "Upload failed.");
            return;
        }

        // Load the generated model into the Three.js viewer
        window.loadModel(data.modelURL);

        // Wire up the download button to the locally-saved .glb
        downloadBtn.href = data.modelURL;
        downloadBtn.style.display = "block";
    } catch (err) {
        console.error(err);
        alert("Server Error");
    } finally {
        loading.style.display = "none";
        convertBtn.disabled = false;
    }
});
