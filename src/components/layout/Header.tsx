import React from 'react';
import { Compass, Moon, Sun, ShieldCheck } from 'lucide-react';

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
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-survey-950 via-survey-900 to-survey-800 text-white shadow-lg border-b border-survey-600/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Identity */}
          <div 
            onClick={() => setActiveTab('knowledge')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-survey-500 to-survey-300 flex items-center justify-center shadow-md shadow-survey-900/50 group-hover:scale-105 transition-transform duration-200">
              <Compass className="w-6 h-6 text-survey-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white font-sans">
                  MESURV
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-survey-500/20 text-survey-300 border border-survey-500/40">
                  Geomatics KU
                </span>
              </div>
              <p className="text-xs text-survey-200/80 hidden sm:block">
                Survey Engineering & Geoinformatics Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'knowledge'
                  ? 'bg-survey-700/80 text-white shadow-sm border border-survey-400/40 font-semibold'
                  : 'text-survey-200 hover:text-white hover:bg-survey-800/60'
              }`}
            >
              คลังความรู้ & คู่มือสนาม
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'calculator'
                  ? 'bg-survey-700/80 text-white shadow-sm border border-survey-400/40 font-semibold'
                  : 'text-survey-200 hover:text-white hover:bg-survey-800/60'
              }`}
            >
              เครื่องมือคำนวณสำรวจ
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'map'
                  ? 'bg-survey-700/80 text-white shadow-sm border border-survey-400/40 font-semibold'
                  : 'text-survey-200 hover:text-white hover:bg-survey-800/60'
              }`}
            >
              ระบบแผนที่ WebGIS
            </button>
          </nav>

          {/* System Status & Theme Toggle */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-survey-950/60 border border-survey-700/60 text-xs text-survey-300">
              <ShieldCheck className="w-3.5 h-3.5 text-survey-400" />
              <span>ระบบพร้อมใช้งาน (Online)</span>
            </div>

            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-lg bg-survey-950/60 hover:bg-survey-800 text-survey-200 hover:text-white border border-survey-700/50 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-survey-200" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
