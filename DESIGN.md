---
name: Clipt
description: Light-first, fresh, and friendly caption workflow with Clipt spring-green palette, Arabic-first type, and crisp contrast.
colors:
  surface-base: "oklch(0.97 0.02 145)" # #F0FDF4 - Main Light Background
  surface-raised: "oklch(0.95 0.04 135)" # #EAF3DE - Cards, Badges, Icons
  text-ink: "oklch(0.25 0.05 135)" # #1A2E0A - Near Black
  text-primary: "oklch(0.35 0.08 135)" # #27500A - Dark Text
  text-secondary: "oklch(0.45 0.06 135)" # Muted Text
  text-tertiary: "oklch(0.55 0.04 135)" # Very Muted / Meta
  brand-green: "oklch(0.44 0.12 135)" # #3B6D11 - Primary Actions, Solid Fill
  brand-accent: "oklch(0.58 0.15 130)" # #639922 - Highlight, Secondary borders
  brand-highlight: "oklch(0.75 0.14 125)" # #97C459 - Subtle borders, inputs
  border-subtle: "oklch(0.9 0.06 135)" # Card borders
  border-strong: "oklch(0.75 0.14 125)" # Stronger borders
typography:
  display:
    fontFamily: "Tajawal, \"Noto Sans Arabic\", system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Tajawal, \"Noto Sans Arabic\", system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Tajawal, \"Noto Sans Arabic\", system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "Tajawal, \"Noto Sans Arabic\", system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Tajawal, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.08em"
    textTransform: "uppercase"
  mono:
    fontFamily: "ui-monospace, \"Cascadia Code\", monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "10px"
  md: "12px"
  lg: "18px"
  card: "18px"
  pill: "99px"
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
    textColor: "{colors.surface-raised}"
    rounded: "{rounded.md}"
    padding: "11px 20px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.brand-accent}"
    rounded: "{rounded.md}"
    padding: "11px 20px"
  card-caption:
    backgroundColor: "{colors.surface-base}"
    borderColor: "{colors.brand-highlight}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: Clipt (Light Mode)

## Overview

**Creative North Star: "Fresh, Friendly, and Fast"**

A creator needs to upload, transcribe, and review their video captions quickly during the day. The UI is exceptionally bright and crisp, using a spring-green palette that feels energetic but professional. It avoids the heavy, clinical feel of SaaS dashboards by utilizing high-contrast, nature-inspired greens on soft, breathable surfaces.

**Implementation source of truth:** semantic CSS variables in `frontend/src/styles/globals.css` (`:root`). Tailwind maps to those variables in `frontend/tailwind.config.js` for utility classes such as `bg-surface` and `text-ink`.

**Key characteristics**
- **Light-first surfaces**: Tinted toward brand green hue (e.g., `#F0FDF4`), never pure white.
- **Color strategy:** "Restrained". Fresh, clean backgrounds with purposeful green accents for progress, actions, and selection.
- **Typography:** Arabic-first typography with **Tajawal** as the primary UI family. High legibility with distinct weight contrast.
- **Motion:** Short and easing-led; respects `prefers-reduced-motion`. Micro-interactions feel snappy and responsive.

## Colors

### Primary
- **Brand green** (`#3B6D11`): Primary buttons, active progress fill, primary icons. The main action color.
- **Accent** (`#639922`): Secondary button borders, timecode text, active state highlights, and logo accents.

### Secondary / Structural
- **Highlight** (`#97C459`): Input borders, active card borders, focus rings.
- **Surface** (`#EAF3DE`): Badges, icon background circles, progress tracks, logo marks.
- **Surface Light** (`#F0FDF4`): Main application background, content cards.

### Neutrals (Text & Ink)
- **Text dark** (`#27500A`): Primary body text, headings, secondary button text.
- **Near black** (`#1A2E0A`): Highest contrast text, critical emphasis.
- **Text muted**: Secondary descriptions and metadata.

## Typography

**Primary:** Tajawal (with Noto Sans Arabic, system-ui).

**Character:** Friendly, confident, and readable. Uses `500` weight heavily for headings, labels, and buttons, contrasting with `400` for body text.

### Hierarchy
- **Display (38px):** Logotype and hero moments.
- **Headline 1 (22px):** Page titles (e.g., "ارفع فيديوهك الآن").
- **Headline 2 (16px):** Section headers (e.g., "راجع الكابشن").
- **Body (14px):** Descriptions and general text.
- **Label/Caption (11px/12px):** Uppercase, letter-spaced labels, meta info.

## Elevation & Layout

Depth is defined by subtle borders (`0.5px solid`) and tonal backgrounds (`Surface Light` vs `Surface`), rather than heavy drop shadows.
- Cards use an `18px` border radius with a `0.5px` border.
- Inputs and small cards use `10px` or `12px` border radius.

## Components

### Buttons
- **Primary:** Solid `#3B6D11` background, `#EAF3DE` text, `12px` border radius.
- **Secondary:** Transparent background, `#27500A` text, `#639922` border, `12px` border radius.

### Badges & Pills
- **Standard Badge:** `#EAF3DE` background, `#27500A` text, `99px` radius.
- **Dark/AI Badge:** `#27500A` background, `#C0DD97` text, `99px` radius.

### Progress Bar
- Track: `#EAF3DE` background.
- Fill: `#3B6D11` background.

### Caption Card
- Background: `#F0FDF4`
- Border: `0.5px solid #97C459`
- Timecode: `#639922`
- Text: `#27500A`

### Icons
- Displayed inside a `#EAF3DE` rounded square (`12px` radius) with `#3B6D11` icon color.

## Motion (from Clipt identity reference)

- **Micro interactions:** 150ms ease-out.
- **Screen transitions:** 300ms ease-in-out.
- **Progress updates:** 500ms linear.
- **Card entrance:** 200ms slide-up.

## Do's and Don'ts

### Do
- Ensure all backgrounds have a slight tint of green; avoid pure `#FFFFFF`.
- Use the dark text colors (`#27500A`, `#1A2E0A`) to maintain strong contrast against the light surfaces.
- Rely on border colors for definition between elements rather than heavy shadows.

### Don't
- Don't use dark mode patterns (e.g., `#1A2E1A`) as main backgrounds; they are reserved for specific badges or the dark logo variant.
- Don't mix multiple unrelated hues. Stick strictly to the green monochromatic scale provided.
