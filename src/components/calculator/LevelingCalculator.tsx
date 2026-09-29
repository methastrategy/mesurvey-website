import React from 'react';
import { calculateLevelingLoop } from '../../core/leveling';
import { useSurveyStore } from '../../store/useSurveyStore';
import { Plus, Trash2, RotateCcw, CheckCircle2, AlertCircle, Download, Save, Eraser, BookOpen } from 'lucide-react';
import { trackEvent } from '../../lib/telemetry';
import { exportToCsv } from '../../utils/csv-export';

export const LevelingCalculator: React.FC = () => {
  const {
    levelingStartElevation,
    levelingLoopDistanceKm,
    levelingRows,
    levelingLastSaved,
    setLevelingStartElevation,
    setLevelingLoopDistanceKm,
    updateLevelingRow,
    addLevelingRow,
    removeLevelingRow,
    resetLevelingToSample,
    clearLeveling
  } = useSurveyStore();

  const startElevNum = parseFloat(levelingStartElevation) || 0;
  const distKmNum = parseFloat(levelingLoopDistanceKm) || 1.0;

  let result = null;
  let errorMsg = null;

  try {
    result = calculateLevelingLoop(levelingRows, startElevNum, startElevNum, distKmNum);
  } catch (err: any) {
    errorMsg = err.message || 'Error calculating leveling loop';
  }

  const handleExportCsv = () => {
    if (!result) return;
    trackEvent('leveling_export_csv', { count: result.rows.length });
    const headers = ['Station', 'BS(m)', 'IFS(m)', 'FS(m)', 'HI(m)', 'Rise(m)', 'Fall(m)', 'Elevation_RL(m)', 'Remark'];
    const csvRows = result.rows.map(r => [
      r.station,
      r.bs !== null ? r.bs.toFixed(3) : '',
      r.ifs !== null ? r.ifs.toFixed(3) : '',
      r.fs !== null ? r.fs.toFixed(3) : '',
      r.hi !== null ? r.hi.toFixed(3) : '',
      r.rise !== null ? r.rise.toFixed(3) : '',
      r.fall !== null ? r.fall.toFixed(3) : '',
      r.elevation.toFixed(3),
      r.remark || ''
    ]);
    exportToCsv({
      filename: `leveling_loop_results_${Date.now()}.csv`,
      headers,
      rows: csvRows
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Configuration Header & Draft Status */}
      <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] p-5 sm:p-6 shadow-sm">
        
        {/* Persistence Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-3 py-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs">
          <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-medium">
            <Save className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span>ระบบบันทึกฉบับร่างอัตโนมัติ (Offline Persistent Draft)</span>
          </div>
          <span className="text-xs text-emerald-700/80 dark:text-emerald-400 font-mono tabular-nums">
            บันทึกแล้ว: {new Date(levelingLastSaved).toLocaleTimeString('th-TH')}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-border dark:border-[#27272a] pb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              ตารางจดและคำนวณงานระดับ (Differential Leveling Notebook)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              คำนวณวิธี HI และ Rise & Fall พร้อมตรวจสอบผลบวกหน้ากระดาษ (Page Check) และเกณฑ์ความคลาดเคลื่อนปิดรอบ
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <a
              href="#/knowledge/differential-leveling-survey"
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#18181b] hover:bg-surface-3 dark:hover:bg-[#27272a] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center space-x-1.5 border border-border dark:border-[#27272a]"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>คู่มือวิชาการ: Two-Peg & 3-Wire Differential Leveling</span>
            </a>
            <button
              onClick={resetLevelingToSample}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#18181b] hover:bg-surface-3 dark:hover:bg-[#27272a] text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center space-x-1.5 border border-border dark:border-[#27272a]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>โหลดข้อมูลตัวอย่าง</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการล้างข้อมูลระดับทั้งหมดเพื่อเริ่มใหม่หรือไม่?')) {
                  clearLeveling();
                }
              }}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-rose-500/10 dark:bg-rose-950/30 hover:bg-rose-500/20 text-xs font-medium text-rose-700 dark:text-rose-400 transition-colors flex items-center space-x-1.5 border border-rose-500/20"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>ล้างตาราง</span>
            </button>
          </div>
        </div>

        {/* Start Elevation and Loop Distance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs max-w-xl">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              ค่าระดับหมุดเริ่มต้น (Start Benchmark RL - m)
            </label>
            <input
              type="number"
              step="0.001"
              value={levelingStartElevation}
              onChange={(e) => setLevelingStartElevation(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              ระยะทางตลอดสายงานรวม K (km)
            </label>
            <input
              type="number"
              step="0.01"
              value={levelingLoopDistanceKm}
              onChange={(e) => setLevelingLoopDistanceKm(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Leveling Table Input */}
      <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] p-4 sm:p-6 shadow-sm overflow-x-auto w-full max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            บันทึกการอ่านไม้ระดับ (Staff Readings Log)
          </h4>
          <button
            onClick={addLevelingRow}
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มแถวรังวัด</span>
          </button>
        </div>

        <table className="w-full text-left text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-border dark:border-[#27272a] text-slate-400 font-semibold">
              <th className="py-2.5 px-2">ลำดับ</th>
              <th className="py-2.5 px-2">ชื่อสถานี (Station)</th>
              <th className="py-2.5 px-2">ส่องหลัง BS (m)</th>
              <th className="py-2.5 px-2">ส่องกลาง IFS (m)</th>
              <th className="py-2.5 px-2">ส่องหน้า FS (m)</th>
              <th className="py-2.5 px-2">หมายเหตุ (Remark)</th>
              <th className="py-2.5 px-2 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 dark:divide-[#27272a]">
            {levelingRows.map((row, idx) => (
              <tr key={row.id} className="hover:bg-surface-2/50 dark:hover:bg-[#18181b]/50 transition-colors">
                <td className="py-2 px-2 font-mono text-slate-400">{idx + 1}</td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    aria-label={`ชื่อสถานีแถวที่ ${idx + 1}`}
                    value={row.station}
                    onChange={(e) => updateLevelingRow(idx, 'station', e.target.value)}
                    className="w-24 min-h-[36px] px-2.5 py-1 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    step="0.001"
                    aria-label={`ค่าส่องหลัง BS แถวที่ ${idx + 1}`}
                    value={row.bs !== null ? row.bs : ''}
                    placeholder="BS"
                    onChange={(e) => updateLevelingRow(idx, 'bs', e.target.value)}
                    className="w-24 min-h-[36px] px-2.5 py-1 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    step="0.001"
                    aria-label={`ค่าส่องกลาง IFS แถวที่ ${idx + 1}`}
                    value={row.ifs !== null ? row.ifs : ''}
                    placeholder="IFS"
                    onChange={(e) => updateLevelingRow(idx, 'ifs', e.target.value)}
                    className="w-24 min-h-[36px] px-2.5 py-1 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    step="0.001"
                    aria-label={`ค่าส่องหน้า FS แถวที่ ${idx + 1}`}
                    value={row.fs !== null ? row.fs : ''}
                    placeholder="FS"
                    onChange={(e) => updateLevelingRow(idx, 'fs', e.target.value)}
                    className="w-24 min-h-[36px] px-2.5 py-1 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] font-mono text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    aria-label={`หมายเหตุแถวที่ ${idx + 1}`}
                    value={row.remark || ''}
                    placeholder="คำอธิบาย..."
                    onChange={(e) => updateLevelingRow(idx, 'remark', e.target.value)}
                    className="w-full min-h-[36px] px-2.5 py-1 rounded-lg border border-border dark:border-[#27272a] bg-surface-2 dark:bg-[#0a0a0b] text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </td>
                <td className="py-2 px-2 text-right">
                  <button
                    onClick={() => removeLevelingRow(idx)}
                    disabled={levelingRows.length <= 1}
                    aria-label={`ลบแถวรังวัดที่ ${idx + 1}`}
                    title={`ลบแถวรังวัดที่ ${idx + 1}`}
                    className="min-h-[36px] min-w-[36px] p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-950/30 disabled:opacity-30 transition-colors inline-flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Results Section */}
      {errorMsg ? (
        <div className="p-4 rounded-xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
          {errorMsg}
        </div>
      ) : result ? (
        <div className="space-y-6">
          
          {/* Arithmetic Check & Quality Tolerances Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Arithmetic Check Banner */}
            <div className={`p-4 rounded-xl border ${
              result.arithmeticCheckPassed 
                ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                : 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/30 text-rose-900 dark:text-rose-100'
            }`}>
              <div className="flex items-center space-x-2 mb-2 font-bold text-xs sm:text-sm">
                {result.arithmeticCheckPassed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span>
                  {result.arithmeticCheckPassed 
                    ? 'การตรวจสอบผลรวมหน้ากระดาษ: ถูกต้องสมบูรณ์ (Arithmetic Check Passed)'
                    : 'ผลรวมทางคณิตศาสตร์ไม่ลงตัว (Check Math Error)'}
                </span>
              </div>
              <div className="font-mono tabular-nums text-xs space-y-1 pl-7">
                <div>Σ BS = {result.sumBs.toFixed(4)} m | Σ FS = {result.sumFs.toFixed(4)} m</div>
                <div>Σ BS - Σ FS = {result.diffBsFs.toFixed(4)} m</div>
                <div>Last RL - First RL = {result.deltaBenchmarks.toFixed(4)} m</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 pt-1">
                  ความคลาดเคลื่อนปิดรอบ (Closure Error): {result.closureErrorMm.toFixed(2)} mm ({result.closureErrorMeters.toFixed(4)} m)
                </div>
              </div>
            </div>

            {/* RTSD Order Compliance Banner */}
            <div className="p-4 rounded-xl bg-surface-1 dark:bg-[#111113] border border-border dark:border-[#27272a] border-l-2 border-l-indigo-500 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  เกณฑ์ความคลาดเคลื่อนตามระยะทาง K = {result.totalDistanceKm.toFixed(2)} km
                </span>
                <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                  {result.orderCompliance.achievedOrder}
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs font-mono tabular-nums border-t border-border dark:border-[#27272a] mt-2">
                <div>
                  <span className="text-slate-400 block font-sans">ชั้น 1 (±4√K):</span>
                  <span className="font-bold">±{result.orderCompliance.firstOrderMaxMm} mm</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">ชั้น 2 (±8√K):</span>
                  <span className="font-bold">±{result.orderCompliance.secondOrderMaxMm} mm</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">ชั้น 3 (±12√K):</span>
                  <span className="font-bold">±{result.orderCompliance.thirdOrderMaxMm} mm</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">ก่อสร้าง (±24√K):</span>
                  <span className="font-bold">±{result.orderCompliance.constructionMaxMm} mm</span>
                </div>
              </div>
            </div>

          </div>

          {/* Computed Leveling Table */}
          <div className="bg-surface-1 dark:bg-[#111113] rounded-2xl border border-border dark:border-[#27272a] p-4 sm:p-6 shadow-sm overflow-x-auto w-full max-w-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                ตารางสรุปผลการคำนวณระดับ (Computed Reduced Level Table)
              </h4>
              <button
                onClick={handleExportCsv}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#18181b] hover:bg-surface-3 dark:hover:bg-[#27272a] text-slate-700 dark:text-slate-300 font-semibold text-xs border border-border dark:border-[#27272a] transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ส่งออก CSV</span>
              </button>
            </div>

            <table className="w-full text-left text-xs min-w-[780px]">
              <thead>
                <tr className="border-b border-border dark:border-[#27272a] text-slate-400 font-semibold">
                  <th className="py-2.5 px-2">สถานี</th>
                  <th className="py-2.5 px-2">BS (m)</th>
                  <th className="py-2.5 px-2">IFS (m)</th>
                  <th className="py-2.5 px-2">FS (m)</th>
                  <th className="py-2.5 px-2 font-mono text-indigo-600 dark:text-indigo-400">HI (m)</th>
                  <th className="py-2.5 px-2 text-emerald-600 dark:text-emerald-400">Rise (m)</th>
                  <th className="py-2.5 px-2 text-rose-500 dark:text-rose-400">Fall (m)</th>
                  <th className="py-2.5 px-2 font-bold text-indigo-600 dark:text-indigo-400">ระดับ RL (m)</th>
                  <th className="py-2.5 px-2">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-[#27272a] font-mono tabular-nums">
                {result.rows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-surface-2/50 dark:hover:bg-[#18181b]/50 transition-colors">
                    <td className="py-2.5 px-2 font-sans font-semibold text-slate-800 dark:text-slate-200">{r.station}</td>
                    <td className="py-2.5 px-2">{r.bs !== null ? r.bs.toFixed(3) : '-'}</td>
                    <td className="py-2.5 px-2">{r.ifs !== null ? r.ifs.toFixed(3) : '-'}</td>
                    <td className="py-2.5 px-2">{r.fs !== null ? r.fs.toFixed(3) : '-'}</td>
                    <td className="py-2.5 px-2 text-indigo-600 dark:text-indigo-400">{r.hi !== null ? r.hi.toFixed(3) : '-'}</td>
                    <td className="py-2.5 px-2 text-emerald-600 dark:text-emerald-400">{r.rise !== null ? `+${r.rise.toFixed(3)}` : '-'}</td>
                    <td className="py-2.5 px-2 text-rose-500 dark:text-rose-400">{r.fall !== null ? `-${r.fall.toFixed(3)}` : '-'}</td>
                    <td className="py-2.5 px-2 font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-950/20 border-l border-indigo-500/30">{r.elevation.toFixed(3)}</td>
                    <td className="py-2.5 px-2 font-sans text-slate-400 text-xs">{r.remark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      ) : null}

    </div>
  );
};
