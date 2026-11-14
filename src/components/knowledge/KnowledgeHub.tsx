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
  Layers,
  Scale,
  Wrench
} from 'lucide-react';
import { KNOWLEDGE_TOPICS } from '../../data/knowledge-topics';
import { KnowledgeTopic, KnowledgeCategory, DeviceScreenStep } from '../../types/survey';
import { 
  BUILDING_LAW_ITEMS, 
  FIELD_TROUBLESHOOTING_ITEMS, 
  SITE_ENGINEERING_ITEMS,
  BuildingLawItem,
  TroubleshootingItem,
  SiteEngineeringItem
} from '../../data/site-knowledge';
import { GlossaryView } from './GlossaryView';
import { useI18n, cleanParenthesizedTitle, getLocalizedTitle } from '../../core/i18n';

interface KnowledgeHubProps {
  onNavigateTab?: (tab: 'calculator' | 'map') => void;
  initialTopicId?: string | null;
}

export type KnowledgeCategoryFilter = 'all' | 'equipment' | 'sop' | 'laws' | 'site' | 'troubleshooting' | 'glossary';

export interface UnifiedKnowledgeCard {
  id: string;
  code: string;
  title: string;
  titleEn: string;
  category: 'equipment' | 'sop' | 'laws' | 'site' | 'troubleshooting';
  categoryLabel: string;
  badge: { label: string; className: string };
  codeBadgeClass: string;
  summary: string;
  icon: React.ReactNode;
  tags: string[];
  workflowTarget?: { hash: string; label: string } | null;
  kind: 'topic' | 'law' | 'site' | 'troubleshooting';
  topicData?: KnowledgeTopic;
  lawData?: BuildingLawItem;
  siteData?: SiteEngineeringItem;
  troubleData?: TroubleshootingItem;
  telemetryCount?: string;
}

