import { describe, it, expect } from 'vitest';
import {
  parseRinexText,
  ecefToGeodetic,
  getConstellation,
  SAMPLE_RINEX_BASE,
  SAMPLE_RINEX_ROVER
} from '../src/utils/rinex-parser';

describe('MESURV Geomatics Core: RINEX Multi-GNSS Parser', () => {
  it('accurately converts ECEF coordinates to WGS84 Geodetic (Lat, Lng, Height)', () => {
    // Bangkok / Kasetsart University region approx coordinates
    const x = -1054321.8542;
    const y = 5987123.4128;
    const z = 1520274.6514;

    const geo = ecefToGeodetic(x, y, z);
    // Thailand latitude is ~13-14° N, Longitude is ~100° E
    expect(geo.lat).toBeGreaterThan(13.0);
    expect(geo.lat).toBeLessThan(14.5);
    expect(geo.lng).toBeGreaterThan(99.0);
    expect(geo.lng).toBeLessThan(102.0);
    expect(typeof geo.height).toBe('number');
  });

  it('correctly maps PRN identifiers to their parent constellations', () => {
    expect(getConstellation('G01')).toBe('GPS');
    expect(getConstellation('C06')).toBe('BeiDou');
    expect(getConstellation('R18')).toBe('GLONASS');
    expect(getConstellation('E05')).toBe('Galileo');
    expect(getConstellation('J02')).toBe('QZSS');
  });

  it('parses real CHC/ComNav RINEX 3.04 base station observation file', () => {
    const result = parseRinexText(SAMPLE_RINEX_BASE);

    expect(result.header.version).toContain('3.04');
    expect(result.header.markerName).toContain('BASE-01');
    expect(result.header.observer).toBe('6610554196');
    expect(result.header.agency).toContain('KU SURVEY DEPT');
    expect(result.header.receiverType).toContain('i90 GNSS');
    expect(result.header.antennaType).toContain('CHCI90');
    expect(result.header.approxPositionECEF?.x).toBeCloseTo(-1054321.8542, 3);
    expect(result.header.approxGeodetic?.lat).toBeGreaterThan(13.0);
    expect(result.header.approxGeodetic?.lng).toBeGreaterThan(99.0);
    expect(result.header.antennaDelta?.h).toBe(1.85);

    // Multi-constellation detection
    expect(result.constellationsDetected).toContain('GPS');
    expect(result.constellationsDetected).toContain('BeiDou');
    expect(result.constellationsDetected).toContain('GLONASS');
    expect(result.constellationsDetected).toContain('Galileo');

    // Satellites tracking & SNR
    expect(result.satellitesTracked.length).toBeGreaterThanOrEqual(10);
    expect(result.averageSnr).toBeGreaterThan(38.0);
    expect(result.healthStatus).toBe('HEALTHY');

    result.satellitesTracked.forEach(sat => {
      expect(sat.azimuthDeg).toBeGreaterThanOrEqual(0);
      expect(sat.azimuthDeg).toBeLessThanOrEqual(360);
      expect(sat.elevationDeg).toBeGreaterThanOrEqual(15);
      expect(sat.elevationDeg).toBeLessThanOrEqual(90);
      expect(sat.snrDbHz).toBeGreaterThan(30);
    });
  });

  it('parses rover observation file and extracts marker metadata', () => {
    const result = parseRinexText(SAMPLE_RINEX_ROVER);

    expect(result.header.markerName).toContain('ROVER-01');
    expect(result.header.antennaDelta?.h).toBe(1.70);
    expect(result.satellitesTracked.length).toBeGreaterThanOrEqual(10);
  });
});
