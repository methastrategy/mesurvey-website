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
  AlertCircle
} from 'lucide-react';
import { exportToCsv } from '../../utils/csv-export';
import { 
  computeStrapBeamComplete, 
  type StrapBeamInputs, 
  type StrapBeamResults, 
  type RebarOption 
} from '../../utils/strap-beam';

export type { StrapBeamInputs, StrapBeamResults, RebarOption };

export const StrapBeamCalculator: React.FC = () => {
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

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleCopySummary}
            disabled={results.isInvalidGeometry}
            className="btn-outline min-h-[38px] text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกผล'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={results.isInvalidGeometry}
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
                  onChange={e => setInputs({ ...inputs, p1Tons: parseFloat(e.target.value) || 0 })}
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
                  onChange={e => setInputs({ ...inputs, p2Tons: parseFloat(e.target.value) || 0 })}
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
                  onChange={e => setInputs({ ...inputs, colSpacingM: parseFloat(e.target.value) || 0 })}
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
                  onChange={e => setInputs({ ...inputs, col1WidthM: parseFloat(e.target.value) || 0 })}
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
                  onChange={e => setInputs({ ...inputs, footing1LengthM: parseFloat(e.target.value) || 0 })}
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
                  onChange={e => setInputs({ ...inputs, qaTonsPerSqm: parseFloat(e.target.value) || 0 })}
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
                  onChange={e => setInputs({ ...inputs, beamWidthCm: parseFloat(e.target.value) || 0 })}
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
                  onChange={e => setInputs({ ...inputs, beamDepthCm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-2)] block mb-1">
                  เกรดเหล็กข้ออ้อย
                </label>
                <select
                  value={inputs.rebarGrade}
                  onChange={e => setInputs({ ...inputs, rebarGrade: e.target.value as any })}
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
                  onChange={e => setInputs({ ...inputs, designMethod: e.target.value as any })}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrapBeamCalculator;
