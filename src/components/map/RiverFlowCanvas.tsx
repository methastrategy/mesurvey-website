import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DirectedRiverSegment, RiverGaugeStation, HydroAlertLevel } from '../../types/disaster';

interface RiverFlowCanvasProps {
  map: L.Map | null;
  segments: DirectedRiverSegment[];
  gauges: RiverGaugeStation[];
  visible: boolean;
  selectedRiverId?: string | null;
  connectedRiverIds?: Set<string>;
}

interface ProjectedSegment {
  id: string;
  streamOrder: number;
  alertLevel: HydroAlertLevel;
  speedPxPerFrame: number;
  focusAlphaMultiplier: number;
  focusRadiusMultiplier: number;
  points: { x: number; y: number }[];
  cumLengths: number[];
  totalLengthPx: number;
  particles: { offsetNorm: number; radius: number; alpha: number }[];
}

function getAlertColor(level: HydroAlertLevel): { core: string; glow: string } {
  switch (level) {
    case 'critical':
      return { core: '#fef2f2', glow: '#ef4444' };
    case 'warning':
      return { core: '#fffbeb', glow: '#f59e0b' };
    case 'watch':
      return { core: '#f0f9ff', glow: '#38bdf8' };
    case 'drought':
      return { core: '#e7e5e4', glow: '#a8a29e' };
    case 'normal':
    default:
      return { core: '#ecfeff', glow: '#06b6d4' };
  }
}

function interpolatePointOnPolyline(
  points: { x: number; y: number }[],
  cumLengths: number[],
  targetDist: number
): { x: number; y: number; angleRad: number } | null {
  if (points.length < 2) return null;
  const clamped = Math.max(0, Math.min(targetDist, cumLengths[cumLengths.length - 1]));

  let segIdx = 0;
  for (let i = 0; i < cumLengths.length - 1; i++) {
    if (clamped >= cumLengths[i] && clamped <= cumLengths[i + 1]) {
      segIdx = i;
      break;
    }
  }

  const p0 = points[segIdx];
  const p1 = points[segIdx + 1] || p0;
  const segLen = cumLengths[segIdx + 1] - cumLengths[segIdx];
  const t = segLen > 0.0001 ? (clamped - cumLengths[segIdx]) / segLen : 0;

  return {
    x: p0.x + (p1.x - p0.x) * t,
    y: p0.y + (p1.y - p0.y) * t,
    angleRad: Math.atan2(p1.y - p0.y, p1.x - p0.x)
  };
}

