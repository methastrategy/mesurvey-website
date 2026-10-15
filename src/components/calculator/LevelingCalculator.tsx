import React, { useState, useMemo } from 'react';
import { calculateLevelingLoop } from '../../core/leveling';
import { useSurveyStore } from '../../store/useSurveyStore';
import {
  Plus, Trash2, RotateCcw, CheckCircle2, XCircle, AlertCircle,
  Download, Save, Eraser, BookOpen, AlertTriangle, ChevronDown, ChevronUp,
  FileSpreadsheet, HelpCircle, Info, Upload
} from 'lucide-react';
import { trackEvent } from '../../lib/telemetry';
import { exportToCsv } from '../../utils/csv-export';
import {
  downloadLevelingTemplateCsv,
  downloadLevelingFieldbookTemplateCsv,
  parseLevelingFieldbookCsv
} from '../../utils/survey-csv-parser';

import { type StadiaRowInput } from '../../types/survey';

type LevelingMode = 'hi' | 'stadia';

// ── Stadia 3-Wire row type ──────────────────────────────────────────────
export type StadiaRow = StadiaRowInput;

function makeStadiaRow(station = '', id?: string): StadiaRow {
  return {
    id: id ?? crypto.randomUUID(),
    station,
    bsTop: '', bsMid: '', bsBot: '',
    fsTop: '', fsMid: '', fsBot: '',
    remark: '',
  };
}

const SAMPLE_STADIA: StadiaRow[] = [
  { id: '1', station: 'BM1', bsTop: '1.628', bsMid: '1.512', bsBot: '1.396', fsTop: '', fsMid: '', fsBot: '', remark: 'หมุดเริ่มต้น' },
  { id: '2', station: 'TP1', bsTop: '1.483', bsMid: '1.374', bsBot: '1.265', fsTop: '1.923', fsMid: '1.811', fsBot: '1.699', remark: '' },
  { id: '3', station: 'TP2', bsTop: '1.722', bsMid: '1.605', bsBot: '1.488', fsTop: '1.612', fsMid: '1.497', fsBot: '1.382', remark: '' },
  { id: '4', station: 'BM2', bsTop: '', bsMid: '', bsBot: '', fsTop: '1.543', fsMid: '1.428', fsBot: '1.313', remark: 'หมุดปลาย' },
];

function fmtN(v: number | null | undefined, d = 3): string {
  if (v === null || v === undefined || isNaN(v as number)) return '—';
  return (v as number).toFixed(d);
}

// ── 3-Wire computation ────────────────────────────────────────────────────────
interface StadiaRowResult {
  station: string;
  bsDist: number | null;
  fsDist: number | null;
  totalDist: number | null;
  bsMid: number | null;
  fsMid: number | null;
  bsMidOk: boolean; fsMidOk: boolean;
  hi: number | null;
  elevation: number;
  rise: number | null;
  fall: number | null;
  remark: string;
}

interface StadiaResult {
  rows: StadiaRowResult[];
  sumBs: number; sumFs: number;
  diffBsFs: number;
  totalDist: number;
  closureErrorMm: number;
  closureErrorMeters: number;
  arithmeticCheckPassed: boolean;
  orderCompliance: {
    achievedOrder: string;
    firstOrderMaxMm: string;
    secondOrderMaxMm: string;
    thirdOrderMaxMm: string;
    constructionMaxMm: string;
  };
  midCheckWarnings: string[];
}

function p(s: string): number | null {
  const v = parseFloat(s);
  return isNaN(v) || s.trim() === '' ? null : v;
}

