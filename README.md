# AI Caption Studio

A web app that auto-generates word-level captions for any uploaded video using Google Gemini 1.5 Flash, lets you fine-tune wording and styling in a CapCut-style dark editor, then exports the final video with captions burned in via FFmpeg.

---

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind (deploy on Netlify)
- **Backend**: Python 3.11 + FastAPI + FFmpeg (deploy on Railway via Docker)
- **AI**: Google Gemini 1.5 Flash (audio → JSON word timestamps)
- **Storage**: Firebase Storage (no auth — fully public app)

---

## Local Setup

### 1. Get the API keys

- **Gemini**: create an API key at [Google AI Studio](https://aistudio.google.com/app/apikey).
- **Firebase**: create a project, enable Storage, then in **Project Settings → Web app** copy the `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
- In **Firebase Console → Storage → Rules** set: `allow read, write: if true;` (public app).

### 2. Backend

```bash
cd backend
cp .env.example .env
# fill GEMINI_API_KEY in .env
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend listens on `http://localhost:8000`.

> Local FFmpeg note: install FFmpeg system-wide so `ffmpeg-python` can call it.
> - Windows: `winget install Gyan.FFmpeg`
> - macOS:   `brew install ffmpeg`
> - Linux:   `sudo apt install ffmpeg`
>
> Local Arabic captions note: the Dockerfile installs `NotoSansArabic.ttf` to `/usr/share/fonts/`. Locally on Windows/macOS the service falls back to DejaVu, so Arabic glyphs may render incorrectly outside Docker. For full parity, run the backend via Docker.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# fill VITE_FIREBASE_* and keep VITE_BACKEND_URL=http://localhost:8000
npm install
npm run dev
```

UI runs on `http://localhost:5173`.

### 4. Use the app

1. Drop a video (MP4 / MOV / WEBM / AVI ≤ 200MB) on the home page.
2. Wait for upload + Gemini transcription.
3. Edit words (click a chip → type → Enter), tweak font / background / effects / position.
4. **Download SRT** for client-side subtitles, or **Export Video** to render the burned-in MP4.

---

## Deploy

### Backend on Railway (Docker)

1. `cd backend && railway login && railway init`
2. In the Railway project, set environment variables:
   - `GEMINI_API_KEY`
   - `FIREBASE_SERVICE_ACCOUNT_JSON` (optional — only if you later add server-side Firebase auth)
3. `railway up` — Railway auto-detects the `Dockerfile` and builds with FFmpeg + NotoSansArabic.
4. Copy the public Railway URL.

### Frontend on Netlify

1. Push the repo to GitHub.
2. Netlify → **Add new site → Import from GitHub**.
3. Build settings (auto-loaded from `frontend/netlify.toml`):
   - Base dir: `frontend`
   - Build command: `npm run build`
   - Publish dir: `dist`
4. **Site Settings → Environment Variables**: add every `VITE_FIREBASE_*` value and `VITE_BACKEND_URL` set to the Railway URL from above.
5. Deploy. Netlify domain `*.netlify.app` is already whitelisted by the backend CORS config.

---

## Project Layout

```
caption-studio/
├── backend/
│   ├── main.py                  FastAPI app + CORS + /health
│   ├── routes/
│   │   ├── transcribe.py        POST /api/transcribe
│   │   └── export_video.py      POST /api/export (FileResponse mp4)
│   ├── services/
│   │   ├── gemini_service.py    Gemini 1.5 Flash audio → words JSON
│   │   └── ffmpeg_service.py    extract_audio + burn_captions (drawtext)
│   ├── Dockerfile               python:3.11-slim + ffmpeg + NotoSansArabic
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          UploadZone, VideoPreview, CaptionEditor,
│   │   │                        StylePanel, ExportBar
│   │   ├── pages/               Home, Editor
│   │   ├── hooks/               useVideoUpload, useTranscription
│   │   ├── utils/               firebase, srtExport
│   │   ├── App.jsx + main.jsx
│   │   └── index.css            Tailwind + dark theme + custom scrollbar
│   ├── index.html               Google Fonts (DM Sans, Space Mono, ...)
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── netlify.toml
│   └── package.json
└── README.md
```

---

## Known Limitations

- **200MB upload cap** — required to fit Railway's 512MB RAM during FFmpeg burn-in.
- **Gemini timestamp accuracy** — Gemini 1.5 Flash returns word-level timings that are usually close but not frame-perfect; the in-editor word chips let you nudge wording, but the start/end times themselves come straight from the model.
- **No authentication** — anyone with the public URL can upload. Firebase Storage rules must be public for the app to work.
- **Mobile is not optimized** — the editor is desktop-only by design.
- **Local Arabic rendering** — outside Docker, the backend falls back to DejaVu and Arabic glyphs may look wrong; Docker / Railway use NotoSansArabic and render correctly.
