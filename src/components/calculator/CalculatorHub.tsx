import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Compass, 
  Ruler, 
  Layers, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Calculator,
  Terminal
} from 'lucide-react';
import { CoordinateConverter } from './CoordinateConverter';
import { TraverseCalculator } from './TraverseCalculator';
import { LevelingCalculator } from './LevelingCalculator';
import { LandAreaCalculator } from './LandAreaCalculator';

interface CalculatorHubProps {
  onPlotOnMap?: (lat: number, lng: number, label: string) => void;
  initialSubTab?: 'coord' | 'traverse' | 'leveling' | 'area';
}

export const CalculatorHub: React.FC<CalculatorHubProps> = ({ onPlotOnMap, initialSubTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'coord' | 'traverse' | 'leveling' | 'area' | null>(initialSubTab || null);

  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const parts = hash.split('/').filter(Boolean);
      if (parts[0] === 'calculator') {
        const sub = parts[1] as any;
        const validSubs = ['coord', 'traverse', 'leveling', 'area'];
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

  const handleSubTabChange = (sub: 'coord' | 'traverse' | 'leveling' | 'area') => {
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
      id: 'coord' as const,
      shortName: 'แปลงพิกัด',
      label: 'แปลงค่าพิกัดสากล & ประเทศไทย',
      labelEn: 'Geodetic Coordinate Transformation Console',
      icon: ArrowRightLeft,
      topBar: 'from-indigo-500/60 via-indigo-400/20 to-transparent',
      iconBox: 'bg-indigo-500/15 border-indigo-400/30 text-indigo-400',
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
      id: 'traverse' as const,
      shortName: 'ปรับแก้วงรอบ',
      label: 'ปรับแก้วงรอบภาคสนาม (Bowditch Rule)',
      labelEn: 'Bowditch Traverse Adjustment & Precision Console',
      icon: Compass,
      topBar: 'from-sky-500/60 via-sky-400/20 to-transparent',
      iconBox: 'bg-sky-500/15 border-sky-400/30 text-sky-400',
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
      shortName: 'คำนวณระดับ',
      label: 'สมุดคำนวณระดับทางวิศวกรรม (Differential Leveling)',
      labelEn: 'HI & Rise-and-Fall Leveling Fieldbook Console',
      icon: Ruler,
      topBar: 'from-emerald-500/60 via-emerald-400/20 to-transparent',
      iconBox: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400',
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
      id: 'area' as const,
      shortName: 'แปลงหน่วยที่ดิน',
      label: 'แปลงหน่วยพื้นที่ดินไทย (ไร่ - งาน - ตารางวา)',
      labelEn: 'Thai Cadastral Land Area Conversion Console',
      icon: Layers,
      topBar: 'from-amber-500/60 via-amber-400/20 to-transparent',
      iconBox: 'bg-amber-500/15 border-amber-400/30 text-amber-400',
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
        <div className="space-y-6">
          {/* Console Hero Banner */}
          <div className="raycast-panel relative overflow-hidden rounded-2xl p-6 sm:p-8">
            <div className="pointer-events-none absolute -top-28 right-12 w-96 h-64 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="relative space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[10px] font-mono font-semibold tracking-widest uppercase">
                <Calculator className="w-3 h-3 text-indigo-400" />
                MESURV Digital Field Consoles · 4 Geodetic Engines
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                แผงควบคุมเครื่องมือคำนวณวิศวกรรมสำรวจ
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                เลือกเครื่องมือที่ต้องการใช้งาน ระบบคำนวณทุกตัวทำงานแบบ Real-time พร้อมระบบตรวจสอบความคลาดเคลื่อนตามเกณฑ์มาตรฐานกรมแผนที่ทหาร (RTSD)
              </p>
            </div>
          </div>

          {/* 4 Bento Instrument Cards (2x2 Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => handleSubTabChange(tool.id)}
                  className="raycast-card group relative rounded-2xl p-6 cursor-pointer flex flex-col justify-between overflow-hidden space-y-5"
                >
                  {/* Top Specular Accent Gradient */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${tool.topBar}`} />

                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm ${tool.iconBox}`}>
                          <Icon className="w-5 h-5 stroke-[2]" />
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors tracking-tight leading-snug">
                            {tool.label}
                          </h2>
                          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                            {tool.labelEn}
                          </span>
                        </div>
                      </div>
                      <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/[0.05] text-slate-300 border border-white/[0.08] shrink-0">
                        {tool.badge}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-[13px] text-slate-300/90 leading-relaxed">
                      {tool.summary}
                    </p>

                    {/* Live Telemetry Readout Preview Window */}
                    <div className="rounded-xl bg-[#07080a]/95 border border-white/[0.08] p-3.5 font-mono tabular-nums space-y-1.5 shadow-inner">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-white/[0.06] pb-1.5 mb-1">
                        <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                          <Terminal className="w-3 h-3" />
                          TELEMETRY READOUT PREVIEW
                        </span>
                        <span className="text-emerald-400">● READY</span>
                      </div>
                      {tool.telemetryPreview.map((line, lIdx) => (
                        <div key={lIdx} className="text-[11px] text-slate-300 truncate leading-relaxed">
                          {line}
                        </div>
                      ))}
                    </div>

                    {/* Features Checklist */}
                    <ul className="space-y-1.5 pt-1">
                      {tool.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Launch Instrument Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubTabChange(tool.id);
                      }}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] group-hover:bg-indigo-600 text-white border border-white/[0.10] group-hover:border-indigo-500 text-xs sm:text-sm font-semibold transition-all shadow-sm group-hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] micro-press"
                    >
                      <span>เปิดแผงควบคุมเครื่องมือนี้</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
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
          <div className="raycast-panel rounded-2xl p-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sticky top-16 z-30">
            <button
              onClick={handleBackToHub}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] transition-colors border border-white/[0.10] shrink-0 min-h-[44px] micro-press"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>แผงเลือกเครื่องมือทั้งหมด</span>
            </button>

            {/* Quick Instrument Switcher Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeSubTab === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleSubTabChange(tool.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 min-h-[44px] micro-press ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-[0_0_16px_rgba(99,102,241,0.35)] border border-indigo-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
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
            {activeSubTab === 'coord' && <CoordinateConverter onPlotOnMap={onPlotOnMap} />}
            {activeSubTab === 'traverse' && <TraverseCalculator />}
            {activeSubTab === 'leveling' && <LevelingCalculator />}
            {activeSubTab === 'area' && <LandAreaCalculator />}
          </div>
        </div>
      )}

    </div>
  );
};
