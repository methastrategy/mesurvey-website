/**
 * Cadastral Boundary Encroachment & Offset Engine (cadastral-encroachment.ts)
 * 
 * Precision geomatics engine for detecting boundary disputes, fence/building encroachments,
 * and property setback offsets against official Thai Land Title Deed (โฉนดที่ดิน) boundaries.
 * 
 * Standards:
 * - กรมที่ดิน: ระเบียบกรมที่ดินว่าด้วยการรังวัดสอบเขตที่ดิน
 * - ประมวลกฎหมายแพ่งและพาณิชย์: มาตรา 1312 (การสร้างโรงเรือนรุกล้ำ)
 */

export interface CadastralBoundaryPoint {
  id: string;
  name: string; // e.g. "หมุด 1 (ม.1)", "หลักเขต A"
  easting: number;
  northing: number;
}

export interface SurveyedFeaturePoint {
  id: string;
  name: string; // e.g. "เสารั้ว 1", "ผนังอาคารฝั่งทิศเหนือ"
  easting: number;
  northing: number;
  featureCode?: string; // 'fence' | 'wall' | 'structure' | 'peg'
}

export interface EncroachmentEvaluationItem {
  id: string;
  name: string;
  featureCode?: string;
  easting: number;
  northing: number;
  isInside: boolean;
  isEncroaching: boolean;
  offsetDistanceM: number; // Signed distance: positive = safe inside, 0 = on line, negative = encroaching outside
  encroachmentCm: number;  // Positive cm if encroaching outside, 0 if safe inside
  closestSegmentIndex: number;
  closestSegmentFrom: string;
  closestSegmentTo: string;
  closestPointOnBoundary: { easting: number; northing: number };
  legalSeverity: 'safe' | 'warning' | 'encroaching';
  recommendation: string;
}

export interface CadastralEncroachmentResult {
  totalBoundaryPoints: number;
  totalSurveyedPoints: number;
  encroachingCount: number;
  safeCount: number;
  maxEncroachmentCm: number;
  boundaryAreaSqM: number;
  boundaryPerimeterM: number;
  items: EncroachmentEvaluationItem[];
  status: 'clean' | 'disputed' | 'severe';
  disclaimer: string;
}

/**
 * Calculates perpendicular distance and closest projected point from point P to line segment AB
 */
export function pointToSegmentProjection(
  p: { easting: number; northing: number },
  a: { easting: number; northing: number },
  b: { easting: number; northing: number }
): { distance: number; closestPoint: { easting: number; northing: number }; t: number } {
  const dx = b.easting - a.easting;
  const dy = b.northing - a.northing;
  const lenSq = dx * dx + dy * dy;

  if (lenSq < 1e-10) {
    // A and B are identical
    const dist = Math.hypot(p.easting - a.easting, p.northing - a.northing);
    return { distance: dist, closestPoint: { easting: a.easting, northing: a.northing }, t: 0 };
  }

  // Projection scalar t: P = A + t * (B - A)
  let t = ((p.easting - a.easting) * dx + (p.northing - a.northing) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t)); // Clamp to segment

  const closestPoint = {
    easting: a.easting + t * dx,
    northing: a.northing + t * dy,
  };

  const dist = Math.hypot(p.easting - closestPoint.easting, p.northing - closestPoint.northing);
  return { distance: dist, closestPoint, t };
}

/**
 * Tests whether point P is inside closed polygon using Ray-Casting algorithm
 */
export function isPointInsidePolygon(
  p: { easting: number; northing: number },
  polygon: { easting: number; northing: number }[]
): boolean {
  const n = polygon.length;
  if (n < 3) return false;

  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].easting, yi = polygon[i].northing;
    const xj = polygon[j].easting, yj = polygon[j].northing;

    const intersect = ((yi > p.northing) !== (yj > p.northing)) &&
      (p.easting < ((xj - xi) * (p.northing - yi)) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculates 2D polygon area using Shoelace formula
 */
export function calculatePolygonArea(polygon: { easting: number; northing: number }[]): number {
  const n = polygon.length;
  if (n < 3) return 0;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].easting * polygon[j].northing;
    area -= polygon[j].easting * polygon[i].northing;
  }
  return Math.abs(area) * 0.5;
}

/**
 * Calculates perimeter of closed boundary polygon
 */
export function calculatePolygonPerimeter(polygon: { easting: number; northing: number }[]): number {
  const n = polygon.length;
  if (n < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += Math.hypot(polygon[j].easting - polygon[i].easting, polygon[j].northing - polygon[i].northing);
  }
  return perimeter;
}

/**
 * Master Cadastral Encroachment Evaluator
 */
