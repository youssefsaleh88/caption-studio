You are an expert full-stack developer. Your task is to build "AI Caption Studio" — a complete, production-ready web application — from scratch, with zero placeholders and zero TODOs. Every file must be fully implemented and working.

Read the full specification in `CAPTION_STUDIO_SPEC.md` before writing a single line of code.

---

## YOUR MISSION

Build the entire project as specified. When you are done, the user must be able to:
1. Run `cd backend && uvicorn main:app --reload` and have a working API
2. Run `cd frontend && npm run dev` and have a working UI
3. Upload a video, get captions, edit them, and export the final video

---

## EXECUTION ORDER — Follow This Exactly

### STEP 1 — Create the folder structure
Create every folder and every file listed in CAPTION_STUDIO_SPEC.md. Start with empty files, then fill them in the steps below.

### STEP 2 — Backend (do all 5 before touching frontend)

**2a. `backend/requirements.txt`**
Copy exactly from the spec.

**2b. `backend/Dockerfile`**
Copy exactly from the spec. The Dockerfile MUST install ffmpeg AND NotoSansArabic font. Do not skip the font installation.

**2c. `backend/services/ffmpeg_service.py`**
Implement `extract_audio()` and `burn_captions()` exactly as specified.
- `extract_audio`: uses ffmpeg-python to extract MP3 audio, 16kHz mono
- `burn_captions`: builds FFmpeg `drawtext` filter chain, one filter per word with `enable='between(t,start,end)'`
- Font path: `/usr/share/fonts/NotoSansArabic.ttf` with fallback to DejaVu

**2d. `backend/services/gemini_service.py`**
Implement `transcribe_audio()` exactly as specified.
- Read audio file as base64
- Send to `gemini-1.5-flash` with the exact JSON prompt from the spec
- Strip markdown code fences before parsing
- Return list of `{id, word, start, end}`
- Raise HTTPException on any failure

**2e. `backend/routes/transcribe.py` and `backend/routes/export_video.py`**
Implement both routes exactly as specified.
- `POST /api/transcribe`: download video from Firebase URL → extract audio → transcribe → return words
- `POST /api/export`: download video → burn captions → return FileResponse (MP4)

**2f. `backend/main.py`**
Setup FastAPI with CORS (allow localhost:5173 AND *.netlify.app), include both routers.

### STEP 3 — Frontend utilities and hooks

**3a. `frontend/src/utils/firebase.js`**
Initialize Firebase app from VITE_ env vars. Export `storage`.

**3b. `frontend/src/utils/srtExport.js`**
Implement `generateSRT(words)` and `downloadSRT(words)` exactly as specified.

**3c. `frontend/src/hooks/useVideoUpload.js`**
Implement exactly as specified. Must: validate file type and size, use `uploadBytesResumable` for progress tracking, return `{upload, progress, uploading, error}`.

**3d. `frontend/src/hooks/useTranscription.js`**
Implement exactly as specified. POST to `VITE_BACKEND_URL/api/transcribe`, return words array.

### STEP 4 — Frontend components

**4a. `frontend/src/components/UploadZone.jsx`**
- Full-screen centered layout on Home page
- Large dashed drop zone, supports drag-and-drop AND click-to-browse
- File input accept="video/mp4,video/quicktime,video/webm,.avi"
- On file select: call `upload()` from `useVideoUpload`
- Show animated progress bar during upload (0-100%)
- Show "Analyzing audio with Gemini AI..." loading state during transcription
- On complete: navigate to `/editor` passing `{videoUrl, words}` via router state
- Show inline error message if upload or transcription fails
- Design: dark theme, `#0F0F13` background, purple accent `#7C6EFA`, `DM Sans` font from Google Fonts

**4b. `frontend/src/components/VideoPreview.jsx`**
- Renders `<video>` element with the uploaded video URL
- Has an absolutely positioned `<div>` overlay for captions
- On `timeupdate` event: find the active word(s) at `video.currentTime`
- Display active word text in the overlay div, styled by the `style` prop
- Caption position mapped from style.position to CSS (bottom-center = bottom:40px, centered, etc.)
- Apply fontsize, color, bg_color+opacity, shadow from style prop
- Call `onTimeUpdate(currentTime)` on every timeupdate

