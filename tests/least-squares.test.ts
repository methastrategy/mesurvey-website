import { describe, it, expect } from 'vitest';
import {
  matrixTranspose,
  matrixMultiply,
  matrixInvert,
  adjust1DLevelingNetwork,
  adjust2DNetwork,
  SAMPLE_LEVELING_NETWORK,
  SAMPLE_2D_TRAVERSE_NETWORK,
  type LevelingPoint,
  type LevelingObservation,
  type Station2D,
  type Observation2D
} from '../src/utils/least-squares';

describe('MESURV Geomatics Core: Matrix Algebra', () => {
  it('correctly transposes matrices of any dimension', () => {
    const A = [
      [1, 2, 3],
      [4, 5, 6]
    ];
    const AT = matrixTranspose(A);
    expect(AT).toEqual([
      [1, 4],
      [2, 5],
      [3, 6]
    ]);
  });

  it('multiplies matrices with mathematical fidelity', () => {
    const A = [
      [1, 2],
      [3, 4]
    ];
    const B = [
      [2, 0],
      [1, 2]
    ];
    const C = matrixMultiply(A, B);
    expect(C).toEqual([
      [4, 4],
      [10, 8]
    ]);
  });

  it('inverts non-singular square matrices correctly', () => {
    const A = [
      [4, 7],
      [2, 6]
    ];
    const inv = matrixInvert(A);
    expect(inv).not.toBeNull();
    if (inv) {
      const I = matrixMultiply(A, inv);
      expect(I[0][0]).toBeCloseTo(1, 6);
      expect(I[0][1]).toBeCloseTo(0, 6);
      expect(I[1][0]).toBeCloseTo(0, 6);
      expect(I[1][1]).toBeCloseTo(1, 6);
    }
  });

  it('returns null when encountering a singular or rank-deficient matrix', () => {
    const singular = [
      [1, 2],
      [2, 4]
    ];
    const inv = matrixInvert(singular);
    expect(inv).toBeNull();
  });
});

describe('1D Leveling Least Squares Network Adjustment', () => {
  it('solves sample leveling loop and satisfies closure tolerances', () => {
    const result = adjust1DLevelingNetwork(
      SAMPLE_LEVELING_NETWORK.points,
      SAMPLE_LEVELING_NETWORK.observations
    );

    expect(result.converged).toBe(true);
    expect(result.dof).toBe(3); // n=5 observations, u=2 unknown stations (P1, P2) -> r = 3
    expect(result.sigma0).toBeGreaterThan(0);
    expect(result.points.length).toBe(4);

    const bm1 = result.points.find((p) => p.id === 'BM-01');
    const bm2 = result.points.find((p) => p.id === 'BM-02');
    const p1 = result.points.find((p) => p.id === 'P1');
    const p2 = result.points.find((p) => p.id === 'P2');

    expect(bm1?.adjustedElevation).toBe(100.0);
    expect(bm1?.stdDevMm).toBe(0);
    expect(bm2?.adjustedElevation).toBe(104.285);
    expect(bm2?.stdDevMm).toBe(0);

    // P1 and P2 elevations should be rigorously between 100.0 and 104.285
    expect(p1?.adjustedElevation).toBeGreaterThan(101.0);
    expect(p1?.adjustedElevation).toBeLessThan(102.0);
    expect(p1?.stdDevMm).toBeGreaterThan(0);
    expect(p2?.adjustedElevation).toBeGreaterThan(102.5);
    expect(p2?.adjustedElevation).toBeLessThan(104.0);

    // Check that observations have residuals in millimeters
    expect(result.observations.length).toBe(5);
    result.observations.forEach((obs) => {
      expect(typeof obs.residualMm).toBe('number');
      expect(typeof obs.normalizedResidual).toBe('number');
    });
  });

  it('detects injected gross errors (blunders / outliers) via normalized residuals', () => {
    const points: LevelingPoint[] = [
      { id: 'BM1', isFixed: true, knownElevation: 50.0 },
      { id: 'BM2', isFixed: true, knownElevation: 55.0 },
      { id: 'P1', isFixed: false, approxElevation: 52.0 },
      { id: 'P2', isFixed: false, approxElevation: 53.5 }
    ];

    const obsWithBlunder: LevelingObservation[] = [
      { id: 'L1', fromStation: 'BM1', toStation: 'P1', measuredDh: 2.000, distanceKm: 1.0 },
      { id: 'L2', fromStation: 'P1', toStation: 'P2', measuredDh: 1.500, distanceKm: 1.0 },
      { id: 'L3', fromStation: 'P2', toStation: 'BM2', measuredDh: 1.500, distanceKm: 1.0 },
      // Blunder: 0.150 m error on redundant line
      { id: 'L4_BLUNDER', fromStation: 'BM1', toStation: 'P2', measuredDh: 3.650, distanceKm: 1.5 }
    ];

    const result = adjust1DLevelingNetwork(points, obsWithBlunder);
    expect(result.hasOutliers).toBe(true);
    const blunderObs = result.observations.find((o) => o.id === 'L4_BLUNDER');
    expect(blunderObs?.isOutlier).toBe(true);
    expect(blunderObs?.normalizedResidual).toBeGreaterThan(2.576);
  });

  it('throws helpful error if no fixed benchmarks are defined', () => {
    const points: LevelingPoint[] = [
      { id: 'P1', isFixed: false, approxElevation: 10.0 },
      { id: 'P2', isFixed: false, approxElevation: 12.0 }
    ];
    const obs: LevelingObservation[] = [
      { id: 'L1', fromStation: 'P1', toStation: 'P2', measuredDh: 2.0, distanceKm: 1.0 }
    ];
    expect(() => adjust1DLevelingNetwork(points, obs)).toThrow(
      'ต้องมีหมุดหลักฐานอ้างอิงความสูง (Fixed Benchmark) อย่างน้อย 1 หมุด'
    );
  });
});

