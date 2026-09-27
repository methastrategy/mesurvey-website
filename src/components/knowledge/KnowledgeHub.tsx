import React, { useState } from 'react';
import { 
  Search, 
  Compass, 
  Ruler, 
  Radio, 
  Camera, 
  Boxes, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Activity,
  ChevronRight
} from 'lucide-react';
import { KNOWLEDGE_TOPICS } from '../../data/knowledge-topics';
import { KnowledgeTopic } from '../../types/survey';

export const KnowledgeHub: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(KNOWLEDGE_TOPICS[0].id);

  const getTopicIcon = (iconName: string, className: string = "w-4 h-4") => {
    switch (iconName) {
      case 'Compass': return <Compass className={className} />;
      case 'Ruler': return <Ruler className={className} />;
      case 'Radio': return <Radio className={className} />;
      case 'Camera': return <Camera className={className} />;
      case 'Boxes': return <Boxes className={className} />;
      default: return <BookOpen className={className} />;
    }
  };

  const filteredTopics = KNOWLEDGE_TOPICS.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.titleEn.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      (t.courseRelation && t.courseRelation.toLowerCase().includes(q))
    );
  });

  const activeTopic = KNOWLEDGE_TOPICS.find((t) => t.id === selectedTopicId) || KNOWLEDGE_TOPICS[0];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-survey-950 via-survey-900 to-survey-800 text-white p-6 sm:p-8 shadow-geo-lg border border-survey-700/50">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-survey-500/20 text-survey-300 border border-survey-400/30 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>คลังความรู้และคู่มือปฏิบัติการเครื่องมือสำรวจ (Field Geomatics Manual)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            หลักการทำงาน & คู่มือการใช้เครื่องมือสำรวจ
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-survey-200/90 leading-relaxed">
            รวบรวมหลักการทางทฤษฎี วิธีการตั้งกล้องและรังวัดภาคสนาม การทดสอบความถูกต้อง และเกณฑ์การควบคุมคุณภาพ (QA/QC) ครอบคลุม Total Station, กล้องระดับ, GNSS RTK/Static, โดรน UAV และ 3D SLAM LiDAR
          </p>

          {/* Quick Search */}
          <div className="mt-5 relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-survey-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามชื่อเครื่องมือ, ทฤษฎี, ขั้นตอนปฏิบัติ (เช่น Resection, Two-Peg, RTK, Static, SLAM, GSD)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 dark:bg-slate-950/40 border border-white/20 dark:border-slate-700/60 text-white placeholder-survey-200/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-survey-400 backdrop-blur-md transition-all"
            />
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {/* Main Two-Column Sidebar & Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar: Topic Index */}
        <div className="lg:col-span-4 space-y-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="px-2 py-1.5 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>สารบัญเครื่องมือสำรวจ ({filteredTopics.length})</span>
          </div>

          <div className="space-y-1.5">
            {filteredTopics.map((topic) => {
              const isActive = topic.id === activeTopic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-start space-x-3 ${
                    isActive
                      ? 'bg-survey-700 text-white shadow-md shadow-survey-950/20 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                    isActive ? 'bg-survey-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-survey-600 dark:text-survey-400'
                  }`}>
                    {getTopicIcon(topic.iconName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        isActive ? 'bg-survey-800 text-survey-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {topic.badge}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold truncate mt-1">
                      {topic.title.split('(')[0]}
                    </h4>
                    <p className={`text-[11px] truncate font-mono mt-0.5 ${
                      isActive ? 'text-survey-200' : 'text-slate-400'
                    }`}>
                      {topic.titleEn.split(',')[0]}
                    </p>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-survey-300 self-center shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Detailed Topic Documentation */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Document Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-survey-500/10 text-survey-700 dark:text-survey-300 border border-survey-300/40">
                {activeTopic.badge}
              </span>
              <span className="text-xs text-slate-400">
                หมวด: {activeTopic.categoryName}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeTopic.title}
            </h2>
            <p className="text-xs sm:text-sm font-mono text-slate-400 dark:text-slate-500 mt-1">
              {activeTopic.titleEn}
            </p>
          </div>

          {/* Overview & Standard Reference */}
          <div className="p-4 rounded-2xl bg-survey-50/70 dark:bg-survey-950/40 border border-survey-200/60 dark:border-survey-800/60">
            <h4 className="font-bold text-survey-900 dark:text-survey-200 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
              <BookOpen className="w-4 h-4 text-survey-600 dark:text-survey-400" />
              สรุปภาพรวมและวัตถุประสงค์
            </h4>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
              {activeTopic.summary}
            </p>
            {activeTopic.courseRelation && (
              <p className="text-xs text-survey-700 dark:text-survey-400 font-medium mt-2 pt-2 border-t border-survey-200/50 dark:border-survey-800/50">
                📚 มาตรฐานอ้างอิง: {activeTopic.courseRelation}
              </p>
            )}
          </div>

          {/* Working Principles */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Layers className="w-4 h-4 text-survey-600 dark:text-survey-400" />
              หลักการทำงานและทฤษฎีเชิงวิศวกรรม (Working Principles)
            </h3>
            <ul className="space-y-2">
              {activeTopic.workingPrinciple.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-survey-500 mt-2 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Field Operating Procedures */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ขั้นตอนการปฏิบัติงานภาคสนาม (Field Operating Procedures)
            </h3>
            <div className="space-y-3">
              {activeTopic.fieldProcedures.map((proc, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-1">
                    {proc.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {proc.details}
                  </p>
                  {proc.criticalCaution && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>ข้อควรระวังสำคัญ:</strong> {proc.criticalCaution}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Formulas */}
          {activeTopic.formulas && activeTopic.formulas.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                สูตรคำนวณและเกณฑ์ความคลาดเคลื่อน (Formulas & Equations)
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {activeTopic.formulas.map((f, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                      {f.label}
                    </span>
                    <div className="font-mono text-xs sm:text-sm font-semibold text-survey-700 dark:text-survey-300 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 mb-1">
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

          {/* QA/QC & Error Mitigations */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              แหล่งความคลาดเคลื่อนและการควบคุมคุณภาพ (QA/QC & Error Mitigation)
            </h3>
            <div className="space-y-2">
              {activeTopic.errorSourcesAndMitigation.map((err, idx) => (
                <div key={idx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
