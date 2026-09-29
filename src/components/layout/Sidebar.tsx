import React from 'react';
import { Map, Calculator, BookOpen, Info, ChevronLeft, ChevronRight, Compass } from 'lucide-react';

interface SidebarProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
  setActiveTab: (tab: 'knowledge' | 'calculator' | 'map') => void;
  onOpenAbout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAbout,
  isCollapsed,
  setIsCollapsed,
}) => {
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mesurv-sidebar-collapsed', String(next));
      } catch (e) {
        // Ignore storage errors in restricted contexts
      }
      // Notify Leaflet and other canvas modules of viewport change
      window.dispatchEvent(new Event('resize'));
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 220);
      return next;
    });
  };

  const navItems = [
    {
      id: 'map' as const,
      label: 'แผนที่ WebGIS',
      shortLabel: 'แผนที่',
      icon: Map,
      onClick: () => setActiveTab('map'),
      isActive: activeTab === 'map',
    },
    {
      id: 'calculator' as const,
      label: 'เครื่องมือคำนวณ',
      shortLabel: 'คำนวณ',
      icon: Calculator,
      onClick: () => setActiveTab('calculator'),
      isActive: activeTab === 'calculator',
    },
    {
      id: 'knowledge' as const,
      label: 'คู่มือสำรวจ',
      shortLabel: 'คู่มือ',
      icon: BookOpen,
      onClick: () => setActiveTab('knowledge'),
      isActive: activeTab === 'knowledge',
    },
  ];

  return (
    <aside
      aria-label="Sidebar Navigation"
      className={`hidden lg:flex flex-col fixed top-0 bottom-0 left-0 z-40 bg-white/80 dark:bg-[#111113]/85 backdrop-blur-xl border-r border-black/[0.08] dark:border-white/[0.08] transition-[width] duration-200 ease-in-out select-none ${
        isCollapsed ? 'w-[56px]' : 'w-[240px]'
      }`}
    >
      {/* Sidebar Header / Logo */}
      <div className="h-12 flex items-center px-3 border-b border-black/[0.08] dark:border-white/[0.08] shrink-0">
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center w-full rounded-md text-left transition-colors micro-press ${
            isCollapsed ? 'justify-center py-1.5' : 'space-x-2.5 py-1.5 px-1.5'
          }`}
          title="MESURV Geomatics Terminal"
        >
          <div className="w-7 h-7 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Compass className="w-4 h-4 stroke-[2.2]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden whitespace-nowrap">
              <div className="flex items-center space-x-1">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100 font-sans">
                  MESURV
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              </div>
              <span className="text-[10px] tracking-wider font-mono text-slate-400 dark:text-slate-500 uppercase leading-none">
                Geomatics Platform
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-md min-h-[44px] text-xs font-medium transition-all micro-press ${
                isCollapsed ? 'justify-center px-0' : 'px-2.5 space-x-3'
              } ${
                item.isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border-l-2 border-indigo-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161618]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  item.isActive
                    ? 'text-indigo-600 dark:text-indigo-400 stroke-[2.2]'
                    : 'stroke-2'
                }`}
              />
              {!isCollapsed && (
                <span className="truncate leading-normal">{item.label}</span>
              )}
            </button>
          );
        })}

      </nav>

      {/* Sidebar Footer / Collapse Toggle */}
      <div className={`p-2 border-t border-black/[0.08] dark:border-white/[0.08] shrink-0 flex items-center gap-1 ${isCollapsed ? 'flex-col' : ''}`}>
        <button
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'ขยายแถบนำทาง' : 'ย่อแถบนำทาง'}
          title={isCollapsed ? 'ขยายแถบนำทาง' : 'ย่อแถบนำทาง'}
          className={`flex-1 flex items-center rounded-md min-h-[44px] min-w-[44px] text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#161618] transition-colors micro-press ${
            isCollapsed ? 'justify-center' : 'px-2.5 space-x-2'
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 stroke-[2]" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 stroke-[2]" />
              <span>ย่อแถบนำทาง</span>
            </>
          )}
        </button>

        {/* About System — tiny ghost circle icon */}
        <button
          onClick={onOpenAbout}
          aria-label="เกี่ยวกับระบบ"
          title="เกี่ยวกับระบบ"
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#161618] transition-colors micro-press shrink-0"
        >
          <Info className="w-3.5 h-3.5 stroke-[1.8]" />
        </button>
      </div>
    </aside>
  );
};
