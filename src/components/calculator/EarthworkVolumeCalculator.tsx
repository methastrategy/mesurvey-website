import React, { useState, useMemo, useRef } from 'react';
import {
  Mountain,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Scale,
  Sparkles,
  Calculator,
  Grid,
  ArrowUpRight,
  Eye
} from 'lucide-react';
import {
  TinPoint,
  EarthworkVolumeResult,
  calculateSurfaceToDatumVolume,
  calculateSurfaceToSlopedPlaneVolume,
  calculateSurfaceToSurfaceVolume,
  parseEarthworkPointsCsv,
  downloadEarthworkTemplateCsv,
  SAMPLE_EXISTING_SURFACE_POINTS,
  SAMPLE_DESIGN_SURFACE_POINTS
} from '../../utils/earthwork-tin';
import { exportToCsv } from '../../utils/csv-export';
import { trackEvent } from '../../lib/telemetry';

type CalculationMode = 'datum' | 'sloped-plane' | 'surface-to-surface';
type ActiveSurfaceTab = 'existing' | 'design';

export const EarthworkVolumeCalculator: React.FC = () => {
  const [mode, setMode] = useState<CalculationMode>('datum');
  const [activeSurfaceTab, setActiveSurfaceTab] = useState<ActiveSurfaceTab>('existing');
  const [existingPoints, setExistingPoints] = useState<TinPoint[]>([]);
  const [designPoints, setDesignPoints] = useState<TinPoint[]>([]);

  // Parameters
  const [datumElevation, setDatumElevation] = useState<string>('12.000');
  const [slopeXPercent, setSlopeXPercent] = useState<string>('0.0');
  const [slopeYPercent, setSlopeYPercent] = useState<string>('0.0');
  const [maxEdgeLength, setMaxEdgeLength] = useState<string>('0');

  // Visualization toggles
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showElevations, setShowElevations] = useState<boolean>(true);
  const [showOglPoints, setShowOglPoints] = useState<boolean>(true);
  const [showFglPoints, setShowFglPoints] = useState<boolean>(true);
  const [hoveredTriangleId, setHoveredTriangleId] = useState<string | null>(null);

  // CSV input & UI state
  const [csvError, setCsvError] = useState<string | null>(null);
  const [showFormatGuide, setShowFormatGuide] = useState<boolean>(false);
  const existingFileInputRef = useRef<HTMLInputElement>(null);
  const designFileInputRef = useRef<HTMLInputElement>(null);

  // Manual point entry form
  const [newId, setNewId] = useState<string>('');
  const [newX, setNewX] = useState<string>('');
  const [newY, setNewY] = useState<string>('');
  const [newZ, setNewZ] = useState<string>('');

  // ── Sample Loaders & Presets ────────────────────────────────────────────────
  const loadSampleData = () => {
    setExistingPoints(SAMPLE_EXISTING_SURFACE_POINTS);
    setDesignPoints(SAMPLE_DESIGN_SURFACE_POINTS);
    setDatumElevation('12.000');
    setSlopeXPercent('1.5');
    setSlopeYPercent('0.5');
    setCsvError(null);
    trackEvent('earthwork_load_sample');
  };

  const loadExcavationPreset = () => {
    setExistingPoints(SAMPLE_EXISTING_SURFACE_POINTS);
    setMode('datum');
    setDatumElevation('11.000');
    setCsvError(null);
    trackEvent('earthwork_preset_excavation');
  };

  const loadLandFillPreset = () => {
    setExistingPoints(SAMPLE_EXISTING_SURFACE_POINTS);
    setMode('datum');
    setDatumElevation('13.500');
    setCsvError(null);
    trackEvent('earthwork_preset_fill');
  };

  const loadSurfaceToSurfacePreset = () => {
    setExistingPoints(SAMPLE_EXISTING_SURFACE_POINTS);
    setDesignPoints(SAMPLE_DESIGN_SURFACE_POINTS);
    setMode('surface-to-surface');
    setActiveSurfaceTab('existing');
    setCsvError(null);
    trackEvent('earthwork_preset_s2s');
  };

  const handleClearAll = () => {
    if (window.confirm('ยืนยันล้างข้อมูลสำรวจภูมิประเทศทั้งหมดเพื่อเริ่มใหม่?')) {
      setExistingPoints([]);
      setDesignPoints([]);
      setCsvError(null);
    }
  };

  const handleClearCurrentSurface = () => {
    const targetLabel = activeSurfaceTab === 'existing' ? 'ผิวดินเดิม (OGL)' : 'ผิวดินออกแบบ (FGL)';
    if (window.confirm(`ยืนยันล้างข้อมูลหมุด${targetLabel}ทั้งหมด?`)) {
      if (activeSurfaceTab === 'existing') {
        setExistingPoints([]);
      } else {
        setDesignPoints([]);
      }
      setCsvError(null);
    }
  };

  // ── CSV Upload Handler ──────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetSurface: ActiveSurfaceTab) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    try {
      const text = await file.text();
      const parsed = parseEarthworkPointsCsv(text);
      if (parsed.errors.length > 0 && parsed.points.length === 0) {
        setCsvError(parsed.errors.join(' | '));
      } else {
        if (targetSurface === 'existing') {
          setExistingPoints(parsed.points);
        } else {
          setDesignPoints(parsed.points);
        }
        if (parsed.errors.length > 0) {
          setCsvError(`นำเข้าสำเร็จ ${parsed.points.length} จุด (เตือน: ${parsed.errors[0]})`);
        }
      }
    } catch (err: any) {
      setCsvError(`ไม่สามารถอ่านไฟล์: ${err?.message}`);
    } finally {
      e.target.value = '';
    }
  };

  // ── Manual Point Entry ──────────────────────────────────────────────────────
  const handleAddPoint = () => {
    const x = parseFloat(newX);
    const y = parseFloat(newY);
    const z = parseFloat(newZ);
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      alert('กรุณากรอกค่าพิกัด X (Easting), Y (Northing) และ Z (Elevation) ให้ครบถ้วนเป็นตัวเลข');
      return;
    }
    const targetSurface = mode === 'surface-to-surface' ? activeSurfaceTab : 'existing';
    const currentList = targetSurface === 'existing' ? existingPoints : designPoints;
    const prefix = targetSurface === 'existing' ? 'OGL' : 'FGL';
    const pid = newId.trim() || `${prefix}-${currentList.length + 1}`;
    const newPt: TinPoint = { id: pid, name: pid, x, y, z };

    if (targetSurface === 'existing') {
      setExistingPoints([...existingPoints, newPt]);
    } else {
      setDesignPoints([...designPoints, newPt]);
    }
    setNewId('');
    setNewX('');
    setNewY('');
    setNewZ('');
  };

  const handleRemovePoint = (index: number, targetSurface: ActiveSurfaceTab) => {
    if (targetSurface === 'existing') {
      setExistingPoints(existingPoints.filter((_, i) => i !== index));
    } else {
      setDesignPoints(designPoints.filter((_, i) => i !== index));
    }
  };

  // ── Main Computation ────────────────────────────────────────────────────────
  const result: EarthworkVolumeResult | null = useMemo(() => {
    if (existingPoints.length < 3) return null;

    try {
      const maxEdge = parseFloat(maxEdgeLength) > 0 ? parseFloat(maxEdgeLength) : undefined;
      if (mode === 'datum') {
        const datum = parseFloat(datumElevation) || 0;
        return calculateSurfaceToDatumVolume(existingPoints, datum, maxEdge);
      } else if (mode === 'sloped-plane') {
        const datum = parseFloat(datumElevation) || 0;
        const sX = parseFloat(slopeXPercent) || 0;
        const sY = parseFloat(slopeYPercent) || 0;
        const basePt = { x: existingPoints[0]?.x || 0, y: existingPoints[0]?.y || 0 };
        return calculateSurfaceToSlopedPlaneVolume(existingPoints, datum, basePt, sX, sY, maxEdge);
      } else {
        // Surface-to-Surface (OGL vs FGL)
        if (designPoints.length < 3) {
          return null; // Explicitly require design points
        }
        return calculateSurfaceToSurfaceVolume(existingPoints, designPoints, maxEdge);
      }
    } catch {
      return null;
    }
  }, [existingPoints, designPoints, mode, datumElevation, slopeXPercent, slopeYPercent, maxEdgeLength]);

  // ── CSV Export Report ───────────────────────────────────────────────────────
  const handleExportCsv = () => {
    if (!result) return;
    trackEvent('earthwork_export_csv', { triangles: result.totalTriangles });
    const headers = [
      'Triangle_ID',
      'Area_m2',
      'Classification',
      'Cut_Volume_m3',
      'Fill_Volume_m3',
      'Net_Volume_m3',
      'P1_X', 'P1_Y', 'P1_Z',
      'P2_X', 'P2_Y', 'P2_Z',
      'P3_X', 'P3_Y', 'P3_Z'
    ];
    const rows = result.triangles.map(t => [
      t.triangleId,
      t.area2D.toFixed(3),
      t.classification,
      t.cutVolumeM3.toFixed(3),
      t.fillVolumeM3.toFixed(3),
      t.netVolumeM3.toFixed(3),
      t.p1.x.toFixed(3), t.p1.y.toFixed(3), t.p1.z.toFixed(3),
      t.p2.x.toFixed(3), t.p2.y.toFixed(3), t.p2.z.toFixed(3),
      t.p3.x.toFixed(3), t.p3.y.toFixed(3), t.p3.z.toFixed(3)
    ]);
    exportToCsv({ filename: `earthwork_cut_fill_${Date.now()}.csv`, headers, rows });
  };

  // ── Responsive SVG Canvas Geometry Helpers ─────────────────────────────────
  const svgBounds = useMemo(() => {
    const allPts = mode === 'surface-to-surface'
      ? [...existingPoints, ...designPoints]
      : (result ? result.tinPoints : existingPoints);

    if (allPts.length === 0) return null;

    let minX = Infinity; let maxX = -Infinity;
    let minY = Infinity; let maxY = -Infinity;
    for (const p of allPts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const spanX = Math.max(maxX - minX, 1.0);
    const spanY = Math.max(maxY - minY, 1.0);
    const padX = spanX * 0.14;
    const padY = spanY * 0.14;

    const viewBoxMinX = minX - padX;
    const viewBoxMinY = minY - padY;
    const viewBoxWidth = spanX + 2 * padX;
    const viewBoxHeight = spanY + 2 * padY;

    const maxSpan = Math.max(spanX, spanY);
    // Proportionate scaling so geometry is crisp whether 10m or 5,000m wide
    const ptRadius = Math.max(0.3, maxSpan * 0.012);
    const strokeWidth = Math.max(0.08, maxSpan * 0.0035);
    const fontSize = Math.max(0.6, maxSpan * 0.024);
    const elevFontSize = Math.max(0.5, maxSpan * 0.019);

    return {
      viewBox: `${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`,
      spanX, spanY, minX, maxX, minY, maxY,
      ptRadius, strokeWidth, fontSize, elevFontSize
    };
  }, [result, existingPoints, designPoints, mode]);

  // Points list for active worksheet tab
  const currentWorksheetPoints = activeSurfaceTab === 'existing' ? existingPoints : designPoints;

  return (
    <div className="space-y-6">

      {/* ── Top Header & Command Bar ── */}
      <div className="fusion-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xs">
              <Mountain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-1)]">
                  คำนวณปริมาตรดินขุด-ถม 2.5D TIN (Earthwork Cut & Fill Volume)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  Delaunay Prismoidal
                </span>
              </div>
              <p className="text-xs text-[var(--text-2)]">
                วิเคราะห์งานดินขุด-ดินถมด้วยโครงข่ายสามเหลี่ยม TIN ตามวิธีปริซึมตัดทอนเที่ยงตรงสูง แทนซอฟต์แวร์ Carlson / Civil 3D
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={existingFileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={(e) => handleFileUpload(e, 'existing')}
              className="hidden"
            />
            <input
              ref={designFileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={(e) => handleFileUpload(e, 'design')}
              className="hidden"
            />

            {/* CSV Import */}
            <button
              type="button"
              onClick={() => {
                if (mode === 'surface-to-surface' && activeSurfaceTab === 'design') {
                  designFileInputRef.current?.click();
                } else {
                  existingFileInputRef.current?.click();
                }
              }}
              className="btn-outline min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="นำเข้าจุดพิกัดสำรวจจากไฟล์ CSV"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                นำเข้า CSV {mode === 'surface-to-surface' ? (activeSurfaceTab === 'existing' ? '(OGL)' : '(FGL)') : ''}
              </span>
            </button>

            {/* Template CSV */}
            <button
              type="button"
              onClick={() => downloadEarthworkTemplateCsv(activeSurfaceTab === 'existing' ? 'ogl' : 'fgl')}
              className="btn-outline min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="ดาวน์โหลดไฟล์แม่แบบ CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Template CSV</span>
            </button>

            {/* Format Guide Toggle */}
            <button
              type="button"
              onClick={() => setShowFormatGuide(!showFormatGuide)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                showFormatGuide ? 'bg-indigo-600 text-white border-indigo-500' : 'btn-outline'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>รูปแบบ</span>
            </button>

            {/* Presets Button */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={loadSampleData}
                className="min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 transition shadow-xs cursor-pointer"
                title="โหลดชุดข้อมูลตัวอย่างภูมิประเทศ 12 จุด พร้อมคำนวณทันที"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>⚡ โหลดตัวอย่างงานดิน</span>
              </button>
            </div>

            {/* Clear All */}
            {(existingPoints.length > 0 || designPoints.length > 0) && (
              <button
                type="button"
                onClick={handleClearAll}
                className="btn-outline min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border-rose-500/30 cursor-pointer"
                title="ล้างข้อมูลหมุดทั้งหมดเพื่อเริ่มใหม่"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างตาราง</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Format Guide ── */}
        {showFormatGuide && (
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-indigo-600 dark:text-indigo-400">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                <span>คำแนะนำรูปแบบไฟล์ CSV พิกัดจุดระดับภูมิประเทศ</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadEarthworkTemplateCsv('ogl')}
                  className="px-2.5 py-1 rounded bg-indigo-600 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" /> Template OGL
                </button>
                <button
                  type="button"
                  onClick={() => downloadEarthworkTemplateCsv('fgl')}
                  className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" /> Template FGL
                </button>
              </div>
            </div>
            <p className="text-[var(--text-2)]">
              ไฟล์ CSV สามารถมีหัวคอลัมน์หรือไม่ก็ได้ คอลัมน์ที่ต้องการ: <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Point_ID, Easting_X, Northing_Y, Elevation_Z</code> (หน่วยเป็นเมตรทั้งหมด รองรับทั้งพิกัดเฉพาะพื้นที่และพิกัดกริด UTM)
            </p>
          </div>
        )}

        {csvError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{csvError}</span>
          </div>
        )}

        {/* ── Mode Switcher & Parameters ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[var(--border)]">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
              รูปแบบการออกแบบระดับดิน (Design Grade Mode)
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setMode('datum')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  mode === 'datum' ? 'bg-[var(--accent)] text-black dark:text-white shadow-xs' : 'text-[var(--text-2)]'
                }`}
              >
                ระดับคงที่ (Datum)
              </button>
              <button
                type="button"
                onClick={() => setMode('sloped-plane')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  mode === 'sloped-plane' ? 'bg-[var(--accent)] text-black dark:text-white shadow-xs' : 'text-[var(--text-2)]'
                }`}
              >
                ระนาบลาดเอียง (Slope)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('surface-to-surface');
                  if (activeSurfaceTab !== 'existing' && activeSurfaceTab !== 'design') {
                    setActiveSurfaceTab('existing');
                  }
                }}
                className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  mode === 'surface-to-surface' ? 'bg-[var(--accent)] text-black dark:text-white shadow-xs' : 'text-[var(--text-2)]'
                }`}
              >
                ผิวดินเดิม vs ออกแบบ
              </button>
            </div>
          </div>

          {mode !== 'surface-to-surface' ? (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                ระดับอ้างอิงออกแบบ Z_datum (เมตร รทก. / Elevation MSL)
              </label>
              <input
                type="number"
                step="0.001"
                value={datumElevation}
                onChange={(e) => setDatumElevation(e.target.value)}
                placeholder="12.000"
                className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-1)] font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                สถานะข้อมูลเปรียบเทียบ 2 พื้นผิว (Dual Surfaces)
              </label>
              <div className="p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs flex items-center justify-between">
                <span className="text-[var(--text-2)]">ผิวดินเดิม (OGL): <strong className="font-mono text-indigo-600 dark:text-indigo-400">{existingPoints.length}</strong> จุด</span>
                <span className="text-[var(--text-2)]">ผิวดินออกแบบ (FGL): <strong className="font-mono text-emerald-600 dark:text-emerald-400">{designPoints.length}</strong> จุด</span>
              </div>
            </div>
          )}

          {mode === 'sloped-plane' ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                  สโลปทิศตะวันออก Sx (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={slopeXPercent}
                  onChange={(e) => setSlopeXPercent(e.target.value)}
                  className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-1)] font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                  สโลปทิศเหนือ Sy (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={slopeYPercent}
                  onChange={(e) => setSlopeYPercent(e.target.value)}
                  className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-1)] font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-end">
              <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text-2)] w-full flex items-center justify-between">
                <span>จำนวนหมุดผิวดินเดิม:</span>
                <span className="font-mono font-bold text-[var(--text-1)]">{existingPoints.length} จุด</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Alpha Boundary Filter (Max Triangle Edge Threshold) ── */}
        <div className="pt-2.5 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-1)]">กรองขอบเขตสามเหลี่ยมชายขอบ (Alpha Boundary Filter):</span>
            <span className="text-[11px] text-[var(--text-3)] hidden md:inline">(ขจัดสามเหลี่ยมลอยข้ามแปลงรูป L หรือบ่อน้ำกลางแปลง)</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-[var(--text-2)] whitespace-nowrap">ความยาวด้านสูงสุด:</label>
            <input
              type="number"
              step="1"
              min="0"
              value={maxEdgeLength}
              onChange={(e) => setMaxEdgeLength(e.target.value)}
              placeholder="0 (ไม่จำกัด)"
              className="w-24 min-h-[32px] px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-1)] font-mono text-xs text-center focus:outline-none focus:border-[var(--accent)]"
            />
            <span className="text-[11px] text-[var(--text-3)] font-mono whitespace-nowrap">
              ม. {parseFloat(maxEdgeLength) > 0 ? `(≤ ${maxEdgeLength}m)` : '(0 = ไม่จำกัด)'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Blank Slate Empty State ── */}
      {existingPoints.length === 0 && designPoints.length === 0 ? (
        <div className="fusion-card p-10 sm:p-14 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shadow-sm">
            <Mountain className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-1)]">
              ยังไม่มีข้อมูลจุดระดับภูมิประเทศ (Empty Earthwork Worksheet)
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
              เริ่มต้นโดยนำเข้าไฟล์ CSV พิกัดสนาม (X, Y, Z), ป้อนจุดระดับด้วยตนเอง หรือคลิกปุ่มด้านล่างเพื่อโหลดชุดข้อมูลภูมิประเทศตัวอย่างพร้อมคำนวณและแสดงแผนผังทันที
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <button
              type="button"
              onClick={loadSampleData}
              className="btn-primary min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>⚡ โหลดตัวอย่างงานดินขุด-ถม (Load Sample Cut/Fill)</span>
            </button>
            <button
              type="button"
              onClick={() => existingFileInputRef.current?.click()}
              className="btn-outline min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-500" />
              <span>นำเข้าไฟล์ CSV</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Surface-to-surface Guard Notice if Design Points < 3 */}
          {mode === 'surface-to-surface' && designPoints.length < 3 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <strong>ต้องการจุดพิกัดผิวดินออกแบบ (FGL) อย่างน้อย 3 จุด:</strong>
                  <span className="block text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    เพื่อสร้างโครงข่ายสามเหลี่ยม 2.5D TIN เปรียบเทียบกับผิวดินเดิม (OGL) กรุณานำเข้า CSV หรือคลิกโหลดตัวอย่างผิวดินออกแบบ
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDesignPoints(SAMPLE_DESIGN_SURFACE_POINTS)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>⚡ โหลดตัวอย่าง FGL (9 จุด)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSurfaceTab('design')}
                  className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-white/50 dark:bg-black/20 text-amber-900 dark:text-amber-200 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>ป้อนจุด FGL</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Bento Box Key Metrics Cards ── */}
          {result && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Cut Volume */}
              <div className="fusion-card p-4 space-y-1.5 border-l-4 border-l-amber-500 bg-amber-500/5">
                <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5" /> ดินขุด (Cut Volume)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20">
                    {result.cutArea2D.toFixed(1)} m²
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-amber-900 dark:text-amber-100 tabular-nums">
                  {result.totalCutVolumeM3.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xs font-normal text-amber-700/80 dark:text-amber-300/80 ml-1">m³</span>
                </div>
                <div className="text-[11px] font-mono text-amber-800/80 dark:text-amber-300/70">
                  ขุดลึกสูงสุด {result.maxCutDepthM.toFixed(3)} ม. (เฉลี่ย {result.avgCutDepthM.toFixed(2)} ม.)
                </div>
              </div>

              {/* Card 2: Fill Volume */}
              <div className="fusion-card p-4 space-y-1.5 border-l-4 border-l-emerald-500 bg-emerald-500/5">
                <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> ดินถม (Fill Volume)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20">
                    {result.fillArea2D.toFixed(1)} m²
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-100 tabular-nums">
                  {result.totalFillVolumeM3.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xs font-normal text-emerald-700/80 dark:text-emerald-300/80 ml-1">m³</span>
                </div>
                <div className="text-[11px] font-mono text-emerald-800/80 dark:text-emerald-300/70">
                  ถมสูงสุด {result.maxFillHeightM.toFixed(3)} ม. (เฉลี่ย {result.avgFillHeightM.toFixed(2)} ม.)
                </div>
              </div>

              {/* Card 3: Net Balance */}
              <div className="fusion-card p-4 space-y-1.5 border-l-4 border-l-indigo-500 bg-indigo-500/5">
                <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" /> ปริมาตรสุทธิ (Net Volume)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20">
                    {result.netVolumeM3 >= 0 ? 'Net Cut' : 'Net Fill'}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-900 dark:text-indigo-100 tabular-nums">
                  {Math.abs(result.netVolumeM3).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xs font-normal text-indigo-700/80 dark:text-indigo-300/80 ml-1">m³</span>
                </div>
                <div className="text-[11px] text-indigo-800/80 dark:text-indigo-300/70 truncate">
                  {result.netVolumeM3 >= 0 ? 'ดินขุดมากกว่าดินถม (ต้องขนดินออก)' : 'ดินถมมากกว่าดินขุด (ต้องสั่งดินเพิ่ม)'}
                </div>
              </div>

              {/* Card 4: Surface Area & Mesh */}
              <div className="fusion-card p-4 space-y-1.5 border-l-4 border-l-sky-500 bg-sky-500/5">
                <div className="flex items-center justify-between text-xs text-sky-700 dark:text-sky-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> พื้นที่ราบ 2D (Total Area)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20">
                    {result.totalTriangles} Triangles
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-sky-900 dark:text-sky-100 tabular-nums">
                  {result.totalArea2D.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xs font-normal text-sky-700/80 dark:text-sky-300/80 ml-1">m²</span>
                </div>
                <div className="text-[11px] font-mono text-sky-800/80 dark:text-sky-300/70">
                  {((result.totalArea2D / 1600)).toFixed(2)} ไร่ ({((result.totalArea2D / 4)).toFixed(1)} ตร.ว.)
                </div>
              </div>
            </div>
          )}

          {/* Collinear Warning if Triangles === 0 */}
          {result && result.totalTriangles === 0 && existingPoints.length >= 3 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                จุดพิกัดสำรวจเรียงตัวเป็นเส้นตรง (Collinear) หรือพื้นที่ไม่ทับซ้อนกัน ไม่สามารถสร้างโครงข่ายสามเหลี่ยม 2D TIN ได้ กรุณาเพิ่มจุดสำรวจที่มีการกระจายพิกัดในระนาบ 2 มิติ
              </span>
            </div>
          )}

          {/* ── Interactive 2D TIN Map View ── */}
          {result && svgBounds && result.totalTriangles > 0 && (
            <div className="fusion-card overflow-hidden">
              <div className="px-4 py-3 bg-[var(--surface-2)] border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-xs font-bold text-[var(--text-1)]">
                    แผนผังโครงข่ายสามเหลี่ยม TIN & โซนขุด-ถม (Interactive Cut/Fill Mesh Preview)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-2)]">
                    <input
                      type="checkbox"
                      checked={showLabels}
                      onChange={(e) => setShowLabels(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>ชื่อหมุด</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-2)]">
                    <input
                      type="checkbox"
                      checked={showElevations}
                      onChange={(e) => setShowElevations(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>ค่าระดับ Z</span>
                  </label>

                  {mode === 'surface-to-surface' && (
                    <>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-2)] border-l border-[var(--border)] pl-3">
                        <input
                          type="checkbox"
                          checked={showOglPoints}
                          onChange={(e) => setShowOglPoints(e.target.checked)}
                          className="rounded text-cyan-600 focus:ring-0"
                        />
                        <span>หมุด OGL ({existingPoints.length})</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-2)]">
                        <input
                          type="checkbox"
                          checked={showFglPoints}
                          onChange={(e) => setShowFglPoints(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span>หมุด FGL ({designPoints.length})</span>
                      </label>
                    </>
                  )}

                  {/* Legend */}
                  <div className="flex items-center gap-2 border-l border-[var(--border)] pl-3">
                    <span className="flex items-center gap-1 text-[11px]">
                      <span className="w-3 h-3 rounded bg-amber-500/70 inline-block" />
                      <span>ขุด (Cut)</span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <span className="w-3 h-3 rounded bg-emerald-500/70 inline-block" />
                      <span>ถม (Fill)</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-[var(--surface)] flex justify-center">
                <div className="w-full max-w-4xl h-[400px] sm:h-[480px] rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 overflow-hidden relative">
                  <svg
                    viewBox={svgBounds.viewBox}
                    className="w-full h-full cursor-crosshair"
                    style={{ transform: 'scale(1, -1)' }} // Invert Y so North is up
                  >
                    {/* Triangles */}
                    {result.triangles.map((tri) => {
                      const isCut = tri.classification === 'cut' || tri.cutVolumeM3 >= tri.fillVolumeM3;
                      const isHovered = hoveredTriangleId === tri.triangleId;
                      const fillColor = isCut
                        ? isHovered ? 'rgba(245, 158, 11, 0.85)' : 'rgba(245, 158, 11, 0.45)'
                        : isHovered ? 'rgba(16, 185, 129, 0.85)' : 'rgba(16, 185, 129, 0.45)';
                      const strokeColor = isCut ? '#b45309' : '#047857';

                      const pointsStr = `${tri.p1.x},${tri.p1.y} ${tri.p2.x},${tri.p2.y} ${tri.p3.x},${tri.p3.y}`;

                      return (
                        <g key={tri.triangleId}>
                          <polygon
                            points={pointsStr}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={svgBounds.strokeWidth}
                            className="transition-colors duration-150"
                            onMouseEnter={() => setHoveredTriangleId(tri.triangleId)}
                            onMouseLeave={() => setHoveredTriangleId(null)}
                          />
                        </g>
                      );
                    })}

                    {/* Vertices Rendering */}
                    {result.tinPoints.map((pt) => (
                      <g key={pt.id || `${pt.x}-${pt.y}`}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={svgBounds.ptRadius}
                          fill="var(--accent)"
                          stroke="var(--surface)"
                          strokeWidth={svgBounds.strokeWidth}
                        />
                        {/* Text (Inverted back so text is readable) */}
                        <g transform={`translate(${pt.x}, ${pt.y}) scale(1, -1)`}>
                          {showLabels && (
                            <text
                              x={svgBounds.ptRadius * 1.5}
                              y={-svgBounds.ptRadius}
                              fontSize={svgBounds.fontSize}
                              fontWeight="bold"
                              fill="var(--text-1)"
                              className="pointer-events-none select-none font-mono"
                            >
                              {pt.name || pt.id}
                            </text>
                          )}
                          {showElevations && (
                            <text
                              x={svgBounds.ptRadius * 1.5}
                              y={svgBounds.ptRadius * 1.5}
                              fontSize={svgBounds.elevFontSize}
                              fill="var(--text-3)"
                              className="pointer-events-none select-none font-mono"
                            >
                              {pt.z.toFixed(2)}m
                            </text>
                          )}
                        </g>
                      </g>
                    ))}
                  </svg>

                  {/* Hovered Triangle Tooltip Overlay */}
                  {hoveredTriangleId && (() => {
                    const t = result.triangles.find(tri => tri.triangleId === hoveredTriangleId);
                    if (!t) return null;
                    return (
                      <div className="absolute bottom-3 left-3 p-3 rounded-xl bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] shadow-lg text-xs space-y-1 font-mono pointer-events-none z-10">
                        <div className="font-bold text-[var(--accent)] flex items-center justify-between gap-3">
                          <span>สามเหลี่ยม {t.triangleId} ({t.classification.toUpperCase()})</span>
                          <span>{t.area2D.toFixed(2)} m²</span>
                        </div>
                        <div className="text-[var(--text-2)] flex items-center gap-3">
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            Cut: {t.cutVolumeM3.toFixed(2)} m³
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Fill: {t.fillVolumeM3.toFixed(2)} m³
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-3)]">
                          Z: {t.p1.z.toFixed(2)}m, {t.p2.z.toFixed(2)}m, {t.p3.z.toFixed(2)}m
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ── Points Worksheet Table with Surface Switcher ── */}
          <div className="fusion-card overflow-hidden">
            <div className="px-4 py-3 bg-[var(--surface-2)] border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
              {/* Dual Surface Tabs */}
              {mode === 'surface-to-surface' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSurfaceTab('existing')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                      activeSurfaceTab === 'existing'
                        ? 'bg-[var(--accent)] text-black dark:text-white shadow-xs'
                        : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)]'
                    }`}
                  >
                    <span>🌿 ผิวดินเดิม (Existing OGL)</span>
                    <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/20">
                      {existingPoints.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSurfaceTab('design')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                      activeSurfaceTab === 'design'
                        ? 'bg-[var(--accent)] text-black dark:text-white shadow-xs'
                        : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)]'
                    }`}
                  >
                    <span>🏗️ ผิวดินออกแบบ (Design FGL)</span>
                    <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/20">
                      {designPoints.length}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[var(--text-1)]">
                    ตารางจุดพิกัดสำรวจภูมิประเทศ (Terrain Points Worksheet — {existingPoints.length} จุด)
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {currentWorksheetPoints.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCurrentSurface}
                    className="btn-outline min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border-rose-500/30 flex items-center gap-1 cursor-pointer"
                    title="ล้างเฉพาะจุดของผิวดินนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ล้างผิวดินนี้</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={!result || result.totalTriangles === 0}
                  className="btn-outline min-h-[32px] px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ส่งออกรายงาน CSV</span>
                </button>
              </div>
            </div>

            {/* Quick Add Form */}
            <div className="p-3 bg-[var(--surface)] border-b border-[var(--border)] space-y-2">
              {mode === 'surface-to-surface' && (
                <div className="text-[11px] text-[var(--text-3)] flex items-center gap-1">
                  <span>กำลังป้อนจุดพิกัดลงใน:</span>
                  <strong className="text-[var(--accent)]">
                    {activeSurfaceTab === 'existing' ? 'ผิวดินเดิม (Original Ground Level OGL)' : 'ผิวดินออกแบบ (Final Design Surface FGL)'}
                  </strong>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <input
                  type="text"
                  placeholder={activeSurfaceTab === 'existing' ? 'ชื่อจุด (เช่น OGL-1)' : 'ชื่อจุด (เช่น FGL-1)'}
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-1)] font-mono"
                />
                <input
                  type="number"
                  step="0.001"
                  placeholder="Easting X (ม.)"
                  value={newX}
                  onChange={(e) => setNewX(e.target.value)}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-1)] font-mono"
                />
                <input
                  type="number"
                  step="0.001"
                  placeholder="Northing Y (ม.)"
                  value={newY}
                  onChange={(e) => setNewY(e.target.value)}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-1)] font-mono"
                />
                <input
                  type="number"
                  step="0.001"
                  placeholder="Elevation Z (ม.)"
                  value={newZ}
                  onChange={(e) => setNewZ(e.target.value)}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-1)] font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddPoint}
                  className="col-span-2 sm:col-span-1 min-h-[34px] px-3 py-1 rounded-lg bg-[var(--accent)] text-black dark:text-white font-semibold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มจุด{mode === 'surface-to-surface' ? (activeSurfaceTab === 'existing' ? ' OGL' : ' FGL') : ''}</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[320px]">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-[var(--surface-2)] border-b border-[var(--border)] text-[var(--text-2)] font-semibold">
                  <tr>
                    <th className="py-2 px-3 text-center w-12">#</th>
                    <th className="py-2 px-3 text-left">Point ID</th>
                    <th className="py-2 px-3 text-right">Easting X (m)</th>
                    <th className="py-2 px-3 text-right">Northing Y (m)</th>
                    <th className="py-2 px-3 text-right">Elevation Z (m)</th>
                    <th className="py-2 px-3 text-center w-12">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-mono text-[11px]">
                  {currentWorksheetPoints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--text-3)]">
                        <div className="space-y-1.5">
                          <p>ยังไม่มีจุดใน{activeSurfaceTab === 'existing' ? 'ผิวดินเดิม (OGL)' : 'ผิวดินออกแบบ (FGL)'}</p>
                          <button
                            type="button"
                            onClick={() => {
                              if (activeSurfaceTab === 'existing') {
                                setExistingPoints(SAMPLE_EXISTING_SURFACE_POINTS);
                              } else {
                                setDesignPoints(SAMPLE_DESIGN_SURFACE_POINTS);
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)] font-semibold text-xs cursor-pointer shadow-xs"
                          >
                            ⚡ โหลดตัวอย่าง{activeSurfaceTab === 'existing' ? ' OGL' : ' FGL'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentWorksheetPoints.map((pt, idx) => (
                      <tr key={pt.id || idx} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                        <td className="py-1.5 px-3 text-center text-[var(--text-3)]">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-semibold text-[var(--text-1)]">{pt.name || pt.id}</td>
                        <td className="py-1.5 px-3 text-right tabular-nums">{pt.x.toFixed(3)}</td>
                        <td className="py-1.5 px-3 text-right tabular-nums">{pt.y.toFixed(3)}</td>
                        <td className="py-1.5 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">{pt.z.toFixed(3)}</td>
                        <td className="py-1.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePoint(idx, activeSurfaceTab)}
                            className="p-1 rounded text-[var(--text-3)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default EarthworkVolumeCalculator;