describe('2D Traverse & Network Adjustment (with Error Ellipses)', () => {
  it('solves 2D sample network and computes 95% confidence error ellipses', () => {
    const result = adjust2DNetwork(
      SAMPLE_2D_TRAVERSE_NETWORK.stations,
      SAMPLE_2D_TRAVERSE_NETWORK.observations
    );

    expect(result.converged).toBe(true);
    expect(result.iterations).toBeLessThan(10);
    expect(result.dof).toBeGreaterThan(0);
    expect(result.sigma0).toBeGreaterThan(0);

    const stn1 = result.stations.find((s) => s.id === 'STN-1');
    const pa = result.stations.find((s) => s.id === 'P-A');
    const pb = result.stations.find((s) => s.id === 'P-B');

    // Fixed station stays invariant
    expect(stn1?.easting).toBe(669500.0);
    expect(stn1?.northing).toBe(1531000.0);
    expect(stn1?.sigmaEMm).toBe(0);
    expect(stn1?.sigmaNMm).toBe(0);

    // Adjusted unknown stations should have valid standard deviations and error ellipses
    expect(pa).toBeDefined();
    expect(pa?.sigmaEMm).toBeGreaterThan(0);
    expect(pa?.sigmaNMm).toBeGreaterThan(0);
    expect(pa?.errorEllipse).toBeDefined();

    if (pa?.errorEllipse) {
      const { semiMajorAxisMm, semiMinorAxisMm, orientationDeg, conf95MajorMm } = pa.errorEllipse;
      expect(semiMajorAxisMm).toBeGreaterThanOrEqual(semiMinorAxisMm);
      expect(semiMinorAxisMm).toBeGreaterThan(0);
      expect(orientationDeg).toBeGreaterThanOrEqual(0);
      expect(orientationDeg).toBeLessThanOrEqual(360);
      expect(conf95MajorMm).toBeCloseTo(semiMajorAxisMm * 2.447, 2);
    }

    if (pb?.errorEllipse) {
      expect(pb.errorEllipse.semiMajorAxisMm).toBeGreaterThan(0);
    }
  });

  it('supports GNSS baseline vector observations (dE, dN)', () => {
    const stations: Station2D[] = [
      { id: 'BASE', isFixed: true, knownE: 1000.0, knownN: 2000.0 },
      { id: 'ROVER1', isFixed: false, approxE: 1500.0, approxN: 2200.0 },
      { id: 'ROVER2', isFixed: false, approxE: 1300.0, approxN: 2600.0 }
    ];

    const observations: Observation2D[] = [
      {
        id: 'BL1',
        type: 'baseline_vector',
        fromStation: 'BASE',
        toStation: 'ROVER1',
        measuredValue: 500.125, // dE
        measuredValue2: 200.082, // dN
        stdDev: 0.005,
        stdDev2: 0.005
      },
      {
        id: 'BL2',
        type: 'baseline_vector',
        fromStation: 'BASE',
        toStation: 'ROVER2',
        measuredValue: 300.045,
        measuredValue2: 600.115,
        stdDev: 0.005,
        stdDev2: 0.005
      },
      {
        id: 'BL3_CLOSURE',
        type: 'baseline_vector',
        fromStation: 'ROVER1',
        toStation: 'ROVER2',
        measuredValue: -200.078,
        measuredValue2: 400.031,
        stdDev: 0.006,
        stdDev2: 0.006
      }
    ];

    const result = adjust2DNetwork(stations, observations);
    expect(result.converged).toBe(true);
    expect(result.dof).toBe(2); // 6 equations (3 vectors * 2), 4 unknowns (2 stations * 2) -> r = 2
    expect(result.sigma0).toBeGreaterThan(0);

    const r1 = result.stations.find((s) => s.id === 'ROVER1');
    const r2 = result.stations.find((s) => s.id === 'ROVER2');

    expect(r1?.easting).toBeCloseTo(1500.125, 1);
    expect(r1?.northing).toBeCloseTo(2200.082, 1);
    expect(r2?.easting).toBeCloseTo(1300.045, 1);
    expect(r2?.northing).toBeCloseTo(2600.115, 1);
    expect(r1?.errorEllipse?.semiMajorAxisMm).toBeGreaterThan(0);
  });
});
