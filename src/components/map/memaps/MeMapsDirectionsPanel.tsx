import React, { useState } from 'react';
import {
  Car,
  Footprints,
  Bike,
  ArrowUpDown,
  Navigation,
  Clock,
  Milestone,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { PlaceSearchResult, RouteResult, TravelMode } from '../../../types/memaps';
import { fetchRoute } from '../../../core/memaps-services';

interface MeMapsDirectionsPanelProps {
  originPlace: PlaceSearchResult | null;
  destinationPlace: PlaceSearchResult | null;
  onSelectOrigin: (place: PlaceSearchResult | null) => void;
  onSelectDestination: (place: PlaceSearchResult | null) => void;
  onRouteCalculated: (route: RouteResult | null) => void;
  onSendToSurvey?: (origin: PlaceSearchResult, dest: PlaceSearchResult) => void;
  className?: string;
}

export const MeMapsDirectionsPanel: React.FC<MeMapsDirectionsPanelProps> = ({
  originPlace,
  destinationPlace,
  onSelectOrigin,
  onSelectDestination,
  onRouteCalculated,
  onSendToSurvey,
  className = ''
}) => {
  const [mode, setMode] = useState<TravelMode>('driving');
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(true);

  // Swap Origin and Destination
  const handleSwap = () => {
    const temp = originPlace;
    onSelectOrigin(destinationPlace);
    onSelectDestination(temp);
    if (routeResult) {
      // Recalculate route if both points exist
      if (destinationPlace && temp) {
        calculateRoute(destinationPlace, temp, mode);
      }
    }
  };

  const calculateRoute = async (
    start: PlaceSearchResult,
    end: PlaceSearchResult,
    travelMode: TravelMode
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchRoute(
        { lat: start.lat, lng: start.lng },
        { lat: end.lat, lng: end.lng },
        travelMode
      );
      setRouteResult(res);
      onRouteCalculated(res);
    } catch (err: any) {
      console.error('Route error', err);
      setError(err.message || 'ไม่สามารถค้นหาเส้นทางได้');
      setRouteResult(null);
      onRouteCalculated(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: TravelMode) => {
    setMode(newMode);
    if (originPlace && destinationPlace) {
      calculateRoute(originPlace, destinationPlace, newMode);
    }
  };

  const handleClear = () => {
    setRouteResult(null);
    setError(null);
    onRouteCalculated(null);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm ${className}`}>
      {/* Travel Mode Selector */}
      <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-4 text-xs font-medium">
        <button
          onClick={() => handleModeChange('driving')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all duration-150 ease-spring hover:scale-[1.02] active:scale-95 ${
            mode === 'driving'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>ขับรถ</span>
        </button>
        <button
          onClick={() => handleModeChange('walking')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all duration-150 ease-spring hover:scale-[1.02] active:scale-95 ${
            mode === 'walking'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Footprints className="w-3.5 h-3.5" />
          <span>เดิน</span>
        </button>
        <button
          onClick={() => handleModeChange('cycling')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all duration-150 ease-spring hover:scale-[1.02] active:scale-95 ${
            mode === 'cycling'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>จักรยาน</span>
        </button>
      </div>

      {/* Origin & Destination inputs */}
      <div className="space-y-2 relative">
        {/* Origin */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-100 flex-shrink-0 ml-1" />
          <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs truncate">
            {originPlace ? (
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {originPlace.name}
              </span>
            ) : (
              <span className="text-slate-400">เลือกจุดเริ่มต้น (คลิกบนแผนที่หรือค้นหา)</span>
            )}
          </div>
          {originPlace && (
            <button
              onClick={() => onSelectOrigin(null)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              title="ลบจุดเริ่มต้น"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Swap button */}
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={handleSwap}
            disabled={!originPlace && !destinationPlace}
            className="p-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 transition-all duration-150 ease-spring hover:scale-110 active:scale-90"
            title="สลับจุดเริ่มต้นและจุดหมาย"
          >
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>

        {/* Destination */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-rose-500 bg-rose-100 flex-shrink-0 ml-1" />
          <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs truncate">
            {destinationPlace ? (
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {destinationPlace.name}
              </span>
            ) : (
              <span className="text-slate-400">เลือกจุดหมายปลายทาง</span>
            )}
          </div>
          {destinationPlace && (
            <button
              onClick={() => onSelectDestination(null)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              title="ลบจุดหมาย"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Action Button: Get Directions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            if (originPlace && destinationPlace) {
              calculateRoute(originPlace, destinationPlace, mode);
            }
          }}
          disabled={!originPlace || !destinationPlace || isLoading}
          className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all duration-150 ease-spring hover:scale-[1.01]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>กำลังคำนวณเส้นทาง...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>ขอเส้นทางนำทาง</span>
            </>
          )}
        </button>

        {routeResult && (
          <button
            onClick={handleClear}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-xs rounded-xl transition-all duration-150 ease-spring hover:scale-[1.02] active:scale-95"
            title="ล้างเส้นทาง"
          >
            ล้าง
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Route Result Summary Card */}
      {routeResult && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-xl p-3">
            <div>
              <div className="text-base font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>
                  {Math.round(routeResult.durationSeconds / 60) >= 60
                    ? `${Math.floor(Math.round(routeResult.durationSeconds / 60) / 60)} ชม. ${Math.round(routeResult.durationSeconds / 60) % 60} นาที`
                    : `${Math.max(1, Math.round(routeResult.durationSeconds / 60))} นาที`}
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                <Milestone className="w-3.5 h-3.5" />
                <span>
                  {routeResult.distanceMeters >= 1000
                    ? `${(routeResult.distanceMeters / 1000).toFixed(1)} กม.`
                    : `${routeResult.distanceMeters} ม.`}
                </span>
                <span className="text-[11px] text-slate-400 ml-1 font-sans">
                  ({routeResult.steps.length} เลี้ยว)
                </span>
              </div>
            </div>

            {onSendToSurvey && originPlace && destinationPlace && (
              <button
                onClick={() => onSendToSurvey(originPlace, destinationPlace)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 shadow-xs transition-all duration-150 ease-spring hover:scale-[1.02] active:scale-95"
                title="ส่งพิกัดต้นทาง-ปลายทางไปตารางรังวัดวงรอบ"
              >
                <Send className="w-3 h-3" />
                <span>เข้าโต๊ะรังวัด</span>
              </button>
            )}
          </div>

          {/* Toggle Steps Accordion */}
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="w-full mt-2.5 flex items-center justify-between text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-1"
          >
            <span>ขั้นตอนการเดินทางทีละเลี้ยว</span>
            {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Step-by-step Turn List */}
          {showSteps && (
            <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {routeResult.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-700 dark:text-slate-200 font-medium">
                      {step.instruction}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {step.distanceMeters > 0 && `${step.distanceMeters} ม.`}
                      {step.distanceMeters > 0 && step.durationSeconds > 0 && ' · '}
                      {step.durationSeconds > 0 && `~${Math.round(step.durationSeconds / 60)} นาที`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
