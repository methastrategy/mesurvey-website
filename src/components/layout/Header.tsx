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
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_15px_-3px_rgba(0,0,0,0.03)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Global Brand Identity */}
            <div 
              onClick={() => setActiveTab('knowledge')}
              className="flex items-center cursor-pointer group select-none"
            >
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-sky-400 dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent font-sans group-hover:opacity-95 transition-opacity">
                MESURV
              </span>
            </div>

            {/* Desktop iOS Native Segmented Bar */}
            <nav className="hidden md:flex items-center p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-md">
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === 'knowledge'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-sky-400 shadow-[0_2px_8px_rgba(0,122,255,0.12)] font-bold border border-blue-100 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-white/60 dark:hover:bg-slate-700/40'
                }`}
              >
                คู่มือสำรวจ
              </button>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === 'calculator'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-sky-400 shadow-[0_2px_8px_rgba(0,122,255,0.12)] font-bold border border-blue-100 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-white/60 dark:hover:bg-slate-700/40'
                }`}
              >
                Tools
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === 'map'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-sky-400 shadow-[0_2px_8px_rgba(0,122,255,0.12)] font-bold border border-blue-100 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-white/60 dark:hover:bg-slate-700/40'
                }`}
              >
                แผนที่ WebGIS
              </button>
            </nav>

            {/* Controls: About & Theme Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAboutOpen(true)}
                className="px-3 py-1.5 rounded-2xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] border border-black/[0.04] dark:border-white/[0.06] transition-all flex items-center space-x-1.5"
                title="เกี่ยวกับระบบและมาตรฐานอ้างอิง"
              >
                <Info className="w-3.5 h-3.5 text-ios-blue" />
                <span className="hidden sm:inline">เกี่ยวกับ</span>
              </button>

              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="p-2 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-black/[0.04] dark:border-white/[0.06] transition-all"
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
