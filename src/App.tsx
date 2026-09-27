import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { KnowledgeHub } from './components/knowledge/KnowledgeHub';
import { CalculatorHub } from './components/calculator/CalculatorHub';
import { WebMap } from './components/map/WebMap';

export function App() {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'calculator' | 'map'>('knowledge');
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

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('mesurv_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const handlePlotOnMap = (lat: number, lng: number, label: string) => {
    setExternalMapPoint({ lat, lng, label });
    setActiveTab('map');
  };

  return (
    <div className={`flex flex-col bg-[#f8fafc] dark:bg-[#0b0f17] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 ${
      activeTab === 'map' ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen'
    }`}>
      
      {/* Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className={`flex-1 w-full ${
        activeTab === 'map' 
          ? 'h-[calc(100vh-4rem)] h-[calc(100dvh-4rem)] p-0 m-0 overflow-hidden relative' 
          : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-20 md:pb-8'
      }`}>
        {activeTab === 'knowledge' && <KnowledgeHub onNavigateTab={setActiveTab} />}
        {activeTab === 'calculator' && <CalculatorHub onPlotOnMap={handlePlotOnMap} />}
        {activeTab === 'map' && <WebMap externalPoint={externalMapPoint} />}
      </main>

      {/* Mobile Bottom Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Footer: Hidden on map mode to lock full-screen interactive canvas without page scrolling */}
      {activeTab !== 'map' && <Footer />}

    </div>
  );
}

export default App;
