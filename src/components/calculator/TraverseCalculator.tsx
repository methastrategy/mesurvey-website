import React, { useState, useMemo } from 'react';
import { useSurveyStore, PlottedTraverseOverlay } from '../../store/useSurveyStore';
import { inverseUtmToWgs84 } from '../../core/projections';
import { polarToRect, rectToPolar } from '../../core/traverse';
import {
  Plus, Trash2, RotateCcw, CheckCircle2, XCircle, Download, Save,
  Eraser, MapPin, BookOpen, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { trackEvent } from '../../lib/telemetry';
import { exportToCsv } from '../../utils/csv-export';

// ─── DMS helpers ────────────────────────────────────────────────────────────
function dmsToDecDeg(d: number, m: number, s: number): number {
  return d + m / 60 + s / 3600;
}
function decDegToDms(dd: number): { d: number; m: number; s: number } {
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const rem = (abs - d) * 60;
  const m = Math.floor(rem);
  const s = (rem - m) * 60;
  return { d, m, s };
}
function fmtDms(dd: number): string {
  const { d, m, s } = decDegToDms(dd);
  return `${d}°${m}'${s.toFixed(1)}"`;
}
function fmtNum(n: number, digits = 3): string {
  return n.toFixed(digits);
}

// ─── Types ──────────────────────────────────────────────────────────────────
type TraverseMode = 'loop' | 'link' | 'open';

interface DmsField { d: string; m: string; s: string }

interface TraverseLeg {
  id: string;
  station: string;
  targetStation: string;
  distance: string;
  // Observed angle DMS (interior/left-turn angle measured at station)
  obsD: string;
  obsM: string;
  obsS: string;
}

function makeLeg(station: string, target: string, dist: string, d = '', m = '', s = ''): TraverseLeg {
  return { id: crypto.randomUUID(), station, targetStation: target, distance: dist, obsD: d, obsM: m, obsS: s };
}

// Sample data: closed loop, 5 stations, observed angles, distances
const SAMPLE_LEGS_LOOP: TraverseLeg[] = [
  makeLeg('A', 'B', '125.340', '98', '12', '30'),
  makeLeg('B', 'C', '112.880', '101', '45', '15'),
  makeLeg('C', 'D', '98.450',  '95', '30', '45'),
  makeLeg('D', 'E', '108.760', '108', '20', '00'),
  makeLeg('E', 'A', '130.120', '136', '11', '30'),
];

// ─── Computation ────────────────────────────────────────────────────────────
interface ComputedLeg {
  station: string;
  targetStation: string;
  distance: number;
  obsAngleDeg: number;          // observed interior angle
  corrAngleDeg: number;         // after angular correction
  azimuthDeg: number;           // running azimuth to next station
  rawDe: number; rawDn: number;
  corrDe: number; corrDn: number;
  adjDe: number; adjDn: number;
  adjEasting: number; adjNorthing: number;
}

interface TraverseResult {
  legs: ComputedLeg[];
  nAngles: number;
  sumAngles: number;
  theoreticalAngles: number;
  angularError: number;         // degrees
  angularErrorSec: number;      // arcseconds
  allowableAngularSec: number;  // allowable, typical 60√n
  angularOk: boolean;
  sumDe: number; sumDn: number;
  targetDe: number; targetDn: number;
  misclosureE: number; misclosureN: number;
  linearMisclosure: number;
  totalPerimeter: number;
  precisionRatio: number;
  precisionGrade: string;
  warnings: string[];
}

function computeTraverse(
  legs: TraverseLeg[],
  startE: number,
  startN: number,
  startAzD: number, startAzM: number, startAzS: number,
  mode: TraverseMode,
  endE: number, endN: number,
  endAzD: number, endAzM: number, endAzS: number
): TraverseResult | null {
  const n = legs.length;
  if (n < 2) return null;

  const obsAngles = legs.map(l => {
    const d = parseFloat(l.obsD) || 0;
    const m = parseFloat(l.obsM) || 0;
    const s = parseFloat(l.obsS) || 0;
    return dmsToDecDeg(d, m, s);
  });
  const distances = legs.map(l => parseFloat(l.distance) || 0);

  if (distances.some(d => d <= 0)) return null;

  const warnings: string[] = [];

  // Angular closure
  const sumAngles = obsAngles.reduce((a, b) => a + b, 0);
  const theoreticalAngles = mode === 'loop' ? (n - 2) * 180 : 0; // open/link: depends on azimuths
  const angularError = mode === 'loop' ? sumAngles - theoreticalAngles : 0;
  const angularErrorSec = angularError * 3600;
  const allowableAngularSec = 60 * Math.sqrt(n);
  const angularOk = mode === 'loop' ? Math.abs(angularErrorSec) <= allowableAngularSec : true;
  const corrPerAngle = mode === 'loop' ? -angularError / n : 0;

  const corrAngles = obsAngles.map(a => a + corrPerAngle);

  // Compute running azimuth
  let startAzDeg = dmsToDecDeg(startAzD, startAzM, startAzS);
  const azimuths: number[] = [];
  let currentAz = startAzDeg;
  for (let i = 0; i < n; i++) {
    // Back azimuth of previous leg + corrected interior angle → forward azimuth
    if (i === 0) {
      // First leg azimuth is startAz (given directly for first leg)
      azimuths.push(currentAz);
      currentAz = (currentAz + corrAngles[i] - 180 + 360) % 360;
    } else {
      azimuths.push(currentAz);
      currentAz = (currentAz + corrAngles[i] - 180 + 360) % 360;
    }
  }

  // Departures and latitudes
  const rawDeltas = distances.map((d, i) => polarToRect(d, azimuths[i]));
  const totalPerimeter = distances.reduce((a, b) => a + b, 0);
  const sumRawDe = rawDeltas.reduce((s, d) => s + d.de, 0);
  const sumRawDn = rawDeltas.reduce((s, d) => s + d.dn, 0);

  const targetDe = mode === 'loop' ? 0 : endE - startE;
  const targetDn = mode === 'loop' ? 0 : endN - startN;
  const misclosureE = sumRawDe - targetDe;
  const misclosureN = sumRawDn - targetDn;
  const linearMisclosure = Math.hypot(misclosureE, misclosureN);
  const precisionRatio = linearMisclosure > 0.0001 ? Math.round(totalPerimeter / linearMisclosure) : 999999;

  // Bowditch correction: proportional to distance
  const corrDe_perM = totalPerimeter > 0 ? -misclosureE / totalPerimeter : 0;
  const corrDn_perM = totalPerimeter > 0 ? -misclosureN / totalPerimeter : 0;

  // Precision grade
  let precisionGrade = 'ต่ำกว่าเกณฑ์ (< 1:2,500)';
  if (precisionRatio >= 20000) precisionGrade = 'ชั้น 1 — ≥ 1:20,000';
  else if (precisionRatio >= 10000) precisionGrade = 'ชั้น 2A — ≥ 1:10,000';
  else if (precisionRatio >= 5000) precisionGrade = 'ชั้น 2B — ≥ 1:5,000';
  else if (precisionRatio >= 2500) precisionGrade = 'ชั้น 3 — ≥ 1:2,500';

  if (mode === 'loop' && !angularOk) {
    warnings.push(`⚠️ Angular Error ${angularErrorSec.toFixed(1)}" เกิน Allowable ${allowableAngularSec.toFixed(1)}" — ตรวจสอบการอ่านมุม`);
  }
  if (precisionRatio < 2500) {
    warnings.push(`⚠️ Precision Ratio 1:${precisionRatio.toLocaleString()} ต่ำกว่าเกณฑ์มาตรฐาน — ตรวจสอบระยะและมุมใหม่`);
  }
  if (distances.some(d => d < 10)) {
    warnings.push('⚠️ บางเส้นมีระยะน้อยกว่า 10 ม. — อาจทำให้ความละเอียดต่ำ');
  }

  // Build output legs
  let easting = startE;
  let northing = startN;
  const computedLegs: ComputedLeg[] = [];
  for (let i = 0; i < n; i++) {
    const corrDE = rawDeltas[i].de + distances[i] * corrDe_perM;
    const corrDN = rawDeltas[i].dn + distances[i] * corrDn_perM;
    const corrByBowditch_E = distances[i] * corrDe_perM;
    const corrByBowditch_N = distances[i] * corrDn_perM;
    easting += corrDE;
    northing += corrDN;
    computedLegs.push({
      station: legs[i].station,
      targetStation: legs[i].targetStation,
      distance: distances[i],
      obsAngleDeg: obsAngles[i],
      corrAngleDeg: corrAngles[i],
      azimuthDeg: azimuths[i],
      rawDe: rawDeltas[i].de,
      rawDn: rawDeltas[i].dn,
      corrDe: corrByBowditch_E,
      corrDn: corrByBowditch_N,
      adjDe: corrDE,
      adjDn: corrDN,
      adjEasting: easting,
      adjNorthing: northing,
    });
  }

  return {
    legs: computedLegs,
    nAngles: n,
    sumAngles,
    theoreticalAngles,
    angularError,
    angularErrorSec,
    allowableAngularSec,
    angularOk,
    sumDe: sumRawDe,
    sumDn: sumRawDn,
    targetDe,
    targetDn,
    misclosureE,
    misclosureN,
    linearMisclosure,
    totalPerimeter,
    precisionRatio,
    precisionGrade,
    warnings,
  };
}

// ─── Component ──────────────────────────────────────────────────────────────
export const TraverseCalculator: React.FC = () => {
  const { traverseLastSaved, setPlottedTraverseOverlay } = useSurveyStore();

  // Local state (not persisted — full refactor for DMS mode)
  const [mode, setMode] = useState<TraverseMode>('loop');
  const [legs, setLegs] = useState<TraverseLeg[]>(SAMPLE_LEGS_LOOP);

  const [startE, setStartE] = useState('500000.000');
  const [startN, setStartN] = useState('1500000.000');
  const [startAz, setStartAz] = useState<DmsField>({ d: '45', m: '30', s: '00' });

  const [endE, setEndE] = useState('500500.000');
  const [endN, setEndN] = useState('1500200.000');
  const [endAz, setEndAz] = useState<DmsField>({ d: '225', m: '30', s: '00' });

  const [showResults, setShowResults] = useState(true);

  // Compute
  const result = useMemo(() => {
    try {
      return computeTraverse(
        legs,
        parseFloat(startE) || 0, parseFloat(startN) || 0,
        parseFloat(startAz.d) || 0, parseFloat(startAz.m) || 0, parseFloat(startAz.s) || 0,
        mode,
        parseFloat(endE) || 0, parseFloat(endN) || 0,
        parseFloat(endAz.d) || 0, parseFloat(endAz.m) || 0, parseFloat(endAz.s) || 0,
      );
    } catch { return null; }
  }, [legs, startE, startN, startAz, mode, endE, endN, endAz]);

  // ── leg editors
  const updateLeg = (idx: number, field: keyof TraverseLeg, val: string) => {
    setLegs(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  };
  const addLeg = () => setLegs(prev => [...prev, makeLeg(`ST${prev.length + 1}`, `ST${prev.length + 2}`, '100.000')]);
  const removeLeg = (idx: number) => setLegs(prev => prev.filter((_, i) => i !== idx));
  const resetSample = () => setLegs(SAMPLE_LEGS_LOOP);
  const clearAll = () => setLegs([makeLeg('A', 'B', '')]);

  // ── CSV Export
  const handleExportCsv = () => {
    if (!result) return;
    trackEvent('traverse_export_csv_dms', { count: result.legs.length });
    const headers = ['Leg', 'Obs.Angle(DMS)', 'Corr.Angle(°)', 'Azimuth(°)', 'Distance(m)', 'Raw_dE', 'Raw_dN', 'Corr_dE', 'Corr_dN', 'Adj_Easting', 'Adj_Northing'];
    const rows = result.legs.map(l => [
      `${l.station}→${l.targetStation}`,
      fmtDms(l.obsAngleDeg),
      fmtNum(l.corrAngleDeg, 4),
      fmtNum(l.azimuthDeg, 4),
      fmtNum(l.distance),
      fmtNum(l.rawDe),
      fmtNum(l.rawDn),
      fmtNum(l.corrDe, 5),
      fmtNum(l.corrDn, 5),
      fmtNum(l.adjEasting),
      fmtNum(l.adjNorthing),
    ]);
    exportToCsv({ filename: `traverse_dms_${Date.now()}.csv`, headers, rows });
  };

  // ── Plot on map
  const handlePlotOnMap = () => {
    if (!result) return;
    const zone = 47;
    const stations: PlottedTraverseOverlay['stations'] = [];
    const polyline: [number, number][] = [];
    const sE = parseFloat(startE) || 0;
    const sN = parseFloat(startN) || 0;

    // Start point
    try {
      const wgsStart = inverseUtmToWgs84(sE, sN, zone);
      stations.push({ station: legs[0]?.station || 'Start', lat: wgsStart.lat, lng: wgsStart.lng, easting: sE, northing: sN });
      polyline.push([wgsStart.lat, wgsStart.lng]);
    } catch { return; }

    for (const l of result.legs) {
      if (l.adjEasting < 100000 || l.adjEasting > 900000) {
        alert('พิกัดไม่อยู่ใน UTM Zone 47N/48N');
        return;
      }
      try {
        const wgs = inverseUtmToWgs84(l.adjEasting, l.adjNorthing, zone);
        stations.push({ station: l.targetStation, lat: wgs.lat, lng: wgs.lng, easting: l.adjEasting, northing: l.adjNorthing });
        polyline.push([wgs.lat, wgs.lng]);
      } catch { return; }
    }
    if (mode === 'loop' && polyline.length > 0) polyline.push(polyline[0]);

    setPlottedTraverseOverlay({
      stations, polyline,
      isClosed: mode === 'loop',
      totalPerimeter: result.totalPerimeter,
      linearMisclosure: result.linearMisclosure,
      precisionRatio: result.precisionRatio,
      precisionGrade: result.precisionGrade,
    });
    trackEvent('traverse_plot_dms', { stationCount: stations.length });
    window.location.hash = '#/map';
  };

  // ── Helpers for inline cell style
  const cellInput = 'w-full bg-transparent border-0 outline-none font-mono text-xs text-center py-1 focus:bg-blue-500/10 rounded transition';
  const autoCell = 'py-2 px-1 text-center font-mono text-xs tabular-nums';
  const inputCell = 'py-1 px-1 text-center';

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div
        className="p-4 rounded-2xl border shadow-sm"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                CALC-01 • BOWDITCH TRAVERSE
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Save className="w-3 h-3 animate-pulse" />
                บันทึก {new Date(traverseLastSaved).toLocaleTimeString('th-TH')}
              </span>
            </div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>
              ตารางทำงานวงรอบ — กรอกมุมสนาม D°M′S″
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              ปรับแก้วิธีเข็มทิศ (Bowditch / Compass Rule) · Angular Closure · คำนวณพิกัดปรับแก้
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a href="#/knowledge/closed-loop-traverse"
              className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              คู่มือ
            </a>
            <button onClick={resetSample}
              className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> ตัวอย่าง
            </button>
            <button onClick={() => { if (window.confirm('ล้างตาราง?')) clearAll(); }}
              className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            >
              <Eraser className="w-3.5 h-3.5" /> ล้าง
            </button>
          </div>
        </div>

        {/* ── Config Bar ── */}
        <div className="rounded-xl border p-3 space-y-3" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          {/* Mode selector */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>ประเภทวงรอบ:</span>
            {(['loop', 'link', 'open'] as TraverseMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${mode === m ? 'bg-indigo-600 text-white border-indigo-500' : 'border-current opacity-60 hover:opacity-90'}`}
                style={mode !== m ? { borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--surface)' } : {}}
              >
                {m === 'loop' ? '🔁 Closed Loop (วงรอบปิด)' : m === 'link' ? '🔗 Closed Link (ออกหมุดคู่รู้ค่า)' : '➡️ Open Traverse (วงรอบเปิด)'}
              </button>
            ))}
          </div>

          {/* Coordinate fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2 text-xs">
            {/* Start E/N */}
            <div className="col-span-1">
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Start E (m)</label>
              <input value={startE} onChange={e => setStartE(e.target.value)} type="number" step="0.001"
                className="w-full min-h-[36px] px-2.5 py-1.5 rounded-lg border font-mono text-xs focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
              />
            </div>
            <div className="col-span-1">
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Start N (m)</label>
              <input value={startN} onChange={e => setStartN(e.target.value)} type="number" step="0.001"
                className="w-full min-h-[36px] px-2.5 py-1.5 rounded-lg border font-mono text-xs focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
              />
            </div>
            {/* Start Az DMS */}
            <div className="col-span-2 md:col-span-2">
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Start Azimuth (D° M′ S″)</label>
              <div className="flex gap-1">
                {(['d', 'm', 's'] as (keyof DmsField)[]).map(f => (
                  <input key={f} value={startAz[f]}
                    onChange={e => setStartAz(prev => ({ ...prev, [f]: e.target.value }))}
                    type="number" placeholder={f === 'd' ? 'D' : f === 'm' ? 'M' : 'S'}
                    className="w-0 flex-1 min-h-[36px] px-1.5 py-1.5 rounded-lg border font-mono text-xs text-center focus:ring-1 focus:ring-indigo-500 outline-none"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                  />
                ))}
              </div>
            </div>
            {/* End coords (link mode only) */}
            {(mode === 'link') && (
              <>
                <div className="col-span-1">
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-2)' }}>End E (m)</label>
                  <input value={endE} onChange={e => setEndE(e.target.value)} type="number" step="0.001"
                    className="w-full min-h-[36px] px-2.5 py-1.5 rounded-lg border font-mono text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-2)' }}>End N (m)</label>
                  <input value={endN} onChange={e => setEndN(e.target.value)} type="number" step="0.001"
                    className="w-full min-h-[36px] px-2.5 py-1.5 rounded-lg border font-mono text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-2)' }}>End Azimuth (D° M′ S″)</label>
                  <div className="flex gap-1">
                    {(['d', 'm', 's'] as (keyof DmsField)[]).map(f => (
                      <input key={f} value={endAz[f]}
                        onChange={e => setEndAz(prev => ({ ...prev, [f]: e.target.value }))}
                        type="number" placeholder={f === 'd' ? 'D' : f === 'm' ? 'M' : 'S'}
                        className="w-0 flex-1 min-h-[36px] px-1.5 py-1.5 rounded-lg border font-mono text-xs text-center focus:ring-1 focus:ring-indigo-500 outline-none"
                        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Excel-style Input Table ── */}
      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
          <h4 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>ตารางข้อมูลสนาม — Input Worksheet</h4>
          <button onClick={addLeg}
            className="min-h-[32px] px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" /> เพิ่มสถานี
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: 700 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-2)', borderBottom: '2px solid var(--border)' }}>
                <th className="py-2.5 px-2 font-semibold text-center w-8 border-r" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>#</th>
                <th className="py-2.5 px-2 font-semibold text-left border-r" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>สถานีต้น</th>
                <th className="py-2.5 px-2 font-semibold text-left border-r" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>สถานีปลาย</th>
                <th className="py-2.5 px-2 font-semibold text-center border-r" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>Dist (m)</th>
                <th className="py-2.5 px-2 font-semibold text-center border-r" colSpan={3} style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>มุมสังเกต (D° M′ S″)</th>
                <th className="py-2.5 px-2 font-semibold text-center border-r" style={{ borderColor: 'var(--border)', color: '#818cf8' }}>Az (°)</th>
                <th className="py-2.5 px-2 font-semibold text-center border-r" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>ΔE (m)</th>
                <th className="py-2.5 px-2 font-semibold text-center border-r" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>ΔN (m)</th>
                <th className="py-2.5 px-2 font-semibold text-center border-r" style={{ borderColor: 'var(--border)', color: '#34d399' }}>E ปรับแล้ว</th>
                <th className="py-2.5 px-2 font-semibold text-center border-r" style={{ borderColor: 'var(--border)', color: '#34d399' }}>N ปรับแล้ว</th>
                <th className="py-2.5 px-2 text-center w-8" style={{ color: 'var(--text-3)' }}>Del</th>
              </tr>
            </thead>
            <tbody>
              {legs.map((leg, idx) => {
                const cl = result?.legs[idx];
                const rowBg = idx % 2 === 0 ? 'transparent' : 'var(--surface-2)';
                return (
                  <tr key={leg.id} style={{ backgroundColor: rowBg, borderBottom: '1px solid var(--border)' }}>
                    {/* # */}
                    <td className="text-center font-mono py-1 border-r" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>{idx + 1}</td>
                    {/* Station */}
                    <td className={inputCell + ' border-r'} style={{ borderColor: 'var(--border)' }}>
                      <input value={leg.station} onChange={e => updateLeg(idx, 'station', e.target.value)}
                        className={cellInput} style={{ color: 'var(--text-1)' }} />
                    </td>
                    <td className={inputCell + ' border-r'} style={{ borderColor: 'var(--border)' }}>
                      <input value={leg.targetStation} onChange={e => updateLeg(idx, 'targetStation', e.target.value)}
                        className={cellInput} style={{ color: 'var(--text-1)' }} />
                    </td>
                    {/* Distance */}
                    <td className={inputCell + ' border-r'} style={{ borderColor: 'var(--border)' }}>
                      <input value={leg.distance} onChange={e => updateLeg(idx, 'distance', e.target.value)}
                        type="number" step="0.001" className={cellInput} style={{ color: 'var(--text-1)' }} />
                    </td>
                    {/* DMS */}
                    <td className={'border-r ' + inputCell} style={{ borderColor: 'var(--border)', borderRight: '1px dashed var(--border)' }}>
                      <input value={leg.obsD} onChange={e => updateLeg(idx, 'obsD', e.target.value)}
                        type="number" placeholder="D" className={cellInput + ' w-12'} style={{ color: 'var(--text-1)' }} />
                    </td>
                    <td className={'border-r ' + inputCell} style={{ borderColor: 'var(--border)', borderRight: '1px dashed var(--border)' }}>
                      <input value={leg.obsM} onChange={e => updateLeg(idx, 'obsM', e.target.value)}
                        type="number" placeholder="M" className={cellInput + ' w-12'} style={{ color: 'var(--text-1)' }} />
                    </td>
                    <td className={'border-r ' + inputCell} style={{ borderColor: 'var(--border)' }}>
                      <input value={leg.obsS} onChange={e => updateLeg(idx, 'obsS', e.target.value)}
                        type="number" step="0.1" placeholder="S" className={cellInput + ' w-16'} style={{ color: 'var(--text-1)' }} />
                    </td>
                    {/* Auto-computed */}
                    <td className={autoCell + ' border-r'} style={{ borderColor: 'var(--border)', color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.05)' }}>
                      {cl ? fmtDms(cl.azimuthDeg) : '—'}
                    </td>
                    <td className={autoCell + ' border-r'} style={{ borderColor: 'var(--border)', color: 'var(--text-3)', backgroundColor: 'rgba(0,0,0,0.03)' }}>
                      {cl ? fmtNum(cl.rawDe) : '—'}
                    </td>
                    <td className={autoCell + ' border-r'} style={{ borderColor: 'var(--border)', color: 'var(--text-3)', backgroundColor: 'rgba(0,0,0,0.03)' }}>
                      {cl ? fmtNum(cl.rawDn) : '—'}
                    </td>
                    <td className={autoCell + ' border-r font-bold'} style={{ borderColor: 'var(--border)', color: '#34d399', backgroundColor: 'rgba(52,211,153,0.07)' }}>
                      {cl ? fmtNum(cl.adjEasting) : '—'}
                    </td>
                    <td className={autoCell + ' border-r font-bold'} style={{ borderColor: 'var(--border)', color: '#34d399', backgroundColor: 'rgba(52,211,153,0.07)' }}>
                      {cl ? fmtNum(cl.adjNorthing) : '—'}
                    </td>
                    {/* Delete */}
                    <td className="text-center py-1">
                      <button onClick={() => removeLeg(idx)} disabled={legs.length <= 1}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 transition inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {/* Σ totals row */}
              {result && (
                <tr className="font-bold border-t-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
                  <td colSpan={3} className="py-2 px-3 text-right text-xs" style={{ color: 'var(--text-2)' }}>Σ (รวม)</td>
                  <td className="py-2 px-2 text-center font-mono" style={{ color: 'var(--text-1)' }}>{fmtNum(result.totalPerimeter)}</td>
                  <td colSpan={3} className="py-2 px-2 text-center font-mono text-xs" style={{ color: '#818cf8' }}>
                    ΣAng: {fmtDms(result.sumAngles)}
                  </td>
                  <td className="py-2 px-2 text-center" style={{ color: 'var(--text-3)' }}>—</td>
                  <td className="py-2 px-2 text-center font-mono" style={{ color: result.misclosureE < 0.01 ? '#34d399' : '#f87171' }}>
                    Σ: {fmtNum(result.sumDe)}
                  </td>
                  <td className="py-2 px-2 text-center font-mono" style={{ color: result.misclosureN < 0.01 ? '#34d399' : '#f87171' }}>
                    Σ: {fmtNum(result.sumDn)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Results Panel ── */}
      {result && (
        <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <button
            onClick={() => setShowResults(r => !r)}
            className="w-full flex items-center justify-between px-4 py-3 border-b text-left"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}
          >
            <div className="flex items-center gap-2">
              {result.precisionRatio >= 2500 && result.angularOk
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                : <XCircle className="w-4 h-4 text-rose-500" />}
              <h4 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>
                ผลลัพธ์การปรับแก้ · 1:{result.precisionRatio.toLocaleString()} · {result.precisionGrade}
              </h4>
            </div>
            {showResults ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-3)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-3)' }} />}
          </button>

          {showResults && (
            <div className="p-4 space-y-4">

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="rounded-xl border p-3 space-y-1 bg-amber-500/5 border-amber-500/30">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Key metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Angular Error', val: `${result.angularErrorSec.toFixed(1)}"`, sub: `Allowable: ${result.allowableAngularSec.toFixed(1)}"`, ok: result.angularOk },
                  { label: 'ΣΔE / ΣΔN', val: `${fmtNum(result.sumDe)} / ${fmtNum(result.sumDn)}`, sub: `Target: ${fmtNum(result.targetDe)} / ${fmtNum(result.targetDn)}`, ok: true },
                  { label: 'Linear Misclosure', val: `${fmtNum(result.linearMisclosure, 4)} m`, sub: `ΔE: ${fmtNum(result.misclosureE, 4)} · ΔN: ${fmtNum(result.misclosureN, 4)}`, ok: result.linearMisclosure < 0.05 },
                  { label: 'Precision Ratio', val: `1 : ${result.precisionRatio.toLocaleString()}`, sub: result.precisionGrade, ok: result.precisionRatio >= 2500 },
                ].map(({ label, val, sub, ok }) => (
                  <div key={label} className="rounded-xl p-3 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>{label}</p>
                    <p className={`text-sm font-bold font-mono tabular-nums ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>{val}</p>
                    <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'var(--text-3)' }}>{sub}</p>
                  </div>
                ))}
              </div>

              {/* Angular closure detail (loop only) */}
              {mode === 'loop' && (
                <div className="rounded-xl border p-3 text-xs font-mono" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
                  <p style={{ color: 'var(--text-2)' }}>
                    <span className="font-bold">Angular Closure Check</span> · n = {result.nAngles} สถานี · (n-2)×180° = {result.theoreticalAngles}°
                  </p>
                  <p className="mt-1" style={{ color: 'var(--text-3)' }}>
                    ΣAngles = {fmtDms(result.sumAngles)} · Error = {fmtDms(Math.abs(result.angularError))} ({result.angularErrorSec.toFixed(1)}")
                    · Correction/station = {(-result.angularError / result.nAngles * 3600).toFixed(1)}" each
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button onClick={handlePlotOnMap}
                  className="min-h-[36px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" /> แสดงบนแผนที่
                </button>
                <button onClick={handleExportCsv}
                  className="min-h-[36px] px-4 py-2 rounded-xl border font-semibold text-xs transition flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
                >
                  <Download className="w-3.5 h-3.5" /> ส่งออก CSV
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
