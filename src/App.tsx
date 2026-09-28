import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { KnowledgeHub } from './components/knowledge/KnowledgeHub';
import { CalculatorHub } from './components/calculator/CalculatorHub';
import { WebMap } from './components/map/WebMap';

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

  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('mesurv_theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return false; // Default to luminous, bright, eye-friendly light theme
  });

  const [externalMapPoint, setExternalMapPoint] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
      localStorage.setItem('mesurv_theme', next ? 'dark' : 'light');
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
    <div className={`flex flex-col bg-[#f8fafc] dark:bg-[#0b0f17] text-slate-800 dark:text-slate-100 font-sans leading-normal transition-colors duration-200 ${
      activeTab === 'map' ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen'
    }`}>
      
      {/* Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className={`flex-1 w-full ${
        activeTab === 'map' 
          ? 'h-[calc(100vh-4rem)] h-[calc(100dvh-4rem)] p-0 m-0 overflow-hidden relative' 
          : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-20 md:pb-8'
      }`}>
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

      {/* Mobile Bottom Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Footer: Hidden on map mode to lock full-screen interactive canvas without page scrolling */}
      {activeTab !== 'map' && <Footer />}

    </div>
  );
}

export default App;
