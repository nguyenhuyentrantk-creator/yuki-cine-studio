# YUKI CINE STUDIO – V3 Video Reverse Engineering

## What works
- Responsive mobile-first web app / PWA shell
- Local project creation and editing
- Storyboard scene cards and camera-move selections
- Vietnamese and English prompt templates
- Character reference profiles with Face Lock prompt rules
- Per-scene shot angle selection
- Motion Studio prompt add-ons
- Video Reverse Engineering workspace: YouTube / TikTok / Facebook / direct MP4 link intake
- Platform-aware preview where embedding is available; local video preview from iPhone
- Master prompt builder for detailed scene-by-scene reverse analysis
- Manual scene breakdown worksheet (timecode, action, camera, motion, look/audio, recreation prompt)
- Export analysis request JSON and save local analysis sheets
- Select local assets as project references (metadata only in this MVP)
- Export project JSON and storyboard TXT
- Basic offline app shell using a service worker

## Important limitations
- This is a pre-production MVP, not a video-generation engine.
- No MP4 render is performed and no AI video API is connected.
- The reverse-engineering module currently accepts links/files, previews supported sources, creates analysis instructions, and stores user-entered scene notes. It does NOT yet extract frames, transcribe audio, or run AI analysis automatically. That requires a secure backend, media processing pipeline, and AI provider connection.
- Platform links may be embeddable without being downloadable or analyzable. If a source blocks embedding/access, use a video file you own or are authorized to process. YouTube API policies restrict downloading/importing/caching audiovisual content without prior written approval.
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

## V3 deployment update
Replace these files in the GitHub repository root with the V3 versions: `index.html`, `app.js`, `style.css`, and `sw.js`. Commit the changes to the existing `main` branch. GitHub Pages will redeploy automatically.

## V4.1 – Xiaohongshu / RED source support
- Added source detection for xhslink.com short links, xiaohongshu.com, and xhs.cn.
- Added Xiaohongshu / RED to the source selector.
- Added an explicit fallback message: short-link resolution, login-gated playback, and video extraction are not implemented in the static PWA. If embedding is blocked, open the original post and upload a locally saved video file that you are authorized to use.
- Bumped the service-worker cache name so Safari can fetch the updated frontend assets.
