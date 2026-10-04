import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { AboutModal } from './components/layout/AboutModal';
import { KnowledgeHub } from './components/knowledge/KnowledgeHub';
import { CalculatorHub } from './components/calculator/CalculatorHub';
import { WebMap } from './components/map/WebMap';

import { parseRouteHash, type MesurvRoute } from './utils/routing';

export type MesurvTheme = 'nordic' | 'warmsand' | 'terminal' | 'bento';

const THEME_META_COLORS: Record<MesurvTheme, string> = {
  nordic: '#f1f5f9',
  warmsand: '#f7f5f2',
  terminal: '#050505',
  bento: '#0f172a',
};

const DARK_THEMES = new Set<MesurvTheme>(['terminal', 'bento']);
const VALID_THEMES: MesurvTheme[] = ['nordic', 'warmsand', 'terminal', 'bento'];

export function App() {
  const [route, setRoute] = useState(() => parseRouteHash(window.location.hash));
  const activeTab = route.tab;
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Multi-Theme State (Warm Sand, Nordic Fjord, Terminal, Bento Quartz)
  const [theme, setTheme] = useState<MesurvTheme>(() => {
    try {
      const saved = localStorage.getItem('mesurv-theme') as MesurvTheme | null;
      if (saved && VALID_THEMES.includes(saved)) return saved;
    } catch {}
    return 'warmsand';
  });

  const [lastLightTheme, setLastLightTheme] = useState<MesurvTheme>(() => {
    return theme === 'nordic' ? 'nordic' : 'warmsand';
  });
  const [lastDarkTheme, setLastDarkTheme] = useState<MesurvTheme>(() => {
    return theme === 'bento' ? 'bento' : 'terminal';
  });

  const handleSelectTheme = (newTheme: MesurvTheme) => {
    setTheme(newTheme);
    if (DARK_THEMES.has(newTheme)) {
      setLastDarkTheme(newTheme);
    } else {
      setLastLightTheme(newTheme);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      if (DARK_THEMES.has(prev)) {
        return lastLightTheme;
      } else {
        return lastDarkTheme;
      }
    });
  };

  const [externalMapPoint, setExternalMapPoint] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  // Synchronize data-theme on both <html> and <body> + Tailwind .dark class + meta theme-color
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);

    const isDark = DARK_THEMES.has(theme);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', THEME_META_COLORS[theme] || '#f3f1eb');
    }

    try {
      localStorage.setItem('mesurv-theme', theme);
    } catch {}
  }, [theme]);

  // Lock outer page scrolling when in WebGIS map mode
  useEffect(() => {
    if (activeTab === 'map') {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [activeTab]);

  // Sync hash routing and browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseRouteHash(window.location.hash));
    };

    if (!window.location.hash) {
      window.location.hash = '#/knowledge';
    } else {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: 'knowledge' | 'calculator' | 'map') => {
    if (tab === 'knowledge') {
      window.location.hash = '#/knowledge';
    } else if (tab === 'calculator') {
      window.location.hash = '#/calculator';
    } else if (tab === 'map') {
      window.location.hash = '#/map';
    }
  };

  const handlePlotOnMap = (lat: number, lng: number, label: string) => {
    setExternalMapPoint({ lat, lng, label });
    window.location.hash = '#/map';
  };

  const isFullscreenView = activeTab === 'map';
  const isScientificFullscreen = activeTab === 'calculator' && route.subTab === 'scientific';

  return (
    <div className="relative flex flex-col min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg)] text-[var(--text-1)] font-sans antialiased">
      {/* Main Content Viewport (Full Width, No Left Sidebar) */}
      <div
        className={`relative z-10 flex flex-col flex-1 min-w-0 w-full max-w-full ${
          isFullscreenView || isScientificFullscreen ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen overflow-x-hidden'
        }`}
      >
        {/* Top Navigation Bar (Hidden in Map and Scientific modes) */}
        {!isFullscreenView && !isScientificFullscreen && (
          <Header
            activeTab={activeTab as any}
            setActiveTab={handleTabChange}
            route={route as any}
            theme={theme}
            onToggleTheme={toggleTheme}
            onSelectTheme={handleSelectTheme}
            onOpenAbout={() => setIsAboutOpen(true)}
          />
        )}

        {/* Dynamic Main Workspace Container */}
        <main
          className={`flex-1 w-full max-w-full ${
            isFullscreenView || isScientificFullscreen
              ? 'h-screen h-[100dvh] p-0 m-0 overflow-hidden relative'
              : 'max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-24 md:pb-16'
          }`}
        >
          {activeTab === 'knowledge' && (
            <KnowledgeHub
              onNavigateTab={handleTabChange}
              initialTopicId={route.topicId}
            />
          )}
          {activeTab === 'calculator' && (
            <CalculatorHub
              onPlotOnMap={handlePlotOnMap}
              initialSubTab={route.subTab}
            />
          )}
          {activeTab === 'map' && (
            <WebMap externalPoint={externalMapPoint} />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (Hidden on map full screen, scientific mode, and desktop >= md) */}
        {!isFullscreenView && !isScientificFullscreen && (
          <BottomNav
            activeTab={activeTab as any}
            setActiveTab={handleTabChange}
            onOpenAbout={() => setIsAboutOpen(true)}
          />
        )}

        {/* Footer: Hidden on mobile bottom nav, map and calculator modes */}
        {!isFullscreenView && activeTab !== 'calculator' && (
          <Footer onOpenAbout={() => setIsAboutOpen(true)} />
        )}
      </div>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}

export default App;

