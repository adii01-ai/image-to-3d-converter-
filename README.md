# Image to 3D Converter

Upload an image → Neural4D generates a 3D model from it → the server
downloads the result locally → the browser shows it in a Three.js viewer
and lets you download the `.glb`.

## What was actually broken

- `services/neural4d.js` was a **0-byte empty file**.
- `routes/upload.js` required `../services/tripo`, a file that **doesn't
  exist** in this project — every request to `/upload` (and in some setups,
  every nodemon restart) crashed or 500'd because of this missing module.
- `public/app.js` uploaded the image and got `modelURL` back from the
  server, then just alerted "Image uploaded successfully!" and threw the
  result away — it never called `viewer.js`'s `loadModel()` or enabled the
  download button.
- `public/index.html` didn't have the `header` / `.left-panel` /
  `.right-panel` / `.viewer-card` wrapper elements that `style.css`
  expects, so the two-column layout never applied. The loading spinner
  also used class `spinner` while the CSS only defines `.loader`.

Every file below has been rewritten so they're consistent with each other.

## How it works now

```
Browser (app.js)
   │  POST /upload (FormData with the image)
   ▼
routes/upload.js
   │
   ├─► services/neural4d.js  → POSTs the raw image file to Neural4D's
   │                            /generateModelWithImage, then polls
   │                            /retrieveModel until codeStatus === 0
   └─► utils/download.js      → downloads the finished .glb into /models
   │
   ▼
{ success: true, modelURL: "/models/<uuid>.glb" }
   │
   ▼
public/viewer.js → loads the .glb into the Three.js scene
public/app.js     → enables the Download button
```

Neural4D's `/generateModelWithImage` endpoint takes the raw image file via
`multipart/form-data` directly — it does not accept a hosted URL — so this
version skips the Cloudinary upload step entirely for the 3D-generation
flow. `services/cloudinary.js` is left in the project untouched in case you
want it for something else later, but it isn't called by `/upload` anymore.

The server downloads the model to your own `/models` folder instead of
handing the browser Neural4D's temporary URL directly — those links can
expire, your own server's don't.

## Setup

```bash
npm install
```

Your `.env` needs:

```
PORT=3000
NEURAL4D_API_TOKEN=your_neural4d_token
```

Get `NEURAL4D_API_TOKEN` from the Neural4D website (Authorization: Bearer
token, per their API docs).

**Important — rotate your old keys:** the Tripo API key and Cloudinary
secret that were sitting in your old `.env` had already been pasted into a
chat at some point, so they should be treated as compromised. Regenerate
both in their dashboards if you still use either service, even though
neither is required for this Neural4D flow.

## Run

```bash
npm start
```

or, for auto-restart on file changes:

```bash
npm run dev
```

Open http://localhost:3000

## Notes

- Accepted formats: PNG, JPEG, WebP, up to 10MB (Neural4D's recommended
  limit).
- Generation time varies; the server polls Neural4D every 4s with a
  5-minute timeout, then downloads the resulting `.glb`.
- `services/neural4d.js` also exports `convertToFormat(uuid, { modelType,
  modelSize })` if you ever want to offer fbx/obj/stl/blend/usdz downloads
  instead of the default glb — it isn't wired into the UI yet.
- If `/upload` returns an error, check the terminal running the server —
  the real error message from Neural4D is logged there.
