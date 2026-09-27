import React from 'react';
import { Compass, Radio, Ruler, Camera, Boxes, ChevronRight, BookOpen } from 'lucide-react';
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

  return (
    <div 
      onClick={() => onSelect(topic)}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-geo-lg hover:border-survey-500/50 dark:hover:border-survey-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform duration-200">
            {getIcon()}
          </div>
          <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide rounded-full bg-survey-50 dark:bg-survey-950/60 text-survey-700 dark:text-survey-300 border border-survey-200 dark:border-survey-800/80">
            {topic.badge}
          </span>
        </div>

        <h3 className="font-semibold text-base text-slate-900 dark:text-white group-hover:text-survey-700 dark:group-hover:text-survey-400 transition-colors line-clamp-2">
          {topic.title}
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 mb-2.5">
          {topic.titleEn}
        </p>

        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
          {topic.summary}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
          {topic.courseRelation || topic.categoryName}
        </span>
        <span className="text-survey-600 dark:text-survey-400 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform">
          ดูคู่มือ <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </span>
      </div>
    </div>
  );
};
