import React from 'react';

interface ScrollCanvasBackgroundProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
}

/**
 * Apple Pro / Space Titanium Background System
 * Pure #000000 obsidian canvas with frosted titanium horizon gradient and zero visual noise.
 * Eliminates scroll dizziness while providing world-class luxury and reading ergonomics.
 */
export const ScrollCanvasBackground: React.FC<ScrollCanvasBackgroundProps> = ({
  activeTab,
}) => {
  if (activeTab === 'map') {
    return null;
  }

  return (
    <div 
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#000000]"
    >
      {/* Apple Pro Space Titanium Top Ambient Horizon Sheen */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] pointer-events-none opacity-60"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255, 255, 255, 0.05) 0%, rgba(99, 102, 241, 0.03) 40%, transparent 80%)'
        }}
      />

      {/* Titanium Subtle Vignette for Edge Depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, transparent 40%, rgba(0, 0, 0, 0.7) 100%)'
        }}
      />
    </div>
  );
};
