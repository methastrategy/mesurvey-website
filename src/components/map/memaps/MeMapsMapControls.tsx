import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Crosshair,
  Layers,
  Bookmark,
  MousePointerClick,
  Ruler,
  X,
  Check
} from 'lucide-react';
import { BasemapProvider, CoordinateDatum } from '../../../types/map';

interface MeMapsMapControlsProps {
  currentBasemap: BasemapProvider;
  onBasemapChange: (basemap: BasemapProvider) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetNorth: () => void;
  onLocateMe: () => void;
  isLocating?: boolean;
  onToggleSavedPlaces?: () => void;
  isSavedPlacesOpen?: boolean;
  isInspectMode?: boolean;
  onToggleInspectMode?: () => void;
  isMeasureMode?: boolean;
  onToggleMeasure?: () => void;
  coordinateDatum?: CoordinateDatum;
  onSelectCoordinateDatum?: (datum: CoordinateDatum) => void;
  isMenuOpen?: boolean;
  isGlobe3D?: boolean;
  onToggleGlobe3D?: () => void;
  className?: string;
}

export const MeMapsMapControls: React.FC<MeMapsMapControlsProps> = ({
  currentBasemap,
  onBasemapChange,
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onLocateMe,
  isLocating = false,
  onToggleSavedPlaces,
  isSavedPlacesOpen = false,
  isInspectMode = false,
  onToggleInspectMode,
  isMeasureMode = false,
  onToggleMeasure,
  coordinateDatum = 'WGS84',
  onSelectCoordinateDatum,
  isMenuOpen = false,
  className = ''
}) => {
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Click outside to dismiss layers panel
  useEffect(() => {
    if (!isLayersPanelOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsLayersPanelOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isLayersPanelOpen]);

  const BASEMAP_OPTIONS: { id: BasemapProvider; label: string; desc: string }[] = [
    { id: 'satellite', label: 'ดาวเทียม', desc: 'Esri World Imagery HD' },
    { id: 'osm', label: 'ถนน', desc: 'OpenStreetMap Standard' },
    { id: 'topo', label: 'ภูมิประเทศ', desc: 'OpenTopoMap / เส้นชั้นความสูง' },
    { id: 'dark', label: 'โหมดมืด', desc: 'CARTO Dark All' }
  ];

  const CRS_OPTIONS: { id: CoordinateDatum; label: string; sub: string }[] = [
    { id: 'WGS84', label: 'WGS 84', sub: 'EPSG:4326 / UTM (มาตรฐานสากล & GPS)' },
    { id: 'INDIAN1975_47', label: 'Indian 1975 (47N)', sub: 'EPSG:24047 กลาง / เหนือ / ใต้ / ตะวันตก' },
    { id: 'INDIAN1975_48', label: 'Indian 1975 (48N)', sub: 'EPSG:24048 ภาคอีสาน / ภาคตะวันออก' }
  ];

  return (
    <div className={`relative flex flex-col items-center gap-2 select-none ${className}`}>
      {/* 1-Click Layer Settings Panel Button */}
      <div className="relative">
        <button
          onClick={() => setIsLayersPanelOpen((prev) => !prev)}
          className={`group relative w-12 h-12 rounded-xl overflow-hidden border-2 shadow-md transition-all duration-150 ease-spring hover:scale-105 active:scale-90 focus:outline-none ${
            isLayersPanelOpen
              ? 'border-blue-500 ring-2 ring-blue-500/40'
              : 'border-white dark:border-slate-800'
          }`}
          title="รูปแบบแผนที่และระบบพิกัด (Map Style & CRS Settings)"
          aria-label="รูปแบบแผนที่และระบบพิกัด"
        >
          <div
            className={`absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110 ${
              currentBasemap === 'satellite'
                ? 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-slate-200 dark:bg-slate-700'
                : 'bg-emerald-900 bg-[radial-gradient(#059669_1px,transparent_1px)]'
            }`}
            style={{
              backgroundImage:
                currentBasemap === 'satellite'
                  ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
                  : 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)'
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
            <Layers className="w-4 h-4 text-white drop-shadow-sm mb-0.5" />
            <span className="text-[9px] font-bold text-white uppercase tracking-tight drop-shadow-md">
              {currentBasemap === 'satellite' ? 'ดาวเทียม' : currentBasemap === 'osm' ? 'ถนน' : currentBasemap === 'topo' ? 'ภูมิประเทศ' : 'โหมดมืด'}
            </span>
          </div>
        </button>

        {/* Floating Map Layers & CRS Settings Panel */}
        {isLayersPanelOpen && (
          <div
            ref={panelRef}
            className="absolute right-14 top-0 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-glass-floating p-3.5 space-y-3 z-50 anim-spring-down select-none"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  ตั้งค่าแผนที่ &amp; ระบบพิกัด
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLayersPanelOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150 ease-spring active:scale-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* รูปแบบแผนที่ที่แสดง (Basemap) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                รูปแบบแผนที่ (Basemap)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {BASEMAP_OPTIONS.map((bm) => (
                  <button
                    key={bm.id}
                    type="button"
                    onClick={() => {
                      onBasemapChange(bm.id);
                    }}
                    className={`p-2 rounded-xl border text-left flex flex-col justify-between transition duration-150 ease-spring hover:scale-[1.02] active:scale-90 ${
                      currentBasemap === bm.id
                        ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{bm.label}</span>
                      {currentBasemap === bm.id && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 truncate">{bm.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* เปลี่ยนระบบพิกัด (CRS / Datum) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  ระบบพิกัด (CRS &amp; Datum)
                </span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                  {coordinateDatum === 'WGS84' ? 'WGS 84' : coordinateDatum === 'INDIAN1975_47' ? 'Ind75 (47N)' : 'Ind75 (48N)'}
                </span>
              </div>
              <div className="space-y-1">
                {CRS_OPTIONS.map((crs) => (
                  <button
                    key={crs.id}
                    type="button"
                    onClick={() => {
                      onSelectCoordinateDatum?.(crs.id);
                    }}
                    className={`w-full p-2 rounded-xl border text-left flex items-start justify-between transition duration-150 ease-spring hover:scale-[1.01] active:scale-90 ${
                      coordinateDatum === crs.id
                        ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{crs.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{crs.sub}</div>
                    </div>
                    {coordinateDatum === crs.id && (
                      <Check className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Pillar — smoothly folded with CSS spring transition when 3-line menu flyout is open */}
      <div
        className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-md p-1 flex flex-col items-center gap-1 transition-all duration-200 ease-spring ${
          isMenuOpen
            ? 'opacity-0 scale-90 pointer-events-none -translate-y-2 max-h-0 overflow-hidden py-0 border-transparent shadow-none'
            : 'opacity-100 scale-100 translate-y-0 max-h-60'
        }`}
      >
        {/* Compass / Reset North */}
        <button
          onClick={onResetNorth}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-all duration-150 ease-spring hover:scale-105 active:scale-90"
          title="รีเซ็ตทิศเหนือ (Reset North)"
        >
          <div className="relative w-4 h-4 flex items-center justify-center">
            <Compass className="w-4 h-4 text-rose-500 transition-transform" />
            <span className="absolute -top-1.5 text-[8px] font-bold text-rose-600">N</span>
          </div>
        </button>

        {/* Locate Me */}
        <button
          onClick={onLocateMe}
          className={`p-2 rounded-lg transition-all duration-150 ease-spring hover:scale-105 active:scale-90 ${
            isLocating
              ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600'
          }`}
          title={isLocating ? 'ปิดการติดตามตำแหน่ง (Live Tracking: เปิดอยู่)' : 'ตำแหน่งปัจจุบันของฉัน (Locate Me)'}
          aria-label={isLocating ? 'ปิดการติดตามตำแหน่ง GPS' : 'ระบุตำแหน่งปัจจุบัน'}
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? 'text-white' : ''}`} />
        </button>

        {/* เส้นคั่นแบ่งกลุ่มระหว่างตำแหน่ง/ทิศทาง กับเครื่องมือวัด/ทำแผนที่ */}
        <div className="w-5 h-[1px] bg-slate-200 dark:bg-slate-700/80 my-0.5" />

        {/* Measure Tool (เครื่องมือวัดระยะและพื้นที่ — รูปไม้บรรทัด) */}
        {onToggleMeasure && (
          <button
            onClick={onToggleMeasure}
            className={`p-2 rounded-lg transition-all duration-150 ease-spring hover:scale-105 active:scale-90 ${
              isMeasureMode
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600'
            }`}
            title={
              isMeasureMode
                ? 'ปิดเครื่องมือวัดระยะและพื้นที่ (Measure Tool: เปิดอยู่)'
                : 'เครื่องมือวัดระยะทางและขนาดพื้นที่ (Measure Tool 📏)'
            }
            aria-label="เครื่องมือวัดระยะและพื้นที่"
          >
            <Ruler className="w-4 h-4" />
          </button>
        )}

        {/* Inspect / Pin Details Mode (เปิด/ปิดโหมดจิ้มแสดงหน้าต่างข้อมูลรายละเอียด) */}
        {onToggleInspectMode && (
          <button
            onClick={onToggleInspectMode}
            className={`p-2 rounded-lg transition-all duration-150 ease-spring hover:scale-105 active:scale-90 ${
              isInspectMode
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600'
            }`}
            title={
              isInspectMode
                ? 'ปิดโหมดจิ้มแสดงข้อมูลรายละเอียด (Inspect Mode: กำลังเปิดอยู่)'
                : 'เปิดโหมดจิ้มแสดงหน้าต่างข้อมูลรายละเอียด (Inspect Mode)'
            }
            aria-label="เปิด/ปิดโหมดจิ้มแสดงหน้าต่างข้อมูลรายละเอียด"
          >
            <MousePointerClick className="w-4 h-4" />
          </button>
        )}

        {/* Saved Places (Bookmark) */}
        {onToggleSavedPlaces && (
          <button
            onClick={onToggleSavedPlaces}
            className={`p-2 rounded-lg transition-all duration-150 ease-spring hover:scale-105 active:scale-90 ${
              isSavedPlacesOpen
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500'
            }`}
            title="หมุดบันทึกโปรด (Saved Places)"
            aria-label="หมุดบันทึกโปรด"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
