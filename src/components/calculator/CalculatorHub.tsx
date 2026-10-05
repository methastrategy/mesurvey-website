import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Compass, 
  Ruler, 
  Layers, 
  Calculator,
  ArrowRight,
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
  // If null, show the clean tool directory grid
  const [activeSubTab, setActiveSubTab] = useState<ToolId | null>(null);

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
  // 2. DIRECTORY VIEW (หน้าแรก: แสดงการ์ดเครื่องมือทั้งหมด ไม่ต้องมีช่องค้นหาหรือหมวดหมู่)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-16">
      
      {/* ── Hero Section (Streamlined Banner matching Knowledge Hub) ── */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-1)] tracking-tight">
          Tools
        </h1>
        <p className="text-[var(--text-2)] text-sm max-w-3xl leading-relaxed">
          เลือกเครื่องมือทางวิศวกรรมสำรวจที่ต้องการใช้งานเพื่อเปิดหน้าต่างทำงานเต็มรูปแบบ รองรับทั้งงานคำนวณคณิตศาสตร์ งานระดับ วงรอบ แปลงพิกัด และที่ดิน
        </p>
      </div>

      {/* ── Modern Tool Grid (Matching Knowledge Hub 3-Col / 2-Col Responsive Grid) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map((tool, index) => {
            const Icon = tool.icon;
            const toolCode = `TOOL-${String(index + 1).padStart(2, '0')}`;
            return (
              <div
                key={tool.id}
                onClick={() => selectTool(tool.id)}
                className="fusion-card group p-5 flex flex-col justify-between h-full cursor-pointer hover:border-[var(--accent)] hover:shadow-md transition-all duration-200 micro-press"
              >
                <div className="space-y-4">
                  {/* Top Meta: Code, Category Badge, Arrow */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-[var(--text-3)] group-hover:text-[var(--accent)] transition-colors">
                      {toolCode}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)]">
                      {tool.categoryLabel}
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
                        {tool.name}
                      </h2>
                      <p className="text-xs font-mono text-[var(--text-3)] truncate">
                        {tool.nameEn}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed line-clamp-3">
                    {tool.shortDesc}
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
                  <span>เปิดเครื่องมือ</span>
                  <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] group-hover:bg-[var(--accent)] group-hover:text-black dark:group-hover:text-white border border-[var(--border)] flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

export default CalculatorHub;
