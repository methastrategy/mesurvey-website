import React from 'react';
import { decimalToDms, formatDms } from '../../core/projections';
import { TelemetryState } from '../../types/map';

interface TelemetryHudProps {
  telemetry: TelemetryState;
}

export const TelemetryHud: React.FC<TelemetryHudProps> = ({ telemetry }) => {
  const dmsLat = decimalToDms(telemetry.lat, true);
  const dmsLng = decimalToDms(telemetry.lng, false);

  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl border border-slate-700/60 shadow-xl max-w-sm pointer-events-none text-xs font-mono space-y-0.5">
      <div className="flex items-center justify-between text-[10px] text-survey-300 font-sans font-semibold pb-1 border-b border-slate-800">
        <span>📍 พิกัดสดตามเคอร์เซอร์ (Live Telemetry)</span>
        <span>Zoom: {telemetry.zoom}</span>
      </div>

      <div className="pt-0.5 flex justify-between gap-4">
        <span className="text-slate-400 font-sans">WGS84 (DD):</span>
        <span className="font-bold">
          {telemetry.lat.toFixed(6)}°, {telemetry.lng.toFixed(6)}°
        </span>
      </div>

      <div className="flex justify-between gap-4">
        <span className="text-slate-400 font-sans">WGS84 (DMS):</span>
        <span className="text-[11px]">
          {formatDms(dmsLat)}, {formatDms(dmsLng)}
        </span>
      </div>

      <div className="flex justify-between gap-4 pt-0.5 border-t border-slate-800/80">
        <span className="text-slate-400 font-sans">UTM Zone {telemetry.zone}N:</span>
        <span className="font-bold text-survey-400">
          E: {telemetry.easting.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} | N: {telemetry.northing.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </span>
      </div>
    </div>
  );
};
