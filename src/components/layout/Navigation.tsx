import React from 'react';
import { BookOpen, Calculator, Map } from 'lucide-react';

interface NavigationProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
  setActiveTab: (tab: 'knowledge' | 'calculator' | 'map') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg">
      <div className="grid grid-cols-3 max-w-md mx-auto">
        
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex flex-col items-center justify-center py-2.5 px-1 transition-colors min-h-[52px] ${
            activeTab === 'knowledge'
              ? 'text-survey-600 dark:text-survey-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className={`w-5 h-5 mb-1 ${activeTab === 'knowledge' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] leading-tight">คู่มือสำรวจ</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex flex-col items-center justify-center py-2.5 px-1 transition-colors min-h-[52px] ${
            activeTab === 'calculator'
              ? 'text-survey-600 dark:text-survey-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calculator className={`w-5 h-5 mb-1 ${activeTab === 'calculator' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] leading-tight">เครื่องมือคำนวณ</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-2.5 px-1 transition-colors min-h-[52px] ${
            activeTab === 'map'
              ? 'text-survey-600 dark:text-survey-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Map className={`w-5 h-5 mb-1 ${activeTab === 'map' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] leading-tight">แผนที่ WebGIS</span>
        </button>

      </div>
    </nav>
  );
};
