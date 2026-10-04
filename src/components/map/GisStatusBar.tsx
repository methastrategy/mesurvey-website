import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { forwardWgs84ToUtm, forwardWgs84ToIndian1975 } from '../../core/projections';
import { CoordinateDatum } from '../../types/map';

interface GisStatusBarProps {
  telemetry?: {
    lat: number;
    lng: number;
    utmE: number;
    utmN: number;
    zone: number;
    zoom: number;
  };
  datum?: CoordinateDatum;
  className?: string;
}

export const GisStatusBar: React.FC<GisStatusBarProps> = ({
  telemetry,
  datum = 'WGS84',
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const [elevation, setElevation] = useState<number | null>(null);
  const [isElevLoading, setIsElevLoading] = useState(false);
  const elevationCache = useRef<Map<string, number>>(new Map());

  // Fetch real-world Copernicus DEM elevation via Open-Meteo Elevation API (debounced)
  useEffect(() => {
    if (!telemetry) return;
    const latRounded = Number(telemetry.lat.toFixed(4));
    const lngRounded = Number(telemetry.lng.toFixed(4));
    const key = `${latRounded},${lngRounded}`;

    if (elevationCache.current.has(key)) {
      setElevation(elevationCache.current.get(key)!);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsElevLoading(true);
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/elevation?latitude=${latRounded}&longitude=${lngRounded}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.elevation) && data.elevation.length > 0) {
            const elev = Number(data.elevation[0]);
            if (Number.isFinite(elev)) {
              elevationCache.current.set(key, elev);
              setElevation(elev);
            }
          }
        }
      } catch {
        // Abort or offline — ignore gracefully
      } finally {
        setIsElevLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [telemetry?.lat, telemetry?.lng]);

  if (!telemetry) return null;

  const lat = telemetry.lat;
  const lng = telemetry.lng;

  let easting = telemetry.utmE;
  let northing = telemetry.utmN;
  let zoneText = `UTM ${telemetry.zone}N`;

  if (datum === 'INDIAN1975_47') {
    try {
      const ind = forwardWgs84ToIndian1975(lat, lng, 47);
      easting = Math.round(ind.easting);
      northing = Math.round(ind.northing);
      zoneText = 'UTM 47N (Ind75)';
    } catch {}
  } else if (datum === 'INDIAN1975_48') {
    try {
      const ind = forwardWgs84ToIndian1975(lat, lng, 48);
      easting = Math.round(ind.easting);
      northing = Math.round(ind.northing);
      zoneText = 'UTM 48N (Ind75)';
    } catch {}
  } else {
    try {
      const wgs = forwardWgs84ToUtm(lat, lng);
      easting = Math.round(wgs.easting);
      northing = Math.round(wgs.northing);
      zoneText = `UTM ${wgs.zone}N`;
    } catch {}
  }

  const handleCopy = () => {
    const elevText = elevation !== null ? ` | Elev: ${Math.round(elevation)}m MSL` : '';
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)} (${zoneText}: E ${easting} N ${northing}${elevText})`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      onClick={handleCopy}
      title="คลิกเพื่อคัดลอกพิกัดและค่าระดับลงคลิปบอร์ด"
      aria-label="คลิกเพื่อคัดลอกพิกัดลงคลิปบอร์ด"
      className={`px-3.5 py-1.5 rounded-full text-[11px] font-mono select-none flex items-center gap-2 sm:gap-3 bg-slate-900/90 dark:bg-black/90 backdrop-blur-md border border-slate-700/80 text-slate-200 shadow-xl pointer-events-auto cursor-pointer hover:bg-slate-800/95 transition-all hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      {copied ? (
        <div className="flex items-center gap-1.5 text-emerald-400 font-sans font-semibold text-xs py-0.5">
          <Check className="w-3.5 h-3.5" />
          <span>คัดลอกพิกัดแล้ว!</span>
        </div>
      ) : (
        <>
          {/* Lat/Lon DD */}
          <span className="tabular-nums font-semibold tracking-tight text-slate-100 flex items-center gap-1">
            <span className="text-slate-400 text-[10px] font-sans">Lat/Lon:</span>
            <span>{lat.toFixed(5)}°, {lng.toFixed(5)}°</span>
          </span>

          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* N/E Coordinates */}
          <span className="hidden sm:inline tabular-nums text-slate-300">
            <span className="text-slate-400 text-[10px] font-sans mr-1">N/E:</span>
            <span className="text-emerald-400 font-semibold">{northing.toLocaleString()}</span> N,{' '}
            <span className="text-emerald-400 font-semibold">{easting.toLocaleString()}</span> E
          </span>

          {/* MSL Elev */}
          <span className="text-slate-600">|</span>
          <span className="tabular-nums text-slate-300 flex items-center gap-1">
            <span className="text-slate-400 text-[10px] font-sans">MSL Elev:</span>
            <span className="text-amber-400 font-semibold">
              {elevation !== null ? `${Math.round(elevation)} m` : (isElevLoading ? '...' : '--')}
            </span>
          </span>
        </>
      )}
    </div>
  );
};
