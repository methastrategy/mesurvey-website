import { describe, it, expect } from 'vitest';
import { 
  detectTotalStationFormat, 
  decodeTotalStationFile,
  parseLeicaGsi,
  parseTopconGts7,
  parseSokkiaSdr,
  parseNikonRaw
} from '../src/utils/raw-converters/total-station-decoder';

describe('Universal Total Station Raw Stream Decoder', () => {
  describe('Format Auto-Detection', () => {
    it('detects Leica GSI format correctly', () => {
      const gsiSample = '110001+00000001 21.002+09015300 22.002+08500000 31..00+00125340';
      expect(detectTotalStationFormat(gsiSample)).toBe('leica-gsi');
    });

    it('detects Topcon GTS-7 format correctly', () => {
      const topconSample = 'STN,ST-01,1.550,CP\nSS,PT-101,1.500,125.340,90.1530,85.0000,TOPO';
      expect(detectTotalStationFormat(topconSample)).toBe('topcon-gts7');
    });

    it('detects Sokkia SDR format correctly', () => {
      const sdrSample = '00NMSDR33 V04-04.01\n02KI BM1 1000.00 2000.00 10.00 1.55\n07KI BM1 P1 125.34 85.00 90.15';
      expect(detectTotalStationFormat(sdrSample)).toBe('sokkia-sdr');
    });

    it('detects Nikon RAW format correctly', () => {
      const nikonSample = 'CO,Nikon RAW File\nST,ST-1,,,1.550,0.0000\nSS,1,1.500,125.340,90.1530,85.0000,12:00:00,BENCH';
      expect(detectTotalStationFormat(nikonSample)).toBe('nikon-raw');
    });
  });

  describe('Leica GSI Decoder', () => {
    it('decodes GSI-8 and GSI-16 words into stations, angles, and distances', () => {
      const gsi = [
        '110001+00000001 88..00+00001550',
        '110002+00000002 21.002+09030450 22.002+08900000 31..00+00125340 87..00+00001500',
        '110003+00000003 21.002+18000000 22.002+09000000 31..00+00098450 87..00+00001500',
      ].join('\n');

      const decoded = decodeTotalStationFile(gsi);
      expect(decoded.format).toBe('leica-gsi');
      expect(decoded.stations.length).toBeGreaterThanOrEqual(1);
      expect(decoded.stations[0].instrumentHeight).toBeCloseTo(1.55, 2);

      expect(decoded.observations.length).toBe(2);
      expect(decoded.observations[0].slopeDistance).toBeCloseTo(125.340, 3);
      // Angle: 90° 30' 45" = 90.5125°
      expect(decoded.observations[0].horizontalAngleDeg).toBeCloseTo(90.5125, 4);

      expect(decoded.traverseLegs.length).toBe(2);
      expect(decoded.traverseLegs[0].angleD).toBe(90);
      expect(decoded.traverseLegs[0].angleM).toBe(30);
    });
  });

  describe('Topcon GTS-7 Decoder', () => {
    it('decodes STN and SS records into stations and traverse legs', () => {
      const gt7 = [
        'STN,A,1.550,BASE',
        'SS,B,1.500,125.340,98.1230,88.4500,TRAVERSE',
        'SS,C,1.500,112.880,101.4515,89.1000,TRAVERSE'
      ].join('\n');

      const decoded = decodeTotalStationFile(gt7);
      expect(decoded.format).toBe('topcon-gts7');
      expect(decoded.stations[0].station).toBe('A');
      expect(decoded.stations[0].instrumentHeight).toBeCloseTo(1.55, 2);

      expect(decoded.observations.length).toBe(2);
      expect(decoded.observations[0].targetStation).toBe('B');
      expect(decoded.observations[0].slopeDistance).toBeCloseTo(125.340, 3);
      // Angle: 98.1230 => 98° 12' 30"
      expect(decoded.traverseLegs[0].angleD).toBe(98);
      expect(decoded.traverseLegs[0].angleM).toBe(12);
      expect(decoded.traverseLegs[0].angleS).toBe(30);
    });
  });

  describe('Sokkia SDR Decoder', () => {
    it('decodes 02 and 07 observation records', () => {
      const sdr = [
        '00NMSDR33 V04-04.01',
        '02KI STN1 500000.0 1500000.0 50.0 1.55',
        '07KI STN1 P1 150.25 90.00 45.30',
        '07KI STN1 P2 200.50 90.00 135.00'
      ].join('\n');

      const decoded = decodeTotalStationFile(sdr);
      expect(decoded.format).toBe('sokkia-sdr');
      expect(decoded.observations.length).toBe(2);
      expect(decoded.observations[0].slopeDistance).toBeCloseTo(150.25, 2);
      expect(decoded.observations[0].horizontalAngleDeg).toBeCloseTo(45.30, 2);
    });
  });

  describe('Nikon RAW Decoder', () => {
    it('decodes ST and SS records correctly', () => {
      const raw = [
        'CO,Nikon RAW File',
        'ST,BM-1,,,1.600,0.0000',
        'SS,1,1.500,100.000,90.3000,90.0000,10:00:00,CP',
        'SS,2,1.500,120.500,180.0000,90.0000,10:05:00,CP'
      ].join('\n');

      const decoded = decodeTotalStationFile(raw);
      expect(decoded.format).toBe('nikon-raw');
      expect(decoded.stations[0].station).toBe('BM-1');
      expect(decoded.stations[0].instrumentHeight).toBeCloseTo(1.60, 2);
      expect(decoded.observations.length).toBe(2);
      expect(decoded.observations[0].slopeDistance).toBeCloseTo(100.0, 2);
      expect(decoded.traverseLegs[0].angleD).toBe(90);
      expect(decoded.traverseLegs[0].angleM).toBe(30);
    });
  });
});
