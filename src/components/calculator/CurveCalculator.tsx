import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  Info, 
  Layers, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calculator,
  BookOpen
} from 'lucide-react';
import { exportToCsv } from '../../utils/csv-export';
import { MathFormulaRenderer } from '../common/MathFormulaRenderer';

export interface StakingPoint {
  station: number;
  stationStr: string;
  label: string;
  arcLength: number;
  deflectionDeg: number;
  deflectionDms: string;
  chordLength: number;
}

function decDegToDms(dd: number): { d: number; m: number; s: number; str: string } {
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const rem = (abs - d) * 60;
  const m = Math.floor(rem);
  const s = Math.round((rem - m) * 60 * 10) / 10;
  
  // handle rollover
  let finalS = s;
  let finalM = m;
  let finalD = d;
  if (finalS >= 60) {
    finalS = 0;
    finalM += 1;
  }
  if (finalM >= 60) {
    finalM = 0;
    finalD += 1;
  }

  const sStr = finalS < 10 ? `0${finalS.toFixed(1)}` : finalS.toFixed(1);
  const mStr = finalM < 10 ? `0${finalM}` : `${finalM}`;
  return {
    d: finalD,
    m: finalM,
    s: finalS,
    str: `${finalD}° ${mStr}' ${sStr}"`
  };
}

function formatStation(sta: number): string {
  const km = Math.floor(sta / 1000);
  const m = sta % 1000;
  const mStr = m.toFixed(2).padStart(6, '0');
  return `${km}+${mStr}`;
}

