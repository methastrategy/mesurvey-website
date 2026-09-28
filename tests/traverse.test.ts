import { describe, it, expect } from 'vitest';
import { polarToRect, rectToPolar, adjustTraverseBowditch } from '../src/core/traverse';
import { SAMPLE_TRAVERSE_LEGS, SAMPLE_TRAVERSE_START } from '../src/data/survey-presets';
import { TraverseLegInput } from '../src/types/survey';

describe('Bowditch Traverse Adjustment Engine (traverse.ts)', () => {
  describe('Polar and Rectangular Conversions', () => {
    it('converts distance and azimuth to dE (Departure) and dN (Latitude) correctly', () => {
      // 0° (North): dE = 0, dN = 100
      const north = polarToRect(100.0, 0.0);
      expect(north.de).toBeCloseTo(0.0, 4);
      expect(north.dn).toBeCloseTo(100.0, 4);

      // 90° (East): dE = 100, dN = 0
      const east = polarToRect(100.0, 90.0);
      expect(east.de).toBeCloseTo(100.0, 4);
      expect(east.dn).toBeCloseTo(0.0, 4);

      // 180° (South): dE = 0, dN = -100
      const south = polarToRect(100.0, 180.0);
      expect(south.de).toBeCloseTo(0.0, 4);
      expect(south.dn).toBeCloseTo(-100.0, 4);

      // 270° (West): dE = -100, dN = 0
      const west = polarToRect(100.0, 270.0);
      expect(west.de).toBeCloseTo(-100.0, 4);
      expect(west.dn).toBeCloseTo(0.0, 4);
    });

    it('converts dE and dN back to distance and azimuth accurately', () => {
      const p1 = rectToPolar(100.0, 100.0); // 45°
      expect(p1.distance).toBeCloseTo(141.4214, 3);
      expect(p1.azimuthDeg).toBeCloseTo(45.0, 3);

      const p2 = rectToPolar(100.0, -100.0); // 135°
      expect(p2.distance).toBeCloseTo(141.4214, 3);
      expect(p2.azimuthDeg).toBeCloseTo(135.0, 3);

      const p3 = rectToPolar(-100.0, -100.0); // 225°
      expect(p3.distance).toBeCloseTo(141.4214, 3);
      expect(p3.azimuthDeg).toBeCloseTo(225.0, 3);

      const p4 = rectToPolar(-100.0, 100.0); // 315°
      expect(p4.distance).toBeCloseTo(141.4214, 3);
      expect(p4.azimuthDeg).toBeCloseTo(315.0, 3);
    });
  });

  describe('Sample Closed Traverse Loop Adjustment', () => {
    it('achieves realistic high precision (>= 1:5,000) on SAMPLE_TRAVERSE_LEGS', () => {
      const result = adjustTraverseBowditch(
        SAMPLE_TRAVERSE_LEGS,
        SAMPLE_TRAVERSE_START,
        SAMPLE_TRAVERSE_START // Closed loop
      );

      // Check perimeter
      expect(result.totalPerimeter).toBeCloseTo(519.775, 2);

      // Check that linear misclosure is small and realistic (< 0.05m = 5cm on 520m)
      expect(result.linearMisclosure).toBeLessThan(0.05);

      // Check precision ratio is >= 1:5,000
      expect(result.precisionRatio).toBeGreaterThanOrEqual(5000);

      // Check precision grade meets RTSD survey engineering standards
      expect(result.precisionGrade).toContain('ชั้น 2');

      // Check loop closure on final station
      const finalLeg = result.adjustedLegs[result.adjustedLegs.length - 1];
      expect(finalLeg.adjustedEasting).toBeCloseTo(SAMPLE_TRAVERSE_START.easting, 3);
      expect(finalLeg.adjustedNorthing).toBeCloseTo(SAMPLE_TRAVERSE_START.northing, 3);

      // Station coordinates dictionary
      expect(result.stationCoordinates['BM-1'].easting).toBeCloseTo(SAMPLE_TRAVERSE_START.easting, 3);
      expect(result.stationCoordinates['BM-1'].northing).toBeCloseTo(SAMPLE_TRAVERSE_START.northing, 3);
    });

    it('correctly distributes Bowditch corrections proportionally to leg lengths', () => {
      const result = adjustTraverseBowditch(
        SAMPLE_TRAVERSE_LEGS,
        SAMPLE_TRAVERSE_START,
        SAMPLE_TRAVERSE_START
      );

      // Total corrections must exactly equal negative misclosure
      const sumCorrDe = result.adjustedLegs.reduce((s, l) => s + l.corrDe, 0);
      const sumCorrDn = result.adjustedLegs.reduce((s, l) => s + l.corrDn, 0);

      expect(sumCorrDe).toBeCloseTo(-result.misclosureE, 3);
      expect(sumCorrDn).toBeCloseTo(-result.misclosureN, 3);

      // Total adjusted deltas must equal target coordinate differences (0 for closed loop)
      const sumAdjDe = result.adjustedLegs.reduce((s, l) => s + l.adjDe, 0);
      const sumAdjDn = result.adjustedLegs.reduce((s, l) => s + l.adjDn, 0);

      expect(sumAdjDe).toBeCloseTo(0.0, 3);
      expect(sumAdjDn).toBeCloseTo(0.0, 3);
    });
  });

  describe('Connecting Link Traverse', () => {
    it('correctly adjusts an open connecting traverse between two known benchmarks', () => {
      const linkLegs: TraverseLegInput[] = [
        { station: 'BM-A', targetStation: 'P-1', distance: 100.0, azimuthDeg: 45.0 },
        { station: 'P-1', targetStation: 'BM-B', distance: 100.0, azimuthDeg: 45.0 }
      ];
      const start = { easting: 1000.0, northing: 2000.0 };
      // True coordinate after 200m at 45°:
      // dE = 200 * sin(45°) = 141.421, dN = 200 * cos(45°) = 141.421
      const endKnown = { easting: 1141.421, northing: 2141.421 };

      const result = adjustTraverseBowditch(linkLegs, start, endKnown);

      expect(result.totalPerimeter).toBeCloseTo(200.0, 1);
      expect(result.linearMisclosure).toBeLessThan(0.005);
      expect(result.adjustedLegs).toHaveLength(2);
      expect(result.adjustedLegs[1].adjustedEasting).toBeCloseTo(endKnown.easting, 2);
      expect(result.adjustedLegs[1].adjustedNorthing).toBeCloseTo(endKnown.northing, 2);
    });
  });

  describe('Input Validations & Error Diagnostics', () => {
    it('rejects empty leg list with informative message', () => {
      expect(() => adjustTraverseBowditch([], { easting: 0, northing: 0 }, { easting: 0, northing: 0 }))
        .toThrow('ตารางวงรอบว่างเปล่า');
    });

    it('rejects zero or negative distances with exact station name in error', () => {
      const invalidDist: TraverseLegInput[] = [
        { station: 'STN-1', targetStation: 'STN-2', distance: -50.0, azimuthDeg: 90.0 }
      ];
      expect(() => adjustTraverseBowditch(invalidDist, { easting: 0, northing: 0 }, { easting: 0, northing: 0 }))
        .toThrow('สถานี STN-1 → STN-2');

      const zeroDist: TraverseLegInput[] = [
        { station: 'STN-A', targetStation: 'STN-B', distance: 0, azimuthDeg: 90.0 }
      ];
      expect(() => adjustTraverseBowditch(zeroDist, { easting: 0, northing: 0 }, { easting: 0, northing: 0 }))
        .toThrow('ระยะราบต้องมากกว่า 0.000 ม.');
    });

    it('rejects out of bounds azimuths (> 360° or < 0°)', () => {
      const invalidAz: TraverseLegInput[] = [
        { station: 'STN-X', targetStation: 'STN-Y', distance: 100.0, azimuthDeg: 380.0 }
      ];
      expect(() => adjustTraverseBowditch(invalidAz, { easting: 0, northing: 0 }, { easting: 0, northing: 0 }))
        .toThrow('ต้องอยู่ในช่วง 0° ถึง 360°');

      const negAz: TraverseLegInput[] = [
        { station: 'STN-X', targetStation: 'STN-Y', distance: 100.0, azimuthDeg: -10.0 }
      ];
      expect(() => adjustTraverseBowditch(negAz, { easting: 0, northing: 0 }, { easting: 0, northing: 0 }))
        .toThrow('ต้องอยู่ในช่วง 0° ถึง 360°');
    });
  });
});
