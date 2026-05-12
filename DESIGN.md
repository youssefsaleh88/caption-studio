---
name: AI Caption Studio
description: Dark-first caption editor with violet accent, bilingual type, and export-first density.
colors:
  ink-night: "#0a0a0f"
  surface-card: "#13131c"
  surface-panel: "#1a1a28"
  rail-deep: "#0c0c12"
  timeline-track: "#14141c"
  text-primary: "#f0f0ff"
  text-secondary: "#8888aa"
  text-muted: "#555570"
  accent-violet: "#6c63ff"
  accent-violet-bright: "#8b80ff"
  accent-blue: "#4facfe"
  border-frost: "#ffffff14"
  signal-danger: "#ff4d6d"
  signal-success: "#43e97b"
  scrim-amber: "#f59e0b"
typography:
  display:
    fontFamily: "Syne, Tajawal, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Syne, Tajawal, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Tajawal, Syne, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "Tajawal, Syne, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "Tajawal, Syne, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.08em"
  mono:
    fontFamily: "\"Space Mono\", ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "10px"
  md: "12px"
  card: "16px"
  pill: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent-violet}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 12px"
  button-primary-hover:
    backgroundColor: "{colors.accent-violet-bright}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "8px 4px"
  card-setting:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.card}"
    padding: "{spacing.md}"
  chip-timecode:
    backgroundColor: "#6c63ff38"
    textColor: "{colors.accent-violet-bright}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
---

# Design System: AI Caption Studio

## Overview

**Creative North Star: "The Calibrated Edit Bay"**

This system serves a product register: the visuals exist to keep users oriented inside a dense, timeline-shaped workflow. The default scene is a home or small studio at night, one monitor, one video, one path to export. Surfaces stay deep and quiet so timing, text, and controls read first. Energy arrives through the violet accent and cyan secondaries, used as signal and selection, not as atmosphere paint.

The codebase carries two coordinated token layers. Semantic `--cap-*` tokens in `frontend/src/tokens.css` define spacing, motion, focus, and status roles. Captain UI variables in `frontend/src/styles/captain-tokens.css` (`--bg-*`, `--accent`, `--text-*`, editor rails) drive the visible chrome and marketing home shell. New work should prefer `--cap-*` for system-wide behavior and map captain variables toward those roles when you touch legacy screens.

**Key Characteristics:**
- Dark-first, low-chroma neutrals with a single violet primary and a cool cyan secondary for highlights and gradients used sparingly on CTAs.
- Bilingual typography: Tajawal-forward for Arabic body, Syne for display in LTR contexts, Space Mono for timecodes and compact meta.
- Flat surfaces at rest; depth appears on selection, drag, and timeline focus via rings and soft glow, not heavy skeuomorphism.
- Motion is present but gated by `prefers-reduced-motion` across typing, slide-up, and caption preview loops.

## Colors

The palette is **Restrained** with a **Committed** accent lane: most pixels stay ink and graphite, while violet marks progress, selection, and primary actions.

### Primary
- **Signal Violet** (`#6c63ff`): Primary buttons, active caption borders, range accent, timeline emphasis.
- **Bright Violet** (`#8b80ff`): Hover brighten, badge text, stronger chip emphasis.

### Secondary
- **Ice Cyan** (`#4facfe`): Paired with violet on gradient CTAs and hero accents; use for secondary emphasis, not large fills.

### Tertiary
- **Amber Status** (banner pattern around `#f59e0b` at low opacity over surfaces): Non-blocking warnings and session hints, never as a second brand color at full saturation.

### Neutral
- **Ink Night** (`#0a0a0f`): Root background, scrollbar track, default void.
- **Card Graphite** (`#13131c`): Cards, upload well, caption list tiles at rest.
- **Panel Steel** (`#1a1a28`): Expanded rows, nested panels, position control wells.
- **Rail Void** (`#0c0c12`): Editor chrome rail; **Track Charcoal** (`#14141c`): timeline track.
- **Primary Text** (`#f0f0ff`), **Secondary Text** (`#8888aa`), **Muted Text** (`#555570`): hierarchy without extra hues.
- **Frost Border** (`#ffffff14`): Default hairline borders on cards and chips.

### Named Rules
**The One Accent Lane Rule.** Violet plus cyan gradients are allowed on primary CTAs and hero moments only. Do not sprinkle multi-hue gradients across settings lists or timeline chrome.

**The No Neon Flood Rule.** Glow and `text-shadow` pulses exist for active word karaoke and focused chips; keep opacity conservative so the UI never reads as nightclub neon.

## Typography

**Display Font:** Syne (with Tajawal, Noto Sans Arabic, system-ui)  
**Body Font:** Tajawal (with Syne, Noto Sans Arabic, system-ui)  
**Label or Mono Font:** Space Mono for timestamps, step counters, and numeric alignment.

**Character:** Syne gives confident LTR display headlines; Tajawal keeps Arabic body copy calm and legible at small sizes. The pairing should feel like a capable tool, not a fashion editorial.

