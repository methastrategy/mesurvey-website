import { ThaiLandArea } from '../types/survey';
import { validateSqMeters } from './validation';

/**
 * Converts Square Meters into Thai Land Units (Rai - Ngan - Wah) + International Units.
 * Rules:
 * 1 Wah^2 = 4 m^2
 * 1 Ngan = 100 Wah^2 = 400 m^2
 * 1 Rai = 4 Ngan = 400 Wah^2 = 1,600 m^2
 */
export function sqMetersToThaiLand(sqMeters: number): ThaiLandArea {
  const val = validateSqMeters(sqMeters);
  if (!val.isValid) {
    return {
      rai: 0,
      ngan: 0,
      wah: 0,
      sqMeters: isNaN(sqMeters) ? 0 : sqMeters,
      hectares: 0,
      acres: 0,
      isValid: false
    };
  }

  // Work with integer centi-wa (0.01 ตร.ว. = 0.04 ตร.ม.)
  // 1 ตร.ว. = 4 ตร.ม. => centiWa = Math.round((m2 / 4) * 100)
  // 1 งาน = 100 ตร.ว. = 10,000 centiWa
  // 1 ไร่ = 400 ตร.ว. = 40,000 centiWa
  const centiWa = Math.round((sqMeters / 4) * 100);
  const rai = Math.floor(centiWa / 40000);
  const remAfterRai = centiWa - (rai * 40000);
  const ngan = Math.floor(remAfterRai / 10000);
  const remAfterNgan = remAfterRai - (ngan * 10000);
  const wah = Number((remAfterNgan / 100).toFixed(2));

  const hectares = Number((sqMeters / 10000).toFixed(4));
  const acres = Number((sqMeters / 4046.8564).toFixed(4));

  return {
    rai,
    ngan,
    wah,
    sqMeters, // Preserve unrounded raw value
    hectares,
    acres,
    isValid: true
  };
}

/**
 * Converts Thai Land Units (Rai - Ngan - Wah) into Square Meters.
 */
export function thaiLandToSqMeters(rai: number, ngan: number, wah: number): number {
  const m2 = (Math.max(0, rai) * 1600) + (Math.max(0, ngan) * 400) + (Math.max(0, wah) * 4);
  return Number(m2.toFixed(2));
}

/**
 * Formats Thai Land Units as clean string e.g. "5 ไร่ 2 งาน 35.50 ตร.ว."
 */
export function formatThaiLandString(rai: number, ngan: number, wah: number): string {
  return `${rai} ไร่ ${ngan} งาน ${wah.toFixed(2)} ตร.ว.`;
}
