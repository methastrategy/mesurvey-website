import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('MeMaps UI/UX Redesign — Fluid Spring Motion & Geodetic Continuity', () => {
  const adaptiveWorkspacePath = path.resolve(__dirname, '../src/components/map/AdaptiveWorkspace.tsx');
  const mapControlsPath = path.resolve(__dirname, '../src/components/map/memaps/MeMapsMapControls.tsx');
  const searchBoxPath = path.resolve(__dirname, '../src/components/map/memaps/MeMapsSearchBox.tsx');
  const placeCardPath = path.resolve(__dirname, '../src/components/map/memaps/MeMapsPlaceCard.tsx');
  const directionsPanelPath = path.resolve(__dirname, '../src/components/map/memaps/MeMapsDirectionsPanel.tsx');
  const webMapPath = path.resolve(__dirname, '../src/components/map/WebMap.tsx');
  const gisStatusBarPath = path.resolve(__dirname, '../src/components/map/GisStatusBar.tsx');

  // =========================================================================
  // 1. ADAPTIVE WORKSPACE SPRING FLYOUT & CLICK-OUTSIDE
  // =========================================================================
  describe('AdaptiveWorkspace Spring Motion & Architecture', () => {
    const code = fs.readFileSync(adaptiveWorkspacePath, 'utf8');

    it('upgrades Dropdown Flyout Panel container with .anim-spring-down and shadow-glass-floating', () => {
      expect(code).toContain('anim-spring-down');
      expect(code).toContain('shadow-glass-floating');
      expect(code).not.toContain('animate-in fade-in slide-in-from-top-2');
    });

    it('declares onCloseMenu in AdaptiveWorkspaceProps and destructures it', () => {
      expect(code).toMatch(/onCloseMenu\?:\s*\(\)\s*=>\s*void;/);
      expect(code).toContain('onCloseMenu,');
    });

    it('implements pointerdown capture phase listener for robust mobile touch and desktop dismiss', () => {
      expect(code).toContain("document.addEventListener('pointerdown', handlePointerDownOutside, true)");
      expect(code).toContain("document.removeEventListener('pointerdown', handlePointerDownOutside, true)");
      expect(code).toMatch(/if\s*\(onCloseMenu\)\s*\{\s*onCloseMenu\(\);\s*\}\s*else\s*\{\s*handleToggleMenu\(\);\s*\}/);
    });

    it('applies spring scale micro-interactions (hover:scale-[1.02] active:scale-95 duration-150 ease-spring) to Quick Actions', () => {
      expect(code).toContain('hover:scale-[1.02] active:scale-95 duration-150 ease-spring');
      // Verify all 4 quick action buttons have active:scale-95
      const quickActionsBlock = code.slice(code.indexOf('เครื่องมือสำรวจ'), code.indexOf('ระบบพิกัด (Datum'));
      const activeScalesCount = (quickActionsBlock.match(/active:scale-95/g) || []).length;
      expect(activeScalesCount).toBeGreaterThanOrEqual(4);
    });

    it('applies spring scale micro-interactions to CRS Datum selector buttons', () => {
      const crsBlock = code.slice(code.indexOf('ระบบพิกัด (Datum'));
      const activeScalesCount = (crsBlock.match(/active:scale-95/g) || []).length;
      expect(activeScalesCount).toBeGreaterThanOrEqual(3);
    });
  });

  // =========================================================================
  // 2. CONTROLS PILLAR FLUID SPRING FOLDING
  // =========================================================================
  describe('MeMapsMapControls Fluid Spring Folding & Micro-Interactions', () => {
    const code = fs.readFileSync(mapControlsPath, 'utf8');

    it('replaces abrupt unmounting with fluid CSS spring collapse/expansion transitions', () => {
      expect(code).not.toContain('{!isMenuOpen && (');
      expect(code).toContain('transition-all duration-200 ease-spring');
      expect(code).toContain('isMenuOpen');
      expect(code).toContain('opacity-0 scale-90 pointer-events-none -translate-y-2 max-h-0 overflow-hidden');
      expect(code).toContain('opacity-100 scale-100 translate-y-0 max-h-60');
    });

    it('adds tactile active press scales to Compass, Locate Me, and Saved Places buttons', () => {
      expect(code).toMatch(/onResetNorth[\s\S]*?hover:scale-105 active:scale-90/);
      expect(code).toMatch(/onLocateMe[\s\S]*?hover:scale-105 active:scale-90/);
      expect(code).toMatch(/onToggleSavedPlaces[\s\S]*?hover:scale-105 active:scale-90/);
    });
  });

  // =========================================================================
  // 3. SEARCH BOX TACTILE BUTTON INTERACTIONS
  // =========================================================================
  describe('MeMapsSearchBox Micro-Interactions', () => {
    const code = fs.readFileSync(searchBoxPath, 'utf8');

    it('adds active scale transitions (hover:scale-110 active:scale-90) to Hamburger Menu button', () => {
      expect(code).toMatch(/onToggleMenu[\s\S]*?hover:scale-110 active:scale-90/);
    });

    it('adds active scale transitions to Search icon button', () => {
      expect(code).toMatch(/triggerFullSearch[\s\S]*?hover:scale-110 active:scale-90/);
    });

    it('adds active scale transitions to Clear input button', () => {
      expect(code).toMatch(/onClear[\s\S]*?hover:scale-110 active:scale-90/);
    });
  });

  // =========================================================================
  // 4. PLACE CARD & DIRECTIONS PANEL TACTILE PRESS SCALES
  // =========================================================================
  describe('MeMapsPlaceCard and DirectionsPanel Micro-Interactions', () => {
    const placeCardCode = fs.readFileSync(placeCardPath, 'utf8');
    const directionsCode = fs.readFileSync(directionsPanelPath, 'utf8');

    it('adds active scale transitions to MeMapsPlaceCard buttons', () => {
      expect(placeCardCode).toMatch(/onClose[\s\S]*?active:scale-90/);
      expect(placeCardCode).toMatch(/copyWgs[\s\S]*?active:scale-90/);
      expect(placeCardCode).toMatch(/copyUtm[\s\S]*?active:scale-90/);
      expect(placeCardCode).toMatch(/onSetAsDestination[\s\S]*?active:scale-95/);
      expect(placeCardCode).toMatch(/onSetAsOrigin[\s\S]*?active:scale-95/);
      expect(placeCardCode).toMatch(/onSendToSurvey[\s\S]*?active:scale-95/);
    });

    it('adds active scale transitions to MeMapsDirectionsPanel travel modes, swap, and route calculation', () => {
      expect(directionsCode).toMatch(/handleModeChange\('driving'\)[\s\S]*?active:scale-95/);
      expect(directionsCode).toMatch(/handleModeChange\('walking'\)[\s\S]*?active:scale-95/);
      expect(directionsCode).toMatch(/handleModeChange\('cycling'\)[\s\S]*?active:scale-95/);
      expect(directionsCode).toMatch(/handleSwap[\s\S]*?active:scale-90/);
      expect(directionsCode).toMatch(/calculateRoute[\s\S]*?active:scale-95/);
    });
  });

  // =========================================================================
  // 5. WEBMAP COORDINATION & DISMISS HANDLERS
  // =========================================================================
  describe('WebMap Coordination & Dismiss Handlers', () => {
    const code = fs.readFileSync(webMapPath, 'utf8');

    it('passes onCloseMenu prop to AdaptiveWorkspace', () => {
      expect(code).toContain('onCloseMenu={() => setIsMenuOpen(false)}');
    });

    it('dismisses flyout menu on map click and map movestart', () => {
      expect(code).toMatch(/map\.on\('movestart',\s*\(\)\s*=>\s*\{\s*setIsMenuOpen\(false\);/);
      expect(code).toMatch(/map\.on\('click',\s*\(e:\s*L\.LeafletMouseEvent\)\s*=>\s*\{\s*setIsMenuOpen\(false\);/);
    });
  });

  // =========================================================================
  // 6. PRESERVATION OF 8 COMPLETED WORK CONSTRAINTS
  // =========================================================================
  describe('Preservation of 8 Completed Work Invariants', () => {
    it('1. Absence of zoom +/- buttons in MeMapsMapControls', () => {
      const controlsCode = fs.readFileSync(mapControlsPath, 'utf8');
      expect(controlsCode).not.toContain('<ZoomIn');
      expect(controlsCode).not.toContain('<ZoomOut');
      expect(controlsCode).not.toContain('onClick={onZoomIn}');
      expect(controlsCode).not.toContain('onClick={onZoomOut}');
      expect(controlsCode).not.toContain('aria-label="ซูมเข้า"');
      expect(controlsCode).not.toContain('aria-label="ซูมออก"');
    });

    it('2. Absence of blue ring glow on search box focus', () => {
      const searchCode = fs.readFileSync(searchBoxPath, 'utf8');
      expect(searchCode).not.toContain('focus:ring-2');
      expect(searchCode).not.toContain('focus:ring-blue-500');
      expect(searchCode).toContain('outline-none');
    });

    it('3. Flyout displays as clean floating card with gap under search capsule like search recommendations', () => {
      const searchCode = fs.readFileSync(searchBoxPath, 'utf8');
      const adaptiveCode = fs.readFileSync(adaptiveWorkspacePath, 'utf8');

      expect(searchCode).toContain('rounded-xl');
      expect(adaptiveCode).toContain('z-50 mt-2');
      expect(adaptiveCode).toContain('rounded-2xl shadow-glass-floating');
    });

    it('4. Absence of legacy header "เมนูเครื่องมือ" and X close button in Flyout', () => {
      const adaptiveCode = fs.readFileSync(adaptiveWorkspacePath, 'utf8');
      const flyoutStart = adaptiveCode.indexOf('Dropdown Flyout Panel');
      const flyoutEnd = adaptiveCode.indexOf('Place Card / Directions / Saved Places Drawer');
      const flyoutSection = adaptiveCode.substring(flyoutStart, flyoutEnd);

      expect(flyoutSection).not.toContain('เมนูเครื่องมือ');
      expect(flyoutSection).not.toContain('aria-label="ปิดเมนู"');
    });

    it('5. CRS Selector is present inside Flyout (WGS84, Indian 1975 47N, Indian 1975 48N)', () => {
      const adaptiveCode = fs.readFileSync(adaptiveWorkspacePath, 'utf8');
      expect(adaptiveCode).toContain('ระบบพิกัด');
      expect(adaptiveCode).toContain("onSelectCoordinateDatum?.('WGS84')");
      expect(adaptiveCode).toContain("onSelectCoordinateDatum?.('INDIAN1975_47')");
      expect(adaptiveCode).toContain("onSelectCoordinateDatum?.('INDIAN1975_48')");
    });

    it('6. Cursor Mode is present in Flyout Quick Actions grid', () => {
      const adaptiveCode = fs.readFileSync(adaptiveWorkspacePath, 'utf8');
      expect(adaptiveCode).toContain('โหมดเคอร์เซอร์');
      expect(adaptiveCode).toContain("onSetMeasureMode?.(measureMode === 'inspect' ? 'none' : 'inspect')");
    });

    it('7. GisStatusBar displays coordinates and Copernicus DEM elevation format with 1-click copy', () => {
      const statusBarCode = fs.readFileSync(gisStatusBarPath, 'utf8');
      expect(statusBarCode).toContain('forwardWgs84ToIndian1975');
      expect(statusBarCode).toContain('forwardWgs84ToUtm');
      expect(statusBarCode).toContain('https://api.open-meteo.com/v1/elevation');
      expect(statusBarCode).toContain('navigator.clipboard?.writeText');
      expect(statusBarCode).toContain('คัดลอกพิกัดแล้ว');
    });

    it('8. 3D Globe mode (MapLibre GL JS) works alongside 2D Leaflet, and Inspect Mode is integrated in controls pillar', () => {
      const controlsCode = fs.readFileSync(mapControlsPath, 'utf8');
      const webMapCode = fs.readFileSync(webMapPath, 'utf8');

      expect(controlsCode).toContain('onToggleInspectMode');
      expect(controlsCode).toContain('MousePointerClick');
      expect(webMapCode).toContain('<MapLibreGlobeEngine');
      expect(webMapCode).toContain('isGlobe3D');
    });
  });
});
