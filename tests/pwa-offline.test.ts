import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('MESURV Phase 2 PWA & 100% Offline Field Mode Test Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const manifestPath = path.join(rootDir, 'public', 'manifest.json');
  const indexHtmlPath = path.join(rootDir, 'index.html');
  const viteConfigPath = path.join(rootDir, 'vite.config.ts');

  describe('Web App Manifest Verification', () => {
    it('manifest.json exists and is valid JSON', () => {
      expect(fs.existsSync(manifestPath)).toBe(true);
      const content = fs.readFileSync(manifestPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('enforces exact required application identity and localization', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.name).toBe('MESURV — Geomatics & Survey Engineering Platform');
      expect(manifest.short_name).toBe('MESURV');
      expect(manifest.description).toBe('แพลตฟอร์มวิศวกรรมสำรวจ คำนวณรังวัด และแผนที่ภูมิสารสนเทศ');
      expect(manifest.display).toBe('standalone');
      expect(manifest.start_url).toBe('./#/knowledge');
      expect(manifest.scope).toBe('./');
      expect(manifest.theme_color).toBe('#f7f5f2');
      expect(manifest.background_color).toBe('#f7f5f2');
    });

    it('contains comprehensive icons (192px, 512px, and SVG any/maskable)', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

      const icon192 = manifest.icons.find((i: any) => i.sizes === '192x192');
      expect(icon192).toBeDefined();
      expect(icon192.src).toBe('/pwa-192x192.png');
      expect(icon192.type).toBe('image/png');

      const icon512 = manifest.icons.find((i: any) => i.sizes === '512x512');
      expect(icon512).toBeDefined();
      expect(icon512.src).toBe('/pwa-512x512.png');
      expect(icon512.type).toBe('image/png');

      const iconSvg = manifest.icons.find((i: any) => i.type === 'image/svg+xml');
      expect(iconSvg).toBeDefined();
      expect(iconSvg.sizes).toBe('any');
      expect(iconSvg.purpose).toContain('maskable');
    });

    it('verifies all icon files physically exist with non-zero file sizes', () => {
      const icon192Path = path.join(rootDir, 'public', 'pwa-192x192.png');
      const icon512Path = path.join(rootDir, 'public', 'pwa-512x512.png');
      const iconSvgPath = path.join(rootDir, 'public', 'icon.svg');

      expect(fs.existsSync(icon192Path)).toBe(true);
      expect(fs.statSync(icon192Path).size).toBeGreaterThan(1000);

      expect(fs.existsSync(icon512Path)).toBe(true);
      expect(fs.statSync(icon512Path).size).toBeGreaterThan(2000);

      expect(fs.existsSync(iconSvgPath)).toBe(true);
      expect(fs.statSync(iconSvgPath).size).toBeGreaterThan(500);
    });
  });

  describe('HTML Shell & PWA Meta Headers Verification', () => {
    it('index.html references manifest, icons, and Apple mobile meta tags', () => {
      const html = fs.readFileSync(indexHtmlPath, 'utf-8');
      expect(html).toContain('rel="manifest"');
      expect(html).toContain('href="/manifest.json"');
      expect(html).toContain('apple-mobile-web-app-capable');
      expect(html).toContain('mobile-web-app-capable');
      expect(html).toContain('rel="apple-touch-icon"');
      expect(html).toContain('name="theme-color"');
    });
  });

  describe('Vite PWA & Workbox Caching Strategy Verification', () => {
    it('vite.config.ts imports and registers VitePWA plugin', () => {
      const config = fs.readFileSync(viteConfigPath, 'utf-8');
      expect(config).toContain("from 'vite-plugin-pwa'");
      expect(config).toContain('VitePWA({');
      expect(config).toContain("registerType: 'autoUpdate'");
    });

    it('vite.config.ts configures 4MB+ workbox size limit and precache patterns', () => {
      const config = fs.readFileSync(viteConfigPath, 'utf-8');
      expect(config).toContain('maximumFileSizeToCacheInBytes');
      expect(config).toContain('globPatterns');
      expect(config).toContain("navigateFallback: 'index.html'");
    });

    it('vite.config.ts defines specialized runtimeCaching for tiles, fonts, and telemetry', () => {
      const config = fs.readFileSync(viteConfigPath, 'utf-8');
      // Tile caching
      expect(config).toContain('mesurv-map-tiles-cache');
      expect(config).toContain('openstreetmap');
      expect(config).toContain('World_Imagery');
      // Google fonts
      expect(config).toContain('google-fonts-stylesheets');
      expect(config).toContain('google-fonts-webfonts');
      // Telemetry
      expect(config).toContain('mesurv-telemetry-cache');
      expect(config).toContain('NetworkFirst');
      // Leaflet CDN
      expect(config).toContain('leaflet-cdn-cache');
    });
  });

  describe('Network Status & Service Worker Module Verification', () => {
    it('src/pwa.ts defines initPWA and checks serviceWorker support safely', () => {
      const pwaCode = fs.readFileSync(path.join(rootDir, 'src', 'pwa.ts'), 'utf-8');
      expect(pwaCode).toContain('export function initPWA');
      expect(pwaCode).toContain("'serviceWorker' in navigator");
      expect(pwaCode).toContain('registerSW');
    });

    it('src/main.tsx invokes initPWA on initial bundle bootstrap', () => {
      const mainCode = fs.readFileSync(path.join(rootDir, 'src', 'main.tsx'), 'utf-8');
      expect(mainCode).toContain("import { initPWA } from './pwa'");
      expect(mainCode).toContain('initPWA();');
    });

    it('src/hooks/useNetworkStatus.ts exports useNetworkStatus and NetworkStatus interface', () => {
      const hookCode = fs.readFileSync(path.join(rootDir, 'src', 'hooks', 'useNetworkStatus.ts'), 'utf-8');
      expect(hookCode).toContain('export interface NetworkStatus');
      expect(hookCode).toContain('export function useNetworkStatus');
      expect(hookCode).toContain('isOnline');
      expect(hookCode).toContain('wasOffline');
      expect(hookCode).toContain('dismissBanner');
    });

    it('src/components/layout/OfflineBanner.tsx renders field mode banner with accessibility attributes', () => {
      const bannerCode = fs.readFileSync(path.join(rootDir, 'src', 'components', 'layout', 'OfflineBanner.tsx'), 'utf-8');
      expect(bannerCode).toContain('OfflineBanner');
      expect(bannerCode).toContain('role="alert"');
      expect(bannerCode).toContain('role="status"');
      expect(bannerCode).toContain('โหมดรังวัดออฟไลน์ภาคสนาม 100%');
      expect(bannerCode).toContain('OFFLINE FIELD READY');
      expect(bannerCode).toContain('กลับสู่ออนไลน์ (Back Online)');
    });
  });
});
