import type { Station2D, Observation2D, Observation2DType, LevelingPoint, LevelingObservation } from './least-squares';

export interface ParseResult<T> {
  data: T[];
  errors: string[];
}

/**
 * Parses CSV/TSV text into Station2D list.
 * Supports flexible headers:
 * - ID / Point / Station / Name
 * - Easting / E / X
 * - Northing / N / Y
 * - Fixed / isFixed / Status (true/false/1/0/fixed)
 */
export function parseStationsCsv(text: string): ParseResult<Station2D> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const stations: Station2D[] = [];
  const errors: string[] = [];

  if (lines.length === 0) {
    return { data: [], errors: ['ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ที่มีข้อมูล'] };
  }

  let hasHeader = false;
  let idCol = 0;
  let eastCol = 1;
  let northCol = 2;
  let fixedCol = 3;

  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('id') || firstLine.includes('point') || firstLine.includes('station') || firstLine.includes('east') || firstLine.includes('x')) {
    hasHeader = true;
    const headerCols = lines[0].split(/[,\t;]+/).map(c => c.trim().toLowerCase());
    
    headerCols.forEach((col, idx) => {
      if (col === 'id' || col === 'point' || col === 'station' || col === 'name') idCol = idx;
      else if (col.includes('east') || col === 'e' || col === 'x') eastCol = idx;
      else if (col.includes('north') || col === 'n' || col === 'y') northCol = idx;
      else if (col.includes('fix') || col === 'status') fixedCol = idx;
    });
  }

  const startIdx = hasHeader ? 1 : 0;
  for (let i = startIdx; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine.startsWith('#')) continue; // Skip comments

    const cols = rawLine.split(/[,\t;]+/).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 3) {
      errors.push(`บรรทัดที่ ${i + 1}: ข้อมูลไม่ครบ 3 คอลัมน์ (ID, Easting, Northing) -> "${rawLine}"`);
      continue;
    }

    const id = cols[idCol] || `STN_${i}`;
    const east = parseFloat(cols[eastCol]);
    const north = parseFloat(cols[northCol]);

    if (isNaN(east) || isNaN(north)) {
      errors.push(`บรรทัดที่ ${i + 1}: ค่าพิกัด Easting หรือ Northing ไม่ถูกต้อง -> "${rawLine}"`);
      continue;
    }

    let isFixed = false;
    if (cols[fixedCol] !== undefined) {
      const fixedVal = cols[fixedCol].toLowerCase();
      isFixed = fixedVal === 'true' || fixedVal === '1' || fixedVal === 'yes' || fixedVal === 'fixed' || fixedVal === 'control';
    }

    stations.push({
      id,
      isFixed,
      knownE: isFixed ? east : undefined,
      knownN: isFixed ? north : undefined,
      approxE: isFixed ? undefined : east,
      approxN: isFixed ? undefined : north
    });
  }

  return { data: stations, errors };
}

/**
 * Parses CSV/TSV text into Observation2D list.
 * Supports:
 * - Distance: from, to, distance_m, [std_dev_m]
 * - Azimuth: from, to, azimuth_deg, [std_dev_sec]
 * - Baseline Vector: from, to, dE_m, dN_m, [std_dev_e_m], [std_dev_n_m]
 */
