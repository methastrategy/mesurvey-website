---
target: src/components/map/WebMap.tsx
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:D:\\METHA\\MESURV\\mesurv-website\\src\\components\\map\\WebMap.tsx"
target_fingerprint: "sha256:63c186e41dbaec5a27c35c4c5959e3426f15f03d8855282447bb877a0fe01904"
target_path: "D:\\METHA\\MESURV\\mesurv-website\\src\\components\\map\\WebMap.tsx"
timestamp: 2026-09-27T18-49-39Z
slug: src-components-map-webmap-tsx
---
Method: dual-agent (A: 3b3fc779-47fe-41bd-a9c7-14136cc69983 · B: 3cf04b00-776d-4e18-967e-ed90df85d88f)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2/4 | No live cursor coordinate readout, no map scale bar, and no tile loading indicator. Active measure mode is visible only via floating pill. |
| 2 | Match System / Real World | 3/4 | Thai land area units (Rai-Ngan-Wah) and UTM projection are geodetically sound, but inspection pins mimic consumer Google Maps rather than survey benchmarks. |
| 3 | User Control and Freedom | 2/4 | No "Undo last point" during multi-point distance/polygon measurement; users must wipe the entire measurement (`RotateCcw`) if a single point is misplaced. |
| 4 | Consistency and Standards | 2/4 | Popup coordinates use generic `monospace` or `ui-monospace` with negative tracking instead of `JetBrains Mono`; measurement pill uses sans font. |
| 5 | Error Prevention | 2/4 | High accidental misclick risk due to sub-30px hitboxes; destructive `RotateCcw` clear has no undo or confirmation for complex polygons. |
| 6 | Recognition Rather Than Recall | 2/4 | Mobile view hides all text labels (`hidden sm:inline`), reducing the toolbar to 7 icon-only buttons without visible labels or mobile tooltips. |
| 7 | Flexibility and Efficiency | 2/4 | Bookmarks and GeoJSON import work well, but zero keyboard shortcuts (`Esc`, `M`, `Z`, `1-4`), no coordinate jump/search bar, and no batch point export. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Floating frosted-glass aesthetic wraps into 2 stacked lines on mobile, occluding >25% of the upper map and colliding with floating helper banners (`top-20`). |
| 9 | Error Recovery | 2/4 | Geolocation failure triggers native blocking browser `alert()`, disrupting field terminal immersion. |
| 10 | Help and Documentation | 2/4 | Static bottom hint exists, but no contextual gesture guide (pinch/drag/vertex click rules) for field survey operations. |
| **Total** | | **21/40** | **Acceptable (Significant improvements needed)** |

#### Design Specificity Verdict

**LLM assessment**: While the mathematical core contains geodetic rigor (UTM projection, Thai Land Units Rai-Ngan-Wah), the visual and interaction layer is heavily copied from consumer web apps (Google Maps SVG red pin `#EA4335`, generic blue `#007AFF` copy buttons, consumer map tiles, and missing HUD instrumentation). It does not yet embody the promised *"The Field Engineering Terminal"* aesthetic defined in `DESIGN.md`.

**Deterministic scan**: 14 issues detected across `src/components/map`:
- 2 warnings for fonts outside `DESIGN.md` (`Roboto`, `Sfmono-Regular`).
- 12 advisories for hardcoded colors (`#b45309`, `#007AFF`, `rgba(0,122,255,0.3)`), literal font sizes (`font-size: 11px`), and arbitrary utility classes (`text-[11px]`).

#### Three Core Concerns: Field Engineering Evaluation

1. **Touch Targets (Minimum 44×44px Standard):**
   - **CRITICAL DEFICIT:** Tool buttons have computed heights of **28px** (`p-1.5` and `py-1.5`). Basemap selector pills are **22px–24px**. The Inspect "เสร็จสิ้น" button is only **20px**! All interactive controls fail WCAG 2.5.5 touch target standards by 16px to 24px, making one-handed field operation under sunlight or with survey gloves error-prone.
2. **Map Occlusion & Viewport Collisions:**
   - **HIGH COLLISION RISK:** On viewports < 768px, `MapToolbar` wraps into 2–3 rows (height expanding to 90px–110px). The Inspect Guidance Banner and Measurement Result Pill are hardcoded at `top-20` (80px), causing the wrapped toolbar to physically drop down and overlap the banners.
3. **Tabular Precision Rule & Geodetic Data Hygiene:**
   - **NON-COMPLIANT with `DESIGN.md`:** Popup coordinates use generic `monospace` with negative tracking (`-0.2px`), measurement pills render numbers in sans-serif font without `tabular-nums`, and there is no live HUD showing dynamic cursor/center coordinates in WGS84 and UTM.

#### Overall Impression
The map engine and calculation logic are rock-solid, but the UI is currently trapped between a consumer map clone and a professional geomatics tool. Addressing touch ergonomics, layout wrapping, and tabular precision will transform it into an elite field terminal.

#### What's Working
1. **Integrated Geodetic Land Units:** Instant conversion to Thai cadastral units (`ไร่-งาน-ตารางวา`).
2. **Synchronous Mode Handling (`measureModeRef`):** Prevents touch event traps and race conditions during canvas interaction.
3. **Survey Bookmark Quick-Jump:** Thoughtful geodetic preset system for major Thai reference stations.

#### Priority Issues
- **[P0] Sub-Standard Touch Targets on All Field Controls:**
  - *Why it matters:* Extreme misclick rates in outdoor field conditions.
  - *Fix:* Enforce `min-h-[44px] min-w-[44px]` on all interactive buttons.
  - *Suggested command:* `/impeccable adapt`
- **[P1] Mobile Layout Wrapping & Floating Banner Collision:**
  - *Why it matters:* Wrapped toolbar covers upper map and hides measurement readouts.
  - *Fix:* Move primary field tools into a bottom thumb-dock on mobile, and collapse basemaps into an expandable icon.
  - *Suggested command:* `/impeccable layout`
- **[P1] Tabular Precision Rule & Telemetry HUD Absence:**
  - *Why it matters:* Numbers jitter during dynamic updates, and coordinates lack standardized terminal styling.
  - *Fix:* Standardize all coordinate displays to `JetBrains Mono` with `tabular-nums` and introduce a bottom Telemetry HUD bar.
  - *Suggested command:* `/impeccable typeset`
- **[P2] Lack of Vertex Undo in Measurement Modes:**
  - *Why it matters:* Accidental tap forces full polygon reset with no way to undo the last point.
  - *Fix:* Add an "Undo Last Vertex" button to the active measurement toolbar.
  - *Suggested command:* `/impeccable harden`

#### Persona Red Flags
- **Field Surveyor Under Bright Sunlight (Somchai, Site Geomatics Engineer):** Tiny 28px buttons cause missed taps; low-contrast gray text washes out; red pin lacks geodetic crosshair center-punch mark.
- **Distracted Mobile User ("Casey"):** Reaching to the top of a 6.7" phone causes thumb strain; unlabeled icons cause confusion.
- **Impatient Power User ("Alex"):** Zero keyboard accelerators (`Esc`, `M`, `Z`); no direct UTM coordinate jump search.

#### Minor Observations & Questions to Consider
- The external pin uses amber, inspect uses red, GPS uses blue; needs unified domain legend.
- Replacing browser-native `alert()` on GPS failure with an in-canvas toast improves continuity.
