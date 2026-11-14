import React, { useState, useMemo } from 'react';
import { 
  Scissors, 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  Layers, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { exportToCsv } from '../../utils/csv-export';
import { 
  optimizeRebarCuts, 
  type PieceItem, 
  type PlacedCut, 
  type OptimizedStockBar, 
  type OptimizationResult,
  REBAR_PALETTE as PALETTE
} from '../../utils/rebar-optimizer';

export type CutPieceRequest = PieceItem & { id: string; quantity: number };
export type { PlacedCut, OptimizedStockBar, OptimizationResult };

export const RebarCutOptimizer: React.FC = () => {
  const [stockLengthM, setStockLengthM] = useState<number>(10);
  const [kerfMm, setKerfMm] = useState<number>(3); // 3mm saw cut width
  const [pieces, setPieces] = useState<CutPieceRequest[]>([
    { id: '1', label: 'B1 คานล่าง (เหล็กแกน)', lengthM: 4.20, quantity: 8 },
    { id: '2', label: 'C1 เสาตอม่อ (เหล็กแกน)', lengthM: 3.50, quantity: 12 },
    { id: '3', label: 'F1 ฐานราก (ตะแกรงล่าง)', lengthM: 2.10, quantity: 16 },
    { id: '4', label: 'D1 เหล็กเดือยเข็ม', lengthM: 1.20, quantity: 14 },
  ]);

  const [newLabel, setNewLabel] = useState<string>('');
  const [newLength, setNewLength] = useState<string>('3.00');
  const [newQty, setNewQty] = useState<string>('4');
  const [copied, setCopied] = useState<boolean>(false);

  // Add piece handler
  const handleAddPiece = () => {
    const l = parseFloat(newLength);
    const q = parseInt(newQty, 10);
    if (!l || l <= 0 || !q || q <= 0) return;
    if (l > stockLengthM) {
      alert(`ความยาวชิ้นงาน (${l} ม.) ยาวเกินกว่าความยาวท่อนมาตรฐาน (${stockLengthM} ม.)`);
      return;
    }
    const newId = String(Date.now());
    setPieces([
      ...pieces,
      {
        id: newId,
        label: newLabel.trim() || `ชิ้นงาน #${pieces.length + 1}`,
        lengthM: Math.round(l * 100) / 100,
        quantity: q
      }
    ]);
    setNewLabel('');
  };

  const handleRemovePiece = (id: string) => {
    setPieces(pieces.filter(p => p.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('ยืนยันล้างรายการตัดเหล็กทั้งหมด?')) {
      setPieces([]);
    }
  };

  // Presets
  const applyPreset = (presetName: 'house' | 'wall' | 'zero') => {
    if (presetName === 'house') {
      setStockLengthM(10);
      setKerfMm(3);
      setPieces([
        { id: 'h1', label: 'B1 คานคอดิน', lengthM: 4.20, quantity: 8 },
        { id: 'h2', label: 'C1 เสาชั้น 1', lengthM: 3.60, quantity: 12 },
        { id: 'h3', label: 'F1 ตะแกรงฐานราก', lengthM: 2.20, quantity: 16 },
        { id: 'h4', label: 'RB เสาเอ็น-ทับหลัง', lengthM: 1.80, quantity: 10 },
      ]);
    } else if (presetName === 'wall') {
      setStockLengthM(12);
      setKerfMm(3);
      setPieces([
        { id: 'w1', label: 'Stem Wall เหล็กดิ่ง', lengthM: 5.40, quantity: 14 },
        { id: 'w2', label: 'Heel Slab ฐานราก', lengthM: 3.20, quantity: 16 },
        { id: 'w3', label: 'Toe Slab แผ่หน้า', lengthM: 1.80, quantity: 16 },
      ]);
    } else if (presetName === 'zero') {
      setStockLengthM(12);
      setKerfMm(0);
      setPieces([
        { id: 'z1', label: 'ท่อน 4.0 ม. พอดี', lengthM: 4.00, quantity: 9 },
        { id: 'z2', label: 'ท่อน 6.0 ม. พอดี', lengthM: 6.00, quantity: 6 },
      ]);
    }
  };

  // 1D Bin Packing (Best-Fit Decreasing algorithm with kerf loss)
  const optimization = useMemo(() => {
    try {
      return optimizeRebarCuts(pieces, stockLengthM, kerfMm);
    } catch (err: any) {
      return {
        bars: [],
        totalBars: 0,
        totalStockLengthM: 0,
        totalNetCutLengthM: 0,
        totalKerfLossM: 0,
        totalWasteM: 0,
        wastePct: 0,
        efficiencyPct: 0,
        hasError: true,
        errorMessage: err?.message || 'เกิดข้อผิดพลาดในการคำนวณการตัดเหล็ก'
      };
    }
  }, [pieces, stockLengthM, kerfMm]);

  // Copy Summary Handler
  const handleCopySummary = () => {
    if (!optimization || optimization.bars.length === 0) return;

    let text = `=== แผนการตัดเหล็กลดเศษ 1D Cutting Stock Optimization ===\n`;
    text += `ขนาดเหล็กมาตรฐาน: ${stockLengthM} เมตร | ความหนาใบตัด Kerf: ${kerfMm} มม.\n`;
    text += `จำนวนท่อนมาตรฐานที่ต้องใช้: ${optimization.totalBars} ท่อน (${optimization.totalStockLengthM} ม.)\n`;
    text += `ความยาวชิ้นงานสุทธิ: ${optimization.totalNetCutLengthM} ม.\n`;
    text += `เศษสูญเสียรวม (Waste): ${optimization.totalWasteM} ม. (${optimization.wastePct}%)\n`;
    text += `ประสิทธิภาพการใช้งาน (Efficiency): ${optimization.efficiencyPct}%\n\n`;
    text += `--- รายละเอียดการตัดทีละท่อน ---\n`;

    optimization.bars.forEach(bar => {
      const cutsStr = bar.cuts.map(c => `${c.lengthM.toFixed(2)}m [${c.label}]`).join(' + ');
      text += `ท่อน #${bar.barIndex}: ${cutsStr} | ใช้ไป: ${bar.totalUsedM.toFixed(2)}m | เศษเหลือ: ${bar.wasteM.toFixed(2)}m (${bar.wastePct}%)\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // CSV Export
  const handleExportCsv = () => {
    if (!optimization || optimization.bars.length === 0) return;

    const headers = [
      'Bar #',
      'Stock Length (m)',
      'Cut Sequence',
      'Member Mark',
      'Cut Length (m)',
      'Bar Total Used (m)',
      'Bar Waste (m)',
      'Waste %'
    ];

    const rows: (string | number)[][] = [];
    optimization.bars.forEach(bar => {
      bar.cuts.forEach((cut, cutIdx) => {
        rows.push([
          bar.barIndex,
          bar.stockLengthM,
          cutIdx + 1,
          cut.label,
          cut.lengthM,
          bar.totalUsedM,
          bar.wasteM,
          `${bar.wastePct}%`,
        ]);
      });
    });

    exportToCsv({
      filename: `Rebar_Cutting_Schedule_${stockLengthM}M.csv`,
      headers,
      rows,
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Sub-header Banner ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] font-semibold">
              CALC-OPTIMIZE • 1D Cutting Stock Optimizer
            </span>
            <span className="text-xs text-[var(--text-3)] font-mono">อัลกอริทึม Best-Fit Decreasing (BFD)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-1)] mt-1">
            แผนผังการตัดเหล็กลดเศษ (1D Rebar Cut Optimizer)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-2)] mt-0.5 max-w-3xl">
            จัดเรียงรายการตัดเหล็กข้ออ้อยและเหล็กกลมลงในท่อนมาตรฐาน 10.0 ม. หรือ 12.0 ม. เพื่อลดเศษเหล็กสูญเสีย (Waste %) ให้อยู่ในระดับต่ำที่สุด
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleCopySummary}
            disabled={optimization.bars.length === 0}
            className="btn-outline min-h-[38px] text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกผล'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={optimization.bars.length === 0}
            className="btn-outline min-h-[38px] text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV แผนตัด</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner if any ── */}
      {optimization.hasError && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{optimization.errorMessage}</span>
        </div>
      )}

      {/* ── 2-Column Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Stock Settings & Cut List Input (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Stock Config Card */}
          <div className="fusion-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-bold text-[var(--text-1)] flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[var(--accent)]" />
                <span>การตั้งค่าท่อนมาตรฐาน & ใบตัด (Stock Bar Settings)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-[var(--text-2)] block mb-1">
                  ความยาวท่อนมาตรฐาน (Stock)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStockLengthM(10)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                      stockLengthM === 10
                        ? 'bg-[var(--accent)] text-black dark:text-white border-[var(--accent)]'
                        : 'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)]'
                    }`}
                  >
                    10.0 ม.
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockLengthM(12)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                      stockLengthM === 12
                        ? 'bg-[var(--accent)] text-black dark:text-white border-[var(--accent)]'
                        : 'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)]'
                    }`}
                  >
                    12.0 ม.
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-2)] block mb-1">
                  ความกว้างใบตัด Kerf (มม.)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  value={kerfMm}
                  onChange={e => setKerfMm(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs"
                />
              </div>
            </div>

            {/* Presets Quick Load */}
            <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
              <span className="text-[10px] font-mono text-[var(--text-3)] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>โหลดชุดตัวอย่างทดสอบด่วน (Quick Presets):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('house')}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--text-2)]"
                >
                  งานคาน-เสาบ้าน 2 ชั้น
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('wall')}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--text-2)]"
                >
                  กำแพงกันดิน 12m
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('zero')}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--text-2)]"
                >
                  Zero Waste ทดสอบพอดี
                </button>
              </div>
            </div>
          </div>

          {/* Add Piece Form & Cut List Table */}
          <div className="fusion-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-bold text-[var(--text-1)] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[var(--accent)]" />
                <span>รายการชิ้นเหล็กที่ต้องการตัด (Cut List)</span>
              </span>
              {pieces.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] text-rose-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>ล้างตาราง</span>
                </button>
              )}
            </div>

            {/* Input Row */}
            <div className="space-y-2 p-3 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
              <span className="text-[11px] font-semibold text-[var(--text-1)] block">
                + เพิ่มรายการชิ้นงานใหม่
              </span>
              <div className="grid grid-cols-12 gap-2 text-xs">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="รหัส/ชื่อชิ้นส่วน เช่น B1 บน"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-1)] text-xs"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max={stockLengthM}
                    value={newLength}
                    onChange={e => setNewLength(e.target.value)}
                    placeholder="ยาว (ม.)"
                    className="w-full px-2 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs text-center"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newQty}
                    onChange={e => setNewQty(e.target.value)}
                    placeholder="จำนวน"
                    className="w-full px-1.5 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs text-center"
                  />
                </div>
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={handleAddPiece}
                    className="w-full py-1.5 rounded-lg bg-[var(--accent)] text-black dark:text-white font-bold text-xs flex items-center justify-center hover:opacity-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Pieces Table */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
              {pieces.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-[var(--text-1)] block truncate">
                        {p.label}
                      </span>
                      <span className="text-[10px] text-[var(--text-3)] font-mono">
                        ความยาว {p.lengthM.toFixed(2)} ม.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-mono font-bold text-[var(--text-1)]">
                      {p.quantity} ชิ้น
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePiece(p.id)}
                      className="p-1 text-[var(--text-3)] hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Optimization Dashboard & Bar Patterns (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="fusion-card p-3 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-3)] block uppercase">สั่งซื้อเหล็กมาตรฐาน</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-[var(--accent)]">
                {optimization.totalBars}
              </span>
              <span className="text-[10px] text-[var(--text-3)] font-mono block">ท่อน ({stockLengthM}m)</span>
            </div>

            <div className="fusion-card p-3 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-3)] block uppercase">ความยาวสุทธิ</span>
              <span className="text-lg sm:text-xl font-bold font-mono text-[var(--text-1)]">
                {optimization.totalNetCutLengthM}
              </span>
              <span className="text-[10px] text-[var(--text-3)] font-mono block">เมตร</span>
            </div>

            <div className="fusion-card p-3 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-3)] block uppercase">เศษสูญเสีย (Waste)</span>
              <span className={`text-lg sm:text-xl font-bold font-mono ${optimization.wastePct > 10 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {optimization.totalWasteM} m
              </span>
              <span className="text-[10px] font-mono text-[var(--text-2)] block">{optimization.wastePct}%</span>
            </div>

            <div className="fusion-card p-3 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-3)] block uppercase">ประสิทธิภาพ (Yield)</span>
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-500">
                {optimization.efficiencyPct}%
              </span>
              <span className="text-[10px] text-[var(--text-3)] font-mono block"> utilization</span>
            </div>
          </div>

          {/* Visual Bar-by-bar Cut Patterns */}
          <div className="fusion-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-bold text-[var(--text-1)] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
                <span>แผนผังแสดงจุดตัดทีละท่อน (Bar-by-Bar Visual Cutting Layout)</span>
              </span>
              <span className="text-[10px] font-mono text-[var(--text-3)]">
                {optimization.bars.length} ท่อน
              </span>
            </div>

            {optimization.bars.length > 0 ? (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                {optimization.bars.map((bar) => (
                  <div
                    key={bar.barIndex}
                    className="p-3 rounded-xl bg-[var(--surface-2)]/70 border border-[var(--border)] space-y-2 text-xs"
                  >
                    {/* Bar Header */}
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--accent)] px-1.5 py-0.2 rounded bg-[var(--surface)] border border-[var(--border)]">
                          ท่อน #{bar.barIndex}
                        </span>
                        <span className="text-[var(--text-2)]">
                          {bar.cuts.length} ชิ้นงาน
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-3)]">
                        <span>ใช้ไป {bar.totalUsedM.toFixed(2)}m</span>
                        <span className={bar.wasteM > 1.0 ? 'text-amber-500 font-semibold' : 'text-emerald-500'}>
                          • เศษเหลือ {bar.wasteM.toFixed(2)}m ({bar.wastePct}%)
                        </span>
                      </div>
                    </div>

                    {/* Segmented Visual Bar */}
                    <div className="w-full h-8 rounded-lg overflow-hidden flex bg-[var(--surface)] border border-[var(--border)] relative shadow-inner">
                      {bar.cuts.map((cut, cutIdx) => {
                        const widthPct = (cut.lengthM / bar.stockLengthM) * 100;
                        return (
                          <div
                            key={cutIdx}
                            style={{ width: `${widthPct}%`, backgroundColor: cut.color }}
                            title={`${cut.label}: ${cut.lengthM}m`}
                            className="h-full border-r border-black/30 flex items-center justify-center px-1 text-[10px] font-bold text-white truncate transition-all hover:brightness-110 select-none"
                          >
                            <span className="truncate drop-shadow-sm">
                              {cut.lengthM.toFixed(2)}m {widthPct > 15 ? `[${cut.label}]` : ''}
                            </span>
                          </div>
                        );
                      })}

                      {/* Waste Portion */}
                      {bar.wasteM > 0.001 && (
                        <div
                          style={{ width: `${(bar.wasteM / bar.stockLengthM) * 100}%` }}
                          title={`เศษเหลือ: ${bar.wasteM.toFixed(2)}m`}
                          className="h-full bg-stripes flex items-center justify-center px-1 text-[9px] font-mono text-[var(--text-3)] font-semibold select-none truncate"
                        >
                          <span className="truncate">{bar.wasteM.toFixed(2)}m</span>
                        </div>
                      )}
                    </div>

                    {/* Cut breakdown text pills */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {bar.cuts.map((c, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)]"
                        >
                          #{i + 1}: {c.lengthM.toFixed(2)}m ({c.label})
                        </span>
                      ))}
                      {bar.wasteM > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          เศษเหลือ: {bar.wasteM.toFixed(2)}m
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[var(--text-3)] space-y-2">
                <Scissors className="w-8 h-8 mx-auto opacity-40 text-[var(--text-3)]" />
                <p>ยังไม่มีรายการชิ้นเหล็ก กรุณาเพิ่มชิ้นงานในตารางด้านซ้ายหรือกดเลือกชุดตัวอย่างทดสอบด่วน</p>
              </div>
            )}

            {/* Pro-Tip Box */}
            <div className="p-3 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)] text-[11px] text-[var(--text-2)] flex items-start gap-2">
              <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>เคล็ดลับหน้างาน:</strong> เศษเหล็กที่เหลือเกิน 1.0 - 1.5 เมตร สามารถนำไปใช้ทำเป็นเหล็กเดือยเข็ม (Dowel Bar), เหล็กเสริมมุม หรือหนวดกุ้งยึดผนังก่ออิฐได้ อย่าเพิ่งทิ้งลงกองเศษเหล็ก
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RebarCutOptimizer;
