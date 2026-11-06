/**
 * 🛰️ MESURV Geomatics Core: Auto Baseline Discovery & Spanning Tree Engine
 * Identifies simultaneous GNSS observation sessions, filters overlapping time windows,
 * and extracts mathematically independent baselines (eliminating trivial dependent loops).
 */

import { type StationSession, calculateSessionOverlapMinutes } from './multi-session-manager';
import type { SolvedBaselineEdge } from './loop-closure-analyzer';

export interface CandidateBaseline {
  id: string; // e.g. "BL_BM01_BM02"
  fromStationId: string;
  fromStationCode: string;
  toStationId: string;
  toStationCode: string;
  overlapMinutes: number;
  approxDistanceM: number;
  isIndependent: boolean; // True if selected for the independent network mesh (Spanning Tree + Loop Closures)
  isProcessed: boolean;
  solutionStatus?: 'FIXED' | 'FLOAT' | 'FAILED';
  ratioTest?: number;
  vectorENU?: {
    dE: number;
    dN: number;
    dU: number;
    distance2D: number;
    distance3D: number;
    azimuthDeg: number;
  };
  stdDevMm?: {
    dE: number;
    dN: number;
    dU: number;
  };
}

/**
 * Calculates spatial 3D distance between two stations using their approximate ECEF coordinates
 * or spherical approximations if ECEF is zero.
 */
export function calculateApproxDistanceMeters(s1: StationSession, s2: StationSession): number {
  const c1 = s1.approxCoordinates;
  const c2 = s2.approxCoordinates;

  if (c1.x !== 0 && c2.x !== 0) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dz = c2.z - c1.z;
    return Number(Math.hypot(dx, dy, dz).toFixed(3));
  }

  // Fallback to Haversine on lat/lon
  const R = 6378137.0; // WGS84 semi-major axis
  const dLat = (c2.latDeg - c1.latDeg) * (Math.PI / 180.0);
  const dLon = (c2.lonDeg - c1.lonDeg) * (Math.PI / 180.0);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(c1.latDeg * (Math.PI / 180.0)) *
      Math.cos(c2.latDeg * (Math.PI / 180.0)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const horizontalDist = R * c;
  const dH = c2.ellipHeightM - c1.ellipHeightM;
  return Number(Math.hypot(horizontalDist, dH).toFixed(3));
}

/**
 * Generates all candidate baseline pairs from a set of station sessions
 * that satisfy minimum overlap duration criteria.
 */
export function generateCandidateBaselines(
  stations: StationSession[],
  minOverlapMinutes: number = 10
): CandidateBaseline[] {
  const baselines: CandidateBaseline[] = [];
  const n = stations.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s1 = stations[i];
      const s2 = stations[j];

      // Station codes must not be identical
      if (s1.stationCode === s2.stationCode) continue;

      const overlap = calculateSessionOverlapMinutes(s1, s2);
      if (overlap < minOverlapMinutes) continue;

      const approxDist = calculateApproxDistanceMeters(s1, s2);
      const id = `BL_${s1.stationCode}_${s2.stationCode}`;

      baselines.push({
        id,
        fromStationId: s1.id,
        fromStationCode: s1.stationCode,
        toStationId: s2.id,
        toStationCode: s2.stationCode,
        overlapMinutes: overlap,
        approxDistanceM: approxDist,
        isIndependent: false,
        isProcessed: false,
      });
    }
  }

  return baselines;
}

/**
 * Disjoint Set Union (DSU) helper for Kruskal's algorithm
 */
class UnionFind {
  private parent = new Map<string, string>();

  constructor(elements: string[]) {
    elements.forEach((e) => this.parent.set(e, e));
  }

  find(i: string): string {
    const root = this.parent.get(i) || i;
    if (root === i) return i;
    const parent = this.find(root);
    this.parent.set(i, parent);
    return parent;
  }

  union(i: string, j: string): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent.set(rootI, rootJ);
      return true;
    }
    return false;
  }
}

/**
 * Selects an optimal set of independent baselines to form a connected geodetic mesh.
 * - Computes a Minimum Spanning Tree (MST) so all stations are connected without trivial loops.
 * - Adds redundant cross-baselines (up to maxToleratedCycles) to create closed loops for loop closure QA.
 */
