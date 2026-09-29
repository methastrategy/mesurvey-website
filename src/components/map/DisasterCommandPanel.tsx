import React, { useState, useMemo } from 'react';
import {
  DisasterLayerId,
  RainViewerFrame,
  DirectedRiverSegment,
  DamTelemetryStation,
  RiverGaugeStation,
  HydroAlertLevel
} from '../../types/disaster';
import { BASIN_FLOW_TOURS } from '../../data/thailand-hydro-network';
import { MapInteractionMode } from '../../types/map';
import { MapWorkspaceTab } from './MapToolbar';
import {
  Waves,
  Gauge,
  CloudRain,
  Wind,
  Flame,
  Satellite,
  Activity,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  RefreshCw,
  Scissors,
  Navigation,
  EyeOff,
  Search,
  GitBranch
} from 'lucide-react';

interface DisasterCommandPanelProps {
  activeWorkspace: MapWorkspaceTab;
  activeLayers: Record<DisasterLayerId, boolean>;
  onToggleLayer: (layerId: DisasterLayerId) => void;
  onClearCategoryLayers: (category: 'weather' | 'hydro') => void;
  measureMode: MapInteractionMode;
  onSetMeasureMode: (mode: MapInteractionMode) => void;
  // RainViewer Radar controls
  radarFrames: RainViewerFrame[];
  activeRadarIndex: number;
  isRadarPlaying: boolean;
  onSetRadarIndex: (idx: number) => void;
  onToggleRadarPlay: () => void;
  // NASA GIBS Date
  gibsDate: string;
  onChangeGibsDate: (dateStr: string) => void;
  // Basin Flow Tour controls
  selectedTourId: string;
  onSelectTourId: (tourId: string) => void;
  activeTourStepIndex: number | null;
  isTourPlaying: boolean;
  onStartOrToggleTour: () => void;
  onNextTourStep: () => void;
  onStopTour: () => void;
  // Hydro Search & Status Filter (Phase 2)
  rivers?: DirectedRiverSegment[];
  dams?: DamTelemetryStation[];
  gauges?: RiverGaugeStation[];
  statusFilter?: HydroAlertLevel | 'all';
  onChangeStatusFilter?: (filter: HydroAlertLevel | 'all') => void;
  onSelectRiver?: (river: DirectedRiverSegment) => void;
  onSelectDam?: (dam: DamTelemetryStation) => void;
  onSelectGauge?: (gauge: RiverGaugeStation) => void;
  // Telemetry status
  isRefreshing: boolean;
  isLiveApi: boolean;
  onRefreshAll: () => void;
}

