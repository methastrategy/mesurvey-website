import { describe, it, expect } from 'vitest';
import { validateGeoJsonRFC7946 } from '../src/core/geojson-validator';

describe('RFC 7946 GeoJSON Validator', () => {
  it('should validate standard RFC 7946 FeatureCollection in Thailand', () => {
    const validData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [100.56982, 13.84664] // [lng, lat]
          },
          properties: { name: 'Kasetsart BM' }
        },
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [100.569, 13.846],
              [100.570, 13.847]
            ]
          },
          properties: { name: 'Traverse Line 1' }
        }
      ]
    };

    const res = validateGeoJsonRFC7946(validData);
    expect(res.isValid).toBe(true);
    expect(res.featureCount).toBe(2);
    expect(res.error).toBeUndefined();
    expect(res.bounds).toBeDefined();
    expect(res.bounds![0][0]).toBeCloseTo(13.846, 3);
    expect(res.bounds![1][1]).toBeCloseTo(100.570, 3);
  });

  it('should validate single Feature and raw Geometry objects', () => {
    const singleFeature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [100.50, 13.75]
      },
      properties: { label: 'Bangkok Center' }
    };
    const resFeature = validateGeoJsonRFC7946(singleFeature);
    expect(resFeature.isValid).toBe(true);
    expect(resFeature.featureCount).toBe(1);

    const rawPolygon = {
      type: 'Polygon',
      coordinates: [
        [
          [100.50, 13.75],
          [100.52, 13.75],
          [100.52, 13.77],
          [100.50, 13.77],
          [100.50, 13.75]
        ]
      ]
    };
    const resPolygon = validateGeoJsonRFC7946(rawPolygon);
    expect(resPolygon.isValid).toBe(true);
    expect(resPolygon.featureCount).toBe(1);
    expect(resPolygon.bounds).toBeDefined();
  });

  it('should validate GeometryCollection within features', () => {
    const gcData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'GeometryCollection',
            geometries: [
              {
                type: 'Point',
                coordinates: [100.56, 13.84]
              },
              {
                type: 'LineString',
                coordinates: [
                  [100.56, 13.84],
                  [100.57, 13.85]
                ]
              }
            ]
          },
          properties: {}
        }
      ]
    };
    const res = validateGeoJsonRFC7946(gcData);
    expect(res.isValid).toBe(true);
    expect(res.featureCount).toBe(1);
    expect(res.bounds).toBeDefined();
  });

  it('should reject invalid or non-object payload', () => {
    expect(validateGeoJsonRFC7946(null).isValid).toBe(false);
    expect(validateGeoJsonRFC7946('invalid-string').isValid).toBe(false);
    expect(validateGeoJsonRFC7946({}).isValid).toBe(false);
    expect(validateGeoJsonRFC7946({ type: 'InvalidType' }).isValid).toBe(false);
  });

  it('should reject FeatureCollection when features is not an array', () => {
    const invalidFc = {
      type: 'FeatureCollection',
      features: 'not-an-array'
    };
    const res = validateGeoJsonRFC7946(invalidFc);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Array');
  });

  it('should reject empty FeatureCollection with actionable field error', () => {
    const emptyFc = {
      type: 'FeatureCollection',
      features: []
    };
    const res = validateGeoJsonRFC7946(emptyFc);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('ว่างเปล่า');
  });

  it('should reject projected UTM meters (>1000) with Coordinate Converter & QGIS guidance', () => {
    const utmData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [669735.24, 1531520.18] // UTM Easting, Northing in meters
          },
          properties: { name: 'UTM Point' }
        }
      ]
    };
    const res = validateGeoJsonRFC7946(utmData);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('UTM');
    expect(res.error).toContain('QGIS/ArcGIS');
    expect(res.error).toContain('Coordinate Converter');
  });

  it('should reject inverted lat/lng coordinates (lat > 90)', () => {
    const invertedData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [13.84664, 100.56982] // [lat, lng] inverted!
          },
          properties: { name: 'Inverted Point' }
        }
      ]
    };
    const res = validateGeoJsonRFC7946(invertedData);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('สลับแกนพิกัด');
  });

  it('should reject out of range WGS84 coordinates', () => {
    const outOfBoundsData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [195.0, 45.0] // Longitude > 180
          },
          properties: { name: 'Out of bounds' }
        }
      ]
    };
    const res = validateGeoJsonRFC7946(outOfBoundsData);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('ขอบเขต');
  });

  it('should reject FeatureCollection where features have no coordinate values', () => {
    const emptyGeomData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: []
          },
          properties: {}
        }
      ]
    };
    const res = validateGeoJsonRFC7946(emptyGeomData);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('ไม่พบพิกัดเรขาคณิต');
  });

  it('should warn when coordinates are valid but outside Thailand', () => {
    const internationalData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0.0, 51.5] // London [lng, lat]
          },
          properties: { name: 'Greenwich' }
        }
      ]
    };
    const res = validateGeoJsonRFC7946(internationalData);
    expect(res.isValid).toBe(true);
    expect(res.warning).toContain('อยู่นอกขอบเขตประเทศไทย');
  });
});
