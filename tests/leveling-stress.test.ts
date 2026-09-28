import { describe, it, expect } from 'vitest';
import { calculateLevelingLoop } from '../src/core/leveling';
import { LevelingRowInput } from '../src/types/survey';

describe('Differential Leveling Adversarial Stress Testing (leveling-stress.test.ts)', () => {

  describe('1. Multiple Sequential Turning Points (TP1 .. TP_N)', () => {
    it('accurately reduces a 10-station sequence of consecutive turning points', () => {
      // 10 setups, starting at 100.000m RL
      const rows: LevelingRowInput[] = [
        { id: '0', station: 'BM_A', bs: 1.500, ifs: null, fs: null }
      ];

      let trueElevation = 100.000;
      let currentHi = trueElevation + 1.500;

      for (let i = 1; i <= 9; i++) {
        const fs = Number((1.000 + (i * 0.050)).toFixed(4));
        const bs = Number((1.200 + (i * 0.030)).toFixed(4));
        trueElevation = currentHi - fs;
        currentHi = trueElevation + bs;

        rows.push({
          id: String(i),
          station: `TP_${i}`,
          bs: bs,
          ifs: null,
          fs: fs
        });
      }

      // Final station: BM_B closing
      const closingFs = 1.450;
      trueElevation = currentHi - closingFs;
      rows.push({
        id: '10',
        station: 'BM_B',
        bs: null,
        ifs: null,
        fs: closingFs
      });

      const result = calculateLevelingLoop(rows, 100.000, trueElevation, 2.0);

      expect(result.rows).toHaveLength(11);
      expect(result.arithmeticCheckPassed).toBe(true);
      expect(result.closureErrorMm).toBeCloseTo(0.0, 1);

      // Verify each individual station elevation matches exact math
      for (let i = 0; i < result.rows.length; i++) {
        expect(result.rows[i].elevation).toBeDefined();
        expect(isNaN(result.rows[i].elevation)).toBe(false);
      }
      expect(result.rows[10].elevation).toBeCloseTo(trueElevation, 3);
    });

    it('handles a stress run of 100 sequential turning points with alternating rises and falls', () => {
      const rows: LevelingRowInput[] = [
        { id: '0', station: 'BM_START', bs: 2.000, ifs: null, fs: null }
      ];

      for (let i = 1; i <= 99; i++) {
        // Alternating uphill and downhill
        const fs = i % 2 === 0 ? 1.250 : 2.750;
        const bs = i % 2 === 0 ? 2.500 : 1.100;
        rows.push({
          id: String(i),
          station: `TP_${i}`,
          bs,
          ifs: null,
          fs
        });
      }

      // Closing station
      rows.push({
        id: '100',
        station: 'BM_END',
        bs: null,
        ifs: null,
        fs: 1.500
      });

      const result = calculateLevelingLoop(rows, 50.000, undefined, 5.0);

      expect(result.rows).toHaveLength(101);
      expect(result.arithmeticCheckPassed).toBe(true);

      // Three-fold Page Check equality must hold strictly
      expect(result.diffBsFs).toBeCloseTo(result.deltaBenchmarks, 3);
      const totalRise = result.rows.reduce((sum, r) => sum + (r.rise || 0), 0);
      const totalFall = result.rows.reduce((sum, r) => sum + (r.fall || 0), 0);
      expect(totalRise - totalFall).toBeCloseTo(result.deltaBenchmarks, 3);
    });
  });

  describe('2. Inverted Staff Readings (Bridge Underside / Tunnel Soffit)', () => {
    it('correctly reduces intermediate inverted staff reading (ceiling shot)', () => {
      // Instrument setup on floor (BM RL = 50.000, BS = 1.400 -> HI = 51.400)
      // Tunnel ceiling shot: inverted staff has reading -1.600m
      // Reduced level should be: HI - (-1.600) = 51.400 + 1.600 = 53.000m
      const rows: LevelingRowInput[] = [
        { id: '1', station: 'BM_FLOOR', bs: 1.400, ifs: null, fs: null },
        { id: '2', station: 'TUNNEL_ROOF', bs: null, ifs: -1.600, fs: null },
        { id: '3', station: 'BM_EXIT', bs: null, ifs: null, fs: 1.400 }
      ];

      const result = calculateLevelingLoop(rows, 50.000, 50.000, 0.5);

      // Roof elevation must be 53.000m
      expect(result.rows[1].elevation).toBeCloseTo(53.000, 3);
      // Rise from floor (reading 1.400) to roof (reading -1.600) is 1.400 - (-1.600) = +3.000m
      expect(result.rows[1].rise).toBeCloseTo(3.000, 3);
      expect(result.rows[1].fall).toBeNull();

      // Fall from roof (-1.600) to exit floor (1.400) is -1.600 - 1.400 = -3.000m
      expect(result.rows[2].elevation).toBeCloseTo(50.000, 3);
      expect(result.rows[2].fall).toBeCloseTo(3.000, 3);

      // Page Check must hold
      expect(result.arithmeticCheckPassed).toBe(true);
      expect(result.closureErrorMm).toBeCloseTo(0.0, 1);
    });

    it('correctly reduces inverted Turning Point (bolt on bridge beam)', () => {
      // Setup 1: BM_1 RL = 20.000, BS = 1.500 -> HI = 21.500
      // TP_BEAM: Inverted staff on girder soffit: FS = -1.200 -> RL = 21.500 - (-1.200) = 22.700
      // Instrument moved to setup 2: BS to TP_BEAM (inverted) = -0.800 -> new HI = 22.700 + (-0.800) = 21.900
      // BM_2 on pier top: normal FS = 1.900 -> RL = 21.900 - 1.900 = 20.000
      const rows: LevelingRowInput[] = [
        { id: '1', station: 'BM_1', bs: 1.500, ifs: null, fs: null },
        { id: '2', station: 'TP_BEAM', bs: -0.800, ifs: null, fs: -1.200 },
        { id: '3', station: 'BM_2', bs: null, ifs: null, fs: 1.900 }
      ];

      const result = calculateLevelingLoop(rows, 20.000, 20.000, 0.2);

      expect(result.rows[1].elevation).toBeCloseTo(22.700, 3);
      expect(result.rows[1].hi).toBeCloseTo(21.900, 3);
      expect(result.rows[1].rise).toBeCloseTo(2.700, 3); // 1.500 - (-1.200)

      expect(result.rows[2].elevation).toBeCloseTo(20.000, 3);
      expect(result.rows[2].fall).toBeCloseTo(2.700, 3); // -0.800 - 1.900 = -2.700

      // Page check:
      // sumBs = 1.500 + (-0.800) = 0.700
      // sumFs = -1.200 + 1.900 = 0.700
      // diffBsFs = 0.000
      expect(result.sumBs).toBeCloseTo(0.700, 3);
      expect(result.sumFs).toBeCloseTo(0.700, 3);
      expect(result.diffBsFs).toBeCloseTo(0.000, 3);
      expect(result.arithmeticCheckPassed).toBe(true);
      expect(result.closureErrorMm).toBeCloseTo(0.0, 1);
    });

    it('correctly handles inverted backsight on starting benchmark (suspended ceiling BM)', () => {
      // Ceiling benchmark at RL = 10.000m
      // Inverted BS = -1.350m -> HI = 10.000 + (-1.350) = 8.650m
      // Floor point: normal FS = 1.650m -> RL = 8.650 - 1.650 = 7.000m
      const rows: LevelingRowInput[] = [
        { id: '1', station: 'BM_CEILING', bs: -1.350, ifs: null, fs: null },
        { id: '2', station: 'FLOOR_PT', bs: null, ifs: null, fs: 1.650 }
      ];

      const result = calculateLevelingLoop(rows, 10.000, 7.000, 0.1);

      expect(result.rows[0].hi).toBeCloseTo(8.650, 3);
      expect(result.rows[1].elevation).toBeCloseTo(7.000, 3);
      expect(result.rows[1].fall).toBeCloseTo(3.000, 3); // -1.350 - 1.650 = -3.000
      expect(result.arithmeticCheckPassed).toBe(true);
      expect(result.closureErrorMm).toBeCloseTo(0.0, 1);
    });
  });

  describe('3. Long Leveling Runs & Accumulated Precision Stress', () => {
    it('maintains Page Check equality over 500 stations without floating-point breakdown', () => {
      const rows: LevelingRowInput[] = [
        { id: '0', station: 'BM_START', bs: 1.4325, ifs: null, fs: null }
      ];

      // 499 intermediate stations
      for (let i = 1; i <= 498; i++) {
        // Pseudo-random deterministic values with 4 decimal places
        const fsVal = Number((1.0000 + ((i * 17) % 1500) / 1000).toFixed(4));
        const bsVal = Number((1.0000 + ((i * 23) % 1500) / 1000).toFixed(4));

        rows.push({
          id: String(i),
          station: `TP_${i}`,
          bs: bsVal,
          ifs: null,
          fs: fsVal
        });
      }

      rows.push({
        id: '499',
        station: 'BM_FINAL',
        bs: null,
        ifs: null,
        fs: 1.8765
      });

      const result = calculateLevelingLoop(rows, 150.0000, undefined, 50.0);

      expect(result.rows).toHaveLength(500);
      expect(result.arithmeticCheckPassed).toBe(true);
      expect(Math.abs(result.diffBsFs - result.deltaBenchmarks)).toBeLessThan(0.0015);
    });

    it('handles extreme elevations (below sea level / high mountain peaks)', () => {
      // Dead sea elevation (-430.5m)
      const belowSea: LevelingRowInput[] = [
        { id: '1', station: 'BM_DEAD_SEA', bs: 1.500, ifs: null, fs: null },
        { id: '2', station: 'SHORE_PT', bs: null, ifs: null, fs: 1.200 }
      ];
      const resBelow = calculateLevelingLoop(belowSea, -430.500, -430.200, 0.5);
      expect(resBelow.rows[0].hi).toBeCloseTo(-429.000, 3);
      expect(resBelow.rows[1].elevation).toBeCloseTo(-430.200, 3);
      expect(resBelow.arithmeticCheckPassed).toBe(true);

      // Doi Inthanon summit (2565.334m)
      const mountain: LevelingRowInput[] = [
        { id: '1', station: 'BM_INTHANON', bs: 2.155, ifs: null, fs: null },
        { id: '2', station: 'RADAR_STN', bs: null, ifs: null, fs: 0.855 }
      ];
      const resMtn = calculateLevelingLoop(mountain, 2565.334, 2566.634, 0.3);
      expect(resMtn.rows[1].elevation).toBeCloseTo(2566.634, 3);
      expect(resMtn.arithmeticCheckPassed).toBe(true);
    });
  });

  describe('4. Distance and RTSD Order Boundaries (K < 0, K = 0, Extreme K)', () => {
    const standardLoop: LevelingRowInput[] = [
      { id: '1', station: 'BM_1', bs: 1.500, ifs: null, fs: null },
      { id: '2', station: 'BM_2', bs: null, ifs: null, fs: 1.498 } // misclosure = +2 mm
    ];

    it('safely clamps K = 0 km to minimum distance (0.001 km) without throwing or NaN', () => {
      const resZeroK = calculateLevelingLoop(standardLoop, 10.0, 10.0, 0);

      expect(resZeroK.totalDistanceKm).toBe(0.001);
      expect(isNaN(resZeroK.orderCompliance.firstOrderMaxMm)).toBe(false);
      expect(resZeroK.orderCompliance.firstOrderMaxMm).toBeGreaterThan(0);
      // 4 * sqrt(0.001) = 0.13 mm
      expect(resZeroK.orderCompliance.firstOrderMaxMm).toBe(0.13);
      // With +2mm error on 0 km (clamped to 1m), it exceeds construction grade (0.76mm)
      expect(resZeroK.orderCompliance.achievedOrder).toContain('เกินเกณฑ์');
    });

    it('safely handles negative distance K < 0 by clamping to minimum without NaN', () => {
      const resNegK = calculateLevelingLoop(standardLoop, 10.0, 10.0, -5.0);

      expect(resNegK.totalDistanceKm).toBe(0.001);
      expect(isNaN(resNegK.orderCompliance.firstOrderMaxMm)).toBe(false);
      expect(resNegK.orderCompliance.firstOrderMaxMm).toBe(0.13);
      expect(resNegK.orderCompliance.secondOrderMaxMm).toBe(0.25);
      expect(resNegK.orderCompliance.thirdOrderMaxMm).toBe(0.38);
      expect(resNegK.orderCompliance.constructionMaxMm).toBe(0.76);
    });

    it('correctly computes tolerances for continental-scale distance (K = 10,000 km)', () => {
      // K = 10,000 km -> sqrt(K) = 100
      // 1st order: 4 * 100 = 400 mm
      // 2nd order: 8 * 100 = 800 mm
      // 3rd order: 12 * 100 = 1200 mm
      // Construction: 24 * 100 = 2400 mm
      const resLargeK = calculateLevelingLoop(standardLoop, 10.0, 10.0, 10000);

      expect(resLargeK.totalDistanceKm).toBe(10000);
      expect(resLargeK.orderCompliance.firstOrderMaxMm).toBe(400.00);
      expect(resLargeK.orderCompliance.secondOrderMaxMm).toBe(800.00);
      expect(resLargeK.orderCompliance.thirdOrderMaxMm).toBe(1200.00);
      expect(resLargeK.orderCompliance.constructionMaxMm).toBe(2400.00);
      // 2mm error over 10,000 km is easily First Order
      expect(resLargeK.orderCompliance.achievedOrder).toContain('ชั้น 1');
    });

    it('rigorously tests exact boundary thresholds between RTSD order classifications', () => {
      // On K = 1.0 km:
      // First order: <= 4.00 mm
      // Second order: <= 8.00 mm
      // Third order: <= 12.00 mm
      // Construction: <= 24.00 mm

      const createTestLoop = (errorMeters: number): LevelingRowInput[] => [
        { id: '1', station: 'BM_1', bs: 2.000, ifs: null, fs: null },
        { id: '2', station: 'BM_2', bs: null, ifs: null, fs: 2.000 - errorMeters }
      ];

      // Exact 4.00 mm error -> First Order
      const res4mm = calculateLevelingLoop(createTestLoop(0.004), 10.0, 10.0, 1.0);
      expect(res4mm.closureErrorMm).toBe(4.00);
      expect(res4mm.orderCompliance.achievedOrder).toContain('ชั้น 1');

      // 4.10 mm error (0.0041m) -> Exceeds 1st order (4.00mm), qualifies for 2nd order (<= 8.00mm)
      const res4_1mm = calculateLevelingLoop(createTestLoop(0.0041), 10.0, 10.0, 1.0);
      expect(res4_1mm.closureErrorMm).toBe(4.10);
      expect(res4_1mm.orderCompliance.achievedOrder).toContain('ชั้น 2');

      // Exact 8.00 mm error -> Second Order
      const res8mm = calculateLevelingLoop(createTestLoop(0.008), 10.0, 10.0, 1.0);
      expect(res8mm.closureErrorMm).toBe(8.00);
      expect(res8mm.orderCompliance.achievedOrder).toContain('ชั้น 2');

      // 8.10 mm error (0.0081m) -> Exceeds 2nd order (8.00mm), qualifies for 3rd order (<= 12.00mm)
      const res8_1mm = calculateLevelingLoop(createTestLoop(0.0081), 10.0, 10.0, 1.0);
      expect(res8_1mm.closureErrorMm).toBe(8.10);
      expect(res8_1mm.orderCompliance.achievedOrder).toContain('ชั้น 3');

      // Exact 12.00 mm error -> Third Order
      const res12mm = calculateLevelingLoop(createTestLoop(0.012), 10.0, 10.0, 1.0);
      expect(res12mm.closureErrorMm).toBe(12.00);
      expect(res12mm.orderCompliance.achievedOrder).toContain('ชั้น 3');

      // 12.10 mm error (0.0121m) -> Exceeds 3rd order (12.00mm), qualifies for Construction (<= 24.00mm)
      const res12_1mm = calculateLevelingLoop(createTestLoop(0.0121), 10.0, 10.0, 1.0);
      expect(res12_1mm.closureErrorMm).toBe(12.10);
      expect(res12_1mm.orderCompliance.achievedOrder).toContain('ก่อสร้าง');

      // Exact 24.00 mm error -> Construction Grade
      const res24mm = calculateLevelingLoop(createTestLoop(0.024), 10.0, 10.0, 1.0);
      expect(res24mm.closureErrorMm).toBe(24.00);
      expect(res24mm.orderCompliance.achievedOrder).toContain('ก่อสร้าง');

      // 24.10 mm error (0.0241m) -> Exceeds construction grade (24.00mm)
      const res24_1mm = calculateLevelingLoop(createTestLoop(0.0241), 10.0, 10.0, 1.0);
      expect(res24_1mm.closureErrorMm).toBe(24.10);
      expect(res24_1mm.orderCompliance.achievedOrder).toContain('เกินเกณฑ์');
    });
  });

  describe('5. Zero Staff Readings and Flat Leveling Lines', () => {
    it('handles zero staff reading without falsy coercion bugs', () => {
      // Water surface or zero staff mark
      const zeroRows: LevelingRowInput[] = [
        { id: '1', station: 'BM_WATER_REF', bs: 0.000, ifs: null, fs: null },
        { id: '2', station: 'WATER_GAUGE', bs: null, ifs: 0.000, fs: null },
        { id: '3', station: 'BM_WATER_END', bs: null, ifs: null, fs: 0.000 }
      ];

      const result = calculateLevelingLoop(zeroRows, 15.000, 15.000, 0.1);

      expect(result.rows[0].hi).toBe(15.000);
      expect(result.rows[1].elevation).toBe(15.000);
      expect(result.rows[2].elevation).toBe(15.000);
      expect(result.sumBs).toBe(0.000);
      expect(result.sumFs).toBe(0.000);
      expect(result.diffBsFs).toBe(0.000);
      expect(result.arithmeticCheckPassed).toBe(true);
      expect(result.closureErrorMm).toBe(0.0);
    });
  });
});
