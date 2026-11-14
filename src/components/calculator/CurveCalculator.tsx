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
  Calculator
} from 'lucide-react';
import { exportToCsv } from '../../utils/csv-export';

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
  // Inputs
  const [radiusInput, setRadiusInput] = useState<string>('200');
  const [angleMode, setAngleMode] = useState<'DMS' | 'DEC'>('DMS');
  const [deltaDeg, setDeltaDeg] = useState<string>('35');
  const [deltaMin, setDeltaMin] = useState<string>('30');
  const [deltaSec, setDeltaSec] = useState<string>('00');
  const [deltaDec, setDeltaDec] = useState<string>('35.5');
  const [piStationInput, setPiStationInput] = useState<string>('10250');
  const [intervalInput, setIntervalInput] = useState<string>('10');
  
  const [isCopied, setIsCopied] = useState<boolean>(false);

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
    setRadiusInput('200');
    setAngleMode('DMS');
    setDeltaDeg('35');
    setDeltaMin('30');
    setDeltaSec('00');
    setDeltaDec('35.5');
    setPiStationInput('10250');
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

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>ค่าเริ่มต้น</span>
        </button>
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
            <div className="fusion-card p-8 text-center text-[var(--text-3)]">
              กรุณากรอกรัศมี R และมุม Δ เพื่อคำนวณองค์ประกอบโค้ง
            </div>
          )}
        </div>
      </div>

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