export const RiverFlowCanvas: React.FC<RiverFlowCanvasProps> = ({
  map,
  segments,
  gauges,
  visible,
  selectedRiverId = null,
  connectedRiverIds
}) => {
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const projectedRef = useRef<ProjectedSegment[]>([]);

  useEffect(() => {
    if (!map || !visible) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
      return;
    }

    // Create custom Leaflet pane at z-index 450 (above overlayPane 400, below markerPane 600)
    let pane = map.getPane('riverFlowPane');
    if (!pane) {
      pane = map.createPane('riverFlowPane');
      pane.style.zIndex = '450';
      pane.style.pointerEvents = 'none';
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'mesurv-river-flow-canvas';
    canvas.style.pointerEvents = 'none';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    pane.appendChild(canvas);
    canvasRef.current = canvas;

    const gaugeMap = new Map<string, RiverGaugeStation>();
    gauges.forEach((g) => gaugeMap.set(g.id, g));

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const drawParticles = (advanceTime: boolean) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvasRef.current.width / dpr, canvasRef.current.height / dpr);

      for (const seg of projectedRef.current) {
        if (seg.totalLengthPx < 6) continue;
        const colors = getAlertColor(seg.alertLevel);

        for (const p of seg.particles) {
          if (advanceTime && !reducedMotion) {
            p.offsetNorm = (p.offsetNorm + seg.speedPxPerFrame / seg.totalLengthPx) % 1.0;
          }

          const headDist = p.offsetNorm * seg.totalLengthPx;
          const tailDist = Math.max(0, headDist - Math.min(20, seg.streamOrder * 3.4));

          const headPt = interpolatePointOnPolyline(seg.points, seg.cumLengths, headDist);
          const tailPt = interpolatePointOnPolyline(seg.points, seg.cumLengths, tailDist);

          if (!headPt || !tailPt) continue;

          const effectiveAlpha = Math.min(1, p.alpha * seg.focusAlphaMultiplier);
          const effectiveRadius = p.radius * seg.focusRadiusMultiplier;

          // Draw glowing comet tail
          ctx.beginPath();
          ctx.moveTo(tailPt.x, tailPt.y);
          ctx.lineTo(headPt.x, headPt.y);
          ctx.strokeStyle = colors.glow;
          ctx.lineWidth = effectiveRadius * 1.65;
          ctx.lineCap = 'round';
          ctx.globalAlpha = effectiveAlpha * 0.68;
          ctx.stroke();

          // Draw bright core droplet
          ctx.beginPath();
          ctx.arc(headPt.x, headPt.y, effectiveRadius, 0, Math.PI * 2);
          ctx.fillStyle = colors.core;
          ctx.globalAlpha = effectiveAlpha;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;
    };

    // Pre-project geographic coordinates to screen container coordinates ONLY on map move/zoom/resize
    const syncProjection = () => {
      if (!map || !canvasRef.current) return;
      const size = map.getSize();
      const zoom = map.getZoom();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetWidth = Math.max(1, Math.round(size.x * dpr));
      const targetHeight = Math.max(1, Math.round(size.y * dpr));

      // Only reallocate canvas backing store when viewport dimensions actually change
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        canvas.style.width = `${size.x}px`;
        canvas.style.height = `${size.y}px`;
      }

      const topLeftLayerPt = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(canvas, topLeftLayerPt);

      const newProjected: ProjectedSegment[] = [];

      for (const seg of segments) {
        const isSelected = Boolean(selectedRiverId && seg.id === selectedRiverId);
        const isConnected = Boolean(connectedRiverIds && connectedRiverIds.has(seg.id));

        // Progressive disclosure: hide minor canals at country-wide zoom (< 8) unless selected/connected
        if (!isSelected && !isConnected) {
          if (seg.waterwayType === 'canal' && zoom < 8) continue;
          if (seg.streamOrder <= 3 && zoom < 7) continue;
        }

        const pts: { x: number; y: number }[] = [];
        const cumLengths: number[] = [0];
        let totalLen = 0;

        for (let i = 0; i < seg.coordinates.length; i++) {
          const [lat, lng] = seg.coordinates[i];
          const cp = map.latLngToContainerPoint([lat, lng]);
          pts.push({ x: cp.x, y: cp.y });
          if (i > 0) {
            const dx = pts[i].x - pts[i - 1].x;
            const dy = pts[i].y - pts[i - 1].y;
            totalLen += Math.hypot(dx, dy);
            cumLengths.push(totalLen);
          }
        }

        if (totalLen < 6) continue;

        const linkedGauge = gaugeMap.get(seg.linkedGaugeId);
        const currentQ = linkedGauge?.currentDischargeCms ?? seg.bankfullCapacityCms * 0.55;
        const capacityQ = linkedGauge?.bankfullCapacityCms ?? seg.bankfullCapacityCms;
        const ratio = capacityQ > 0 ? currentQ / capacityQ : 0.55;
        const alertLevel: HydroAlertLevel = linkedGauge?.alertLevel ?? 'normal';

        // Velocity scales with real discharge ratio (0.85 px/frame to 3.4 px/frame)
        const speedPxPerFrame = Math.max(0.85, Math.min(3.4, 0.9 + ratio * 1.9));
        const particleCount = Math.max(8, Math.min(38, Math.floor(totalLen / 22)));

        // Contextual highlighting multipliers (Dim Others when a river is selected)
        let focusAlphaMultiplier = 1.0;
        let focusRadiusMultiplier = 1.0;
        if (selectedRiverId) {
          if (isSelected) {
            focusAlphaMultiplier = 1.25;
            focusRadiusMultiplier = 1.3;
          } else if (isConnected) {
            focusAlphaMultiplier = 1.05;
            focusRadiusMultiplier = 1.1;
          } else {
            focusAlphaMultiplier = 0.2;
            focusRadiusMultiplier = 0.85;
          }
        }

        const existingSeg = projectedRef.current.find((p) => p.id === seg.id);
        const particles = Array.from({ length: particleCount }, (_, idx) => {
          if (existingSeg && existingSeg.particles[idx]) {
            return existingSeg.particles[idx];
          }
          return {
            offsetNorm: idx / particleCount,
            radius: Math.max(1.8, seg.streamOrder * 0.52),
            alpha: 0.75 + (idx % 3) * 0.08
          };
        });

        newProjected.push({
          id: seg.id,
          streamOrder: seg.streamOrder,
          alertLevel,
          speedPxPerFrame,
          focusAlphaMultiplier,
          focusRadiusMultiplier,
          points: pts,
          cumLengths,
          totalLengthPx: totalLen,
          particles
        });
      }

      projectedRef.current = newProjected;
      // Redraw synchronously with L.DomUtil.setPosition to eliminate 1-frame pan/zoom offset
      drawParticles(false);
    };

    syncProjection();

    const renderFrame = () => {
      if (!canvasRef.current) return;
      drawParticles(true);
      if (!reducedMotion) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
      }
    };

    if (!reducedMotion) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
    }

    const handleMapMoveOrZoom = () => {
      syncProjection();
    };

    map.on('move', handleMapMoveOrZoom);
    map.on('moveend', handleMapMoveOrZoom);
    map.on('zoom', handleMapMoveOrZoom);
    map.on('zoomend', handleMapMoveOrZoom);
    map.on('viewreset', handleMapMoveOrZoom);
    map.on('resize', handleMapMoveOrZoom);

    return () => {
      map.off('move', handleMapMoveOrZoom);
      map.off('moveend', handleMapMoveOrZoom);
      map.off('zoom', handleMapMoveOrZoom);
      map.off('zoomend', handleMapMoveOrZoom);
      map.off('viewreset', handleMapMoveOrZoom);
      map.off('resize', handleMapMoveOrZoom);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      canvasRef.current = null;
    };
  }, [map, segments, gauges, visible, selectedRiverId, connectedRiverIds]);

  return null;
};
