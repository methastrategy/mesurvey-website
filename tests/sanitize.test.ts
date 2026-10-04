import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeUrl, sanitizeFeatureProperties } from '../src/utils/sanitize';

describe('XSS Prevention and Sanitization Test Suite (sanitize.ts)', () => {
  describe('escapeHtml', () => {
    it('neutralizes standard XSS attack vectors', () => {
      const payload1 = '<img src=x onerror=alert(1)>';
      expect(escapeHtml(payload1)).toBe('&lt;img src=x onerror=alert(1)&gt;');

      const payload2 = '"><script>alert(1)</script>';
      expect(escapeHtml(payload2)).toBe('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('escapes single quotes, ampersands, and double quotes', () => {
      expect(escapeHtml("John's \"Station\" & Tower")).toBe('John&#039;s &quot;Station&quot; &amp; Tower');
    });

    it('safely handles numbers, null, and undefined', () => {
      expect(escapeHtml(12345)).toBe('12345');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('blocks dangerous javascript: pseudo-protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('about:blank');
      expect(sanitizeUrl('JAVASCRIPT:/*foo*/alert(1)')).toBe('about:blank');
      expect(sanitizeUrl('  javascript:void(0)')).toBe('about:blank');
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('about:blank');
    });

    it('permits safe http and https URLs', () => {
      expect(sanitizeUrl('https://mesurv.org/map')).toBe('https://mesurv.org/map');
      expect(sanitizeUrl('http://openstreetmap.org')).toBe('http://openstreetmap.org');
    });
  });

  describe('sanitizeFeatureProperties', () => {
    it('sanitizes both property keys and property values', () => {
      const props = {
        '<b>HarmfulKey</b>': '<script>alert("pwned")</script>',
        'owner': 'Mr. O\'Connor'
      };
      const result = sanitizeFeatureProperties(props);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;b&gt;HarmfulKey&lt;/b&gt;');
      expect(result).toContain('&lt;script&gt;alert(&quot;pwned&quot;)&lt;/script&gt;');
      expect(result).toContain('Mr. O&#039;Connor');
    });

    it('safely stringifies and escapes nested objects and arrays', () => {
      const props = {
        meta: { tag: '<admin>' },
        coords: [100.5, 13.8]
      };
      const result = sanitizeFeatureProperties(props);
      expect(result).toContain('&lt;admin&gt;');
      expect(result).toContain('[100.5,13.8]');
    });

    it('truncates excessively long property values to prevent UI freeze', () => {
      const longText = 'A'.repeat(500);
      const props = { desc: longText };
      const result = sanitizeFeatureProperties(props, 5, 50);
      expect(result.length).toBeLessThan(150);
      expect(result).toContain('…');
    });

    it('neutralizes embedded javascript: URLs in property values', () => {
      const props = { link: 'javascript:alert(document.cookie)' };
      const result = sanitizeFeatureProperties(props);
      expect(result).toContain('[Blocked Script URL]');
    });
  });
});
