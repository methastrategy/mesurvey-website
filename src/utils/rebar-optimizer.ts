/**
 * rebar-optimizer.ts — 1D Cutting Stock Optimization Engine
 * Implements Best-Fit Decreasing (BFD) Bin Packing with blade kerf loss support.
 */

export interface PieceItem {
  id?: string;
  label: string;
  lengthM: number;
  quantity?: number;
  color?: string;
}

export interface PlacedCut {
  pieceId: string;
  label: string;
  lengthM: number;
  color: string;
}

export interface OptimizedStockBar {
  barIndex: number;
  stockLengthM: number;
  cuts: PlacedCut[];
  totalUsedM: number;
  totalKerfM: number;
  kerfM: number; // backward compatibility alias
  wasteM: number;
  wastePct: number;
}

export interface OptimizationResult {
  bars: OptimizedStockBar[];
  totalBars: number;
  totalStockLengthM: number;
  totalNetCutLengthM: number;
  totalKerfLossM: number;
  totalWasteM: number;
  wastePct: number;
  efficiencyPct: number;
  hasError?: boolean;
  errorMessage?: string;
}

export const REBAR_PALETTE = [
  '#0284c7', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f97316', // Orange
];

/**
 * Optimizes 1D cutting stock using Best-Fit Decreasing (BFD) algorithm.
 * @throws Error if any piece length exceeds stock length.
 */
export function optimizeRebarCuts(
  pieces: PieceItem[],
  stockLengthM: number,
  kerfMm: number = 0
): OptimizationResult {
  const kerfM = (kerfMm || 0) / 1000;

  // Validate pieces against stock length
  for (const p of pieces) {
    if (p.lengthM > stockLengthM) {
      throw new Error(`Piece length ${p.lengthM}m exceeds stock bar length ${stockLengthM}m`);
    }
  }

  // Handle empty input
  if (!pieces || pieces.length === 0) {
    return {
      bars: [],
      totalBars: 0,
      totalStockLengthM: 0,
      totalNetCutLengthM: 0,
      totalKerfLossM: 0,
      totalWasteM: 0,
      wastePct: 0,
      efficiencyPct: 0,
      hasError: false,
    };
  }

  // 1. Flatten items taking quantity into account
  interface FlatItem {
    id: string;
    label: string;
    lengthM: number;
    color: string;
  }

  const flatItems: FlatItem[] = [];
  pieces.forEach((p, pIdx) => {
    const qty = p.quantity && p.quantity > 0 ? p.quantity : 1;
    const baseId = p.id || `p${pIdx + 1}`;
    const assignedColor = p.color || REBAR_PALETTE[pIdx % REBAR_PALETTE.length];

    for (let i = 0; i < qty; i++) {
      flatItems.push({
        id: `${baseId}-${i}`,
        label: p.label,
        lengthM: p.lengthM,
        color: assignedColor,
      });
    }
  });

  if (flatItems.length === 0) {
    return {
      bars: [],
      totalBars: 0,
      totalStockLengthM: 0,
      totalNetCutLengthM: 0,
      totalKerfLossM: 0,
      totalWasteM: 0,
      wastePct: 0,
      efficiencyPct: 0,
      hasError: false,
    };
  }

  // 2. Sort descending
  flatItems.sort((a, b) => b.lengthM - a.lengthM);

  // 3. Best-Fit Decreasing (BFD)
  interface BarDraft {
    cuts: PlacedCut[];
    usedLength: number;
    kerfCount: number;
  }

  const openBars: BarDraft[] = [];

  flatItems.forEach(item => {
    let bestBarIdx = -1;
    let minRemaining = Infinity;

    for (let i = 0; i < openBars.length; i++) {
      const bar = openBars[i];
      const additionalKerf = bar.cuts.length > 0 ? kerfM : 0;
      const projected = bar.usedLength + (bar.kerfCount * kerfM) + item.lengthM + additionalKerf;
      const remaining = stockLengthM - projected;

      if (remaining >= -0.0001) {
        if (remaining < minRemaining) {
          minRemaining = remaining;
          bestBarIdx = i;
        }
      }
    }

    if (bestBarIdx !== -1) {
      const b = openBars[bestBarIdx];
      b.cuts.push({
        pieceId: item.id,
        label: item.label,
        lengthM: item.lengthM,
        color: item.color,
      });
      b.usedLength += item.lengthM;
      b.kerfCount += 1;
    } else {
      openBars.push({
        cuts: [{
          pieceId: item.id,
          label: item.label,
          lengthM: item.lengthM,
          color: item.color,
        }],
        usedLength: item.lengthM,
        kerfCount: 0,
      });
    }
  });

  // 4. Summaries
  let sumNetLength = 0;
  let sumKerfLoss = 0;
  let sumWaste = 0;

  const formattedBars: OptimizedStockBar[] = openBars.map((b, idx) => {
    const kerfTotal = Math.max(0, b.cuts.length - 1) * kerfM;
    const totalUsed = b.usedLength + kerfTotal;
    const waste = Math.max(0, stockLengthM - totalUsed);
    const wastePct = (waste / stockLengthM) * 100;

    sumNetLength += b.usedLength;
    sumKerfLoss += kerfTotal;
    sumWaste += waste;

    const roundUsed = Math.round(b.usedLength * 1000) / 1000;
    const roundKerf = Math.round(kerfTotal * 1000) / 1000;
    const roundWaste = Math.round(waste * 1000) / 1000;

    return {
      barIndex: idx + 1,
      stockLengthM,
      cuts: b.cuts,
      totalUsedM: roundUsed,
      totalKerfM: roundKerf,
      kerfM: roundKerf,
      wasteM: roundWaste,
      wastePct: Math.round(wastePct * 10) / 10,
    };
  });

  const totalBars = formattedBars.length;
  const totalStockLengthM = totalBars * stockLengthM;
  const wastePct = totalStockLengthM > 0 ? (sumWaste / totalStockLengthM) * 100 : 0;
  const efficiencyPct = 100 - wastePct;

  return {
    bars: formattedBars,
    totalBars,
    totalStockLengthM: Math.round(totalStockLengthM * 100) / 100,
    totalNetCutLengthM: Math.round(sumNetLength * 100) / 100,
    totalKerfLossM: Math.round(sumKerfLoss * 100) / 100,
    totalWasteM: Math.round(sumWaste * 100) / 100,
    wastePct: Math.round(wastePct * 10) / 10,
    efficiencyPct: Math.round(efficiencyPct * 10) / 10,
    hasError: false,
  };
}
