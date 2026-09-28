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
      aria-label="แผงควบคุมแผนที่ Google Maps สไตล์"
      className="absolute top-3 sm:top-4 left-3 sm:left-4 z-[1000] w-[calc(100vw-24px)] sm:w-[380px] max-w-[390px] pointer-events-auto select-none"
    >
      <div className="bg-[#0c0d12]/92 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.7)] p-3 space-y-3">
        
        {/* Top Search & Navigation Row (Google Maps style) */}
        <div className="flex items-center gap-2">
          {/* Exit Map Button */}
          <button
            onClick={() => {
              window.location.hash = '#/knowledge';
            }}
            aria-label="ออกจากแผนที่ กลับสู่หน้าหลัก"
            title="ออกจากแผนที่ กลับสู่หน้าหลัก (MESURV)"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white transition-colors flex items-center justify-center shrink-0 border border-white/[0.08] micro-press"
          >
            <ArrowLeft className="w-5 h-5 text-indigo-400" />
          </button>

          {/* Bookmark Search / Preset Selector Dropdown */}
          <select
            onChange={(e) => {
              const bm = SURVEY_BOOKMARKS.find((b) => b.id === e.target.value);
              if (bm) onSelectBookmark(bm);
            }}
            defaultValue=""
            aria-label="ค้นหาหรือเลือกหมุดพิกัดอ้างอิง"
            className="min-h-[44px] min-w-[44px] flex-1 px-3 py-2 rounded-xl border border-white/[0.10] bg-[#14151b] text-xs text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer truncate"
          >
            <option value="" disabled className="bg-[#14151b] text-slate-400">
              ค้นหาหมุดหลักฐานอ้างอิง...
            </option>
            {SURVEY_BOOKMARKS.map((b) => (
              <option key={b.id} value={b.id} className="bg-[#14151b] text-slate-200">
                {b.name}
              </option>
            ))}
          </select>

          {/* GPS Current Location Button */}
          <button
            onClick={onLocateMe}
            aria-label="ตำแหน่ง GPS ของฉัน"
            title="ระบุตำแหน่งปัจจุบันของฉัน (GNSS/GPS)"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-white/[0.06] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/[0.08] transition-colors flex items-center justify-center shrink-0 micro-press"
          >
            <LocateFixed className="w-4 h-4" />
          </button>

          {/* Mobile Drawer Expand/Collapse Toggle Button */}
          <button
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            aria-label={isMobileExpanded ? 'ย่อแผงเครื่องมือ' : 'ขยายแผงเครื่องมือ'}
            title={isMobileExpanded ? 'ย่อแผงเครื่องมือ' : 'ขยายแผงเครื่องมือ'}
            className="sm:hidden min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/[0.08] transition-colors flex items-center justify-center shrink-0 micro-press"
          >
            {isMobileExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-300" />
            ) : (
              <ChevronDown className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>

        {/* Collapsible Lower Section on Mobile (Always visible on sm: desktop) */}
        <div className={`${isMobileExpanded ? 'block' : 'hidden'} sm:block space-y-3`}>
          {/* Primary Geomatics Toolset Row */}
          <div className="grid grid-cols-5 gap-1 pt-1 border-t border-white/[0.08]">
          {/* Inspect Coordinate Tool */}
          <button
            onClick={() => onSetMeasureMode(measureMode === 'inspect' ? 'none' : 'inspect')}
            aria-label="เป้าเล็งพิกัด"
            className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
              measureMode === 'inspect'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
            }`}
            title="เป้าเล็งตรวจสอบพิกัด (WGS84 & UTM)"
          >
            <Crosshair className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-mono leading-none">พิกัด</span>
          </button>

          {/* Distance Tool */}
          <button
            onClick={() => onSetMeasureMode(measureMode === 'distance' ? 'none' : 'distance')}
            aria-label="วัดระยะ"
            className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
              measureMode === 'distance'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
            }`}
            title="วัดระยะทางตามเส้นทางรังวัด"
          >
            <Ruler className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-mono leading-none">ระยะ</span>
          </button>

          {/* Area Tool */}
          <button
            onClick={() => onSetMeasureMode(measureMode === 'area' ? 'none' : 'area')}
            aria-label="วัดพื้นที่"
            className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
              measureMode === 'area'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
            }`}
            title="วัดพื้นที่รูปปิด (ไร่-งาน-วา & m²)"
          >
            <Square className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-mono leading-none">พื้นที่</span>
          </button>

          {/* Drop Marker Tool */}
          <button
            onClick={() => onSetMeasureMode(measureMode === 'marker' ? 'none' : 'marker')}
            aria-label="ปักหมุด"
            className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
              measureMode === 'marker'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
            }`}
            title="คลิกวางหมุดรังวัดบนแผนที่"
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-mono leading-none">ปักหมุด</span>
          </button>

          {/* Upload GeoJSON/KML */}
          <button
            onClick={onOpenUploader}
            aria-label="นำเข้าไฟล์ GeoJSON"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1"
            title="นำเข้าไฟล์ GeoJSON หรือ KML"
          >
            <FolderUp className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-mono leading-none">นำเข้า</span>
          </button>
        </div>

        {/* Undo & Clear Measurement Tools Action Bar (When in active measurement mode) */}
        {(measureMode !== 'none' || canUndo) && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.08]">
            {canUndo && onUndoPoint && (
              <button
                onClick={onUndoPoint}
                aria-label="ย้อนจุดรังวัด"
                className="min-h-[44px] min-w-[44px] flex-1 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
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
                className="min-h-[44px] min-w-[44px] flex-1 px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                title="ล้างค่าการวัดและออกจากโหมด"
              >
                <RotateCcw className="w-4 h-4" />
                <span>ล้างการวัด</span>
              </button>
            )}
          </div>
        )}

        {/* Basemap Switcher Layer Strip */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/50 border border-white/[0.08]">
          {basemaps.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBasemap(b.id)}
              aria-label={`เลือกแผนที่ฐาน ${b.label}`}
              className={`min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
                currentBasemap === b.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
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
