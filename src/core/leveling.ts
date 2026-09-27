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
  if (rows.length === 0) {
    throw new Error('Leveling notebook must contain at least one observation row.');
  }

  let currentHI: number | null = null;
  let currentElevation = startElevation;
  let previousStaffReading: number | null = null;

  const outputRows: LevelingRowOutput[] = [];
  let sumBs = 0;
  let sumFs = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    let hi: number | null = null;
    let rise: number | null = null;
    let fall: number | null = null;

    if (r.bs !== null && r.bs !== undefined && !isNaN(r.bs)) {
      sumBs += r.bs;
      currentHI = currentElevation + r.bs;
      hi = currentHI;
    } else {
      hi = currentHI;
    }

    if (i === 0) {
      currentElevation = startElevation;
      previousStaffReading = r.bs;
    } else {
      // Current reading could be IFS or FS
      const currentReading = r.ifs !== null && r.ifs !== undefined && !isNaN(r.ifs) 
        ? r.ifs 
        : (r.fs !== null && r.fs !== undefined && !isNaN(r.fs) ? r.fs : null);

      if (currentReading !== null && currentHI !== null) {
        currentElevation = currentHI - currentReading;

        // Rise / Fall calculation
        if (previousStaffReading !== null) {
          const diff = previousStaffReading - currentReading;
          if (diff > 0) {
            rise = Number(diff.toFixed(4));
          } else if (diff < 0) {
            fall = Number(Math.abs(diff).toFixed(4));
          }
        }

        previousStaffReading = currentReading;
      }
    }

    if (r.fs !== null && r.fs !== undefined && !isNaN(r.fs)) {
      sumFs += r.fs;
      // If there is also a BS on this turning point, new HI was already updated or will update on next line
      if (r.bs !== null && r.bs !== undefined && !isNaN(r.bs)) {
        currentHI = currentElevation + r.bs;
        hi = currentHI;
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
  const closureErrorMeters = Number((diffBsFs - (endElevation - startElevation)).toFixed(4));
  const closureErrorMm = Number((closureErrorMeters * 1000).toFixed(2));

  // Arithmetic Check
  const arithmeticCheckPassed = Math.abs(diffBsFs - (currentElevation - startElevation)) < 0.002;

  // RTSD Tolerance Calculations: C = k * sqrt(K)
  const distKm = Math.max(0.1, totalDistanceKm);
  const sqrtK = Math.sqrt(distKm);
  const firstOrderMaxMm = Number((4 * sqrtK).toFixed(2));
  const secondOrderMaxMm = Number((8 * sqrtK).toFixed(2));
  const thirdOrderMaxMm = Number((12 * sqrtK).toFixed(2));
  const constructionMaxMm = Number((24 * sqrtK).toFixed(2));

  const absErrorMm = Math.abs(closureErrorMm);
  let achievedOrder = 'Unacceptable / Resurvey Required';
  if (absErrorMm <= firstOrderMaxMm) {
    achievedOrder = 'RTSD First-Order High Precision (±4√K mm)';
  } else if (absErrorMm <= secondOrderMaxMm) {
    achievedOrder = 'RTSD Second-Order Engineering (±8√K mm)';
  } else if (absErrorMm <= thirdOrderMaxMm) {
    achievedOrder = 'RTSD Third-Order Topographic (±12√K mm)';
  } else if (absErrorMm <= constructionMaxMm) {
    achievedOrder = 'Construction Grade (±24√K mm)';
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
