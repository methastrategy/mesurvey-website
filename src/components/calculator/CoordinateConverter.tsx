import React, { useState, useEffect } from 'react';
import { 
  dmsToDecimal, 
  decimalToDms, 
  formatDms, 
  forwardWgs84ToUtm, 
  inverseUtmToWgs84, 
  forwardWgs84ToIndian1975,
  inverseIndian1975ToWgs84
} from '../../core/projections';
import { Copy, Check, MapPin, ArrowRightLeft } from 'lucide-react';

interface CoordinateConverterProps {
  onPlotOnMap?: (lat: number, lng: number, label: string) => void;
}

export const CoordinateConverter: React.FC<CoordinateConverterProps> = ({ onPlotOnMap }) => {
  // Input Modes: 'dd' | 'dms' | 'utm' | 'indian'
  const [inputMode, setInputMode] = useState<'dd' | 'dms' | 'utm' | 'indian'>('dd');

  // Input states
  const [ddLat, setDdLat] = useState<string>('13.846640');
  const [ddLng, setDdLng] = useState<string>('100.569820');

  const [dmsLatDeg, setDmsLatDeg] = useState<string>('13');
  const [dmsLatMin, setDmsLatMin] = useState<string>('50');
  const [dmsLatSec, setDmsLatSec] = useState<string>('47.90');
  const [dmsLatDir, setDmsLatDir] = useState<'N' | 'S'>('N');

  const [dmsLngDeg, setDmsLngDeg] = useState<string>('100');
  const [dmsLngMin, setDmsLngMin] = useState<string>('34');
  const [dmsLngSec, setDmsLngSec] = useState<string>('11.35');
  const [dmsLngDir, setDmsLngDir] = useState<'E' | 'W'>('E');

  const [utmZone, setUtmZone] = useState<47 | 48>(47);
  const [utmEasting, setUtmEasting] = useState<string>('669735.24');
  const [utmNorthing, setUtmNorthing] = useState<string>('1531520.18');

  const [indZone, setIndZone] = useState<47 | 48>(47);
  const [indEasting, setIndEasting] = useState<string>('669939.24');
  const [indNorthing, setIndNorthing] = useState<string>('1532357.18');

  // Computed results
  const [activeLat, setActiveLat] = useState<number>(13.84664);
  const [activeLng, setActiveLng] = useState<number>(100.56982);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync from DD
  const calculateFromDD = (latVal: number, lngVal: number) => {
    setActiveLat(latVal);
    setActiveLng(lngVal);

    // Sync DMS
    const dmsL = decimalToDms(latVal, true);
    setDmsLatDeg(dmsL.deg.toString());
    setDmsLatMin(dmsL.min.toString());
    setDmsLatSec(dmsL.sec.toFixed(2));
    setDmsLatDir(dmsL.direction as 'N' | 'S');

    const dmsG = decimalToDms(lngVal, false);
    setDmsLngDeg(dmsG.deg.toString());
    setDmsLngMin(dmsG.min.toString());
    setDmsLngSec(dmsG.sec.toFixed(2));
    setDmsLngDir(dmsG.direction as 'E' | 'W');

    // Sync UTM
    const utm = forwardWgs84ToUtm(latVal, lngVal);
    setUtmZone(utm.zone);
    setUtmEasting(utm.easting.toFixed(2));
    setUtmNorthing(utm.northing.toFixed(2));

    // Sync Indian 1975
    const ind = forwardWgs84ToIndian1975(latVal, lngVal, utm.zone);
    setIndZone(ind.zone);
    setIndEasting(ind.easting.toFixed(2));
    setIndNorthing(ind.northing.toFixed(2));
  };

  useEffect(() => {
    calculateFromDD(13.84664, 100.56982);
  }, []);

  const handleApplyDD = () => {
    const lat = parseFloat(ddLat);
    const lng = parseFloat(ddLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      calculateFromDD(lat, lng);
    }
  };

  const handleApplyDMS = () => {
    const lat = dmsToDecimal(
      parseInt(dmsLatDeg) || 0,
      parseInt(dmsLatMin) || 0,
      parseFloat(dmsLatSec) || 0,
      dmsLatDir
    );
    const lng = dmsToDecimal(
      parseInt(dmsLngDeg) || 0,
      parseInt(dmsLngMin) || 0,
      parseFloat(dmsLngSec) || 0,
      dmsLngDir
    );
    setDdLat(lat.toFixed(6));
    setDdLng(lng.toFixed(6));
    calculateFromDD(lat, lng);
  };

  const handleApplyUTM = () => {
    const e = parseFloat(utmEasting);
    const n = parseFloat(utmNorthing);
    if (!isNaN(e) && !isNaN(n)) {
      const wgs = inverseUtmToWgs84(e, n, utmZone);
      setDdLat(wgs.lat.toFixed(6));
      setDdLng(wgs.lng.toFixed(6));
      calculateFromDD(wgs.lat, wgs.lng);
    }
  };

  const handleApplyIndian = () => {
    const e = parseFloat(indEasting);
    const n = parseFloat(indNorthing);
    if (!isNaN(e) && !isNaN(n)) {
      const wgs = inverseIndian1975ToWgs84(e, n, indZone);
      setDdLat(wgs.lat.toFixed(6));
      setDdLng(wgs.lng.toFixed(6));
      calculateFromDD(wgs.lat, wgs.lng);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const utmRes = forwardWgs84ToUtm(activeLat, activeLng);
  const indRes = forwardWgs84ToIndian1975(activeLat, activeLng, utmRes.zone);
  const dmsLatRes = decimalToDms(activeLat, true);
  const dmsLngRes = decimalToDms(activeLng, false);

  return (
    <div className="space-y-6">
      
      {/* Input Mode Selector & Coordinate Input Card */}
      <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5 border-b border-black/[0.05] dark:border-white/[0.06] pb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-ios-blue" />
              ป้อนค่าพิกัดต้นทาง (Coordinate Input)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เลือกรูปแบบพิกัดที่ต้องการนำเข้าเพื่อคำนวณแปลงค่าโดยอัตโนมัติ
            </p>
          </div>

          {/* iOS Segmented Control */}
          <div className="inline-flex p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] text-xs">
            <button
              onClick={() => setInputMode('dd')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                inputMode === 'dd'
                  ? 'bg-white dark:bg-[#2c2c2e] text-ios-blue shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              WGS84 (DD)
            </button>
            <button
              onClick={() => setInputMode('dms')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                inputMode === 'dms'
                  ? 'bg-white dark:bg-[#2c2c2e] text-ios-blue shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              WGS84 (DMS)
            </button>
            <button
              onClick={() => setInputMode('utm')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                inputMode === 'utm'
                  ? 'bg-white dark:bg-[#2c2c2e] text-ios-blue shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              WGS84 UTM (E, N)
            </button>
            <button
              onClick={() => setInputMode('indian')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                inputMode === 'indian'
                  ? 'bg-white dark:bg-[#2c2c2e] text-ios-blue shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Indian 1975
            </button>
          </div>
        </div>

        {/* Input Form 1: Decimal Degrees */}
        {inputMode === 'dd' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Latitude ละติจูด (องศาทศนิยม - Decimal Degrees)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={ddLat}
                  onChange={(e) => setDdLat(e.target.value)}
                  placeholder="เช่น 13.846640"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm focus:ring-2 focus:ring-survey-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Longitude ลองจิจูด (องศาทศนิยม - Decimal Degrees)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={ddLng}
                  onChange={(e) => setDdLng(e.target.value)}
                  placeholder="เช่น 100.569820"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] font-mono text-sm focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleApplyDD}
              className="px-6 py-2.5 rounded-2xl bg-ios-blue hover:bg-ios-blueDark text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all"
            >
              คำนวณแปลงค่าพิกัด
            </button>
          </div>
        )}

        {/* Input Form 2: DMS */}
        {inputMode === 'dms' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Latitude ละติจูด (Deg° Min' Sec")
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="number"
                    value={dmsLatDeg}
                    onChange={(e) => setDmsLatDeg(e.target.value)}
                    placeholder="Deg"
                    className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] font-mono text-xs sm:text-sm focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                  />
                  <input
                    type="number"
                    value={dmsLatMin}
                    onChange={(e) => setDmsLatMin(e.target.value)}
                    placeholder="Min"
                    className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] font-mono text-xs sm:text-sm focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={dmsLatSec}
                    onChange={(e) => setDmsLatSec(e.target.value)}
                    placeholder="Sec"
                    className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] font-mono text-xs sm:text-sm focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                  />
                  <select
                    value={dmsLatDir}
                    onChange={(e) => setDmsLatDir(e.target.value as 'N' | 'S')}
                    className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                  >
                    <option value="N">N (เหนือ)</option>
                    <option value="S">S (ใต้)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Longitude ลองจิจูด (Deg° Min' Sec")
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="number"
                    value={dmsLngDeg}
                    onChange={(e) => setDmsLngDeg(e.target.value)}
                    placeholder="Deg"
                    className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] font-mono text-xs sm:text-sm focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                  />
                  <input
                    type="number"
                    value={dmsLngMin}
                    onChange={(e) => setDmsLngMin(e.target.value)}
                    placeholder="Min"
                    className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] font-mono text-xs sm:text-sm focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={dmsLngSec}
                    onChange={(e) => setDmsLngSec(e.target.value)}
                    placeholder="Sec"
                    className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] font-mono text-xs sm:text-sm focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                  />
                  <select
                    value={dmsLngDir}
                    onChange={(e) => setDmsLngDir(e.target.value as 'E' | 'W')}
                    className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                  >
                    <option value="E">E (ออก)</option>
                    <option value="W">W (ตก)</option>
                  </select>
                </div>
              </div>
            </div>
            <button
              onClick={handleApplyDMS}
              className="px-6 py-2.5 rounded-2xl bg-ios-blue hover:bg-ios-blueDark text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all"
            >
              คำนวณแปลงค่าพิกัด
            </button>
          </div>
        )}

        {/* Input Form 3: WGS84 UTM */}
        {inputMode === 'utm' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  UTM Zone (โซนประเทศไทย)
                </label>
                <select
                  value={utmZone}
                  onChange={(e) => setUtmZone(parseInt(e.target.value) as 47 | 48)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                >
                  <option value={47}>Zone 47N (ภาคกลาง, เหนือ, ใต้, ตะวันตก)</option>
                  <option value={48}>Zone 48N (ภาคตะวันออกเฉียงเหนือ, ตะวันออก)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Easting พิกัดราบ E (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={utmEasting}
                  onChange={(e) => setUtmEasting(e.target.value)}
                  placeholder="เช่น 669735.24"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] font-mono text-sm focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Northing พิกัดดิ่ง N (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={utmNorthing}
                  onChange={(e) => setUtmNorthing(e.target.value)}
                  placeholder="เช่น 1531520.18"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] font-mono text-sm focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleApplyUTM}
              className="px-6 py-2.5 rounded-2xl bg-ios-blue hover:bg-ios-blueDark text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all"
            >
              คำนวณแปลงค่าพิกัด
            </button>
          </div>
        )}

        {/* Input Form 4: Indian 1975 */}
        {inputMode === 'indian' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Indian 1975 UTM Zone
                </label>
                <select
                  value={indZone}
                  onChange={(e) => setIndZone(parseInt(e.target.value) as 47 | 48)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                >
                  <option value={47}>Zone 47N (EPSG:24047)</option>
                  <option value={48}>Zone 48N (EPSG:24048)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Easting พิกัดราบ E (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={indEasting}
                  onChange={(e) => setIndEasting(e.target.value)}
                  placeholder="เช่น 669939.24"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] font-mono text-sm focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Northing พิกัดดิ่ง N (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={indNorthing}
                  onChange={(e) => setIndNorthing(e.target.value)}
                  placeholder="เช่น 1532357.18"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] font-mono text-sm focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue focus:outline-none transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleApplyIndian}
              className="px-6 py-2.5 rounded-2xl bg-ios-blue hover:bg-ios-blueDark text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all"
            >
              คำนวณแปลงค่าพิกัด
            </button>
          </div>
        )}
      </div>

      {/* Output Results Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* WGS84 Geographic Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 tracking-wider uppercase">
                EPSG:4326 (WGS 84 Geographic)
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                พิกัดภูมิศาสตร์ (Lat, Lon)
              </h4>
            </div>
            <button
              onClick={() => copyToClipboard(`${activeLat.toFixed(6)}, ${activeLng.toFixed(6)}`, 'wgs84_dd')}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
              title="คัดลอกพิกัด"
            >
              {copiedKey === 'wgs84_dd' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs sm:text-sm">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px] font-sans">Decimal Degrees (DD):</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {activeLat.toFixed(6)}°, {activeLng.toFixed(6)}°
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px] font-sans">Degrees, Minutes, Seconds (DMS):</span>
              <span className="text-slate-900 dark:text-white font-bold block">
                Lat: {formatDms(dmsLatRes)}
              </span>
              <span className="text-slate-900 dark:text-white font-bold block">
                Lng: {formatDms(dmsLngRes)}
              </span>
            </div>
          </div>
        </div>

        {/* WGS84 UTM Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-survey-600 dark:text-survey-400 tracking-wider uppercase">
                {utmRes.epsg} (UTM Projection)
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                พิกัดกริด UTM Zone {utmRes.zone}N
              </h4>
            </div>
            <button
              onClick={() => copyToClipboard(`E: ${utmRes.easting.toFixed(2)}, N: ${utmRes.northing.toFixed(2)} (Zone ${utmRes.zone}N)`, 'wgs84_utm')}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
              title="คัดลอกพิกัด UTM"
            >
              {copiedKey === 'wgs84_utm' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs sm:text-sm">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-sans">Easting (E):</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {utmRes.easting.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-sans">Northing (N):</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {utmRes.northing.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m
              </span>
            </div>
          </div>
        </div>

        {/* Indian 1975 Datum Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
                {indRes.epsg} (Indian 1975 / RTSD)
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                พิกัดเดิมอินเดียน 1975 (หมุดแผนที่ทหาร)
              </h4>
            </div>
            <button
              onClick={() => copyToClipboard(`E: ${indRes.easting.toFixed(2)}, N: ${indRes.northing.toFixed(2)} (Indian 1975 Zone ${indRes.zone}N)`, 'indian_utm')}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
              title="คัดลอกพิกัด Indian 1975"
            >
              {copiedKey === 'indian_utm' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs sm:text-sm">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-sans">Easting (E):</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {indRes.easting.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-sans">Northing (N):</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {indRes.northing.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m
              </span>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-gradient-to-br from-[#007AFF] via-[#0066D6] to-[#0052B3] rounded-3xl p-5 sm:p-6 text-white flex flex-col justify-between shadow-[0_10px_25px_-5px_rgba(0,122,255,0.3)]">
          <div>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md">
              WebGIS Action
            </span>
            <h4 className="text-lg font-bold mt-2 tracking-tight">
              ส่งพิกัดไปยังแผนที่ WebGIS
            </h4>
            <p className="text-xs text-white/85 mt-1 leading-relaxed">
              คลิกเพื่อนำค่าพิกัดปัจจุบันไปแสดงเป็นหมุด (Marker) บนแผนที่ พร้อมเปิดมุมมองและตรวจสอบพื้นที่จริงรอบหมุด
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => {
                if (onPlotOnMap) {
                  onPlotOnMap(activeLat, activeLng, `จุดพิกัด (${activeLat.toFixed(5)}, ${activeLng.toFixed(5)})`);
                }
              }}
              className="w-full py-3 rounded-2xl bg-white text-ios-blue hover:bg-slate-50 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <MapPin className="w-4 h-4 stroke-[2.5]" />
              <span>แสดงพิกัดนี้บนแผนที่ WebMap ทันที</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
