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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 shadow-sm">
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

      {/* Modern Bright Segmented Bar */}
      <div className="p-1.5 rounded-2xl bg-slate-100/90 dark:bg-[#131b2c] border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl grid grid-cols-2 lg:grid-cols-4 gap-1.5 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id as any)}
              className={`p-3 rounded-xl text-left transition-all duration-200 flex items-center space-x-3 ${
                isActive
                  ? 'bg-white dark:bg-[#1a2436] text-blue-600 dark:text-sky-300 shadow-[0_2px_10px_rgba(0,122,255,0.12)] border border-blue-100 dark:border-blue-900/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                isActive 
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm shadow-blue-500/30' 
                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
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