export function parseObservationsCsv(text: string): ParseResult<Observation2D> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const observations: Observation2D[] = [];
  const errors: string[] = [];

  if (lines.length === 0) {
    return { data: [], errors: ['ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ที่มีข้อมูล'] };
  }

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('from') || firstLine.includes('to') || firstLine.includes('type') || firstLine.includes('obs');
  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine.startsWith('#')) continue;

    const cols = rawLine.split(/[,\t;]+/).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 4) {
      errors.push(`บรรทัดที่ ${i + 1}: ข้อมูลไม่ครบถ้วน -> "${rawLine}"`);
      continue;
    }

    // Try detecting format:
    // Format A: ID, Type, From, To, Val1, [Val2], [StdDev1], [StdDev2]
    // Format B: From, To, Type, Val1, [Val2], [StdDev]
    // Format C: From, To, Dist, [StdDev]
    let obsId = `OBS_${i}`;
    let obsType: Observation2DType = 'distance';
    let fromStn = '';
    let toStn = '';
    let val1 = 0;
    let val2: number | undefined = undefined;
    let std1 = 0.005;
    let std2: number | undefined = undefined;

    const tLower = cols[1].toLowerCase();
    const tLower2 = cols[2].toLowerCase();

    if (tLower === 'distance' || tLower === 'azimuth' || tLower === 'baseline_vector' || tLower === 'gnss') {
      // Format A
      obsId = cols[0];
      obsType = tLower === 'gnss' ? 'baseline_vector' : (tLower as Observation2DType);
      fromStn = cols[2];
      toStn = cols[3];
      val1 = parseFloat(cols[4]);
      let cur = 5;
      if (obsType === 'baseline_vector' && cols.length > cur) {
        val2 = parseFloat(cols[cur++]);
      }
      if (cols.length > cur && cols[cur]) {
        std1 = parseFloat(cols[cur++]);
      }
      if (obsType === 'baseline_vector' && cols.length > cur && cols[cur]) {
        std2 = parseFloat(cols[cur++]);
      }
    } else if (tLower2 === 'distance' || tLower2 === 'azimuth' || tLower2 === 'baseline_vector' || tLower2 === 'gnss') {
      // Format B
      fromStn = cols[0];
      toStn = cols[1];
      obsType = tLower2 === 'gnss' ? 'baseline_vector' : (tLower2 as Observation2DType);
      val1 = parseFloat(cols[3]);
      let cur = 4;
      if (obsType === 'baseline_vector' && cols.length > cur) {
        val2 = parseFloat(cols[cur++]);
      }
      if (cols.length > cur && cols[cur]) {
        std1 = parseFloat(cols[cur++]);
      }
      if (obsType === 'baseline_vector' && cols.length > cur && cols[cur]) {
        std2 = parseFloat(cols[cur++]);
      }
    } else {
      // Default: From, To, Distance, StdDev
      fromStn = cols[0];
      toStn = cols[1];
      val1 = parseFloat(cols[2]);
      if (cols.length > 3 && cols[3]) {
        std1 = parseFloat(cols[3]);
      }
    }

    if (isNaN(val1) || !fromStn || !toStn) {
      errors.push(`บรรทัดที่ ${i + 1}: ข้อมูลค่ารังวัดไม่ถูกต้อง -> "${rawLine}"`);
      continue;
    }

    observations.push({
      id: obsId,
      type: obsType,
      fromStation: fromStn,
      toStation: toStn,
      measuredValue: val1,
      measuredValue2: val2,
      stdDev: isNaN(std1) || std1 <= 0 ? (obsType === 'azimuth' ? 5.0 : 0.005) : std1,
      stdDev2: std2 !== undefined && !isNaN(std2) ? std2 : undefined
    });
  }

  return { data: observations, errors };
}

/**
 * Parses Leveling Run CSV text into LevelingPoint and LevelingObservation lists.
 */
export function parseLevelingCsv(text: string): {
  points: LevelingPoint[];
  observations: LevelingObservation[];
  errors: string[];
} {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const pointsMap = new Map<string, LevelingPoint>();
  const observations: LevelingObservation[] = [];
  const errors: string[] = [];

  if (lines.length === 0) {
    return { points: [], observations: [], errors: ['ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ที่มีข้อมูล'] };
  }

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('from') || firstLine.includes('to') || firstLine.includes('dh') || firstLine.includes('bm');
  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine.startsWith('#')) continue;

    const cols = rawLine.split(/[,\t;]+/).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 3) {
      errors.push(`บรรทัดที่ ${i + 1}: ข้อมูลไม่ครบ 3 คอลัมน์ (From, To, DeltaH) -> "${rawLine}"`);
      continue;
    }

    // Expected: From_BM, To_BM, DeltaH_m, [Dist_km], [StdDev_mm], [FixedBM1_Elev], [FixedBM2_Elev]
    const from = cols[0];
    const to = cols[1];
    const dh = parseFloat(cols[2]);
    const distKm = cols.length > 3 && cols[3] ? parseFloat(cols[3]) : 1.0;
    const stdMm = cols.length > 4 && cols[4] ? parseFloat(cols[4]) : 2.0;

    if (isNaN(dh) || !from || !to) {
      errors.push(`บรรทัดที่ ${i + 1}: ค่าความต่างระดับ Delta H ไม่ถูกต้อง -> "${rawLine}"`);
      continue;
    }

    // Auto-register points if not seen
    if (!pointsMap.has(from)) {
      pointsMap.set(from, { id: from, isFixed: false, approxElevation: 0 });
    }
    if (!pointsMap.has(to)) {
      pointsMap.set(to, { id: to, isFixed: false, approxElevation: 0 });
    }

    observations.push({
      id: `LEV_${i}`,
      fromStation: from,
      toStation: to,
      measuredDh: dh,
      distanceKm: isNaN(distKm) || distKm <= 0 ? 1.0 : distKm,
      stdDevMm: isNaN(stdMm) || stdMm <= 0 ? 2.0 : stdMm
    });
  }

  // Ensure at least first station is fixed if no point was explicitly fixed
  const points = Array.from(pointsMap.values());
  if (points.length > 0 && !points.some(p => p.isFixed)) {
    points[0].isFixed = true;
    points[0].knownElevation = 100.0; // Default reference datum
  }

  return { points, observations, errors };
}
