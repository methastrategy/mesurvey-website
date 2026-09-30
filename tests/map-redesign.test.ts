import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseRouteHash } from '../src/utils/routing';
import { MAP_LAYOUT_CONFIGS } from '../src/components/map/layouts/types';
import { THAI_PRESET_PLACES } from '../src/core/memaps-services';

describe('MeMaps Dynamic Island Architecture & Production Verification', () => {
  describe('Dynamic Island Layout Contract', () => {
    it('provides dynamic-island as a primary layout configuration', () => {
      const dynamicIslandConfig = MAP_LAYOUT_CONFIGS.find(c => c.id === 'dynamic-island');
      expect(dynamicIslandConfig).toBeDefined();
      expect(dynamicIslandConfig?.name).toBe('Dynamic Island');
    });

    it('contains all core MeMaps Thai preset landmarks', () => {
      expect(THAI_PRESET_PLACES.length).toBeGreaterThanOrEqual(7);
      const ku = THAI_PRESET_PLACES.find(p => p.id === 'ku-survey');
      expect(ku).toBeDefined();
      expect(ku?.name).toContain('เกษตรศาสตร์');
    });
  });

  describe('Route Hash Handling for MeMaps', () => {
    it('correctly maps #/map to map tab', () => {
      const route = parseRouteHash('#/map');
      expect(route.tab).toBe('map');
    });

    it('gracefully redirects legacy redesign hashes to the main map', () => {
      const r1 = parseRouteHash('#/map-redesign');
      expect(r1.tab).toBe('map');

      const r2 = parseRouteHash('#/map-templates');
      expect(r2.tab).toBe('map');

      const r3 = parseRouteHash('#/redesign');
      expect(r3.tab).toBe('map');
    });
  });

  describe('Clean Production State (Zero Unused Design Prototype Cruft)', () => {
    it('verifies old standalone gallery prototype file is removed from public directory', () => {
      const publicGalleryPath = path.resolve(__dirname, '../public/map-redesign-gallery.html');
      expect(fs.existsSync(publicGalleryPath)).toBe(false);
    });

    it('verifies old MapRedesignGallery component file is removed from src/components/map', () => {
      const srcGalleryPath = path.resolve(__dirname, '../src/components/map/MapRedesignGallery.tsx');
      expect(fs.existsSync(srcGalleryPath)).toBe(false);
    });
  });
});