**4c. `frontend/src/components/CaptionEditor.jsx`**
- Renders a flex-wrap grid of word chips
- Each chip: word text on top, timestamp in `Space Mono` monospace below (e.g. "1.2s")
- Active chip (currentTime is within word's start-end): purple background `#7C6EFA`
- Selected chip (user clicked it): white border, slightly larger
- Clicking a chip: set it as selected AND pause the video (call `onWordClick(id)`)
- Below the grid, when a word is selected: show an inline edit bar with:
  - Text input pre-filled with the word
  - Confirm button (checkmark) → calls `onEdit(id, newWord)`
  - Delete button (trash icon) → calls `onDelete(id)`
  - "Add word after" button (plus icon) → calls `onAddAfter(id)`
- Keyboard: Enter confirms edit, Escape cancels

**4d. `frontend/src/components/StylePanel.jsx`**
- 4 tabs: Font, Background, Effects, Position
- **Font tab**:
  - Font family `<select>`: Cairo, Noto Sans Arabic, Poppins, Bebas Neue, Space Mono
  - Font size slider: 12–72, shows current value
  - Text color: 6 preset swatches (white, yellow #FFD700, cyan #00FFFF, red #FF4444, black #000000, purple #7C6EFA) + `<input type="color">` for custom
- **Background tab**:
  - Toggle checkbox "Show background"
  - Background color: 5 swatches + custom color input
  - Opacity slider: 0–1, step 0.05, shows percentage
- **Effects tab**:
  - Shadow size slider: 0–10px
  - Outline toggle + outline color swatch row
- **Position tab**:
  - 3×3 grid of buttons with arrow symbols (↖ ↑ ↗ / ← · → / ↙ ↓ ↘)
  - Maps to: top-left, top-center, top-right, middle-left, center, middle-right, bottom-left, bottom-center, bottom-right
  - Active position highlighted in purple
- All changes call `onChange(newStyle)` immediately

**4e. `frontend/src/components/ExportBar.jsx`**
- Fixed at the bottom of the right panel
- "Download SRT" button: calls `downloadSRT(words)` from srtExport utils
- "Export Video" button (purple, full width):
  - On click: POST to `VITE_BACKEND_URL/api/export` with `{video_url, captions: words, style}`
  - During processing: show spinner + "Processing video..." text, disable button
  - On success: trigger file download of the returned MP4 blob
  - On error: show error toast for 4 seconds, re-enable button

### STEP 5 — Pages

**5a. `frontend/src/pages/Home.jsx`**
- Renders `<UploadZone>` centered on a full-height dark page
- Tagline: "Add captions to any video in seconds"
- Subtitle: "Powered by Gemini AI"

**5b. `frontend/src/pages/Editor.jsx`**
- Reads `videoUrl` and `words` from `useLocation().state`
- If no state: redirect to `/`
- State: `words` (editable array), `style` object (default values), `currentTime` number, `selectedWordId`
- Layout: full-height flex row
  - Left side (flex 2): `<VideoPreview>` on top (takes ~55% of left height) + `<CaptionEditor>` below (scrollable)
  - Right side (340px fixed): `<StylePanel>` + `<ExportBar>` at bottom
- Word edit handlers: update `words` state immutably
- `onAddAfter(id)`: inserts a new word `{id: uuid, word: "...", start: selectedWord.end, end: selectedWord.end + 0.5}` after the selected word

### STEP 6 — App shell

**`frontend/src/App.jsx`**
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Editor from './pages/Editor'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  )
}
```

**`frontend/src/main.jsx`**
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
```

**`frontend/index.html`**
Standard Vite template with:
- `<title>AI Caption Studio</title>`
- Google Fonts link for `DM Sans` (weights 400, 500, 600) and `Space Mono` (400)
- `<div id="root"></div>`

**`frontend/package.json`**
```json
{
  "name": "caption-studio-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.0",
    "firebase": "^10.12.2",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.3.1",
    "tailwindcss": "^3.4.4",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38"
  }
}
```

**`frontend/tailwind.config.js`**
```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: { DEFAULT: "#0F0F13", surface: "#1A1A24", elevated: "#24243A" },
        accent: { DEFAULT: "#7C6EFA", hover: "#9585FB", muted: "#3D3580" },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
```

**`frontend/postcss.config.js`**
```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} }
}
```

**`frontend/src/index.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0F0F13; color: #E8E8F0; font-family: "DM Sans", sans-serif; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0F0F13; }
::-webkit-scrollbar-thumb { background: #3D3580; border-radius: 3px; }
```

---

## QUALITY RULES — Non-negotiable

1. **No placeholder text** — every component renders real, working UI
2. **No empty catch blocks** — every error must update error state or throw
3. **No hardcoded API URLs** — always use `import.meta.env.VITE_BACKEND_URL`
4. **No inline styles that override Tailwind classes** unless absolutely necessary for dynamic values (caption position, color, fontsize from style state)
5. **All async functions must have try/catch**
6. **The video caption overlay must update in real-time** as the video plays — this is the core feature
7. **The word chip grid must scroll** if there are many words — use `overflow-y-auto` with a max-height
8. **After export, the file must automatically download** — use a hidden `<a>` element with blob URL
9. **Dark theme everywhere** — no white backgrounds anywhere in the Editor
10. **Mobile is not required** — optimize for desktop only

---

## WHEN YOU ARE DONE

Run these verification checks:

1. `cd backend && pip install -r requirements.txt` — no errors
2. `cd frontend && npm install` — no errors  
3. Confirm every file in the folder structure exists and is non-empty
4. Check that `VITE_BACKEND_URL` is used in both hooks (never hardcoded)
5. Check that `burn_captions` in ffmpeg_service.py has at least one drawtext filter built from the captions list
6. Check that `VideoPreview.jsx` calls `onTimeUpdate` on the video's `timeupdate` event
7. Check that `ExportBar.jsx` triggers a file download after successful export

If any check fails, fix it before finishing.

---

## README.md

After building everything, create a `README.md` in the root with:
- Project description (2 sentences)
- Setup instructions (get API keys, fill .env files, npm install, pip install, run dev)
- Deploy instructions (Netlify + Railway steps from the spec)
- Known limitations (200MB limit, Gemini timestamp accuracy)
