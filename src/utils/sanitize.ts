/**
 * Production HTML Escaping & Sanitization Utilities for Leaflet Popups and DOM Injection
 * Prevents Reflected & Stored XSS attacks from GeoJSON properties, Nominatim addresses, or user bookmarks.
 */

export function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizeUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Neutralize dangerous pseudo-protocols
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) {
    return 'about:blank';
  }
  return escapeHtml(trimmed);
}

export function sanitizeFeatureProperties(
  props: Record<string, any>,
  maxKeys = 10,
  maxValLength = 200
): string {
  if (!props || typeof props !== 'object') return '';

  return Object.entries(props)
    .slice(0, maxKeys)
    .map(([rawKey, rawVal]) => {
      const cleanKey = escapeHtml(rawKey);

      let valStr: string;
      if (typeof rawVal === 'object' && rawVal !== null) {
        try {
          valStr = JSON.stringify(rawVal);
        } catch {
          valStr = '[Complex Object]';
        }
      } else {
        valStr = String(rawVal ?? '');
      }

      // Neutralize javascript: payload in strings
      if (/^\s*javascript:/i.test(valStr)) {
        valStr = '[Blocked Script URL]';
      }

      // Truncate overly long values
      if (valStr.length > maxValLength) {
        valStr = valStr.slice(0, maxValLength) + '…';
      }

      const cleanVal = escapeHtml(valStr);
      return `<strong>${cleanKey}:</strong> ${cleanVal}`;
    })
    .join('<br/>');
}
