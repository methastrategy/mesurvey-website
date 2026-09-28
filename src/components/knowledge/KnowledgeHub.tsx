import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Layers,
  Sparkles,
  FileText,
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

  // Category Color Dot (GitHub Language Dot Style)
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
    <div className="space-y-5 pb-20">

      {/* ================================================================= */}
      {/* SEARCH VIEW                                                        */}
      {/* ================================================================= */}
      {!activeTopic && (
        <div className="space-y-5">

          {/* ── Command-palette Hero Header ── */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f1011] shadow-2xl">
            {/* Subtle grid overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(99,102,241,0.6) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(99,102,241,0.6) 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />
            {/* Indigo bleed glow */}
            <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-indigo-600/10 blur-3xl" />

            <div className="relative p-5 sm:p-8 space-y-5">
              {/* Eyebrow label */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-semibold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                MESURV Knowledge Base · Field SOP Library
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  คลังขั้นตอนปฏิบัติงาน
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Survey Engineering SOPs · มาตรฐานกรมแผนที่ทหาร (RTSD) · เกณฑ์ FGCC
                </p>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหา: Two-Peg, Bowditch, 0-SET, Azimuth, Three-Wire, Stadia, RTK, SLAM…"
                  className="w-full pl-11 pr-28 py-3 rounded-xl border border-white/[0.08] bg-[#18191a] text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 min-h-[48px] transition-all font-sans"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-1"
                    >
                      ล้าง
                    </button>
                  )}
                  <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-[#141516] border border-white/[0.08] text-xs font-mono text-slate-500">
                    /
                  </kbd>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="font-mono tabular-nums text-slate-300 font-semibold">{filteredTopics.length}</span>
                  คู่มือ{searchQuery && ` · "${searchQuery}"`}
                </span>
                <span className="w-px h-3 bg-white/10" />
                <span>9 หมวดงานสนาม</span>
                <span className="w-px h-3 bg-white/10" />
                <span className="hidden sm:inline">ใช้ <kbd className="px-1 py-px bg-[#141516] border border-white/[0.08] rounded font-mono text-slate-400">/</kbd> โฟกัสค้นหา</span>
              </div>
            </div>
          </div>

          {/* ── Mobile horizontal category chips ── */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-3 px-3 sm:mx-0 sm:px-0">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 min-h-[40px] transition-all ${
                      isSelected
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'bg-[#0f1011] text-slate-400 border border-white/[0.06] hover:bg-[#141516] hover:text-slate-200'
                    }`}
                  >
                    <span className="shrink-0">{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-px rounded-full font-mono tabular-nums ${
                      isSelected ? 'bg-indigo-400/20 text-indigo-200' : 'bg-[#141516] text-slate-500'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Two-column layout: facets + results ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* Left: Filter panel (desktop) */}
            <div className="hidden lg:block lg:col-span-3 space-y-3">
              <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-4 space-y-1">
                <div className="flex items-center justify-between pb-3 mb-1 border-b border-white/[0.06]">
                  <span className="flex items-center gap-1.5 text-[10px] font-mono font-semibold tracking-widest uppercase text-slate-500">
                    <Filter className="w-3 h-3 text-indigo-500" />
                    หมวดหมู่
                  </span>
                  <span className="font-mono tabular-nums text-[10px] text-slate-500">{filteredTopics.length}</span>
                </div>

                <div className="space-y-0.5">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium min-h-[36px] transition-all ${
                          isSelected
                            ? 'bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-[#141516] border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <span className={isSelected ? 'text-indigo-400' : 'text-slate-600'}>{cat.icon}</span>
                          <span className="truncate">{cat.label}</span>
                        </span>
                        <span className={`text-[10px] px-2 py-px rounded-full font-mono tabular-nums shrink-0 ${
                          isSelected ? 'bg-indigo-400/20 text-indigo-200' : 'bg-[#141516] text-slate-600'
                        }`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reference card */}
              <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  เกณฑ์อ้างอิงวิชาการ
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ถอดรหัสจากสไลด์ภาควิชาวิศวกรรมสำรวจ มก. (KU Geomatics) ร่วมกับมาตรฐาน RTSD และ FGCC
                </p>
              </div>
            </div>

            {/* Right: Result cards */}
            <div className="lg:col-span-9 space-y-3">

              {/* Result cards */}
              {filteredTopics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic.id)}
                  className="relative p-5 sm:p-6 rounded-xl border border-white/[0.06] bg-[#0f1011] hover:border-indigo-500/30 hover:bg-[#141516] transition-all duration-200 cursor-pointer group space-y-3"
                  style={{ boxShadow: undefined }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px rgba(99,102,241,0.2), 0 4px 32px rgba(99,102,241,0.06)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '';
                  }}
                >
                  {/* Status badge — top-right corner */}
                  {topic.verificationStatus === 'verified' ? (
                    <div className="absolute top-0 right-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-bl-xl rounded-tr-xl text-[9px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border-b border-l border-emerald-500/20">
                      <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                      VERIFIED
                    </div>
                  ) : (
                    <div className="absolute top-0 right-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-bl-xl rounded-tr-xl text-[9px] font-mono font-bold tracking-widest uppercase bg-amber-500/10 text-amber-400 border-b border-l border-amber-500/20">
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      DRAFT
                    </div>
                  )}

                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#141516] border border-white/[0.06] flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 group-hover:border-indigo-500/30 transition-all shrink-0">
                        {getTopicIcon(topic.iconName, 'w-4.5 h-4.5')}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-indigo-300 transition-colors tracking-tight leading-snug">
                          {topic.title}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">{topic.titleEn}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-[#141516] border border-white/[0.06] text-slate-400 hidden sm:inline">
                        {topic.badge}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed line-clamp-2 pl-12">
                    {topic.summary}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pl-12">
                    {getTopicTags(topic.id).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#141516] text-slate-500 border border-white/[0.05] group-hover:border-indigo-500/20 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer meta */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.05] pl-12">
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${getCategoryDotColor(topic.category)}`} />
                        <span>{topic.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{topic.fieldProcedures.length} ขั้นตอน</span>
                      </div>
                      {topic.formulas && topic.formulas.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <span>{topic.formulas.length} สูตร</span>
                        </div>
                      )}
                      {topic.deviceWorkflow && topic.deviceWorkflow.length > 0 && (
                        <div className="flex items-center gap-1 text-emerald-500">
                          <Terminal className="w-3 h-3" />
                          <span>LCD Sim</span>
                        </div>
                      )}
                    </div>

                    {(() => {
                      const wf = getWorkflowTarget(topic);
                      if (!wf) return null;
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.hash = wf.hash;
                            if (onNavigateTab) {
                              onNavigateTab(wf.hash.includes('map') ? 'map' : 'calculator');
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors min-h-[32px]"
                        >
                          {wf.label}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {filteredTopics.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/[0.08] bg-[#0f1011] p-12 text-center space-y-4">
                  <Search className="w-10 h-10 mx-auto text-slate-600 stroke-1" />
                  <div>
                    <h4 className="text-base font-bold text-slate-300">ไม่พบคู่มือที่ตรงกัน</h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                      ลองค้นหา: "Two-Peg", "Bowditch", "0-SET", "Three-Wire", "RTK" หรือเปลี่ยนหมวดหมู่
                    </p>
                  </div>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-[#141516] hover:bg-[#18191a] text-slate-400 hover:text-slate-200 border border-white/[0.06] text-xs font-semibold transition-colors"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* DOCUMENT READER VIEW                                              */}
      {/* ================================================================= */}
      {activeTopic && (
        <div className="space-y-5 max-w-5xl mx-auto">

          {/* Sticky breadcrumb bar */}
          <div className="rounded-xl border border-white/[0.06] bg-[#0f1011]/95 px-4 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3 sticky top-16 z-40 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackToSearch}
                className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141516] hover:bg-[#18191a] text-xs font-semibold text-slate-300 hover:text-white transition-all border border-white/[0.06]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>กลับ</span>
              </button>
              <span className="text-white/20 hidden sm:inline">|</span>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate max-w-sm">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
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
                  className="min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm"
                >
                  <span>{activeWorkflowTarget.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleCopySummary}
                className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141516] hover:bg-[#18191a] text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors border border-white/[0.06]"
              >
                {copiedText ? (
                  <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">คัดลอกแล้ว</span></>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /><span>คัดลอก SOP</span></>
                )}
              </button>
            </div>
          </div>

          {/* Main document container */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#0f1011] overflow-hidden shadow-2xl">

            {/* Provenance banner */}
            {activeTopic.verificationStatus === 'verified' ? (
              <div className="px-6 sm:px-10 py-4 bg-emerald-500/10 border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  VERIFIED Engineering SOP · ผ่านการตรวจรับรองมาตรฐาน
                </div>
                <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">VERIFIED</span>
              </div>
            ) : (
              <div className="px-6 sm:px-10 py-4 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  DRAFT · รอดำเนินการตรวจสอบ peer review ภาคสนาม
                </div>
                <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">DRAFT</span>
              </div>
            )}

            <div className="p-6 sm:p-10 space-y-10">

              {/* Document header */}
              <div className="space-y-4 border-b border-white/[0.06] pb-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-widest uppercase bg-[#141516] text-slate-400 border border-white/[0.06]">
                    {activeTopic.badge}
                  </span>
                  <span className="text-xs text-slate-500">{activeTopic.categoryName}</span>
                  {activeTopic.courseRelation && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                      <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" />
                      {activeTopic.courseRelation}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    {activeTopic.title}
                  </h1>
                  <p className="text-xs font-mono text-slate-500 mt-1">{activeTopic.titleEn}</p>
                </div>

                {/* Overview panel */}
                <div className="p-4 sm:p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 space-y-2">
                  <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    สรุปภาพรวมและวัตถุประสงค์ (Overview & Core Objective)
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                    {activeTopic.summary}
                  </p>
                </div>

                {/* Provenance detail */}
                {activeTopic.verificationProof && (
                  <div className="text-[11px] font-mono text-slate-600 pt-1">
                    <span className="text-slate-500 font-semibold">อ้างอิง:</span> {activeTopic.verificationProof}
                  </div>
                )}
              </div>

              {/* SECTION 1: Equipment */}
              {activeTopic.equipmentRequired && activeTopic.equipmentRequired.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                    1. รายการอุปกรณ์และเครื่องมือ (Field Equipment Checklist)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 rounded-xl bg-[#141516] border border-white/[0.06]">
                    {activeTopic.equipmentRequired.map((eq, eqIdx) => (
                      <div key={eqIdx} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{eq}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 2: Working Principles */}
              <div className="space-y-4">
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  2. หลักการทำงานและทฤษฎีวิศวกรรม (Engineering Foundations)
                </h2>
                <div className="space-y-2.5">
                  {activeTopic.workingPrinciple.map((wp, wpIdx) => (
                    <div key={wpIdx} className="flex items-start gap-3 p-4 rounded-xl bg-[#141516] border border-white/[0.06]">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                        {wpIdx + 1}
                      </div>
                      <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">{wp}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: Field Procedures + LCD Simulator */}
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/[0.06] pb-3">
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    3. ลำดับขั้นการปฏิบัติงานภาคสนาม (Field SOP & Instrument Operation)
                  </h2>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0">
                    {activeTopic.fieldProcedures.length} ขั้นตอนมาตรฐาน
                  </span>
                </div>

                {/* LCD Simulator */}
                {deviceSteps.length > 0 && currentStep && (
                  <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0b] overflow-hidden">
                    {/* Chassis header */}
                    <div className="px-5 py-3 bg-[#141516] border-b border-white/[0.08] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
                        <span className="text-xs font-mono font-bold tracking-wider text-slate-300">
                          {currentStep.targetHardware}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-500">
                        <span>STEP {currentStep.stepNumber} / {deviceSteps.length}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">ACTIVE</span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-4">
                      {/* LCD screen */}
                      <div className="rounded-lg border-2 border-emerald-950/60 bg-black/95 p-4 font-mono tabular-nums shadow-inner">
                        <div className="text-[10px] font-bold text-emerald-400 border-b border-emerald-900/50 pb-1.5 mb-2.5 flex items-center justify-between">
                          <span>▶ {currentStep.screenTitle}</span>
                          <span className="text-emerald-500/70">BAT 100% | TILT ON</span>
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm text-emerald-300 font-mono tabular-nums tracking-wide leading-relaxed">
                          {currentStep.screenLines.map((line, lIdx) => (
                            <div key={lIdx} className="hover:bg-emerald-950/25 px-1 rounded transition-colors">{line}</div>
                          ))}
                        </div>
                        <div className="mt-4 pt-2 border-t border-emerald-950 flex items-center justify-between text-[10px] text-emerald-400/80 font-mono font-bold">
                          <span>[F1: DIST]</span>
                          <span>[F2: COORD]</span>
                          <span>[F3: SET]</span>
                          <span>[F4: REC]</span>
                        </div>
                      </div>

                      {/* Step navigation */}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                          disabled={activeStepIndex === 0}
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141516] hover:bg-[#18191a] disabled:opacity-30 text-xs font-semibold text-slate-300 transition-colors border border-white/[0.06]"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>ก่อนหน้า</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {deviceSteps.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              onClick={() => setActiveStepIndex(dotIdx)}
                              className={`h-1.5 rounded-full transition-all ${
                                dotIdx === activeStepIndex ? 'w-6 bg-emerald-400' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                              }`}
                              title={`ขั้นตอนที่ ${dotIdx + 1}`}
                            />
                          ))}
                        </div>

                        <button
                          onClick={() => setActiveStepIndex((prev) => Math.min(deviceSteps.length - 1, prev + 1))}
                          disabled={activeStepIndex === deviceSteps.length - 1}
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141516] hover:bg-[#18191a] disabled:opacity-30 text-xs font-semibold text-slate-300 transition-colors border border-white/[0.06]"
                        >
                          <span>ถัดไป</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Keypad detail */}
                      <div className="rounded-lg bg-[#141516] border border-white/[0.06] p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <Terminal className="w-4 h-4" />
                            ปุ่มที่กด: <code className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-300 font-mono text-xs ml-1">{currentStep.buttonKey}</code>
                          </span>
                          <span className="text-[11px] text-slate-500">{currentStep.stageName}</span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">{currentStep.explanation}</p>
                        {currentStep.qaCheck && (
                          <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span><strong>QA Check:</strong> {currentStep.qaCheck}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step checklist */}
                <div className="space-y-2.5">
                  {activeTopic.fieldProcedures.map((proc, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-4 sm:p-5 rounded-xl border border-white/[0.06] bg-[#141516] hover:border-indigo-500/20 transition-colors space-y-2"
                    >
                      <h3 className="font-bold text-slate-200 text-sm sm:text-[15px] flex items-center gap-2.5">
                        <span className="w-5.5 h-5.5 w-6 h-6 rounded-full bg-[#18191a] text-slate-300 border border-white/[0.08] flex items-center justify-center text-[10px] font-mono shrink-0">
                          {pIdx + 1}
                        </span>
                        {proc.title}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed pl-8">{proc.details}</p>
                      {proc.criticalCaution && (
                        <div className="ml-8 p-3 rounded-lg bg-amber-500/8 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>ข้อควรระวัง:</strong> {proc.criticalCaution}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: Formulas */}
              {activeTopic.formulas && activeTopic.formulas.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    4. สูตรการคำนวณ (Engineering Formulas & Equations)
                  </h2>
                  <div className="space-y-3">
                    {activeTopic.formulas.map((f, fIdx) => (
                      <div key={fIdx} className="p-4 sm:p-5 rounded-xl bg-[#141516] border border-white/[0.06] space-y-2">
                        <span className="text-xs sm:text-[13px] font-bold text-slate-200 block">{f.label}</span>
                        <div className="font-mono text-xs sm:text-sm font-bold text-indigo-300 bg-[#0f1011] px-4 py-3 rounded-lg border border-white/[0.06] overflow-x-auto tabular-nums">
                          {f.formula}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{f.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 5: QA/QC */}
              {activeTopic.errorSourcesAndMitigation && activeTopic.errorSourcesAndMitigation.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-l-2 border-amber-500 pl-3">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    5. แหล่งความคลาดเคลื่อนและการควบคุมคุณภาพ (QA/QC)
                  </h2>
                  <div className="space-y-2">
                    {activeTopic.errorSourcesAndMitigation.map((err, eIdx) => (
                      <div key={eIdx} className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                        <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">{err}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 6: Downstream Workflow */}
              {activeTopic.downstreamWorkflow && (
                <div className="space-y-4">
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                    6. เวิร์กโฟลว์ต่อเนื่องและเครื่องมือคำนวณ (Downstream Workflow)
                  </h2>
                  <div className="p-5 sm:p-6 rounded-xl bg-[#141516] border border-white/[0.06] border-l-2 border-l-indigo-500 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">Output Data Format:</span>
                        <span className="font-mono text-xs font-bold text-indigo-300 bg-[#0f1011] px-3 py-1 rounded-lg border border-white/[0.06]">
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
                          {activeWorkflowTarget.label}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                      {activeTopic.downstreamWorkflow.outputDescription}
                    </p>
                    <div className="p-4 rounded-lg bg-[#0f1011] border border-white/[0.06] space-y-1">
                      <span className="text-xs font-bold text-slate-200">{activeTopic.downstreamWorkflow.nextStepTitle}</span>
                      <p className="text-xs text-slate-500 leading-relaxed">{activeTopic.downstreamWorkflow.nextStepProcedure}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom nav */}
              <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between">
                <button
                  onClick={handleBackToSearch}
                  className="min-h-[44px] inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  กลับสู่รายการคู่มือทั้งหมด
                </button>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="min-h-[44px] px-3 text-xs text-slate-600 hover:text-slate-300 flex items-center"
                >
                  ↑ บนสุด
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
