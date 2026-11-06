import { describe, it, expect } from 'vitest';
import {
  calculateTrueVerticalAntennaHeight,
  calculateSessionOverlapMinutes,
  type StationSession
} from '../src/core/gnss/multi-session-manager';
import {
  generateCandidateBaselines,
  selectIndependentBaselines,
  calculateApproxDistanceMeters,
  SAMPLE_GNSS_MULTI_STATION_NETWORK
} from '../src/core/gnss/auto-baseline-engine';
import {
  findIndependentLoops,
  checkRepeatedBaselines,
  type SolvedBaselineEdge
} from '../src/core/gnss/loop-closure-analyzer';
import {
  adjust2DNetwork,
  type Station2D,
  type Observation2D
} from '../src/utils/least-squares';

describe('GNSS Multi-Session Station Manager', () => {
  it('correctly converts antenna slant height to true vertical height using antenna radius', () => {
    // 2.000m slant with EMLID radius (80mm = 0.08m) -> sqrt(2.0^2 - 0.08^2) = 1.9984m
    const vert = calculateTrueVerticalAntennaHeight(2.000, 'slant', 'EMLID_REACH_RS2_RS3');
    expect(vert).toBeCloseTo(1.9984, 3);

    // Direct vertical measurement remains unchanged
    const directVert = calculateTrueVerticalAntennaHeight(1.850, 'vertical');
    expect(directVert).toBe(1.850);
  });

  it('accurately computes session overlap duration in minutes', () => {
    const baseTime = new Date('2026-03-10T08:00:00Z');
    const s1: StationSession = {
      id: 's1',
      stationCode: 'BM01',
      fileName: 'bm01.obs',
      fileSizeBytes: 1000,
      format: 'RINEX',
      startTimeUtc: new Date(baseTime.getTime()),
      endTimeUtc: new Date(baseTime.getTime() + 60 * 60000), // 08:00 - 09:00 (60 mins)
      durationMinutes: 60,
      intervalSec: 1,
      epochsCount: 3600,
      satellitesObserved: ['G01', 'G02'],
      constellations: ['GPS'],
      approxCoordinates: { x: 0, y: 0, z: 0, latDeg: 13.84, lonDeg: 100.57, ellipHeightM: 20 },
      antenna: { model: 'GENERIC', measuredHeightM: 1.8, measurementMethod: 'vertical', trueVerticalHeightM: 1.8 },
      isFixedControl: true
    };

    const s2: StationSession = {
      ...s1,
      id: 's2',
      stationCode: 'BM02',
      startTimeUtc: new Date(baseTime.getTime() + 20 * 60000), // 08:20
      endTimeUtc: new Date(baseTime.getTime() + 80 * 60000),   // 09:20
      durationMinutes: 60
    };

    // Overlap: 08:20 to 09:00 = 40 minutes
    const overlap = calculateSessionOverlapMinutes(s1, s2);
    expect(overlap).toBe(40);

    // Disjoint session: 09:30 to 10:30 -> 0 minutes overlap
    const s3: StationSession = {
      ...s1,
      id: 's3',
      stationCode: 'BM03',
      startTimeUtc: new Date(baseTime.getTime() + 90 * 60000),
      endTimeUtc: new Date(baseTime.getTime() + 150 * 60000)
    };
    expect(calculateSessionOverlapMinutes(s1, s3)).toBe(0);
  });
});

