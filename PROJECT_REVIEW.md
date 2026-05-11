# Caption Studio — Comprehensive Project Review

_Reviewed: 2026-05-11_

---

## Executive Summary

Caption Studio is a working, end-to-end Arabic caption generator: upload a video, Gemini 2.0 Flash transcribes it with word-level timestamps, the user reviews/edits the result, and the video is exported with burned-in captions or as an SRT file. The backend pipeline (R2 → FFmpeg audio extraction → Gemini → FFmpeg subtitle burn) is solid and correct. The **problem is entirely in the front end**: the app has been built to impress future power users and has accumulated a desktop-first, complexity-first layer of features — a 800-line `CaptionTimeline`, a full style editor with karaoke color pickers, outline colors, timing sliders, animation presets — that the actual user (one non-technical professor, on mobile) will never need and will actively harm. A mobile wizard shell (`MobileShell`) was added on top to compensate, but the underlying complexity still bleeds through (word timing sliders in the bottom sheet, thin Step 1 "preview" step with only a play button, duplicate and hardcoded content in `Home.jsx`). The correct move is to strip the core flow to four clean mobile screens, eliminate all timing-manipulation UI from the professor flow, and gate the full editor behind a separate route that does not exist yet. No tests exist; state is lost on refresh; CORS is locked to localhost and Netlify. Fix those three before the professor uses this in production.

---

## 1. Project Purpose & Current State

### What the project does today

1. User opens `/` → picks a video file.
2. `UploadZone.jsx` calls `POST /api/upload-url` → gets a presigned Cloudflare R2 PUT URL → uploads video directly from the browser to R2.
3. `UploadZone.jsx` then calls `POST /api/transcribe` with the R2 public video URL and a language hint.
4. Backend (`routes/transcribe.py`) downloads the video, extracts audio with FFmpeg (`services/ffmpeg_service.py`), base64-encodes the audio, sends it to Gemini 2.0 Flash with a prompt requesting a JSON array of `{word, start, end}` entries (`services/gemini_service.py`).
5. The word list is returned to the front end. The router navigates to `/editor` with `{videoUrl, words}` in `location.state`.
6. `Editor.jsx` branches by viewport:
   - **Mobile (<1024 px)**: 4-step wizard in `MobileShell` — Step 1 Preview, Step 2 Review words, Step 3 Style presets, Step 4 Export.
   - **Desktop (≥1024 px)**: 3-column layout — `TranscriptPanel` | `VideoStage` + `CaptionTimeline` | `SettingsSection` + `ActionBar`.
7. User can tap a word to open `WordEditBottomSheet` (text + timing sliders), pick a style preset, then either download an SRT file (client-side, `utils/srtExport.js`) or POST to `/api/export` which downloads the video from R2, generates an ASS subtitle file (`services/ass_subtitles.py`), burns it in with FFmpeg, and returns the captioned MP4.

### Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18.3, Vite 5.3, Tailwind CSS 3.4, react-router-dom 6.24, i18next 26, uuid 10 |
| Backend | FastAPI 0.111, Uvicorn 0.30, google-generativeai 0.7.2 (Gemini), ffmpeg-python 0.2, httpx 0.27, boto3 (Cloudflare R2) |
| Storage | Cloudflare R2 (presigned PUT from browser, public GET for backend download) |
| AI | Gemini 2.0 Flash (or fallback chain: 2.5 Pro → 2.5 Flash → 1.5 Flash → 2.5 Flash Lite) |
| Hosting | Not yet deployed (CORS allows localhost + `*.netlify.app`) |

### Folder/file organization — what makes sense, what does not

**Makes sense:**
- `backend/services/` cleanly separates Gemini, FFmpeg, R2, and ASS generation — each file has one responsibility.
- `frontend/src/hooks/` — `useVideoUpload` and `useTranscription` correctly separate upload and transcription concerns from UI.
- `frontend/src/components/mobile/` and `frontend/src/components/studio/` — intent to separate mobile and desktop components is good in principle.

**Feels off:**
- `frontend/src/components/studio/CaptionTimeline.jsx` is 800+ lines and internally branches on `variant === "roomy"` (the mobile path) vs. default (desktop). This is two components pretending to be one.
- `frontend/src/pages/Home.jsx` has two `<main>` blocks — one for mobile (hardcoded Arabic), one for desktop (i18n + animated `TypingTitle`) — separated by `lg:hidden` / `hidden lg:flex`. They should be one responsive component.
- `frontend/src/pages/Editor.jsx` (462 lines) hardcodes Arabic strings in `mobileStepTitle()`, `mobileStepHint()`, and `mobileCtaLabel()` inline instead of using the configured i18n system.
- There are no tests anywhere in the project.
- Design docs (`.design/caption-studio-ui/`) describe an earlier architecture and are not synchronized with the current code.

---

## 2. UI Inventory

### Routes

