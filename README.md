# YUKI CINE STUDIO V5 Backend

This backend performs real frame-based video analysis. It is separate from GitHub Pages; static GitHub Pages cannot run FFmpeg or protect provider API keys.

## Requirements
- Node.js 20+
- FFmpeg + ffprobe (or use Dockerfile)
- A Gemini API key or OpenAI API key

## Run locally
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and fill one provider key.
4. `npm start`
5. Set `CORS_ORIGIN` to the exact GitHub Pages origin.

## Deploy
Deploy this folder as a Docker web service on a server that supports FFmpeg. Set environment variables in the hosting dashboard; never commit `.env`. The service must be HTTPS and reachable from the iPhone.

## Supported inputs
- Uploaded MP4/MOV/WebM file.
- Direct video file URL ending in a supported video extension.
- Social-platform share links are not scraped/downloaded. For YouTube, TikTok, Facebook and Xiaohongshu, download a copy you are authorized to use and upload it. This avoids bypassing login, DRM, platform controls or rights restrictions.

## Providers
- `AI_PROVIDER=gemini` with `GEMINI_API_KEY`.
- `AI_PROVIDER=openai` with `OPENAI_API_KEY`.
- `AI_PROVIDER=openai-compatible` with `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_COMPATIBLE_MODEL`.

V5.0 extracts representative frames with FFmpeg and asks the selected multimodal model to produce structured scene descriptions and per-scene prompts. It is not frame-perfect forensic reconstruction; movement between sampled frames and audio transcription require later modules.
