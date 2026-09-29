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
  ChevronUp
} from 'lucide-react';

interface MapToolbarProps {
  currentBasemap: BasemapProvider;
  onSelectBasemap: (provider: BasemapProvider) => void;
  measureMode: MapInteractionMode;
  onSetMeasureMode: (mode: MapInteractionMode) => void;
  onClearMeasurements: () => void;
  onUndoPoint?: () => void;
  canUndo?: boolean;
  onLocateMe: () => void;
  onSelectBookmark: (bm: typeof SURVEY_BOOKMARKS[0]) => void;
  onOpenUploader: () => void;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  currentBasemap,
  onSelectBasemap,
  measureMode,
  onSetMeasureMode,
  onClearMeasurements,
  onUndoPoint,
  canUndo = false,
  onLocateMe,
  onSelectBookmark,
  onOpenUploader
}) => {
  const basemaps: { id: BasemapProvider; label: string }[] = [
    { id: 'satellite', label: 'ดาวเทียม' },
    { id: 'osm', label: 'ถนน' },
    { id: 'topo', label: 'ภูมิประเทศ' },
    { id: 'dark', label: 'มืด' }
  ];

  const [isMobileExpanded, setIsMobileExpanded] = useState<boolean>(true);

  return (
    <aside
      aria-label="แผงควบคุมแผนที่ภาคสนาม MESURV"
      className="absolute top-3 sm:top-4 left-3 right-3 sm:right-auto sm:left-4 sm:w-[380px] max-w-[390px] pointer-events-auto select-none"
    >
      <div
        className="p-3 space-y-3"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--card-radius)',
          boxShadow: 'var(--shadow)'
        }}
      >
        
        {/* Top Search & Navigation Row */}
        <div className="flex items-center gap-2">
          {/* Exit Map Button */}
          <button
            onClick={() => {
              window.location.hash = '#/knowledge';
            }}
            aria-label="ออกจากแผนที่ กลับสู่หน้าหลัก"
            title="ออกจากแผนที่ กลับสู่หน้าหลัก (MESURV)"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg transition-colors flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)'
            }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </button>

          {/* Bookmark Search / Preset Selector Dropdown */}
          <select
            onChange={(e) => {
              const bm = SURVEY_BOOKMARKS.find((b) => b.id === e.target.value);
              if (bm) onSelectBookmark(bm);
            }}
            defaultValue=""
            aria-label="ค้นหาหรือเลือกหมุดพิกัดอ้างอิง"
            className="min-h-[44px] min-w-[44px] flex-1 px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer truncate"
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

          {/* GPS Current Location Button */}
          <button
            onClick={onLocateMe}
            aria-label="ตำแหน่ง GPS ของฉัน"
            title="ระบุตำแหน่งปัจจุบันของฉัน (GNSS/GPS)"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg transition-colors flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)'
            }}
          >
            <LocateFixed className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </button>

          {/* Mobile Drawer Expand/Collapse Toggle Button */}
          <button
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            aria-label={isMobileExpanded ? 'ย่อแผงเครื่องมือ' : 'ขยายแผงเครื่องมือ'}
            title={isMobileExpanded ? 'ย่อแผงเครื่องมือ' : 'ขยายแผงเครื่องมือ'}
            className="sm:hidden min-h-[44px] min-w-[44px] p-2.5 rounded-lg transition-colors flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)'
            }}
          >
            {isMobileExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            )}
          </button>
        </div>

        {/* Collapsible Lower Section on Mobile (Always visible on sm: desktop) */}
        <div className={`${isMobileExpanded ? 'block' : 'hidden'} sm:block space-y-3`}>
          {/* Primary Geomatics Toolset Row */}
          <div
            className="grid grid-cols-5 gap-1 pt-2"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {/* Inspect Coordinate Tool */}
            <button
              onClick={() => onSetMeasureMode(measureMode === 'inspect' ? 'none' : 'inspect')}
              aria-label="เป้าเล็งพิกัด"
              className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1"
              style={
                measureMode === 'inspect'
                  ? {
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-text)',
                      border: '1px solid var(--accent)'
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: 'var(--text-2)',
                      border: '1px solid transparent'
                    }
              }
              title="เป้าเล็งตรวจสอบพิกัด (WGS84 & UTM)"
            >
              <Crosshair className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-mono leading-none">พิกัด</span>
            </button>

            {/* Distance Tool */}
            <button
              onClick={() => onSetMeasureMode(measureMode === 'distance' ? 'none' : 'distance')}
              aria-label="วัดระยะ"
              className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1"
              style={
                measureMode === 'distance'
                  ? {
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-text)',
                      border: '1px solid var(--accent)'
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: 'var(--text-2)',
                      border: '1px solid transparent'
                    }
              }
              title="วัดระยะทางตามเส้นทางรังวัด"
            >
              <Ruler className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-mono leading-none">ระยะ</span>
            </button>

            {/* Area Tool */}
            <button
              onClick={() => onSetMeasureMode(measureMode === 'area' ? 'none' : 'area')}
              aria-label="วัดพื้นที่"
              className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1"
              style={
                measureMode === 'area'
                  ? {
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-text)',
                      border: '1px solid var(--accent)'
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: 'var(--text-2)',
                      border: '1px solid transparent'
                    }
              }
              title="วัดพื้นที่รูปปิด (ไร่-งาน-วา & m²)"
            >
              <Square className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-mono leading-none">พื้นที่</span>
            </button>

            {/* Drop Marker Tool */}
            <button
              onClick={() => onSetMeasureMode(measureMode === 'marker' ? 'none' : 'marker')}
              aria-label="ปักหมุด"
              className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1"
              style={
                measureMode === 'marker'
                  ? {
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-text)',
                      border: '1px solid var(--accent)'
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: 'var(--text-2)',
                      border: '1px solid transparent'
                    }
              }
              title="คลิกวางหมุดรังวัดบนแผนที่"
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-mono leading-none">ปักหมุด</span>
            </button>

            {/* Upload GeoJSON/KML */}
            <button
              onClick={onOpenUploader}
              aria-label="นำเข้าไฟล์ GeoJSON"
              className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-2)',
                border: '1px solid transparent'
              }}
              title="นำเข้าไฟล์ GeoJSON หรือ KML"
            >
              <FolderUp className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-mono leading-none">นำเข้า</span>
            </button>
          </div>

          {/* Undo & Clear Measurement Tools Action Bar (When in active measurement mode) */}
          {(measureMode !== 'none' || canUndo) && (
            <div
              className="flex items-center gap-2 pt-2"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              {canUndo && onUndoPoint && (
                <button
                  onClick={onUndoPoint}
                  aria-label="ย้อนจุดรังวัด"
                  className="min-h-[44px] min-w-[44px] flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
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
                  className="min-h-[44px] min-w-[44px] flex-1 px-3 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  title="ล้างค่าการวัดและออกจากโหมด"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>ล้างการวัด</span>
                </button>
              )}
            </div>
          )}

          {/* Basemap Switcher Layer Strip */}
          <div
            className="grid grid-cols-4 gap-1 p-1 rounded-lg"
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
                className="min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center justify-center"
                style={
                  currentBasemap === b.id
                    ? {
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-text)',
                        fontWeight: 700
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
        </div>

      </div>
    </aside>
  );
};
