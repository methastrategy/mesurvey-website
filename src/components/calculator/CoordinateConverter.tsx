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
import { Copy, Check, MapPin, ArrowRightLeft, AlertCircle, BookOpen } from 'lucide-react';
import { useSurveyStore } from '../../store/useSurveyStore';

interface CoordinateConverterProps {
  onPlotOnMap?: (lat: number, lng: number, label: string) => void;
}

export const CoordinateConverter: React.FC<CoordinateConverterProps> = ({ onPlotOnMap }) => {
  const { inspectedCoordinate, clearInspectedCoordinate } = useSurveyStore();

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
  const [utmEasting, setUtmEasting] = useState<string>('669656.82');
  const [utmNorthing, setUtmNorthing] = useState<string>('1531321.89');

  const [indZone, setIndZone] = useState<47 | 48>(47);
  const [indEasting, setIndEasting] = useState<string>('669988.90');
  const [indNorthing, setIndNorthing] = useState<string>('1531019.56');

  // Computed results
  const [activeLat, setActiveLat] = useState<number>(13.84664);
  const [activeLng, setActiveLng] = useState<number>(100.56982);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

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

  // Ingest inspectedCoordinate from WebMap
  useEffect(() => {
    if (inspectedCoordinate) {
      setInputMode('dd');
      setInputError(null);
      setDdLat(inspectedCoordinate.lat.toFixed(6));
      setDdLng(inspectedCoordinate.lng.toFixed(6));
      calculateFromDD(inspectedCoordinate.lat, inspectedCoordinate.lng);
      clearInspectedCoordinate();
    }
  }, [inspectedCoordinate, clearInspectedCoordinate]);

  useEffect(() => {
    if (!inspectedCoordinate) {
      calculateFromDD(13.84664, 100.56982);
    }
  }, []);

  const handleApplyDD = () => {
    const lat = parseFloat(ddLat);
    const lng = parseFloat(ddLng);
    if (isNaN(lat) || isNaN(lng)) {
      setInputError('กรุณาระบุตัวเลขพิกัดละติจูดและลองจิจูดให้ครบถ้วน');
      return;
    }
    if (lat < -90 || lat > 90) {
      setInputError(`ค่าละติจูดต้องอยู่ระหว่าง -90° ถึง +90° (ตรวจพบ: ${lat}°) กรุณาตรวจสอบข้อมูลพิกัดภูมิศาสตร์`);
      return;
    }
    if (lng < -180 || lng > 180) {
      setInputError(`ค่าลองจิจูดต้องอยู่ระหว่าง -180° ถึง +180° (ตรวจพบ: ${lng}°) กรุณาตรวจสอบข้อมูลพิกัดภูมิศาสตร์`);
      return;
    }
    try {
      setInputError(null);
      calculateFromDD(lat, lng);
    } catch (err: any) {
      setInputError(err.message || 'เกิดข้อผิดพลาดในการแปลงค่าพิกัด WGS84');
    }
  };

  const handleApplyDMS = () => {
    const degLat = parseInt(dmsLatDeg);
    const minLat = parseInt(dmsLatMin);
    const secLat = parseFloat(dmsLatSec);
    const degLng = parseInt(dmsLngDeg);
    const minLng = parseInt(dmsLngMin);
    const secLng = parseFloat(dmsLngSec);

    if (isNaN(degLat) || isNaN(minLat) || isNaN(secLat) || isNaN(degLng) || isNaN(minLng) || isNaN(secLng)) {
      setInputError('กรุณากรอกค่า องศา (Deg), ลิปดา (Min), และพิลิปดา (Sec) ให้ครบทุกช่อง');
      return;
    }
    if (minLat < 0 || minLat >= 60 || minLng < 0 || minLng >= 60) {
      setInputError('ค่าลิปดา (Minute) ต้องอยู่ระหว่าง 0 ถึง 59 ลิปดา กรุณาตรวจสอบสมุดจดภาคสนาม');
      return;
    }
    if (secLat < 0 || secLat >= 60 || secLng < 0 || secLng >= 60) {
      setInputError('ค่าพิลิปดา (Second) ต้องอยู่ระหว่าง 0.00 ถึง 59.99 พิลิปดา กรุณาตรวจสอบสมุดจดภาคสนาม');
      return;
    }
    if (degLat < 0 || degLat > 90) {
      setInputError(`ค่าองศาละติจูดต้องอยู่ระหว่าง 0 ถึง 90° (ตรวจพบ: ${degLat}°)`);
      return;
    }
    if (degLng < 0 || degLng > 180) {
      setInputError(`ค่าองศาลองจิจูดต้องอยู่ระหว่าง 0 ถึง 180° (ตรวจพบ: ${degLng}°)`);
      return;
    }

    try {
      const lat = dmsToDecimal(degLat, minLat, secLat, dmsLatDir);
      const lng = dmsToDecimal(degLng, minLng, secLng, dmsLngDir);
      setInputError(null);
      setDdLat(lat.toFixed(6));
      setDdLng(lng.toFixed(6));
      calculateFromDD(lat, lng);
    } catch (err: any) {
      setInputError(err.message || 'เกิดข้อผิดพลาดในการแปลงค่าพิกัด DMS');
    }
  };

  const handleApplyUTM = () => {
    const e = parseFloat(utmEasting);
    const n = parseFloat(utmNorthing);
    if (isNaN(e) || isNaN(n)) {
      setInputError('กรุณาระบุตัวเลขค่าพิกัด UTM Easting และ Northing ให้ครบถ้วน');
      return;
    }
    if (e < 100000 || e > 900000) {
      setInputError(`ค่าพิกัด UTM Easting (E) ควรอยู่ระหว่าง 100,000 ถึง 900,000 ม. (ตรวจพบ: ${e.toLocaleString()} ม.) กรุณาตรวจสอบว่าสลับแกนระหว่างค่า N (Northing) และ E (Easting) จากกล้องประมวลผลรวม (Total Station) หรือเครื่องรับสัญญาณ GNSS หรือไม่`);
      return;
    }
    if (n < 0 || n > 10000000) {
      setInputError(`ค่าพิกัด UTM Northing (N) ในซีกโลกเหนือต้องอยู่ระหว่าง 0 ถึง 10,000,000 ม. (ตรวจพบ: ${n.toLocaleString()} ม.) กรุณาตรวจสอบข้อมูลรังวัด`);
      return;
    }
    try {
      setInputError(null);
      const wgs = inverseUtmToWgs84(e, n, utmZone);
      setDdLat(wgs.lat.toFixed(6));
      setDdLng(wgs.lng.toFixed(6));
      calculateFromDD(wgs.lat, wgs.lng);
    } catch (err: any) {
      setInputError(err.message || 'เกิดข้อผิดพลาดในการแปลงค่าพิกัด UTM');
    }
  };

  const handleApplyIndian = () => {
    const e = parseFloat(indEasting);
    const n = parseFloat(indNorthing);
    if (isNaN(e) || isNaN(n)) {
      setInputError('กรุณาระบุตัวเลขค่าพิกัด Indian 1975 Easting และ Northing ให้ครบถ้วน');
      return;
    }
    if (e < 100000 || e > 900000) {
      setInputError(`ค่าพิกัด Indian 1975 Easting (E) ควรอยู่ระหว่าง 100,000 ถึง 900,000 ม. (ตรวจพบ: ${e.toLocaleString()} ม.) กรุณาตรวจสอบว่าสลับแกนระหว่างค่า N (Northing) และ E (Easting) หรือไม่`);
      return;
    }
    if (n < 0 || n > 10000000) {
      setInputError(`ค่าพิกัด Indian 1975 Northing (N) ต้องมากกว่า 0 ม. (ตรวจพบ: ${n.toLocaleString()} ม.) กรุณาตรวจสอบข้อมูลหมุดแผนที่ทหาร (RTSD Benchmark)`);
      return;
    }
    try {
      setInputError(null);
      const wgs = inverseIndian1975ToWgs84(e, n, indZone);
      setDdLat(wgs.lat.toFixed(6));
      setDdLng(wgs.lng.toFixed(6));
      calculateFromDD(wgs.lat, wgs.lng);
    } catch (err: any) {
      setInputError(err.message || 'เกิดข้อผิดพลาดในการแปลงค่าพิกัด Indian 1975');
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
      <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5 border-b border-border dark:border-[#27272a] pb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
              ป้อนค่าพิกัดต้นทาง (Coordinate Input)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เลือกรูปแบบพิกัดที่ต้องการนำเข้าเพื่อคำนวณแปลงค่าโดยอัตโนมัติ
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="#/knowledge/gnss-rtk-static-survey"
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#18181b] hover:bg-surface-3 dark:hover:bg-[#27272a] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center space-x-1.5 border border-border dark:border-[#27272a]"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>คู่มือวิชาการ: การสำรวจรังวัดดาวเทียม GNSS RTK & Static</span>
            </a>

            {/* Precision Segmented Control */}
            <div className="inline-flex p-1 rounded-xl bg-surface-2 dark:bg-[#18181b] border border-border dark:border-[#27272a] text-xs">
              <button
                onClick={() => { setInputMode('dd'); setInputError(null); }}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                  inputMode === 'dd'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                WGS84 (DD)
              </button>
              <button
                onClick={() => { setInputMode('dms'); setInputError(null); }}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                  inputMode === 'dms'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                WGS84 (DMS)
              </button>
              <button
                onClick={() => { setInputMode('utm'); setInputError(null); }}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                  inputMode === 'utm'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                WGS84 UTM (E, N)
              </button>
              <button
                onClick={() => { setInputMode('indian'); setInputError(null); }}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                  inputMode === 'indian'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Indian 1975
              </button>
            </div>
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
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
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
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleApplyDD}
              className="min-h-[44px] px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98]"
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
                    aria-label="องศาละติจูด (Latitude Degrees)"
                    value={dmsLatDeg}
                    onChange={(e) => setDmsLatDeg(e.target.value)}
                    placeholder="Deg"
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                  <input
                    type="number"
                    aria-label="ลิปดาละติจูด (Latitude Minutes)"
                    value={dmsLatMin}
                    onChange={(e) => setDmsLatMin(e.target.value)}
                    placeholder="Min"
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                  <input
                    type="number"
                    step="0.01"
                    aria-label="พิลิปดาละติจูด (Latitude Seconds)"
                    value={dmsLatSec}
                    onChange={(e) => setDmsLatSec(e.target.value)}
                    placeholder="Sec"
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                  <select
                    aria-label="ซีกโลกเหนือ-ใต้ (Latitude Direction)"
                    value={dmsLatDir}
                    onChange={(e) => setDmsLatDir(e.target.value as 'N' | 'S')}
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#18181b] font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
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
                    aria-label="องศาลองจิจูด (Longitude Degrees)"
                    value={dmsLngDeg}
                    onChange={(e) => setDmsLngDeg(e.target.value)}
                    placeholder="Deg"
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                  <input
                    type="number"
                    aria-label="ลิปดาลองจิจูด (Longitude Minutes)"
                    value={dmsLngMin}
                    onChange={(e) => setDmsLngMin(e.target.value)}
                    placeholder="Min"
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                  <input
                    type="number"
                    step="0.01"
                    aria-label="พิลิปดาลองจิจูด (Longitude Seconds)"
                    value={dmsLngSec}
                    onChange={(e) => setDmsLngSec(e.target.value)}
                    placeholder="Sec"
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                  <select
                    aria-label="ซีกโลกตะวันออก-ตะวันตก (Longitude Direction)"
                    value={dmsLngDir}
                    onChange={(e) => setDmsLngDir(e.target.value as 'E' | 'W')}
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#18181b] font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  >
                    <option value="E">E (ออก)</option>
                    <option value="W">W (ตก)</option>
                  </select>
                </div>
              </div>
            </div>
            <button
              onClick={handleApplyDMS}
              className="min-h-[44px] px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98]"
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
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#18181b] text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
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
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
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
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleApplyUTM}
              className="min-h-[44px] px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98]"
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
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#18181b] text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
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
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
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
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleApplyIndian}
              className="min-h-[44px] px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98]"
            >
              คำนวณแปลงค่าพิกัด
            </button>
          </div>
        )}

        {/* Field-Actionable Input Error Diagnostic Banner for All Modes */}
        {inputError && (
          <div 
            role="alert"
            className="mt-4 p-4 rounded-xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start space-x-2.5 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-rose-800 dark:text-rose-200">
                ข้อผิดพลาดในการตรวจสอบพิกัด (Coordinate Input Error):
              </span>
              <p className="leading-relaxed font-sans">{inputError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Output Results Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* WGS84 Geographic Card */}
        <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] border-l-2 border-l-indigo-500 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border dark:border-[#27272a]">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                EPSG:4326 (WGS 84 Geographic)
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                พิกัดภูมิศาสตร์ (Lat, Lon)
              </h4>
            </div>
            <button
              onClick={() => copyToClipboard(`${activeLat.toFixed(6)}, ${activeLng.toFixed(6)}`, 'wgs84_dd')}
              className="min-h-[36px] min-w-[36px] p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-surface-2 dark:bg-[#18181b] border border-border dark:border-[#27272a] transition-colors flex items-center justify-center"
              title="คัดลอกพิกัด"
            >
              {copiedKey === 'wgs84_dd' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-3 font-mono tabular-nums text-xs sm:text-sm">
            <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a]">
              <span className="text-slate-400 block text-xs font-sans">Decimal Degrees (DD):</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {activeLat.toFixed(6)}°, {activeLng.toFixed(6)}°
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a]">
              <span className="text-slate-400 block text-xs font-sans">Degrees, Minutes, Seconds (DMS):</span>
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
        <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] border-l-2 border-l-indigo-500 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border dark:border-[#27272a]">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                {utmRes.epsg} (UTM Projection)
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                พิกัดกริด UTM Zone {utmRes.zone}N
              </h4>
            </div>
            <button
              onClick={() => copyToClipboard(`E: ${utmRes.easting.toFixed(2)}, N: ${utmRes.northing.toFixed(2)} (Zone ${utmRes.zone}N)`, 'wgs84_utm')}
              className="min-h-[36px] min-w-[36px] p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-surface-2 dark:bg-[#18181b] border border-border dark:border-[#27272a] transition-colors flex items-center justify-center"
              title="คัดลอกพิกัด UTM"
            >
              {copiedKey === 'wgs84_utm' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-3 font-mono tabular-nums text-xs sm:text-sm">
            <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a] flex justify-between items-center">
              <span className="text-slate-400 font-sans">Easting (E):</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {utmRes.easting.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a] flex justify-between items-center">
              <span className="text-slate-400 font-sans">Northing (N):</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {utmRes.northing.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m
              </span>
            </div>
          </div>
        </div>

        {/* Indian 1975 Datum Card */}
        <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] border-l-2 border-l-amber-500 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border dark:border-[#27272a]">
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
              className="min-h-[36px] min-w-[36px] p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-surface-2 dark:bg-[#18181b] border border-border dark:border-[#27272a] transition-colors flex items-center justify-center"
              title="คัดลอกพิกัด Indian 1975"
            >
              {copiedKey === 'indian_utm' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-3 font-mono tabular-nums text-xs sm:text-sm">
            <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a] flex justify-between items-center">
              <span className="text-slate-400 font-sans">Easting (E):</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {indRes.easting.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0a0a0b] border border-border dark:border-[#27272a] flex justify-between items-center">
              <span className="text-slate-400 font-sans">Northing (N):</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {indRes.northing.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m
              </span>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] border-l-2 border-l-indigo-500 p-5 sm:p-6 flex flex-col justify-between shadow-sm">
          <div>
            <span className="px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              WebGIS Action
            </span>
            <h4 className="text-base font-bold mt-2 tracking-tight text-slate-900 dark:text-white">
              ส่งพิกัดไปยังแผนที่ WebGIS
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
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
              className="w-full min-h-[44px] py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
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
