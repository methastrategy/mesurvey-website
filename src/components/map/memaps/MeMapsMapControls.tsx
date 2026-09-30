import React from 'react';
import {
  Compass,
  Plus,
  Minus,
  Crosshair,
  Layers,
  Maximize2
} from 'lucide-react';
import { BasemapProvider } from '../../../types/map';

interface MeMapsMapControlsProps {
  currentBasemap: BasemapProvider;
  onBasemapChange: (basemap: BasemapProvider) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetNorth: () => void;
  onLocateMe: () => void;
  className?: string;
}

export const MeMapsMapControls: React.FC<MeMapsMapControlsProps> = ({
  currentBasemap,
  onBasemapChange,
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onLocateMe,
  className = ''
}) => {
  // Toggle between Street (osm) and Satellite
  const toggleStreetSatellite = () => {
    if (currentBasemap === 'satellite') {
      onBasemapChange('osm');
    } else {
      onBasemapChange('satellite');
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 select-none ${className}`}>
      {/* 1-Click Street / Satellite Thumbnail Preview Switcher (Google Maps style) */}
      <button
        onClick={toggleStreetSatellite}
        className="group relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md transition-all hover:scale-105 active:scale-95 focus:outline-none"
        title={currentBasemap === 'satellite' ? 'สลับเป็นแผนที่ลายเส้น (Street)' : 'สลับเป็นแผนที่ภาพถ่ายดาวเทียม (Satellite)'}
      >
        <div
          className={`absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110 ${
            currentBasemap === 'satellite'
              ? 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-slate-200 dark:bg-slate-700'
              : 'bg-emerald-900 bg-[radial-gradient(#059669_1px,transparent_1px)]'
          }`}
          style={{
            backgroundImage: currentBasemap === 'satellite'
              ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
              : 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)'
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
          <Layers className="w-4 h-4 text-white drop-shadow-sm mb-0.5" />
          <span className="text-[9px] font-bold text-white uppercase tracking-tight drop-shadow-md">
            {currentBasemap === 'satellite' ? 'ถนน' : 'ดาวเทียม'}
          </span>
        </div>
      </button>

      {/* Control Pillar */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-md p-1 flex flex-col items-center gap-1">
        {/* Compass / Reset North */}
        <button
          onClick={onResetNorth}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition"
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
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 transition"
          title="ตำแหน่งปัจจุบันของฉัน (Locate Me)"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <div className="w-6 h-[1px] bg-slate-200 dark:bg-slate-800 my-0.5" />

        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition"
          title="ขยายแผนที่ (Zoom In)"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition"
          title="ย่อแผนที่ (Zoom Out)"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
