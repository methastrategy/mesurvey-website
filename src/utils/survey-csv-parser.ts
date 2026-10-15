import type { Station2D, Observation2D, Observation2DType, LevelingPoint, LevelingObservation } from './least-squares';
import { 
  forwardWgs84ToUtm, 
  inverseUtmToWgs84, 
  forwardWgs84ToIndian1975, 
  inverseIndian1975ToWgs84, 
  calculateUtmZone 
} from '../core/projections';

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

/**
 * Parses Leveling Fieldbook CSV into LevelingRowInput items.
 * Columns: Station, BS(m), IFS(m), FS(m), [Remark]
 */
export function parseLevelingFieldbookCsv(text: string): {
  rows: Array<{ id: string; station: string; bs: number | null; ifs: number | null; fs: number | null; remark?: string }>;
  errors: string[];
} {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows: Array<{ id: string; station: string; bs: number | null; ifs: number | null; fs: number | null; remark?: string }> = [];
  const errors: string[] = [];

  if (lines.length === 0) {
    return { rows: [], errors: ['ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ที่มีข้อมูล'] };
  }

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('station') || firstLine.includes('bs') || firstLine.includes('fs') || firstLine.includes('สถานี');
  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine.startsWith('#')) continue;

    const delimiter = rawLine.includes('\t') ? '\t' : (rawLine.includes(';') ? ';' : ',');
    const cols = rawLine.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 2) continue;

    const station = cols[0] || `STN-${i + 1}`;
    const parseNum = (v: string | undefined): number | null => {
      if (!v || v.trim() === '' || v.trim() === '-' || v.trim() === '—') return null;
      const num = parseFloat(v);
      return isNaN(num) ? null : num;
    };

    const bs = parseNum(cols[1]);
    const ifs = cols.length > 2 ? parseNum(cols[2]) : null;
    const fs = cols.length > 3 ? parseNum(cols[3]) : null;
    const remark = cols.length > 4 ? cols[4] : '';

    rows.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `row_${i + 1}`,
      station,
      bs,
      ifs,
      fs,
      remark
    });
  }

  return { rows, errors };
}

/**
 * Parses Traverse CSV into TraverseLeg items.
 * Columns: Station, TargetStation, Distance(m), [Angle_Deg, Angle_Min, Angle_Sec] or [Angle_Decimal]
 */
