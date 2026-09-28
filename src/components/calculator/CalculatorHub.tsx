import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Compass, Ruler, Layers } from 'lucide-react';
import { CoordinateConverter } from './CoordinateConverter';
import { TraverseCalculator } from './TraverseCalculator';
import { LevelingCalculator } from './LevelingCalculator';
import { LandAreaCalculator } from './LandAreaCalculator';

interface CalculatorHubProps {
  onPlotOnMap?: (lat: number, lng: number, label: string) => void;
  initialSubTab?: 'coord' | 'traverse' | 'leveling' | 'area';
}

export const CalculatorHub: React.FC<CalculatorHubProps> = ({ onPlotOnMap, initialSubTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'coord' | 'traverse' | 'leveling' | 'area'>(initialSubTab || 'coord');

  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const parts = hash.split('/').filter(Boolean);
      if (parts[0] === 'calculator') {
        const sub = parts[1] as any;
        const validSubs = ['coord', 'traverse', 'leveling', 'area'];
        if (validSubs.includes(sub)) {
          setActiveSubTab(sub);
        }
      }
    };

    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, []);

  const handleSubTabChange = (sub: 'coord' | 'traverse' | 'leveling' | 'area') => {
    setActiveSubTab(sub);
    window.location.hash = `#/calculator/${sub}`;
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-hairline">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold tracking-widest uppercase rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              MESURV Calculators
            </span>
            <span className="text-xs text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Geodesy & Field Algorithms
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
            เครื่องมือคำนวณวิศวกรรมสำรวจ
          </h2>
        </div>
      </div>

      {/* Precision Segmented Bar */}
      <div className="p-1.5 rounded-2xl bg-surface-1 dark:bg-[#111113] border border-hairline grid grid-cols-2 lg:grid-cols-4 gap-1.5 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id as any)}
              className={`p-3 rounded-xl text-left transition-all duration-200 flex items-center space-x-3 min-h-[56px] ${
                isActive
                  ? 'bg-white dark:bg-[#1c1c1f] text-slate-900 dark:text-white shadow-sm border border-black/[0.08] dark:border-white/[0.08] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-2 dark:hover:bg-[#161618] border border-transparent'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30' 
                  : 'bg-surface-2 dark:bg-[#161618] text-slate-500 dark:text-slate-400 border border-hairline'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm block truncate leading-normal">
                  {tab.label}
                </span>
                <span className="text-xs block truncate font-mono text-slate-400 dark:text-slate-500">
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
