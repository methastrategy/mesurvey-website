import React from 'react';
import { Compass } from 'lucide-react';
import { DragonSurveyorLoader, type DragonLoaderSize } from '../common/DragonSurveyorLoader';

interface GeomaticsLoadingFallbackProps {
  label?: string;
  sublabel?: string;
  fullHeight?: boolean;
  styleMode?: 'mascot' | 'compass';
  size?: DragonLoaderSize;
  cycleMessages?: boolean;
}

export const GeomaticsLoadingFallback: React.FC<GeomaticsLoadingFallbackProps> = ({
  label = 'กำลังเชื่อมต่อและโหลดข้อมูลโมดูลวิศวกรรมสำรวจ...',
  sublabel = 'GEOMATICS ENGINE INITIALIZING',
  fullHeight = false,
  styleMode = 'mascot',
  size = 'md',
  cycleMessages = false,
}) => {
  if (styleMode === 'mascot') {
    return (
      <DragonSurveyorLoader
        size={size}
        label={label}
        sublabel={sublabel}
        fullHeight={fullHeight}
        cycleMessages={cycleMessages}
      />
    );
  }

  return (
    <div 
      className={`flex flex-col items-center justify-center w-full py-16 px-4 select-none anim-fade-in ${
        fullHeight ? 'h-full min-h-[100dvh]' : 'min-h-[60vh]'
      }`}
    >
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Outer Pulsing Reticle Ring */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-dashed animate-spin opacity-75"
          style={{ borderColor: 'var(--accent)', animationDuration: '8s' }}
        />
        {/* Inner Radar Ping Ring */}
        <div 
          className="absolute inset-2 rounded-full border animate-ping"
          style={{ borderColor: 'var(--accent)', opacity: 0.35, animationDuration: '2.4s' }}
        />
        {/* Center Geomatics Prism / Reticle Icon */}
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm relative z-10 transition-transform duration-200 micro-lift"
          style={{ 
            backgroundColor: 'var(--surface-2)', 
            borderColor: 'var(--border)', 
            borderWidth: 1, 
            borderStyle: 'solid' 
          }}
        >
          <Compass className="w-5 h-5 animate-pulse text-[var(--accent)]" />
        </div>
      </div>

      <div className="mt-5 text-center space-y-1.5 max-w-sm">
        <p className="text-sm font-bold text-[var(--text-1)] tracking-tight">
          {label}
        </p>
        <p className="text-[10px] font-mono tracking-widest text-[var(--accent)] font-semibold uppercase">
          {sublabel}
        </p>
      </div>
    </div>
  );
};

export default GeomaticsLoadingFallback;
