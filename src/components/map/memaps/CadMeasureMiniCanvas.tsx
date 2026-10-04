import React, { useMemo } from 'react';

interface CadMeasureMiniCanvasProps {
  points: { lat: number; lng: number }[];
  isArea: boolean;
  measurementResultText?: string | null;
}

export const CadMeasureMiniCanvas: React.FC<CadMeasureMiniCanvasProps> = ({
  points,
  isArea,
}) => {
  // SVG viewport dimensions
  const V_WIDTH = 380;
  const V_HEIGHT = 160;

  // Compute normalized planar coordinates matching geodetic geometry
  const { coords } = useMemo(() => {
    if (points.length < 2) return { coords: [] };

    const midLat = points.reduce((acc, p) => acc + p.lat, 0) / points.length;
    const cosLat = Math.cos((midLat * Math.PI) / 180);

    // Geographic to local meter projection (equirectangular planar approximation)
    const xs = points.map((p) => (p.lng - points[0].lng) * cosLat);
    const ys = points.map((p) => p.lat - points[0].lat);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const spanX = Math.max(maxX - minX, 0.000001);
    const spanY = Math.max(maxY - minY, 0.000001);

    const padX = 45;
    const padY = 32;
    const availW = V_WIDTH - padX * 2;
    const availH = V_HEIGHT - padY * 2;
    const scale = Math.min(availW / spanX, availH / spanY);

    const shapeW = spanX * scale;
    const shapeH = spanY * scale;
    const originX = padX + (availW - shapeW) / 2;
    const originY = padY + (availH - shapeH) / 2;

    const projected = points.map((p, i) => ({
      x: originX + (xs[i] - minX) * scale,
      y: originY + (maxY - ys[i]) * scale, // Inverted Y for cartographic North
      lat: p.lat,
      lng: p.lng,
    }));

    return { coords: projected };
  }, [points]);

  // Ribbon polygon for 2 points in Area mode
  const twoPointRibbon = useMemo(() => {
    if (coords.length !== 2 || !isArea) return null;
    const p1 = coords[0];
    const p2 = coords[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * 12;
    const ny = (dx / len) * 12;
    return `${p1.x + nx},${p1.y + ny} ${p2.x + nx},${p2.y + ny} ${p2.x - nx},${p2.y - ny} ${p1.x - nx},${p1.y - ny}`;
  }, [coords, isArea]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-900 dark:bg-[#090d16] shadow-inner select-none transition-colors">
      {/* CAD Canvas Header Status HUD */}
      <div className="absolute top-2 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        {/* North Direction Indicator Symbol (Replaces CAD GRID VIEW text) */}
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-sm border border-slate-700/70 shadow-xs"
          title="ทิศเหนือ (N)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-rose-500"
          >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="6 11 12 5 18 11" />
          </svg>
          <span className="text-[10px] font-mono font-bold tracking-wider text-rose-500">N</span>
        </div>

        <div className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm border border-slate-700/60">
          <span className="text-[9px] font-mono font-medium text-slate-300">
            {points.length === 0
              ? 'รอรับพิกัด'
              : points.length === 1
              ? 'จุด P1 เริ่มต้น'
              : isArea
              ? `พื้นที่ (${points.length} จุด)`
              : `ระยะทาง (${points.length} จุด)`}
          </span>
        </div>
      </div>

      {/* SVG CAD Drafting Viewport */}
      <svg
        viewBox={`0 0 ${V_WIDTH} ${V_HEIGHT}`}
        className="w-full h-[155px] block font-mono"
      >
        <defs>
          {/* Minor CAD Grid: 12x12 px */}
          <pattern
            id="cadMinorGrid"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 12 0 L 0 0 0 12"
              fill="none"
              stroke="rgba(148, 163, 184, 0.08)"
              strokeWidth="0.75"
            />
          </pattern>

          {/* Major CAD Grid: 48x48 px with theme accent */}
          <pattern
            id="cadMajorGrid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="var(--accent, #38bdf8)"
              strokeOpacity="0.16"
              strokeWidth="1"
            />
          </pattern>

          {/* CAD Area Hatch Pattern (Engineering 45-degree diagonal lines synchronized with theme) */}
          <pattern
            id="cadHatch"
            width="8"
            height="8"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke="var(--accent, #38bdf8)"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
          </pattern>
        </defs>

        {/* CAD Grid Background */}
        <rect width={V_WIDTH} height={V_HEIGHT} fill="#090d16" />
        <rect width={V_WIDTH} height={V_HEIGHT} fill="url(#cadMinorGrid)" />
        <rect width={V_WIDTH} height={V_HEIGHT} fill="url(#cadMajorGrid)" />

        {/* Bottom-Left CAD Orientation Axes (N - E) */}
        <g transform="translate(20, 138)" opacity="0.65">
          {/* Y / North Arrow */}
          <line x1="0" y1="0" x2="0" y2="-18" stroke="#10b981" strokeWidth="1.5" />
          <polygon points="0,-21 -3,-16 3,-16" fill="#10b981" />
          <text x="-9" y="-12" fill="#10b981" fontSize="8" fontWeight="bold">N</text>
          {/* X / East Arrow */}
          <line x1="0" y1="0" x2="18" y2="0" stroke="#f43f5e" strokeWidth="1.5" />
          <polygon points="21,0 16,-3 16,3" fill="#f43f5e" />
          <text x="12" y="10" fill="#f43f5e" fontSize="8" fontWeight="bold">E</text>
        </g>

        {/* 0 Points: Waiting state with Center Crosshair */}
        {points.length === 0 && (
          <g transform={`translate(${V_WIDTH / 2}, ${V_HEIGHT / 2})`}>
            <circle r="18" fill="none" stroke="var(--accent, #38bdf8)" strokeOpacity="0.25" strokeDasharray="3 3" />
            <circle r="6" fill="none" stroke="var(--accent, #38bdf8)" strokeOpacity="0.4" />
            <line x1="-28" y1="0" x2="28" y2="0" stroke="var(--accent, #38bdf8)" strokeOpacity="0.35" />
            <line x1="0" y1="-28" x2="0" y2="28" stroke="var(--accent, #38bdf8)" strokeOpacity="0.35" />
            <text
              y="38"
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
              fontFamily="sans-serif"
            >
              แตะบนแผนที่เพื่อปักจุดเริ่มต้น (P1)
            </text>
          </g>
        )}

        {/* 1 Point: Single Pin at Center with Pulse & Crosshair */}
        {points.length === 1 && (
          <g transform={`translate(${V_WIDTH / 2}, ${V_HEIGHT / 2})`}>
            {/* Pulsing ring */}
            <circle r="14" fill="var(--accent, #38bdf8)" fillOpacity="0.15" stroke="var(--accent, #38bdf8)" strokeWidth="1.5">
              <animate attributeName="r" values="8;16;8" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.4s" repeatCount="indefinite" />
            </circle>
            {/* Center target lines */}
            <line x1="-24" y1="0" x2="24" y2="0" stroke="var(--accent, #38bdf8)" strokeOpacity="0.45" strokeDasharray="2 2" />
            <line x1="0" y1="-24" x2="0" y2="24" stroke="var(--accent, #38bdf8)" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="2 2" />
            {/* Pin core */}
            <circle r="4" fill="#ffffff" stroke="var(--accent, #0284c7)" strokeWidth="2" />
            {/* Label P1 */}
            <rect x="8" y="-18" width="22" height="14" rx="3" fill="#0f172a" stroke="var(--accent, #38bdf8)" strokeWidth="0.8" />
            <text x="19" y="-8" textAnchor="middle" fill="var(--accent, #38bdf8)" fontSize="9" fontWeight="bold">
              P1
            </text>
            <text
              y="34"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
              fontFamily="monospace"
            >
              {points[0].lat.toFixed(5)}°, {points[0].lng.toFixed(5)}°
            </text>
          </g>
        )}

        {/* 2 Points: Line between P1 and P2 (With Hatching in Area mode) */}
        {points.length === 2 && coords.length === 2 && (
          <g>
            {/* Area mode with 2 points: Shaded CAD hatch ribbon */}
            {isArea && twoPointRibbon && (
              <>
                <polygon points={twoPointRibbon} fill="var(--accent, #38bdf8)" fillOpacity="0.18" />
                <polygon points={twoPointRibbon} fill="url(#cadHatch)" />
              </>
            )}

            {/* Connecting Baseline */}
            <line
              x1={coords[0].x}
              y1={coords[0].y}
              x2={coords[1].x}
              y2={coords[1].y}
              stroke="var(--accent, #38bdf8)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* 3+ Points: Closed Hatched Polygon (Area) OR Open Polyline (Distance) */}
        {points.length >= 3 && coords.length >= 3 && (
          <g>
            {isArea ? (
              <>
                {/* 1. Translucent Area Tint */}
                <polygon
                  points={coords.map((c) => `${c.x},${c.y}`).join(' ')}
                  fill="var(--accent, #38bdf8)"
                  fillOpacity="0.18"
                />
                {/* 2. CAD Engineering Diagonal Hatch Shading */}
                <polygon
                  points={coords.map((c) => `${c.x},${c.y}`).join(' ')}
                  fill="url(#cadHatch)"
                />
                {/* 3. Perimeter Stroke */}
                <polygon
                  points={coords.map((c) => `${c.x},${c.y}`).join(' ')}
                  fill="none"
                  stroke="var(--accent, #38bdf8)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </>
            ) : (
              /* Polyline for Distance */
              <polyline
                points={coords.map((c) => `${c.x},${c.y}`).join(' ')}
                fill="none"
                stroke="var(--accent, #38bdf8)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        )}

        {/* Vertices (for 2+ points) */}
        {coords.length >= 2 &&
          coords.map((c, i) => (
            <g key={i}>
              <circle cx={c.x} cy={c.y} r={7} fill="#090d16" stroke="var(--accent, #38bdf8)" strokeWidth="1.5" />
              <circle cx={c.x} cy={c.y} r={2.5} fill="#ffffff" />
              {/* Vertex P-number pill */}
              <rect
                x={c.x + 7}
                y={c.y - 14}
                width={20}
                height={13}
                rx="3"
                fill="#0f172a"
                stroke="var(--accent, #38bdf8)"
                strokeWidth="0.8"
              />
              <text
                x={c.x + 17}
                y={c.y - 4}
                textAnchor="middle"
                fill="var(--accent, #38bdf8)"
                fontSize="9"
                fontWeight="bold"
              >
                P{i + 1}
              </text>
            </g>
          ))}
      </svg>

      {/* Point Coordinates Readout Bar */}
      {points.length > 0 && (
        <div className="px-3 py-1.5 bg-slate-900/95 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono text-slate-300">
          <span className="text-[9px] uppercase font-bold text-slate-500 shrink-0">พิกัด:</span>
          {points.map((p, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded bg-slate-800/90 border border-slate-700/60 shrink-0 text-slate-200"
            >
              <strong className="mr-1" style={{ color: 'var(--accent)' }}>
                P{i + 1}
              </strong>
              {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
