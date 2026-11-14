import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  Compass, 
  Ruler, 
  Layers, 
  Calculator,
  Network,
  ArrowRight,
  ArrowLeft,
  Route,
  Scale,
  Building2,
  Scissors,
  CheckCircle2,
  Sparkles,
  Search,
  Grid
} from 'lucide-react';
import { CoordinateConverter } from './CoordinateConverter';
import { TraverseCalculator } from './TraverseCalculator';
import { LevelingCalculator } from './LevelingCalculator';
import { LandAreaCalculator } from './LandAreaCalculator';
import { ScientificCalculator } from './ScientificCalculator';
import { NetworkAdjustment } from './NetworkAdjustment';
import { CurveCalculator } from './CurveCalculator';
import { RebarCalculator } from './RebarCalculator';
import { StrapBeamCalculator } from './StrapBeamCalculator';
import { RebarCutOptimizer } from './RebarCutOptimizer';
import { useI18n, cleanParenthesizedTitle, TOOL_TITLES_ZH } from '../../core/i18n';

export type ToolId = 
  | 'scientific' 
  | 'traverse' 
  | 'leveling' 
  | 'coord' 
  | 'area' 
  | 'adjustment' 
  | 'curve' 
  | 'rebar'
  | 'strap-beam'
  | 'rebar-optimizer';

export type DomainWorkspace = 'all' | 'geodesy' | 'civil' | 'cadastral' | 'qaqc';

interface CalculatorHubProps {
  onPlotOnMap?: (lat: number, lng: number, label: string) => void;
  initialSubTab?: ToolId;
}

interface ToolItem {
  id: ToolId;
  name: string;
  nameEn: string;
  shortDesc: string;
  domain: 'geodesy' | 'civil' | 'cadastral' | 'qaqc';
  domainLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  features: string[];
}

