import React from 'react';
import { adjustTraverseBowditch } from '../../core/traverse';
import { useSurveyStore } from '../../store/useSurveyStore';
import { Plus, Trash2, RotateCcw, CheckCircle2, Download, Save, Eraser } from 'lucide-react';
import { trackEvent } from '../../lib/telemetry';

export const TraverseCalculator: React.FC = () => {
  const {
    traverseStartE,
    traverseStartN,
    traverseIsClosedLoop,
    traverseEndE,
    traverseEndN,
    traverseLegs,
    traverseLastSaved,
    setTraverseStart,
    setTraverseEnd,
    setTraverseIsClosed,
    updateTraverseLeg,
    addTraverseLeg,
    removeTraverseLeg,
    resetTraverseToSample,
    clearTraverse
  } = useSurveyStore();

  // Run calculation
  const startCoord = { 
    easting: parseFloat(traverseStartE) || 0, 
    northing: parseFloat(traverseStartN) || 0 
  };
  const endCoord = traverseIsClosedLoop
    ? startCoord
    : { easting: parseFloat(traverseEndE) || 0, northing: parseFloat(traverseEndN) || 0 };

  let result = null;
  let errorMsg = null;
  try {
    result = adjustTraverseBowditch(traverseLegs, startCoord, endCoord);
  } catch (err: any) {
    errorMsg = err.message || 'Error calculating traverse';
  }

  // Generate SVG polygon points for visualization
  const renderSvgPolygon = () => {
    if (!result) return null;
    const coords = Object.values(result.stationCoordinates);
    if (coords.length < 2) return null;

    const minE = Math.min(...coords.map((c) => c.easting));
    const maxE = Math.max(...coords.map((c) => c.easting));
    const minN = Math.min(...coords.map((c) => c.northing));
    const maxN = Math.max(...coords.map((c) => c.northing));

    const spanE = Math.max(1, maxE - minE);
    const spanN = Math.max(1, maxN - minN);

    const width = 320;
    const height = 240;
    const pad = 35;

    const scale = Math.min((width - pad * 2) / spanE, (height - pad * 2) / spanN);

    const points = coords.map((c) => {
      const x = pad + (c.easting - minE) * scale;
      const y = height - pad - (c.northing - minN) * scale;
      return `${x},${y}`;
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 bg-slate-900 rounded-2xl border border-slate-800">
        <polygon
          points={points.join(' ')}
          fill="rgba(16, 185, 129, 0.15)"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeDasharray="4 2"
        />
        {coords.map((c, i) => {
          const x = pad + (c.easting - minE) * scale;
          const y = height - pad - (c.northing - minN) * scale;
          const stationName = Object.keys(result!.stationCoordinates)[i];
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <text
                x={x + 7}
                y={y - 7}
                fill="#ffffff"
                fontSize="10"
                fontFamily="sans-serif"
                fontWeight="bold"
              >
                {stationName}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const handleExportCsv = () => {
    if (!result) return;
    trackEvent('traverse_export_csv', { count: result.adjustedLegs.length });
    const headers = ['Leg', 'Distance(m)', 'Raw_dE(m)', 'Raw_dN(m)', 'Corr_dE(m)', 'Corr_dN(m)', 'Adj_dE(m)', 'Adj_dN(m)', 'Adj_Easting(m)', 'Adj_Northing(m)'];
    const rows = result.adjustedLegs.map(l => [
      l.leg,
      l.distance.toFixed(3),
      l.rawDe.toFixed(4),
      l.rawDn.toFixed(4),
      l.corrDe.toFixed(4),
      l.corrDn.toFixed(4),
      l.adjDe.toFixed(4),
      l.adjDn.toFixed(4),
      l.adjustedEasting.toFixed(4),
      l.adjustedNorthing.toFixed(4)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `traverse_adjustment_bowditch_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Configuration Header & Draft Status */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        
        {/* Persistence Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
          <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-medium">
            <Save className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>ระบบบันทึกฉบับร่างอัตโนมัติ (Offline Persistent Draft)</span>
          </div>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400 font-mono">
            บันทึกแล้ว: {new Date(traverseLastSaved).toLocaleTimeString('th-TH')}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              การปรับแก้วงรอบวิธีเข็มทิศ (Bowditch / Compass Rule Traverse Adjustment)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              คำนวณการกระจายความคลาดเคลื่อนเชิงเส้น อัตราส่วนความละเอียด (1:N) และพิกัดปรับแก้
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={resetTraverseToSample}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>โหลดข้อมูลตัวอย่าง</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการล้างข้อมูลวงรอบทั้งหมดเพื่อเริ่มใหม่หรือไม่?')) {
                  clearTraverse();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-medium text-rose-700 dark:text-rose-300 transition-colors flex items-center space-x-1.5 border border-rose-200 dark:border-rose-800"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>ล้างตาราง</span>
            </button>
          </div>
        </div>

        {/* Start / End Coordinates Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              พิกัดเริ่มต้น Easting E0 (m)
            </label>
            <input
              type="number"
              step="0.001"
              value={traverseStartE}
              onChange={(e) => setTraverseStart(e.target.value, traverseStartN)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              พิกัดเริ่มต้น Northing N0 (m)
            </label>
            <input
              type="number"
              step="0.001"
              value={traverseStartN}
              onChange={(e) => setTraverseStart(traverseStartE, e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              ประเภทวงรอบ (Loop Type)
            </label>
            <select
              value={traverseIsClosedLoop ? 'closed' : 'link'}
              onChange={(e) => setTraverseIsClosed(e.target.value === 'closed')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-xs"
            >
              <option value="closed">วงรอบปิดกลับจุดเดิม (Closed Loop)</option>
              <option value="link">วงรอบเปิดเชื่อมโยง (Connecting Link)</option>
            </select>
          </div>

          {!traverseIsClosedLoop && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  End E (m)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={traverseEndE}
                  onChange={(e) => setTraverseEnd(e.target.value, traverseEndN, false)}
                  className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  End N (m)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={traverseEndN}
                  onChange={(e) => setTraverseEnd(traverseEndE, e.target.value, false)}
                  className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Traverse Legs Table Input */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            ตารางข้อมูลเส้นวงรอบ (Traverse Legs Input)
          </h4>
          <button
            onClick={addTraverseLeg}
            className="px-3 py-1.5 rounded-xl bg-survey-700 hover:bg-survey-600 text-white font-semibold text-xs shadow-sm transition-colors flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มเส้นวงรอบ</span>
          </button>
        </div>

        <table className="w-full text-left text-xs min-w-[550px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-semibold">
              <th className="py-2 px-2">ลำดับ</th>
              <th className="py-2 px-2">สถานีต้นทาง</th>
              <th className="py-2 px-2">สถานีปลายทาง</th>
              <th className="py-2 px-2">ระยะราบ (m)</th>
              <th className="py-2 px-2">มุม Azimuth (องศา 0-360)</th>
              <th className="py-2 px-2 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {traverseLegs.map((leg, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-2 px-2 font-mono text-slate-400">{idx + 1}</td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={leg.station}
                    onChange={(e) => updateTraverseLeg(idx, 'station', e.target.value)}
                    className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={leg.targetStation}
                    onChange={(e) => updateTraverseLeg(idx, 'targetStation', e.target.value)}
                    className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    step="0.001"
                    value={leg.distance}
                    onChange={(e) => updateTraverseLeg(idx, 'distance', e.target.value)}
                    className="w-28 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={leg.azimuthDeg}
                    onChange={(e) => updateTraverseLeg(idx, 'azimuthDeg', e.target.value)}
                    className="w-28 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </td>
                <td className="py-2 px-2 text-right">
                  <button
                    onClick={() => removeTraverseLeg(idx)}
                    disabled={traverseLegs.length <= 1}
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

      {/* Results & Inspection */}
      {errorMsg ? (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
          {errorMsg}
        </div>
      ) : result ? (
        <div className="space-y-6">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <span className="text-slate-400 text-xs font-medium block mb-1">ความยาวรอบรูป (Perimeter)</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                {result.totalPerimeter.toLocaleString()} m
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <span className="text-slate-400 text-xs font-medium block mb-1">ความคลาดเคลื่อนเชิงเส้น (Misclosure)</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                {result.linearMisclosure.toFixed(4)} m
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                dE: {result.misclosureE.toFixed(3)} | dN: {result.misclosureN.toFixed(3)}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <span className="text-slate-400 text-xs font-medium block mb-1">อัตราส่วนความละเอียด (Precision)</span>
              <span className="text-lg font-bold text-survey-600 dark:text-survey-400 font-mono">
                1 : {result.precisionRatio.toLocaleString()}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between">
              <span className="text-slate-400 text-xs font-medium block mb-1">เกณฑ์มาตรฐานชั้นงาน</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {result.precisionGrade}
              </span>
            </div>
          </div>

          {/* SVG Visual Polygon Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3">
              ผังรูปปิดวงรอบ (Traverse Polygon Vector Preview)
            </h4>
            {renderSvgPolygon()}
          </div>

          {/* Adjusted Traverse Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ตารางผลลัพธ์การปรับแก้พิกัด (Adjusted Coordinates Table)
              </h4>
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ส่งออก CSV</span>
              </button>
            </div>

            <table className="w-full text-left text-xs min-w-[750px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-semibold">
                  <th className="py-2.5 px-2">ช่วงสถานี (Leg)</th>
                  <th className="py-2.5 px-2">ระยะ (m)</th>
                  <th className="py-2.5 px-2">dE ดิบ</th>
                  <th className="py-2.5 px-2">dN ดิบ</th>
                  <th className="py-2.5 px-2">ค่าแก้ dE</th>
                  <th className="py-2.5 px-2">ค่าแก้ dN</th>
                  <th className="py-2.5 px-2">dE ปรับแล้ว</th>
                  <th className="py-2.5 px-2">dN ปรับแล้ว</th>
                  <th className="py-2.5 px-2 font-bold text-survey-600 dark:text-survey-400">พิกัด Easting</th>
                  <th className="py-2.5 px-2 font-bold text-survey-600 dark:text-survey-400">พิกัด Northing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {result.adjustedLegs.map((l, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-2 font-sans font-semibold text-slate-800 dark:text-slate-200">{l.leg}</td>
                    <td className="py-2.5 px-2">{l.distance.toFixed(3)}</td>
                    <td className="py-2.5 px-2">{l.rawDe.toFixed(3)}</td>
                    <td className="py-2.5 px-2">{l.rawDn.toFixed(3)}</td>
                    <td className="py-2.5 px-2 text-amber-600">{l.corrDe.toFixed(4)}</td>
                    <td className="py-2.5 px-2 text-amber-600">{l.corrDn.toFixed(4)}</td>
                    <td className="py-2.5 px-2">{l.adjDe.toFixed(3)}</td>
                    <td className="py-2.5 px-2">{l.adjDn.toFixed(3)}</td>
                    <td className="py-2.5 px-2 font-bold text-survey-700 dark:text-survey-300">{l.adjustedEasting.toFixed(3)}</td>
                    <td className="py-2.5 px-2 font-bold text-survey-700 dark:text-survey-300">{l.adjustedNorthing.toFixed(3)}</td>
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