export function selectIndependentBaselines(
  stations: StationSession[],
  candidates: CandidateBaseline[],
  redundantLoopFactor: number = 1.5 // 1.0 = pure tree, 1.5 = adds 50% more baselines to form loops
): CandidateBaseline[] {
  if (candidates.length === 0 || stations.length <= 1) return [];

  // Sort candidates by heuristic: prefer shorter distances and longer overlaps
  // Cost = Distance / (OverlapMinutes^0.5)
  const sorted = [...candidates].sort((a, b) => {
    const costA = a.approxDistanceM / Math.sqrt(Math.max(1, a.overlapMinutes));
    const costB = b.approxDistanceM / Math.sqrt(Math.max(1, b.overlapMinutes));
    return costA - costB;
  });

  const stationCodes = stations.map((s) => s.stationCode);
  const uf = new UnionFind(stationCodes);

  const selectedSet = new Set<string>();
  const treeBaselines: CandidateBaseline[] = [];
  const remainingBaselines: CandidateBaseline[] = [];

  // 1. Minimum Spanning Tree (guarantees connectivity of all stations)
  for (const b of sorted) {
    if (uf.union(b.fromStationCode, b.toStationCode)) {
      selectedSet.add(b.id);
      treeBaselines.push({ ...b, isIndependent: true });
    } else {
      remainingBaselines.push(b);
    }
  }

  // 2. Add extra baselines to form independent closed loops for verification
  const maxExtra = Math.round((stations.length - 1) * (redundantLoopFactor - 1.0));
  const extraBaselines: CandidateBaseline[] = [];

  for (let i = 0; i < Math.min(maxExtra, remainingBaselines.length); i++) {
    const b = remainingBaselines[i];
    selectedSet.add(b.id);
    extraBaselines.push({ ...b, isIndependent: true });
  }

  // Return all candidates with updated isIndependent flag
  return candidates.map((c) => ({
    ...c,
    isIndependent: selectedSet.has(c.id),
  }));
}

/**
 * High-Precision Benchmark Dataset: 4-Station GNSS Multi-Station Geodetic Network
 * Observed around Kasetsart University / Bangkhen Control Network (UTM Zone 47N).
 * Forms 2 independent closed triangle loops with RTSD Class 1 precision.
 */
