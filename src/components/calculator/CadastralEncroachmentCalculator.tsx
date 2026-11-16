import React, { useState, useMemo, useRef } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet,
  Eye,
  Crosshair
} from 'lucide-react';
import {
  CadastralBoundaryPoint,
  SurveyedFeaturePoint,
  CadastralEncroachmentResult,
  evaluateCadastralEncroachment,
  SAMPLE_CADASTRAL_BOUNDARY,
  SAMPLE_SURVEYED_FENCE
} from '../../utils/cadastral-encroachment';
import { exportToCsv } from '../../utils/csv-export';

export const CadastralEncroachmentCalculator: React.FC = () => {
  // Boundary & Surveyed points state (Blank slate by default)
  const [boundaryPoints, setBoundaryPoints] = useState<CadastralBoundaryPoint[]>([]);
  const [surveyedPoints, setSurveyedPoints] = useState<SurveyedFeaturePoint[]>([]);
  const [activeTab, setActiveTab] = useState<'boundary' | 'surveyed'>('boundary');

  // Tolerance
  const [toleranceCm, setToleranceCm] = useState<string>('1.0');

  // Visualization toggles
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showOffsetVectors, setShowOffsetVectors] = useState<boolean>(true);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Manual entry forms
  const [bName, setBName] = useState<string>('');
  const [bEasting, setBEasting] = useState<string>('');
  const [bNorthing, setBNorthing] = useState<string>('');

  const [sName, setSName] = useState<string>('');
  const [sEasting, setSEasting] = useState<string>('');
  const [sNorthing, setSNorthing] = useState<string>('');
  const [sCode, setSCode] = useState<string>('wall');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Sample Loader ──
  const handleLoadSample = () => {
    setBoundaryPoints(SAMPLE_CADASTRAL_BOUNDARY);
    setSurveyedPoints(SAMPLE_SURVEYED_FENCE);
  };

  const handleReset = () => {
    setBoundaryPoints([]);
    setSurveyedPoints([]);
    setSelectedPointId(null);
  };

  // Add boundary point
  const handleAddBoundaryPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const eNum = parseFloat(bEasting);
    const nNum = parseFloat(bNorthing);
    if (isNaN(eNum) || isNaN(nNum)) return;

    const newPt: CadastralBoundaryPoint = {
      id: `BM-${Date.now() % 10000}`,
      name: bName.trim() || `หมุด ${boundaryPoints.length + 1}`,
      easting: eNum,
      northing: nNum
    };
    setBoundaryPoints([...boundaryPoints, newPt]);
    setBName('');
    setBEasting('');
    setBNorthing('');
  };

  // Add surveyed point
  const handleAddSurveyedPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const eNum = parseFloat(sEasting);
    const nNum = parseFloat(sNorthing);
    if (isNaN(eNum) || isNaN(nNum)) return;

    const newPt: SurveyedFeaturePoint = {
      id: `S-${Date.now() % 10000}`,
      name: sName.trim() || `จุดรังวัด ${surveyedPoints.length + 1}`,
      easting: eNum,
      northing: nNum,
      featureCode: sCode
    };
    setSurveyedPoints([...surveyedPoints, newPt]);
    setSName('');
    setSEasting('');
    setSNorthing('');
  };

  // ── Evaluation Calculation ──
  const evaluationResult: CadastralEncroachmentResult | null = useMemo(() => {
    if (boundaryPoints.length < 3) return null;
    try {
      const tolM = Math.max(0, (parseFloat(toleranceCm) || 1.0) / 100);
      return evaluateCadastralEncroachment(boundaryPoints, surveyedPoints, tolM);
    } catch {
      return null;
    }
  }, [boundaryPoints, surveyedPoints, toleranceCm]);

  // Convert sqm to Thai Land units (Rai - Ngan - Wah)
  const formatThaiArea = (sqm: number) => {
    const wa = sqm / 4;
    const rai = Math.floor(wa / 400);
    const remainAfterRai = wa % 400;
    const ngan = Math.floor(remainAfterRai / 100);
    const tarangWa = (remainAfterRai % 100).toFixed(1);
    return `${rai} ไร่ ${ngan} งาน ${tarangWa} ตร.ว. (${sqm.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ตร.ม.)`;
  };

  // ── SVG Coordinate Normalizer ──
  const svgMetrics = useMemo(() => {
    const allPts = [
      ...boundaryPoints.map(p => ({ x: p.easting, y: p.northing })),
      ...surveyedPoints.map(p => ({ x: p.easting, y: p.northing }))
    ];
    if (allPts.length === 0) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    allPts.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const rangeX = maxX - minX || 10;
    const rangeY = maxY - minY || 10;
    const padding = Math.max(rangeX, rangeY) * 0.15;

    const bBoxMinX = minX - padding;
    const bBoxMaxX = maxX + padding;
    const bBoxMinY = minY - padding;
    const bBoxMaxY = maxY + padding;
    const width = bBoxMaxX - bBoxMinX;
    const height = bBoxMaxY - bBoxMinY;

    // ViewBox dimensions: 600 x 420
    const viewBoxW = 600;
    const viewBoxH = 420;

    const scale = Math.min((viewBoxW - 40) / width, (viewBoxH - 40) / height);

    const toSvg = (x: number, y: number) => {
      const sx = 20 + (x - bBoxMinX) * scale;
      const sy = viewBoxH - (20 + (y - bBoxMinY) * scale); // Flip Y so Northing goes up
      return { sx, sy };
    };

    return { toSvg, viewBoxW, viewBoxH, minX, maxX, minY, maxY };
  }, [boundaryPoints, surveyedPoints]);

  // Export CSV
  const handleExportCsv = () => {
    if (!evaluationResult) return;
    const headers = [
      'ID',
      'Point Name',
      'Easting',
      'Northing',
      'Status',
      'Encroachment (cm)',
      'Offset Distance (m)',
      'Closest Segment',
      'Recommendation'
    ];
    const rows = evaluationResult.items.map(item => [
      item.id,
      item.name,
      item.easting.toFixed(3),
      item.northing.toFixed(3),
      item.isEncroaching ? 'ENCROACHING' : 'SAFE',
      item.encroachmentCm.toFixed(1),
      item.offsetDistanceM.toFixed(3),
      `${item.closestSegmentFrom} -> ${item.closestSegmentTo}`,
      item.recommendation
    ]);
    exportToCsv({
      filename: `cadastral_encroachment_${Date.now()}.csv`,
      headers,
      rows
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header & Action Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-1)]">
              เครื่องมือตรวจสอบการรุกล้ำแนวเขตโฉนดที่ดิน (Cadastral Boundary Encroachment Detector)
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            คำนวณระยะรังวัดรั้ว/อาคารจริงเทียบแนวเขตโฉนด ตรวจสอบระยะรุกล้ำระดับเซนติเมตรตาม ป.พ.พ. มาตรา 1312
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadSample}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>โหลดตัวอย่างโฉนดและแนวรั้ว</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl text-[var(--text-3)] hover:text-red-500 hover:bg-red-500/10 transition-all border border-[var(--border)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ล้างข้อมูล</span>
          </button>
          {evaluationResult && (
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออกรายงาน CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      {evaluationResult ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)]">
            <div className="text-xs font-medium text-[var(--text-3)]">สถานะความสอดคล้องแนวเขต</div>
            <div className="mt-1 flex items-center gap-2">
              {evaluationResult.status === 'clean' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">ปลอดภัย 100%</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                    พบการรุกล้ำ ({evaluationResult.encroachingCount} จุด)
                  </span>
                </>
              )}
            </div>
            <div className="text-[11px] text-[var(--text-3)] mt-0.5">
              เกณฑ์ความคลาดเคลื่อนยอมรับ: {toleranceCm} ซม.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)]">
            <div className="text-xs font-medium text-[var(--text-3)]">ระยะรุกล้ำนอกโฉนดสูงสุด</div>
            <div className="mt-1 text-xl font-bold font-mono text-[var(--text-1)]">
              {evaluationResult.maxEncroachmentCm > 0 ? (
                <span className="text-rose-600 dark:text-rose-400">
                  +{evaluationResult.maxEncroachmentCm.toFixed(1)} ซม.
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">0.0 ซม.</span>
              )}
            </div>
            <div className="text-[11px] text-[var(--text-3)] mt-0.5">ระยะห่างตั้งฉากจากแนวเขต</div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)]">
            <div className="text-xs font-medium text-[var(--text-3)]">พื้นที่แปลงที่ดินตามโฉนด</div>
            <div className="mt-1 text-sm font-bold text-[var(--text-1)] truncate">
              {evaluationResult.boundaryAreaSqM.toFixed(1)} ตร.ม.
            </div>
            <div className="text-[11px] text-[var(--text-3)] mt-0.5 truncate">
              {formatThaiArea(evaluationResult.boundaryAreaSqM)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)]">
            <div className="text-xs font-medium text-[var(--text-3)]">ความยาวเส้นรอบแปลง / จุดตรวจสอบ</div>
            <div className="mt-1 text-base font-bold font-mono text-[var(--text-1)]">
              {evaluationResult.boundaryPerimeterM.toFixed(2)} ม.
            </div>
            <div className="text-[11px] text-[var(--text-3)] mt-0.5">
              ตรวจสอบ {evaluationResult.totalSurveyedPoints} จุดรังวัด
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-[var(--surface-1)] border border-dashed border-[var(--border)]">
          <Layers className="w-10 h-10 mx-auto text-[var(--text-3)] opacity-40 mb-3" />
          <h3 className="text-base font-semibold text-[var(--text-1)]">ยังไม่มีข้อมูลแนวเขตโฉนดที่ดิน</h3>
          <p className="text-sm text-[var(--text-2)] max-w-md mx-auto mt-1 mb-4">
            กรุณาป้อนพิกัดหมุดหลักเขตโฉนดอย่างน้อย 3 จุด หรือกดปุ่มโหลดตัวอย่างเพื่อเริ่มวิเคราะห์ทันที
          </p>
          <button
            onClick={handleLoadSample}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>โหลดตัวอย่างโฉนดและแนวรั้ว</span>
          </button>
        </div>
      )}

      {/* ── Interactive 2D SVG Parcel Map ── */}
      {svgMetrics && evaluationResult && (
        <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-[var(--text-1)]">แผนผังรังวัดแนวเขตและจุดตรวจสอบ (2D Interactive Cadastral Map)</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-2)]">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={e => setShowLabels(e.target.checked)}
                  className="rounded text-[var(--accent)]"
                />
                <span>แสดงชื่อจุด</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-2)]">
                <input
                  type="checkbox"
                  checked={showOffsetVectors}
                  onChange={e => setShowOffsetVectors(e.target.checked)}
                  className="rounded text-[var(--accent)]"
                />
                <span>แสดงเวกเตอร์รุกล้ำ</span>
              </label>
            </div>
          </div>

          <div className="relative w-full aspect-[16/10] bg-[var(--surface-2)] rounded-xl overflow-hidden border border-[var(--border)] flex items-center justify-center">
            <svg
              viewBox={`0 0 ${svgMetrics.viewBoxW} ${svgMetrics.viewBoxH}`}
              className="w-full h-full select-none"
            >
              <defs>
                <pattern id="cadGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeOpacity="0.05" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cadGrid)" />

              {/* Boundary Polygon Fill & Stroke */}
              {boundaryPoints.length >= 3 && (
                <polygon
                  points={boundaryPoints.map(p => {
                    const { sx, sy } = svgMetrics.toSvg(p.easting, p.northing);
                    return `${sx},${sy}`;
                  }).join(' ')}
                  className="fill-emerald-500/10 stroke-emerald-600 dark:stroke-emerald-400 stroke-2"
                />
              )}

              {/* Boundary Segments and Pegs */}
              {boundaryPoints.map((pt, idx) => {
                const { sx, sy } = svgMetrics.toSvg(pt.easting, pt.northing);
                return (
                  <g key={pt.id}>
                    <circle cx={sx} cy={sy} r="5" className="fill-emerald-600 stroke-white stroke-2" />
                    {showLabels && (
                      <text
                        x={sx}
                        y={sy - 9}
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold fill-[var(--text-1)]"
                      >
                        {pt.name}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Encroachment Offset Vectors */}
              {showOffsetVectors && evaluationResult.items.map(item => {
                const from = svgMetrics.toSvg(item.easting, item.northing);
                const to = svgMetrics.toSvg(item.closestPointOnBoundary.easting, item.closestPointOnBoundary.northing);
                return (
                  <g key={`vec-${item.id}`}>
                    <line
                      x1={from.sx}
                      y1={from.sy}
                      x2={to.sx}
                      y2={to.sy}
                      stroke={item.isEncroaching ? '#f43f5e' : '#10b981'}
                      strokeWidth="1.5"
                      strokeDasharray={item.isEncroaching ? '3 3' : 'none'}
                    />
                    <circle cx={to.sx} cy={to.sy} r="2.5" fill={item.isEncroaching ? '#f43f5e' : '#10b981'} />
                  </g>
                );
              })}

              {/* Surveyed Points */}
              {evaluationResult.items.map(item => {
                const { sx, sy } = svgMetrics.toSvg(item.easting, item.northing);
                const isSelected = selectedPointId === item.id;
                return (
                  <g
                    key={item.id}
                    onClick={() => setSelectedPointId(item.id)}
                    className="cursor-pointer transition-transform hover:scale-125"
                  >
                    {item.isEncroaching && (
                      <circle cx={sx} cy={sy} r="9" className="fill-rose-500/20 animate-ping" />
                    )}
                    <circle
                      cx={sx}
                      cy={sy}
                      r={isSelected ? '6' : '4.5'}
                      fill={item.isEncroaching ? '#e11d48' : item.legalSeverity === 'warning' ? '#f59e0b' : '#059669'}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    {showLabels && (
                      <text
                        x={sx + 8}
                        y={sy + 3}
                        className={`text-[9px] font-mono font-semibold ${
                          item.isEncroaching ? 'fill-rose-600 font-bold' : 'fill-[var(--text-2)]'
                        }`}
                      >
                        {item.name} {item.isEncroaching ? `(+${item.encroachmentCm}cm)` : ''}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-3)]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> แนวเขตโฉนดที่ดิน
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> จุดรุกล้ำออกนอกเขต
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> ชิดแนวเขต (&lt;5 ซม.)
              </span>
            </div>
            <span className="font-mono text-[11px]">N ↑ (ระบบพิกัดฉาก UTM)</span>
          </div>
        </div>
      )}

      {/* ── Encroachment Evaluation Table ── */}
      {evaluationResult && (
        <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-sm font-bold text-[var(--text-1)]">
                ตารางวิเคราะห์การรุกล้ำและข้อเสนอแนะทางกฎหมาย (Legal Encroachment Audit)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-3)]">เกณฑ์คลาดเคลื่อน:</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={toleranceCm}
                onChange={e => setToleranceCm(e.target.value)}
                className="w-16 px-2 py-1 text-xs font-mono rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)]"
              />
              <span className="text-xs text-[var(--text-3)]">ซม.</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/50 text-[var(--text-3)] font-medium">
                  <th className="py-2.5 px-3">จุดรังวัด</th>
                  <th className="py-2.5 px-3">พิกัด N, E</th>
                  <th className="py-2.5 px-3">แนวเขตโฉนดที่ใกล้สุด</th>
                  <th className="py-2.5 px-3 text-right">ระยะรุกล้ำ</th>
                  <th className="py-2.5 px-3 text-center">สถานะ</th>
                  <th className="py-2.5 px-3">การวิเคราะห์และข้อกฎหมาย (ป.พ.พ. 1312)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {evaluationResult.items.map(item => {
                  const isSelected = selectedPointId === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedPointId(item.id)}
                      className={`cursor-pointer transition-colors ${
                        item.isEncroaching ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-[var(--surface-2)]'
                      } ${isSelected ? 'ring-1 ring-[var(--accent)]' : ''}`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-[var(--text-1)]">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[var(--text-2)]">
                        N: {item.northing.toFixed(3)}, E: {item.easting.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-2)]">
                        {item.closestSegmentFrom} → {item.closestSegmentTo}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {item.isEncroaching ? (
                          <span className="text-rose-600 dark:text-rose-400">+{item.encroachmentCm.toFixed(1)} ซม.</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ในเขต ({(item.offsetDistanceM * 100).toFixed(1)} ซม.)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.isEncroaching ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-3 h-3" /> รุกล้ำ
                          </span>
                        ) : item.legalSeverity === 'warning' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            ชิดแนวเขต
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            ปลอดภัย
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-2)] leading-relaxed">
                        {item.recommendation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 rounded-xl bg-[var(--surface-2)] text-[11px] text-[var(--text-3)] flex items-start gap-2">
            <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <span>{evaluationResult.disclaimer}</span>
          </div>
        </div>
      )}

      {/* ── Point Entry & Management Workspace ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Boundary Points Desk */}
        <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-[var(--text-1)]">
                1. หมุดหลักเขตโฉนดที่ดิน ({boundaryPoints.length} หมุด)
              </h3>
            </div>
          </div>

          <form onSubmit={handleAddBoundaryPoint} className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="ชื่อหมุด (เช่น หมุด 1)"
              value={bName}
              onChange={e => setBName(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)]"
            />
            <input
              type="number"
              step="any"
              placeholder="Easting (m)"
              value={bEasting}
              onChange={e => setBEasting(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)]"
              required
            />
            <div className="flex gap-1.5">
              <input
                type="number"
                step="any"
                placeholder="Northing (m)"
                value={bNorthing}
                onChange={e => setBNorthing(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)]"
                required
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shrink-0"
                title="เพิ่มหมุดเขต"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {boundaryPoints.map((pt, idx) => (
              <div
                key={pt.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-2)] text-xs border border-[var(--border)]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[var(--text-3)]">{idx + 1}.</span>
                  <span className="font-semibold text-[var(--text-1)]">{pt.name}</span>
                  <span className="font-mono text-[11px] text-[var(--text-2)]">
                    E: {pt.easting.toFixed(3)}, N: {pt.northing.toFixed(3)}
                  </span>
                </div>
                <button
                  onClick={() => setBoundaryPoints(boundaryPoints.filter(p => p.id !== pt.id))}
                  className="text-[var(--text-3)] hover:text-red-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {boundaryPoints.length === 0 && (
              <div className="text-center py-6 text-xs text-[var(--text-3)]">
                ยังไม่มีหมุดเขตโฉนด
              </div>
            )}
          </div>
        </div>

        {/* 2. Surveyed Features Desk */}
        <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="text-sm font-bold text-[var(--text-1)]">
                2. จุดรังวัดสิ่งปลูกสร้าง/รั้ว ({surveyedPoints.length} จุด)
              </h3>
            </div>
          </div>

          <form onSubmit={handleAddSurveyedPoint} className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="ชื่อจุด (เช่น เสารั้ว 1)"
              value={sName}
              onChange={e => setSName(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)]"
            />
            <input
              type="number"
              step="any"
              placeholder="Easting (m)"
              value={sEasting}
              onChange={e => setSEasting(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)]"
              required
            />
            <div className="flex gap-1.5">
              <input
                type="number"
                step="any"
                placeholder="Northing (m)"
                value={sNorthing}
                onChange={e => setSNorthing(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)]"
                required
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-all shrink-0"
                title="เพิ่มจุดรังวัด"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {surveyedPoints.map((pt, idx) => (
              <div
                key={pt.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-2)] text-xs border border-[var(--border)]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[var(--text-3)]">{idx + 1}.</span>
                  <span className="font-semibold text-[var(--text-1)]">{pt.name}</span>
                  <span className="font-mono text-[11px] text-[var(--text-2)]">
                    E: {pt.easting.toFixed(3)}, N: {pt.northing.toFixed(3)}
                  </span>
                </div>
                <button
                  onClick={() => setSurveyedPoints(surveyedPoints.filter(p => p.id !== pt.id))}
                  className="text-[var(--text-3)] hover:text-red-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {surveyedPoints.length === 0 && (
              <div className="text-center py-6 text-xs text-[var(--text-3)]">
                ยังไม่มีจุดรังวัด
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
