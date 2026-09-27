import React, { useState, useMemo } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import { KNOWLEDGE_TOPICS } from '../../data/knowledge-topics';
import { KnowledgeTopic, KnowledgeCategory } from '../../types/survey';
import { EquipmentCard } from './EquipmentCard';
import { TopicDetailModal } from './TopicDetailModal';

export const KnowledgeHub: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'all'>('all');
  const [activeTopic, setActiveTopic] = useState<KnowledgeTopic | null>(null);

  const categories: { id: KnowledgeCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'ทั้งหมด (All Topics)' },
    { id: 'total-station', label: 'Total Station & Theodolite' },
    { id: 'gnss-geodesy', label: 'GNSS & Geodesy' },
    { id: 'differential-leveling', label: 'Differential Leveling' },
    { id: 'drone-photogrammetry', label: 'Drone & UAV Mapping' },
    { id: 'lidar-scan-bim', label: 'LiDAR & Scan-to-BIM' },
  ];

  const filteredTopics = useMemo(() => {
    return KNOWLEDGE_TOPICS.filter((topic) => {
      const matchCategory = selectedCategory === 'all' || topic.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        topic.title.toLowerCase().includes(q) ||
        topic.titleEn.toLowerCase().includes(q) ||
        topic.summary.toLowerCase().includes(q) ||
        (topic.courseRelation && topic.courseRelation.toLowerCase().includes(q));
      return matchCategory && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-survey-950 via-survey-900 to-survey-800 text-white p-6 sm:p-8 shadow-geo-lg border border-survey-700/50">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-survey-500/20 text-survey-300 border border-survey-400/30 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>คลังความรู้และคู่มือปฏิบัติการภาคสนาม</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            หลักการทำงาน & คู่มือวิศวกรรมสำรวจ (Field Geomatics Manual)
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-survey-200/90 leading-relaxed">
            รวบรวมหลักการทางทฤษฎี วิธีการตั้งเครื่องมือสำรวจ การตรวจสอบความคลาดเคลื่อน (Two-Peg, Two-Face, Ambiguity Fix) และมาตรฐานการควบคุมคุณภาพงานสนามตามหลักสูตร มก.
          </p>

          {/* Search Bar */}
          <div className="mt-5 relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-survey-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามชื่อกล้อง, ทฤษฎี, ขั้นตอนปฏิบัติ หรือรหัสวิชา (เช่น Resection, RTK, 01218211)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 dark:bg-slate-950/40 border border-white/20 dark:border-slate-700/60 text-white placeholder-survey-200/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-survey-400 backdrop-blur-md transition-all"
            />
          </div>
        </div>

        {/* Ambient Grid Background Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
              selectedCategory === cat.id
                ? 'bg-survey-600 text-white shadow-sm font-semibold'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {filteredTopics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTopics.map((topic) => (
            <EquipmentCard
              key={topic.id}
              topic={topic}
              onSelect={(t) => setActiveTopic(t)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-base">
            ไม่พบข้อมูลหัวข้อที่ตรงกับ "{searchQuery}"
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            ลองค้นหาด้วยคำค้นอื่น หรือเลือกหมวดหมู่ "ทั้งหมด"
          </p>
        </div>
      )}

      {/* Modal Detail */}
      <TopicDetailModal
        topic={activeTopic}
        onClose={() => setActiveTopic(null)}
      />
    </div>
  );
};
