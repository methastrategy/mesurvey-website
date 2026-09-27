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
      
      {/* Sub-Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`p-3.5 sm:p-4 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between ${
                isActive
                  ? 'bg-survey-700 text-white border-survey-600 shadow-md shadow-survey-900/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-survey-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${
                  isActive ? 'bg-survey-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-survey-600 dark:text-survey-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm block leading-snug">
                  {tab.label}
                </span>
                <span className={`text-[10px] block mt-0.5 font-mono ${
                  isActive ? 'text-survey-200' : 'text-slate-400 dark:text-slate-500'
                }`}>
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
