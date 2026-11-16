import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  HelpCircle, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Scale, 
  ArrowRight,
  Info,
  Maximize2,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Calculator
} from 'lucide-react';
import { exportToCsv } from '../../utils/csv-export';
import { MathFormulaRenderer } from '../common/MathFormulaRenderer';
import { 
  computeStrapBeamComplete, 
  type StrapBeamInputs, 
  type StrapBeamResults, 
  type RebarOption 
} from '../../utils/strap-beam';

export type { StrapBeamInputs, StrapBeamResults, RebarOption };

export const StrapBeamCalculator: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  // Inputs state with practical defaults
  const [inputs, setInputs] = useState<StrapBeamInputs>({
    p1Tons: 40,
    p2Tons: 70,
    colSpacingM: 5.0,
    footing1LengthM: 1.8,
    col1WidthM: 0.30,
    qaTonsPerSqm: 15.0,
    beamWidthCm: 40,
    beamDepthCm: 70,
    rebarGrade: 'SD40',
    designMethod: 'WSD',
  });

  const [copied, setCopied] = useState<boolean>(false);
  const [showDerivation, setShowDerivation] = useState<boolean>(false);

  const loadSampleData = (preset: 'commercial' | 'factory' = 'commercial') => {
    setIsConfigured(true);
    if (preset === 'commercial') {
      setInputs({
        p1Tons: 40,
        p2Tons: 70,
        colSpacingM: 5.0,
        footing1LengthM: 1.8,
        col1WidthM: 0.30,
        qaTonsPerSqm: 15.0,
        beamWidthCm: 40,
        beamDepthCm: 70,
        rebarGrade: 'SD40',
        designMethod: 'WSD',
      });
    } else {
      setInputs({
        p1Tons: 25,
        p2Tons: 50,
        colSpacingM: 6.0,
        footing1LengthM: 1.5,
        col1WidthM: 0.25,
        qaTonsPerSqm: 18.0,
        beamWidthCm: 35,
        beamDepthCm: 65,
        rebarGrade: 'SD40',
        designMethod: 'WSD',
      });
    }
  };

  const updateInput = <K extends keyof StrapBeamInputs>(field: K, value: StrapBeamInputs[K]) => {
    setIsConfigured(true);
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  // Calculations via pure mechanics solver
  const results = useMemo(() => {
    return computeStrapBeamComplete(inputs);
  }, [inputs]);

  const eccentricityM = results.eccentricityM;

  const handleCopySummary = () => {
    const text = `=== รายงานการคำนวณฐานรากชิดเขตและคานรั้ง (Strap Beam Calculator) ===
น้ำหนักเสาภายนอก P1 = ${inputs.p1Tons} ตัน (เสา c1 = ${inputs.col1WidthM} ม.)
น้ำหนักเสาภายใน P2 = ${inputs.p2Tons} ตัน
ระยะห่างศูนย์เสา L = ${inputs.colSpacingM} ม.
ความยาวฐานรากตีนเป็ด L1 = ${inputs.footing1LengthM} ม.
ระยะเยื้องศูนย์ e = ${eccentricityM} ม.
กำลังแบกทานดิน qa = ${inputs.qaTonsPerSqm} ตัน/ตร.ม.

--- ผลการถ่ายแรงปฏิกิริยา ---
แรงปฏิกิริยาฐานรากชิดเขต R1 = ${results.r1} ตัน (+${results.r1IncreasePct}%)
แรงปฏิกิริยาฐานรากต้นใน R2 = ${results.r2} ตัน
สถานะการยกตัว (Uplift Check): ${results.isUplift ? 'CRITICAL UPLIFT!' : results.upliftWarning ? 'WARNING LOW BEARING' : 'SAFE (ไม่มีการยกตัว)'}

--- การออกแบบคานรั้ง (Strap Beam: ${inputs.beamWidthCm} x ${inputs.beamDepthCm} ซม.) ---
โมเมนต์ดัดสูงสุด Mmax = ${results.mMaxTonM} ตัน-เมตร (ดัดลบ - ดึงบน)
แรงเฉือนสูงสุด Vmax = ${results.maxShearTon} ตัน
พื้นที่เหล็กเสริมบนต้องการ As = ${results.finalAsCm2} ตร.ซม.
เหล็กเสริมที่แนะนำ: ${results.bestBar.text} (เหล็กบน)
เหล็กปลอกรับแรงเฉือน: ${results.stirrupText}
คำนวณตามมาตรฐาน: วสท. (${inputs.designMethod}) / กฎกระทรวง พ.ศ. 2566`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    const headers = ['Parameter / Item', 'Value', 'Unit'];
    const rows = [
      ['Exterior Column Load P1', inputs.p1Tons, 'ton'],
      ['Interior Column Load P2', inputs.p2Tons, 'ton'],
      ['Column Spacing L', inputs.colSpacingM, 'm'],
      ['Footing 1 Length L1', inputs.footing1LengthM, 'm'],
      ['Column 1 Width c1', inputs.col1WidthM, 'm'],
      ['Eccentricity e', eccentricityM, 'm'],
      ['Soil Bearing Capacity qa', inputs.qaTonsPerSqm, 'ton/m2'],
      ['Reaction R1 (Exterior)', results.r1, 'ton'],
      ['Reaction R2 (Interior)', results.r2, 'ton'],
      ['R1 Load Increase', `${results.r1IncreasePct}%`, '%'],
      ['Maximum Bending Moment Mmax', results.mMaxTonM, 'ton-m'],
      ['Maximum Shear Force Vmax', results.maxShearTon, 'ton'],
      ['Strap Beam Section', `${inputs.beamWidthCm}x${inputs.beamDepthCm}`, 'cm'],
      ['Required Top Steel Area As', results.finalAsCm2, 'cm2'],
      ['Recommended Rebar', results.bestBar.text, 'bars'],
      ['Stirrups', results.stirrupText, 'spacing'],
    ];
    exportToCsv({
      filename: 'Strap_Beam_Calculation_Result.csv',
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
              CALC-STRAP • ฐานรากตีนเป็ด & คานรั้ง
            </span>
            <span className="text-xs text-[var(--text-3)] font-mono">Boundary Footing & Cantilever Tie</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-1)] mt-1">
            คำนวณฐานรากชิดเขตและคานรั้ง (Strap Beam & Footing Calculator)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-2)] mt-0.5 max-w-3xl">
            แก้ปัญหาสมดุลฐานรากชิดแนวเขตที่ดินเพื่อนบ้าน คำนวณถ่ายแรงปฏิกิริยา R1, R2 ตรวจสอบการยกตัว (Uplift) โมเมนต์ดัด และพื้นที่เหล็กเสริมคานรั้ง
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => loadSampleData('commercial')}
            className="btn-outline min-h-[38px] text-xs inline-flex items-center gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
            title="โหลดข้อมูลตัวอย่างฐานรากชิดเขตอาคารพาณิชย์ P1=40t, P2=70t"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Sample Data</span>
          </button>
          <button
            type="button"
            onClick={() => setIsConfigured(false)}
            className="btn-outline min-h-[38px] text-xs inline-flex items-center gap-1.5 text-rose-500 hover:bg-rose-500/10 border-rose-500/30"
            title="ล้างการคำนวณเพื่อเริ่มฟอร์มว่างเปล่า (Blank Slate)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ว่างเปล่า</span>
          </button>
          <button
            type="button"
            onClick={handleCopySummary}
            disabled={!isConfigured || results.isInvalidGeometry}
            className="btn-outline min-h-[38px] text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกผล'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!isConfigured || results.isInvalidGeometry}
            className="btn-outline min-h-[38px] text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* ── Geometry Error Alert if Invalid ── */}
      {results.isInvalidGeometry && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <strong className="font-bold block">ข้อผิดพลาดทางเรขาคณิต: ระยะเยื้องศูนย์ e ({eccentricityM} ม.) ≥ ระยะห่างเสา L ({inputs.colSpacingM} ม.) !</strong>
            <p className="text-[var(--text-2)]">
              ขนาดฐานรากตีนเป็ด L1 กว้างเกินกว่าระยะห่างระหว่างเสา ทำให้ศูนย์กลางแรงปฏิกิริยาอยู่นอกช่วงคานรั้ง กรุณาลดขนาด L1 หรือเพิ่มระยะห่างเสา L
            </p>
          </div>
        </div>
      )}

      {/* ── Uplift Alert if Critical ── */}
      {!results.isInvalidGeometry && results.isUplift && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <strong className="font-bold block">เตือนวิกฤต: เกิดแรงยกตัว (Uplift) ที่ฐานรากต้นใน R2 ≤ 0 !</strong>
            <p className="text-[var(--text-2)]">
              น้ำหนักเสาภายนอกหรือระยะเยื้องศูนย์มีค่ามากเกินไปจนทำให้คานรั้งงัดฐานรากเสาต้นในลอยขึ้น ให้เพิ่มระยะห่างเสา L, เพิ่มน้ำหนักถ่วงที่เสาใน P2 หรือขยายฐานรากต้นใน
            </p>
          </div>
        </div>
      )}

      {/* ── 2-Column Main Layout: Left Inputs / Right Results & Diagram ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="fusion-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2 border-b border-[var(--border)] pb-2">
              <Building2 className="w-4 h-4 text-[var(--accent)]" />
              <span>พารามิเตอร์โครงสร้าง & เสา (Structural Inputs)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-[var(--text-2)] block mb-1">
                  แรงกดเสาชิดเขต P1 (ตัน)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={inputs.p1Tons}
                  onChange={e => updateInput('p1Tons', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-2)] block mb-1">
                  แรงกดเสาต้นใน P2 (ตัน)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={inputs.p2Tons}
                  onChange={e => updateInput('p2Tons', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-2)] block mb-1">
                  ระยะห่างศูนย์เสา L (ม.)
                </label>
                <input
                  type="number"
                  min="2"
                  step="0.1"
                  value={inputs.colSpacingM}
                  onChange={e => updateInput('colSpacingM', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-2)] block mb-1">
                  ขนาดเสาชิดเขต c1 (ม.)
                </label>
                <input
                  type="number"
                  min="0.15"
                  step="0.05"
                  value={inputs.col1WidthM}
                  onChange={e => updateInput('col1WidthM', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-2)] block mb-1">
                  ความยาวฐานรากตีนเป็ด L1 (ม.)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.1"
                  value={inputs.footing1LengthM}
                  onChange={e => updateInput('footing1LengthM', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-2)] block mb-1">
                  กำลังดิน qa (ตัน/ตร.ม.)
                </label>
                <input
                  type="number"
                  min="5"
                  step="1"
                  value={inputs.qaTonsPerSqm}
                  onChange={e => updateInput('qaTonsPerSqm', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm"
                />
              </div>
            </div>

            {/* Calculated Eccentricity Badge */}
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-xs">
              <span className="text-[var(--text-2)]">ระยะเยื้องศูนย์ e = (L1 - c1)/2 :</span>
              <span className="font-mono font-bold text-[var(--accent)] text-sm">{eccentricityM.toFixed(3)} ม.</span>
            </div>

            <h3 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2 border-t border-[var(--border)] pt-4 pb-1">
              <Scale className="w-4 h-4 text-[var(--accent)]" />
              <span>ขนาดคานรั้ง & สเปกเหล็ก (Strap Beam & Rebar)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-[var(--text-2)] block mb-1">
                  ความกว้างคาน b (ซม.)
                </label>
                <input
                  type="number"
                  min="20"
                  step="5"
                  value={inputs.beamWidthCm}
                  onChange={e => updateInput('beamWidthCm', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-2)] block mb-1">
                  ความลึกคาน h (ซม.)
                </label>
                <input
                  type="number"
                  min="30"
                  step="5"
                  value={inputs.beamDepthCm}
                  onChange={e => updateInput('beamDepthCm', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-2)] block mb-1">
                  เกรดเหล็กข้ออ้อย
                </label>
                <select
                  value={inputs.rebarGrade}
                  onChange={e => updateInput('rebarGrade', e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] text-xs"
                >
                  <option value="SD30">SD30 (fy = 3,000 ksc)</option>
                  <option value="SD40">SD40 (fy = 4,000 ksc)</option>
                  <option value="SD50">SD50 (fy = 5,000 ksc)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-2)] block mb-1">
                  วิธีคำนวณออกแบบ
                </label>
                <select
                  value={inputs.designMethod}
                  onChange={e => updateInput('designMethod', e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] text-xs"
                >
                  <option value="WSD">WSD (หน่วยแรงใช้งาน)</option>
                  <option value="SDM">SDM / USD (กำลังประลัย)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Dashboard & SVG Diagrams (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {!isConfigured ? (
            <div className="fusion-card p-8 sm:p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-500 shadow-sm">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-1)]">
                  ยังไม่ได้เริ่มการคำนวณคานรั้ง (Blank Slate)
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                  ปรับเปลี่ยนค่าน้ำหนักบรรทุกเสาและขนาดฐานรากในแผงด้านซ้าย หรือคลิกเพื่อโหลดชุดข้อมูลตัวอย่างสำหรับวิเคราะห์สมดุลแรงและตรวจสอบการงัดตัว (Uplift Check) ทันที
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => loadSampleData('commercial')}
                  className="btn-primary min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>⚡ โหลดตัวอย่างอาคารพาณิชย์ (P1=40t, P2=70t)</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleData('factory')}
                  className="btn-outline min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>ตัวอย่างโรงงาน (P1=25t, P2=50t)</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Reaction Summary Cards (4 Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="fusion-card p-3 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-3)] block uppercase">แรงตีนเป็ด R1</span>
              <span className="text-base sm:text-lg font-bold font-mono text-[var(--accent)]">{results.r1}</span>
              <span className="text-[10px] text-emerald-500 font-mono block">+{results.r1IncreasePct}% จาก P1</span>
            </div>

            <div className="fusion-card p-3 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-3)] block uppercase">แรงเสาใน R2</span>
              <span className={`text-base sm:text-lg font-bold font-mono ${results.isUplift ? 'text-rose-500' : 'text-[var(--text-1)]'}`}>
                {results.r2}
              </span>
              <span className="text-[10px] text-[var(--text-3)] font-mono block">ตัน</span>
            </div>

            <div className="fusion-card p-3 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-3)] block uppercase">โมเมนต์ดัด Mmax</span>
              <span className="text-base sm:text-lg font-bold font-mono text-[var(--text-1)]">{results.mMaxTonM}</span>
              <span className="text-[10px] text-[var(--text-3)] font-mono block">ตัน-เมตร</span>
            </div>

            <div className="fusion-card p-3 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-3)] block uppercase">เหล็กเสริมบน As</span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-500">{results.finalAsCm2}</span>
              <span className="text-[10px] text-[var(--text-3)] font-mono block">ตร.ซม.</span>
            </div>
          </div>

          {/* Interactive Structural Schematic & Diagrams */}
          <div className="fusion-card p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-bold text-[var(--text-1)] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--accent)]" />
                <span>แผนภาพกลศาสตร์คานรั้ง (Structural & Reaction Diagram)</span>
              </span>
              <span className="text-[10px] font-mono text-[var(--text-3)]">
                สเกลเรขาคณิตจำลอง
              </span>
            </div>

            {/* SVG Elevation Drawing */}
            <div className="w-full overflow-x-auto bg-[var(--surface-2)]/60 rounded-xl p-2 border border-[var(--border)]">
              <svg viewBox="0 0 540 220" className="w-full max-w-[540px] mx-auto text-xs font-mono select-none">
                {/* Defs for arrowheads */}
                <defs>
                  <marker id="arrow-down" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                  </marker>
                  <marker id="arrow-up" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                  </marker>
                </defs>

                {/* Ground line */}
                <line x1="20" y1="120" x2="520" y2="120" stroke="var(--border)" strokeWidth="2" />
                
                {/* Property Boundary Line (Red Dashed) */}
                <line x1="50" y1="20" x2="50" y2="200" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 3" />
                <text x="55" y="35" fill="#ef4444" fontSize="10" fontWeight="bold">แนวเขตที่ดิน (Property Line)</text>

                {/* Exterior Column C1 (Right against boundary) */}
                <rect x="50" y="50" width="30" height="70" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
                <text x="65" y="85" fill="var(--text-1)" textAnchor="middle" fontSize="10" fontWeight="bold">C1</text>
                
                {/* Column 1 Load Arrow P1 */}
                <line x1="65" y1="15" x2="65" y2="48" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrow-down)" />
                <text x="75" y="30" fill="#ef4444" fontSize="10" fontWeight="bold">P1={inputs.p1Tons}t</text>

                {/* Interior Column C2 (at distance L) */}
                <rect x="420" y="50" width="30" height="70" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
                <text x="435" y="85" fill="var(--text-1)" textAnchor="middle" fontSize="10" fontWeight="bold">C2</text>
                
                {/* Column 2 Load Arrow P2 */}
                <line x1="435" y1="15" x2="435" y2="48" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrow-down)" />
                <text x="445" y="30" fill="#ef4444" fontSize="10" fontWeight="bold">P2={inputs.p2Tons}t</text>

                {/* Strap Beam connecting both footings */}
                <rect x="50" y="100" width="400" height="28" fill="var(--accent)" fillOpacity="0.25" stroke="var(--accent)" strokeWidth="1.5" />
                <text x="250" y="118" fill="var(--text-1)" textAnchor="middle" fontSize="10" fontWeight="bold">
                  STRAP BEAM ({inputs.beamWidthCm}x{inputs.beamDepthCm} cm)
                </text>
                {/* Top tension rebar line inside strap beam */}
                <line x1="55" y1="104" x2="445" y2="104" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 2" />
                <text x="250" y="98" fill="#10b981" textAnchor="middle" fontSize="9" fontWeight="bold">
                  เหล็กเสริมบน (Top Rebar) รับโมเมนต์ดัดลบ
                </text>

                {/* Exterior Footing F1 (Eccentric, sitting on boundary) */}
                <rect x="50" y="128" width="90" height="35" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
                <text x="95" y="150" fill="var(--text-1)" textAnchor="middle" fontSize="10">F1 ({inputs.footing1LengthM}m)</text>

                {/* Interior Footing F2 (Concentric) */}
                <rect x="385" y="128" width="100" height="35" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
                <text x="435" y="150" fill="var(--text-1)" textAnchor="middle" fontSize="10">F2 (ศูนย์ร่วม)</text>

                {/* Soil Reaction R1 arrows */}
                <line x1="95" y1="195" x2="95" y2="165" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow-up)" />
                <text x="95" y="210" fill="#10b981" textAnchor="middle" fontSize="10" fontWeight="bold">R1={results.r1}t</text>

                {/* Soil Reaction R2 arrows */}
                <line x1="435" y1="195" x2="435" y2="165" stroke={results.isUplift ? '#ef4444' : '#10b981'} strokeWidth="2.5" markerEnd="url(#arrow-up)" />
                <text x="435" y="210" fill={results.isUplift ? '#ef4444' : '#10b981'} textAnchor="middle" fontSize="10" fontWeight="bold">
                  R2={results.r2}t
                </text>

                {/* Dimension Line L */}
                <line x1="65" y1="45" x2="435" y2="45" stroke="var(--text-3)" strokeWidth="1" strokeDasharray="2 2" />
                <text x="250" y="42" fill="var(--text-3)" textAnchor="middle" fontSize="9">ระยะห่าง L = {inputs.colSpacingM} ม.</text>
              </svg>
            </div>

            {/* Reinforcement Specification Box */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>ผลการออกแบบเหล็กเสริมคานรั้ง (Reinforcement Detail):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-3)] font-mono block">เหล็กเสริมบนรับโมเมนต์ดัด</span>
                  <span className="text-sm font-bold text-[var(--text-1)] block mt-0.5">
                    {results.bestBar.text}
                  </span>
                  <span className="text-[10px] text-[var(--text-2)]">ต้องการ As = {results.finalAsCm2} cm² (As,min = {results.asMinCm2} cm²)</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-3)] font-mono block">เหล็กปลอกรับแรงเฉือน</span>
                  <span className="text-sm font-bold text-[var(--text-1)] block mt-0.5">
                    {results.stirrupText}
                  </span>
                  <span className="text-[10px] text-[var(--text-2)]">แรงเฉือนสูงสุด Vmax = {results.maxShearTon} ตัน</span>
                </div>
              </div>

              {/* Alternate Rebar Options Pill Bar */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-mono text-[var(--text-3)] block">
                  ตัวเลือกขนาดเหล็กเสริมอื่นที่ใช้งานได้:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {results.recommendedBars.map((bar, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)]"
                    >
                      {bar.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Show Math Derivation Accordion */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
              <button
                type="button"
                onClick={() => setShowDerivation(v => !v)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold hover:bg-[var(--surface)] transition text-left"
                style={{ color: 'var(--text-1)' }}
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Show Math Derivation (แสดงวิธีทำและขั้นตอนแทนค่าสูตรสมดุลคานรั้ง)</span>
                </div>
                {showDerivation ? <ChevronUp className="w-4 h-4 text-[var(--text-3)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-3)]" />}
              </button>

              {showDerivation && (
                <div className="p-4 space-y-4 border-t text-xs" style={{ borderColor: 'var(--border)' }}>
                  {results.isInvalidGeometry ? (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-1.5">
                      <div className="font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <span>ข้อจำกัดทางเรขาคณิต (Invalid Footing Geometry)</span>
                      </div>
                      <p className="text-xs">
                        ระยะเยื้องศูนย์ e = ({inputs.footing1LengthM} - {inputs.col1WidthM}) / 2 = {eccentricityM.toFixed(3)} ม.
                        มีค่ามากกว่าหรือเท่ากับระยะห่างเสา L = {inputs.colSpacingM} ม. ส่งผลให้ช่วงคานประสิทธิผล L' = L - e ≤ 0 ม.
                      </p>
                      <p className="text-xs">
                        ไม่สามารถจัดวางฐานรากและคานรั้งได้ กรุณาลดขนาดความยาวฐานราก L1 หรือขยายระยะห่างศูนย์กลางเสา L ให้กว้างขึ้น
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Step 1: Eccentricity & Effective Span */}
                      <div className="p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-2">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          1. ระยะเยื้องศูนย์และช่วงคานประสิทธิผล (Eccentricity & Effective Span)
                        </div>
                        <div className="text-[var(--text-2)] space-y-1">
                          <MathFormulaRenderer formula="e = \frac{L_1 - c_1}{2}, \quad L' = L - e" />
                          <p>ระยะเยื้องศูนย์: e = ({inputs.footing1LengthM} - {inputs.col1WidthM}) / 2 = <strong>{eccentricityM.toFixed(3)} ม.</strong></p>
                          <p>ระยะช่วงคานระหว่างจุดศูนย์กลางแรงลัพธ์: L' = {inputs.colSpacingM} - {eccentricityM.toFixed(3)} = <strong>{(inputs.colSpacingM - eccentricityM).toFixed(3)} ม.</strong></p>
                        </div>
                      </div>

                      {/* Step 2: Reactions & Moment Equilibrium */}
                      <div className="p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-2">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          2. การถ่ายเทแรงปฏิกิริยาและสมดุลโมเมนต์ (Moment Equilibrium & Reactions)
                        </div>
                        <div className="text-[var(--text-2)] space-y-1.5">
                          <p>เทกโมเมนต์รอบจุดศูนย์กลางฐานราก F2 (ΣM_F2 = 0):</p>
                          <MathFormulaRenderer formula="R_1 \times (L - e) = P_1 \times L \implies R_1 = P_1 + \frac{P_1 \times e}{L - e}" />
                          <p>แทนค่า: R1 = {inputs.p1Tons} + ({inputs.p1Tons} × {eccentricityM.toFixed(3)}) / {(inputs.colSpacingM - eccentricityM).toFixed(3)} = <strong className="text-emerald-600 dark:text-emerald-400">{results.r1} ตัน</strong> (แรงถ่ายลงดินเพิ่มขึ้น +{results.r1IncreasePct}%)</p>
                          <p>จากสมดุลแนวดิ่ง (ΣFy = 0):</p>
                          <MathFormulaRenderer formula="R_2 = (P_1 + P_2) - R_1 = P_2 - \frac{P_1 \times e}{L - e}" />
                          <p>แทนค่า: R2 = {inputs.p2Tons} - ({inputs.p1Tons} × {eccentricityM.toFixed(3)}) / {(inputs.colSpacingM - eccentricityM).toFixed(3)} = <strong className="text-emerald-600 dark:text-emerald-400">{results.r2} ตัน</strong></p>
                          <p className="font-semibold text-[var(--text-1)]">
                            การตรวจสอบการยกตัว (Uplift Check): {results.isUplift ? '❌ CRITICAL UPLIFT!' : '✓ SAFE ไม่มีการยกตัว (R2 > 0)'}
                          </p>
                        </div>
                      </div>

                      {/* Step 3: Maximum Bending Moment & Shear */}
                      <div className="p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-2">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          3. โมเมนต์ดัดและแรงเฉือนสูงสุด (Bending Moment & Shear Force)
                        </div>
                        <div className="text-[var(--text-2)] space-y-1">
                          <p>โมเมนต์ดัดลบสูงสุด (ดึงบน) ในคานรั้งช่วงชิดเสา C1:</p>
                          <MathFormulaRenderer formula="M_{\text{max}} = P_1 \times e" />
                          <p>แทนค่า: Mmax = {inputs.p1Tons} × {eccentricityM.toFixed(3)} = <strong>{results.mMaxTonM} ตัน-เมตร</strong></p>
                          <p>แรงเฉือนสูงสุดในคานรั้ง:</p>
                          <MathFormulaRenderer formula="V_{\text{max}} = \max(P_1, R_1 - P_1)" />
                          <p>แทนค่า: Vmax = <strong>{results.maxShearTon} ตัน</strong></p>
                        </div>
                      </div>

                      {/* Step 4: Reinforcement Design */}
                      <div className="p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-2">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          4. การคำนวณพื้นที่เหล็กเสริมรับแรงดัด (Flexural Reinforcement As)
                        </div>
                        <div className="text-[var(--text-2)] space-y-1">
                          {inputs.designMethod === 'WSD' ? (
                            <>
                              <p>สูตรการออกแบบวิธีหน่วยแรงใช้งาน (WSD / {inputs.rebarGrade}):</p>
                              <MathFormulaRenderer formula="A_s = \frac{M_{\text{max}} \times 10^5}{f_s \cdot j \cdot d}" />
                              <p>โดยที่ fs = {inputs.rebarGrade === 'SD40' || inputs.rebarGrade === 'SD50' ? '1,700' : '1,500'} ksc, j ≈ 0.875, d = {(inputs.beamDepthCm - 6.5).toFixed(1)} ซม.</p>
                            </>
                          ) : (
                            <>
                              <p>สูตรการออกแบบวิธีกำลังประลัย (SDM / {inputs.rebarGrade}):</p>
                              <MathFormulaRenderer formula="M_u = 1.4 \times M_{\text{max}}, \quad A_s = \frac{M_u \times 10^5}{\phi \cdot f_y \cdot 0.90 \cdot d}" />
                              <p>โดยที่ ϕ = 0.90, fy = {inputs.rebarGrade === 'SD50' ? '5,000' : inputs.rebarGrade === 'SD40' ? '4,000' : '3,000'} ksc, d = {(inputs.beamDepthCm - 6.5).toFixed(1)} ซม.</p>
                            </>
                          )}
                          <p>พื้นที่เหล็กเสริมบนต้องการ: As = <strong>{results.finalAsCm2} ตร.ซม.</strong> (As,min = {results.asMinCm2} ตร.ซม.)</p>
                          <p>เหล็กเสริมบนที่จัด: <strong className="text-emerald-600 dark:text-emerald-400">{results.bestBar.text}</strong></p>
                          <p>เหล็กปลอกรับแรงเฉือน: <strong>{results.stirrupText}</strong></p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

            {/* Technical Rule Note */}
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--text-2)] space-y-1">
              <div className="flex items-center gap-1 font-bold text-[var(--text-1)]">
                <Info className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span>ข้อแนะนำวิศวกรรมสนาม (Field Geotechnical Pro-Tip):</span>
              </div>
              <p className="leading-relaxed pl-4">
                1. ฐานรากตีนเป็ด F1 ห้ามล้ำแนวเขตที่ดินเพื่อนบ้านแม้แต่เซนติเมตรเดียว (รวมคอนกรีตหยาบ Lean)<br />
                2. คานรั้ง Strap Beam ต้องมีความลึก (Depth) ไม่น้อยกว่า L/10 ถึง L/8 เพื่อรักษาความแข็งเกร็ง (Stiffness)<br />
                3. ดินใต้คานรั้งช่วงระหว่าง F1 และ F2 ควรขุดเปิดช่องว่าง 5-10 ซม. ไม่ให้ดินรับแรง เพื่อบังคับให้แรงถ่ายลงเฉพาะฐานรากทั้งสอง
              </p>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default StrapBeamCalculator;
