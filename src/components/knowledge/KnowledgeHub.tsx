import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Compass, 
  Ruler, 
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
  Filter,
  Ship,
  HardHat,
  Satellite,
  Scan,
  Plane
} from 'lucide-react';
import { KNOWLEDGE_TOPICS } from '../../data/knowledge-topics';
import { KnowledgeTopic, KnowledgeCategory, DeviceScreenStep } from '../../types/survey';

interface KnowledgeHubProps {
  onNavigateTab?: (tab: 'calculator' | 'map') => void;
  initialTopicId?: string | null;
}

export const KnowledgeHub: React.FC<KnowledgeHubProps> = ({ initialTopicId, onNavigateTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(initialTopicId || null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const getWorkflowTarget = (topic: KnowledgeTopic) => {
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

  // Icon Resolver
  const getTopicIcon = (iconName: string, className: string = "w-4 h-4") => {
    switch (iconName) {
      case 'Compass': return <Compass className={className} />;
      case 'Ruler': return <Ruler className={className} />;
      case 'Radio':
      case 'Satellite': return <Satellite className={className} />;
      case 'Camera':
      case 'Plane': return <Plane className={className} />;
      case 'Boxes':
      case 'Scan': return <Scan className={className} />;
      case 'Ship': return <Ship className={className} />;
      case 'HardHat': return <HardHat className={className} />;
      default: return <BookOpen className={className} />;
    }
  };

  // Category Color Dot
  const getCategoryDotColor = (category: KnowledgeCategory) => {
    switch (category) {
      case 'survey-instrument':
      case 'total-station':
      case 'differential-leveling': return 'bg-sky-500';
      case 'gnss-gps':
      case 'gnss-geodesy': return 'bg-purple-500';
      case 'drone-uav':
      case 'drone-photogrammetry': return 'bg-amber-500';
      case 'scanner-slam':
      case 'lidar-scan-bim': return 'bg-emerald-500';
      case 'hydrographic': return 'bg-cyan-500';
      case 'tbm-tunnel': return 'bg-rose-500';
      default: return 'bg-indigo-500';
    }
  };

  // Dynamic Topic Tags
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
      case 'gnss-rtk-static-survey':
        return ['RTK CORS', 'Static Geodesy', 'TGM2017 Geoid', 'NTRIP VRS', 'PDOP < 2.5', 'Carrier Phase'];
      case 'uav-drone-photogrammetry':
        return ['UAV Photogrammetry', 'GSD Calculation', 'GCP / Check Points', 'SfM Reconstruction', 'Forward 80% / Side 70%', 'Orthomosaic'];
      case 'terrestrial-lidar-slam':
        return ['Terrestrial LiDAR (TLS)', 'Mobile SLAM', 'Point Cloud Registration', 'Iterative Closest Point (ICP)', 'Sphere Targets', 'Scan-to-BIM'];
      case 'hydrographic-bathymetric-survey':
        return ['Multi-Beam Echo Sounder', 'Bathymetric Survey', 'MRU Roll/Pitch/Heave', 'Sound Velocity Profile (SVP)', 'Tide Reduction', 'IHO Standards'];
      case 'tbm-tunnel-guidance-survey':
        return ['TBM Guidance System', 'Motorized Total Station', 'DTA Alignment Deviations', 'ELS Target Sensor', 'Segment Ring Convergence', 'Gyrotheodolite'];
      default:
        return ['Field SOP', 'Survey Engineering', 'Geomatics'];
    }
  };

  // Category Facets
  const categories: { id: string; label: string; count: number; icon: React.ReactNode }[] = useMemo(() => [
    { id: 'all', label: 'ทั้งหมด (All SOPs)', count: KNOWLEDGE_TOPICS.length, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'survey-instrument', label: 'กล้องสำรวจ', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'survey-instrument' || t.category === 'total-station' || t.category === 'differential-leveling').length, icon: <Compass className="w-4 h-4" /> },
    { id: 'gnss-gps', label: 'GNSS,GPS', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'gnss-gps' || t.category === 'gnss-geodesy').length, icon: <Satellite className="w-4 h-4" /> },
    { id: 'drone-uav', label: 'DRONE/UAV', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'drone-uav' || t.category === 'drone-photogrammetry').length, icon: <Plane className="w-4 h-4" /> },
    { id: 'scanner-slam', label: 'SCANNER/SLAM', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'scanner-slam' || t.category === 'lidar-scan-bim').length, icon: <Scan className="w-4 h-4" /> },
    { id: 'hydrographic', label: 'เรือสำรวจ', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'hydrographic').length, icon: <Ship className="w-4 h-4" /> },
    { id: 'tbm-tunnel', label: 'เครื่องเจาะTBM', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'tbm-tunnel').length, icon: <HardHat className="w-4 h-4" /> },
  ], []);

  // Filtered Topics
  const filteredTopics = useMemo(() => {
    return KNOWLEDGE_TOPICS.filter((t) => {
      const matchCategory = selectedCategory === 'all' || 
        t.category === selectedCategory ||
        (selectedCategory === 'survey-instrument' && (t.category === 'total-station' || t.category === 'differential-leveling')) ||
        (selectedCategory === 'gnss-gps' && t.category === 'gnss-geodesy') ||
        (selectedCategory === 'drone-uav' && t.category === 'drone-photogrammetry') ||
        (selectedCategory === 'scanner-slam' && t.category === 'lidar-scan-bim');
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

  const activeWorkflowTarget = activeTopic ? getWorkflowTarget(activeTopic) : null;

  const deviceSteps: DeviceScreenStep[] = activeTopic?.deviceWorkflow || [];
  const currentStep: DeviceScreenStep | undefined = deviceSteps[activeStepIndex] || deviceSteps[0];

  // Hash-based Topic Synchronization
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const parts = hash.split('/').filter(Boolean);
      if (parts[0] === 'knowledge') {
        if (parts[1]) {
          const match = KNOWLEDGE_TOPICS.some((t) => t.id === parts[1]);
          if (match) {
            setSelectedTopicId(parts[1]);
            return;
          }
        }
        setSelectedTopicId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Keyboard shortcut: Pressing '/' focuses the search box
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedTopicId) return;
      const target = document.activeElement;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target as HTMLElement)?.isContentEditable;
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && isInput && target === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTopicId]);

  const handleSelectTopic = (id: string) => {
    setSelectedTopicId(id);
    setActiveStepIndex(0);
    window.location.hash = `#/knowledge/${id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSearch = () => {
    setSelectedTopicId(null);
    window.location.hash = '#/knowledge';
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

  return (
    <div className="space-y-6 pb-20">

      {/* ================================================================= */}
      {/* 1. SEARCH & BROWSE VIEW (Front Page SOP Library)                   */}
      {/* ================================================================= */}
      {!activeTopic && (
        <div className="space-y-6">

          {/* ── Command-Palette Search Hero ── */}
          <div className="relative overflow-hidden rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#111113]/85 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-semibold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                MESURV Knowledge Base · Field SOP Library
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                คลังคู่มือปฏิบัติงานวิศวกรรมสำรวจ
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                คู่มือมาตรฐานการตั้งกล้อง ขั้นตอนการรังวัด เกณฑ์ความคลาดเคลื่อน และสูตรคำนวณทางยีโอเดซี
              </p>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา: Two-Peg, Bowditch, 0-SET, Azimuth, Three-Wire, Stadia, RTK, SLAM…"
                className="w-full pl-11 pr-24 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0a0b] text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 min-h-[48px] transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors px-1"
                  >
                    ล้าง
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-white dark:bg-[#161618] border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono text-slate-400">
                  /
                </kbd>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                กำลังแสดง: <strong className="text-slate-900 dark:text-white font-mono tabular-nums">{filteredTopics.length}</strong> คู่มือ
                {searchQuery && <span> สำหรับ "{searchQuery}"</span>}
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="hidden sm:inline">7 หมวดหมู่หลัก</span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="hidden sm:inline">กด <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#161618] border border-hairline font-mono text-[10px]">/</kbd> เพื่อค้นหาด่วน</span>
            </div>
          </div>

          {/* ── Mobile Category Chips (< 768px) ── */}
          <div className="md:hidden space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Filter className="w-3.5 h-3.5 text-indigo-500" />
                กรองตามหมวดหมู่:
              </span>
              <span className="font-mono tabular-nums text-[11px]">{filteredTopics.length} รายการ</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-3 px-3 sm:mx-0 sm:px-0">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 min-h-[40px] transition-all micro-press ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                        : 'bg-white/80 dark:bg-[#111113]/85 text-slate-600 dark:text-slate-400 border border-black/[0.08] dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-[#161618]'
                    }`}
                  >
                    <span className="shrink-0">{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-px rounded-full font-mono tabular-nums ${
                      isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-100 dark:bg-[#161618] text-slate-500'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Main Layout: Category Sidebar (Left) + Result Cards (Right) ── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

            {/* Left Column: Category Filter Sidebar (Visible on Tablet & Desktop >= 768px) */}
            <div className="hidden md:block md:col-span-4 lg:col-span-3 space-y-4 sticky top-20">
              {/* Category Filter Box */}
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#111113]/85 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    หมวดหมู่งานสำรวจ
                  </span>
                  <span className="font-mono tabular-nums text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#161618] text-slate-600 dark:text-slate-400">
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
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all micro-press ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161618] border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <span className={isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>{cat.icon}</span>
                          <span className="truncate">{cat.label}</span>
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono tabular-nums shrink-0 ${
                          isSelected 
                            ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-semibold' 
                            : 'bg-slate-100 dark:bg-[#161618] text-slate-500'
                        }`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Standard Reference Info Box */}
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#111113]/85 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <BookmarkCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  เกณฑ์อ้างอิงวิชาการ
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  เนื้อหาถอดรหัสจากสไลด์ภาควิชาวิศวกรรมสำรวจ มหาวิทยาลัยเกษตรศาสตร์ (KU Geomatics) ร่วมกับมาตรฐานกรมแผนที่ทหาร และ FGCC
                </p>
              </div>
            </div>

            {/* Right Column: SOP Manual Cards */}
            <div className="md:col-span-8 lg:col-span-9 space-y-4">
              
              {/* Cards List */}
              <div className="space-y-4">
                {filteredTopics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic.id)}
                    className="group relative p-5 sm:p-6 rounded-2xl bg-white/80 dark:bg-[#111113]/85 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)] transition-all duration-200 micro-lift cursor-pointer space-y-3"
                  >
                    {/* Status Badge — Top-Right Corner */}
                    {topic.verificationStatus === 'verified' ? (
                      <div className="absolute top-0 right-0 inline-flex items-center gap-1 px-3 py-1 rounded-bl-xl rounded-tr-2xl text-[9px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-b border-l border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3 shrink-0" />
                        VERIFIED
                      </div>
                    ) : (
                      <div className="absolute top-0 right-0 inline-flex items-center gap-1 px-3 py-1 rounded-bl-xl rounded-tr-2xl text-[9px] font-mono font-bold tracking-widest uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border-b border-l border-amber-500/20">
                        <Clock className="w-3 h-3 shrink-0" />
                        DRAFT
                      </div>
                    )}

                    {/* Header Row: Icon + Title */}
                    <div className="flex items-start justify-between gap-3 pr-20">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0 shadow-xs">
                          {getTopicIcon(topic.iconName, 'w-5 h-5')}
                        </div>
                        
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors tracking-tight">
                              {topic.title}
                            </h2>
                            <span className="text-[10px] font-mono font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#161618]">
                              {topic.badge}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5 block">
                            {topic.titleEn}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Summary Description */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 pl-0 sm:pl-13">
                      {topic.summary}
                    </p>

                    {/* Topic Tags */}
                    <div className="flex flex-wrap gap-1.5 pl-0 sm:pl-13">
                      {getTopicTags(topic.id).map((tag, tIdx) => (
                        <span 
                          key={tIdx}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#161618] text-slate-600 dark:text-slate-400 border border-black/[0.06] dark:border-white/[0.06] group-hover:border-indigo-500/30 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Footer Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] pl-0 sm:pl-13">
                      <div className="flex flex-wrap items-center gap-4 text-[11px]">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className={`w-2 h-2 rounded-full ${getCategoryDotColor(topic.category)}`} />
                          <span className="text-slate-700 dark:text-slate-300">{topic.categoryName}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{topic.fieldProcedures.length} ขั้นตอน</span>
                        </div>

                        {topic.formulas && topic.formulas.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5 text-slate-400" />
                            <span>{topic.formulas.length} สูตร</span>
                          </div>
                        )}

                        {topic.deviceWorkflow && topic.deviceWorkflow.length > 0 && (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Terminal className="w-3.5 h-3.5" />
                            <span>จำลองหน้าจอกล้อง LCD</span>
                          </div>
                        )}
                      </div>

                      {/* Direct Action Link */}
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                        <span>เปิดอ่านคู่มือ</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                  </div>
                ))}
              </div>

              {/* Empty Search Result State */}
              {filteredTopics.length === 0 && (
                <div className="rounded-2xl border border-dashed border-black/[0.12] dark:border-white/[0.12] bg-white/80 dark:bg-[#111113]/85 p-12 text-center space-y-3">
                  <Search className="w-10 h-10 mx-auto text-slate-400 stroke-1" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    ไม่พบคู่มือที่ตรงกับคำค้นหา "{searchQuery}"
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    ลองค้นหาด้วยคำสำคัญ เช่น "Two-Peg", "Bowditch", "0-SET", "Three-Wire", "Stadia" หรือเปลี่ยนตัวกรองหมวดหมู่
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#161618] hover:bg-slate-200 dark:hover:bg-[#1c1c1f] text-slate-700 dark:text-slate-300 border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold transition-colors"
                  >
                    ล้างคำค้นหาทั้งหมด
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MANUAL DOCUMENT READER VIEW (When a topic is selected)                 */}
      {/* ========================================================================= */}
      {activeTopic && (
        <div className="space-y-6 max-w-5xl mx-auto">

          {/* Sticky Breadcrumb Navigation Bar */}
          <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-[#111113]/90 px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3 sticky top-16 z-40 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackToSearch}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#161618] hover:bg-slate-200 dark:hover:bg-[#1c1c1f] text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-black/[0.06] dark:border-white/[0.06]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>กลับหน้ารายการค้นหา</span>
              </button>

              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-md">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>คู่มือสำรวจ</span>
                <span>/</span>
                <span className="truncate">{activeTopic.categoryName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeWorkflowTarget && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = activeWorkflowTarget.hash;
                    if (onNavigateTab) {
                      onNavigateTab(activeWorkflowTarget.hash.includes('map') ? 'map' : 'calculator');
                    }
                  }}
                  className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm"
                  title={activeWorkflowTarget.label}
                >
                  <span>{activeWorkflowTarget.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={handleCopySummary}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#161618] hover:bg-slate-200 dark:hover:bg-[#1c1c1f] text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors border border-black/[0.06] dark:border-white/[0.06]"
                title="คัดลอกสรุปคู่มือ"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>คัดลอก SOP</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Technical Document Container */}
          <div className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-[#111113]/90 backdrop-blur-xl p-6 sm:p-10 shadow-sm space-y-10">

            {/* Provenance Banner */}
            {activeTopic.verificationStatus === 'verified' ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>VERIFIED / ผ่านการตรวจรับรองมาตรฐานวิศวกรรม (Verified Engineering SOP)</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold tracking-widest uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                  เอกสารและขั้นตอนปฏิบัติการนี้ผ่านการทวนสอบรับรองความถูกต้องตามเกณฑ์มาตรฐานงานสำรวจวิศวกรรมเรียบร้อยแล้ว
                </p>
                {activeTopic.verificationProof && (
                  <div className="pt-2 mt-2 border-t border-emerald-500/20 text-xs font-mono text-emerald-800 dark:text-emerald-400">
                    <span className="font-semibold">เอกสารอ้างอิงและเกณฑ์มาตรฐาน:</span> {activeTopic.verificationProof}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>DRAFT / รอดำเนินการตรวจสอบ (Preliminary Draft SOP)</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold tracking-widest uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    DRAFT
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  เอกสารทางเทคนิคฉบับร่าง — อยู่ระหว่างการทวนสอบและ peer review ทางวิชาการและภาคสนาม โปรดใช้งานควบคู่กับคู่มือทางการของเครื่องมือ
                </p>
                {activeTopic.verificationProof && (
                  <div className="pt-2 mt-2 border-t border-amber-500/20 text-xs font-mono text-amber-800 dark:text-amber-400">
                    <span className="font-semibold">เอกสารอ้างอิงที่ใช้ร่าง:</span> {activeTopic.verificationProof}
                  </div>
                )}
              </div>
            )}

            {/* Document Header & Metadata */}
            <div className="space-y-4 border-b border-black/[0.08] dark:border-white/[0.08] pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 text-[10px] font-mono font-semibold tracking-widest uppercase rounded-full bg-slate-100 dark:bg-[#161618] text-slate-700 dark:text-slate-300 border border-black/[0.06] dark:border-white/[0.06]">
                  {activeTopic.badge}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
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

              {/* Overview Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <BookmarkCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
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
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>1. รายการอุปกรณ์และเครื่องมือที่ต้องจัดเตรียม (Field Equipment Checklist)</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.06]">
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
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>2. หลักการทำงานและทฤษฎีทางวิศวกรรม (Engineering Foundations & Working Principles)</span>
              </h2>

              <div className="space-y-3">
                {activeTopic.workingPrinciple.map((wp, wpIdx) => (
                  <div key={wpIdx} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.06]">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                      {wpIdx + 1}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {wp}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: FIELD PROCEDURES & DEVICE SIMULATOR */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-black/[0.08] dark:border-white/[0.08] pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>3. ลำดับขั้นการปฏิบัติงานภาคสนาม & การควบคุมเครื่องมือ (Field SOP & Instrument Operation)</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 pl-3">
                    ขั้นตอนปฏิบัติงานอย่างละเอียด พร้อมจำลองหน้าจอดิจิทัลและลำดับการกดปุ่มบนตัวกล้อง
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400 shrink-0">
                  {activeTopic.fieldProcedures.length} ขั้นตอนมาตรฐาน
                </span>
              </div>

              {/* Integrated Device LCD Simulator */}
              {deviceSteps.length > 0 && currentStep && (
                <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-slate-950 text-white overflow-hidden shadow-xl">
                  {/* Chassis Top Bar */}
                  <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                      <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
                        {currentStep.targetHardware}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs font-mono tabular-nums text-slate-400">
                      <span>STEP {currentStep.stepNumber} OF {deviceSteps.length}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 text-xs font-semibold">
                        SIMULATOR ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Simulator Screen & Keypad */}
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Simulated High-Contrast LCD Screen Display */}
                    <div className="rounded-xl border-2 border-emerald-950/80 bg-black/90 p-4 font-mono tabular-nums shadow-inner relative overflow-hidden">
                      <div className="text-xs font-bold text-emerald-400 border-b border-emerald-900/60 pb-1.5 mb-2.5 flex items-center justify-between">
                        <span>▶ {currentStep.screenTitle}</span>
                        <span className="text-xs text-emerald-500/80">BAT 100% | TILT ON</span>
                      </div>

                      <div className="space-y-1 text-xs sm:text-sm text-emerald-300 font-mono tabular-nums tracking-wide leading-relaxed">
                        {currentStep.screenLines.map((line, lIdx) => (
                          <div key={lIdx} className="hover:bg-emerald-950/30 px-1 rounded transition-colors">
                            {line}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-2 border-t border-emerald-950 flex items-center justify-between text-xs text-emerald-400/90 font-mono tabular-nums font-bold">
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
                        className="min-h-[44px] inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 transition-colors border border-slate-700"
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
                        className="min-h-[44px] inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 transition-colors border border-slate-700"
                      >
                        <span>ขั้นตอนถัดไป</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Keypad Action Detail Box */}
                    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2">
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
                    className="p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-slate-50 dark:bg-[#161618] space-y-2.5 hover:border-indigo-500/30 transition-colors"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-[#1c1c1f] text-slate-800 dark:text-slate-200 border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-xs font-mono shrink-0">
                        {pIdx + 1}
                      </span>
                      <span>{proc.title}</span>
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
                      {proc.details}
                    </p>

                    {proc.criticalCaution && (
                      <div className="ml-8 mt-2 p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
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
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                  <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>4. สูตรการคำนวณและสมการความถูกต้องทางวิศวกรรม (Engineering Formulas & Equations)</span>
                </h2>

                <div className="space-y-3.5">
                  {activeTopic.formulas.map((f, fIdx) => (
                    <div key={fIdx} className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.06] space-y-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                        {f.label}
                      </span>
                      <div className="font-mono text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-[#0a0a0b] px-4 py-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] shadow-xs overflow-x-auto tabular-nums">
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
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-l-2 border-amber-500 pl-3">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <span>5. แหล่งความคลาดเคลื่อนและการควบคุมคุณภาพ (QA/QC & Error Mitigation)</span>
                </h2>

                <div className="space-y-2.5">
                  {activeTopic.errorSourcesAndMitigation.map((err, eIdx) => (
                    <div key={eIdx} className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {err}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 6: DOWNSTREAM WORKFLOW & TOOL EXECUTION */}
            {activeTopic.downstreamWorkflow && (
              <div className="space-y-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                  <ArrowRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>6. เวิร์กโฟลว์ปฏิบัติการต่อเนื่องและเครื่องมือคำนวณ (Downstream Workflow & Execution)</span>
                </h2>

                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.06] border-l-2 border-l-indigo-500 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">รูปแบบไฟล์และข้อมูลนำออก (Output Data Format):</span>
                      <span className="font-mono text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-300 bg-white dark:bg-[#0a0a0b] px-3 py-1 rounded-lg border border-black/[0.06] dark:border-white/[0.06]">
                        {activeTopic.downstreamWorkflow.outputDataFormat}
                      </span>
                    </div>

                    {activeWorkflowTarget && (
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = activeWorkflowTarget.hash;
                          if (onNavigateTab) {
                            onNavigateTab(activeWorkflowTarget.hash.includes('map') ? 'map' : 'calculator');
                          }
                        }}
                        className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all shadow-sm"
                      >
                        <span>{activeWorkflowTarget.label}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeTopic.downstreamWorkflow.outputDescription}
                  </p>

                  <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0b] border border-black/[0.06] dark:border-white/[0.06] space-y-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                      {activeTopic.downstreamWorkflow.nextStepTitle}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {activeTopic.downstreamWorkflow.nextStepProcedure}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Document Bottom Navigation Back to Search */}
            <div className="pt-6 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
              <button
                onClick={handleBackToSearch}
                className="min-h-[44px] inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>กลับสู่หน้ารายการค้นหาคู่มือทั้งหมด</span>
              </button>

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="min-h-[44px] px-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center"
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
