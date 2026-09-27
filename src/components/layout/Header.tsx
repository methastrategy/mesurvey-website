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
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#16181d]/85 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Global Brand Identity */}
            <div 
              onClick={() => setActiveTab('knowledge')}
              className="flex items-center cursor-pointer group select-none"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent font-sans group-hover:opacity-90 transition-opacity">
                  MESURV
                </span>

                {/* Creator Credit with Interactive Dynamic Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/90 dark:border-white/[0.1] shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_8px_rgba(0,122,255,0.12)] hover:border-ios-blue/40 dark:hover:border-ios-blue/40 transition-all duration-300 hover:scale-[1.02]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ios-blue opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-ios-blue"></span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
                    Created by{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-ios-blue dark:group-hover:text-ios-blueDark transition-colors">
                      Metha Treepraphankij
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop iOS Native Segmented Bar */}
            <nav className="hidden md:flex items-center p-1 rounded-2xl bg-black/[0.05] dark:bg-white/[0.07] border border-black/[0.04] dark:border-white/[0.06] backdrop-blur-md">
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === 'knowledge'
                    ? 'bg-white dark:bg-[#2c2d33] text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                คู่มือสำรวจ
              </button>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === 'calculator'
                    ? 'bg-white dark:bg-[#2c2d33] text-ios-blue dark:text-ios-blueDark shadow-[0_2px_8px_rgba(0,0,0,0.08)] font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                Tools
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === 'map'
                    ? 'bg-white dark:bg-[#2c2d33] text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
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
