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
  Plane,
  Layers
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

  // Raycast Category Theme Accent Tokens
  const getCategoryTheme = (category: KnowledgeCategory) => {
    switch (category) {
      case 'survey-instrument':
      case 'total-station':
      case 'differential-leveling':
        return {
          dot: 'bg-sky-400',
          iconBox: 'bg-sky-500/15 border-sky-400/30 text-sky-400',
          badge: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
          topBar: 'from-sky-500/50 via-sky-400/20 to-transparent',
        };
      case 'gnss-gps':
      case 'gnss-geodesy':
        return {
          dot: 'bg-purple-400',
          iconBox: 'bg-purple-500/15 border-purple-400/30 text-purple-400',
          badge: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
          topBar: 'from-purple-500/50 via-purple-400/20 to-transparent',
        };
      case 'drone-uav':
      case 'drone-photogrammetry':
        return {
          dot: 'bg-amber-400',
          iconBox: 'bg-amber-500/15 border-amber-400/30 text-amber-400',
          badge: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
          topBar: 'from-amber-500/50 via-amber-400/20 to-transparent',
        };
      case 'scanner-slam':
      case 'lidar-scan-bim':
        return {
          dot: 'bg-emerald-400',
          iconBox: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
          topBar: 'from-emerald-500/50 via-emerald-400/20 to-transparent',
        };
      case 'hydrographic':
        return {
          dot: 'bg-cyan-400',
          iconBox: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-400',
          badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
          topBar: 'from-cyan-500/50 via-cyan-400/20 to-transparent',
        };
      case 'tbm-tunnel':
        return {
          dot: 'bg-rose-400',
          iconBox: 'bg-rose-500/15 border-rose-400/30 text-rose-400',
          badge: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
          topBar: 'from-rose-500/50 via-rose-400/20 to-transparent',
        };
      default:
        return {
          dot: 'bg-indigo-400',
          iconBox: 'bg-indigo-500/15 border-indigo-400/30 text-indigo-400',
          badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
          topBar: 'from-indigo-500/50 via-indigo-400/20 to-transparent',
        };
    }
  };

  // Dynamic Topic Tags
  const getTopicTags = (topicId: string): string[] => {
    switch (topicId) {
      case 'differential-leveling-survey':
        return ['Three-Wire Leveling', 'Two-Peg Test', 'Stadia D=100s', 'Curvature & Refraction', 'FGCC Standards'];
      case 'theodolite-station-setup':
        return ['Optical Plummet', 'Plate Level', 'Face Left / Face Right', '0-SET Backsight', 'Index Error'];
      case 'closed-loop-traverse':
        return ['Closed Polygon', 'Angular Misclosure', 'Continuous Azimuth', 'Bowditch Compass Rule', 'UTM Grid'];
      case 'link-open-traverse':
        return ['Link Traverse', 'Benchmark Tie-in', 'Azimuth Closure', 'Coordinate Balancing', 'Alignment Control'];
      case 'gnss-rtk-static-survey':
        return ['RTK CORS', 'Static Geodesy', 'TGM2017 Geoid', 'NTRIP VRS', 'PDOP < 2.5'];
      case 'uav-drone-photogrammetry':
        return ['UAV Photogrammetry', 'GSD Calculation', 'GCP / Check Points', 'SfM Reconstruction', 'Orthomosaic'];
      case 'terrestrial-lidar-slam':
        return ['Terrestrial LiDAR (TLS)', 'Mobile SLAM', 'Point Cloud ICP', 'Sphere Targets', 'Scan-to-BIM'];
      case 'hydrographic-bathymetric-survey':
        return ['Multi-Beam Echo Sounder', 'Bathymetric Survey', 'MRU Roll/Pitch/Heave', 'SVP Profile', 'IHO Standards'];
      case 'tbm-tunnel-guidance-survey':
        return ['TBM Guidance System', 'Motorized Total Station', 'DTA Deviations', 'ELS Target', 'Gyrotheodolite'];
      default:
        return ['Field SOP', 'Survey Engineering', 'Geomatics'];
    }
  };

  // Category Facets
  const categories: { id: string; label: string; count: number; icon: React.ReactNode; dotColor: string }[] = useMemo(() => [
    { id: 'all', label: 'ทั้งหมด (All SOPs)', count: KNOWLEDGE_TOPICS.length, icon: <BookOpen className="w-4 h-4" />, dotColor: 'bg-indigo-400' },
    { id: 'survey-instrument', label: 'กล้องสำรวจ', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'survey-instrument' || t.category === 'total-station' || t.category === 'differential-leveling').length, icon: <Compass className="w-4 h-4" />, dotColor: 'bg-sky-400' },
    { id: 'gnss-gps', label: 'GNSS / GPS', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'gnss-gps' || t.category === 'gnss-geodesy').length, icon: <Satellite className="w-4 h-4" />, dotColor: 'bg-purple-400' },
    { id: 'drone-uav', label: 'DRONE / UAV', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'drone-uav' || t.category === 'drone-photogrammetry').length, icon: <Plane className="w-4 h-4" />, dotColor: 'bg-amber-400' },
    { id: 'scanner-slam', label: 'SCANNER / SLAM', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'scanner-slam' || t.category === 'lidar-scan-bim').length, icon: <Scan className="w-4 h-4" />, dotColor: 'bg-emerald-400' },
    { id: 'hydrographic', label: 'เรือสำรวจ (Hydro)', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'hydrographic').length, icon: <Ship className="w-4 h-4" />, dotColor: 'bg-cyan-400' },
    { id: 'tbm-tunnel', label: 'หัวเจาะอุโมงค์ TBM', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'tbm-tunnel').length, icon: <HardHat className="w-4 h-4" />, dotColor: 'bg-rose-400' },
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

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6 pb-20">

      {/* ================================================================= */}
      {/* 1. RAYCAST × LINEAR BENTO BROWSE VIEW                             */}
      {/* ================================================================= */}
      {!activeTopic && (
        <div className="space-y-6">

          {/* ── Raycast Command Launcher Hero ── */}
          <div className="raycast-panel relative overflow-hidden rounded-2xl p-6 sm:p-8">
            {/* Subtle Ambient Radial Spotlight */}
            <div className="pointer-events-none absolute -top-28 right-10 w-96 h-64 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-10 w-80 h-56 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  คู่มือปฏิบัติงานวิศวกรรมสำรวจ
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  มาตรฐานการตั้งกล้อง ขั้นตอนการรังวัดภาคสนาม สมการปรับแก้ความคลาดเคลื่อน และจำลองหน้าจอควบคุมเครื่องมือแบบ Interactive
                </p>
              </div>

              {/* Raycast Command Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="พิมพ์ค้นหาชื่อเครื่องมือ, คำสั่งกล้อง, หรือเทคนิคสนาม (เช่น Two-Peg, Bowditch, 0-SET, Three-Wire, RTK, SLAM)…"
                  className="w-full pl-11 pr-24 py-3.5 rounded-xl border border-white/[0.10] bg-[#090a0f]/90 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/60 min-h-[48px] shadow-inner transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-2 py-1 rounded-md text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      ล้าง
                    </button>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[11px] font-mono tabular-nums text-slate-400">
                    {filteredTopics.length} SOPs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mobile Category Filter Strip (< 768px) ── */}
          <div className="md:hidden space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                เลือกหมวดหมู่คู่มือ:
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
                    className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold shrink-0 min-h-[44px] transition-all micro-press ${
                      isSelected
                        ? 'bg-indigo-600 text-white border border-indigo-400/40 shadow-[0_0_16px_rgba(99,102,241,0.35)]'
                        : 'bg-[#111318]/85 text-slate-400 border border-white/[0.08] hover:text-white hover:bg-[#181b22]'
                    }`}
                  >
                    <span className="shrink-0">{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-px rounded-full font-mono tabular-nums ${
                      isSelected ? 'bg-indigo-900/80 text-indigo-100' : 'bg-white/[0.06] text-slate-400'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Main Split Workspace: Left Sticky Filter Rail + Right 2-Col Bento Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

            {/* Left Column: Sticky Category Filter Rail (3 Cols) */}
            <div className="hidden md:block md:col-span-4 lg:col-span-3 space-y-4 sticky top-20">
              <div className="raycast-panel p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                  <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                    <Filter className="w-3.5 h-3.5 text-indigo-400" />
                    หมวดหมู่เครื่องมือ
                  </span>
                  <span className="font-mono tabular-nums text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300">
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
                            ? 'bg-indigo-500/20 text-white font-semibold border border-indigo-500/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cat.dotColor}`} />
                          <span className={isSelected ? 'text-indigo-300' : 'text-slate-400'}>{cat.icon}</span>
                          <span className="truncate">{cat.label}</span>
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono tabular-nums shrink-0 ${
                          isSelected 
                            ? 'bg-indigo-500/30 text-indigo-200 font-semibold' 
                            : 'bg-white/[0.05] text-slate-500'
                        }`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Standards Provenance Card */}
              <div className="raycast-panel p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <BookmarkCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  เกณฑ์อ้างอิงวิชาการ
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ถอดรหัสจากเอกสารการสอน ภาควิชาวิศวกรรมสำรวจ มก. (KU Geomatics) ร่วมกับมาตรฐานกรมแผนที่ทหาร (RTSD) และ FGCC
                </p>
              </div>
            </div>

            {/* Right Column: 2-Column Bento SOP Card Grid (9 Cols) */}
            <div className="md:col-span-8 lg:col-span-9">
              {filteredTopics.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredTopics.map((topic) => {
                    const theme = getCategoryTheme(topic.category);
                    const wf = getWorkflowTarget(topic);
                    return (
                      <div
                        key={topic.id}
                        onClick={() => handleSelectTopic(topic.id)}
                        className="raycast-card group relative rounded-2xl p-5 sm:p-6 cursor-pointer flex flex-col justify-between overflow-hidden"
                      >
                        {/* Top Category Accent Gradient Line */}
                        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${theme.topBar}`} />

                        {/* Corner Verification Status Stamp */}
                        {topic.verificationStatus === 'verified' ? (
                          <div className="absolute top-0 right-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-bl-xl text-[9px] font-mono font-bold tracking-widest uppercase bg-emerald-500/15 text-emerald-300 border-b border-l border-emerald-500/30">
                            <ShieldCheck className="w-3 h-3 shrink-0" />
                            VERIFIED
                          </div>
                        ) : (
                          <div className="absolute top-0 right-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-bl-xl text-[9px] font-mono font-bold tracking-widest uppercase bg-amber-500/15 text-amber-300 border-b border-l border-amber-500/30">
                            <Clock className="w-3 h-3 shrink-0" />
                            DRAFT
                          </div>
                        )}

                        <div className="space-y-3.5">
                          {/* Card Header: Icon Box + Category Badge */}
                          <div className="flex items-start gap-3.5 pr-16">
                            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm ${theme.iconBox}`}>
                              {getTopicIcon(topic.iconName, 'w-5 h-5')}
                            </div>
                            <div className="min-w-0">
                              <h2 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors tracking-tight leading-snug">
                                {topic.title}
                              </h2>
                              <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                                {topic.titleEn}
                              </p>
                            </div>
                          </div>

                          {/* Summary */}
                          <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-3">
                            {topic.summary}
                          </p>

                          {/* Technical Tags */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {getTopicTags(topic.id).slice(0, 4).map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/[0.04] text-slate-400 border border-white/[0.06] group-hover:border-white/[0.12] transition-colors"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Bento Card Telemetry Footer */}
                        <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                              {topic.fieldProcedures.length} ขั้นตอน
                            </span>
                            {topic.formulas && topic.formulas.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5 text-slate-500" />
                                {topic.formulas.length} สูตร
                              </span>
                            )}
                            {topic.deviceWorkflow && topic.deviceWorkflow.length > 0 && (
                              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                <Terminal className="w-3.5 h-3.5" />
                                LCD Sim
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {wf && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.hash = wf.hash;
                                  if (onNavigateTab) {
                                    onNavigateTab(wf.hash.includes('map') ? 'map' : 'calculator');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-colors"
                                title={wf.label}
                              >
                                คำนวณ →
                              </button>
                            )}
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                              <span>อ่านคู่มือ</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="raycast-panel rounded-2xl p-12 text-center space-y-4">
                  <Search className="w-10 h-10 mx-auto text-slate-500 stroke-1" />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      ไม่พบคู่มือที่ตรงกับคำค้นหา "{searchQuery}"
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      ลองค้นหาด้วยคำสำคัญ เช่น "Two-Peg", "Bowditch", "0-SET", "Three-Wire", "RTK" หรือเลือกหมวดหมู่ใหม่
                    </p>
                  </div>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.10] text-xs font-semibold transition-colors"
                  >
                    แสดงคู่มือทั้งหมด
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. SPLIT-VIEW TECHNICAL READER (Left Content / Right Sticky LCD)  */}
      {/* ================================================================= */}
      {activeTopic && (
        <div className="space-y-6">

          {/* Sticky Top Command Bar */}
          <div className="raycast-panel rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 sticky top-16 z-30">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={handleBackToSearch}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-white transition-all border border-white/[0.10] shrink-0 micro-press"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>คลังคู่มือ<span className="hidden sm:inline">ทั้งหมด</span></span>
              </button>

              <span className="text-white/20 hidden sm:inline">|</span>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 truncate">
                <span className="truncate text-slate-200 font-semibold">{activeTopic.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeTopic.deviceWorkflow && activeTopic.deviceWorkflow.length > 0 && (
                <button
                  type="button"
                  onClick={() => scrollToSection('sec-lcd-sim')}
                  className="lg:hidden min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold border border-emerald-500/30 micro-press"
                  title="เลื่อนไปดูหน้าจอจำลอง LCD"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>จอ LCD</span>
                </button>
              )}

              {activeWorkflowTarget && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = activeWorkflowTarget.hash;
                    if (onNavigateTab) {
                      onNavigateTab(activeWorkflowTarget.hash.includes('map') ? 'map' : 'calculator');
                    }
                  }}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-[0_0_16px_rgba(99,102,241,0.35)] micro-press"
                >
                  <span>{activeWorkflowTarget.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={handleCopySummary}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-xs font-medium transition-colors border border-white/[0.10] micro-press"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>คัดลอก<span className="hidden sm:inline"> SOP</span></span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Split-View Reader Grid (Left: Engineering SOP / Right: Sticky LCD Simulator & TOC) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Column: Main SOP Documentation (7 or 8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <div className="raycast-panel rounded-2xl p-6 sm:p-8 space-y-8">

                {/* Provenance Banner */}
                {activeTopic.verificationStatus === 'verified' ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-300">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>VERIFIED · ผ่านการตรวจรับรองมาตรฐานวิศวกรรม</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        VERIFIED
                      </span>
                    </div>
                    {activeTopic.verificationProof && (
                      <p className="text-[11px] font-mono text-emerald-300/80">
                        อ้างอิง: {activeTopic.verificationProof}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-300">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>DRAFT · เอกสารทางเทคนิคฉบับร่าง (Preliminary SOP)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        DRAFT
                      </span>
                    </div>
                    {activeTopic.verificationProof && (
                      <p className="text-[11px] font-mono text-amber-300/80">
                        อ้างอิง: {activeTopic.verificationProof}
                      </p>
                    )}
                  </div>
                )}

                {/* Document Title & Objective */}
                <div className="space-y-4 border-b border-white/[0.08] pb-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="text-indigo-400 font-semibold">{activeTopic.categoryName}</span>
                    {activeTopic.courseRelation && (
                      <span className="text-emerald-400 font-mono text-[11px] ml-auto">
                        {activeTopic.courseRelation}
                      </span>
                    )}
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                      {activeTopic.title}
                    </h1>
                    <p className="text-xs sm:text-sm font-mono text-slate-400 mt-1">
                      {activeTopic.titleEn}
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-xl bg-indigo-500/[0.08] border border-indigo-500/25 space-y-1.5">
                    <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <BookmarkCheck className="w-4 h-4 text-indigo-400" />
                      <span>วัตถุประสงค์และขอบเขตงาน (Core Objective)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {activeTopic.summary}
                    </p>
                  </div>
                </div>

                {/* SECTION 1: EQUIPMENT */}
                {activeTopic.equipmentRequired && activeTopic.equipmentRequired.length > 0 && (
                  <div id="sec-equipment" className="space-y-3.5 scroll-mt-24">
                    <h2 className="text-base font-bold text-white flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                      <span>1. รายการอุปกรณ์และเครื่องมือภาคสนาม (Equipment Checklist)</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      {activeTopic.equipmentRequired.map((eq, eqIdx) => (
                        <div key={eqIdx} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                          <span>{eq}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 2: WORKING PRINCIPLES */}
                <div id="sec-theory" className="space-y-3.5 scroll-mt-24">
                  <h2 className="text-base font-bold text-white flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span>2. หลักการทำงานและทฤษฎีวิศวกรรม (Working Principles)</span>
                  </h2>
                  <div className="space-y-2.5">
                    {activeTopic.workingPrinciple.map((wp, wpIdx) => (
                      <div key={wpIdx} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                          {wpIdx + 1}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {wp}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 3: FIELD PROCEDURES */}
                <div id="sec-procedures" className="space-y-4 scroll-mt-24">
                  <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
                    <h2 className="text-base font-bold text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>3. ลำดับขั้นการปฏิบัติงานภาคสนาม (Field Operating Procedures)</span>
                    </h2>
                    <span className="text-xs font-mono text-slate-400">
                      {activeTopic.fieldProcedures.length} ขั้นตอน
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeTopic.fieldProcedures.map((proc, pIdx) => (
                      <div 
                        key={pIdx}
                        onClick={() => {
                          if (pIdx < deviceSteps.length) setActiveStepIndex(pIdx);
                        }}
                        className={`p-4 sm:p-5 rounded-xl border transition-all space-y-2 cursor-pointer ${
                          pIdx === activeStepIndex && deviceSteps.length > 0
                            ? 'bg-indigo-500/[0.08] border-indigo-500/40 shadow-[inset_0_1px_0_0_rgba(99,102,241,0.2)]'
                            : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.14]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-white/[0.08] text-indigo-300 border border-white/[0.12] flex items-center justify-center text-xs font-mono shrink-0">
                              {pIdx + 1}
                            </span>
                            <span>{proc.title}</span>
                          </h3>
                          {pIdx < deviceSteps.length && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shrink-0">
                              STEP {pIdx + 1} LCD
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
                          {proc.details}
                        </p>

                        {proc.criticalCaution && (
                          <div className="ml-8 mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <span><strong>ข้อควรระวังภาคสนาม:</strong> {proc.criticalCaution}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 4: FORMULAS */}
                {activeTopic.formulas && activeTopic.formulas.length > 0 && (
                  <div id="sec-formulas" className="space-y-3.5 scroll-mt-24">
                    <h2 className="text-base font-bold text-white flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      <span>4. สูตรการคำนวณและสมการวิศวกรรม (Formulas & Equations)</span>
                    </h2>
                    <div className="space-y-3">
                      {activeTopic.formulas.map((f, fIdx) => (
                        <div key={fIdx} className="p-4 sm:p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-200 block">
                            {f.label}
                          </span>
                          <div className="font-mono text-xs sm:text-sm font-bold text-indigo-300 bg-[#07080a] px-4 py-3 rounded-xl border border-indigo-500/25 overflow-x-auto tabular-nums shadow-inner">
                            {f.formula}
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {f.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 5: QA/QC */}
                {activeTopic.errorSourcesAndMitigation && activeTopic.errorSourcesAndMitigation.length > 0 && (
                  <div id="sec-qa" className="space-y-3.5 scroll-mt-24">
                    <h2 className="text-base font-bold text-white flex items-center gap-2 border-l-2 border-amber-500 pl-3">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>5. แหล่งความคลาดเคลื่อนและการควบคุมคุณภาพ (QA/QC)</span>
                    </h2>
                    <div className="space-y-2">
                      {activeTopic.errorSourcesAndMitigation.map((err, eIdx) => (
                        <div key={eIdx} className="p-3.5 rounded-xl bg-amber-500/[0.07] border border-amber-500/20 flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            {err}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 6: DOWNSTREAM WORKFLOW */}
                {activeTopic.downstreamWorkflow && (
                  <div id="sec-workflow" className="space-y-3.5 scroll-mt-24">
                    <h2 className="text-base font-bold text-white flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                      <ArrowRight className="w-4 h-4 text-indigo-400" />
                      <span>6. เวิร์กโฟลว์ต่อเนื่องและเครื่องมือคำนวณ (Downstream Execution)</span>
                    </h2>
                    <div className="p-5 rounded-xl bg-indigo-500/[0.07] border border-indigo-500/25 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1">รูปแบบข้อมูลนำออก (Output Data Format):</span>
                          <span className="font-mono text-xs font-bold text-indigo-300 bg-[#07080a] px-3 py-1 rounded-lg border border-white/[0.08]">
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
                            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] micro-press"
                          >
                            <span>{activeWorkflowTarget.label}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {activeTopic.downstreamWorkflow.outputDescription}
                      </p>
                      <div className="p-3.5 rounded-xl bg-[#07080a]/80 border border-white/[0.06] space-y-1">
                        <span className="text-xs font-bold text-white">{activeTopic.downstreamWorkflow.nextStepTitle}</span>
                        <p className="text-xs text-slate-400 leading-relaxed">{activeTopic.downstreamWorkflow.nextStepProcedure}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Right Column: Sticky Interactive LCD Simulator & Quick Section Navigator (5 or 4 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-20">

              {/* Interactive Instrument LCD & Keypad Simulator */}
              {deviceSteps.length > 0 && currentStep && (
                <div id="sec-lcd-sim" className="raycast-panel rounded-2xl overflow-hidden border border-emerald-500/25 scroll-mt-24">
                  {/* Instrument Chassis Header */}
                  <div className="px-4 py-3 bg-[#090b10] border-b border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                      <span className="text-xs font-mono font-bold tracking-wider text-slate-200 truncate max-w-[180px]">
                        {currentStep.targetHardware}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold tabular-nums">
                      STEP {currentStep.stepNumber}/{deviceSteps.length}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Backlit Digital LCD Screen */}
                    <div className="rounded-xl border-2 border-emerald-950/90 bg-[#030706] p-4 font-mono tabular-nums shadow-inner space-y-2">
                      <div className="text-[11px] font-bold text-emerald-400 border-b border-emerald-900/60 pb-1.5 flex items-center justify-between">
                        <span className="truncate">▶ {currentStep.screenTitle}</span>
                        <span className="text-[10px] text-emerald-500/80 shrink-0">BAT 100%</span>
                      </div>

                      <div className="space-y-1 text-xs text-emerald-300 font-mono tabular-nums tracking-wide leading-relaxed min-h-[96px]">
                        {currentStep.screenLines.map((line, lIdx) => (
                          <div key={lIdx} className="hover:bg-emerald-950/40 px-1 rounded transition-colors">
                            {line}
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-emerald-950 flex items-center justify-between text-[10px] text-emerald-400/90 font-mono font-bold">
                        <span>[F1: DIST]</span>
                        <span>[F2: COORD]</span>
                        <span>[F3: SET]</span>
                        <span>[F4: REC]</span>
                      </div>
                    </div>

                    {/* Stepper Controls (Field Touch Target Compliant) */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeStepIndex === 0}
                        className="min-h-[44px] inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 text-xs font-semibold text-slate-200 transition-colors border border-white/[0.08] micro-press"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>ก่อนหน้า</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {deviceSteps.map((_, dotIdx) => (
                          <button
                            key={dotIdx}
                            onClick={() => setActiveStepIndex(dotIdx)}
                            className={`h-2 rounded-full transition-all ${
                              dotIdx === activeStepIndex ? 'w-5 bg-emerald-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                            }`}
                            title={`ขั้นตอนที่ ${dotIdx + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => setActiveStepIndex((prev) => Math.min(deviceSteps.length - 1, prev + 1))}
                        disabled={activeStepIndex === deviceSteps.length - 1}
                        className="min-h-[44px] inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 text-xs font-semibold text-slate-200 transition-colors border border-white/[0.08] micro-press"
                      >
                        <span>ถัดไป</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Keypress & QA Explanation */}
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          ปุ่มกด: <code className="px-2 py-0.5 rounded bg-amber-400/15 border border-amber-400/30 text-amber-200 font-mono text-[11px]">{currentStep.buttonKey}</code>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{currentStep.stageName}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {currentStep.explanation}
                      </p>
                      {currentStep.qaCheck && (
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-[11px] flex items-start gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>QA Check:</strong> {currentStep.qaCheck}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Section TOC Jumper (สารบัญหัวข้อ) */}
              <div className="raycast-panel rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-300 border-b border-white/[0.08] pb-2.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>สารบัญหัวข้อในคู่มือนี้</span>
                </div>
                <div className="space-y-1 text-xs">
                  <button onClick={() => scrollToSection('sec-equipment')} className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center justify-between">
                    <span>1. รายการอุปกรณ์ภาคสนาม</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <button onClick={() => scrollToSection('sec-theory')} className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center justify-between">
                    <span>2. หลักการทำงานและทฤษฎี</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <button onClick={() => scrollToSection('sec-procedures')} className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center justify-between">
                    <span>3. ขั้นตอนการปฏิบัติงานสนาม</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  {activeTopic.formulas && activeTopic.formulas.length > 0 && (
                    <button onClick={() => scrollToSection('sec-formulas')} className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center justify-between">
                      <span>4. สูตรและสมการคำนวณ</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  )}
                  <button onClick={() => scrollToSection('sec-qa')} className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center justify-between">
                    <span>5. การควบคุมคุณภาพ (QA/QC)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  {activeTopic.downstreamWorkflow && (
                    <button onClick={() => scrollToSection('sec-workflow')} className="w-full text-left px-3 py-2 rounded-lg text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-colors flex items-center justify-between font-semibold">
                      <span>6. เชื่อมต่อเครื่องมือคำนวณ</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
