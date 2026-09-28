import { LevelingRowInput, LevelingRowOutput, LevelingLoopResult } from '../types/survey';

/**
 * Calculates Differential Leveling using both Height of Instrument (HI) and Rise & Fall methods.
 */
export function calculateLevelingLoop(
  rows: LevelingRowInput[],
  startElevation: number,
  knownEndElevation?: number,
  totalDistanceKm: number = 1.0
): LevelingLoopResult {
  if (isNaN(startElevation)) {
    throw new Error('ค่าระดับหมุดเริ่มต้น (Start Benchmark RL) ไม่ถูกต้อง: กรุณาระบุค่าตัวเลข เช่น 100.000 ม.รทก.');
  }

  if (!rows || rows.length === 0) {
    throw new Error('สมุดจดงานระดับว่างเปล่า: กรุณาเพิ่มแถวรังวัดอย่างน้อย 1 สถานี');
  }

  if (rows[0].bs === null || rows[0].bs === undefined || isNaN(rows[0].bs)) {
    throw new Error(`สถานีเริ่มต้น (${rows[0].station || 'BM'}) ขาดค่าอ่านไม้ระดับส่องหลัง (Backsight - BS): จำเป็นต้องมี BS เพื่อเปิดแนวความสูงกล้อง (HI) เริ่มต้น`);
  }

  let currentHI: number | null = null;
  let currentElevation = startElevation;
  let previousStaffReading: number | null = null;

  const outputRows: LevelingRowOutput[] = [];
  let sumBs = 0;
  let sumFs = 0;
  let sumRise = 0;
  let sumFall = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    let hi: number | null = null;
    let rise: number | null = null;
    let fall: number | null = null;

    if (i === 0) {
      currentElevation = startElevation;
      if (r.bs !== null && r.bs !== undefined && !isNaN(r.bs)) {
        sumBs += r.bs;
        currentHI = currentElevation + r.bs;
        hi = currentHI;
        previousStaffReading = r.bs;
      }
    } else {
      // Station foresight / intermediate sight
      const hasFs = r.fs !== null && r.fs !== undefined && !isNaN(r.fs);
      const hasIfs = r.ifs !== null && r.ifs !== undefined && !isNaN(r.ifs);
      const currentReading = hasFs ? r.fs! : (hasIfs ? r.ifs! : null);

      if (currentReading !== null && currentHI !== null) {
        currentElevation = currentHI - currentReading;

        // Rise / Fall calculation against staff reading from previous position
        if (previousStaffReading !== null) {
          const diff = previousStaffReading - currentReading;
          if (diff > 0.00005) {
            rise = Number(diff.toFixed(4));
            sumRise += rise;
          } else if (diff < -0.00005) {
            fall = Number(Math.abs(diff).toFixed(4));
            sumFall += fall;
          }
        }
      }

      if (hasFs) {
        sumFs += r.fs!;
      }

      // If station has BS (Turning Point / setup change), establish new HI and reset previousStaffReading to this BS
      const hasBs = r.bs !== null && r.bs !== undefined && !isNaN(r.bs);
      if (hasBs) {
        sumBs += r.bs!;
        currentHI = currentElevation + r.bs!;
        hi = currentHI;
        previousStaffReading = r.bs!;
      } else {
        hi = currentHI;
        if (currentReading !== null) {
          previousStaffReading = currentReading;
        }
      }
    }

    outputRows.push({
      ...r,
      hi: hi !== null ? Number(hi.toFixed(4)) : null,
      elevation: Number(currentElevation.toFixed(4)),
      rise,
      fall
    });
  }

  const endElevation = knownEndElevation !== undefined ? knownEndElevation : startElevation;
  const deltaBenchmarks = Number((currentElevation - startElevation).toFixed(4));
  const diffBsFs = Number((sumBs - sumFs).toFixed(4));
  const diffRiseFall = Number((sumRise - sumFall).toFixed(4));
  const closureErrorMeters = Number((diffBsFs - (endElevation - startElevation)).toFixed(4));
  const closureErrorMm = Number((closureErrorMeters * 1000).toFixed(2));

  // Three-fold Page Check: Σ BS - Σ FS = Last RL - First RL = Σ Rise - Σ Fall
  const arithmeticCheckPassed = 
    Math.abs(diffBsFs - deltaBenchmarks) < 0.0015 &&
    (outputRows.length <= 1 || Math.abs(diffRiseFall - deltaBenchmarks) < 0.0015);

  // RTSD Tolerance Calculations: C = k * sqrt(K)
  const distKm = Math.max(0.001, totalDistanceKm);
  const sqrtK = Math.sqrt(distKm);
  const firstOrderMaxMm = Number((4 * sqrtK).toFixed(2));
  const secondOrderMaxMm = Number((8 * sqrtK).toFixed(2));
  const thirdOrderMaxMm = Number((12 * sqrtK).toFixed(2));
  const constructionMaxMm = Number((24 * sqrtK).toFixed(2));

  const absErrorMm = Math.abs(closureErrorMm);
  let achievedOrder = 'เกินเกณฑ์ความคลาดเคลื่อนที่ยอมรับได้ (แนะนำตรวจสอบค่า BS/FS, การปรับแก้ฟองกลมไม้สต๊าฟ, หรือทดสอบ Two-Peg Test)';
  if (absErrorMm <= firstOrderMaxMm) {
    achievedOrder = 'ชั้น 1 - งานระดับความละเอียดสูงพิเศษ โครงข่ายหลักประเทศ (RTSD First-Order ±4√K mm)';
  } else if (absErrorMm <= secondOrderMaxMm) {
    achievedOrder = 'ชั้น 2 - งานระดับวิศวกรรมโครงสร้างและชลประทาน (RTSD Second-Order ±8√K mm)';
  } else if (absErrorMm <= thirdOrderMaxMm) {
    achievedOrder = 'ชั้น 3 - งานระดับทำแผนที่ภูมิประเทศและวางท่อระบายน้ำ (RTSD Third-Order ±12√K mm)';
  } else if (absErrorMm <= constructionMaxMm) {
    achievedOrder = 'งานระดับก่อสร้างทั่วไปและถมดิน (Construction Grade ±24√K mm)';
  }

  return {
    rows: outputRows,
    sumBs: Number(sumBs.toFixed(4)),
    sumFs: Number(sumFs.toFixed(4)),
    diffBsFs,
    startElevation,
    endElevation,
    deltaBenchmarks,
    closureErrorMeters,
    closureErrorMm,
    totalDistanceKm: distKm,
    arithmeticCheckPassed,
    orderCompliance: {
      firstOrderMaxMm,
      secondOrderMaxMm,
      thirdOrderMaxMm,
      constructionMaxMm,
      achievedOrder
    }
  };
}
