import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Info,
  Sliders,
  Scale
} from 'lucide-react';
import { exportToCsv } from '../../utils/csv-export';

export interface RebarSpec {
  code: string;
  diameterMm: number;
  type: 'round' | 'deformed';
  nominalWeightKgM: number;
}

export const THAI_REBAR_SPECS: Record<string, RebarSpec> = {
  'RB6': { code: 'RB6', diameterMm: 6, type: 'round', nominalWeightKgM: 0.222 },
  'RB9': { code: 'RB9', diameterMm: 9, type: 'round', nominalWeightKgM: 0.499 },
  'DB12': { code: 'DB12', diameterMm: 12, type: 'deformed', nominalWeightKgM: 0.888 },
  'DB16': { code: 'DB16', diameterMm: 16, type: 'deformed', nominalWeightKgM: 1.580 },
  'DB20': { code: 'DB20', diameterMm: 20, type: 'deformed', nominalWeightKgM: 2.470 },
  'DB25': { code: 'DB25', diameterMm: 25, type: 'deformed', nominalWeightKgM: 3.850 },
  'DB28': { code: 'DB28', diameterMm: 28, type: 'deformed', nominalWeightKgM: 4.830 },
  'DB32': { code: 'DB32', diameterMm: 32, type: 'deformed', nominalWeightKgM: 6.310 },
};

export interface BbsItem {
  id: string;
  memberLabel: string;
  barCode: string;
  lengthPerBarM: number;
  quantityPieces: number;
}

export const SAMPLE_BBS_ITEMS: BbsItem[] = [
  { id: '1', memberLabel: 'F1 ฐานราก (เหล็กแกนล่าง)', barCode: 'DB16', lengthPerBarM: 2.5, quantityPieces: 40 },
  { id: '2', memberLabel: 'C1 เสาตอม่อ (เหล็กแกนเสา)', barCode: 'DB20', lengthPerBarM: 4.0, quantityPieces: 24 },
  { id: '3', memberLabel: 'C1 เหล็กปลอกเสา', barCode: 'RB9', lengthPerBarM: 1.1, quantityPieces: 60 },
  { id: '4', memberLabel: 'B1 คานคอดิน (เหล็กบน-ล่าง)', barCode: 'DB16', lengthPerBarM: 6.0, quantityPieces: 32 },
];