function computeStadia(rows: StadiaRow[], startElev: number, totalDistKm: number): StadiaResult {
  const midTol = 0.002; // 2 mm check
  const midCheckWarnings: string[] = [];
  const resultRows: StadiaRowResult[] = [];

  let currentHI: number | null = null;
  let currentElev = startElev;
  let sumBs = 0;
  let sumFs = 0;
  let totalDist = 0;
  let prevElev = startElev;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const bsT = p(r.bsTop), bsM = p(r.bsMid), bsB = p(r.bsBot);
    const fsT = p(r.fsTop), fsM = p(r.fsMid), fsB = p(r.fsBot);

    const hasBS = bsT !== null && bsM !== null && bsB !== null;
    const hasFS = fsT !== null && fsM !== null && fsB !== null;

    let bsDist: number | null = null;
    let fsDist: number | null = null;
    let bsMidOk = true;
    let fsMidOk = true;

    if (hasBS) {
      bsDist = Math.abs(bsT! - bsB!) * 100;
      totalDist += bsDist;
      const bsMidExpected = (bsT! + bsB!) / 2;
      bsMidOk = Math.abs(bsM! - bsMidExpected) <= midTol;
      if (!bsMidOk) midCheckWarnings.push(`⚠️ สถานี ${r.station} ค่า BS Mid (${bsM!.toFixed(3)}) ≠ (Top+Bot)/2 (${bsMidExpected.toFixed(3)})`);
      sumBs += bsM!;
      currentHI = currentElev + bsM!;
    }

    if (hasFS) {
      fsDist = Math.abs(fsT! - fsB!) * 100;
      totalDist += fsDist;
      const fsMidExpected = (fsT! + fsB!) / 2;
      fsMidOk = Math.abs(fsM! - fsMidExpected) <= midTol;
      if (!fsMidOk) midCheckWarnings.push(`⚠️ สถานี ${r.station} ค่า FS Mid (${fsM!.toFixed(3)}) ≠ (Top+Bot)/2 (${fsMidExpected.toFixed(3)})`);
      sumFs += fsM!;
      if (currentHI !== null) {
        prevElev = currentElev;
        currentElev = currentHI - fsM!;
      }
    }

    const rise = (!hasBS && hasFS && currentElev > prevElev) ? currentElev - prevElev : null;
    const fall = (!hasBS && hasFS && currentElev <= prevElev) ? prevElev - currentElev : null;

    resultRows.push({
      station: r.station,
      bsDist, fsDist,
      totalDist: (bsDist ?? 0) + (fsDist ?? 0) || null,
      bsMid: hasBS ? bsM : null,
      fsMid: hasFS ? fsM : null,
      bsMidOk, fsMidOk,
      hi: hasBS ? currentHI : null,
      elevation: currentElev,
      rise, fall,
      remark: r.remark,
    });
  }

  const diffBsFs = sumBs - sumFs;
  const lastElev = resultRows[resultRows.length - 1]?.elevation ?? startElev;
  const closureErrorMeters = lastElev - startElev - diffBsFs;
  const closureErrorMm = Math.abs(closureErrorMeters) * 1000;
  const arithmeticCheckPassed = Math.abs(closureErrorMeters) < 0.001;

  const K = totalDistKm;
  const first = (4 * Math.sqrt(K)).toFixed(1);
  const second = (8 * Math.sqrt(K)).toFixed(1);
  const third = (12 * Math.sqrt(K)).toFixed(1);
  const constr = (24 * Math.sqrt(K)).toFixed(1);

  let achievedOrder = `ต่ำกว่าเกณฑ์ก่อสร้าง (>${constr} mm)`;
  const errMm = closureErrorMm;
  if (errMm <= parseFloat(first)) achievedOrder = `ชั้น 1 (≤ ±${first} mm) ✅`;
  else if (errMm <= parseFloat(second)) achievedOrder = `ชั้น 2 (≤ ±${second} mm) ✅`;
  else if (errMm <= parseFloat(third)) achievedOrder = `ชั้น 3 (≤ ±${third} mm) ✅`;
  else if (errMm <= parseFloat(constr)) achievedOrder = `ก่อสร้าง (≤ ±${constr} mm) ✅`;

  return {
    rows: resultRows,
    sumBs, sumFs, diffBsFs,
    totalDist,
    closureErrorMm,
    closureErrorMeters,
    arithmeticCheckPassed,
    orderCompliance: {
      achievedOrder,
      firstOrderMaxMm: first,
      secondOrderMaxMm: second,
      thirdOrderMaxMm: third,
      constructionMaxMm: constr,
    },
    midCheckWarnings,
  };
}

