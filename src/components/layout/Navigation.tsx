import React from 'react';
import { BookOpen, Calculator, Map } from 'lucide-react';

interface NavigationProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
  setActiveTab: (tab: 'knowledge' | 'calculator' | 'map') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 bg-white/90 dark:bg-[#131b2c]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,122,255,0.08)] rounded-3xl p-1.5 transition-all">
      <div className="grid grid-cols-3 max-w-md mx-auto gap-1">
        
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all min-h-[50px] ${
            activeTab === 'knowledge'
              ? 'bg-sky-50 dark:bg-sky-950/40 text-blue-600 dark:text-sky-300 font-bold border border-sky-200/60 dark:border-sky-800/40 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className={`w-5 h-5 mb-1 ${activeTab === 'knowledge' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-xs leading-normal">คู่มือสำรวจ</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all min-h-[50px] ${
            activeTab === 'calculator'
              ? 'bg-sky-50 dark:bg-sky-950/40 text-blue-600 dark:text-sky-300 font-bold border border-sky-200/60 dark:border-sky-800/40 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calculator className={`w-5 h-5 mb-1 ${activeTab === 'calculator' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-xs leading-normal">เครื่องมือคำนวณ</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all min-h-[50px] ${
            activeTab === 'map'
              ? 'bg-sky-50 dark:bg-sky-950/40 text-blue-600 dark:text-sky-300 font-bold border border-sky-200/60 dark:border-sky-800/40 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Map className={`w-5 h-5 mb-1 ${activeTab === 'map' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-xs leading-normal">แผนที่ WebGIS</span>
        </button>

      </div>
    </nav>
  );
};