export const RebarCalculator: React.FC = () => {
  // Quick Converter State
  const [selectedBar, setSelectedBar] = useState<string>('DB16');
  const [customLengthM, setCustomLengthM] = useState<string>('10');
  const [customQuantity, setCustomQuantity] = useState<string>('100');
  const [wastePercent, setWastePercent] = useState<number>(5);
  const [lapType, setLapType] = useState<'tension-b' | 'tension-a' | 'compression'>('tension-b');
  const [isTopBar, setIsTopBar] = useState<boolean>(false);

  // BBS Table State (Blank Slate Default)
  const [bbsItems, setBbsItems] = useState<BbsItem[]>([]);

  const loadSampleBbs = () => {
    setBbsItems(SAMPLE_BBS_ITEMS);
  };

  const [newLabel, setNewLabel] = useState<string>('');
  const [newBar, setNewBar] = useState<string>('DB16');
  const [newLength, setNewLength] = useState<string>('5.0');
  const [newQty, setNewQty] = useState<string>('10');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Quick Calculator calculations
  const spec = THAI_REBAR_SPECS[selectedBar] || THAI_REBAR_SPECS['DB16'];
  const len = parseFloat(customLengthM) || 0;
  const qty = parseInt(customQuantity, 10) || 0;
  const rawWeightKg = len * qty * spec.nominalWeightKgM;
  const withWasteWeightKg = rawWeightKg * (1 + wastePercent / 100);
  const withWasteTons = withWasteWeightKg / 1000;

  // Lap Length calculation (วสท. / ACI standard)
  const lapLengthCm = useMemo(() => {
    const d = spec.diameterMm / 10; // cm
    let factor = 48; // Tension Class B default
    if (lapType === 'tension-a') factor = 36;
    if (lapType === 'compression') factor = 30;

    let lap = factor * d;
    if (isTopBar && lapType !== 'compression') {
      lap *= 1.3;
    }
    return Math.max(30, Math.round(lap * 10) / 10);
  }, [spec, lapType, isTopBar]);

  // BBS Total calculations
  const bbsSummary = useMemo(() => {
    let totalKg = 0;
    const byBarType: Record<string, { totalMeters: number; weightKg: number }> = {};

    bbsItems.forEach(item => {
      const itemSpec = THAI_REBAR_SPECS[item.barCode];
      if (!itemSpec) return;
      const meters = item.lengthPerBarM * item.quantityPieces;
      const kg = meters * itemSpec.nominalWeightKgM;

      totalKg += kg;
      if (!byBarType[item.barCode]) {
        byBarType[item.barCode] = { totalMeters: 0, weightKg: 0 };
      }
      byBarType[item.barCode].totalMeters += meters;
      byBarType[item.barCode].weightKg += kg;
    });

    const totalWithWasteKg = totalKg * (1 + wastePercent / 100);
    return {
      totalKg,
      totalWithWasteKg,
      totalTons: totalWithWasteKg / 1000,
      byBarType
    };
  }, [bbsItems, wastePercent]);

  const handleAddBbsItem = () => {
    if (!newLabel.trim()) return;
    const l = parseFloat(newLength) || 1;
    const q = parseInt(newQty, 10) || 1;
    setBbsItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        memberLabel: newLabel.trim(),
        barCode: newBar,
        lengthPerBarM: l,
        quantityPieces: q
      }
    ]);
    setNewLabel('');
  };

  const handleRemoveBbsItem = (id: string) => {
    setBbsItems(prev => prev.filter(item => item.id !== id));
  };

  const handleExportCsv = () => {
    const headers = ['Member_Label', 'Bar_Size', 'Diameter_mm', 'Length_m', 'Quantity_pcs', 'Total_Length_m', 'Total_Weight_kg'];
    const rows = bbsItems.map(item => {
      const itemSpec = THAI_REBAR_SPECS[item.barCode];
      const totM = item.lengthPerBarM * item.quantityPieces;
      const kg = totM * (itemSpec ? itemSpec.nominalWeightKgM : 0);
      return [
        item.memberLabel,
        item.barCode,
        itemSpec ? itemSpec.diameterMm : 0,
        item.lengthPerBarM.toFixed(2),
        item.quantityPieces,
        totM.toFixed(2),
        kg.toFixed(2)
      ];
    });
    exportToCsv({
      filename: `Rebar_BBS_Schedule_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows,
    });
  };

  const handleCopyBbs = () => {
    const header = "ชิ้นส่วน\tขนาดเหล็ก\tความยาว/ท่อน (ม.)\tจำนวน (เส้น)\tความยาวรวม (ม.)\tน้ำหนักรวม (กก.)\n";
    const rows = bbsItems.map(item => {
      const itemSpec = THAI_REBAR_SPECS[item.barCode];
      const totM = item.lengthPerBarM * item.quantityPieces;
      const kg = totM * (itemSpec ? itemSpec.nominalWeightKgM : 0);
      return `${item.memberLabel}\t${item.barCode}\t${item.lengthPerBarM}\t${item.quantityPieces}\t${totM.toFixed(2)}\t${kg.toFixed(2)}`;
    }).join("\n");
    navigator.clipboard.writeText(header + rows);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)] font-semibold">
              CALC-08 • REBAR & STRUCTURAL TAKEOFF
            </span>
            <span className="text-xs text-[var(--text-3)] font-mono">TIS 24-2559 / FENGYUN BBS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-1)] mt-1">
            คำนวณน้ำหนักเหล็ก & ระยะทาบ (Rebar Weight & Lap Length)
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-2)] mt-0.5">
            แปลงเบอร์เหล็กเส้น มอก. (RB6-DB32) เป็นน้ำหนักตามสูตร $W = d^2/162$ กก./ม. คำนวณระยะทาบมาตรฐาน วสท./ACI และสรุปบัญชีตัดเหล็ก (BBS)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[var(--text-2)] flex items-center gap-1.5 bg-[var(--surface-2)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
            <Sliders className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>เผื่อเศษ (Waste):</span>
            <select
              value={wastePercent}
              onChange={e => setWastePercent(parseInt(e.target.value, 10))}
              className="bg-transparent font-mono text-xs font-bold text-[var(--accent)] focus:outline-none"
            >
              <option value="0">0%</option>
              <option value="3">+3%</option>
              <option value="5">+5% (มาตรฐาน)</option>
              <option value="7">+7%</option>
              <option value="10">+10%</option>
            </select>
          </label>
        </div>
      </div>

      {/* ── Section 1: Quick Calculator & Lap Length ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Quick Weight Calculator (6 cols) */}
        <div className="lg:col-span-6 fusion-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[var(--accent)]" />
              <span>คำนวณน้ำหนักเหล็กด่วน (Single Size Calculator)</span>
            </h2>
            <span className="text-xs font-mono text-[var(--accent)] font-semibold">
              {spec.nominalWeightKgM.toFixed(3)} kg/m
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                ขนาดเหล็ก มอก.
              </label>
              <select
                value={selectedBar}
                onChange={e => setSelectedBar(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
              >
                {Object.keys(THAI_REBAR_SPECS).map(code => (
                  <option key={code} value={code}>
                    {code} ({THAI_REBAR_SPECS[code].diameterMm} mm)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                ความยาว/เส้น (ม.)
              </label>
              <input
                type="number"
                step="any"
                value={customLengthM}
                onChange={e => setCustomLengthM(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm focus:outline-none focus:border-[var(--accent)]"
                placeholder="10 หรือ 12"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                จำนวน (ท่อน/เส้น)
              </label>
              <input
                type="number"
                value={customQuantity}
                onChange={e => setCustomQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm focus:outline-none focus:border-[var(--accent)]"
                placeholder="จำนวนเส้น"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[11px] font-mono text-[var(--text-3)] font-semibold block">น้ำหนักสุทธิ (NET)</span>
              <span className="font-mono text-lg font-bold text-[var(--text-1)]">
                {rawWeightKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className="text-xs text-[var(--text-3)] ml-1">กก.</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[11px] font-mono text-[var(--accent)] font-semibold block">
                รวมเผื่อเศษ (+{wastePercent}%)
              </span>
              <span className="font-mono text-lg font-bold text-[var(--accent)]">
                {withWasteTons.toFixed(3)}
              </span>
              <span className="text-xs text-[var(--text-3)] ml-1">ตัน ({withWasteWeightKg.toFixed(0)} กก.)</span>
            </div>
          </div>
        </div>

        {/* Lap Length Spec (6 cols) */}
        <div className="lg:col-span-6 fusion-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--accent)]" />
              <span>ระยะทาบเหล็กตามมาตรฐาน วสท. / ACI (Lap Splice)</span>
            </h2>
            <span className="text-xs font-mono text-[var(--text-3)]">
              {spec.code}
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                  ประเภทแรงที่รับ (Load Condition)
                </label>
                <select
                  value={lapType}
                  onChange={e => setLapType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] text-xs font-semibold focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="tension-b">แรงดึง Class B (48d) - คาน/พื้นทั่วไป</option>
                  <option value="tension-a">แรงดึง Class A (36d) - ข้อต่อสลับ</option>
                  <option value="compression">แรงอัด Compression (30d) - เสา</option>
                </select>
              </div>

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text-2)] select-none">
                  <input
                    type="checkbox"
                    checked={isTopBar}
                    onChange={e => setIsTopBar(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--accent)] focus:ring-0"
                  />
                  <span>เหล็กบน (Top Bar เทคอนกรีตหนา &gt; 30 ซม. × 1.3)</span>
                </label>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--text-3)] block">ระยะทาบขั้นต่ำที่ต้องเผื่อหน้างาน</span>
                <span className="text-sm font-bold text-[var(--text-1)]">
                  สำหรับ {spec.code} (Ø {spec.diameterMm} มม.)
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-bold text-[var(--accent)]">
                  {lapLengthCm.toFixed(1)}
                </span>
                <span className="text-xs text-[var(--text-3)] ml-1 font-mono">ซม. ({(lapLengthCm / 100).toFixed(2)} ม.)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Bar Bending Schedule (BBS) Table ── */}
      <div className="fusion-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--accent)]" />
              <span>บัญชีรายการตัดเหล็ก (Bar Bending Schedule - BBS)</span>
            </h2>
            <p className="text-xs text-[var(--text-3)] font-mono mt-0.5">
              รวมปริมาณเหล็กโครงสร้างทั้งหมดแยกตามชิ้นส่วน เพื่อสั่งซื้อและวางแผนตัดเหล็ก
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={loadSampleBbs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors shadow-xs cursor-pointer"
              title="โหลดชุดข้อมูลตัวอย่างชิ้นส่วนโครงสร้าง BBS"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>⚡ โหลดตัวอย่าง BBS</span>
            </button>
            <button
              onClick={handleCopyBbs}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] transition-colors cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอกตาราง'}</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-black dark:text-white font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* Add Item Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
          <div className="sm:col-span-5">
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="ชื่อชิ้นส่วน เช่น B2 คานชั้น 2 (เหล็กล่าง)"
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-1)] text-xs focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="sm:col-span-2">
            <select
              value={newBar}
              onChange={e => setNewBar(e.target.value)}
              className="w-full px-2 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs font-bold focus:outline-none focus:border-[var(--accent)]"
            >
              {Object.keys(THAI_REBAR_SPECS).map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <input
              type="number"
              step="any"
              value={newLength}
              onChange={e => setNewLength(e.target.value)}
              placeholder="ยาว/ท่อน (ม.)"
              className="w-full px-2.5 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="number"
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
              placeholder="จำนวนเส้น"
              className="w-full px-2.5 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="sm:col-span-1">
            <button
              onClick={handleAddBbsItem}
              className="w-full h-full min-h-[36px] flex items-center justify-center rounded-lg bg-[var(--accent)] text-black dark:text-white font-bold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BBS Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-3)] bg-[var(--surface-2)]">
                <th className="py-2.5 px-3 font-semibold">ชิ้นส่วนโครงสร้าง (MEMBER)</th>
                <th className="py-2.5 px-3 font-semibold text-center">ขนาดเหล็ก</th>
                <th className="py-2.5 px-3 font-semibold text-right">ยาว/ท่อน (m)</th>
                <th className="py-2.5 px-3 font-semibold text-right">จำนวน (เส้น)</th>
                <th className="py-2.5 px-3 font-semibold text-right">ความยาวรวม (m)</th>
                <th className="py-2.5 px-3 font-semibold text-right">น้ำหนักรวม (kg)</th>
                <th className="py-2.5 px-3 font-semibold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {bbsItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3 font-sans">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-500 shadow-xs">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-[var(--text-1)]">
                          ยังไม่มีรายการในบัญชีตัดเหล็ก (Empty BBS Worksheet)
                        </h4>
                        <p className="text-xs text-[var(--text-2)] leading-relaxed">
                          เพิ่มรายการชิ้นส่วนโครงสร้างด้วยแถบด้านบน หรือคลิกโหลดชุดตัวอย่าง BBS สำหรับทดสอบทันที
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={loadSampleBbs}
                          className="btn-primary min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer font-sans"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>⚡ โหลดตัวอย่าง BBS (Load Sample BBS)</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                bbsItems.map(item => {
                  const itemSpec = THAI_REBAR_SPECS[item.barCode];
                  const totM = item.lengthPerBarM * item.quantityPieces;
                  const kg = totM * (itemSpec ? itemSpec.nominalWeightKgM : 0);

                  return (
                    <tr key={item.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="py-2.5 px-3 text-[var(--text-1)] font-sans font-medium">{item.memberLabel}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)] font-bold">
                          {item.barCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-[var(--text-1)]">{item.lengthPerBarM.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--text-1)]">{item.quantityPieces}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--text-1)]">{totM.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--text-1)] font-bold">{kg.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleRemoveBbsItem(item.id)}
                          className="p-1 rounded text-[var(--text-3)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* BBS Summary Footer Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[var(--border)]">
          <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-[11px] font-mono text-[var(--text-3)] font-semibold block">น้ำหนักสุทธิทั้งหมด</span>
            <p className="text-xl font-bold font-mono text-[var(--text-1)]">
              {bbsSummary.totalKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              <span className="text-xs font-normal text-[var(--text-3)] ml-1">กก.</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-[11px] font-mono text-[var(--text-3)] font-semibold block">
              รวมเผื่อเศษ (+{wastePercent}%)
            </span>
            <p className="text-xl font-bold font-mono text-[var(--text-1)]">
              {bbsSummary.totalWithWasteKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              <span className="text-xs font-normal text-[var(--text-3)] ml-1">กก.</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--accent)] bg-[var(--accent)]/5">
            <span className="text-[11px] font-mono text-[var(--accent)] font-semibold block">
              น้ำหนักสำหรับสั่งซื้อ (TOTAL METRIC TONS)
            </span>
            <p className="text-2xl font-bold font-mono text-[var(--accent)]">
              {bbsSummary.totalTons.toFixed(3)}
              <span className="text-xs font-normal text-[var(--text-3)] ml-1">ตัน</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
