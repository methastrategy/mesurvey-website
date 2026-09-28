import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Compass, 
  Ruler, 
  Layers, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Calculator
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
      label: 'แปลงค่าพิกัดสากล & ประเทศไทย',
      labelEn: 'Geodetic Coordinate Transformation',
      icon: ArrowRightLeft,
      accentColor: 'indigo',
      badge: 'EPSG:4326 • EPSG:32647/48 • Indian 1975',
      summary: 'แปลงค่าพิกัดระหว่าง WGS84 Geographic (DD/DMS), WGS84 UTM Zone 47N/48N และ Indian 1975 พร้อมคำนวณ Grid Convergence และ Scale Factor อัตโนมัติ',
      features: [
        'แปลงพิกัด WGS84 (DD/DMS) ↔ UTM Zone 47N/48N',
        'Helmert 7-Parameter Datum Transformation (Indian 1975)',
        'คำนวณ Grid Convergence (γ) และ Point Scale Factor (k)',
        'ส่งออกผลลัพธ์เป็นหมุดพิกัดลงแผนที่ WebGIS แบบ Interactive'
      ]
    },
    {
      id: 'traverse' as const,
      label: 'ปรับแก้วงรอบภาคสนาม (Bowditch Compass Rule)',
      labelEn: 'Bowditch Traverse Adjustment & Precision Ratio',
      icon: Compass,
      accentColor: 'sky',
      badge: 'Closed-Loop / Link Traverse • 1:N Ratio',
      summary: 'คำนวณความคลาดเคลื่อนทางมุม (Angular Misclosure), ปรับแก้พิกัดตามกฎเข็มทิศ Bowditch, ตรวจสอบชั้นงาน RTSD 1st-3rd Order และอัตราส่วนความละเอียดเชิงเส้น',
      features: [
        'รองรับทั้งวงรอบปิดรูปเรขาคณิต (Closed Loop) และเปิดต่อเชื่อม (Link)',
        'คำนวณการกระจายมุมคลาดเคลื่อน (Correction per Station)',
        'คำนวณผลต่างละติจูด (ΔN) และลองจิจูด (ΔE) พร้อมปรับแก้สมดุล',
        'จำแนกชั้นงานสำรวจตามเกณฑ์ RTSD Class 1, 2, 3 และ 1:N Ratio'
      ]
    },
    {
      id: 'leveling' as const,
      label: 'สมุดคำนวณระดับทางวิศวกรรม (Differential Leveling)',
      labelEn: 'HI & Rise-and-Fall Differential Leveling',
      icon: Ruler,
      accentColor: 'emerald',
      badge: 'HI Method • Rise & Fall • RTSD ±k√K mm',
      summary: 'บันทึกและคำนวณระดับดินเดิม-ระดับปรับแก้อัตโนมัติด้วยวิธี HI และ Rise & Fall พร้อมตรวจสอบ Page Check Arithmetic และเกณฑ์ความคลาดเคลื่อนระดับชั้น 1-3 กรมแผนที่ทหาร',
      features: [
        'คำนวณอัตโนมัติทั้งวิธีแกนกล้อง (HI) และวิธีขึ้น-ลง (Rise & Fall)',
        'ระบบตรวจสอบสมการหน้าสมุดสนาม: Σ BS - Σ FS = Last RL - First RL',
        'ประเมินค่าเผื่อความคลาดเคลื่อนปิด C = ±k√K มม. (First/Second/Third Order)',
        'ตรวจจับข้อผิดพลาดการกรอกจุดตั้งกล้องและไม้ระดับแบบเรียลไทม์'
      ]
    },
    {
      id: 'area' as const,
      label: 'แปลงหน่วยพื้นที่ดินไทย (ไร่ - งาน - ตารางวา)',
      labelEn: 'Thai Cadastral Land Units & Area Reduction',
      icon: Layers,
      accentColor: 'amber',
      badge: 'ไร่ - งาน - ตารางวา ↔ ตารางเมตร / เฮกตาร์',
      summary: 'แปลงหน่วยวัดพื้นที่ตามมาตรฐานกรมที่ดินไทย เชื่อมโยงระหว่าง ไร่-งาน-ตารางวา กับตารางเมตร (m²) และเฮกตาร์ (ha) พร้อมระบบแยกสัดส่วนทศนิยมอัตโนมัติ',
      features: [
        'แปลงค่าสองทิศทางระหว่างหน่วยไทยและหน่วยเมตริกสากล',
        '1 ไร่ = 4 งาน = 400 ตร.ว. = 1,600 ตร.ม.',
        'ระบบแยกเศษทศนิยมเป็น ไร่-งาน-ตารางวา แบบแม่นยำระดับตารางเซนติเมตร',
        'คัดลอกค่าสรุปหน่วยที่ดินไทยนำไปใช้งานในเอกสารสิทธิ์ โฉนดที่ดิน ได้ทันที'
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. INSTRUMENT PICKER LANDING VIEW (When no specific sub-calculator selected) */}
      {/* ========================================================================= */}
      {activeSubTab === null && (
        <div className="space-y-6">
          {/* Header */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-[#111113]/85 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold tracking-widest uppercase rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
                <Calculator className="w-3 h-3" />
                MESURV Geodetic Engines
              </span>
              <span className="text-xs text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Field Geomatics Suite
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              เครื่องมือคำนวณวิศวกรรมสำรวจ
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              เลือกโมดูลการคำนวณทางยีโอเดซีและงานสำรวจภาคสนามที่ต้องการประมวลผล ทุกระบบผ่านการรับรองความถูกต้องตามมาตรฐานวิศวกรรม
            </p>
          </div>

          {/* Instrument Cards Grid (2x2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => handleSubTabChange(tool.id)}
                  className="group relative p-6 rounded-2xl bg-white/80 dark:bg-[#111113]/85 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)] transition-all duration-200 micro-lift cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        <Icon className="w-5 h-5 stroke-[2]" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider bg-slate-100 dark:bg-[#161618] text-slate-600 dark:text-slate-400 border border-black/[0.06] dark:border-white/[0.06] truncate max-w-[220px]">
                        {tool.badge}
                      </span>
                    </div>

                    {/* Titles */}
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors tracking-tight leading-snug">
                        {tool.label}
                      </h2>
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5 block">
                        {tool.labelEn}
                      </span>
                    </div>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {tool.summary}
                    </p>

                    {/* Key Features List */}
                    <ul className="space-y-1.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                      {tool.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Primary Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubTabChange(tool.id);
                      }}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:border-indigo-600 text-xs sm:text-sm font-semibold transition-all shadow-xs group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600"
                    >
                      <span>เปิดใช้งานเครื่องมือนี้</span>
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
      {/* 2. ACTIVE INSTRUMENT VIEW (When a tool has been selected)                  */}
      {/* ========================================================================= */}
      {activeSubTab !== null && (
        <div className="space-y-6">
          {/* Top Bar: Back to Tools + Segmented Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-2.5 rounded-2xl bg-white/80 dark:bg-[#111113]/85 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
            <button
              onClick={handleBackToHub}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-[#161618] transition-colors border border-black/[0.06] dark:border-white/[0.06] shrink-0 min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>เลือกเครื่องมืออื่น</span>
            </button>

            {/* Segmented Subtab Switcher */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeSubTab === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleSubTabChange(tool.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 min-h-[38px] ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161618]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tool.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Calculator Module */}
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
