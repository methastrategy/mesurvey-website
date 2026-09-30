import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  MapPin,
  Trash2,
  Navigation,
  Send,
  Compass,
  Briefcase,
  Star,
  ExternalLink
} from 'lucide-react';
import { SavedPlace, PlaceSearchResult } from '../../../types/memaps';
import { getSavedPlaces, deleteSavedPlace } from '../../../core/memaps-services';

interface MeMapsSavedPlacesPanelProps {
  onSelectPlace: (place: PlaceSearchResult) => void;
  onSetAsDestination: (place: PlaceSearchResult) => void;
  onSendToSurvey?: (stations: Array<{ name: string; lat: number; lng: number; utmE: number; utmN: number }>) => void;
  refreshTrigger?: number;
  className?: string;
}

export const MeMapsSavedPlacesPanel: React.FC<MeMapsSavedPlacesPanelProps> = ({
  onSelectPlace,
  onSetAsDestination,
  onSendToSurvey,
  refreshTrigger = 0,
  className = ''
}) => {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [filter, setFilter] = useState<'all' | 'survey' | 'favorite' | 'work'>('all');

  const loadPlaces = () => {
    setSavedPlaces(getSavedPlaces());
  };

  useEffect(() => {
    loadPlaces();
  }, [refreshTrigger]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedPlace(id);
    loadPlaces();
  };

  const filteredPlaces = filter === 'all'
    ? savedPlaces
    : savedPlaces.filter(p => p.category === filter);

  const handleSendAll = () => {
    if (!onSendToSurvey || savedPlaces.length === 0) return;
    const stations = savedPlaces.map(p => ({
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      utmE: p.utmE || 0,
      utmN: p.utmN || 0
    }));
    onSendToSurvey(stations);
  };

  const getCategoryIcon = (category: SavedPlace['category']) => {
    switch (category) {
      case 'survey':
        return <Compass className="w-3.5 h-3.5 text-emerald-500" />;
      case 'work':
        return <Briefcase className="w-3.5 h-3.5 text-blue-500" />;
      case 'favorite':
      default:
        return <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top bar with filter chips & send all */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-[11px]">
          {(['all', 'survey', 'favorite', 'work'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filter === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {tab === 'all' && `ทั้งหมด (${savedPlaces.length})`}
              {tab === 'survey' && '📐 งานรังวัด'}
              {tab === 'favorite' && '⭐ ติดดาว'}
              {tab === 'work' && '💼 ไซต์งาน'}
            </button>
          ))}
        </div>

        {onSendToSurvey && savedPlaces.length > 0 && (
          <button
            onClick={handleSendAll}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs transition"
            title="ส่งจุดทั้งหมดเข้าตารางคำนวณวงรอบ"
          >
            <Send className="w-3 h-3" />
            <span>ส่งเข้าตารางรังวัด ({savedPlaces.length})</span>
          </button>
        )}
      </div>

      {/* Places List */}
      {filteredPlaces.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Bookmark className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2 opacity-60" />
          <p className="font-medium">ยังไม่มีสถานที่ที่บันทึกไว้ในหมวดนี้</p>
          <p className="text-[11px] text-slate-400 mt-1">
            ค้นหาหรือคลิกบนแผนที่ แล้วกด "บันทึกสถานที่" เพื่อเก็บพิกัดหมุดรังวัด
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filteredPlaces.map(place => {
            const placeSearchEquivalent: PlaceSearchResult = {
              id: place.id,
              name: place.name,
              description: place.note || `UTM: E ${place.utmE?.toFixed(1)} N ${place.utmN?.toFixed(1)}`,
              lat: place.lat,
              lng: place.lng,
              category: place.category === 'survey' ? 'survey' : 'landmark'
            };

            return (
              <div
                key={place.id}
                onClick={() => onSelectPlace(placeSearchEquivalent)}
                className="group p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getCategoryIcon(place.category)}
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                      {place.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSetAsDestination(placeSearchEquivalent);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition"
                      title="ขอเส้นทาง"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => handleDelete(place.id, e)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                      title="ลบสถานที่นี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {place.note && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                    "{place.note}"
                  </p>
                )}

                {/* Coordinate Readout */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>WGS: {place.lat.toFixed(4)}, {place.lng.toFixed(4)}</span>
                  {place.utmE && place.utmN && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      UTM: {place.utmE.toFixed(0)}, {place.utmN.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
