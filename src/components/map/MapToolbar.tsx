import React, { useState } from 'react';
import { BasemapProvider, MapInteractionMode } from '../../types/map';
import { SURVEY_BOOKMARKS } from '../../data/survey-presets';
import {
  Ruler,
  Square,
  MapPin,
  RotateCcw,
  Undo2,
  LocateFixed,
  FolderUp,
  Crosshair,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Compass,
  CloudRain,
  Waves,
  EyeOff
} from 'lucide-react';

export type MapWorkspaceTab = 'survey' | 'weather' | 'hydro';

interface MapToolbarProps {
  activeWorkspace: MapWorkspaceTab;
  onSelectWorkspace: (tab: MapWorkspaceTab) => void;
  activeOverlayCount: number;
  onClearAllOverlays: () => void;
  currentBasemap: BasemapProvider;
  onSelectBasemap: (provider: BasemapProvider) => void;
  measureMode: MapInteractionMode;
  onSetMeasureMode: (mode: MapInteractionMode) => void;
  onClearMeasurements: () => void;
  onUndoPoint?: () => void;
  canUndo?: boolean;
  onLocateMe: () => void;
  onSelectBookmark: (bm: (typeof SURVEY_BOOKMARKS)[0]) => void;
  onOpenUploader: () => void;
  telemetry?: {
    lat: number;
    lng: number;
    utmE: number;
    utmN: number;
    zone: number;
    zoom: number;
  };
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  activeWorkspace,
  onSelectWorkspace,
  activeOverlayCount,
  onClearAllOverlays,
  currentBasemap,
  onSelectBasemap,
  measureMode,
  onSetMeasureMode,
  onClearMeasurements,
  onUndoPoint,
  canUndo = false,
  onLocateMe,
  onSelectBookmark,
  onOpenUploader,
  telemetry
}) => {
  const basemaps: { id: BasemapProvider; label: string }[] = [
    { id: 'satellite', label: 'ดาวเทียม' },
    { id: 'osm', label: 'ถนน' },
    { id: 'topo', label: 'ภูมิประเทศ' },
    { id: 'dark', label: 'มืด' }
  ];

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  return (
    <aside
      aria-label="แผงควบคุมแผนที่ภาคสนาม MESURV"
      className="w-full pointer-events-auto select-none"
    >
      <div
        className="p-3 sm:p-3.5 space-y-3 rounded-2xl transition-all"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.28), 0 4px 12px -2px rgba(0, 0, 0, 0.14)'
        }}
      >
        {/* Row 1: Top Navigation, Bookmark Search, GPS & Collapse Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              window.location.hash = '#/knowledge';
            }}
            aria-label="ออกจากแผนที่ กลับสู่หน้าหลัก"
            title="ออกจากแผนที่ กลับสู่หน้าหลัก (MESURV)"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 hover:opacity-90"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)'
            }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </button>

          <select
            onChange={(e) => {
              const bm = SURVEY_BOOKMARKS.find((b) => b.id === e.target.value);
              if (bm) onSelectBookmark(bm);
            }}
            defaultValue=""
            aria-label="ค้นหาหรือเลือกหมุดพิกัดอ้างอิง"
            className="min-h-[44px] min-w-[44px] flex-1 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer truncate transition-all"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)'
            }}
          >
            <option value="" disabled style={{ backgroundColor: 'var(--surface)', color: 'var(--text-3)' }}>
              ค้นหาหมุดหลักฐานอ้างอิง...
            </option>
            {SURVEY_BOOKMARKS.map((b) => (
              <option key={b.id} value={b.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--text-1)' }}>
                {b.name}
              </option>
            ))}
          </select>

          <button
            onClick={onLocateMe}
            aria-label="ตำแหน่ง GPS ของฉัน"
            title="ระบุตำแหน่งปัจจุบันของฉัน (GNSS/GPS)"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 hover:opacity-90"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)'
            }}
          >
            <LocateFixed className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </button>

          <button
            onClick={() => {
              window.location.hash = '#/map-redesign';
            }}
            aria-label="สำรวจ 10+ รูปแบบ Map Redesign"
            title="สำรวจ 10+ รูปแบบสไตล์ดีไซน์ใหม่หน้า Map (พร้อมปุ่มสุ่มสไตล์)"
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 text-xs font-bold hover:opacity-90 shadow-sm"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#ffffff'
            }}
          >
            <span>🎨 Redesign (10 แบบ)</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'ขยายแผงเครื่องมือ' : 'ย่อแผงเครื่องมือ'}
            title={isCollapsed ? 'ขยายแผงเครื่องมือ' : 'ย่อแผงเครื่องมือ'}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 hover:opacity-90"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)'
            }}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Row 2: 3-Mode Workspace Switcher (แผนที่ปกติ | สภาพอากาศ | ข้อมูลน้ำ) */}
        <div
          className="grid grid-cols-3 gap-1 p-1 rounded-xl"
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)'
          }}
        >
          <button
            onClick={() => onSelectWorkspace('survey')}
            aria-label="โหมดแผนที่ปกติและงานสำรวจ"
            className="min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            style={
              activeWorkspace === 'survey'
                ? {
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-text)',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)'
                  }
                : {
                    backgroundColor: 'transparent',
                    color: 'var(--text-2)'
                  }
            }
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">แผนที่ปกติ</span>
          </button>

          <button
            onClick={() => onSelectWorkspace('weather')}
            aria-label="โหมดสภาพอากาศ ฟ้า ลม ฝน"
            className="min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            style={
              activeWorkspace === 'weather'
                ? {
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-text)',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)'
                  }
                : {
                    backgroundColor: 'transparent',
                    color: 'var(--text-2)'
                  }
            }
          >
            <CloudRain className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">ฟ้า·ลม·ฝน</span>
          </button>

          <button
            onClick={() => onSelectWorkspace('hydro')}
            aria-label="โหมดข้อมูลน้ำและอุทกภัย"
            className="min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            style={
              activeWorkspace === 'hydro'
                ? {
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-text)',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)'
                  }
                : {
                    backgroundColor: 'transparent',
                    color: 'var(--text-2)'
                  }
            }
          >
            <Waves className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">ข้อมูลน้ำ</span>
          </button>
        </div>

        {/* Active Overlays Clear Pill (Only visible if any overlay is active while in normal map mode) */}
        {activeOverlayCount > 0 && activeWorkspace === 'survey' && (
          <div
            className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)'
            }}
          >
            <span className="font-medium truncate" style={{ color: 'var(--text-2)' }}>
              เปิดชั้นข้อมูลพิเศษอยู่ {activeOverlayCount} รายการ
            </span>
            <button
              onClick={onClearAllOverlays}
              className="min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
              style={{
                backgroundColor: 'var(--surface)',
                color: 'var(--accent)',
                border: '1px solid var(--border)'
              }}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>ซ่อนทั้งหมด</span>
            </button>
          </div>
        )}

        {/* Collapsible Content Area */}
        {!isCollapsed && (
          <div className="space-y-3">
            {/* Survey Tools Section (Only shown in 'survey' mode so the UI stays clean and focused) */}
            {activeWorkspace === 'survey' && (
              <div
                className="grid grid-cols-5 gap-1.5 pt-2"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <button
                  onClick={() => onSetMeasureMode(measureMode === 'inspect' ? 'none' : 'inspect')}
                  aria-label="เป้าเล็งพิกัด"
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1"
                  style={
                    measureMode === 'inspect'
                      ? {
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-text)',
                          border: '1px solid var(--accent)'
                        }
                      : {
                          backgroundColor: 'var(--surface-2)',
                          color: 'var(--text-2)',
                          border: '1px solid transparent'
                        }
                  }
                  title="เป้าเล็งตรวจสอบพิกัด (WGS84 & UTM)"
                >
                  <Crosshair className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-mono leading-none">พิกัด</span>
                </button>

                <button
                  onClick={() => onSetMeasureMode(measureMode === 'distance' ? 'none' : 'distance')}
                  aria-label="วัดระยะ"
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1"
                  style={
                    measureMode === 'distance'
                      ? {
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-text)',
                          border: '1px solid var(--accent)'
                        }
                      : {
                          backgroundColor: 'var(--surface-2)',
                          color: 'var(--text-2)',
                          border: '1px solid transparent'
                        }
                  }
                  title="วัดระยะทางตามเส้นทางรังวัด"
                >
                  <Ruler className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-mono leading-none">ระยะ</span>
                </button>

                <button
                  onClick={() => onSetMeasureMode(measureMode === 'area' ? 'none' : 'area')}
                  aria-label="วัดพื้นที่"
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1"
                  style={
                    measureMode === 'area'
                      ? {
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-text)',
                          border: '1px solid var(--accent)'
                        }
                      : {
                          backgroundColor: 'var(--surface-2)',
                          color: 'var(--text-2)',
                          border: '1px solid transparent'
                        }
                  }
                  title="วัดพื้นที่รูปปิด (ไร่-งาน-วา & m²)"
                >
                  <Square className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-mono leading-none">พื้นที่</span>
                </button>

                <button
                  onClick={() => onSetMeasureMode(measureMode === 'marker' ? 'none' : 'marker')}
                  aria-label="ปักหมุด"
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1"
                  style={
                    measureMode === 'marker'
                      ? {
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-text)',
                          border: '1px solid var(--accent)'
                        }
                      : {
                          backgroundColor: 'var(--surface-2)',
                          color: 'var(--text-2)',
                          border: '1px solid transparent'
                        }
                  }
                  title="คลิกวางหมุดรังวัดบนแผนที่"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-mono leading-none">ปักหมุด</span>
                </button>

                <button
                  onClick={onOpenUploader}
                  aria-label="นำเข้าไฟล์ GeoJSON"
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--text-2)',
                    border: '1px solid transparent'
                  }}
                  title="นำเข้าไฟล์ GeoJSON หรือ KML"
                >
                  <FolderUp className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-mono leading-none">นำเข้า</span>
                </button>
              </div>
            )}

            {/* Undo & Clear Measurement Tools Action Bar */}
            {(measureMode !== 'none' || canUndo) && (
              <div
                className="flex items-center gap-2 pt-2"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                {canUndo && onUndoPoint && (
                  <button
                    onClick={onUndoPoint}
                    aria-label="ย้อนจุดรังวัด"
                    className="min-h-[44px] min-w-[44px] flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-1)'
                    }}
                    title="ย้อนกลับจุดรังวัดล่าสุด"
                  >
                    <Undo2 className="w-4 h-4" />
                    <span>ย้อนจุด</span>
                  </button>
                )}

                {measureMode !== 'none' && (
                  <button
                    onClick={onClearMeasurements}
                    aria-label="ล้างการวัด"
                    className="min-h-[44px] min-w-[44px] flex-1 px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    title="ล้างค่าการวัดและออกจากโหมด"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>ล้างการวัด</span>
                  </button>
                )}
              </div>
            )}

            {/* Basemap Switcher Strip */}
            <div
              className="grid grid-cols-4 gap-1 p-1 rounded-xl"
              style={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)'
              }}
            >
              {basemaps.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onSelectBasemap(b.id)}
                  aria-label={`เลือกแผนที่ฐาน ${b.label}`}
                  className="min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center"
                  style={
                    currentBasemap === b.id
                      ? {
                          backgroundColor: 'var(--surface)',
                          color: 'var(--accent)',
                          border: '1px solid var(--border)',
                          fontWeight: 700,
                          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)'
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: 'var(--text-2)'
                        }
                  }
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* Integrated Compact Coordinate Bar (Replaces the permanently stuck bottom map bar) */}
            {telemetry && activeWorkspace === 'survey' && (
              <div
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl font-mono tabular-nums text-[11px]"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-2)'
                }}
              >
                <div className="truncate">
                  <span className="font-bold" style={{ color: 'var(--accent)' }}>
                    WGS84
                  </span>{' '}
                  {telemetry.lat.toFixed(5)}°, {telemetry.lng.toFixed(5)}°
                </div>
                <div
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                  style={{
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-1)',
                    border: '1px solid var(--border)'
                  }}
                >
                  UTM {telemetry.zone}N • Z{telemetry.zoom}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
