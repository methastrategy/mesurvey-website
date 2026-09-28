import React from 'react';
import { Compass, Radio, Ruler, Camera, Boxes, ChevronRight, BookOpen, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { KnowledgeTopic } from '../../types/survey';

interface EquipmentCardProps {
  topic: KnowledgeTopic;
  onSelect: (topic: KnowledgeTopic) => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({ topic, onSelect }) => {
  const getIcon = () => {
    switch (topic.iconName) {
      case 'Compass':
        return <Compass className="w-5 h-5 text-survey-600 dark:text-survey-400" />;
      case 'Radio':
        return <Radio className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case 'Ruler':
        return <Ruler className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'Camera':
        return <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Boxes':
        return <Boxes className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-survey-600 dark:text-survey-400" />;
    }
  };

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
      label: wf.toolActionLabel || 'เปิดเครื่องมือคำนวณ'
    };
  };

  const workflowTarget = getWorkflowTarget();

  const handleOpenTool = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (workflowTarget) {
      window.location.hash = workflowTarget.hash;
    }
  };

  const isVerified = topic.verificationStatus === 'verified';

  return (
    <div 
      onClick={() => onSelect(topic)}
      className="group relative bg-surface-1 dark:bg-[#111113] rounded-2xl border border-hairline p-5 shadow-none hover:border-indigo-500/40 hover:shadow-indigo-glow transition-all duration-200 micro-lift cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Icon, Category Badge, and Corner Stamp Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-surface-2 dark:bg-[#161618] border border-hairline text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform duration-200">
              {getIcon()}
            </div>
            <span className="px-2.5 py-1 text-[10px] font-mono font-semibold tracking-widest uppercase rounded-full bg-surface-2 dark:bg-[#161618] text-slate-700 dark:text-slate-300 border border-hairline">
              {topic.badge}
            </span>
          </div>

          {/* Precision Instrument Corner Stamp Badge */}
          {isVerified ? (
            <div 
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold tracking-widest uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
              title={topic.verificationProof ? `VERIFIED / ตรวจสอบแล้ว: ${topic.verificationProof}` : 'VERIFIED / ตรวจสอบแล้ว'}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>VERIFIED</span><span className="sr-only"> / ตรวจสอบแล้ว</span>
            </div>
          ) : (
            <div 
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold tracking-widest uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"
              title="DRAFT / รอดำเนินการตรวจสอบ: เอกสารทางเทคนิคฉบับร่าง อยู่ระหว่างการทวนสอบและ peer review ทางวิชาการและภาคสนาม"
            >
              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>DRAFT</span><span className="sr-only"> / รอดำเนินการตรวจสอบ</span>
            </div>
          )}
        </div>

        <h3 className="font-semibold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {topic.title}
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 mb-2.5">
          {topic.titleEn}
        </p>

        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
          {topic.summary}
        </p>
      </div>

      <div className="pt-3 border-t border-hairline flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 dark:text-slate-500 truncate max-w-[150px]">
          {topic.courseRelation || topic.categoryName}
        </span>
        
        <div className="flex items-center gap-2">
          {workflowTarget && (
            <button
              type="button"
              onClick={handleOpenTool}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-950/60 border border-indigo-500/30 hover:bg-indigo-500/20 dark:hover:bg-indigo-900/60 transition-colors"
              title={workflowTarget.label}
            >
              <span className="truncate max-w-[120px]">{workflowTarget.label}</span>
              <ArrowRight className="w-3 h-3 ml-0.5 shrink-0" />
            </button>
          )}
          <span className="text-indigo-600 dark:text-indigo-400 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform shrink-0">
            ดูคู่มือ <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