| Route | File | Description |
|---|---|---|
| `/` | `src/pages/Home.jsx` | Upload landing page. Has two parallel `<main>` blocks (mobile + desktop). Entry point for the professor. |
| `/editor` | `src/pages/Editor.jsx` | Main editor. On mobile: 4-step wizard. On desktop: 3-column layout. Requires `location.state.words` + `location.state.videoUrl`; redirects to `/` if missing (no persistence). |

### UI Surfaces

| Surface | File | Purpose | User Actions |
|---|---|---|---|
| Home — mobile main | `Home.jsx` (lines ~1–70) | Upload entry on mobile. Hardcoded Arabic heading + feature steps. | Tap UploadZone |
| Home — desktop main | `Home.jsx` (lines ~70–end) | Upload entry on desktop. Animated TypingTitle + i18n feature list. | Drag-drop or click UploadZone |
| UploadZone | `components/UploadZone.jsx` | File picker, upload to R2, trigger transcription, navigate to editor. Language hint select. | Pick file, select language hint |
| Mobile Step 1 — Preview | `Editor.jsx` (inline, no sub-component) | Shows "preview" step. Thin: play/pause button + timecode counter. VideoStage always visible above it. | Play/pause |
| Mobile Step 2 — Review | `components/mobile/StepReview.jsx` | Scrollable word list with text + timestamps. | Tap word → WordEditBottomSheet |
| Mobile Step 3 — Style | `components/mobile/StepStyle.jsx` | Style preset picker using `StylePresets.js` data (3–5 presets). | Tap preset thumbnail |
| Mobile Step 4 — Export | `components/mobile/StepExport.jsx` | Two buttons: Download SRT, Export Video (MP4 with burned captions). | Tap action |
| Desktop TranscriptPanel | `components/studio/TranscriptPanel.jsx` | Left column, word list with timecodes and word-level editing. Auto-scroll to current word. | Click word → WordEditBottomSheet |
| Desktop VideoStage | `components/studio/VideoStage.jsx` | Center top, HTML5 video player with caption overlay rendering. Caption mode switches (sentences / sliding window). | Play, pause, seek |
| Desktop CaptionTimeline | `components/studio/CaptionTimeline.jsx` | Center bottom (800+ lines). CapCut-style ruler, word blocks, drag to move, resize handle, split button, snap-to-grid, zoom. | Drag words, resize, split, zoom, scroll |
| Desktop SettingsSection | `components/studio/SettingsSection.jsx` | Right column. Full style editor: font, size, color, bg color/opacity, shadow, outline, position X/Y, animation picker, caption display mode, max words/line, segment duration, sliding window size, min display time. | Sliders, color pickers, dropdowns |
| Desktop ActionBar | `components/studio/ActionBar.jsx` | Bottom right. Download SRT + Export MP4 buttons, export progress bar. | Click export |
| WordEditBottomSheet | `components/studio/WordEditBottomSheet.jsx` | Slides up from bottom on mobile, appears as panel on desktop when a word is selected. Edit word text + start/end time sliders + prev/next word nav. | Edit text, adjust timing, navigate words |
| StudioNavBar | `components/studio/StudioNavBar.jsx` | Top bar in desktop editor. App logo, title, language switcher. | Switch language |

### Current user flow

```
Home → pick video → [UploadZone: upload to R2 + transcribe] → /editor

Mobile:
  Step 1: Preview (thin; just play button + timecode)
  Step 2: Review word list → tap word → WordEditBottomSheet (text + timing)
  Step 3: Style presets (tap thumbnail)
  Step 4: Export → Download SRT or Export MP4

Desktop:
  TranscriptPanel ← VideoStage → SettingsSection
                   CaptionTimeline
                   ActionBar
```

---

## 3. Feature Audit

