import React, { useState, useMemo } from 'react';
import {
  Waves,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  Sparkles,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  Activity,
  Compass,
  ArrowDown
} from 'lucide-react';
import {
  GnssPositionFix,
  SonarDepthObservation,
  TideGaugeRecord,
  BathymetricSurveyResult,
  processBathymetricSoundings,
  SAMPLE_BATHYMETRIC_GNSS,
  SAMPLE_BATHYMETRIC_SOUNDINGS,
  SAMPLE_BATHYMETRIC_TIDE
} from '../../utils/bathymetric-sounding';
import { exportToCsv } from '../../utils/csv-export';

export const BathymetricSoundingCalculator: React.FC = () => {
  // Streams state (Blank slate by default)
  const [gnssTrack, setGnssTrack] = useState<GnssPositionFix[]>([]);
  const [soundings, setSoundings] = useState<SonarDepthObservation[]>([]);
  const [tideRecords, setTideRecords] = useState<TideGaugeRecord[]>([]);

  // Settings
  const [draftM, setDraftM] = useState<string>('0.450');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Manual entry forms
  const [gnssTime, setGnssTime] = useState<string>('');
  const [gnssEast, setGnssEast] = useState<string>('');
  const [gnssNorth, setGnssNorth] = useState<string>('');

  const [sonarTime, setSonarTime] = useState<string>('');
  const [sonarDepth, setSonarDepth] = useState<string>('');
  const [sonarHeave, setSonarHeave] = useState<string>('0.00');

  const [tideTime, setTideTime] = useState<string>('');
  const [tideLevel, setTideLevel] = useState<string>('');

  // ── Sample Loader & Reset ──
  const handleLoadSample = () => {
    setGnssTrack(SAMPLE_BATHYMETRIC_GNSS);
    setSoundings(SAMPLE_BATHYMETRIC_SOUNDINGS);
    setTideRecords(SAMPLE_BATHYMETRIC_TIDE);
    setDraftM('0.450');
  };

  const handleReset = () => {
    setGnssTrack([]);
    setSoundings([]);
    setTideRecords([]);
    setSelectedPointId(null);
  };

  // ── Calculation ──
  const surveyResult: BathymetricSurveyResult | null = useMemo(() => {
    if (soundings.length === 0 || gnssTrack.length === 0 || tideRecords.length === 0) {
      return null;
    }
    try {
      const d = parseFloat(draftM) || 0.45;
      return processBathymetricSoundings(gnssTrack, soundings, tideRecords, d);
    } catch {
      return null;
    }
  }, [gnssTrack, soundings, tideRecords, draftM]);

  // ── SVG Cross-Section Profile Metrics ──
  const svgProfile = useMemo(() => {
    if (!surveyResult || surveyResult.processedPoints.length === 0) return null;

    const pts = surveyResult.processedPoints;
    // Compute cumulative chainage/distance along track
    const chainage: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i].easting - pts[i - 1].easting, pts[i].northing - pts[i - 1].northing);
      chainage.push(chainage[i - 1] + d);
    }

    const totalDist = chainage[chainage.length - 1] || 100;

    let minZ = Infinity, maxZ = -Infinity;
    pts.forEach(p => {
      if (p.bedElevationMslM < minZ) minZ = p.bedElevationMslM;
      if (p.tideLevelM > maxZ) maxZ = p.tideLevelM;
    });

    const rangeZ = (maxZ - minZ) || 10;
    const paddingZ = rangeZ * 0.15;
    const bMinZ = minZ - paddingZ;
    const bMaxZ = maxZ + paddingZ;

    const viewBoxW = 600;
    const viewBoxH = 280;

    const toSvg = (dist: number, z: number) => {
      const sx = 40 + (dist / totalDist) * (viewBoxW - 80);
      const sy = viewBoxH - 30 - ((z - bMinZ) / (bMaxZ - bMinZ)) * (viewBoxH - 60);
      return { sx, sy };
    };

    return { pts, chainage, totalDist, bMinZ, bMaxZ, toSvg, viewBoxW, viewBoxH };
  }, [surveyResult]);

  // Export CSV
  const handleExportCsv = () => {
    if (!surveyResult) return;
    const headers = [
      'ID',
      'Time (s)',
      'Easting (m)',
      'Northing (m)',
      'Raw Depth (m)',
      'Draft (m)',
      'Heave (m)',
      'Tide Level MSL (m)',
      'Reduced Depth (m)',
      'Bed Elevation MSL (m)',
      'IHO S-44 TVU Limit (m)'
    ];
    const rows = surveyResult.processedPoints.map(p => [
      p.id,
      p.timestampSec,
      p.easting.toFixed(3),
      p.northing.toFixed(3),
      p.rawDepthM.toFixed(3),
      p.draftM.toFixed(3),
      p.heaveM.toFixed(3),
      p.tideLevelM.toFixed(3),
      p.reducedDepthM.toFixed(3),
      p.bedElevationMslM.toFixed(3),
      p.tvuLimitM.toFixed(3)
    ]);
    exportToCsv({
      filename: `bathymetric_sounding_${Date.now()}.csv`,
      headers,
      rows
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Waves className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-1)]">
              ระบบหยั่งความลึกน้ำ & ชดเชยน้ำขึ้น-ลง (Bathymetric Sounding & Tide Reduction)
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            รวมตำแหน่งเรือ GNSS, ข้อมูลความลึก Echo Sounder, และระดับน้ำขึ้น-ลง คำนวณระดับท้องน้ำจริงตามมาตรฐาน IHO S-44
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadSample}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>โหลดตัวอย่างร่องน้ำเจ้าพระยา</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl text-[var(--text-3)] hover:text-red-500 hover:bg-red-500/10 transition-all border border-[var(--border)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ล้างข้อมูล</span>
          </button>
          {surveyResult && (
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออกรายงาน CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      {surveyResult ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)]">
            <div className="text-xs font-medium text-[var(--text-3)]">มาตรฐานอุทกศาสตร์</div>
            <div className="mt-1 flex items-center gap-1.5 text-base font-bold text-cyan-600 dark:text-cyan-400">
              <CheckCircle2 className="w-5 h-5 text-cyan-500" />
              <span>{surveyResult.ihoClass}</span>
            </div>
            <div className="text-[11px] text-[var(--text-3)] mt-0.5">IHO S-44 Compliant</div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)]">
            <div className="text-xs font-medium text-[var(--text-3)]">ความลึกน้ำเฉลี่ย (Min - Max)</div>
            <div className="mt-1 text-base font-bold font-mono text-[var(--text-1)]">
              {surveyResult.avgDepthM.toFixed(2)} ม.
            </div>
            <div className="text-[11px] text-[var(--text-3)] mt-0.5 font-mono">
              ต่ำสุด {surveyResult.minDepthM.toFixed(2)}m / สูงสุด {surveyResult.maxDepthM.toFixed(2)}m
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)]">
            <div className="text-xs font-medium text-[var(--text-3)]">ระดับท้องน้ำจริง (MSL)</div>
            <div className="mt-1 text-base font-bold font-mono text-[var(--text-1)]">
              {surveyResult.minBedElevationMslM.toFixed(2)} ถึง {surveyResult.maxBedElevationMslM.toFixed(2)} ม.
            </div>
            <div className="text-[11px] text-[var(--text-3)] mt-0.5">เทียบระดับน้ำทะเลปานกลาง</div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)]">
            <div className="text-xs font-medium text-[var(--text-3)]">กินน้ำลึกหัววัด (Draft) & จุดหยั่ง</div>
            <div className="mt-1 text-base font-bold font-mono text-[var(--text-1)]">
              {draftM} ม. ({surveyResult.totalSoundings} จุด)
            </div>
            <div className="text-[11px] text-[var(--text-3)] mt-0.5">ชดเชยการจมของหัววัด (Draft Offset)</div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-[var(--surface-1)] border border-dashed border-[var(--border)]">
          <Waves className="w-10 h-10 mx-auto text-[var(--text-3)] opacity-40 mb-3" />
          <h3 className="text-base font-semibold text-[var(--text-1)]">ยังไม่มีข้อมูลการหยั่งความลึก</h3>
          <p className="text-sm text-[var(--text-2)] max-w-md mx-auto mt-1 mb-4">
            กรุณาป้อนข้อมูลพิกัดเรือ GNSS, ข้อมูลความลึก Echo Sounder, และระดับน้ำขึ้น-ลง หรือกดโหลดตัวอย่าง
          </p>
          <button
            onClick={handleLoadSample}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>โหลดตัวอย่างร่องน้ำเจ้าพระยา</span>
          </button>
        </div>
      )}

      {/* ── Riverbed Cross-Section Profile SVG ── */}
      {svgProfile && surveyResult && (
        <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-semibold text-[var(--text-1)]">
                รูปตัดขวางร่องน้ำและระดับท้องน้ำจริง (Cross-Section & Bed Elevation Profile)
              </span>
            </div>
            <span className="text-xs font-mono text-[var(--text-3)]">
              ระยะทางรวม: {svgProfile.totalDist.toFixed(1)} เมตร
            </span>
          </div>

          <div className="relative w-full aspect-[20/9] bg-[var(--surface-2)] rounded-xl overflow-hidden border border-[var(--border)] flex items-center justify-center">
            <svg
              viewBox={`0 0 ${svgProfile.viewBoxW} ${svgProfile.viewBoxH}`}
              className="w-full h-full select-none"
            >
              <defs>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Water Surface Line (Tide) */}
              {svgProfile.pts.length > 1 && (
                <path
                  d={svgProfile.pts.map((p, idx) => {
                    const { sx, sy } = svgProfile.toSvg(svgProfile.chainage[idx], p.tideLevelM);
                    return `${idx === 0 ? 'M' : 'L'} ${sx} ${sy}`;
                  }).join(' ')}
                  className="stroke-cyan-500 stroke-2 stroke-dasharray-4"
                  fill="none"
                />
              )}

              {/* Riverbed Terrain Polygon */}
              {svgProfile.pts.length > 1 && (
                <polygon
                  points={[
                    ...svgProfile.pts.map((p, idx) => {
                      const { sx, sy } = svgProfile.toSvg(svgProfile.chainage[idx], p.bedElevationMslM);
                      return `${sx},${sy}`;
                    }),
                    `${svgProfile.toSvg(svgProfile.totalDist, svgProfile.bMinZ).sx},${svgProfile.toSvg(svgProfile.totalDist, svgProfile.bMinZ).sy}`,
                    `${svgProfile.toSvg(0, svgProfile.bMinZ).sx},${svgProfile.toSvg(0, svgProfile.bMinZ).sy}`
                  ].join(' ')}
                  className="fill-amber-900/15 stroke-amber-700/60 stroke-2"
                />
              )}

              {/* Sounding Points */}
              {svgProfile.pts.map((p, idx) => {
                const { sx, sy } = svgProfile.toSvg(svgProfile.chainage[idx], p.bedElevationMslM);
                const isSelected = selectedPointId === p.id;
                return (
                  <g
                    key={p.id}
                    onClick={() => setSelectedPointId(p.id)}
                    className="cursor-pointer transition-transform hover:scale-125"
                  >
                    {/* TVU Error Bar */}
                    <line
                      x1={sx}
                      y1={sy - 4}
                      x2={sx}
                      y2={sy + 4}
                      stroke="#06b6d4"
                      strokeWidth="2"
                    />
                    <circle
                      cx={sx}
                      cy={sy}
                      r={isSelected ? '6' : '4'}
                      className={isSelected ? 'fill-cyan-400 stroke-white stroke-2' : 'fill-cyan-600 stroke-white stroke-1'}
                    />
                    <text
                      x={sx}
                      y={sy + 14}
                      textAnchor="middle"
                      className="text-[9px] font-mono font-bold fill-[var(--text-1)]"
                    >
                      {p.bedElevationMslM.toFixed(2)}m
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-3)]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-cyan-500 inline-block" /> ระดับผิวน้ำ (Tide Gauge MSL)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block" /> จุดหยั่งระดับท้องน้ำ (Z_bed)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 bg-amber-800/30 inline-block" /> ชั้นดินท้องน้ำ
              </span>
            </div>
            <span className="font-mono text-[11px]">มาตรฐานอุทกศาสตร์ IHO S-44</span>
          </div>
        </div>
      )}

      {/* ── Sounding Reduction Table ── */}
      {surveyResult && (
        <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-600" />
              <h3 className="text-sm font-bold text-[var(--text-1)]">
                ตารางประมวลผลหยั่งความลึกและระดับน้ำ (Bathymetric Sounding Fieldbook)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-3)]">ระยะจมหัววัด (Draft):</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={draftM}
                onChange={e => setDraftM(e.target.value)}
                className="w-16 px-2 py-1 text-xs font-mono rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)]"
              />
              <span className="text-xs text-[var(--text-3)]">ม.</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/50 text-[var(--text-3)] font-medium">
                  <th className="py-2.5 px-3">จุดหยั่ง</th>
                  <th className="py-2.5 px-3">เวลา (s)</th>
                  <th className="py-2.5 px-3">พิกัดเรือ (UTM East, North)</th>
                  <th className="py-2.5 px-3 text-right">ความลึกวัดได้ (m)</th>
                  <th className="py-2.5 px-3 text-right">Heave (m)</th>
                  <th className="py-2.5 px-3 text-right">ระดับน้ำ Tide (m MSL)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-cyan-600 dark:text-cyan-400">ระดับท้องน้ำ Z (m MSL)</th>
                  <th className="py-2.5 px-3 text-right">TVU เกณฑ์ (m)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {surveyResult.processedPoints.map(p => {
                  const isSelected = selectedPointId === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPointId(p.id)}
                      className={`cursor-pointer transition-colors hover:bg-[var(--surface-2)] ${
                        isSelected ? 'bg-cyan-500/10 ring-1 ring-cyan-500' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-[var(--text-1)]">{p.id}</td>
                      <td className="py-2.5 px-3 font-mono text-[var(--text-2)]">{p.timestampSec}s</td>
                      <td className="py-2.5 px-3 font-mono text-[var(--text-2)]">
                        E: {p.easting.toFixed(2)}, N: {p.northing.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[var(--text-1)]">{p.rawDepthM.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[var(--text-2)]">
                        {p.heaveM >= 0 ? `+${p.heaveM.toFixed(2)}` : p.heaveM.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[var(--text-2)]">{p.tideLevelM.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {p.bedElevationMslM.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[var(--text-3)]">±{p.tvuLimitM.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 rounded-xl bg-[var(--surface-2)] text-[11px] text-[var(--text-3)] flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
            <span>{surveyResult.disclaimer}</span>
          </div>
        </div>
      )}

      {/* ── Data Streams Panel (GNSS, Sonar, Tide) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stream 1: GNSS Track */}
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-500" />
              <h4 className="text-xs font-bold text-[var(--text-1)]">1. พิกัดเรือ GNSS ({gnssTrack.length})</h4>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
            {gnssTrack.map((g, idx) => (
              <div key={idx} className="flex justify-between p-1.5 rounded bg-[var(--surface-2)] text-[var(--text-2)]">
                <span>t={g.timestampSec}s</span>
                <span>E:{g.easting.toFixed(1)} N:{g.northing.toFixed(1)}</span>
              </div>
            ))}
            {gnssTrack.length === 0 && (
              <div className="text-center py-4 text-xs text-[var(--text-3)] font-sans">ไม่มีพิกัดเรือ</div>
            )}
          </div>
        </div>

        {/* Stream 2: Sonar Soundings */}
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              <ArrowDown className="w-4 h-4 text-cyan-500" />
              <h4 className="text-xs font-bold text-[var(--text-1)]">2. ความลึก Echo Sounder ({soundings.length})</h4>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
            {soundings.map((s, idx) => (
              <div key={idx} className="flex justify-between p-1.5 rounded bg-[var(--surface-2)] text-[var(--text-2)]">
                <span>t={s.timestampSec}s</span>
                <span>Depth: {s.rawDepthM.toFixed(2)}m</span>
              </div>
            ))}
            {soundings.length === 0 && (
              <div className="text-center py-4 text-xs text-[var(--text-3)] font-sans">ไม่มีข้อมูลความลึก</div>
            )}
          </div>
        </div>

        {/* Stream 3: Tide Gauge */}
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-cyan-500" />
              <h4 className="text-xs font-bold text-[var(--text-1)]">3. เสาวัดน้ำ Tide Gauge ({tideRecords.length})</h4>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
            {tideRecords.map((t, idx) => (
              <div key={idx} className="flex justify-between p-1.5 rounded bg-[var(--surface-2)] text-[var(--text-2)]">
                <span>t={t.timestampSec}s</span>
                <span>Level: {t.waterLevelMslM.toFixed(2)}m MSL</span>
              </div>
            ))}
            {tideRecords.length === 0 && (
              <div className="text-center py-4 text-xs text-[var(--text-3)] font-sans">ไม่มีข้อมูลระดับน้ำ</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
