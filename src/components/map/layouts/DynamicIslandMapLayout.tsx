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
  Layers,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  Navigation,
  Bookmark,
  Table,
  Car,
  Check
} from 'lucide-react';
import { CommonMapLayoutProps } from './types';
import { SURVEY_BOOKMARKS } from '../../../data/survey-presets';
import { BasemapProvider } from '../../../types/map';
import { MeMapsSearchBox } from '../memaps/MeMapsSearchBox';
import { MeMapsDirectionsPanel } from '../memaps/MeMapsDirectionsPanel';
import { MeMapsPlaceCard } from '../memaps/MeMapsPlaceCard';
import { MeMapsSavedPlacesPanel } from '../memaps/MeMapsSavedPlacesPanel';
import { PlaceSearchResult } from '../../../types/memaps';

export const DynamicIslandMapLayout: React.FC<CommonMapLayoutProps> = ({
  currentBasemap,
  onSelectBasemap,
  activeWorkspace,
  onSelectWorkspace,
  activeOverlayCount,
  onClearAllOverlays,
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeIslandTab, setActiveIslandTab] = useState<'search' | 'saved' | 'cad'>('search');
  const [isCommandDrawerOpen, setIsCommandDrawerOpen] = useState(false);

  const handlePlaceSelect = (place: PlaceSearchResult) => {
    onSelectPlace?.(place);
  };

  const handleSetAsOrigin = (place: PlaceSearchResult) => {
    onSelectOrigin?.(place);
    setIsExpanded(true);
    setActiveIslandTab('search');
  };

  const handleSetAsDestination = (place: PlaceSearchResult) => {
    onSelectDestination?.(place);
    setIsExpanded(true);
    setActiveIslandTab('search');
  };

  return (
    <>
      {/* ========================================================= */}
      {/* TOP FLOATING DYNAMIC ISLAND CAPSULE (Top-Left Aligned)    */}
      {/* ========================================================= */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-[1010] flex flex-col items-start max-w-[96vw] pointer-events-auto">
        {/* The Capsule Pill Header */}
        <div className="flex items-center gap-2">
          {/* Back to Home Button */}
          <button
            onClick={() => {
              window.location.hash = '#/knowledge';
            }}
            aria-label="กลับหน้าหลัก"
            title="กลับหน้าหลัก (MESURV)"
            className="min-h-[42px] min-w-[42px] p-2 rounded-full shadow-lg border flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 backdrop-blur-xl text-slate-700 dark:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>

          {/* Dynamic Island Capsule Body */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="group flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 sm:py-2 rounded-full border shadow-2xl transition-all cursor-pointer bg-white/90 dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800/90 backdrop-blur-2xl hover:border-blue-400 dark:hover:border-blue-600"
          >
            {/* Pulsing Status Dot */}
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-[0_0_8px_#10b981]" />

            {/* Active Context Content inside Pill */}
            {activeRoute ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  <span>กำลังนำทาง</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[130px] sm:max-w-[220px]">
                  {activeRoute.summary}
                </span>
              </div>
            ) : activePlace ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold">
                  📍 {activePlace.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  {activePlace.lat.toFixed(4)}°, {activePlace.lng.toFixed(4)}°
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 font-mono tracking-tight">
                  <span className="text-blue-600 dark:text-blue-400 font-extrabold">MEMAPS</span>
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[140px] sm:max-w-[240px]">
                  🔍 ค้นหาหมุดรังวัด, ขอเส้นทาง...
                </span>
              </div>
            )}

            {/* Telemetry Badge (Desktop) */}
            {telemetry && (
              <span className="hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Zone {telemetry.zone}N
              </span>
            )}

            {/* Expand / Collapse Icon */}
            <div className="p-1 rounded-full text-slate-400 group-hover:text-blue-600 transition">
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* EXPANDED DYNAMIC ISLAND MODAL / WORKBENCH CARD            */}
        {/* ========================================================= */}
        {isExpanded && (
          <div className="mt-2 w-[95vw] max-w-[460px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 space-y-3 max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Island Header with Tabs & Close */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setActiveIslandTab('search')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeIslandTab === 'search'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>ค้นหา & นำทาง</span>
                </button>

                <button
                  onClick={() => setActiveIslandTab('saved')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeIslandTab === 'saved'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>หมุดบันทึก</span>
                </button>

                <button
                  onClick={() => setActiveIslandTab('cad')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeIslandTab === 'cad'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>โต๊ะรังวัด</span>
                </button>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="ย่อแถบ Dynamic Island"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: Search & Directions Panel */}
            {activeIslandTab === 'search' && (
              <div className="space-y-3">
                <MeMapsSearchBox onSelectPlace={handlePlaceSelect} />

                {/* If place selected, show mini place card inside island */}
                {activePlace && (
                  <MeMapsPlaceCard
                    place={activePlace}
                    onClose={() => onSelectPlace?.(null)}
                    onSetAsOrigin={handleSetAsOrigin}
                    onSetAsDestination={handleSetAsDestination}
                    onSendToSurvey={(st) => {
                      onSendToSurveyTable?.([st]);
                      setActiveIslandTab('cad');
                    }}
                    onSaved={onPlaceSaved}
                  />
                )}

                {/* Directions with turn-by-turn guidance */}
                <MeMapsDirectionsPanel
                  originPlace={originPlace || null}
                  destinationPlace={destinationPlace || null}
                  onSelectOrigin={onSelectOrigin || (() => {})}
                  onSelectDestination={onSelectDestination || (() => {})}
                  onRouteCalculated={onRouteCalculated || (() => {})}
                  onSendToSurvey={(orig, dest) => {
                    onSendToSurveyTable?.([
                      { name: orig.name, lat: orig.lat, lng: orig.lng },
                      { name: dest.name, lat: dest.lat, lng: dest.lng }
                    ]);
                    setActiveIslandTab('cad');
                  }}
                />
              </div>
            )}

            {/* TAB 2: Saved Places */}
            {activeIslandTab === 'saved' && (
              <div className="space-y-3">
                <MeMapsSavedPlacesPanel
                  onSelectPlace={handlePlaceSelect}
                  onSetAsDestination={handleSetAsDestination}
                  onSendToSurvey={(stations) => {
                    onSendToSurveyTable?.(stations);
                    setActiveIslandTab('cad');
                  }}
                  refreshTrigger={savedPlacesRefresh}
                />
              </div>
            )}

            {/* TAB 3: CAD Survey Stations */}
            {activeIslandTab === 'cad' && (
              <div className="space-y-3">
                {/* Live Geodetic Telemetry */}
                {telemetry && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">พิกัด WGS84:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {telemetry.lat.toFixed(6)}°N, {telemetry.lng.toFixed(6)}°E
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">ระบบพิกัดฉาก UTM:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                        Zone {telemetry.zone}N • E: {telemetry.utmE.toFixed(1)}m, N: {telemetry.utmN.toFixed(1)}m
                      </span>
                    </div>
                  </div>
                )}

                {/* RTSD Bookmarks quick select */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    หมุดหลักฐานอ้างอิง RTSD & หมุดควบคุม:
                  </label>
                  <select
                    onChange={(e) => {
                      const bm = SURVEY_BOOKMARKS.find((b) => b.id === e.target.value);
                      if (bm) onSelectBookmark(bm);
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none"
                  >
                    <option value="" disabled>เลือกหมุดหลักฐานอ้างอิง...</option>
                    {SURVEY_BOOKMARKS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.description})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stations Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1 font-mono">
                      <Table className="w-3.5 h-3.5 text-emerald-500" />
                      <span>สถานีที่ทำการวัด ({measurePoints.length})</span>
                    </span>
                    {canUndo && (
                      <button
                        onClick={onUndoPoint}
                        className="text-[10px] text-amber-500 hover:underline flex items-center gap-1"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>ย้อนหมุด</span>
                      </button>
                    )}
                  </div>

                  {measurePoints.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 font-mono">
                      ยังไม่มีจุดพิกัดในตารางรังวัด
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-[11px] font-mono tabular-nums text-left border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500">
                          <tr>
                            <th className="p-1.5">#</th>
                            <th className="p-1.5">Lat</th>
                            <th className="p-1.5">Lng</th>
                            <th className="p-1.5 text-right">ส่งคำนวณ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {measurePoints.map((pt, idx) => (
                            <tr key={idx} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-1.5 font-bold text-emerald-600">STN-{idx + 1}</td>
                              <td className="p-1.5">{pt.lat.toFixed(5)}°</td>
                              <td className="p-1.5">{pt.lng.toFixed(5)}°</td>
                              <td className="p-1.5 text-right">
                                <button
                                  onClick={() => onSendToCalculator?.(pt.lat, pt.lng)}
                                  className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-[10px] rounded hover:bg-blue-600 hover:text-white transition"
                                >
                                  คำนวณ
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* FLOATING ACTION DOCK (Bottom Center)                      */}
      {/* ========================================================= */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1010] flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl pointer-events-auto select-none">
        {/* Survey Tools: Inspect */}
        <button
          onClick={() => onSetMeasureMode(measureMode === 'inspect' ? 'none' : 'inspect')}
          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            measureMode === 'inspect'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="ส่องพิกัดละเอียด (Inspect)"
        >
          <Crosshair className="w-4 h-4" />
          <span className="hidden sm:inline">ส่องพิกัด</span>
        </button>

        {/* Distance Measure */}
        <button
          onClick={() => onSetMeasureMode(measureMode === 'distance' ? 'none' : 'distance')}
          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            measureMode === 'distance'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="วัดระยะทาง (Distance)"
        >
          <Ruler className="w-4 h-4" />
          <span className="hidden sm:inline">วัดระยะ</span>
        </button>

        {/* Area Measure */}
        <button
          onClick={() => onSetMeasureMode(measureMode === 'area' ? 'none' : 'area')}
          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            measureMode === 'area'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="คำนวณเนื้อที่ ไร่-งาน-วา (Area)"
        >
          <Square className="w-4 h-4" />
          <span className="hidden sm:inline">คำนวณไร่</span>
        </button>

        {/* GeoJSON Uploader */}
        <button
          onClick={onOpenUploader}
          className="p-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-all"
          title="เปิดไฟล์ GeoJSON"
        >
          <FolderUp className="w-4 h-4" />
          <span className="hidden sm:inline">GeoJSON</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Weather / Hydro Drawer Button */}
        <button
          onClick={() => setIsCommandDrawerOpen(!isCommandDrawerOpen)}
          className={`p-2 rounded-xl text-xs font-semibold transition ${
            activeOverlayCount > 0 || isCommandDrawerOpen
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="ข้อมูลภัยพิบัติ น้ำ และสภาพอากาศ"
        >
          <Waves className="w-4 h-4" />
        </button>

        {/* Clear measurements if active */}
        {measurePoints.length > 0 && (
          <button
            onClick={onClearMeasurements}
            className="p-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            title="ล้างการวัด"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Multi-hazard & Weather Drawer Overlay */}
      {isCommandDrawerOpen && (
        <div className="absolute bottom-20 left-4 z-[1005] w-[92vw] max-w-[360px] max-h-[50vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-3 space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-blue-500" />
              <span>ฟ้าฝน & ลุ่มน้ำโทรมาตร</span>
            </span>
            <button
              onClick={() => setIsCommandDrawerOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {disasterPanel}
          {hydroDrawer}
        </div>
      )}
    </>
  );
};
