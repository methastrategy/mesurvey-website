import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { parseRinexText, type RinexParseResult, SAMPLE_RINEX_BASE, SAMPLE_RINEX_ROVER } from '../../utils/rinex-parser';

interface RinexUploadPanelProps {
  baseRinex: RinexParseResult;
  roverRinex: RinexParseResult;
  onBaseLoaded: (result: RinexParseResult, filename: string) => void;
  onRoverLoaded: (result: RinexParseResult, filename: string) => void;
  onResetSample: () => void;
}

export const RinexUploadPanel: React.FC<RinexUploadPanelProps> = ({
  baseRinex,
  roverRinex,
  onBaseLoaded,
  onRoverLoaded,
  onResetSample
}) => {
  const baseFileInputRef = useRef<HTMLInputElement>(null);
  const roverFileInputRef = useRef<HTMLInputElement>(null);

  const [baseFileName, setBaseFileName] = useState<string>('SAMPLE_BASE_KU01.23O');
  const [roverFileName, setRoverFileName] = useState<string>('SAMPLE_ROVER_ROV1.23O');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showPasteModal, setShowPasteModal] = useState<'base' | 'rover' | null>(null);
  const [pastedText, setPastedText] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'base' | 'rover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    try {
      const text = await file.text();
      const parsed = parseRinexText(text);
      if (target === 'base') {
        setBaseFileName(file.name);
        onBaseLoaded(parsed, file.name);
      } else {
        setRoverFileName(file.name);
        onRoverLoaded(parsed, file.name);
      }
    } catch (err: any) {
      setErrorMessage(`ไม่สามารถอ่านไฟล์ ${file.name}: ${err?.message || 'รูปแบบ RINEX ไม่ถูกต้อง'}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleApplyPasted = () => {
    if (!showPasteModal || !pastedText.trim()) return;
    setErrorMessage(null);
    try {
      const parsed = parseRinexText(pastedText);
      if (showPasteModal === 'base') {
        setBaseFileName('PASTED_BASE_RINEX.txt');
        onBaseLoaded(parsed, 'PASTED_BASE_RINEX.txt');
      } else {
        setRoverFileName('PASTED_ROVER_RINEX.txt');
        onRoverLoaded(parsed, 'PASTED_ROVER_RINEX.txt');
      }
      setShowPasteModal(null);
      setPastedText('');
    } catch (err: any) {
      setErrorMessage(`รูปแบบ RINEX ที่วางไม่ถูกต้อง: ${err?.message || 'กรุณาตรวจสอบ Header'}`);
    }
  };

  return (
    <div className="fusion-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
            <Upload className="w-4 h-4 text-[var(--accent)]" />
            <span>นำเข้าไฟล์รังวัดดาวเทียม RINEX (Multi-GNSS Data Ingestion)</span>
          </h3>
          <p className="text-xs text-[var(--text-2)]">
            รองรับไฟล์ Observation RINEX 2.xx / 3.0x (.obs, .rnx, .*o, .*d, .txt) จากเครื่องรับสัญญาณ GNSS ทุกยี่ห้อ (Trimble, Leica, CHCNAV, Hi-Target, Stonex, South)
          </p>
        </div>

        <button
          type="button"
          onClick={onResetSample}
          className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>คืนค่าตัวอย่าง (Load Sample)</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Two Upload Cards: Base Station & Rover Station */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Base Station Card */}
        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[var(--text-1)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ไฟล์สถานีฐาน (Base Station RINEX)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--text-3)] border border-[var(--border)]">
              {baseRinex.header.markerName}
            </span>
          </div>

          <div className="text-xs space-y-1 font-mono text-[var(--text-2)] bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)]">
            <div className="truncate"><b>ไฟล์:</b> {baseFileName}</div>
            <div><b>Receiver:</b> {baseRinex.header.receiverType}</div>
            <div><b>Epochs:</b> {baseRinex.totalEpochs} ({baseRinex.durationMinutes} นาที) | <b>Sats:</b> {baseRinex.satellitesTracked.length} ดวง</div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              ref={baseFileInputRef}
              type="file"
              accept=".obs,.rnx,.txt,.*o,.*d"
              onChange={(e) => handleFileChange(e, 'base')}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => baseFileInputRef.current?.click()}
              className="flex-1 py-1.5 px-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--text-1)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm micro-press"
            >
              <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>เลือกไฟล์ Base RINEX</span>
            </button>
            <button
              type="button"
              onClick={() => { setShowPasteModal('base'); setPastedText(''); }}
              className="py-1.5 px-2.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] text-xs transition-colors"
              title="วางข้อความ RINEX โดยตรง"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Rover Station Card */}
        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[var(--text-1)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>ไฟล์สถานีรังวัด (Rover Station RINEX)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--text-3)] border border-[var(--border)]">
              {roverRinex.header.markerName}
            </span>
          </div>

          <div className="text-xs space-y-1 font-mono text-[var(--text-2)] bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)]">
            <div className="truncate"><b>ไฟล์:</b> {roverFileName}</div>
            <div><b>Receiver:</b> {roverRinex.header.receiverType}</div>
            <div><b>Epochs:</b> {roverRinex.totalEpochs} ({roverRinex.durationMinutes} นาที) | <b>Sats:</b> {roverRinex.satellitesTracked.length} ดวง</div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              ref={roverFileInputRef}
              type="file"
              accept=".obs,.rnx,.txt,.*o,.*d"
              onChange={(e) => handleFileChange(e, 'rover')}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => roverFileInputRef.current?.click()}
              className="flex-1 py-1.5 px-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--text-1)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm micro-press"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>เลือกไฟล์ Rover RINEX</span>
            </button>
            <button
              type="button"
              onClick={() => { setShowPasteModal('rover'); setPastedText(''); }}
              className="py-1.5 px-2.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] text-xs transition-colors"
              title="วางข้อความ RINEX โดยตรง"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Paste RAW Text Modal */}
      {showPasteModal && (
        <div className="p-4 rounded-xl bg-[var(--surface)] border-2 border-[var(--accent)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-1)]">
              วางข้อความ RINEX สำหรับสถานี {showPasteModal === 'base' ? 'ฐาน (Base)' : 'รังวัด (Rover)'}
            </span>
            <button
              type="button"
              onClick={() => setShowPasteModal(null)}
              className="text-xs text-[var(--text-3)] hover:text-[var(--text-1)]"
            >
              ยกเลิก
            </button>
          </div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="วางเนื้อหาไฟล์ RINEX (รวมทั้ง Header และ Observation lines)..."
            rows={6}
            className="w-full p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPasteModal(null)}
              className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text-1)]"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleApplyPasted}
              className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-black dark:text-white text-xs font-bold shadow-sm"
            >
              วิเคราะห์และบันทึก (Parse RINEX)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
