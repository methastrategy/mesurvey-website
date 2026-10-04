import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  BookmarkPlus,
  Send,
  Copy,
  Check,
  X,
  Compass,
  Landmark,
  GraduationCap,
  Train,
  CheckCircle2
} from 'lucide-react';
import { PlaceSearchResult, SavedPlace } from '../../../types/memaps';
import { forwardWgs84ToUtm } from '../../../core/projections';
import { savePlace } from '../../../core/memaps-services';

interface MeMapsPlaceCardProps {
  place: PlaceSearchResult;
  onClose: () => void;
  onSetAsOrigin: (place: PlaceSearchResult) => void;
  onSetAsDestination: (place: PlaceSearchResult) => void;
  onSendToSurvey?: (station: { name: string; lat: number; lng: number; utmE: number; utmN: number }) => void;
  onSaved?: (saved: SavedPlace) => void;
  className?: string;
}

export const MeMapsPlaceCard: React.FC<MeMapsPlaceCardProps> = ({
  place,
  onClose,
  onSetAsOrigin,
  onSetAsDestination,
  onSendToSurvey,
  onSaved,
  className = ''
}) => {
  const [copiedType, setCopiedType] = useState<'wgs' | 'utm' | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Compute UTM automatically
  let utmE = 0;
  let utmN = 0;
  let zone = 47;
  try {
    const utm = forwardWgs84ToUtm(place.lat, place.lng);
    utmE = utm.easting;
    utmN = utm.northing;
    zone = utm.zone;
  } catch (err) {
    console.warn('UTM calculation fallback', err);
  }

  const copyWgs = () => {
    const text = `${place.lat.toFixed(6)}, ${place.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedType('wgs');
    setTimeout(() => setCopiedType(null), 1800);
  };

  const copyUtm = () => {
    const text = `Zone ${zone}N E: ${utmE.toFixed(2)} N: ${utmN.toFixed(2)}`;
    navigator.clipboard.writeText(text);
    setCopiedType('utm');
    setTimeout(() => setCopiedType(null), 1800);
  };

  const handleSave = () => {
    const saved = savePlace({
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      utmE,
      utmN,
      zone,
      note: note.trim() || undefined,
      category: place.category === 'survey' ? 'survey' : 'favorite'
    });
    setIsSaved(true);
    setShowNoteInput(false);
    onSaved?.(saved);
  };

  const getCategoryBadge = () => {
    switch (place.category) {
      case 'survey':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Compass className="w-3 h-3" /> หมุดรังวัด RTSD
          </span>
        );
      case 'university':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <GraduationCap className="w-3 h-3" /> มหาวิทยาลัย
          </span>
        );
      case 'landmark':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <Landmark className="w-3 h-3" /> แลนด์มาร์กสำคัญ
          </span>
        );
      case 'station':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
            <Train className="w-3 h-3" /> สถานีขนส่ง
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <MapPin className="w-3 h-3" /> สถานที่
          </span>
        );
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-md ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            {getCategoryBadge()}
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
            {place.name}
          </h3>
          {place.nameEn && place.nameEn !== place.name && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {place.nameEn}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all duration-150 ease-spring hover:scale-110 active:scale-90"
          title="ปิด"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description / Address */}
      {place.address && (
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
          {place.address}
        </p>
      )}

      {/* Dual Geodetic Coordinate Display */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {/* WGS84 Box */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>WGS84 Lat/Lng</span>
            <button
              onClick={copyWgs}
              className="text-slate-400 hover:text-blue-500 transition-all duration-150 ease-spring hover:scale-110 active:scale-90"
              title="คัดลอกพิกัด WGS84"
            >
              {copiedType === 'wgs' ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <div className="font-mono text-[11px] text-slate-700 dark:text-slate-200 leading-tight">
            <div>{place.lat.toFixed(6)}° N</div>
            <div>{place.lng.toFixed(6)}° E</div>
          </div>
        </div>

        {/* UTM Box */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>UTM ({zone}N)</span>
            <button
              onClick={copyUtm}
              className="text-slate-400 hover:text-blue-500 transition-all duration-150 ease-spring hover:scale-110 active:scale-90"
              title="คัดลอกพิกัด UTM"
            >
              {copiedType === 'utm' ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <div className="font-mono text-[11px] text-slate-700 dark:text-slate-200 leading-tight">
            <div>E: {utmE.toFixed(1)}</div>
            <div>N: {utmN.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Save Note dialog */}
      {showNoteInput && (
        <div className="mt-3 p-2.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200/60 dark:border-blue-900/40 space-y-2">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="เพิ่มบันทึกช่วยจำ (เช่น หมุดควบคุมโครงการ, หมุดระดับ A-01)..."
            className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100"
          />
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => setShowNoteInput(false)}
              className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-medium"
            >
              บันทึก
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onSetAsDestination(place)}
          className="flex-1 min-w-[110px] py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-all duration-150 ease-spring hover:scale-[1.02] active:scale-95"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>ขอเส้นทาง</span>
        </button>

        <button
          onClick={() => onSetAsOrigin(place)}
          className="py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-all duration-150 ease-spring hover:scale-[1.02] active:scale-95"
        >
          จุดเริ่มต้น
        </button>

        <button
          onClick={() => {
            if (isSaved) return;
            setShowNoteInput(!showNoteInput);
          }}
          className={`py-1.5 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all duration-150 ease-spring hover:scale-[1.02] active:scale-95 ${
            isSaved
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
          }`}
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>บันทึกแล้ว</span>
            </>
          ) : (
            <>
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>บันทึก</span>
            </>
          )}
        </button>

        {onSendToSurvey && (
          <button
            onClick={() =>
              onSendToSurvey({
                name: place.name,
                lat: place.lat,
                lng: place.lng,
                utmE,
                utmN
              })
            }
            className="py-1.5 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-medium flex items-center gap-1 transition-all duration-150 ease-spring hover:scale-[1.02] active:scale-95"
            title="ส่งพิกัดเข้าโต๊ะรังวัด"
          >
            <Send className="w-3.5 h-3.5" />
            <span>เข้าโต๊ะรังวัด</span>
          </button>
        )}
      </div>
    </div>
  );
};
