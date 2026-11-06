import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import type { LoopClosureResult } from '../../core/gnss/loop-closure-analyzer';

interface LoopClosureTableProps {
  loops: LoopClosureResult[];
  onSelectLoop?: (loop: LoopClosureResult) => void;
  selectedLoopId?: string | null;
}

export const LoopClosureTable: React.FC<LoopClosureTableProps> = ({
  loops,
  onSelectLoop,
  selectedLoopId
}) => {
  if (loops.length === 0) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-3)] border border-[var(--border)]">
          <Layers className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[var(--text-1)]">ยังไม่พบวงรอบปิดในโครงข่าย (No Closed Loops)</h4>
          <p className="text-xs text-[var(--text-3)] max-w-md mx-auto">
            โครงข่ายต้องการเส้นฐานอย่างน้อย 3 เส้นที่เชื่อมต่อกันเป็นวงปิด (เช่น สามเหลี่ยม A → B → C → A) เพื่อวิเคราะห์ Loop Closure ตามเกณฑ์กรมแผนที่ทหาร (RTSD)
          </p>
        </div>
      </div>
    );
  }

  const allPassedClass1 = loops.every((l) => l.passedClass1);
  const allPassedClass2 = loops.every((l) => l.passedClass2);

  return (
    <div className="space-y-4 p-4">
      {/* Summary Header Callout */}
      <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
        allPassedClass1
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          : allPassedClass2
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
      }`}>
        <div className="flex items-center gap-2.5">
          {allPassedClass1 ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : allPassedClass2 ? (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 shrink-0" />
          )}
          <div>
            <span className="font-bold block">
              {allPassedClass1
                ? 'ผ่านเกณฑ์ความคลาดเคลื่อนอนุญาต กรมแผนที่ทหาร ชั้น 1 (RTSD Class 1 - 100%)'
                : allPassedClass2
                ? 'ผ่านเกณฑ์ กรมแผนที่ทหาร ชั้น 2 (RTSD Class 2)'
                : 'มีบางวงรอบปิดไม่ผ่านเกณฑ์ (Misclosure Exceeded Tolerances)'}
            </span>
            <span className="text-[11px] opacity-90">
              พบ {loops.length} วงรอบอิสระ (Independent Closed Loops)
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
          <span>เกณฑ์ ชั้น 1:</span>
          <b>10 mm + 1 ppm</b>
        </div>
      </div>

      {/* Loops Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[var(--surface-2)]/60 text-[var(--text-3)] font-mono text-[11px] border-b border-[var(--border)]">
              <th className="p-2.5 pl-3">รหัสวงรอบ</th>
              <th className="p-2.5">เส้นทางเดิน (Loop Path)</th>
              <th className="p-2.5 text-right">ความยาวรอบ (m)</th>
              <th className="p-2.5 text-right">ΔE (mm)</th>
              <th className="p-2.5 text-right">ΔN (mm)</th>
              <th className="p-2.5 text-right">ΔU (mm)</th>
              <th className="p-2.5 text-right">3D คลาดเคลื่อน (mm)</th>
              <th className="p-2.5 text-right">อัตราส่วน (1:X)</th>
              <th className="p-2.5 text-right">เกณฑ์อนุญาต (mm)</th>
              <th className="p-2.5 text-center pr-3">สถานะ RTSD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] font-mono text-[11px]">
            {loops.map((loop) => {
              const isSelected = selectedLoopId === loop.id;
              const mis3D_mm = (loop.misclosure3D * 1000).toFixed(1);
              const tol1_mm = (loop.rtsdClass1TolM * 1000).toFixed(1);

              return (
                <tr
                  key={loop.id}
                  onClick={() => onSelectLoop && onSelectLoop(loop)}
                  className={`transition-colors cursor-pointer hover:bg-[var(--surface-2)]/50 ${
                    isSelected ? 'bg-[var(--accent)]/10 font-bold' : ''
                  }`}
                >
                  <td className="p-2.5 pl-3 font-bold text-[var(--accent)]">
                    {loop.id}
                  </td>
                  <td className="p-2.5 font-sans font-medium text-[var(--text-1)]">
                    {loop.stations.join(' → ')}
                  </td>
                  <td className="p-2.5 text-right text-[var(--text-2)]">
                    {loop.perimeterM.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </td>
                  <td className="p-2.5 text-right text-[var(--text-2)]">
                    {(loop.misclosureE * 1000).toFixed(1)}
                  </td>
                  <td className="p-2.5 text-right text-[var(--text-2)]">
                    {(loop.misclosureN * 1000).toFixed(1)}
                  </td>
                  <td className="p-2.5 text-right text-[var(--text-2)]">
                    {(loop.misclosureU * 1000).toFixed(1)}
                  </td>
                  <td className="p-2.5 text-right font-bold text-[var(--text-1)]">
                    {mis3D_mm}
                  </td>
                  <td className="p-2.5 text-right font-bold text-sky-500">
                    1:{loop.misclosureRatio.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right text-[var(--text-3)]">
                    ±{tol1_mm}
                  </td>
                  <td className="p-2.5 text-center pr-3">
                    {loop.passedClass1 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] font-bold font-sans">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ชั้น 1</span>
                      </span>
                    ) : loop.passedClass2 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] font-bold font-sans">
                        <AlertTriangle className="w-3 h-3" />
                        <span>ชั้น 2</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30 text-[10px] font-bold font-sans">
                        <XCircle className="w-3 h-3" />
                        <span>ตกเกณฑ์</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
