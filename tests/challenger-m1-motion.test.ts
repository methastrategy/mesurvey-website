import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Challenger M1 Adversarial Verification Suite — Motion & Glassmorphism Tokens', () => {
  const indexCssPath = path.resolve(__dirname, '../src/index.css');
  const tailwindConfigPath = path.resolve(__dirname, '../tailwind.config.js');
  const globeEnginePath = path.resolve(__dirname, '../src/components/map/MapLibreGlobeEngine.tsx');
  const distAssetsDir = path.resolve(__dirname, '../dist/assets');

  // =========================================================================
  // 1. DUAL-THEME GLASSMORPHISM & SPRING PHYSICS CSS TOKENS
  // =========================================================================
  describe('Dual-Theme Glassmorphism & Spring Physics CSS Tokens', () => {
    it('declares Fieldbook Light glassmorphism and spring physics variables', () => {
      const css = fs.readFileSync(indexCssPath, 'utf8');

      // Light theme tokens
      expect(css).toMatch(/--memaps-glass-bg:\s*rgba\(255,\s*255,\s*255,\s*0\.86\)/);
      expect(css).toMatch(/--memaps-glass-bg-subtle:\s*rgba\(243,\s*241,\s*235,\s*0\.78\)/);
      expect(css).toMatch(/--memaps-glass-blur:\s*blur\(16px\)\s*saturate\(180%\)/);
      expect(css).toMatch(/--memaps-glass-border:\s*rgba\(20,\s*36,\s*27,\s*0\.12\)/);
      expect(css).toMatch(/--memaps-glass-shadow:\s*0\s+10px\s+30px/);
      expect(css).toMatch(/--memaps-glass-shadow-floating:\s*0\s+16px\s+40px/);

      // Spring physics curves
      expect(css).toMatch(/--ease-spring:\s*cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/);
      expect(css).toMatch(/--ease-spring-snappy:\s*cubic-bezier\(0\.25,\s*1,\s*0\.5,\s*1\)/);
      expect(css).toMatch(/--ease-spring-press:\s*cubic-bezier\(0\.4,\s*0,\s*0\.2,\s*1\)/);

      // Duration & scale tokens
      expect(css).toMatch(/--duration-press:\s*100ms/);
      expect(css).toMatch(/--duration-micro:\s*150ms/);
      expect(css).toMatch(/--duration-flyout:\s*180ms/);
      expect(css).toMatch(/--duration-drawer:\s*200ms/);
      expect(css).toMatch(/--scale-press:\s*0\.97/);
      expect(css).toMatch(/--scale-press-subtle:\s*0\.985/);
    });

    it('declares Terminal Dark glassmorphism and spring physics variables', () => {
      const css = fs.readFileSync(indexCssPath, 'utf8');

      // Dark theme tokens
      expect(css).toMatch(/--memaps-glass-bg:\s*rgba\(17,\s*17,\s*17,\s*0\.86\)/);
      expect(css).toMatch(/--memaps-glass-bg-subtle:\s*rgba\(10,\s*10,\s*10,\s*0\.78\)/);
      expect(css).toMatch(/--memaps-glass-border:\s*rgba\(255,\s*255,\s*255,\s*0\.10\)/);
      expect(css).toMatch(/--memaps-glass-shadow:\s*0\s+14px\s+40px/);
      expect(css).toMatch(/--memaps-glass-shadow-floating:\s*0\s+20px\s+48px/);
    });

    it('declares high-leverage utility classes: .memaps-glass, .memaps-glass-floating, .memaps-press, and animations', () => {
      const css = fs.readFileSync(indexCssPath, 'utf8');

      expect(css).toContain('.memaps-glass {');
      expect(css).toContain('.memaps-glass-floating {');
      expect(css).toContain('.memaps-press {');
      expect(css).toContain('.memaps-press-subtle {');
      expect(css).toContain('@keyframes memaps-spring-down');
      expect(css).toContain('@keyframes memaps-spring-up');
      expect(css).toContain('.anim-spring-down {');
      expect(css).toContain('.anim-spring-up {');
    });

    it('implements reduced-transparency and reduced-motion accessibility overrides', () => {
      const css = fs.readFileSync(indexCssPath, 'utf8');

      expect(css).toMatch(/@media\s*\(prefers-reduced-transparency:\s*reduce\)[\s\S]*?backdrop-filter:\s*none\s*!important/);
      expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.memaps-press[\s\S]*?animation:\s*none\s*!important/);
    });
  });

  // =========================================================================
  // 2. TAILWIND CONFIG EXTENSIONS
  // =========================================================================
  describe('Tailwind Theme Configuration Invariance', () => {
    it('contains all required motion and shadow extensions in tailwind.config.js', () => {
      const tailwindContent = fs.readFileSync(tailwindConfigPath, 'utf8');

      expect(tailwindContent).toContain("'glass': 'var(--memaps-glass-shadow)'");
      expect(tailwindContent).toContain("'glass-floating': 'var(--memaps-glass-shadow-floating)'");
      expect(tailwindContent).toContain("'spring': 'cubic-bezier(0.16, 1, 0.3, 1)'");
      expect(tailwindContent).toContain("'spring-snappy': 'cubic-bezier(0.25, 1, 0.5, 1)'");
      expect(tailwindContent).toContain("'spring-press': 'cubic-bezier(0.4, 0, 0.2, 1)'");
      expect(tailwindContent).toContain("'100': '100ms'");
      expect(tailwindContent).toContain("'150': '150ms'");
      expect(tailwindContent).toContain("'180': '180ms'");
      expect(tailwindContent).toContain("'200': '200ms'");
      expect(tailwindContent).toContain("'97': '0.97'");
      expect(tailwindContent).toContain("'985': '0.985'");
    });
  });

  // =========================================================================
  // 3. MAPLIBRE GLOBE ENGINE TYPESCRIPT INTEGRITY
  // =========================================================================
  describe('MapLibre Globe Engine TypeScript Seam', () => {
    it('properly imports maplibregl namespace and types event parameter', () => {
      const globeContent = fs.readFileSync(globeEnginePath, 'utf8');

      expect(globeContent).toMatch(/import\s+\*\s+as\s+maplibregl\s+from\s+'maplibre-gl';/);
      expect(globeContent).toMatch(/e:\s*maplibregl\.MapMouseEvent/);
    });
  });

  // =========================================================================
  // 4. PRODUCTION BUNDLE ARTIFACT VERIFICATION
  // =========================================================================
  describe('Production Bundle CSS Verification', () => {
    it('confirms all glass and spring primitives are emitted in the compiled css artifact', () => {
      expect(fs.existsSync(distAssetsDir)).toBe(true);
      const files = fs.readdirSync(distAssetsDir);
      const cssFiles = files.filter(f => f.endsWith('.css'));
      expect(cssFiles.length).toBeGreaterThan(0);

      const bundledCss = fs.readFileSync(path.join(distAssetsDir, cssFiles[0]), 'utf8');
      expect(bundledCss).toContain('memaps-glass');
      expect(bundledCss).toMatch(/cubic-bezier\(\s*\.?16\s*,\s*1\s*,\s*\.?3\s*,\s*1\s*\)/);
      expect(bundledCss).toContain('memaps-spring-down');
      expect(bundledCss).toContain('prefers-reduced-transparency');
      expect(bundledCss).toContain('prefers-reduced-motion');
    });
  });

  // =========================================================================
  // 5. REGRESSION DEFENSE: DISASTER & CHALLENGER AUDIT COMPLIANCE
  // =========================================================================
  describe('Regression Defense: Solid Surface & Touch Target Guarantees', () => {
    it('confirms DisasterCommandPanel.tsx and HydroTelemetryDrawer.tsx retain solid surfaces without blur pollution', () => {
      const disasterFiles = [
        path.resolve(__dirname, '../src/components/map/DisasterCommandPanel.tsx'),
        path.resolve(__dirname, '../src/components/map/HydroTelemetryDrawer.tsx')
      ];

      for (const filePath of disasterFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).not.toMatch(/backdrop-blur|backdrop-filter/);
      }
    });
  });
});
