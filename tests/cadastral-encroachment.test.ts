import { describe, it, expect } from 'vitest';
import { 
  evaluateCadastralEncroachment,
  isPointInsidePolygon,
  pointToSegmentProjection,
  calculatePolygonArea,
  calculatePolygonPerimeter,
  SAMPLE_CADASTRAL_BOUNDARY,
  SAMPLE_SURVEYED_FENCE
} from '../src/utils/cadastral-encroachment';

describe('Cadastral Boundary Encroachment Engine (cadastral-encroachment.ts)', () => {
  describe('Geometric Primitives', () => {
    it('calculates polygon area and perimeter accurately', () => {
      // 30m x 40m rectangular boundary
      const area = calculatePolygonArea(SAMPLE_CADASTRAL_BOUNDARY);
      expect(area).toBeCloseTo(1200.0, 3);

      const perimeter = calculatePolygonPerimeter(SAMPLE_CADASTRAL_BOUNDARY);
      expect(perimeter).toBeCloseTo(140.0, 3);
    });

    it('correctly determines whether points are inside or outside polygon', () => {
      // Inside point
      expect(isPointInsidePolygon({ easting: 661515, northing: 1520020 }, SAMPLE_CADASTRAL_BOUNDARY)).toBe(true);
      // Outside point (to the East: E=661535 > 661530)
      expect(isPointInsidePolygon({ easting: 661535, northing: 1520020 }, SAMPLE_CADASTRAL_BOUNDARY)).toBe(false);
    });

    it('projects point perpendicular to line segment and computes exact distance', () => {
      const a = { easting: 0, northing: 0 };
      const b = { easting: 10, northing: 0 };
      const p = { easting: 5, northing: 3 };

      const proj = pointToSegmentProjection(p, a, b);
      expect(proj.distance).toBeCloseTo(3.0, 4);
      expect(proj.closestPoint.easting).toBeCloseTo(5.0, 4);
      expect(proj.closestPoint.northing).toBeCloseTo(0.0, 4);
      expect(proj.t).toBeCloseTo(0.5, 4);
    });
  });

  describe('Full Encroachment Evaluation on Sample Deed', () => {
    it('detects point F-3 encroaching eastward by ~18 cm', () => {
      const result = evaluateCadastralEncroachment(SAMPLE_CADASTRAL_BOUNDARY, SAMPLE_SURVEYED_FENCE);

      expect(result.totalBoundaryPoints).toBe(4);
      expect(result.totalSurveyedPoints).toBe(5);
      expect(result.encroachingCount).toBe(1);
      expect(result.safeCount).toBe(4);
      expect(result.maxEncroachmentCm).toBeCloseTo(18.0, 1);
      expect(result.status).toBe('severe');

      const f3 = result.items.find(i => i.id === 'F-3');
      expect(f3).toBeDefined();
      if (!f3) return;

      expect(f3.isInside).toBe(false);
      expect(f3.isEncroaching).toBe(true);
      expect(f3.encroachmentCm).toBeCloseTo(18.0, 1);
      expect(f3.offsetDistanceM).toBeLessThan(0); // negative distance for encroachment
      expect(f3.closestSegmentFrom).toContain('หมุด 2');
      expect(f3.closestSegmentTo).toContain('หมุด 3');
      expect(f3.recommendation).toContain('รุกล้ำออกนอกโฉนด');
    });

    it('classifies all points as clean when structure is completely inside setback', () => {
      const safePoints = [
        { id: 'S-1', name: 'อาคารมุม 1', easting: 661502.0, northing: 1520002.0 },
        { id: 'S-2', name: 'อาคารมุม 2', easting: 661528.0, northing: 1520002.0 },
      ];

      const result = evaluateCadastralEncroachment(SAMPLE_CADASTRAL_BOUNDARY, safePoints);
      expect(result.encroachingCount).toBe(0);
      expect(result.status).toBe('clean');
      expect(result.items[0].isEncroaching).toBe(false);
      expect(result.items[0].offsetDistanceM).toBeGreaterThan(0);
    });
  });
});