### Hierarchy
- **Display** (800, `clamp(1.875rem, 5vw, 3rem)`, line-height ~1.15): Home hero title only.
- **Headline** (800, ~1.375rem): Mobile page titles and section impact.
- **Title** (600, 1rem): Card titles and strong list headers.
- **Body** (400, 0.9375rem, line-height ~1.45): Settings copy, hints, form labels; keep line length within ~72ch in reading panels.
- **Label** (700, ~11px, wide tracking, uppercase): `SettingCard` section labels and micro-categories.
- **Mono** (400, ~11px, tabular behavior): Word time ranges in caption rows and compact meta.

### Named Rules
**The Directional Stack Rule.** `index.css` swaps display versus body stacks by `dir` on `html`. Do not hardcode a single font stack in new components without respecting RTL and LTR.

## Elevation

The system is **tonally layered first**: darker rail, slightly lifted cards, lighter panels when expanded. Shadows are **ambient and rare**: sheet shadows appear on bottom sheets and heavy modals if used; most elevation is conveyed with borders, 1px rings, and soft outer glow on accent focus (`box-shadow` using `var(--accent-glow)` patterns), not deep Material drop shadows.

### Shadow Vocabulary
- **Sheet lift** (`0 24px 60px rgba(0,0,0,0.5)` from `--cap-shadow-sheet`): Large floating surfaces only.
- **Focus ring** (outline `2px` with `rgb(139 124 255 / 0.75)` from `--cap-focus-ring-color`): Keyboard and programmatic focus via `.cap-focus-visible`.
- **Accent bloom** (`0 0 0 3px` glow using `--accent-glow`): Selected caption row, expanded chip, without stacking multiple unrelated glows on one screen region.

### Named Rules
**The Flat Until Active Rule.** Cards and list tiles stay flat at rest. Add ring, border shift, or glow only for hover, active, or expanded states.

## Components

### Buttons
- **Shape:** Pill-soft rectangle, `10px` radius (`--radius-sm`), minimum touch height `44px` on mobile actions.
- **Primary:** Solid `accent-violet` fill, white label, semibold `14px` text; used for save and confirm in forms (`WordEditorForm`).
- **Gradient primary:** `linear-gradient` from violet to cyan on high-intent CTAs (`AdvancedEditorPage`, export bar). Reserve for one primary action per view.
- **Hover and focus:** Slight background brighten or gradient endpoints shift; focus uses `.cap-focus-visible` outline, not only color change.
- **Ghost and tertiary:** Transparent or `bg-surface` with `border-subtle`, text secondary, used for back navigation and low-destructive actions.

### Chips
- **Caption row chip:** Timecode chip uses `accent-dim` translucent violet fill, `accent-bright` text, `1px` border at ~20% violet opacity, mono numerals.
- **States:** Collapsed row shows subtle border; active adds inner ring and brighter border; expanded adds top border separator and slightly darker inner well (`black/20` overlay tone).

### Cards and containers
- **Corner style:** `16px` card radius (`--radius-card`) for upload zone and setting sections; `10px` for dense editor controls.
- **Background:** `surface-card` default; shift to `surface-panel` when nested or expanded.
- **Border:** `border-frost` hairline; dashed `2px` border on upload drop target.
- **Internal padding:** `12px` section padding (`--space-md`) on `SettingCard`, with `11px` uppercase labels above content groups.

### Inputs and fields
- **Style:** Dark field on `bg-base`, `1px` `border-subtle`, `10px` radius, `14px` minimum height for touch.
- **Focus:** Border shifts toward accent or soft outer glow (`focus:shadow` patterns in word editor inputs).
- **Error and disabled:** Danger text and border tints for destructive row actions; `disabled:opacity-40` on timeline icon buttons.

### Navigation
- **StudioNavBar:** Sticky top bar, `85%` opacity base with `backdrop-blur` where supported, hairline bottom border, safe-area padding for mobile.
- **Typography:** Small back control with icon, secondary default color, primary on hover.
- **Badge:** Pill micro-label with `accent-dim` fill and bright text for studio mode marker.

### Signature surfaces
- **UploadZone:** Large dashed container, radial icon well in `accent-dim` circle, progress bar using solid accent strip.
- **Caption timeline:** Horizontal scrubber with segment fills in accent tones, minimal square tool buttons on `surface-panel`.

## Do's and Don'ts

### Do:
- **Do** keep backgrounds in the ink-to-graphite family and let violet mark action, selection, and progress.
- **Do** respect `prefers-reduced-motion` by disabling slide, shimmer, caret, and caption loop animations while keeping content instantly visible.
- **Do** use `.cap-focus-visible` on interactive controls so keyboard users get a visible `2px` violet focus ring with offset.
- **Do** pair Syne display with Tajawal body per direction rules when adding new screens.

### Don't:
- **Don't** use over-neon color treatment or aggressively saturated glow-heavy visuals (from `PRODUCT.md` anti-references).
- **Don't** use decorative glassmorphism as the default styling language; blur in the nav or upload zone is structural separation, not a decorative glass card pattern everywhere.
- **Don't** build generic SaaS dashboards with repetitive card templates and KPI theater; prefer purpose-built editor blocks.
- **Don't** ship rigid corporate interfaces that feel cold, bureaucratic, or lifeless; keep warmth in copy spacing and touch targets, not in playful illustration.
- **Don't** use toy-like styling that reduces professional trust; avoid bubbly shapes, candy colors, or novelty icons for core editing paths.
