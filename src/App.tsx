import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { AboutModal } from './components/layout/AboutModal';
import { KnowledgeHub } from './components/knowledge/KnowledgeHub';
import { CalculatorHub } from './components/calculator/CalculatorHub';
import { WebMap } from './components/map/WebMap';
import { ScrollCanvasBackground } from './components/layout/ScrollCanvasBackground';

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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mesurv-sidebar-collapsed');
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });

  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mesurv_theme');
      if (saved !== null) {
        return saved === 'dark';
      }
    } catch (e) {
      // ignore
    }
    return false; // Default to luminous, bright light theme
  });

  const [externalMapPoint, setExternalMapPoint] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDark]);

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

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mesurv_theme', next ? 'dark' : 'light');
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

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
    <div className="relative flex min-h-screen bg-canvas/30 dark:bg-canvas/40 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Scroll-Driven Dynamic Canvas Background */}
      <ScrollCanvasBackground activeTab={activeTab} isDark={isDark} />

      {/* Desktop Collapsible Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenAbout={() => setIsAboutOpen(true)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Viewport */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-[padding] duration-200 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-[56px]' : 'lg:pl-[240px]'
        } ${activeTab === 'map' ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen'}`}
      >
        {/* Slim 48px Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          route={route}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onOpenAbout={() => setIsAboutOpen(true)}
        />

        {/* Dynamic Main Workspace Container */}
        <main
          className={`flex-1 w-full ${
            activeTab === 'map'
              ? 'h-[calc(100dvh-48px-56px)] lg:h-[calc(100dvh-48px)] p-0 m-0 overflow-hidden relative'
              : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-20 lg:pb-8'
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
        {activeTab !== 'map' && <Footer />}
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}

export default App;