export function evaluateCadastralEncroachment(
  boundary: CadastralBoundaryPoint[],
  surveyedPoints: SurveyedFeaturePoint[],
  encroachmentToleranceM = 0.01 // 1 cm survey tolerance
): CadastralEncroachmentResult {
  const nBoundary = boundary.length;
  if (nBoundary < 3) {
    throw new Error('แนวเขตโฉนดที่ดินต้องมีหมุดหลักเขตอย่างน้อย 3 หมุด');
  }

  const boundaryArea = calculatePolygonArea(boundary);
  const boundaryPerimeter = calculatePolygonPerimeter(boundary);

  let encroachingCount = 0;
  let maxEncroachCm = 0;

  const items: EncroachmentEvaluationItem[] = surveyedPoints.map((pt) => {
    const isInside = isPointInsidePolygon(pt, boundary);

    // Find shortest perpendicular distance to any boundary segment
    let minDistance = Infinity;
    let closestSegmentIdx = 0;
    let closestPt = { easting: pt.easting, northing: pt.northing };

    for (let i = 0; i < nBoundary; i++) {
      const nextIdx = (i + 1) % nBoundary;
      const proj = pointToSegmentProjection(pt, boundary[i], boundary[nextIdx]);
      if (proj.distance < minDistance) {
        minDistance = proj.distance;
        closestSegmentIdx = i;
        closestPt = proj.closestPoint;
      }
    }

    const segFrom = boundary[closestSegmentIdx].name || `หมุด ${closestSegmentIdx + 1}`;
    const segTo = boundary[(closestSegmentIdx + 1) % nBoundary].name || `หมุด ${((closestSegmentIdx + 1) % nBoundary) + 1}`;

    // Determine encroachment status:
    // If inside: safe offset
    // If outside by more than tolerance: encroaching
    const isEncroaching = !isInside && minDistance > encroachmentToleranceM;
    const offsetDistanceM = isInside ? minDistance : -minDistance;
    const encroachmentCm = isEncroaching ? Math.round(minDistance * 1000) / 10 : 0;

    if (isEncroaching) {
      encroachingCount++;
      if (encroachmentCm > maxEncroachCm) {
        maxEncroachCm = encroachmentCm;
      }
    }

    let legalSeverity: 'safe' | 'warning' | 'encroaching' = 'safe';
    let recommendation = 'อยู่ในขอบเขตโฉนดที่ดิน (ปลอดภัย)';

    if (isEncroaching) {
      legalSeverity = encroachmentCm > 10 ? 'encroaching' : 'warning';
      recommendation = `รุกล้ำออกนอกโฉนดแนว [${segFrom} → ${segTo}] จำนวน ${encroachmentCm.toFixed(1)} ซม. (เข้าข่าย ป.พ.พ. มาตรา 1312 ต้องเจรจาหรือรื้อถอน)`;
    } else if (minDistance <= 0.05) {
      legalSeverity = 'warning';
      recommendation = `อยู่ชิดแนวเขตมาก (ระยะเผื่อเพียง ${(minDistance * 100).toFixed(1)} ซม.) ควรระวังความหนาปูนฉาบ`;
    }

    return {
      id: pt.id,
      name: pt.name,
      featureCode: pt.featureCode,
      easting: pt.easting,
      northing: pt.northing,
      isInside,
      isEncroaching,
      offsetDistanceM,
      encroachmentCm,
      closestSegmentIndex: closestSegmentIdx,
      closestSegmentFrom: segFrom,
      closestSegmentTo: segTo,
      closestPointOnBoundary: closestPt,
      legalSeverity,
      recommendation,
    };
  });

  const safeCount = surveyedPoints.length - encroachingCount;
  let status: 'clean' | 'disputed' | 'severe' = 'clean';
  if (encroachingCount > 0) {
    status = maxEncroachCm > 15 ? 'severe' : 'disputed';
  }

  return {
    totalBoundaryPoints: nBoundary,
    totalSurveyedPoints: surveyedPoints.length,
    encroachingCount,
    safeCount,
    maxEncroachmentCm: maxEncroachCm,
    boundaryAreaSqM: boundaryArea,
    boundaryPerimeterM: boundaryPerimeter,
    items,
    status,
    disclaimer: 'ผลการคำนวณระยะรุกล้ำเป็นข้อมูลเพื่อการสนับสนุนการตัดสินใจทางวิศวกรรมสำรวจ การชี้ขาดกรรมสิทธิ์เป็นอำนาจของเจ้าพนักงานที่ดินและศาลยุติธรรม',
  };
}

/**
 * Standard Sample Deed Boundary (4-corner urban land plot)
 */
export const SAMPLE_CADASTRAL_BOUNDARY: CadastralBoundaryPoint[] = [
  { id: 'BM-1', name: 'หมุด 1 (ทิศตะวันตกเฉียงใต้)', easting: 661500.000, northing: 1520000.000 },
  { id: 'BM-2', name: 'หมุด 2 (ทิศตะวันออกเฉียงใต้)', easting: 661530.000, northing: 1520000.000 },
  { id: 'BM-3', name: 'หมุด 3 (ทิศตะวันออกเฉียงเหนือ)', easting: 661530.000, northing: 1520040.000 },
  { id: 'BM-4', name: 'หมุด 4 (ทิศตะวันตกเฉียงเหนือ)', easting: 661500.000, northing: 1520040.000 },
];

/**
 * Sample Surveyed Structure with one point encroaching by ~18 cm
 */
export const SAMPLE_SURVEYED_FENCE: SurveyedFeaturePoint[] = [
  { id: 'F-1', name: 'แนวกำแพงจุดที่ 1', easting: 661505.000, northing: 1520005.000, featureCode: 'wall' },
  { id: 'F-2', name: 'แนวกำแพงจุดที่ 2 (ชิดเขต)', easting: 661529.850, northing: 1520005.000, featureCode: 'wall' },
  { id: 'F-3', name: 'แนวกำแพงจุดที่ 3 (รุกล้ำออกนอกโฉนด)', easting: 661530.180, northing: 1520025.000, featureCode: 'wall' }, // Encroaches east by 18 cm
  { id: 'F-4', name: 'แนวกำแพงจุดที่ 4', easting: 661529.500, northing: 1520038.000, featureCode: 'wall' },
  { id: 'F-5', name: 'แนวกำแพงจุดที่ 5', easting: 661505.000, northing: 1520038.000, featureCode: 'wall' },
];
