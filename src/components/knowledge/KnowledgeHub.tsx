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

  // Specific Domain & Methodology Badge Resolver per SOP Topic
  const getTopicDomainBadge = (topicId: string): { label: string; className: string } => {
    switch (topicId) {
      case 'differential-leveling-survey':
        return { label: 'กล้องระดับ', className: 'badge badge-leveling' };
      case 'theodolite-station-setup':
        return { label: 'Total Station & กล้องวัดมุม', className: 'badge badge-totalstation' };
      case 'closed-loop-traverse':
        return { label: 'วงรอบปิด', className: 'badge badge-traverse-closed' };
      case 'link-open-traverse':
        return { label: 'วงรอบเปิดเชื่อมโยง', className: 'badge badge-traverse-link' };
      case 'gnss-rtk-static-survey':
        return { label: 'GNSS Static & RTK CORS', className: 'badge badge-gnss' };
      case 'uav-drone-photogrammetry':
        return { label: 'โดรนสำรวจ UAV', className: 'badge badge-drone' };
      case 'terrestrial-lidar-slam':
        return { label: '3D Laser & SLAM', className: 'badge badge-laser' };
      case 'hydrographic-bathymetric-survey':
        return { label: 'หยั่งน้ำ Bathymetric', className: 'badge badge-bathymetry' };
      case 'tbm-tunnel-guidance-survey':
        return { label: 'อุโมงค์ TBM', className: 'badge badge-tunnel' };
      default:
        return { label: 'คู่มือสำรวจ', className: 'badge badge-leveling' };
    }
  };

  // Dynamic Topic Tags
  const getTopicTags = (topicId: string): string[] => {
    switch (topicId) {
      case 'differential-leveling-survey':
        return ['Three-Wire Leveling', 'Two-Peg Test', 'Stadia D=100s', 'FGCC Standards'];
      case 'theodolite-station-setup':
        return ['Total Station', 'Free Station Resection', '0-SET Backsight', 'Prism Constant', 'FL/FR Two-Face'];
      case 'closed-loop-traverse':
        return ['Closed Polygon', 'Angular Misclosure', 'Bowditch Rule', 'UTM Grid'];
      case 'link-open-traverse':
        return ['Link Traverse', 'Benchmark Tie-in', 'Azimuth Closure', 'Alignment Control'];
      case 'gnss-rtk-static-survey':
        return ['Static Geodesy', 'RTK CORS VRS', 'RINEX Logging', 'TGM2017 Geoid', 'NTRIP Base-Rover'];
      case 'uav-drone-photogrammetry':
        return ['UAV Photogrammetry', 'GSD Calculation', 'GCP / Check Points', 'SfM'];
      case 'terrestrial-lidar-slam':
        return ['Terrestrial LiDAR', 'Mobile SLAM', 'Point Cloud ICP', 'Scan-to-BIM'];
      case 'hydrographic-bathymetric-survey':
        return ['Multi-Beam Echo', 'Bathymetric Survey', 'MRU Roll/Pitch', 'IHO Standards'];
      case 'tbm-tunnel-guidance-survey':
        return ['TBM Guidance', 'Motorized TS', 'DTA Deviations', 'Gyrotheodolite'];
      default:
        return ['Field SOP', 'Survey Engineering', 'Geomatics'];
    }
  };

  // Category Facets: Equipment Manuals vs Field Survey Methods + Domain Facets
  const categories: { id: string; label: string; count: number; icon: React.ReactNode }[] = useMemo(() => [
    { id: 'all', label: 'ทั้งหมด (All SOPs)', count: KNOWLEDGE_TOPICS.length, icon: <BookOpen className="w-3.5 h-3.5" /> },
    { 
      id: 'equipment-manual', 
      label: 'คู่มือการใช้อุปกรณ์', 
      count: KNOWLEDGE_TOPICS.filter(t => [
        'differential-leveling-survey',
        'theodolite-station-setup',
        'gnss-rtk-static-survey',
        'uav-drone-photogrammetry',
        'terrestrial-lidar-slam',
        'hydrographic-bathymetric-survey'
      ].includes(t.id)).length, 
      icon: <Compass className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'survey-method', 
      label: 'วิธีการทำงานภาคสนาม', 
      count: KNOWLEDGE_TOPICS.filter(t => [
        'differential-leveling-survey',
        'closed-loop-traverse',
        'link-open-traverse',
        'gnss-rtk-static-survey',
        'tbm-tunnel-guidance-survey',
        'uav-drone-photogrammetry'
      ].includes(t.id)).length, 
      icon: <Layers className="w-3.5 h-3.5" /> 
    },
    { id: 'survey-instrument', label: 'กล้องสำรวจ & วงรอบ', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'survey-instrument' || t.category === 'total-station' || t.category === 'differential-leveling').length, icon: <Ruler className="w-3.5 h-3.5" /> },
    { id: 'gnss-gps', label: 'GNSS / RTK CORS', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'gnss-gps' || t.category === 'gnss-geodesy').length, icon: <Satellite className="w-3.5 h-3.5" /> },
    { id: 'drone-uav', label: 'Drone / UAV', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'drone-uav' || t.category === 'drone-photogrammetry').length, icon: <Plane className="w-3.5 h-3.5" /> },
    { id: 'scanner-slam', label: 'LiDAR / SLAM', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'scanner-slam' || t.category === 'lidar-scan-bim').length, icon: <Scan className="w-3.5 h-3.5" /> },
    { id: 'hydrographic', label: 'หยั่งน้ำ Hydro', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'hydrographic').length, icon: <Ship className="w-3.5 h-3.5" /> },
    { id: 'tbm-tunnel', label: 'อุโมงค์ TBM', count: KNOWLEDGE_TOPICS.filter(t => t.category === 'tbm-tunnel').length, icon: <HardHat className="w-3.5 h-3.5" /> },
  ], []);

  // Filtered Topics
  const filteredTopics = useMemo(() => {
    return KNOWLEDGE_TOPICS.filter((t) => {
      let matchCategory = selectedCategory === 'all';
      if (!matchCategory) {
        if (selectedCategory === 'equipment-manual') {
          matchCategory = [
            'differential-leveling-survey',
            'theodolite-station-setup',
            'gnss-rtk-static-survey',
            'uav-drone-photogrammetry',
            'terrestrial-lidar-slam',
            'hydrographic-bathymetric-survey'
          ].includes(t.id);
        } else if (selectedCategory === 'survey-method') {
          matchCategory = [
            'differential-leveling-survey',
            'closed-loop-traverse',
            'link-open-traverse',
            'gnss-rtk-static-survey',
            'tbm-tunnel-guidance-survey',
            'uav-drone-photogrammetry'
          ].includes(t.id);
        } else if (selectedCategory === 'survey-instrument') {
          matchCategory = (
            t.category === 'survey-instrument' || 
            t.category === 'total-station' || 
            t.category === 'differential-leveling' ||
            t.id === 'differential-leveling-survey' ||
            t.id === 'theodolite-station-setup' ||
            t.id === 'closed-loop-traverse' ||
            t.id === 'link-open-traverse'
          );
        } else if (selectedCategory === 'gnss-gps') {
          matchCategory = t.category === 'gnss-gps' || t.category === 'gnss-geodesy' || t.id === 'gnss-rtk-static-survey';
        } else if (selectedCategory === 'drone-uav') {
          matchCategory = t.category === 'drone-uav' || t.category === 'drone-photogrammetry' || t.id === 'uav-drone-photogrammetry';
        } else if (selectedCategory === 'scanner-slam') {
          matchCategory = t.category === 'scanner-slam' || t.category === 'lidar-scan-bim' || t.id === 'terrestrial-lidar-slam';
        } else if (selectedCategory === 'hydrographic') {
          matchCategory = t.category === 'hydrographic' || t.id === 'hydrographic-bathymetric-survey';
        } else if (selectedCategory === 'tbm-tunnel') {
          matchCategory = t.category === 'tbm-tunnel' || t.id === 'tbm-tunnel-guidance-survey';
        } else {
          matchCategory = t.category === selectedCategory;
        }
      }
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
    <div className="space-y-8 pb-16">

      {/* ================================================================= */}
      {/* 1. MESURV FUSION OVERVIEW (2-Col Hero Split + 3-Col Card Grid)    */}
      {/* ================================================================= */}
      {!activeTopic && (
        <div className="space-y-8">

          {/* ── Hero 2-Column Split (Title + CTA Left, 4 Metric Cards Right) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-xs text-[var(--accent)] uppercase tracking-wider mb-2">
                <span>KU GEOMATICS • RTSD FIELD SOP</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-1)] mb-3 tracking-tight">
                คู่มือสำรวจ / Knowledge Hub
              </h1>
              <p className="text-[var(--text-2)] mb-6 text-sm leading-relaxed">
                มาตรฐานการตั้งกล้อง ขั้นตอนการรังวัดภาคสนาม สมการปรับแก้ความคลาดเคลื่อน และจำลองหน้าจอควบคุมเครื่องมือสำรวจตามเกณฑ์กรมแผนที่ทหาร (RTSD) และ FGCC
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => searchInputRef.current?.focus()}
                  className="btn-primary min-h-[44px] inline-flex items-center gap-2 text-sm"
                >
                  <span>ค้นหามาตรฐาน SOP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = '#/calculator';
                    if (onNavigateTab) onNavigateTab('calculator');
                  }}
                  className="btn-outline min-h-[44px] inline-flex items-center gap-2 text-sm"
                >
                  <span>เปิดเครื่องมือคำนวณสนาม</span>
                </button>
              </div>
            </div>

            {/* 4 Telemetry Metric Cards (2x2 Grid — Geist Mono Tabular-Nums) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              <div className="fusion-card p-3 sm:p-4 min-w-0">
                <div className="text-[var(--text-3)] text-[11px] sm:text-xs font-mono uppercase tracking-wider mb-1 truncate">
                  RTK Sigma
                </div>
                <div className="text-base sm:text-2xl font-semibold font-mono tabular-nums text-[var(--accent)] truncate">
                  ±0.004m
                </div>
              </div>
              <div className="fusion-card p-3 sm:p-4 min-w-0">
                <div className="text-[var(--text-3)] text-[11px] sm:text-xs font-mono uppercase tracking-wider mb-1 truncate">
                  Closure
                </div>
                <div className="text-base sm:text-2xl font-semibold font-mono tabular-nums text-[var(--text-1)] truncate">
                  1:32,400
                </div>
              </div>
              <div className="fusion-card p-3 sm:p-4 min-w-0">
                <div className="text-[var(--text-3)] text-[11px] sm:text-xs font-mono uppercase tracking-wider mb-1 truncate">
                  Elevation
                </div>
                <div className="text-base sm:text-2xl font-semibold font-mono tabular-nums text-[var(--text-1)] truncate">
                  +42.815m
                </div>
              </div>
              <div className="fusion-card p-3 sm:p-4 min-w-0">
                <div className="text-[var(--text-3)] text-[11px] sm:text-xs font-mono uppercase tracking-wider mb-1 truncate">
                  Parcel
                </div>
                <div className="text-base sm:text-2xl font-semibold font-mono tabular-nums text-[var(--text-1)] truncate">
                  12-2-48.5 ไร่
                </div>
              </div>
            </div>
          </div>

          {/* ── Controls Near Content: Inline Search + Category Filter Bar ── */}
          <div className="fusion-card p-3 sm:p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="ค้นหาคู่มือปฏิบัติงานสำรวจ"
                placeholder="ค้นหาชื่อเครื่องมือ, คำสั่งกล้อง, เทคนิคสนาม (เช่น Two-Peg, Bowditch, RTK)... [กด /]"
                className="w-full min-h-[44px] pl-10 pr-24 sm:pr-36 py-2.5 rounded-[var(--btn-radius)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-1)] placeholder-[var(--text-3)] text-xs sm:text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="min-h-[32px] px-2 py-1 rounded text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text-1)] bg-[var(--surface)] border border-[var(--border)] transition-colors shrink-0"
                  >
                    ล้าง
                  </button>
                )}
                <span className="hidden xs:inline-block px-1.5 sm:px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[10px] sm:text-[11px] font-mono tabular-nums text-[var(--text-2)] shrink-0">
                  {filteredTopics.length} SOPs
                </span>
              </div>
            </div>

            {/* Category Filter Underline Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-[var(--border)]">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`min-h-[44px] inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold shrink-0 border-b-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[var(--accent)] text-[var(--text-1)] bg-[var(--surface-2)]'
                        : 'border-transparent text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]/50'
                    }`}
                  >
                    <span className={isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-3)]'}>
                      {cat.icon}
                    </span>
                    <span>{cat.label}</span>
                    <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)]">
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 3-Column Knowledge Card Grid (champion-fusion.html spec) ── */}
          {filteredTopics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTopics.map((topic) => {
                const topicIndex = KNOWLEDGE_TOPICS.findIndex((t) => t.id === topic.id);
                const sopCode = `SOP-0${topicIndex + 1}`;
                const domainBadge = getTopicDomainBadge(topic.id);
                const wf = getWorkflowTarget(topic);

                return (
                  <div
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic.id)}
                    className="fusion-card group p-5 flex flex-col justify-between h-full cursor-pointer"
                  >
                    <div className="flex flex-col flex-grow">
                      {/* Top Metadata Row: SOP Code + Survey Domain & Provenance Badge */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="font-mono text-xs bg-[var(--surface-2)] px-2 py-1 rounded text-[var(--text-2)] border border-[var(--border)]">
                          {sopCode}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className={domainBadge.className}>{domainBadge.label}</span>
                          {topic.verificationStatus === 'verified' ? (
                            <span className="badge badge-beginner" title={topic.verificationProof}>
                              VERIFIED
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-3)] border border-[var(--border)]">
                              DRAFT
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Monospace English Subtitle */}
                      <h2 className="text-[17px] sm:text-[18px] font-bold text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors mb-1 leading-snug break-words">
                        {topic.title}
                      </h2>
                      <p className="font-mono text-[11px] sm:text-[12px] text-[var(--accent)] mb-3 break-words">
                        {topic.titleEn}
                      </p>

                      {/* Summary */}
                      <p className="text-[13px] text-[var(--text-2)] mb-4 leading-relaxed line-clamp-3 flex-grow break-words">
                        {topic.summary}
                      </p>

                      {/* Compact Technical Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {getTopicTags(topic.id).slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer: Telemetry Specs & Action Link */}
                    <div className="pt-3.5 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-3)] shrink-0">
                        <span>{topic.fieldProcedures.length} ขั้นตอน</span>
                        {topic.deviceWorkflow && topic.deviceWorkflow.length > 0 && (
                          <span className="text-[var(--accent)] font-semibold">• LCD Sim</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
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
                            className="min-h-[36px] px-2.5 py-1 rounded-[var(--btn-radius)] text-[11px] font-mono font-semibold bg-[var(--surface-2)] hover:bg-[var(--accent)] text-[var(--text-1)] hover:text-[var(--accent-text)] border border-[var(--border)] transition-colors"
                            title={wf.label}
                          >
                            คำนวณ →
                          </button>
                        )}
                        <span className="text-[13px] font-semibold text-[var(--text-1)] group-hover:text-[var(--accent)] inline-flex items-center gap-1 transition-colors">
                          <span>Inspect Spec</span>
                          <span className="text-base leading-none">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="fusion-card p-12 text-center space-y-4">
              <Search className="w-10 h-10 mx-auto text-[var(--text-3)] stroke-1" />
              <div>
                <h3 className="text-base font-bold text-[var(--text-1)]">
                  ไม่พบคู่มือที่ตรงกับคำค้นหา "{searchQuery}"
                </h3>
                <p className="text-xs text-[var(--text-2)] mt-1 max-w-sm mx-auto">
                  ลองค้นหาด้วยคำสำคัญ เช่น "Two-Peg", "Bowditch", "0-SET", "Three-Wire", "RTK" หรือเลือกหมวดหมู่ใหม่
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="btn-outline min-h-[44px] text-xs"
              >
                แสดงคู่มือทั้งหมด
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. SPLIT-VIEW TECHNICAL READER (Left Content / Right Sticky LCD)  */}
      {/* ================================================================= */}
      {activeTopic && (
        <div className="space-y-6">

          {/* Sticky Top Command Bar */}
          <div className="fusion-card px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-16 z-30">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={handleBackToSearch}
                className="btn-outline min-h-[44px] inline-flex items-center gap-1.5 text-xs shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>คลังคู่มือทั้งหมด</span>
              </button>

              <span className="text-[var(--border-strong)] hidden sm:inline">|</span>

              <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-2)] truncate">
                <span className="truncate text-[var(--text-1)] font-bold">{activeTopic.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeTopic.deviceWorkflow && activeTopic.deviceWorkflow.length > 0 && (
                <button
                  type="button"
                  onClick={() => scrollToSection('sec-lcd-sim')}
                  className="lg:hidden btn-outline min-h-[44px] inline-flex items-center gap-1.5 text-xs"
                  title="เลื่อนไปดูหน้าจอจำลอง LCD"
                >
                  <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />
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
                  className="btn-primary min-h-[44px] inline-flex items-center gap-1.5 text-xs"
                >
                  <span>{activeWorkflowTarget.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleCopySummary}
                className="btn-outline min-h-[44px] inline-flex items-center gap-1.5 text-xs"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span className="text-[var(--accent)] font-semibold">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[var(--text-2)]" />
                    <span>คัดลอก SOP</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Split-View Reader Grid (Left: Engineering SOP / Right: Sticky LCD Simulator & TOC) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Column: Main SOP Documentation (8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <div className="fusion-card p-6 sm:p-8 space-y-8">

                {/* Provenance Banner */}
                {activeTopic.verificationStatus === 'verified' ? (
                  <div className="p-4 rounded-[var(--btn-radius)] bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[var(--accent)]">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>VERIFIED · ผ่านการตรวจรับรองมาตรฐานวิศวกรรม</span>
                      </div>
                      <span className="badge badge-beginner">VERIFIED</span>
                    </div>
                    {activeTopic.verificationProof && (
                      <p className="text-[11px] font-mono text-[var(--text-2)]">
                        อ้างอิง: {activeTopic.verificationProof}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-[var(--btn-radius)] bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[var(--accent-2)]">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>DRAFT · เอกสารทางเทคนิคฉบับร่าง (Preliminary SOP)</span>
                      </div>
                      <span className="badge badge-core">DRAFT</span>
                    </div>
                    {activeTopic.verificationProof && (
                      <p className="text-[11px] font-mono text-[var(--text-2)]">
                        อ้างอิง: {activeTopic.verificationProof}
                      </p>
                    )}
                  </div>
                )}

                {/* Document Title & Objective */}
                <div className="space-y-4 border-b border-[var(--border)] pb-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-2)]">
                    <span className={getTopicDomainBadge(activeTopic.id).className}>
                      {getTopicDomainBadge(activeTopic.id).label}
                    </span>
                    <span className="text-[var(--accent)] font-bold font-mono uppercase">{activeTopic.categoryName}</span>
                    {activeTopic.courseRelation && (
                      <span className="text-[var(--text-2)] font-mono text-[11px] ml-auto bg-[var(--surface-2)] px-2.5 py-0.5 rounded border border-[var(--border)]">
                        {activeTopic.courseRelation}
                      </span>
                    )}
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-1)] tracking-tight leading-tight">
                      {activeTopic.title}
                    </h1>
                    <p className="text-xs sm:text-sm font-mono text-[var(--accent)] mt-1">
                      {activeTopic.titleEn}
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-[var(--btn-radius)] bg-[var(--surface-2)] border border-[var(--border)] border-l-4 border-l-[var(--accent)] space-y-1.5">
                    <div className="text-xs font-bold text-[var(--text-1)] flex items-center gap-1.5">
                      <BookmarkCheck className="w-4 h-4 text-[var(--accent)]" />
                      <span>วัตถุประสงค์และขอบเขตงาน (Core Objective)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                      {activeTopic.summary}
                    </p>
                  </div>
                </div>

                {/* SECTION 1: EQUIPMENT */}
                {activeTopic.equipmentRequired && activeTopic.equipmentRequired.length > 0 && (
                  <div id="sec-equipment" className="space-y-3.5 scroll-mt-24">
                    <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2 border-l-2 border-[var(--accent)] pl-3">
                      <SlidersHorizontal className="w-4 h-4 text-[var(--accent)]" />
                      <span>1. รายการอุปกรณ์และเครื่องมือภาคสนาม (Equipment Checklist)</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 rounded-[var(--btn-radius)] bg-[var(--surface-2)] border border-[var(--border)]">
                      {activeTopic.equipmentRequired.map((eq, eqIdx) => (
                        <div key={eqIdx} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[var(--text-1)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 shrink-0" />
                          <span>{eq}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 2: WORKING PRINCIPLES */}
                <div id="sec-theory" className="space-y-3.5 scroll-mt-24">
                  <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2 border-l-2 border-[var(--accent)] pl-3">
                    <BookOpen className="w-4 h-4 text-[var(--accent)]" />
                    <span>2. หลักการทำงานและทฤษฎีวิศวกรรม (Working Principles)</span>
                  </h2>
                  <div className="space-y-2.5">
                    {activeTopic.workingPrinciple.map((wp, wpIdx) => (
                      <div key={wpIdx} className="flex items-start gap-3 p-4 rounded-[var(--btn-radius)] bg-[var(--surface-2)] border border-[var(--border)]">
                        <div className="w-6 h-6 rounded bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)] flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                          {wpIdx + 1}
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--text-1)] leading-relaxed">
                          {wp}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 3: FIELD PROCEDURES */}
                <div id="sec-procedures" className="space-y-4 scroll-mt-24">
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
                    <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2 border-l-2 border-[var(--accent)] pl-3">
                      <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                      <span>3. ลำดับขั้นการปฏิบัติงานภาคสนาม (Field Operating Procedures)</span>
                    </h2>
                    <span className="text-xs font-mono text-[var(--text-2)]">
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
                        className={`p-4 sm:p-5 rounded-[var(--btn-radius)] border transition-colors space-y-2 cursor-pointer ${
                          pIdx === activeStepIndex && deviceSteps.length > 0
                            ? 'bg-[var(--surface-2)] border-[var(--accent)]'
                            : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-[var(--text-1)] text-sm sm:text-base flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)] flex items-center justify-center text-xs font-mono shrink-0">
                              {pIdx + 1}
                            </span>
                            <span>{proc.title}</span>
                          </h3>
                          {pIdx < deviceSteps.length && (
                            <span className="badge badge-beginner shrink-0">
                              STEP {pIdx + 1} LCD
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed pl-8">
                          {proc.details}
                        </p>

                        {proc.criticalCaution && (
                          <div className="ml-8 mt-2 p-3 rounded-[var(--btn-radius)] bg-amber-500/10 border border-amber-500/30 text-[var(--text-1)] text-xs flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-[var(--accent-2)] shrink-0 mt-0.5" />
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
                    <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2 border-l-2 border-[var(--accent)] pl-3">
                      <Activity className="w-4 h-4 text-[var(--accent)]" />
                      <span>4. สูตรการคำนวณและสมการวิศวกรรม (Formulas & Equations)</span>
                    </h2>
                    <div className="space-y-3">
                      {activeTopic.formulas.map((f, fIdx) => (
                        <div key={fIdx} className="p-4 sm:p-5 rounded-[var(--btn-radius)] bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                          <span className="text-xs sm:text-sm font-bold text-[var(--text-1)] block">
                            {f.label}
                          </span>
                          <div className="font-mono text-xs sm:text-sm font-bold text-[var(--accent)] bg-[var(--surface)] px-4 py-3 rounded-[var(--btn-radius)] border border-[var(--border)] overflow-x-auto tabular-nums">
                            {f.formula}
                          </div>
                          <p className="text-xs text-[var(--text-2)] leading-relaxed">
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
                    <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2 border-l-2 border-[var(--accent-2)] pl-3">
                      <ShieldCheck className="w-4 h-4 text-[var(--accent-2)]" />
                      <span>5. แหล่งความคลาดเคลื่อนและการควบคุมคุณภาพ (QA/QC)</span>
                    </h2>
                    <div className="space-y-2">
                      {activeTopic.errorSourcesAndMitigation.map((err, eIdx) => (
                        <div key={eIdx} className="p-3.5 rounded-[var(--btn-radius)] bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-2)] mt-2 shrink-0" />
                          <p className="text-xs sm:text-sm text-[var(--text-1)] leading-relaxed">
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
                    <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2 border-l-2 border-[var(--accent)] pl-3">
                      <ArrowRight className="w-4 h-4 text-[var(--accent)]" />
                      <span>6. เวิร์กโฟลว์ต่อเนื่องและเครื่องมือคำนวณ (Downstream Execution)</span>
                    </h2>
                    <div className="p-5 rounded-[var(--btn-radius)] bg-[var(--surface-2)] border border-[var(--border)] space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="text-[11px] text-[var(--text-2)] block mb-1">รูปแบบข้อมูลนำออก (Output Data Format):</span>
                          <span className="font-mono text-xs font-bold text-[var(--accent)] bg-[var(--surface)] px-3 py-1 rounded border border-[var(--border)] inline-block">
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
                            className="btn-primary min-h-[44px] inline-flex items-center gap-2 text-xs sm:text-sm"
                          >
                            <span>{activeWorkflowTarget.label}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                        {activeTopic.downstreamWorkflow.outputDescription}
                      </p>
                      <div className="p-3.5 rounded-[var(--btn-radius)] bg-[var(--surface)] border border-[var(--border)] space-y-1">
                        <span className="text-xs font-bold text-[var(--text-1)]">{activeTopic.downstreamWorkflow.nextStepTitle}</span>
                        <p className="text-xs text-[var(--text-2)] leading-relaxed">{activeTopic.downstreamWorkflow.nextStepProcedure}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Right Column: Sticky Interactive LCD Simulator & Quick Section Navigator (4 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-20">

              {/* Interactive Instrument LCD & Keypad Simulator */}
              {deviceSteps.length > 0 && currentStep && (
                <div id="sec-lcd-sim" className="fusion-card overflow-hidden scroll-mt-24">
                  {/* Instrument Chassis Header */}
                  <div className="px-4 py-3 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="status-dot" />
                      <span className="text-xs font-mono font-bold tracking-wider text-[var(--text-1)] truncate max-w-[180px]">
                        {currentStep.targetHardware}
                      </span>
                    </div>
                    <span className="badge badge-beginner tabular-nums">
                      STEP {currentStep.stepNumber}/{deviceSteps.length}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    {/* High-Contrast Backlit Digital LCD Screen (Always dark instrument LCD for authenticity) */}
                    <div className="rounded-[var(--btn-radius)] border-2 border-emerald-900/80 bg-[#050a08] p-4 font-mono tabular-nums space-y-2">
                      <div className="text-[11px] font-bold text-emerald-400 border-b border-emerald-900/60 pb-1.5 flex items-center justify-between">
                        <span className="truncate">▶ {currentStep.screenTitle}</span>
                        <span className="text-[10px] text-emerald-500 shrink-0">BAT 100%</span>
                      </div>

                      <div className="space-y-1 text-xs text-emerald-300 font-mono tabular-nums tracking-wide leading-relaxed min-h-[96px]">
                        {currentStep.screenLines.map((line, lIdx) => (
                          <div key={lIdx} className="hover:bg-emerald-950/50 px-1 rounded transition-colors">
                            {line}
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-emerald-900/60 flex flex-wrap items-center justify-between gap-1 text-[9px] sm:text-[10px] text-emerald-400 font-mono font-bold">
                        <span>[F1: DIST]</span>
                        <span>[F2: COORD]</span>
                        <span>[F3: SET]</span>
                        <span>[F4: REC]</span>
                      </div>
                    </div>

                    {/* Stepper Controls (Field Touch Target Compliant >= 44px) */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeStepIndex === 0}
                        className="btn-outline min-h-[44px] inline-flex items-center gap-1 text-xs disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>ก่อนหน้า</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {deviceSteps.map((_, dotIdx) => (
                          <button
                            key={dotIdx}
                            type="button"
                            onClick={() => setActiveStepIndex(dotIdx)}
                            aria-label={`ขั้นตอนที่ ${dotIdx + 1}`}
                            className={`h-2.5 rounded-full transition-all ${
                              dotIdx === activeStepIndex ? 'w-6 bg-[var(--accent)]' : 'w-2.5 bg-[var(--border-strong)]'
                            }`}
                            title={`ขั้นตอนที่ ${dotIdx + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveStepIndex((prev) => Math.min(deviceSteps.length - 1, prev + 1))}
                        disabled={activeStepIndex === deviceSteps.length - 1}
                        className="btn-outline min-h-[44px] inline-flex items-center gap-1 text-xs disabled:opacity-30"
                      >
                        <span>ถัดไป</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Keypress & QA Explanation */}
                    <div className="rounded-[var(--btn-radius)] bg-[var(--surface-2)] border border-[var(--border)] p-3.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-xs font-bold text-[var(--text-1)] flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />
                          ปุ่มกด: <code className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] font-mono text-[11px]">{currentStep.buttonKey}</code>
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-3)]">{currentStep.stageName}</span>
                      </div>
                      <p className="text-xs text-[var(--text-2)] leading-relaxed">
                        {currentStep.explanation}
                      </p>
                      {currentStep.qaCheck && (
                        <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[var(--text-1)] text-[11px] flex items-start gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
                          <span><strong>QA Check:</strong> {currentStep.qaCheck}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Section TOC Jumper (สารบัญหัวข้อ) */}
              <div className="fusion-card p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-1)] border-b border-[var(--border)] pb-2.5">
                  <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>สารบัญหัวข้อในคู่มือนี้</span>
                </div>
                <div className="space-y-1 text-xs">
                  <button type="button" onClick={() => scrollToSection('sec-equipment')} className="w-full min-h-[40px] text-left px-3 py-2 rounded text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between">
                    <span>1. รายการอุปกรณ์ภาคสนาม</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-3)]" />
                  </button>
                  <button type="button" onClick={() => scrollToSection('sec-theory')} className="w-full min-h-[40px] text-left px-3 py-2 rounded text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between">
                    <span>2. หลักการทำงานและทฤษฎี</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-3)]" />
                  </button>
                  <button type="button" onClick={() => scrollToSection('sec-procedures')} className="w-full min-h-[40px] text-left px-3 py-2 rounded text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between">
                    <span>3. ขั้นตอนการปฏิบัติงานสนาม</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-3)]" />
                  </button>
                  {activeTopic.formulas && activeTopic.formulas.length > 0 && (
                    <button type="button" onClick={() => scrollToSection('sec-formulas')} className="w-full min-h-[40px] text-left px-3 py-2 rounded text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between">
                      <span>4. สูตรและสมการคำนวณ</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-3)]" />
                    </button>
                  )}
                  <button type="button" onClick={() => scrollToSection('sec-qa')} className="w-full min-h-[40px] text-left px-3 py-2 rounded text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between">
                    <span>5. การควบคุมคุณภาพ (QA/QC)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-3)]" />
                  </button>
                  {activeTopic.downstreamWorkflow && (
                    <button type="button" onClick={() => scrollToSection('sec-workflow')} className="w-full min-h-[40px] text-left px-3 py-2 rounded text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between font-semibold">
                      <span>6. เชื่อมต่อเครื่องมือคำนวณ</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)]" />
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

