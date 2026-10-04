import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Compass, 
  Ruler, 
  Layers, 
  ArrowLeft, 
  ArrowRight, 
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
  const [activeSubTab, setActiveSubTab] = useState<'scientific' | 'coord' | 'traverse' | 'leveling' | 'area' | null>(initialSubTab || null);

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

  const handleSubTabChange = (sub: 'scientific' | 'coord' | 'traverse' | 'leveling' | 'area') => {
    setActiveSubTab(sub);
    window.location.hash = `#/calculator/${sub}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHub = () => {
    setActiveSubTab(null);
    window.location.hash = '#/calculator';
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

  return (
    <div className="space-y-6 pb-16">
      
      {/* ========================================================================= */}
      {/* 1. BENTO INSTRUMENT CONSOLE PICKER (When no sub-calculator is selected)   */}
      {/* ========================================================================= */}
      {activeSubTab === null && (
        <div className="space-y-4">
          {/* Compact Tools Header Banner */}
          <div
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--card-radius)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="w-4 h-4 text-[var(--accent)]" />
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-1)]">
                  เครื่องมือคำนวณวิศวกรรมสำรวจ
                </h1>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-3)] border border-[var(--border)]">
                  5 ENGINES
                </span>
              </div>
              <p className="text-xs text-[var(--text-2)]">
                เลือกเครื่องมือคำนวณภาคสนามตามมาตรฐานงานสำรวจ RTSD
              </p>
            </div>
          </div>

          {/* Compact Tool Cards Grid (5 tools: 1 col mobile, 2 col tablet, 3 col desktop, 5 col widescreen) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => handleSubTabChange(tool.id)}
                  className="fusion-card group p-4 cursor-pointer flex flex-col justify-between hover:border-[var(--accent)] transition-all micro-lift"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          backgroundColor: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          color: 'var(--accent)'
                        }}
                      >
                        <Icon className="w-4 h-4 stroke-[2]" />
                      </div>
                      <span className="font-mono text-[10px] text-[var(--text-3)] px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">
                        {tool.code}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                        {tool.label}
                      </h2>
                      <p className="text-[11px] font-mono text-[var(--text-3)] mt-1 truncate" title={tool.badge}>
                        {tool.badge}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[var(--border)] flex items-center justify-between text-xs font-semibold text-[var(--accent)]">
                    <span className="text-[11px]">เปิดใช้งาน</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DIGITAL FIELD CONSOLE VIEW (When an instrument is active)              */}
      {/* ========================================================================= */}
      {activeSubTab !== null && (
        <div className="space-y-6">
          {/* Sticky Console Switcher Bar */}
          <div
            className="p-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sticky top-16 z-30"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--card-radius)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <button
              onClick={handleBackToHub}
              className="btn-outline inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold shrink-0 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span>แผงเลือกเครื่องมือทั้งหมด</span>
            </button>

            {/* Quick Instrument Switcher (2px underline style per Fusion DNA) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeSubTab === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleSubTabChange(tool.id)}
                    className={`nav-tab inline-flex items-center gap-2 px-3 text-xs font-semibold shrink-0 min-h-[44px] ${
                      isActive ? 'active' : ''
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tool.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Instrument Console */}
          <div>
            {activeSubTab === 'scientific' && <ScientificCalculator />}
            {activeSubTab === 'traverse' && <TraverseCalculator />}
            {activeSubTab === 'leveling' && <LevelingCalculator />}
            {activeSubTab === 'coord' && <CoordinateConverter onPlotOnMap={onPlotOnMap} />}
            {activeSubTab === 'area' && <LandAreaCalculator />}
          </div>
        </div>
      )}

    </div>
  );
};
