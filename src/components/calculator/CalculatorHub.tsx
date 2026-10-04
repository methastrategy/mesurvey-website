import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Compass, 
  Ruler, 
  Layers, 
  Calculator
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

export const CalculatorHub: React.FC<CalculatorHubProps> = ({ onPlotOnMap, initialSubTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'scientific' | 'coord' | 'traverse' | 'leveling' | 'area'>((initialSubTab as any) || 'scientific');

  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const parts = hash.split('/').filter(Boolean);
      if (parts[0] === 'calculator') {
        const sub = parts[1] as any;
        const validSubs = ['scientific', 'coord', 'traverse', 'leveling', 'area'];
        if (validSubs.includes(sub)) {
          setActiveSubTab(sub);
        } else {
          setActiveSubTab('scientific');
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

  const handleSubTabChange = (sub: 'scientific' | 'coord' | 'traverse' | 'leveling' | 'area') => {
    setActiveSubTab(sub);
    window.location.hash = `#/calculator/${sub}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tools = [
    {
      id: 'scientific' as const,
      code: 'CALC-00',
      shortName: 'เครื่องคิดเลขวิทย์ (CASIO)',
      label: 'เครื่องคิดเลขวิทยาศาสตร์ & สำรวจ (CASIO fx-991EX Style)',
      labelEn: 'Scientific & Geodetic Calculator (CASIO fx-991EX Style)',
      icon: Calculator,
      badge: 'Natural Display • DMS ↔ DD • Pol/Rec • Survey Correction',
      summary: 'เครื่องคิดเลขวิทยาศาสตร์ครบวงจรสไตล์ CASIO fx-991EX / fx-5800P รองรับ Natural Display, ตรีโกณมิติ, แปลงมุมองศา-ลิปดา-ฟิลิปดา (DMS), Pol/Rec พิกัดฉาก-เชิงขั้ว และสูตรแก้ไขงานสำรวจภาคสนาม',
      telemetryPreview: [
        'Pol(ΔE, ΔN) : S = 141.421 m | Az = 45° 00\' 00"',
        'DMS Mode   : 14° 25\' 36" ↔ 14.426667° (DD)',
        'C&R Corr   : c = 0.0675 × D² = 0.0675 m @ 1.0 km'
      ],
      features: [
        'Natural Textbook 2-Line Display คำนวณนิพจน์คณิตศาสตร์และตรีโกณมิติครบครัน',
        'แป้นเฉพาะทางงานสำรวจ: แปลงมุม ° \' " (DMS ↔ DD) และฟังก์ชัน Pol / Rec',
        'สูตรลัดวิศวกรรมสำรวจ: C&R Correction, Slope to Horizontal, Grid Scale Factor'
      ]
    },
    {
      id: 'traverse' as const,
      code: 'CALC-01',
      shortName: 'ตารางทำงานวงรอบ',
      label: 'ตารางทำงานวงรอบภาคสนาม (Bowditch Rule)',
      labelEn: 'Bowditch Traverse Adjustment & Precision Console',
      icon: Compass,
      badge: 'Closed-Loop / Link Traverse • 1:N Ratio',
      summary: 'คำนวณความคลาดเคลื่อนทางมุมและระยะเชิงเส้น ปรับแก้พิกัดตามกฎเข็มทิศ Bowditch พร้อมประเมินชั้นงานสำรวจมาตรฐานกรมแผนที่ทหาร (RTSD)',
      telemetryPreview: [
        '∑ΔN = -0.014 m  | ∑ΔE = +0.019 m  | L = 500.00 m',
        'Linear Misclosure = 0.0236 m      | Ratio = 1 : 21,186',
        'RTSD Standard     = FIRST-ORDER PASS (≥ 1:20,000)'
      ],
      features: [
        'คำนวณ Latitude (ΔN) และ Departure (ΔE) รายสถานีอัตโนมัติ',
        'ตรวจสอบอัตราส่วนความละเอียดเชิงเส้น (Linear Precision 1:N)',
        'ส่งออกตารางสมุดสนามเป็นไฟล์ CSV และแสดงโครงข่ายบนแผนที่'
      ]
    },
    {
      id: 'leveling' as const,
      code: 'CALC-02',
      shortName: 'ตารางทำงานระดับ',
      label: 'ตารางทำงานระดับทางวิศวกรรม (Differential Leveling)',
      labelEn: 'HI & Rise-and-Fall Leveling Fieldbook Console',
      icon: Ruler,
      badge: 'HI Method • Rise & Fall • RTSD ±k√K mm',
      summary: 'ประมวลผลค่าระดับด้วยวิธีแกนกล้อง (HI) และวิธีขึ้น-ลง (Rise & Fall) พร้อมตรวจสอบ Page Check Arithmetic และเกณฑ์ความคลาดเคลื่อน ±4√K ถึง ±24√K',
      telemetryPreview: [
        '∑BS (6.425 m) - ∑FS (4.110 m) = +2.315 m',
        'Last RL - First RL            = +2.315 m [PAGE CHECK OK]',
        'Misclosure = +2.1 mm ≤ ±4√K (RTSD First-Order)'
      ],
      features: [
        'ทวนสอบสมการหน้าสมุดสนามอัตโนมัติ (Arithmetic Page Check)',
        'กระจายค่าปรับแก้ระดับตามระยะทางสะสม (Cumulative Distance)',
        'จำแนกเกณฑ์ชั้นงานระดับชั้น 1, ชั้น 2, ชั้น 3 และงานก่อสร้าง'
      ]
    },
    {
      id: 'coord' as const,
      code: 'CALC-03',
      shortName: 'ตารางแปลงพิกัด',
      label: 'แปลงค่าพิกัดสากล & ประเทศไทย (Coordinate Transformation)',
      labelEn: 'Geodetic Coordinate Transformation Console',
      icon: ArrowRightLeft,
      badge: 'EPSG:4326 • UTM 47N/48N • Indian 1975',
      summary: 'แปลงค่าพิกัดแบบสองทิศทางระหว่าง WGS84 (DD/DMS), UTM Zone 47N/48N และ Indian 1975 พร้อมคำนวณ Grid Convergence และ Point Scale Factor',
      telemetryPreview: [
        'WGS84   : 13° 50\' 51.36" N , 100° 34\' 10.56" E',
        'UTM 47N : E 669,571.428 m  | N 1,531,512.894 m',
        'IND1975 : E 669,274.112 m  | N 1,531,208.531 m'
      ],
      features: [
        'Helmert 7-Parameter Datum Shift (RTSD Thailand)',
        'คำนวณมุมเยื้องกริด (γ) และตัวคูณมาตราส่วนจุด (k)',
        'ส่งพิกัดออกไปยังแผนที่ภาคสนาม WebGIS ได้ทันที'
      ]
    },
    {
      id: 'area' as const,
      code: 'CALC-04',
      shortName: 'แปลงหน่วยที่ดิน',
      label: 'แปลงหน่วยพื้นที่ดินไทย (ไร่ - งาน - ตารางวา)',
      labelEn: 'Thai Cadastral Land Area Conversion Console',
      icon: Layers,
      badge: 'ไร่ - งาน - ตารางวา ↔ m² / Hectare / Acre',
      summary: 'แปลงหน่วยวัดพื้นที่ตามมาตรฐานกรมที่ดินไทย เชื่อมโยงระหว่าง ไร่-งาน-ตารางวา กับตารางเมตร (m²), เฮกตาร์ (ha) และเอเคอร์ พร้อมแยกสัดส่วนอัตโนมัติ',
      telemetryPreview: [
        'Metric Input   : 12,480.00 m²  (1.2480 Hectares)',
        'Thai Cadastral : 7 ไร่ - 3 งาน - 20.00 ตารางวา',
        'Total Sq.Wa    : 3,120.00 ตร.ว. (1 ไร่ = 1,600 m²)'
      ],
      features: [
        'แปลงค่าแบบสองทิศทางทันที (Real-time Bidirectional Sync)',
        'แยกเศษทศนิยมเป็น ไร่ - งาน - ตารางวา ความละเอียดสูง',
        'เหมาะสำหรับงานรังวัดสอบเขตโฉนดที่ดินและประเมินราคา'
      ]
    }
  ];

  const activeTool = tools.find(t => t.id === activeSubTab);

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* ── 1. Minimal Hero Header (Aligned with Knowledge Hub Style) ── */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 font-mono text-xs text-[var(--accent)] uppercase tracking-wider">
          <span>KU GEOMATICS • FIELD COMPUTATION ENGINE</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-1)] tracking-tight">
            เครื่องมือคำนวณ / Calculator Hub
          </h1>
          <span className="font-mono text-xs text-[var(--text-3)]">
            5 ENGINES AVAILABLE • RTSD STANDARDS
          </span>
        </div>
        <p className="text-[var(--text-2)] text-xs sm:text-sm max-w-3xl leading-relaxed">
          รวมระบบประมวลผลทางวิศวกรรมสำรวจ: เครื่องคิดเลขวิทยาศาสตร์ภาคสนาม, การปรับแก้วงรอบวิธีเข็มทิศ, สมุดบันทึกระดับ 3 สายใย, แปลงค่าพิกัดแผนที่ และคำนวณเนื้อที่ดินไทย
        </p>
      </div>

      {/* ── 2. Unified Minimal Tab Rail Bar (Single Sticky Switcher) ── */}
      <div
        className="sticky top-16 z-30 p-1.5 sm:p-2 rounded-[var(--card-radius)] border shadow-sm transition-all"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeSubTab === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => handleSubTabChange(tool.id)}
                className={`group min-h-[42px] px-3 sm:px-4 py-2 rounded-[var(--btn-radius)] text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                    : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] border border-transparent'
                }`}
                title={tool.label}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span className="whitespace-nowrap">{tool.shortName}</span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.2 rounded transition-colors ${
                    isActive
                      ? 'bg-black/20 text-white'
                      : 'bg-[var(--surface-2)] text-[var(--text-3)] group-hover:text-[var(--text-2)]'
                  }`}
                >
                  {tool.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Active Tool Meta Strip (Quick Specs & Feature Summary) ── */}
      {activeTool && (
        <div
          className="p-3 sm:p-4 rounded-[var(--card-radius)] border text-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-colors"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)]">
              {activeTool.code}
            </span>
            <span className="font-bold text-[var(--text-1)] text-xs sm:text-sm">
              {activeTool.label}
            </span>
          </div>
          <div className="font-mono text-[11px] text-[var(--text-3)] flex items-center gap-1.5">
            <span>{activeTool.badge}</span>
          </div>
        </div>
      )}

      {/* ── 4. Main Active Instrument Viewport ── */}
      <div className="min-h-[500px] transition-all">
        {activeSubTab === 'scientific' && <ScientificCalculator />}
        {activeSubTab === 'traverse' && <TraverseCalculator />}
        {activeSubTab === 'leveling' && <LevelingCalculator />}
        {activeSubTab === 'coord' && <CoordinateConverter onPlotOnMap={onPlotOnMap} />}
        {activeSubTab === 'area' && <LandAreaCalculator />}
      </div>
    </div>
  );
};
