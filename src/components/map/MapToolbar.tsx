import React from 'react';
import { BasemapProvider, MapInteractionMode } from '../../types/map';
import { SURVEY_BOOKMARKS } from '../../data/survey-presets';
import { 
  Ruler, 
  Square, 
  MapPin, 
  RotateCcw, 
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
  onLocateMe,
  onSelectBookmark,
  onOpenUploader
}) => {
  const basemaps: { id: BasemapProvider; label: string }[] = [
    { id: 'satellite', label: 'ดาวเทียม (Satellite)' },
    { id: 'osm', label: 'ถนน (OSM)' },
    { id: 'topo', label: 'ภูมิประเทศ (Topo)' },
    { id: 'dark', label: 'มืด (Dark)' }
  ];

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
      
      {/* Left: Tools & Controls */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl pointer-events-auto">
        
        {/* Inspect Coordinate Crosshair Tool (Prevents accidental mobile touch-traps) */}
        <button
          onClick={() => onSetMeasureMode(measureMode === 'inspect' ? 'none' : 'inspect')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center space-x-1.5 ${
            measureMode === 'inspect'
              ? 'bg-emerald-600 text-white font-semibold shadow-sm animate-pulse'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="เป้าเล็งตรวจสอบพิกัด (คลิกบนแผนที่เพื่อดูพิกัด)"
        >
          <Crosshair className="w-4 h-4" />
          <span className="hidden sm:inline">เป้าเล็งพิกัด</span>
        </button>

        {/* Distance Tool */}
        <button
          onClick={() => onSetMeasureMode(measureMode === 'distance' ? 'none' : 'distance')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center space-x-1.5 ${
            measureMode === 'distance'
              ? 'bg-survey-600 text-white font-semibold shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="วัดระยะทางตามเส้นทาง"
        >
          <Ruler className="w-4 h-4" />
          <span className="hidden sm:inline">วัดระยะ</span>
        </button>

        {/* Area Tool */}
        <button
          onClick={() => onSetMeasureMode(measureMode === 'area' ? 'none' : 'area')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center space-x-1.5 ${
            measureMode === 'area'
              ? 'bg-survey-600 text-white font-semibold shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="วัดพื้นที่รูปปิด (ตารางเมตร & ไร่-งาน-วา)"
        >
          <Square className="w-4 h-4" />
          <span className="hidden sm:inline">วัดพื้นที่</span>
        </button>

        {/* Drop Marker Tool */}
        <button
          onClick={() => onSetMeasureMode(measureMode === 'marker' ? 'none' : 'marker')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center space-x-1.5 ${
            measureMode === 'marker'
              ? 'bg-amber-600 text-white font-semibold shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="คลิกวางหมุดบนแผนที่"
        >
          <MapPin className="w-4 h-4" />
          <span className="hidden sm:inline">ปักหมุด</span>
        </button>

        {/* Clear Measurements */}
        {measureMode !== 'none' && (
          <button
            onClick={onClearMeasurements}
            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="ล้างค่าการวัดและออกจากโหมด"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Geolocation Button */}
        <button
          onClick={onLocateMe}
          className="p-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="ตำแหน่งปัจจุบันของฉัน (GPS)"
        >
          <LocateFixed className="w-4 h-4 text-sky-600 dark:text-sky-400" />
        </button>

        {/* Upload GeoJSON/KML */}
        <button
          onClick={onOpenUploader}
          className="px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors flex items-center space-x-1"
          title="นำเข้าไฟล์ GeoJSON หรือ KML"
        >
          <FolderUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden md:inline">นำเข้าไฟล์</span>
        </button>

      </div>

      {/* Right: Basemap Selector & Bookmarks */}
      <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl pointer-events-auto">
        
        {/* Bookmark Quick Jump Dropdown */}
        <div className="hidden sm:flex items-center">
          <select
            onChange={(e) => {
              const bm = SURVEY_BOOKMARKS.find((b) => b.id === e.target.value);
              if (bm) onSelectBookmark(bm);
            }}
            defaultValue=""
            className="px-2.5 py-1.5 rounded-xl border-none bg-transparent text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="" disabled>📍 หมุดพิกัดอ้างอิงที่มี...</option>
            {SURVEY_BOOKMARKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Basemap Selection Pills */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {basemaps.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBasemap(b.id)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                currentBasemap === b.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {b.label.split(' ')[0]}
            </button>
          ))}
        </div>

      </div>

    </div>
  );
};
