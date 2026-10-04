import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Challenger M1: Adversarial CSS Design Tokens & Spring Physics Verification', () => {
  const rootDir = path.resolve(__dirname, '..');
  const indexCssPath = path.join(rootDir, 'src', 'index.css');
  const tailwindConfigPath = path.join(rootDir, 'tailwind.config.js');
  const distAssetsDir = path.join(rootDir, 'dist', 'assets');

  const indexCssContent = fs.readFileSync(indexCssPath, 'utf8');

  // Helper to locate compiled CSS bundle
  function getCompiledCss(): string {
    if (!fs.existsSync(distAssetsDir)) {
      throw new Error(`dist/assets does not exist. Run npm run build first.`);
    }
    const cssFiles = fs.readdirSync(distAssetsDir).filter(f => f.endsWith('.css'));
    if (cssFiles.length === 0) {
      throw new Error(`No compiled CSS bundle found in dist/assets.`);
    }
    return fs.readFileSync(path.join(distAssetsDir, cssFiles[0]), 'utf8');
  }

  describe('1. CSS Tokens in src/index.css', () => {
    it('defines Fieldbook Light tokens in :root and :root[data-theme="fieldbook"]', () => {
      expect(indexCssContent).toContain(':root[data-theme="fieldbook"]');
      expect(indexCssContent).toContain('--memaps-glass-bg: rgba(255, 255, 255, 0.86);');
      expect(indexCssContent).toContain('--memaps-glass-bg-subtle: rgba(243, 241, 235, 0.78);');
      expect(indexCssContent).toContain('--memaps-glass-blur: blur(16px) saturate(180%);');
      expect(indexCssContent).toContain('--memaps-glass-border: rgba(20, 36, 27, 0.12);');
      expect(indexCssContent).toContain('--memaps-glass-border-specular: rgba(255, 255, 255, 0.80);');
      expect(indexCssContent).toContain('--memaps-glass-shadow:');
      expect(indexCssContent).toContain('--memaps-glass-shadow-floating:');
    });

    it('defines Terminal Dark tokens in :root[data-theme="terminal"] and .dark', () => {
      expect(indexCssContent).toContain(':root[data-theme="terminal"]');
      expect(indexCssContent).toContain('.dark');
      expect(indexCssContent).toContain('--memaps-glass-bg: rgba(17, 17, 17, 0.86);');
      expect(indexCssContent).toContain('--memaps-glass-bg-subtle: rgba(10, 10, 10, 0.78);');
      expect(indexCssContent).toContain('--memaps-glass-blur: blur(16px) saturate(180%);');
      expect(indexCssContent).toContain('--memaps-glass-border: rgba(255, 255, 255, 0.10);');
      expect(indexCssContent).toContain('--memaps-glass-border-specular: rgba(255, 255, 255, 0.08);');
      expect(indexCssContent).toContain('--memaps-glass-shadow:');
      expect(indexCssContent).toContain('--memaps-glass-shadow-floating:');
    });

    it('defines spring physics curves with mathematically valid bezier parameters', () => {
      // Curve regex: cubic-bezier(x1, y1, x2, y2)
      const bezierRegex = /cubic-bezier\(\s*([\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*([\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g;
      const matches = Array.from(indexCssContent.matchAll(bezierRegex));
      
      expect(matches.length).toBeGreaterThan(0);
      
      for (const match of matches) {
        const x1 = parseFloat(match[1]);
        const y1 = parseFloat(match[2]);
        const x2 = parseFloat(match[3]);
        const y2 = parseFloat(match[4]);
        
        // CSS Cubic Bezier Specification requires 0 <= x1 <= 1 and 0 <= x2 <= 1
        expect(x1).toBeGreaterThanOrEqual(0);
        expect(x1).toBeLessThanOrEqual(1);
        expect(x2).toBeGreaterThanOrEqual(0);
        expect(x2).toBeLessThanOrEqual(1);
        
        // y1 and y2 must be finite numbers
        expect(Number.isFinite(y1)).toBe(true);
        expect(Number.isFinite(y2)).toBe(true);
      }
    });

    it('specifically defines --ease-spring as cubic-bezier(0.16, 1, 0.3, 1)', () => {
      expect(indexCssContent).toContain('--ease-spring: cubic-bezier(0.16, 1, 0.3, 1);');
      expect(indexCssContent).toContain('--ease-spring-snappy: cubic-bezier(0.25, 1, 0.5, 1);');
      expect(indexCssContent).toContain('--ease-spring-press: cubic-bezier(0.4, 0, 0.2, 1);');
    });

    it('defines duration and scale variables', () => {
      expect(indexCssContent).toContain('--duration-press: 100ms;');
      expect(indexCssContent).toContain('--duration-micro: 150ms;');
      expect(indexCssContent).toContain('--duration-flyout: 180ms;');
      expect(indexCssContent).toContain('--duration-drawer: 200ms;');
      expect(indexCssContent).toContain('--scale-press: 0.97;');
      expect(indexCssContent).toContain('--scale-press-subtle: 0.985;');
    });
  });

  describe('2. Utility Classes and Keyframes in src/index.css', () => {
    it('defines .memaps-glass with backdrop-filter and vendor prefix', () => {
      expect(indexCssContent).toContain('.memaps-glass {');
      expect(indexCssContent).toContain('backdrop-filter: var(--memaps-glass-blur);');
      expect(indexCssContent).toContain('-webkit-backdrop-filter: var(--memaps-glass-blur);');
      expect(indexCssContent).toContain('background-color: var(--memaps-glass-bg);');
      expect(indexCssContent).toContain('border: 1px solid var(--memaps-glass-border);');
      expect(indexCssContent).toContain('box-shadow: var(--memaps-glass-shadow);');
    });

    it('defines .memaps-glass-floating with elevated shadow', () => {
      expect(indexCssContent).toContain('.memaps-glass-floating {');
      expect(indexCssContent).toContain('box-shadow: var(--memaps-glass-shadow-floating);');
    });

    it('defines .memaps-press and .memaps-press-subtle with active state transforms', () => {
      expect(indexCssContent).toContain('.memaps-press {');
      expect(indexCssContent).toContain('.memaps-press:active {');
      expect(indexCssContent).toContain('transform: scale(var(--scale-press));');

      expect(indexCssContent).toContain('.memaps-press-subtle {');
      expect(indexCssContent).toContain('.memaps-press-subtle:active {');
      expect(indexCssContent).toContain('transform: scale(var(--scale-press-subtle));');
    });

    it('defines keyframe animations memaps-spring-down and memaps-spring-up', () => {
      expect(indexCssContent).toContain('@keyframes memaps-spring-down {');
      expect(indexCssContent).toContain('translateY(-8px) scale(0.98)');
      expect(indexCssContent).toContain('translateY(0) scale(1)');

      expect(indexCssContent).toContain('@keyframes memaps-spring-up {');
      expect(indexCssContent).toContain('translateY(8px) scale(0.98)');
      expect(indexCssContent).toContain('translateY(0) scale(1)');
    });

    it('defines .anim-spring-down and .anim-spring-up with will-change optimization', () => {
      expect(indexCssContent).toContain('.anim-spring-down {');
      expect(indexCssContent).toContain('animation: memaps-spring-down var(--duration-flyout) var(--ease-spring) forwards;');
      expect(indexCssContent).toContain('.anim-spring-up {');
      expect(indexCssContent).toContain('animation: memaps-spring-up var(--duration-flyout) var(--ease-spring) forwards;');
      expect(indexCssContent).toContain('will-change: transform, opacity;');
    });

    it('includes accessibility overrides for reduced transparency and motion', () => {
      expect(indexCssContent).toContain('@media (prefers-reduced-transparency: reduce)');
      expect(indexCssContent).toContain('backdrop-filter: none !important;');
      expect(indexCssContent).toContain('@media (prefers-reduced-motion: reduce)');
      expect(indexCssContent).toContain('animation: none !important;');
      expect(indexCssContent).toContain('transform: none !important;');
    });
  });

  describe('3. Tailwind Configuration Integration', () => {
    const tailwindContent = fs.readFileSync(tailwindConfigPath, 'utf8');

    it('extends transitionTimingFunction with spring curves', () => {
      expect(tailwindContent).toContain("'spring': 'cubic-bezier(0.16, 1, 0.3, 1)'");
      expect(tailwindContent).toContain("'spring-snappy': 'cubic-bezier(0.25, 1, 0.5, 1)'");
      expect(tailwindContent).toContain("'spring-press': 'cubic-bezier(0.4, 0, 0.2, 1)'");
    });

    it('extends transitionDuration with custom motion timings', () => {
      expect(tailwindContent).toContain("'100': '100ms'");
      expect(tailwindContent).toContain("'150': '150ms'");
      expect(tailwindContent).toContain("'180': '180ms'");
      expect(tailwindContent).toContain("'200': '200ms'");
    });

    it('extends scale with tactile press scales', () => {
      expect(tailwindContent).toContain("'97': '0.97'");
      expect(tailwindContent).toContain("'985': '0.985'");
    });

    it('extends boxShadow with glass variants', () => {
      expect(tailwindContent).toContain("'glass': 'var(--memaps-glass-shadow)'");
      expect(tailwindContent).toContain("'glass-floating': 'var(--memaps-glass-shadow-floating)'");
    });
  });

  describe('4. Empirical Vite Production Bundle Verification', () => {
    const compiledCss = getCompiledCss();

    it('ensures .memaps-glass compiles into production bundle without being purged', () => {
      expect(compiledCss).toContain('.memaps-glass{');
    });

    it('ensures .memaps-glass-floating compiles into production bundle', () => {
      expect(compiledCss).toContain('.memaps-glass-floating{');
    });

    it('ensures .memaps-press and .memaps-press-subtle compile into production bundle', () => {
      expect(compiledCss).toContain('.memaps-press{');
      expect(compiledCss).toContain('.memaps-press:active{');
      expect(compiledCss).toContain('.memaps-press-subtle{');
      expect(compiledCss).toContain('.memaps-press-subtle:active{');
    });

    it('ensures .anim-spring-down and .anim-spring-up compile into production bundle', () => {
      expect(compiledCss).toContain('.anim-spring-down{');
      expect(compiledCss).toContain('.anim-spring-up{');
    });

    it('ensures keyframes memaps-spring-down and memaps-spring-up are preserved in bundle', () => {
      expect(compiledCss).toContain('@keyframes memaps-spring-down');
      expect(compiledCss).toContain('@keyframes memaps-spring-up');
    });

    it('preserves fieldbook and terminal theme variables in bundle', () => {
      expect(compiledCss).toContain('--memaps-glass-bg');
      expect(compiledCss).toContain('--memaps-glass-shadow-floating');
      expect(compiledCss).toContain('--ease-spring');
      expect(compiledCss).toMatch(/cubic-bezier\(\s*\.?16\s*,\s*1\s*,\s*\.?3\s*,\s*1\s*\)/);
    });

    it('preserves reduced motion and transparency media queries in bundle', () => {
      expect(compiledCss).toContain('prefers-reduced-transparency:reduce');
      expect(compiledCss).toContain('prefers-reduced-motion:reduce');
    });
  });
});
