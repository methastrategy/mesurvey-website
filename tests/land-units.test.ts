import { describe, it, expect } from 'vitest';
import { sqMetersToThaiLand, thaiLandToSqMeters, formatThaiLandString } from '../src/core/land-units';

describe('Thai Land Units Calculation & Rounding Invariance (land-units.ts)', () => {
  it('correctly handles zero and near-zero areas', () => {
    const zero = sqMetersToThaiLand(0);
    expect(zero.rai).toBe(0);
    expect(zero.ngan).toBe(0);
    expect(zero.wah).toBe(0);

    const small = sqMetersToThaiLand(0.01);
    expect(small.rai).toBe(0);
    expect(small.ngan).toBe(0);
    expect(small.wah).toBe(0);
  });

  it('correctly carries over 399.99 m² to 1 Ngan instead of 100 Wah (Carry Invariance)', () => {
    // 399.99 m² should round to 100.00 Wah -> carries to 1 Ngan 0.00 Wah
    const res = sqMetersToThaiLand(399.99);
    expect(res.rai).toBe(0);
    expect(res.ngan).toBe(1);
    expect(res.wah).toBe(0);
    expect(formatThaiLandString(res.rai, res.ngan, res.wah)).toBe('0 ไร่ 1 งาน 0.00 ตร.ว.');
  });

  it('correctly carries over 1599.99 m² to 1 Rai instead of 4 Ngan (Carry Invariance)', () => {
    // 1599.99 m² should round to 400.00 Wah -> carries to 1 Rai 0 Ngan 0.00 Wah
    const res = sqMetersToThaiLand(1599.99);
    expect(res.rai).toBe(1);
    expect(res.ngan).toBe(0);
    expect(res.wah).toBe(0);
    expect(formatThaiLandString(res.rai, res.ngan, res.wah)).toBe('1 ไร่ 0 งาน 0.00 ตร.ว.');
  });

  it('handles exact benchmarks (400 m², 1600 m²)', () => {
    const oneNgan = sqMetersToThaiLand(400);
    expect(oneNgan.rai).toBe(0);
    expect(oneNgan.ngan).toBe(1);
    expect(oneNgan.wah).toBe(0);

    const oneRai = sqMetersToThaiLand(1600);
    expect(oneRai.rai).toBe(1);
    expect(oneRai.ngan).toBe(0);
    expect(oneRai.wah).toBe(0);

    const oneRaiJustAbove = sqMetersToThaiLand(1600.01);
    expect(oneRaiJustAbove.rai).toBe(1);
    expect(oneRaiJustAbove.ngan).toBe(0);
    expect(oneRaiJustAbove.wah).toBe(0);
  });

  it('handles large real-world cadastral areas', () => {
    // 100,000 m² = 62.5 Rai = 62 Rai 2 Ngan 0 Wah
    const large = sqMetersToThaiLand(100000);
    expect(large.rai).toBe(62);
    expect(large.ngan).toBe(2);
    expect(large.wah).toBe(0);
  });

  it('safely guards against NaN, Infinity, and negative values', () => {
    const nanRes = sqMetersToThaiLand(NaN);
    expect(nanRes.isValid).toBe(false);
    expect(nanRes.rai).toBe(0);
    expect(nanRes.ngan).toBe(0);
    expect(nanRes.wah).toBe(0);

    const infRes = sqMetersToThaiLand(Infinity);
    expect(infRes.isValid).toBe(false);
    expect(infRes.rai).toBe(0);

    const negRes = sqMetersToThaiLand(-500);
    expect(negRes.isValid).toBe(false);
    expect(negRes.rai).toBe(0);
  });

  it('preserves raw unrounded square meters for high precision operations', () => {
    const rawVal = 1234.56789;
    const res = sqMetersToThaiLand(rawVal);
    expect(res.isValid).toBe(true);
    expect(res.sqMeters).toBe(rawVal);
  });

  it('performs lossless round-trip for exact Thai land measurements', () => {
    const m2 = thaiLandToSqMeters(5, 2, 35.5);
    // 5 * 1600 + 2 * 400 + 35.5 * 4 = 8000 + 800 + 142 = 8942
    expect(m2).toBe(8942);

    const back = sqMetersToThaiLand(m2);
    expect(back.rai).toBe(5);
    expect(back.ngan).toBe(2);
    expect(back.wah).toBe(35.5);
  });
});
