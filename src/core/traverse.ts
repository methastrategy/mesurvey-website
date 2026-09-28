import { TraverseLegInput, AdjustedLegOutput, TraverseAdjustmentResult } from '../types/survey';

/**
 * Calculates Departure (dE) and Latitude (dN) from distance and azimuth (in decimal degrees).
 * Azimuth is measured clockwise from North (0° = North, 90° = East).
 */
export function polarToRect(distance: number, azimuthDeg: number): { de: number; dn: number } {
  const rad = (azimuthDeg * Math.PI) / 180.0;
  const dn = distance * Math.cos(rad); // Latitude
  const de = distance * Math.sin(rad); // Departure
  return {
    de: Number(de.toFixed(5)),
    dn: Number(dn.toFixed(5))
  };
}

/**
 * Calculates Distance and Azimuth from Departure (dE) and Latitude (dN).
 */
export function rectToPolar(de: number, dn: number): { distance: number; azimuthDeg: number } {
  const distance = Math.hypot(de, dn);
  let azimuth = (Math.atan2(de, dn) * 180.0) / Math.PI;
  if (azimuth < 0) {
    azimuth += 360.0;
  }
  return {
    distance: Number(distance.toFixed(4)),
    azimuthDeg: Number(azimuth.toFixed(5))
  };
}

/**
 * Adjusts a traverse using the Bowditch (Compass) Rule.
 * Supports both closed loops (start coord == end coord) and connected link traverses.
 */
