import React, { useState } from 'react';
import { 
  Network, 
  Ruler, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  MapPin, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Plus, 
  Trash2,
  TrendingUp,
  Compass,
  ArrowRight
} from 'lucide-react';
import {
  adjust1DLevelingNetwork,
  adjust2DNetwork,
  SAMPLE_LEVELING_NETWORK,
  SAMPLE_2D_TRAVERSE_NETWORK,
  type LevelingPoint,
  type LevelingObservation,
  type LevelingAdjustmentResult,
  type Station2D,
  type Observation2D,
  type Network2DAdjustmentResult
} from '../../utils/least-squares';

interface NetworkAdjustmentProps {
  onPlotOnMap?: (lat: number, lng: number, label: string) => void;
}

export const NetworkAdjustment: React.FC<NetworkAdjustmentProps> = ({ onPlotOnMap }) => {
  const [mode, setMode] = useState<'2d' | '1d'>('2d');
  const [copied, setCopied] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // 2D Network State
  // ─────────────────────────────────────────────────────────────────────────
  const [stations2D, setStations2D] = useState<Station2D[]>(SAMPLE_2D_TRAVERSE_NETWORK.stations);
  const [obs2D, setObs2D] = useState<Observation2D[]>(SAMPLE_2D_TRAVERSE_NETWORK.observations);
  const [result2D, setResult2D] = useState<Network2DAdjustmentResult | null>(() => {
    try {
      return adjust2DNetwork(SAMPLE_2D_TRAVERSE_NETWORK.stations, SAMPLE_2D_TRAVERSE_NETWORK.observations);
    } catch {
      return null;
    }
  });
  const [error2D, setError2D] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // 1D Leveling State
  // ─────────────────────────────────────────────────────────────────────────
  const [points1D, setPoints1D] = useState<LevelingPoint[]>(SAMPLE_LEVELING_NETWORK.points);
  const [obs1D, setObs1D] = useState<LevelingObservation[]>(SAMPLE_LEVELING_NETWORK.observations);
  const [result1D, setResult1D] = useState<LevelingAdjustmentResult | null>(() => {
    try {
      return adjust1DLevelingNetwork(SAMPLE_LEVELING_NETWORK.points, SAMPLE_LEVELING_NETWORK.observations);
    } catch {
      return null;
    }
  });
  const [error1D, setError1D] = useState<string | null>(null);

  // Run 2D Adjustment
  const handleSolve2D = () => {
    setError2D(null);
    try {
      const res = adjust2DNetwork(stations2D, obs2D);
      setResult2D(res);
    } catch (err) {
      setError2D(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการคำนวณปรับแก้ 2D');
    }
  };

  // Run 1D Adjustment
  const handleSolve1D = () => {
    setError1D(null);
    try {
      const res = adjust1DLevelingNetwork(points1D, obs1D);
      setResult1D(res);
    } catch (err) {
      setError1D(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการคำนวณปรับแก้ 1D');
    }
  };

  // Load Samples
  const handleLoadSample2D = () => {
    setStations2D(SAMPLE_2D_TRAVERSE_NETWORK.stations);
    setObs2D(SAMPLE_2D_TRAVERSE_NETWORK.observations);
    setError2D(null);
    try {
      setResult2D(adjust2DNetwork(SAMPLE_2D_TRAVERSE_NETWORK.stations, SAMPLE_2D_TRAVERSE_NETWORK.observations));
    } catch (e) {
      setError2D(String(e));
    }
  };

  const handleLoadSample1D = () => {
    setPoints1D(SAMPLE_LEVELING_NETWORK.points);
    setObs1D(SAMPLE_LEVELING_NETWORK.observations);
    setError1D(null);
    try {
      setResult1D(adjust1DLevelingNetwork(SAMPLE_LEVELING_NETWORK.points, SAMPLE_LEVELING_NETWORK.observations));
    } catch (e) {
      setError1D(String(e));
    }
  };

  // Copy Summary
  const handleCopyReport = () => {
    let reportText = '';
    if (mode === '2d' && result2D) {
      reportText = `=== MESURV 2D NETWORK ADJUSTMENT REPORT (LEAST SQUARES) ===\n` +
        `Converged: ${result2D.converged} in ${result2D.iterations} iterations\n` +
        `Degrees of Freedom (r): ${result2D.dof}\n` +
        `Std Error of Unit Weight (sigma0): ${result2D.sigma0.toFixed(4)}\n` +
        `Global Chi-Square Test: ${result2D.chiSquarePassed ? 'PASSED (95%)' : 'OUTSIDE BOUNDS'}\n\n` +
        `ADJUSTED STATIONS:\n` +
        result2D.stations.map(s => 
          `${s.id} ${s.isFixed ? '[FIXED]' : ''}: E = ${s.easting.toFixed(4)} m, N = ${s.northing.toFixed(4)} m` +
          (!s.isFixed && s.errorEllipse 
            ? ` | a = ${s.errorEllipse.semiMajorAxisMm.toFixed(1)} mm, b = ${s.errorEllipse.semiMinorAxisMm.toFixed(1)} mm, theta = ${s.errorEllipse.orientationDeg.toFixed(1)} deg` 
            : '')
        ).join('\n');
    } else if (mode === '1d' && result1D) {
      reportText = `=== MESURV 1D LEVELING ADJUSTMENT REPORT (LEAST SQUARES) ===\n` +
        `Degrees of Freedom (r): ${result1D.dof}\n` +
        `Std Error of Unit Weight: ${result1D.sigma0.toFixed(4)}\n` +
        `Total Absolute Residuals: ${result1D.totalMisclosureMm.toFixed(1)} mm\n\n` +
        `ADJUSTED BENCHMARKS:\n` +
        result1D.points.map(p => 
          `${p.id} ${p.isFixed ? '[FIXED]' : ''}: Elev = ${p.adjustedElevation.toFixed(4)} m (sigma = ${p.stdDevMm.toFixed(1)} mm)`
        ).join('\n');
    }

    if (reportText) {
      navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── Header Card ── */}
      <div className="fusion-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                TOOL-06
              </span>
              <span className="text-xs font-mono text-[var(--text-3)] uppercase tracking-wider">
                Geodetic Least Squares
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-1)] tracking-tight">
              การปรับแก้โครงข่ายรังวัด (Network Adjustment)
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-2)] max-w-2xl leading-relaxed">
              คำนวณปรับแก้โครงข่ายรังวัดด้วยวิธีผลบวกกำลังสองน้อยที่สุด (Gauss-Markov Least Squares) วิเคราะห์วงรีความคลาดเคลื่อน (95% Error Ellipses) และตรวจจับข้อผิดพลาดหยาบ (Baarda Data Snooping)
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setMode('2d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === '2d'
                  ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>โครงข่ายราบ 2D & วงรี</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('1d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === '1d'
                  ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>โครงข่ายระดับ 1D</span>
            </button>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={mode === '2d' ? handleLoadSample2D : handleLoadSample1D}
              className="px-3 py-1.5 rounded-[var(--btn-radius)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] font-semibold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>โหลดตัวอย่างโครงข่าย</span>
            </button>
            <button
              type="button"
              onClick={mode === '2d' ? handleSolve2D : handleSolve1D}
              className="px-3 py-1.5 rounded-[var(--btn-radius)] bg-[var(--accent)] hover:opacity-90 text-black dark:text-white font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>คำนวณปรับแก้ (Compute LSA)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyReport}
            className="px-3 py-1.5 rounded-[var(--btn-radius)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] font-semibold transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกรายงาน'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {(mode === '2d' ? error2D : error1D) && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{mode === '2d' ? error2D : error1D}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2D NETWORK ADJUSTMENT VIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {mode === '2d' && result2D && (
        <div className="space-y-6">
          
          {/* Executive Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="fusion-card p-4 space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-3)] uppercase">Degree of Freedom (r)</span>
              <p className="text-xl sm:text-2xl font-black font-mono text-[var(--text-1)]">
                {result2D.dof}
              </p>
              <span className="text-[10px] text-[var(--text-3)]">n = {result2D.observations.length}, u = {result2D.stations.filter(s=>!s.isFixed).length * 2}</span>
            </div>

            <div className="fusion-card p-4 space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-3)] uppercase">Std Error (σ₀)</span>
              <p className="text-xl sm:text-2xl font-black font-mono text-[var(--accent)]">
                {result2D.sigma0.toFixed(3)}
              </p>
              <span className="text-[10px] text-[var(--text-3)]">ลู่เข้าใน {result2D.iterations} รอบ</span>
            </div>

            <div className="fusion-card p-4 space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-3)] uppercase">Chi-Square Test (95%)</span>
              <div className="flex items-center gap-1.5">
                {result2D.chiSquarePassed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-500 font-mono">PASSED</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-amber-500 font-mono">WARNING</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-[var(--text-3)] font-mono">
                [{result2D.chiSquareBounds[0].toFixed(1)}, {result2D.chiSquareBounds[1].toFixed(1)}]
              </span>
            </div>

            <div className="fusion-card p-4 space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-3)] uppercase">Outlier Detection</span>
              <div className="flex items-center gap-1.5">
                {result2D.observations.some(o => o.isOutlier) ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span className="text-sm font-bold text-rose-500 font-mono">พบ Blunder</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-500 font-mono">CLEAN (0)</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-[var(--text-3)]">เกณฑ์ Baarda w &gt; 2.576</span>
            </div>
          </div>

          {/* Adjusted Stations & Error Ellipses Table */}
          <div className="fusion-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[var(--accent)]" />
                <span>พิกัดปรับแก้และวงรีความคลาดเคลื่อน (Adjusted Coordinates & 95% Error Ellipses)</span>
              </h2>
              <span className="text-xs font-mono text-[var(--text-3)]">UTM Projection</span>
            </div>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-3)] font-mono">
                    <th className="py-2.5 px-2">หมุด (Station)</th>
                    <th className="py-2.5 px-2">สถานะ</th>
                    <th className="py-2.5 px-2 text-right">Easting (m)</th>
                    <th className="py-2.5 px-2 text-right">Northing (m)</th>
                    <th className="py-2.5 px-2 text-right">σE (mm)</th>
                    <th className="py-2.5 px-2 text-right">σN (mm)</th>
                    <th className="py-2.5 px-2 text-right">แกนเอก a (mm)</th>
                    <th className="py-2.5 px-2 text-right">แกนโท b (mm)</th>
                    <th className="py-2.5 px-2 text-right">ทิศทาง θ (°)</th>
                    <th className="py-2.5 px-2 text-right">95% a₉₅ (mm)</th>
                    <th className="py-2.5 px-2 text-center">แผนที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {result2D.stations.map((stn) => (
                    <tr key={stn.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="py-2.5 px-2 font-bold font-mono text-[var(--text-1)]">{stn.id}</td>
                      <td className="py-2.5 px-2">
                        {stn.isFixed ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-mono text-[10px] font-bold border border-emerald-500/30">
                            FIXED
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-2)] font-mono text-[10px] border border-[var(--border)]">
                            ADJUSTED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-[var(--text-1)]">{stn.easting.toFixed(4)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-[var(--text-1)]">{stn.northing.toFixed(4)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-[var(--text-2)]">{stn.sigmaEMm.toFixed(1)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-[var(--text-2)]">{stn.sigmaNMm.toFixed(1)}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold text-[var(--accent)]">
                        {stn.errorEllipse?.semiMajorAxisMm.toFixed(1) ?? '-'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-[var(--text-2)]">
                        {stn.errorEllipse?.semiMinorAxisMm.toFixed(1) ?? '-'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-[var(--text-2)]">
                        {stn.errorEllipse ? `${stn.errorEllipse.orientationDeg.toFixed(1)}°` : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-amber-500">
                        {stn.errorEllipse?.conf95MajorMm.toFixed(1) ?? '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {onPlotOnMap && (
                          <button
                            type="button"
                            onClick={() => onPlotOnMap(13.8476, 100.5696, stn.id)}
                            className="p-1 rounded hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--accent)] transition-colors"
                            title="พล็อตบนแผนที่ WebGIS"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Observations Residuals Table */}
          <div className="fusion-card p-5 space-y-4">
            <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[var(--accent)]" />
              <span>ค่าสังเกต เศษเหลือ และการตรวจข้อผิดพลาด (Residuals & Data Snooping)</span>
            </h2>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-3)] font-mono">
                    <th className="py-2 px-2">ID</th>
                    <th className="py-2 px-2">ประเภท</th>
                    <th className="py-2 px-2">จาก (From)</th>
                    <th className="py-2 px-2">ถึง (To)</th>
                    <th className="py-2 px-2 text-right">ค่ารังวัด (Obs)</th>
                    <th className="py-2 px-2 text-right">ค่าปรับแก้ (Adj)</th>
                    <th className="py-2 px-2 text-right">เศษเหลือ (v)</th>
                    <th className="py-2 px-2 text-right">Normalized (w)</th>
                    <th className="py-2 px-2 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {result2D.observations.map((obs) => (
                    <tr key={obs.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="py-2 px-2 font-mono font-bold text-[var(--text-1)]">{obs.id}</td>
                      <td className="py-2 px-2 font-mono text-[var(--text-2)] uppercase">{obs.type}</td>
                      <td className="py-2 px-2 font-mono">{obs.fromStation}</td>
                      <td className="py-2 px-2 font-mono">{obs.toStation}</td>
                      <td className="py-2 px-2 text-right font-mono">{obs.measured.toFixed(3)}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-[var(--text-1)]">{obs.adjusted.toFixed(3)}</td>
                      <td className="py-2 px-2 text-right font-mono text-[var(--accent)]">
                        {obs.type === 'azimuth' ? `${obs.residual.toFixed(1)}"` : `${(obs.residual * 1000).toFixed(1)} mm`}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-semibold">
                        {obs.normalizedResidual.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {obs.isOutlier ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 text-[10px] font-bold border border-rose-500/30">
                            OUTLIER
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px] font-bold border border-emerald-500/30">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1D LEVELING ADJUSTMENT VIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {mode === '1d' && result1D && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="fusion-card p-4 space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-3)] uppercase">Degree of Freedom (r)</span>
              <p className="text-xl sm:text-2xl font-black font-mono text-[var(--text-1)]">
                {result1D.dof}
              </p>
              <span className="text-[10px] text-[var(--text-3)]">n = {result1D.observations.length}, u = {result1D.points.filter(p=>!p.isFixed).length}</span>
            </div>

            <div className="fusion-card p-4 space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-3)] uppercase">Std Error (σ₀)</span>
              <p className="text-xl sm:text-2xl font-black font-mono text-[var(--accent)]">
                {result1D.sigma0.toFixed(3)}
              </p>
              <span className="text-[10px] text-[var(--text-3)]">Reference Unit Weight</span>
            </div>

            <div className="fusion-card p-4 space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-3)] uppercase">Total Misclosure</span>
              <p className="text-xl sm:text-2xl font-black font-mono text-[var(--text-1)]">
                {result1D.totalMisclosureMm.toFixed(1)} <span className="text-xs font-normal">mm</span>
              </p>
              <span className="text-[10px] text-[var(--text-3)]">Σ |v| ทุกเส้นทาง</span>
            </div>

            <div className="fusion-card p-4 space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-3)] uppercase">Blunder Check</span>
              <div className="flex items-center gap-1.5">
                {result1D.hasOutliers ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span className="text-sm font-bold text-rose-500 font-mono">พบข้อผิดพลาด</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-500 font-mono">PASSED</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-[var(--text-3)]">เกณฑ์ 99% Baarda Test</span>
            </div>
          </div>

          {/* Adjusted Elevations Table */}
          <div className="fusion-card p-5 space-y-4">
            <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2">
              <Ruler className="w-4 h-4 text-[var(--accent)]" />
              <span>ระดับความสูงปรับแก้ (Adjusted Elevations & Standard Errors)</span>
            </h2>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-3)] font-mono">
                    <th className="py-2.5 px-2">หมุดระดับ (Benchmark)</th>
                    <th className="py-2.5 px-2">สถานะ</th>
                    <th className="py-2.5 px-2 text-right">ระดับความสูงปรับแก้ H (m MSL)</th>
                    <th className="py-2.5 px-2 text-right">ความคลาดเคลื่อนมาตรฐาน σH (mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {result1D.points.map((pt) => (
                    <tr key={pt.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="py-2.5 px-2 font-bold font-mono text-[var(--text-1)]">{pt.id}</td>
                      <td className="py-2.5 px-2">
                        {pt.isFixed ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-mono text-[10px] font-bold border border-emerald-500/30">
                            FIXED BM
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-2)] font-mono text-[10px] border border-[var(--border)]">
                            ADJUSTED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-[var(--accent)] text-sm">
                        {pt.adjustedElevation.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-[var(--text-2)]">
                        {pt.stdDevMm.toFixed(2)} mm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leveling Lines Residuals Table */}
          <div className="fusion-card p-5 space-y-4">
            <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[var(--accent)]" />
              <span>ผลการรังวัดเส้นทางระดับและเศษเหลือ (Leveling Runs & Residuals)</span>
            </h2>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-3)] font-mono">
                    <th className="py-2 px-2">ID</th>
                    <th className="py-2 px-2">จาก (From)</th>
                    <th className="py-2 px-2">ถึง (To)</th>
                    <th className="py-2 px-2 text-right">ผลต่างรังวัด Δh (m)</th>
                    <th className="py-2 px-2 text-right">ผลต่างปรับแก้ (m)</th>
                    <th className="py-2 px-2 text-right">เศษเหลือ v (mm)</th>
                    <th className="py-2 px-2 text-right">Normalized (w)</th>
                    <th className="py-2 px-2 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {result1D.observations.map((obs) => (
                    <tr key={obs.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="py-2 px-2 font-mono font-bold text-[var(--text-1)]">{obs.id}</td>
                      <td className="py-2 px-2 font-mono">{obs.fromStation}</td>
                      <td className="py-2 px-2 font-mono">{obs.toStation}</td>
                      <td className="py-2 px-2 text-right font-mono">{obs.measuredDh.toFixed(4)}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-[var(--text-1)]">{obs.adjustedDh.toFixed(4)}</td>
                      <td className="py-2 px-2 text-right font-mono text-[var(--accent)] font-semibold">
                        {obs.residualMm > 0 ? `+${obs.residualMm.toFixed(1)}` : obs.residualMm.toFixed(1)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">{obs.normalizedResidual.toFixed(2)}</td>
                      <td className="py-2 px-2 text-center">
                        {obs.isOutlier ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 text-[10px] font-bold border border-rose-500/30">
                            BLUNDER
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px] font-bold border border-emerald-500/30">
                            PASS
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
