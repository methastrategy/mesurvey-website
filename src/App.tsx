import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AboutModal } from './components/layout/AboutModal';
import { KnowledgeHub } from './components/knowledge/KnowledgeHub';
import { CalculatorHub } from './components/calculator/CalculatorHub';
import { WebMap } from './components/map/WebMap';

export type MesurvTheme = 'fieldbook' | 'terminal';

function parseRouteHash(rawHash: string) {
  const hash = rawHash.replace(/^#\/?/, '').trim();
  const parts = hash.split('/').filter(Boolean);
  const first = parts[0];

  if (first === 'calculator') {
    const validSubs = ['coord', 'traverse', 'leveling', 'area'] as const;
    const sub = validSubs.includes(parts[1] as any) ? (parts[1] as 'coord' | 'traverse' | 'leveling' | 'area') : undefined;
    return {
      tab: 'calculator' as const,
      subTab: sub,
      topicId: undefined
    };
  }
  if (first === 'map') {
    return {
      tab: 'map' as const,
      subTab: undefined,
      topicId: undefined
    };
  }
  return {
    tab: 'knowledge' as const,
    subTab: undefined,
    topicId: first === 'knowledge' ? parts[1] : undefined
  };
}

export function App() {
  const [route, setRoute] = useState(() => parseRouteHash(window.location.hash));
  const activeTab = route.tab;
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Dual-Theme State: 'fieldbook' (Light Daytime) | 'terminal' (Dark Matrix)
  const [theme, setTheme] = useState<MesurvTheme>(() => {
    try {
      const saved = localStorage.getItem('mesurv-theme');
      if (saved === 'terminal' || saved === 'fieldbook') return saved;
    } catch {}
    return 'fieldbook';
  });

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

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (theme === 'terminal') {
      root.classList.add('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#050505');
    } else {
      root.classList.remove('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#f3f1eb');
    }

    try {
      localStorage.setItem('mesurv-theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'fieldbook' ? 'terminal' : 'fieldbook'));
  };

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

  return (
    <div className="relative flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text-1)] font-sans antialiased">
      {/* Main Content Viewport (Full Width, No Left Sidebar) */}
      <div
        className={`relative z-10 flex flex-col flex-1 min-w-0 ${
          activeTab === 'map' ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen'
        }`}
      >
        {/* Top Navigation Bar (Fusion DNA: 64px height, 2px underline tabs, RTSD READY badge, Theme toggle) */}
        {activeTab !== 'map' && (
          <Header
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            route={route}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenAbout={() => setIsAboutOpen(true)}
          />
        )}

        {/* Dynamic Main Workspace Container (max-w-6xl centered per Fusion DNA) */}
        <main
          className={`flex-1 w-full ${
            activeTab === 'map'
              ? 'h-screen h-[100dvh] p-0 m-0 overflow-hidden relative'
              : 'max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16'
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

        {/* Footer: Hidden on map mode to prevent map scrolling */}
        {activeTab !== 'map' && <Footer onOpenAbout={() => setIsAboutOpen(true)} />}
      </div>

      {/* Global Floating About Corner Icon (Hidden in fullscreen map mode) */}
      {activeTab !== 'map' && (
        <button
          onClick={() => setIsAboutOpen(true)}
          aria-label="เกี่ยวกับระบบ"
          title="เกี่ยวกับระบบ MESURV"
          className="fixed bottom-4 right-4 z-50 w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-2)] hover:text-[var(--accent)] shadow-[var(--shadow)] transition-colors micro-press focus-ring"
        >
          <Info className="w-4 h-4 stroke-[2]" />
        </button>
      )}

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}

export default App;

