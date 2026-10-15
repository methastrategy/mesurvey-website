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
  Compass, 
  Satellite, 
  Radio, 
  ArrowRight,
  TrendingUp,
  Download,
  ShieldCheck,
  Layers
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
import {
  parseRinexText,
  SAMPLE_RINEX_BASE,
  SAMPLE_RINEX_ROVER,
  type RinexParseResult,
  type SatelliteTrack
} from '../../utils/rinex-parser';
import {
  solveStaticBaseline,
  type BaselineSolution
} from '../../utils/gnss-baseline';
import { EmbeddedNetworkMap } from './EmbeddedNetworkMap';

interface NetworkAdjustmentProps {
  onPlotOnMap?: (lat: number, lng: number, label: string) => void;
}

export type StudioTab = 'ingestion' | 'baseline' | 'adjustment' | 'report';

export const NetworkAdjustment: React.FC<NetworkAdjustmentProps> = ({ onPlotOnMap }) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('ingestion');
  const [copied, setCopied] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. RINEX INGESTION STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [baseRinex, setBaseRinex] = useState<RinexParseResult>(() => parseRinexText(SAMPLE_RINEX_BASE));
  const [roverRinex, setRoverRinex] = useState<RinexParseResult>(() => parseRinexText(SAMPLE_RINEX_ROVER));
  const [selectedStationView, setSelectedStationView] = useState<'base' | 'rover'>('base');
  const [constellationFilter, setConstellationFilter] = useState<string>('ALL');

  // ─────────────────────────────────────────────────────────────────────────
  // 2. BASELINE PROCESSING STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [baselineSolution, setBaselineSolution] = useState<BaselineSolution | null>(() => {
    try {
      return solveStaticBaseline(parseRinexText(SAMPLE_RINEX_BASE), parseRinexText(SAMPLE_RINEX_ROVER));
    } catch {
      return null;
    }
  });
  const [elevMask, setElevMask] = useState<number>(15);
  const [baselineError, setBaselineError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. NETWORK ADJUSTMENT STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [adjustmentMode, setAdjustmentMode] = useState<'2d' | '1d'>('2d');
  const [stations2D, setStations2D] = useState<Station2D[]>(SAMPLE_2D_TRAVERSE_NETWORK.stations);
  const [obs2D, setObs2D] = useState<Observation2D[]>(SAMPLE_2D_TRAVERSE_NETWORK.observations);
  const [result2D, setResult2D] = useState<Network2DAdjustmentResult | null>(() => {
    try {
      return adjust2DNetwork(SAMPLE_2D_TRAVERSE_NETWORK.stations, SAMPLE_2D_TRAVERSE_NETWORK.observations);
    } catch {
      return null;
    }
  });

  const [points1D, setPoints1D] = useState<LevelingPoint[]>(SAMPLE_LEVELING_NETWORK.points);
  const [obs1D, setObs1D] = useState<LevelingObservation[]>(SAMPLE_LEVELING_NETWORK.observations);
  const [result1D, setResult1D] = useState<LevelingAdjustmentResult | null>(() => {
    try {
      return adjust1DLevelingNetwork(SAMPLE_LEVELING_NETWORK.points, SAMPLE_LEVELING_NETWORK.observations);
    } catch {
      return null;
    }
  });
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);

  // Re-solve Baseline
  const handleSolveBaseline = () => {
    setBaselineError(null);
    try {
      const sol = solveStaticBaseline(baseRinex, roverRinex, { elevationMaskDeg: elevMask });
      setBaselineSolution(sol);
    } catch (err) {
      setBaselineError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการคำนวณเวกเตอร์ฐาน');
    }
  };

  // Transfer Baseline into 2D Network Adjustment
  const handleTransferToAdjustment = () => {
    if (!baselineSolution) return;

    const baseName = baselineSolution.baseStation;
    const roverName = baselineSolution.roverStation;

    // Check if stations already exist in 2D stations list
    const existingBase = stations2D.find(s => s.id === baseName);
    const existingRover = stations2D.find(s => s.id === roverName);

    const updatedStations = [...stations2D];
    if (!existingBase) {
      updatedStations.push({
        id: baseName,
        isFixed: true,
        knownE: 669500.0,
        knownN: 1531000.0
      });
    }
    if (!existingRover) {
      updatedStations.push({
        id: roverName,
        isFixed: false,
        approxE: 669500.0 + baselineSolution.vectorENU.dE,
        approxN: 1531000.0 + baselineSolution.vectorENU.dN
      });
    }

    // Add baseline vector observation
    const newVectorObs: Observation2D = {
      id: `GNSS_${baselineSolution.id}`,
      type: 'baseline_vector',
      fromStation: baseName,
      toStation: roverName,
      measuredValue: baselineSolution.vectorENU.dE,
      measuredValue2: baselineSolution.vectorENU.dN,
      stdDev: baselineSolution.stdDevMm.dE / 1000.0,
      stdDev2: baselineSolution.stdDevMm.dN / 1000.0
    };

    const updatedObs = [...obs2D, newVectorObs];
    setStations2D(updatedStations);
    setObs2D(updatedObs);

    try {
      setResult2D(adjust2DNetwork(updatedStations, updatedObs));
      setActiveTab('adjustment');
    } catch (err) {
      setAdjustmentError(String(err));
      setActiveTab('adjustment');
    }
  };

  // Run 2D/1D Adjustment
  const handleSolveAdjustment = () => {
    setAdjustmentError(null);
    try {
      if (adjustmentMode === '2d') {
        const res = adjust2DNetwork(stations2D, obs2D);
        setResult2D(res);
      } else {
        const res = adjust1DLevelingNetwork(points1D, obs1D);
        setResult1D(res);
      }
    } catch (err) {
      setAdjustmentError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการคำนวณปรับแก้');
    }
  };

  // Copy Full Comprehensive Report
  const handleCopyReport = () => {
    let report = `=== MESURV UNIFIED GNSS & NETWORK ADJUSTMENT REPORT ===\n`;
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Standards: RTSD & CKST-PL JV (Ch. Karnchang Engineering)\n\n`;

    if (baselineSolution) {
      report += `[1. GNSS BASELINE PROCESSING]\n`;
      report += `Baseline: ${baselineSolution.id}\n`;
      report += `Status: ${baselineSolution.status} (Ratio Test = ${baselineSolution.ratioTest})\n`;
      report += `Common Satellites: ${baselineSolution.commonSatellites}\n`;
      report += `Vector ECEF: dX = ${baselineSolution.vectorECEF.dx} m, dY = ${baselineSolution.vectorECEF.dy} m, dZ = ${baselineSolution.vectorECEF.dz} m\n`;
      report += `Vector ENU: dE = ${baselineSolution.vectorENU.dE} m, dN = ${baselineSolution.vectorENU.dN} m, dU = ${baselineSolution.vectorENU.dU} m\n`;
      report += `Distance 2D = ${baselineSolution.vectorENU.distance2D} m, 3D = ${baselineSolution.vectorENU.distance3D} m | Azimuth = ${baselineSolution.vectorENU.azimuthDeg}°\n`;
      report += `Precision: sigmaE = ${baselineSolution.stdDevMm.dE} mm, sigmaN = ${baselineSolution.stdDevMm.dN} mm, sigmaU = ${baselineSolution.stdDevMm.dU} mm\n\n`;
    }

    if (result2D) {
      report += `[2. 2D GEODETIC NETWORK ADJUSTMENT (LEAST SQUARES)]\n`;
      report += `Convergence: ${result2D.converged} in ${result2D.iterations} iterations\n`;
      report += `Degrees of Freedom (r): ${result2D.dof} | Std Error (sigma0): ${result2D.sigma0.toFixed(4)}\n`;
      report += `Chi-Square Test: ${result2D.chiSquarePassed ? 'PASSED (95%)' : 'WARNING'}\n`;
      report += `ADJUSTED STATIONS & 95% ERROR ELLIPSES:\n`;
      result2D.stations.forEach(s => {
        report += ` - ${s.id} ${s.isFixed ? '[FIXED]' : ''}: E=${s.easting.toFixed(4)}m, N=${s.northing.toFixed(4)}m`;
        if (s.errorEllipse) {
          report += ` | a=${s.errorEllipse.semiMajorAxisMm.toFixed(1)}mm, b=${s.errorEllipse.semiMinorAxisMm.toFixed(1)}mm, theta=${s.errorEllipse.orientationDeg.toFixed(1)}°, 95% a95=${s.errorEllipse.conf95MajorMm.toFixed(1)}mm`;
        }
        report += `\n`;
      });
    }

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeRinex = selectedStationView === 'base' ? baseRinex : roverRinex;
  const filteredSatellites = activeRinex.satellitesTracked.filter(s => {
    if (constellationFilter === 'ALL') return true;
    return s.constellation.toUpperCase() === constellationFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* ── Studio Hero Header ── */}
      <div className="fusion-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                TOOL-06
              </span>
              <span className="text-xs font-mono text-[var(--text-3)] uppercase tracking-wider">
                Unified Geomatics & GNSS Studio
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-1)] tracking-tight">
              ศูนย์ประมวลผลดาวเทียมและปรับแก้โครงข่าย (GNSS Studio)
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-2)] max-w-3xl leading-relaxed">
              ประมวลผลข้อมูลรังวัดครบวงจรในเครื่องมือเดียว: ตรวจสอบไฟล์ดิบ RINEX & Polar Skyplot → คำนวณเวกเตอร์ฐาน Double Difference (LAMBDA) → ปรับแก้โครงข่าย Least Squares และพล็อตวงรีความคลาดเคลื่อน 95%
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyReport}
            className="self-start md:self-center px-3.5 py-2 rounded-[var(--btn-radius)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] font-semibold text-xs transition-colors flex items-center gap-2 micro-press"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกรายงานแล้ว' : 'คัดลอกรายงานสรุป'}</span>
          </button>
        </div>

        {/* ── 4-Step Interactive Workflow Ribbon ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-[var(--border)] select-none">
          <button
            type="button"
            onClick={() => setActiveTab('ingestion')}
            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 micro-press ${
              activeTab === 'ingestion'
                ? 'bg-[var(--surface)] border-[var(--accent)] shadow-sm'
                : 'bg-[var(--surface-2)] border-transparent hover:border-[var(--border)] opacity-80'
            }`}
          >
            <div className="p-1.5 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] shrink-0">
              <Satellite className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-[var(--text-3)] font-bold block">STEP 01</span>
              <p className="text-xs font-bold text-[var(--text-1)] truncate">RINEX & Skyplot</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('baseline')}
            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 micro-press ${
              activeTab === 'baseline'
                ? 'bg-[var(--surface)] border-[var(--accent)] shadow-sm'
                : 'bg-[var(--surface-2)] border-transparent hover:border-[var(--border)] opacity-80'
            }`}
          >
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500 shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-[var(--text-3)] font-bold block">STEP 02</span>
              <p className="text-xs font-bold text-[var(--text-1)] truncate">Baseline Solver</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('adjustment')}
            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 micro-press ${
              activeTab === 'adjustment'
                ? 'bg-[var(--surface)] border-[var(--accent)] shadow-sm'
                : 'bg-[var(--surface-2)] border-transparent hover:border-[var(--border)] opacity-80'
            }`}
          >
            <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-500 shrink-0">
              <Network className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-[var(--text-3)] font-bold block">STEP 03</span>
              <p className="text-xs font-bold text-[var(--text-1)] truncate">Network Adjustment</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 micro-press ${
              activeTab === 'report'
                ? 'bg-[var(--surface)] border-[var(--accent)] shadow-sm'
                : 'bg-[var(--surface-2)] border-transparent hover:border-[var(--border)] opacity-80'
            }`}
          >
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-[var(--text-3)] font-bold block">STEP 04</span>
              <p className="text-xs font-bold text-[var(--text-1)] truncate">Geoid & Reports</p>
            </div>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 1: RINEX INGESTION & POLAR SKYPLOT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ingestion' && (
        <div className="space-y-6">
          
          {/* Station Switcher & Metadata Header */}
          <div className="fusion-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStationView('base')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all micro-press ${
                    selectedStationView === 'base'
                      ? 'bg-[var(--accent)] text-black dark:text-white shadow-sm'
                      : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text-1)]'
                  }`}
                >
                  สถานีฐาน (Base Station: {baseRinex.header.markerName})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStationView('rover')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all micro-press ${
                    selectedStationView === 'rover'
                      ? 'bg-[var(--accent)] text-black dark:text-white shadow-sm'
                      : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text-1)]'
                  }`}
                >
                  สถานีรังวัด (Rover Station: {roverRinex.header.markerName})
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[var(--text-3)]">Constellation:</span>
                {['ALL', 'GPS', 'BEIDOU', 'GLONASS', 'GALILEO'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setConstellationFilter(c)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      constellationFilter === c
                        ? 'bg-[var(--surface-3)] text-[var(--accent)] border border-[var(--accent)]/40'
                        : 'bg-[var(--surface-2)] text-[var(--text-3)] hover:text-[var(--text-1)]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingestion Overview Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <span className="text-[10px] font-mono text-[var(--text-3)] uppercase">Marker / Receiver</span>
                <p className="font-bold text-[var(--text-1)] truncate mt-0.5">{activeRinex.header.markerName}</p>
                <span className="text-[11px] font-mono text-[var(--text-3)]">{activeRinex.header.receiverType}</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <span className="text-[10px] font-mono text-[var(--text-3)] uppercase">Approx Geodetic</span>
                <p className="font-bold font-mono text-[var(--accent)] truncate mt-0.5">
                  {activeRinex.header.approxGeodetic?.lat.toFixed(5)}°, {activeRinex.header.approxGeodetic?.lng.toFixed(5)}°
                </p>
                <span className="text-[11px] font-mono text-[var(--text-3)]">H = {activeRinex.header.approxGeodetic?.height.toFixed(2)} m</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <span className="text-[10px] font-mono text-[var(--text-3)] uppercase">Average SNR</span>
                <p className="font-bold font-mono text-emerald-500 text-base mt-0.5">
                  {activeRinex.averageSnr} <span className="text-xs font-normal">dB-Hz</span>
                </p>
                <span className="text-[11px] text-[var(--text-3)]">สุขภาพสัญญาณ: {activeRinex.healthStatus}</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <span className="text-[10px] font-mono text-[var(--text-3)] uppercase">Epochs / Duration</span>
                <p className="font-bold font-mono text-[var(--text-1)] text-base mt-0.5">
                  {activeRinex.totalEpochs} <span className="text-xs font-normal">epochs</span>
                </p>
                <span className="text-[11px] text-[var(--text-3)]">รังวัดนาน ~{activeRinex.durationMinutes} นาที</span>
              </div>
            </div>
          </div>

          {/* Interactive Polar Skyplot (Radar SVG) & Satellites Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Polar Skyplot SVG Canvas */}
            <div className="lg:col-span-5 fusion-card p-5 flex flex-col items-center justify-center space-y-4">
              <div className="w-full flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--text-1)] flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[var(--accent)]" />
                  <span>Polar Skyplot (ผังขอบฟ้าดาวเทียม)</span>
                </span>
                <span className="text-[10px] font-mono text-[var(--text-3)]">Azimuth / Elevation</span>
              </div>

              {/* Radar Circles SVG */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="-120 -120 240 240">
                  {/* Outer circle (0° horizon) */}
                  <circle cx="0" cy="0" r="100" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                  {/* 30° elevation circle */}
                  <circle cx="0" cy="0" r="66.6" fill="none" stroke="var(--border)" strokeDasharray="3 3" strokeWidth="1" />
                  {/* 60° elevation circle */}
                  <circle cx="0" cy="0" r="33.3" fill="none" stroke="var(--border)" strokeDasharray="3 3" strokeWidth="1" />
                  {/* 15° mask circle (red threshold) */}
                  <circle cx="0" cy="0" r="83.3" fill="none" stroke="rgba(239, 68, 68, 0.4)" strokeDasharray="2 2" strokeWidth="1" />

                  {/* Cardinal Crosshairs */}
                  <line x1="0" y1="-100" x2="0" y2="100" stroke="var(--border)" strokeWidth="1" />
                  <line x1="-100" y1="0" x2="100" y2="0" stroke="var(--border)" strokeWidth="1" />

                  {/* Cardinal Labels */}
                  <text x="0" y="-104" textAnchor="middle" className="text-[9px] font-mono fill-[var(--accent)] font-bold">N</text>
                  <text x="108" y="3" textAnchor="start" className="text-[9px] font-mono fill-[var(--text-3)]">E</text>
                  <text x="0" y="112" textAnchor="middle" className="text-[9px] font-mono fill-[var(--text-3)]">S</text>
                  <text x="-108" y="3" textAnchor="end" className="text-[9px] font-mono fill-[var(--text-3)]">W</text>
                  <text x="0" y="4" textAnchor="middle" className="text-[8px] font-mono fill-[var(--text-3)]">Zenith</text>

                  {/* Satellites Markers */}
                  {filteredSatellites.map((sat) => {
                    // Polar projection: r = 100 * (90 - el) / 90
                    const radius = (100.0 * (90.0 - sat.elevationDeg)) / 90.0;
                    const theta = ((sat.azimuthDeg - 90.0) * Math.PI) / 180.0;
                    const px = radius * Math.cos(theta);
                    const py = radius * Math.sin(theta);

                    // SNR color gradient
                    const markerColor = 
                      sat.snrDbHz >= 46 ? '#10b981' : 
                      sat.snrDbHz >= 40 ? '#0ea5e9' : 
                      sat.snrDbHz >= 35 ? '#f59e0b' : '#ef4444';

                    return (
                      <g key={sat.id} className="cursor-pointer transition-transform hover:scale-125">
                        <circle cx={px} cy={py} r="5" fill={markerColor} stroke="#000" strokeWidth="1" />
                        <text
                          x={px}
                          y={py - 7}
                          textAnchor="middle"
                          className="text-[8px] font-mono font-bold fill-[var(--text-1)] select-none pointer-events-none drop-shadow"
                        >
                          {sat.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* SNR Legend */}
              <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-3)]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> &ge;46 dB-Hz</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> 40-45</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 35-39</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> &lt;35</span>
              </div>
            </div>

            {/* Right: Satellites Tracking Data Table */}
            <div className="lg:col-span-7 fusion-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--text-1)]">
                  รายการดาวเทียมที่ติดตามได้ ({filteredSatellites.length} ดวง)
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('baseline')}
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-black dark:text-white font-bold text-xs flex items-center gap-1.5 shadow-sm micro-press"
                >
                  <span>ต่อไป: คำนวณเวกเตอร์ฐาน</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto -mx-5 px-5 max-h-80">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)]">
                    <tr className="text-[var(--text-3)] font-mono">
                      <th className="py-2 px-2">PRN</th>
                      <th className="py-2 px-2">กลุ่มดาวเทียม</th>
                      <th className="py-2 px-2 text-right">มุมกวาด (Az)</th>
                      <th className="py-2 px-2 text-right">มุมยก (El)</th>
                      <th className="py-2 px-2 text-right">SNR (dB-Hz)</th>
                      <th className="py-2 px-2 text-center">คุณภาพ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredSatellites.map((sat) => (
                      <tr key={sat.id} className="hover:bg-[var(--surface-2)] transition-colors">
                        <td className="py-2 px-2 font-mono font-bold text-[var(--text-1)]">{sat.id}</td>
                        <td className="py-2 px-2 font-mono text-[var(--text-2)]">{sat.constellation}</td>
                        <td className="py-2 px-2 text-right font-mono">{sat.azimuthDeg.toFixed(1)}°</td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-[var(--accent)]">{sat.elevationDeg.toFixed(1)}°</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">
                          <span className={sat.snrDbHz >= 45 ? 'text-emerald-500' : sat.snrDbHz >= 40 ? 'text-sky-500' : 'text-amber-500'}>
                            {sat.snrDbHz.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[10px] font-mono border border-[var(--border)] uppercase">
                            {sat.quality}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 2: DOUBLE-DIFFERENCE BASELINE SOLVER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'baseline' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="fusion-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500" />
                  <span>คำนวณเวกเตอร์ฐานสัมพันธ์ (Carrier-Phase Double Difference)</span>
                </h2>
                <p className="text-xs text-[var(--text-2)]">
                  จับคู่สถานี {baseRinex.header.markerName} (Base) ↔ {roverRinex.header.markerName} (Rover) เพื่อหาเวกเตอร์สัมพัทธ์และความแปรปรวน
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-[var(--text-3)]">Elev Mask:</span>
                  <select
                    value={elevMask}
                    onChange={(e) => setElevMask(Number(e.target.value))}
                    className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] text-xs font-mono"
                  >
                    <option value={10}>10°</option>
                    <option value={15}>15° (มาตรฐาน)</option>
                    <option value={20}>20° (ตัดเงาตึก)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSolveBaseline}
                  className="px-3.5 py-1.5 rounded-[var(--btn-radius)] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 micro-press"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>คำนวณเวกเตอร์ฐาน (Solve)</span>
                </button>
              </div>
            </div>
          </div>

          {baselineError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{baselineError}</span>
            </div>
          )}

          {/* Baseline Solution Results Dashboard */}
          {baselineSolution && (
            <div className="space-y-6">
              
              {/* Solution Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="fusion-card p-4 space-y-1">
                  <span className="text-[11px] font-mono text-[var(--text-3)] uppercase">Ambiguity Status</span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-xl sm:text-2xl font-black font-mono text-emerald-500">
                      {baselineSolution.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-3)] font-mono">LAMBDA Resolved</span>
                </div>

                <div className="fusion-card p-4 space-y-1">
                  <span className="text-[11px] font-mono text-[var(--text-3)] uppercase">Ratio Test</span>
                  <p className="text-xl sm:text-2xl font-black font-mono text-[var(--accent)]">
                    {baselineSolution.ratioTest.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-[var(--text-3)]">เกณฑ์ขั้นต่ำ &ge; 3.00</span>
                </div>

                <div className="fusion-card p-4 space-y-1">
                  <span className="text-[11px] font-mono text-[var(--text-3)] uppercase">Common Satellites</span>
                  <p className="text-xl sm:text-2xl font-black font-mono text-[var(--text-1)]">
                    {baselineSolution.commonSatellites} <span className="text-xs font-normal">sats</span>
                  </p>
                  <span className="text-[10px] text-[var(--text-3)]">ดาวเทียมมุมยก &ge; {elevMask}°</span>
                </div>

                <div className="fusion-card p-4 space-y-1">
                  <span className="text-[11px] font-mono text-[var(--text-3)] uppercase">Horizontal Length</span>
                  <p className="text-xl sm:text-2xl font-black font-mono text-[var(--text-1)]">
                    {baselineSolution.vectorENU.distance2D.toFixed(3)} <span className="text-xs font-normal">m</span>
                  </p>
                  <span className="text-[10px] text-[var(--text-3)] font-mono">Azimuth {baselineSolution.vectorENU.azimuthDeg}°</span>
                </div>
              </div>

              {/* Vector Components: ECEF vs Local ENU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Local Topocentric ENU */}
                <div className="fusion-card p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <span className="font-bold text-xs text-[var(--text-1)]">Local Topocentric Vector (ENU)</span>
                    <span className="text-[10px] font-mono text-[var(--accent)]">ความถูกต้องระดับมิลลิเมตร</span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1.5 px-2 rounded bg-[var(--surface-2)]">
                      <span className="text-[var(--text-3)]">Delta Easting (ΔE):</span>
                      <span className="font-bold text-[var(--text-1)]">{baselineSolution.vectorENU.dE.toFixed(4)} m (±{baselineSolution.stdDevMm.dE} mm)</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded bg-[var(--surface-2)]">
                      <span className="text-[var(--text-3)]">Delta Northing (ΔN):</span>
                      <span className="font-bold text-[var(--text-1)]">{baselineSolution.vectorENU.dN.toFixed(4)} m (±{baselineSolution.stdDevMm.dN} mm)</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded bg-[var(--surface-2)]">
                      <span className="text-[var(--text-3)]">Delta Up (ΔU):</span>
                      <span className="font-bold text-[var(--text-1)]">{baselineSolution.vectorENU.dU.toFixed(4)} m (±{baselineSolution.stdDevMm.dU} mm)</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded bg-[var(--surface-2)]">
                      <span className="text-[var(--text-3)]">Spatial 3D Distance:</span>
                      <span className="font-bold text-[var(--accent)]">{baselineSolution.vectorENU.distance3D.toFixed(4)} m</span>
                    </div>
                  </div>
                </div>

                {/* ECEF Geocentric Cartesian */}
                <div className="fusion-card p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <span className="font-bold text-xs text-[var(--text-1)]">Geocentric Cartesian Vector (ECEF)</span>
                    <span className="text-[10px] font-mono text-[var(--text-3)]">WGS84 Reference Frame</span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1.5 px-2 rounded bg-[var(--surface-2)]">
                      <span className="text-[var(--text-3)]">Delta X (ΔX):</span>
                      <span className="font-bold text-[var(--text-1)]">{baselineSolution.vectorECEF.dx.toFixed(4)} m (±{baselineSolution.stdDevMm.dx} mm)</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded bg-[var(--surface-2)]">
                      <span className="text-[var(--text-3)]">Delta Y (ΔY):</span>
                      <span className="font-bold text-[var(--text-1)]">{baselineSolution.vectorECEF.dy.toFixed(4)} m (±{baselineSolution.stdDevMm.dy} mm)</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded bg-[var(--surface-2)]">
                      <span className="text-[var(--text-3)]">Delta Z (ΔZ):</span>
                      <span className="font-bold text-[var(--text-1)]">{baselineSolution.vectorECEF.dz.toFixed(4)} m (±{baselineSolution.stdDevMm.dz} mm)</span>
                    </div>
                  </div>

                  {/* Transfer Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTransferToAdjustment}
                      className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm micro-press"
                    >
                      <span>ส่งเวกเตอร์เข้าสู่การปรับแก้โครงข่าย (Send to Step 3)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 3: LEAST SQUARES NETWORK ADJUSTMENT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'adjustment' && (
        <div className="space-y-6">
          
          {/* Sub Toolbar for Adjustment */}
          <div className="fusion-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-500" />
                  <span>การปรับแก้โครงข่ายรังวัด (Gauss-Markov Least Squares)</span>
                </h2>
                <p className="text-xs text-[var(--text-2)]">
                  คำนวณกระจายความคลาดเคลื่อน ตรวจสอบความถูกต้องทางสถิติ Chi-Square และคำนวณวงรีความคลาดเคลื่อน 95%
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentMode(adjustmentMode === '2d' ? '1d' : '2d')}
                  className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] font-semibold text-xs"
                >
                  สลับโหมด: {adjustmentMode === '2d' ? 'โครงข่ายราบ 2D' : 'โครงข่ายระดับ 1D'}
                </button>
                <button
                  type="button"
                  onClick={handleSolveAdjustment}
                  className="px-3.5 py-1.5 rounded-[var(--btn-radius)] bg-[var(--accent)] hover:opacity-90 text-black dark:text-white font-bold text-xs shadow-sm flex items-center gap-1.5 micro-press"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>คำนวณปรับแก้ (Compute LSA)</span>
                </button>
              </div>
            </div>
          </div>

          {adjustmentError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{adjustmentError}</span>
            </div>
          )}

          {/* 2D Results Table */}
          {adjustmentMode === '2d' && result2D && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="fusion-card p-4 space-y-1">
                  <span className="text-[10px] font-mono text-[var(--text-3)] uppercase">Degrees of Freedom</span>
                  <p className="text-xl sm:text-2xl font-black font-mono text-[var(--text-1)]">{result2D.dof}</p>
                </div>
                <div className="fusion-card p-4 space-y-1">
                  <span className="text-[10px] font-mono text-[var(--text-3)] uppercase">Std Error (σ₀)</span>
                  <p className="text-xl sm:text-2xl font-black font-mono text-[var(--accent)]">{result2D.sigma0.toFixed(3)}</p>
                </div>
                <div className="fusion-card p-4 space-y-1">
                  <span className="text-[10px] font-mono text-[var(--text-3)] uppercase">Chi-Square Test</span>
                  <p className={`text-base font-black font-mono ${result2D.chiSquarePassed ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {result2D.chiSquarePassed ? 'PASSED (95%)' : 'WARNING'}
                  </p>
                </div>
                <div className="fusion-card p-4 space-y-1">
                  <span className="text-[10px] font-mono text-[var(--text-3)] uppercase">Blunder Check</span>
                  <p className={`text-base font-black font-mono ${result2D.observations.some(o => o.isOutlier) ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {result2D.observations.some(o => o.isOutlier) ? 'พบ OUTLIER' : 'CLEAN (0)'}
                  </p>
                </div>
              </div>

              {/* Stations & Error Ellipses Table */}
              <div className="fusion-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text-1)]">
                    พิกัดปรับแก้และวงรีความคลาดเคลื่อน 95% Confidence (Error Ellipses)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('report')}
                    className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    <span>ดูรายงานและแผนที่ WebGIS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
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

              {/* Embedded Interactive Network Map */}
              <EmbeddedNetworkMap
                stations={result2D.stations}
                observations={result2D.observations}
                utmZone={47}
                title="แผนที่โครงข่ายราบและวงรีความคลาดเคลื่อน 95% (Interactive Network Map)"
              />

            </div>
          )}

          {/* 1D Leveling Results */}
          {adjustmentMode === '1d' && result1D && (
            <div className="fusion-card p-5 space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[var(--accent)]" />
                <span>ระดับความสูงปรับแก้ (Adjusted Elevations)</span>
              </h3>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-3)] font-mono">
                      <th className="py-2 px-2">หมุดระดับ (Benchmark)</th>
                      <th className="py-2 px-2">สถานะ</th>
                      <th className="py-2 px-2 text-right">ระดับความสูง H (m MSL)</th>
                      <th className="py-2 px-2 text-right">ความคลาดเคลื่อน σH (mm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {result1D.points.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-2 font-mono font-bold text-[var(--text-1)]">{p.id}</td>
                        <td className="py-2 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.isFixed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-[var(--surface-2)] text-[var(--text-2)]'}`}>
                            {p.isFixed ? 'FIXED BM' : 'ADJUSTED'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-[var(--accent)]">{p.adjustedElevation.toFixed(4)}</td>
                        <td className="py-2 px-2 text-right font-mono text-[var(--text-2)]">{p.stdDevMm.toFixed(2)} mm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 4: GEOID & REPORT EXPORT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          
          <div className="fusion-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>รายงานสรุปวิศวกรรม & แบบจำลองยี่ออยด์ TGM2017</span>
                </h2>
                <p className="text-xs text-[var(--text-2)]">
                  สรุปผลการประมวลผลตามมาตรฐานกรมแผนที่ทหาร (RTSD) และโครงการรถไฟฟ้า ช.การช่าง
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] font-semibold text-xs flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกรายงาน</span>
                </button>
              </div>
            </div>

            {/* Geoid Fitting Card */}
            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--text-1)] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[var(--accent)]" />
                  <span>แบบจำลองความสูงยี่ออยด์แห่งประเทศไทย (RTSD TGM2017)</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-mono text-[10px] font-bold">
                  ACTIVE MODEL
                </span>
              </div>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                การแปลงความสูงทรงรีจากดาวเทียม ($h$) สู่ระดับความสูงออร์โธเมตริกเทียบระดับน้ำทะเลปานกลาง ($H = h - N$) โดยใช้ค่าความสูงยี่ออยด์ ($N$) ประจำพื้นที่ประเทศไทยของกรมแผนที่ทหาร มีความถูกต้องในแนวดิ่งระดับ &plusmn;3 cm
              </p>
            </div>

            {/* Final Actions Callout */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-[var(--text-3)] font-mono">
                สถานะข้อมูล: 100% In-Browser Verifiable &bull; Zero Cloud Leak
              </span>

              {onPlotOnMap && (
                <button
                  type="button"
                  onClick={() => onPlotOnMap(13.8476, 100.5696, 'CK-STATION')}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black dark:text-white font-bold text-xs flex items-center gap-2 shadow-sm micro-press"
                >
                  <MapPin className="w-4 h-4" />
                  <span>เปิดดูโครงข่ายและวงรีบน WebGIS Map</span>
                </button>
              )}
            </div>

          </div>

          {/* Embedded Interactive Network Map in Engineering Report */}
          {result2D && (
            <EmbeddedNetworkMap
              stations={result2D.stations}
              observations={result2D.observations}
              utmZone={47}
              title="แผนที่โครงข่ายหมุดควบคุมและเวกเตอร์รังวัด (Survey Network Geometry)"
            />
          )}

        </div>
      )}

    </div>
  );
};