| Feature | What it does | Professor needs it? | Verdict | Rationale |
|---|---|---|---|---|
| Video upload (R2 presigned) | Browser uploads directly to cloud storage | Yes — core | **KEEP (core)** | Works well. Direct-to-R2 avoids server bandwidth cost. |
| Auto-transcription (Gemini) | Converts speech to word-level timestamps | Yes — core | **KEEP (core)** | This is the product's entire value proposition. |
| Video preview with caption overlay | HTML5 player + caption drawn over video in real time | Yes — core | **KEEP (core)** | Professor needs to see what the final result looks like. |
| Word text correction (text only) | Tap a word → edit its text | Yes — core | **KEEP (core)** | Professor will need to fix mis-transcribed words. |
| Download SRT | Client-side SRT file generation | Probably yes | **KEEP (core)** | SRT is the standard caption file. Low effort output. |
| Export MP4 with burned captions | Backend FFmpeg burn | Maybe | **KEEP (core), simplify** | Professor may want a self-contained video for WhatsApp or LMS. Keep but make the difference with SRT clearer. |
| Style presets (mobile StepStyle) | 3–5 preset card thumbnails | Yes — simplified | **KEEP (core)** | Pick-one-and-done. Professor-friendly. No configuration required. |
| Mobile 4-step wizard shell | MobileShell provides step header + back/next | Yes — needed | **KEEP, simplify** | Right approach for mobile. Step 1 (Preview) is nearly empty and should be removed or merged. |
| Full style editor (SettingsSection) | Font, size, color, outline, position, bg, shadow sliders | No | **MOVE to advanced** | A non-technical user on mobile will never open this. Zero professor value. |
| Word timing sliders (WordEditBottomSheet) | Adjust start/end milliseconds | No | **REMOVE from core** | The professor cannot and should not be adjusting word timing. Gemini timings are good enough. Causes confusion and accidental breakage. |
| CaptionTimeline (drag/resize/split) | CapCut-style precision word timeline | No | **REMOVE from core** | Already hidden on mobile (`hidden lg:block`). Confirm it stays hidden. Not needed even on desktop for the professor. |
| Caption display mode (sentences / sliding window) | How words are grouped per caption | No | **DOWNGRADE** | Default to "sentences" mode (already the default). Remove the UI toggle for the professor. |
| Sliding window size / min display time / max segment duration sliders | Fine-grained caption timing controls | No | **REMOVE from core** | Not comprehensible to a non-technical user. Defaults are sufficient. |
| Animation picker (karaoke, slide, pop, fade) | Caption entrance animation | No | **REMOVE from core** | Adds visual noise to the decision. Default "none" is fine for academic use. |
| Karaoke color picker | Word-highlight color for karaoke animation | No | **REMOVE from core** | Only relevant if karaoke animation is enabled, which it won't be. |
| Outline color picker | CSS text outline color | No | **REMOVE from core** | Defaults are fine. Non-technical user doesn't understand "outline". |
| Shadow slider | Drop shadow size | No | **REMOVE from core** | Not meaningful to a professor. |
| Position X/Y percentage controls | Fine-grained caption position | No | **REMOVE from core** | "bottom-center" is the correct default. |
| Language switcher (AR/EN) | Switches UI language | No | **REMOVE from core** | The professor uses Arabic. The switcher adds confusion clutter. |
| TypingTitle animation on Home | Animated rotating headline | No | **DOWNGRADE** | Harmless but adds render complexity for zero user value. Replace with a static, clear Arabic headline. |
| i18n system (ar/en locales) | Full localization infrastructure | Not currently | **KEEP** | Good to have for future; but incomplete (Editor.jsx hardcodes Arabic strings). Do not add more hardcoded strings. |
| Gemini model fallback chain | Tries multiple models if one fails | No but useful | **KEEP (backend)** | Silent resilience. Professor never sees it. |
| Auto-detect language hint | Gemini selects language automatically | Yes — default | **KEEP as default** | The "auto" default means zero professor decision. The language selector in UploadZone could be hidden. |

---

## 4. Mobile Usability Assessment

Tested against: a non-technical professor, 6-inch screen, touch-only.

### Broken or high-friction

| Issue | File / Component | Severity |
|---|---|---|
| **Home.jsx has two duplicate `<main>` blocks** with different heading text — mobile shows Arabic hardcode, desktop shows i18n. On a tablet or landscape phone the wrong version may appear. | `src/pages/Home.jsx` | High |
| **WordEditBottomSheet shows timing sliders** (`start` and `end` in 0.1s steps). A non-technical professor has no way to know what "3.20s" means for a word. These small hit targets with tiny deltas are also nearly impossible to adjust accurately on a touchscreen. | `src/components/studio/WordEditBottomSheet.jsx` | High |
| **Mobile Step 1 (Preview) is nearly empty** — it renders only a play/pause button and a digital timecode. The VideoStage is already always visible above the steps. This step serves no purpose and makes the wizard feel broken. | `src/pages/Editor.jsx` (mobileStepTitle/hint functions) | High |
| **No progress feedback during transcription** beyond a spinner and static text. A large video file can take 30–90 seconds on Gemini. The professor will tap "retry" repeatedly, thinking it crashed. | `src/components/UploadZone.jsx` | High |
| **State lost on refresh**. If the professor accidentally closes or refreshes `/editor`, all words and edits are gone — redirect to home. | `src/pages/Editor.jsx` (line ~10: `if (!location.state?.words) navigate("/")`) | Medium |
| **UploadZone language hint select** — a `<select>` for `auto / ar / en` is shown. For the professor, "auto" is always correct. The select adds a decision where there is none. | `src/components/UploadZone.jsx` | Medium |
| **StepExport shows two export actions with no explanation** of the difference between them. "Download SRT" vs. "Export Video" is not self-explanatory for a non-technical user. | `src/components/mobile/StepExport.jsx` | Medium |
| **StepReview is a long scrolling word list** — for a 5-minute lecture, this could be 400+ words. There is no search, no filter, no "jump to transcription error". Finding a misheard word requires scrolling through the entire list. | `src/components/mobile/StepReview.jsx` | Medium |
| **Language switcher in StudioNavBar** appears on the editor desktop. Does not appear on mobile (mobile wizard has no nav bar) — but on a wide phone or tablet the desktop layout shows and the switcher adds confusion. | `src/components/studio/StudioNavBar.jsx` | Low |
| **CaptionTimeline on desktop** requires precise mouse drag, resize handles, and scroll-to-zoom. Completely unusable on touch. Already hidden on mobile (`hidden lg:block` in `Editor.jsx`) — verify no accidental mobile entry path. | `src/components/studio/CaptionTimeline.jsx` | Low (already hidden on mobile) |
| **SettingsSection is 15+ controls** deep (sliders, color pickers, dropdowns). Touch-unfriendly precision controls. Already desktop-only — but on wide tablet it might appear. | `src/components/studio/SettingsSection.jsx` | Low (already desktop-only) |

