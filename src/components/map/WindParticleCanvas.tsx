import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { HydrometStationData } from '../../types/disaster';

interface WindParticleCanvasProps {
  map: L.Map | null;
  nodes: HydrometStationData[];
  visible: boolean;
  opacity?: number;
}

interface WindParticle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  speed: number;
  vx: number;
  vy: number;
}

export const WindParticleCanvas: React.FC<WindParticleCanvasProps> = ({
  map,
  nodes,
  visible,
  opacity = 0.85
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<WindParticle[]>([]);

  useEffect(() => {
    if (!map || !visible) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let size = map.getSize();

    // Resize canvas to match map viewport
    const resizeCanvas = () => {
      size = map.getSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size.x * dpr;
      canvas.height = size.y * dpr;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();

    // Default wind velocity if no nodes available (SW Monsoon ~225° into ~45° NE)
    const defaultWindRad = (45 * Math.PI) / 180;
    const defaultSpeed = 2.2;

    // Helper to interpolate wind velocity vector at pixel (px, py)
    const getWindAtPixel = (px: number, py: number): { vx: number; vy: number; speed: number } => {
      if (!nodes || nodes.length === 0) {
        return {
          vx: Math.cos(defaultWindRad) * defaultSpeed,
          vy: -Math.sin(defaultWindRad) * defaultSpeed,
          speed: 18
        };
      }

      const mapLatLng = map.containerPointToLatLng([px, py]);
      let totalWeight = 0;
      let sumVx = 0;
      let sumVy = 0;
      let avgSpeed = 15;

      for (const node of nodes) {
        const dLat = node.lat - mapLatLng.lat;
        const dLng = node.lng - mapLatLng.lng;
        const distSq = dLat * dLat + dLng * dLng + 0.04;
        const weight = 1 / distSq;

        // Note: windDirection10mDeg is azimuth wind is blowing FROM
        // Particle motion is in direction wind is blowing TO: (deg + 180)
        const motionDeg = (node.windDirection10mDeg + 180) % 360;
        const motionRad = ((90 - motionDeg) * Math.PI) / 180;
        const speedFactor = Math.max(1.0, Math.min(5.0, node.windSpeed10mKmh * 0.12));

        sumVx += Math.cos(motionRad) * speedFactor * weight;
        sumVy += -Math.sin(motionRad) * speedFactor * weight;
        totalWeight += weight;
        avgSpeed = node.windSpeed10mKmh;
      }

      if (totalWeight <= 0) {
        return {
          vx: Math.cos(defaultWindRad) * defaultSpeed,
          vy: -Math.sin(defaultWindRad) * defaultSpeed,
          speed: avgSpeed
        };
      }

      return {
        vx: sumVx / totalWeight,
        vy: sumVy / totalWeight,
        speed: avgSpeed
      };
    };

    // Initialize 180 streamlet particles
    const particleCount = 180;

    const spawnParticle = (): WindParticle => {
      const x = Math.random() * (size.x || 1);
      const y = Math.random() * (size.y || 1);
      const w = getWindAtPixel(x, y);
      return {
        x,
        y,
        age: Math.floor(Math.random() * 40),
        maxAge: 45 + Math.floor(Math.random() * 35),
        speed: w.speed,
        vx: w.vx,
        vy: w.vy
      };
    };

    particlesRef.current = Array.from({ length: particleCount }, () => spawnParticle());

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animFrameRef.current = requestAnimationFrame(animate);

      const dt = Math.min((currentTime - lastTime) / 16.6, 2.5);
      lastTime = currentTime;

      // Gentle fade for smooth streamlet motion trails
      ctx.fillStyle = 'rgba(15, 23, 42, 0.09)';
      ctx.fillRect(0, 0, size.x, size.y);

      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        const oldX = p.x;
        const oldY = p.y;

        const w = getWindAtPixel(p.x, p.y);
        p.vx = p.vx * 0.82 + w.vx * 0.18;
        p.vy = p.vy * 0.82 + w.vy * 0.18;

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.age++;

        // Draw particle streak
        const lifeRatio = p.age / p.maxAge;
        const alpha = Math.sin(lifeRatio * Math.PI) * opacity;

        // Color based on wind intensity (cyan -> emerald -> amber)
        ctx.strokeStyle =
          w.speed > 35
            ? `rgba(251, 146, 60, ${alpha})`
            : w.speed > 22
            ? `rgba(52, 211, 153, ${alpha})`
            : `rgba(56, 189, 248, ${alpha})`;

        ctx.beginPath();
        ctx.moveTo(oldX, oldY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Respawn when particle exits viewport or dies
        if (p.age >= p.maxAge || p.x < 0 || p.x > size.x || p.y < 0 || p.y > size.y) {
          particlesRef.current[i] = spawnParticle();
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    const onMapMove = () => {
      resizeCanvas();
      particlesRef.current = Array.from({ length: particleCount }, () => spawnParticle());
    };

    map.on('moveend resize zoomend', onMapMove);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      map.off('moveend resize zoomend', onMapMove);
    };
  }, [map, visible, nodes, opacity]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[420]"
      style={{ opacity }}
    />
  );
};
