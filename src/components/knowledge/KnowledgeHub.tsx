import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Compass, 
  Ruler, 
  Radio, 
  Camera, 
  Boxes, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Activity,
  ChevronRight,
  ChevronLeft,
  Terminal,
  ShieldCheck,
  Clock,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  SlidersHorizontal,
  BookmarkCheck,
  Tag,
  ExternalLink,
  Layers,
  Sparkles,
  FileText,
  Filter
} from 'lucide-react';
import { KNOWLEDGE_TOPICS } from '../../data/knowledge-topics';
import { KnowledgeTopic, KnowledgeCategory, DeviceScreenStep } from '../../types/survey';

interface KnowledgeHubProps {
  onNavigateTab?: (tab: 'calculator' | 'map') => void;
}

export const KnowledgeHub: React.FC<KnowledgeHubProps> = ({ onNavigateTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Icon Resolver
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

  // Category Color Dot (GitHub Language Dot Style)
  const getCategoryDotColor = (category: KnowledgeCategory) => {
    switch (category) {
      case 'differential-leveling': return 'bg-emerald-500';
      case 'total-station': return 'bg-sky-500';
      case 'gnss-geodesy': return 'bg-purple-500';
      case 'drone-photogrammetry': return 'bg-amber-500';
      case 'lidar-scan-bim': return 'bg-rose-500';
      default: return 'bg-indigo-500';
    }
  };

  // Dynamic GitHub-style Topic Tags
  const getTopicTags = (topicId: string): string[] => {
    switch (topicId) {
      case 'differential-leveling-survey':
        return ['Three-Wire Leveling', 'Two-Peg Test', 'Stadia D=100s', 'Curvature & Refraction', 'FGCC Standards', 'Turtle Plate'];
      case 'theodolite-station-setup':
        return ['Optical Plummet', 'Plate Level', 'Face Left / Face Right', '0-SET Backsight', 'Index Error', '3-Tie Station Sketch'];
      case 'closed-loop-traverse':
        return ['Closed Polygon', 'Angular Misclosure', 'Continuous Azimuth', 'Latitude & Departure', 'Bowditch Compass Rule', 'UTM Grid'];
      case 'link-open-traverse':
        return ['Link Traverse', 'Known Benchmark Tie-in', 'Azimuth Closure', 'Coordinate Delta Balancing', 'No Dead-End', 'Alignment Control'];
      default:
        return ['Field SOP', 'Survey Engineering', 'Geomatics'];
    }
  };

  // Category Facets
  const categories: { id: string; label: string; count: number; icon: React.ReactNode }[] = useMemo(() => [
    { id: 'all', label: 'ทั้งหมด (All SOPs)', count: KNOWLEDGE_TOPICS.length, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'differential-leveling', label: 'กล้องระดับ (Leveling)', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'differential-leveling').length, icon: <Ruler className="w-4 h-4" /> },
    { id: 'total-station', label: 'กล้องวัดมุม & วงรอบ', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'total-station').length, icon: <Compass className="w-4 h-4" /> },
    { id: 'gnss-geodesy', label: 'ดาวเทียม GNSS & Geodesy', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'gnss-geodesy').length, icon: <Radio className="w-4 h-4" /> },
    { id: 'drone-photogrammetry', label: 'โดรน UAV & ภาพถ่าย', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'drone-photogrammetry').length, icon: <Camera className="w-4 h-4" /> },
    { id: 'lidar-scan-bim', label: '3D LiDAR & BIM', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'lidar-scan-bim').length, icon: <Boxes className="w-4 h-4" /> },
  ], []);

  // Filtered Topics
  const filteredTopics = useMemo(() => {
    return KNOWLEDGE_TOPICS.filter((t) => {
      const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCategory;
      const matchQuery = (
        t.title.toLowerCase().includes(q) ||
        t.titleEn.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        (t.courseRelation && t.courseRelation.toLowerCase().includes(q)) ||
        getTopicTags(t.id).some(tag => tag.toLowerCase().includes(q))
      );
      return matchCategory && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  const activeTopic: KnowledgeTopic | undefined = useMemo(() => {
    if (!selectedTopicId) return undefined;
    return KNOWLEDGE_TOPICS.find((t) => t.id === selectedTopicId);
  }, [selectedTopicId]);

  const deviceSteps: DeviceScreenStep[] = activeTopic?.deviceWorkflow || [];
  const currentStep: DeviceScreenStep | undefined = deviceSteps[activeStepIndex] || deviceSteps[0];

  const handleSelectTopic = (id: string) => {
    setSelectedTopicId(id);
    setActiveStepIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSearch = () => {
    setSelectedTopicId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopySummary = () => {
    if (!activeTopic) return;
    const textToCopy = `${activeTopic.title}\n${activeTopic.titleEn}\n\n${activeTopic.summary}\n\nขั้นตอนสนาม:\n` +
      activeTopic.fieldProcedures.map((p, idx) => `${idx + 1}. ${p.title}\n${p.details}`).join('\n\n');
    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleOpenDownstreamTool = () => {
    if (!activeTopic?.downstreamWorkflow?.recommendedToolTab) {
      onNavigateTab?.('calculator');
      return;
    }
    const target = activeTopic.downstreamWorkflow.recommendedToolTab;
    if (target === 'map') {
      onNavigateTab?.('map');
    } else {
      onNavigateTab?.('calculator');
    }
  };

  return (
    <div className="space-y-6 pb-16">

      {/* ========================================================================= */}
      {/* 1. GITHUB SEARCH VIEW: When no manual is selected (Front Page Search List) */}
      {/* ========================================================================= */}
      {!activeTopic && (
        <div className="space-y-6">
          
          {/* GitHub Search Header Bar */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] p-5 sm:p-6 shadow-sm">
            <div className="max-w-4xl space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-[#0969da] dark:text-[#58a6ff]" />
                    <span>ค้นหาคู่มือสำรวจ (Survey Engineering SOPs)</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    คลังขั้นตอนปฏิบัติงานวิศวกรรมสำรวจ มาตรฐานการตั้งกล้อง เกณฑ์ความคลาดเคลื่อน และสูตรคำนวณ
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{KNOWLEDGE_TOPICS.length} คู่มือมาตรฐาน</span>
                </div>
              </div>

              {/* GitHub-style Search Input Box */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาตามชื่อกล้อง, คำสั่ง, ขั้นตอนรังวัด (เช่น Two-Peg, Bowditch, 0-SET, Azimuth, Three-Wire, Stadia)..."
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-[#161b22] text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] focus:bg-white dark:focus:bg-[#0d1117] transition-all shadow-inner"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="px-2 py-0.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      ล้าง
                    </button>
                  )}
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    /
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* GitHub Search Layout: Facets on Left, Result Cards on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Filter Facets (3 Cols) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff]" />
                    หมวดหมู่งานสำรวจ
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {filteredTopics.length}
                  </span>
                </div>

                <div className="space-y-1">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border border-[#0969da]/25 dark:border-[#58a6ff]/30'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {cat.icon}
                          <span className="truncate">{cat.label}</span>
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0 ${
                          isSelected 
                            ? 'bg-[#0969da]/20 dark:bg-[#58a6ff]/25 text-[#0969da] dark:text-[#58a6ff]' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Standard Reference Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] p-4 text-xs text-slate-600 dark:text-slate-400 space-y-2 shadow-sm">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs flex items-center gap-1.5">
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" />
                  เกณฑ์อ้างอิงวิชาการ
                </span>
                <p className="text-[11px] leading-relaxed">
                  เนื้อหาถอดรหัสจากสไลด์และเอกสารการสอน ภาควิชาวิศวกรรมสำรวจ มหาวิทยาลัยเกษตรศาสตร์ (KU Geomatics) ร่วมกับมาตรฐานกรมแผนที่ทหาร (RTSD) และ FGCC
                </p>
              </div>
            </div>

            {/* Right Column: GitHub Search Result Cards (9 Cols) */}
            <div className="lg:col-span-9 space-y-4">
              
              {/* Search Result Stats Header */}
              <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium">
                  แสดงผลลัพธ์ <strong className="text-slate-900 dark:text-white font-mono">{filteredTopics.length}</strong> คู่มือ
                  {searchQuery && <span> สำหรับคำค้นหา "{searchQuery}"</span>}
                </span>
                <span className="text-[11px] font-mono">
                  GitHub-style Vault Index
                </span>
              </div>

              {/* Result List Items */}
              <div className="space-y-3">
                {filteredTopics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic.id)}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 cursor-pointer group space-y-3"
                  >
                    {/* Item Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition-colors">
                          {getTopicIcon(topic.iconName, "w-4 h-4")}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-[#0969da] dark:text-[#58a6ff] group-hover:underline tracking-tight">
                            {topic.title}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 font-semibold">
                            {topic.badge}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        เปิดอ่านคู่มือ <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Subtitle / English Code Identifier */}
                    <p className="text-xs font-mono text-slate-400 dark:text-slate-500 pl-9">
                      {topic.titleEn}
                    </p>

                    {/* Summary Description */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-9 line-clamp-2">
                      {topic.summary}
                    </p>

                    {/* Topic Tags (GitHub Repository Topics) */}
                    <div className="flex flex-wrap gap-1.5 pl-9 pt-1">
                      {getTopicTags(topic.id).map((tag, tIdx) => (
                        <span 
                          key={tIdx}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0969da]/10 dark:bg-[#58a6ff]/10 text-[#0969da] dark:text-[#58a6ff] hover:bg-[#0969da]/20 dark:hover:bg-[#58a6ff]/20 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* GitHub Search Result Footer Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80 pl-9">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${getCategoryDotColor(topic.category)}`} />
                        <span>{topic.categoryName}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{topic.fieldProcedures.length} ขั้นตอนสนาม</span>
                      </div>

                      {topic.formulas && topic.formulas.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-slate-400" />
                          <span>{topic.formulas.length} สูตรคำนวณ</span>
                        </div>
                      )}

                      {topic.deviceWorkflow && topic.deviceWorkflow.length > 0 && (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>จำลองหน้าจอกล้อง LCD</span>
                        </div>
                      )}

                      {topic.courseRelation && (
                        <div className="hidden md:flex items-center gap-1 text-slate-400">
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[220px]">{topic.courseRelation}</span>
                        </div>
                      )}
                    </div>

                  </div>
                ))}

                {/* Empty State */}
                {filteredTopics.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0d1117] p-12 text-center space-y-3">
                    <Search className="w-10 h-10 mx-auto text-slate-400 stroke-1" />
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      ไม่พบคู่มือที่ตรงกับคำค้นหา "{searchQuery}"
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      ลองค้นหาด้วยคำสำคัญ เช่น "Two-Peg", "Bowditch", "0-SET", "Three-Wire", "Stadia" หรือเปลี่ยนตัวกรองหมวดหมู่
                    </p>
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                      className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors"
                    >
                      ล้างคำค้นหาทั้งหมด
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MANUAL DOCUMENT READER VIEW: Rendered when a topic is selected        */}
      {/* (Unified Flow: NO SEPARATE TAB for "คู่มือปุ่มกด & จอกล้อง"!)              */}
      {/* ========================================================================= */}
      {activeTopic && (
        <div className="space-y-6 max-w-5xl mx-auto">

          {/* Navigation Breadcrumb Bar */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3 sticky top-16 z-40 backdrop-blur-md bg-white/95 dark:bg-[#0d1117]/95">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackToSearch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all hover:-translate-x-0.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>กลับหน้ารายการค้นหา</span>
              </button>

              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-md">
                <BookOpen className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff] shrink-0" />
                <span>คู่มือสำรวจ</span>
                <span>/</span>
                <span className="truncate">{activeTopic.categoryName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                title="คัดลอกสรุปคู่มือ"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอก SOP</span>
                  </>
                )}
              </button>

              {activeTopic.downstreamWorkflow && (
                <button
                  onClick={handleOpenDownstreamTool}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0969da] hover:bg-[#0854b0] text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <span>{activeTopic.downstreamWorkflow.toolActionLabel || 'เปิดเครื่องมือคำนวณ'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Main Documentation Container (GitHub README / Technical SOP Style) */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] p-6 sm:p-10 shadow-sm space-y-10">

            {/* Document Header & Metadata */}
            <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 text-xs font-semibold rounded-full bg-[#0969da]/10 text-[#0969da] dark:text-[#58a6ff] border border-[#0969da]/20 font-mono">
                  {activeTopic.badge}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  หมวด: {activeTopic.categoryName}
                </span>
                {activeTopic.courseRelation && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-auto">
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" />
                    {activeTopic.courseRelation}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  {activeTopic.title}
                </h1>
                <p className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400 mt-1">
                  {activeTopic.titleEn}
                </p>
              </div>

              {/* GitHub Note Alert Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                  <BookmarkCheck className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />
                  <span>สรุปภาพรวมและวัตถุประสงค์ (Overview & Core Objective)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeTopic.summary}
                </p>
              </div>
            </div>

            {/* SECTION 1: REQUIRED EQUIPMENT & INSTRUMENTS */}
            {activeTopic.equipmentRequired && activeTopic.equipmentRequired.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#0969da] dark:text-[#58a6ff]" />
                  <span>1. รายการอุปกรณ์และเครื่องมือที่ต้องจัดเตรียม (Field Equipment Checklist)</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  {activeTopic.equipmentRequired.map((eq, eqIdx) => (
                    <div key={eqIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{eq}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: WORKING PRINCIPLES & THEORY */}
            <div className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0969da] dark:text-[#58a6ff]" />
                <span>2. หลักการทำงานและทฤษฎีทางวิศวกรรม (Engineering Foundations & Working Principles)</span>
              </h2>

              <div className="space-y-3">
                {activeTopic.workingPrinciple.map((wp, wpIdx) => (
                  <div key={wpIdx} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-[#0969da]/10 text-[#0969da] dark:text-[#58a6ff] flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                      {wpIdx + 1}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {wp}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: FIELD PROCEDURES & DEVICE SIMULATOR (UNIFIED - NO SEPARATE TAB!) */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>3. ลำดับขั้นการปฏิบัติงานภาคสนาม & การควบคุมเครื่องมือ (Field SOP & Instrument Operation)</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ขั้นตอนปฏิบัติงานอย่างละเอียด พร้อมจำลองหน้าจอดิจิทัลและลำดับการกดปุ่มบนตัวกล้อง
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400 shrink-0">
                  {activeTopic.fieldProcedures.length} ขั้นตอนมาตรฐาน
                </span>
              </div>

              {/* Integrated Device LCD & Keypad Simulator */}
              {deviceSteps.length > 0 && currentStep && (
                <div className="rounded-2xl border border-slate-700 bg-slate-950 text-white overflow-hidden shadow-xl">
                  {/* Chassis Top Bar */}
                  <div className="px-5 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                      <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
                        {currentStep.targetHardware}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                      <span>STEP {currentStep.stepNumber} OF {deviceSteps.length}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px] font-semibold">
                        SIMULATOR ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Simulator Screen & Keypad Controls */}
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Simulated High-Contrast Screen Display */}
                    <div className="rounded-xl border-2 border-emerald-950/80 bg-black/90 p-4 font-mono shadow-inner relative overflow-hidden">
                      <div className="text-xs font-bold text-emerald-400 border-b border-emerald-900/60 pb-1.5 mb-2.5 flex items-center justify-between">
                        <span>▶ {currentStep.screenTitle}</span>
                        <span className="text-[10px] text-emerald-500/80">BAT 100% | TILT ON</span>
                      </div>

                      <div className="space-y-1 text-xs sm:text-sm text-emerald-300 font-mono tracking-wide leading-relaxed">
                        {currentStep.screenLines.map((line, lIdx) => (
                          <div key={lIdx} className="hover:bg-emerald-950/30 px-1 rounded transition-colors">
                            {line}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-2 border-t border-emerald-950 flex items-center justify-between text-[11px] text-emerald-400/90 font-mono font-bold">
                        <span>[F1: DIST]</span>
                        <span>[F2: COORD]</span>
                        <span>[F3: SET]</span>
                        <span>[F4: REC]</span>
                      </div>
                    </div>

                    {/* Step Stepper Navigation */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeStepIndex === 0}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>ขั้นตอนก่อนหน้า</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {deviceSteps.map((_, dotIdx) => (
                          <button
                            key={dotIdx}
                            onClick={() => setActiveStepIndex(dotIdx)}
                            className={`h-2 rounded-full transition-all ${
                              dotIdx === activeStepIndex
                                ? 'w-6 bg-emerald-400'
                                : 'w-2 bg-slate-700 hover:bg-slate-600'
                            }`}
                            title={`ขั้นตอนที่ ${dotIdx + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => setActiveStepIndex((prev) => Math.min(deviceSteps.length - 1, prev + 1))}
                        disabled={activeStepIndex === deviceSteps.length - 1}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 transition-colors"
                      >
                        <span>ขั้นตอนถัดไป</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Keypad Action Detail Box */}
                    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <Terminal className="w-4 h-4" />
                          ปุ่มที่ต้องกด: <code className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono text-xs">{currentStep.buttonKey}</code>
                        </span>
                        <span className="text-xs text-slate-400">
                          {currentStep.stageName}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {currentStep.explanation}
                      </p>

                      {currentStep.qaCheck && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>เกณฑ์ตรวจสอบหน้างาน (QA Check):</strong> {currentStep.qaCheck}</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* Complete Step-by-Step Field Operating Procedures Checklist */}
              <div className="space-y-3">
                {activeTopic.fieldProcedures.map((proc, pIdx) => (
                  <div 
                    key={pIdx}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center text-xs font-mono shrink-0">
                        {pIdx + 1}
                      </span>
                      <span>{proc.title}</span>
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
                      {proc.details}
                    </p>

                    {proc.criticalCaution && (
                      <div className="ml-8 mt-2 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>ข้อควรระวังภาคสนาม:</strong> {proc.criticalCaution}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 4: MATHEMATICAL FORMULAS & REDUCTION */}
            {activeTopic.formulas && activeTopic.formulas.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-500" />
                  <span>4. สูตรการคำนวณและสมการความถูกต้องทางวิศวกรรม (Engineering Formulas & Equations)</span>
                </h2>

                <div className="space-y-3.5">
                  {activeTopic.formulas.map((f, fIdx) => (
                    <div key={fIdx} className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                        {f.label}
                      </span>
                      <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-emerald-400 bg-white dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                        {f.formula}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {f.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 5: QA/QC & ERROR MITIGATION */}
            {activeTopic.errorSourcesAndMitigation && activeTopic.errorSourcesAndMitigation.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <span>5. แหล่งความคลาดเคลื่อนและการควบคุมคุณภาพ (QA/QC & Error Mitigation)</span>
                </h2>

                <div className="space-y-2.5">
                  {activeTopic.errorSourcesAndMitigation.map((err, eIdx) => (
                    <div key={eIdx} className="p-3.5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {err}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 6: DOWNSTREAM WORKFLOW & TOOL HANDOFF */}
            {activeTopic.downstreamWorkflow && (
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-sky-500" />
                  <span>6. ผลลัพธ์และการส่งต่อข้อมูลสู่เครื่องมือคำนวณ (Downstream Data Integration)</span>
                </h2>

                <div className="p-5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/40 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold text-sky-900 dark:text-sky-300 block mb-1">
                        รูปแบบข้อมูลที่ได้ (Output Data Format):
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-mono">
                        {activeTopic.downstreamWorkflow.outputDataFormat}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-sky-900 dark:text-sky-300 block mb-1">
                        ขั้นตอนถัดไปในระบบ (Next Step):
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {activeTopic.downstreamWorkflow.nextStepTitle}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-sky-200/60 dark:border-sky-900/40 pt-3">
                    {activeTopic.downstreamWorkflow.nextStepProcedure}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={handleOpenDownstreamTool}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0969da] hover:bg-[#0854b0] text-white text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-[1.02]"
                    >
                      <span>{activeTopic.downstreamWorkflow.toolActionLabel || 'เปิดใช้งานเครื่องมือคำนวณ'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Document Bottom Navigation Back to Search */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={handleBackToSearch}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>กลับสู่หน้ารายการค้นหาคู่มือทั้งหมด</span>
              </button>

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                เลื่อนขึ้นบนสุด ↑
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