### What works well on mobile

- `MobileShell` step header + next/back button structure is correct mobile UX.
- `WordEditBottomSheet` slides up from bottom, large tap targets for the text field — correct mobile pattern.
- `StepStyle` preset thumbnails are large enough to tap.
- The overall wizard concept (4 steps) is the right mental model for the professor.
- `UploadZone` falls back to tap-to-pick on touch (drag-and-drop is not required on mobile).

---

## 5. Proposed Restructure — Two Tracks

### Core UI (for the professor, mobile-first)

This is the only version that exists right now. It should be the entire app.

**Guiding principles:**
- Every screen has one primary action.
- The professor never sees a number, a slider, or a color picker.
- Default behaviors cover 100% of the professor's use case without configuration.
- Captions are in Arabic, white text, black background, bottom-center — no choice needed.

---

#### Screen 1 — Upload

**Layout:** Full screen, centered vertically.

```
+------------------------------------------+
|  [Logo / App name, e.g. "كاپشن ستوديو"]  |
|                                           |
|  [Large tap target: "اختر فيديو"]        |
|   (single button, opens file picker)      |
|                                           |
|  [optional: small text "يدعم MP4، MOV"]  |
+------------------------------------------+
```

**What's intentionally hidden:**
- Language hint select (always "auto").
- Drag-and-drop hint text (mobile browsers don't support it reliably).
- Feature list / TypingTitle animation.

**Default behaviors:**
- Immediately shows progress bar after file is picked.
- Progress has two phases: "جاري الرفع…" (upload) → "جاري التفريغ الصوتي…" (transcription).
- On error, shows a plain Arabic message and a "حاول مرة أخرى" button.

**Files affected:** `Home.jsx` (collapse two main blocks), `UploadZone.jsx` (hide language select, add two-phase progress).

---

#### Screen 2 — Review Captions

**Layout:** Video preview (top ~40% of screen, fixed) + scrollable word list (bottom ~60%).

```
+------------------------------------------+
|  [Video preview with caption overlay]    |
|  [Play / Pause          00:12 / 01:34]   |
+------------------------------------------+
|  Word list (scrollable):                  |
|  ┌────────────────────────────────────┐   |
|  │  مرحبا    ✓                       │   |
|  │  بالطلاب  ✓                       │   |
|  │  الكرام   (tap to edit)           │   |
|  └────────────────────────────────────┘   |
|  [Next: اختر شكل الكابشن ←]            |
+------------------------------------------+
```

**What's intentionally hidden:**
- Timestamp display on each word (the professor doesn't care).
- Word timing sliders.
- CaptionTimeline.

**Tap a word → small bottom sheet** with:
- Text input for the word.
- ✓ Done and ← → navigate to prev/next word.
- No timing controls.

**Files affected:** `StepReview.jsx` (hide timestamps), `WordEditBottomSheet.jsx` (hide timing sliders by default; keep them behind a developer toggle for future power-user mode).

---

#### Screen 3 — Pick Style

**Layout:** Same video preview (top, playing) + 3–4 preset cards below.

```
+------------------------------------------+
|  [Video preview, live preview of style]  |
+------------------------------------------+
|  Pick a style:                           |
|  ┌────────┐  ┌────────┐  ┌────────┐     |
|  │Classic │  │ Bold   │  │ Clean  │     |
|  │(white) │  │(yellow)│  │(minimal│     |
|  └────────┘  └────────┘  └────────┘     |
|  [Next: تحميل الكابشن ←]               |
+------------------------------------------+
```

**What's intentionally hidden:** Everything in `SettingsSection`. No font picker, no position, no animation, no outline, no shadow.

**Files affected:** `StepStyle.jsx` — already mostly correct; just ensure presets are applied to VideoStage live preview.

---

#### Screen 4 — Export

**Layout:** Single-purpose download screen.

```
+------------------------------------------+
|  [Video thumbnail or player]             |
|                                           |
|  [Primary CTA: "تحميل الفيديو مع الكابشن"]|
|   (exports MP4 with burned captions)     |
|                                           |
|  [Secondary, smaller: "تحميل ملف SRT"]   |
|   (for uploading to YouTube/LMS)          |
|                                           |
|  [Export progress bar if exporting]      |
+------------------------------------------+
```

**What's intentionally hidden:** All style controls, all timeline, language switcher.

**Explanatory text** under SRT button: "ملف SRT مناسب لمنصات مثل يوتيوب وبلاك بورد" — one line.

**Files affected:** `StepExport.jsx` (add brief explanation, move primary CTA to video export, keep SRT as secondary).

---

### Advanced Editor (future power users / future public version)

**Recommended scope:**
- Full `CaptionTimeline` with drag/resize/split.
- Complete `SettingsSection` (font, size, color, outline, position, animation, karaoke).
- Word-level timing editor (current `WordEditBottomSheet` with timing sliders).
- Caption display mode toggle (sentences vs. sliding window).
- Sliding window size / segment duration / min display time controls.
- Multi-language UI (language switcher, full i18n).
- Keyboard shortcuts.

**How to expose it:**
- **Recommended**: Add a small "Advanced" or gear icon on Screen 4 that navigates to `/editor/advanced` — same session data (no new upload required). This route loads the full 3-column desktop layout.
- **Do not** add it to the mobile wizard. The advanced editor is inherently desktop-only.
- **Keep in the current build** (the desktop 3-column layout in `Editor.jsx` already exists behind `lg:` breakpoints). Do not delete it. The professor will never accidentally see it on mobile. Simply hide the entry point (remove the desktop layout from mobile viewports completely, which is already done).

**Simplification needed in the advanced editor before it's usable by a future power user:**
- `CaptionTimeline.jsx` should be split into `CaptionTimeline.jsx` (default desktop) and `WordListStrip.jsx` (mobile) — they are already logically separate but live in one 800-line file.
- `SettingsSection.jsx` should group controls into collapsible sections (Typography, Timing, Position, Animation) rather than showing all 15 controls in a flat list.

---

## 6. Code & Architecture Recommendations

### 6.1 Proposed file/folder reorganization

```
frontend/src/
├── app/
│   ├── App.jsx                 (unchanged)
│   └── routes.jsx              (new: centralize route definitions + guards)
├── features/
│   ├── upload/
│   │   ├── UploadPage.jsx      (replaces Home.jsx — unified, no duplicate main blocks)
│   │   └── UploadZone.jsx      (move here from components/)
│   ├── review/
│   │   └── ReviewStep.jsx      (rename StepReview.jsx; remove timestamp display)
│   ├── style/
│   │   └── StyleStep.jsx       (rename StepStyle.jsx)
│   ├── export/
│   │   └── ExportStep.jsx      (rename StepExport.jsx)
│   └── advanced/               (NEW — contains full desktop editor components)
│       ├── AdvancedEditorPage.jsx
│       ├── CaptionTimeline.jsx (desktop only, 800-line file moved here)
│       ├── SettingsSection.jsx
│       ├── TranscriptPanel.jsx
│       └── VideoStage.jsx
├── components/
│   ├── mobile/
│   │   ├── MobileShell.jsx     (unchanged)
│   │   ├── HelpHint.jsx        (unchanged)
│   │   └── WordEditSheet.jsx   (renamed; timing sliders hidden by default)
│   └── shared/
│       ├── VideoPlayer.jsx     (extracted from VideoStage — the HTML5 player core)
│       └── CaptionOverlay.jsx  (extracted from VideoStage — the overlay renderer)
├── hooks/
│   ├── useVideoUpload.js       (unchanged)
│   ├── useTranscription.js     (unchanged)
│   └── useEditorSession.js     (NEW — wraps location.state, localStorage persistence)
├── utils/
│   ├── captions.js             (unchanged)
│   ├── srtExport.js            (unchanged)
│   └── timelineUtils.js        (unchanged)
└── i18n/
    ├── index.js
    └── locales/
        ├── ar.json             (add all hardcoded strings from Editor.jsx)
        └── en.json
```

**Key moves:**
- Eliminate `src/pages/` as a concept; replace with `src/features/` (each feature = a route + its components).
- Move advanced desktop components into `src/features/advanced/` so they can be lazy-loaded and excluded from the professor's initial bundle.
- Extract the HTML5 video player core from `VideoStage.jsx` into a `VideoPlayer.jsx` shared component so it can be used in both the mobile steps (always visible) and the advanced desktop editor.

### 6.2 Component decomposition / consolidation

| Current | Problem | Fix |
|---|---|---|
| `Home.jsx` | Two `<main>` blocks for mobile and desktop | Merge into one `<main>` with responsive Tailwind classes; use the i18n `t()` calls throughout (no hardcoded Arabic) |
| `Editor.jsx` (462 lines) | Mobile wizard + desktop 3-column + hardcoded Arabic strings all in one file | Split into `MobileEditorPage.jsx` (4-step wizard) and `AdvancedEditorPage.jsx` (3-column); move hardcoded strings to `ar.json` |
| `CaptionTimeline.jsx` (800+ lines) | Two render paths (`variant === "roomy"` vs. default) inside one component | Split: `CaptionTimeline.jsx` (desktop drag-resize) and `WordListStrip.jsx` (already partially extracted to its own file) |
| `WordEditBottomSheet.jsx` | Exposes timing sliders that the professor must not touch | Add a `showTimingControls` prop (default `false`) so the core flow hides them; the advanced editor passes `showTimingControls={true}` |
| `SettingsSection.jsx` | 15 controls in a flat list, all visible at once | Group into collapsible sections (Typography, Timing, Position, Animation) — future work for advanced track |

### 6.3 State management

Currently all state is passed via `location.state` from `UploadZone` to `Editor`. This is fragile (refresh = loss of all work).

**Recommendation — add `useEditorSession` hook:**
```js
// hooks/useEditorSession.js
// On load: read from location.state; if missing, read from localStorage
// On change: write words/style to localStorage
// Clear localStorage on explicit "Start Over" action
```
This is a single-file, ~40-line change that eliminates the refresh-loss problem entirely without adding a dependency.

### 6.4 Core vs. Advanced separation in the codebase

**Recommended approach: separate routes, shared hooks.**

- `/` → `UploadPage` (professor entry)
- `/review` → `MobileEditorPage` (4-step wizard; professor mobile flow) ← rename from `/editor`
- `/editor` → `AdvancedEditorPage` (full desktop editor; hidden from professor; future power users)
- No feature flags needed at this scale.
- Lazy-load `/editor` (advanced) so it does not bloat the professor's initial bundle.

```jsx
// App.jsx
const AdvancedEditor = lazy(() => import("./features/advanced/AdvancedEditorPage"))

<Routes>
  <Route path="/" element={<UploadPage />} />
  <Route path="/review" element={<MobileEditorPage />} />
  <Route path="/editor" element={<Suspense fallback={<Spinner />}><AdvancedEditor /></Suspense>} />
</Routes>
```

### 6.5 Things that make maintenance hard today and how to fix each

| Problem | File | Fix |
|---|---|---|
| Hardcoded Arabic strings in `Editor.jsx` (`mobileStepTitle`, `mobileStepHint`, `mobileCtaLabel` inline functions) | `src/pages/Editor.jsx` | Move all strings to `src/i18n/locales/ar.json`; call `t("steps.preview.title")` etc. |
| CORS locked to `localhost` and `*.netlify.app` | `backend/main.py` | Make `ALLOWED_ORIGINS` an env var: `ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000`. The professor will be using a specific deployed URL. |
| No tests | Everywhere | Add at minimum: `utils/captions.test.js` (pure functions), `utils/srtExport.test.js`, and a simple smoke test for the transcription route. |
| Gemini model name `"gemini-3-flash-preview"` as first in fallback list | `backend/services/gemini_service.py` line 37 | This model name does not exist as of mid-2025; it will always fail and fall through to the next. Either confirm the name or move `gemini-2.5-flash` to position 1. |
| Backend export blocks request thread during FFmpeg | `backend/routes/export_video.py` | FFmpeg is CPU-bound and can run for 60+ seconds on a large video. This blocks the Uvicorn worker. For single-user use it is acceptable; for any future multi-user scenario, move to a background task queue (Celery, FastAPI BackgroundTasks with a job ID poll). Note this in the backlog. |
| No file size limit on upload | `backend/routes/transcribe.py` | Gemini has a maximum file size. Large files will silently time out. Add a file size guard in `UploadZone.jsx` (client-side) with a clear Arabic error message ("الحد الأقصى للفيديو هو 100 ميجابايت"). |
| R2 presigned PUT URL expires in 15 minutes | `backend/services/r2_service.py` line 34 | Fine for current use. Document that large uploads must complete before the URL expires. |
| `google-generativeai==0.7.2` is an older SDK version | `backend/requirements.txt` | The SDK was restructured into `google-genai` in 2025. This works now but will require migration when the old SDK is deprecated. Log as a future maintenance item. |

---

## 7. Short-Term Roadmap (Professor-Only Version)

Ordered by impact. Do these in sequence.

| # | Action | Effort | What to do |
|---|---|---|---|
| 1 | **Remove word timing sliders from the mobile flow** | S | In `WordEditBottomSheet.jsx`, add `showTimingControls={false}` default; in `Editor.jsx` mobile path, pass `showTimingControls={false}`. The professor cannot use them and they cause accidents. |
| 2 | **Add localStorage persistence** | S | Implement `useEditorSession.js` (~40 lines). Save `{words, videoUrl, style}` to `localStorage["caption_session"]` on every change. On load, prefer `location.state`; fall back to `localStorage`. Add "Start Over" button on Home. |
| 3 | **Fix Home.jsx duplication** | S | Merge the two `<main>` blocks into one. Use a single Arabic heading (static, i18n key). Remove the `TypingTitle` animation for now. Remove the lg:hidden / hidden lg:flex split from the main content. |
| 4 | **Simplify StepExport** | S | Make "Export Video" the primary large button; add a one-line Arabic explanation. Make "Download SRT" a secondary link-style button with "مناسب لـ YouTube وBlackboard". |
| 5 | **Remove / merge Step 1 (Preview)** | S | The VideoStage is always visible above all steps. Step 1 adds nothing. Remove it and start the wizard at Review (Step 1 becomes Step 2 → renumber). The user sees the video immediately when they arrive at /review. |
| 6 | **Hide language hint select in UploadZone** | XS | Add `defaultValue="auto"` and `className="hidden"` (or remove the `<select>` entirely). The professor always uses Arabic; Gemini auto-detects correctly. |
| 7 | **Fix CORS for production deployment** | S | Make `ALLOWED_ORIGINS` an env var in `backend/main.py`. Set it in the deployment config to the actual professor-facing URL before launch. |
| 8 | **Move hardcoded Arabic strings to ar.json** | S | Find all hardcoded Arabic in `Editor.jsx` (`mobileStepTitle`, `mobileStepHint`, `mobileCtaLabel`, etc.) and move to `src/i18n/locales/ar.json`. |
| 9 | **Add upload file size guard** | S | In `UploadZone.jsx`, reject files > 200 MB before upload with a clear Arabic message. |
| 10 | **Add two-phase upload progress** | M | In `UploadZone.jsx` + `useVideoUpload.js`, emit "uploading" vs. "transcribing" state so the progress indicator changes message mid-flow. Prevents the professor from thinking the app has crashed during 60-second Gemini processing. |
| 11 | **Confirm CaptionTimeline never appears on mobile** | XS | Grep for `CaptionTimeline` in `Editor.jsx`; confirm it is wrapped in `hidden lg:block`. No code change needed if already correct. |
| 12 | **Write smoke tests for pure utilities** | M | Add `vitest` to devDependencies. Write tests for `utils/captions.js`, `utils/srtExport.js`, `utils/timelineUtils.js`. These are pure functions with no dependencies. |

---

## 8. Long-Term Roadmap (Portfolio / Public Version)

### Stage 1 — Stable professor version (current scope done)
**Done when:** Professor can upload, review, export on mobile without friction, state survives refresh, no timing sliders in the way.
- All short-term items above.
- Basic error handling for network failures.
- Deployed to a stable URL with correct CORS.

### Stage 2 — Polish & reliability
**Done when:** The app is solid enough to share with a second user without hand-holding.
- Add file-type validation (reject non-video files with a clear message).
- Add retry logic on Gemini failure (`gemini_service.py` currently breaks on first key/model failure per iteration; needs retry with exponential back-off).
- StepReview: add a "play from word" button (tap word → video seeks to that timestamp). This dramatically speeds up the review process.
- Add a simple "undo" for word edits (store original word text alongside edited text).
- Backend: implement job-based export (`POST /api/export` returns a `job_id`; client polls `GET /api/export/{job_id}/status`). This decouples the FFmpeg blocking from the request.
- Upgrade `google-generativeai` SDK to `google-genai` (new SDK) before it is deprecated.

### Stage 3 — Multi-user / public
**Done when:** A second professor (or student) can use it without knowing the developer.
- Add simple auth (email magic link or Google OAuth via Supabase or similar).
- Per-user R2 prefix for file isolation (`videos/{user_id}/{uuid}_{filename}`).
- Rate limiting on `/api/transcribe` and `/api/export` (one concurrent export per user).
- File cleanup job: delete R2 uploads older than 24 hours.
- Basic usage dashboard (admin only).

### Stage 4 — Advanced editor
**Done when:** A technically literate user can fine-tune caption timing and style on desktop.
- Expose `/editor` route (currently hidden from professor but code already exists).
- Split `CaptionTimeline.jsx` into two components (see §6.2).
- Group `SettingsSection.jsx` controls into collapsible sections.
- Remove `showTimingControls={false}` restriction → word timing sliders enabled for `/editor` route.
- Add keyboard shortcuts documentation.

### Stage 5 — Scale / monetization (if ever)
- Analytics (which features are used, average video duration, error rates).
- Billing integration (Stripe) for Gemini API cost pass-through.
- Batch processing (multiple videos).
- Custom font upload.
- Subtitle translation (Gemini can translate captions as a second pass).

---

## 9. Feature Cut List

Features to **REMOVE from the professor-facing core** immediately. None of these require deleting code — just hiding them from the mobile wizard.

| Feature | Location | Rationale |
|---|---|---|
| Word timing sliders (start/end) in WordEditBottomSheet | `components/studio/WordEditBottomSheet.jsx` | A non-technical user adjusting millisecond timestamps causes more errors than it fixes. Gemini timings are good enough. |
| Mobile Step 1 "Preview" (empty step with play button) | `src/pages/Editor.jsx` inline | The video is always visible above the steps. This step adds no content, only friction. |
| Language hint `<select>` in UploadZone | `components/UploadZone.jsx` | "auto" is always correct for the professor. The choice creates unnecessary decision anxiety. |
| Caption display mode toggle (sentences vs. sliding window) | `components/studio/SettingsSection.jsx` (desktop), implied in mobile | Default "sentences" is correct. The professor must not encounter this toggle. |
| Sliding window size / max segment duration / min display time sliders | `components/studio/SettingsSection.jsx` | Incomprehensible to a non-technical user. Defaults are fine. |
| Animation picker (karaoke, slide, pop, fade) | `components/studio/AnimationPicker.jsx` / `SettingsSection.jsx` | Adds visual noise to style decision. Default "none" is appropriate for academic content. |
| Karaoke color picker | `components/studio/ColorPicker.jsx` (inside SettingsSection) | Only relevant if karaoke mode is on, which it won't be. |
| Outline color picker | `components/studio/SettingsSection.jsx` | Defaults are fine. The professor cannot evaluate this choice. |
| Shadow slider | `components/studio/SettingsSection.jsx` | Default shadow is fine. Not a visible choice for the professor. |
| Position X/Y percentage controls | `components/studio/SettingsSection.jsx` | "bottom-center" is the correct default. The professor must not be able to accidentally move captions off-screen. |
| Language switcher | `components/studio/StudioNavBar.jsx`, `components/LanguageSwitcher.jsx` | Removes confusion. The professor uses Arabic. The switcher currently appears in the desktop nav and creates a confusing two-language state. |
| `TypingTitle` animation on Home | `src/pages/Home.jsx` | Adds bundle weight and render complexity for a decorator that adds zero functional value. |
| CaptionTimeline drag/resize/split on mobile | Already `hidden lg:block` in `Editor.jsx` | Verify it stays hidden. This is already done but must not be accidentally re-added during a future refactor. |

---

## 10. Risks & Open Questions

### Things that could not be determined from the files

1. **Video size limits in practice**: The backend downloads the entire video to a temp directory before calling Gemini. For a 500 MB lecture video, this will timeout on the default 120-second httpx timeout configured in `routes/transcribe.py`. There is no file size guidance visible to the user. Assumed limit: ~200 MB based on Gemini's audio API limits.

2. **R2 bucket public access**: `r2_service.py` returns a `video_url` using `R2_PUBLIC_BASE_URL`. This assumes the R2 bucket has public read access enabled. If not, the backend's `httpx.get(req.video_url)` calls will fail with 403. This is an infrastructure assumption, not code.

3. **Gemini model `gemini-3-flash-preview`** (line 37 of `gemini_service.py`) — this model name does not exist in any Gemini release as of 2025-05. The service will always fail on the first model and fall through. This is silent technical debt that wastes latency on every transcription request.

4. **The professor's export preference**: It is unknown whether the professor primarily wants SRT files (for YouTube/LMS) or burned-in MP4 (for WhatsApp, direct sharing). This changes which action should be primary on the Export screen.

5. **Deployment target**: The CORS config allows `*.netlify.app`. It is unknown if Netlify is the confirmed hosting target or a placeholder. If a custom domain is used, CORS must be updated before first use.

6. **No session sharing across devices**: The professor may start on desktop and finish on mobile (or vice versa). `localStorage` is device-local; `location.state` is tab-local. If cross-device continuity is needed, a lightweight database-backed session is required.

### Risks of the proposed restructure

1. **Renaming `/editor` → `/review`** will break any bookmarked or shared links. Low risk now (single user, no public links); high risk later if URLs are shared. Use a redirect.

2. **Hiding the 4-step wizard's Step 1** (the Preview step): The professor may expect to preview the raw video before reviewing captions. Ensure VideoStage at the top of `/review` auto-plays (or has a clearly visible play button) so the professor can preview without a dedicated step.

3. **localStorage for session persistence** is not encrypted. Video URLs stored there are time-limited (R2 presigned URLs expire in 15 min by default for the upload URL; however the `video_url` in `r2_service.py` returns the public R2 URL, not the presigned URL — so the stored URL does not expire). No sensitive PII is stored; only video metadata and word timestamps. Risk is acceptable.

4. **Removing `TypingTitle`** changes the visual identity of the landing page. If this is a deliberate brand choice, keep it and just reduce its bundle impact (it is a small component).

5. **Splitting `CaptionTimeline.jsx`** into two files risks introducing bugs in the desktop drag behavior. This is a medium-risk refactor. Do it after the core simplification is complete, not before.

### Questions for the owner / professor

1. **What do you do with the output?** Do you upload to YouTube/Blackboard (→ SRT is the right primary output) or share directly on WhatsApp/Telegram (→ burned-in MP4)?
2. **How long are your videos?** 2-minute clips vs. 45-minute lectures have very different transcription times and review effort. If lectures are long, Step 2 (Review) needs a search/filter to be usable.
3. **Is the Arabic always MSA or do you use a specific dialect?** Gemini's auto-detect works for both, but knowing the dialect helps diagnose transcription quality issues.
4. **Will you ever need a second user?** If yes, user accounts and isolated storage need to be planned before the first user's data becomes entangled.
5. **Is Netlify the confirmed deployment target?** Update CORS before launch.

---

_Document ends._
