# DESIGN.md — MESURV: Geomatics & Survey Engineering Field Terminal
> **Design System Status**: **LOCKED PRODUCTION SPEC** (`/medesign` §6 Champion Fusion + `/ui-ux-pro-max`)
> **DNA Synthesis**: **Topographic Fieldbook** (`#f3f1eb` Warm Sand Light) × **Obsidian Telemetry Terminal** (`#050505` Pitch Dark)
> **Domain**: Survey Engineering & Geoinformatics, Kasetsart University (RTSD Standards, Geodetic Projections, Traverse, Leveling, WebGIS)

---

## 1. Visual Direction & Domain Philosophy

**MESURV** is built as a **high-precision Geomatics Field Terminal & SOP Knowledge Hub** for Survey Engineers:
1. **Dual-Environment Adaptability**: Survey engineers work across two extreme lighting environments—direct outdoor sunlight (requiring warm, glare-free paper contrast) and indoor CAD/GIS post-processing labs (requiring pitch-black obsidian contrast). MESURV provides an instant, zero-FOUC toggle between `FIELDBOOK` (`data-theme="fieldbook"`) and `TERMINAL` (`data-theme="terminal"`).
2. **Solid Architectural Surfaces**: Every card, console, and HUD panel uses solid surfaces with crisp `1px solid var(--border)` structural hairlines. Frosted glass (`backdrop-filter: blur`) and decorative gradients are strictly prohibited.
3. **Tabular Numeric Discipline**: Every coordinate (`Easting`, `Northing`, `Lat/Lon`), azimuth (`DDD°MM'SS"`), closure ratio (`1:N`), and elevation readout (`RL`) enforces `Geist Mono` + `font-variant-numeric: tabular-nums`.

---

## 2. Dual-Theme Token Architecture (`src/index.css`)

### Theme A — `data-theme="fieldbook"` (Outdoor Sunlight / Warm Fieldbook Default)
| Token | Value | Role |
| :--- | :--- | :--- |
| `--bg` | `#f3f1eb` | Warm Sand / Topographic Map Paper Canvas |
| `--surface` | `#ffffff` | Primary Card & Console Surface |
| `--surface-2` | `#eceae4` | Recessed Readout / Input Well / Code Surface |
| `--border` | `rgba(20, 36, 27, 0.14)` | `1px` Structural Hairline Border |
| `--border-strong` | `rgba(20, 36, 27, 0.5)` | High-Contrast Active Focus / Spec Border |
| `--text-1` | `#14241b` | Primary Forest-Black Ink (Headings, Coordinates, Primary Data) |
| `--text-2` | `#43544a` | Secondary Ink (Descriptions, SOP Body Copy) |
| `--text-3` | `#57665c` | Muted Ink (Metadata, Unit Labels, Code IDs — WCAG 2.1 AA `≥ 5.0:1`) |
| `--accent` | `#15803d` | KU Survey Forest Emerald (Primary CTA, Active Tab Bar, Target Pins) |
| `--accent-2` | `#b45309` | Survey Brass / Ochre (`RTSD` Badges, Telemetry Accent) |
| `--accent-text` | `#ffffff` | Foreground Ink on `--accent` Buttons |
| `--card-radius` | `12px` | Tactile Fieldbook Card Radius |
| `--btn-radius` | `8px` | Tactile Instrument Button Radius |

### Theme B — `data-theme="terminal"` (Indoor Post-Processing / Obsidian Terminal)
| Token | Value | Role |
| :--- | :--- | :--- |
| `--bg` | `#050505` | True Pitch-Black Obsidian Canvas |
| `--surface` | `#111111` | Primary Instrument Module Surface |
| `--surface-2` | `#0a0a0a` | Telemetry Well / Input Surface |
| `--border` | `#262626` | `1px` Exposed Technical Hairline |
| `--border-strong` | `#3d3d3d` | Active Structural Border |
| `--text-1` | `#ffffff` | Crisp Alabaster Primary Readout |
| `--text-2` | `#a3a3a3` | Neutral Slate Body & Formula Copy |
| `--text-3` | `#8a8a8a` | Muted Metadata & Station Indices (WCAG 2.1 AA `≥ 5.6:1`) |
| `--accent` | `#34d399` | Phosphor Telemetry Emerald (Active Tabs, Primary Action) |
| `--accent-2` | `#fcd535` | High-Visibility Total Station Amber |
| `--accent-text` | `#000000` | High-Contrast Dark Ink on `#34d399` Buttons |
| `--card-radius` | `2px` | Precision Terminal Micro-Radius |
| `--btn-radius` | `2px` | Precision Terminal Button Radius |

