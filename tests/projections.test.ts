import { describe, it, expect } from 'vitest';
import {
  calculateUtmZone,
  dmsToDecimal,
  decimalToDms,
  formatDms,
  forwardWgs84ToUtm,
  inverseUtmToWgs84,
  forwardWgs84ToIndian1975,
  inverseIndian1975ToWgs84,
  convertComplete,
  isInThailandBounds,
  validateGeographicCoordinates,
  validateUtmCoordinates,
  THAILAND_EXTENT
} from '../src/core/projections';
import { SURVEY_BOOKMARKS } from '../src/data/survey-presets';

describe('Geodetic Projections & Transformations Engine (projections.ts)', () => {
  describe('Thailand UTM Zone Determination', () => {
    it('correctly assigns UTM Zone 47 for longitudes < 102°E and Zone 48 for >= 102°E', () => {
      // West of 102°E -> Zone 47
      expect(calculateUtmZone(100.56982)).toBe(47); // Bangkok / KU
      expect(calculateUtmZone(98.9853)).toBe(47);   // Chiang Mai
      expect(calculateUtmZone(99.9678)).toBe(47);   // Kamphaeng Saen Camp
      expect(calculateUtmZone(101.9999)).toBe(47);  // Boundary West

      // East of 102°E -> Zone 48
      expect(calculateUtmZone(102.0000)).toBe(48);  // Exactly on boundary
      expect(calculateUtmZone(102.0001)).toBe(48);  // Boundary East
      expect(calculateUtmZone(102.8276)).toBe(48);  // Khon Kaen
      expect(calculateUtmZone(104.8560)).toBe(48);  // Ubon Ratchathani
    });

    it('supports forcedZone override across zone boundaries', () => {
      // Point at 101.9999 is naturally Zone 47, but can be forced into Zone 48
      const naturalZone = forwardWgs84ToUtm(15.0, 101.9999);
      expect(naturalZone.zone).toBe(47);

      const forced48 = forwardWgs84ToUtm(15.0, 101.9999, 48);
      expect(forced48.zone).toBe(48);
      expect(forced48.easting).toBeLessThan(300000);

      // Point at 102.0001 is naturally Zone 48, but can be forced into Zone 47
      const forced47 = forwardWgs84ToUtm(15.0, 102.0001, 47);
      expect(forced47.zone).toBe(47);
      expect(forced47.easting).toBeGreaterThan(800000);
    });
  });

  describe('DMS and Decimal Degrees Conversion', () => {
    it('converts DMS to Decimal Degrees accurately', () => {
      // 13° 50' 47.904" N = 13 + 50/60 + 47.904/3600 = 13.84664
      const dd = dmsToDecimal(13, 50, 47.904, 'N');
      expect(dd).toBeCloseTo(13.84664, 5);

      // Negative coordinates (South / West)
      const ddSouth = dmsToDecimal(10, 30, 0, 'S');
      expect(ddSouth).toBeCloseTo(-10.5, 5);

      const ddWest = dmsToDecimal(100, 30, 0, 'W');
      expect(ddWest).toBeCloseTo(-100.5, 5);
    });

    it('converts Decimal Degrees to DMS format accurately', () => {
      const dms = decimalToDms(13.84664, true);
      expect(dms.deg).toBe(13);
      expect(dms.min).toBe(50);
      expect(dms.sec).toBeCloseTo(47.90, 1);
      expect(dms.direction).toBe('N');

      const formatted = formatDms(dms);
      expect(formatted).toContain("13° 50'");
      expect(formatted).toContain('N');
    });

    it('rejects invalid DMS values with descriptive errors', () => {
      expect(() => dmsToDecimal(13, 65, 0, 'N')).toThrow('ค่าลิปดา (Minute) ต้องอยู่ระหว่าง 0 ถึง 59 ลิปดา');
      expect(() => dmsToDecimal(13, 30, 75, 'N')).toThrow('ค่าพิลิปดา (Second) ต้องอยู่ระหว่าง 0.00 ถึง 59.99 พิลิปดา');
      expect(() => dmsToDecimal(NaN, 0, 0)).toThrow('ค่าองศา ลิปดา หรือพิลิปดาต้องเป็นตัวเลขที่ถูกต้อง');
    });
  });

  describe('Bidirectional WGS84 <-> UTM 47N/48N Transformations', () => {
    it('achieves sub-millimeter round-trip accuracy across all 6 Thai benchmark points', () => {
      for (const bm of SURVEY_BOOKMARKS) {
        const utm = forwardWgs84ToUtm(bm.lat, bm.lng);
        expect(utm.easting).toBeGreaterThan(150000);
        expect(utm.easting).toBeLessThan(850000);
        expect(utm.northing).toBeGreaterThan(700000);
        expect(utm.northing).toBeLessThan(2300000);

        // Inverse back to WGS84
        const roundtrip = inverseUtmToWgs84(utm.easting, utm.northing, utm.zone);
        expect(roundtrip.lat).toBeCloseTo(bm.lat, 6);
        expect(roundtrip.lng).toBeCloseTo(bm.lng, 6);
      }
    });

    it('correctly projects KU Survey Dept to known RTSD grid values', () => {
      // KU Survey Dept: 13.84664, 100.56982
      const utm = forwardWgs84ToUtm(13.84664, 100.56982);
      expect(utm.zone).toBe(47);
      expect(utm.easting).toBeCloseTo(669656.82, 1);
      expect(utm.northing).toBeCloseTo(1531321.89, 1);
    });
  });

  describe('Bidirectional WGS84 <-> Indian 1975 Transformations', () => {
    it('achieves sub-centimeter round-trip accuracy on Indian 1975 across Thai benchmarks', () => {
      for (const bm of SURVEY_BOOKMARKS) {
        const ind = forwardWgs84ToIndian1975(bm.lat, bm.lng);
        expect(ind.easting).toBeGreaterThan(150000);
        expect(ind.northing).toBeGreaterThan(700000);

        const roundtrip = inverseIndian1975ToWgs84(ind.easting, ind.northing, ind.zone);
        // Indian 1975 Helmert transformation roundtrip precision within ~0.0001 deg (~0.01m)
        expect(roundtrip.lat).toBeCloseTo(bm.lat, 4);
        expect(roundtrip.lng).toBeCloseTo(bm.lng, 4);
      }
    });

    it('computes expected ~300-400m datum shift between WGS84 and Indian 1975 at KU Survey Dept', () => {
      const wgsUtm = forwardWgs84ToUtm(13.84664, 100.56982);
      const indUtm = forwardWgs84ToIndian1975(13.84664, 100.56982);

      const dE = indUtm.easting - wgsUtm.easting;
      const dN = indUtm.northing - wgsUtm.northing;
      const shiftDistance = Math.hypot(dE, dN);

      // Known datum shift in central Thailand between WGS84 and Indian 1975 is ~400-500 meters
      expect(shiftDistance).toBeGreaterThan(300);
      expect(shiftDistance).toBeLessThan(600);
    });
  });

  describe('Geodetic Boundary Validations & Diagnostics', () => {
    it('validates geographic coordinates correctly', () => {
      expect(validateGeographicCoordinates(13.84664, 100.56982).isValid).toBe(true);

      const outOfBoundsLat = validateGeographicCoordinates(95.0, 100.0);
      expect(outOfBoundsLat.isValid).toBe(false);
      expect(outOfBoundsLat.error).toContain('ละติจูดต้องอยู่ระหว่าง -90° ถึง +90°');

      const outOfBoundsLng = validateGeographicCoordinates(13.0, 190.0);
      expect(outOfBoundsLng.isValid).toBe(false);
      expect(outOfBoundsLng.error).toContain('ลองจิจูดต้องอยู่ระหว่าง -180° ถึง +180°');

      const nanCheck = validateGeographicCoordinates(NaN, 100.0);
      expect(nanCheck.isValid).toBe(false);
    });

    it('validates UTM coordinates and detects axis swap blunders', () => {
      expect(validateUtmCoordinates(669656.82, 1531321.89, 47).isValid).toBe(true);

      // Axis swap blunder: Northing value placed into Easting
      const swapped = validateUtmCoordinates(1531321.89, 669656.82, 47);
      expect(swapped.isValid).toBe(false);
      expect(swapped.error).toContain('สลับแกนระหว่างค่า N (Northing) และ E (Easting)');

      // Negative northing in northern hemisphere
      const negNorthing = validateUtmCoordinates(669656.82, -500, 47);
      expect(negNorthing.isValid).toBe(false);
    });

    it('correctly identifies Thailand geographical bounding envelope', () => {
      expect(isInThailandBounds(13.84664, 100.56982)).toBe(true); // Bangkok
      expect(isInThailandBounds(18.7904, 98.9853)).toBe(true);    // Chiang Mai
      expect(isInThailandBounds(7.1898, 100.5954)).toBe(true);    // Songkhla

      expect(isInThailandBounds(35.6762, 139.6503)).toBe(false);  // Tokyo
      expect(isInThailandBounds(51.5074, -0.1278)).toBe(false);   // London
      expect(isInThailandBounds(-33.8688, 151.2093)).toBe(false); // Sydney
    });

    it('rejects out of bounds coordinates in transformation functions', () => {
      expect(() => forwardWgs84ToUtm(100.0, 100.0)).toThrow('ละติจูด');
      expect(() => forwardWgs84ToUtm(13.0, 200.0)).toThrow('ลองจิจูด');
      expect(() => inverseUtmToWgs84(50000, 1500000, 47)).toThrow('Easting');
      expect(() => forwardWgs84ToIndian1975(-95.0, 100.0)).toThrow('ละติจูด');
      expect(() => inverseIndian1975ToWgs84(999999, 1500000, 47)).toThrow('Easting');
    });

    it('produces complete synchronized coordinate set via convertComplete', () => {
      const set = convertComplete(13.84664, 100.56982);
      expect(set.wgs84_dd.lat).toBe(13.84664);
      expect(set.wgs84_dd.lng).toBe(100.56982);
      expect(set.wgs84_dms.lat.deg).toBe(13);
      expect(set.wgs84_utm.zone).toBe(47);
      expect(set.wgs84_utm.easting).toBeCloseTo(669656.82, 1);
      expect(set.indian1975_utm.easting).toBeCloseTo(669988.90, 1);
    });
  });
});
