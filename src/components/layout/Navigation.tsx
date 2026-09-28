import React from 'react';
import { BookOpen, Calculator, Map } from 'lucide-react';

interface NavigationProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
  setActiveTab: (tab: 'knowledge' | 'calculator' | 'map') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-1.5 transition-all">
      <div className="grid grid-cols-3 max-w-md mx-auto gap-1">
        
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all min-h-[50px] ${
            activeTab === 'knowledge'
              ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-bold border border-sky-200/80 dark:border-sky-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <BookOpen className={`w-5 h-5 mb-1 ${activeTab === 'knowledge' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-xs leading-normal">คู่มือสำรวจ</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all min-h-[50px] ${
            activeTab === 'calculator'
              ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-bold border border-sky-200/80 dark:border-sky-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Calculator className={`w-5 h-5 mb-1 ${activeTab === 'calculator' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-xs leading-normal">เครื่องมือคำนวณ</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all min-h-[50px] ${
            activeTab === 'map'
              ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-bold border border-sky-200/80 dark:border-sky-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Map className={`w-5 h-5 mb-1 ${activeTab === 'map' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-xs leading-normal">แผนที่ WebGIS</span>
        </button>

      </div>
    </nav>
  );
};
