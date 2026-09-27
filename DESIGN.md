---
name: MESURV
description: Survey & Geomatics Engineering Field Terminal
colors:
  primary: "#0284c7"
  primary-hover: "#0369a1"
  primary-subtle: "#e0f2fe"
  neutral-bg: "#f8fafc"
  neutral-surface: "#ffffff"
  neutral-surface-dark: "#131b2c"
  neutral-border: "#e2e8f0"
  neutral-border-dark: "#1e293b"
  text-primary: "#0f172a"
  text-secondary: "#475569"
  text-muted: "#94a3b8"
  text-inverse: "#f8fafc"
  accent-gnss: "#a855f7"
  accent-drone: "#f59e0b"
  accent-laser: "#10b981"
  accent-sonar: "#06b6d4"
  accent-tbm: "#f43f5e"
  success: "#10b981"
  warning: "#f59e0b"
  danger: "#ef4444"
typography:
  display:
    fontFamily: "Inter, Prompt, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, Prompt, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter, Prompt, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, Prompt, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.025em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-surface:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-surface-hover:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input-field:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
---

# Design System: MESURV

## Overview

**Creative North Star: "The Field Engineering Terminal"**

MESURV is engineered as a robust, high-fidelity field terminal for geomatics, civil engineering, and land surveying practitioners. The visual language mirrors the precision instrumentation of high-end total stations, digital levels, and GNSS RTK controllers: razor-sharp line weights, zero visual frivolity, high information density, and instant sunlight readability.

The interface balances outdoor field resilience with desktop engineering precision. Under intense field glare, high-contrast borders and structured card containers prevent visual bleed. In the office, a refined typographic scale and quiet spatial rhythm allow engineers to audit dense traverse misclosures, coordinate transformations, and leveling sheets without visual fatigue.

**Key Characteristics:**
- **Terminal-Grade Rigor:** Information is structured into deliberate modules, cards, and data matrices with clear hierarchical boundaries.
- **Sunlight & Glare Resilience:** Avoids washed-out low-contrast tints; uses authoritative solid slate-900 / white surfaces with 1px structural framing.
- **Bilingual Typographic Harmony:** Inter delivers crisp Latin numbers and geodetic terms; Prompt provides seamless, unclipped Thai field terminology.
- **Tactile Confidence:** Interactive cards and control elements exhibit subtle hover elevations (Card Lift) that confirm touch readiness under active field conditions.

## Colors

The palette draws from physical geodetic hardware (cadastral blue, optical instrument slate, and safety/geomatic spectrum accents).

### Primary
- **Cadastral Sky** (`#0284c7`): The signature brand and active focal color. Used for active navigation tabs, interactive primary buttons, and selected category indicators.
- **Deep Marine** (`#0369a1`): Hover state for primary interactions, ensuring decisive feedback upon tap or click.
- **Glacial Tinge** (`#e0f2fe`): Subtle background tint for selected chips and active badges in light mode.

### Secondary
- **Slate Frame** (`#475569`): Secondary labels, field notes, supporting descriptions, and inactive icon strokes.
- **Instrument Dark** (`#0b0f17`): Deep nocturnal backdrop for the night/tunnel mode, minimizing optical distraction.
- **Chamber Navy** (`#131b2c`): Elevated dark card surface providing contrast against the dark background.

### Domain Accents
- **GNSS Satellite Purple** (`#a855f7`): Geodetic coordinate systems, CORS networks, and orbital satellite topics.
- **UAV Amber** (`#f59e0b`): Drone photogrammetry, flight lines, ground sample distance (GSD), and warning limits.
- **Laser Emerald** (`#10b981`): Terrestrial LiDAR, SLAM point clouds, and successful closure tolerances.
- **Bathymetric Cyan** (`#06b6d4`): Hydrographic sounding, sonar transducers, and water depth contours.
- **Tunnel Rose** (`#f43f5e`): TBM guidance, laser targets, shield alignment, and critical reset/danger actions.

### Neutral
- **Field Canvas Light** (`#f8fafc`): High-luminosity, eye-friendly light background.
- **Field Canvas Dark** (`#0b0f17`): Low-glare tunnel and night operations canvas.
- **Structural Border Light** (`#e2e8f0`): 1px boundary separating coordinate cards and list rows.
- **Structural Border Dark** (`#1e293b`): Subtle dark mode separator.

### Named Rules
**The Instrument Rarity Rule.** Domain accent colors are semantic beacons, not decorative paint. Any single screen should contain at most one dominant domain accent, reserved strictly for its contextual discipline.

**The No-Gradient Rule.** Text never wears a gradient. Legibility and contrast under sunlight dictate solid, high-contrast typography at all times.

## Typography

**Display Font:** Inter & Prompt (fallback: `-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`)
**Body Font:** Inter & Prompt
**Label/Mono Font:** JetBrains Mono (fallback: `SF Mono, Fira Code, monospace`)

**Character:** Technical, confident, and bilingual. Inter handles all Latin text, mathematical symbols, and numerals with tall x-height; Prompt handles Thai characters with balanced proportions and open loops.

