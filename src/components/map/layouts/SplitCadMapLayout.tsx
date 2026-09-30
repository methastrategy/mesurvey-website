import React, { useState } from 'react';
import {
  Compass,
  CloudRain,
  Waves,
  Crosshair,
  Ruler,
  Square,
  Undo2,
  RotateCcw,
  FolderUp,
  ArrowLeft,
  Navigation,
  Bookmark,
  Table,
  Layers,
  MapPin
} from 'lucide-react';
import { CommonMapLayoutProps } from './types';
import { SURVEY_BOOKMARKS } from '../../../data/survey-presets';
import { BasemapProvider } from '../../../types/map';
import { MeMapsSearchBox } from '../memaps/MeMapsSearchBox';
import { MeMapsDirectionsPanel } from '../memaps/MeMapsDirectionsPanel';
import { MeMapsPlaceCard } from '../memaps/MeMapsPlaceCard';
import { MeMapsSavedPlacesPanel } from '../memaps/MeMapsSavedPlacesPanel';
import { PlaceSearchResult } from '../../../types/memaps';

export const SplitCadMapLayout: React.FC<CommonMapLayoutProps> = ({
  currentBasemap,
  onSelectBasemap,
  activeWorkspace,
  onSelectWorkspace,
  measureMode,
  onSetMeasureMode,
  onClearMeasurements,
  onUndoPoint,
  canUndo = false,
  onLocateMe,
  onSelectBookmark,
  onOpenUploader,
  telemetry,
  measurePoints = [],
  measurementResultText,
  onSendToCalculator,
  disasterPanel,
  hydroDrawer,
  activeLayout,
  onChangeLayout,
  // MeMaps Integration
  activePlace,
  onSelectPlace,
  originPlace,
  destinationPlace,
  onSelectOrigin,
  onSelectDestination,
  activeRoute,
  onRouteCalculated,
  onSendToSurveyTable,
  savedPlacesRefresh,
  onPlaceSaved
}) => {
  const [workbenchTab, setWorkbenchTab] = useState<'memaps' | 'cad' | 'saved'>('memaps');

  const basemaps: { id: BasemapProvider; label: string }[] = [
    { id: 'satellite', label: 'ดาวเทียม' },
    { id: 'osm', label: 'ถนน' },
    { id: 'topo', label: 'ภูมิประเทศ' },
    { id: 'dark', label: 'มืด' }
  ];

  const handlePlaceSelect = (place: PlaceSearchResult) => {
    if (onSelectPlace) {
      onSelectPlace(place);
    }
  };

  const handleSetAsOrigin = (place: PlaceSearchResult) => {
    onSelectOrigin?.(place);
    setWorkbenchTab('memaps');
  };

  const handleSetAsDestination = (place: PlaceSearchResult) => {
    onSelectDestination?.(place);
    setWorkbenchTab('memaps');
  };

  const handleBridgePlaceToSurvey = (station: {
    name: string;
    lat: number;
    lng: number;
    utmE: number;
    utmN: number;
  }) => {
    if (onSendToSurveyTable) {
      onSendToSurveyTable([station]);
      setWorkbenchTab('cad');
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col justify-between p-3.5 sm:p-4 overflow-y-auto pointer-events-auto border-r select-none"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Top Header & App Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.location.hash = '#/knowledge';
              }}
              aria-label="กลับสู่หน้าหลัก"
              className="p-1.5 sm:p-2 rounded-xl transition-all hover:bg-[var(--surface-2)] text-[var(--accent)]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide font-mono text-[var(--text-1)] flex items-center gap-1.5">
                <span>MEMAPS CAD STUDIO</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  PRO
                </span>
              </span>
              <span className="text-[10px] font-mono text-[var(--text-3)] uppercase">
                Dual Precision Cartography & Geodesy
              </span>
            </div>
          </div>
        </div>

        {/* 3-Tab Workbench Switcher */}
        <div
          className="grid grid-cols-3 gap-1 p-1 rounded-xl border text-xs font-semibold"
          style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => setWorkbenchTab('memaps')}
            className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              workbenchTab === 'memaps'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="truncate">นำทาง & ค้นหา</span>
          </button>

          <button
            onClick={() => setWorkbenchTab('cad')}
            className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              workbenchTab === 'cad'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="truncate">โต๊ะรังวัด CAD</span>
          </button>

          <button
            onClick={() => setWorkbenchTab('saved')}
            className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              workbenchTab === 'saved'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="truncate">หมุดบันทึก</span>
          </button>
        </div>

        {/* TAB 1: MEMAPS NAVIGATION & SEARCH */}
        {workbenchTab === 'memaps' && (
          <div className="space-y-3">
            {/* Search Box */}
            <MeMapsSearchBox onSelectPlace={handlePlaceSelect} />

            {/* Active Place Details Card (if place selected or clicked) */}
            {activePlace && (
              <MeMapsPlaceCard
                place={activePlace}
                onClose={() => onSelectPlace?.(null)}
                onSetAsOrigin={handleSetAsOrigin}
                onSetAsDestination={handleSetAsDestination}
                onSendToSurvey={handleBridgePlaceToSurvey}
                onSaved={onPlaceSaved}
              />
            )}

            {/* Directions & Turn-by-Turn Panel */}
            <MeMapsDirectionsPanel
              originPlace={originPlace || null}
              destinationPlace={destinationPlace || null}
              onSelectOrigin={onSelectOrigin || (() => {})}
              onSelectDestination={onSelectDestination || (() => {})}
              onRouteCalculated={onRouteCalculated || (() => {})}
              onSendToSurvey={(orig, dest) => {
                if (onSendToSurveyTable) {
                  onSendToSurveyTable([
                    { name: orig.name, lat: orig.lat, lng: orig.lng },
                    { name: dest.name, lat: dest.lat, lng: dest.lng }
                  ]);
                  setWorkbenchTab('cad');
                }
              }}
            />
          </div>
        )}

        {/* TAB 2: CAD SURVEY WORKBENCH & MEASUREMENT TOOLS */}
        {workbenchTab === 'cad' && (
          <div className="space-y-3">
            {/* Live Coordinate Telemetry Card */}
            {telemetry && (
              <div
                className="p-3 rounded-xl border space-y-1.5 font-mono text-xs shadow-xs"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  borderColor: 'var(--border)'
                }}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-3)]">พิกัดภูมิศาสตร์ (WGS84)</span>
                  <span className="font-bold text-[var(--accent)] tabular-nums">
                    {telemetry.lat.toFixed(6)}°N, {telemetry.lng.toFixed(6)}°E
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-3)]">พิกัดฉาก (UTM {telemetry.zone}N)</span>
                  <span className="font-bold text-[var(--text-1)] tabular-nums">
                    E: {telemetry.utmE.toFixed(2)}m • N: {telemetry.utmN.toFixed(2)}m
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[var(--border)]">
                  <span className="text-[var(--text-3)]">DATUM: WGS84 (G1762)</span>
                  <span className="text-[var(--text-3)]">ZOOM LEVEL: {telemetry.zoom}</span>
                </div>
              </div>
            )}

            {/* Bookmarks Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-2)]">
                หมุดหลักฐานอ้างอิง RTSD & หมุดควบคุม:
              </label>
              <select
                onChange={(e) => {
                  const bm = SURVEY_BOOKMARKS.find((b) => b.id === e.target.value);
                  if (bm) onSelectBookmark(bm);
                }}
                defaultValue=""
                aria-label="ค้นหาหมุดหลักฐานอ้างอิง"
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer truncate border"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-1)'
                }}
              >
                <option value="" disabled style={{ backgroundColor: 'var(--surface)', color: 'var(--text-3)' }}>
                  ค้นหาหมุดหลักฐานอ้างอิง...
                </option>
                {SURVEY_BOOKMARKS.map((b) => (
                  <option key={b.id} value={b.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--text-1)' }}>
                    {b.name} ({b.description})
                  </option>
                ))}
              </select>
            </div>

            {/* Workspaces Strip */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <button
                onClick={() => onSelectWorkspace('survey')}
                className="py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                style={
                  activeWorkspace === 'survey'
                    ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                    : { color: 'var(--text-2)' }
                }
              >
                <Compass className="w-3.5 h-3.5" />
                <span>สำรวจ</span>
              </button>
              <button
                onClick={() => onSelectWorkspace('weather')}
                className="py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                style={
                  activeWorkspace === 'weather'
                    ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                    : { color: 'var(--text-2)' }
                }
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>ฟ้าฝน</span>
              </button>
              <button
                onClick={() => onSelectWorkspace('hydro')}
                className="py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                style={
                  activeWorkspace === 'hydro'
                    ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                    : { color: 'var(--text-2)' }
                }
              >
                <Waves className="w-3.5 h-3.5" />
                <span>ข้อมูลน้ำ</span>
              </button>
            </div>

            {/* Measurement Toolbar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-2)]">
                <span>เครื่องมือวัดและเขียนแบบ:</span>
                {measurePoints.length > 0 && (
                  <button
                    onClick={onClearMeasurements}
                    className="text-rose-500 hover:underline flex items-center gap-1 text-[10px]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>ล้างการวัด</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => onSetMeasureMode(measureMode === 'inspect' ? 'none' : 'inspect')}
                  className="p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all"
                  style={
                    measureMode === 'inspect'
                      ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)', borderColor: 'var(--accent)' }
                      : { backgroundColor: 'var(--surface-2)', color: 'var(--text-2)', borderColor: 'transparent' }
                  }
                >
                  <Crosshair className="w-4 h-4" />
                  <span className="text-[10px]">ส่องพิกัด</span>
                </button>

                <button
                  onClick={() => onSetMeasureMode(measureMode === 'distance' ? 'none' : 'distance')}
                  className="p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all"
                  style={
                    measureMode === 'distance'
                      ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)', borderColor: 'var(--accent)' }
                      : { backgroundColor: 'var(--surface-2)', color: 'var(--text-2)', borderColor: 'transparent' }
                  }
                >
                  <Ruler className="w-4 h-4" />
                  <span className="text-[10px]">วัดระยะ</span>
                </button>

                <button
                  onClick={() => onSetMeasureMode(measureMode === 'area' ? 'none' : 'area')}
                  className="p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all"
                  style={
                    measureMode === 'area'
                      ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)', borderColor: 'var(--accent)' }
                      : { backgroundColor: 'var(--surface-2)', color: 'var(--text-2)', borderColor: 'transparent' }
                  }
                >
                  <Square className="w-4 h-4" />
                  <span className="text-[10px]">คำนวณไร่</span>
                </button>

                <button
                  onClick={onOpenUploader}
                  className="p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all hover:bg-[var(--surface-2)]"
                  style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-2)', borderColor: 'transparent' }}
                >
                  <FolderUp className="w-4 h-4" />
                  <span className="text-[10px]">GeoJSON</span>
                </button>
              </div>
            </div>

            {/* Measured Stations & CAD Coordinate Table */}
            <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[var(--text-1)] flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>รายการสถานีที่ทำการวัด ({measurePoints.length} จุด)</span>
                </span>
                {canUndo && (
                  <button
                    onClick={onUndoPoint}
                    className="text-[10px] text-amber-500 font-mono flex items-center gap-1 hover:underline"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>ย้อนหมุด</span>
                  </button>
                )}
              </div>

              {measurePoints.length === 0 ? (
                <div
                  className="p-4 rounded-xl border border-dashed text-center font-mono text-xs space-y-1"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
                >
                  <div>ยังไม่มีจุดพิกัดจากการวัด</div>
                  <div className="text-[10px]">คลิกเลือกเครื่องมือ "วัดระยะ" หรือ "คำนวณไร่" เพื่อจิ้มจุดบนแผนที่</div>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                  <table className="w-full text-[11px] font-mono tabular-nums text-left border-collapse">
                    <thead style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-3)' }}>
                      <tr>
                        <th className="p-1.5 border-b border-[var(--border)]">#</th>
                        <th className="p-1.5 border-b border-[var(--border)]">Lat</th>
                        <th className="p-1.5 border-b border-[var(--border)]">Lng</th>
                        <th className="p-1.5 border-b border-[var(--border)] text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurePoints.map((pt, idx) => (
                        <tr key={idx} className="hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border)]/50">
                          <td className="p-1.5 font-bold text-[var(--accent)]">STN-{idx + 1}</td>
                          <td className="p-1.5">{pt.lat.toFixed(5)}°</td>
                          <td className="p-1.5">{pt.lng.toFixed(5)}°</td>
                          <td className="p-1.5 text-right">
                            <button
                              onClick={() => {
                                if (onSendToCalculator) onSendToCalculator(pt.lat, pt.lng);
                              }}
                              title="ส่งจุดนี้เข้าหน้าคำนวณ"
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface-2)] hover:bg-[var(--accent)] hover:text-white transition-colors"
                            >
                              ส่งคำนวณ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {measurementResultText && (
                <div
                  className="p-3 rounded-xl border font-mono text-xs space-y-1"
                  style={{
                    backgroundColor: 'rgba(204, 120, 92, 0.08)',
                    borderColor: 'var(--accent)',
                    color: 'var(--text-1)'
                  }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                    ผลการคำนวณสด (Live Computed Geometry)
                  </div>
                  <div className="font-bold text-sm text-[var(--accent)]">
                    {measurementResultText}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SAVED SURVEY MARKS & PLACES */}
        {workbenchTab === 'saved' && (
          <div className="space-y-3">
            <MeMapsSavedPlacesPanel
              onSelectPlace={handlePlaceSelect}
              onSetAsDestination={handleSetAsDestination}
              onSendToSurvey={(stations) => {
                if (onSendToSurveyTable) {
                  onSendToSurveyTable(stations);
                  setWorkbenchTab('cad');
                }
              }}
              refreshTrigger={savedPlacesRefresh}
            />
          </div>
        )}
      </div>

      {/* Bottom Action Footer: Basemaps & Drawer Overlays */}
      <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-2)] mb-1">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>แผนที่ฐาน (Basemaps):</span>
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl border text-[11px]" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          {basemaps.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBasemap(b.id)}
              className="py-1 rounded-lg transition-all font-semibold"
              style={
                currentBasemap === b.id
                  ? { backgroundColor: 'var(--surface)', color: 'var(--accent)', fontWeight: 700 }
                  : { color: 'var(--text-3)' }
              }
            >
              {b.label}
            </button>
          ))}
        </div>

        {activeWorkspace !== 'survey' && disasterPanel && (
          <div className="max-h-48 overflow-y-auto rounded-xl border p-1" style={{ borderColor: 'var(--border)' }}>
            {disasterPanel}
          </div>
        )}

        {hydroDrawer}
      </div>
    </div>
  );
};
