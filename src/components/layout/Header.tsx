import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Calculator, Map, ChevronRight, Sun, Moon, Info, Palette, Check, ChevronDown } from 'lucide-react';
import type { MesurvTheme } from '../../App';

export interface ThemeOption {
  id: MesurvTheme;
  name: string;
  nameEn: string;
  accent: string;
  bg: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  // Light Themes
  { id: 'nordic', name: 'Nordic Fjord', nameEn: 'Alpine Teal', accent: '#0f766e', bg: '#f1f5f9', isDark: false },
  { id: 'warmsand', name: 'Warm Sand', nameEn: 'Terracotta & Sand', accent: '#cc785c', bg: '#f7f5f2', isDark: false },
  // Dark Themes
  { id: 'terminal', name: 'Terminal', nameEn: 'Carbon Matrix', accent: '#34d399', bg: '#050505', isDark: true },
  { id: 'bento', name: 'Bento Quartz', nameEn: 'Deep Sky Bento', accent: '#0ea5e9', bg: '#0f172a', isDark: true },
];

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
  onSelectTheme?: (theme: MesurvTheme) => void;
  onOpenAbout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  route,
  theme = 'warmsand',
  onToggleTheme,
  onSelectTheme,
  onOpenAbout,
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentThemeObj = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS.find(t => t.id === 'warmsand') || THEME_OPTIONS[0];
  const isDark = currentThemeObj.isDark;

  // Filter themes dynamically: Light mode shows 2 Light themes; Dark mode shows 2 Dark themes
  const visibleThemes = THEME_OPTIONS.filter((opt) => opt.isDark === isDark).sort((a, b) => {
    if (!isDark) {
      return a.id === 'warmsand' ? -1 : b.id === 'warmsand' ? 1 : 0;
    }
    return a.id === 'terminal' ? -1 : b.id === 'terminal' ? 1 : 0;
  });

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

        {/* Center: Fusion 2px Underline Tab Bar (Desktop / Tablet >= md) */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="hidden md:flex items-center h-full overflow-x-auto no-scrollbar"
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

        {/* Right: Multi-Theme Selector (Curated Palettes) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative" ref={themeMenuRef}>
          {/* Quick Toggle Button (Light/Dark Toggle) */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={currentThemeObj.isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
              title={currentThemeObj.isDark ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดมืด (Dark Mode)'}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-[var(--btn-radius)] bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-1)] flex items-center justify-center transition-colors micro-press focus-ring"
            >
              {currentThemeObj.isDark ? (
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--accent)] shrink-0" />
              )}
            </button>
          )}

          {/* Theme Dropdown Trigger Button */}
          <button
            type="button"
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            aria-expanded={isThemeMenuOpen}
            aria-label="เลือกธีมสีของระบบ"
            title={`ธีมปัจจุบัน: ${currentThemeObj.name} (คลิกเพื่อเลือกจาก ${isDark ? 'โหมดมืด 2 แบบ' : 'โหมดสว่าง 2 แบบ'})`}
            className="min-h-[44px] px-2.5 sm:px-3 py-1.5 rounded-[var(--btn-radius)] bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-1)] flex items-center gap-2 transition-all micro-press focus-ring"
          >
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-black/10 dark:border-white/20"
              style={{ backgroundColor: currentThemeObj.accent }}
            />
            <span className="hidden sm:inline font-mono text-[11px] font-bold tracking-wide w-[92px] truncate text-left">
              {currentThemeObj.name.toUpperCase()}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-3)] transition-transform duration-150 shrink-0 ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu Popover */}
          {isThemeMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-64 p-1.5 rounded-2xl bg-[var(--surface)] border border-[var(--border-strong)] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1"
              style={{ backdropFilter: 'blur(20px)' }}
            >
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-3)] border-b border-[var(--border)] flex items-center justify-between">
                <span>เลือกชุดสี ({isDark ? 'โหมดมืด 2 แบบ' : 'โหมดสว่าง 2 แบบ'})</span>
                <span className="font-bold text-[var(--accent)]">DNA Curated</span>
              </div>

              <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
                {visibleThemes.map((opt) => {
                  const isActive = opt.id === theme;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (onSelectTheme) onSelectTheme(opt.id);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all ${
                        isActive
                          ? 'bg-[var(--surface-2)] border border-[var(--border-strong)] shadow-sm'
                          : 'hover:bg-[var(--surface-2)] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20"
                          style={{ backgroundColor: opt.accent }}
                        />
                        <div className="flex flex-col truncate">
                          <span className={`text-xs font-semibold truncate ${isActive ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-1)]'}`}>
                            {opt.name}
                          </span>
                          <span className="text-[10px] text-[var(--text-3)] font-mono truncate">
                            {opt.nameEn}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                          style={{
                            backgroundColor: opt.bg,
                            color: opt.isDark ? '#e2e8f0' : '#1e293b',
                            borderColor: 'var(--border)'
                          }}
                        >
                          {opt.isDark ? 'DARK' : 'LIGHT'}
                        </span>
                        {isActive && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

