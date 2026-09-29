import React from 'react';
import { BookOpen, Calculator, Map, ChevronRight, Sun, Moon, Info } from 'lucide-react';
import type { MesurvTheme } from '../../App';

interface HeaderProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
  setActiveTab: (tab: 'knowledge' | 'calculator' | 'map') => void;
  route?: {
    tab: 'knowledge' | 'calculator' | 'map';
    subTab?: 'coord' | 'traverse' | 'leveling' | 'area';
    topicId?: string;
  };
  theme?: MesurvTheme;
  onToggleTheme?: () => void;
  onOpenAbout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  route,
  theme = 'fieldbook',
  onToggleTheme,
  onOpenAbout,
}) => {
  const subTabNames: Record<string, string> = {
    coord: 'แปลงพิกัด',
    traverse: 'ปรับแก้วงรอบ',
    leveling: 'คำนวณระดับ',
    area: 'คำนวณเนื้อที่',
  };

  const currentSubTab = route?.subTab;
  const currentTopicId = route?.topicId;

  return (
    <header className="nav-bar select-none">
      <div className="max-w-6xl mx-auto px-2.5 sm:px-6 h-full flex items-center justify-between gap-1 sm:gap-2">
        
        {/* Left: MESURV Modern Precision Brand Identity (Triggers About Modal) */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
          <button
            onClick={() => {
              if (onOpenAbout) {
                onOpenAbout();
              } else {
                setActiveTab('knowledge');
              }
            }}
            className="group flex items-center gap-2.5 min-h-[44px] py-1 px-2 -ml-2 rounded-xl hover:bg-[var(--surface-2)] transition-all micro-press focus-ring shrink-0 cursor-pointer"
            title="เกี่ยวกับระบบ MESURV (คลิกเพื่อดูข้อมูล)"
            aria-label="เกี่ยวกับระบบ MESURV"
          >
            {/* Custom High-Precision Geomatics Reticle / Prism SVG Icon */}
            <div className="relative w-8 h-8 rounded-lg bg-[var(--surface-2)] group-hover:bg-[var(--accent)]/15 border border-[var(--border)] group-hover:border-[var(--accent)]/40 flex items-center justify-center transition-all shadow-sm">
              <svg 
                className="w-4 h-4 text-[var(--accent)] transition-transform duration-300 group-hover:rotate-45" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" strokeDasharray="3 3" opacity="0.6" />
                <path d="M12 3v4m0 10v4M3 12h4m10 0h4" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)] animate-pulse" />
            </div>

            {/* Stylized Modern Brand Typography */}
            <div className="flex flex-col text-left">
              <div className="flex items-center tracking-tight leading-none">
                <span className="font-extrabold text-base sm:text-lg tracking-wider font-mono text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors">
                  ME
                </span>
                <span className="font-black text-base sm:text-lg tracking-widest font-mono text-[var(--accent)] drop-shadow-sm">
                  SURV
                </span>
                <span className="ml-1 text-[9px] font-mono font-semibold px-1 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 leading-none">
                  GEO
                </span>
              </div>
              <span className="text-[9px] font-mono text-[var(--text-3)] group-hover:text-[var(--text-2)] tracking-wider uppercase transition-colors">
                PLATFORM ⓘ
              </span>
            </div>
          </button>

          {/* Sub-level Breadcrumb Indicator (Desktop) */}
          {activeTab === 'calculator' && currentSubTab && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-[var(--text-3)] truncate">
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <button
                onClick={() => setActiveTab('calculator')}
                className="hover:text-[var(--text-1)] transition-colors"
              >
                Calculator
              </button>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[var(--accent)] font-mono font-semibold truncate">
                {subTabNames[currentSubTab] || currentSubTab}
              </span>
            </div>
          )}

          {activeTab === 'knowledge' && currentTopicId && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-[var(--text-3)] truncate max-w-[200px]">
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <button
                onClick={() => setActiveTab('knowledge')}
                className="hover:text-[var(--text-1)] transition-colors shrink-0"
              >
                Knowledge
              </button>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[var(--accent)] font-mono text-[11px] truncate">
                {currentTopicId}
              </span>
            </div>
          )}
        </div>

        {/* Center: Fusion 2px Underline Tab Bar (NO Box / NO Pill) */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="flex items-center h-full overflow-x-auto no-scrollbar"
        >
          <button
            type="button"
            onClick={() => setActiveTab('knowledge')}
            className={`nav-tab min-h-[44px] focus-ring ${
              activeTab === 'knowledge' ? 'active' : ''
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>คู่มือสำรวจ</span>
            <span className="hidden md:inline font-mono text-xs text-[var(--text-3)]">Knowledge</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`nav-tab min-h-[44px] focus-ring ${
              activeTab === 'calculator' ? 'active' : ''
            }`}
          >
            <Calculator className="w-4 h-4 shrink-0" />
            <span>คำนวณ</span>
            <span className="hidden md:inline font-mono text-xs text-[var(--text-3)]">Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`nav-tab min-h-[44px] focus-ring ${
              activeTab === 'map' ? 'active' : ''
            }`}
          >
            <Map className="w-4 h-4 shrink-0" />
            <span>WebGIS</span>
          </button>
        </nav>

        {/* Right: Dual-Theme Toggle (Fieldbook ↔ Terminal) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'fieldbook' ? 'สลับเป็นโหมดมืด Terminal' : 'สลับเป็นโหมดสว่าง Fieldbook'}
              title={theme === 'fieldbook' ? 'Theme: Fieldbook (คลิกเพื่อสลับเป็น Terminal Dark)' : 'Theme: Terminal (คลิกเพื่อสลับเป็น Fieldbook Light)'}
              className="min-h-[44px] min-w-[44px] px-2 sm:px-3 py-2 rounded-[var(--btn-radius)] bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-1)] flex items-center justify-center gap-2 transition-colors micro-press focus-ring"
            >
              {theme === 'fieldbook' ? (
                <>
                  <Moon className="w-4 h-4 text-[var(--text-1)] shrink-0" />
                  <span className="hidden lg:inline font-mono text-[11px] font-semibold">TERMINAL</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-[var(--accent-2)] shrink-0" />
                  <span className="hidden lg:inline font-mono text-[11px] font-semibold">FIELDBOOK</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

