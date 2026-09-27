import React from 'react';
import { BookOpen, Calculator, Map } from 'lucide-react';

interface NavigationProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
  setActiveTab: (tab: 'knowledge' | 'calculator' | 'map') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.1] shadow-[0_10px_30px_rgba(0,0,0,0.12)] rounded-3xl p-1.5 transition-all">
      <div className="grid grid-cols-3 max-w-md mx-auto">
        
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all min-h-[50px] ${
            activeTab === 'knowledge'
              ? 'bg-black/[0.04] dark:bg-white/[0.08] text-ios-blue dark:text-ios-blueDark font-semibold shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className={`w-5 h-5 mb-1 ${activeTab === 'knowledge' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] leading-tight">คู่มือสำรวจ</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all min-h-[50px] ${
            activeTab === 'calculator'
              ? 'bg-black/[0.04] dark:bg-white/[0.08] text-ios-blue dark:text-ios-blueDark font-semibold shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calculator className={`w-5 h-5 mb-1 ${activeTab === 'calculator' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] leading-tight font-medium">Tools</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all min-h-[50px] ${
            activeTab === 'map'
              ? 'bg-black/[0.04] dark:bg-white/[0.08] text-ios-blue dark:text-ios-blueDark font-semibold shadow-sm'
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
