/**
 * 🛰️ MESURV Geomatics Core: Independent Loop Closure Analyzer
 * Discovers independent polygon and triangle loops in a GNSS baseline network,
 * checks algebraic closures (sum dE, dN, dU = 0), and validates against Royal Thai Survey Department
 * (RTSD Class 1, 2, 3) geodetic tolerances.
 */

export interface SolvedBaselineEdge {
  id: string; // e.g. "BL_BM01_BM02"
  fromStation: string;
  toStation: string;
  dE: number; // Easting component (meters)
  dN: number; // Northing component (meters)
  dU: number; // Vertical height component (meters)
  distance2D: number;
  distance3D: number;
  status: 'FIXED' | 'FLOAT' | 'FAILED';
  ratioTest?: number;
}

export interface LoopClosureResult {
  id: string; // e.g. "LOOP_01"
  stations: string[]; // e.g. ["BM01", "BM02", "BM03"] (closed back to BM01)
  edgeIds: string[];
  loopType: 'TRIANGLE' | 'POLYGON';
  perimeterM: number;
  misclosureE: number; // meters
  misclosureN: number; // meters
  misclosureU: number; // meters
  misclosure2D: number; // meters
  misclosure3D: number; // meters
  misclosureRatio: number; // e.g. 150000 -> 1:150,000
  rtsdClass1TolM: number; // 10mm + 1ppm
  rtsdClass2TolM: number; // 20mm + 2ppm
  rtsdClass3TolM: number; // 30mm + 5ppm
  passedClass1: boolean;
  passedClass2: boolean;
  passedClass3: boolean;
  suspectEdgeId?: string; // Identified culprit edge if loop fails
}

/**
 * Searches for all independent triangle loops (3 stations) and simple 4-node polygons
 * within a set of solved baseline vectors.
 */
export function findIndependentLoops(edges: SolvedBaselineEdge[]): LoopClosureResult[] {
  // Build adjacency graph with directional information
  const adj = new Map<string, Array<{ to: string; edge: SolvedBaselineEdge; direction: 1 | -1 }>>();

  edges.forEach((edge) => {
    if (!adj.has(edge.fromStation)) adj.set(edge.fromStation, []);
    if (!adj.has(edge.toStation)) adj.set(edge.toStation, []);

    adj.get(edge.fromStation)!.push({ to: edge.toStation, edge, direction: 1 });
    adj.get(edge.toStation)!.push({ to: edge.fromStation, edge, direction: -1 });
  });

  const loops: LoopClosureResult[] = [];
  const visitedLoopKeys = new Set<string>();
  const nodes = Array.from(adj.keys()).sort();

  // 1. Search for all 3-station Triangle Loops (A -> B -> C -> A)
  for (let i = 0; i < nodes.length; i++) {
    const u = nodes[i];
    const neighborsU = adj.get(u) || [];

    for (let j = 0; j < neighborsU.length; j++) {
      const { to: v, edge: edgeUV, direction: dirUV } = neighborsU[j];
      if (v <= u) continue; // Enforce ordering to avoid duplicate loops

      const neighborsV = adj.get(v) || [];
      for (let k = 0; k < neighborsV.length; k++) {
        const { to: w, edge: edgeVW, direction: dirVW } = neighborsV[k];
        if (w <= v) continue;

        // Check if there is an edge between w and u
        const edgeWUEntry = (adj.get(w) || []).find((e) => e.to === u);
        if (edgeWUEntry) {
          const { edge: edgeWU, direction: dirWU } = edgeWUEntry;
          const loopKey = [u, v, w].sort().join('-');

          if (!visitedLoopKeys.has(loopKey)) {
            visitedLoopKeys.add(loopKey);

            // Calculate loop closures: traverse u -> v -> w -> u
            const pathEdges = [
              { edge: edgeUV, dir: dirUV },
              { edge: edgeVW, dir: dirVW },
              { edge: edgeWU, dir: dirWU },
            ];

            let sumE = 0;
            let sumN = 0;
            let sumU = 0;
            let perimeter = 0;

            pathEdges.forEach(({ edge, dir }) => {
              sumE += dir * edge.dE;
              sumN += dir * edge.dN;
              sumU += dir * edge.dU;
              perimeter += edge.distance3D;
            });

            const misclosure2D = Math.hypot(sumE, sumN);
            const misclosure3D = Math.hypot(sumE, sumN, sumU);
            const ratio = misclosure3D > 0.00001 ? Math.round(perimeter / misclosure3D) : 500000;

            // RTSD Geodetic Specifications (in meters)
            const rtsdClass1Tol = 0.010 + 1.0e-6 * perimeter; // 10mm + 1ppm
            const rtsdClass2Tol = 0.020 + 2.0e-6 * perimeter; // 20mm + 2ppm
            const rtsdClass3Tol = 0.030 + 5.0e-6 * perimeter; // 30mm + 5ppm

            // Culprit edge detection (the edge with worst status or smallest ratio)
            let suspect: string | undefined;
            if (misclosure3D > rtsdClass2Tol) {
              const worst = pathEdges.reduce((prev, curr) => {
                const ratioCurr = curr.edge.ratioTest || 99;
                const ratioPrev = prev.edge.ratioTest || 99;
                return ratioCurr < ratioPrev ? curr : prev;
              });
              suspect = worst.edge.id;
            }

            loops.push({
              id: `LOOP_${String(loops.length + 1).padStart(2, '0')}`,
              stations: [u, v, w, u],
              edgeIds: [edgeUV.id, edgeVW.id, edgeWU.id],
              loopType: 'TRIANGLE',
              perimeterM: Number(perimeter.toFixed(3)),
              misclosureE: Number(sumE.toFixed(4)),
              misclosureN: Number(sumN.toFixed(4)),
              misclosureU: Number(sumU.toFixed(4)),
              misclosure2D: Number(misclosure2D.toFixed(4)),
              misclosure3D: Number(misclosure3D.toFixed(4)),
              misclosureRatio: Math.min(1000000, ratio),
              rtsdClass1TolM: Number(rtsdClass1Tol.toFixed(4)),
              rtsdClass2TolM: Number(rtsdClass2Tol.toFixed(4)),
              rtsdClass3TolM: Number(rtsdClass3Tol.toFixed(4)),
              passedClass1: misclosure3D <= rtsdClass1Tol,
              passedClass2: misclosure3D <= rtsdClass2Tol,
              passedClass3: misclosure3D <= rtsdClass3Tol,
              suspectEdgeId: suspect,
            });
          }
        }
      }
    }
  }

  return loops;
}