export const KnowledgeHub: React.FC<KnowledgeHubProps> = ({ initialTopicId, onNavigateTab }) => {
  const { language, t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategoryFilter>(() => {
    if (initialTopicId && ['laws', 'troubleshooting', 'glossary', 'equipment', 'sop', 'site'].includes(initialTopicId)) {
      return initialTopicId as KnowledgeCategoryFilter;
    }
    return 'all';
  });
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(() => {
    if (initialTopicId && !['laws', 'troubleshooting', 'glossary', 'equipment', 'sop', 'site'].includes(initialTopicId)) {
      return initialTopicId;
    }
    return null;
  });
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [anatomyImgLoaded, setAnatomyImgLoaded] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize category and selectedTopicId when URL hash / initialTopicId updates
  useEffect(() => {
    if (!initialTopicId) {
      setSelectedTopicId(null);
      return;
    }
    if (['laws', 'troubleshooting', 'glossary', 'equipment', 'sop', 'site'].includes(initialTopicId)) {
      setSelectedCategory(initialTopicId as KnowledgeCategoryFilter);
      setSelectedTopicId(null);
    } else {
      setSelectedTopicId(initialTopicId);
    }
  }, [initialTopicId]);

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

  // Specific Dual-Taxonomy Badge Resolver per SOP Topic (คู่มือใช้งาน vs คู่มือทำงาน)
  const getTopicDomainBadge = (topicId: string): { label: string; className: string } => {
    switch (topicId) {
      case 'level-instrument-manual':
      case 'theodolite-station-setup':
      case 'gnss-instrument-manual':
      case 'uav-instrument-manual':
      case 'lidar-slam-instrument-manual':
        return { label: 'คู่มือใช้งาน', className: 'badge badge-manual-usage' };
      case 'differential-leveling-survey':
      case 'closed-loop-traverse':
      case 'link-open-traverse':
      case 'gnss-rtk-static-survey':
      case 'uav-drone-photogrammetry':
      case 'terrestrial-lidar-slam':
      case 'hydrographic-bathymetric-survey':
      case 'tbm-tunnel-guidance-survey':
      default:
        return { label: 'คู่มือทำงาน', className: 'badge badge-manual-work' };
    }
  };

  // Dynamic Topic Tags
  const getTopicTags = (topicId: string): string[] => {
    switch (topicId) {
      case 'differential-leveling-survey':
        return ['Three-Wire Leveling', 'Two-Peg Test', 'Stadia D=100s', 'FGCC Standards'];
      case 'level-instrument-manual':
        return ['Automatic Level', 'Digital Level', 'Compensator', 'E-Scale Staff', 'Parallax'];
      case 'theodolite-station-setup':
        return ['Digital Theodolite', 'Total Station', 'Robotic TS', 'Prism Constant', 'FL/FR Two-Face'];
      case 'closed-loop-traverse':
        return ['Closed Polygon', 'Angular Misclosure', 'Bowditch Rule', 'UTM Grid'];
      case 'link-open-traverse':
        return ['Link Traverse', 'Benchmark Tie-in', 'Azimuth Closure', 'Alignment Control'];
      case 'gnss-instrument-manual':
        return ['GNSS Receiver', 'RTK Base/Rover', 'NTRIP CORS', 'IMU Tilt 60°', 'Multipath Check'];
      case 'gnss-rtk-static-survey':
        return ['Static Geodesy', 'RTK CORS VRS', 'RINEX Logging', 'TGM2017 Geoid', 'Baseline QA'];
      case 'uav-instrument-manual':
        return ['UAV Drone RTK', 'Mechanical Shutter', 'Airborne LiDAR', 'IMU Calibration', 'GSD Sensor'];
      case 'uav-drone-photogrammetry':
        return ['UAV Photogrammetry', 'GSD Calculation', 'GCP / Check Points', 'SfM Aerotriangulation'];
      case 'lidar-slam-instrument-manual':
        return ['3D Laser Scanner TLS', 'Mobile SLAM', 'Target Spheres', 'Point Cloud Density', 'HDR Panorama'];
      case 'terrestrial-lidar-slam':
        return ['TLS Point Cloud', 'Target-based Registration', 'Cloud-to-Cloud ICP', 'ASPRS Accuracy'];
      case 'hydrographic-bathymetric-survey':
        return ['Single-Beam Sonar', 'Tide Gauge MSL', 'Bar Check Calib', 'Sound Velocity Profiler'];
      case 'tbm-tunnel-guidance-survey':
        return ['TBM Laser Guidance', 'Laser Target Unit LTU', 'Underground Traverse', 'Breakthrough QA'];
      default:
        return ['Survey Standard', 'Field Guide'];
    }
  };

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

  // Master Unified Cards Collection (EQ, SOP, LAW, SITE, TRBL)
  const allCards: UnifiedKnowledgeCard[] = useMemo(() => {
    const cards: UnifiedKnowledgeCard[] = [];

    // 1. Equipment Manuals (EQ-01 to EQ-05)
    KNOWLEDGE_TOPICS.slice(0, 5).forEach((t, i) => {
      const code = t.code || `EQ-0${i + 1}`;
      cards.push({
        id: t.id,
        code,
        title: t.title,
        titleEn: t.titleEn || '',
        category: 'equipment',
        categoryLabel: 'เครื่องมือสำรวจ',
        badge: { label: 'คู่มือใช้งาน', className: 'badge badge-manual-usage' },
        codeBadgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
        summary: t.summary,
        icon: getTopicIcon(t.iconName, 'w-4 h-4 text-cyan-600 dark:text-cyan-400'),
        tags: getTopicTags(t.id).slice(0, 3),
        workflowTarget: getWorkflowTarget(t),
        kind: 'topic',
        topicData: t,
        telemetryCount: `${t.fieldProcedures.length} ขั้นตอน`
      });
    });

    // 2. Field SOPs (SOP-01 to SOP-08)
    KNOWLEDGE_TOPICS.slice(5, 13).forEach((t, i) => {
      const code = t.code || `SOP-0${i + 1}`;
      cards.push({
        id: t.id,
        code,
        title: t.title,
        titleEn: t.titleEn || '',
        category: 'sop',
        categoryLabel: 'วิธีปฏิบัติงานสนาม',
        badge: { label: 'คู่มือทำงาน', className: 'badge badge-manual-work' },
        codeBadgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        summary: t.summary,
        icon: getTopicIcon(t.iconName, 'w-4 h-4 text-emerald-600 dark:text-emerald-400'),
        tags: getTopicTags(t.id).slice(0, 3),
        workflowTarget: getWorkflowTarget(t),
        kind: 'topic',
        topicData: t,
        telemetryCount: `${t.fieldProcedures.length} ขั้นตอน`
      });
    });

    // 3. Building & Land Laws (LAW-01 to LAW-08)
    BUILDING_LAW_ITEMS.forEach((law, i) => {
      const code = `LAW-0${i + 1}`;
      cards.push({
        id: law.id,
        code,
        title: law.title,
        titleEn: law.legalClause,
        category: 'laws',
        categoryLabel: law.categoryLabel,
        badge: { label: 'ข้อกำหนดกฎหมาย', className: 'badge bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30' },
        codeBadgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
        summary: `${law.condition} — ${law.requirement}`,
        icon: <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
        tags: ['ระยะร่นอาคาร', 'พ.ร.บ. ควบคุมอาคาร', law.categoryLabel],
        kind: 'law',
        lawData: law,
        telemetryCount: '1 ข้อกำหนด'
      });
    });

    // 4. Site Engineering Practices (SITE-01 to SITE-04)
    SITE_ENGINEERING_ITEMS.forEach((site) => {
      cards.push({
        id: site.id,
        code: site.code,
        title: site.title,
        titleEn: site.titleEn,
        category: 'site',
        categoryLabel: site.categoryLabel,
        badge: { label: 'มาตรฐานงานไซต์', className: 'badge bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30' },
        codeBadgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        summary: site.summary,
        icon: <HardHat className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        tags: ['งานไซต์โยธา', site.categoryLabel, 'มาตรฐาน วสท.'],
        workflowTarget: site.recommendedToolTab ? { hash: `#/calculator/${site.recommendedToolTab}`, label: site.toolActionLabel || 'เปิดเครื่องมือ' } : null,
        kind: 'site',
        siteData: site,
        telemetryCount: `${site.principles.length} หลักการ`
      });
    });

    // 5. Field Troubleshooting (TRBL-01 to TRBL-04)
    FIELD_TROUBLESHOOTING_ITEMS.forEach((trbl, i) => {
      const code = `TRBL-0${i + 1}`;
      cards.push({
        id: trbl.id,
        code,
        title: trbl.title,
        titleEn: trbl.categoryLabel,
        category: 'troubleshooting',
        categoryLabel: trbl.categoryLabel,
        badge: { label: 'กู้วิกฤตสนาม', className: 'badge bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30' },
        codeBadgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
        summary: trbl.symptom,
        icon: <Wrench className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
        tags: ['แก้ปัญหาเฉพาะหน้า', trbl.categoryLabel, 'Field Recovery'],
        kind: 'troubleshooting',
        troubleData: trbl,
        telemetryCount: `${trbl.actionSteps.length} ขั้นตอนแก้ไข`
      });
    });

    return cards;
  }, []);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    let list = allCards;
    if (selectedCategory !== 'all' && selectedCategory !== 'glossary') {
      list = list.filter(c => c.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        c.title.toLowerCase().includes(q) ||
        c.titleEn.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allCards, selectedCategory, searchQuery]);

  const activeCard = useMemo(() => {
    return allCards.find(c => c.id === selectedTopicId) || null;
  }, [allCards, selectedTopicId]);

  const activeTopic = useMemo(() => {
    return KNOWLEDGE_TOPICS.find((t) => t.id === selectedTopicId) || null;
  }, [selectedTopicId]);

  const deviceSteps: DeviceScreenStep[] = activeTopic?.deviceWorkflow || [];
  const currentStep: DeviceScreenStep | undefined = deviceSteps[activeStepIndex] || deviceSteps[0];

  const handleSelectCard = (card: UnifiedKnowledgeCard) => {
    setSelectedTopicId(card.id);
    setActiveStepIndex(0);
    setAnatomyImgLoaded(false);
    window.location.hash = `#/knowledge/${card.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSearch = () => {
    setSelectedTopicId(null);
    window.location.hash = selectedCategory === 'all' ? '#/knowledge' : `#/knowledge/${selectedCategory}`;
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

  const categoryFilters: { id: KnowledgeCategoryFilter; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'all', label: t.knowledge.categoryAll, count: allCards.length, icon: <Layers className="w-4 h-4" /> },
    { id: 'equipment', label: t.knowledge.categoryEquipment, count: allCards.filter(c => c.category === 'equipment').length, icon: <Ruler className="w-4 h-4" /> },
    { id: 'sop', label: t.knowledge.categorySop, count: allCards.filter(c => c.category === 'sop').length, icon: <Compass className="w-4 h-4" /> },
    { id: 'laws', label: t.knowledge.categoryLaws, count: allCards.filter(c => c.category === 'laws').length, icon: <Scale className="w-4 h-4" /> },
    { id: 'site', label: t.knowledge.categorySite, count: allCards.filter(c => c.category === 'site').length, icon: <HardHat className="w-4 h-4" /> },
    { id: 'troubleshooting', label: t.knowledge.categoryTroubleshooting, count: allCards.filter(c => c.category === 'troubleshooting').length, icon: <Wrench className="w-4 h-4" /> },
    { id: 'glossary', label: t.knowledge.categoryGlossary, count: 262, icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8 pb-16">

      {/* ================================================================= */}
      {/* 1. UNIFIED KNOWLEDGE OVERVIEW (Hero + Search + Filters + Cards)    */}
      {/* ================================================================= */}
      {!activeCard && (
        <div className="space-y-6">

          {/* ── Hero Section (Unified Banner) ── */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-1)] tracking-tight">
              {t.knowledge.heroTitle}
            </h1>
            <p className="text-[var(--text-2)] text-xs sm:text-sm max-w-3xl leading-relaxed">
              {t.knowledge.heroSubtitle}
            </p>
          </div>

          {/* ── Category Filter Pills Bar ── */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            {categoryFilters.map((tab) => {
              const isSelected = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    if (tab.id === 'all') {
                      window.location.hash = '#/knowledge';
                    } else {
                      window.location.hash = `#/knowledge/${tab.id}`;
                    }
                  }}
                  className={`min-h-[40px] flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent)] text-black dark:text-white shadow-sm'
                      : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface)]'
                  }`}
                >
                  <span className={isSelected ? 'text-current' : 'text-[var(--text-3)]'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-black/15 dark:bg-white/20 text-current' : 'bg-[var(--surface)] text-[var(--text-3)] border border-[var(--border)]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── IN-PLACE GLOSSARY VIEW ── */}
          {selectedCategory === 'glossary' ? (
            <GlossaryView />
          ) : (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="fusion-card p-3 sm:p-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)] pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="ค้นหาคู่มือและมาตรฐานวิศวกรรม"
                    placeholder={t.knowledge.searchPlaceholder}
                    className="w-full min-h-[44px] pl-10 pr-24 sm:pr-36 py-2.5 rounded-[var(--btn-radius)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-1)] placeholder-[var(--text-3)] text-xs sm:text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="min-h-[32px] px-2 py-1 rounded text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text-1)] bg-[var(--surface)] border border-[var(--border)] transition-colors shrink-0"
                      >
                        {t.common.reset}
                      </button>
                    )}
                    <span className="hidden xs:inline-block px-1.5 sm:px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[10px] sm:text-[11px] font-mono tabular-nums text-[var(--text-2)] shrink-0">
                      {filteredCards.length} {language === 'en' ? 'items' : language === 'zh' ? '条' : 'รายการ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3-Column Knowledge Card Grid */}
              {filteredCards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => handleSelectCard(card)}
                      className="fusion-card group p-5 flex flex-col justify-between h-full cursor-pointer hover:border-[var(--accent)] transition-all"
                    >
                      <div className="flex flex-col flex-grow">
                        {/* Top Metadata Row: Code + Domain Badge */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`font-mono text-xs px-2.5 py-1 rounded font-bold border ${card.codeBadgeClass}`}>
                            {card.code}
                          </span>
                          <span className={card.badge.className}>{card.badge.label}</span>
                        </div>

                        {/* Title & Monospace Subtitle */}
                        <h2 className="text-[16px] sm:text-[17px] font-bold text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors mb-1 leading-snug break-words">
                          {getLocalizedTitle(card.id, card.title, card.titleEn, language)}
                        </h2>
                        {(card.titleEn || language === 'en') && (
                          <p className="font-mono text-[11px] text-[var(--accent)] mb-3 break-words line-clamp-1">
                            {language === 'en' ? cleanParenthesizedTitle(card.title) : card.titleEn}
                          </p>
                        )}

                        {/* Summary */}
                        <p className="text-[13px] text-[var(--text-2)] mb-4 leading-relaxed line-clamp-3 flex-grow break-words">
                          {card.summary}
                        </p>

                        {/* Compact Technical Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {card.tags.map((tag, idx) => (
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
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-3)] shrink-0">
                          {card.icon}
                          <span>{card.telemetryCount}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-[var(--text-1)] group-hover:text-[var(--accent)] inline-flex items-center gap-1 transition-colors">
                            <span>Inspect Spec</span>
                            <span className="text-base leading-none">→</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="fusion-card p-12 text-center space-y-4">
                  <Search className="w-10 h-10 mx-auto text-[var(--text-3)] stroke-1" />
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-1)]">
                      ไม่พบคู่มือที่ตรงกับคำค้นหา "{searchQuery}"
                    </h3>
                    <p className="text-xs text-[var(--text-2)] mt-1 max-w-sm mx-auto">
                      ลองค้นหาด้วยคำสำคัญ เช่น "Two-Peg", "Bowditch", "ระยะร่น", "Strap Beam", "RTK" หรือเลือกหมวดหมู่ใหม่
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    className="btn-outline min-h-[44px] text-xs"
                  >
                    แสดงทั้งหมด
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
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
                {activeTopic.code && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--accent)] font-bold border border-[var(--border)] shrink-0">
                    {activeTopic.code}
                  </span>
                )}
                <span className="truncate text-[var(--text-1)] font-bold">{activeTopic.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeTopic.deviceWorkflow && activeTopic.deviceWorkflow.length > 0 && (
                <button
                  type="button"
                  onClick={() => scrollToSection('sec-device-guide')}
                  className="lg:hidden btn-outline min-h-[44px] inline-flex items-center gap-1.5 text-xs"
                  title="เลื่อนไปดูขั้นตอนควบคุมอุปกรณ์"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>ขั้นตอนอุปกรณ์</span>
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
                    {activeTopic.code && (
                      <span className="font-mono text-xs bg-[var(--surface-2)] px-2.5 py-1 rounded text-[var(--accent)] border border-[var(--border)] font-bold">
                        {activeTopic.code}
                      </span>
                    )}
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
                      {getLocalizedTitle(activeTopic.id, activeTopic.title, activeTopic.titleEn, language)}
                    </h1>
                    <p className="text-xs sm:text-sm font-mono text-[var(--accent)] mt-1">
                      {language === 'en' ? cleanParenthesizedTitle(activeTopic.title) : activeTopic.titleEn}
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

                {/* SECTION 0A: INSTRUMENT VARIANTS & FIELD USE CASES (ประเภทเครื่องมือและรูปแบบงานที่นำไปใช้) */}
                {activeTopic.instrumentVariants && activeTopic.instrumentVariants.length > 0 && (
                  <div id="sec-variants" className="space-y-4 scroll-mt-24">
                    <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2 border-l-2 border-[var(--accent)] pl-3">
                      <Layers className="w-4 h-4 text-[var(--accent)]" />
                      <span>ประเภทเครื่องมือและรูปแบบงานที่นำไปใช้ (Instrument Variants & Field Applications)</span>
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                      {activeTopic.instrumentVariants.map((variant, vIdx) => (
                        <div
                          key={vIdx}
                          className="p-4 sm:p-5 rounded-[var(--btn-radius)] bg-[var(--surface-2)] border border-[var(--border)] space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border)] pb-2.5">
                            <div>
                              <h3 className="text-sm sm:text-[15px] font-bold text-[var(--text-1)]">
                                {variant.name}
                              </h3>
                              <p className="text-[11px] font-mono text-[var(--accent)] mt-0.5">
                                🔧 ชุดอุปกรณ์: {variant.equipmentCombo}
                              </p>
                            </div>
                            <span className="badge badge-leveling shrink-0">
                              รูปแบบที่ {vIdx + 1}
                            </span>
                          </div>
                          <div className="space-y-1.5 pt-1">
                            <div className="text-xs font-bold text-[var(--text-1)]">
                              📋 รูปแบบงานที่นำไปใช้ (Field Use Cases):
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                              {variant.useCases.map((job, jIdx) => (
                                <div
                                  key={jIdx}
                                  className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)] flex items-start gap-2.5 text-xs text-[var(--text-1)] leading-relaxed"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
                                  <span>{job}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 0: INSTRUMENT ANATOMY & IMAGE SLOT (คู่มือใช้งานอุปกรณ์) */}
                {activeTopic.instrumentAnatomy && (
                  <div id="sec-anatomy" className="space-y-4 scroll-mt-24">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2 border-l-2 border-[var(--accent)] pl-3">
                        <Compass className="w-4 h-4 text-[var(--accent)]" />
                        <span>โครงสร้างและส่วนประกอบตัวเครื่อง (Instrument Anatomy & Visual Reference)</span>
                      </h2>
                      <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)]">
                        {activeTopic.instrumentAnatomy.modelExamples}
                      </span>
                    </div>

                    {/* Visual Reference Frame (Displays custom image if placed in public/images/instruments/, else Technical Schematic SVG) */}
                    <div className="rounded-[var(--btn-radius)] bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden">
                      {activeTopic.instrumentAnatomy.imagePath && (
                        <img
                          src={activeTopic.instrumentAnatomy.imagePath}
                          alt={activeTopic.instrumentAnatomy.imageCaption}
                          onLoad={() => setAnatomyImgLoaded(true)}
                          onError={() => setAnatomyImgLoaded(false)}
                          className={`w-full max-h-[380px] object-contain bg-[var(--surface)] border-b border-[var(--border)] p-4 ${
                            anatomyImgLoaded ? 'block' : 'hidden'
                          }`}
                        />
                      )}

                      {!anatomyImgLoaded && (
                        <div className="p-5 sm:p-6 bg-[var(--surface)] border-b border-[var(--border)] flex flex-col items-center justify-center text-center space-y-3">
                          {/* Clean Technical Blueprint SVG of Survey Instrument with Callout Numbers 1-9 */}
                          <svg
                            viewBox="0 0 600 220"
                            className="w-full max-w-[540px] h-auto text-[var(--text-1)]"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            {/* Horizontal Collimation Line of Sight */}
                            <line x1="20" y1="88" x2="580" y2="88" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="6 4" />
                            <text x="26" y="78" fill="var(--accent)" fontSize="10" fontFamily="monospace" fontWeight="bold">
                              LINE OF SIGHT (HI)
                            </text>

                            {/* Tripod Head & Base Plate */}
                            <rect x="200" y="176" width="200" height="14" rx="2" fill="var(--surface-2)" stroke="currentColor" strokeWidth="1.75" />
                            {/* 3 Foot Leveling Screws (8) */}
                            <rect x="225" y="148" width="18" height="28" rx="2" fill="var(--surface-2)" stroke="currentColor" strokeWidth="1.5" />
                            <rect x="291" y="148" width="18" height="28" rx="2" fill="var(--surface-2)" stroke="currentColor" strokeWidth="1.5" />
                            <rect x="357" y="148" width="18" height="28" rx="2" fill="var(--surface-2)" stroke="currentColor" strokeWidth="1.5" />

                            {/* Horizontal Circle Ring (7) */}
                            <rect x="212" y="132" width="176" height="16" rx="2" fill="var(--surface-2)" stroke="currentColor" strokeWidth="1.75" />

                            {/* Main Telescope Body */}
                            <rect x="175" y="56" width="245" height="66" rx="6" fill="var(--surface-2)" stroke="currentColor" strokeWidth="2" />

                            {/* Objective Lens Hood (1) */}
                            <rect x="420" y="62" width="32" height="54" rx="3" fill="var(--surface-3)" stroke="currentColor" strokeWidth="2" />

                            {/* Eyepiece Ring (4) */}
                            <rect x="142" y="68" width="33" height="42" rx="3" fill="var(--surface-3)" stroke="currentColor" strokeWidth="2" />

                            {/* Optical Peep Sight (2) */}
                            <polygon points="275,56 325,56 318,42 282,42" fill="var(--surface-3)" stroke="currentColor" strokeWidth="1.5" />

                            {/* Focusing Knob (3) */}
                            <circle cx="345" cy="90" r="18" fill="var(--surface)" stroke="currentColor" strokeWidth="2" />
                            <circle cx="345" cy="90" r="10" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="1.5" />

                            {/* Circular Bubble & Mirror (5) */}
                            <rect x="215" y="40" width="32" height="16" rx="2" fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="218" y1="40" x2="242" y2="22" stroke="var(--accent)" strokeWidth="2" />

                            {/* Horizontal Tangent Knob (6) */}
                            <circle cx="255" cy="122" r="11" fill="var(--surface)" stroke="currentColor" strokeWidth="1.75" />

                            {/* Compensator Check Button (9) */}
                            <rect x="186" y="106" width="16" height="10" rx="2" fill="var(--accent)" />

                            {/* Numbered Callout Badges (1 to 9) */}
                            {[
                              { n: 1, x: 468, y: 89 },
                              { n: 2, x: 300, y: 26 },
                              { n: 3, x: 345, y: 90 },
                              { n: 4, x: 120, y: 89 },
                              { n: 5, x: 205, y: 26 },
                              { n: 6, x: 255, y: 122 },
                              { n: 7, x: 408, y: 140 },
                              { n: 8, x: 198, y: 162 },
                              { n: 9, x: 168, y: 124 },
                            ].map((pin) => (
                              <g key={pin.n}>
                                <circle cx={pin.x} cy={pin.y} r="10" fill="var(--accent)" />
                                <text
                                  x={pin.x}
                                  y={pin.y + 3.5}
                                  textAnchor="middle"
                                  fill="var(--accent-text)"
                                  fontSize="10"
                                  fontFamily="monospace"
                                  fontWeight="bold"
                                >
                                  {pin.n}
                                </text>
                              </g>
                            ))}
                          </svg>

                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-2)]">
                            <span>📌 รองรับรูปภาพจริง: นำไฟล์ภาพอุปกรณ์มาวางได้ที่</span>
                            <code className="text-[var(--accent)] font-bold">public{activeTopic.instrumentAnatomy.imagePath}</code>
                          </div>
                        </div>
                      )}

                      {/* Parts Grid (1-9) */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="text-xs font-bold text-[var(--text-1)]">
                          รายละเอียดส่วนประกอบสำคัญบนตัวกล้อง ({activeTopic.instrumentAnatomy.parts.length} จุดหลัก):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {activeTopic.instrumentAnatomy.parts.map((part) => (
                            <div
                              key={part.number}
                              className="p-3 rounded-[var(--btn-radius)] bg-[var(--surface)] border border-[var(--border)] flex items-start gap-3"
                            >
                              <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-[var(--accent-text)] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {part.number}
                              </span>
                              <div className="space-y-0.5 min-w-0">
                                <div className="text-xs font-bold text-[var(--text-1)] leading-snug">
                                  {part.name}
                                </div>
                                <div className="text-[10px] font-mono text-[var(--accent)]">
                                  {part.nameEn}
                                </div>
                                <p className="text-[11px] sm:text-xs text-[var(--text-2)] leading-relaxed pt-0.5">
                                  {part.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                            <span>{cleanParenthesizedTitle(proc.title)}</span>
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

              </div>
            </div>

            {/* Right Column: Sticky Instrument Step Guide & Quick Section Navigator (4 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-20">

              {/* Interactive Instrument Interface & Step Guide */}
              {deviceSteps.length > 0 && currentStep && (
                <div id="sec-device-guide" className="fusion-card overflow-hidden scroll-mt-24">
                  {/* Instrument Guide Header */}
                  <div className="px-4 py-3 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <SlidersHorizontal className="w-4 h-4 text-[var(--accent)] shrink-0" />
                      <span className="text-xs font-mono font-bold tracking-wider text-[var(--text-1)] truncate">
                        {currentStep.targetHardware}
                      </span>
                    </div>
                    <span className="badge badge-leveling tabular-nums shrink-0">
                      ขั้นตอน {currentStep.stepNumber}/{deviceSteps.length}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Modern Clean Parameter Display Card */}
                    <div className="rounded-[var(--btn-radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-2.5">
                      <div className="text-xs font-bold text-[var(--text-1)] border-b border-[var(--border)] pb-2 flex items-center justify-between gap-2">
                        <span className="truncate flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                          {currentStep.screenTitle}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)] shrink-0">
                          {currentStep.stageName}
                        </span>
                      </div>

                      {/* Clean Structured Data Lines */}
                      <div className="space-y-1.5 py-1 text-xs">
                        {currentStep.screenLines
                          .filter(line => !line.includes('┌') && !line.includes('└') && !line.includes('─'))
                          .map((line, lIdx) => {
                            const cleanLine = line.replace(/^│\s*/, '').replace(/\s*│$/, '').trim();
                            if (!cleanLine) return null;
                            return (
                              <div key={lIdx} className="px-3 py-1.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono text-[11px] sm:text-xs text-[var(--text-1)] flex items-center justify-between break-words">
                                <span>{cleanLine}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Stepper Controls (Field Touch Target Compliant >= 44px) */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeStepIndex === 0}
                        className="btn-outline min-h-[44px] inline-flex items-center gap-1 text-xs disabled:opacity-30 cursor-pointer"
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
                            className={`h-2.5 rounded-full transition-all cursor-pointer ${
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
                        className="btn-outline min-h-[44px] inline-flex items-center gap-1 text-xs disabled:opacity-30 cursor-pointer"
                      >
                        <span>ถัดไป</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Keypress & QA Explanation */}
                    <div className="rounded-[var(--btn-radius)] bg-[var(--surface)] border border-[var(--border)] p-3.5 space-y-2.5">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-[var(--text-1)] shrink-0 mt-0.5">คำสั่ง/ปุ่มกด:</span>
                        <code className="px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--accent)] font-mono text-[11px] font-semibold break-words">
                          {currentStep.buttonKey}
                        </code>
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
                  {activeTopic.instrumentVariants && activeTopic.instrumentVariants.length > 0 && (
                    <button type="button" onClick={() => scrollToSection('sec-variants')} className="w-full min-h-[40px] text-left px-3 py-2 rounded text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between font-semibold">
                      <span>0A. ประเภทเครื่องมือและรูปแบบงาน</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--accent)]" />
                    </button>
                  )}
                  {activeTopic.instrumentAnatomy && (
                    <button type="button" onClick={() => scrollToSection('sec-anatomy')} className="w-full min-h-[40px] text-left px-3 py-2 rounded text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between font-semibold">
                      <span>0B. โครงสร้างและส่วนประกอบตัวเครื่อง</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--accent)]" />
                    </button>
                  )}
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
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. LAW DETAIL READER (Dedicated Viewer for LAW-01 to LAW-08)      */}
      {/* ================================================================= */}
      {activeCard?.kind === 'law' && activeCard.lawData && (
        <div className="space-y-6">
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
              <div className="hidden sm:flex items-center gap-2 text-xs truncate">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/30 shrink-0">
                  {activeCard.code}
                </span>
                <span className="truncate text-[var(--text-1)] font-bold">{activeCard.title}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const t = `${activeCard.title}\n${activeCard.lawData?.legalClause}\n\nเงื่อนไข: ${activeCard.lawData?.condition}\nข้อกำหนด: ${activeCard.lawData?.requirement}\nบทลงโทษ/ความเสี่ยง: ${activeCard.lawData?.penaltyOrRisk}\nคำแนะนำสำหรับช่างสำรวจ: ${activeCard.lawData?.fieldTips}`;
                navigator.clipboard.writeText(t);
                setCopiedText(true);
                setTimeout(() => setCopiedText(false), 2000);
              }}
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
                  <span>คัดลอกข้อกฎหมาย</span>
                </>
              )}
            </button>
          </div>

          <div className="fusion-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold">
                {activeCard.code}
              </span>
              <span className="badge bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                {activeCard.categoryLabel}
              </span>
              <span className="font-mono text-[11px] text-[var(--text-3)]">
                {activeCard.lawData.legalClause}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-1)]">
                {activeCard.title}
              </h1>
              <p className="text-xs font-mono text-purple-600 dark:text-purple-400">
                {activeCard.lawData.legalClause}
              </p>
            </div>

            {/* Condition & Requirement Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider">
                  เงื่อนไขและประเภทอาคาร (Condition)
                </div>
                <p className="text-sm font-medium text-[var(--text-1)] leading-relaxed">
                  {activeCard.lawData.condition}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  ข้อกำหนดระยะร่นขั้นต่ำ (Requirement)
                </div>
                <p className="text-sm font-bold text-[var(--text-1)] leading-relaxed">
                  {activeCard.lawData.requirement}
                </p>
              </div>
            </div>

            {/* Penalty & Field Tips */}
            <div className="space-y-4 pt-4">
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>ผลกระทบและบทลงโทษหากไม่ปฏิบัติตาม (Penalty & Risk)</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                  {activeCard.lawData.penaltyOrRisk}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>คำแนะนำและข้อควรระวังสำหรับช่างสำรวจ (Field Surveyor Tips)</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                  {activeCard.lawData.fieldTips}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 4. SITE ENGINEERING READER (Dedicated Viewer for SITE-01 to 04)   */}
      {/* ================================================================= */}
      {activeCard?.kind === 'site' && activeCard.siteData && (
        <div className="space-y-6">
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
              <div className="hidden sm:flex items-center gap-2 text-xs truncate">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30 shrink-0">
                  {activeCard.code}
                </span>
                <span className="truncate text-[var(--text-1)] font-bold">{activeCard.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeCard.workflowTarget && (
                <a
                  href={activeCard.workflowTarget.hash}
                  className="btn-accent min-h-[44px] inline-flex items-center gap-1.5 text-xs"
                >
                  <span>{activeCard.workflowTarget.label}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  const t = `${activeCard.title}\n${activeCard.titleEn}\n\n${activeCard.summary}\n\nหลักการสำคัญ:\n` +
                    activeCard.siteData?.principles.map((p, i) => `${i + 1}. ${p}`).join('\n') +
                    '\n\nเช็กลิสต์หน้างาน:\n' +
                    activeCard.siteData?.fieldChecklist.map((c) => `[ ] ${c}`).join('\n');
                  navigator.clipboard.writeText(t);
                  setCopiedText(true);
                  setTimeout(() => setCopiedText(false), 2000);
                }}
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
                    <span>คัดลอกมาตรฐาน</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="fusion-card p-6 sm:p-8 space-y-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold">
                {activeCard.code}
              </span>
              <span className="badge bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                {activeCard.categoryLabel}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-1)]">
                {activeCard.title}
              </h1>
              <p className="text-xs font-mono text-[var(--accent)]">
                {activeCard.titleEn}
              </p>
              <p className="text-sm text-[var(--text-2)] leading-relaxed pt-2">
                {activeCard.summary}
              </p>
            </div>

            {/* Principles */}
            <div className="space-y-4 pt-4 border-t border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--text-1)] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>หลักการวิศวกรรมและข้อกำหนดมาตรฐาน (Engineering Principles)</span>
              </h3>
              <div className="space-y-2.5">
                {activeCard.siteData.principles.map((pr, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-[var(--text-1)] leading-relaxed">
                      {pr}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Formulas if any */}
            {activeCard.siteData.keyFormulas && activeCard.siteData.keyFormulas.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text-1)] uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[var(--accent)]" />
                  <span>สมการและสูตรคำนวณมาตรฐาน (Governing Formulas)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeCard.siteData.keyFormulas.map((f, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                      <div className="text-xs font-bold text-[var(--text-1)]">{f.label}</div>
                      <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-mono text-xs sm:text-sm text-[var(--accent)] text-center overflow-x-auto">
                        {f.formula}
                      </div>
                      <p className="text-[11px] text-[var(--text-2)]">{f.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Field Checklist */}
            <div className="space-y-4 pt-4 border-t border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--text-1)] uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>เช็กลิสต์การตรวจคุมงานหน้างาน (Field Inspection Checklist)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCard.siteData.fieldChecklist.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                      ✓
                    </span>
                    <span className="text-xs sm:text-sm text-[var(--text-2)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 5. TROUBLESHOOTING READER (Dedicated Viewer for TRBL-01 to 04)     */}
      {/* ================================================================= */}
      {activeCard?.kind === 'troubleshooting' && activeCard.troubleData && (
        <div className="space-y-6">
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
              <div className="hidden sm:flex items-center gap-2 text-xs truncate">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/30 shrink-0">
                  {activeCard.code}
                </span>
                <span className="truncate text-[var(--text-1)] font-bold">{activeCard.title}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const t = `${activeCard.title}\n${activeCard.categoryLabel}\n\nอาการ: ${activeCard.troubleData?.symptom}\n\nสาเหตุแท้จริง:\n` +
                  activeCard.troubleData?.rootCauses.map((r, i) => `${i + 1}. ${r}`).join('\n') +
                  '\n\nวิธีแก้ปัญหา:\n' +
                  activeCard.troubleData?.actionSteps.map((a, i) => `${i + 1}. ${a}`).join('\n') +
                  `\n\nการป้องกัน: ${activeCard.troubleData?.prevention}`;
                navigator.clipboard.writeText(t);
                setCopiedText(true);
                setTimeout(() => setCopiedText(false), 2000);
              }}
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
                  <span>คัดลอกคู่มือแก้ปัญหา</span>
                </>
              )}
            </button>
          </div>

          <div className="fusion-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-bold">
                {activeCard.code}
              </span>
              <span className="badge bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                {activeCard.categoryLabel}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-1)]">
                {activeCard.title}
              </h1>
            </div>

            {/* Symptom Box */}
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>อาการที่ตรวจพบหน้างาน (Field Symptom)</span>
              </div>
              <p className="text-sm font-semibold text-[var(--text-1)] leading-relaxed">
                {activeCard.troubleData.symptom}
              </p>
            </div>

            {/* Root Causes & Diagnostics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border)]">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider">
                  สาเหตุแท้จริง (Root Causes)
                </h3>
                <ul className="space-y-2">
                  {activeCard.troubleData.rootCauses.map((rc, idx) => (
                    <li key={idx} className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text-2)] leading-relaxed flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{rc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider">
                  ขั้นตอนตรวจเช็ควิเคราะห์ (Field Diagnostics)
                </h3>
                <ul className="space-y-2">
                  {activeCard.troubleData.fieldDiagnostics.map((fd, idx) => (
                    <li key={idx} className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text-2)] leading-relaxed flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{fd}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Step-by-Step Action Plan */}
            <div className="space-y-3 pt-4 border-t border-[var(--border)]">
              <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>ขั้นตอนการแก้ไขปัญหาเฉพาะหน้า (Immediate Action Steps)</span>
              </h3>
              <div className="space-y-2.5">
                {activeCard.troubleData.actionSteps.map((step, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-[var(--text-1)] leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prevention */}
            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5">
              <div className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider">
                แนวทางการป้องกันปัญหาในอนาคต (Prevention)
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                {activeCard.troubleData.prevention}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
