# Project: MESURV Field Terminal Hardening

## Architecture
MESURV is a production-grade web-based Geomatics and Survey Engineering Terminal built with React 19, TypeScript, Vite, Tailwind CSS, Leaflet WebGIS, and Zustand offline state persistence.

### Module Boundaries
1. **Geodetic & Engineering Calculation Engines (`src/core/`)**:
   - `projections.ts`: WGS84 (EPSG:4326), UTM 47N/48N (EPSG:32647/32648), Indian 1975 (EPSG:24047/24048) transformations and boundary validation.
   - `traverse.ts`: Bowditch (Compass Rule) traverse adjustments, linear misclosure, precision ratio (1:N), and RTSD survey classifications.
   - `leveling.ts`: Differential leveling engine with Height of Instrument (HI) & Rise and Fall methods, turning point sequences, and RTSD order compliance (±4√K, ±8√K, ±12√K, ±24√K mm).
2. **Field Terminal WebGIS & Interaction Usability (`src/components/map/`, `src/core/geojson-validator.ts`)**:
   - `WebMap.tsx`: Leaflet WebGIS map canvas, inspection reticle, HUD coordinate telemetry, GPS/GNSS geolocation, and non-occluding layout.
   - `MapToolbar.tsx`: Tactical map toolset and basemap switcher with touch targets ≥ 44x44px.
   - `GeoJsonUploader.tsx`: RFC 7946 WGS84 GeoJSON uploader and layer inspector.
   - `geojson-validator.ts`: Structural and coordinate validator for RFC 7946 compliance with UTM projected meter diagnostics.
3. **Data Layer & Presets (`src/data/`, `src/store/`, `src/utils/`)**:
   - `survey-presets.ts`: Authoritative Thai benchmark control points and ground-truth survey traverse/leveling field notebooks.
   - `useSurveyStore.ts`: Zustand offline persistence in `localStorage`.
   - `csv-export.ts`: Universal CSV exporter with UTF-8 BOM (`\uFEFF`) for Thai character preservation in Microsoft Excel.
4. **Automated Testing Suite (`tests/`)**:
   - Unit and integration test suites run via `vitest`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Differential Leveling TP Sequence & Page Check | Fix turning point calculation sequence where HI was computed with pre-foresight RL, restoring arithmetic check (Σ BS - Σ FS = Last RL - First RL = Σ Rise - Σ Fall) | M1 | Survey (Calc) |
