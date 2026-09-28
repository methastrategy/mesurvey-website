import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { Header } from './components/layout/Header';
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
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const [externalMapPoint, setExternalMapPoint] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  // Enforce permanent Dark Mode (Raycast × Linear Dark Glassmorphism)
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

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
    <div className="relative flex flex-col min-h-screen bg-[#07080a]/40 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* 60fps Scroll-Driven + Ambient Crossfade Underwater Canvas Background */}
      <ScrollCanvasBackground activeTab={activeTab} />

      {/* Main Content Viewport (Full Width — No Left Sidebar Clutter) */}
      <div
        className={`relative z-10 flex flex-col flex-1 min-w-0 ${
          activeTab === 'map' ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen'
        }`}
      >
        {/* Top Floating Glass Command Bar (Hidden in full-screen Map mode) */}
        {activeTab !== 'map' && (
          <Header
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            route={route}
          />
        )}

        {/* Dynamic Main Workspace Container */}
        <main
          className={`flex-1 w-full ${
            activeTab === 'map'
              ? 'h-screen h-[100dvh] p-0 m-0 overflow-hidden relative'
              : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16'
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

      {/* Global Floating About Corner Icon (Bottom-Right Corner) */}
      <button
        onClick={() => setIsAboutOpen(true)}
        aria-label="เกี่ยวกับระบบ"
        title="เกี่ยวกับระบบ MESURV"
        className="fixed bottom-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-[#111318]/85 hover:bg-indigo-600/20 backdrop-blur-xl border border-white/[0.10] hover:border-indigo-500/40 text-slate-400 hover:text-indigo-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all micro-press focus-ring"
      >
        <Info className="w-4 h-4 stroke-[2]" />
      </button>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}

export default App;
