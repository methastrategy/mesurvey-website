import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  ArrowRightLeft, 
  Compass, 
  Ruler, 
  Layers, 
  Calculator,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { CoordinateConverter } from './CoordinateConverter';
import { TraverseCalculator } from './TraverseCalculator';
import { LevelingCalculator } from './LevelingCalculator';
import { LandAreaCalculator } from './LandAreaCalculator';
import { ScientificCalculator } from './ScientificCalculator';

interface CalculatorHubProps {
  onPlotOnMap?: (lat: number, lng: number, label: string) => void;
  initialSubTab?: 'scientific' | 'coord' | 'traverse' | 'leveling' | 'area';
}

export type ToolId = 'scientific' | 'traverse' | 'leveling' | 'coord' | 'area';

interface ToolItem {
  id: ToolId;
  name: string;
  nameEn: string;
  shortDesc: string;
  category: 'calc' | 'geodesy' | 'cadastral';
  categoryLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  features: string[];
}

export const CalculatorHub: React.FC<CalculatorHubProps> = ({ onPlotOnMap, initialSubTab }) => {
  // If null, show the GitHub-repo style tool directory list
  const [activeSubTab, setActiveSubTab] = useState<ToolId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'calc' | 'geodesy' | 'cadastral'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync with Hash URL
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const parts = hash.split('/').filter(Boolean);
      if (parts[0] === 'calculator') {
        const sub = parts[1] as ToolId;
        const validSubs: ToolId[] = ['scientific', 'coord', 'traverse', 'leveling', 'area'];
        if (validSubs.includes(sub)) {
          setActiveSubTab(sub);
        } else {
          setActiveSubTab(null);
        }
      }
    };

    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, []);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Keyboard shortcut '/' focuses the search box on directory view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeSubTab) return;
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
  }, [activeSubTab]);

  const selectTool = (toolId: ToolId | null) => {
    setActiveSubTab(toolId);
    if (toolId) {
      window.location.hash = `#/calculator/${toolId}`;
    } else {
      window.location.hash = '#/calculator';
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const tools: ToolItem[] = [
    {
      id: 'scientific',
      name: 'เครื่องคิดเลข',
      nameEn: 'Scientific Calculator',
      shortDesc: 'เครื่องคิดเลขวิทยาศาสตร์และมุมสำรวจ แปลงองศา-ลิปดา-ฟิลิปดา (DMS), ฟังก์ชันตรีโกณมิติ, ลอการิทึม และยกกำลัง',
      category: 'calc',
      categoryLabel: 'คณิตศาสตร์ & สำรวจ',
      icon: Calculator,
      tags: ['casio', 'fx-991', 'trig', 'dms', 'degrees', 'sin', 'cos', 'tan', 'sqrt', 'scientific'],
      features: ['Natural 2-line display', 'แปลงมุม DMS ↔ ทศนิยม', 'ฟังก์ชันตรีโกณมิติครบครัน']
    },
    {
      id: 'leveling',
      name: 'ตารางงานระดับ',
      nameEn: 'Differential Leveling Fieldbook',
      shortDesc: 'บันทึกสมุดระดับภาคสนาม คำนวณแบบแกนกล้อง (HI) และขึ้น-ลง (Rise & Fall) พร้อมตรวจสอบเลขคณิตและเกณฑ์คลาดเคลื่อน RTSD',
      category: 'geodesy',
      categoryLabel: 'งานระดับสนาม',
      icon: Ruler,
      tags: ['leveling', 'hi', 'rise-fall', 'bm', 'foresight', 'backsight', 'rtsd', 'elevation'],
      features: ['HI & Rise/Fall Method', 'ตรวจสอบ Arithmetic Check อัตโนมัติ', 'เกณฑ์ ±4√K ถึง ±24√K mm']
    },
    {
      id: 'traverse',
      name: 'ตารางงานวงรอบ',
      nameEn: 'Bowditch Traverse Adjustment',
      shortDesc: 'ปรับแก้วงรอบภาคสนามวิธีเข็มทิศ (Bowditch) คำนวณความคลาดเคลื่อนทางมุมและระยะ พร้อมเกณฑ์ชั้นงานสำรวจ 1:N',
      category: 'geodesy',
      categoryLabel: 'โครงข่ายวงรอบ',
      icon: Compass,
      tags: ['traverse', 'bowditch', 'closed-loop', 'link', 'azimuth', 'bearing', 'rtsd', 'precision'],
      features: ['ปรับแก้พิกัด Latitude & Departure', 'ตรวจสอบอัตราส่วน 1:N', 'รองรับวงรอบเปิดและปิด']
    },
    {
      id: 'coord',
      name: 'ตารางแปลงพิกัด',
      nameEn: 'Coordinate Transformation',
      shortDesc: 'แปลงค่าพิกัดแผนที่ระหว่าง WGS84 (ละติจูด-ลองจิจูด), UTM Zone 47N/48N และ Indian 1975 ใช้งานร่วมกับแผนที่ WebGIS',
      category: 'geodesy',
      categoryLabel: 'ยี่สิบสี่โซนพิกัด',
      icon: ArrowRightLeft,
      tags: ['wgs84', 'utm', 'indian 1975', 'datum', 'gps', 'epsg:4326', 'zone 47n', 'zone 48n'],
      features: ['Helmert 7-Parameter Datum Shift', 'คำนวณ Grid Convergence & Scale Factor', 'ส่งออกหมุดไปยังแผนที่ WebGIS']
    },
    {
      id: 'area',
      name: 'แปลงหน่วยที่ดิน',
      nameEn: 'Thai Cadastral Land Converter',
      shortDesc: 'คำนวณและแปลงหน่วยพื้นที่ดินไทย (ไร่ - งาน - ตารางวา) เทียบกับตารางเมตร (m²), เฮกตาร์ และเอเคอร์',
      category: 'cadastral',
      categoryLabel: 'รังวัดที่ดิน',
      icon: Layers,
      tags: ['rai', 'ngan', 'tarang wa', 'land', 'cadastral', 'hectare', 'acre', 'sqm'],
      features: ['แยกสัดส่วน ไร่ - งาน - ตร.ว. อัตโนมัติ', 'แปลงสองทิศทางแบบเรียลไทม์', 'มาตรฐานกรมที่ดิน']
    }
  ];

  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      const matchCat = selectedCategory === 'all' || t.category === selectedCategory;
      if (!matchCat) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.nameEn.toLowerCase().includes(q) ||
        t.shortDesc.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    });
  }, [tools, searchQuery, selectedCategory]);

  const activeToolObj = tools.find(t => t.id === activeSubTab);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ACTIVE TOOL VIEW (เมื่อเลือกเปิดเครื่องมือใดเครื่องมือหนึ่ง)
  // ─────────────────────────────────────────────────────────────────────────────
  if (activeSubTab) {
    if (activeSubTab === 'scientific') {
      return <ScientificCalculator onBackToDirectory={() => selectTool(null)} />;
    }

    return (
      <div className="space-y-4">
        {/* Simple Breadcrumb Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => selectTool(null)}
              className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent)] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>เครื่องมือทั้งหมด</span>
            </button>
            <span className="text-[var(--text-3)]">/</span>
            <span className="font-bold text-[var(--text-1)]">
              {activeToolObj?.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => selectTool(null)}
              className="text-xs px-2.5 py-1 rounded-[var(--btn-radius)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] border border-[var(--border)] font-semibold transition-colors micro-press"
            >
              เปลี่ยนเครื่องมือ
            </button>
          </div>
        </div>

        {/* Selected Tool Component */}
        <div>
          {activeSubTab === 'traverse' && <TraverseCalculator />}
          {activeSubTab === 'leveling' && <LevelingCalculator />}
          {activeSubTab === 'coord' && <CoordinateConverter onPlotOnMap={onPlotOnMap} />}
          {activeSubTab === 'area' && <LandAreaCalculator />}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. REPO-DIRECTORY VIEW (หน้าแรก: รายการเครื่องมือเรียบง่าย สไตล์ GitHub Repositories)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-16">
      
      {/* ── Hero Section (Streamlined Banner matching Knowledge Hub) ── */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 font-mono text-xs text-[var(--accent)] uppercase tracking-wider">
          <span>KU GEOMATICS • COMPUTATION & FIELD INSTRUMENTS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-1)] tracking-tight">
          เครื่องมือคำนวณ / Calculator Hub
        </h1>
        <p className="text-[var(--text-2)] text-sm max-w-3xl leading-relaxed">
          เลือกเครื่องมือทางวิศวกรรมสำรวจที่ต้องการใช้งานเพื่อเปิดหน้าต่างทำงานเต็มรูปแบบ รองรับทั้งงานคำนวณคณิตศาสตร์ งานระดับ วงรอบ แปลงพิกัด และที่ดิน
        </p>
      </div>

      {/* ── Controls Near Content: Inline Search + Category Filter Bar (fusion-card matching Knowledge Hub) ── */}
      <div className="fusion-card p-3 sm:p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)] pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="ค้นหาเครื่องมือคำนวณ"
            placeholder="ค้นหาเครื่องมือ (เช่น เครื่องคิดเลข, ระดับ, วงรอบ, พิกัด, ไร่)... [กด /]"
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
              {filteredTools.length} รายการ
            </span>
          </div>
        </div>

        {/* Category Filter Underline Tabs (matching Knowledge Hub) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-[var(--border)]">
          {[
            { id: 'all' as const, label: 'ทั้งหมด', count: tools.length },
            { id: 'calc' as const, label: 'เครื่องคิดเลข', count: tools.filter(t => t.category === 'calc').length },
            { id: 'geodesy' as const, label: 'งานสำรวจ & พิกัด', count: tools.filter(t => t.category === 'geodesy').length },
            { id: 'cadastral' as const, label: 'ที่ดิน', count: tools.filter(t => t.category === 'cadastral').length },
          ].map(cat => {
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
                <span>{cat.label}</span>
                <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)]">
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GitHub Repository Style Tool List Container (fusion-card matching Knowledge Hub) */}
      <div className="fusion-card divide-y divide-[var(--border)] overflow-hidden">
        {filteredTools.length === 0 ? (
          <div className="p-10 text-center text-xs text-[var(--text-3)]">
            ไม่พบเครื่องมือที่ตรงกับคำค้นหา "{searchQuery}"
          </div>
        ) : (
          filteredTools.map(tool => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => selectTool(tool.id)}
                className="group p-4 sm:p-5 hover:bg-[var(--surface-2)] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 select-none"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 transition-colors group-hover:border-[var(--accent)]"
                    style={{
                      backgroundColor: 'var(--surface-2)',
                      borderColor: 'var(--border)'
                    }}
                  >
                    <Icon className="w-5 h-5 text-[var(--accent)]" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-[var(--accent)] group-hover:underline">
                        {tool.name}
                      </span>
                      <span className="text-xs font-mono text-[var(--text-3)]">
                        ({tool.nameEn})
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)]">
                        {tool.categoryLabel}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                      {tool.shortDesc}
                    </p>

                    <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] text-[var(--text-3)] font-mono">
                      {tool.features.map((feat, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          <span>•</span>
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end sm:justify-center shrink-0 pt-1 sm:pt-0">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--surface-2)] group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-text)] text-[var(--text-1)] border border-[var(--border)] transition-colors">
                    <span>เปิดเครื่องมือ</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default CalculatorHub;
