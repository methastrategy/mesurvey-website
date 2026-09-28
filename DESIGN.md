---
name: MESURV
description: Survey & Geomatics Engineering Field Terminal (Linear x Vercel Aesthetic)
colors:
  primary: "#6366f1"
  primary-hover: "#818cf8"
  primary-pressed: "#4f46e5"
  primary-subtle: "rgba(99, 102, 241, 0.08)"
  neutral-bg-dark: "#0a0a0b"
  neutral-surface-1-dark: "#111113"
  neutral-surface-2-dark: "#161618"
  neutral-surface-3-dark: "#1c1c1f"
  neutral-bg-light: "#ffffff"
  neutral-surface-1-light: "#f9fafb"
  neutral-surface-2-light: "#f3f4f6"
  neutral-surface-3-light: "#e5e7eb"
  hairline-dark: "rgba(255, 255, 255, 0.08)"
  hairline-light: "rgba(0, 0, 0, 0.08)"
  semantic-amber: "#f59e0b"
  semantic-emerald: "#10b981"
  semantic-rose: "#f43f5e"
typography:
  display:
    fontFamily: "'DM Sans', Prompt, -apple-system, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'DM Sans', Prompt, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'DM Sans', Prompt, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "'DM Sans', Prompt, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.025em"
rounded:
  micro: "2px"
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
---

# Design System: MESURV (Linear × Vercel Precision Instrument)

## Overview

**Creative North Star: "Precision Engineering Field Terminal"**

MESURV is an advanced geomatics, civil engineering, and land surveying terminal for field surveyors and engineering students in Thailand. The visual system fuses the ultra-clean, near-black, hairline-bordered clarity of **Linear** with the typography, focus mechanics, and **Electric Indigo** accents of **Vercel** and **Supabase**.

The interface balances outdoor field resilience with desktop engineering precision:
- **Zero Blurry Drop Shadows:** Depth is achieved through flat, rested surfaces separated by crisp 1px hairline borders (`rgba(255,255,255,0.08)` in dark, `rgba(0,0,0,0.08)` in light).
- **Single Primary Accent:** Electric Indigo (`#6366f1`) is the authoritative focal point across buttons, active tab indicators, and selection rings.
- **Instrument Rarity Rule:** Functional accents strictly signify operational state:
  - **Electric Indigo (`#6366f1`)**: Primary actions, active navigation, focus rings.
  - **Emerald (`#10b981`)**: Verified SOP badges, online telemetry ("RTSD READY"), closed traverses.
  - **Amber (`#f59e0b`)**: DRAFT provenance badges, warning thresholds, misclosure flags.
  - **Rose (`#f43f5e`)**: Destructive resets, gross errors, boundary check failures.

---

## 1. Design Token System

### 1.1 Color Tokens

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--canvas` | `#ffffff` | `#0a0a0b` | Base viewport substrate |
| `--surface-1` | `#f9fafb` | `#111113` | Primary cards, sidebars, modals |
| `--surface-2` | `#f3f4f6` | `#161618` | Inset wells, table headers, hovered rows |
| `--surface-3` | `#e5e7eb` | `#1c1c1f` | Tertiary elevation, badge backgrounds |
| `--border-hairline`| `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | 1px precision boundary |
| `--border-subtle`  | `rgba(0,0,0,0.12)` | `rgba(255,255,255,0.12)` | Interactive borders, focus boundaries |
| `--accent-indigo`  | `#6366f1` | `#6366f1` | Primary brand accent |
| `--accent-indigo-hover` | `#818cf8` | `#818cf8` | Hover state for buttons/links |
| `--accent-indigo-pressed` | `#4f46e5` | `#4f46e5` | Active/pressed micro-interaction |
| `--semantic-amber` | `#f59e0b` | `#f59e0b` | DRAFT status, warnings |
| `--semantic-emerald` | `#10b981` | `#10b981` | VERIFIED status, RTSD online |
| `--semantic-rose`  | `#f43f5e` | `#f43f5e` | Errors, misclosures |