export function parseTraverseCsv(text: string): {
  legs: Array<{ id: string; station: string; targetStation: string; distance: string; obsD: string; obsM: string; obsS: string }>;
  errors: string[];
} {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const legs: Array<{ id: string; station: string; targetStation: string; distance: string; obsD: string; obsM: string; obsS: string }> = [];
  const errors: string[] = [];

  if (lines.length === 0) {
    return { legs: [], errors: ['ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ที่มีข้อมูล'] };
  }

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('station') || firstLine.includes('from') || firstLine.includes('dist') || firstLine.includes('angle');
  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine.startsWith('#')) continue;

    const cols = rawLine.split(/[,\t;]+/).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 3) {
      errors.push(`บรรทัดที่ ${i + 1}: ข้อมูลไม่ครบถ้วน (ต้องมี Station, Target, Distance) -> "${rawLine}"`);
      continue;
    }

    const station = cols[0];
    const target = cols[1];
    const dist = parseFloat(cols[2]);
    if (isNaN(dist) || dist <= 0) {
      errors.push(`บรรทัดที่ ${i + 1}: ค่าระยะทางไม่ถูกต้อง -> "${rawLine}"`);
      continue;
    }

    let d = '0';
    let m = '0';
    let s = '0';

    if (cols.length >= 6) {
      // Deg, Min, Sec
      d = cols[3];
      m = cols[4];
      s = cols[5];
    } else if (cols.length >= 4) {
      // Decimal degrees
      const dec = parseFloat(cols[3]);
      if (!isNaN(dec)) {
        const abs = Math.abs(dec);
        const deg = Math.floor(abs);
        const rem = (abs - deg) * 60;
        const min = Math.floor(rem);
        const sec = (rem - min) * 60;
        d = deg.toString();
        m = min.toString();
        s = sec.toFixed(1);
      }
    }

    legs.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `leg_${i}`,
      station,
      targetStation: target,
      distance: dist.toFixed(3),
      obsD: d,
      obsM: m,
      obsS: s
    });
  }

  return { legs, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE DOWNLOADERS
// ─────────────────────────────────────────────────────────────────────────────

import { exportToCsv } from './csv-export';

/**
 * Downloads a standard 2D Survey Station CSV template with sample row.
 */
export function downloadStationsTemplateCsv(): void {
  exportToCsv({
    filename: 'template_survey_stations_2d.csv',
    headers: ['Station_ID', 'Easting_m', 'Northing_m', 'Is_Fixed_Control(TRUE/FALSE)', 'Description'],
    rows: [
      ['CK-01', 669500.250, 1531000.500, 'TRUE', 'หมุดหลักฐานอ้างอิงเริ่มต้น (Fixed Control)'],
      ['STN-02', 669750.800, 1531200.100, 'FALSE', 'หมุดวงรอบปรับแก้ (Adjusted Station)'],
      ['STN-03', 669900.000, 1530800.000, 'FALSE', 'หมุดวงรอบปรับแก้ (Adjusted Station)']
    ]
  });
}

/**
 * Downloads a standard 2D Survey Observation CSV template with sample row.
 */
export function downloadObservationsTemplateCsv(): void {
  exportToCsv({
    filename: 'template_survey_observations_2d.csv',
    headers: ['Obs_ID', 'Type(distance/azimuth/baseline_vector)', 'From_Station', 'To_Station', 'Value_1(m_or_deg)', 'Value_2(dN_for_GNSS)', 'StdDev(m_or_sec)'],
    rows: [
      ['DIST_01', 'distance', 'CK-01', 'STN-02', 254.321, '', 0.005],
      ['AZ_01', 'azimuth', 'CK-01', 'STN-02', 45.3025, '', 5.0],
      ['GNSS_01', 'baseline_vector', 'CK-01', 'STN-03', 399.750, -200.500, 0.008]
    ]
  });
}

/**
 * Downloads a Leveling Fieldbook (HI / Rise & Fall) CSV template with sample rows.
 */
export function downloadLevelingFieldbookTemplateCsv(): void {
  exportToCsv({
    filename: 'template_leveling_fieldbook.csv',
    headers: ['Station', 'BS_m', 'IFS_m', 'FS_m', 'Remark'],
    rows: [
      ['BM1', 1.542, '', '', 'หมุดเริ่มต้น (Start BM)'],
      ['TP1', 1.325, '', 1.108, 'หมุดเปลี่ยนจุดตั้งกล้อง 1'],
      ['TP2', 1.480, '', 1.250, 'หมุดเปลี่ยนจุดตั้งกล้อง 2'],
      ['BM2', '', '', 1.455, 'หมุดปลายทาง (End BM)']
    ]
  });
}

/**
 * Downloads a Leveling Run CSV template with sample row.
 */
export function downloadLevelingTemplateCsv(): void {
  exportToCsv({
    filename: 'template_leveling_run_1d.csv',
    headers: ['From_BM', 'To_BM', 'DeltaH_m', 'Distance_km', 'StdDev_mm', 'Remark'],
    rows: [
      ['BM1', 'BM2', 1.2450, 1.20, 2.0, 'ช่วงเดินระดับ 1'],
      ['BM2', 'BM3', -0.6500, 0.85, 2.0, 'ช่วงเดินระดับ 2'],
      ['BM3', 'BM1', -0.5950, 1.10, 2.0, 'ช่วงเดินระดับบรรจบ 3']
    ]
  });
}

/**
 * Downloads a Traverse Fieldbook CSV template with sample row.
 */
export function downloadTraverseTemplateCsv(): void {
  exportToCsv({
    filename: 'template_traverse_fieldbook.csv',
    headers: ['Station', 'Target_Station', 'Distance_m', 'Angle_Deg', 'Angle_Min', 'Angle_Sec', 'Remark'],
    rows: [
      ['A', 'B', 125.340, 98, 12, 30, 'หมุด A ส่องหมุด B'],
      ['B', 'C', 112.880, 101, 45, 15, 'หมุด B ส่องหมุด C'],
      ['C', 'D', 98.450, 95, 30, 45, 'หมุด C ส่องหมุด D'],
      ['D', 'E', 108.760, 108, 20, 0, 'หมุด D ส่องหมุด E'],
      ['E', 'A', 130.120, 136, 11, 30, 'หมุด E บรรจบหมุด A']
    ]
  });
}

import type { CadastralPolygonPoint } from '../types/survey';

/**
 * Parses Cadastral Polygon Coordinates CSV text.
 * Columns: Point_Name, Easting_m, Northing_m, [Remark]
 */
export function parseCadastralCsv(text: string): {
  points: CadastralPolygonPoint[];
  errors: string[];
} {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const points: CadastralPolygonPoint[] = [];
  const errors: string[] = [];

  if (lines.length === 0) return { points: [], errors: ['ไฟล์ว่างเปล่า'] };

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('point') || firstLine.includes('name') || firstLine.includes('east') || firstLine.includes('x') || firstLine.includes('หมุด');
  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine.startsWith('#')) continue;

    const delimiter = rawLine.includes('\t') ? '\t' : (rawLine.includes(';') ? ';' : ',');
    const cols = rawLine.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 2) continue;

    let name = cols[0];
    let e = parseFloat(cols[1]);
    let n = cols.length > 2 ? parseFloat(cols[2]) : NaN;

    if (isNaN(n) && !isNaN(parseFloat(cols[0])) && !isNaN(parseFloat(cols[1]))) {
      name = `P${i + 1}`;
      e = parseFloat(cols[0]);
      n = parseFloat(cols[1]);
    }

    if (isNaN(e) || isNaN(n)) {
      errors.push(`บรรทัดที่ ${i + 1}: ค่าพิกัดไม่ถูกต้อง -> "${rawLine}"`);
      continue;
    }

    points.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `cad_${i + 1}`,
      name,
      easting: e,
      northing: n
    });
  }

  return { points, errors };
}