export const SAMPLE_GNSS_MULTI_STATION_NETWORK: {
  stations: StationSession[];
  baselines: SolvedBaselineEdge[];
} = {
  stations: [
    {
      id: 'stn_cors_ku',
      stationCode: 'CORS_KU',
      fileName: 'CORS_KU.26o',
      fileSizeBytes: 450000,
      format: 'RINEX',
      startTimeUtc: new Date('2026-03-10T08:00:00Z'),
      endTimeUtc: new Date('2026-03-10T10:00:00Z'),
      durationMinutes: 120,
      intervalSec: 1,
      epochsCount: 7200,
      satellitesObserved: ['G01', 'G03', 'G06', 'C01', 'C03', 'E05'],
      constellations: ['GPS', 'BEIDOU', 'GLONASS', 'GALILEO'],
      approxCoordinates: {
        x: -1085123.456,
        y: 5937890.123,
        z: 1515678.901,
        latDeg: 13.8476,
        lonDeg: 100.5696,
        ellipHeightM: 25.40,
      },
      antenna: {
        model: 'TRM59800.00',
        measuredHeightM: 0.000,
        measurementMethod: 'vertical',
        trueVerticalHeightM: 0.000,
      },
      isFixedControl: true,
      knownControlCoord: {
        eastingM: 669988.900,
        northingM: 1531019.560,
        elevationM: 2.150,
        zone: 47,
      },
    },
    {
      id: 'stn_bm_north',
      stationCode: 'BM_NORTH',
      fileName: 'BM_NORTH.26o',
      fileSizeBytes: 320000,
      format: 'RINEX',
      startTimeUtc: new Date('2026-03-10T08:10:00Z'),
      endTimeUtc: new Date('2026-03-10T09:40:00Z'),
      durationMinutes: 90,
      intervalSec: 1,
      epochsCount: 5400,
      satellitesObserved: ['G01', 'G03', 'G06', 'C01', 'C03', 'E05'],
      constellations: ['GPS', 'BEIDOU', 'GLONASS'],
      approxCoordinates: {
        x: -1085020.100,
        y: 5938010.200,
        z: 1515820.300,
        latDeg: 13.8509,
        lonDeg: 100.5711,
        ellipHeightM: 26.15,
      },
      antenna: {
        model: 'EMLID_REACH_RS3',
        measuredHeightM: 1.8000,
        measurementMethod: 'vertical',
        trueVerticalHeightM: 1.8000,
      },
      isFixedControl: false,
    },
    {
      id: 'stn_bm_east',
      stationCode: 'BM_EAST',
      fileName: 'BM_EAST.26o',
      fileSizeBytes: 320000,
      format: 'RINEX',
      startTimeUtc: new Date('2026-03-10T08:15:00Z'),
      endTimeUtc: new Date('2026-03-10T09:45:00Z'),
      durationMinutes: 90,
      intervalSec: 1,
      epochsCount: 5400,
      satellitesObserved: ['G01', 'G03', 'G06', 'C01', 'C03', 'E05'],
      constellations: ['GPS', 'BEIDOU', 'GLONASS'],
      approxCoordinates: {
        x: -1084950.800,
        y: 5937920.400,
        z: 1515620.100,
        latDeg: 13.8470,
        lonDeg: 100.5736,
        ellipHeightM: 24.80,
      },
      antenna: {
        model: 'CHC_C220GR',
        measuredHeightM: 1.7500,
        measurementMethod: 'vertical',
        trueVerticalHeightM: 1.7500,
      },
      isFixedControl: false,
    },
    {
      id: 'stn_bm_south',
      stationCode: 'BM_SOUTH',
      fileName: 'BM_SOUTH.26o',
      fileSizeBytes: 320000,
      format: 'RINEX',
      startTimeUtc: new Date('2026-03-10T08:20:00Z'),
      endTimeUtc: new Date('2026-03-10T09:50:00Z'),
      durationMinutes: 90,
      intervalSec: 1,
      epochsCount: 5400,
      satellitesObserved: ['G01', 'G03', 'G06', 'C01', 'C03', 'E05'],
      constellations: ['GPS', 'BEIDOU', 'GLONASS'],
      approxCoordinates: {
        x: -1085200.300,
        y: 5937750.100,
        z: 1515450.800,
        latDeg: 13.8440,
        lonDeg: 100.5704,
        ellipHeightM: 23.95,
      },
      antenna: {
        model: 'GENERIC_GEODETIC',
        measuredHeightM: 1.8200,
        measurementMethod: 'vertical',
        trueVerticalHeightM: 1.8200,
      },
      isFixedControl: false,
    },
  ],
  baselines: [
    {
      id: 'BL_CORS_KU_BM_NORTH',
      fromStation: 'CORS_KU',
      toStation: 'BM_NORTH',
      dE: 161.350,
      dN: 360.560,
      dU: 0.750,
      distance2D: 394.992,
      distance3D: 394.993,
      status: 'FIXED',
      ratioTest: 6.8,
    },
    {
      id: 'BL_BM_NORTH_BM_EAST',
      fromStation: 'BM_NORTH',
      toStation: 'BM_EAST',
      dE: 270.550,
      dN: -429.720,
      dU: -1.350,
      distance2D: 507.828,
      distance3D: 507.830,
      status: 'FIXED',
      ratioTest: 5.9,
    },
    {
      id: 'BL_BM_EAST_CORS_KU',
      fromStation: 'BM_EAST',
      toStation: 'CORS_KU',
      dE: -431.902, // Closed loop: 161.350 + 270.550 - 431.902 = -0.002m (-2mm misclosure)
      dN: 69.161,   // Closed loop: 360.560 - 429.720 + 69.161 = 0.001m (1mm misclosure)
      dU: 0.601,    // Closed loop: 0.750 - 1.350 + 0.601 = 0.001m (1mm misclosure)
      distance2D: 437.404,
      distance3D: 437.404,
      status: 'FIXED',
      ratioTest: 7.2,
    },
    {
      id: 'BL_BM_EAST_BM_SOUTH',
      fromStation: 'BM_EAST',
      toStation: 'BM_SOUTH',
      dE: -340.650,
      dN: -330.100,
      dU: -0.850,
      distance2D: 474.341,
      distance3D: 474.342,
      status: 'FIXED',
      ratioTest: 5.4,
    },
    {
      id: 'BL_BM_SOUTH_CORS_KU',
      fromStation: 'BM_SOUTH',
      toStation: 'CORS_KU',
      dE: -91.248,  // Closed loop: -431.902 - 340.650 + ...
      dN: 399.259,
      dU: 1.451,
      distance2D: 409.544,
      distance3D: 409.547,
      status: 'FIXED',
      ratioTest: 6.1,
    },
  ],
};
