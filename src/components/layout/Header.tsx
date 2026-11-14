import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Calculator, 
  Map, 
  ChevronRight, 
  Sun, 
  Moon, 
  Check, 
  ChevronDown, 
  Wifi, 
  WifiOff, 
  ArrowLeft 
} from 'lucide-react';
import type { MesurvTheme } from '../../App';
import type { NetworkStatus } from '../../hooks/useNetworkStatus';
import { useI18n } from '../../core/i18n';

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
    subTab?: 'scientific' | 'coord' | 'traverse' | 'leveling' | 'area' | 'adjustment';
    topicId?: string;
  };
  theme?: MesurvTheme;
  onToggleTheme?: () => void;
  onSelectTheme?: (theme: MesurvTheme) => void;
  onOpenAbout?: () => void;
  network?: NetworkStatus;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  route,
  theme = 'warmsand',
  onToggleTheme,
  onSelectTheme,
  onOpenAbout,
  network,
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

  const { language, setLanguage, t, allLanguages } = useI18n();

  const currentSubTab = route?.subTab;
  const currentTopicId = route?.topicId;
  const currentSubTabLabel = currentSubTab ? (t.header.currentSubTab[currentSubTab] || currentSubTab) : '';

  const navItems = [
    {
      id: 'knowledge' as const,
      label: t.nav.knowledge,
      icon: BookOpen,
      countBadge: '34',
    },
    {
      id: 'calculator' as const,
      label: t.nav.calculator,
      icon: Calculator,
      countBadge: '10',
    },
    {
      id: 'map' as const,
      label: t.nav.map,
      icon: Map,
      countBadge: 'GIS',
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full select-none bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] transition-colors h-16">
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-2 sm:gap-4">
        
        {/* ================================================================= */}
        {/* ZONE 1 (LEFT): Brand Identity & Contextual Return Breadcrumb     */}
        {/* ================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
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
            {/* High-Precision Geomatics Reticle / Prism Icon */}
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

          {/* Contextual Sub-Route Pill in Left Zone */}
          {activeTab === 'calculator' && currentSubTab && (
            <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActiveTab('calculator')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] hover:text-[var(--accent)] border border-[var(--border)] text-xs font-semibold transition-colors micro-press cursor-pointer shadow-2xs group"
                title={t.tools.backToDirectory}
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0 text-[var(--accent)] group-hover:-translate-x-0.5 transition-transform" />
                <span>{t.common.back}</span>
              </button>
              {currentSubTabLabel && (
                <div className="flex items-center gap-1 text-[var(--text-3)] text-xs font-mono">
                  <span>/</span>
                  <span className="font-semibold text-[var(--accent)] truncate max-w-[140px]">
                    {currentSubTabLabel}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'knowledge' && currentTopicId && (
            <div className="hidden xl:flex items-center gap-1.5 pl-1.5 border-l border-[var(--border)] text-xs text-[var(--text-3)] truncate max-w-[180px]">
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

        {/* ================================================================= */}
        {/* ZONE 2 (CENTER): Precision Floating Segmented Navigation Island  */}
        {/* ================================================================= */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="hidden md:flex items-center justify-center flex-1 shrink-0"
        >
          <div className="inline-flex items-center p-1 rounded-2xl bg-[var(--surface-2)]/90 border border-[var(--border)] shadow-2xs gap-1 backdrop-blur-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[40px] px-3.5 lg:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-2 micro-press cursor-pointer select-none ${
                    isActive
                      ? 'bg-[var(--surface)] text-[var(--accent)] font-bold shadow-xs border border-[var(--border)]/80 scale-[1.02]'
                      : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface)]/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110 text-[var(--accent)]' : 'text-[var(--text-3)]'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ================================================================= */}
        {/* ZONE 3 (RIGHT): Modular Utility Dock (Language + Status + Theme)   */}
        {/* ================================================================= */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 relative" ref={themeMenuRef}>
          
          {/* Module 1: Language Switcher Capsule */}
          <div 
            className="flex items-center p-0.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shrink-0 shadow-2xs"
            role="group"
            aria-label={t.header.languageSelector}
          >
            {allLanguages.map((langItem) => {
              const isSelected = language === langItem.code;
              return (
                <button
                  key={langItem.code}
                  type="button"
                  onClick={() => setLanguage(langItem.code)}
                  className={`min-h-[34px] min-w-[32px] sm:min-w-[36px] px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-mono font-bold transition-all micro-press cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent)] text-black dark:text-white shadow-xs'
                      : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface)]/60'
                  }`}
                  title={`${langItem.label} - ${langItem.nameNative}`}
                  aria-pressed={isSelected}
                  aria-label={`Switch to ${langItem.nameEn}`}
                >
                  {langItem.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Module 2: Live Network Telemetry Badge */}
          {network && (
            network.isOnline ? (
              <div
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-3)] text-[11px] font-mono select-none"
                title="เชื่อมต่ออินเทอร์เน็ตปกติ (Live Online)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold tracking-wider">ONLINE</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={network.resetDismissed}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-500 dark:text-amber-400 text-[11px] font-mono font-bold hover:bg-amber-500/25 transition-colors micro-press focus-ring"
                title="คลิกเพื่อดูรายละเอียดโหมดรังวัดออฟไลน์ภาคสนาม (Offline Field Mode 100%)"
                aria-label="สถานะออฟไลน์ภาคสนาม คลิกเพื่อดูรายละเอียด"
              >
                <WifiOff className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                <span className="hidden sm:inline tracking-wider">OFFLINE</span>
              </button>
            )
          )}

          {/* Module 3: Appearance & Curated Palette Dock */}
          <div className="flex items-center p-0.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shrink-0 shadow-2xs gap-0.5">
            {/* Quick Dark/Light Toggle Button */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={currentThemeObj.isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
                title={currentThemeObj.isDark ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดมืด (Dark Mode)'}
                className="min-h-[34px] min-w-[34px] p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-1)] flex items-center justify-center transition-colors micro-press focus-ring cursor-pointer"
              >
                {currentThemeObj.isDark ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
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
              className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-1)] flex items-center gap-2 transition-all micro-press focus-ring cursor-pointer"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs border border-black/10 dark:border-white/20"
                style={{ backgroundColor: currentThemeObj.accent }}
              />
              <span className="hidden md:inline font-mono text-[11px] font-bold tracking-wide w-[80px] truncate text-left">
                {currentThemeObj.name.toUpperCase()}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-3)] transition-transform duration-150 shrink-0 ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

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
                      className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
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
