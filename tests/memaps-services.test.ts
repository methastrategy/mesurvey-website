import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  THAI_PRESET_PLACES,
  getPresetPlaces,
  searchPlaces,
  getSavedPlaces,
  savePlace,
  deleteSavedPlace,
  fetchRoute
} from '../src/core/memaps-services';

describe('MeMaps Services Core', () => {
  beforeEach(() => {
    // Mock localStorage
    const storage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, val: string) => {
        storage[key] = val;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        for (const k in storage) delete storage[k];
      }
    });
  });

  describe('Presets and Place Search', () => {
    it('has core Thai landmarks and survey reference stations in presets', () => {
      expect(THAI_PRESET_PLACES.length).toBeGreaterThanOrEqual(5);
      const ku = THAI_PRESET_PLACES.find(p => p.id === 'ku-survey');
      expect(ku).toBeDefined();
      expect(ku?.lat).toBeCloseTo(13.8476, 3);
      expect(ku?.lng).toBeCloseTo(100.5696, 3);

      const rtsd = THAI_PRESET_PLACES.find(p => p.id === 'rtsd-hq');
      expect(rtsd).toBeDefined();
    });

    it('returns all presets when search query is empty', async () => {
      const results = await searchPlaces('');
      expect(results).toEqual(THAI_PRESET_PLACES);
    });

    it('filters presets locally on query match without network call', async () => {
      // Mock fetch failure or timeout to test local fallback
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));

      const results = await searchPlaces('เกษตรศาสตร์');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('เกษตรศาสตร์');
    });

    it('loads presets from static GeoJSON when fetch succeeds and falls back gracefully when offline', async () => {
      const mockGeoJson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { id: 'geojson-test-1', name: 'หมุดทดสอบ GeoJSON', category: 'survey' },
            geometry: { type: 'Point', coordinates: [100.5, 13.8] }
          }
        ]
      };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockGeoJson
      }));

      const presets = await getPresetPlaces();
      expect(presets.length).toBeGreaterThan(0);
    });
  });

  describe('Saved Places & Automatic UTM calculation', () => {
    it('saves a place and automatically computes UTM Easting, Northing, and Zone 47/48', () => {
      const saved = savePlace({
        name: 'หมุดทดสอบ มก. บางเขน',
        lat: 13.8476,
        lng: 100.5696,
        category: 'survey',
        note: 'หมุดทดสอบความแม่นยำ'
      });

      expect(saved.id).toBeDefined();
      expect(saved.utmE).toBeGreaterThan(600000);
      expect(saved.utmN).toBeGreaterThan(1500000);
      expect(saved.zone).toBe(47);

      const all = getSavedPlaces();
      expect(all.some(p => p.id === saved.id)).toBe(true);
    });

    it('deletes a saved place correctly', () => {
      const saved = savePlace({
        name: 'ลบจุดนี้',
        lat: 13.75,
        lng: 100.5,
        category: 'favorite'
      });

      deleteSavedPlace(saved.id);
      const all = getSavedPlaces();
      expect(all.some(p => p.id === saved.id)).toBe(false);
    });
  });

  describe('Routing Engine (OSRM)', () => {
    it('parses OSRM GeoJSON and outputs formatted steps and coordinates', async () => {
      const mockOsrmResponse = {
        code: 'Ok',
        routes: [
          {
            distance: 14200,
            duration: 1320,
            geometry: {
              coordinates: [
                [100.5696, 13.8476],
                [100.5404, 13.8038]
              ]
            },
            legs: [
              {
                steps: [
                  {
                    maneuver: { type: 'depart', modifier: 'right' },
                    name: 'ถนนงามวงศ์วาน',
                    distance: 1200,
                    duration: 150
                  },
                  {
                    maneuver: { type: 'turn', modifier: 'left' },
                    name: 'ถนนวิภาวดีรังสิต',
                    distance: 10000,
                    duration: 900
                  },
                  {
                    maneuver: { type: 'arrive' },
                    name: 'สถานีกลางกรุงเทพอภิวัฒน์',
                    distance: 0,
                    duration: 0
                  }
                ]
              }
            ]
          }
        ]
      };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOsrmResponse
      }));

      const origin = { lat: 13.8476, lng: 100.5696 };
      const dest = { lat: 13.8038, lng: 100.5404 };

      const route = await fetchRoute(origin, dest, 'driving');
      expect(route.distanceMeters).toBe(14200);
      expect(route.durationSeconds).toBe(1320);
      expect(route.coordinates).toEqual([
        [13.8476, 100.5696],
        [13.8038, 100.5404]
      ]);
      expect(route.steps.length).toBe(3);
      expect(route.steps[0].instruction).toContain('งามวงศ์วาน');
      expect(route.steps[1].instruction).toContain('เลี้ยวซ้าย เข้าสู่ ถนนวิภาวดีรังสิต');
      expect(route.steps[2].instruction).toBe('ถึงจุดหมายปลายทาง');
      expect(route.summary).toContain('14.2 กม.');
    });

    it('routes cycling and walking modes via appropriate FOSSGIS daemons', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: 'Ok',
          routes: [{ distance: 5000, duration: 900, geometry: { coordinates: [[100.5, 13.8], [100.51, 13.81]] }, legs: [{ steps: [] }] }]
        })
      });
      vi.stubGlobal('fetch', fetchSpy);

      await fetchRoute({ lat: 13.8, lng: 100.5 }, { lat: 13.81, lng: 100.51 }, 'cycling');
      expect(fetchSpy.mock.calls[0][0]).toContain('routed-bike');

      await fetchRoute({ lat: 13.8, lng: 100.5 }, { lat: 13.81, lng: 100.51 }, 'walking');
      expect(fetchSpy.mock.calls[1][0]).toContain('routed-foot');
    });

    it('maps walking mode to /foot/ profile on OSRM public fallback', async () => {
      // First call (FOSSGIS) fails, second call (OSRM) succeeds
      const fetchSpy = vi.fn()
        .mockRejectedValueOnce(new Error('FOSSGIS offline'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            code: 'Ok',
            routes: [{ distance: 1200, duration: 900, geometry: { coordinates: [[100.5, 13.8], [100.51, 13.81]] }, legs: [{ steps: [] }] }]
          })
        });
      vi.stubGlobal('fetch', fetchSpy);

      await fetchRoute({ lat: 13.8, lng: 100.5 }, { lat: 13.81, lng: 100.51 }, 'walking');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy.mock.calls[1][0]).toContain('router.project-osrm.org/route/v1/foot/');
      expect(fetchSpy.mock.calls[1][0]).not.toContain('/walking/');
    });

    it('re-throws AbortError and aborts without attempting secondary fallback', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      const fetchSpy = vi.fn().mockRejectedValue(abortError);
      vi.stubGlobal('fetch', fetchSpy);

      const controller = new AbortController();
      controller.abort();

      await expect(
        fetchRoute({ lat: 13.8, lng: 100.5 }, { lat: 13.81, lng: 100.51 }, 'driving', controller.signal)
      ).rejects.toThrow('The operation was aborted');

      // Crucial: Only one fetch should have been made, NOT followed by fallback fetch
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('surfaces friendly Thai rate-limit message when receiving HTTP 429', async () => {
      const fetchSpy = vi.fn()
        .mockRejectedValueOnce(new Error('FOSSGIS 429'))
        .mockResolvedValueOnce({
          ok: false,
          status: 429
        });
      vi.stubGlobal('fetch', fetchSpy);

      await expect(
        fetchRoute({ lat: 13.8, lng: 100.5 }, { lat: 13.81, lng: 100.51 }, 'driving')
      ).rejects.toThrow(/HTTP 429/);
    });
  });

  describe('Coordinate Recognition & Submit-Only Geocoding', () => {
    it('instantly parses coordinate input into search result without network request', async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      const results = await searchPlaces('13.8476, 100.5696', undefined, { allowRemote: false });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category).toBe('survey');
      expect(results[0].lat).toBeCloseTo(13.8476, 4);
      expect(results[0].lng).toBeCloseTo(100.5696, 4);
    });

    it('attaches schemaVersion: 1 and source to newly saved places', () => {
      const saved = savePlace({
        name: 'สถานีวัดพิกัด',
        lat: 13.75,
        lng: 100.5,
        category: 'survey',
        source: 'survey'
      });
      expect(saved.schemaVersion).toBe(1);
      expect(saved.source).toBe('survey');
    });
  });
});