describe('GNSS Auto-Baseline Discovery & Spanning Tree Engine', () => {
  it('identifies overlapping station pairs and forms candidates', () => {
    const t0 = new Date('2026-03-10T08:00:00Z');
    const stations: StationSession[] = [
      {
        id: 'stn1',
        stationCode: 'BASE1',
        fileName: 'base1.obs',
        fileSizeBytes: 1000,
        format: 'RINEX',
        startTimeUtc: t0,
        endTimeUtc: new Date(t0.getTime() + 120 * 60000), // 2 hours
        durationMinutes: 120,
        intervalSec: 1,
        epochsCount: 7200,
        satellitesObserved: ['G01'],
        constellations: ['GPS'],
        approxCoordinates: { x: -1085000, y: 5937000, z: 1515000, latDeg: 13.84, lonDeg: 100.57, ellipHeightM: 20 },
        antenna: { model: 'GENERIC', measuredHeightM: 1.8, measurementMethod: 'vertical', trueVerticalHeightM: 1.8 },
        isFixedControl: true
      },
      {
        id: 'stn2',
        stationCode: 'ROV1',
        fileName: 'rov1.obs',
        fileSizeBytes: 1000,
        format: 'RINEX',
        startTimeUtc: new Date(t0.getTime() + 15 * 60000),
        endTimeUtc: new Date(t0.getTime() + 75 * 60000), // 60 mins
        durationMinutes: 60,
        intervalSec: 1,
        epochsCount: 3600,
        satellitesObserved: ['G01'],
        constellations: ['GPS'],
        approxCoordinates: { x: -1085200, y: 5937100, z: 1515100, latDeg: 13.841, lonDeg: 100.572, ellipHeightM: 21 },
        antenna: { model: 'GENERIC', measuredHeightM: 1.8, measurementMethod: 'vertical', trueVerticalHeightM: 1.8 },
        isFixedControl: false
      },
      {
        id: 'stn3',
        stationCode: 'ROV2',
        fileName: 'rov2.obs',
        fileSizeBytes: 1000,
        format: 'RINEX',
        startTimeUtc: new Date(t0.getTime() + 30 * 60000),
        endTimeUtc: new Date(t0.getTime() + 90 * 60000), // 60 mins
        durationMinutes: 60,
        intervalSec: 1,
        epochsCount: 3600,
        satellitesObserved: ['G01'],
        constellations: ['GPS'],
        approxCoordinates: { x: -1085400, y: 5937200, z: 1515200, latDeg: 13.842, lonDeg: 100.573, ellipHeightM: 22 },
        antenna: { model: 'GENERIC', measuredHeightM: 1.8, measurementMethod: 'vertical', trueVerticalHeightM: 1.8 },
        isFixedControl: false
      }
    ];

    const candidates = generateCandidateBaselines(stations, 15);
    expect(candidates.length).toBe(3);

    const independent = selectIndependentBaselines(stations, candidates, 1.0);
    const indCount = independent.filter(c => c.isIndependent).length;
    expect(indCount).toBe(2);
  });
});

