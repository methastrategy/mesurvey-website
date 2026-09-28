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
| 14 | Manuals Corner Stamp Badge & Provenance | Extend `KnowledgeTopic` with `verificationStatus: 'draft' | 'verified'`, set all 9 topics to Draft, add provenance banner and top-right corner stamp badge | D1 | Manuals Specialist |
| 15 | Manual Contextual Tool Links & Citations | Add downstream workflow bridges and CTA buttons ("เปิดเครื่องมือคำนวณที่เกี่ยวข้อง" / "เปิดแผนที่ WebGIS") across all 9 topics with academic citations | D1 | Manuals Specialist |
| 16 | Calculators Deep-Linking & Geodetic Bridge | Deep links to manual SOPs from Traverse, Leveling, and Coordinate Converter; ingest `inspectedCoordinate` from WebGIS in Coordinate Converter | D2 | Calculators Specialist |
| 17 | Traverse WebGIS Vector Plotting | Project traverse station coordinates via `inverseUtmToWgs84` and dispatch `plottedTraverseOverlay` to store for rendering on WebGIS | D2 | Calculators Specialist |
| 18 | WebGIS Spatial Inspection Bridge & Overlay | Add popup button "ส่งพิกัดไปยังเครื่องมือแปลงพิกัด ➔" and context menu item; render `plottedTraverseOverlay` polyline and station pins | D3 | WebGIS Specialist |
| 19 | Linear / Precision Instrument Design System | Replace blurry drop-shadows with rested matte surfaces (`#0f172a`, `#1e293b`) and crisp hairline borders; enforce Instrument Rarity accents | D4 | Design Architect |
| 20 | Knowledge Provenance & Deep-Link Test Suites | Add automated tests in `tests/knowledge-provenance.test.ts` and `tests/deep-linking.test.ts` asserting 100% compliance | D4 | Design Architect |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Calculation Engines & Core Utilities | `leveling.ts`, `projections.ts`, `CoordinateConverter.tsx`, `survey-presets.ts`, `csv-export.ts` | none | DONE |
| M2 | Field Terminal WebGIS & Usability | `MapToolbar.tsx`, `WebMap.tsx`, `GeoJsonUploader.tsx`, `geojson-validator.ts` | none | DONE |
| D1 | Manuals & Knowledge Specialist | `src/types/survey.ts`, `src/data/knowledge-topics.ts`, `src/components/knowledge/*` | none | PLANNED |
| D2 | Calculators & Geodetics Specialist | `src/store/useSurveyStore.ts`, `src/components/calculator/*`, `src/core/*` | none | PLANNED |
| D3 | WebGIS & Spatial Telemetry Specialist | `src/components/map/*` | D2 (store types) | PLANNED |
| D4 | Lead UI/UX & Design Systems Architect | `tailwind.config.js`, `src/index.css`, `src/components/layout/*`, `tests/*` | none | PLANNED |
| M4 | Final Integration, Build & Audit | 100% test pass (including new tests), 0 TS/bundler errors, Reviewers APPROVE, Challengers APPROVE, Forensic Audit CLEAN | D1, D2, D3, D4 | PLANNED |

## Interface Contracts

### `src/types/survey.ts` (Knowledge Topic Extension)
```typescript
export interface KnowledgeTopic {
  id: string;
  title: string;
  titleEn: string;
  category: KnowledgeCategory;
  categoryName: string;
  summary: string;
  badge: string;
  iconName: string;
  verificationStatus: 'draft' | 'verified';
  verificationProof?: string;
  equipmentRequired?: string[];
  workingPrinciple: string[];
  fieldProcedures: FieldChecklistStep[];
  deviceWorkflow?: DeviceScreenStep[];
  downstreamWorkflow?: DownstreamWorkflow;
  errorSourcesAndMitigation: string[];
  courseRelation?: string;
  formulas?: { label: string; formula: string; explanation: string }[];
}

export interface DownstreamWorkflow {
  outputDataFormat: string;
  outputDescription: string;
  nextStepTitle: string;
  nextStepProcedure: string;
  recommendedToolTab?: 'coord' | 'converter' | 'traverse' | 'leveling' | 'map';
  toolActionLabel?: string;
}
```

### `src/store/useSurveyStore.ts` (Cross-Module State Bridge)
```typescript
export interface PlottedTraverseOverlay {
  stations: {
    station: string;
    lat: number;
    lng: number;
    easting: number;
    northing: number;
  }[];
  polyline: [number, number][]; // [lat, lng] for Leaflet polyline
  isClosed: boolean;
  totalPerimeter: number;
  linearMisclosure: number;
  precisionRatio: number;
  precisionGrade: string;
}

export interface InspectedCoordinate {
  lat: number;
  lng: number;
  label?: string;
  timestamp: number;
}

interface SurveyStoreState {
  // Existing traverse & leveling state...
  inspectedCoordinate: InspectedCoordinate | null;
  setInspectedCoordinate: (coord: { lat: number; lng: number; label?: string } | null) => void;
  clearInspectedCoordinate: () => void;

  plottedTraverseOverlay: PlottedTraverseOverlay | null;
  setPlottedTraverseOverlay: (overlay: PlottedTraverseOverlay | null) => void;
  clearPlottedTraverseOverlay: () => void;
}
```

## Code Layout & File Ownership
- `agent_manuals`: `src/types/survey.ts`, `src/data/knowledge-topics.ts`, `src/components/knowledge/*`
- `agent_calculators`: `src/store/useSurveyStore.ts`, `src/components/calculator/*`, `src/core/*`
- `agent_webgis`: `src/components/map/*`
- `agent_design`: `tailwind.config.js`, `src/index.css`, `src/components/layout/*`, `tests/*`

