import React, { useState } from 'react';
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
  Layers,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { CommonMapLayoutProps } from './types';
import { SURVEY_BOOKMARKS } from '../../../data/survey-presets';
import { BasemapProvider } from '../../../types/map';

export const MonolithRailMapLayout: React.FC<CommonMapLayoutProps> = ({
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
  const [showBasemapFlyout, setShowBasemapFlyout] = useState(false);

  const basemaps: { id: BasemapProvider; label: string }[] = [
    { id: 'satellite', label: 'ดาวเทียม' },
    { id: 'osm', label: 'ถนน' },
    { id: 'topo', label: 'ภูมิประเทศ' },
    { id: 'dark', label: 'มืด' }
  ];

  return (
    <>
      {/* Left 56px Precision Vertical Rail */}
      <aside
        className="absolute top-0 left-0 bottom-0 w-14 sm:w-16 z-[1010] flex flex-col items-center justify-between py-4 border-r pointer-events-auto select-none transition-all"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)'
        }}
      >
        {/* Top Rail Section: Back & Workspaces */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          <button
            onClick={() => { window.location.hash = '#/knowledge'; }}
            aria-label="กลับสู่หน้าหลัก"
            title="กลับสู่หน้าหลัก (MESURV)"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--surface-2)] text-[var(--accent)]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className="w-8 h-px bg-[var(--border)] my-1" />

          {/* Survey Workspace */}
          <button
            onClick={() => onSelectWorkspace('survey')}
            aria-label="โหมดสำรวจ"
            title="โหมดสำรวจและคำนวณพิกัด"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all relative"
            style={
              activeWorkspace === 'survey'
                ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                : { color: 'var(--text-2)' }
            }
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Weather Workspace */}
          <button
            onClick={() => onSelectWorkspace('weather')}
            aria-label="โหมดสภาพอากาศ"
            title="โหมดสภาพอากาศ ฟ้า ลม ฝน"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all relative"
            style={
              activeWorkspace === 'weather'
                ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                : { color: 'var(--text-2)' }
            }
          >
            <CloudRain className="w-4 h-4" />
          </button>

          {/* Hydro Workspace */}
          <button
            onClick={() => onSelectWorkspace('hydro')}
            aria-label="โหมดข้อมูลน้ำ"
            title="โหมดอุทกภัยและเครือข่ายลุ่มน้ำ"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all relative"
            style={
              activeWorkspace === 'hydro'
                ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                : { color: 'var(--text-2)' }
            }
          >
            <Waves className="w-4 h-4" />
          </button>
        </div>

        {/* Middle Rail Section: Measurement & Geodetic Tools */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          <span className="w-8 h-px bg-[var(--border)] mb-1" />

          <button
            onClick={() => onSetMeasureMode(measureMode === 'inspect' ? 'none' : 'inspect')}
            aria-label="เป้าเล็งพิกัด"
            title="เป้าเล็งตรวจสอบพิกัด"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
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
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
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
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
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
              className="w-10 h-10 rounded-xl text-amber-500 hover:bg-[var(--surface-2)] flex items-center justify-center transition-all"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          )}

          {measurePoints.length > 0 && (
            <button
              onClick={onClearMeasurements}
              aria-label="ล้างการวัด"
              title="ล้างข้อมูลการวัด"
              className="w-10 h-10 rounded-xl text-rose-500 hover:bg-[var(--surface-2)] flex items-center justify-center transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom Rail Section: Locate, Basemaps & Upload */}
        <div className="flex flex-col items-center gap-2 w-full px-2 relative">
          <span className="w-8 h-px bg-[var(--border)] mb-1" />

          <button
            onClick={onLocateMe}
            aria-label="GPS ของฉัน"
            title="ระบุตำแหน่งของฉัน"
            className="w-10 h-10 rounded-xl text-[var(--accent)] hover:bg-[var(--surface-2)] flex items-center justify-center transition-all"
          >
            <LocateFixed className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowBasemapFlyout(!showBasemapFlyout)}
              aria-label="แผนที่ฐาน"
              title="เลือกแผนที่ฐาน"
              className="w-10 h-10 rounded-xl text-[var(--text-1)] hover:bg-[var(--surface-2)] flex items-center justify-center transition-all"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Basemap Flyout Menu */}
            {showBasemapFlyout && (
              <div
                className="absolute left-full bottom-0 ml-2 p-1.5 rounded-2xl border shadow-2xl flex flex-col gap-1 w-36 z-[1050] animate-in fade-in slide-in-from-left-2 duration-150"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-strong)',
                  backdropFilter: 'blur(20px)'
                }}
              >
                <div className="text-[10px] font-mono text-[var(--text-3)] uppercase px-2 py-0.5 border-b border-[var(--border)]">
                  แผนที่ฐาน
                </div>
                {basemaps.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onSelectBasemap(b.id);
                      setShowBasemapFlyout(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      currentBasemap === b.id
                        ? 'bg-[var(--accent)] text-white'
                        : 'hover:bg-[var(--surface-2)] text-[var(--text-1)]'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onOpenUploader}
            aria-label="นำเข้าไฟล์"
            title="นำเข้าไฟล์ GeoJSON"
            className="w-10 h-10 rounded-xl text-[var(--text-1)] hover:bg-[var(--surface-2)] flex items-center justify-center transition-all"
          >
            <FolderUp className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Top Telemetry & Search Horizon Bar (Offset by 64px for rail) */}
      <div className="absolute top-4 left-18 sm:left-20 right-4 z-[1010] flex items-center justify-between gap-3 pointer-events-auto">
        {/* Search & Bookmarks ⌘K Box */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border shadow-lg max-w-md w-full"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)]">
            ⌘K
          </span>
          <select
            onChange={(e) => {
              const bm = SURVEY_BOOKMARKS.find((b) => b.id === e.target.value);
              if (bm) onSelectBookmark(bm);
            }}
            defaultValue=""
            aria-label="ค้นหาหมุดหลักฐานอ้างอิง"
            className="w-full text-xs font-semibold bg-transparent focus:outline-none cursor-pointer truncate"
            style={{ color: 'var(--text-1)' }}
          >
            <option value="" disabled style={{ backgroundColor: 'var(--surface)', color: 'var(--text-3)' }}>
              ค้นหาหมุดหลักฐานอ้างอิงหรือสถานที่สำคัญ...
            </option>
            {SURVEY_BOOKMARKS.map((b) => (
              <option key={b.id} value={b.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--text-1)' }}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right Telemetry Pill + Layout Selector */}
        <div className="flex items-center gap-2 shrink-0">
          {telemetry && (
            <div
              className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border shadow-lg font-mono text-[11px] tabular-nums"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-2)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <span className="font-bold text-[var(--accent)]">
                {telemetry.lat.toFixed(5)}°, {telemetry.lng.toFixed(5)}°
              </span>
              <span className="w-px h-3 bg-[var(--border)]" />
              <span>UTM {telemetry.zone}N</span>
              <span className="w-px h-3 bg-[var(--border)]" />
              <span>E: {Math.round(telemetry.utmE)}</span>
              <span>N: {Math.round(telemetry.utmN)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Auxiliary Paneling for Weather/Hydro */}
      {activeWorkspace !== 'survey' && disasterPanel && (
        <div className="absolute top-20 left-20 z-[1010] w-[380px] max-w-[calc(100vw-100px)] max-h-[calc(100dvh-120px)] overflow-y-auto rounded-2xl shadow-2xl border pointer-events-auto">
          {disasterPanel}
        </div>
      )}

      {hydroDrawer}
    </>
  );
};
