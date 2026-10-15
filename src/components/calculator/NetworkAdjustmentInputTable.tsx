import React, { useRef, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  RefreshCw, 
  CheckSquare, 
  Square, 
  FileSpreadsheet, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import type { 
  Station2D, 
  Observation2D, 
  Observation2DType, 
  LevelingPoint, 
  LevelingObservation 
} from '../../utils/least-squares';
import { 
  parseStationsCsv, 
  parseObservationsCsv, 
  parseLevelingCsv,
  downloadStationsTemplateCsv,
  downloadObservationsTemplateCsv,
  downloadLevelingTemplateCsv
} from '../../utils/survey-csv-parser';
import { exportToCsv } from '../../utils/csv-export';
import { HelpCircle, Info } from 'lucide-react';

interface NetworkAdjustmentInputTableProps {
  adjustmentMode: '2d' | '1d';
  stations2D: Station2D[];
  obs2D: Observation2D[];
  points1D: LevelingPoint[];
  obs1D: LevelingObservation[];
  onUpdateStations2D: (stations: Station2D[]) => void;
  onUpdateObs2D: (obs: Observation2D[]) => void;
  onUpdatePoints1D: (points: LevelingPoint[]) => void;
  onUpdateObs1D: (obs: LevelingObservation[]) => void;
  onResetSample: () => void;
  onClearAll: () => void;
}

export const NetworkAdjustmentInputTable: React.FC<NetworkAdjustmentInputTableProps> = ({
  adjustmentMode,
  stations2D,
  obs2D,
  points1D,
  obs1D,
  onUpdateStations2D,
  onUpdateObs2D,
  onUpdatePoints1D,
  onUpdateObs1D,
  onResetSample,
  onClearAll
}) => {
  const stationsFileInputRef = useRef<HTMLInputElement>(null);
  const obsFileInputRef = useRef<HTMLInputElement>(null);
  const levelingFileInputRef = useRef<HTMLInputElement>(null);

  const [inputError, setInputError] = useState<string | null>(null);
  const [showFormatGuide, setShowFormatGuide] = useState<boolean>(false);

  // New Station 2D Form State
  const [newStnId, setNewStnId] = useState<string>('');
  const [newStnFixed, setNewStnFixed] = useState<boolean>(false);
  const [newStnE, setNewStnE] = useState<string>('');
  const [newStnN, setNewStnN] = useState<string>('');

  // New Observation 2D Form State
  const [newObsId, setNewObsId] = useState<string>('');
  const [newObsType, setNewObsType] = useState<Observation2DType>('distance');
  const [newObsFrom, setNewObsFrom] = useState<string>('');
  const [newObsTo, setNewObsTo] = useState<string>('');
  const [newObsVal1, setNewObsVal1] = useState<string>('');
  const [newObsVal2, setNewObsVal2] = useState<string>('');
  const [newObsStd1, setNewObsStd1] = useState<string>('');

  // New Leveling 1D Form State
  const [newBmId, setNewBmId] = useState<string>('');
  const [newBmFixed, setNewBmFixed] = useState<boolean>(false);
  const [newBmElev, setNewBmElev] = useState<string>('');

  const [newLevFrom, setNewLevFrom] = useState<string>('');
  const [newLevTo, setNewLevTo] = useState<string>('');
  const [newLevDh, setNewLevDh] = useState<string>('');
  const [newLevDist, setNewLevDist] = useState<string>('1.0');
  const [newLevStd, setNewLevStd] = useState<string>('2.0');

  // ───────────────────────────────────────────────────────────────────────────
  // 2D HANDLERS
  // ───────────────────────────────────────────────────────────────────────────
  const handleAddStation2D = () => {
    if (!newStnId.trim() || !newStnE.trim() || !newStnN.trim()) {
      setInputError('กรุณากรอกรหัสหมุด, Easting และ Northing ให้ครบถ้วน');
      return;
    }
    const e = parseFloat(newStnE);
    const n = parseFloat(newStnN);
    if (isNaN(e) || isNaN(n)) {
      setInputError('พิกัด Easting และ Northing ต้องเป็นตัวเลข');
      return;
    }
    if (stations2D.some(s => s.id === newStnId.trim())) {
      setInputError(`มีหมุดรหัส ${newStnId.trim()} อยู่แล้วในโครงข่าย`);
      return;
    }

    setInputError(null);
    onUpdateStations2D([
      ...stations2D,
      {
        id: newStnId.trim(),
        isFixed: newStnFixed,
        knownE: newStnFixed ? e : undefined,
        knownN: newStnFixed ? n : undefined,
        approxE: newStnFixed ? undefined : e,
        approxN: newStnFixed ? undefined : n
      }
    ]);
    setNewStnId('');
    setNewStnE('');
    setNewStnN('');
  };

  const handleDeleteStation2D = (id: string) => {
    onUpdateStations2D(stations2D.filter(s => s.id !== id));
    onUpdateObs2D(obs2D.filter(o => o.fromStation !== id && o.toStation !== id));
  };

  const handleToggleStationFixed2D = (id: string) => {
    onUpdateStations2D(
      stations2D.map(s => {
        if (s.id !== id) return s;
        const willBeFixed = !s.isFixed;
        const curE = s.isFixed ? s.knownE : s.approxE;
        const curN = s.isFixed ? s.knownN : s.approxN;
        return {
          id: s.id,
          isFixed: willBeFixed,
          knownE: willBeFixed ? curE : undefined,
          knownN: willBeFixed ? curN : undefined,
          approxE: willBeFixed ? undefined : curE,
          approxN: willBeFixed ? undefined : curN
        };
      })
    );
  };

  const handleAddObs2D = () => {
    if (!newObsFrom.trim() || !newObsTo.trim() || !newObsVal1.trim()) {
      setInputError('กรุณากรอกหมุดต้นทาง, หมุดปลายทาง และค่ารังวัดให้ครบถ้วน');
      return;
    }
    const val1 = parseFloat(newObsVal1);
    if (isNaN(val1)) {
      setInputError('ค่ารังวัดต้องเป็นตัวเลข');
      return;
    }
    let val2: number | undefined = undefined;
    if (newObsType === 'baseline_vector') {
      val2 = parseFloat(newObsVal2);
      if (isNaN(val2)) {
        setInputError('สำหรับเวกเตอร์ GNSS ต้องระบุทั้ง ΔE และ ΔN');
        return;
      }
    }
    const std = parseFloat(newObsStd1);

    setInputError(null);
    const id = newObsId.trim() || `OBS_${obs2D.length + 1}`;
    onUpdateObs2D([
      ...obs2D,
      {
        id,
        type: newObsType,
        fromStation: newObsFrom.trim(),
        toStation: newObsTo.trim(),
        measuredValue: val1,
        measuredValue2: val2,
        stdDev: isNaN(std) || std <= 0 ? (newObsType === 'azimuth' ? 5.0 : 0.005) : std,
        stdDev2: newObsType === 'baseline_vector' ? (isNaN(std) || std <= 0 ? 0.008 : std) : undefined
      }
    ]);
    setNewObsId('');
    setNewObsVal1('');
    setNewObsVal2('');
  };

  const handleDeleteObs2D = (id: string) => {
    onUpdateObs2D(obs2D.filter(o => o.id !== id));
  };

  const handleUploadStationsCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInputError(null);
    try {
      const text = await file.text();
      const parsed = parseStationsCsv(text);
      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        setInputError(parsed.errors.join(' | '));
      } else {
        onUpdateStations2D(parsed.data);
      }
    } catch (err: any) {
      setInputError(`ไม่สามารถอ่านไฟล์ CSV: ${err?.message}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleUploadObsCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInputError(null);
    try {
      const text = await file.text();
      const parsed = parseObservationsCsv(text);
      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        setInputError(parsed.errors.join(' | '));
      } else {
        onUpdateObs2D(parsed.data);
      }
    } catch (err: any) {
      setInputError(`ไม่สามารถอ่านไฟล์ CSV: ${err?.message}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleDownloadStationsCsv = () => {
    exportToCsv({
      filename: 'mesurv_stations_2d',
      headers: ['Station_ID', 'Easting_m', 'Northing_m', 'Is_Fixed_Control'],
      rows: stations2D.map(s => [
        s.id,
        (s.isFixed ? s.knownE : s.approxE) ?? 0,
        (s.isFixed ? s.knownN : s.approxN) ?? 0,
        s.isFixed ? 'TRUE' : 'FALSE'
      ])
    });
  };

  const handleDownloadObsCsv = () => {
    exportToCsv({
      filename: 'mesurv_observations_2d',
      headers: ['Obs_ID', 'Type', 'From_Station', 'To_Station', 'Measured_Value_1', 'Measured_Value_2', 'StdDev'],
      rows: obs2D.map(o => [
        o.id,
        o.type,
        o.fromStation,
        o.toStation,
        o.measuredValue,
        o.measuredValue2 ?? '',
        o.stdDev
      ])
    });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 1D HANDLERS
  // ───────────────────────────────────────────────────────────────────────────
  const handleAddBenchmark1D = () => {
    if (!newBmId.trim() || !newBmElev.trim()) {
      setInputError('กรุณากรอกรหัสหมุดระดับและระดับความสูง');
      return;
    }
    const elev = parseFloat(newBmElev);
    if (isNaN(elev)) {
      setInputError('ระดับความสูงต้องเป็นตัวเลข');
      return;
    }
    if (points1D.some(p => p.id === newBmId.trim())) {
      setInputError(`มีหมุดรหัส ${newBmId.trim()} อยู่แล้ว`);
      return;
    }

    setInputError(null);
    onUpdatePoints1D([
      ...points1D,
      {
        id: newBmId.trim(),
        isFixed: newBmFixed,
        knownElevation: newBmFixed ? elev : undefined,
        approxElevation: newBmFixed ? undefined : elev
      }
    ]);
    setNewBmId('');
    setNewBmElev('');
  };

  const handleDeleteBenchmark1D = (id: string) => {
    onUpdatePoints1D(points1D.filter(p => p.id !== id));
    onUpdateObs1D(obs1D.filter(o => o.fromStation !== id && o.toStation !== id));
  };

  const handleAddObs1D = () => {
    if (!newLevFrom.trim() || !newLevTo.trim() || !newLevDh.trim()) {
      setInputError('กรุณากรอกหมุดต้นทาง, ปลายทาง และค่าความต่างระดับ Delta H');
      return;
    }
    const dh = parseFloat(newLevDh);
    const dist = parseFloat(newLevDist);
    const std = parseFloat(newLevStd);
    if (isNaN(dh)) {
      setInputError('ค่า Delta H ต้องเป็นตัวเลข');
      return;
    }

    setInputError(null);
    onUpdateObs1D([
      ...obs1D,
      {
        id: `LEV_${obs1D.length + 1}`,
        fromStation: newLevFrom.trim(),
        toStation: newLevTo.trim(),
        measuredDh: dh,
        distanceKm: isNaN(dist) || dist <= 0 ? 1.0 : dist,
        stdDevMm: isNaN(std) || std <= 0 ? 2.0 : std
      }
    ]);
    setNewLevDh('');
  };

  const handleDeleteObs1D = (id: string) => {
    onUpdateObs1D(obs1D.filter(o => o.id !== id));
  };

  const handleUploadLevelingCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInputError(null);
    try {
      const text = await file.text();
      const parsed = parseLevelingCsv(text);
      if (parsed.errors.length > 0 && parsed.points.length === 0) {
        setInputError(parsed.errors.join(' | '));
      } else {
        onUpdatePoints1D(parsed.points);
        onUpdateObs1D(parsed.observations);
      }
    } catch (err: any) {
      setInputError(`ไม่สามารถอ่านไฟล์ CSV: ${err?.message}`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Action Bar: Reset Sample vs Clear All */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--text-1)]">
            จัดการข้อมูลนำเข้า ({adjustmentMode === '2d' ? 'โครงข่ายราบ 2D & GNSS' : 'โครงข่ายระดับ 1D'})
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--text-3)] border border-[var(--border)]">
            {adjustmentMode === '2d' ? `${stations2D.length} หมุด / ${obs2D.length} ค่ารังวัด` : `${points1D.length} หมุด / ${obs1D.length} ค่ารังวัด`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFormatGuide(!showFormatGuide)}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold text-xs flex items-center gap-1.5 transition-colors ${
              showFormatGuide 
                ? 'bg-[var(--accent)] text-black dark:text-white border-transparent' 
                : 'bg-[var(--surface)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border-[var(--border)]'
            }`}
            title="ดูคำแนะนำโครงสร้างคอลัมน์และดาวน์โหลดไฟล์แม่แบบ CSV"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>คำแนะนำรูปแบบ & แม่แบบ (Templates)</span>
          </button>
          <button
            type="button"
            onClick={onResetSample}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border)] font-semibold transition-colors flex items-center gap-1.5"
            title="โหลดชุดข้อมูลตัวอย่างมาตรฐาน (ช.การช่าง / KU)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>โหลดตัวอย่าง (Sample)</span>
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 font-semibold transition-colors flex items-center gap-1.5"
            title="ล้างข้อมูลทั้งหมดเพื่อป้อนงานใหม่ของตัวเอง (Blank Slate)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>เริ่มฟอร์มว่างเปล่า (Blank)</span>
          </button>
        </div>
      </div>

      {/* Format Guide & Template Download Drawer */}
      {showFormatGuide && (
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--surface)] border-2 border-[var(--accent)] shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <span className="font-bold text-xs sm:text-sm text-[var(--text-1)] flex items-center gap-2">
              <Info className="w-4 h-4 text-[var(--accent)]" />
              <span>คู่มือรูปแบบข้อมูลและไฟล์แม่แบบ (Data Templates & Format Guide)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowFormatGuide(false)}
              className="text-xs text-[var(--text-3)] hover:text-[var(--text-1)]"
            >
              ปิดคำแนะนำ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Guide 1: Stations */}
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--text-1)]">1. ไฟล์หมุดรังวัด (Stations CSV)</span>
                <button
                  type="button"
                  onClick={downloadStationsTemplateCsv}
                  className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface-3)] text-[var(--accent)] border border-[var(--border)] font-bold text-[11px] flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>ดาวน์โหลด Template</span>
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-2)]">
                หัวคอลัมน์: <code className="font-mono text-[var(--accent)]">Station_ID, Easting_m, Northing_m, Is_Fixed_Control</code>
              </p>
              <div className="font-mono text-[10px] bg-[var(--surface)] p-2 rounded border border-[var(--border)] text-[var(--text-3)] space-y-0.5">
                <div>CK-01, 669500.250, 1531000.500, TRUE</div>
                <div>STN-02, 669750.800, 1531200.100, FALSE</div>
              </div>
            </div>

            {/* Guide 2: Observations */}
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--text-1)]">2. ไฟล์ค่ารังวัด (Observations CSV)</span>
                <button
                  type="button"
                  onClick={downloadObservationsTemplateCsv}
                  className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface-3)] text-[var(--accent)] border border-[var(--border)] font-bold text-[11px] flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>ดาวน์โหลด Template</span>
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-2)]">
                หัวคอลัมน์: <code className="font-mono text-[var(--accent)]">Obs_ID, Type, From_Station, To_Station, Value_1, Value_2, StdDev</code>
              </p>
              <div className="font-mono text-[10px] bg-[var(--surface)] p-2 rounded border border-[var(--border)] text-[var(--text-3)] space-y-0.5">
                <div>DIST_01, distance, CK-01, STN-02, 254.321, , 0.005</div>
                <div>GNSS_01, baseline_vector, CK-01, STN-03, 399.750, -200.500, 0.008</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {inputError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{inputError}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2D MODE: STATIONS & OBSERVATIONS TABLES */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {adjustmentMode === '2d' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 1. Stations Card (5 cols) */}
          <div className="lg:col-span-5 fusion-card p-4 sm:p-5 space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div>
                <h3 className="text-xs font-bold text-[var(--text-1)] uppercase tracking-wider">
                  1. หมุดรังวัด (Stations: {stations2D.length})
                </h3>
                <p className="text-[11px] text-[var(--text-3)]">
                  ต้องมีหมุดหลักฐานอ้างอิง (Fixed Control) อย่างน้อย 1 หมุด
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  ref={stationsFileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleUploadStationsCsv}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={downloadStationsTemplateCsv}
                  className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--accent)] border border-[var(--border)] transition-colors"
                  title="ดาวน์โหลดไฟล์แม่แบบหมุด (Template CSV)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => stationsFileInputRef.current?.click()}
                  className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border)] transition-colors"
                  title="นำเข้าหมุดจาก CSV"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadStationsCsv}
                  className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border)] transition-colors"
                  title="ส่งออกหมุดเป็น CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stations Table */}
            <div className="overflow-x-auto -mx-4 px-4 max-h-64 flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] font-mono text-[var(--text-3)]">
                  <tr>
                    <th className="py-1.5 px-2">หมุด</th>
                    <th className="py-1.5 px-2 text-center">Fixed</th>
                    <th className="py-1.5 px-2 text-right">Easting (m)</th>
                    <th className="py-1.5 px-2 text-right">Northing (m)</th>
                    <th className="py-1.5 px-2 text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-mono">
                  {stations2D.map(stn => {
                    const e = stn.isFixed ? stn.knownE : stn.approxE;
                    const n = stn.isFixed ? stn.knownN : stn.approxN;
                    return (
                      <tr key={stn.id} className="hover:bg-[var(--surface-2)]">
                        <td className="py-1.5 px-2 font-bold text-[var(--text-1)]">{stn.id}</td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStationFixed2D(stn.id)}
                            className="p-1 hover:text-[var(--accent)]"
                          >
                            {stn.isFixed ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-[var(--text-3)]" />
                            )}
                          </button>
                        </td>
                        <td className="py-1.5 px-2 text-right">{e?.toFixed(3) ?? '-'}</td>
                        <td className="py-1.5 px-2 text-right">{n?.toFixed(3) ?? '-'}</td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteStation2D(stn.id)}
                            className="p-1 text-[var(--text-3)] hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {stations2D.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 px-3 text-center text-xs font-sans">
                        <div className="space-y-2">
                          <p className="font-semibold text-[var(--text-2)]">ตารางหมุดว่างเปล่า (Blank Mode)</p>
                          <p className="text-[11px] text-[var(--text-3)]">
                            กรอกหมุดใหม่ด้านล่าง หรือดาวน์โหลด Template เพื่อนำเข้าจาก Excel
                          </p>
                          <div className="flex justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={downloadStationsTemplateCsv}
                              className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--accent)] border border-[var(--border)] font-bold text-[11px] flex items-center gap-1 shadow-sm"
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>ดาวน์โหลด Template หมุด</span>
                            </button>
                            <button
                              type="button"
                              onClick={onResetSample}
                              className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] border border-[var(--border)] text-[11px]"
                            >
                              โหลดตัวอย่าง
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Station Inline Form */}
            <div className="pt-2 border-t border-[var(--border)] space-y-2">
              <span className="text-[11px] font-bold text-[var(--text-2)] block">+ เพิ่มหมุดใหม่</span>
              <div className="grid grid-cols-12 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="รหัส (เช่น A)"
                  value={newStnId}
                  onChange={e => setNewStnId(e.target.value)}
                  className="col-span-3 p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Easting"
                  value={newStnE}
                  onChange={e => setNewStnE(e.target.value)}
                  className="col-span-3 p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Northing"
                  value={newStnN}
                  onChange={e => setNewStnN(e.target.value)}
                  className="col-span-3 p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs"
                />
                <div className="col-span-3 flex items-center gap-1">
                  <label className="flex items-center gap-1 text-[10px] cursor-pointer text-[var(--text-2)]">
                    <input
                      type="checkbox"
                      checked={newStnFixed}
                      onChange={e => setNewStnFixed(e.target.checked)}
                      className="rounded"
                    />
                    <span>Fixed</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStation2D}
                    className="p-1.5 rounded bg-[var(--accent)] text-black dark:text-white font-bold text-xs ml-auto shadow-sm"
                    title="เพิ่มหมุด"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* 2. Observations Card (7 cols) */}
          <div className="lg:col-span-7 fusion-card p-4 sm:p-5 space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div>
                <h3 className="text-xs font-bold text-[var(--text-1)] uppercase tracking-wider">
                  2. ค่ารังวัด (Observations: {obs2D.length})
                </h3>
                <p className="text-[11px] text-[var(--text-3)]">
                  ระยะทาง (m), มุมกวาด Azimuth (°), หรือเวกเตอร์ GNSS Baseline (ΔE, ΔN)
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  ref={obsFileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleUploadObsCsv}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={downloadObservationsTemplateCsv}
                  className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--accent)] border border-[var(--border)] transition-colors"
                  title="ดาวน์โหลดไฟล์แม่แบบค่ารังวัด (Template CSV)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => obsFileInputRef.current?.click()}
                  className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border)] transition-colors"
                  title="นำเข้าค่ารังวัดจาก CSV"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadObsCsv}
                  className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border)] transition-colors"
                  title="ส่งออกค่ารังวัดเป็น CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Observations Table */}
            <div className="overflow-x-auto -mx-4 px-4 max-h-64 flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] font-mono text-[var(--text-3)]">
                  <tr>
                    <th className="py-1.5 px-2">ID</th>
                    <th className="py-1.5 px-2">ประเภท</th>
                    <th className="py-1.5 px-2">จาก &rarr; ถึง</th>
                    <th className="py-1.5 px-2 text-right">ค่ารังวัด</th>
                    <th className="py-1.5 px-2 text-right">StdDev</th>
                    <th className="py-1.5 px-2 text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-mono">
                  {obs2D.map(obs => (
                    <tr key={obs.id} className="hover:bg-[var(--surface-2)]">
                      <td className="py-1.5 px-2 font-bold text-[var(--text-1)] truncate">{obs.id}</td>
                      <td className="py-1.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          obs.type === 'baseline_vector' ? 'bg-emerald-500/15 text-emerald-500' :
                          obs.type === 'distance' ? 'bg-indigo-500/15 text-indigo-500' : 'bg-amber-500/15 text-amber-500'
                        }`}>
                          {obs.type === 'baseline_vector' ? 'GNSS' : obs.type === 'distance' ? 'DIST' : 'AZIM'}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 font-bold">{obs.fromStation} &rarr; {obs.toStation}</td>
                      <td className="py-1.5 px-2 text-right text-[var(--text-1)]">
                        {obs.type === 'baseline_vector' ? (
                          <span>ΔE={obs.measuredValue.toFixed(3)}, ΔN={obs.measuredValue2?.toFixed(3)}</span>
                        ) : obs.type === 'azimuth' ? (
                          <span>{obs.measuredValue.toFixed(4)}°</span>
                        ) : (
                          <span>{obs.measuredValue.toFixed(4)} m</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right text-[var(--text-3)]">±{obs.stdDev}</td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteObs2D(obs.id)}
                          className="p-1 text-[var(--text-3)] hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {obs2D.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 px-3 text-center text-xs font-sans">
                        <div className="space-y-2">
                          <p className="font-semibold text-[var(--text-2)]">ยังไม่มีค่ารังวัด (Blank Mode)</p>
                          <p className="text-[11px] text-[var(--text-3)]">
                            เพิ่มค่ารังวัดด้านล่าง, ส่งมาจาก Step 2, หรือดาวน์โหลด Template เพื่อนำเข้าจาก Excel
                          </p>
                          <div className="flex justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={downloadObservationsTemplateCsv}
                              className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--accent)] border border-[var(--border)] font-bold text-[11px] flex items-center gap-1 shadow-sm"
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>ดาวน์โหลด Template ค่ารังวัด</span>
                            </button>
                            <button
                              type="button"
                              onClick={onResetSample}
                              className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] border border-[var(--border)] text-[11px]"
                            >
                              โหลดตัวอย่าง
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Observation Inline Form */}
            <div className="pt-2 border-t border-[var(--border)] space-y-2">
              <span className="text-[11px] font-bold text-[var(--text-2)] block">+ เพิ่มค่ารังวัดใหม่</span>
              <div className="grid grid-cols-12 gap-2 text-xs">
                <select
                  value={newObsType}
                  onChange={e => setNewObsType(e.target.value as Observation2DType)}
                  className="col-span-3 p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs"
                >
                  <option value="distance">ระยะทาง (Dist)</option>
                  <option value="azimuth">มุมกวาด (Azimuth)</option>
                  <option value="baseline_vector">เวกเตอร์ GNSS</option>
                </select>

                <input
                  type="text"
                  placeholder="จาก (From)"
                  value={newObsFrom}
                  onChange={e => setNewObsFrom(e.target.value)}
                  className="col-span-2 p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs"
                />

                <input
                  type="text"
                  placeholder="ถึง (To)"
                  value={newObsTo}
                  onChange={e => setNewObsTo(e.target.value)}
                  className="col-span-2 p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs"
                />

                <input
                  type="number"
                  step="any"
                  placeholder={newObsType === 'baseline_vector' ? 'ΔE (m)' : 'ค่ารังวัด'}
                  value={newObsVal1}
                  onChange={e => setNewObsVal1(e.target.value)}
                  className={`${newObsType === 'baseline_vector' ? 'col-span-2' : 'col-span-3'} p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs`}
                />

                {newObsType === 'baseline_vector' && (
                  <input
                    type="number"
                    step="any"
                    placeholder="ΔN (m)"
                    value={newObsVal2}
                    onChange={e => setNewObsVal2(e.target.value)}
                    className="col-span-2 p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs"
                  />
                )}

                <button
                  type="button"
                  onClick={handleAddObs2D}
                  className="col-span-1 p-1.5 rounded bg-[var(--accent)] text-black dark:text-white font-bold text-xs flex items-center justify-center shadow-sm"
                  title="เพิ่มค่ารังวัด"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1D MODE: LEVELING BENCHMARKS & RUNS TABLES */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {adjustmentMode === '1d' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Benchmarks Card (5 cols) */}
          <div className="lg:col-span-5 fusion-card p-4 sm:p-5 space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div>
                <h3 className="text-xs font-bold text-[var(--text-1)] uppercase tracking-wider">
                  หมุดระดับ (Benchmarks: {points1D.length})
                </h3>
                <p className="text-[11px] text-[var(--text-3)]">
                  ต้องมีหมุดอ้างอิงความสูง (Fixed BM) อย่างน้อย 1 หมุด
                </p>
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 px-4 max-h-64 flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] font-mono text-[var(--text-3)]">
                  <tr>
                    <th className="py-1.5 px-2">หมุด BM</th>
                    <th className="py-1.5 px-2 text-center">Fixed</th>
                    <th className="py-1.5 px-2 text-right">ระดับ H (m)</th>
                    <th className="py-1.5 px-2 text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-mono">
                  {points1D.map(p => (
                    <tr key={p.id} className="hover:bg-[var(--surface-2)]">
                      <td className="py-1.5 px-2 font-bold text-[var(--text-1)]">{p.id}</td>
                      <td className="py-1.5 px-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${p.isFixed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-[var(--surface-2)] text-[var(--text-3)]'}`}>
                          {p.isFixed ? 'FIXED' : 'ADJ'}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-right font-bold text-[var(--accent)]">
                        {(p.isFixed ? p.knownElevation : p.approxElevation)?.toFixed(4) ?? '-'}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteBenchmark1D(p.id)}
                          className="p-1 text-[var(--text-3)] hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {points1D.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-[var(--text-3)] font-sans">
                        ยังไม่มีหมุดระดับในระบบ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add BM Form */}
            <div className="pt-2 border-t border-[var(--border)] space-y-2">
              <span className="text-[11px] font-bold text-[var(--text-2)] block">+ เพิ่มหมุดระดับ</span>
              <div className="grid grid-cols-12 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="รหัส (เช่น BM1)"
                  value={newBmId}
                  onChange={e => setNewBmId(e.target.value)}
                  className="col-span-4 p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="ระดับความสูง H (m)"
                  value={newBmElev}
                  onChange={e => setNewBmElev(e.target.value)}
                  className="col-span-4 p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs"
                />
                <div className="col-span-4 flex items-center gap-1">
                  <label className="flex items-center gap-1 text-[10px] cursor-pointer text-[var(--text-2)]">
                    <input
                      type="checkbox"
                      checked={newBmFixed}
                      onChange={e => setNewBmFixed(e.target.checked)}
                      className="rounded"
                    />
                    <span>Fixed</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBenchmark1D}
                    className="p-1.5 rounded bg-[var(--accent)] text-black dark:text-white font-bold text-xs ml-auto shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Leveling Runs Card (7 cols) */}
          <div className="lg:col-span-7 fusion-card p-4 sm:p-5 space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div>
                <h3 className="text-xs font-bold text-[var(--text-1)] uppercase tracking-wider">
                  ช่วงการเดินระดับ (Leveling Observations: {obs1D.length})
                </h3>
                <p className="text-[11px] text-[var(--text-3)]">
                  ค่าความต่างระดับ $\Delta H$ (m), ระยะทาง (km), ความคลาดเคลื่อน $\sigma$ (mm)
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  ref={levelingFileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleUploadLevelingCsv}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => levelingFileInputRef.current?.click()}
                  className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border)] transition-colors"
                  title="นำเข้าจาก CSV เดินระดับ"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 px-4 max-h-64 flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] font-mono text-[var(--text-3)]">
                  <tr>
                    <th className="py-1.5 px-2">ID</th>
                    <th className="py-1.5 px-2">จาก &rarr; ถึง</th>
                    <th className="py-1.5 px-2 text-right">ΔH (m)</th>
                    <th className="py-1.5 px-2 text-right">ระยะ (km)</th>
                    <th className="py-1.5 px-2 text-right">σ (mm)</th>
                    <th className="py-1.5 px-2 text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-mono">
                  {obs1D.map(obs => (
                    <tr key={obs.id} className="hover:bg-[var(--surface-2)]">
                      <td className="py-1.5 px-2 font-bold text-[var(--text-1)]">{obs.id}</td>
                      <td className="py-1.5 px-2 font-bold">{obs.fromStation} &rarr; {obs.toStation}</td>
                      <td className="py-1.5 px-2 text-right text-[var(--accent)]">{obs.measuredDh.toFixed(4)} m</td>
                      <td className="py-1.5 px-2 text-right text-[var(--text-2)]">{obs.distanceKm?.toFixed(2) ?? '-'}</td>
                      <td className="py-1.5 px-2 text-right text-[var(--text-3)]">±{obs.stdDevMm ?? 2.0}</td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteObs1D(obs.id)}
                          className="p-1 text-[var(--text-3)] hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {obs1D.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-[var(--text-3)] font-sans">
                        ยังไม่มีค่ารังวัดระดับ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Leveling Run Form */}
            <div className="pt-2 border-t border-[var(--border)] space-y-2">
              <span className="text-[11px] font-bold text-[var(--text-2)] block">+ เพิ่มช่วงการเดินระดับ</span>
              <div className="grid grid-cols-12 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="จาก (From BM)"
                  value={newLevFrom}
                  onChange={e => setNewLevFrom(e.target.value)}
                  className="col-span-3 p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs"
                />
                <input
                  type="text"
                  placeholder="ถึง (To BM)"
                  value={newLevTo}
                  onChange={e => setNewLevTo(e.target.value)}
                  className="col-span-3 p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="ΔH (m)"
                  value={newLevDh}
                  onChange={e => setNewLevDh(e.target.value)}
                  className="col-span-3 p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddObs1D}
                  className="col-span-3 p-1.5 rounded bg-[var(--accent)] text-black dark:text-white font-bold text-xs flex items-center justify-center shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>เพิ่มช่วง</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