### Hierarchy
- **Display** (ExtraBold 800, `1.875rem` / `30px`, line-height `1.25`): Page headers and primary terminal titles.
- **Headline** (Bold 700, `1.25rem` / `20px`, line-height `1.35`): Section headings and modal titles.
- **Title** (SemiBold 600, `1rem` / `16px`, line-height `1.4`): SOP card titles, table column groupings.
- **Body** (Regular 400, `0.875rem` / `14px`, line-height `1.625`): Procedure descriptions, field instructions, technical summaries. Measure constrained to 65–75ch.
- **Label** (Medium 500, `0.75rem` / `12px`, tracking `0.025em`): Metadata tags, badge pills, units of measurement, coordinates.

### Named Rules
**The Tabular Precision Rule.** Every number representing latitude, longitude, Northing, Easting, elevation, misclosure, or azimuth MUST render in `JetBrains Mono` with `font-variant-numeric: tabular-nums` to guarantee vertical column alignment.

**The Diacritic Headroom Rule.** Thai body and navigation text must never use line-height below `leading-normal` (1.5) to prevent ascender and descender clipping of tone marks.

## Layout

MESURV employs an adaptive 12-column engineering grid optimized for both quick handheld lookup and multi-pane office analysis:

- **Desktop (≥ 1024px):** 3-column sticky category facet sidebar paired with a 9-column substantive content pane.
- **Mobile & Tablet (< 1024px):** Horizontal swipeable chip carousel pinned directly below search, freeing up 100% of the vertical viewport for content.
- **WebGIS Canvas Mode:** The outer layout locks (`overflow: hidden`), removing footers and expanding the map viewport to full screen (`100dvh - 4rem`).
- **Container Max-Width:** Clamped to `max-w-7xl` (`1280px`) with fluid horizontal padding (`px-3 sm:px-6 lg:px-8`).

## Elevation & Depth

Depth is established through physical "Tactile Depth": surfaces rest flat on their substrate with a crisp 1px border, but lift with subtle ambient shadows when interactive.

### Shadow Vocabulary
- **Resting Card:** (`shadow-xs` / `0 1px 2px rgba(0,0,0,0.02)` with `1px` border): Establishes clean visual boundaries without visual weight.
- **Hover Lift:** (`shadow-md shadow-sky-500/5` with `translate-y-[-1px]` or border shift to `#0284c7`): Confirms tactile affordance and clickability.
- **Floating Modals / Toolbars:** (`shadow-[0_8px_30px_rgba(0,0,0,0.12)]` with `backdrop-blur-2xl`): Floats cleanly over the map or document viewport.

### Named Rules
**The Rested Surface Rule.** Cards and data containers sit flush at rest. Elevated shadows only manifest in response to direct user interaction (hover, active focus, or overlay modals).

## Shapes

- **Base Radius Scale:**
  - Micro Badges & Inputs: `rounded-xl` (`12px`)
  - Content Cards & Modals: `rounded-2xl` (`16px`)
  - Hero Panels & Mobile Nav: `rounded-3xl` (`24px`)
  - Filter Pills & Status Indicators: `rounded-full` (`9999px`)
- **Border Treatment:** Always paired with a delicate, high-contrast 1px border (`border-slate-200/90` in light, `border-slate-800/80` in dark).

## Components

### Buttons
- **Shape:** Rounded rectangle (`rounded-xl`, 12px radius).
- **Primary:** Cadastral Sky background (`#0284c7`), white text, bold font, padding `8px 16px`. Hover transitions to Deep Marine (`#0369a1`).
- **Secondary:** Clean slate surface (`bg-slate-100 dark:bg-slate-800`), slate text, 1px border. Hover transitions to sky tint (`hover:text-sky-700`).

### Category Chips
- **Style:** Compact pill or rounded box with embedded icon and numerical counter badge.
- **Selected State:** Light sky background (`bg-sky-50 dark:bg-sky-950/60`), cadastral blue text (`text-sky-700 dark:text-sky-300`), 1px sky border (`border-sky-300 dark:border-sky-800`).
- **Unselected State:** Neutral white/dark canvas with subtle slate border.

### SOP & Result Cards
- **Structure:** 16px corner radius (`rounded-2xl`), 1px border, 20px padding (`p-5 sm:p-6`).
- **Interaction:** On hover, border shifts toward sky blue with a delicate shadow (`hover:shadow-md hover:border-sky-300`).

### Numeric & Coordinate Inputs
- **Style:** `JetBrains Mono` font, 12px radius (`rounded-xl`), 1px border, high-contrast dark/light background.
- **Focus:** 2px ring in sky blue (`focus:ring-2 focus:ring-sky-500 focus:outline-none`).

### WebGIS Map Overlay Toolbar
- **Style:** Frosted glass pill (`backdrop-blur-2xl bg-white/90 dark:bg-[#131b2c]/90`), rounded full, floating with high z-index.

## Do's and Don'ts

### Do:
- **Do** format all survey coordinates, angles, azimuths, and elevations in `font-mono tabular-nums`.
- **Do** preserve 1px structural borders around all cards and input modules for sunlight readability.
- **Do** keep Thai line height at `leading-normal` or `leading-relaxed` to protect tone marks.
- **Do** use semantic domain colors (Purple for GNSS, Emerald for Laser, Amber for Drone) exclusively where relevant.

### Don't:
- **Don't** use gradient text on titles, headings, or metrics.
- **Don't** use low-contrast gray text on colored backgrounds (avoid `text-slate-500 on bg-rose-50`).
- **Don't** introduce heavy, opaque drop shadows (`box-shadow: 0 20px 25px`) on resting field cards.
- **Don't** let outer page scroll bars activate during WebGIS map mode.
