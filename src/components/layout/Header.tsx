import React, { useState } from 'react';
import { Moon, Sun, ChevronRight, Compass } from 'lucide-react';
import { AboutModal } from './AboutModal';

interface HeaderProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
  setActiveTab: (tab: 'knowledge' | 'calculator' | 'map') => void;
  route?: {
    tab: 'knowledge' | 'calculator' | 'map';
    subTab?: 'coord' | 'traverse' | 'leveling' | 'area';
    topicId?: string;
  };
  isDark: boolean;
  toggleTheme: () => void;
  onOpenAbout?: () => void;
}

const subTabNames: Record<string, string> = {
  coord: 'แปลงพิกัด',
  traverse: 'โครงข่ายวงรอบ',
  leveling: 'ระดับวิศวกรรม',
  area: 'พื้นที่ & ปริมาตร',
};

const moduleNames: Record<string, string> = {
  knowledge: 'คู่มือสำรวจ',
  calculator: 'เครื่องมือคำนวณ',
  map: 'แผนที่ WebGIS',
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  route,
  isDark,
  toggleTheme,
  onOpenAbout,
}) => {
  const [localAboutOpen, setLocalAboutOpen] = useState(false);
  const handleOpenAbout = onOpenAbout || (() => setLocalAboutOpen(true));

  const currentSubTab = route?.subTab;
  const currentTopicId = route?.topicId;

  return (
    <>
      <header className="sticky top-0 z-30 h-12 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] transition-colors select-none">
        <div className="h-full px-3 sm:px-6 flex items-center justify-between">
          
          {/* Left: Dynamic Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 min-w-0 overflow-hidden text-xs sm:text-sm">
            {/* Mobile Brand Wordmark */}
            <button
              onClick={() => setActiveTab('knowledge')}
              className="lg:hidden flex items-center space-x-1.5 font-bold text-slate-900 dark:text-slate-100 shrink-0 micro-press"
            >
              <Compass className="w-4 h-4 text-indigo-500 stroke-[2.2]" />
              <span className="tracking-tight font-sans font-extrabold text-xs">MESURV</span>
            </button>

            <span className="lg:hidden text-slate-300 dark:text-slate-600">/</span>

            {/* Desktop Root Breadcrumb */}
            <button
              onClick={() => setActiveTab('knowledge')}
              className="hidden lg:inline-flex items-center font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              MESURV
            </button>

            <ChevronRight className="hidden lg:inline w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />

            {/* Module Level */}
            <button
              onClick={() => setActiveTab(activeTab)}
              className={`truncate font-medium transition-colors ${
                currentSubTab || currentTopicId
                  ? 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  : 'text-indigo-600 dark:text-indigo-400 font-semibold'
              }`}
            >
              {moduleNames[activeTab] || 'หน้าหลัก'}
            </button>

            {/* Submodule Level (Calculator SubTab) */}
            {activeTab === 'calculator' && currentSubTab && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                <span className="truncate font-semibold text-indigo-600 dark:text-indigo-400">
                  {subTabNames[currentSubTab] || currentSubTab}
                </span>
              </>
            )}

            {/* Submodule Level (Knowledge Topic ID) */}
            {activeTab === 'knowledge' && currentTopicId && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                <span className="truncate font-semibold text-indigo-600 dark:text-indigo-400 font-mono text-[11px] sm:text-xs">
                  {currentTopicId}
                </span>
              </>
            )}
          </nav>

          {/* Right: Telemetry Controls */}
          <div className="flex items-center space-x-2 shrink-0">

            {/* Theme Toggle Button (>= 44x44px touch envelope) */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#161618] transition-colors micro-press"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>

        </div>
      </header>

      {!onOpenAbout && (
        <AboutModal isOpen={localAboutOpen} onClose={() => setLocalAboutOpen(false)} />
      )}
    </>
  );
};

export default Header;
