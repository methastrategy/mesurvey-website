import React, { useState } from 'react';
import {
  DamTelemetryStation,
  RiverGaugeStation,
  DirectedRiverSegment,
  DemCrossSectionProfile,
  HydroAlertLevel
} from '../../types/disaster';
import { forwardWgs84ToUtm } from '../../core/projections';
import {
  X,
  Gauge,
  Waves,
  Scissors,
  Calculator,
  Ruler,
  GitBranch,
  ArrowRight
} from 'lucide-react';

interface HydroTelemetryDrawerProps {
  selectedRiver?: DirectedRiverSegment | null;
  selectedGauge: RiverGaugeStation | null;
  selectedDam: DamTelemetryStation | null;
  crossSection: DemCrossSectionProfile | null;
  isLoadingCrossSection?: boolean;
  allRivers?: DirectedRiverSegment[];
  allDams?: DamTelemetryStation[];
  allGauges?: RiverGaugeStation[];
  onSelectRiver?: (river: DirectedRiverSegment) => void;
  onSelectDam?: (dam: DamTelemetryStation) => void;
  onSelectGauge?: (gauge: RiverGaugeStation) => void;
  onClose: () => void;
  onSendToConverter: (lat: number, lng: number, label: string) => void;
  onSendElevationToLeveling: (elevationMsl: number, stationLabel: string) => void;
}

function getAlertBadgeSpec(level: HydroAlertLevel = 'normal'): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  switch (level) {
    case 'critical':
      return {
        label: 'CRITICAL • ล้นตลิ่ง (>100%)',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.14)',
        border: 'rgba(239, 68, 68, 0.4)'
      };
    case 'warning':
      return {
        label: 'WARNING • น้ำมาก (80–100%)',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.14)',
        border: 'rgba(245, 158, 11, 0.4)'
      };
    case 'watch':
      return {
        label: 'WATCH • เฝ้าระวัง (60–80%)',
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.14)',
        border: 'rgba(56, 189, 248, 0.4)'
      };
    case 'drought':
      return {
        label: 'LOW FLOW • น้ำน้อยวิกฤต',
        color: '#a8a29e',
        bg: 'rgba(168, 162, 158, 0.14)',
        border: 'rgba(168, 162, 158, 0.4)'
      };
    case 'normal':
    default:
      return {
        label: 'NORMAL • ปกติ (30–60%)',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.14)',
        border: 'rgba(16, 185, 129, 0.4)'
      };
  }
}

