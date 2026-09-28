import React, { useState } from 'react';
import { Compass, Moon, Sun, Info, ShieldCheck } from 'lucide-react';
import { AboutModal } from './AboutModal';

interface HeaderProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
  setActiveTab: (tab: 'knowledge' | 'calculator' | 'map') => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme
}) => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Global Brand Identity */}
            <div 
              onClick={() => setActiveTab('knowledge')}
              className="flex items-center cursor-pointer group select-none"
            >
              <span className="font-black text-xl tracking-tight text-sky-600 dark:text-sky-400 font-sans group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                MESURV
              </span>
            </div>

            {/* Desktop Precision Instrument Segmented Bar */}
            <nav className="hidden md:flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-[#1e293b] border border-slate-200/80 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm leading-normal transition-all duration-200 ${
                  activeTab === 'knowledge'
                    ? 'bg-white dark:bg-[#0f172a] text-sky-600 dark:text-sky-400 font-bold border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-white/60 dark:hover:bg-slate-800/50'
                }`}
              >
                คู่มือสำรวจ
              </button>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm leading-normal transition-all duration-200 ${
                  activeTab === 'calculator'
                    ? 'bg-white dark:bg-[#0f172a] text-sky-600 dark:text-sky-400 font-bold border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-white/60 dark:hover:bg-slate-800/50'
                }`}
              >
                Tools
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm leading-normal transition-all duration-200 ${
                  activeTab === 'map'
                    ? 'bg-white dark:bg-[#0f172a] text-sky-600 dark:text-sky-400 font-bold border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-white/60 dark:hover:bg-slate-800/50'
                }`}
              >
                แผนที่ WebGIS
              </button>
            </nav>

            {/* Controls: About & Theme Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAboutOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-800 transition-all flex items-center space-x-1.5 leading-normal"
                title="เกี่ยวกับระบบและมาตรฐานอ้างอิง"
              >
                <Info className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="hidden sm:inline">เกี่ยวกับ</span>
              </button>

              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 transition-all"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
};
