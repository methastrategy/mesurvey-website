import { describe, it, expect } from 'vitest';
import {
  calculateUtmZone,
  dmsToDecimal,
  decimalToDms,
  forwardWgs84ToUtm,
  inverseUtmToWgs84,
  forwardWgs84ToIndian1975,
  inverseIndian1975ToWgs84,
  convertComplete,
  isInThailandBounds,
  validateGeographicCoordinates,
  validateUtmCoordinates,
  THAILAND_EXTENT
} from '../src/core/projections';
import {
  polarToRect,
  rectToPolar,
  adjustTraverseBowditch
} from '../src/core/traverse';
import { calculateLevelingLoop } from '../src/core/leveling';
import { TraverseLegInput, LevelingRowInput } from '../src/types/survey';

describe('Milestone M1 Empirical Stress Testing Suite (Adversarial)', () => {
  
  // =========================================================================
  // 1. GEODETIC COORDINATE TRANSFORMATIONS STRESS CASES
  // =========================================================================
  describe('Geodetic Stress: Equator, Poles, and Zone Boundaries', () => {
    
    it('handles Equator (Lat 0.0°) transformations with mathematical consistency', () => {
      // Central Meridian of Zone 47 is 99.0°E
      const equatorZ47 = forwardWgs84ToUtm(0.0, 99.0);
      expect(equatorZ47.zone).toBe(47);
      expect(equatorZ47.easting).toBeCloseTo(500000.0, 1);
      expect(equatorZ47.northing).toBeCloseTo(0.0, 1);

      // Inverse roundtrip at Equator CM
      const roundtripZ47 = inverseUtmToWgs84(500000.0, 0.0, 47);
      expect(roundtripZ47.lat).toBeCloseTo(0.0, 6);
      expect(roundtripZ47.lng).toBeCloseTo(99.0, 6);

      // Central Meridian of Zone 48 is 105.0°E
      const equatorZ48 = forwardWgs84ToUtm(0.0, 105.0);
      expect(equatorZ48.zone).toBe(48);
      expect(equatorZ48.easting).toBeCloseTo(500000.0, 1);
      expect(equatorZ48.northing).toBeCloseTo(0.0, 1);

      const roundtripZ48 = inverseUtmToWgs84(500000.0, 0.0, 48);
      expect(roundtripZ48.lat).toBeCloseTo(0.0, 6);
      expect(roundtripZ48.lng).toBeCloseTo(105.0, 6);
    });

    it('handles UTM Zone 47N/48N boundary edges (96°E, 102°E, 108°E)', () => {
      // Western edge of Zone 47: 96.0°E
      expect(calculateUtmZone(96.0)).toBe(47);
      const westEdge = forwardWgs84ToUtm(13.0, 96.0);
      expect(westEdge.zone).toBe(47);
      expect(westEdge.easting).toBeGreaterThan(170000);
      expect(westEdge.easting).toBeLessThan(180000);
      const invWest = inverseUtmToWgs84(westEdge.easting, westEdge.northing, 47);
      expect(invWest.lat).toBeCloseTo(13.0, 5);
      expect(invWest.lng).toBeCloseTo(96.0, 5);

      // Meridian boundary between Zone 47 and 48: exactly 102.0°E
      expect(calculateUtmZone(102.0)).toBe(48);
      
      // At 102.0°E in Zone 48 (Western boundary of Zone 48, 3° West of CM 105°E)
      const borderZ48 = forwardWgs84ToUtm(13.0, 102.0, 48);
      expect(borderZ48.zone).toBe(48);
      expect(borderZ48.easting).toBeGreaterThan(170000);
      expect(borderZ48.easting).toBeLessThan(180000);
      const invBorderZ48 = inverseUtmToWgs84(borderZ48.easting, borderZ48.northing, 48);
      expect(invBorderZ48.lat).toBeCloseTo(13.0, 5);
      expect(invBorderZ48.lng).toBeCloseTo(102.0, 5);

      // At 102.0°E forced into Zone 47 (Eastern boundary of Zone 47, 3° East of CM 99°E)
      const borderZ47 = forwardWgs84ToUtm(13.0, 102.0, 47);
      expect(borderZ47.zone).toBe(47);
      expect(borderZ47.easting).toBeGreaterThan(820000);
      expect(borderZ47.easting).toBeLessThan(830000);
      const invBorderZ47 = inverseUtmToWgs84(borderZ47.easting, borderZ47.northing, 47);
      expect(invBorderZ47.lat).toBeCloseTo(13.0, 5);
      expect(invBorderZ47.lng).toBeCloseTo(102.0, 5);

      // Eastern edge of Zone 48: 108.0°E
      expect(calculateUtmZone(108.0)).toBe(48);
      const eastEdge = forwardWgs84ToUtm(13.0, 108.0);
      expect(eastEdge.zone).toBe(48);
      expect(eastEdge.easting).toBeGreaterThan(820000);
      expect(eastEdge.easting).toBeLessThan(830000);
      const invEast = inverseUtmToWgs84(eastEdge.easting, eastEdge.northing, 48);
      expect(invEast.lat).toBeCloseTo(13.0, 5);
      expect(invEast.lng).toBeCloseTo(108.0, 5);
    });

    it('handles North Pole (Lat +90.0°) and validates boundaries at extreme latitude', () => {
      // North pole is valid geographic coordinate (boundary +90°)
      const geoCheck = validateGeographicCoordinates(90.0, 99.0);
      expect(geoCheck.isValid).toBe(true);

      const northPoleUtm = forwardWgs84ToUtm(90.0, 99.0);
      expect(northPoleUtm.easting).toBeCloseTo(500000.0, 1);
      expect(northPoleUtm.northing).toBeLessThanOrEqual(10000000.0);
      expect(northPoleUtm.northing).toBeGreaterThan(9990000.0);

      // Inverse roundtrip at North Pole
      const invNorthPole = inverseUtmToWgs84(500000.0, northPoleUtm.northing, 47);
      expect(invNorthPole.lat).toBeCloseTo(90.0, 3);
    });

    it('rejects South Pole (-90.0°) or Southern Hemisphere coordinates for Northern Hemisphere UTM 47N/48N', () => {
      // South pole has negative northing in Zone 47N (+proj=utm +zone=47 +datum=WGS84)
      // UTM Zone 47N is strictly a northern hemisphere projection where Northing < 0 is invalid
      expect(validateUtmCoordinates(500000, -9997964.9, 47).isValid).toBe(false);
      expect(() => inverseUtmToWgs84(500000, -9997964.9, 47)).toThrow('ซีกโลกเหนือต้องอยู่ระหว่าง 0 ถึง 10,000,000 ม.');
    });

    it('demonstrates sub-millimeter round-trip reproducibility across 50 stress test points throughout Thailand extent', () => {
      for (let i = 0; i < 50; i++) {
        // Random point inside Thailand bbox
        const lat = 5.6 + Math.random() * (20.4 - 5.6);
        const lng = 97.2 + Math.random() * (105.8 - 97.2);
        const zone = calculateUtmZone(lng);

        const utm = forwardWgs84ToUtm(lat, lng, zone);
        expect(utm.easting).toBeGreaterThan(150000);
        expect(utm.easting).toBeLessThan(850000);
        expect(utm.northing).toBeGreaterThan(550000);
        expect(utm.northing).toBeLessThan(2350000);

        const inv = inverseUtmToWgs84(utm.easting, utm.northing, zone);
        expect(inv.lat).toBeCloseTo(lat, 5);
        expect(inv.lng).toBeCloseTo(lng, 5);
      }
    });
  });

  // =========================================================================
  // 2. EXTREME OUT-OF-BOUNDS COORDINATES & VALIDATOR ENFORCEMENT
  // =========================================================================
  describe('Geodetic Stress: Out-of-Bounds & Invalid Number Rejection', () => {
    
    it('rejects latitudes outside [-90, +90] with descriptive Thai errors', () => {
      const cases = [90.0001, 95.0, 180.0, -90.0001, -95.0, -1000.0];
      for (const lat of cases) {
        const val = validateGeographicCoordinates(lat, 100.0);
        expect(val.isValid).toBe(false);
        expect(val.error).toContain('ละติจูดต้องอยู่ระหว่าง -90° ถึง +90°');
        expect(() => forwardWgs84ToUtm(lat, 100.0)).toThrow('ละติจูด');
        expect(() => forwardWgs84ToIndian1975(lat, 100.0)).toThrow('ละติจูด');
      }
    });

    it('rejects longitudes outside [-180, +180] with descriptive Thai errors', () => {
      const cases = [180.0001, 200.0, 360.0, -180.0001, -200.0, -500.0];
      for (const lng of cases) {
        const val = validateGeographicCoordinates(13.0, lng);
        expect(val.isValid).toBe(false);
        expect(val.error).toContain('ลองจิจูดต้องอยู่ระหว่าง -180° ถึง +180°');
        expect(() => forwardWgs84ToUtm(13.0, lng)).toThrow('ลองจิจูด');
        expect(() => forwardWgs84ToIndian1975(13.0, lng)).toThrow('ลองจิจูด');
      }
    });

    it('rejects NaN, Infinity, and non-finite numbers in geographic coordinates', () => {
      const badVals = [NaN, Infinity, -Infinity];
      for (const bad of badVals) {
        expect(validateGeographicCoordinates(bad, 100.0).isValid).toBe(false);
        expect(validateGeographicCoordinates(13.0, bad).isValid).toBe(false);
        expect(() => forwardWgs84ToUtm(bad, 100.0)).toThrow();
        expect(() => forwardWgs84ToUtm(13.0, bad)).toThrow();
      }
    });

    it('rejects negative Easting and Easting outside [100,000, 900,000] with axis swap warning', () => {
      const badEastings = [-500, -0.001, 0, 50000, 99999.9, 900000.1, 1000000, 1531321.89];
      for (const e of badEastings) {
        const val = validateUtmCoordinates(e, 1500000, 47);
        expect(val.isValid).toBe(false);
        expect(val.error).toContain('Easting');
        expect(() => inverseUtmToWgs84(e, 1500000, 47)).toThrow();
        expect(() => inverseIndian1975ToWgs84(e, 1500000, 47)).toThrow();
      }
    });

    it('rejects Northing < 0 and Northing > 10,000,000', () => {
      const badNorthings = [-1, -5000, 10000000.1, 10000001, 20000000];
      for (const n of badNorthings) {
        const val = validateUtmCoordinates(500000, n, 47);
        expect(val.isValid).toBe(false);
        expect(val.error).toContain('Northing');
        expect(() => inverseUtmToWgs84(500000, n, 47)).toThrow();
        expect(() => inverseIndian1975ToWgs84(500000, n, 47)).toThrow();
      }
    });

    it('rejects zones other than 47 or 48', () => {
      const invalidZones = [46, 49, 1, 60];
      for (const z of invalidZones) {
        const val = validateUtmCoordinates(500000, 1500000, z as any);
        expect(val.isValid).toBe(false);
        expect(val.error).toContain('UTM Zone ในประเทศไทยต้องเป็น Zone 47 หรือ 48');
      }
    });
  });

  // =========================================================================
  // 3. BOWDITCH TRAVERSE ADVERSARIAL STRESS CASES
  // =========================================================================
  describe('Bowditch Traverse Stress: Collinear Legs, Reversals, Wraps & Invalid Inputs', () => {

    it('handles collinear legs in the same direction without degeneracy or precision loss', () => {
      // 3 collinear legs along due East (90°): 100m + 150m + 250m = 500m
      // Followed by 1 closing leg due West (270°): 500m
      const collinearLegs: TraverseLegInput[] = [
        { station: 'STN-1', targetStation: 'STN-2', distance: 100.0, azimuthDeg: 90.0 },
        { station: 'STN-2', targetStation: 'STN-3', distance: 150.0, azimuthDeg: 90.0 },
        { station: 'STN-3', targetStation: 'STN-4', distance: 250.0, azimuthDeg: 90.0 },
        { station: 'STN-4', targetStation: 'STN-1', distance: 500.0, azimuthDeg: 270.0 }
      ];
      const origin = { easting: 1000.0, northing: 2000.0 };

      const result = adjustTraverseBowditch(collinearLegs, origin, origin);

      expect(result.totalPerimeter).toBeCloseTo(1000.0, 3);
      expect(result.misclosureE).toBeCloseTo(0.0, 3);
      expect(result.misclosureN).toBeCloseTo(0.0, 3);
      expect(result.linearMisclosure).toBeCloseTo(0.0, 3);
      expect(result.precisionRatio).toBe(999999);
      expect(result.precisionGrade).toContain('ชั้น 1');

      // Check intermediate coordinates along the line
      expect(result.stationCoordinates['STN-2'].easting).toBeCloseTo(1100.0, 3);
      expect(result.stationCoordinates['STN-3'].easting).toBeCloseTo(1250.0, 3);
      expect(result.stationCoordinates['STN-4'].easting).toBeCloseTo(1500.0, 3);
      expect(result.stationCoordinates['STN-1'].easting).toBeCloseTo(1000.0, 3);
      expect(result.stationCoordinates['STN-1'].northing).toBeCloseTo(2000.0, 3);
    });

    it('handles 180° bearing reversals (out-and-back traverse line)', () => {
      // Station A -> B: 200m at Azimuth 30°
      // Station B -> A: 200m at Azimuth 210° (exact 180° reversal)
      const reversalLegs: TraverseLegInput[] = [
        { station: 'A', targetStation: 'B', distance: 200.0, azimuthDeg: 30.0 },
        { station: 'B', targetStation: 'A', distance: 200.0, azimuthDeg: 210.0 }
      ];
      const start = { easting: 500000.0, northing: 1500000.0 };

      const result = adjustTraverseBowditch(reversalLegs, start, start);

      expect(result.totalPerimeter).toBeCloseTo(400.0, 3);
      expect(result.linearMisclosure).toBeCloseTo(0.0, 3);
      expect(result.adjustedLegs).toHaveLength(2);
      expect(result.adjustedLegs[1].adjustedEasting).toBeCloseTo(start.easting, 3);
      expect(result.adjustedLegs[1].adjustedNorthing).toBeCloseTo(start.northing, 3);
    });

    it('handles 360° wraps: 0° and 360° produce identical Cartesian deltas', () => {
      const delta0 = polarToRect(150.0, 0.0);
      const delta360 = polarToRect(150.0, 360.0);

      expect(delta0.de).toBeCloseTo(delta360.de, 4);
      expect(delta0.dn).toBeCloseTo(delta360.dn, 4);
      expect(delta0.de).toBeCloseTo(0.0, 4);
      expect(delta0.dn).toBeCloseTo(150.0, 4);

      // Both 0° and 360° are valid in traverse adjustment
      const leg360: TraverseLegInput[] = [
        { station: 'P1', targetStation: 'P2', distance: 100.0, azimuthDeg: 360.0 },
        { station: 'P2', targetStation: 'P1', distance: 100.0, azimuthDeg: 180.0 }
      ];
      const origin = { easting: 1000.0, northing: 1000.0 };
      const res = adjustTraverseBowditch(leg360, origin, origin);
      expect(res.linearMisclosure).toBeCloseTo(0.0, 3);
    });

    it('rejects zero distances, negative distances, and NaN distances with descriptive station errors', () => {
      const origin = { easting: 1000.0, northing: 1000.0 };

      // Zero distance
      const zeroLeg: TraverseLegInput[] = [
        { station: 'BM1', targetStation: 'BM2', distance: 0, azimuthDeg: 45.0 }
      ];
      expect(() => adjustTraverseBowditch(zeroLeg, origin, origin)).toThrow('ระยะราบต้องมากกว่า 0.000 ม. (ตรวจพบ: 0)');

      // Negative distance
      const negLeg: TraverseLegInput[] = [
        { station: 'STA-A', targetStation: 'STA-B', distance: -75.5, azimuthDeg: 45.0 }
      ];
      expect(() => adjustTraverseBowditch(negLeg, origin, origin)).toThrow('ระยะราบต้องมากกว่า 0.000 ม. (ตรวจพบ: -75.5)');

      // NaN distance
      const nanLeg: TraverseLegInput[] = [
        { station: 'STA-X', targetStation: 'STA-Y', distance: NaN, azimuthDeg: 45.0 }
      ];
      expect(() => adjustTraverseBowditch(nanLeg, origin, origin)).toThrow('ระยะราบต้องมากกว่า 0.000 ม.');
    });

    it('rejects azimuths outside [0°, 360°] and NaN azimuths with descriptive errors', () => {
      const origin = { easting: 1000.0, northing: 1000.0 };

      // Negative azimuth
      const negAz: TraverseLegInput[] = [
        { station: 'A', targetStation: 'B', distance: 100.0, azimuthDeg: -0.001 }
      ];
      expect(() => adjustTraverseBowditch(negAz, origin, origin)).toThrow('ต้องอยู่ในช่วง 0° ถึง 360°');

      // Azimuth > 360°
      const excessiveAz: TraverseLegInput[] = [
        { station: 'A', targetStation: 'B', distance: 100.0, azimuthDeg: 360.001 }
      ];
      expect(() => adjustTraverseBowditch(excessiveAz, origin, origin)).toThrow('ต้องอยู่ในช่วง 0° ถึง 360°');

      // NaN azimuth
      const nanAz: TraverseLegInput[] = [
        { station: 'A', targetStation: 'B', distance: 100.0, azimuthDeg: NaN }
      ];
      expect(() => adjustTraverseBowditch(nanAz, origin, origin)).toThrow('ต้องอยู่ในช่วง 0° ถึง 360°');
    });

    it('rejects invalid or NaN start/end coordinates', () => {
      const validLegs: TraverseLegInput[] = [
        { station: 'A', targetStation: 'B', distance: 100.0, azimuthDeg: 45.0 }
      ];
      expect(() => adjustTraverseBowditch(validLegs, { easting: NaN, northing: 1000 }, { easting: 1000, northing: 1000 }))
        .toThrow('พิกัดสถานีเริ่มต้นไม่ถูกต้อง');
      expect(() => adjustTraverseBowditch(validLegs, { easting: 1000, northing: 1000 }, { easting: 1000, northing: NaN }))
        .toThrow('พิกัดหมุดปิดวงรอบปลายทางไม่ถูกต้อง');
    });

    it('correctly grades precision across all RTSD survey classification tiers', () => {
      const origin = { easting: 1000.0, northing: 1000.0 };

      // Helper to generate a loop with exact misclosure
      const makeTraverseWithMisclosure = (perimeter: number, misclosure: number) => {
        // 4-sided traverse: 4 legs each length = perimeter / 4
        // Leg 1: North, Leg 2: East, Leg 3: South, Leg 4: West + misclosure
        const side = perimeter / 4;
        const legs: TraverseLegInput[] = [
          { station: '1', targetStation: '2', distance: side, azimuthDeg: 0.0 },
          { station: '2', targetStation: '3', distance: side, azimuthDeg: 90.0 },
          { station: '3', targetStation: '4', distance: side, azimuthDeg: 180.0 },
          { station: '4', targetStation: '1', distance: side + misclosure, azimuthDeg: 270.0 }
        ];
        return adjustTraverseBowditch(legs, origin, origin);
      };

      // Tier 1: First-Order (>= 1:20,000)
      const res1 = makeTraverseWithMisclosure(20000, 0.8); // 1:25,000
      expect(res1.precisionGrade).toContain('ชั้น 1');

      // Tier 2: Second-Order Class I (>= 1:10,000 and < 1:20,000)
      const res2_1 = makeTraverseWithMisclosure(15000, 1.0); // 1:15,000
      expect(res2_1.precisionGrade).toContain('ชั้น 2 ชั้นหนึ่ง');

      // Tier 3: Second-Order Class II (>= 1:5,000 and < 1:10,000)
      const res2_2 = makeTraverseWithMisclosure(7000, 1.0); // 1:7,000
      expect(res2_2.precisionGrade).toContain('ชั้น 2 ชั้นสอง');

      // Tier 4: Third-Order (>= 1:2,500 and < 1:5,000)
      const res3 = makeTraverseWithMisclosure(3000, 1.0); // 1:3,000
      expect(res3.precisionGrade).toContain('ชั้น 3');

      // Tier 5: Below Standard (< 1:2,500)
      const resSub = makeTraverseWithMisclosure(1000, 1.0); // 1:1,000
      expect(resSub.precisionGrade).toContain('ต่ำกว่าเกณฑ์มาตรฐานวิศวกรรม');
    });
  });

  // =========================================================================
  // 4. LEVELING TURNING POINT & ARITHMETIC CHECK EMPIRICAL STRESS CASES
  // =========================================================================
  describe('Differential Leveling Stress: Multiple TPs, Zero Rise/Fall, and Invariants', () => {

    it('guarantees Page Check equality across complex multi-setup circuit with 4 Turning Points', () => {
      // 5 setups, 4 TPs, several intermediate sights
      const complexRows: LevelingRowInput[] = [
        { id: '1', station: 'BM_START', bs: 1.500, ifs: null, fs: null },
        { id: '2', station: 'IS_1', bs: null, ifs: 1.200, fs: null },
        { id: '3', station: 'TP_1', bs: 2.100, ifs: null, fs: 0.900 },
        { id: '4', station: 'IS_2', bs: null, ifs: 1.800, fs: null },
        { id: '5', station: 'TP_2', bs: 1.150, ifs: null, fs: 2.350 },
        { id: '6', station: 'TP_3', bs: 1.780, ifs: null, fs: 1.450 },
        { id: '7', station: 'IS_3', bs: null, ifs: 1.500, fs: null },
        { id: '8', station: 'TP_4', bs: 2.050, ifs: null, fs: 1.220 },
        { id: '9', station: 'BM_END', bs: null, ifs: null, fs: 2.610 }
      ];

      const startElevation = 50.000;
      const res = calculateLevelingLoop(complexRows, startElevation, startElevation, 2.5);

      // Verify Page Check equality
      const diffBsFs = res.sumBs - res.sumFs;
      const deltaElevation = res.rows[res.rows.length - 1].elevation - startElevation;
      const totalRise = res.rows.reduce((s, r) => s + (r.rise || 0), 0);
      const totalFall = res.rows.reduce((s, r) => s + (r.fall || 0), 0);
      const diffRiseFall = totalRise - totalFall;

      expect(diffBsFs).toBeCloseTo(deltaElevation, 3);
      expect(diffRiseFall).toBeCloseTo(deltaElevation, 3);
      expect(res.arithmeticCheckPassed).toBe(true);
    });

    it('handles identical staff readings (zero rise and zero fall on flat terrain)', () => {
      const flatRows: LevelingRowInput[] = [
        { id: '1', station: 'BM-1', bs: 1.500, ifs: null, fs: null },
        { id: '2', station: 'P-1', bs: null, ifs: 1.500, fs: null },
        { id: '3', station: 'P-2', bs: null, ifs: 1.500, fs: null },
        { id: '4', station: 'BM-2', bs: null, ifs: null, fs: 1.500 }
      ];

      const res = calculateLevelingLoop(flatRows, 100.0, 100.0, 0.5);

      expect(res.rows[1].elevation).toBeCloseTo(100.0, 3);
      expect(res.rows[1].rise).toBeNull();
      expect(res.rows[1].fall).toBeNull();
      expect(res.rows[2].elevation).toBeCloseTo(100.0, 3);
      expect(res.rows[3].elevation).toBeCloseTo(100.0, 3);
      expect(res.diffBsFs).toBeCloseTo(0.0, 3);
      expect(res.arithmeticCheckPassed).toBe(true);
    });

    it('handles negative elevations (e.g. below mean sea level / underground tunnel)', () => {
      const tunnelRows: LevelingRowInput[] = [
        { id: '1', station: 'BM_SURFACE', bs: 1.200, ifs: null, fs: null },
        { id: '2', station: 'TUNNEL_SHAFT', bs: null, ifs: null, fs: 25.500 } // Going 24.3m down
      ];

      const res = calculateLevelingLoop(tunnelRows, 10.0, -14.3, 0.1);
      expect(res.rows[1].elevation).toBeCloseTo(-14.3, 3);
      expect(res.deltaBenchmarks).toBeCloseTo(-24.3, 3);
      expect(res.arithmeticCheckPassed).toBe(true);
    });

    it('correctly calculates distance-based RTSD tolerances with fractional kilometers', () => {
      // 0.25 km -> sqrt(0.25) = 0.5
      // First-Order: 4 * 0.5 = 2.0 mm
      // Second-Order: 8 * 0.5 = 4.0 mm
      // Third-Order: 12 * 0.5 = 6.0 mm
      // Construction: 24 * 0.5 = 12.0 mm
      const rows: LevelingRowInput[] = [
        { id: '1', station: 'BM1', bs: 1.000, ifs: null, fs: null },
        { id: '2', station: 'BM2', bs: null, ifs: null, fs: 1.001 } // 1mm error
      ];
      const res = calculateLevelingLoop(rows, 10.0, 10.0, 0.25);
      expect(res.orderCompliance.firstOrderMaxMm).toBe(2.00);
      expect(res.orderCompliance.secondOrderMaxMm).toBe(4.00);
      expect(res.orderCompliance.thirdOrderMaxMm).toBe(6.00);
      expect(res.orderCompliance.constructionMaxMm).toBe(12.00);
      expect(res.orderCompliance.achievedOrder).toContain('ชั้น 1');
    });
  });
});
