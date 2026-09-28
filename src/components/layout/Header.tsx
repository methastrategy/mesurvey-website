import React from 'react';
import { Compass, BookOpen, Calculator, Map, ChevronRight } from 'lucide-react';

interface HeaderProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
  setActiveTab: (tab: 'knowledge' | 'calculator' | 'map') => void;
  route?: {
    tab: 'knowledge' | 'calculator' | 'map';
    subTab?: 'coord' | 'traverse' | 'leveling' | 'area';
    topicId?: string;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  route,
}) => {
  const subTabNames: Record<string, string> = {
    coord: 'แปลงพิกัด',
    traverse: 'ปรับแก้วงรอบ',
    leveling: 'คำนวณระดับ',
    area: 'คำนวณเนื้อที่',
  };

  const currentSubTab = route?.subTab;
  const currentTopicId = route?.topicId;

  return (
    <header className="sticky top-0 z-40 h-14 w-full bg-[#07080a]/75 backdrop-blur-xl border-b border-white/[0.08] shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.04)] transition-colors select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-2">
        
        {/* Left: MESURV Brand Identity + Contextual Sub-Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setActiveTab('knowledge')}
            className="flex items-center gap-2.5 py-1.5 pr-2 rounded-lg text-left group micro-press focus-ring shrink-0"
            title="MESURV Geomatics Terminal"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 group-hover:text-indigo-300 group-hover:border-indigo-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all">
              <Compass className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">
                  MESURV
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
              </div>
              <span className="hidden sm:block text-[9px] font-mono tracking-widest uppercase text-slate-500 leading-none">
                Field Terminal
              </span>
            </div>
          </button>

          {/* Sub-level Breadcrumb Indicator (Desktop) */}
          {activeTab === 'calculator' && currentSubTab && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 truncate">
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <button
                onClick={() => setActiveTab('calculator')}
                className="hover:text-slate-300 transition-colors"
              >
                คำนวณ
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="text-indigo-400 font-semibold truncate">
                {subTabNames[currentSubTab] || currentSubTab}
              </span>
            </div>
          )}

          {activeTab === 'knowledge' && currentTopicId && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 truncate max-w-[220px]">
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <button
                onClick={() => setActiveTab('knowledge')}
                className="hover:text-slate-300 transition-colors shrink-0"
              >
                คู่มือ
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="text-indigo-400 font-mono text-[11px] truncate">
                {currentTopicId}
              </span>
            </div>
          )}
        </div>

        {/* Center: Raycast-Style Floating Segmented Switcher (2 Core Modules) */}
        <nav
          aria-label="Primary Workspace Switcher"
          className="flex items-center p-1 rounded-xl bg-[#111318]/90 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
        >
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] micro-press ${
              activeTab === 'knowledge'
                ? 'bg-indigo-600 text-white shadow-[0_2px_12px_rgba(99,102,241,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>คู่มือสำรวจ</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] micro-press ${
              activeTab === 'calculator'
                ? 'bg-indigo-600 text-white shadow-[0_2px_12px_rgba(99,102,241,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 shrink-0" />
            <span>เครื่องมือคำนวณ</span>
          </button>
        </nav>

        {/* Right: Compact Map Launcher Icon Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab(activeTab === 'map' ? 'knowledge' : 'map')}
            aria-label="แผนที่ภาคสนาม WebGIS"
            title={activeTab === 'map' ? 'กำลังเปิดแผนที่ WebGIS (กดเพื่อกลับหน้าคู่มือ)' : 'เปิดแผนที่ภาคสนาม WebGIS'}
            className={`relative inline-flex items-center justify-center gap-2 h-9 px-3 rounded-full border transition-all micro-press focus-ring ${
              activeTab === 'map'
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.25)]'
                : 'bg-[#111318]/90 hover:bg-[#181b22] border-white/[0.10] hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeTab === 'map' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${activeTab === 'map' ? 'bg-cyan-400' : 'bg-emerald-500'}`} />
            </span>
            <Map className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline text-[11px] font-mono font-semibold tracking-wide">
              {activeTab === 'map' ? 'MAP ACTIVE' : 'WebGIS'}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};
