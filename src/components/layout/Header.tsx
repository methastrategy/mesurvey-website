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
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#007AFF] via-[#0A84FF] to-[#5856D6] flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <Compass className="w-5 h-5 text-white stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white font-sans">
                    MESURV
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-ios-blue/10 dark:bg-ios-blue/20 text-ios-blue dark:text-ios-blueDark border border-ios-blue/25">
                    Tools Suite
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
                  Universal Geomatics & Survey Engineering
                </p>
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
