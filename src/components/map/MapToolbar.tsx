import React from 'react';
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
  Crosshair 
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

  return (
    <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
      
      {/* Left: Primary Geomatics Toolset (44x44px touch compliant) */}
      <div className="flex flex-wrap items-center gap-1 bg-white/95 dark:bg-[#131b2c]/95 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xl pointer-events-auto">
        
        {/* Inspect Coordinate Tool */}
        <button
          onClick={() => onSetMeasureMode(measureMode === 'inspect' ? 'none' : 'inspect')}
          className={`min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
            measureMode === 'inspect'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="เป้าเล็งตรวจสอบพิกัด (คลิกบนแผนที่เพื่อดูพิกัด WGS84 & UTM)"
        >
          <Crosshair className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">เป้าเล็งพิกัด</span>
        </button>

        {/* Distance Tool */}
        <button
          onClick={() => onSetMeasureMode(measureMode === 'distance' ? 'none' : 'distance')}
          className={`min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
            measureMode === 'distance'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="วัดระยะทางตามเส้นทาง (คลิกเพื่อต่อจุด / คลิกขวาเพื่อย้อนจุด)"
        >
          <Ruler className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">วัดระยะ</span>
        </button>

        {/* Area Tool */}
        <button
          onClick={() => onSetMeasureMode(measureMode === 'area' ? 'none' : 'area')}
          className={`min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
            measureMode === 'area'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="วัดพื้นที่รูปปิด (ตารางเมตร & ไร่-งาน-วา)"
        >
          <Square className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">วัดพื้นที่</span>
        </button>

        {/* Drop Marker Tool */}
        <button
          onClick={() => onSetMeasureMode(measureMode === 'marker' ? 'none' : 'marker')}
          className={`min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
            measureMode === 'marker'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="คลิกวางหมุดรังวัดบนแผนที่"
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">ปักหมุด</span>
        </button>

        {/* Undo Point (Active only when points exist) */}
        {canUndo && onUndoPoint && (
          <button
            onClick={onUndoPoint}
            className="min-h-[44px] min-w-[44px] px-3 py-2.5 rounded-xl text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
            title="ย้อนกลับจุดรังวัดล่าสุด (Undo Point / คลิกขวาบนแผนที่)"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden md:inline">ย้อนจุด</span>
          </button>
        )}

        {/* Clear Measurements */}
        {measureMode !== 'none' && (
          <button
            onClick={onClearMeasurements}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center"
            title="ล้างค่าการวัดและออกจากโหมด"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Geolocation Button */}
        <button
          onClick={onLocateMe}
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
          title="ตำแหน่งปัจจุบันของฉัน (GPS)"
        >
          <LocateFixed className="w-4 h-4 text-sky-600 dark:text-sky-400" />
        </button>

        {/* Upload GeoJSON/KML */}
        <button
          onClick={onOpenUploader}
          className="min-h-[44px] min-w-[44px] px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
          title="นำเข้าไฟล์ GeoJSON หรือ KML"
        >
          <FolderUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden lg:inline">นำเข้าไฟล์</span>
        </button>

      </div>

      {/* Right: Basemap Selector & Bookmarks (44x44px touch compliant) */}
      <div className="flex items-center gap-1.5 bg-white/95 dark:bg-[#131b2c]/95 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xl pointer-events-auto">
        
        {/* Bookmark Quick Jump Dropdown */}
        <div className="hidden sm:flex items-center">
          <select
            onChange={(e) => {
              const bm = SURVEY_BOOKMARKS.find((b) => b.id === e.target.value);
              if (bm) onSelectBookmark(bm);
            }}
            defaultValue=""
            className="min-h-[44px] px-3 py-2 rounded-xl border-none bg-transparent text-xs text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="" disabled className="dark:bg-[#131b2c]">📍 หมุดพิกัดอ้างอิง...</option>
            {SURVEY_BOOKMARKS.map((b) => (
              <option key={b.id} value={b.id} className="dark:bg-[#131b2c]">
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Basemap Selection Pills */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 sm:p-1 rounded-xl gap-0.5">
          {basemaps.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBasemap(b.id)}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
                currentBasemap === b.id
                  ? 'bg-white dark:bg-[#1a2436] text-sky-600 dark:text-sky-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

      </div>

    </div>
  );
};