export const HydroTelemetryDrawer: React.FC<HydroTelemetryDrawerProps> = ({
  selectedRiver = null,
  selectedGauge,
  selectedDam,
  crossSection,
  isLoadingCrossSection = false,
  allRivers = [],
  allDams = [],
  allGauges = [],
  onSelectRiver,
  onSelectDam,
  onSelectGauge,
  onClose,
  onSendToConverter,
  onSendElevationToLeveling
}) => {
  const [floodStageRiseMeters, setFloodStageRiseMeters] = useState<number>(3.0);

  if (!selectedRiver && !selectedGauge && !selectedDam && !crossSection && !isLoadingCrossSection) {
    return null;
  }

  // Render SVG 14-Day Hydrograph for either Gauge or Dam
  const renderHydrographSvg = (
    dates: string[] = [],
    discharge: number[] = [],
    p75: number[] = [],
    p25: number[] = [],
    thresholdCms?: number
  ) => {
    if (discharge.length < 2) return null;
    const width = 460;
    const height = 135;
    const padLeft = 42;
    const padRight = 14;
    const padTop = 14;
    const padBottom = 24;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const allVals = [...discharge, ...p75, ...(thresholdCms ? [thresholdCms * 1.08] : [])];
    const maxY = Math.max(100, ...allVals);
    const minY = 0;

    const toX = (i: number) =>
      padLeft + (i / Math.max(1, discharge.length - 1)) * plotW;
    const toY = (val: number) =>
      padTop + plotH - ((Math.max(minY, Math.min(maxY, val)) - minY) / (maxY - minY)) * plotH;

    const linePts = discharge.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

    // Uncertainty envelope P25..P75
    const hasBand = p75.length === discharge.length && p25.length === discharge.length;
    const bandPolygon = hasBand
      ? [
          ...p75.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`),
          ...p25
            .slice()
            .reverse()
            .map((v, revIdx) => {
              const origIdx = p25.length - 1 - revIdx;
              return `${toX(origIdx).toFixed(1)},${toY(v).toFixed(1)}`;
            })
        ].join(' ')
      : '';

    const todayIdx = Math.min(7, discharge.length - 1);
    const todayX = toX(todayIdx);
    const bankfullY = thresholdCms ? toY(thresholdCms) : null;

    return (
      <div
        className="p-2.5 rounded-xl"
        style={{
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border)'
        }}
      >
        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
          <span style={{ color: 'var(--text-2)' }}>
            กราฟอัตราการไหล 14 วัน (ย้อนหลัง 7 วัน + พยากรณ์ GloFAS 7 วัน)
          </span>
          <span className="tabular-nums font-bold" style={{ color: 'var(--accent)' }}>
            m³/s
          </span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-32 overflow-visible select-none"
          role="img"
          aria-label="กราฟไฮโดรกราฟอัตราการไหลของน้ำ 14 วัน"
        >
          {/* Horizontal Grid Lines */}
          {[0, 0.5, 1].map((frac, idx) => {
            const val = Math.round(minY + frac * (maxY - minY));
            const y = toY(val);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="3,3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--text-3)"
                  fontSize="9"
                  fontFamily="Geist Mono, JetBrains Mono, monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* P25-P75 Ensemble Spread Band */}
          {hasBand && (
            <polygon points={bandPolygon} fill="rgba(14, 165, 233, 0.16)" stroke="none" />
          )}

          {/* Bankfull Capacity Threshold Line */}
          {bankfullY !== null && (
            <g>
              <line
                x1={padLeft}
                y1={bankfullY}
                x2={width - padRight}
                y2={bankfullY}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="5,4"
              />
              <text
                x={width - padRight - 4}
                y={Math.max(11, bankfullY - 4)}
                textAnchor="end"
                fill="#ef4444"
                fontSize="9"
                fontWeight="700"
                fontFamily="Geist Mono, JetBrains Mono, monospace"
              >
                ความจุตลิ่ง {thresholdCms} m³/s
              </text>
            </g>
          )}

          {/* Today Vertical Marker */}
          <line
            x1={todayX}
            y1={padTop}
            x2={todayX}
            y2={height - padBottom}
            stroke="var(--accent-2)"
            strokeWidth="1.2"
            strokeDasharray="2,2"
          />
          <text
            x={todayX}
            y={height - 8}
            textAnchor="middle"
            fill="var(--accent-2)"
            fontSize="9"
            fontWeight="700"
            fontFamily="Geist Mono, JetBrains Mono, monospace"
          >
            วันนี้
          </text>

          {/* Main Discharge Polyline */}
          <polyline
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={linePts}
          />

          {/* Today Data Point Dot */}
          <circle
            cx={todayX}
            cy={toY(discharge[todayIdx])}
            r="4"
            fill="#0ea5e9"
            stroke="#ffffff"
            strokeWidth="1.5"
          />

          {/* Start & End Date Labels */}
          {dates.length > 0 && (
            <>
              <text
                x={padLeft}
                y={height - 8}
                textAnchor="start"
                fill="var(--text-3)"
                fontSize="9"
                fontFamily="Geist Mono, JetBrains Mono, monospace"
              >
                {dates[0].slice(5)}
              </text>
              <text
                x={width - padRight}
                y={height - 8}
                textAnchor="end"
                fill="var(--text-3)"
                fontSize="9"
                fontFamily="Geist Mono, JetBrains Mono, monospace"
              >
                {dates[dates.length - 1].slice(5)}
              </text>
            </>
          )}
        </svg>
      </div>
    );
  };

  // Render SVG DEM Terrain Cross-Section + Flood Simulator
  const renderCrossSectionSvg = (profile: DemCrossSectionProfile) => {
    const samples = profile.samples;
    if (samples.length < 2) return null;

    const width = 460;
    const height = 145;
    const padLeft = 44;
    const padRight = 14;
    const padTop = 16;
    const padBottom = 24;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const waterLevelMsl = Number((profile.minElevationMsl + floodStageRiseMeters).toFixed(2));
    const minY = Math.floor(profile.minElevationMsl - 2);
    const maxY = Math.ceil(Math.max(profile.maxElevationMsl + 2, waterLevelMsl + 2));
    const maxDist = Math.max(1, profile.totalDistanceMeters);

    const toX = (dist: number) => padLeft + (dist / maxDist) * plotW;
    const toY = (elev: number) =>
      padTop + plotH - ((Math.max(minY, Math.min(maxY, elev)) - minY) / Math.max(1, maxY - minY)) * plotH;

    const terrainLine = samples
      .map((s) => `${toX(s.distanceMeters).toFixed(1)},${toY(s.elevationMsl).toFixed(1)}`)
      .join(' ');

    const terrainPolygon = [
      `${toX(0).toFixed(1)},${(padTop + plotH).toFixed(1)}`,
      ...samples.map((s) => `${toX(s.distanceMeters).toFixed(1)},${toY(s.elevationMsl).toFixed(1)}`),
      `${toX(maxDist).toFixed(1)},${(padTop + plotH).toFixed(1)}`
    ].join(' ');

    const waterY = toY(waterLevelMsl);

    // Submerged channel water polygon bounded strictly between terrain bed and waterLevelMsl
    const submergedWaterPolygon = [
      ...samples.map(
        (s) =>
          `${toX(s.distanceMeters).toFixed(1)},${toY(
            Math.max(s.elevationMsl, waterLevelMsl)
          ).toFixed(1)}`
      ),
      ...samples
        .slice()
        .reverse()
        .map((s) => `${toX(s.distanceMeters).toFixed(1)},${toY(s.elevationMsl).toFixed(1)}`)
    ].join(' ');

    // Estimate flooded width and trapezoidal hydraulic cross-sectional area (m²)
    const submergedCount = samples.filter((s) => s.elevationMsl < waterLevelMsl).length;
    const floodedWidthMeters = Number(
      ((submergedCount / samples.length) * profile.totalDistanceMeters).toFixed(0)
    );
    let flowAreaSqM = 0;
    for (let i = 0; i < samples.length - 1; i++) {
      const d0 = Math.max(0, waterLevelMsl - samples[i].elevationMsl);
      const d1 = Math.max(0, waterLevelMsl - samples[i + 1].elevationMsl);
      const dx = Math.max(0, samples[i + 1].distanceMeters - samples[i].distanceMeters);
      flowAreaSqM += ((d0 + d1) * 0.5) * dx;
    }
    const crossSectionAreaSqM = Math.round(flowAreaSqM);

    return (
      <div className="space-y-2.5">
        <div
          className="p-2.5 rounded-xl"
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)'
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5">
            <span className="font-semibold" style={{ color: 'var(--text-1)' }}>
              รูปตัดขวางภูมิประเทศ (Copernicus DEM 90m)
            </span>
            <span className="font-mono tabular-nums text-[11px]" style={{ color: 'var(--accent)' }}>
              WL +{waterLevelMsl.toFixed(2)} ม.รทก. (กว้าง ~{floodedWidthMeters} ม. • พื้นที่น้ำ ~{crossSectionAreaSqM.toLocaleString()} m²)
            </span>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-36 overflow-visible select-none"
            role="img"
            aria-label="กราฟรูปตัดขวางลำน้ำและจำลองระดับน้ำท่วม"
          >
            {/* Terrain Fill Polygon */}
            <polygon points={terrainPolygon} fill="rgba(180, 83, 9, 0.26)" />

            {/* Submerged Channel Water Polygon (strictly within channel where terrain < waterLevelMsl) */}
            <polygon points={submergedWaterPolygon} fill="rgba(14, 165, 233, 0.36)" />

            {/* Water Surface Line */}
            <line
              x1={padLeft}
              y1={waterY}
              x2={width - padRight}
              y2={waterY}
              stroke="#0284c7"
              strokeWidth="2"
              strokeDasharray="5,3"
            />
            <text
              x={width - padRight - 4}
              y={Math.max(12, waterY - 4)}
              textAnchor="end"
              fill="#0284c7"
              fontSize="9"
              fontWeight="700"
              fontFamily="Geist Mono, JetBrains Mono, monospace"
            >
              WL +{waterLevelMsl.toFixed(2)} m.MSL
            </text>

            {/* Terrain Profile Polyline */}
            <polyline
              fill="none"
              stroke="#d97706"
              strokeWidth="2.4"
              points={terrainLine}
            />

            {/* Y-Axis Elevation Labels */}
            {[minY, Math.round((minY + maxY) / 2), maxY].map((val, idx) => (
              <text
                key={idx}
                x={padLeft - 6}
                y={toY(val) + 3}
                textAnchor="end"
                fill="var(--text-3)"
                fontSize="9"
                fontFamily="Geist Mono, JetBrains Mono, monospace"
              >
                {val}m
              </text>
            ))}

            {/* X-Axis Distance Labels */}
            <text
              x={padLeft}
              y={height - 6}
              textAnchor="start"
              fill="var(--text-3)"
              fontSize="9"
              fontFamily="Geist Mono, JetBrains Mono, monospace"
            >
              0 m (จุดเริ่ม A)
            </text>
            <text
              x={width - padRight}
              y={height - 6}
              textAnchor="end"
              fill="var(--text-3)"
              fontSize="9"
              fontFamily="Geist Mono, JetBrains Mono, monospace"
            >
              {profile.totalDistanceMeters.toFixed(0)} m (จุดปลาย B)
            </text>
          </svg>

          {/* Flood Stage Simulator Slider */}
          <div className="flex items-center gap-3 pt-1">
            <label
              htmlFor="flood-stage-slider"
              className="text-[11px] font-semibold shrink-0"
              style={{ color: 'var(--text-2)' }}
            >
              จำลองน้ำหนุนสูงขึ้น:
            </label>
            <input
              id="flood-stage-slider"
              type="range"
              min={0.5}
              max={10.0}
              step={0.5}
              value={floodStageRiseMeters}
              onChange={(e) => setFloodStageRiseMeters(Number(e.target.value))}
              className="flex-1 accent-[var(--accent)] cursor-pointer"
            />
            <span
              className="font-mono tabular-nums text-xs font-bold shrink-0"
              style={{ color: 'var(--accent)' }}
            >
              +{floodStageRiseMeters.toFixed(1)} ม.
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render SVG Longitudinal River Elevation Profile (Headwater -> Mouth)
  const renderLongitudinalProfileSvg = (river: DirectedRiverSegment) => {
    const width = 460;
    const height = 128;
    const padLeft = 44;
    const padRight = 16;
    const padTop = 16;
    const padBottom = 24;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const upElev = river.upstreamElevationMsl;
    const downElev = river.downstreamElevationMsl;
    const elevSpan = Math.max(1, upElev - downElev);
    const minY = Math.max(0, downElev - elevSpan * 0.12);
    const maxY = upElev + elevSpan * 0.15;

    const riverLenKm = river.lengthKm ?? 100;
    const steps = river.coordinates.length;
    const pts = river.coordinates.map((_, idx) => {
      const t = idx / Math.max(1, steps - 1);
      // Concave fluvial longitudinal profile approximation: H(t) = down + (up - down)*(1 - t)^1.35
      const elev = downElev + (upElev - downElev) * Math.pow(1 - t, 1.35);
      const x = padLeft + t * plotW;
      const y = padTop + plotH - ((elev - minY) / Math.max(1, maxY - minY)) * plotH;
      return { x, y, elev, distKm: t * riverLenKm };
    });

    const bedLine = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
    const waterLine = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${(p.y - 4.5).toFixed(1)}`)
      .join(' ');
    const terrainPolygon = [
      bedLine,
      `L${pts[pts.length - 1].x.toFixed(1)},${(padTop + plotH).toFixed(1)}`,
      `L${pts[0].x.toFixed(1)},${(padTop + plotH).toFixed(1)}`,
      'Z'
    ].join(' ');

    const slopeMetersPerKm = ((upElev - downElev) / Math.max(1, riverLenKm)).toFixed(2);

    return (
      <div
        className="p-2.5 rounded-xl space-y-1.5"
        style={{
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border)'
        }}
      >
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="font-semibold" style={{ color: 'var(--text-2)' }}>
            รูปตัดตามยาวลำน้ำ (Longitudinal Profile • {riverLenKm.toLocaleString()} กม.)
          </span>
          <span style={{ color: 'var(--accent)' }}>
            Slope {slopeMetersPerKm} ม./กม.
          </span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label="กราฟรูปตัดความสูงตามยาวของลำน้ำจากต้นน้ำสู่ปลายน้ำ"
        >
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = padTop + ratio * plotH;
            const val = maxY - ratio * (maxY - minY);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="2 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--text-3)"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  +{val.toFixed(0)}m
                </text>
              </g>
            );
          })}

          <path d={terrainPolygon} fill="rgba(120, 113, 108, 0.24)" />
          <path d={waterLine} fill="none" stroke="#38bdf8" strokeWidth="2.4" />
          <path d={bedLine} fill="none" stroke="var(--text-2)" strokeWidth="1.8" />

          <text
            x={padLeft}
            y={height - 5}
            fill="var(--text-3)"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            ต้นน้ำ (0 กม. • +{upElev}m)
          </text>
          <text
            x={width - padRight}
            y={height - 5}
            textAnchor="end"
            fill="var(--text-3)"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            ปลายน้ำ ({riverLenKm} กม. • +{downElev}m)
          </text>
        </svg>
      </div>
    );
  };

  const riverMidCoord = selectedRiver
    ? selectedRiver.coordinates[Math.floor(selectedRiver.coordinates.length / 2)]
    : null;

  const activeLat =
    selectedGauge?.lat ??
    selectedDam?.lat ??
    (riverMidCoord ? riverMidCoord[0] : undefined) ??
    crossSection?.start.lat ??
    13.84664;
  const activeLng =
    selectedGauge?.lng ??
    selectedDam?.lng ??
    (riverMidCoord ? riverMidCoord[1] : undefined) ??
    crossSection?.start.lng ??
    100.56982;
  const activeUtm = forwardWgs84ToUtm(activeLat, activeLng);

  const activeElevationMsl =
    selectedGauge?.waterElevationMsl ??
    selectedDam?.normalHighWaterLevelMsl ??
    (selectedRiver
      ? Number(
          (
            (selectedRiver.upstreamElevationMsl + selectedRiver.downstreamElevationMsl) /
            2
          ).toFixed(2)
        )
      : undefined) ??
    (crossSection
      ? Number((crossSection.minElevationMsl + floodStageRiseMeters).toFixed(2))
      : undefined) ??
    15.0;

  const activeLabel =
    selectedRiver?.nameTh ??
    selectedGauge?.nameTh ??
    selectedDam?.nameTh ??
    'รูปตัดขวางลำน้ำ DEM Cross-Section';

  const linkedRiverGauge = selectedRiver
    ? allGauges.find((g) => g.id === selectedRiver.linkedGaugeId) ?? null
    : null;

  const alertSpec = getAlertBadgeSpec(
    selectedGauge?.alertLevel ??
      selectedDam?.alertLevel ??
      linkedRiverGauge?.alertLevel ??
      'normal'
  );

  const upstreamRivers = selectedRiver
    ? allRivers.filter((r) => (selectedRiver.upstreamIds ?? []).includes(r.id))
    : [];
  const downstreamRiver =
    selectedRiver && selectedRiver.downstreamId
      ? allRivers.find((r) => r.id === selectedRiver.downstreamId) ?? null
      : null;
  const riverDams = selectedRiver
    ? allDams.filter(
        (d) =>
          selectedRiver.nameTh.includes(d.river) ||
          d.river.includes(selectedRiver.nameTh.replace('แม่น้ำ', ''))
      )
    : [];

  return (
    <section
      aria-label="แผงข้อมูลวิศวกรรมอุทกวิทยาและรูปตัดขวางลำน้ำ"
      className="w-full pointer-events-auto select-none"
    >
      <div
        className="p-3 sm:p-3.5 space-y-2.5 rounded-2xl"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: '18px',
          boxShadow: '0 14px 36px -10px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedRiver && (
                <span
                  className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--accent)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <GitBranch className="w-3 h-3 shrink-0" />
                  <span>
                    {selectedRiver.waterwayType === 'canal'
                      ? 'CANAL NETWORK'
                      : selectedRiver.waterwayType === 'tributary'
                      ? `TRIBUTARY • ORDER ${selectedRiver.streamOrder}`
                      : `MAIN RIVER • ORDER ${selectedRiver.streamOrder}`}
                  </span>
                </span>
              )}
              {selectedGauge && (
                <span
                  className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--accent)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <Gauge className="w-3 h-3 shrink-0" />
                  <span>STATION {selectedGauge.code}</span>
                </span>
              )}
              {selectedDam && (
                <span
                  className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--accent-2)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <Waves className="w-3 h-3 shrink-0" />
                  <span>{selectedDam.agency} DAM</span>
                </span>
              )}
              {crossSection && !selectedRiver && !selectedGauge && !selectedDam && (
                <span
                  className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--accent)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <Scissors className="w-3 h-3 shrink-0" />
                  <span>DEM CROSS-SECTION</span>
                </span>
              )}
              {(selectedRiver || selectedGauge || selectedDam) && (
                <span
                  className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: alertSpec.bg,
                    color: alertSpec.color,
                    border: `1px solid ${alertSpec.border}`
                  }}
                >
                  {alertSpec.label}
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold truncate" style={{ color: 'var(--text-1)' }}>
              {isLoadingCrossSection ? 'กำลังดึงระดับความสูงภูมิประเทศ DEM 90m...' : activeLabel}
            </h3>

            <div className="font-mono tabular-nums text-[10px]" style={{ color: 'var(--text-3)' }}>
              WGS84: {activeLat.toFixed(5)}°, {activeLng.toFixed(5)}° | UTM {activeUtm.zone}N: E{' '}
              {Math.round(activeUtm.easting).toLocaleString()} N{' '}
              {Math.round(activeUtm.northing).toLocaleString()}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="ปิดแผงข้อมูลอุทกวิทยา"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl flex items-center justify-center shrink-0 transition-colors"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-2)'
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode D: River Entity & Topological Network Inspector */}
        {selectedRiver && (
          <>
            <div className="grid grid-cols-2 gap-1.5 font-mono tabular-nums">
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  ความยาวลำน้ำ (Length)
                </div>
                <div className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                  {(selectedRiver.lengthKm ?? 0).toLocaleString()} กม.
                </div>
                <div className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>
                  {selectedRiver.basin}
                </div>
              </div>

              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  ระดับต้นน้ำ → ปลายน้ำ
                </div>
                <div className="text-xs sm:text-sm font-bold" style={{ color: 'var(--accent)' }}>
                  +{selectedRiver.upstreamElevationMsl} → +{selectedRiver.downstreamElevationMsl} ม.
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  ตลิ่งรองรับ {selectedRiver.bankfullCapacityCms.toLocaleString()} m³/s
                </div>
              </div>

              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  แหล่งกำเนิดต้นน้ำ
                </div>
                <div className="text-[11px] font-bold truncate" style={{ color: 'var(--text-1)' }}>
                  {selectedRiver.headwaterTh}
                </div>
              </div>

              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  จุดบรรจบปลายน้ำ
                </div>
                <div className="text-[11px] font-bold truncate" style={{ color: 'var(--text-1)' }}>
                  {selectedRiver.mouthTh}
                </div>
              </div>
            </div>

            <div
              className="px-2.5 py-1.5 rounded-xl text-[11px] flex flex-wrap items-center gap-1"
              style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <span className="font-semibold" style={{ color: 'var(--text-3)' }}>
                จังหวัดที่ไหลผ่าน:
              </span>
              <span style={{ color: 'var(--text-1)' }}>
                {(selectedRiver.provinces ?? []).join(' • ')}
              </span>
            </div>

            {renderLongitudinalProfileSvg(selectedRiver)}

            {/* Topological River Network Traversal */}
            <div
              className="p-2.5 rounded-xl space-y-2"
              style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--text-3)' }}>
                โครงข่ายการไหลเชื่อมต่อ (Hydrological Topology)
              </div>

              {upstreamRivers.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                    ต้นน้ำ / ลำน้ำสาขาที่ไหลเข้า ({upstreamRivers.length} สาย):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {upstreamRivers.map((up) => (
                      <button
                        key={up.id}
                        type="button"
                        onClick={() => onSelectRiver && onSelectRiver(up)}
                        className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors"
                        style={{
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text-1)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <GitBranch className="w-3 h-3 shrink-0" style={{ color: 'var(--accent)' }} />
                        <span>{up.nameTh}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {downstreamRiver && (
                <div className="space-y-1">
                  <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                    ไหลรวมลงสู่ลำน้ำปลายน้ำ:
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectRiver && onSelectRiver(downstreamRiver)}
                    className="min-h-[44px] min-w-[44px] w-full px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors"
                    style={{
                      backgroundColor: 'var(--surface)',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent)'
                    }}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      <span>ไหลลงสู่: {downstreamRiver.nameTh}</span>
                    </span>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--text-3)' }}>
                      {downstreamRiver.lengthKm} กม.
                    </span>
                  </button>
                </div>
              )}

              {(linkedRiverGauge || riverDams.length > 0) && (
                <div className="space-y-1 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                    สถานีวัดน้ำและเขื่อนควบคุมบนลำน้ำนี้:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedRiverGauge && (
                      <button
                        type="button"
                        onClick={() => onSelectGauge && onSelectGauge(linkedRiverGauge)}
                        className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors"
                        style={{
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text-1)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <Gauge className="w-3 h-3 shrink-0" style={{ color: 'var(--accent)' }} />
                        <span>
                          สถานี {linkedRiverGauge.code} ({linkedRiverGauge.bankCapacityPct?.toFixed(0) ?? '--'}% ตลิ่ง)
                        </span>
                      </button>
                    )}
                    {riverDams.map((dam) => (
                      <button
                        key={dam.id}
                        type="button"
                        onClick={() => onSelectDam && onSelectDam(dam)}
                        className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors"
                        style={{
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text-1)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <Waves className="w-3 h-3 shrink-0" style={{ color: 'var(--accent-2)' }} />
                        <span>
                          {dam.nameTh} ({dam.currentStoragePct?.toFixed(0)}%)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Mode A: River Gauge Telemetry Metrics */}
        {selectedGauge && (
          <>
            {/* ThaiWater % Bank Capacity Bar */}
            {typeof selectedGauge.bankCapacityPct === 'number' && (
              <div
                className="p-2.5 rounded-xl space-y-1.5 font-mono tabular-nums"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span style={{ color: 'var(--text-2)' }}>% ความจุลำน้ำเทียบระดับตลิ่ง</span>
                  <span className="font-bold" style={{ color: alertSpec.color }}>
                    {selectedGauge.bankCapacityPct.toFixed(1)}% ของตลิ่ง
                  </span>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--surface)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(4, selectedGauge.bankCapacityPct))}%`,
                      backgroundColor: alertSpec.color
                    }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5 font-mono tabular-nums">
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  อัตราการไหล (Q)
                </div>
                <div className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                  {selectedGauge.currentDischargeCms?.toLocaleString() ?? '--'} m³/s
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  ตลิ่ง: {selectedGauge.bankfullCapacityCms.toLocaleString()} m³/s
                </div>
              </div>

              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  ระดับน้ำ (WL)
                </div>
                <div className="text-xs sm:text-sm font-bold" style={{ color: 'var(--accent)' }}>
                  +{selectedGauge.waterElevationMsl?.toFixed(2) ?? '--'} ม.รทก.
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  ศูนย์เสา: +{selectedGauge.zeroGaugeMsl.toFixed(2)} ม.
                </div>
              </div>

              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  ระดับตลิ่ง (Bankfull)
                </div>
                <div className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                  +{selectedGauge.bankfullElevationMsl.toFixed(2)} ม.รทก.
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  จ.{selectedGauge.province}
                </div>
              </div>

              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  ระยะพ้นน้ำ (Freeboard)
                </div>
                <div
                  className="text-xs sm:text-sm font-bold"
                  style={{
                    color:
                      (selectedGauge.freeboardMeters ?? 1) < 0
                        ? '#ef4444'
                        : 'var(--accent)'
                  }}
                >
                  {(selectedGauge.freeboardMeters ?? 0) >= 0 ? '+' : ''}
                  {selectedGauge.freeboardMeters?.toFixed(2) ?? '--'} ม.
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  {(selectedGauge.freeboardMeters ?? 1) < 0 ? 'ล้นตลิ่ง' : 'ต่ำกว่าตลิ่ง'}
                </div>
              </div>
            </div>

            {renderHydrographSvg(
              selectedGauge.forecastDates,
              selectedGauge.forecastDischargeCms,
              selectedGauge.forecastP75Cms,
              selectedGauge.forecastP25Cms,
              selectedGauge.bankfullCapacityCms
            )}

            {selectedGauge.dataSourceLabel && (
              <div className="text-[10px] font-mono" style={{ color: 'var(--text-3)' }}>
                แหล่งข้อมูล: {selectedGauge.dataSourceLabel}
              </div>
            )}
          </>
        )}

        {/* Mode B: Dam Telemetry Metrics */}
        {selectedDam && (
          <>
            <div className="grid grid-cols-2 gap-1.5 font-mono tabular-nums">
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  ปริมาตรน้ำเก็บกัก
                </div>
                <div className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                  {selectedDam.currentStorageMcm?.toLocaleString() ?? '--'} ล้าน ลบ.ม.
                </div>
                <div className="text-[10px]" style={{ color: 'var(--accent)' }}>
                  {selectedDam.currentStoragePct?.toFixed(1)}% ของความจุ
                </div>
              </div>

              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  ระดับเก็บกักปกติ (NHWL)
                </div>
                <div className="text-xs sm:text-sm font-bold" style={{ color: 'var(--accent)' }}>
                  +{selectedDam.normalHighWaterLevelMsl.toFixed(2)} ม.รทก.
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  ความจุ {selectedDam.maxCapacityMcm.toLocaleString()} MCM
                </div>
              </div>

              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  น้ำไหลเข้าอ่าง (Inflow)
                </div>
                <div className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                  {selectedDam.inflowCms?.toFixed(1) ?? '--'} m³/s
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  {selectedDam.river}
                </div>
              </div>

              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  ระบายท้ายเขื่อน (Outflow)
                </div>
                <div className="text-xs sm:text-sm font-bold" style={{ color: 'var(--accent-2)' }}>
                  {selectedDam.outflowCms?.toFixed(1) ?? '--'} m³/s
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  {selectedDam.basin}
                </div>
              </div>
            </div>

            {renderHydrographSvg(
              selectedDam.forecastDates,
              selectedDam.forecastDischargeCms,
              selectedDam.forecastP75Cms,
              selectedDam.forecastP25Cms
            )}

            {selectedDam.dataSourceLabel && (
              <div className="text-[10px] font-mono" style={{ color: 'var(--text-3)' }}>
                แหล่งข้อมูล: {selectedDam.dataSourceLabel}
              </div>
            )}
          </>
        )}

        {/* Mode C: DEM Cross-Section Profile */}
        {crossSection && renderCrossSectionSvg(crossSection)}

        {/* Geomatics Survey Engineering Bridge Buttons */}
        <div
          className="grid grid-cols-1 gap-1.5 pt-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={() => onSendElevationToLeveling(activeElevationMsl, activeLabel)}
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-text)',
              border: '1px solid var(--accent)'
            }}
          >
            <Ruler className="w-3.5 h-3.5 shrink-0" />
            <span>ส่งค่าระดับ (+{activeElevationMsl.toFixed(2)} ม.รทก.) ไปงานระดับ</span>
          </button>

          <button
            onClick={() => onSendToConverter(activeLat, activeLng, activeLabel)}
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            style={{
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-1)',
              border: '1px solid var(--border)'
            }}
          >
            <Calculator className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
            <span>ส่งพิกัดไปยังเครื่องมือแปลงพิกัด</span>
          </button>
        </div>
      </div>
    </section>
  );
};
