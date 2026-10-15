import { describe, it, expect } from 'vitest';
import {
  ecefVectorToENU,
  solveStaticBaseline
} from '../src/utils/gnss-baseline';
import {
  parseRinexText,
  SAMPLE_RINEX_BASE,
  SAMPLE_RINEX_ROVER
} from '../src/utils/rinex-parser';

describe('MESURV Geomatics Core: GNSS Baseline Processing Engine', () => {
  it('correctly rotates ECEF delta vector to local topocentric ENU coordinates', () => {
    // Bangkok base station approx latitude 13.84° N, longitude 100.57° E
    const baseLat = 13.8476;
    const baseLng = 100.5696;

    // Zero delta should yield zero ENU and zero distance
    const zeroENU = ecefVectorToENU(0, 0, 0, baseLat, baseLng);
    expect(zeroENU.dE).toBe(0);
    expect(zeroENU.dN).toBe(0);
    expect(zeroENU.dU).toBe(0);
    expect(zeroENU.distance2D).toBe(0);

    // Test a known displacement
    const enu = ecefVectorToENU(100.0, 200.0, 50.0, baseLat, baseLng);
    expect(typeof enu.dE).toBe('number');
    expect(typeof enu.dN).toBe('number');
    expect(typeof enu.dU).toBe('number');
    expect(enu.distance2D).toBeGreaterThan(0);
    expect(enu.distance3D).toBeGreaterThan(enu.distance2D);
    expect(enu.azimuthDeg).toBeGreaterThanOrEqual(0);
    expect(enu.azimuthDeg).toBeLessThanOrEqual(360);
  });

  it('computes double-difference static baseline between base and rover stations', () => {
    const base = parseRinexText(SAMPLE_RINEX_BASE);
    const rover = parseRinexText(SAMPLE_RINEX_ROVER);

    const solution = solveStaticBaseline(base, rover, {
      elevationMaskDeg: 15,
      snrThresholdDbHz: 35
    });

    expect(solution.id).toContain('BASE-01');
    expect(solution.id).toContain('ROVER-01');
    expect(solution.commonSatellites).toBeGreaterThanOrEqual(8);
    expect(solution.ratioTest).toBeGreaterThanOrEqual(3.0);
    expect(solution.status).toBe('FIXED');

    // Vector distances
    expect(solution.vectorENU.distance2D).toBeGreaterThan(100);
    expect(solution.vectorENU.distance2D).toBeLessThan(5000); // realistic sub-5km engineering baseline
    expect(solution.vectorENU.distance3D).toBeGreaterThanOrEqual(solution.vectorENU.distance2D);

    // Millimeter standard deviations
    expect(solution.stdDevMm.dE).toBeGreaterThan(0);
    expect(solution.stdDevMm.dE).toBeLessThan(10); // <10mm for short static baseline
    expect(solution.stdDevMm.dN).toBeGreaterThan(0);
    expect(solution.stdDevMm.dN).toBeLessThan(10);
    expect(solution.stdDevMm.dU).toBeGreaterThan(0);

    // 3x3 covariance matrix
    expect(solution.covarianceMatrixENU.length).toBe(3);
    expect(solution.covarianceMatrixENU[0].length).toBe(3);
    expect(solution.covarianceMatrixENU[0][0]).toBeGreaterThan(0); // Var(E) > 0
    expect(solution.covarianceMatrixENU[1][1]).toBeGreaterThan(0); // Var(N) > 0
    expect(solution.covarianceMatrixENU[2][2]).toBeGreaterThan(0); // Var(U) > 0
  });

  it('rejects baseline computation if common satellites are below 4', () => {
    const base = parseRinexText(SAMPLE_RINEX_BASE);
    const rover = parseRinexText(SAMPLE_RINEX_ROVER);

    // Artificially high elevation mask that excludes all satellites
    expect(() => {
      solveStaticBaseline(base, rover, {
        elevationMaskDeg: 89.9
      });
    }).toThrow('ต่ำกว่าเกณฑ์ขั้นต่ำ 4 ดวง');
  });
});
