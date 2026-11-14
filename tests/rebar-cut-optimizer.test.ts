import { describe, it, expect } from 'vitest';
import { optimizeRebarCuts, type PieceItem } from '../src/utils/rebar-optimizer';

describe('1D Rebar Cut Optimizer Algorithm Tests', () => {
  it('achieves 0% waste on exact factorable cuts', () => {
    // 3 pieces of 4.0m fit exactly into one 12.0m stock bar (with kerf = 0)
    const pieces: PieceItem[] = [
      { lengthM: 4.0, label: 'Piece 1' },
      { lengthM: 4.0, label: 'Piece 2' },
      { lengthM: 4.0, label: 'Piece 3' },
      { lengthM: 6.0, label: 'Piece 4' },
      { lengthM: 6.0, label: 'Piece 5' },
    ];

    const result = optimizeRebarCuts(pieces, 12.0, 0);

    // 4 + 4 + 4 = 12 (1 bar), 6 + 6 = 12 (1 bar) => exactly 2 bars!
    expect(result.totalBars).toBe(2);
    expect(result.totalStockLengthM).toBe(24.0);
    expect(result.totalNetCutLengthM).toBe(24.0);
    expect(result.totalWasteM).toBe(0);
    expect(result.wastePct).toBe(0);
  });

  it('guarantees no single stock bar exceeds stock length', () => {
    const pieces: PieceItem[] = [
      { lengthM: 4.2, label: 'B1' },
      { lengthM: 4.2, label: 'B2' },
      { lengthM: 3.5, label: 'C1' },
      { lengthM: 3.5, label: 'C2' },
      { lengthM: 2.1, label: 'F1' },
      { lengthM: 2.1, label: 'F2' },
      { lengthM: 1.2, label: 'D1' },
      { lengthM: 1.2, label: 'D2' },
    ];

    const stockLength = 10.0;
    const kerfMm = 3;
    const result = optimizeRebarCuts(pieces, stockLength, kerfMm);

    // Every bar must have (cuts + kerf) <= stockLength
    result.bars.forEach(bar => {
      const actualUsed = bar.totalUsedM + bar.kerfM;
      expect(actualUsed).toBeLessThanOrEqual(stockLength + 0.0001);
      expect(bar.wasteM).toBeGreaterThanOrEqual(0);
    });

    // All 8 pieces must be placed
    const totalPlaced = result.bars.reduce((sum, b) => sum + b.cuts.length, 0);
    expect(totalPlaced).toBe(8);
  });

  it('accounts for cutting blade kerf loss', () => {
    // Two 5.0m pieces on 10.0m bar with 5mm kerf
    // Without kerf: 5.0 + 5.0 = 10.0 (1 bar)
    // With 5mm kerf: 5.0 + 0.005 + 5.0 = 10.005 > 10.0 -> requires 2 bars!
    const pieces: PieceItem[] = [
      { lengthM: 5.0, label: 'A' },
      { lengthM: 5.0, label: 'B' },
    ];

    const resNoKerf = optimizeRebarCuts(pieces, 10.0, 0);
    expect(resNoKerf.totalBars).toBe(1);

    const resWithKerf = optimizeRebarCuts(pieces, 10.0, 5);
    expect(resWithKerf.totalBars).toBe(2);
  });

  it('throws an error if any piece exceeds stock length', () => {
    const pieces: PieceItem[] = [
      { lengthM: 11.0, label: 'Too Long' },
    ];

    expect(() => {
      optimizeRebarCuts(pieces, 10.0, 0);
    }).toThrow('Piece length 11m exceeds stock bar length 10m');
  });

  it('handles empty pieces array cleanly', () => {
    const result = optimizeRebarCuts([], 12.0, 3);
    expect(result.totalBars).toBe(0);
    expect(result.totalWasteM).toBe(0);
  });

  it('correctly expands pieces with quantity property', () => {
    const pieces: PieceItem[] = [
      { lengthM: 3.0, label: 'Main Bar', quantity: 4 }, // 4 * 3.0 = 12.0m => exactly 1 bar of 12m
    ];

    const result = optimizeRebarCuts(pieces, 12.0, 0);
    expect(result.totalBars).toBe(1);
    expect(result.bars[0].cuts.length).toBe(4);
    expect(result.totalNetCutLengthM).toBe(12.0);
    expect(result.totalWasteM).toBe(0);
  });
});