// ─── Component ──────────────────────────────────────────────────────────────
export const LevelingCalculator: React.FC = () => {
  const {
    levelingStartElevation,
    levelingLoopDistanceKm,
    levelingRows,
    levelingLastSaved,
    setLevelingStartElevation,
    setLevelingLoopDistanceKm,
    updateLevelingRow,
    addLevelingRow,
    removeLevelingRow,
    resetLevelingToSample,
    clearLeveling,
    setLevelingRows,
    levelingStadiaRows: stadiaRows,
    setLevelingStadiaRows: setStadiaRows,
    resetLevelingStadiaToSample,
    clearLevelingStadia,
  } = useSurveyStore();

  const [mode, setMode] = useState<LevelingMode>('hi');
  const [showResults, setShowResults] = useState(true);
  const [showFormatGuide, setShowFormatGuide] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      const { rows, errors } = parseLevelingFieldbookCsv(content);
      if (errors.length > 0 && rows.length === 0) {
        alert(`เกิดข้อผิดพลาดในการอ่านไฟล์:\n${errors.join('\n')}`);
        return;
      }

      if (rows.length > 0) {
        setLevelingRows(rows);
        if (errors.length > 0) {
          alert(`นำเข้าสำเร็จ ${rows.length} สถานี (มีข้อผิดพลาดบางบรรทัด:\n${errors.slice(0, 3).join('\n')})`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const startElevNum = parseFloat(levelingStartElevation) || 0;
  const distKmNum = parseFloat(levelingLoopDistanceKm) || 1.0;

  // HI mode result
  let hiResult: ReturnType<typeof calculateLevelingLoop> | null = null;
  let hiError: string | null = null;
  try {
    hiResult = calculateLevelingLoop(levelingRows, startElevNum, startElevNum, distKmNum);
  } catch (err: any) {
    hiError = err.message;
  }

  // Stadia result
  const stadiaResult = useMemo(() => {
    if (mode !== 'stadia') return null;
    try { return computeStadia(stadiaRows, startElevNum, distKmNum); }
    catch { return null; }
  }, [mode, stadiaRows, startElevNum, distKmNum]);

  // Stadia row editors
  const updateStadia = (idx: number, field: keyof StadiaRow, val: string) =>
    setStadiaRows((prev: StadiaRowInput[]) => prev.map((r: StadiaRowInput, i: number) => i === idx ? { ...r, [field]: val } : r));
  const addStadia = () => setStadiaRows((prev: StadiaRowInput[]) => [...prev, makeStadiaRow(`TP${prev.length}`)]);
  const removeStadia = (idx: number) => setStadiaRows((prev: StadiaRowInput[]) => prev.filter((_: StadiaRowInput, i: number) => i !== idx));

  // CSV export HI
  const handleExportCsvHi = () => {
    if (!hiResult) return;
    trackEvent('leveling_export_csv', { count: hiResult.rows.length });
    const headers = ['Station', 'BS(m)', 'IFS(m)', 'FS(m)', 'HI(m)', 'Rise(m)', 'Fall(m)', 'RL(m)', 'Remark'];
    const csvRows = hiResult.rows.map(r => [
      r.station, r.bs?.toFixed(3) ?? '', r.ifs?.toFixed(3) ?? '', r.fs?.toFixed(3) ?? '',
      r.hi?.toFixed(3) ?? '', r.rise?.toFixed(3) ?? '', r.fall?.toFixed(3) ?? '',
      r.elevation.toFixed(3), r.remark ?? '',
    ]);
    exportToCsv({ filename: `leveling_hi_${Date.now()}.csv`, headers, rows: csvRows });
  };

  const handleExportCsvStadia = () => {
    if (!stadiaResult) return;
    const headers = ['Station', 'BS_Dist', 'FS_Dist', 'BS_Mid', 'FS_Mid', 'HI', 'Rise', 'Fall', 'RL', 'Remark'];
    const csvRows = stadiaResult.rows.map(r => [
      r.station,
      fmtN(r.bsDist), fmtN(r.fsDist),
      fmtN(r.bsMid), fmtN(r.fsMid),
      fmtN(r.hi), fmtN(r.rise), fmtN(r.fall),
      r.elevation.toFixed(3), r.remark,
    ]);
    exportToCsv({ filename: `leveling_stadia_${Date.now()}.csv`, headers, rows: csvRows });
  };

  const cellInput = 'w-full bg-transparent border-0 outline-none font-mono text-xs text-center py-1 focus:bg-blue-500/10 rounded transition';
  const autoCell = 'py-2 px-1 text-center font-mono text-xs tabular-nums';
  const inputCell = 'py-1 px-1 border-r';

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="p-4 rounded-[var(--card-radius)] border shadow-xs" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                CALC-02 • DIFFERENTIAL LEVELING
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Save className="w-3 h-3 animate-pulse" />
                บันทึก {new Date(levelingLastSaved).toLocaleTimeString('th-TH')}
              </span>
            </div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>ตารางทำงานระดับ — Leveling Fieldbook</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              HI Method / Rise &amp; Fall · 3-Wire Stadia · Page Check · เกณฑ์ชั้นงาน √K
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.txt"
              className="hidden"
            />
            <a href="#/knowledge/differential-leveling-survey"
              className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> คู่มือ
            </a>
            <button
              onClick={() => setShowFormatGuide(!showFormatGuide)}
              className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
              title="ดูคำอธิบายคอลัมน์และรูปแบบข้อมูล"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>{showFormatGuide ? 'ซ่อนรูปแบบ' : 'รูปแบบ'}</span>
            </button>
            <button
              onClick={downloadLevelingFieldbookTemplateCsv}
              className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
              title="ดาวน์โหลดไฟล์ตัวอย่าง CSV สำหรับกรอกผลระดับ"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>แม่แบบ CSV</span>
            </button>
            {mode === 'hi' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition"
                title="นำเข้าไฟล์ CSV ข้อมูลระดับ"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>นำเข้า CSV</span>
              </button>
            )}
            {mode === 'hi' && (
              <>
                <button onClick={resetLevelingToSample}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
                  title="โหลดข้อมูลตัวอย่างสาธิต"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> ตัวอย่าง
                </button>
                <button onClick={() => { if (window.confirm('ล้างตารางทั้งหมดเพื่อเริ่มต้นฟอร์มว่างเปล่า (Blank Slate)?')) clearLeveling(); }}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 transition"
                  title="ล้างข้อมูลเพื่อเริ่มฟอร์มว่างเปล่า (Blank Slate)"
                >
                  <Eraser className="w-3.5 h-3.5" /> ล้างเป็นฟอร์มว่าง
                </button>
              </>
            )}
            {mode === 'stadia' && (
              <>
                <button onClick={resetLevelingStadiaToSample}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
                  title="โหลดข้อมูลตัวอย่างสาธิต Stadia"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> ตัวอย่าง
                </button>
                <button onClick={() => { if (window.confirm('ล้างตาราง Stadia เพื่อเริ่มต้นฟอร์มว่างเปล่า (Blank Slate)?')) clearLevelingStadia(); }}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 transition"
                  title="ล้างข้อมูลเพื่อเริ่มฟอร์มว่างเปล่า (Blank Slate)"
                >
                  <Eraser className="w-3.5 h-3.5" /> ล้างเป็นฟอร์มว่าง
                </button>
              </>
            )}
          </div>
        </div>

        {/* Format Guide Drawer */}
        {showFormatGuide && (
          <div className="rounded-xl border p-4 space-y-3 bg-blue-500/5 border-blue-500/20 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                <Info className="w-4 h-4" />
                <span>คำแนะนำรูปแบบข้อมูลการระดับ (Differential Leveling Format Guide)</span>
              </div>
              <button
                onClick={() => setShowFormatGuide(false)}
                className="text-[11px] opacity-70 hover:opacity-100 underline"
              >
                ปิดคำแนะนำ
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg border bg-surface/50 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                <span className="font-semibold text-blue-600 dark:text-blue-400 block">โหมด HI Method (มาตรฐาน)</span>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  ประกอบด้วยคอลัมน์: <code className="font-mono font-bold text-blue-500">Station, BS, IFS, FS, Remark</code>
                </p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 opacity-90" style={{ color: 'var(--text-2)' }}>
                  <li><strong>Station:</strong> ชื่อหมุด/สถานี (เช่น BM1, TP1, BM2)</li>
                  <li><strong>BS (ไม้หลัง):</strong> ค่าอ่านไม้ระดับหลัง (เมตร เช่น 1.542) สำหรับตั้งกล้อง</li>
                  <li><strong>IFS (ไม้กลาง):</strong> ค่าอ่านหมุดระหว่างทาง (เมตร เช่น 1.205)</li>
                  <li><strong>FS (ไม้หน้า):</strong> ค่าอ่านไม้หน้าเพื่อย้ายจุดตั้งกล้องหรือปิดวงรอบ (เมตร เช่น 1.108)</li>
                  <li><strong>Remark:</strong> หมายเหตุหรือคำอธิบายจุด</li>
                </ul>
              </div>
              <div className="p-2.5 rounded-lg border bg-surface/50 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                <span className="font-semibold text-purple-600 dark:text-purple-400 block">โหมด 3-Wire Stadia (ความละเอียดสูง)</span>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  อ่านสายใย 3 เส้น: <code className="font-mono font-bold text-purple-500">Top, Middle, Bottom</code> ทั้ง BS และ FS
                </p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 opacity-90" style={{ color: 'var(--text-2)' }}>
                  <li>ระบบจะตรวจ <code className="font-mono">Mid = (Top + Bot) / 2</code> ภายในเกณฑ์ ±2 mm อัตโนมัติ</li>
                  <li>คำนวณระยะห่าง Stadia = <code className="font-mono">(Top - Bot) × 100</code></li>
                  <li>คำนวณความสูงและตรวจสอบสมดุลระยะไม้หลัง-ไม้หน้า</li>
                </ul>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-blue-500/10 text-[11px]" style={{ color: 'var(--text-3)' }}>
              <span>💡 เริ่มจากฟอร์มว่างเปล่าโดยกด <strong>"ล้างเป็นฟอร์มว่าง"</strong> แล้วพิมพ์กรอกตรงในตาราง หรือกด <strong>"แม่แบบ CSV"</strong> เพื่อนำไปกรอกใน Excel</span>
              <button
                onClick={downloadLevelingFieldbookTemplateCsv}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> ดาวน์โหลด Template CSV
              </button>
            </div>
          </div>
        )}

        {/* Config bar */}
        <div className="rounded-xl border p-3 space-y-3" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          {/* Mode */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>โหมดการคำนวณ:</span>
            <button onClick={() => setMode('hi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${mode === 'hi' ? 'bg-emerald-600 text-white border-emerald-500' : 'opacity-60 hover:opacity-90'}`}
              style={mode !== 'hi' ? { borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--surface)' } : {}}
            >
              📐 HI Method / Rise &amp; Fall
            </button>
            <button onClick={() => setMode('stadia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${mode === 'stadia' ? 'bg-emerald-600 text-white border-emerald-500' : 'opacity-60 hover:opacity-90'}`}
              style={mode !== 'stadia' ? { borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--surface)' } : {}}
            >
              📏 3-Wire Stadia Leveling
            </button>
          </div>
          {/* Common params */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Start BM RL (m)</label>
              <input type="number" step="0.001" value={levelingStartElevation}
                onChange={e => setLevelingStartElevation(e.target.value)}
                className="w-full min-h-[36px] px-2.5 py-1.5 rounded-lg border font-mono text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-2)' }}>K ระยะทาง (km)</label>
              <input type="number" step="0.01" value={levelingLoopDistanceKm}
                onChange={e => setLevelingLoopDistanceKm(e.target.value)}
                className="w-full min-h-[36px] px-2.5 py-1.5 rounded-lg border font-mono text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── HI Mode Input Table ── */}
      {mode === 'hi' && (
        <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}
          >
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>บันทึกการอ่านไม้ระดับ — HI / Rise &amp; Fall</h4>
            <button onClick={addLevelingRow}
              className="min-h-[32px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" /> เพิ่มแถว
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse" style={{ minWidth: 700 }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-2)', borderBottom: '2px solid var(--border)' }}>
                  {['#', 'สถานี', 'BS (m)', 'IFS (m)', 'FS (m)', 'HI (auto)', 'Rise (auto)', 'Fall (auto)', 'RL (auto)', 'หมายเหตุ', 'Del'].map((h, i) => (
                    <th key={i} className="py-2.5 px-2 font-semibold text-center border-r"
                      style={{ borderColor: 'var(--border)', color: ['HI (auto)', 'Rise (auto)', 'Fall (auto)', 'RL (auto)'].includes(h) ? '#34d399' : 'var(--text-2)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {levelingRows.map((row, idx) => {
                  const cr = hiResult?.rows[idx];
                  const rowBg = idx % 2 === 0 ? 'transparent' : 'var(--surface-2)';
                  return (
                    <tr key={row.id} style={{ backgroundColor: rowBg, borderBottom: '1px solid var(--border)' }}>
                      <td className="text-center font-mono py-1 px-1 border-r w-8" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>{idx + 1}</td>
                      <td className={inputCell} style={{ borderColor: 'var(--border)' }}>
                        <input value={row.station} onChange={e => updateLevelingRow(idx, 'station', e.target.value)}
                          className={cellInput} style={{ color: 'var(--text-1)' }} />
                      </td>
                      <td className={inputCell} style={{ borderColor: 'var(--border)' }}>
                        <input value={row.bs !== null ? row.bs : ''} type="number" step="0.001" placeholder="BS"
                          onChange={e => updateLevelingRow(idx, 'bs', e.target.value)}
                          className={cellInput + ' ' + cellInput} style={{ color: 'var(--text-1)' }} />
                      </td>
                      <td className={inputCell} style={{ borderColor: 'var(--border)' }}>
                        <input value={row.ifs !== null ? row.ifs : ''} type="number" step="0.001" placeholder="IFS"
                          onChange={e => updateLevelingRow(idx, 'ifs', e.target.value)}
                          className={cellInput + ' ' + cellInput} style={{ color: 'var(--text-1)' }} />
                      </td>
                      <td className={inputCell} style={{ borderColor: 'var(--border)' }}>
                        <input value={row.fs !== null ? row.fs : ''} type="number" step="0.001" placeholder="FS"
                          onChange={e => updateLevelingRow(idx, 'fs', e.target.value)}
                          className={cellInput + ' ' + cellInput} style={{ color: 'var(--text-1)' }} />
                      </td>
                      <td className={autoCell + ' border-r'} style={{ borderColor: 'var(--border)', color: '#34d399', backgroundColor: 'rgba(52,211,153,0.05)' }}>
                        {cr?.hi != null ? cr.hi.toFixed(3) : '—'}
                      </td>
                      <td className={autoCell + ' border-r'} style={{ borderColor: 'var(--border)', color: '#34d399', backgroundColor: 'rgba(52,211,153,0.05)' }}>
                        {cr?.rise != null ? `+${cr.rise.toFixed(3)}` : '—'}
                      </td>
                      <td className={autoCell + ' border-r'} style={{ borderColor: 'var(--border)', color: '#f87171', backgroundColor: 'rgba(248,113,113,0.05)' }}>
                        {cr?.fall != null ? `-${cr.fall.toFixed(3)}` : '—'}
                      </td>
                      <td className={autoCell + ' border-r font-bold'} style={{ borderColor: 'var(--border)', color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.07)' }}>
                        {cr ? cr.elevation.toFixed(3) : '—'}
                      </td>
                      <td className={'border-r py-1 px-2'} style={{ borderColor: 'var(--border)' }}>
                        <input value={row.remark || ''} placeholder="หมายเหตุ"
                          onChange={e => updateLevelingRow(idx, 'remark', e.target.value)}
                          className="w-full bg-transparent border-0 outline-none text-xs py-1" style={{ color: 'var(--text-3)' }} />
                      </td>
                      <td className="text-center py-1 px-1">
                        <button onClick={() => removeLevelingRow(idx)} disabled={levelingRows.length <= 1}
                          className="p-1 rounded text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 transition inline-flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {levelingRows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-xs" style={{ color: 'var(--text-3)' }}>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileSpreadsheet className="w-8 h-8 opacity-40 text-emerald-500" />
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>ตารางว่างเปล่า (Blank Slate)</p>
                        <p className="text-xs">กด &quot;เพิ่มแถว&quot; ด้านบนเพื่อเริ่มกรอกสถานีแรก, นำเข้าไฟล์ CSV หรือ โหลดตัวอย่างสาธิต</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={addLevelingRow}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> เพิ่มแถวแรก
                          </button>
                          <button
                            onClick={resetLevelingToSample}
                            className="px-3 py-1 rounded-lg border font-medium text-xs flex items-center gap-1"
                            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)', color: 'var(--text-2)' }}
                          >
                            <RotateCcw className="w-3 h-3" /> โหลดตัวอย่าง
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {/* Σ row */}
                {hiResult && (
                  <tr className="font-bold border-t-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
                    <td colSpan={2} className="py-2 px-3 text-right text-xs" style={{ color: 'var(--text-2)' }}>Σ</td>
                    <td className="py-2 px-2 text-center font-mono" style={{ color: '#34d399' }}>{hiResult.sumBs.toFixed(3)}</td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2 text-center font-mono" style={{ color: '#f87171' }}>{hiResult.sumFs.toFixed(3)}</td>
                    <td colSpan={6}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 3-Wire Stadia Table ── */}
      {mode === 'stadia' && (
        <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}
          >
            <div>
              <h4 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>ตาราง 3-Wire Stadia Leveling</h4>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                D = 100×|Top−Bot| · Mid ≈ (Top+Bot)/2 · เซลล์แดง = Mid ผิดเกิน 2mm
              </p>
            </div>
            <button onClick={addStadia}
              className="min-h-[32px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition">
              <Plus className="w-3.5 h-3.5" /> เพิ่มสถานี
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse" style={{ minWidth: 860 }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-2)', borderBottom: '2px solid var(--border)' }}>
                  <th className="py-2 px-1 border-r text-center font-semibold w-6" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>#</th>
                  <th className="py-2 px-2 border-r font-semibold text-left" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>สถานี</th>
                  {/* BS group */}
                  <th className="py-2 px-1 border-r font-semibold text-center text-sky-500" colSpan={3} style={{ borderColor: 'var(--border)' }}>Backsight (BS)</th>
                  {/* FS group */}
                  <th className="py-2 px-1 border-r font-semibold text-center text-orange-400" colSpan={3} style={{ borderColor: 'var(--border)' }}>Foresight (FS)</th>
                  {/* Auto */}
                  <th className="py-2 px-1 border-r font-semibold text-center" style={{ borderColor: 'var(--border)', color: '#34d399' }}>Dist (m)</th>
                  <th className="py-2 px-1 border-r font-semibold text-center" style={{ borderColor: 'var(--border)', color: '#34d399' }}>HI (m)</th>
                  <th className="py-2 px-1 border-r font-semibold text-center" style={{ borderColor: 'var(--border)', color: '#818cf8' }}>RL (m)</th>
                  <th className="py-2 px-1 border-r font-semibold text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>หมาย</th>
                  <th className="py-2 px-1 text-center" style={{ color: 'var(--text-3)' }}>Del</th>
                </tr>
                <tr style={{ backgroundColor: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  <th colSpan={2} className="border-r" style={{ borderColor: 'var(--border)' }}></th>
                  {['Top', 'Mid', 'Bot'].map(l => (
                    <th key={l} className="py-1 px-1 font-semibold text-center border-r text-sky-500/80" style={{ borderColor: 'var(--border)' }}>{l}</th>
                  ))}
                  {['Top', 'Mid', 'Bot'].map(l => (
                    <th key={l} className="py-1 px-1 font-semibold text-center border-r text-orange-400/80" style={{ borderColor: 'var(--border)' }}>{l}</th>
                  ))}
                  <th colSpan={4} className="border-r" style={{ borderColor: 'var(--border)' }}></th>
                </tr>
              </thead>
              <tbody>
                {stadiaRows.map((row, idx) => {
                  const cr = stadiaResult?.rows[idx];
                  const rowBg = idx % 2 === 0 ? 'transparent' : 'var(--surface-2)';
                  return (
                    <tr key={row.id} style={{ backgroundColor: rowBg, borderBottom: '1px solid var(--border)' }}>
                      <td className="text-center font-mono py-1 px-1 border-r w-6" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>{idx + 1}</td>
                      <td className={inputCell} style={{ borderColor: 'var(--border)' }}>
                        <input value={row.station} onChange={e => updateStadia(idx, 'station', e.target.value)}
                          className={cellInput} style={{ color: 'var(--text-1)' }} />
                      </td>
                      {/* BS Top Mid Bot */}
                      {(['bsTop', 'bsMid', 'bsBot'] as (keyof StadiaRow)[]).map((f, fi) => {
                        const isMid = f === 'bsMid';
                        const badMid = isMid && cr && !cr.bsMidOk;
                        return (
                          <td key={f} className={inputCell} style={{ borderColor: 'var(--border)', backgroundColor: badMid ? 'rgba(248,113,113,0.18)' : undefined }}>
                            <input value={row[f] as string} type="number" step="0.001" placeholder={['Top', 'Mid', 'Bot'][fi]}
                              onChange={e => updateStadia(idx, f, e.target.value)}
                              className={cellInput} style={{ color: badMid ? '#f87171' : 'var(--text-1)' }} />
                          </td>
                        );
                      })}
                      {/* FS Top Mid Bot */}
                      {(['fsTop', 'fsMid', 'fsBot'] as (keyof StadiaRow)[]).map((f, fi) => {
                        const isMid = f === 'fsMid';
                        const badMid = isMid && cr && !cr.fsMidOk;
                        return (
                          <td key={f} className={inputCell} style={{ borderColor: 'var(--border)', backgroundColor: badMid ? 'rgba(248,113,113,0.18)' : undefined }}>
                            <input value={row[f] as string} type="number" step="0.001" placeholder={['Top', 'Mid', 'Bot'][fi]}
                              onChange={e => updateStadia(idx, f, e.target.value)}
                              className={cellInput} style={{ color: badMid ? '#f87171' : 'var(--text-1)' }} />
                          </td>
                        );
                      })}
                      {/* Auto columns */}
                      <td className={autoCell + ' border-r'} style={{ borderColor: 'var(--border)', color: '#34d399', backgroundColor: 'rgba(52,211,153,0.06)' }}>
                        {cr?.totalDist != null ? fmtN(cr.totalDist) : '—'}
                      </td>
                      <td className={autoCell + ' border-r'} style={{ borderColor: 'var(--border)', color: '#34d399', backgroundColor: 'rgba(52,211,153,0.06)' }}>
                        {cr?.hi != null ? fmtN(cr.hi) : '—'}
                      </td>
                      <td className={autoCell + ' border-r font-bold'} style={{ borderColor: 'var(--border)', color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.07)' }}>
                        {cr ? cr.elevation.toFixed(3) : '—'}
                      </td>
                      <td className="border-r py-1 px-1" style={{ borderColor: 'var(--border)' }}>
                        <input value={row.remark} placeholder="หมาย" onChange={e => updateStadia(idx, 'remark', e.target.value)}
                          className="w-full bg-transparent border-0 outline-none text-xs py-1" style={{ color: 'var(--text-3)' }} />
                      </td>
                      <td className="text-center py-1 px-1">
                        <button onClick={() => removeStadia(idx)} disabled={stadiaRows.length <= 1}
                          className="p-1 rounded text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 transition inline-flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {/* Σ row */}
                {stadiaResult && (
                  <tr className="font-bold border-t-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
                    <td colSpan={2} className="py-2 px-3 text-right text-xs" style={{ color: 'var(--text-2)' }}>Σ</td>
                    <td colSpan={3} className="py-2 px-2 text-center font-mono text-xs" style={{ color: '#34d399' }}>
                      ΣBS = {stadiaResult.sumBs.toFixed(3)}
                    </td>
                    <td colSpan={3} className="py-2 px-2 text-center font-mono text-xs" style={{ color: '#f87171' }}>
                      ΣFS = {stadiaResult.sumFs.toFixed(3)}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-xs" style={{ color: '#34d399' }}>
                      {stadiaResult.totalDist.toFixed(0)} m
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Results Panel ── */}
      {(mode === 'hi' ? (hiResult || hiError) : stadiaResult) && (
        <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <button onClick={() => setShowResults(r => !r)}
            className="w-full flex items-center justify-between px-4 py-3 border-b text-left"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}
          >
            <div className="flex items-center gap-2">
              {hiError ? <XCircle className="w-4 h-4 text-rose-500" />
                : (mode === 'hi' ? hiResult?.arithmeticCheckPassed : stadiaResult?.arithmeticCheckPassed)
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  : <AlertCircle className="w-4 h-4 text-amber-500" />}
              <h4 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>
                {hiError ? `ข้อผิดพลาด: ${hiError}` : 'ผลลัพธ์การคำนวณระดับ'}
              </h4>
            </div>
            {showResults ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-3)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-3)' }} />}
          </button>

          {showResults && !hiError && (
            <div className="p-4 space-y-4">
              {/* Stadia mid check warnings */}
              {mode === 'stadia' && stadiaResult && stadiaResult.midCheckWarnings.length > 0 && (
                <div className="rounded-xl border p-3 space-y-1 bg-amber-500/5 border-amber-500/30">
                  <p className="text-xs font-bold mb-1 text-amber-600 dark:text-amber-400">⚠️ Stadia Mid Check — ค่า Mid ผิดพลาด:</p>
                  {stadiaResult.midCheckWarnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Key metrics */}
              {(() => {
                const r = mode === 'hi' ? hiResult : stadiaResult;
                if (!r) return null;
                const errMm = r.closureErrorMm;
                const oc = r.orderCompliance;
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Σ BS', val: r.sumBs.toFixed(4) + ' m', ok: true },
                      { label: 'Σ FS', val: r.sumFs.toFixed(4) + ' m', ok: true },
                      { label: 'Page Check (ΣBS−ΣFS)', val: r.diffBsFs.toFixed(4) + ' m', ok: r.arithmeticCheckPassed },
                      { label: 'Closure Error', val: `${errMm.toFixed(2)} mm`, ok: errMm <= Number(oc.thirdOrderMaxMm) },
                    ].map(({ label, val, ok }) => (
                      <div key={label} className="rounded-xl p-3 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>{label}</p>
                        <p className={`text-sm font-bold font-mono ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>{val}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* RTSD Order */}
              {(() => {
                const oc = (mode === 'hi' ? hiResult : stadiaResult)?.orderCompliance;
                const K = distKmNum;
                if (!oc) return null;
                return (
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-1)' }}>
                      เกณฑ์ชั้นงานระดับ — K = {K.toFixed(2)} km · ผลการตรวจ: <span className="text-emerald-500">{oc.achievedOrder}</span>
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                      {[
                        ['ชั้น 1 (4√K)', oc.firstOrderMaxMm],
                        ['ชั้น 2 (8√K)', oc.secondOrderMaxMm],
                        ['ชั้น 3 (12√K)', oc.thirdOrderMaxMm],
                        ['ก่อสร้าง (24√K)', oc.constructionMaxMm],
                      ].map(([l, v]) => (
                        <div key={l}>
                          <span className="block font-sans text-[10px]" style={{ color: 'var(--text-3)' }}>{l}:</span>
                          <span className="font-bold" style={{ color: 'var(--text-1)' }}>±{v} mm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Export */}
              <div className="flex gap-2">
                <button onClick={mode === 'hi' ? handleExportCsvHi : handleExportCsvStadia}
                  className="min-h-[36px] px-4 py-2 rounded-xl border font-semibold text-xs flex items-center gap-1.5 transition"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
                >
                  <Download className="w-3.5 h-3.5" /> ส่งออก CSV
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
