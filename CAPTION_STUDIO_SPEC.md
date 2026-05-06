# AI Caption Studio — Master Project Spec

## What We're Building
A web app where users upload a video with audio → Gemini AI auto-generates captions with timestamps → user edits captions word-by-word and customizes styling → exports the final video with captions burned in (MP4) + SRT file download.

## Tech Stack (Non-negotiable)
- **Frontend**: React 18 + Vite + Tailwind CSS → Deploy on **Netlify**
- **Backend**: Python 3.11 + FastAPI → Deploy on **Railway** via Docker
- **Transcription**: Google Gemini 1.5 Flash API (audio sent directly as base64)
- **Video Processing**: FFmpeg (burn-in captions + extract audio)
- **Storage**: Firebase Storage (video upload/download)
- **No authentication** — fully public app

---

## Folder Structure (Create Exactly This)

```
caption-studio/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadZone.jsx
│   │   │   ├── VideoPreview.jsx
│   │   │   ├── CaptionEditor.jsx
│   │   │   ├── StylePanel.jsx
│   │   │   └── ExportBar.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── Editor.jsx
│   │   ├── hooks/
│   │   │   ├── useVideoUpload.js
│   │   │   └── useTranscription.js
│   │   ├── utils/
│   │   │   ├── firebase.js
│   │   │   └── srtExport.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── netlify.toml
│   └── package.json
├── backend/
│   ├── main.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── transcribe.py
│   │   └── export_video.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── gemini_service.py
│   │   └── ffmpeg_service.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

---

## Environment Variables

### frontend/.env.local
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_BACKEND_URL=http://localhost:8000
```

### backend/.env
```
GEMINI_API_KEY=your_gemini_key
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
MAX_VIDEO_MB=200
PORT=8000
```

---

## Complete File Specifications

### `backend/requirements.txt`
```
fastapi==0.111.0
uvicorn==0.30.1
python-multipart==0.0.9
httpx==0.27.0
google-generativeai==0.7.2
firebase-admin==6.5.0
ffmpeg-python==0.2.0
python-dotenv==1.0.1
aiofiles==23.2.1
```

### `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y ffmpeg fonts-noto-cjk wget && \
    wget -q https://github.com/google/fonts/raw/main/ofl/notosansarabic/NotoSansArabic%5Bwdth%2Cwght%5D.ttf \
    -O /usr/share/fonts/NotoSansArabic.ttf && \
    fc-cache -f && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### `backend/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes import transcribe, export_video
import os

load_dotenv()

