# E2E Test Infra: MESURV Field Terminal

## Test Philosophy
- Opaque-box, requirement-driven verification derived directly from ORIGINAL_REQUEST.md.
- Ground-truth validation using Thai benchmark control points and authentic survey field notebooks.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Interaction + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|----------------------|:------:|:------:|:------:|
| 1 | WGS84 <-> UTM 47N/48N Transformations | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | WGS84 <-> Indian 1975 Transformations | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | Bowditch Traverse Adjustment & Misclosure | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | Leveling HI & Rise/Fall + Page Check | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 5 | RTSD Leveling Order Tolerances (4/8/12/24 mm) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 6 | RFC 7946 GeoJSON Validator & Diagnostics | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 7 | GPS/GNSS Geolocation Error Resilience | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 8 | Touch Ergonomics & Non-Occluding Layout | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 9 | Universal CSV Export with UTF-8 BOM | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |

## Test Architecture
- Test Runner: `vitest` (executing via `npm test` / `npx vitest run`)
- Directory Layout: `tests/`
  - `tests/projections.test.ts`: Geodetic transformations and datum shifts
  - `tests/traverse.test.ts`: Bowditch adjustments and misclosure
  - `tests/leveling.test.ts`: Differential leveling, page check, and RTSD orders
  - `tests/geojson-validator.test.ts`: RFC 7946 compliance and error diagnostics
  - `tests/csv-export.test.ts`: CSV encoding, UTF-8 BOM, and Thai character preservation
- Pass/Fail Semantics: 100% assertions pass with exit code 0.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Kasetsart University Survey Dept Control Loop | F1, F2, F3 | High |
| 2 | RTSD Differential Leveling Run across 6 Stations | F4, F5 | High |
| 3 | CAD Cadastral Boundary GeoJSON Import with UTM Warning | F6 | Medium |
| 4 | Offline Field Export of Field Notebook to Excel (BOM) | F9 | Low |
| 5 | Full Geodetic Transformation Roundtrip (WGS84 -> UTM -> Indian 1975 -> WGS84) | F1, F2 | High |

## Coverage Thresholds
- Tier 1: ≥ 5 tests per feature (Happy-path isolation)
- Tier 2: ≥ 5 tests per feature (Boundary values, extreme coordinates, zero/negative lengths)
- Tier 3: Pairwise feature combinations and cross-module interactions
- Tier 4: ≥ 5 realistic application-level field scenarios
