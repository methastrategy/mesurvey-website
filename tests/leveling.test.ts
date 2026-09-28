import { describe, it, expect } from 'vitest';
import { calculateLevelingLoop } from '../src/core/leveling';
import { SAMPLE_LEVELING_ROWS, SAMPLE_LEVELING_START_ELEVATION } from '../src/data/survey-presets';
import { LevelingRowInput } from '../src/types/survey';

describe('Differential Leveling Calculation Engine (leveling.ts)', () => {
  it('correctly reduces ground-truth sample leveling line with Turning Points (TP)', () => {
    const result = calculateLevelingLoop(
      SAMPLE_LEVELING_ROWS,
      SAMPLE_LEVELING_START_ELEVATION,
      SAMPLE_LEVELING_START_ELEVATION,
      1.0
    );

    expect(result.rows).toHaveLength(6);

    // Station 0: BM_KU
    expect(result.rows[0].station).toBe('BM_KU');
    expect(result.rows[0].elevation).toBeCloseTo(10.000, 3);
    expect(result.rows[0].hi).toBeCloseTo(11.452, 3);
    expect(result.rows[0].rise).toBeNull();
    expect(result.rows[0].fall).toBeNull();

    // Station 1: TP_1 (RL = 11.452 - 1.120 = 10.332, new HI = 10.332 + 1.625 = 11.957)
    expect(result.rows[1].station).toBe('TP_1');
    expect(result.rows[1].elevation).toBeCloseTo(10.332, 3);
    expect(result.rows[1].hi).toBeCloseTo(11.957, 3);
    expect(result.rows[1].rise).toBeCloseTo(0.332, 3);
    expect(result.rows[1].fall).toBeNull();

    // Station 2: IS_A (RL = 11.957 - 1.845 = 10.112)
    expect(result.rows[2].station).toBe('IS_A');
    expect(result.rows[2].elevation).toBeCloseTo(10.112, 3);
    expect(result.rows[2].hi).toBeCloseTo(11.957, 3);
    expect(result.rows[2].rise).toBeNull();
    expect(result.rows[2].fall).toBeCloseTo(0.220, 3);

    // Station 3: IS_B (RL = 11.957 - 2.110 = 9.847)
    expect(result.rows[3].station).toBe('IS_B');
    expect(result.rows[3].elevation).toBeCloseTo(9.847, 3);
    expect(result.rows[3].hi).toBeCloseTo(11.957, 3);
    expect(result.rows[3].rise).toBeNull();
    expect(result.rows[3].fall).toBeCloseTo(0.265, 3);

    // Station 4: TP_2 (RL = 11.957 - 1.485 = 10.472, new HI = 10.472 + 1.340 = 11.812)
    expect(result.rows[4].station).toBe('TP_2');
    expect(result.rows[4].elevation).toBeCloseTo(10.472, 3);
    expect(result.rows[4].hi).toBeCloseTo(11.812, 3);
    expect(result.rows[4].rise).toBeCloseTo(0.625, 3);
    expect(result.rows[4].fall).toBeNull();

    // Station 5: Closing on BM_KU (RL = 11.812 - 1.815 = 9.997)
    expect(result.rows[5].station).toBe('BM_KU');
    expect(result.rows[5].elevation).toBeCloseTo(9.997, 3);
    expect(result.rows[5].rise).toBeNull();
    expect(result.rows[5].fall).toBeCloseTo(0.475, 3);
  });

  it('guarantees exact Three-Fold Page Check arithmetic equality (Σ BS - Σ FS = Last RL - First RL = Σ Rise - Σ Fall)', () => {
    const result = calculateLevelingLoop(
      SAMPLE_LEVELING_ROWS,
      SAMPLE_LEVELING_START_ELEVATION,
      SAMPLE_LEVELING_START_ELEVATION,
      1.0
    );

    // Sum BS = 1.452 + 1.625 + 1.340 = 4.417
    expect(result.sumBs).toBeCloseTo(4.417, 3);
    // Sum FS = 1.120 + 1.485 + 1.815 = 4.420
    expect(result.sumFs).toBeCloseTo(4.420, 3);
    // diffBsFs = 4.417 - 4.420 = -0.003
    expect(result.diffBsFs).toBeCloseTo(-0.003, 3);
    // deltaBenchmarks = 9.997 - 10.000 = -0.003
    expect(result.deltaBenchmarks).toBeCloseTo(-0.003, 3);

    // Sum Rise = 0.332 + 0.625 = 0.957
    // Sum Fall = 0.220 + 0.265 + 0.475 = 0.960
    // Sum Rise - Sum Fall = 0.957 - 0.960 = -0.003
    const totalRise = result.rows.reduce((sum, r) => sum + (r.rise || 0), 0);
    const totalFall = result.rows.reduce((sum, r) => sum + (r.fall || 0), 0);
    expect(totalRise - totalFall).toBeCloseTo(-0.003, 3);

    // Page check verification flag
    expect(result.arithmeticCheckPassed).toBe(true);
    expect(result.closureErrorMm).toBeCloseTo(-3.0, 1);
  });

  it('correctly evaluates RTSD order compliance across standard distance thresholds', () => {
    // Distance K = 1.0 km -> sqrt(K) = 1.0
    // 1st order: ±4 mm, 2nd: ±8 mm, 3rd: ±12 mm, Construction: ±24 mm
    // With -3.0 mm error, it qualifies for First-Order
    const result1km = calculateLevelingLoop(SAMPLE_LEVELING_ROWS, 10.0, 10.0, 1.0);
    expect(result1km.orderCompliance.achievedOrder).toContain('ชั้น 1');
    expect(result1km.orderCompliance.firstOrderMaxMm).toBe(4.00);
    expect(result1km.orderCompliance.secondOrderMaxMm).toBe(8.00);
    expect(result1km.orderCompliance.thirdOrderMaxMm).toBe(12.00);
    expect(result1km.orderCompliance.constructionMaxMm).toBe(24.00);

    // Test loop with larger closure error (e.g. 10 mm error on 1 km)
    const customRows: LevelingRowInput[] = [
      { id: '1', station: 'BM-1', bs: 2.000, ifs: null, fs: null },
      { id: '2', station: 'BM-2', bs: null, ifs: null, fs: 1.990 } // diff = +0.010m = 10mm
    ];
    const res2nd = calculateLevelingLoop(customRows, 100.0, 100.0, 1.0);
    // 10mm > 8mm (2nd order) and <= 12mm (3rd order)
    expect(res2nd.orderCompliance.achievedOrder).toContain('ชั้น 3');

    // Test loop with 20 mm error on 1 km
    const customRows20: LevelingRowInput[] = [
      { id: '1', station: 'BM-1', bs: 2.000, ifs: null, fs: null },
      { id: '2', station: 'BM-2', bs: null, ifs: null, fs: 1.980 } // diff = +0.020m = 20mm
    ];
    const resConst = calculateLevelingLoop(customRows20, 100.0, 100.0, 1.0);
    expect(resConst.orderCompliance.achievedOrder).toContain('ก่อสร้าง');

    // Test loop exceeding construction grade (30 mm on 1 km)
    const customRows30: LevelingRowInput[] = [
      { id: '1', station: 'BM-1', bs: 2.000, ifs: null, fs: null },
      { id: '2', station: 'BM-2', bs: null, ifs: null, fs: 1.970 } // diff = +0.030m = 30mm
    ];
    const resExceed = calculateLevelingLoop(customRows30, 100.0, 100.0, 1.0);
    expect(resExceed.orderCompliance.achievedOrder).toContain('เกินเกณฑ์');
  });

  it('rejects invalid inputs with descriptive field errors', () => {
    // NaN start elevation
    expect(() => calculateLevelingLoop(SAMPLE_LEVELING_ROWS, NaN)).toThrow(
      'ค่าระดับหมุดเริ่มต้น (Start Benchmark RL) ไม่ถูกต้อง'
    );

    // Empty rows
    expect(() => calculateLevelingLoop([], 10.0)).toThrow(
      'สมุดจดงานระดับว่างเปล่า'
    );

    // Missing BS on first station
    const invalidFirstRow: LevelingRowInput[] = [
      { id: '1', station: 'BM_START', bs: null, ifs: null, fs: null }
    ];
    expect(() => calculateLevelingLoop(invalidFirstRow, 10.0)).toThrow(
      'ขาดค่าอ่านไม้ระดับส่องหลัง (Backsight - BS)'
    );
  });
});