describe('GNSS Independent Loop Closure Analyzer & Network Adjustment', () => {
  it('detects a closed triangle loop and validates zero misclosure with RTSD Class 1', () => {
    const edges: SolvedBaselineEdge[] = [
      {
        id: 'BL_AB',
        fromStation: 'STN_A',
        toStation: 'STN_B',
        dE: 500.000,
        dN: 300.000,
        dU: 2.500,
        distance2D: 583.095,
        distance3D: 583.100,
        status: 'FIXED',
        ratioTest: 5.5
      },
      {
        id: 'BL_BC',
        fromStation: 'STN_B',
        toStation: 'STN_C',
        dE: -200.000,
        dN: 400.000,
        dU: -1.200,
        distance2D: 447.214,
        distance3D: 447.215,
        status: 'FIXED',
        ratioTest: 4.8
      },
      {
        id: 'BL_CA',
        fromStation: 'STN_C',
        toStation: 'STN_A',
        dE: -300.000,
        dN: -700.000,
        dU: -1.300,
        distance2D: 761.577,
        distance3D: 761.578,
        status: 'FIXED',
        ratioTest: 6.2
      }
    ];

    const loops = findIndependentLoops(edges);
    expect(loops.length).toBe(1);

    const loop = loops[0];
    expect(loop.misclosureE).toBeCloseTo(0.000, 3);
    expect(loop.misclosureN).toBeCloseTo(0.000, 3);
    expect(loop.misclosureU).toBeCloseTo(0.000, 3);
    expect(loop.misclosure3D).toBeCloseTo(0.000, 3);
    expect(loop.passedClass1).toBe(true);
    expect(loop.passedClass2).toBe(true);
    expect(loop.misclosureRatio).toBeGreaterThan(100000);
  });

  it('fails Class 1 tolerance and flags suspect edge when a vector has a blunder', () => {
    const edges: SolvedBaselineEdge[] = [
      {
        id: 'BL_AB',
        fromStation: 'STN_A',
        toStation: 'STN_B',
        dE: 100.000,
        dN: 100.000,
        dU: 0.000,
        distance2D: 141.42,
        distance3D: 141.42,
        status: 'FIXED',
        ratioTest: 5.0
      },
      {
        id: 'BL_BC',
        fromStation: 'STN_B',
        toStation: 'STN_C',
        dE: 0.000,
        dN: -100.000,
        dU: 0.000,
        distance2D: 100.00,
        distance3D: 100.00,
        status: 'FLOAT',
        ratioTest: 1.8
      },
      {
        id: 'BL_CA',
        fromStation: 'STN_C',
        toStation: 'STN_A',
        dE: -100.080,
        dN: 0.000,
        dU: 0.000,
        distance2D: 100.08,
        distance3D: 100.08,
        status: 'FIXED',
        ratioTest: 6.0
      }
    ];

    const loops = findIndependentLoops(edges);
    expect(loops.length).toBe(1);

    const loop = loops[0];
    expect(loop.misclosure3D).toBeCloseTo(0.080, 2);
    expect(loop.passedClass1).toBe(false);
    expect(loop.suspectEdgeId).toBe('BL_BC');
  });

  it('validates SAMPLE_GNSS_MULTI_STATION_NETWORK loops and least-squares adjustment', () => {
    const loops = findIndependentLoops(SAMPLE_GNSS_MULTI_STATION_NETWORK.baselines);
    expect(loops.length).toBeGreaterThanOrEqual(1);

    // First loop: CORS_KU -> BM_NORTH -> BM_EAST -> CORS_KU
    const loop1 = loops[0];
    expect(loop1.misclosure3D).toBeLessThan(0.005); // Less than 5mm misclosure
    expect(loop1.passedClass1).toBe(true);

    // Convert sample stations and baselines into Station2D & Observation2D for Least Squares
    const stations2D: Station2D[] = [
      { id: 'CORS_KU', isFixed: true, knownE: 669988.90, knownN: 1531019.56 },
      { id: 'BM_NORTH', isFixed: false, approxE: 670150.0, approxN: 1531380.0 },
      { id: 'BM_EAST', isFixed: false, approxE: 670420.0, approxN: 1530950.0 },
      { id: 'BM_SOUTH', isFixed: false, approxE: 670080.0, approxN: 1530620.0 }
    ];

    const obs2D: Observation2D[] = SAMPLE_GNSS_MULTI_STATION_NETWORK.baselines.map((b) => ({
      id: b.id,
      type: 'baseline_vector',
      fromStation: b.fromStation,
      toStation: b.toStation,
      dE: b.dE,
      dN: b.dN,
      stdDevE: 0.003,
      stdDevN: 0.003,
      measuredValue: b.distance2D,
      stdDev: 0.005
    }));

    const result = adjust2DNetwork(stations2D, obs2D);
    expect(result.converged).toBe(true);
    expect(result.sigma0).toBeLessThan(1.5);
    expect(result.stations.length).toBe(4);

    const northStn = result.stations.find(s => s.id === 'BM_NORTH');
    expect(northStn).toBeDefined();
    expect(northStn?.easting).toBeCloseTo(670150.25, 1);
    expect(northStn?.northing).toBeCloseTo(1531380.12, 1);
    expect(northStn?.errorEllipse?.semiMajorAxisMm).toBeGreaterThan(0);
  });
});