/**
 * Downloads Cadastral Polygon CSV template with sample rectangular lot.
 */
export function downloadCadastralTemplateCsv(): void {
  exportToCsv({
    filename: 'template_cadastral_polygon.csv',
    headers: ['Point_Name', 'Easting_m', 'Northing_m', 'Remark'],
    rows: [
      ['หมุด 1 (SW)', 669500.0, 1531000.0, 'หมุดเขตที่ดินมุมล่างซ้าย'],
      ['หมุด 2 (SE)', 669600.0, 1531000.0, 'หมุดเขตที่ดินมุมล่างขวา'],
      ['หมุด 3 (NE)', 669600.0, 1531100.0, 'หมุดเขตที่ดินมุมบนขวา'],
      ['หมุด 4 (NW)', 669500.0, 1531100.0, 'หมุดเขตที่ดินมุมบนซ้าย']
    ]
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH COORDINATE TRANSFORMATION
// ─────────────────────────────────────────────────────────────────────────────

export type BatchCoordinateSourceType = 'wgs84_dd' | 'utm47' | 'utm48' | 'ind47' | 'ind48';

export interface ConvertedBatchCoordinate {
  id: string;
  name: string;
  rawInput: string;
  lat: number;
  lng: number;
  utmZone: 47 | 48;
  utmEasting: number;
  utmNorthing: number;
  indianZone: 47 | 48;
  indianEasting: number;
  indianNorthing: number;
}

/**
 * Parses batch coordinate CSV text and transforms each point into all projections.
 * Supported source formats:
 * - wgs84_dd: Point_ID, Latitude_DD, Longitude_DD
 * - utm47 / utm48: Point_ID, Easting_m, Northing_m
 * - ind47 / ind48: Point_ID, Easting_m, Northing_m
 */
export function parseBatchCoordinatesCsv(
  text: string,
  sourceType: BatchCoordinateSourceType
): {
  points: ConvertedBatchCoordinate[];
  errors: string[];
} {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const points: ConvertedBatchCoordinate[] = [];
  const errors: string[] = [];

  if (lines.length === 0) return { points: [], errors: ['ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ที่มีข้อมูล'] };

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('point') || firstLine.includes('id') || firstLine.includes('lat') ||
                    firstLine.includes('east') || firstLine.includes('x') || firstLine.includes('name') ||
                    firstLine.includes('หมุด') || firstLine.includes('station');
  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine.startsWith('#')) continue;

    const delimiter = rawLine.includes('\t') ? '\t' : (rawLine.includes(';') ? ';' : ',');
    const cols = rawLine.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 2) continue;

    let id = `P_${i + 1}`;
    let val1 = 0;
    let val2 = 0;

    if (cols.length >= 3) {
      id = cols[0] || `P_${i + 1}`;
      val1 = parseFloat(cols[1]);
      val2 = parseFloat(cols[2]);
    } else {
      // 2 columns: val1, val2
      val1 = parseFloat(cols[0]);
      val2 = parseFloat(cols[1]);
    }

    if (isNaN(val1) || isNaN(val2)) {
      errors.push(`บรรทัดที่ ${i + 1}: ค่าตัวเลขไม่ถูกต้อง -> "${rawLine}"`);
      continue;
    }

    try {
      let lat = 0;
      let lng = 0;

      if (sourceType === 'wgs84_dd') {
        lat = val1;
        lng = val2;
      } else if (sourceType === 'utm47') {
        const wgs = inverseUtmToWgs84(val1, val2, 47);
        lat = wgs.lat;
        lng = wgs.lng;
      } else if (sourceType === 'utm48') {
        const wgs = inverseUtmToWgs84(val1, val2, 48);
        lat = wgs.lat;
        lng = wgs.lng;
      } else if (sourceType === 'ind47') {
        const wgs = inverseIndian1975ToWgs84(val1, val2, 47);
        lat = wgs.lat;
        lng = wgs.lng;
      } else if (sourceType === 'ind48') {
        const wgs = inverseIndian1975ToWgs84(val1, val2, 48);
        lat = wgs.lat;
        lng = wgs.lng;
      }

      const utmZone = calculateUtmZone(lng);
      const utm = forwardWgs84ToUtm(lat, lng, utmZone);
      const ind = forwardWgs84ToIndian1975(lat, lng, utmZone);

      points.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `bpt_${i + 1}`,
        name: id,
        rawInput: rawLine,
        lat: Number(lat.toFixed(7)),
        lng: Number(lng.toFixed(7)),
        utmZone,
        utmEasting: Number(utm.easting.toFixed(3)),
        utmNorthing: Number(utm.northing.toFixed(3)),
        indianZone: utmZone,
        indianEasting: Number(ind.easting.toFixed(3)),
        indianNorthing: Number(ind.northing.toFixed(3))
      });
    } catch (err: any) {
      errors.push(`บรรทัดที่ ${i + 1} (${id}): ${err?.message || 'การแปลงพิกัดล้มเหลว'}`);
    }
  }

  return { points, errors };
}

