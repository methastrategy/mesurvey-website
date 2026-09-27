import React, { useState } from 'react';
import { LevelingRowInput } from '../../types/survey';
import { calculateLevelingLoop } from '../../core/leveling';
import { SAMPLE_LEVELING_ROWS, SAMPLE_LEVELING_START_ELEVATION } from '../../data/survey-presets';
import { Plus, Trash2, RotateCcw, CheckCircle2, AlertCircle, Download } from 'lucide-react';

export const LevelingCalculator: React.FC = () => {
  const [startElevation, setStartElevation] = useState<string>(SAMPLE_LEVELING_START_ELEVATION.toString());
  const [loopDistanceKm, setLoopDistanceKm] = useState<string>('0.85');
  const [rows, setRows] = useState<LevelingRowInput[]>(SAMPLE_LEVELING_ROWS);

  const handleAddRow = () => {
    const newId = (rows.length + 1).toString();
    setRows([
      ...rows,
      {
        id: newId,
        station: `ST-${newId}`,
        bs: null,
        ifs: null,
        fs: null,
        remark: ''
      }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, field: keyof LevelingRowInput, value: string) => {
    const newRows = [...rows];
    if (field === 'bs' || field === 'ifs' || field === 'fs') {
      const numVal = value.trim() === '' ? null : parseFloat(value);
      newRows[index] = { ...newRows[index], [field]: isNaN(numVal as any) ? null : numVal };
    } else {
      newRows[index] = { ...newRows[index], [field]: value };
    }
    setRows(newRows);
  };

  const handleResetSample = () => {
    setStartElevation(SAMPLE_LEVELING_START_ELEVATION.toString());
    setLoopDistanceKm('0.85');
    setRows(SAMPLE_LEVELING_ROWS);
  };

  const startElevNum = parseFloat(startElevation) || 0;
  const distKmNum = parseFloat(loopDistanceKm) || 1.0;

  let result = null;
  let errorMsg = null;

  try {
    result = calculateLevelingLoop(rows, startElevNum, startElevNum, distKmNum);
  } catch (err: any) {
    errorMsg = err.message || 'Error calculating leveling loop';
  }

  const handleExportCsv = () => {
    if (!result) return;
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
      `"${r.remark || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leveling_loop_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Configuration Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              ตารางจดและคำนวณงานระดับ (Differential Leveling Notebook)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              คำนวณวิธี HI และ Rise & Fall พร้อมตรวจสอบผลบวกหน้ากระดาษ (Page Check) และเกณฑ์ความคลาดเคลื่อนปิดรอบ
            </p>
          </div>

          <button
            onClick={handleResetSample}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>โหลดชุดข้อมูลตัวอย่าง มก.</span>
          </button>
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
              value={startElevation}
              onChange={(e) => setStartElevation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              ระยะทางตลอดสายงานรวม K (km)
            </label>
            <input
              type="number"
              step="0.01"
              value={loopDistanceKm}
              onChange={(e) => setLoopDistanceKm(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* Leveling Table Input */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            บันทึกการอ่านไม้ระดับ (Staff Readings Log)
          </h4>
          <button
            onClick={handleAddRow}
            className="px-3 py-1.5 rounded-xl bg-survey-700 hover:bg-survey-600 text-white font-semibold text-xs shadow-sm transition-colors flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มแถวรังวัด</span>
          </button>
        </div>

        <table className="w-full text-left text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-semibold">
              <th className="py-2 px-2">ลำดับ</th>
              <th className="py-2 px-2">ชื่อสถานี (Station)</th>
              <th className="py-2 px-2">ส่องหลัง BS (m)</th>
              <th className="py-2 px-2">ส่องกลาง IFS (m)</th>
              <th className="py-2 px-2">ส่องหน้า FS (m)</th>
              <th className="py-2 px-2">หมายเหตุ (Remark)</th>
              <th className="py-2 px-2 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row, idx) => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-2 px-2 font-mono text-slate-400">{idx + 1}</td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={row.station}
                    onChange={(e) => handleUpdateField(idx, 'station', e.target.value)}
                    className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    step="0.001"
                    value={row.bs !== null ? row.bs : ''}
                    placeholder="BS"
                    onChange={(e) => handleUpdateField(idx, 'bs', e.target.value)}
                    className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    step="0.001"
                    value={row.ifs !== null ? row.ifs : ''}
                    placeholder="IFS"
                    onChange={(e) => handleUpdateField(idx, 'ifs', e.target.value)}
                    className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    step="0.001"
                    value={row.fs !== null ? row.fs : ''}
                    placeholder="FS"
                    onChange={(e) => handleUpdateField(idx, 'fs', e.target.value)}
                    className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={row.remark || ''}
                    placeholder="คำอธิบาย..."
                    onChange={(e) => handleUpdateField(idx, 'remark', e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </td>
                <td className="py-2 px-2 text-right">
                  <button
                    onClick={() => handleRemoveRow(idx)}
                    disabled={rows.length <= 1}
                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 transition-colors"
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
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
          {errorMsg}
        </div>
      ) : result ? (
        <div className="space-y-6">
          
          {/* Arithmetic Check & Quality Tolerances Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Arithmetic Check Banner */}
            <div className={`p-4 rounded-2xl border ${
              result.arithmeticCheckPassed 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
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
              <div className="font-mono text-xs space-y-1 pl-7">
                <div>Σ BS = {result.sumBs.toFixed(4)} m | Σ FS = {result.sumFs.toFixed(4)} m</div>
                <div>Σ BS - Σ FS = {result.diffBsFs.toFixed(4)} m</div>
                <div>Last RL - First RL = {result.deltaBenchmarks.toFixed(4)} m</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 pt-1">
                  ความคลาดเคลื่อนปิดรอบ (Closure Error): {result.closureErrorMm.toFixed(2)} mm ({result.closureErrorMeters.toFixed(4)} m)
                </div>
              </div>
            </div>

            {/* RTSD Order Compliance Banner */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  เกณฑ์ความคลาดเคลื่อนตามระยะทาง K = {result.totalDistanceKm.toFixed(2)} km
                </span>
                <h4 className="font-bold text-sm text-survey-600 dark:text-survey-400">
                  {result.orderCompliance.achievedOrder}
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-[11px] font-mono border-t border-slate-100 dark:border-slate-800 mt-2">
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                ตารางสรุปผลการคำนวณระดับ (Computed Reduced Level Table)
              </h4>
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ส่งออก CSV</span>
              </button>
            </div>

            <table className="w-full text-left text-xs min-w-[780px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-semibold">
                  <th className="py-2.5 px-2">สถานี</th>
                  <th className="py-2.5 px-2">BS (m)</th>
                  <th className="py-2.5 px-2">IFS (m)</th>
                  <th className="py-2.5 px-2">FS (m)</th>
                  <th className="py-2.5 px-2 font-mono text-sky-600 dark:text-sky-400">HI (m)</th>
                  <th className="py-2.5 px-2 text-emerald-600">Rise (m)</th>
                  <th className="py-2.5 px-2 text-rose-500">Fall (m)</th>
                  <th className="py-2.5 px-2 font-bold text-survey-600 dark:text-survey-400">ระดับ RL (m)</th>
                  <th className="py-2.5 px-2">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {result.rows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-2 font-sans font-semibold text-slate-800 dark:text-slate-200">{r.station}</td>
                    <td className="py-2.5 px-2">{r.bs !== null ? r.bs.toFixed(3) : '-'}</td>
                    <td className="py-2.5 px-2">{r.ifs !== null ? r.ifs.toFixed(3) : '-'}</td>
                    <td className="py-2.5 px-2">{r.fs !== null ? r.fs.toFixed(3) : '-'}</td>
                    <td className="py-2.5 px-2 text-sky-600 dark:text-sky-400">{r.hi !== null ? r.hi.toFixed(3) : '-'}</td>
                    <td className="py-2.5 px-2 text-emerald-600">{r.rise !== null ? `+${r.rise.toFixed(3)}` : '-'}</td>
                    <td className="py-2.5 px-2 text-rose-500">{r.fall !== null ? `-${r.fall.toFixed(3)}` : '-'}</td>
                    <td className="py-2.5 px-2 font-bold text-survey-700 dark:text-survey-300 bg-survey-50/40 dark:bg-survey-950/20">{r.elevation.toFixed(3)}</td>
                    <td className="py-2.5 px-2 font-sans text-slate-400 text-[11px]">{r.remark || '-'}</td>
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