export const CurveCalculator: React.FC = () => {
  // Inputs (Blank Slate Defaults)
  const [radiusInput, setRadiusInput] = useState<string>('');
  const [angleMode, setAngleMode] = useState<'DMS' | 'DEC'>('DMS');
  const [deltaDeg, setDeltaDeg] = useState<string>('');
  const [deltaMin, setDeltaMin] = useState<string>('');
  const [deltaSec, setDeltaSec] = useState<string>('');
  const [deltaDec, setDeltaDec] = useState<string>('');
  const [piStationInput, setPiStationInput] = useState<string>('');
  const [intervalInput, setIntervalInput] = useState<string>('10');
  const [showDerivation, setShowDerivation] = useState<boolean>(false);
  
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const loadSampleData = (preset: 'highway' | 'ramp' | 'railway' = 'highway') => {
    if (preset === 'highway') {
      setRadiusInput('250');
      setAngleMode('DMS');
      setDeltaDeg('38');
      setDeltaMin('15');
      setDeltaSec('00');
      setDeltaDec('38.25');
      setPiStationInput('10250');
      setIntervalInput('10');
    } else if (preset === 'ramp') {
      setRadiusInput('85');
      setAngleMode('DMS');
      setDeltaDeg('55');
      setDeltaMin('30');
      setDeltaSec('00');
      setDeltaDec('55.5');
      setPiStationInput('1500');
      setIntervalInput('5');
    } else if (preset === 'railway') {
      setRadiusInput('600');
      setAngleMode('DMS');
      setDeltaDeg('24');
      setDeltaMin('40');
      setDeltaSec('00');
      setDeltaDec('24.667');
      setPiStationInput('25000');
      setIntervalInput('20');
    }
  };

  // Compute Delta Angle in Decimal Degrees
  const computedDelta = useMemo(() => {
    if (angleMode === 'DEC') {
      return parseFloat(deltaDec) || 0;
    }
    const d = parseFloat(deltaDeg) || 0;
    const m = parseFloat(deltaMin) || 0;
    const s = parseFloat(deltaSec) || 0;
    return d + m / 60 + s / 3600;
  }, [angleMode, deltaDeg, deltaMin, deltaSec, deltaDec]);

  // Curve Elements Calculation
  const curveElements = useMemo(() => {
    const R = parseFloat(radiusInput) || 0;
    const PI = parseFloat(piStationInput) || 0;
    const interval = parseFloat(intervalInput) || 10;

    if (R <= 0 || computedDelta <= 0 || computedDelta >= 180) {
      return null;
    }

    const deltaRad = (computedDelta * Math.PI) / 180;
    const T = R * Math.tan(deltaRad / 2);
    const L = R * deltaRad;
    const E = R * (1 / Math.cos(deltaRad / 2) - 1);
    const M = R * (1 - Math.cos(deltaRad / 2));
    const C = 2 * R * Math.sin(deltaRad / 2);
    const degreeOfCurve = (1145.916 / R); // For 20m arc/chord standard

    const staPC = PI - T;
    const staPT = staPC + L;

    // Generate Staking Points
    const stakingPoints: StakingPoint[] = [];

    // 1. Point of Curvature (PC)
    stakingPoints.push({
      station: staPC,
      stationStr: formatStation(staPC),
      label: 'PC (จุดเริ่มต้นโค้ง)',
      arcLength: 0,
      deflectionDeg: 0,
      deflectionDms: '00° 00\' 00.0"',
      chordLength: 0
    });

    // 2. Intermediate regular intervals
    let currSta = Math.ceil(staPC / interval) * interval;
    if (currSta === staPC) {
      currSta += interval;
    }

    while (currSta < staPT) {
      const arcL = currSta - staPC;
      const deflDeg = (arcL / (2 * R)) * (180 / Math.PI);
      const chord = 2 * R * Math.sin((deflDeg * Math.PI) / 180);

      stakingPoints.push({
        station: currSta,
        stationStr: formatStation(currSta),
        label: `Sta. ${formatStation(currSta)}`,
        arcLength: arcL,
        deflectionDeg: deflDeg,
        deflectionDms: decDegToDms(deflDeg).str,
        chordLength: chord
      });

      currSta += interval;
    }

    // 3. Point of Tangency (PT)
    const finalDefl = computedDelta / 2;
    stakingPoints.push({
      station: staPT,
      stationStr: formatStation(staPT),
      label: 'PT (จุดสิ้นสุดโค้ง)',
      arcLength: L,
      deflectionDeg: finalDefl,
      deflectionDms: decDegToDms(finalDefl).str,
      chordLength: C
    });

    return {
      R,
      PI,
      delta: computedDelta,
      deltaDms: decDegToDms(computedDelta).str,
      T,
      L,
      E,
      M,
      C,
      degreeOfCurve,
      staPC,
      staPT,
      stakingPoints
    };
  }, [radiusInput, computedDelta, piStationInput, intervalInput]);

  const handleCopyTable = () => {
    if (!curveElements) return;
    const header = "Station\tLabel\tArc Length (m)\tDeflection Angle\tChord Length (m)\n";
    const rows = curveElements.stakingPoints
      .map(p => `${p.stationStr}\t${p.label}\t${p.arcLength.toFixed(3)}\t${p.deflectionDms}\t${p.chordLength.toFixed(3)}`)
      .join("\n");
    navigator.clipboard.writeText(header + rows);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExportCsv = () => {
    if (!curveElements) return;
    const headers = ['Station', 'Station_Raw', 'Point_Type', 'Arc_Length_m', 'Deflection_Angle_DMS', 'Chord_Length_m'];
    const rows = curveElements.stakingPoints.map(p => [
      p.stationStr,
      p.station.toFixed(3),
      p.label,
      p.arcLength.toFixed(3),
      p.deflectionDms,
      p.chordLength.toFixed(3)
    ]);
    exportToCsv({
      filename: `Curve_Staking_R${curveElements.R}_Delta${curveElements.delta.toFixed(1)}.csv`,
      headers,
      rows,
    });
  };

  const handleReset = () => {
    setRadiusInput('');
    setAngleMode('DMS');
    setDeltaDeg('');
    setDeltaMin('');
    setDeltaSec('');
    setDeltaDec('');
    setPiStationInput('');
    setIntervalInput('10');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)] font-semibold">
              CALC-07 • ROUTE ENGINEERING
            </span>
            <span className="text-xs text-[var(--text-3)] font-mono">01218213 ROUTE SURVEY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-1)] mt-1">
            คำนวณโค้งราบ & ตารางวางผัง (Circular Curve Staking)
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-2)] mt-0.5">
            คำนวณองค์ประกอบโค้งเดี่ยว (Simple Curve) $R, \Delta \rightarrow T, L, E, M, C$ พร้อมตารางเปิดมุมเล็งเบี่ยงเบนและระยะคอร์ดสำหรับส่องกล้อง Total Station
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => loadSampleData('highway')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors shadow-xs"
            title="โหลดข้อมูลตัวอย่างโค้งถนนหลวง R=250m พร้อมคำนวณทันที"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Sample Data</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ค่าเริ่มต้น</span>
          </button>
        </div>
      </div>

      {/* ── Inputs Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Input Console (5 Cols) */}
        <div className="lg:col-span-5 fusion-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[var(--accent)]" />
              <span>พารามิเตอร์แนวโค้ง (Curve Inputs)</span>
            </h2>
            <div className="flex items-center gap-1 bg-[var(--surface-2)] p-0.5 rounded border border-[var(--border)] text-[11px]">
              <button
                onClick={() => setAngleMode('DMS')}
                className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                  angleMode === 'DMS' ? 'bg-[var(--surface)] text-[var(--text-1)] shadow-xs' : 'text-[var(--text-3)]'
                }`}
              >
                DMS
              </button>
              <button
                onClick={() => setAngleMode('DEC')}
                className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                  angleMode === 'DEC' ? 'bg-[var(--surface)] text-[var(--text-1)] shadow-xs' : 'text-[var(--text-3)]'
                }`}
              >
                DEG
              </button>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Radius */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                รัศมีความโค้ง Radius (R) [เมตร]
              </label>
              <input
                type="number"
                step="any"
                value={radiusInput}
                onChange={e => setRadiusInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm focus:outline-none focus:border-[var(--accent)]"
                placeholder="เช่น 200"
              />
            </div>

            {/* Delta Angle */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                มุมเบี่ยงเบนแนวสัมผัส Intersection Angle (Δ หรือ I)
              </label>
              {angleMode === 'DMS' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={deltaDeg}
                      onChange={e => setDeltaDeg(e.target.value)}
                      className="w-full px-2.5 py-2 pr-6 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm focus:outline-none focus:border-[var(--accent)]"
                      placeholder="องศา"
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-[var(--text-3)] font-mono">°</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={deltaMin}
                      onChange={e => setDeltaMin(e.target.value)}
                      className="w-full px-2.5 py-2 pr-6 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm focus:outline-none focus:border-[var(--accent)]"
                      placeholder="ลิปดา"
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-[var(--text-3)] font-mono">'</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={deltaSec}
                      onChange={e => setDeltaSec(e.target.value)}
                      className="w-full px-2.5 py-2 pr-6 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm focus:outline-none focus:border-[var(--accent)]"
                      placeholder="ฟิลิปดา"
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-[var(--text-3)] font-mono">"</span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={deltaDec}
                    onChange={e => setDeltaDec(e.target.value)}
                    className="w-full px-3 py-2 pr-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm focus:outline-none focus:border-[var(--accent)]"
                    placeholder="เช่น 35.5"
                  />
                  <span className="absolute right-3 top-2 text-xs text-[var(--text-3)] font-mono">°</span>
                </div>
              )}
            </div>

            {/* Station PI */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                  สเตชั่นจุดตัด Sta. PI
                </label>
                <input
                  type="number"
                  step="any"
                  value={piStationInput}
                  onChange={e => setPiStationInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm focus:outline-none focus:border-[var(--accent)]"
                  placeholder="เช่น 10250 (10+250)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                  ช่วงปักหมุด Interval (m)
                </label>
                <select
                  value={intervalInput}
                  onChange={e => setIntervalInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-sm focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="5">ทุก 5 เมตร</option>
                  <option value="10">ทุก 10 เมตร</option>
                  <option value="20">ทุก 20 เมตร</option>
                  <option value="25">ทุก 25 เมตร</option>
                </select>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[var(--text-3)] bg-[var(--surface-2)] p-2.5 rounded-lg border border-[var(--border)] space-y-1">
            <div className="font-semibold text-[var(--text-2)] flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>เกณฑ์มาตรฐานงานสำรวจทาง:</span>
            </div>
            <p>• T = R · tan(Δ/2) | L = R · Δ(rad)</p>
            <p>• สเตชั่น PC = PI - T | PT = PC + L (ห้ามบวก T จาก PI)</p>
          </div>
        </div>

        {/* Right Elements Display (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {curveElements ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="fusion-card p-3.5 space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-3)] font-semibold">TANGENT (T)</span>
                <p className="text-lg font-bold font-mono text-[var(--text-1)]">
                  {curveElements.T.toFixed(3)} <span className="text-xs font-normal text-[var(--text-3)]">ม.</span>
                </p>
                <span className="text-[10px] text-[var(--text-2)] block">ระยะสัมผัสแนวโค้ง</span>
              </div>

              <div className="fusion-card p-3.5 space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-3)] font-semibold">LENGTH (L)</span>
                <p className="text-lg font-bold font-mono text-[var(--text-1)]">
                  {curveElements.L.toFixed(3)} <span className="text-xs font-normal text-[var(--text-3)]">ม.</span>
                </p>
                <span className="text-[10px] text-[var(--text-2)] block">ความยาวโค้งทั้งหมด</span>
              </div>

              <div className="fusion-card p-3.5 space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-3)] font-semibold">EXTERNAL (E)</span>
                <p className="text-lg font-bold font-mono text-[var(--text-1)]">
                  {curveElements.E.toFixed(3)} <span className="text-xs font-normal text-[var(--text-3)]">ม.</span>
                </p>
                <span className="text-[10px] text-[var(--text-2)] block">ระยะภายนอก PI ถึงโค้ง</span>
              </div>

              <div className="fusion-card p-3.5 space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-3)] font-semibold">MID ORDINATE (M)</span>
                <p className="text-lg font-bold font-mono text-[var(--text-1)]">
                  {curveElements.M.toFixed(3)} <span className="text-xs font-normal text-[var(--text-3)]">ม.</span>
                </p>
                <span className="text-[10px] text-[var(--text-2)] block">ระยะจากคอร์ดถึงกึ่งกลางโค้ง</span>
              </div>

              <div className="fusion-card p-3.5 space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-3)] font-semibold">LONG CHORD (C)</span>
                <p className="text-lg font-bold font-mono text-[var(--text-1)]">
                  {curveElements.C.toFixed(3)} <span className="text-xs font-normal text-[var(--text-3)]">ม.</span>
                </p>
                <span className="text-[10px] text-[var(--text-2)] block">ระยะคอร์ดยาว PC-PT</span>
              </div>

              <div className="fusion-card p-3.5 space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-3)] font-semibold">DEGREE (D)</span>
                <p className="text-lg font-bold font-mono text-[var(--text-1)]">
                  {curveElements.degreeOfCurve.toFixed(2)}°
                </p>
                <span className="text-[10px] text-[var(--text-2)] block">องศาความโค้ง (20m Arc)</span>
              </div>

              {/* Station PC & PT Highlight Banners */}
              <div className="col-span-2 sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--accent)] block">POINT OF CURVE (PC)</span>
                    <span className="text-xs text-[var(--text-3)]">สเตชั่นเริ่มต้นโค้ง</span>
                  </div>
                  <span className="font-mono text-base font-bold text-[var(--text-1)]">
                    {formatStation(curveElements.staPC)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--accent)] block">POINT OF TANGENT (PT)</span>
                    <span className="text-xs text-[var(--text-3)]">สเตชั่นสิ้นสุดโค้ง</span>
                  </div>
                  <span className="font-mono text-base font-bold text-[var(--text-1)]">
                    {formatStation(curveElements.staPT)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="fusion-card p-8 sm:p-10 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-500 shadow-xs">
                <Compass className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="text-sm sm:text-base font-bold text-[var(--text-1)]">
                  ยังไม่ได้กำหนดพารามิเตอร์แนวโค้ง (Blank Slate)
                </h4>
                <p className="text-xs text-[var(--text-2)] leading-relaxed">
                  กรอกรัศมีความโค้ง $R$, มุมเบี่ยงเบน $\Delta$, และสถานีจุดตัด $PI$ ในแผงด้านซ้าย หรือคลิกเพื่อโหลดชุดข้อมูลตัวอย่าง
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => loadSampleData('highway')}
                  className="btn-primary min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>⚡ โหลดโค้งทางหลวง (R=250m)</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleData('ramp')}
                  className="btn-outline min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>ทางลาดชัน (R=85m)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Show Math Derivation Accordion ── */}
      {curveElements && (
        <div className="fusion-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDerivation(v => !v)}
            className="w-full p-4 flex items-center justify-between text-xs sm:text-sm font-semibold hover:bg-[var(--surface-2)] transition text-left"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[var(--text-1)] font-bold">Show Math Derivation (แสดงวิธีทำและขั้นตอนแทนค่าสูตรคำนวณโค้ง)</span>
            </div>
            {showDerivation ? <ChevronUp className="w-4 h-4 text-[var(--text-3)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-3)]" />}
          </button>

          {showDerivation && (
            <div className="p-5 space-y-4 border-t border-[var(--border)] text-xs bg-[var(--surface-2)]/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Tangent Length */}
                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                  <div className="font-bold text-[var(--text-1)]">
                    1. ความยาวเส้นสัมผัสโค้ง (Tangent Length, T)
                  </div>
                  <MathFormulaRenderer formula="T = R \cdot \tan\left(\frac{\Delta}{2}\right)" />
                  <p className="text-[var(--text-2)]">
                    แทนค่า: T = {curveElements.R} × tan({(curveElements.delta / 2).toFixed(4)}°) = <strong>{curveElements.T.toFixed(3)} ม.</strong>
                  </p>
                </div>

                {/* 2. Curve Length */}
                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                  <div className="font-bold text-[var(--text-1)]">
                    2. ความยาวส่วนโค้งทั้งหมด (Curve Length, L)
                  </div>
                  <MathFormulaRenderer formula="L = R \cdot \Delta_{\text{rad}} = R \cdot \left(\frac{\Delta^\circ \cdot \pi}{180^\circ}\right)" />
                  <p className="text-[var(--text-2)]">
                    แทนค่า: L = {curveElements.R} × ({curveElements.delta.toFixed(4)}° × π / 180°) = <strong>{curveElements.L.toFixed(3)} ม.</strong>
                  </p>
                </div>

                {/* 3. External Distance */}
                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                  <div className="font-bold text-[var(--text-1)]">
                    3. ระยะภายนอกจาก PI ถึงยอดโค้ง (External Distance, E)
                  </div>
                  <MathFormulaRenderer formula="E = R \cdot \left(\frac{1}{\cos(\Delta/2)} - 1\right)" />
                  <p className="text-[var(--text-2)]">
                    แทนค่า: E = {curveElements.R} × (1/cos({(curveElements.delta / 2).toFixed(4)}°) - 1) = <strong>{curveElements.E.toFixed(3)} ม.</strong>
                  </p>
                </div>

                {/* 4. Middle Ordinate */}
                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                  <div className="font-bold text-[var(--text-1)]">
                    4. ระยะกึ่งกลางคอร์ดถึงยอดโค้ง (Middle Ordinate, M)
                  </div>
                  <MathFormulaRenderer formula="M = R \cdot \left(1 - \cos\left(\frac{\Delta}{2}\right)\right)" />
                  <p className="text-[var(--text-2)]">
                    แทนค่า: M = {curveElements.R} × (1 - cos({(curveElements.delta / 2).toFixed(4)}°)) = <strong>{curveElements.M.toFixed(3)} ม.</strong>
                  </p>
                </div>

                {/* 5. Long Chord */}
                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                  <div className="font-bold text-[var(--text-1)]">
                    5. ระยะคอร์ดยาวรวม (Long Chord, C)
                  </div>
                  <MathFormulaRenderer formula="C = 2 R \cdot \sin\left(\frac{\Delta}{2}\right)" />
                  <p className="text-[var(--text-2)]">
                    แทนค่า: C = 2 × {curveElements.R} × sin({(curveElements.delta / 2).toFixed(4)}°) = <strong>{curveElements.C.toFixed(3)} ม.</strong>
                  </p>
                </div>

                {/* 6. Stationing */}
                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                  <div className="font-bold text-[var(--text-1)]">
                    6. การคำนวณสถานีหลัก (PC & PT Stationing)
                  </div>
                  <MathFormulaRenderer formula="\text{Sta. PC} = \text{Sta. PI} - T, \quad \text{Sta. PT} = \text{Sta. PC} + L" />
                  <p className="text-[var(--text-2)]">
                    PC = {formatStation(curveElements.PI)} - {curveElements.T.toFixed(3)} = <strong>{formatStation(curveElements.staPC)}</strong>
                  </p>
                  <p className="text-[var(--text-2)]">
                    PT = {formatStation(curveElements.staPC)} + {curveElements.L.toFixed(3)} = <strong>{formatStation(curveElements.staPT)}</strong>
                  </p>
                </div>
              </div>

              {/* 7. Deflection Angle and Subchord Method */}
              <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                <div className="font-bold text-[var(--text-1)]">
                  7. สูตรเปิดมุมเล็งเบี่ยงเบนและระยะคอร์ดย่อยสำหรับกล้อง Total Station (Deflection Angle & Chord Method)
                </div>
                <div className="text-[var(--text-2)] space-y-1">
                  <MathFormulaRenderer formula="\delta_i = \left( \frac{l_i}{2R} \right) \times \left( \frac{180^\circ}{\pi} \right), \quad c_i = 2 R \cdot \sin(\delta_i)" />
                  <p className="text-[var(--text-2)]">โดยที่ li คือความยาวส่วนโค้งสะสมจากจุดสัมผัส PC ถึงสเตชั่นที่ i (li = Sta_i - Sta. PC)</p>
                  <p className="text-[var(--text-2)]">มุมเปิดเล็งเบี่ยงเบนทั้งหมดจาก PC ถึง PT ต้องเท่ากับครึ่งหนึ่งของมุมเบี่ยงเบนแนวสัมผัสพอดี: δ_PT = Δ / 2 = {(curveElements.delta / 2).toFixed(4)}°</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Staking Out Table ── */}
      {curveElements && (
        <div className="fusion-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[var(--accent)]" />
                <span>ตารางเปิดมุมเล็งเบี่ยงเบนและระยะคอร์ด (Total Station Staking Table)</span>
              </h2>
              <p className="text-xs text-[var(--text-3)] font-mono mt-0.5">
                ตั้งกล้องที่สถานี PC ส่องศูนย์ไปที่ PI แล้วเปิดมุม Deflection Angle ไปยังแต่ละสเตชั่น
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleCopyTable}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอกตาราง'}</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-black dark:text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ส่งออก CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-3)] bg-[var(--surface-2)]">
                  <th className="py-2.5 px-3 font-semibold">STATION</th>
                  <th className="py-2.5 px-3 font-semibold">POINT LABEL</th>
                  <th className="py-2.5 px-3 font-semibold text-right">ARC LENGTH (m)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">DEFLECTION ANGLE (DMS)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">CHORD LENGTH (m)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {curveElements.stakingPoints.map((pt, idx) => (
                  <tr 
                    key={idx}
                    className={`hover:bg-[var(--surface-2)] transition-colors ${
                      idx === 0 || idx === curveElements.stakingPoints.length - 1
                        ? 'font-bold bg-[var(--surface-2)]/50'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-[var(--text-1)]">{pt.stationStr}</td>
                    <td className="py-2.5 px-3 text-[var(--text-2)] font-sans">{pt.label}</td>
                    <td className="py-2.5 px-3 text-right text-[var(--text-1)]">{pt.arcLength.toFixed(3)}</td>
                    <td className="py-2.5 px-3 text-center text-[var(--accent)] font-bold">{pt.deflectionDms}</td>
                    <td className="py-2.5 px-3 text-right text-[var(--text-1)]">{pt.chordLength.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
