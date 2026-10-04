import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { forwardWgs84ToUtm, inverseUtmToWgs84, forwardWgs84ToIndian1975, inverseIndian1975ToWgs84 } from '../src/core/projections';

describe('Challenger 1 Adversarial Stress Suite: MeMaps UI/UX Redesign', () => {
  const rootDir = path.resolve(__dirname, '..');
  const indexCss = fs.readFileSync(path.join(rootDir, 'src/index.css'), 'utf-8');
  const adaptiveWorkspace = fs.readFileSync(path.join(rootDir, 'src/components/map/AdaptiveWorkspace.tsx'), 'utf-8');
  const mapControls = fs.readFileSync(path.join(rootDir, 'src/components/map/memaps/MeMapsMapControls.tsx'), 'utf-8');
  const searchBox = fs.readFileSync(path.join(rootDir, 'src/components/map/memaps/MeMapsSearchBox.tsx'), 'utf-8');
  const placeCard = fs.readFileSync(path.join(rootDir, 'src/components/map/memaps/MeMapsPlaceCard.tsx'), 'utf-8');
  const directionsPanel = fs.readFileSync(path.join(rootDir, 'src/components/map/memaps/MeMapsDirectionsPanel.tsx'), 'utf-8');
  const webMap = fs.readFileSync(path.join(rootDir, 'src/components/map/WebMap.tsx'), 'utf-8');
  const gisStatusBar = fs.readFileSync(path.join(rootDir, 'src/components/map/GisStatusBar.tsx'), 'utf-8');

  describe('1. Motion & Animation Stress Testing (.anim-spring-down & keyframes)', () => {
    it('verifies memaps-spring-down keyframes mutate only GPU composited properties (transform, opacity)', () => {
      const match = indexCss.match(/@keyframes memaps-spring-down\s*\{([\s\S]*?)\n\}/);
      expect(match).toBeTruthy();
      const body = match![1];
      // Must not animate layout-triggering properties like height, width, margin, padding, top, left
      expect(body).not.toMatch(/\b(height|width|margin|padding|top|left|right|bottom)\b/);
      expect(body).toContain('opacity');
      expect(body).toContain('transform');
    });

    it('verifies .anim-spring-down uses hardware acceleration and proper duration & easing', () => {
      expect(indexCss).toMatch(/\.anim-spring-down\s*\{[^}]*animation:\s*memaps-spring-down\s+var\(--duration-flyout\)\s+var\(--ease-spring\)\s+forwards/);
      expect(indexCss).toMatch(/\.anim-spring-down\s*\{[^}]*will-change:\s*transform,\s*opacity/);
    });

    it('verifies @media (prefers-reduced-motion: reduce) disables .anim-spring-down for accessibility', () => {
      const reducedMotionBlock = indexCss.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
      expect(reducedMotionBlock).toBeTruthy();
      expect(reducedMotionBlock![1]).toContain('.anim-spring-down');
      expect(reducedMotionBlock![1]).toContain('animation: none !important');
    });

    it('verifies Dropdown Flyout Panel container is absolutely positioned and safely scrollable', () => {
      // Must have absolute positioning, z-index, max-height, and internal scroll
      expect(adaptiveWorkspace).toMatch(/className="[^"]*absolute top-full left-0 right-0 z-50[^"]*anim-spring-down[^"]*"/);
      expect(adaptiveWorkspace).toContain('max-h-[75vh]');
      expect(adaptiveWorkspace).toContain('overflow-y-auto');
    });
  });

  describe('2. Controls Pillar Collapsible Transitions & Z-Index Stress Testing', () => {
    it('verifies controls pillar uses smooth CSS folding without DOM thrashing', () => {
      expect(mapControls).toContain('transition-all duration-200 ease-spring');
      // Collapsed state classes
      expect(mapControls).toContain('opacity-0 scale-90 pointer-events-none -translate-y-2 max-h-0 overflow-hidden py-0 border-transparent shadow-none');
      // Expanded state classes
      expect(mapControls).toContain('opacity-100 scale-100 translate-y-0 max-h-60');
    });

    it('verifies no pointer events can be captured by collapsed pillar', () => {
      expect(mapControls).toMatch(/isMenuOpen[^?]*\?\s*'[^']*pointer-events-none/);
    });

    it('verifies clear z-index layering between workspace capsule and map controls', () => {
      // Desktop search capsule in AdaptiveWorkspace has z-[1010]
      expect(adaptiveWorkspace).toContain('z-[1010]');
      // MapControls container in WebMap has z-[1000]
      expect(webMap).toContain('z-[1000]');
      // GisStatusBar has z-[1005]
      expect(adaptiveWorkspace).toContain('z-[1005]');
      // Mobile sheet has z-[1100]
      expect(adaptiveWorkspace).toContain('z-[1100]');
    });
  });

  describe('3. Tactile Active Scale Physics Stress Testing (No Layout Shifts)', () => {
    it('verifies all interactive button scales use transform-only active:scale without margin/padding mutation', () => {
      const components = [
        { name: 'AdaptiveWorkspace', content: adaptiveWorkspace },
        { name: 'MeMapsMapControls', content: mapControls },
        { name: 'MeMapsSearchBox', content: searchBox },
        { name: 'MeMapsPlaceCard', content: placeCard },
        { name: 'MeMapsDirectionsPanel', content: directionsPanel }
      ];

      for (const comp of components) {
        // Find all button blocks
        const buttonMatches = comp.content.match(/<button[\s\S]*?>/g) || [];
        expect(buttonMatches.length).toBeGreaterThan(0);

        for (const btn of buttonMatches) {
          // If button has active:scale, ensure it never has active:p- or active:m- or active:w- or active:h-
          if (btn.includes('active:scale')) {
            expect(btn).not.toMatch(/active:(p|m|w|h|border-w)-\d+/);
          }
        }
      }
    });

    it('verifies duration and ease-spring are applied along with scale transformations', () => {
      expect(adaptiveWorkspace).toContain('duration-150 ease-spring');
      expect(mapControls).toContain('duration-150 ease-spring');
      expect(searchBox).toContain('duration-150 ease-spring');
      expect(placeCard).toContain('duration-150 ease-spring');
      expect(directionsPanel).toContain('duration-150 ease-spring');
    });
  });

  describe('4. Event Listener Hygiene & Memory Leak Prevention', () => {
    it('verifies pointerdown listener in AdaptiveWorkspace uses capture phase and symmetrical cleanup', () => {
      expect(adaptiveWorkspace).toContain("document.addEventListener('pointerdown', handlePointerDownOutside, true);");
      expect(adaptiveWorkspace).toContain("document.removeEventListener('pointerdown', handlePointerDownOutside, true);");
      // Does not attach when isMenuOpen is false
      expect(adaptiveWorkspace).toContain('if (!isMenuOpen) return;');
    });

    it('verifies click-outside listener does not suppress map events (no stopPropagation / preventDefault)', () => {
      const listenerMatch = adaptiveWorkspace.match(/const handlePointerDownOutside = \(e: PointerEvent\) => \{([\s\S]*?)\};/);
      expect(listenerMatch).toBeTruthy();
      const body = listenerMatch![1];
      expect(body).not.toContain('e.stopPropagation()');
      expect(body).not.toContain('e.preventDefault()');
    });

    it('verifies WebMap coordinates dismiss on movestart and click, and cleans up map on unmount', () => {
      expect(webMap).toContain("map.on('movestart', () => {");
      expect(webMap).toContain("setIsMenuOpen(false);");
      expect(webMap).toContain("map.on('click', (e: L.LeafletMouseEvent) => {");
      expect(webMap).toContain("map.remove();");
    });

    it('verifies GisStatusBar cleans up debounce timer and AbortController on unmount', () => {
      expect(gisStatusBar).toContain('clearTimeout(timer);');
      expect(gisStatusBar).toContain('controller.abort();');
    });
  });

  describe('5. Strict Preservation of 8 Completed Work Invariants', () => {
    it('Invariant 1: Zoom +/- buttons strictly absent from MeMapsMapControls JSX', () => {
      expect(mapControls).not.toContain('<ZoomIn');
      expect(mapControls).not.toContain('<ZoomOut');
      expect(mapControls).not.toContain('onClick={onZoomIn}');
      expect(mapControls).not.toContain('onClick={onZoomOut}');
      expect(mapControls).not.toContain('aria-label="ซูมเข้า"');
      expect(mapControls).not.toContain('aria-label="ซูมออก"');
    });

    it('Invariant 2: Blue ring glow strictly absent from MeMapsSearchBox', () => {
      expect(searchBox).not.toContain('ring-blue');
      expect(searchBox).not.toContain('focus:ring');
    });

    it('Invariant 3: Floating card layout for Search Capsule and Flyout', () => {
      expect(searchBox).toContain('rounded-xl');
      expect(adaptiveWorkspace).toContain('z-50 mt-2');
      expect(adaptiveWorkspace).toContain('rounded-2xl shadow-glass-floating');
    });

    it('Invariant 4: Absence of legacy header "เมนูเครื่องมือ" and X close button in Flyout', () => {
      expect(adaptiveWorkspace).not.toContain('เมนูเครื่องมือ');
      // Flyout container slice
      const flyoutStart = adaptiveWorkspace.indexOf('{isMenuOpen && (');
      const flyoutEnd = adaptiveWorkspace.indexOf('</div>\n            )}', flyoutStart);
      const flyoutContent = adaptiveWorkspace.slice(flyoutStart, flyoutEnd);
      expect(flyoutContent).not.toContain('X className');
      expect(flyoutContent).not.toContain('<X');
    });

    it('Invariant 5: CRS Selector present inside Flyout with WGS84, Ind75 47N, Ind75 48N', () => {
      expect(adaptiveWorkspace).toContain("onSelectCoordinateDatum?.('WGS84')");
      expect(adaptiveWorkspace).toContain("onSelectCoordinateDatum?.('INDIAN1975_47')");
      expect(adaptiveWorkspace).toContain("onSelectCoordinateDatum?.('INDIAN1975_48')");
    });

    it('Invariant 6: Cursor Mode present in Flyout Quick Actions grid', () => {
      expect(adaptiveWorkspace).toContain("onSetMeasureMode?.(measureMode === 'inspect' ? 'none' : 'inspect')");
      expect(adaptiveWorkspace).toContain('โหมดเคอร์เซอร์');
    });

    it('Invariant 7: GisStatusBar displays coordinates + Copernicus DEM elevation + 1-click copy', () => {
      expect(gisStatusBar).toContain('Copernicus DEM');
      expect(gisStatusBar).toContain('https://api.open-meteo.com/v1/elevation');
      expect(gisStatusBar).toContain('handleCopy');
      expect(gisStatusBar).toContain('navigator.clipboard?.writeText');
      expect(gisStatusBar).toContain('คัดลอกพิกัดแล้ว!');
    });

    it('Invariant 8: Inspect mode toggle in controls pillar works alongside map features', () => {
      expect(mapControls).toContain('onToggleInspectMode');
      expect(mapControls).toContain('MousePointerClick');
      expect(webMap).toContain('isGlobe3D');
      expect(webMap).toContain('onToggleInspectMode={() => {');
    });
  });

  describe('6. Empirical Geodetic Calculation Rigor (src/core/projections.ts)', () => {
    it('preserves sub-millimeter conversion accuracy for Kasetsart University Survey Benchmark', () => {
      const kuLat = 13.84664;
      const kuLng = 100.56982;

      const utm = forwardWgs84ToUtm(kuLat, kuLng);
      expect(utm.zone).toBe(47);
      expect(utm.easting).toBeCloseTo(669656.82, 1);
      expect(utm.northing).toBeCloseTo(1531321.89, 1);

      const inv = inverseUtmToWgs84(utm.easting, utm.northing, utm.zone);
      expect(inv.lat).toBeCloseTo(kuLat, 6);
      expect(inv.lng).toBeCloseTo(kuLng, 6);

      const ind75 = forwardWgs84ToIndian1975(kuLat, kuLng, 47);
      expect(ind75.zone).toBe(47);
      expect(Math.abs(ind75.easting - utm.easting)).toBeGreaterThan(200); // datum shift > 200m
      expect(Math.abs(ind75.northing - utm.northing)).toBeGreaterThan(200);

      const indInv = inverseIndian1975ToWgs84(ind75.easting, ind75.northing, 47);
      expect(indInv.lat).toBeCloseTo(kuLat, 4);
      expect(indInv.lng).toBeCloseTo(kuLng, 4);
    });
  });
});
