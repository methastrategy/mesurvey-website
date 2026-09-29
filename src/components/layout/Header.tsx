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
        
        {/* Left: MESURV Brand Identity + Field Terminal Tag + Contextual Sub-Breadcrumb */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
          <button
            onClick={() => setActiveTab('knowledge')}
            className="flex items-center gap-2 sm:gap-3 min-h-[44px] py-1 pr-1.5 sm:pr-2 text-left micro-press focus-ring shrink-0"
            title="MESURV Field Terminal"
          >
            <div className="font-bold text-base sm:text-lg tracking-tight text-[var(--text-1)] shrink-0">
              ME<span style={{ color: 'var(--accent)' }}>SURV</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-[var(--border)]" />
            <div className="hidden sm:block font-mono text-xs text-[var(--text-2)] tracking-wider">
              FIELD TERMINAL v4.2
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

          {onOpenAbout && (
            <button
              type="button"
              onClick={onOpenAbout}
              className="hidden sm:inline-flex nav-tab min-h-[44px] focus-ring"
            >
              <Info className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">เกี่ยวกับระบบ</span>
            </button>
          )}
        </nav>

        {/* Right: RTSD READY Telemetry Status Badge + Dual-Theme Toggle (Fieldbook ↔ Terminal) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="hidden sm:inline-flex status-badge" title="Royal Thai Survey Department Standard Ready">
            <span className="status-dot" />
            <span>RTSD READY</span>
          </div>

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

