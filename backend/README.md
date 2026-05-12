---
title: Caption Studio API
emoji: 🎬
colorFrom: yellow
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Caption Studio API

FastAPI service that powers Caption Studio:

- `POST /api/upload-url` — generate Cloudflare R2 presigned PUT URL.
- `POST /api/transcribe` — download video, extract audio, transcribe via Gemini 2.5 Pro.
- `POST /api/export` — burn captions into the video with FFmpeg and stream the MP4 back.
- `GET  /health` — health probe.

## Required environment variables

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio key (required) |
| `GEMINI_API_KEYS` | Optional comma-separated fallback keys |
| `R2_ACCOUNT_ID` | Cloudflare R2 account id |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET` | R2 bucket name |
| `R2_PUBLIC_BASE_URL` | Public base URL for the bucket (e.g. `https://pub-xxx.r2.dev`) |
| `R2_UPLOAD_URL_EXPIRES_SECONDS` | Optional, default `900` |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs (e.g. `https://caption-studio.vercel.app`) |
| `ALLOWED_ORIGIN_REGEX` | Optional regex for preview deployments (default matches `*.vercel.app`) |

## Local development

```bash
python -m venv .venv
.venv\Scripts\activate         # Windows
# source .venv/bin/activate    # macOS / Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Requires FFmpeg installed on the host. The provided `Dockerfile` bundles FFmpeg
and an Arabic font (`NotoSansArabic.ttf`) for burn-in captions.
