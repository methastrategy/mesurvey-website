import React from 'react';
import { BookOpen, Calculator, Map } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
  setActiveTab: (tab: 'knowledge' | 'calculator' | 'map') => void;
  onOpenAbout?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    {
      id: 'knowledge' as const,
      label: 'คู่มือสำรวจ',
      subLabel: 'Knowledge',
      icon: BookOpen,
      onClick: () => setActiveTab('knowledge'),
      isActive: activeTab === 'knowledge',
    },
    {
      id: 'calculator' as const,
      label: 'เครื่องมือคำนวณ',
      subLabel: 'Calculators',
      icon: Calculator,
      onClick: () => setActiveTab('calculator'),
      isActive: activeTab === 'calculator',
    },
    {
      id: 'map' as const,
      label: 'แผนที่สนาม',
      subLabel: 'WebGIS',
      icon: Map,
      onClick: () => setActiveTab('map'),
      isActive: activeTab === 'map',
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 transition-colors select-none border-t shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="grid grid-cols-3 h-14 max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={tab.onClick}
              aria-label={tab.label}
              aria-current={tab.isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 px-1 transition-all duration-150 micro-press rounded-xl ${
                tab.isActive
                  ? 'text-[var(--accent)] font-bold'
                  : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
              }`}
            >
              {/* Active Top Glow/Indicator Pill */}
              {tab.isActive && (
                <span
                  className="absolute top-0.5 w-8 h-1 rounded-full shadow-xs transition-all"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              )}

              <div className="relative mt-1">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    tab.isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                />
              </div>

              <span className="text-[11px] leading-tight tracking-tight mt-0.5 truncate w-full text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
