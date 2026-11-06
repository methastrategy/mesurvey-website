import React, { useRef, useState } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Download, 
  MapPin, 
  Radio, 
  ArrowRight,
  X
} from 'lucide-react';
import { parseRinexText, type RinexParseResult } from '../../utils/rinex-parser';
import { parseHcnBuffer, isHcnBuffer, type HcnParseResult } from '../../utils/hcn-parser';
import { parseEmlidPosText, isEmlidPosText, type EmlidPosParseResult } from '../../utils/emlid-pos-parser';

interface RinexUploadPanelProps {
  baseRinex: RinexParseResult | null;
  roverRinex: RinexParseResult | null;
  baseFileName?: string;
  roverFileName?: string;
  onBaseLoaded: (result: RinexParseResult, filename: string) => void;
  onRoverLoaded: (result: RinexParseResult, filename: string) => void;
  onEmlidPosLoaded?: (result: EmlidPosParseResult, filename: string) => void;
  onPlotOnMap?: (lat: number, lng: number, label: string) => void;
  onGoToBaseline?: () => void;
  onGoToAdjustment?: () => void;
  onResetSample: () => void;
  onClearFiles?: () => void;
}

export const RinexUploadPanel: React.FC<RinexUploadPanelProps> = ({
  baseRinex,
  roverRinex,
  baseFileName = '',
  roverFileName = '',
  onBaseLoaded,
  onRoverLoaded,
  onEmlidPosLoaded,
  onPlotOnMap,
  onGoToBaseline,
  onGoToAdjustment,
  onResetSample,
  onClearFiles
}) => {
  const baseFileInputRef = useRef<HTMLInputElement>(null);
  const roverFileInputRef = useRef<HTMLInputElement>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Drag-and-drop hover states
  const [isBaseDragging, setIsBaseDragging] = useState(false);
  const [isRoverDragging, setIsRoverDragging] = useState(false);

  // Metadata caches
  const [baseHcn, setBaseHcn] = useState<HcnParseResult | null>(null);
  const [roverHcn, setRoverHcn] = useState<HcnParseResult | null>(null);
  const [lastEmlidPos, setLastEmlidPos] = useState<EmlidPosParseResult | null>(null);

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processFile = async (file: File, target: 'base' | 'rover') => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      // 1. CHCNAV HCN Binary Files
      if (ext === 'hcn' || ext === 'hrc') {
        const buffer = await file.arrayBuffer();
        if (!isHcnBuffer(buffer)) {
          throw new Error('ไฟล์นี้ไม่มีรูปแบบหัวตารางของ CHCNAV ที่ถูกต้อง');
        }
        const hcnResult = parseHcnBuffer(buffer, file.name);
        if (target === 'base') {
          setBaseHcn(hcnResult);
          onBaseLoaded(hcnResult.asRinex, file.name);
        } else {
          setRoverHcn(hcnResult);
          onRoverLoaded(hcnResult.asRinex, file.name);
        }
        setSuccessMessage(`โหลดหมุด ${hcnResult.metadata.markerName} จากไฟล์ ${file.name} เรียบร้อย`);
        return;
      }

      // 2. Emlid Studio / RTKLIB .pos Solution Files
      if (ext === 'pos') {
        const text = await file.text();
        if (isEmlidPosText(text)) {
          const posResult = parseEmlidPosText(text, file.name);
          setLastEmlidPos(posResult);
          if (onEmlidPosLoaded) {
            onEmlidPosLoaded(posResult, file.name);
          }
          onRoverLoaded({
            header: {
              version: '3.04',
              fileType: 'O (Emlid Studio .pos)',
              markerName: file.name.replace(/\.[^/.]+$/, '').toUpperCase(),
              approxGeodetic: {
                lat: posResult.computedPosition.lat,
                lng: posResult.computedPosition.lng,
                height: posResult.computedPosition.height
              },
              obsTypes: ['L1', 'L2', 'C1', 'C2']
            },
            totalEpochs: posResult.totalEpochsCount,
            durationMinutes: Math.max(15, Math.round(posResult.totalEpochsCount / 60)),
            constellationsDetected: ['GPS', 'BeiDou', 'GLONASS', 'Galileo'],
            satellitesTracked: [],
            averageSnr: 46.0,
            cycleSlipCount: 0,
            healthStatus: posResult.overallStatus === 'FIXED' ? 'HEALTHY' : 'DEGRADED'
          }, file.name);

          setSuccessMessage(`นำเข้าโซลูชัน ${posResult.program}: สถานะ ${posResult.overallStatus} (Ratio: ${posResult.bestRatio}) เรียบร้อย`);
          return;
        }
      }

      // 3. Fallback Buffer check for HCN
      const slice = await file.slice(0, 128).arrayBuffer();
      if (isHcnBuffer(slice)) {
        const fullBuf = await file.arrayBuffer();
        const hcnResult = parseHcnBuffer(fullBuf, file.name);
        if (target === 'base') {
          setBaseHcn(hcnResult);
          onBaseLoaded(hcnResult.asRinex, file.name);
        } else {
          setRoverHcn(hcnResult);
          onRoverLoaded(hcnResult.asRinex, file.name);
        }
        setSuccessMessage(`โหลดหมุด ${hcnResult.metadata.markerName} สำเร็จ`);
        return;
      }

      // 4. Standard Text RINEX (2.xx / 3.xx)
      const text = await file.text();
      if (isEmlidPosText(text)) {
        const posResult = parseEmlidPosText(text, file.name);
        setLastEmlidPos(posResult);
        if (onEmlidPosLoaded) onEmlidPosLoaded(posResult, file.name);
        setSuccessMessage(`นำเข้าโซลูชัน .pos สำเร็จ`);
        return;
      }

      const parsed = parseRinexText(text);
      if (target === 'base') {
        setBaseHcn(null);
        onBaseLoaded(parsed, file.name);
      } else {
        setRoverHcn(null);
        onRoverLoaded(parsed, file.name);
      }
      setSuccessMessage(`โหลดไฟล์ RINEX หมุด ${parsed.header.markerName} สำเร็จ`);
    } catch (err: any) {
      setErrorMessage(`ไม่สามารถอ่านไฟล์ ${file.name}: ${err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`);
    }
  };

  const handleDrop = (e: React.DragEvent, target: 'base' | 'rover') => {
    e.preventDefault();
    if (target === 'base') setIsBaseDragging(false);
    else setIsRoverDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file, target);
    }
  };

  const handleClearAll = () => {
    setBaseHcn(null);
    setRoverHcn(null);
    setLastEmlidPos(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (onClearFiles) onClearFiles();
  };

  return (
    <div className="fusion-card p-4 sm:p-5 space-y-3.5">
      {/* Header bar: Compact and clear */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
            <Upload className="w-4 h-4 text-[var(--accent)]" />
            <span>นำเข้าข้อมูลดาวเทียม & เวกเตอร์รังวัด (GNSS Field Ingestion)</span>
          </h3>
          <p className="text-xs text-[var(--text-2)] mt-0.5">
            ลากวางหรือเลือกไฟล์ <b>.HCN</b> (CHCNAV), <b>.pos</b> (Emlid Studio / RTKLIB), หรือ <b>.rnx / .obs</b> (RINEX 2/3)
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {(baseRinex || roverRinex || lastEmlidPos) && onClearFiles && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-rose-500/10 hover:text-rose-500 text-[var(--text-3)] text-xs font-semibold flex items-center gap-1 transition-colors"
              title="ล้างข้อมูลทั้งหมด"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ล้าง</span>
            </button>
          )}
          <button
            type="button"
            onClick={onResetSample}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="โหลดข้อมูลตัวอย่างสำหรับทดสอบ"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>โหลดตัวอย่าง</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Two Station Dropzones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* Base Station Slot */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsBaseDragging(true); }}
          onDragLeave={() => setIsBaseDragging(false)}
          onDrop={(e) => handleDrop(e, 'base')}
          className={`p-3.5 rounded-xl border transition-all ${
            isBaseDragging 
              ? 'border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.01]' 
              : 'border-[var(--border)] bg-[var(--surface-2)]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${baseRinex ? 'bg-emerald-500' : 'bg-[var(--text-3)]'}`} />
              <span className="font-bold text-xs text-[var(--text-1)]">สถานีฐาน (Base Station)</span>
            </div>
            {baseRinex && (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-emerald-500 border border-emerald-500/20">
                {baseRinex.header.markerName}
              </span>
            )}
          </div>

          {baseRinex ? (
            <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-1)]">
                <span className="font-bold truncate">{baseFileName || 'Base File'}</span>
                {baseHcn && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--accent)]/15 text-[var(--accent)] font-sans font-bold">
                    HCN
                  </span>
                )}
              </div>

              {/* Coordinates line */}
              {baseRinex.header.approxGeodetic && (
                <div className="text-[11px] text-[var(--text-2)] font-sans">
                  Lat {baseRinex.header.approxGeodetic.lat.toFixed(6)}°, Lon {baseRinex.header.approxGeodetic.lng.toFixed(6)}°
                </div>
              )}

              {/* Hardware / Antenna details */}
              <div className="text-[11px] text-[var(--text-3)] flex items-center justify-between font-sans">
                <span>{baseRinex.header.receiverType || 'GNSS Receiver'}</span>
                {baseRinex.header.antennaDelta?.h ? (
                  <span>เสา: {baseRinex.header.antennaDelta.h.toFixed(3)} m</span>
                ) : null}
              </div>

              {/* Quick Action Icons */}
              <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-[var(--border)] font-sans">
                {baseHcn && (
                  <button
                    type="button"
                    onClick={() => downloadTextFile(baseHcn.syntheticRinexHeader, `${baseHcn.metadata.markerName}.rnx`)}
                    className="p-1.5 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] text-[10px] flex items-center gap-1 transition-colors"
                    title="บันทึกไฟล์ RINEX Header (.rnx)"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>RINEX</span>
                  </button>
                )}
                {onPlotOnMap && baseRinex.header.approxGeodetic && (
                  <button
                    type="button"
                    onClick={() => onPlotOnMap(baseRinex.header.approxGeodetic!.lat, baseRinex.header.approxGeodetic!.lng, baseRinex.header.markerName)}
                    className="p-1.5 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] text-[10px] flex items-center gap-1 transition-colors"
                    title="เปิดตำแหน่งบนแผนที่ WebGIS"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>แผนที่</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => baseFileInputRef.current?.click()}
                  className="p-1.5 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] text-[10px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>เปลี่ยน</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => baseFileInputRef.current?.click()}
              className="w-full py-6 px-3 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)]/40 hover:bg-[var(--surface)] text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
            >
              <Upload className="w-5 h-5 text-[var(--text-3)]" />
              <span className="text-xs font-semibold text-[var(--text-1)]">ลากไฟล์สถานีฐานมาวางที่นี่</span>
              <span className="text-[11px] text-[var(--text-3)]">หรือคลิกเพื่อเลือก .HCN, .RNX, .OBS</span>
            </button>
          )}

          <input
            ref={baseFileInputRef}
            type="file"
            accept=".obs,.rnx,.txt,.hcn,.hrc,.*o,.*d"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file, 'base');
              e.target.value = '';
            }}
            className="hidden"
          />
        </div>

        {/* Rover Station Slot */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsRoverDragging(true); }}
          onDragLeave={() => setIsRoverDragging(false)}
          onDrop={(e) => handleDrop(e, 'rover')}
          className={`p-3.5 rounded-xl border transition-all ${
            isRoverDragging 
              ? 'border-cyan-400 bg-cyan-400/5 scale-[1.01]' 
              : 'border-[var(--border)] bg-[var(--surface-2)]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${roverRinex ? 'bg-cyan-400' : 'bg-[var(--text-3)]'}`} />
              <span className="font-bold text-xs text-[var(--text-1)]">สถานีรังวัด (Rover Station)</span>
            </div>
            {roverRinex && (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-cyan-400 border border-cyan-400/20">
                {roverRinex.header.markerName}
              </span>
            )}
          </div>

          {roverRinex ? (
            <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-1)]">
                <span className="font-bold truncate">{roverFileName || 'Rover File'}</span>
                {roverHcn ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--accent)]/15 text-[var(--accent)] font-sans font-bold">
                    HCN
                  </span>
                ) : lastEmlidPos ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-400/15 text-cyan-400 font-sans font-bold">
                    {lastEmlidPos.overallStatus}
                  </span>
                ) : null}
              </div>

              {/* Coordinates line */}
              {roverRinex.header.approxGeodetic && (
                <div className="text-[11px] text-[var(--text-2)] font-sans">
                  Lat {roverRinex.header.approxGeodetic.lat.toFixed(6)}°, Lon {roverRinex.header.approxGeodetic.lng.toFixed(6)}°
                </div>
              )}

              {/* Hardware / Vector details */}
              <div className="text-[11px] text-[var(--text-3)] flex items-center justify-between font-sans">
                <span>{lastEmlidPos ? `${lastEmlidPos.program} (Ratio ${lastEmlidPos.bestRatio})` : (roverRinex.header.receiverType || 'GNSS Receiver')}</span>
                {lastEmlidPos && lastEmlidPos.vectorENU.distance2D > 0 ? (
                  <span className="font-bold text-cyan-400">ระยะ: {lastEmlidPos.vectorENU.distance2D.toFixed(2)} m</span>
                ) : roverRinex.header.antennaDelta?.h ? (
                  <span>เสา: {roverRinex.header.antennaDelta.h.toFixed(3)} m</span>
                ) : null}
              </div>

              {/* Quick Action Icons */}
              <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-[var(--border)] font-sans">
                {roverHcn && (
                  <button
                    type="button"
                    onClick={() => downloadTextFile(roverHcn.syntheticRinexHeader, `${roverHcn.metadata.markerName}.rnx`)}
                    className="p-1.5 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] text-[10px] flex items-center gap-1 transition-colors"
                    title="บันทึกไฟล์ RINEX Header (.rnx)"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>RINEX</span>
                  </button>
                )}
                {onPlotOnMap && roverRinex.header.approxGeodetic && (
                  <button
                    type="button"
                    onClick={() => onPlotOnMap(roverRinex.header.approxGeodetic!.lat, roverRinex.header.approxGeodetic!.lng, roverRinex.header.markerName)}
                    className="p-1.5 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] text-[10px] flex items-center gap-1 transition-colors"
                    title="เปิดตำแหน่งบนแผนที่ WebGIS"
                  >
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>แผนที่</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => roverFileInputRef.current?.click()}
                  className="p-1.5 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] text-[10px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>เปลี่ยน</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => roverFileInputRef.current?.click()}
              className="w-full py-6 px-3 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-cyan-400 bg-[var(--surface)]/40 hover:bg-[var(--surface)] text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
            >
              <Upload className="w-5 h-5 text-[var(--text-3)]" />
              <span className="text-xs font-semibold text-[var(--text-1)]">ลากไฟล์สถานีรังวัดมาวางที่นี่</span>
              <span className="text-[11px] text-[var(--text-3)]">หรือคลิกเพื่อเลือก .HCN, .POS, .RNX</span>
            </button>
          )}

          <input
            ref={roverFileInputRef}
            type="file"
            accept=".obs,.rnx,.txt,.hcn,.hrc,.pos,.*o,.*d"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file, 'rover');
              e.target.value = '';
            }}
            className="hidden"
          />
        </div>

      </div>

      {/* Direct Smart Action Pathway: Only appears when files are loaded */}
      {(baseRinex && roverRinex) && (
        <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--accent)]/30">
          <div className="text-xs text-[var(--text-1)] flex items-center gap-2">
            <Radio className="w-4 h-4 text-[var(--accent)]" />
            <span>พร้อมประมวลผลเวกเตอร์ฐาน: <b>{baseRinex.header.markerName}</b> $\to$ <b>{roverRinex.header.markerName}</b></span>
          </div>
          <div className="flex items-center gap-2">
            {onGoToBaseline && (
              <button
                type="button"
                onClick={onGoToBaseline}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-90 text-black dark:text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
              >
                <span>คำนวณเวกเตอร์ฐาน (STEP 02)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {lastEmlidPos && !baseRinex && onGoToAdjustment && (
        <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
          <div className="text-xs text-[var(--text-1)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>เวกเตอร์ Emlid Studio (.pos) เชื่อมโยงเข้าสู่ระบบเรียบร้อย</span>
          </div>
          <button
            type="button"
            onClick={onGoToAdjustment}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
          >
            <span>ไปปรับแก้โครงข่าย (STEP 03)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
