import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, BookOpen, Layers, Activity } from 'lucide-react';
import { KnowledgeTopic } from '../../types/survey';

interface TopicDetailModalProps {
  topic: KnowledgeTopic | null;
  onClose: () => void;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({ topic, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!topic) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-survey-900 to-survey-800 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-survey-500/20 text-survey-300 border border-survey-400/40">
                {topic.badge}
              </span>
              <span className="text-xs text-survey-200">
                {topic.categoryName}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              {topic.title}
            </h2>
            <p className="text-xs text-survey-200/80 font-mono mt-0.5">
              {topic.titleEn}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-survey-300 hover:text-white hover:bg-survey-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-6 overflow-y-auto space-y-6 text-sm">
          
          {/* Summary */}
          <div className="p-4 rounded-2xl bg-survey-50/60 dark:bg-survey-950/40 border border-survey-200/60 dark:border-survey-800/60">
            <h4 className="font-semibold text-survey-900 dark:text-survey-200 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-survey-600 dark:text-survey-400" />
              สรุปภาพรวมและจุดประสงค์
            </h4>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
              {topic.summary}
            </p>
            {topic.courseRelation && (
              <p className="text-xs text-survey-700 dark:text-survey-400 font-medium mt-2 pt-2 border-t border-survey-200/50 dark:border-survey-800/50">
                📚 อิงเนื้อหาวิชา: {topic.courseRelation}
              </p>
            )}
          </div>

          {/* Working Principle */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-survey-600 dark:text-survey-400" />
              หลักการทำงานและทฤษฎีเชิงวิศวกรรม (Working Principles)
            </h4>
            <ul className="space-y-2">
              {topic.workingPrinciple.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-survey-500 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Field Procedures & Checklist */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ขั้นตอนการปฏิบัติงานภาคสนาม (Field Operating Procedures)
            </h4>
            <div className="space-y-3">
              {topic.fieldProcedures.map((proc, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <h5 className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-1">
                    {proc.title}
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {proc.details}
                  </p>
                  {proc.criticalCaution && (
                    <div className="mt-2.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>ข้อควรระวังสำคัญ:</strong> {proc.criticalCaution}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Formulas if present */}
          {topic.formulas && topic.formulas.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2.5 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                สูตรคำนวณที่เกี่ยวข้อง (Geomatic Formulas)
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {topic.formulas.map((f, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                      {f.label}
                    </span>
                    <div className="font-mono text-sm font-semibold text-survey-700 dark:text-survey-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 mb-1">
                      {f.formula}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {f.explanation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Sources & Mitigation */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              แหล่งความคลาดเคลื่อนและการควบคุมคุณภาพ (QA/QC & Error Mitigation)
            </h4>
            <div className="space-y-1.5">
              {topic.errorSourcesAndMitigation.map((err, idx) => (
                <div key={idx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-survey-700 hover:bg-survey-600 text-white font-medium text-xs sm:text-sm transition-colors shadow-sm"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