export function adjustTraverseBowditch(
  legs: TraverseLegInput[],
  startCoord: { easting: number; northing: number },
  endCoord: { easting: number; northing: number }
): TraverseAdjustmentResult {
  if (!legs || legs.length === 0) {
    throw new Error('ตารางวงรอบว่างเปล่า: กรุณาระบุข้อมูลเส้นวงรอบอย่างน้อย 1 เส้นทาง');
  }

  // Validate start and end coordinates
  if (isNaN(startCoord.easting) || isNaN(startCoord.northing)) {
    throw new Error('พิกัดสถานีเริ่มต้นไม่ถูกต้อง: กรุณาระบุค่า Easting และ Northing ของสถานีเริ่มต้น');
  }
  if (isNaN(endCoord.easting) || isNaN(endCoord.northing)) {
    throw new Error('พิกัดหมุดปิดวงรอบปลายทางไม่ถูกต้อง: กรุณาระบุค่า Easting และ Northing ของหมุดปลายทาง');
  }

  // Validate each individual leg for field reality
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const legLabel = leg.station && leg.targetStation 
      ? `สถานี ${leg.station} → ${leg.targetStation}` 
      : `แถวที่ ${i + 1}`;

    if (isNaN(leg.distance) || leg.distance <= 0) {
      throw new Error(`ระยะทางไม่ถูกต้องที่ ${legLabel}: ระยะราบต้องมากกว่า 0.000 ม. (ตรวจพบ: ${leg.distance}) กรุณาตรวจสอบข้อมูลเทปวัดระยะหรือค่า EDM จากหน้างาน`);
    }

    if (isNaN(leg.azimuthDeg) || leg.azimuthDeg < 0 || leg.azimuthDeg > 360) {
      throw new Error(`มุมภาคทิศ (Azimuth) ไม่ถูกต้องที่ ${legLabel}: ต้องอยู่ในช่วง 0° ถึง 360° (ตรวจพบ: ${leg.azimuthDeg}°) กรุณาตรวจสอบมุมราบที่รังวัดได้`);
    }
  }

  const n = legs.length;
  const totalPerimeter = legs.reduce((sum, leg) => sum + leg.distance, 0);
  if (totalPerimeter <= 0) {
    throw new Error('ความยาวรอบรูปรวมเท่ากับ 0.000 ม. ไม่สามารถคำนวณสัดส่วนการปรับแก้ได้');
  }

  const rawDeltas = legs.map(leg => polarToRect(leg.distance, leg.azimuthDeg));
  const sumRawDe = rawDeltas.reduce((sum, d) => sum + d.de, 0);
  const sumRawDn = rawDeltas.reduce((sum, d) => sum + d.dn, 0);

  const targetDe = endCoord.easting - startCoord.easting;
  const targetDn = endCoord.northing - startCoord.northing;

  // Misclosures
  const misclosureE = sumRawDe - targetDe;
  const misclosureN = sumRawDn - targetDn;
  const linearMisclosure = Math.hypot(misclosureE, misclosureN);

  const precisionRatio = linearMisclosure > 0.00001
    ? Math.round(totalPerimeter / linearMisclosure)
    : 999999;

  let precisionGrade = 'ต่ำกว่าเกณฑ์มาตรฐานวิศวกรรม (< 1:2,500 - แนะนำตรวจสอบการรังวัดใหม่)';
  if (precisionRatio >= 20000) {
    precisionGrade = 'ชั้น 1 - โครงข่ายหมุดควบคุมหลักภูมิมาตรศาสตร์ (First-Order Geodetic ≥ 1:20,000)';
  } else if (precisionRatio >= 10000) {
    precisionGrade = 'ชั้น 2 ชั้นหนึ่ง - โครงข่ายงานสำรวจควบคุมพื้นที่ขนาดใหญ่ (Second-Order Class I ≥ 1:10,000)';
  } else if (precisionRatio >= 5000) {
    precisionGrade = 'ชั้น 2 ชั้นสอง - งานสำรวจวิศวกรรมก่อสร้างและโยธา (Second-Order Class II / Engineering ≥ 1:5,000)';
  } else if (precisionRatio >= 2500) {
    precisionGrade = 'ชั้น 3 - งานรังวัดปักเขตที่ดินและแผนที่ภูมิประเทศ (Third-Order / Cadastral Boundary ≥ 1:2,500)';
  }

  // Station Coordinates
  const stationCoordinates: { [station: string]: { easting: number; northing: number } } = {};
  stationCoordinates[legs[0].station] = {
    easting: startCoord.easting,
    northing: startCoord.northing
  };

  let curE = startCoord.easting;
  let curN = startCoord.northing;

  const adjustedLegs: AdjustedLegOutput[] = [];

  for (let i = 0; i < n; i++) {
    const leg = legs[i];
    const distRatio = leg.distance / totalPerimeter;

    // Bowditch correction: opposite sign of misclosure proportional to length
    const corrDe = -(misclosureE * distRatio);
    const corrDn = -(misclosureN * distRatio);

    const adjDe = rawDeltas[i].de + corrDe;
    const adjDn = rawDeltas[i].dn + corrDn;

    curE += adjDe;
    curN += adjDn;

    stationCoordinates[leg.targetStation] = {
      easting: Number(curE.toFixed(4)),
      northing: Number(curN.toFixed(4))
    };

    adjustedLegs.push({
      leg: `${leg.station} → ${leg.targetStation}`,
      distance: leg.distance,
      rawDe: Number(rawDeltas[i].de.toFixed(4)),
      rawDn: Number(rawDeltas[i].dn.toFixed(4)),
      corrDe: Number(corrDe.toFixed(4)),
      corrDn: Number(corrDn.toFixed(4)),
      adjDe: Number(adjDe.toFixed(4)),
      adjDn: Number(adjDn.toFixed(4)),
      adjustedEasting: Number(curE.toFixed(4)),
      adjustedNorthing: Number(curN.toFixed(4))
    });
  }

  return {
    totalPerimeter: Number(totalPerimeter.toFixed(4)),
    misclosureE: Number(misclosureE.toFixed(4)),
    misclosureN: Number(misclosureN.toFixed(4)),
    linearMisclosure: Number(linearMisclosure.toFixed(4)),
    precisionRatio,
    precisionGrade,
    adjustedLegs,
    stationCoordinates
  };
}
