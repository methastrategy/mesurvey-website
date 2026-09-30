import React from 'react';
import {
  Compass,
  CloudRain,
  Waves,
  Crosshair,
  Ruler,
  Square,
  Undo2,
  RotateCcw,
  LocateFixed,
  FolderUp,
  ArrowLeft
} from 'lucide-react';
import { CommonMapLayoutProps } from './types';
import { SURVEY_BOOKMARKS } from '../../../data/survey-presets';
import { BasemapProvider } from '../../../types/map';

export const FloatingPodsMapLayout: React.FC<CommonMapLayoutProps> = ({
  currentBasemap,
  onSelectBasemap,
  activeWorkspace,
  onSelectWorkspace,
  measureMode,
  onSetMeasureMode,
  onClearMeasurements,
  onUndoPoint,
  canUndo = false,
  onLocateMe,
  onSelectBookmark,
  onOpenUploader,
  telemetry,
  measurePoints = [],
  measurementResultText,
  disasterPanel,
  hydroDrawer,
  activeLayout,
  onChangeLayout
}) => {
  const basemaps: { id: BasemapProvider; label: string }[] = [
    { id: 'satellite', label: 'ดาวเทียม' },
    { id: 'osm', label: 'ถนน' },
    { id: 'topo', label: 'ภูมิประเทศ' },
    { id: 'dark', label: 'มืด' }
  ];

  return (
    <>
      {/* Pod 1: Top-Left Navigation & Bookmarks Pod */}
      <div className="absolute top-4 left-4 z-[1010] pointer-events-auto">
        <div
          className="flex items-center gap-2 p-2 rounded-2xl border shadow-xl"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <button
            onClick={() => { window.location.hash = '#/knowledge'; }}
            aria-label="กลับหน้าหลัก"
            title="กลับหน้าหลัก (MESURV)"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-all flex items-center justify-center hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-1)' }}
          >
            <ArrowLeft className="w-4 h-4 text-[var(--accent)]" />
          </button>

          <select
            onChange={(e) => {
              const bm = SURVEY_BOOKMARKS.find((b) => b.id === e.target.value);
              if (bm) onSelectBookmark(bm);
            }}
            defaultValue=""
            aria-label="ค้นหาหมุดหลักฐานอ้างอิง"
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer max-w-[170px] truncate"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)'
            }}
          >
            <option value="" disabled style={{ backgroundColor: 'var(--surface)', color: 'var(--text-3)' }}>
              หมุดหลักฐานอ้างอิง...
            </option>
            {SURVEY_BOOKMARKS.map((b) => (
              <option key={b.id} value={b.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--text-1)' }}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pod 2: Top-Right Telemetry Pod */}
      <div className="absolute top-4 right-4 z-[1010] flex items-center gap-2 pointer-events-auto">
        {telemetry && (
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-2xl border shadow-xl font-mono text-[11px] tabular-nums"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-2)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold text-[var(--text-1)]">
                {telemetry.lat.toFixed(4)}°, {telemetry.lng.toFixed(4)}°
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)] font-bold">
              UTM {telemetry.zone}N
            </span>
          </div>
        )}
      </div>

      {/* Pod 3: Bottom-Left Measurement & Geodetic Actions Pod */}
      <div className="absolute bottom-6 left-4 z-[1010] pointer-events-auto flex flex-col gap-2 max-w-[calc(100vw-32px)]">
        {measurementResultText && (
          <div
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold border shadow-lg truncate max-w-md animate-in fade-in slide-in-from-bottom-2"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)'
            }}
          >
            {measurementResultText}
          </div>
        )}

        <div
          className="flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-xl"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <button
            onClick={() => onSetMeasureMode(measureMode === 'inspect' ? 'none' : 'inspect')}
            aria-label="ตรวจพิกัด"
            title="เป้าเล็งตรวจสอบพิกัด"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-all flex items-center justify-center"
            style={
              measureMode === 'inspect'
                ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                : { color: 'var(--text-2)' }
            }
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSetMeasureMode(measureMode === 'distance' ? 'none' : 'distance')}
            aria-label="วัดระยะ"
            title="วัดระยะทางระหว่างจุด"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-all flex items-center justify-center"
            style={
              measureMode === 'distance'
                ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                : { color: 'var(--text-2)' }
            }
          >
            <Ruler className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSetMeasureMode(measureMode === 'area' ? 'none' : 'area')}
            aria-label="วัดเนื้อที่"
            title="วัดเนื้อที่แปลงที่ดิน"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-all flex items-center justify-center"
            style={
              measureMode === 'area'
                ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                : { color: 'var(--text-2)' }
            }
          >
            <Square className="w-4 h-4" />
          </button>

          {canUndo && (
            <button
              onClick={onUndoPoint}
              aria-label="ย้อนจุด"
              title="ย้อนจุดวัดล่าสุด"
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-amber-500 hover:bg-[var(--surface-2)] transition-all flex items-center justify-center"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          )}

          {measurePoints.length > 0 && (
            <button
              onClick={onClearMeasurements}
              aria-label="ล้างการวัด"
              title="ล้างข้อมูลการวัด"
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-rose-500 hover:bg-[var(--surface-2)] transition-all flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <span className="w-px h-6 bg-[var(--border)] shrink-0" />

          <button
            onClick={onOpenUploader}
            aria-label="นำเข้าไฟล์"
            title="นำเข้าไฟล์ GeoJSON"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-all flex items-center justify-center"
            style={{ color: 'var(--text-1)' }}
          >
            <FolderUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pod 4: Bottom-Right Workspaces & Basemap Pod */}
      <div className="absolute bottom-6 right-4 z-[1010] pointer-events-auto flex flex-col gap-2 items-end">
        {/* Workspaces Pill */}
        <div
          className="flex items-center gap-1 p-1 rounded-2xl border shadow-xl"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <button
            onClick={() => onSelectWorkspace('survey')}
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            style={
              activeWorkspace === 'survey'
                ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                : { color: 'var(--text-2)' }
            }
          >
            <Compass className="w-3.5 h-3.5" />
            <span>แผนที่</span>
          </button>

          <button
            onClick={() => onSelectWorkspace('weather')}
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            style={
              activeWorkspace === 'weather'
                ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                : { color: 'var(--text-2)' }
            }
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>ฟ้าฝน</span>
          </button>

          <button
            onClick={() => onSelectWorkspace('hydro')}
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            style={
              activeWorkspace === 'hydro'
                ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                : { color: 'var(--text-2)' }
            }
          >
            <Waves className="w-3.5 h-3.5" />
            <span>น้ำ</span>
          </button>

          <button
            onClick={onLocateMe}
            aria-label="GPS ฉัน"
            title="ระบุตำแหน่งของฉัน"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-[var(--accent)] hover:bg-[var(--surface-2)] transition-all flex items-center justify-center"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </div>

        {/* Basemap Strip */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl border shadow-lg text-[11px] font-semibold"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
        >
          {basemaps.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBasemap(b.id)}
              className="min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-lg transition-all"
              style={
                currentBasemap === b.id
                  ? { backgroundColor: 'var(--surface-2)', color: 'var(--accent)', fontWeight: 700 }
                  : { color: 'var(--text-3)' }
              }
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Auxiliary Paneling for Weather/Hydro */}
      {activeWorkspace !== 'survey' && disasterPanel && (
        <div className="absolute top-20 left-4 z-[1010] w-[380px] max-w-[calc(100vw-32px)] max-h-[calc(100dvh-180px)] overflow-y-auto rounded-2xl shadow-2xl border pointer-events-auto">
          {disasterPanel}
        </div>
      )}

      {hydroDrawer}
    </>
  );
};
