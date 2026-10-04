import { describe, it, expect } from 'vitest';
import {
  wgs84CoordSchema,
  dmsLatitudeValSchema,
  dmsLongitudeValSchema,
  latLonDmsSchema,
  utmCoordSchema,
  indian1975CoordSchema,
  traverseLegSchema,
  traverseSetupSchema,
  levelingRowSchema,
  levelingSetupSchema,
  thaiLandAreaSchema,
  sqMetersInputSchema,
  THAILAND_BOUNDS,
  validateWgs84,
  validateUtm,
  validateDms,
  validateIndian1975,
  validateTraverseLeg,
  validateTraverseSetup,
  validateLevelingRow,
  validateLevelingSetup,
  validateThaiLandArea,
  validateSqMeters,
  formatZodError,
  isWithinThailand,
  isWithinThailandUtm,
  sanitizeSurveyNumber
} from '../src/core/validation';
import { validateIndian1975Coordinates } from '../src/core/projections';

describe('Zod Survey Validation Engine (survey-validation)', () => {
  describe('WGS84 Geographic Coordinate Validation', () => {
    it('accepts valid coordinates within Thailand and flags isInsideThailand=true', () => {
      const res = validateWgs84({ lat: 13.84664, lng: 100.56982 });
      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.data.lat).toBe(13.84664);
        expect(res.data.lng).toBe(100.56982);
        expect(res.isInsideThailand).toBe(true);
        expect(res.warning).toBeUndefined();
      }
    });

    it('accepts valid coordinates outside Thailand with informative warning and isInsideThailand=false', () => {
      // Tokyo: 35.6762°N, 139.6503°E
      const res = validateWgs84({ lat: 35.6762, lng: 139.6503 });
      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.isInsideThailand).toBe(false);
        expect(res.warning).toContain('อยู่นอกขอบเขตประเทศไทย');
      }
    });

    it('accepts extreme boundary values (-90, +90, -180, +180)', () => {
      expect(validateWgs84({ lat: 90, lng: 180 }).isValid).toBe(true);
      expect(validateWgs84({ lat: -90, lng: -180 }).isValid).toBe(true);
      expect(validateWgs84({ lat: 0, lng: 0 }).isValid).toBe(true);
      // North Pole on Prime Meridian and longitude 15 must NOT trigger false-positive swapped blunder
      const northPole0 = validateWgs84({ lat: 90, lng: 0 });
      expect(northPole0.isValid).toBe(true);
      const northPole15 = validateWgs84({ lat: 90, lng: 15 });
      expect(northPole15.isValid).toBe(true);
    });

    it('rejects latitudes outside [-90, 90]', () => {
      const resOver = validateWgs84({ lat: 90.0001, lng: 100.0 });
      expect(resOver.isValid).toBe(false);
      if (!resOver.isValid) {
        expect(resOver.error).toContain('ละติจูดต้องอยู่ระหว่าง -90° ถึง +90°');
      }

      const resUnder = validateWgs84({ lat: -90.0001, lng: 100.0 });
      expect(resUnder.isValid).toBe(false);
      if (!resUnder.isValid) {
        expect(resUnder.error).toContain('ละติจูดต้องอยู่ระหว่าง -90° ถึง +90°');
      }
    });

    it('rejects longitudes outside [-180, 180]', () => {
      const resOver = validateWgs84({ lat: 13.0, lng: 180.001 });
      expect(resOver.isValid).toBe(false);
      if (!resOver.isValid) {
        expect(resOver.error).toContain('ลองจิจูดต้องอยู่ระหว่าง -180° ถึง +180°');
      }

      const resUnder = validateWgs84({ lat: 13.0, lng: -180.001 });
      expect(resUnder.isValid).toBe(false);
      if (!resUnder.isValid) {
        expect(resUnder.error).toContain('ลองจิจูดต้องอยู่ระหว่าง -180° ถึง +180°');
      }
    });

    it('rejects non-numeric, NaN, or non-finite inputs', () => {
      expect(validateWgs84({ lat: NaN, lng: 100.0 }).isValid).toBe(false);
      expect(validateWgs84({ lat: 13.0, lng: Infinity }).isValid).toBe(false);
      expect(validateWgs84({ lat: 'abc', lng: 100.0 }).isValid).toBe(false);
      expect(validateWgs84(null).isValid).toBe(false);
      expect(validateWgs84({}).isValid).toBe(false);
    });

    it('detects inverted coordinates blunder (Longitude in Lat field for Thailand)', () => {
      // User inputs Lat = 100.56982 (Thailand Lng) and Lng = 13.84664 (Thailand Lat)
      const res = validateWgs84({ lat: 100.56982, lng: 13.84664 });
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.error).toContain('ตรวจพบการสลับค่าระหว่างละติจูดและลองจิจูด');
      }
    });
  });

  describe('DMS (Degrees, Minutes, Seconds) Validation', () => {
    it('accepts valid DMS values for Latitude and Longitude', () => {
      const validDms = {
        lat: { deg: 13, min: 50, sec: 47.9, direction: 'N' as const },
        lng: { deg: 100, min: 34, sec: 11.35, direction: 'E' as const }
      };
      const res = validateDms(validDms);
      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.data.lat.deg).toBe(13);
        expect(res.data.lng.direction).toBe('E');
      }
    });

    it('rejects invalid minutes (>= 60 or < 0)', () => {
      const res = dmsLatitudeValSchema.safeParse({ deg: 13, min: 60, sec: 30, direction: 'N' });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('ค่าลิปดา (Minute) ต้องอยู่ระหว่าง 0 ถึง 59 ลิปดา');
      }
    });

    it('rejects invalid seconds (>= 60 or < 0)', () => {
      const res = dmsLatitudeValSchema.safeParse({ deg: 13, min: 50, sec: 60.0, direction: 'N' });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('ค่าพิลิปดาต้องน้อยกว่า 60.00 พิลิปดา');
      }
    });

    it('rejects latitude degrees > 90 and longitude degrees > 180', () => {
      const resLat = dmsLatitudeValSchema.safeParse({ deg: 91, min: 0, sec: 0, direction: 'N' });
      expect(resLat.success).toBe(false);

      const resLng = dmsLongitudeValSchema.safeParse({ deg: 181, min: 0, sec: 0, direction: 'E' });
      expect(resLng.success).toBe(false);
    });

    it('enforces that polar coordinates (90°N/S) have 0 minutes and 0 seconds', () => {
      const poleWithMinutes = dmsLatitudeValSchema.safeParse({ deg: 90, min: 1, sec: 0, direction: 'N' });
      expect(poleWithMinutes.success).toBe(false);
      if (!poleWithMinutes.success) {
        expect(poleWithMinutes.error.issues[0].message).toContain('ที่ขั้วโลก');
      }
    });
  });

  describe('UTM Coordinate Validation', () => {
    it('accepts valid UTM Zone 47 and Zone 48 coordinates within Thailand', () => {
      // KU Bangkhen (Zone 47)
      const res47 = validateUtm({
        zone: 47,
        hemisphere: 'N',
        easting: 669656.82,
        northing: 1531321.89
      });
      expect(res47.isValid).toBe(true);
      if (res47.isValid) {
        expect(res47.isInsideThailand).toBe(true);
      }

      // Khon Kaen (Zone 48)
      const res48 = validateUtm({
        zone: 48,
        hemisphere: 'N',
        easting: 269354.40,
        northing: 1818738.73
      });
      expect(res48.isValid).toBe(true);
      if (res48.isValid) {
        expect(res48.isInsideThailand).toBe(true);
      }
    });

    it('rejects unsupported UTM zones outside 47 and 48', () => {
      const resZone50 = validateUtm({
        zone: 50,
        hemisphere: 'N',
        easting: 500000,
        northing: 1000000
      });
      expect(resZone50.isValid).toBe(false);
      if (!resZone50.isValid) {
        expect(resZone50.error).toContain('UTM Zone ในประเทศไทยต้องเป็น Zone 47 หรือ 48');
      }
    });

    it('detects Easting and Northing axis swap blunders', () => {
      // Northing placed in Easting (1,531,321 m) and Easting placed in Northing (669,656 m)
      const swapped = validateUtm({
        zone: 47,
        hemisphere: 'N',
        easting: 1531321.89,
        northing: 669656.82
      });
      expect(swapped.isValid).toBe(false);
      if (!swapped.isValid) {
        expect(swapped.error).toContain('สลับแกนระหว่างค่า N (Northing) และ E (Easting)');
      }
    });

    it('rejects negative northing in Northern Hemisphere', () => {
      const negN = validateUtm({
        zone: 47,
        hemisphere: 'N',
        easting: 500000,
        northing: -500
      });
      expect(negN.isValid).toBe(false);
    });
  });

  describe('Indian 1975 Coordinate Validation', () => {
    it('accepts valid Indian 1975 coordinates', () => {
      const res = validateIndian1975({
        zone: 47,
        easting: 669988.90,
        northing: 1531019.56
      });
      expect(res.isValid).toBe(true);
    });

    it('rejects swapped Easting/Northing in Indian 1975', () => {
      const res = validateIndian1975({
        zone: 47,
        easting: 1531019.56,
        northing: 669988.90
      });
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.error).toContain('สลับแกนระหว่างค่า N (Northing) และ E (Easting)');
      }
    });
  });

  describe('Traverse Survey Validation', () => {
    it('accepts valid traverse legs', () => {
      const leg = {
        station: 'STN-1',
        targetStation: 'STN-2',
        distance: 125.45,
        azimuthDeg: 45.30
      };
      const res = validateTraverseLeg(leg);
      expect(res.isValid).toBe(true);
    });

    it('rejects legs where station and targetStation are the same', () => {
      const leg = {
        station: 'STN-1',
        targetStation: 'STN-1',
        distance: 100.0,
        azimuthDeg: 90.0
      };
      const res = validateTraverseLeg(leg);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.error).toContain('ต้องไม่เป็นสถานีเดียวกัน');
      }
    });

    it('rejects zero or negative distance with exact station label', () => {
      const resZero = validateTraverseLeg({
        station: 'STN-A',
        targetStation: 'STN-B',
        distance: 0,
        azimuthDeg: 120.0
      });
      expect(resZero.isValid).toBe(false);
      if (!resZero.isValid) {
        expect(resZero.error).toContain('สถานี STN-A → STN-B');
        expect(resZero.error).toContain('ระยะราบต้องมากกว่า 0.000 ม.');
      }

      const resNeg = validateTraverseLeg({
        station: 'STN-A',
        targetStation: 'STN-B',
        distance: -50.0,
        azimuthDeg: 120.0
      });
      expect(resNeg.isValid).toBe(false);
    });

    it('rejects azimuth angles outside [0, 360]', () => {
      const resNeg = validateTraverseLeg({
        station: 'STN-1',
        targetStation: 'STN-2',
        distance: 50.0,
        azimuthDeg: -1.0
      });
      expect(resNeg.isValid).toBe(false);

      const resOver = validateTraverseLeg({
        station: 'STN-1',
        targetStation: 'STN-2',
        distance: 50.0,
        azimuthDeg: 361.0
      });
      expect(resOver.isValid).toBe(false);
    });

    it('validates complete traverse setup and rejects empty leg list', () => {
      const emptySetup = {
        startCoord: { easting: 1000, northing: 2000 },
        endCoord: { easting: 1000, northing: 2000 },
        isClosedLoop: true,
        legs: []
      };
      const res = validateTraverseSetup(emptySetup);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.error).toContain('ตารางวงรอบว่างเปล่า');
      }
    });

    it('validates coordinate integrity of start and end stations', () => {
      const badStart = {
        startCoord: { easting: NaN, northing: 2000 },
        endCoord: { easting: 1000, northing: 2000 },
        legs: [{ station: 'A', targetStation: 'B', distance: 100, azimuthDeg: 45 }]
      };
      expect(validateTraverseSetup(badStart).isValid).toBe(false);
    });

    it('rejects disconnected traverse legs where leg[i].station does not connect to previous targetStation', () => {
      const disconnectedSetup = {
        startCoord: { easting: 1000, northing: 2000 },
        endCoord: { easting: 1000, northing: 2000 },
        isClosedLoop: false,
        legs: [
          { station: 'STN-1', targetStation: 'STN-2', distance: 100, azimuthDeg: 45 },
          { station: 'STN-3', targetStation: 'STN-4', distance: 100, azimuthDeg: 90 }
        ]
      };
      const res = validateTraverseSetup(disconnectedSetup);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.error).toContain('เส้นทางวงรอบไม่ต่อเนื่อง');
        expect(res.error).toContain('STN-3');
      }
    });

    it('rejects closed loop traverse when final station does not close onto the starting station', () => {
      const unclosedLoop = {
        startCoord: { easting: 1000, northing: 2000 },
        endCoord: { easting: 1000, northing: 2000 },
        isClosedLoop: true,
        legs: [
          { station: 'BM-1', targetStation: 'STN-2', distance: 100, azimuthDeg: 45 },
          { station: 'STN-2', targetStation: 'STN-3', distance: 100, azimuthDeg: 135 },
          { station: 'STN-3', targetStation: 'STN-WRONG', distance: 100, azimuthDeg: 270 }
        ]
      };
      const res = validateTraverseSetup(unclosedLoop);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.error).toContain('วงรอบปิด (Closed Loop) ต้องบรรจบกลับมายังสถานีเริ่มต้น');
      }
    });
  });

  describe('Differential Leveling Survey Validation', () => {
    it('accepts valid leveling row', () => {
      const row = {
        id: '1',
        station: 'BM_1',
        bs: 1.452,
        ifs: null,
        fs: null
      };
      const res = validateLevelingRow(row);
      expect(res.isValid).toBe(true);
    });

    it('rejects row where all staff readings (BS, IFS, FS) are null', () => {
      const emptyRow = {
        id: '1',
        station: 'TP_1',
        bs: null,
        ifs: null,
        fs: null
      };
      const res = validateLevelingRow(emptyRow);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.error).toContain('ต้องมีค่าอ่านไม้ระดับอย่างน้อย 1 ค่า');
      }
    });

    it('rejects row containing both IFS and FS', () => {
      const conflictRow = {
        id: '1',
        station: 'PT_1',
        bs: null,
        ifs: 1.250,
        fs: 1.340
      };
      const res = validateLevelingRow(conflictRow);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.error).toContain('ไม่สามารถมีทั้งค่า IFS และ FS พร้อมกัน');
      }
    });

    it('rejects row containing both BS and IFS', () => {
      const conflictBsIfs = {
        id: '1',
        station: 'TP_ERR',
        bs: 1.450,
        ifs: 1.250,
        fs: null
      };
      const res = validateLevelingRow(conflictBsIfs);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.error).toContain('ไม่สามารถมีทั้งค่า BS และ IFS พร้อมกัน');
      }
    });

    it('accepts inverted staff readings (negative BS/IFS/FS) for tunnel/soffit leveling', () => {
      const invertedRow = {
        id: '1',
        station: 'BM_ROOF',
        bs: -1.250,
        ifs: null,
        fs: null
      };
      expect(validateLevelingRow(invertedRow).isValid).toBe(true);
    });

    it('validates complete leveling setup and requires BS on first station', () => {
      const noBsStart = {
        startElevation: 100.0,
        rows: [
          { id: '1', station: 'BM_START', bs: null, ifs: null, fs: 1.5 }
        ]
      };
      const res = validateLevelingSetup(noBsStart);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.error).toContain('ขาดค่าอ่านไม้ระดับส่องหลัง (Backsight - BS)');
      }
    });

    it('rejects empty leveling setup', () => {
      const emptySetup = {
        startElevation: 100.0,
        rows: []
      };
      const res = validateLevelingSetup(emptySetup);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.error).toContain('สมุดจดงานระดับว่างเปล่า');
      }
    });
  });

  describe('Thai Land Area Validation', () => {
    it('accepts valid Thai land units (Rai, Ngan, Wah)', () => {
      const area = {
        rai: 5,
        ngan: 2,
        wah: 35.5,
        sqMeters: 8942.0
      };
      expect(validateThaiLandArea(area).isValid).toBe(true);
    });

    it('rejects Ngan >= 4 (since 4 Ngan = 1 Rai)', () => {
      const invalidNgan = {
        rai: 2,
        ngan: 4,
        wah: 50.0,
        sqMeters: 4000.0
      };
      const res = validateThaiLandArea(invalidNgan);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.error).toContain('ค่างานต้องอยู่ระหว่าง 0 ถึง 3');
      }
    });

    it('rejects Wah >= 100 (since 100 Wah = 1 Ngan)', () => {
      const invalidWah = {
        rai: 2,
        ngan: 1,
        wah: 100.0,
        sqMeters: 4000.0
      };
      const res = validateThaiLandArea(invalidWah);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.error).toContain('ค่าตารางวาต้องน้อยกว่า 100 ตารางวา');
      }
    });

    it('validates raw square meters input and rejects negative numbers', () => {
      expect(validateSqMeters(1600).isValid).toBe(true);
      expect(validateSqMeters(0).isValid).toBe(true);
      expect(validateSqMeters(-10).isValid).toBe(false);
      expect(validateSqMeters(NaN).isValid).toBe(false);
    });

    it('accepts sanitized string inputs for square meters', () => {
      const res = validateSqMeters('1,600.00');
      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.data).toBe(1600);
      }

      const resThai = validateSqMeters('๑๖๐๐');
      expect(resThai.isValid).toBe(true);
      if (resThai.isValid) {
        expect(resThai.data).toBe(1600);
      }
    });
  });

  describe('Survey Numeric Sanitizer & Real-World String Parsing', () => {
    it('normalizes Thai numerals (๐-๙) into Arabic numbers', () => {
      expect(sanitizeSurveyNumber('๑๓.๘๔๖๖๔')).toBeCloseTo(13.84664, 5);
      expect(sanitizeSurveyNumber('๑๐๐.๕๖๙๘๒')).toBeCloseTo(100.56982, 5);
      expect(sanitizeSurveyNumber('๖๖๙๖๕๖.๘๒')).toBeCloseTo(669656.82, 2);
    });

    it('normalizes Unicode minus signs (U+2212, en-dash, em-dash) into standard minus', () => {
      expect(sanitizeSurveyNumber('−13.84664')).toBeCloseTo(-13.84664, 5);
      expect(sanitizeSurveyNumber('–13.84664')).toBeCloseTo(-13.84664, 5);
      expect(sanitizeSurveyNumber('—13.84664')).toBeCloseTo(-13.84664, 5);
      expect(sanitizeSurveyNumber('－13.84664')).toBeCloseTo(-13.84664, 5);
    });

    it('normalizes thousands separator commas without precision loss', () => {
      expect(sanitizeSurveyNumber('669,656.82')).toBeCloseTo(669656.82, 2);
      expect(sanitizeSurveyNumber('1,531,321.89')).toBeCloseTo(1531321.89, 2);
      expect(sanitizeSurveyNumber('669,656')).toBe(669656);
    });

    it('normalizes European/Thai decimal commas when only comma is present', () => {
      expect(sanitizeSurveyNumber('13,84664')).toBeCloseTo(13.84664, 5);
      expect(sanitizeSurveyNumber('100,56982')).toBeCloseTo(100.56982, 5);
    });

    it('strictly rejects strings with trailing garbage or multiple decimal dots', () => {
      expect(sanitizeSurveyNumber('13.84664abc')).toBeNull();
      expect(sanitizeSurveyNumber('13.84.64')).toBeNull();
      expect(sanitizeSurveyNumber('abc')).toBeNull();
      expect(sanitizeSurveyNumber('')).toBeNull();
      expect(sanitizeSurveyNumber(null)).toBeNull();
    });

    it('allows survey validators to accept formatted strings seamlessly', () => {
      // WGS84 with comma decimal
      const wgsStr = validateWgs84({ lat: '13,84664', lng: '100,56982' });
      expect(wgsStr.isValid).toBe(true);
      if (wgsStr.isValid) {
        expect(wgsStr.data.lat).toBeCloseTo(13.84664, 5);
        expect(wgsStr.data.lng).toBeCloseTo(100.56982, 5);
      }

      // UTM with thousands separators
      const utmStr = validateUtm({
        zone: 47,
        easting: '669,656.82',
        northing: '1,531,321.89'
      });
      expect(utmStr.isValid).toBe(true);
      if (utmStr.isValid) {
        expect(utmStr.data.easting).toBeCloseTo(669656.82, 2);
        expect(utmStr.data.northing).toBeCloseTo(1531321.89, 2);
      }

      // Indian 1975 with thousands separators
      const indStr = validateIndian1975({
        zone: 47,
        easting: '669,988.90',
        northing: '1,531,019.56'
      });
      expect(indStr.isValid).toBe(true);
      if (indStr.isValid) {
        expect(indStr.data.easting).toBeCloseTo(669988.90, 2);
      }

      // DMS with string inputs
      const dmsStr = validateDms({
        lat: { deg: '13', min: '50', sec: '47.9', direction: 'N' },
        lng: { deg: '100', min: '34', sec: '11.35', direction: 'E' }
      });
      expect(dmsStr.isValid).toBe(true);
      if (dmsStr.isValid) {
        expect(dmsStr.data.lat.deg).toBe(13);
        expect(dmsStr.data.lat.sec).toBeCloseTo(47.9, 1);
      }
    });
  });

  describe('Error Diagnostic Presentation & Deduplication', () => {
    it('deduplicates identical error messages across multiple invalid fields', () => {
      const bothInvalid = validateWgs84({ lat: NaN, lng: NaN });
      expect(bothInvalid.isValid).toBe(false);
      if (!bothInvalid.isValid) {
        // Message should appear exactly once, not twice joined by '|'
        const occurrences = bothInvalid.error.split('กรุณาระบุตัวเลขพิกัดละติจูดและลองจิจูดให้ครบถ้วน').length - 1;
        expect(occurrences).toBe(1);
      }
    });

    it('projections.ts validateIndian1975Coordinates enforces Indian 1975 domain errors', () => {
      const valid = validateIndian1975Coordinates(669988.90, 1531019.56, 47);
      expect(valid.isValid).toBe(true);

      const swapped = validateIndian1975Coordinates(1531019.56, 669988.90, 47);
      expect(swapped.isValid).toBe(false);
      expect(swapped.error).toContain('Indian 1975 Easting');
    });
  });
});
