import React, { useState, useMemo, useRef } from 'react';
import { sqMetersToThaiLand, thaiLandToSqMeters, formatThaiLandString } from '../../core/land-units';
import { 
  Layers, 
  ArrowRightLeft, 
  DollarSign, 
  MapPin, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Eraser, 
  Upload, 
  FileSpreadsheet, 
  Eye, 
  HelpCircle,
  Download,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useSurveyStore } from '../../store/useSurveyStore';
import { parseCadastralCsv, downloadCadastralTemplateCsv } from '../../utils/survey-csv-parser';
import { exportToCsv } from '../../utils/csv-export';
import { MathFormulaRenderer } from '../common/MathFormulaRenderer';

type LandAreaMode = 'polygon' | 'converter';

export const LandAreaCalculator: React.FC = () => {
  const {
    cadastralPoints,
    cadastralPricePerWah,
    setCadastralPoints,
    setCadastralPricePerWah,
    addCadastralPoint,
    removeCadastralPoint,
    updateCadastralPoint,
    resetCadastralToSample,
    clearCadastral
  } = useSurveyStore();

  const [activeMode, setActiveMode] = useState<LandAreaMode>('polygon');
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [showDerivation, setShowDerivation] = useState<boolean>(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Converter state - Blank slate defaults
  const [sqMetersInput, setSqMetersInput] = useState<string>('');
  const [raiInput, setRaiInput] = useState<string>('');
  const [nganInput, setNganInput] = useState<string>('');
  const [wahInput, setWahInput] = useState<string>('');
  const [currentM2, setCurrentM2] = useState<number>(0);

  const handleUpdateM2 = (val: string) => {
    setSqMetersInput(val);
    if (!val || val.trim() === '') {
      setCurrentM2(0);
      setRaiInput('');
      setNganInput('');
      setWahInput('');
      return;
    }
    const m2 = parseFloat(val) || 0;
    setCurrentM2(m2);
    const t = sqMetersToThaiLand(m2);
    setRaiInput(t.rai.toString());
    setNganInput(t.ngan.toString());
    setWahInput(t.wah.toString());
  };

  const handleUpdateThai = (r: string, n: string, w: string) => {
    setRaiInput(r);
    setNganInput(n);
    setWahInput(w);
    if (!r && !n && !w) {
      setCurrentM2(0);
      setSqMetersInput('');
      return;
    }
    const m2 = thaiLandToSqMeters(parseFloat(r) || 0, parseFloat(n) || 0, parseFloat(w) || 0);
    setCurrentM2(m2);
    setSqMetersInput(m2 > 0 ? m2.toString() : '');
  };

  const handleLoadSampleConverter = () => {
    handleUpdateThai('2', '0', '62.5'); // 3,450 sq.m.
  };

  const handleClearConverter = () => {
    setSqMetersInput('');
    setRaiInput('');
    setNganInput('');
    setWahInput('');
    setCurrentM2(0);
  };

  const converterResult = sqMetersToThaiLand(currentM2);
  const converterTotalWah = currentM2 / 4;
  const unitPrice = parseFloat(cadastralPricePerWah) || 0;
  const estimatedTotalPrice = converterTotalWah * unitPrice;

  // ── Shoelace Formula & Polygon Geometry Calculation ──────────────────────────
  const polygonCalc = useMemo(() => {
    const pts = cadastralPoints;
    const n = pts.length;
    if (n < 3) {
      return {
        areaSqM: 0,
        perimeterM: 0,
        thaiLand: sqMetersToThaiLand(0),
        totalWah: 0,
        totalPrice: 0,
        sideLengths: [] as number[],
        isValid: false
      };
    }

    let doubleArea = 0;
    let perimeter = 0;
    const sideLengths: number[] = [];

    for (let i = 0; i < n; i++) {
      const nextIdx = (i + 1) % n;
      const x1 = pts[i].easting;
      const y1 = pts[i].northing;
      const x2 = pts[nextIdx].easting;
      const y2 = pts[nextIdx].northing;

      doubleArea += (x1 * y2) - (x2 * y1);
      const sideDist = Math.hypot(x2 - x1, y2 - y1);
      perimeter += sideDist;
      sideLengths.push(sideDist);
    }

    const areaSqM = Math.abs(doubleArea) / 2.0;
    const thai = sqMetersToThaiLand(areaSqM);
    const w = areaSqM / 4.0;
    const price = w * unitPrice;

    return {
      areaSqM,
      perimeterM: perimeter,
      thaiLand: thai,
      totalWah: w,
      totalPrice: price,
      sideLengths,
      isValid: true
    };
  }, [cadastralPoints, unitPrice]);

  // ── 2D SVG Parcel Bounds Normalization ────────────────────────────────────────
  const svgLayout = useMemo(() => {
    if (cadastralPoints.length < 2) return null;

    const eastings = cadastralPoints.map(p => p.easting);
    const northings = cadastralPoints.map(p => p.northing);

    const minE = Math.min(...eastings);
    const maxE = Math.max(...eastings);
    const minN = Math.min(...northings);
    const maxN = Math.max(...northings);

    const spanE = Math.max(1, maxE - minE);
    const spanN = Math.max(1, maxN - minN);

    const svgWidth = 420;
    const svgHeight = 280;
    const padding = 45;

    const scale = Math.min(
      (svgWidth - padding * 2) / spanE,
      (svgHeight - padding * 2) / spanN
    );

    const project = (e: number, n: number) => {
      const x = padding + (e - minE) * scale;
      // Invert Y for cartesian Northing
      const y = svgHeight - (padding + (n - minN) * scale);
      return { x, y };
    };

    const projectedPoints = cadastralPoints.map(p => ({
      ...p,
      ...project(p.easting, p.northing)
    }));

    const pathData = projectedPoints
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ') + ' Z';

    return {
      svgWidth,
      svgHeight,
      projectedPoints,
      pathData,
      spanE,
      spanN
    };
  }, [cadastralPoints]);

  const handleUploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    try {
      const text = await file.text();
      const parsed = parseCadastralCsv(text);
      if (parsed.errors.length > 0 && parsed.points.length === 0) {
        setCsvError(parsed.errors.join(' | '));
      } else {
        setCadastralPoints(parsed.points);
      }
    } catch (err: any) {
      setCsvError(`ไม่สามารถอ่านไฟล์: ${err?.message}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleExportPolygonCsv = () => {
    if (cadastralPoints.length === 0) return;
    const headers = ['Point_Name', 'Easting_m', 'Northing_m'];
    const rows = cadastralPoints.map(p => [p.name, p.easting.toFixed(3), p.northing.toFixed(3)]);
    exportToCsv({ filename: `cadastral_polygon_${Date.now()}.csv`, headers, rows });
  };

  const handleTransferToConverter = () => {
    if (!polygonCalc.isValid) return;
    handleUpdateM2(polygonCalc.areaSqM.toFixed(2));
    setActiveMode('converter');
  };

  return (
    <div className="space-y-5">
      
      {/* ── Header ── */}
      <div className="p-4 rounded-[var(--card-radius)] border shadow-xs" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-[var(--surface-2)]" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => setActiveMode('polygon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeMode === 'polygon'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>คำนวณพิกัดรูปแปลง (Polygon)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('converter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeMode === 'converter'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>แปลงหน่วยโฉนด (Converter)</span>
            </button>
          </div>

          <a
            href="#/knowledge/closed-loop-traverse"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>คู่มือวิชาการ: รังวัดแปลงที่ดินและวงรอบ</span>
          </a>
        </div>

        {/* Action Toolbar for Polygon Mode */}
        {activeMode === 'polygon' && (
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-[var(--border)]">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleUploadCsv}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
              title="นำเข้าพิกัดหมุดจากไฟล์ CSV"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>นำเข้า CSV</span>
            </button>
            <button
              type="button"
              onClick={downloadCadastralTemplateCsv}
              className="min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
              title="ดาวน์โหลดไฟล์แม่แบบพิกัดแปลงที่ดิน CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Template CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setShowFormatGuide(!showFormatGuide)}
              className={`min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                showFormatGuide ? 'bg-indigo-600 text-white border-indigo-500' : ''
              }`}
              style={!showFormatGuide ? { backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-2)' } : {}}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>รูปแบบ</span>
            </button>
            <button
              type="button"
              onClick={resetCadastralToSample}
              className="min-h-[34px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 transition shadow-xs"
              title="โหลดตัวอย่างแปลงที่ดินสี่เหลี่ยม 100x100 ม. (10,000 ตร.ม. / 6-1-0 ไร่) พร้อมคำนวณทันที"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Sample Data</span>
            </button>
            <button
              type="button"
              onClick={() => { if (window.confirm('ล้างพิกัดหมุดทั้งหมดเพื่อเริ่มฟอร์มว่างเปล่า (Blank Slate)?')) clearCadastral(); }}
              className="min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
              title="ล้างข้อมูลทั้งหมดเพื่อเริ่มฟอร์มว่างเปล่า (Blank Slate)"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>ล้างเป็นฟอร์มว่าง</span>
            </button>
            {polygonCalc.isValid && (
              <button
                type="button"
                onClick={handleExportPolygonCsv}
                className="min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ส่งออก CSV</span>
              </button>
            )}
          </div>
        )}

        {/* Action Toolbar for Converter Mode */}
        {activeMode === 'converter' && (
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={handleLoadSampleConverter}
              className="min-h-[34px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 transition shadow-xs"
              title="โหลดตัวอย่างแปลงที่ดิน 2 ไร่ 62.5 ตร.ว. (3,450 ตร.ม.)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>⚡ โหลดตัวอย่างแปลงที่ดิน (2 ไร่ 62.5 วา)</span>
            </button>
            <button
              type="button"
              onClick={handleClearConverter}
              className="min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
              title="ล้างค่าทั้งหมดเป็นฟอร์มว่างเปล่า"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>ล้างเป็นฟอร์มว่าง</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Format Guide Box ── */}
      {showFormatGuide && activeMode === 'polygon' && (
        <div className="p-4 rounded-xl border-2 border-indigo-500/40 bg-indigo-500/5 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-indigo-600 dark:text-indigo-400">
            <span>คำแนะนำรูปแบบพิกัดหมุดเขตที่ดิน (Cadastral Coordinates Format)</span>
            <button
              type="button"
              onClick={downloadCadastralTemplateCsv}
              className="text-[11px] underline font-semibold"
            >
              ดาวน์โหลดแม่แบบ CSV
            </button>
          </div>
          <p style={{ color: 'var(--text-2)' }}>
            ไฟล์ CSV ต้องเรียงลำดับจุดหมุดวนตามเข็มหรือทวนเข็มนาฬิการอบแปลง คอลัมน์: <code className="font-mono font-bold text-indigo-500">Point_Name, Easting_m, Northing_m</code>
          </p>
          <div className="font-mono text-[11px] p-2.5 rounded border bg-[var(--surface)]" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
            หมุด 1 (SW), 669500.0, 1531000.0<br />
            หมุด 2 (SE), 669600.0, 1531000.0<br />
            หมุด 3 (NE), 669600.0, 1531100.0<br />
            หมุด 4 (NW), 669500.0, 1531100.0
          </div>
        </div>
      )}

      {csvError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{csvError}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          MODE 1: POLYGON COORDINATE AREA CALCULATION
          ───────────────────────────────────────────────────────────────────────── */}
      {activeMode === 'polygon' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Coordinate Table */}
            <div className="lg:col-span-7 rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
                <h4 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>
                  รายการพิกัดหมุดแปลงที่ดิน (Polygon Vertices)
                </h4>
                <button
                  type="button"
                  onClick={() => addCadastralPoint({
                    id: crypto.randomUUID ? crypto.randomUUID() : `pt_${Date.now()}`,
                    name: `หมุด ${cadastralPoints.length + 1}`,
                    easting: cadastralPoints.length > 0 ? cadastralPoints[cadastralPoints.length - 1].easting + 50 : 669500,
                    northing: cadastralPoints.length > 0 ? cadastralPoints[cadastralPoints.length - 1].northing : 1531000
                  })}
                  className="min-h-[30px] px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มหมุด</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--surface-2)', borderBottom: '2px solid var(--border)' }}>
                      <th className="py-2 px-2 text-center border-r w-10 font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>#</th>
                      <th className="py-2 px-3 text-left border-r font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>ชื่อหมุด</th>
                      <th className="py-2 px-3 text-center border-r font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>Easting พิกัดราบ E (m)</th>
                      <th className="py-2 px-3 text-center border-r font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>Northing พิกัดดิ่ง N (m)</th>
                      <th className="py-2 px-2 text-center w-10 font-semibold" style={{ color: 'var(--text-2)' }}>ลบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cadastralPoints.map((pt, idx) => (
                      <tr key={pt.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="text-center font-mono py-1.5 px-1 border-r" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                          {idx + 1}
                        </td>
                        <td className="py-1 px-2 border-r" style={{ borderColor: 'var(--border)' }}>
                          <input
                            type="text"
                            value={pt.name}
                            onChange={(e) => updateCadastralPoint(idx, 'name', e.target.value)}
                            className="w-full bg-transparent border-0 outline-none font-semibold text-xs py-1"
                            style={{ color: 'var(--text-1)' }}
                          />
                        </td>
                        <td className="py-1 px-2 border-r" style={{ borderColor: 'var(--border)' }}>
                          <input
                            type="number"
                            step="0.001"
                            value={pt.easting}
                            onChange={(e) => updateCadastralPoint(idx, 'easting', parseFloat(e.target.value) || 0)}
                            className="w-full bg-transparent border-0 outline-none font-mono text-xs text-center py-1 focus:bg-indigo-500/10 rounded"
                            style={{ color: 'var(--text-1)' }}
                          />
                        </td>
                        <td className="py-1 px-2 border-r" style={{ borderColor: 'var(--border)' }}>
                          <input
                            type="number"
                            step="0.001"
                            value={pt.northing}
                            onChange={(e) => updateCadastralPoint(idx, 'northing', parseFloat(e.target.value) || 0)}
                            className="w-full bg-transparent border-0 outline-none font-mono text-xs text-center py-1 focus:bg-indigo-500/10 rounded"
                            style={{ color: 'var(--text-1)' }}
                          />
                        </td>
                        <td className="text-center py-1 px-1">
                          <button
                            type="button"
                            onClick={() => removeCadastralPoint(idx)}
                            disabled={cadastralPoints.length <= 3}
                            className="p-1 rounded text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 transition"
                            title={cadastralPoints.length <= 3 ? 'ต้องมีอย่างน้อย 3 หมุดเพื่อคำนวณพื้นที่' : 'ลบหมุด'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {cadastralPoints.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-xs" style={{ color: 'var(--text-3)' }}>
                          <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto px-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                              <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>ตารางว่างเปล่า (Blank Slate)</p>
                              <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
                                เริ่มต้นโดยการเพิ่มพิกัดหมุดทีละจุด นำเข้าไฟล์ CSV หรือคลิกโหลดชุดตัวอย่างเพื่อทดสอบระบบทันที
                              </p>
                            </div>
                            <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
                              <button
                                type="button"
                                onClick={resetCadastralToSample}
                                className="min-h-[36px] px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-500/50 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>⚡ โหลดตัวอย่างแปลงที่ดิน 4 หมุด</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => addCadastralPoint({
                                  id: crypto.randomUUID ? crypto.randomUUID() : `pt_${Date.now()}`,
                                  name: 'หมุด 1',
                                  easting: 669500,
                                  northing: 1531000
                                })}
                                className="min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-1)] hover:bg-[var(--surface)] transition"
                              >
                                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                                <span>เพิ่มหมุดแรก</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2D SVG Parcel Visualizer */}
            <div className="lg:col-span-5 rounded-2xl border shadow-sm p-4 flex flex-col justify-between" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    รูปแปลงที่ดินจำลอง (2D Cadastral Parcel Plot)
                  </span>
                  <span className="text-[11px] font-mono font-bold" style={{ color: 'var(--text-3)' }}>
                    {cadastralPoints.length} หมุดเขต
                  </span>
                </div>

                {svgLayout ? (
                  <div className="relative w-full rounded-xl overflow-hidden border bg-surface-2/40 flex items-center justify-center" style={{ borderColor: 'var(--border)', minHeight: 260 }}>
                    <svg viewBox={`0 0 ${svgLayout.svgWidth} ${svgLayout.svgHeight}`} className="w-full h-auto max-h-[280px]">
                      {/* Grid Pattern Background */}
                      <defs>
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border opacity-40" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

                      {/* Polygon Shape */}
                      <path
                        d={svgLayout.pathData}
                        fill="rgba(99, 102, 241, 0.15)"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />

                      {/* Vertices & Station Labels */}
                      {svgLayout.projectedPoints.map((pt, idx) => (
                        <g key={pt.id}>
                          <circle cx={pt.x} cy={pt.y} r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
                          <text
                            x={pt.x}
                            y={pt.y - 9}
                            textAnchor="middle"
                            className="text-[10px] font-mono font-bold fill-current"
                            style={{ fill: 'var(--text-1)' }}
                          >
                            {pt.name}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                ) : (
                  <div className="h-64 rounded-xl border border-dashed flex flex-col items-center justify-center text-xs text-center p-6 space-y-3" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                      <MapPin className="w-6 h-6 opacity-70" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs" style={{ color: 'var(--text-2)' }}>ยังไม่มีรูปแปลงที่ดินแสดงผล</p>
                      <p className="text-[11px] mt-0.5">กรุณากรอกพิกัดอย่างน้อย 3 หมุดวนรอบแปลงเพื่อสร้างผัง 2D</p>
                    </div>
                    {cadastralPoints.length === 0 && (
                      <button
                        type="button"
                        onClick={resetCadastralToSample}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition"
                      >
                        ⚡ โหลดตัวอย่างสาธิตทันที
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Price Per Wah Settings */}
              <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                    ราคาประเมินต่อตารางวา (บาท/ตร.ว.):
                  </label>
                  <input
                    type="number"
                    value={cadastralPricePerWah}
                    onChange={(e) => setCadastralPricePerWah(e.target.value)}
                    className="w-32 min-h-[34px] px-2.5 py-1 rounded-lg border font-mono text-xs text-right focus:ring-1 focus:ring-indigo-500 outline-none"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ── Calculation Summary Cards ── */}
          {polygonCalc.isValid && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border shadow-xs" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-3)' }}>พื้นที่รวม (ตารางเมตร):</span>
                <span className="font-mono text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                  {polygonCalc.areaSqM.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²
                </span>
                <span className="block text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
                  คิดเป็น {polygonCalc.totalWah.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ตร.ว.
                </span>
              </div>

              <div className="p-4 rounded-2xl border shadow-xs" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-3)' }}>หน่วยโฉนดที่ดินไทย:</span>
                <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatThaiLandString(polygonCalc.thaiLand.rai, polygonCalc.thaiLand.ngan, polygonCalc.thaiLand.wah)}
                </span>
                <span className="block text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
                  {polygonCalc.thaiLand.hectares.toFixed(4)} ha · {polygonCalc.thaiLand.acres.toFixed(3)} ac
                </span>
              </div>

              <div className="p-4 rounded-2xl border shadow-xs" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-3)' }}>ความยาวเส้นรอบรูปแปลง:</span>
                <span className="font-mono text-xl font-bold" style={{ color: 'var(--text-1)' }}>
                  {polygonCalc.perimeterM.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m
                </span>
                <span className="block text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
                  แนวเขต {cadastralPoints.length} ด้าน
                </span>
              </div>

              <div className="p-4 rounded-2xl border shadow-xs bg-amber-500/5 border-amber-500/30">
                <span className="text-xs font-semibold block mb-1 text-amber-700 dark:text-amber-300">มูลค่าที่ดินประเมินรวม:</span>
                <span className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400">
                  {polygonCalc.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
                </span>
                <button
                  type="button"
                  onClick={handleTransferToConverter}
                  className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                >
                  <span>ส่งพื้นที่นี้ไปยังตัวแปลงละเอียด</span>
                  <ArrowRightLeft className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Show Math Derivation Accordion */}
          {polygonCalc.isValid && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
              <button
                type="button"
                onClick={() => setShowDerivation(v => !v)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold hover:bg-[var(--surface)] transition text-left"
                style={{ color: 'var(--text-1)' }}
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-[var(--text-1)]">Show Math Derivation (แสดงวิธีทำและขั้นตอนสูตรคำนวณเนื้อที่)</span>
                </div>
                {showDerivation ? <ChevronUp className="w-4 h-4 text-[var(--text-3)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-3)]" />}
              </button>

              {showDerivation && (
                <div className="p-4 space-y-4 border-t text-xs" style={{ borderColor: 'var(--border)' }}>
                  {/* Step 1: Gauss Shoelace Formula */}
                  <div className="p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-2">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      1. สูตรพิกัดฉากคูณไขว้แบบเกาส์ (Gauss / Shoelace Coordinate Formula)
                    </div>
                    <div className="text-[var(--text-2)] space-y-1">
                      <p>สูตรคำนวณเนื้อที่รูปหลายเหลี่ยมปิดจากพิกัดฉากราบ (Easting, Northing):</p>
                      <MathFormulaRenderer formula="2A = \left| \sum_{i=1}^{n} (E_i N_{i+1} - E_{i+1} N_i) \right| \implies A = \frac{1}{2} |2A|" />
                      <p>คำนวณผลรวมคูณไขว้ได้: 2A = {(polygonCalc.areaSqM * 2).toFixed(2)} ตร.ม.</p>
                      <p>เนื้อที่สุทธิ (Area): <strong>{polygonCalc.areaSqM.toFixed(2)} ตารางเมตร</strong></p>
                      <p>ความยาวเส้นรอบแปลง (Perimeter): <strong>{polygonCalc.perimeterM.toFixed(3)} เมตร</strong> ({cadastralPoints.length} สถานีหมุด)</p>
                    </div>
                  </div>

                  {/* Step 2: Thai Land Units Conversion */}
                  <div className="p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-2">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      2. การแปลงเป็นมาตราวัดที่ดินไทย (Rai-Ngan-Wah Conversion)
                    </div>
                    <div className="text-[var(--text-2)] space-y-1">
                      <MathFormulaRenderer formula="1 \text{ ไร่} = 1,600 \text{ ม.}^2, \quad 1 \text{ งาน} = 400 \text{ ม.}^2, \quad 1 \text{ ตร.วา} = 4 \text{ ม.}^2" />
                      <p>แปลงเป็นตารางวารวม: {polygonCalc.areaSqM.toFixed(2)} / 4 = {polygonCalc.totalWah.toFixed(2)} ตารางวา</p>
                      <p className="font-semibold text-[var(--text-1)]">
                        ผลลัพธ์มาตราวัดไทย: {formatThaiLandString(polygonCalc.thaiLand.rai, polygonCalc.thaiLand.ngan, polygonCalc.thaiLand.wah)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          MODE 2: CLASSIC CONVERTER & LAND VALUATION ESTIMATOR
          ───────────────────────────────────────────────────────────────────────── */}
      {activeMode === 'converter' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Metric Input Card */}
            <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border dark:border-[#27272a]">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  หน่วยสากล (Metric Units)
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  พื้นที่เป็นตารางเมตร (Square Meters - m²)
                </label>
                <input
                  type="number"
                  step="0.01"
                  aria-label="พื้นที่เป็นตารางเมตร (Square Meters)"
                  value={sqMetersInput}
                  onChange={(e) => handleUpdateM2(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a]">
                  <span className="text-slate-400 block mb-0.5">เฮกตาร์ (Hectare):</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {converterResult.hectares.toLocaleString()} ha
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a]">
                  <span className="text-slate-400 block mb-0.5">เอเคอร์ (Acre):</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {converterResult.acres.toLocaleString()} ac
                  </span>
                </div>
              </div>
            </div>

            {/* Thai Cadastral Input Card */}
            <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border dark:border-[#27272a]">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  หน่วยโฉนดที่ดินไทย (Rai - Ngan - Wah)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    ไร่ (Rai)
                  </label>
                  <input
                    type="number"
                    aria-label="ไร่ (Rai)"
                    value={raiInput}
                    onChange={(e) => handleUpdateThai(e.target.value, nganInput, wahInput)}
                    className="w-full min-h-[44px] px-2.5 sm:px-3 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    งาน (Ngan)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    aria-label="งาน (Ngan)"
                    value={nganInput}
                    onChange={(e) => handleUpdateThai(raiInput, e.target.value, wahInput)}
                    className="w-full min-h-[44px] px-2.5 sm:px-3 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    ตารางวา (Wah²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="99.99"
                    aria-label="ตารางวา (Wah)"
                    value={wahInput}
                    onChange={(e) => handleUpdateThai(raiInput, nganInput, e.target.value)}
                    className="w-full min-h-[44px] px-2.5 sm:px-3 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/20 border border-indigo-500/20">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">
                  รูปแบบการเขียนตามโฉนดที่ดิน (Cadastral Format):
                </span>
                <span className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                  {formatThaiLandString(converterResult.rai, converterResult.ngan, converterResult.wah)}
                </span>
              </div>
            </div>

          </div>

          {/* Cadastral Valuation Calculator */}
          <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] border-l-2 border-l-indigo-500 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-border dark:border-[#27272a]">
              <div>
                <h4 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-white">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  การประเมินราคาที่ดินเบื้องต้น (Land Valuation Estimator)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  คำนวณมูลค่าที่ดินรวมจากราคาประเมินหรือราคาตลาดต่อตารางวา
                </p>
              </div>

              <div className="w-full sm:w-60">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  ราคาประเมินต่อตารางวา (บาท/ตร.ว.)
                </label>
                <input
                  type="number"
                  aria-label="ราคาประเมินต่อตารางวา (บาท/ตร.ว.)"
                  value={cadastralPricePerWah}
                  onChange={(e) => setCadastralPricePerWah(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a] text-slate-900 dark:text-white font-mono tabular-nums text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono tabular-nums text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a]">
                <span className="text-slate-400 block text-xs font-sans">จำนวนตารางวารวม:</span>
                <span className="font-bold text-base text-slate-900 dark:text-white">
                  {converterTotalWah.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ตร.ว.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a]">
                <span className="text-slate-400 block text-xs font-sans">ราคาเฉลี่ยต่อไร่:</span>
                <span className="font-bold text-base text-amber-600 dark:text-amber-400">
                  {(unitPrice * 400).toLocaleString('en-US')} บาท/ไร่
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 shadow-sm">
                <span className="text-slate-500 dark:text-slate-400 block text-xs font-sans">มูลค่ารวมโดยประมาณ:</span>
                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  {estimatedTotalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
