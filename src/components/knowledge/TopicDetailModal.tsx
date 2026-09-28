import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, BookOpen, Layers, Activity, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
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

  const getWorkflowTarget = () => {
    const wf = topic.downstreamWorkflow;
    if (!wf || !wf.recommendedToolTab) return null;
    if (wf.recommendedToolTab === 'map') {
      return {
        hash: '#/map',
        label: wf.toolActionLabel || 'เปิดแผนที่ WebGIS'
      };
    }
    const sub = wf.recommendedToolTab === 'converter' ? 'coord' : wf.recommendedToolTab;
    return {
      hash: `#/calculator/${sub}`,
      label: wf.toolActionLabel || 'เปิดเครื่องมือคำนวณที่เกี่ยวข้อง'
    };
  };

  const workflowTarget = getWorkflowTarget();
  const isVerified = topic.verificationStatus === 'verified';

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
          
          {/* Provenance Banner */}
          {isVerified ? (
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>VERIFIED / ผ่านการตรวจรับรองมาตรฐานวิศวกรรม (Verified SOP)</span>
              </div>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                เอกสารและขั้นตอนปฏิบัติการนี้ผ่านการทวนสอบรับรองความถูกต้องตามเกณฑ์มาตรฐานงานสำรวจวิศวกรรมเรียบร้อยแล้ว
              </p>
              {topic.verificationProof && (
                <div className="pt-2 mt-2 border-t border-emerald-500/20 text-[11px] font-mono text-emerald-800 dark:text-emerald-400">
                  <span className="font-semibold">เอกสารอ้างอิงและเกณฑ์มาตรฐาน:</span> {topic.verificationProof}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>DRAFT / รอดำเนินการตรวจสอบ (Preliminary Draft SOP)</span>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                เอกสารทางเทคนิคฉบับร่าง — อยู่ระหว่างการทวนสอบและ peer review ทางวิชาการและภาคสนาม เพื่อความปลอดภัยสูงสุด โปรดใช้งานควบคู่กับคู่มือทางการของเครื่องมือ
              </p>
              {topic.verificationProof && (
                <div className="pt-2 mt-2 border-t border-amber-500/20 text-[11px] font-mono text-amber-800 dark:text-amber-400">
                  <span className="font-semibold">เอกสารอ้างอิงและเกณฑ์มาตรฐานที่ใช้ร่าง:</span> {topic.verificationProof}
                </div>
              )}
            </div>
          )}
          
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

          {/* Downstream Workflow & Tool Integration */}
          {topic.downstreamWorkflow && (
            <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
                  <ArrowRight className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>เวิร์กโฟลว์ปฏิบัติการต่อเนื่อง (Downstream Workflow)</span>
                </h4>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40">
                  {topic.downstreamWorkflow.outputDataFormat}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>ขั้นตอนต่อไป:</strong> {topic.downstreamWorkflow.nextStepTitle} — {topic.downstreamWorkflow.nextStepProcedure}
              </p>
              {workflowTarget && (
                <div className="pt-1 flex justify-start">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = workflowTarget.hash;
                      onClose();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm"
                  >
                    <span>{workflowTarget.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          {workflowTarget ? (
            <button
              type="button"
              onClick={() => {
                window.location.hash = workflowTarget.hash;
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs sm:text-sm transition-colors shadow-sm"
            >
              <span>{workflowTarget.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : <div />}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium text-xs sm:text-sm transition-colors shadow-sm"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
