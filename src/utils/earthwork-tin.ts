/**
 * MESURV Earthwork & TIN Engine (earthwork-tin.ts)
 * 
 * Production-ready 2.5D Delaunay Triangulated Irregular Network (TIN) & 
 * Exact Prismoidal Cut/Fill Volume Integration Engine.
 * 
 * Replaces proprietary survey office dongles (Civil 3D, Carlson Survey, 12d Model).
 * Algorithms:
 * 1. 2D Bowyer-Watson Delaunay Triangulation with robust geometric predicates & deduplication.
 * 2. Exact Prismoidal Truncated Triangular Prism Volume Integration with zero-crossing edge splitting.
 * 3. Surface-to-Datum, Surface-to-Sloped-Plane, and Surface-to-Surface (OGL vs FGL) volume calculations.
 */

export interface TinPoint {
  id?: string;
  name?: string;
  x: number; // Easting / X in meters
  y: number; // Northing / Y in meters
  z: number; // Elevation in meters
}

export interface TinEdge {
  p1: TinPoint;
  p2: TinPoint;
}

export interface TinTriangle {
  id: string;
  p1: TinPoint;
  p2: TinPoint;
  p3: TinPoint;
  area2D: number;
}

export type CutFillClassification = 'cut' | 'fill' | 'balanced';

export interface PrismoidTriangleResult {
  triangleId: string;
  p1: TinPoint;
  p2: TinPoint;
  p3: TinPoint;
  area2D: number; // m²
  classification: CutFillClassification;
  cutVolumeM3: number;
  fillVolumeM3: number;
  netVolumeM3: number; // Cut - Fill
  cutAreaM2: number;
  fillAreaM2: number;
  avgDepthM: number;
  minElevationDiffM: number;
  maxElevationDiffM: number;
}

