# YUKI CINE STUDIO — Video Analysis Update

## What changed
- Adds a dedicated “Đọc video” page to the existing iPhone PWA.
- Defaults to the existing Render API: `https://yuki-cine-studio.onrender.com`.
- Calls `GET /api/health` and `POST /api/analyze-video`.
- Sends the field names expected by the deployed Multi-Zero backend: `video`, `granularity`, `language`, `focus`, `extra`, `provider`.
- Displays the backend response schema: video summary, character bible, environment bible, scene timecodes, camera, action, lighting, audio, VI/EN prompts, master prompt, negative prompt and uncertainty notes.
- Increases service-worker cache version to v2.

## Deploy frontend to GitHub Pages
Replace the root `index.html`, `app.js`, `style.css`, `sw.js`, `manifest.webmanifest` and `icon.svg` in the existing repository with these files. Commit to `main` and wait for GitHub Pages to publish. Do not upload the `backend/` directory over the website root.

## Existing backend
The included `backend/` folder is the Multi-Zero Render backend package for reference/redeployment. If the Render service is already running this same API, no backend redeploy is required. Confirm `https://yuki-cine-studio.onrender.com/api/health` returns `ok: true` and `aiReady: true`.

## Test
Use a short MP4/MOV/WebM (ideally 5–15 seconds and under 10 MB for the first test). Open the app → Đọc video → choose file → confirm usage rights → Analyze. The analysis may take several minutes on a sleeping Render Free instance.