---

## 3. Typography & Scannable Hierarchy

- **UI & Thai Engineering Copy (`--font-sans`)**: `'Plus Jakarta Sans'`, `'Prompt'`, `-apple-system`, `sans-serif`
  - Hero Title: `clamp(1.75rem, 3vw, 2.25rem)`, `font-weight: 800`, `letter-spacing: -0.025em`, `line-height: 1.25`
  - Section / Console Header: `1.125rem`–`1.5rem`, `font-weight: 700`
  - SOP Body Copy: `0.9375rem` (`15px`), `line-height: 1.65`, `60ch–70ch` measure
- **Telemetry & Mathematical Readouts (`--font-mono`)**: `'Geist Mono'`, `'JetBrains Mono'`, `monospace`
  - Mandatory `font-variant-numeric: tabular-nums` on all coordinate tables, misclosure badges, and map HUD coordinates.

---

## 4. Layout, Navigation & Component Specifications

1. **Top Navigation Bar (`Header.tsx`)**:
   - `64px` fixed height (`min-h-[64px]`), solid `--nav-bg` surface with `1px solid var(--border)` bottom hairline.
   - Brand Identity: `MESURV | FIELD TERMINAL v4.2` with accent highlight on `SURV`.
   - Navigation Tabs (`Knowledge Hub`, `Calculators`, `WebGIS Map`): Clean `2px` bottom border indicator (`border-bottom: 2px solid var(--accent)`) on active state—no pill or box backgrounds.
   - Right Controls: `RTSD READY` pulsing status badge + `FIELDBOOK` / `TERMINAL` theme toggle + `About` modal trigger (`44×44px` touch targets).
2. **Hero & Telemetry Split (`KnowledgeHub.tsx`)**:
   - 2-column asymmetric split (`1.35fr : 1fr`) on desktop.
   - Left: `FIELD SPECIFICATION • RTSD STANDARD` eyebrow, main heading, description, and action buttons (`Open Traverse Calculator`, `Browse Field SOPs`).
   - Right: 2×2 `Geist Mono` telemetry benchmark cards (`1 : 10,000` Third-Order Traverse, `±12 mm√K` Leveling, `UTM 47N / 48N` WGS84, `3 Axis` Collimation).
3. **SOP Card Grid (`KnowledgeHub.tsx`)**:
   - 3-column grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, `16px` gap) with max 4 data points per card:
     1. Monospace SOP Code (`SOP-01`..`SOP-09`) + Difficulty Badge (`BEGINNER` / `CORE` / `ADVANCED`)
     2. Bold Thai Title (`line-clamp-2`)
     3. Concise 2-line Summary (`line-clamp-2`)
     4. Footer Metadata + `Inspect Spec →` link
4. **Geodetic Calculators & CORS Telemetry Strip (`CalculatorHub.tsx`)**:
   - 2×2 console picker with live `Geist Mono` telemetry preview windows, `2px` underline quick-switcher bar when a calculator is active, and a persistent bottom `CORS TELEMETRY: KU-BANGKHEN BASE` bar (`E: 669,842.118 m | N: 1,531,204.592 m`, `GEOID: TGM2017`).
5. **WebGIS Full-Viewport Canvas (`WebMap.tsx` & `MapToolbar.tsx`)**:
   - Locked viewport (`height: calc(100dvh - 4rem)`) with solid Dual-Theme floating toolbar and bottom coordinate HUD.
   - Every interactive control (`<button>`, `<select>`, `.leaflet-control-zoom a`, `.leaflet-popup-close-button`) enforces a minimum `44×44px` touch target for outdoor field glove/thumb operation.

---

## 5. Anti-Patterns (Strictly Forbidden)

- **No Fixed Left Sidebar**: Never add a persistent left navigation rail; preserve 100% horizontal viewport width for wide leveling/traverse tables and WebGIS canvas.
- **No Frosted Glass or Blur**: Never use `backdrop-filter: blur(...)` or translucent glassmorphism cards.
- **No Gaudy Gradients**: Never use multi-stop neon/purple gradients on backgrounds, buttons, or text.
- **No Box/Pill Active Nav Tabs**: Main navigation and category filter bars must use a clean `2px` bottom border indicator (`border-bottom: 2px solid var(--accent)`).
- **No Emojis in Headings**: Use crisp Lucide vector icons (`1.75px`–`2px` stroke) or monospace spec codes (`SOP-01`, `CALC-01`).
- **No Hover Bounce**: Hover states transition border color (`border-color: var(--accent)`) cleanly in `150ms` without vertical bounce (`translateY`) or scale transforms.
