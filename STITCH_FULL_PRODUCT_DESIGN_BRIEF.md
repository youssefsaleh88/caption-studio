# Stitch Prompt — AI Caption Studio (Multi-Platform Complete Design)

Use this prompt to generate a complete product design system and end-to-end UI flows for **AI Caption Studio** across **Web, Tablet, and Mobile**.

## 1) Product Overview

Design a production-grade video captioning product called **AI Caption Studio**.

Core value:
- User uploads a video with speech.
- AI auto-generates **word-level** captions with timestamps.
- User edits words and styles captions in a dark, pro editor.
- User exports:
  - Burned-in MP4 video
  - SRT subtitle file

## 2) Platforms and Responsive Scope

Create complete designs for:
- Desktop Web (primary editing experience)
- Tablet (landscape and portrait behavior)
- Mobile (quick edit and export flow)

For each screen, provide:
- Frame variants per platform breakpoint
- Auto layout-ready components
- Responsive behavior notes
- Interaction states (default, hover, focus, disabled, loading, error, success)

## 3) Brand and Visual Direction

Style goals:
- Dark, professional, creator-tool aesthetic (CapCut/DaVinci inspired)
- Clean hierarchy, high readability, modern SaaS polish
- Bilingual-friendly UI (Arabic + English)

Color direction:
- Background: near-black
- Surface: elevated charcoal panels
- Accent: vibrant purple
- Semantic colors: success, warning, error, info

Typography:
- UI font: modern geometric sans
- Timestamp/technical text: monospace accent
- Arabic text support with proper rendering and spacing

## 4) Information Architecture

Design these primary routes:
- `/` Home / Upload
- `/editor` Caption editor
- `/export` Export progress + completion
- `/history` Past projects (optional but include concept)
- `/settings` App preferences

Include:
- Global navigation (desktop + mobile pattern)
- Breadcrumb or context header for editor depth
- Empty states and onboarding hints

## 5) Core User Flows (Must Design End-to-End)

### Flow A: First-Time User
- Land on home
- Understand value proposition quickly
- Upload first video
- See upload + transcription progress
- Enter editor with generated captions

### Flow B: Caption Editing
- Play/pause video
- Current word highlighting synced to playback
- Click word chip to edit inline
- Delete word
- Add word after current word
- Undo/redo concept

### Flow C: Styling Captions
- Adjust font family, size, color
- Background toggle + opacity
- Shadow/outline effects
- 3x3 caption positioning grid
- Live preview updates

### Flow D: Export
- Download SRT
- Export burned-in MP4
- Loading and long-processing state
- Success with download CTA
- Error with retry path

## 6) Screen List (Design All)

Generate full screens for:
1. Landing/Home upload (idle)
2. Drag-over upload state
3. Uploading progress
4. Transcription in progress
5. Editor default (video + timeline words + style panel)
6. Editor with selected word + inline edit controls
7. Editor with style tab variations (Font, Background, Effects, Position)
8. Export processing modal/screen
9. Export success
10. Export error
11. History/projects list (empty + populated)
12. Settings (language/theme/preferences)

Also generate mobile equivalents for key flows:
- Home upload
- Quick editor
- Style controls in bottom sheet
- Export flow

## 7) Component System Requirements

Create reusable components with variants:
- Button (primary, secondary, ghost, danger, icon-only)
- Input fields and text areas
- File upload dropzone
- Video player shell with caption overlay
- Word chips (default, active, selected, edited)
- Tabs and segmented controls
- Sliders
- Color swatches + custom color picker
- Toggles and switches
- Toast/alert system
- Progress bars and loaders
- Modal/dialog patterns

Define component states and token usage for each variant.

## 8) Design Tokens

Provide a token set:
- Color tokens (base + semantic + alpha overlays)
- Typography scale
- Spacing scale
- Radius, border, shadow, blur
- Motion tokens (duration, easing)
- Z-index and layer strategy

Include light-mode concept briefly, but prioritize dark mode.

## 9) Accessibility and Localization

Ensure:
- WCAG-aware contrast
- Keyboard navigation patterns (web)
- Clear focus styles
- Touch targets for mobile
- RTL-ready layout considerations
- Arabic/English text expansion handling

## 10) Interaction and Motion

Specify:
- Micro-interactions for upload, hover, and selection
- Timeline/word-chip interaction animation
- Panel transitions and tab switching
- Export progress animation
- Motion should be subtle and premium, not distracting

## 10.1) Timeline System (Critical)

Use a horizontal timeline visual language inspired by clean infographic timelines:
- One central line
- Circular markers (dots) for caption segments/words
- Alternating labels above and below the line on larger screens
- Strong visual rhythm and spacing

But this is not static artwork; it must be an editable timeline for video captioning.

Desktop behavior (must-have):
- Rich timeline with alternating labels (top/bottom) where space allows
- Clear moving playhead (vertical line) synced with video time
- Zoom controls (`+`, `-`, fit)
- Drag-to-scrub on timeline
- Drag handles to adjust caption start/end
- Snap behavior to nearby word boundaries
- Active segment emphasized with accent glow/ring

Tablet behavior:
- Keep same visual identity, reduce label density
- Show fewer text labels; prioritize time readability
- Keep scrub + playhead + edit handles

Mobile behavior (must-have simplification):
- Keep line + dots style, but remove crowded alternating text labels
- Show compact markers and minimal text (time or short token only)
- Open full details in bottom sheet when marker is tapped
- Horizontal scrollable timeline with touch-optimized hit targets
- Sticky playhead always visible
- One-thumb usability: scrub, select marker, quick edit, save

Timeline states to design:
- Idle
- Playing (auto-updating playhead)
- Scrubbing
- Marker selected
- Marker editing
- Dense captions (collision-safe layout)
- Loading captions
- Error/no captions

## 11) Delivery Format

Return output as:
1. Full high-fidelity UI screens (all listed flows)
2. Component library page with variants/states
3. Token/style guide page
4. Responsive behavior annotations
5. Prototype links between major user flows

Use clear naming for frames/components so developers can implement directly.

## 12) Product Constraints to Respect

- Video types: MP4 / MOV / WEBM / AVI
- Max upload size: 200MB
- Transcription may take up to ~1–2 minutes
- Export may take up to ~3 minutes
- Editor desktop-first, but mobile quick flow is required
- Public app experience (no mandatory auth in core flow)

## 13) Nice-to-Have Concepts

Include optional concepts for:
- Brand kit presets (caption styles)
- Template marketplace feel
- Keyboard shortcut helper
- Mini timeline scrubbing enhancements
- "Auto line-break optimization" UI concept

## 14) Output Quality Bar

Design must feel:
- Premium
- Production-ready
- Consistent across platforms
- Easy for engineering handoff

Avoid generic template-looking UI. Keep it distinctive and tool-focused.