| 2 | Geodetic Coordinate Boundary Validation | Add latitude/longitude ranges and UTM 47N/48N / Indian 1975 zone boundary checks to `projections.ts` | M1 | Survey (Calc) |
| 3 | Coordinate Converter UI Error Surfacing | Render `inputError` visibly in `CoordinateConverter.tsx` JSX with field-actionable Thai diagnostics | M1 | Survey (Calc) |
| 4 | Traverse Preset Data Blunder Correction | Replace 11.53m blunder in `SAMPLE_TRAVERSE_LEGS` with realistic RTSD-compliant closed traverse (precision ≥ 1:5,000) | M1 | Survey (Calc) |
| 5 | Universal CSV Exporter with UTF-8 BOM | Extract duplicate CSV export code into `src/utils/csv-export.ts` with `\uFEFF` BOM for Excel Thai language support | M1 | Survey (Test/Build) |
| 6 | Outdoor Touch Ergonomics (≥ 44x44px) | Scale basemap buttons, banner exit buttons, popup buttons, and Leaflet zoom controls to minimum 44x44px touch envelope | M2 | Survey (WebGIS) |
| 7 | Layout Dynamics & Non-Occluding Toolbars | Adjust floating guidance banners (`top-28 sm:top-20`), set Leaflet popup `autoPanPaddingTopLeft: [16, 120]`, and clamp context menu to prevent toolbar occlusion | M2 | Survey (WebGIS) |
| 8 | Telemetry Precision & Thai Headroom | Set coordinate HUD to 6 decimals (0.1m precision), populate GPS popups with full WGS84/UTM coordinates, ensure `leading-normal` on Thai headers | M2 | Survey (WebGIS) |
| 9 | RFC 7946 GeoJSON Validator & Diagnostics | Implement `validateGeoJsonRFC7946()` with WGS84 coordinate bounds checks, UTM projected meter warnings, coordinate inversion detection, and empty bounds guard | M2 | Survey (WebGIS) |
| 10 | Resilient GPS/GNSS Geolocation Handling | Implement `err.code` branching (PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT) with field-actionable Thai descriptions, 15s timeout, and single-layer cleanup | M2 | Survey (WebGIS) |
| 11 | Test Infrastructure Setup | Configure `vitest` in `package.json` (`"test": "vitest run"`) and test runner configuration | T1 | Survey (Test/Build) |
| 12 | Opaque-Box E2E & Unit Test Suites | Implement Tier 1-4 tests covering Geodetic Transformations, Bowditch Traverse, Leveling RTSD, GeoJSON RFC 7946, and CSV Export | T1 | Survey (Test/Build) |
| 13 | Final Verification & 100% Test Pass | Execute full test suite, verify 100% assertions pass, clean TypeScript compilation, and production build with 0 errors | M4 | Survey (Test/Build) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Calculation Engines & Core Utilities | `leveling.ts`, `projections.ts`, `CoordinateConverter.tsx`, `survey-presets.ts`, `csv-export.ts`, `TraverseCalculator.tsx`, `LevelingCalculator.tsx` | none | DONE |
| M2 | Field Terminal WebGIS & Usability | `MapToolbar.tsx`, `WebMap.tsx`, `GeoJsonUploader.tsx`, `geojson-validator.ts`, `index.css`, `CalculatorHub.tsx`, `AboutModal.tsx` | none | IN_PROGRESS |
| T1 | E2E Testing Suite (Dual Track) | `package.json`, `tests/*`, `TEST_INFRA.md`, `TEST_READY.md` | none | PLANNED |
| M4 | Final Integration, Build & Audit | 100% E2E test pass, clean production build (`npm run build`), adversarial hardening, and forensic audit | M1, M2, T1 | PLANNED |

## Interface Contracts

### `src/utils/csv-export.ts`
```typescript
export interface CsvExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}
export function exportToCsv(options: CsvExportOptions): void;
```
- Inserts `\uFEFF` UTF-8 BOM before CSV payload.
- Encodes entries with proper quoting for commas/newlines.
- Triggers download via `Blob` and temporary object URL.

### `src/core/geojson-validator.ts`
```typescript
export interface GeoJsonValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  featureCount: number;
  bounds?: [[number, number], [number, number]]; // [[minLat, minLng], [maxLat, maxLng]]
}
export function validateGeoJsonRFC7946(rawJson: unknown): GeoJsonValidationResult;
```
- Validates RFC 7946 WGS84 decimal degrees (lat [-90, 90], lng [-180, 180]).
- Detects projected UTM coordinates (> 100,000) and warns surveyor to reproject.
- Detects inverted coordinates (lat > 90).
- Prevents crash on empty FeatureCollections by flagging `featureCount === 0`.

### `src/core/leveling.ts`
```typescript
export function calculateLeveling(
  rows: LevelingRow[],
  firstBmElevation: number,
  rtsdOrder: RTSDOrder
): LevelingSummary;
```
- Fixes Turning Point logic: setup foresight establishes $RL_{TP} = HI - FS$; subsequent setup backsight establishes $HI_{next} = RL_{TP} + BS$.
- Guarantees arithmetic Page Check: $\sum BS - \sum FS = \text{Last RL} - \text{First RL} = \sum \text{Rise} - \sum \text{Fall}$.

## Code Layout
- `src/core/`: Geodetic and engineering algorithms (pure math, no React/DOM dependencies).
- `src/components/calculator/`: Calculator UI components (Coordinate Converter, Traverse, Leveling).
- `src/components/map/`: Leaflet WebGIS components (WebMap, MapToolbar, GeoJsonUploader).
- `src/data/`: Domain data, benchmark control points, and survey presets.
- `src/store/`: Zustand persistence and state stores.
- `src/utils/`: Common utilities (CSV export, formatting, math helpers).
- `tests/`: Vitest test suites (pure unit tests and integration scenarios).
