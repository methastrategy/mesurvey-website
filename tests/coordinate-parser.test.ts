import { describe, it, expect } from 'vitest';
import { parseCoordinateString } from '../src/utils/coordinate-parser';

describe('Comprehensive Coordinate Parser Suite (coordinate-parser.ts)', () => {
  describe('Decimal Degrees (DD) Parsing', () => {
    it('parses standard comma-separated DD', () => {
      const res = parseCoordinateString('13.8476, 100.5696');
      expect(res).not.toBeNull();
      expect(res?.format).toBe('DD');
      expect(res?.coord.lat).toBeCloseTo(13.8476, 4);
      expect(res?.coord.lng).toBeCloseTo(100.5696, 4);
      expect(res?.wasSwapped).toBeFalsy();
    });

    it('parses whitespace-separated DD', () => {
      const res = parseCoordinateString('13.8476 100.5696');
      expect(res).not.toBeNull();
      expect(res?.coord.lat).toBeCloseTo(13.8476, 4);
    });

    it('parses semicolon-separated DD', () => {
      const res = parseCoordinateString('13.8476; 100.5696');
      expect(res).not.toBeNull();
      expect(res?.coord.lat).toBeCloseTo(13.8476, 4);
    });

    it('parses tab-separated DD', () => {
      const res = parseCoordinateString("13.8476\t100.5696");
      expect(res).not.toBeNull();
      expect(res?.coord.lat).toBeCloseTo(13.8476, 4);
    });

    it('parses comma decimals (e.g. 13,8476 100,5696)', () => {
      const res = parseCoordinateString('13,8476 100,5696');
      expect(res).not.toBeNull();
      expect(res?.coord.lat).toBeCloseTo(13.8476, 4);
      expect(res?.coord.lng).toBeCloseTo(100.5696, 4);
    });

    it('parses negative coordinates and southern/western hemisphere', () => {
      const res = parseCoordinateString('-13.8476, -100.5696');
      expect(res).not.toBeNull();
      expect(res?.coord.lat).toBeCloseTo(-13.8476, 4);
      expect(res?.coord.lng).toBeCloseTo(-100.5696, 4);
    });

    it('auto-swaps inverted [lng, lat] for Thailand envelope (e.g. 100.5696, 13.8476)', () => {
      const res = parseCoordinateString('100.5696, 13.8476');
      expect(res).not.toBeNull();
      expect(res?.wasSwapped).toBe(true);
      expect(res?.coord.lat).toBeCloseTo(13.8476, 4);
      expect(res?.coord.lng).toBeCloseTo(100.5696, 4);
    });
  });

  describe('Degrees Minutes Seconds (DMS) Parsing', () => {
    it('parses standard DMS with symbols (13°50\'51.4"N 100°34\'10.6"E)', () => {
      const res = parseCoordinateString('13°50\'51.4"N 100°34\'10.6"E');
      expect(res).not.toBeNull();
      expect(res?.format).toBe('DMS');
      expect(res?.coord.lat).toBeCloseTo(13.84761, 4);
      expect(res?.coord.lng).toBeCloseTo(100.56961, 4);
    });

    it('parses DMS with space delimiter (13 50 51.4 N, 100 34 10.6 E)', () => {
      const res = parseCoordinateString('13 50 51.4 N, 100 34 10.6 E');
      expect(res).not.toBeNull();
      expect(res?.format).toBe('DMS');
      expect(res?.coord.lat).toBeCloseTo(13.84761, 4);
    });

    it('parses DMS in southern hemisphere with S/W', () => {
      const res = parseCoordinateString('10°30\'00"S 100°30\'00"W');
      expect(res).not.toBeNull();
      expect(res?.coord.lat).toBeCloseTo(-10.5, 4);
      expect(res?.coord.lng).toBeCloseTo(-100.5, 4);
    });
  });

  describe('UTM Grid & MGRS Latitude Bands Parsing', () => {
    it('parses Band 47P (Central Thailand / Bangkok)', () => {
      const res = parseCoordinateString('47P 667000 1531000');
      expect(res).not.toBeNull();
      expect(res?.format).toBe('UTM');
      expect(res?.latitudeBand).toBe('P');
      expect(res?.coord.lat).toBeGreaterThan(13);
      expect(res?.coord.lat).toBeLessThan(14);
    });

    it('parses Band 47Q (Northern Thailand / Chiang Mai)', () => {
      const res = parseCoordinateString('47Q 492071 2078928');
      expect(res).not.toBeNull();
      expect(res?.format).toBe('UTM');
      expect(res?.latitudeBand).toBe('Q');
      expect(res?.coord.lat).toBeGreaterThan(18);
      expect(res?.coord.lat).toBeLessThan(19);
    });

    it('parses Band 47N (Southern Thailand / Songkhla)', () => {
      const res = parseCoordinateString('47N 676021 797456');
      expect(res).not.toBeNull();
      expect(res?.format).toBe('UTM');
      expect(res?.latitudeBand).toBe('N');
      expect(res?.coord.lat).toBeGreaterThan(7);
      expect(res?.coord.lat).toBeLessThan(8);
    });

    it('parses Zone 48 Band 48P (Northeastern Thailand / Khon Kaen)', () => {
      const res = parseCoordinateString('48P 269354 1818738');
      expect(res).not.toBeNull();
      expect(res?.format).toBe('UTM');
      expect(res?.coord.lat).toBeGreaterThan(16);
      expect(res?.coord.lat).toBeLessThan(17);
    });

    it('parses explicit Easting Northing Zone string', () => {
      const res = parseCoordinateString('E 667000 N 1531000 zone 47');
      expect(res).not.toBeNull();
      expect(res?.format).toBe('UTM');
      expect(res?.coord.lat).toBeGreaterThan(13);
    });

    it('attaches warning when latitude band is mismatched with northing', () => {
      // 47N should be 0-8°N (< 885,000m), but northing is 1,531,000m (Bangkok)
      const res = parseCoordinateString('47N 667000 1531000');
      expect(res).not.toBeNull();
      expect(res?.warning).toBeDefined();
    });
  });

  describe('Datum Parameter Selection (WGS84 vs Indian 1975)', () => {
    it('defaults to WGS84 datum', () => {
      const res = parseCoordinateString('47P 669656 1531321');
      expect(res?.datum).toBe('WGS84');
      expect(res?.coord.lat).toBeCloseTo(13.8466, 2);
    });

    it('correctly interprets coordinates under Indian 1975 datum when specified', () => {
      const res = parseCoordinateString('47P 669988 1531019', 'INDIAN1975');
      expect(res?.datum).toBe('INDIAN1975');
      // Indian 1975 UTM values projected back to WGS84 should yield KU Survey Dept lat/lng
      expect(res?.coord.lat).toBeCloseTo(13.8466, 2);
      expect(res?.coord.lng).toBeCloseTo(100.5698, 2);
    });
  });

  describe('Error Handling, Bounds & Fuzz Resilience', () => {
    it('safely returns null for out of bounds latitudes without throwing', () => {
      expect(parseCoordinateString('95.5, 100.5')).toBeNull();
      expect(parseCoordinateString('-95.5, 100.5')).toBeNull();
    });

    it('safely returns null for out of bounds longitudes without throwing', () => {
      expect(parseCoordinateString('13.5, 195.5')).toBeNull();
      expect(parseCoordinateString('13.5, -195.5')).toBeNull();
    });

    it('safely returns null for out of bounds UTM coordinates without throwing', () => {
      expect(parseCoordinateString('47P 50000 1531000')).toBeNull(); // Easting too low
      expect(parseCoordinateString('47P 950000 1531000')).toBeNull(); // Easting too high
    });

    it('safely returns null for plain textual queries', () => {
      expect(parseCoordinateString('ม.เกษตรศาสตร์')).toBeNull();
      expect(parseCoordinateString('Bangkok Grand Palace')).toBeNull();
      expect(parseCoordinateString('ถนนวิภาวดีรังสิต')).toBeNull();
    });

    it('safely returns null for empty or whitespace inputs', () => {
      expect(parseCoordinateString('')).toBeNull();
      expect(parseCoordinateString('   ')).toBeNull();
    });

    it('safely handles extremely long string injections and emojis without crashing', () => {
      const longInput = '13.84, 100.56' + 'A'.repeat(500);
      expect(parseCoordinateString(longInput)).toBeNull();

      expect(parseCoordinateString('📍 13.8476, 100.5696')).toBeNull();
      expect(parseCoordinateString('🛰️🚀')).toBeNull();
    });
  });
});