interface LayerSpec {
  id: DisasterLayerId;
  category: 'weather' | 'hydro';
  code: string;
  labelTh: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const LAYER_CONFIGS: LayerSpec[] = [
  {
    id: 'river-flow',
    category: 'hydro',
    code: 'H1',
    labelTh: 'แอนิเมชันเส้นทางน้ำไหล',
    subLabel: '60 FPS Particle Flow ตามลำน้ำหลัก',
    icon: Waves
  },
  {
    id: 'dams-gauges',
    category: 'hydro',
    code: 'H2',
    labelTh: 'เขื่อนหลัก & สถานีวัดน้ำท่า',
    subLabel: '15 เขื่อนใหญ่ + 10 สถานีวัดน้ำ GloFAS',
    icon: Gauge
  },
  {
    id: 'rain-radar',
    category: 'weather',
    code: 'W1',
    labelTh: 'เรดาร์ฝนสด (RainViewer)',
    subLabel: 'Doppler Radar ย้อนหลัง 2 ชม.',
    icon: CloudRain
  },
  {
    id: 'wind-storm',
    category: 'weather',
    code: 'W2',
    labelTh: 'สนามลม ฟ้า & ฝนสะสม',
    subLabel: 'ทิศทางลม 10m ความกดอากาศ & PM2.5',
    icon: Wind
  },
  {
    id: 'satellite-cloud',
    category: 'weather',
    code: 'W3',
    labelTh: 'เมฆพายุจากดาวเทียม',
    subLabel: 'NASA GIBS True Color Level 9',
    icon: Satellite
  },
  {
    id: 'wildfire-smoke',
    category: 'weather',
    code: 'W4',
    labelTh: 'จุดความร้อนไฟป่า & ฝุ่นควัน',
    subLabel: 'NASA VIIRS 375m + กรวยควันใต้ลม',
    icon: Flame
  },
  {
    id: 'seismic-dem',
    category: 'weather',
    code: 'W5',
    labelTh: 'แผ่นดินไหวสด (USGS)',
    subLabel: 'ศูนย์เกิดแผ่นดินไหว M2.5+ เรียลไทม์',
    icon: Activity
  }
];

export const DisasterCommandPanel: React.FC<DisasterCommandPanelProps> = ({
  activeWorkspace,
  activeLayers,
  onToggleLayer,
  onClearCategoryLayers,
  measureMode,
  onSetMeasureMode,
  radarFrames,
  activeRadarIndex,
  isRadarPlaying,
  onSetRadarIndex,
  onToggleRadarPlay,
  gibsDate,
  onChangeGibsDate,
  selectedTourId,
  onSelectTourId,
  activeTourStepIndex,
  isTourPlaying,
  onStartOrToggleTour,
  onNextTourStep,
  onStopTour,
  rivers = [],
  dams = [],
  gauges = [],
  statusFilter = 'all',
  onChangeStatusFilter,
  onSelectRiver,
  onSelectDam,
  onSelectGauge,
  isRefreshing,
  isLiveApi,
  onRefreshAll
}) => {
  const [hydroQuery, setHydroQuery] = useState('');

  const statusCounts = useMemo(() => {
    const counts: Record<HydroAlertLevel | 'all', number> = {
      all: dams.length + gauges.length,
      critical: 0,
      warning: 0,
      watch: 0,
      normal: 0,
      drought: 0
    };
    for (const d of dams) {
      const lvl = d.alertLevel ?? 'normal';
      counts[lvl] = (counts[lvl] || 0) + 1;
    }
    for (const g of gauges) {
      const lvl = g.alertLevel ?? 'normal';
      counts[lvl] = (counts[lvl] || 0) + 1;
    }
    return counts;
  }, [dams, gauges]);

  const searchResults = useMemo(() => {
    const q = hydroQuery.trim().toLowerCase();
    if (!q) return null;
    const matchedRivers = rivers
      .filter(
        (r) =>
          r.nameTh.toLowerCase().includes(q) ||
          r.nameEn.toLowerCase().includes(q) ||
          r.basin.toLowerCase().includes(q) ||
          (r.provinces ?? []).some((p) => p.toLowerCase().includes(q))
      )
      .slice(0, 4);
    const matchedDams = dams
      .filter(
        (d) =>
          d.nameTh.toLowerCase().includes(q) ||
          d.nameEn.toLowerCase().includes(q) ||
          d.river.toLowerCase().includes(q) ||
          d.basin.toLowerCase().includes(q)
      )
      .slice(0, 3);
    const matchedGauges = gauges
      .filter(
        (g) =>
          g.nameTh.toLowerCase().includes(q) ||
          g.code.toLowerCase().includes(q) ||
          g.river.toLowerCase().includes(q) ||
          g.province.toLowerCase().includes(q)
      )
      .slice(0, 3);
    return { matchedRivers, matchedDams, matchedGauges };
  }, [hydroQuery, rivers, dams, gauges]);

  // Hidden completely when user is in Standard Map Mode ('survey')
  if (activeWorkspace === 'survey') {
    return null;
  }

  const isHydroMode = activeWorkspace === 'hydro';
  const filteredLayers = LAYER_CONFIGS.filter((l) => l.category === activeWorkspace);
  const activeInCategoryCount = filteredLayers.filter((l) => activeLayers[l.id]).length;

  const currentTour = BASIN_FLOW_TOURS[selectedTourId] || BASIN_FLOW_TOURS.chaophraya;
  const activeTourStep =
    activeTourStepIndex !== null ? currentTour.steps[activeTourStepIndex] : null;

  const currentRadarFrame = radarFrames[activeRadarIndex];
  const radarTimeText = currentRadarFrame
    ? new Date(currentRadarFrame.time * 1000).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '--:--';

  return (
    <aside
      aria-label={
        isHydroMode
          ? 'แผงควบคุมข้อมูลน้ำ เขื่อน และอุทกภัย'
          : 'แผงควบคุมสภาพอากาศ ฟ้า ลม ฝน และภัยธรรมชาติ'
      }
      className="w-full pointer-events-auto select-none"
    >
      <div
        className="p-3 sm:p-3.5 space-y-3 rounded-2xl max-h-[56dvh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.28), 0 4px 12px -2px rgba(0, 0, 0, 0.14)'
        }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)'
              }}
            >
              {isHydroMode ? (
                <Waves className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              ) : (
                <CloudRain className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold tracking-tight truncate" style={{ color: 'var(--text-1)' }}>
                {isHydroMode ? 'ระบบข้อมูลน้ำ & อุทกภัย' : 'สภาพอากาศ ฟ้า · ลม · ฝน'}
              </div>
              <div
                className="text-[10px] font-mono tabular-nums truncate"
                style={{ color: 'var(--text-3)' }}
              >
                เปิดแสดง {activeInCategoryCount}/{filteredLayers.length} ชั้นข้อมูล •{' '}
                {isLiveApi ? 'LIVE REALTIME' : 'OFFLINE SIM'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeInCategoryCount > 0 && (
              <button
                onClick={() => onClearCategoryLayers(isHydroMode ? 'hydro' : 'weather')}
                aria-label="ซ่อนชั้นข้อมูลในหมวดนี้ทั้งหมด"
                title="ซ่อนชั้นข้อมูลที่แสดงบนแผนที่"
                className="min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-2)'
                }}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ซ่อน</span>
              </button>
            )}

            <button
              onClick={onRefreshAll}
              aria-label="อัปเดตข้อมูลสดใหม่"
              title="ดึงข้อมูลสดจาก Open-Meteo / RainViewer / USGS ใหม่"
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-all"
              style={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)'
              }}
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                style={{ color: 'var(--accent)' }}
              />
            </button>
          </div>
        </div>

        {/* Category Layer Cards */}
        <div className="space-y-1.5">
          {filteredLayers.map((layer) => {
            const Icon = layer.icon;
            const isActive = activeLayers[layer.id];
            return (
              <button
                key={layer.id}
                onClick={() => onToggleLayer(layer.id)}
                className="min-h-[44px] min-w-[44px] w-full px-3 py-2.5 rounded-xl flex items-center justify-between gap-2.5 text-left transition-all"
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--surface-2)',
                        border: '1.5px solid var(--accent)',
                        color: 'var(--text-1)',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)'
                      }
                    : {
                        backgroundColor: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-2)'
                      }
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                    style={
                      isActive
                        ? {
                            backgroundColor: 'var(--accent)',
                            color: 'var(--accent-text)'
                          }
                        : {
                            backgroundColor: 'var(--surface)',
                            color: 'var(--text-3)',
                            border: '1px solid var(--border)'
                          }
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{layer.labelTh}</div>
                    <div
                      className="text-[10px] font-mono truncate"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {layer.subLabel}
                    </div>
                  </div>
                </div>

                <span
                  className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 transition-all"
                  style={
                    isActive
                      ? {
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-text)'
                        }
                      : {
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text-3)',
                          border: '1px solid var(--border)'
                        }
                  }
                >
                  {isActive ? 'เปิดอยู่' : 'ปิด'}
                </span>
              </button>
            );
          })}
        </div>

        {/* HYDRO MODE EXCLUSIVE TOOLS: Search, 5-Tier Status Filter, Basin Flow Tour & DEM Cross-Section */}
        {isHydroMode && (
          <div
            className="space-y-2.5 pt-2.5"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {/* Hydro Quick Search Input (Rivers / Canals / Dams / Gauges) */}
            <div className="space-y-1.5">
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-3)' }}
                />
                <input
                  type="search"
                  value={hydroQuery}
                  onChange={(e) => setHydroQuery(e.target.value)}
                  placeholder="ค้นหาแม่น้ำ คลอง เขื่อน สถานีวัดน้ำ..."
                  aria-label="ค้นหาแม่น้ำ คลอง เขื่อน หรือสถานีวัดน้ำ"
                  className="min-h-[44px] w-full pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-1)'
                  }}
                />
              </div>

              {searchResults && (
                <div
                  className="p-2 rounded-xl space-y-1 max-h-48 overflow-y-auto"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border-strong)'
                  }}
                >
                  {searchResults.matchedRivers.length === 0 &&
                    searchResults.matchedDams.length === 0 &&
                    searchResults.matchedGauges.length === 0 && (
                      <div className="text-[11px] py-1 text-center" style={{ color: 'var(--text-3)' }}>
                        ไม่พบสายน้ำ เขื่อน หรือสถานีที่ค้นหา
                      </div>
                    )}

                  {searchResults.matchedRivers.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        onSelectRiver && onSelectRiver(r);
                        setHydroQuery('');
                      }}
                      className="min-h-[44px] min-w-[44px] w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-colors"
                      style={{
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-1)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <span className="inline-flex items-center gap-1.5 font-semibold truncate">
                        <GitBranch className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                        <span className="truncate">{r.nameTh}</span>
                      </span>
                      <span className="font-mono text-[10px] shrink-0" style={{ color: 'var(--text-3)' }}>
                        {r.lengthKm} กม.
                      </span>
                    </button>
                  ))}

                  {searchResults.matchedDams.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        onSelectDam && onSelectDam(d);
                        setHydroQuery('');
                      }}
                      className="min-h-[44px] min-w-[44px] w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-colors"
                      style={{
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-1)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <span className="inline-flex items-center gap-1.5 font-semibold truncate">
                        <Waves className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-2)' }} />
                        <span className="truncate">{d.nameTh}</span>
                      </span>
                      <span className="font-mono text-[10px] shrink-0" style={{ color: 'var(--accent)' }}>
                        {d.currentStoragePct?.toFixed(0)}%
                      </span>
                    </button>
                  ))}

                  {searchResults.matchedGauges.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        onSelectGauge && onSelectGauge(g);
                        setHydroQuery('');
                      }}
                      className="min-h-[44px] min-w-[44px] w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-colors"
                      style={{
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-1)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <span className="inline-flex items-center gap-1.5 font-semibold truncate">
                        <Gauge className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                        <span className="truncate">{g.nameTh}</span>
                      </span>
                      <span className="font-mono text-[10px] shrink-0" style={{ color: 'var(--text-3)' }}>
                        {g.bankCapacityPct?.toFixed(0) ?? '--'}% ตลิ่ง
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5-Tier ThaiWater Status Filter Pills */}
            {onChangeStatusFilter && (
              <div className="space-y-1">
                <div className="text-[10px] font-semibold" style={{ color: 'var(--text-3)' }}>
                  กรองสถานะสถานีวัดน้ำ & เขื่อน ({statusCounts.all} แห่ง)
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'all', label: `ทั้งหมด (${statusCounts.all})`, color: 'var(--accent)' },
                      { id: 'critical', label: `ล้นตลิ่ง (${statusCounts.critical})`, color: '#ef4444' },
                      { id: 'warning', label: `น้ำมาก (${statusCounts.warning})`, color: '#f59e0b' },
                      { id: 'watch', label: `เฝ้าระวัง (${statusCounts.watch})`, color: '#38bdf8' },
                      { id: 'normal', label: `ปกติ (${statusCounts.normal})`, color: '#10b981' },
                      { id: 'drought', label: `น้ำน้อย (${statusCounts.drought})`, color: '#a8a29e' }
                    ] as const
                  ).map((pill) => {
                    const active = statusFilter === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => onChangeStatusFilter(pill.id)}
                        className="min-h-[44px] min-w-[44px] px-2 py-1 rounded-xl font-mono text-[10px] font-bold flex items-center justify-center text-center transition-all"
                        style={
                          active
                            ? {
                                backgroundColor: 'var(--surface-2)',
                                color: pill.color,
                                border: `1.5px solid ${pill.color}`
                              }
                            : {
                                backgroundColor: 'var(--surface-2)',
                                color: 'var(--text-2)',
                                border: '1px solid var(--border)'
                              }
                        }
                      >
                        <span className="truncate">{pill.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="basin-tour-select"
                className="block text-[11px] font-semibold"
                style={{ color: 'var(--text-2)' }}
              >
                บินสำรวจเส้นทางน้ำไหล (Basin Flow Tour)
              </label>
              <select
                id="basin-tour-select"
                value={selectedTourId}
                onChange={(e) => onSelectTourId(e.target.value)}
                className="min-h-[44px] min-w-[44px] w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-1)'
                }}
              >
                {Object.values(BASIN_FLOW_TOURS).map((tour) => (
                  <option
                    key={tour.id}
                    value={tour.id}
                    style={{ backgroundColor: 'var(--surface)', color: 'var(--text-1)' }}
                  >
                    {tour.nameTh}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onStartOrToggleTour}
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={
                  activeTourStepIndex !== null
                    ? {
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-text)',
                        border: '1px solid var(--accent)'
                      }
                    : {
                        backgroundColor: 'var(--surface-2)',
                        color: 'var(--text-1)',
                        border: '1px solid var(--border)'
                      }
                }
                title="กดเพื่อให้กล้องค่อยๆ ซูมไล่ตามเส้นทางน้ำไหลจากต้นน้ำสู่ปลายน้ำ"
              >
                {isTourPlaying ? (
                  <Pause className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                )}
                <span className="truncate">
                  {activeTourStepIndex !== null
                    ? isTourPlaying
                      ? 'หยุดทัวร์ชั่วคราว'
                      : 'เล่นทัวร์ต่อ'
                    : 'เริ่มบินไล่เส้นทางน้ำ'}
                </span>
              </button>

              <button
                onClick={() =>
                  onSetMeasureMode(measureMode === 'cross-section' ? 'none' : 'cross-section')
                }
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={
                  measureMode === 'cross-section'
                    ? {
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-text)',
                        border: '1px solid var(--accent)'
                      }
                    : {
                        backgroundColor: 'var(--surface-2)',
                        color: 'var(--text-1)',
                        border: '1px solid var(--border)'
                      }
                }
                title="คลิก 2 จุดตัดขวางลำน้ำเพื่อสร้างรูปตัดความสูง DEM และจำลองระดับน้ำท่วม"
              >
                <Scissors className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">ตัดขวางลำน้ำ DEM</span>
              </button>
            </div>

            {/* Active Basin Flow Tour Step Card */}
            {activeTourStep && (
              <div
                className="p-3 rounded-xl space-y-2"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--border-strong)'
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="font-mono tabular-nums text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--surface)',
                      color: 'var(--accent)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    สถานี {activeTourStep.stepOrder}/{currentTour.steps.length} • {activeTourStep.stationCode}
                  </span>
                  <span
                    className="font-mono tabular-nums text-[10px]"
                    style={{ color: 'var(--text-3)' }}
                  >
                    เวลาคลื่นน้ำ: +{activeTourStep.lagTimeHoursFromOrigin} ชม.
                  </span>
                </div>

                <div className="text-xs font-bold leading-snug" style={{ color: 'var(--text-1)' }}>
                  {activeTourStep.titleTh}
                </div>
                <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  {activeTourStep.engineeringNoteTh}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={onNextTourStep}
                    aria-label="ข้ามไปสถานีถัดไป"
                    className="min-h-[44px] min-w-[44px] flex-1 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                    style={{
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-1)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>สถานีถัดไป</span>
                  </button>

                  <button
                    onClick={onStopTour}
                    aria-label="จบการทัวร์ลุ่มน้ำ"
                    className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                    style={{
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-2)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ปิดทัวร์</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WEATHER MODE EXCLUSIVE CONTROLS: RainViewer Scrubber & NASA GIBS Date */}
        {!isHydroMode && activeLayers['rain-radar'] && radarFrames.length > 0 && (
          <div
            className="p-3 rounded-xl space-y-2"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)'
            }}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>ไทม์ไลน์เรดาร์ฝน (RainViewer)</span>
              <span className="font-mono tabular-nums" style={{ color: 'var(--accent)' }}>
                {radarTimeText} น.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleRadarPlay}
                aria-label={isRadarPlaying ? 'หยุดเล่นเรดาร์ฝน' : 'เล่นแอนิเมชันเรดาร์ฝน'}
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-text)',
                  border: '1px solid var(--accent)'
                }}
              >
                {isRadarPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={Math.max(0, radarFrames.length - 1)}
                value={activeRadarIndex}
                onChange={(e) => onSetRadarIndex(Number(e.target.value))}
                aria-label="เลื่อนเวลาเรดาร์ฝน"
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
            </div>
          </div>
        )}

        {!isHydroMode && (activeLayers['wildfire-smoke'] || activeLayers['satellite-cloud']) && (
          <div
            className="p-3 rounded-xl space-y-1.5"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)'
            }}
          >
            <label
              htmlFor="nasa-gibs-date"
              className="block text-[11px] font-semibold"
              style={{ color: 'var(--text-2)' }}
            >
              วันที่ข้อมูลภาพดาวเทียม NASA GIBS (VIIRS/MODIS)
            </label>
            <input
              id="nasa-gibs-date"
              type="date"
              value={gibsDate}
              onChange={(e) => onChangeGibsDate(e.target.value)}
              className="min-h-[44px] w-full px-3 py-1.5 rounded-xl font-mono tabular-nums text-xs"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)'
              }}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
