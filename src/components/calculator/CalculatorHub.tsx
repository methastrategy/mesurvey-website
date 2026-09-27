import React, { useState } from 'react';
import { ArrowRightLeft, Compass, Ruler, Layers } from 'lucide-react';
import { CoordinateConverter } from './CoordinateConverter';
import { TraverseCalculator } from './TraverseCalculator';
import { LevelingCalculator } from './LevelingCalculator';
import { LandAreaCalculator } from './LandAreaCalculator';

interface CalculatorHubProps {
  onPlotOnMap?: (lat: number, lng: number, label: string) => void;
}

export const CalculatorHub: React.FC<CalculatorHubProps> = ({ onPlotOnMap }) => {
  const [activeSubTab, setActiveSubTab] = useState<'coord' | 'traverse' | 'leveling' | 'area'>('coord');

  const tabs = [
    {
      id: 'coord',
      label: 'แปลงค่าพิกัดสากล & ประเทศไทย',
      labelEn: 'Coordinate Transformation',
      icon: ArrowRightLeft
    },
    {
      id: 'traverse',
      label: 'ปรับแก้วงรอบ (Bowditch Rule)',
      labelEn: 'Traverse Adjustment',
      icon: Compass
    },
    {
      id: 'leveling',
      label: 'สมุดคำนวณระดับ (Leveling)',
      labelEn: 'Differential Leveling',
      icon: Ruler
    },
    {
      id: 'area',
      label: 'แปลงหน่วยที่ดินไทย (ไร่-งาน-วา)',
      labelEn: 'Thai Land Units',
      icon: Layers
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Tools Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-black/[0.05] dark:border-white/[0.06]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-ios-blue/10 dark:bg-ios-blue/20 text-ios-blue dark:text-ios-blueDark border border-ios-blue/25">
              Tools Suite
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Geodesy & Field Algorithms
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
            เครื่องมือคำนวณวิศวกรรมสำรวจ
          </h2>
        </div>
      </div>

      {/* iOS Native Segmented Bar */}
      <div className="p-1.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] backdrop-blur-xl grid grid-cols-2 lg:grid-cols-4 gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`p-3 rounded-xl text-left transition-all duration-200 flex items-center space-x-3 ${
                isActive
                  ? 'bg-white dark:bg-[#2c2d33] text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                isActive 
                  ? 'bg-ios-blue text-white shadow-sm shadow-blue-500/30' 
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-slate-500 dark:text-slate-400'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm block truncate leading-snug">
                  {tab.label}
                </span>
                <span className="text-[10px] block truncate font-mono text-slate-400 dark:text-slate-500">
                  {tab.labelEn}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Calculator Module */}
      <div>
        {activeSubTab === 'coord' && <CoordinateConverter onPlotOnMap={onPlotOnMap} />}
        {activeSubTab === 'traverse' && <TraverseCalculator />}
        {activeSubTab === 'leveling' && <LevelingCalculator />}
        {activeSubTab === 'area' && <LandAreaCalculator />}
      </div>

    </div>
  );
};