export interface EarthworkVolumeResult {
  mode: 'datum' | 'surface-to-surface' | 'sloped-plane';
  datumElevation?: number;
  totalTriangles: number;
  totalArea2D: number; // m²
  cutArea2D: number; // m²
  fillArea2D: number; // m²
  totalCutVolumeM3: number; // m³
  totalFillVolumeM3: number; // m³
  netVolumeM3: number; // m³ (positive = net cut, negative = net fill)
  maxCutDepthM: number;
  maxFillHeightM: number;
  avgCutDepthM: number;
  avgFillHeightM: number;
  triangles: PrismoidTriangleResult[];
  tinPoints: TinPoint[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. 2D Delaunay Triangulation (Bowyer-Watson Algorithm)
// ─────────────────────────────────────────────────────────────────────────────

interface InternalTriangle {
  a: TinPoint;
  b: TinPoint;
  c: TinPoint;
  circle: {
    x: number;
    y: number;
    rSq: number;
  };
}

function computeCircumcircle(a: TinPoint, b: TinPoint, c: TinPoint): { x: number; y: number; rSq: number } | null {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-12) return null; // Collinear

  const aSq = a.x * a.x + a.y * a.y;
  const bSq = b.x * b.x + b.y * b.y;
  const cSq = c.x * c.x + c.y * c.y;

  const x = (aSq * (b.y - c.y) + bSq * (c.y - a.y) + cSq * (a.y - b.y)) / d;
  const y = (aSq * (c.x - b.x) + bSq * (a.x - c.x) + cSq * (b.x - a.x)) / d;

  const dx = a.x - x;
  const dy = a.y - y;
  const rSq = dx * dx + dy * dy;

  return { x, y, rSq };
}

export function calculateTriangle2DArea(a: TinPoint, b: TinPoint, c: TinPoint): number {
  return 0.5 * Math.abs(a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
}

/**
 * Deduplicate points within a given tolerance (default 1mm)
 */
export function deduplicatePoints(points: TinPoint[], tolerance = 0.001): TinPoint[] {
  const result: TinPoint[] = [];
  const tolSq = tolerance * tolerance;

  for (const pt of points) {
    if (isNaN(pt.x) || isNaN(pt.y) || isNaN(pt.z)) continue;
    const exists = result.some(p => {
      const dx = p.x - pt.x;
      const dy = p.y - pt.y;
      return (dx * dx + dy * dy) < tolSq;
    });
    if (!exists) {
      result.push({
        ...pt,
        id: pt.id || `pt-${result.length + 1}`
      });
    }
  }
  return result;
}

/**
 * Bowyer-Watson 2D Delaunay Triangulation
 */
export function delaunayTriangulate2D(rawPoints: TinPoint[], maxEdgeLength?: number): TinTriangle[] {
  const points = deduplicatePoints(rawPoints);
  if (points.length < 3) return [];

  // 1. Calculate Bounding Box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const dx = maxX - minX;
  const dy = maxY - minY;
  const deltaMax = Math.max(dx, dy, 1.0);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  // 2. Form Super-Triangle that encloses all points
  const superA: TinPoint = { id: '__super_a', x: midX - 20 * deltaMax, y: midY - deltaMax, z: 0 };
  const superB: TinPoint = { id: '__super_b', x: midX, y: midY + 20 * deltaMax, z: 0 };
  const superC: TinPoint = { id: '__super_c', x: midX + 20 * deltaMax, y: midY - deltaMax, z: 0 };

  const superCirc = computeCircumcircle(superA, superB, superC);
  if (!superCirc) return [];

  let triangles: InternalTriangle[] = [
    { a: superA, b: superB, c: superC, circle: superCirc }
  ];

  // 3. Incrementally insert each point
  for (const point of points) {
    const polygonEdges: { p1: TinPoint; p2: TinPoint }[] = [];
    const badTriangles: InternalTriangle[] = [];

    // Find all triangles whose circumcircle contains the point
    for (const tri of triangles) {
      const distSq = (point.x - tri.circle.x) ** 2 + (point.y - tri.circle.y) ** 2;
      if (distSq <= tri.circle.rSq + 1e-9) {
        badTriangles.push(tri);
      }
    }

    // Find boundary of the star-shaped hole
    for (const tri of badTriangles) {
      const edges = [
        { p1: tri.a, p2: tri.b },
        { p1: tri.b, p2: tri.c },
        { p1: tri.c, p2: tri.a },
      ];

      for (const edge of edges) {
        // Edge is shared if it appears in another bad triangle
        let isShared = false;
        for (const other of badTriangles) {
          if (other === tri) continue;
          const otherEdges = [
            { p1: other.a, p2: other.b },
            { p1: other.b, p2: other.c },
            { p1: other.c, p2: other.a },
          ];
          for (const oe of otherEdges) {
            if (
              (oe.p1 === edge.p1 && oe.p2 === edge.p2) ||
              (oe.p1 === edge.p2 && oe.p2 === edge.p1)
            ) {
              isShared = true;
              break;
            }
          }
          if (isShared) break;
        }

        if (!isShared) {
          polygonEdges.push(edge);
        }
      }
    }

    // Remove bad triangles from triangulation
    triangles = triangles.filter(t => !badTriangles.includes(t));

    // Re-triangulate the hole with the new point
    for (const edge of polygonEdges) {
      const circ = computeCircumcircle(edge.p1, edge.p2, point);
      if (circ) {
        triangles.push({
          a: edge.p1,
          b: edge.p2,
          c: point,
          circle: circ
        });
      }
    }
  }

  // 4. Filter out any triangle that contains vertices of the super-triangle
  const finalTriangles: TinTriangle[] = [];
  let triIdCounter = 1;

  for (const tri of triangles) {
    const sharesSuper =
      tri.a === superA || tri.a === superB || tri.a === superC ||
      tri.b === superA || tri.b === superB || tri.b === superC ||
      tri.c === superA || tri.c === superB || tri.c === superC;

    if (!sharesSuper) {
      const area = calculateTriangle2DArea(tri.a, tri.b, tri.c);
      if (area > 1e-6) {
        if (maxEdgeLength !== undefined && maxEdgeLength > 0) {
          const e1 = Math.hypot(tri.a.x - tri.b.x, tri.a.y - tri.b.y);
          const e2 = Math.hypot(tri.b.x - tri.c.x, tri.b.y - tri.c.y);
          const e3 = Math.hypot(tri.c.x - tri.a.x, tri.c.y - tri.a.y);
          if (e1 > maxEdgeLength || e2 > maxEdgeLength || e3 > maxEdgeLength) {
            continue;
          }
        }
        finalTriangles.push({
          id: `T-${triIdCounter++}`,
          p1: tri.a,
          p2: tri.b,
          p3: tri.c,
          area2D: area
        });
      }
    }
  }

  return finalTriangles;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Exact Prismoidal Cut/Fill Volume Integration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes exact prismoidal volume for a single triangle given elevation differences:
 * h1 = z1 - z_design, h2 = z2 - z_design, h3 = z3 - z_design
 * Positive h => CUT (existing ground is higher than design)
 * Negative h => FILL (existing ground is lower than design)
 */
export function computePrismoidTriangle(
  triangle: TinTriangle,
  h1: number,
  h2: number,
  h3: number
): PrismoidTriangleResult {
  const S = triangle.area2D;
  const p1 = triangle.p1;
  const p2 = triangle.p2;
  const p3 = triangle.p3;

  const minDiff = Math.min(h1, h2, h3);
  const maxDiff = Math.max(h1, h2, h3);
  const avgDiff = (h1 + h2 + h3) / 3;

  // Case 1: Pure Cut (all h >= 0)
  if (h1 >= 0 && h2 >= 0 && h3 >= 0) {
    const cutVol = S * (h1 + h2 + h3) / 3;
    return {
      triangleId: triangle.id,
      p1, p2, p3,
      area2D: S,
      classification: cutVol > 1e-4 ? 'cut' : 'balanced',
      cutVolumeM3: cutVol,
      fillVolumeM3: 0,
      netVolumeM3: cutVol,
      cutAreaM2: S,
      fillAreaM2: 0,
      avgDepthM: avgDiff,
      minElevationDiffM: minDiff,
      maxElevationDiffM: maxDiff
    };
  }

  // Case 2: Pure Fill (all h <= 0)
  if (h1 <= 0 && h2 <= 0 && h3 <= 0) {
    const fillVol = S * (Math.abs(h1) + Math.abs(h2) + Math.abs(h3)) / 3;
    return {
      triangleId: triangle.id,
      p1, p2, p3,
      area2D: S,
      classification: fillVol > 1e-4 ? 'fill' : 'balanced',
      cutVolumeM3: 0,
      fillVolumeM3: fillVol,
      netVolumeM3: -fillVol,
      cutAreaM2: 0,
      fillAreaM2: S,
      avgDepthM: Math.abs(avgDiff),
      minElevationDiffM: minDiff,
      maxElevationDiffM: maxDiff
    };
  }

  // Case 3: Mixed Cut and Fill (Zero-crossing transition triangle)
  // Re-order vertices so that pA has the solitary sign and pB, pC have the opposite sign
  let pa = p1; let pb = p2; let pc = p3;
  let ha = h1; let hb = h2; let hc = h3;

  const positiveCount = (h1 > 0 ? 1 : 0) + (h2 > 0 ? 1 : 0) + (h3 > 0 ? 1 : 0);

  if (positiveCount === 1) {
    // 1 vertex positive (Cut), 2 vertices negative (Fill)
    if (h2 > 0) {
      pa = p2; pb = p1; pc = p3;
      ha = h2; hb = h1; hc = h3;
    } else if (h3 > 0) {
      pa = p3; pb = p1; pc = p2;
      ha = h3; hb = h1; hc = h2;
    }

    // Edge crossing parameters: t in (0, 1)
    const tAB = ha / (ha - hb);
    const tAC = ha / (ha - hc);

    // Sub-triangle at pa is pure Cut
    const cutArea = S * tAB * tAC;
    const cutVol = (1 / 3) * cutArea * ha;

    // Remaining quadrilateral is pure Fill
    const fillArea = Math.max(0, S - cutArea);
    // Exact volume of truncated prismoidal quadrilateral
    // V_total_net = (S / 3) * (ha + hb + hc) => V_net = V_cut - V_fill
    // Therefore V_fill = V_cut - (S / 3) * (ha + hb + hc)
    const netLinear = (S / 3) * (ha + hb + hc);
    const fillVol = Math.max(0, cutVol - netLinear);

    return {
      triangleId: triangle.id,
      p1, p2, p3,
      area2D: S,
      classification: cutVol >= fillVol ? 'cut' : 'fill',
      cutVolumeM3: cutVol,
      fillVolumeM3: fillVol,
      netVolumeM3: cutVol - fillVol,
      cutAreaM2: cutArea,
      fillAreaM2: fillArea,
      avgDepthM: Math.abs(avgDiff),
      minElevationDiffM: minDiff,
      maxElevationDiffM: maxDiff
    };
  } else {
    // 2 vertices positive (Cut), 1 vertex negative (Fill)
    if (h1 < 0) {
      pa = p1; pb = p2; pc = p3;
      ha = h1; hb = h2; hc = h3;
    } else if (h2 < 0) {
      pa = p2; pb = p1; pc = p3;
      ha = h2; hb = h1; hc = h3;
    } else {
      pa = p3; pb = p1; pc = p2;
      ha = h3; hb = h1; hc = h2;
    }

    // Sub-triangle at pa is pure Fill
    const tAB = Math.abs(ha) / (Math.abs(ha) + hb);
    const tAC = Math.abs(ha) / (Math.abs(ha) + hc);

    const fillArea = S * tAB * tAC;
    const fillVol = (1 / 3) * fillArea * Math.abs(ha);

    // Remaining quadrilateral is pure Cut
    const cutArea = Math.max(0, S - fillArea);
    const netLinear = (S / 3) * (ha + hb + hc);
    const cutVol = Math.max(0, fillVol + netLinear);

    return {
      triangleId: triangle.id,
      p1, p2, p3,
      area2D: S,
      classification: cutVol >= fillVol ? 'cut' : 'fill',
      cutVolumeM3: cutVol,
      fillVolumeM3: fillVol,
      netVolumeM3: cutVol - fillVol,
      cutAreaM2: cutArea,
      fillAreaM2: fillArea,
      avgDepthM: Math.abs(avgDiff),
      minElevationDiffM: minDiff,
      maxElevationDiffM: maxDiff
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. High-Level Earthwork Volume Solvers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Surface-to-Datum: Grade existing terrain to a flat target elevation Z_datum
 */
export function calculateSurfaceToDatumVolume(
  points: TinPoint[],
  datumElevation: number,
  maxEdgeLength?: number
): EarthworkVolumeResult {
  const cleanPoints = deduplicatePoints(points);
  const triangles = delaunayTriangulate2D(cleanPoints, maxEdgeLength);

  let totalArea = 0;
  let totalCutVol = 0;
  let totalFillVol = 0;
  let cutArea = 0;
  let fillArea = 0;

  let maxCut = 0;
  let maxFill = 0;
  let minX = Infinity; let maxX = -Infinity;
  let minY = Infinity; let maxY = -Infinity;
  let minZ = Infinity; let maxZ = -Infinity;

  for (const p of cleanPoints) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;

    const diff = p.z - datumElevation;
    if (diff > maxCut) maxCut = diff;
    if (-diff > maxFill) maxFill = -diff;
  }

  const triangleResults: PrismoidTriangleResult[] = [];

  for (const tri of triangles) {
    const h1 = tri.p1.z - datumElevation;
    const h2 = tri.p2.z - datumElevation;
    const h3 = tri.p3.z - datumElevation;

    const res = computePrismoidTriangle(tri, h1, h2, h3);
    triangleResults.push(res);

    totalArea += res.area2D;
    totalCutVol += res.cutVolumeM3;
    totalFillVol += res.fillVolumeM3;
    cutArea += res.cutAreaM2;
    fillArea += res.fillAreaM2;
  }

  return {
    mode: 'datum',
    datumElevation,
    totalTriangles: triangles.length,
    totalArea2D: totalArea,
    cutArea2D: cutArea,
    fillArea2D: fillArea,
    totalCutVolumeM3: totalCutVol,
    totalFillVolumeM3: totalFillVol,
    netVolumeM3: totalCutVol - totalFillVol,
    maxCutDepthM: maxCut,
    maxFillHeightM: maxFill,
    avgCutDepthM: cutArea > 0 ? totalCutVol / cutArea : 0,
    avgFillHeightM: fillArea > 0 ? totalFillVol / fillArea : 0,
    triangles: triangleResults,
    tinPoints: cleanPoints,
    bounds: {
      minX: isFinite(minX) ? minX : 0,
      maxX: isFinite(maxX) ? maxX : 0,
      minY: isFinite(minY) ? minY : 0,
      maxY: isFinite(maxY) ? maxY : 0,
      minZ: isFinite(minZ) ? minZ : 0,
      maxZ: isFinite(maxZ) ? maxZ : 0
    }
  };
}

/**
 * 2. Surface-to-Sloped-Plane: Grade existing terrain to a design plane with longitudinal & cross slopes
 */
export function calculateSurfaceToSlopedPlaneVolume(
  points: TinPoint[],
  baseElevation: number,
  basePoint: { x: number; y: number },
  slopeXPercent: number, // slope along Easting (+% means rising to East)
  slopeYPercent: number, // slope along Northing (+% means rising to North)
  maxEdgeLength?: number
): EarthworkVolumeResult {
  const cleanPoints = deduplicatePoints(points);
  const triangles = delaunayTriangulate2D(cleanPoints, maxEdgeLength);

  const getDesignZ = (x: number, y: number) => {
    const dx = x - basePoint.x;
    const dy = y - basePoint.y;
    return baseElevation + (dx * (slopeXPercent / 100)) + (dy * (slopeYPercent / 100));
  };

  let totalArea = 0;
  let totalCutVol = 0;
  let totalFillVol = 0;
  let cutArea = 0;
  let fillArea = 0;

  let maxCut = 0;
  let maxFill = 0;
  let minX = Infinity; let maxX = -Infinity;
  let minY = Infinity; let maxY = -Infinity;
  let minZ = Infinity; let maxZ = -Infinity;

  for (const p of cleanPoints) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;

    const zDes = getDesignZ(p.x, p.y);
    const diff = p.z - zDes;
    if (diff > maxCut) maxCut = diff;
    if (-diff > maxFill) maxFill = -diff;
  }

  const triangleResults: PrismoidTriangleResult[] = [];

  for (const tri of triangles) {
    const h1 = tri.p1.z - getDesignZ(tri.p1.x, tri.p1.y);
    const h2 = tri.p2.z - getDesignZ(tri.p2.x, tri.p2.y);
    const h3 = tri.p3.z - getDesignZ(tri.p3.x, tri.p3.y);

    const res = computePrismoidTriangle(tri, h1, h2, h3);
    triangleResults.push(res);

    totalArea += res.area2D;
    totalCutVol += res.cutVolumeM3;
    totalFillVol += res.fillVolumeM3;
    cutArea += res.cutAreaM2;
    fillArea += res.fillAreaM2;
  }

  return {
    mode: 'sloped-plane',
    datumElevation: baseElevation,
    totalTriangles: triangles.length,
    totalArea2D: totalArea,
    cutArea2D: cutArea,
    fillArea2D: fillArea,
    totalCutVolumeM3: totalCutVol,
    totalFillVolumeM3: totalFillVol,
    netVolumeM3: totalCutVol - totalFillVol,
    maxCutDepthM: maxCut,
    maxFillHeightM: maxFill,
    avgCutDepthM: cutArea > 0 ? totalCutVol / cutArea : 0,
    avgFillHeightM: fillArea > 0 ? totalFillVol / fillArea : 0,
    triangles: triangleResults,
    tinPoints: cleanPoints,
    bounds: {
      minX: isFinite(minX) ? minX : 0,
      maxX: isFinite(maxX) ? maxX : 0,
      minY: isFinite(minY) ? minY : 0,
      maxY: isFinite(maxY) ? maxY : 0,
      minZ: isFinite(minZ) ? minZ : 0,
      maxZ: isFinite(maxZ) ? maxZ : 0
    }
  };
}

/**
 * Interpolate Z elevation at (x, y) on a TIN using Barycentric coordinates
 */
export function interpolateElevationOnTin(
  x: number,
  y: number,
  triangles: TinTriangle[]
): number | null {
  for (const tri of triangles) {
    const a = tri.p1;
    const b = tri.p2;
    const c = tri.p3;

    const denom = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (Math.abs(denom) < 1e-12) continue;

    const wA = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / denom;
    const wB = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / denom;
    const wC = 1 - wA - wB;

    const eps = -1e-5;
    if (wA >= eps && wB >= eps && wC >= eps) {
      return wA * a.z + wB * b.z + wC * c.z;
    }
  }
  return null;
}

/**
 * 3. Surface-to-Surface: Compare Original Ground Level (OGL) vs Final Design Surface (FGL)
 */
export function calculateSurfaceToSurfaceVolume(
  existingPoints: TinPoint[],
  designPoints: TinPoint[],
  maxEdgeLength?: number
): EarthworkVolumeResult {
  const cleanEx = deduplicatePoints(existingPoints);
  const cleanDes = deduplicatePoints(designPoints);

  const exTIN = delaunayTriangulate2D(cleanEx, maxEdgeLength);
  const desTIN = delaunayTriangulate2D(cleanDes, maxEdgeLength);

  // Combine point sets to create composite evaluation vertices
  const compositePoints: { x: number; y: number; zEx: number; zDes: number }[] = [];

  // Evaluate existing points against design TIN
  for (const p of cleanEx) {
    const zDes = interpolateElevationOnTin(p.x, p.y, desTIN);
    if (zDes !== null) {
      compositePoints.push({ x: p.x, y: p.y, zEx: p.z, zDes });
    }
  }

  // Evaluate design points against existing TIN
  for (const p of cleanDes) {
    // Avoid re-adding if already added
    const already = compositePoints.some(cp => Math.hypot(cp.x - p.x, cp.y - p.y) < 0.001);
    if (!already) {
      const zEx = interpolateElevationOnTin(p.x, p.y, exTIN);
      if (zEx !== null) {
        compositePoints.push({ x: p.x, y: p.y, zEx, zDes: p.z });
      }
    }
  }

  // Triangulate composite intersection mesh
  const tinPts: TinPoint[] = compositePoints.map((cp, idx) => ({
    id: `comp-${idx + 1}`,
    x: cp.x,
    y: cp.y,
    z: cp.zEx // store existing Z for geometry
  }));

  const compositeTIN = delaunayTriangulate2D(tinPts);

  let totalArea = 0;
  let totalCutVol = 0;
  let totalFillVol = 0;
  let cutArea = 0;
  let fillArea = 0;

  let maxCut = 0;
  let maxFill = 0;
  let minX = Infinity; let maxX = -Infinity;
  let minY = Infinity; let maxY = -Infinity;
  let minZ = Infinity; let maxZ = -Infinity;

  const triangleResults: PrismoidTriangleResult[] = [];

  for (const tri of compositeTIN) {
    const cp1 = compositePoints.find(cp => Math.hypot(cp.x - tri.p1.x, cp.y - tri.p1.y) < 0.001);
    const cp2 = compositePoints.find(cp => Math.hypot(cp.x - tri.p2.x, cp.y - tri.p2.y) < 0.001);
    const cp3 = compositePoints.find(cp => Math.hypot(cp.x - tri.p3.x, cp.y - tri.p3.y) < 0.001);

    if (!cp1 || !cp2 || !cp3) continue;

    const h1 = cp1.zEx - cp1.zDes;
    const h2 = cp2.zEx - cp2.zDes;
    const h3 = cp3.zEx - cp3.zDes;

    const res = computePrismoidTriangle(tri, h1, h2, h3);
    triangleResults.push(res);

    totalArea += res.area2D;
    totalCutVol += res.cutVolumeM3;
    totalFillVol += res.fillVolumeM3;
    cutArea += res.cutAreaM2;
    fillArea += res.fillAreaM2;

    for (const h of [h1, h2, h3]) {
      if (h > maxCut) maxCut = h;
      if (-h > maxFill) maxFill = -h;
    }
  }

  for (const p of tinPts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }

  return {
    mode: 'surface-to-surface',
    totalTriangles: compositeTIN.length,
    totalArea2D: totalArea,
    cutArea2D: cutArea,
    fillArea2D: fillArea,
    totalCutVolumeM3: totalCutVol,
    totalFillVolumeM3: totalFillVol,
    netVolumeM3: totalCutVol - totalFillVol,
    maxCutDepthM: maxCut,
    maxFillHeightM: maxFill,
    avgCutDepthM: cutArea > 0 ? totalCutVol / cutArea : 0,
    avgFillHeightM: fillArea > 0 ? totalFillVol / fillArea : 0,
    triangles: triangleResults,
    tinPoints: tinPts,
    bounds: {
      minX: isFinite(minX) ? minX : 0,
      maxX: isFinite(maxX) ? maxX : 0,
      minY: isFinite(minY) ? minY : 0,
      maxY: isFinite(maxY) ? maxY : 0,
      minZ: isFinite(minZ) ? minZ : 0,
      maxZ: isFinite(maxZ) ? maxZ : 0
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Sample Datasets for Field Demonstrations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ground-truth terrain sample for a 50m x 50m building excavation & retention basin
 */
export const SAMPLE_EXISTING_SURFACE_POINTS: TinPoint[] = [
  { id: 'OGL-1', name: 'SW-Corner', x: 1000.00, y: 2000.00, z: 12.85 },
  { id: 'OGL-2', name: 'S-Mid1',     x: 1025.00, y: 2000.00, z: 13.10 },
  { id: 'OGL-3', name: 'SE-Corner', x: 1050.00, y: 2000.00, z: 13.45 },
  { id: 'OGL-4', name: 'W-Mid1',     x: 1000.00, y: 2025.00, z: 12.40 },
  { id: 'OGL-5', name: 'Center',     x: 1025.00, y: 2025.00, z: 11.20 },
  { id: 'OGL-6', name: 'E-Mid1',     x: 1050.00, y: 2025.00, z: 13.80 },
  { id: 'OGL-7', name: 'NW-Corner', x: 1000.00, y: 2050.00, z: 11.90 },
  { id: 'OGL-8', name: 'N-Mid1',     x: 1025.00, y: 2050.00, z: 11.50 },
  { id: 'OGL-9', name: 'NE-Corner', x: 1050.00, y: 2050.00, z: 14.20 },
  { id: 'OGL-10', name: 'Hilltop',  x: 1015.00, y: 2012.00, z: 13.90 },
  { id: 'OGL-11', name: 'Gully',    x: 1038.00, y: 2038.00, z: 10.80 },
  { id: 'OGL-12', name: 'Toe',      x: 1045.00, y: 2015.00, z: 12.95 },
];

export const SAMPLE_DESIGN_SURFACE_POINTS: TinPoint[] = [
  { id: 'FGL-1', name: 'Pad-SW', x: 1000.00, y: 2000.00, z: 12.00 },
  { id: 'FGL-2', name: 'Pad-S',  x: 1025.00, y: 2000.00, z: 12.00 },
  { id: 'FGL-3', name: 'Pad-SE', x: 1050.00, y: 2000.00, z: 12.00 },
  { id: 'FGL-4', name: 'Pad-W',  x: 1000.00, y: 2025.00, z: 12.00 },
  { id: 'FGL-5', name: 'Pad-C',  x: 1025.00, y: 2025.00, z: 12.00 },
  { id: 'FGL-6', name: 'Pad-E',  x: 1050.00, y: 2025.00, z: 12.00 },
  { id: 'FGL-7', name: 'Pad-NW', x: 1000.00, y: 2050.00, z: 12.00 },
  { id: 'FGL-8', name: 'Pad-N',  x: 1025.00, y: 2050.00, z: 12.00 },
  { id: 'FGL-9', name: 'Pad-NE', x: 1050.00, y: 2050.00, z: 12.00 },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. CSV Parsers and Exporters
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse CSV text containing survey coordinates (Point, Easting, Northing, Elevation)
 */
export function parseEarthworkPointsCsv(csvText: string): { points: TinPoint[]; errors: string[] } {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const points: TinPoint[] = [];
  const errors: string[] = [];

  if (lines.length === 0) {
    return { points, errors: ['ไฟล์ CSV ว่างเปล่า'] };
  }

  // Check header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('point') || firstLine.includes('east') || firstLine.includes('x') || firstLine.includes('elev') || firstLine.includes('z');
  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Split by comma, tab, or space
    const parts = line.split(/[,\t]+/).map(p => p.trim());
    if (parts.length < 3) {
      errors.push(`บรรทัดที่ ${i + 1}: ข้อมูลไม่ครบ 3 คอลัมน์ (ต้องการ X/E, Y/N, Z)`);
      continue;
    }

    let id = `P-${i + 1}`;
    let xStr = '';
    let yStr = '';
    let zStr = '';

    if (parts.length >= 4) {
      id = parts[0];
      xStr = parts[1];
      yStr = parts[2];
      zStr = parts[3];
    } else {
      xStr = parts[0];
      yStr = parts[1];
      zStr = parts[2];
    }

    const x = parseFloat(xStr);
    const y = parseFloat(yStr);
    const z = parseFloat(zStr);

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      errors.push(`บรรทัดที่ ${i + 1} (${id}): ค่าพิกัดไม่ถูกต้อง (X=${xStr}, Y=${yStr}, Z=${zStr})`);
      continue;
    }

    points.push({ id, name: id, x, y, z });
  }

  return { points, errors };
}

/**
 * Download standard template CSV for Earthwork Survey
 * Supports both Existing Surface (OGL) and Design Surface (FGL)
 */
export function downloadEarthworkTemplateCsv(surfaceType: 'ogl' | 'fgl' = 'ogl'): void {
  const content = surfaceType === 'ogl' ? [
    'Point_ID,Easting_X,Northing_Y,Elevation_Z,Remark',
    'OGL-1,1000.000,2000.000,12.850,SW Corner OGL',
    'OGL-2,1025.000,2000.000,13.100,S Mid OGL',
    'OGL-3,1050.000,2000.000,13.450,SE Corner OGL',
    'OGL-4,1000.000,2025.000,12.400,W Mid OGL',
    'OGL-5,1025.000,2025.000,11.200,Center Pit OGL',
    'OGL-6,1050.000,2025.000,13.800,E Mid OGL',
    'OGL-7,1000.000,2050.000,11.900,NW Corner OGL',
    'OGL-8,1025.000,2050.000,11.500,N Mid OGL',
    'OGL-9,1050.000,2050.000,14.200,NE Corner OGL'
  ].join('\r\n') : [
    'Point_ID,Easting_X,Northing_Y,Elevation_Z,Remark',
    'FGL-1,1000.000,2000.000,12.000,Pad SW Corner FGL',
    'FGL-2,1025.000,2000.000,12.000,Pad S Mid FGL',
    'FGL-3,1050.000,2000.000,12.000,Pad SE Corner FGL',
    'FGL-4,1000.000,2025.000,12.000,Pad W Mid FGL',
    'FGL-5,1025.000,2025.000,12.000,Pad Center FGL',
    'FGL-6,1050.000,2025.000,12.000,Pad E Mid FGL',
    'FGL-7,1000.000,2050.000,12.000,Pad NW Corner FGL',
    'FGL-8,1025.000,2050.000,12.000,Pad N Mid FGL',
    'FGL-9,1050.000,2050.000,12.000,Pad NE Corner FGL'
  ].join('\r\n');

  const filename = surfaceType === 'ogl' ? 'earthwork_existing_ogl_template.csv' : 'earthwork_design_fgl_template.csv';
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
