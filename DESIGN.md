---
name: Clipt
description: Dark-first caption workflow with Clipt forest-mint palette, Arabic-first type, and green signal accents.
colors:
  void-root: "oklch(0.13 0.022 142)"
  surface-base: "oklch(0.17 0.028 142)"
  surface-raised: "oklch(0.2 0.032 142)"
  text-mint: "oklch(0.94 0.02 132)"
  text-soft: "oklch(0.78 0.06 132)"
  text-muted: "oklch(0.58 0.04 140)"
  brand-green: "oklch(0.41 0.13 135)"
  brand-accent: "oklch(0.52 0.14 130)"
  brand-highlight: "oklch(0.72 0.12 128)"
  border-mint: "oklch(0.94 0.02 132 / 0.14)"
  border-strong: "oklch(0.72 0.12 128 / 0.45)"
  signal-danger: "oklch(0.62 0.2 25)"
  signal-success: "oklch(0.72 0.12 145)"
  scrim-teal: "oklch(0.72 0.09 175)"
typography:
  display:
    fontFamily: "Tajawal, \"Noto Sans Arabic\", system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4.6vw, 2.25rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Tajawal, \"Noto Sans Arabic\", system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Tajawal, \"Noto Sans Arabic\", system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "Tajawal, \"Noto Sans Arabic\", system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "Tajawal, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.08em"
  mono:
    fontFamily: "ui-monospace, \"Cascadia Code\", monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
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
    backgroundColor: "{colors.brand-green}"
    textColor: "{colors.text-mint}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.brand-accent}"
    textColor: "{colors.text-mint}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-mint}"
    borderColor: "{colors.brand-accent}"
    rounded: "{rounded.md}"
    padding: "11px 20px"
  chip-timecode:
    backgroundColor: "oklch(0.52 0.14 130 / 0.22)"
    textColor: "{colors.brand-highlight}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
---

# Design System: Clipt

## Overview

**Creative North Star: "Night Edit, Fresh Signal"**

A creator finishes a Reel at night at their desk, phone on a stand, one lamp on. The UI stays deep forest so the video and caption lines stay the focus. Mint and spring greens mark progress, selection, and primary actions. Nothing reads as neon club lighting or decorative glass.

**Implementation source of truth:** semantic CSS variables in `frontend/src/styles/globals.css` (`:root`). Tailwind maps to those variables in `frontend/tailwind.config.js` for utility classes such as `bg-surface` and `text-ink`.

**Key characteristics**
- Dark-first surfaces tinted toward brand green hue, not pure black or pure white.
- **Color strategy:** Restrained neutrals with a **Committed** green lane for CTAs, progress, and focus.
- Arabic-first typography with **Tajawal** as the primary UI family.
- Motion is short and easing-led; respect `prefers-reduced-motion` (see globals).

## Colors

### Primary
- **Brand green** (`oklch(0.41 0.13 135)`): primary buttons, solid progress fill, strong selection.
- **Brand accent** (`oklch(0.52 0.14 130)`): hover brighten, secondary emphasis, logotype accent letter.

### Secondary
- **Brand highlight** (`oklch(0.72 0.12 128)`): chips, borders on active drops, focus ring partner, secondary gradient end.

### Tertiary
- **Scrim teal** (`oklch(0.72 0.09 175)`): non-blocking informational pills (for example file limits), never a second rainbow accent.

### Neutrals
- **Void root**, **Surface base**, **Surface raised**: layered panels for upload, cards, and editor chrome.
- **Text mint / soft / muted**: hierarchy without extra hues.
- **Border mint / strong**: hairlines and drag-over affordances.

### Named rules
**One gradient lane.** Use `linear-gradient` on primary CTAs and hero marks only, built from brand green to brand accent. Do not stack unrelated multi-hue gradients across settings lists.

**No neon flood.** Avoid high-chroma fills on large backgrounds. Glow, if any, stays soft and tied to focus or active playback only.

## Typography

**Primary:** Tajawal (with Noto Sans Arabic, system-ui).

**Character:** confident, legible at small sizes, friendly without rounded “toy” excess. Headlines stay heavy; body stays medium weight for RTL clarity.

### Hierarchy
- **Display:** hero titles on home and major step titles.
- **Headline:** page titles and section impact.
- **Title:** card titles and list headers.
- **Body:** descriptions and helper lines; keep line length near **72ch** in reading panels.
- **Label:** uppercase micro labels with letter spacing for steps and categories.
- **Mono:** timecodes and numeric ranges; use tabular lining where available.

## Elevation

Depth is tonal first: void root to surface raised. Shadows are soft and green-tinted, used for cards and primary buttons, not deep material stacks.

## Components

### Buttons
- **Primary:** gradient from brand green to brand accent, mint text, generous height on mobile primary paths.
- **Secondary:** transparent with accent border (Clipt sheet pattern).
- **Ghost:** muted text, hover wash only.

### Chips and pills
- Timecode and format chips use translucent accent fills and mint or accent text, not rainbow status colors unless semantic (success, danger, info).

### Upload zone
- Dashed border that shifts toward accent on drag-over; circular mark uses the same primary gradient as the logo tile.

### Focus
- Visible `2px` outline using highlight or accent, with offset, on `.cap-focus-ring:focus-visible`.

## Motion (from Clipt identity reference)

- Micro interactions: **150ms** ease-out.
- Screen transitions: **300ms** ease-in-out.
- Progress value changes: **500ms** linear where a bar animates.
- Card entrance: **200ms** fade or slide without animating layout-critical properties.

All decorative motion respects `prefers-reduced-motion: reduce` in `globals.css`.

## Do's and Don'ts

### Do
- Keep large areas on void or surface tokens; let green carry meaning for action and progress.
- Pair high-contrast mint text on dark green buttons for AA-style pairings.
- Keep copy short, stepwise, and reassuring in Arabic.

### Don't
- Introduce violet or unrelated purple as a brand accent (legacy palette).
- Use glass blur as a decorative default.
- Use gradient text or colored side-stripe borders as decoration (shared impeccable bans).
