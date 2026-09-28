import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollCanvasBackgroundProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
}

const TOTAL_FRAMES = 240;
const LERP_FACTOR = 0.065; // Silky-smooth inertia factor

export const ScrollCanvasBackground: React.FC<ScrollCanvasBackgroundProps> = ({
  activeTab,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>(new Array(TOTAL_FRAMES));
  const targetScrollRef = useRef<number>(0);
  const currentScrollRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const [isFirstFrameReady, setIsFirstFrameReady] = useState(false);

  // Tiered Progressive Frame Preloader (240 frames)
  useEffect(() => {
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    let isCancelled = false;

    const loadFrame = (idx: number): Promise<void> => {
      return new Promise((resolve) => {
        if (isCancelled) {
          resolve();
          return;
        }
        const img = new Image();
        img.decoding = 'async';
        const numStr = String(idx).padStart(3, '0');
        img.src = `/bg-frames/frame_${numStr}.webp`;
        img.onload = () => {
          if (!isCancelled) {
            images[idx] = img;
            if (idx === 0) setIsFirstFrameReady(true);
          }
          resolve();
        };
        img.onerror = () => resolve();
      });
    };

    // Tier 1: Frame 0 immediately
    loadFrame(0).then(async () => {
      // Tier 2: Every 6th keyframe for instant full-range scrubbing
      const keyframes: number[] = [];
      const infillFrames: number[] = [];
      for (let i = 1; i < TOTAL_FRAMES; i++) {
        if (i % 6 === 0) keyframes.push(i);
        else infillFrames.push(i);
      }

      // Load keyframes in parallel batches of 8
      for (let i = 0; i < keyframes.length; i += 8) {
        if (isCancelled) return;
        await Promise.all(keyframes.slice(i, i + 8).map(loadFrame));
      }

      // Tier 3: Load remaining 200 sub-frames in batches of 12
      for (let i = 0; i < infillFrames.length; i += 12) {
        if (isCancelled) return;
        await Promise.all(infillFrames.slice(i, i + 12).map(loadFrame));
      }
    });

    imagesRef.current = images;

    return () => {
      isCancelled = true;
    };
  }, []);

  // Find nearest loaded frame fallback if a frame is still streaming
  const getNearestLoadedImage = (targetIdx: number): HTMLImageElement | null => {
    const imgs = imagesRef.current;
    const direct = imgs[targetIdx];
    if (direct && direct.complete && direct.naturalWidth > 0) {
      return direct;
    }
    for (let offset = 1; offset < 12; offset++) {
      const prev = targetIdx - offset;
      if (prev >= 0 && imgs[prev] && imgs[prev].complete && imgs[prev].naturalWidth > 0) {
        return imgs[prev];
      }
      const next = targetIdx + offset;
      if (next < TOTAL_FRAMES && imgs[next] && imgs[next].complete && imgs[next].naturalWidth > 0) {
        return imgs[next];
      }
    }
    return imgs[0] && imgs[0].complete ? imgs[0] : null;
  };

  // Sub-frame Alpha Crossfade Renderer (60fps smooth interpolation)
  const drawBlendedFrame = useCallback((exactFrame: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const frameFloor = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(exactFrame)));
    const frameCeil = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameFloor + 1));
    const frac = exactFrame - frameFloor;

    const imgA = getNearestLoadedImage(frameFloor);
    if (!imgA) return;
    const imgB = frac > 0.02 ? getNearestLoadedImage(frameCeil) : null;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    const targetW = Math.round(displayWidth * dpr);
    const targetH = Math.round(displayHeight * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const w = displayWidth;
    const h = displayHeight;
    const imgRatio = imgA.naturalWidth / imgA.naturalHeight;
    const canvasRatio = w / h;

    let renderW = w;
    let renderH = h;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      renderW = w;
      renderH = w / imgRatio;
      offsetY = (h - renderH) / 2;
    } else {
      renderH = h;
      renderW = h * imgRatio;
      offsetX = (w - renderW) / 2;
    }

    // Draw base frame A at 100% opacity
    ctx.globalAlpha = 1;
    ctx.drawImage(imgA, offsetX, offsetY, renderW, renderH);

    // Crossfade frame B on top with fractional alpha for butter-smooth motion
    if (imgB && imgB !== imgA && frac > 0.02) {
      ctx.globalAlpha = frac;
      ctx.drawImage(imgB, offsetX, offsetY, renderW, renderH);
    }

    ctx.restore();
  }, []);

  // Track scroll progress
  useEffect(() => {
    if (activeTab === 'map') return;

    const handleScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const current = window.scrollY;
      targetScrollRef.current = Math.min(1, Math.max(0, current / maxScroll));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [activeTab]);

  // 60fps Continuous Lerp + Subtle Ambient Drift Loop
  useEffect(() => {
    if (activeTab === 'map') {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      return;
    }

    const tick = (now: number) => {
      // Smooth Lerp towards scroll target
      const diff = targetScrollRef.current - currentScrollRef.current;
      if (Math.abs(diff) > 0.00005) {
        currentScrollRef.current += diff * LERP_FACTOR;
      } else {
        currentScrollRef.current = targetScrollRef.current;
      }

      // Gentle ambient underwater breathing drift (±3.5% of timeline) so it's alive even when idle
      const ambientWave = (Math.sin(now * 0.00045) + 1) * 0.5 * 0.07;
      const combinedProgress = Math.min(
        1,
        Math.max(0, currentScrollRef.current * 0.93 + ambientWave)
      );

      const exactFrame = combinedProgress * (TOTAL_FRAMES - 1);
      drawBlendedFrame(exactFrame);

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [activeTab, drawBlendedFrame, isFirstFrameReady]);

  if (activeTab === 'map') {
    return null;
  }

  return (
    <div 
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#07080a]"
    >
      {/* 60fps Crossfade Underwater Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover block opacity-90"
      />

      {/* Deep Ocean Raycast × Linear Dark Glassmorphic Scrim */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#07080a]/70 via-[#07090f]/65 to-[#07080a]/85"
      />

      {/* Subtle Ambient Top Indigo/Cyan Specular Glow */}
      <div 
        className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[360px] rounded-full bg-indigo-500/[0.08] blur-[120px]"
      />
    </div>
  );
};