app = FastAPI(title="Caption Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "https://*.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcribe.router, prefix="/api")
app.include_router(export_video.router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok"}
```

### `backend/services/gemini_service.py`
```python
import google.generativeai as genai
import os, base64, json, re
from fastapi import HTTPException

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def transcribe_audio(audio_path: str) -> list[dict]:
    """
    Send audio to Gemini 1.5 Flash.
    Returns list of: {id, word, start, end}
    """
    with open(audio_path, "rb") as f:
        audio_data = base64.b64encode(f.read()).decode("utf-8")

    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = """Transcribe this audio exactly.
Return ONLY a valid JSON array — no markdown, no explanation, nothing else.
Format: [{"word": "hello", "start": 0.0, "end": 0.5}, ...]
Every word must have start and end time in seconds as floats.
If you cannot determine exact timestamps, distribute them evenly across the audio duration."""

    response = model.generate_content([
        {"mime_type": "audio/mp3", "data": audio_data},
        prompt
    ])

    text = response.text.strip()
    # Strip markdown code fences if present
    text = re.sub(r"```json|```", "", text).strip()

    try:
        words = json.loads(text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"Gemini returned invalid JSON: {text[:200]}")

    # Add sequential IDs
    return [{"id": str(i), "word": w["word"], "start": float(w["start"]), "end": float(w["end"])}
            for i, w in enumerate(words)]
```

### `backend/services/ffmpeg_service.py`
```python
import ffmpeg, os, uuid, tempfile
from fastapi import HTTPException

FONT_PATH = "/usr/share/fonts/NotoSansArabic.ttf"
FALLBACK_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def extract_audio(video_path: str, output_dir: str) -> str:
    """Extract audio from video as MP3."""
    audio_path = os.path.join(output_dir, f"{uuid.uuid4()}.mp3")
    try:
        (
            ffmpeg
            .input(video_path)
            .output(audio_path, acodec="mp3", ab="128k", ac=1, ar="16000")
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
    except ffmpeg.Error as e:
        raise HTTPException(status_code=500, detail=f"FFmpeg audio extraction failed: {e.stderr.decode()}")
    return audio_path

def burn_captions(video_path: str, captions: list[dict], style: dict, output_dir: str) -> str:
    """
    Burn captions into video using FFmpeg drawtext filter.
    captions: [{word, start, end}]
    style: {fontsize, color, bg_color, bg_opacity, shadow, position, font}
    """
    output_path = os.path.join(output_dir, f"output_{uuid.uuid4()}.mp4")

    font_path = FONT_PATH if os.path.exists(FONT_PATH) else FALLBACK_FONT

    pos_map = {
        "bottom-center": ("(w-text_w)/2", "h-th-40"),
        "top-center":    ("(w-text_w)/2", "40"),
        "center":        ("(w-text_w)/2", "(h-text_h)/2"),
        "bottom-left":   ("40", "h-th-40"),
        "bottom-right":  ("w-tw-40", "h-th-40"),
    }
    x, y = pos_map.get(style.get("position", "bottom-center"), ("(w-text_w)/2", "h-th-40"))

    fontsize   = style.get("fontsize", 28)
    color      = style.get("color", "white").replace("#", "")
    shadow     = style.get("shadow", 2)
    bg_color   = style.get("bg_color", "black").replace("#", "")
    bg_opacity = style.get("bg_opacity", 0.6)

    # Build drawtext filter for each word
    filters = []
    for cap in captions:
        word = cap["word"].replace("'", "\\'").replace(":", "\\:")
        start = cap["start"]
        end   = cap["end"]

        drawtext = (
            f"drawtext=fontfile='{font_path}'"
            f":text='{word}'"
            f":fontsize={fontsize}"
            f":fontcolor={color}"
            f":x={x}:y={y}"
            f":shadowcolor=black:shadowx={shadow}:shadowy={shadow}"
            f":box=1:boxcolor={bg_color}@{bg_opacity}:boxborderw=8"
            f":enable='between(t,{start},{end})'"
        )
        filters.append(drawtext)

    vf = ",".join(filters)

    try:
        (
            ffmpeg
            .input(video_path)
            .output(output_path, vf=vf, acodec="copy", vcodec="libx264", crf=23)
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
    except ffmpeg.Error as e:
        raise HTTPException(status_code=500, detail=f"FFmpeg burn-in failed: {e.stderr.decode()}")

    return output_path
```

### `backend/routes/transcribe.py`
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx, tempfile, os
from services.gemini_service import transcribe_audio
from services.ffmpeg_service import extract_audio

router = APIRouter()

class TranscribeRequest(BaseModel):
    video_url: str  # Firebase Storage download URL

@router.post("/transcribe")
async def transcribe(req: TranscribeRequest):
    with tempfile.TemporaryDirectory() as tmpdir:
        # Download video
        video_path = os.path.join(tmpdir, "input.mp4")
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.get(req.video_url)
            if r.status_code != 200:
                raise HTTPException(status_code=400, detail="Could not download video from Firebase")
            with open(video_path, "wb") as f:
                f.write(r.content)

        # Extract audio
        audio_path = extract_audio(video_path, tmpdir)

        # Transcribe
        words = await transcribe_audio(audio_path)

    return {"words": words}
```

### `backend/routes/export_video.py`
```python
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import httpx, tempfile, os, asyncio
from services.ffmpeg_service import burn_captions

router = APIRouter()

# Keep temp dir alive until file is sent
_active_exports: dict[str, str] = {}

class Caption(BaseModel):
    id: str
    word: str
    start: float
    end: float

class StyleOptions(BaseModel):
    fontsize: int = 28
    color: str = "white"
    bg_color: str = "black"
    bg_opacity: float = 0.6
    shadow: int = 2
    position: str = "bottom-center"

class ExportRequest(BaseModel):
    video_url: str
    captions: list[Caption]
    style: StyleOptions

@router.post("/export")
async def export(req: ExportRequest):
    tmpdir = tempfile.mkdtemp()
    try:
        video_path = os.path.join(tmpdir, "input.mp4")
        async with httpx.AsyncClient(timeout=180) as client:
            r = await client.get(req.video_url)
            if r.status_code != 200:
                raise HTTPException(status_code=400, detail="Could not download video")
            with open(video_path, "wb") as f:
                f.write(r.content)

        captions_dicts = [c.dict() for c in req.captions]
        style_dict = req.style.dict()

        output_path = burn_captions(video_path, captions_dicts, style_dict, tmpdir)

        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename="captioned_video.mp4",
            background=None
        )
    except Exception as e:
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)
        raise e
```

---

### `frontend/netlify.toml`
```toml
[build]
  base    = "frontend"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

### `frontend/vite.config.js`
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})
```

### `frontend/src/utils/firebase.js`
```js
import { initializeApp } from "firebase/app"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const storage = getStorage(app)
```

### `frontend/src/utils/srtExport.js`
```js
function toSrtTime(seconds) {
  const d = new Date(seconds * 1000)
  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0")
  const mm = String(d.getUTCMinutes()).padStart(2, "0")
  const ss = String(d.getUTCSeconds()).padStart(2, "0")
  const ms = String(d.getUTCMilliseconds()).padStart(3, "0")
  return `${hh}:${mm}:${ss},${ms}`
}

export function generateSRT(words) {
  return words
    .map((w, i) => `${i + 1}\n${toSrtTime(w.start)} --> ${toSrtTime(w.end)}\n${w.word}\n`)
    .join("\n")
}

export function downloadSRT(words, filename = "captions.srt") {
  const content = generateSRT(words)
  const blob = new Blob([content], { type: "text/plain" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

### `frontend/src/hooks/useVideoUpload.js`
```js
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { storage } from "../utils/firebase"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"

export function useVideoUpload() {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError]   = useState(null)

  const MAX_MB = 200
  const ALLOWED = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"]

  async function upload(file) {
    setError(null)
    if (!ALLOWED.includes(file.type)) { setError("Unsupported format. Use MP4, MOV, WEBM or AVI."); return null }
    if (file.size > MAX_MB * 1024 * 1024) { setError(`File too large. Max ${MAX_MB}MB.`); return null }

    setUploading(true)
    const storageRef = ref(storage, `videos/${uuidv4()}_${file.name}`)
    const task = uploadBytesResumable(storageRef, file)

    return new Promise((resolve, reject) => {
      task.on(
        "state_changed",
        snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        err  => { setError(err.message); setUploading(false); reject(err) },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref)
          setUploading(false)
          setProgress(100)
          resolve(url)
        }
      )
    })
  }

  return { upload, progress, uploading, error }
}
```

### `frontend/src/hooks/useTranscription.js`
```js
import { useState } from "react"

const BACKEND = import.meta.env.VITE_BACKEND_URL

export function useTranscription() {
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  async function transcribe(videoUrl) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND}/api/transcribe`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ video_url: videoUrl }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || "Transcription failed")
      }
      const data = await res.json()
      return data.words   // [{id, word, start, end}]
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { transcribe, loading, error }
}
```

---

## UI Design Specification

### Visual Language
- **Theme**: Dark editor, like CapCut / DaVinci Resolve
- **Background**: `#0F0F13` (near-black)
- **Surface**: `#1A1A24`
- **Accent**: `#7C6EFA` (purple)
- **Font**: `DM Sans` for UI, `Space Mono` for timestamps
- **Vibe**: Professional, focused, tool-like — not a landing page

### Pages

#### Home Page (`/`)
- Full-screen centered upload area
- Large dashed drop zone, drag-and-drop + click to browse
- Animated gradient border on hover
- Progress bar appears during upload, then transitions to transcription loading state
- After transcription complete → navigate to `/editor`

#### Editor Page (`/editor`)
Layout: **Two-column** (flex row, full height)

**Left column** (flex: 2):
- Video player (HTML5 `<video>`) — dark background, rounded corners
- Caption overlay as absolutely positioned div over video — updates live as video plays
- Below video: word chips in a flex-wrap grid
  - Each chip shows `word` + timestamp below in monospace
  - Active word (currently playing): highlighted purple
  - Selected word (clicked for edit): white border
  - Clicking a chip: pauses video, opens inline edit row below the grid
  - Inline edit row: text input to change word, delete button, + add word button

**Right column** (flex: 1, 340px):
- Panel with 4 tabs: **Font / Background / Effects / Position**
- **Font tab**: font family select (Cairo, Noto Arabic, Poppins, Bebas Neue), size slider (12–72px), text color picker (6 swatches + custom)
- **Background tab**: bg color swatch + opacity slider, toggle on/off
- **Effects tab**: shadow size slider (0–10px), outline/stroke toggle + color
- **Position tab**: 3x3 grid of position buttons (9 positions)
- Bottom of panel: always-visible **Export Bar**
  - "Download SRT" button (ghost)
  - "Export Video" primary button → calls `/api/export`, shows loading spinner, then triggers file download

### Component: `CaptionEditor.jsx`
```
Props:
  words: [{id, word, start, end}]
  currentTime: number  (from video player)
  onEdit: (id, newWord) => void
  onDelete: (id) => void
  onAddAfter: (id) => void

Active word = words.find(w => currentTime >= w.start && currentTime <= w.end)
Selected word = state (click to set)
```

### Component: `StylePanel.jsx`
```
Props:
  style: {fontsize, color, bg_color, bg_opacity, shadow, position, fontFamily}
  onChange: (newStyle) => void

Manages all caption styling. Changes update preview instantly.
```

### Component: `VideoPreview.jsx`
```
Props:
  videoUrl: string
  words: [{id, word, start, end}]
  style: object
  onTimeUpdate: (currentTime) => void

Renders <video> + overlaid <div> caption that syncs with video.currentTime.
Caption text = word(s) active at currentTime.
```

### Component: `ExportBar.jsx`
```
Props:
  words: [{id, word, start, end}]
  videoUrl: string
  style: object

Handles both SRT download (client-side) and video export (API call + file download).
Shows spinner + "Processing..." during export.
Disables button during processing.
```

---

## API Contract

### POST /api/transcribe
```
Request:  { "video_url": "https://firebasestorage..." }
Response: { "words": [{ "id": "0", "word": "hello", "start": 0.0, "end": 0.5 }] }
Error:    { "detail": "error message" }
```

### POST /api/export
```
Request: {
  "video_url": "https://firebasestorage...",
  "captions": [{ "id": "0", "word": "hello", "start": 0.0, "end": 0.5 }],
  "style": {
    "fontsize": 28,
    "color": "white",
    "bg_color": "black",
    "bg_opacity": 0.6,
    "shadow": 2,
    "position": "bottom-center"
  }
}
Response: video/mp4 binary stream (FileResponse)
```

---

## Error Handling Rules
- Every async function: try/catch with user-visible error message
- Upload errors: show inline below drop zone
- Transcription errors: show retry button
- Export errors: show error toast, re-enable export button
- Network timeout: httpx timeout=180s on backend, show "This may take a minute..." on frontend

## Known Issues & Solutions

| Issue | Solution |
|---|---|
| Gemini returns markdown instead of JSON | Strip ```json fences with regex before JSON.parse |
| Arabic text shows ??? in FFmpeg | Dockerfile installs NotoSansArabic.ttf + fc-cache |
| CORS error from Netlify | main.py allows `https://*.netlify.app` |
| Firebase Storage 403 | Set rules: `allow read, write: if true` in Firebase Console |
| Railway 512MB RAM limit | Enforce 200MB video limit + use `-vf scale=1280:-2` in FFmpeg |
| Video export takes long | Show animated progress state, don't timeout under 3 minutes |

---

## Deploy Checklist

### Netlify (Frontend)
1. Push repo to GitHub
2. New Site → Import from GitHub
3. Base dir: `frontend`, build: `npm run build`, publish: `dist`
4. Site Settings → Environment Variables → add all `VITE_*` vars
5. After Railway deploy, update `VITE_BACKEND_URL` to Railway URL

### Railway (Backend)
1. `railway login` → `railway init` in `backend/` folder
2. Add env vars: `GEMINI_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`
3. `railway up` — Railway auto-detects Dockerfile
4. Copy the generated Railway URL → paste into Netlify `VITE_BACKEND_URL`