### 1.2 Typography Tokens

- **UI / Body Font**: `DM Sans` (Google Fonts, weights 400, 500, 600, 700). Modern, geometric, clean Latin letterforms.
- **Thai Headroom Fallback**: `Prompt` (Google Fonts). Retains natural diacritic headroom (leading-normal: 1.5) preventing Thai tone mark clipping.
- **Mathematical & Coordinate Mono**: `JetBrains Mono` with `font-variant-numeric: tabular-nums`. Used for all latitudes, longitudes, UTM coordinates, elevations, and misclosure ratios.

### 1.3 Precision Radius Scale

- `micro: 2px` — Inline badges, code snippets, tags
- `sm: 6px` — Compact dropdown items, micro-buttons
- `md: 10px` — Form inputs, standard buttons, tabs
- `lg: 16px` — Content cards, popups, modals
- `xl: 24px` — Hero containers, floating overlays
- `full: 9999px` — Status pills, circular icon buttons

### 1.4 Micro-Interactions

- **Hover Lift (`.micro-lift`)**: `transform: translateY(-1px)` with subtle 150ms ease.
- **Press Scale (`.micro-press`)**: `transform: scale(0.97)` on `:active`.
- **Focus Ring (`.focus-ring`)**: `outline: none; box-shadow: 0 0 0 2px #6366f1;`.
- **Precision Card (`.card-precision`)**: Rests flat with `var(--border-hairline)`. On hover, border shifts to `rgba(99, 102, 241, 0.4)` with `box-shadow: 0 4px 24px rgba(99, 102, 241, 0.08)`.

---

## 2. Navigation Architecture

MESURV adopts a multi-tier responsive navigation shell:

### 2.1 Desktop Collapsible Sidebar (`>= 1024px`)
- **Position**: Fixed left column (`top-0 bottom-0 left-0 z-40`).
- **Widths**:
  - Expanded: `240px` (`w-[240px]`)
  - Collapsed: `56px` (`w-[56px]`, icon-only mode)
- **State Persistence**: Saved in `localStorage` under `mesurv-sidebar-collapsed`.
- **Leaflet Integration**: Dispatches `window.dispatchEvent(new Event('resize'))` upon width transition to eliminate map tile clipping.
- **Modules (4)**:
  1. `แผนที่ WebGIS` (`#/map`)
  2. `เครื่องมือคำนวณ` (`#/calculator`)
  3. `คู่มือสำรวจ` (`#/knowledge`)
  4. `เกี่ยวกับระบบ` (Modal trigger)
- **Active Module Styling**: `bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 font-semibold`.

### 2.2 Mobile Fixed Bottom Navigation (`< 1024px`)
- **Position**: Fixed bottom dock (`fixed bottom-0 left-0 right-0 z-50`).
- **Dimensions**: `min-h-[56px]`, touch targets >= `44x44px`.
- **Safe Area**: Respects `pb-[env(safe-area-inset-bottom)]`.
- **Viewport Protection**: In WebGIS map mode on mobile, map height is set to `h-[calc(100dvh-48px-56px)]` so bottom navigation never obscures Leaflet controls or inspection crosshairs.

### 2.3 Slim 48px Header (`h-12`)
- **Desktop**: Replaces previous 64px tabbed header. Displays:
  - Left: Interactive breadcrumbs (`MESURV / Module / Submodule`).
  - Right: System status badge (Emerald pulsing dot + "RTSD READY") and Theme Toggle (Sun/Moon, min-h-[44px] min-w-[44px]).
- **Mobile**: Minimalist brand title with current section badge and quick actions.

### 2.4 Hash Routing Continuity
The entire navigation shell operates purely as a presentation layer over `window.location.hash`:
- `#/map`
- `#/calculator` (`#/calculator/coord`, `#/calculator/traverse`, `#/calculator/leveling`, `#/calculator/area`)
- `#/knowledge` (`#/knowledge/:topicId`)

Browser back/forward history is 100% synchronized and all deep-linking unit tests pass without deviation.