/**
 * Downloads a batch coordinate CSV template according to selected source type.
 */
export function downloadBatchCoordinateTemplateCsv(sourceType: BatchCoordinateSourceType): void {
  if (sourceType === 'wgs84_dd') {
    exportToCsv({
      filename: 'template_batch_wgs84_dd.csv',
      headers: ['Point_ID', 'Latitude_DD', 'Longitude_DD', 'Remark'],
      rows: [
        ['KU_MAIN', 13.846640, 100.569820, 'มหาวิทยาลัยเกษตรศาสตร์'],
        ['MONUMENT', 13.764920, 100.538310, 'อนุสาวรีย์ชัยสมรภูมิ'],
        ['SUVARNABHUMI', 13.690000, 100.750100, 'ท่าอากาศยานสุวรรณภูมิ']
      ]
    });
  } else if (sourceType === 'utm47' || sourceType === 'utm48') {
    const zone = sourceType === 'utm47' ? 47 : 48;
    exportToCsv({
      filename: `template_batch_utm_zone${zone}.csv`,
      headers: ['Point_ID', 'Easting_m', 'Northing_m', 'Remark'],
      rows: zone === 47 ? [
        ['P1', 669656.82, 1531321.89, 'หมุดควบคุม 1 (Zone 47)'],
        ['P2', 670120.45, 1531850.12, 'หมุดควบคุม 2 (Zone 47)'],
        ['P3', 669210.15, 1530940.60, 'หมุดควบคุม 3 (Zone 47)']
      ] : [
        ['KORAT_1', 215430.20, 1658210.40, 'หมุดควบคุมโคราช (Zone 48)'],
        ['UBON_1', 485120.50, 1685410.80, 'หมุดควบคุมอุบลฯ (Zone 48)']
      ]
    });
  } else {
    const zone = sourceType === 'ind47' ? 47 : 48;
    exportToCsv({
      filename: `template_batch_indian1975_zone${zone}.csv`,
      headers: ['Point_ID', 'Easting_m', 'Northing_m', 'Remark'],
      rows: [
        ['RTSD_1', 669988.90, 1531019.56, `หมุดแผนที่ทหาร Indian 1975 (Zone ${zone})`],
        ['RTSD_2', 670450.10, 1531545.80, `หมุดแผนที่ทหาร Indian 1975 (Zone ${zone})`]
      ]
    });
  }
}

/**
 * Exports converted batch coordinates to CSV with all 3 projections.
 */
export function exportConvertedBatchCoordinatesToCsv(points: ConvertedBatchCoordinate[]): void {
  exportToCsv({
    filename: `batch_coordinates_converted_${new Date().toISOString().slice(0, 10)}.csv`,
    headers: [
      'Point_ID',
      'WGS84_Lat_DD',
      'WGS84_Lng_DD',
      'UTM_Zone',
      'UTM_Easting_m',
      'UTM_Northing_m',
      'Indian1975_Zone',
      'Indian1975_Easting_m',
      'Indian1975_Northing_m'
    ],
    rows: points.map(p => [
      p.name,
      p.lat.toFixed(7),
      p.lng.toFixed(7),
      p.utmZone,
      p.utmEasting.toFixed(3),
      p.utmNorthing.toFixed(3),
      p.indianZone,
      p.indianEasting.toFixed(3),
      p.indianNorthing.toFixed(3)
    ])
  });
}

