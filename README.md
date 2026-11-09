# YUKI CINE STUDIO – iPhone PWA MVP

## What works
- Responsive mobile-first web app / PWA shell
- Local project creation and editing
- Storyboard scene cards and camera-move selections
- Vietnamese and English prompt templates
- Character reference profiles with Face Lock prompt rules
- Per-scene shot angle selection
- Motion Studio prompt add-ons
- Select local assets as project references (metadata only in this MVP)
- Export project JSON and storyboard TXT
- Basic offline app shell using a service worker

## Important limitations
- This is a pre-production MVP, not a video-generation engine.
- No MP4 render is performed and no AI video API is connected.
- CineCode is designed to run in a computer/cloud worker environment with its own dependencies. iPhone Safari is the control panel, not the render host.
- For production: deploy a secure backend, store provider API keys server-side, add media object storage, job queue, and a remote CineCode worker with Node.js, Python, FFmpeg and Chromium.

## Deploy free using GitHub Pages
1. Create a GitHub repository and upload all files in this folder to the repository root.
2. In repository Settings → Pages, choose deploy from branch `main`, folder `/ (root)`.
3. Wait for GitHub Pages to provide the public HTTPS URL.
4. Open that URL in Safari on iPhone.
5. Tap Share → Add to Home Screen.
6. Open YUKI CINE from the home screen.

## Data
Projects and character profile metadata are stored in the current browser's localStorage. Uploaded reference images are not uploaded or embedded in the project yet. Export a JSON backup regularly. Clearing Safari website data may erase local projects.
