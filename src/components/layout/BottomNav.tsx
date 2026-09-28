import React from 'react';
import { Map, Calculator, BookOpen, Info } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
  setActiveTab: (tab: 'knowledge' | 'calculator' | 'map') => void;
  onOpenAbout?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAbout,
}) => {
  const tabs = [
    {
      id: 'map' as const,
      label: 'แผนที่',
      icon: Map,
      onClick: () => setActiveTab('map'),
      isActive: activeTab === 'map',
    },
    {
      id: 'calculator' as const,
      label: 'คำนวณ',
      icon: Calculator,
      onClick: () => setActiveTab('calculator'),
      isActive: activeTab === 'calculator',
    },
    {
      id: 'knowledge' as const,
      label: 'คู่มือ',
      icon: BookOpen,
      onClick: () => setActiveTab('knowledge'),
      isActive: activeTab === 'knowledge',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#111113]/95 backdrop-blur-md border-t border-black/[0.08] dark:border-white/[0.08] pb-[env(safe-area-inset-bottom)] transition-colors select-none"
    >
      <div className="grid grid-cols-3 h-14 min-h-[56px] max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-colors micro-press ${
                tab.isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 mb-0.5 ${
                    tab.isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                )}
              </div>
              <span className="text-[11px] leading-normal">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