export const CalculatorHub: React.FC<CalculatorHubProps> = ({ onPlotOnMap, initialSubTab }) => {
  const { language, t } = useI18n();
  const [activeSubTab, setActiveSubTab] = useState<ToolId | null>(null);
  const [activeDomain, setActiveDomain] = useState<DomainWorkspace>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync with Hash URL
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const parts = hash.split('/').filter(Boolean);
      if (parts[0] === 'calculator') {
        const sub = parts[1] as ToolId;
        const validSubs: ToolId[] = [
          'scientific', 'coord', 'traverse', 'leveling', 'area', 
          'adjustment', 'curve', 'rebar', 'strap-beam', 'rebar-optimizer'
        ];
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
    // ── 1. Geodesy & Survey ──
    {
      id: 'traverse',
      name: 'ตารางงานวงรอบ',
      nameEn: 'Bowditch Traverse Adjustment',
      shortDesc: 'ปรับแก้วงรอบภาคสนามวิธีเข็มทิศ (Bowditch) คำนวณความคลาดเคลื่อนทางมุมและระยะ พร้อมเกณฑ์ชั้นงานสำรวจ 1:N',
      domain: 'geodesy',
      domainLabel: 'Geodesy & Survey',
      icon: Compass,
      tags: ['traverse', 'bowditch', 'closed-loop', 'link', 'azimuth', 'bearing', 'rtsd', 'precision'],
      features: ['ปรับแก้พิกัด Latitude & Departure', 'ตรวจสอบอัตราส่วน 1:N', 'รองรับวงรอบเปิดและปิด']
    },
    {
      id: 'leveling',
      name: 'ตารางงานระดับ',
      nameEn: 'Differential Leveling Fieldbook',
      shortDesc: 'บันทึกสมุดระดับภาคสนาม คำนวณแบบแกนกล้อง (HI) และขึ้น-ลง (Rise & Fall) พร้อมตรวจสอบเลขคณิตและเกณฑ์คลาดเคลื่อน RTSD',
      domain: 'geodesy',
      domainLabel: 'Geodesy & Survey',
      icon: Ruler,
      tags: ['leveling', 'hi', 'rise-fall', 'bm', 'foresight', 'backsight', 'rtsd', 'elevation'],
      features: ['HI & Rise/Fall Method', 'ตรวจสอบ Arithmetic Check อัตโนมัติ', 'เกณฑ์ ±4√K ถึง ±24√K mm']
    },
    {
      id: 'coord',
      name: 'ตารางแปลงพิกัด',
      nameEn: 'Coordinate Transformation',
      shortDesc: 'แปลงค่าพิกัดแผนที่ระหว่าง WGS84 (ละติจูด-ลองจิจูด), UTM Zone 47N/48N และ Indian 1975 ใช้งานร่วมกับแผนที่ WebGIS',
      domain: 'geodesy',
      domainLabel: 'Geodesy & Survey',
      icon: ArrowRightLeft,
      tags: ['wgs84', 'utm', 'indian 1975', 'datum', 'gps', 'epsg:4326', 'zone 47n', 'zone 48n'],
      features: ['Helmert 7-Parameter Datum Shift', 'คำนวณ Grid Convergence & Scale Factor', 'ส่งออกหมุดไปยังแผนที่ WebGIS']
    },
    {
      id: 'curve',
      name: 'คำนวณโค้งราบ & วางผัง',
      nameEn: 'Circular Curve & Staking Calculator',
      shortDesc: 'คำนวณองค์ประกอบโค้งราบเดี่ยว R, Δ → T, L, E, M, C และสเตชั่น PC/PT พร้อมตารางเปิดมุมเล็งเบี่ยงเบนสำหรับกล้อง Total Station ส่องปักหมุด',
      domain: 'geodesy',
      domainLabel: 'Geodesy & Survey',
      icon: Route,
      tags: ['curve', 'circular curve', 'staking out', 'deflection angle', 'subchord', 'route survey', 'road', 'civil'],
      features: ['คำนวณองค์ประกอบโค้ง T, L, E, M, C', 'ตาราง Deflection Angle & Chord', 'ส่งออก CSV & Copy สำหรับหน้างาน']
    },

    // ── 2. Civil & Site Operations ──
    {
      id: 'strap-beam',
      name: 'คำนวณฐานรากชิดเขต & คานรั้ง',
      nameEn: 'Strap Beam & Boundary Footing Calculator',
      shortDesc: 'แก้สมดุลฐานรากชิดแนวเขตที่ดินเพื่อนบ้าน คำนวณถ่ายแรงปฏิกิริยา R1, R2 ตรวจสอบการงัดยกตัว (Uplift) โมเมนต์ดัด และพื้นที่เหล็กเสริมคานรั้งตามเกณฑ์ วสท.',
      domain: 'civil',
      domainLabel: 'Civil & Site Operations',
      icon: Building2,
      tags: ['strap beam', 'cantilever footing', 'boundary footing', 'eccentricity', 'wsd', 'sdm', 'reinforcement'],
      features: ['ถ่ายแรงปฏิกิริยา R1, R2', 'ตรวจเช็ค Uplift ฐานรากต้นใน', 'พื้นที่เหล็กเสริมบน As & เหล็กปลอก']
    },
    {
      id: 'rebar-optimizer',
      name: 'แผนผังตัดเหล็กลดเศษ 1D',
      nameEn: '1D Rebar Cut Optimizer',
      shortDesc: 'จัดเรียงรายการตัดเหล็กข้ออ้อยและเหล็กกลมลงในท่อนมาตรฐาน 10m หรือ 12m ด้วยอัลกอริทึม Best-Fit Decreasing (BFD) พร้อมกราฟิกแท่งเหล็กสีแสดงจุดตัดทีละท่อน',
      domain: 'civil',
      domainLabel: 'Civil & Site Operations',
      icon: Scissors,
      tags: ['rebar cutting', 'cutting stock', 'bin packing', 'bfd', 'ffd', 'waste reduction', 'bbs'],
      features: ['อัลกอริทึม BFD ลดเศษสูญเสีย', 'แท่งกราฟิกสีแสดงจุดตัดทีละท่อน', 'ส่งออกแผนการตัดเป็น CSV']
    },
    {
      id: 'rebar',
      name: 'คำนวณเหล็กเสริม & ระยะทาบ',
      nameEn: 'Rebar Weight & Lap Length Calculator',
      shortDesc: 'แปลงขนาดเหล็กข้ออ้อยและเหล็กกลม มอก. (RB6-DB32) เป็นน้ำหนักตามสูตร W = d²/162 กก./ม. คำนวณระยะทาบ วสท./ACI และตารางตัดเหล็ก (BBS)',
      domain: 'civil',
      domainLabel: 'Civil & Site Operations',
      icon: Scale,
      tags: ['rebar', 'steel', 'weight', 'lap length', 'splice', 'bar cut', 'bbs', 'concrete', 'structure'],
      features: ['น้ำหนักเหล็ก มอก. RB6-DB32', 'ระยะทาบมาตรฐาน วสท./ACI', 'บัญชีตัดเหล็ก (BBS) พร้อมเผื่อเศษ %']
    },
    {
      id: 'scientific',
      name: 'เครื่องคิดเลขวิทยาศาสตร์ & มุมสำรวจ',
      nameEn: 'Scientific & Geomatics Calculator',
      shortDesc: 'เครื่องคิดเลขวิทยาศาสตร์และมุมสำรวจ แปลงองศา-ลิปดา-ฟิลิปดา (DMS), ฟังก์ชันตรีโกณมิติ, ลอการิทึม และยกกำลัง',
      domain: 'civil',
      domainLabel: 'Civil & Site Operations',
      icon: Calculator,
      tags: ['casio', 'fx-991', 'trig', 'dms', 'degrees', 'sin', 'cos', 'tan', 'sqrt', 'scientific'],
      features: ['Natural 2-line display', 'แปลงมุม DMS ↔ ทศนิยม', 'ฟังก์ชันตรีโกณมิติครบครัน']
    },

    // ── 3. Cadastral & Land Desk ──
    {
      id: 'area',
      name: 'แปลงหน่วยที่ดินไทย',
      nameEn: 'Thai Cadastral Land Converter',
      shortDesc: 'คำนวณและแปลงหน่วยพื้นที่ดินไทย (ไร่ - งาน - ตารางวา) เทียบกับตารางเมตร (m²), เฮกตาร์ และเอเคอร์ มาตรฐานกรมที่ดิน',
      domain: 'cadastral',
      domainLabel: 'Cadastral & Land Desk',
      icon: Layers,
      tags: ['rai', 'ngan', 'tarang wa', 'land', 'cadastral', 'hectare', 'acre', 'sqm'],
      features: ['แยกสัดส่วน ไร่ - งาน - ตร.ว. อัตโนมัติ', 'แปลงสองทิศทางแบบเรียลไทม์', 'มาตรฐานกรมที่ดิน']
    },

    // ── 4. QA/QC Studio ──
    {
      id: 'adjustment',
      name: 'ศูนย์ประมวลผลดาวเทียม & โครงข่าย',
      nameEn: 'Unified GNSS & Network Adjustment Studio',
      shortDesc: 'ศูนย์รวมการประมวลผลข้อมูลดาวเทียมและโครงข่ายเบ็ดเสร็จ: ตรวจสอบไฟล์ดิบ RINEX & Polar Skyplot, คำนวณเวกเตอร์ฐาน Double Difference (LAMBDA), ปรับแก้ Least Squares 1D/2D, และประเมินวงรีความคลาดเคลื่อน 95%',
      domain: 'qaqc',
      domainLabel: 'QA/QC Studio',
      icon: Network,
      tags: ['gnss', 'rinex', 'skyplot', 'double difference', 'lambda', 'least squares', 'lsa', 'error ellipse', 'network adjustment', 'baarda'],
      features: ['RINEX 2/3 & Polar Skyplot', 'Double Difference Baseline (FIXED/FLOAT)', 'Least Squares 1D/2D & วงรี 95%']
    }
  ];

  // Domain Workspaces definition with counts
  const domains = useMemo(() => [
    { id: 'all', label: t.tools.domainAll, badge: `${tools.length}`, icon: Grid },
    { id: 'geodesy', label: t.tools.domainGeodesy, badge: `${tools.filter(t => t.domain === 'geodesy').length}`, icon: Compass },
    { id: 'civil', label: t.tools.domainCivil, badge: `${tools.filter(t => t.domain === 'civil').length}`, icon: Building2 },
    { id: 'cadastral', label: t.tools.domainCadastral, badge: `${tools.filter(t => t.domain === 'cadastral').length}`, icon: Layers },
    { id: 'qaqc', label: t.tools.domainQaqc, badge: `${tools.filter(t => t.domain === 'qaqc').length}`, icon: Network },
  ], [tools, t]);

  // Filtered tools by domain and search query
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchDomain = activeDomain === 'all' || tool.domain === activeDomain;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchDomain;
      const matchQuery = 
        tool.name.toLowerCase().includes(q) ||
        tool.nameEn.toLowerCase().includes(q) ||
        tool.shortDesc.toLowerCase().includes(q) ||
        tool.tags.some(t => t.toLowerCase().includes(q));
      return matchDomain && matchQuery;
    });
  }, [tools, activeDomain, searchQuery]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ACTIVE TOOL VIEW (เมื่อเลือกเปิดเครื่องมือใดเครื่องมือหนึ่ง)
  // ─────────────────────────────────────────────────────────────────────────────
  if (activeSubTab) {
    if (activeSubTab === 'scientific') {
      return <ScientificCalculator onBackToDirectory={() => selectTool(null)} />;
    }

    return (
      <div className="space-y-6">
        {/* Universal Back Navigation Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <button
            onClick={() => selectTool(null)}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--accent)] hover:underline transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.tools.backToDirectory}</span>
          </button>
          <span className="font-mono text-[11px] text-[var(--text-3)] uppercase px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">
            {t.tools.toolLabel}: {activeSubTab}
          </span>
        </div>

        {activeSubTab === 'traverse' && <TraverseCalculator />}
        {activeSubTab === 'leveling' && <LevelingCalculator />}
        {activeSubTab === 'coord' && <CoordinateConverter onPlotOnMap={onPlotOnMap} />}
        {activeSubTab === 'curve' && <CurveCalculator />}
        {activeSubTab === 'rebar' && <RebarCalculator />}
        {activeSubTab === 'strap-beam' && <StrapBeamCalculator />}
        {activeSubTab === 'rebar-optimizer' && <RebarCutOptimizer />}
        {activeSubTab === 'area' && <LandAreaCalculator />}
        {activeSubTab === 'adjustment' && <NetworkAdjustment onPlotOnMap={onPlotOnMap} />}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DIRECTORY VIEW (หน้าแรก: 4 Domain Workspaces พร้อม Tab Selector)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-16">
      
      {/* ── Hero Section ── */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-1)] tracking-tight">
          {t.tools.heroTitle}
        </h1>
        <p className="text-[var(--text-2)] text-sm max-w-3xl leading-relaxed">
          {t.tools.heroSubtitle}
        </p>
      </div>

      {/* ── 4 Domain Workspaces Selector Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
        {domains.map((dom) => {
          const isSelected = activeDomain === dom.id;
          const Icon = dom.icon;
          return (
            <button
              key={dom.id}
              type="button"
              onClick={() => setActiveDomain(dom.id as DomainWorkspace)}
              className={`min-h-[42px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[var(--accent)] text-black dark:text-white shadow-sm'
                  : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface)]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{dom.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isSelected ? 'bg-black/15 dark:bg-white/20 text-current' : 'bg-[var(--surface)] text-[var(--text-3)] border border-[var(--border)]'
              }`}>
                {dom.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search Bar within Tools ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.tools.searchPlaceholder}
          className="w-full min-h-[44px] pl-10 pr-24 py-2.5 rounded-[var(--btn-radius)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-1)] placeholder-[var(--text-3)] text-xs sm:text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text-1)] bg-[var(--surface)] border border-[var(--border)] transition-colors"
          >
            {t.tools.clearSearch}
          </button>
        )}
      </div>

      {/* ── Modern Tool Grid (Responsive 1-Col / 2-Col / 3-Col) ── */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((tool, index) => {
            const Icon = tool.icon;
            const toolCode = `TOOL-${String(index + 1).padStart(2, '0')}`;
            return (
              <div
                key={tool.id}
                onClick={() => selectTool(tool.id)}
                className="fusion-card group p-5 flex flex-col justify-between h-full cursor-pointer hover:border-[var(--accent)] hover:shadow-md transition-all duration-200 micro-press"
              >
                <div className="space-y-4">
                  {/* Top Meta: Code, Domain Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-[var(--text-3)] group-hover:text-[var(--accent)] transition-colors">
                      {toolCode}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)]">
                      {tool.domainLabel}
                    </span>
                  </div>

                  {/* Title & Icon Header */}
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 group-hover:bg-[var(--accent)] group-hover:text-black dark:group-hover:text-white group-hover:border-[var(--accent)] shadow-sm"
                      style={{
                        backgroundColor: 'var(--surface-2)',
                        borderColor: 'var(--border)'
                      }}
                    >
                      <Icon className="w-5 h-5 text-[var(--accent)] group-hover:text-black dark:group-hover:text-white transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                        {language === 'zh'
                          ? (TOOL_TITLES_ZH[tool.id]?.name || tool.nameEn)
                          : language === 'en'
                          ? tool.nameEn
                          : cleanParenthesizedTitle(tool.name)}
                      </h2>
                      <p className="text-xs font-mono text-[var(--text-3)] truncate">
                        {language === 'en' ? cleanParenthesizedTitle(tool.name) : tool.nameEn}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed line-clamp-3">
                    {language === 'zh' ? (TOOL_TITLES_ZH[tool.id]?.desc || tool.shortDesc) : tool.shortDesc}
                  </p>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tool.features.map((feat, idx) => (
                      <span 
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-3)] border border-[var(--border)]"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs font-semibold text-[var(--accent)]">
                  <span>{t.tools.launchTool}</span>
                  <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] group-hover:bg-[var(--accent)] group-hover:text-black dark:group-hover:text-white border border-[var(--border)] flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="fusion-card p-12 text-center space-y-3">
          <Calculator className="w-10 h-10 mx-auto text-[var(--text-3)] opacity-40" />
          <h3 className="text-base font-bold text-[var(--text-1)]">
            ไม่พบเครื่องมือที่ตรงกับ "{searchQuery}"
          </h3>
          <p className="text-xs text-[var(--text-3)] max-w-sm mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือเลือกแท็บ "ทั้งหมด" เพื่อแสดงเครื่องมือทุกเวิร์กสเปซ
          </p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setActiveDomain('all'); }}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black dark:text-white text-xs font-semibold"
          >
            แสดงเครื่องมือทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
};

export default CalculatorHub;