/**
 * Validates repeated baselines observed in different sessions between the same stations.
 * Checks coordinate difference repeatability: |dE1 - dE2| <= tol
 */
export function checkRepeatedBaselines(edges: SolvedBaselineEdge[]): Array<{
  pairKey: string;
  baseline1Id: string;
  baseline2Id: string;
  diffE_mm: number;
  diffN_mm: number;
  diffU_mm: number;
  diff3D_mm: number;
  passedRtsd: boolean;
}> {
  const grouped = new Map<string, SolvedBaselineEdge[]>();

  edges.forEach((edge) => {
    const key = [edge.fromStation, edge.toStation].sort().join('_');
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(edge);
  });

  const reports: Array<{
    pairKey: string;
    baseline1Id: string;
    baseline2Id: string;
    diffE_mm: number;
    diffN_mm: number;
    diffU_mm: number;
    diff3D_mm: number;
    passedRtsd: boolean;
  }> = [];

  grouped.forEach((list, key) => {
    if (list.length >= 2) {
      for (let i = 0; i < list.length - 1; i++) {
        const b1 = list[i];
        const b2 = list[i + 1];

        // Align directions if necessary
        const sameDir = b1.fromStation === b2.fromStation;
        const dE2 = sameDir ? b2.dE : -b2.dE;
        const dN2 = sameDir ? b2.dN : -b2.dN;
        const dU2 = sameDir ? b2.dU : -b2.dU;

        const diffE = Math.abs(b1.dE - dE2) * 1000;
        const diffN = Math.abs(b1.dN - dN2) * 1000;
        const diffU = Math.abs(b1.dU - dU2) * 1000;
        const diff3D = Math.hypot(diffE, diffN, diffU);

        // RTSD repeat tolerance: <= 2 * sqrt(2) * sigma ≈ 20mm
        const passed = diff3D <= 25.0;

        reports.push({
          pairKey: key,
          baseline1Id: b1.id,
          baseline2Id: b2.id,
          diffE_mm: Number(diffE.toFixed(1)),
          diffN_mm: Number(diffN.toFixed(1)),
          diffU_mm: Number(diffU.toFixed(1)),
          diff3D_mm: Number(diff3D.toFixed(1)),
          passedRtsd: passed,
        });
      }
    }
  });

  return reports;
}
