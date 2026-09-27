import { ThaiLandArea } from '../types/survey';

/**
 * Converts Square Meters into Thai Land Units (Rai - Ngan - Wah) + International Units.
 * Rules:
 * 1 Wah^2 = 4 m^2
 * 1 Ngan = 100 Wah^2 = 400 m^2
 * 1 Rai = 4 Ngan = 400 Wah^2 = 1,600 m^2
 */
export function sqMetersToThaiLand(sqMeters: number): ThaiLandArea {
  const safeM2 = Math.max(0, sqMeters);

  const rai = Math.floor(safeM2 / 1600);
  const remAfterRai = safeM2 % 1600;

  const ngan = Math.floor(remAfterRai / 400);
  const remAfterNgan = remAfterRai % 400;

  const wah = Number((remAfterNgan / 4).toFixed(2));

  const hectares = Number((safeM2 / 10000).toFixed(4));
  const acres = Number((safeM2 / 4046.8564).toFixed(4));

  return {
    rai,
    ngan,
    wah,
    sqMeters: Number(safeM2.toFixed(2)),
    hectares,
    acres
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
