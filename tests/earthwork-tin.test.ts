import { describe, it, expect } from 'vitest';
import {
  delaunayTriangulate2D,
  computePrismoidTriangle,
  calculateSurfaceToDatumVolume,
  calculateSurfaceToSlopedPlaneVolume,
  calculateSurfaceToSurfaceVolume,
  parseEarthworkPointsCsv,
  deduplicatePoints,
  SAMPLE_EXISTING_SURFACE_POINTS,
  SAMPLE_DESIGN_SURFACE_POINTS,
  TinPoint,
  TinTriangle
} from '../src/utils/earthwork-tin';

describe('MESURV Earthwork TIN & Prismoidal Volume Engine (earthwork-tin.ts)', () => {

  describe('Delaunay Triangulation & Deduplication', () => {
    it('deduplicates points with distance < tolerance', () => {
      const raw: TinPoint[] = [
        { id: '1', x: 100, y: 100, z: 10 },
        { id: '2', x: 100.0005, y: 100.0005, z: 10.5 }, // duplicate within 1mm
        { id: '3', x: 200, y: 200, z: 15 },
      ];
      const deduped = deduplicatePoints(raw);
      expect(deduped).toHaveLength(2);
      expect(deduped[0].id).toBe('1');
      expect(deduped[1].id).toBe('3');
    });

    it('returns empty array when fewer than 3 points provided', () => {
      expect(delaunayTriangulate2D([])).toEqual([]);
      expect(delaunayTriangulate2D([{ x: 0, y: 0, z: 1 }])).toEqual([]);
      expect(delaunayTriangulate2D([{ x: 0, y: 0, z: 1 }, { x: 1, y: 1, z: 2 }])).toEqual([]);
    });

    it('triangulates a simple square of 4 points into 2 triangles', () => {
      const square: TinPoint[] = [
        { id: 'p1', x: 0, y: 0, z: 10 },
        { id: 'p2', x: 10, y: 0, z: 10 },
        { id: 'p3', x: 10, y: 10, z: 10 },
        { id: 'p4', x: 0, y: 10, z: 10 },
      ];
      const triangles = delaunayTriangulate2D(square);
      expect(triangles).toHaveLength(2);

      const totalArea = triangles.reduce((sum, t) => sum + t.area2D, 0);
      expect(totalArea).toBeCloseTo(100.0, 4); // 10 x 10 = 100 m²
    });

    it('correctly triangulates the sample dataset of 12 terrain points', () => {
      const triangles = delaunayTriangulate2D(SAMPLE_EXISTING_SURFACE_POINTS);
      expect(triangles.length).toBeGreaterThan(10);

      // Verify all triangles have strictly positive area
      for (const t of triangles) {
        expect(t.area2D).toBeGreaterThan(0);
      }
    });
  });

  describe('Prismoidal Truncated Triangular Prism Volume Integration', () => {
    const dummyTriangle: TinTriangle = {
      id: 'T-1',
      p1: { x: 0, y: 0, z: 10 },
      p2: { x: 10, y: 0, z: 10 },
      p3: { x: 0, y: 10, z: 10 },
      area2D: 50.0 // 0.5 * 10 * 10
    };

    it('calculates Pure Cut volume accurately: V = S * (h1 + h2 + h3)/3', () => {
      // Datum = 5.0, so h1 = 5, h2 = 5, h3 = 5
      const res = computePrismoidTriangle(dummyTriangle, 5.0, 5.0, 5.0);
      expect(res.classification).toBe('cut');
      expect(res.cutVolumeM3).toBeCloseTo(50.0 * 5.0, 4); // 250 m³
      expect(res.fillVolumeM3).toBe(0);
      expect(res.cutAreaM2).toBeCloseTo(50.0, 4);
      expect(res.fillAreaM2).toBe(0);
    });

    it('calculates Pure Fill volume accurately: V = S * (|h1| + |h2| + |h3|)/3', () => {
      // Datum = 15.0, so h1 = -5, h2 = -5, h3 = -5
      const res = computePrismoidTriangle(dummyTriangle, -5.0, -5.0, -5.0);
      expect(res.classification).toBe('fill');
      expect(res.fillVolumeM3).toBeCloseTo(50.0 * 5.0, 4); // 250 m³
      expect(res.cutVolumeM3).toBe(0);
      expect(res.cutAreaM2).toBe(0);
      expect(res.fillAreaM2).toBeCloseTo(50.0, 4);
    });

    it('calculates exact Prismoidal zero-crossing transition triangle with 1 cut vertex and 2 fill vertices', () => {
      // h1 = +2 (Cut), h2 = -2 (Fill), h3 = -2 (Fill)
      // t12 = 2 / (2 - (-2)) = 0.5
      // t13 = 2 / (2 - (-2)) = 0.5
      // Cut Area = 50 * 0.5 * 0.5 = 12.5 m²
      // Cut Vol = (1/3) * 12.5 * 2 = 8.3333 m³
      // Fill Area = 50 - 12.5 = 37.5 m²
      const res = computePrismoidTriangle(dummyTriangle, 2.0, -2.0, -2.0);
      expect(res.cutAreaM2).toBeCloseTo(12.5, 4);
      expect(res.fillAreaM2).toBeCloseTo(37.5, 4);
      expect(res.cutVolumeM3).toBeCloseTo((1 / 3) * 12.5 * 2.0, 4);
      expect(res.fillVolumeM3).toBeGreaterThan(0);
      // Net linear check: V_net = V_cut - V_fill = (S/3) * (h1 + h2 + h3)
      const expectedNet = (50.0 / 3) * (2.0 - 2.0 - 2.0); // -33.3333 m³
      expect(res.netVolumeM3).toBeCloseTo(expectedNet, 4);
    });

    it('calculates exact Prismoidal zero-crossing transition triangle with 2 cut vertices and 1 fill vertex', () => {
      // h1 = -2 (Fill), h2 = +2 (Cut), h3 = +2 (Cut)
      // Fill Area = 50 * 0.5 * 0.5 = 12.5 m²
      // Fill Vol = (1/3) * 12.5 * 2 = 8.3333 m³
      // Cut Area = 37.5 m²
      const res = computePrismoidTriangle(dummyTriangle, -2.0, 2.0, 2.0);
      expect(res.fillAreaM2).toBeCloseTo(12.5, 4);
      expect(res.cutAreaM2).toBeCloseTo(37.5, 4);
      expect(res.fillVolumeM3).toBeCloseTo((1 / 3) * 12.5 * 2.0, 4);
      expect(res.cutVolumeM3).toBeGreaterThan(0);
      const expectedNet = (50.0 / 3) * (-2.0 + 2.0 + 2.0); // +33.3333 m³
      expect(res.netVolumeM3).toBeCloseTo(expectedNet, 4);
    });
  });

  describe('Surface-to-Datum Earthwork Calculations', () => {
    it('computes volume for flat terrain to target datum elevation', () => {
      const squarePoints: TinPoint[] = [
        { x: 0, y: 0, z: 12 },
        { x: 10, y: 0, z: 12 },
        { x: 10, y: 10, z: 12 },
        { x: 0, y: 10, z: 12 },
      ];
      // Target datum = 10.0 => pure cut of depth 2m over 100 m² = 200 m³ cut
      const res = calculateSurfaceToDatumVolume(squarePoints, 10.0);
      expect(res.totalArea2D).toBeCloseTo(100.0, 4);
      expect(res.totalCutVolumeM3).toBeCloseTo(200.0, 4);
      expect(res.totalFillVolumeM3).toBe(0);
      expect(res.netVolumeM3).toBeCloseTo(200.0, 4);
      expect(res.maxCutDepthM).toBeCloseTo(2.0, 4);
      expect(res.maxFillHeightM).toBe(0);
    });

    it('computes realistic mixed cut and fill on the sample terrain dataset', () => {
      const res = calculateSurfaceToDatumVolume(SAMPLE_EXISTING_SURFACE_POINTS, 12.50);
      expect(res.totalArea2D).toBeGreaterThan(2000); // 50m x 50m bounding box
      expect(res.totalCutVolumeM3).toBeGreaterThan(0);
      expect(res.totalFillVolumeM3).toBeGreaterThan(0);
      expect(res.cutArea2D + res.fillArea2D).toBeCloseTo(res.totalArea2D, 3);
      expect(res.triangles.length).toBe(res.totalTriangles);
    });
  });

  describe('Surface-to-Sloped-Plane Earthwork Calculations', () => {
    it('calculates volume against a 2% sloped plane design', () => {
      const res = calculateSurfaceToSlopedPlaneVolume(
        SAMPLE_EXISTING_SURFACE_POINTS,
        12.00,
        { x: 1000, y: 2000 },
        2.0, // 2% slope east
        1.0  // 1% slope north
      );
      expect(res.mode).toBe('sloped-plane');
      expect(res.totalArea2D).toBeGreaterThan(0);
      expect(res.totalCutVolumeM3).toBeGreaterThan(0);
      expect(res.totalFillVolumeM3).toBeGreaterThan(0);
    });
  });

  describe('Surface-to-Surface (OGL vs FGL) Earthwork Calculations', () => {
    it('computes cut and fill between Existing Ground and Design Surface', () => {
      const res = calculateSurfaceToSurfaceVolume(
        SAMPLE_EXISTING_SURFACE_POINTS,
        SAMPLE_DESIGN_SURFACE_POINTS
      );
      expect(res.mode).toBe('surface-to-surface');
      expect(res.totalTriangles).toBeGreaterThan(0);
      expect(res.totalArea2D).toBeGreaterThan(0);
      expect(res.totalCutVolumeM3).toBeGreaterThan(0);
      expect(res.totalFillVolumeM3).toBeGreaterThan(0);
    });
  });

  describe('CSV Parser and Template', () => {
    it('parses valid survey point CSV with headers', () => {
      const csv = `Point_ID,Easting_X,Northing_Y,Elevation_Z\nP-1,1000.5,2000.25,12.34\nP-2,1020.0,2010.0,14.50`;
      const { points, errors } = parseEarthworkPointsCsv(csv);
      expect(errors).toHaveLength(0);
      expect(points).toHaveLength(2);
      expect(points[0].id).toBe('P-1');
      expect(points[0].x).toBeCloseTo(1000.5, 3);
      expect(points[0].y).toBeCloseTo(2000.25, 3);
      expect(points[0].z).toBeCloseTo(12.34, 3);
    });

    it('reports errors on malformed lines', () => {
      const csv = `Point_ID,X,Y,Z\nP-1,abc,2000,10`;
      const { points, errors } = parseEarthworkPointsCsv(csv);
      expect(errors.length).toBeGreaterThan(0);
      expect(points).toHaveLength(0);
    });
  });

  describe('Adversarial Boundary & Geodetic Precision Robustness', () => {
    it('gracefully handles collinear point sets without crashing or returning NaN', () => {
      // 5 collinear points along a single baseline
      const collinearPoints: TinPoint[] = [
        { id: 'C1', x: 100, y: 100, z: 10 },
        { id: 'C2', x: 200, y: 100, z: 11 },
        { id: 'C3', x: 300, y: 100, z: 12 },
        { id: 'C4', x: 400, y: 100, z: 13 },
        { id: 'C5', x: 500, y: 100, z: 14 }
      ];

      const triangles = delaunayTriangulate2D(collinearPoints);
      expect(triangles).toEqual([]); // Collinear points cannot form 2D triangles

      const res = calculateSurfaceToDatumVolume(collinearPoints, 10.0);
      expect(res.totalTriangles).toBe(0);
      expect(res.totalArea2D).toBe(0);
      expect(res.totalCutVolumeM3).toBe(0);
      expect(res.totalFillVolumeM3).toBe(0);
      expect(Number.isNaN(res.netVolumeM3)).toBe(false);
    });

    it('robustly triangulates real-world 7-digit UTM Zone 47N coordinates (Bangkok/Kasetsart)', () => {
      const utmPoints: TinPoint[] = [
        { id: 'UTM-1', x: 669500.0, y: 1531000.0, z: 12.5 },
        { id: 'UTM-2', x: 669600.0, y: 1531000.0, z: 13.0 },
        { id: 'UTM-3', x: 669600.0, y: 1531100.0, z: 13.5 },
        { id: 'UTM-4', x: 669500.0, y: 1531100.0, z: 12.0 },
        { id: 'UTM-5', x: 669550.0, y: 1531050.0, z: 11.0 } // Center pit
      ];

      const triangles = delaunayTriangulate2D(utmPoints);
      expect(triangles.length).toBe(4);

      const totalArea = triangles.reduce((sum, t) => sum + t.area2D, 0);
      expect(totalArea).toBeCloseTo(100.0 * 100.0, 2); // 10,000 m² (1 hectare)

      const volumeRes = calculateSurfaceToDatumVolume(utmPoints, 12.0);
      expect(volumeRes.totalTriangles).toBe(4);
      expect(volumeRes.totalArea2D).toBeCloseTo(10000.0, 2);
      expect(volumeRes.totalCutVolumeM3).toBeGreaterThan(0);
      expect(volumeRes.totalFillVolumeM3).toBeGreaterThan(0);
      expect(Number.isNaN(volumeRes.netVolumeM3)).toBe(false);
    });

    it('handles non-overlapping surface-to-surface point clouds cleanly', () => {
      const surfA: TinPoint[] = [
        { x: 0, y: 0, z: 10 },
        { x: 10, y: 0, z: 10 },
        { x: 0, y: 10, z: 10 }
      ];
      // surfB is completely outside surfA's footprint
      const surfB: TinPoint[] = [
        { x: 100, y: 100, z: 12 },
        { x: 110, y: 100, z: 12 },
        { x: 100, y: 110, z: 12 }
      ];

      const res = calculateSurfaceToSurfaceVolume(surfA, surfB);
      expect(res.mode).toBe('surface-to-surface');
      expect(res.totalTriangles).toBe(0);
      expect(res.totalArea2D).toBe(0);
      expect(res.totalCutVolumeM3).toBe(0);
      expect(res.totalFillVolumeM3).toBe(0);
      expect(Number.isNaN(res.netVolumeM3)).toBe(false);
    });
  });
});
