import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollCanvasBackgroundProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
  isDark: boolean;
}

const TOTAL_FRAMES = 120;
const LERP_FACTOR = 0.08; // Smooth inertia easing

export const ScrollCanvasBackground: React.FC<ScrollCanvasBackgroundProps> = ({
  activeTab,
  isDark
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const lastDrawnFrameRef = useRef<number>(-1);
  const [isFirstFrameReady, setIsFirstFrameReady] = useState(false);

  // Preload frames
  useEffect(() => {
    const images: HTMLImageElement[] = [];

    // Preload first frame immediately with priority
    const firstImg = new Image();
    firstImg.src = '/bg-frames/frame_000.webp';
    firstImg.onload = () => {
      setIsFirstFrameReady(true);
    };
    images[0] = firstImg;

    // Load remaining frames
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const numStr = String(i).padStart(3, '0');
      img.src = `/bg-frames/frame_${numStr}.webp`;
      images[i] = img;
    }

    imagesRef.current = images;

    return () => {
      imagesRef.current = [];
    };
  }, []);

  // Responsive Canvas Sizing & Draw Cover
  const drawFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[frameIdx];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const w = displayWidth;
    const h = displayHeight;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = w / h;

    let renderW = w;
    let renderH = h;
    let offsetX = 0;
    let offsetY = 0;

    // Object-fit: cover calculation
    if (canvasRatio > imgRatio) {
      renderW = w;
      renderH = w / imgRatio;
      offsetY = (h - renderH) / 2;
    } else {
      renderH = h;
      renderW = h * imgRatio;
      offsetX = (w - renderW) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    ctx.restore();

    lastDrawnFrameRef.current = frameIdx;
  }, []);

  // Update target progress on scroll
  useEffect(() => {
    if (activeTab === 'map') return;

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) {
        targetProgressRef.current = 0;
      } else {
        const current = window.scrollY;
        targetProgressRef.current = Math.min(1, Math.max(0, current / maxScroll));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [activeTab]);

  // Smooth Lerp Animation Loop
  useEffect(() => {
    if (activeTab === 'map') {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      return;
    }

    const tick = () => {
      // Lerp easing: current = current + (target - current) * factor
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0001) {
        currentProgressRef.current += diff * LERP_FACTOR;
      } else {
        currentProgressRef.current = targetProgressRef.current;
      }

      const progress = currentProgressRef.current;
      const targetFrame = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(progress * (TOTAL_FRAMES - 1)))
      );

      if (targetFrame !== lastDrawnFrameRef.current || !lastDrawnFrameRef.current) {
        drawFrame(targetFrame);
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [activeTab, drawFrame, isFirstFrameReady]);

  // Initial draw when first frame is ready
  useEffect(() => {
    if (isFirstFrameReady && activeTab !== 'map') {
      drawFrame(0);
    }
  }, [isFirstFrameReady, activeTab, drawFrame]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (lastDrawnFrameRef.current >= 0) {
        drawFrame(lastDrawnFrameRef.current);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawFrame]);

  if (activeTab === 'map') {
    return null;
  }

  return (
    <div 
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* Scroll-Driven Dynamic Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover block"
      />

      {/* Atmospheric Contrast Overlays for Glassmorphism & Readability */}
      {/* Dark Mode Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/60 dark:bg-[#07090e]/75 backdrop-blur-[0.5px] transition-colors duration-300"
      />

      {/* Light Mode Soft Contrast Overlay */}
      {!isDark && (
        <div 
          className="absolute inset-0 bg-white/70 backdrop-blur-[0.5px] mix-blend-soft-light transition-opacity duration-300"
        />
      )}

      {/* Vignette Depth Gradient */}
      <div 
        className="absolute inset-0 bg-radial-vignette opacity-50 dark:opacity-70 pointer-events-none"
      />
    </div>
  );
};
