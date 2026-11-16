import { describe, it, expect } from 'vitest';
import { 
  processBathymetricSoundings,
  linearInterpolateTime,
  calculateIhoTvuLimit,
  SAMPLE_BATHYMETRIC_GNSS,
  SAMPLE_BATHYMETRIC_SOUNDINGS,
  SAMPLE_BATHYMETRIC_TIDE
} from '../src/utils/bathymetric-sounding';

describe('Bathymetric Sounding & Tide Reduction Engine (bathymetric-sounding.ts)', () => {
  describe('Linear Time Interpolation', () => {
    it('interpolates intermediate positions and water levels accurately', () => {
      const samples = [
        { timestampSec: 0, val: 10.0 },
        { timestampSec: 10, val: 20.0 },
      ];
      expect(linearInterpolateTime(5, samples)).toBeCloseTo(15.0, 4);
      expect(linearInterpolateTime(0, samples)).toBeCloseTo(10.0, 4);
      expect(linearInterpolateTime(10, samples)).toBeCloseTo(20.0, 4);
      // Clamp boundaries
      expect(linearInterpolateTime(-5, samples)).toBeCloseTo(10.0, 4);
      expect(linearInterpolateTime(15, samples)).toBeCloseTo(20.0, 4);
    });
  });

  describe('IHO S-44 TVU Calculation', () => {
    it('computes allowable vertical uncertainty threshold within IHO Special Order', () => {
      // At depth = 10m: TVU = sqrt(0.25^2 + (0.0075 * 10)^2) = sqrt(0.0625 + 0.005625) ≈ 0.261m
      const tvu = calculateIhoTvuLimit(10.0, 'special');
      expect(tvu).toBeCloseTo(0.261, 3);
    });
  });

  describe('Full Bathymetric Sounding Processing', () => {
    it('correctly calculates true bed elevation with draft, heave, and tide reduction', () => {
      const draftM = 0.45;
      const result = processBathymetricSoundings(
        SAMPLE_BATHYMETRIC_GNSS,
        SAMPLE_BATHYMETRIC_SOUNDINGS,
        SAMPLE_BATHYMETRIC_TIDE,
        draftM
      );

      expect(result.totalSoundings).toBe(6);
      expect(result.processedPoints.length).toBe(6);

      // Point 0:
      // Raw depth = 3.50m, draft = 0.45m, heave = 0.02m
      // Reduced depth = 3.50 + 0.45 - 0.02 = 3.93m
      // Tide at t=0 is 1.25m MSL
      // Bed elevation = 1.25 - 3.93 = -2.68m MSL
      const p0 = result.processedPoints[0];
      expect(p0.reducedDepthM).toBeCloseTo(3.93, 2);
      expect(p0.bedElevationMslM).toBeCloseTo(-2.68, 2);
      expect(p0.easting).toBeCloseTo(662000.0, 1);
      expect(p0.northing).toBeCloseTo(1521000.0, 1);

      // Deepest point at t=20s (raw depth 11.20m):
      // reducedDepth ≈ 11.20 + 0.45 - 0.05 = 11.60m
      const p2 = result.processedPoints[2];
      expect(p2.reducedDepthM).toBeCloseTo(11.60, 2);
      expect(p2.bedElevationMslM).toBeLessThan(-10.0);
    });
  });
});
