import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  THAILAND_RIVER_SEGMENTS,
  THAILAND_MAJOR_DAMS,
  THAILAND_RIVER_GAUGES,
  BASIN_FLOW_TOURS
} from '../src/data/thailand-hydro-network';
import {
  normalizeFloodApiResponse,
  coalesceDischargeSeries,
  classifyGaugeAlertLevel,
  classifyDamAlertLevel,
  computeGaugeHydraulics,
  computeDownwindHazardCone,
  interpolateCrossSectionPoints,
  getNasaGibsDefaultDateString,
  getInitialHydrologySnapshot,
  enrichGaugeWithSeries,
  enrichDamWithSeries,
  parseRidDamApiResponse,
  fetchRidDamPublicData,
  findNearestHydrometNode,
  fetchRiverHydrologySnapshot,
  fetchDemCrossSection,
  fetchRainViewerTimeline,
  fetchUsgsEarthquakes,
  traceConnectedRiverNetwork
} from '../src/core/disaster-services';

describe('MeMap Hydrological & Multi-Hazard Intelligence Suite', () => {
  // =========================================================================
  // 1. THAILAND HYDROLOGICAL NETWORK TOPOLOGY & UPSTREAM->DOWNSTREAM INVARIANCE
  // =========================================================================
  describe('Thailand Directed River Network & Engineering Stations', () => {
    it('contains all 22 directed river, tributary, and canal segments with valid topological graph edges', () => {
      expect(THAILAND_RIVER_SEGMENTS.length).toBe(22);

      const gaugeIds = new Set(THAILAND_RIVER_GAUGES.map((g) => g.id));
      const segmentIds = new Set(THAILAND_RIVER_SEGMENTS.map((s) => s.id));

      for (const seg of THAILAND_RIVER_SEGMENTS) {
        expect(seg.coordinates.length).toBeGreaterThanOrEqual(4);
        expect(seg.upstreamElevationMsl).toBeGreaterThan(seg.downstreamElevationMsl);
        expect(seg.bankfullCapacityCms).toBeGreaterThan(0);
        expect(seg.lengthKm).toBeGreaterThan(0);
        expect(seg.provinces.length).toBeGreaterThanOrEqual(1);
        expect(['river', 'tributary', 'canal']).toContain(seg.waterwayType);
        expect(gaugeIds.has(seg.linkedGaugeId)).toBe(true);

        for (const upId of seg.upstreamIds) {
          expect(segmentIds.has(upId)).toBe(true);
        }
        if (seg.downstreamId !== null) {
          expect(segmentIds.has(seg.downstreamId)).toBe(true);
        }

        for (const [lat, lng] of seg.coordinates) {
          expect(lat).toBeGreaterThanOrEqual(5.0);
          expect(lat).toBeLessThanOrEqual(21.5);
          expect(lng).toBeGreaterThanOrEqual(97.0);
          expect(lng).toBeLessThanOrEqual(106.5);
        }
      }
    });

    it('traces upstream and downstream topological flow networks accurately via traceConnectedRiverNetwork', () => {
      const pingTrace = traceConnectedRiverNetwork('river-ping');
      expect(pingTrace.selectedId).toBe('river-ping');
      expect(pingTrace.upstreamIds).toContain('river-wang');
      expect(pingTrace.downstreamIds).toEqual(['river-chaophraya']);
      expect(pingTrace.allConnectedIds.has('river-ping')).toBe(true);
      expect(pingTrace.allConnectedIds.has('river-wang')).toBe(true);
      expect(pingTrace.allConnectedIds.has('river-chaophraya')).toBe(true);
      expect(pingTrace.allConnectedIds.has('river-mun')).toBe(false);

      const chaoPhrayaTrace = traceConnectedRiverNetwork('river-chaophraya');
      expect(chaoPhrayaTrace.upstreamIds).toEqual(
        expect.arrayContaining([
          'river-ping',
          'river-wang',
          'river-yom',
          'river-nan',
          'river-pasak',
          'river-sakaekrang',
          'canal-chainat-pasak',
          'canal-prem',
          'canal-rangsit'
        ])
      );
    });

    it('validates 15 major dams with valid capacities and GloFAS 5km grid coordinates', () => {
      expect(THAILAND_MAJOR_DAMS.length).toBe(15);
      for (const dam of THAILAND_MAJOR_DAMS) {
        expect(dam.maxCapacityMcm).toBeGreaterThan(50);
        expect(dam.normalHighWaterLevelMsl).toBeGreaterThan(10);
        expect(dam.baselineStoragePct).toBeGreaterThan(0);
        expect(dam.baselineStoragePct).toBeLessThanOrEqual(100);
        expect(Math.abs(dam.lat - dam.queryLat)).toBeLessThan(0.25);
        expect(Math.abs(dam.lng - dam.queryLng)).toBeLessThan(0.25);
      }
    });

    it('validates all 10 national index river gauge stations (P.1, Y.17, N.67, C.2, C.13, S.5, C.29A, M.7, K.37, B.1)', () => {
      const expectedCodes = ['P.1', 'Y.17', 'N.67', 'C.2', 'C.13', 'S.5', 'C.29A', 'M.7', 'K.37', 'B.1'];
      const actualCodes = THAILAND_RIVER_GAUGES.map((g) => g.code);
      expect(actualCodes).toEqual(expectedCodes);

      for (const gauge of THAILAND_RIVER_GAUGES) {
        expect(gauge.bankfullElevationMsl).toBeGreaterThan(gauge.zeroGaugeMsl);
        expect(gauge.bankfullCapacityCms).toBeGreaterThan(100);
      }
    });

    it('validates Basin Flow Tour steps have monotonically increasing lag times and step orders', () => {
      for (const tour of Object.values(BASIN_FLOW_TOURS)) {
        expect(tour.steps.length).toBeGreaterThanOrEqual(3);
        for (let i = 1; i < tour.steps.length; i++) {
          expect(tour.steps[i].stepOrder).toBe(tour.steps[i - 1].stepOrder + 1);
          expect(tour.steps[i].lagTimeHoursFromOrigin).toBeGreaterThanOrEqual(
            tour.steps[i - 1].lagTimeHoursFromOrigin
          );
        }
      }
    });
  });

  // =========================================================================
  // 2. OPEN-METEO GLOFAS v4 NORMALIZATION & NULL-COALESCING
  // =========================================================================
  describe('Open-Meteo Flood API Normalization & Null-Coalescing', () => {
    it('normalizes single-coordinate object and multi-coordinate array responses', () => {
      const singleObj = { latitude: 15.7, longitude: 100.14, daily: { time: ['2026-09-30'] } };
      expect(normalizeFloodApiResponse(singleObj)).toEqual([singleObj]);
      expect(normalizeFloodApiResponse([singleObj, singleObj])).toHaveLength(2);
      expect(normalizeFloodApiResponse(null)).toEqual([]);
      expect(normalizeFloodApiResponse(undefined)).toEqual([]);
      expect(normalizeFloodApiResponse('invalid')).toEqual([]);
    });

    it('coalesces null river_discharge values using median and mean fallbacks', () => {
      const dailyMock = {
        time: ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01'],
        river_discharge: [1250.4, null, null, -50],
        river_discharge_median: [1200.0, 1480.6, null, 500],
        river_discharge_mean: [1190.0, 1490.0, 1620.25, 510],
        river_discharge_max: [1400.0, null, 1900.0, null],
        river_discharge_p75: [1320.0, 1550.0, null, 600],
        river_discharge_p25: [1100.0, 1390.0, 1450.0, null]
      };

      const res = coalesceDischargeSeries(dailyMock);
      expect(res.dates).toHaveLength(4);
      expect(res.discharge[0]).toBe(1250.4);
      expect(res.discharge[1]).toBe(1480.6); // fell back to median
      expect(res.discharge[2]).toBe(1620.25); // fell back to mean
      expect(res.discharge[3]).toBe(0); // negative clamped to 0
      expect(res.max[1]).toBeGreaterThanOrEqual(res.discharge[1]);
    });
  });

  // =========================================================================
  // 3. HYDRAULIC RATING CURVE, FREEBOARD & ALERT LEVEL CLASSIFICATION
  // =========================================================================
  describe('Hydraulic Rating Curve & Freeboard Engineering Calculations', () => {
    const c2Station = THAILAND_RIVER_GAUGES.find((g) => g.code === 'C.2')!;

    it('computes exact bankfull elevation (0.00 m freeboard, 100% bankCapacityPct) when discharge equals bankfull capacity', () => {
      const res = computeGaugeHydraulics(c2Station, c2Station.bankfullCapacityCms);
      expect(res.waterElevationMsl).toBeCloseTo(c2Station.bankfullElevationMsl, 2);
      expect(res.freeboardMeters).toBeCloseTo(0.0, 2);
      expect(res.bankCapacityPct).toBeCloseTo(100.0, 1);
      expect(res.alertLevel).toBe('critical');
    });

    it('computes negative freeboard (overbank flooding, >100% bankCapacityPct) when discharge exceeds bankfull capacity', () => {
      const res = computeGaugeHydraulics(c2Station, c2Station.bankfullCapacityCms * 1.25);
      expect(res.waterElevationMsl).toBeGreaterThan(c2Station.bankfullElevationMsl);
      expect(res.freeboardMeters).toBeLessThan(0);
      expect(res.bankCapacityPct).toBeGreaterThan(100);
      expect(res.bankCapacityPct).toBeCloseTo(114.3, 1);
      expect(res.alertLevel).toBe('critical');
    });

    it('computes zero-gauge elevation and positive freeboard when discharge is 0', () => {
      const res = computeGaugeHydraulics(c2Station, 0);
      expect(res.waterElevationMsl).toBeCloseTo(c2Station.zeroGaugeMsl, 2);
      expect(res.freeboardMeters).toBeCloseTo(
        c2Station.bankfullElevationMsl - c2Station.zeroGaugeMsl,
        2
      );
      expect(res.bankCapacityPct).toBe(0);
      expect(res.alertLevel).toBe('drought');
    });

    it('classifies gauge and dam alert levels accurately across thresholds', () => {
      expect(classifyGaugeAlertLevel(3600, 3500)).toBe('critical');
      expect(classifyGaugeAlertLevel(3000, 3500)).toBe('warning');
      expect(classifyGaugeAlertLevel(2300, 3500)).toBe('watch');
      expect(classifyGaugeAlertLevel(1500, 3500)).toBe('normal');
      expect(classifyGaugeAlertLevel(200, 3500)).toBe('drought');

      expect(classifyDamAlertLevel(96)).toBe('critical');
      expect(classifyDamAlertLevel(88)).toBe('warning');
      expect(classifyDamAlertLevel(78)).toBe('watch');
      expect(classifyDamAlertLevel(55)).toBe('normal');
      expect(classifyDamAlertLevel(24)).toBe('drought');
    });
  });

  // =========================================================================
  // 4. DOWNWIND WILDFIRE HAZARD CONE & DEM CROSS-SECTION INTERPOLATION
  // =========================================================================
  describe('Downwind Wildfire Smoke Dispersion & DEM Cross-Section Geometry', () => {
    it('projects downwind hazard cone northeast when wind blows FROM southwest (225 deg)', () => {
      const originLat = 18.7883;
      const originLng = 98.9853;
      const cone = computeDownwindHazardCone(originLat, originLng, 225, 25);

      expect(cone.length).toBeGreaterThanOrEqual(10);
      expect(cone[0]).toEqual([originLat, originLng]);
      expect(cone[cone.length - 1]).toEqual([originLat, originLng]);

      const interiorPts = cone.slice(1, -1);
      const avgLat = interiorPts.reduce((acc, p) => acc + p[0], 0) / interiorPts.length;
      const avgLng = interiorPts.reduce((acc, p) => acc + p[1], 0) / interiorPts.length;

      // Downwind of 225° (SW) is 45° (NE) -> higher lat and higher lng
      expect(avgLat).toBeGreaterThan(originLat);
      expect(avgLng).toBeGreaterThan(originLng);
    });

    it('projects downwind hazard cone southwest when wind blows FROM northeast (45 deg)', () => {
      const originLat = 18.7883;
      const originLng = 98.9853;
      const cone = computeDownwindHazardCone(originLat, originLng, 45, 25);

      const interiorPts = cone.slice(1, -1);
      const avgLat = interiorPts.reduce((acc, p) => acc + p[0], 0) / interiorPts.length;
      const avgLng = interiorPts.reduce((acc, p) => acc + p[1], 0) / interiorPts.length;

      // Downwind of 45° (NE) is 225° (SW) -> lower lat and lower lng
      expect(avgLat).toBeLessThan(originLat);
      expect(avgLng).toBeLessThan(originLng);
    });

    it('interpolates cross-section sample points and clamps extreme sample counts safely', () => {
      const start = { lat: 15.6981, lng: 100.135 };
      const end = { lat: 15.6981, lng: 100.150 };
      const pts30 = interpolateCrossSectionPoints(start, end, 30);
      expect(pts30).toHaveLength(30);
      expect(pts30[0].distanceMeters).toBe(0);
      expect(pts30[29].distanceMeters).toBeGreaterThan(1000);

      // Edge cases: samples = 0 -> clamped to 2; samples = 500 -> clamped to 100
      expect(interpolateCrossSectionPoints(start, end, 0)).toHaveLength(2);
      expect(interpolateCrossSectionPoints(start, end, 500)).toHaveLength(100);
    });

    it('returns UTC - 24h YYYY-MM-DD date string for NASA GIBS tiles', () => {
      const fixedTime = Date.parse('2026-09-30T12:00:00Z');
      expect(getNasaGibsDefaultDateString(fixedTime)).toBe('2026-09-29');
    });
  });

  // =========================================================================
  // 5. STATIC TOUCH TARGET, DESIGN.MD & TILE PARAMETER AUDIT
  // =========================================================================
  describe('Touch Target (>= 44x44px), Solid Surface, and Tile Config Audit', () => {
    it('audits DisasterCommandPanel.tsx and HydroTelemetryDrawer.tsx for >= 44x44px buttons and zero blur', () => {
      const files = [
        path.resolve(__dirname, '../src/components/map/DisasterCommandPanel.tsx'),
        path.resolve(__dirname, '../src/components/map/HydroTelemetryDrawer.tsx')
      ];

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).not.toMatch(/backdrop-blur|backdrop-filter/);

        const buttons = content.match(/<button[\s\S]*?<\/button>/g) || [];
        expect(buttons.length).toBeGreaterThan(0);

        for (const btn of buttons) {
          expect(btn).toMatch(/min-h-\[44px\]/);
          expect(btn).toMatch(/min-w-\[44px\]/);
        }
      }
    });

    it('verifies vercel.json places /api/rid-dams rewrite strictly before /(.*) SPA catch-all', () => {
      const vercelPath = path.resolve(__dirname, '../vercel.json');
      const vercelJson = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
      const rewrites = vercelJson.rewrites || [];

      const ridIndex = rewrites.findIndex((r: any) => r.source === '/api/rid-dams');
      const spaIndex = rewrites.findIndex((r: any) => r.source === '/(.*)');

      expect(ridIndex).toBeGreaterThanOrEqual(0);
      expect(spaIndex).toBeGreaterThan(ridIndex);
    });

    it('verifies WebMap.tsx tile configurations for RainViewer, NASA GIBS WMS, and GIBS TrueColor', () => {
      const webmapPath = path.resolve(__dirname, '../src/components/map/WebMap.tsx');
      const content = fs.readFileSync(webmapPath, 'utf8');

      // RainViewer maxNativeZoom: 7 and maxZoom: 19
      expect(content).toMatch(/maxNativeZoom:\s*7/);
      expect(content).toMatch(/maxZoom:\s*19/);

      // NASA GIBS WMS for VIIRS Thermal Anomalies
      expect(content).toMatch(/L\.tileLayer\.wms/);
      expect(content).toMatch(/VIIRS_SNPP_Thermal_Anomalies_375m_All/);

      // NASA GIBS WMTS TrueColor uses {z}/{y}/{x}.jpg
      expect(content).toMatch(/GoogleMapsCompatible_Level9\/\{z\}\/\{y\}\/\{x\}\.jpg/);
    });

    it('verifies WebMap starts in clean normal map mode (survey) with all overlays off and unified left-side rounded panels', () => {
      const webmapContent = fs.readFileSync(
        path.resolve(__dirname, '../src/components/map/WebMap.tsx'),
        'utf8'
      );
      const toolbarContent = fs.readFileSync(
        path.resolve(__dirname, '../src/components/map/MapToolbar.tsx'),
        'utf8'
      );
      const panelContent = fs.readFileSync(
        path.resolve(__dirname, '../src/components/map/DisasterCommandPanel.tsx'),
        'utf8'
      );
      const drawerContent = fs.readFileSync(
        path.resolve(__dirname, '../src/components/map/HydroTelemetryDrawer.tsx'),
        'utf8'
      );

      // 1. Starts in 'survey' mode with all 7 layers false by default
      expect(webmapContent).toContain("useState<MapWorkspaceTab>('survey')");
      expect(webmapContent).toMatch(/'river-flow':\s*false/);
      expect(webmapContent).toMatch(/'dams-gauges':\s*false/);
      expect(webmapContent).toMatch(/'rain-radar':\s*false/);
      expect(webmapContent).toMatch(/'wind-storm':\s*false/);
      expect(webmapContent).toMatch(/'wildfire-smoke':\s*false/);
      expect(webmapContent).toMatch(/'satellite-cloud':\s*false/);
      expect(webmapContent).toMatch(/'seismic-dem':\s*false/);

      // 2. Categorized mode switcher labels exist in MapToolbar
      expect(toolbarContent).toContain('แผนที่ปกติ');
      expect(toolbarContent).toContain('ฟ้า·ลม·ฝน');
      expect(toolbarContent).toContain('ข้อมูลน้ำ');

      // 3. Modern rounded-2xl (18px) styling on all 3 left-dock panels
      expect(toolbarContent).toContain("borderRadius: '18px'");
      expect(panelContent).toContain("borderRadius: '18px'");
      expect(drawerContent).toContain("borderRadius: '18px'");
    });
  });

  // =========================================================================
  // 6. OFFLINE & NETWORK FAILURE DETERMINISTIC FALLBACK RESILIENCE
  // =========================================================================
  describe('Offline & Network Error Fallback Resilience', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('gracefully falls back to deterministic hydrographs when Open-Meteo Flood API fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network offline'));
      const snap = await fetchRiverHydrologySnapshot(true);

      expect(snap.isLive).toBe(false);
      expect(snap.gauges).toHaveLength(10);
      expect(snap.dams).toHaveLength(15);
      expect(snap.gauges[0].forecastDischargeCms?.length).toBe(14);
      expect(snap.dams[0].currentStoragePct).toBeGreaterThan(0);
    });

    it('gracefully falls back to synthetic valley cross-section when DEM API fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('DEM timeout'));
      const profile = await fetchDemCrossSection(
        { lat: 15.698, lng: 100.135 },
        { lat: 15.698, lng: 100.150 },
        20
      );

      expect(profile.samples).toHaveLength(20);
      expect(profile.maxElevationMsl).toBeGreaterThan(profile.minElevationMsl);
      expect(profile.totalDistanceMeters).toBeGreaterThan(1000);
    });

    it('gracefully handles RainViewer and USGS API failures without throwing', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('API unreachable'));
      const rv = await fetchRainViewerTimeline(true);
      expect(rv.past).toEqual([]);

      const quakes = await fetchUsgsEarthquakes(true);
      expect(quakes.length).toBeGreaterThanOrEqual(3);
      expect(quakes[0].magnitude).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 7. ADVERSARIAL REGRESSION SUITE (ZERO-DISCHARGE, RID API, NEAREST WIND, T=0MS)
  // =========================================================================
  describe('Adversarial Edge Cases & Regression Guards', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('preserves positive fallback discharge when today slot (index 7) is 0 in enrichGaugeWithSeries and enrichDamWithSeries', () => {
      const c2Station = THAILAND_RIVER_GAUGES.find((g) => g.code === 'C.2')!;
      const bhumibolDam = THAILAND_MAJOR_DAMS.find((d) => d.id === 'dam-bhumibol')!;

      // Simulate 14-day series where past days have valid positive flow (2180 m³/s),
      // but index 7 (today) was null in GloFAS and coalesced to 0.
      const dates = Array.from({ length: 14 }, (_, i) => `2026-09-${15 + i}`);
      const discharge = [1850, 1920, 1980, 2050, 2100, 2150, 2180, 0, 0, 0, 0, 0, 0, 0];
      const max = [2000, 2100, 2150, 2200, 2250, 2300, 2350, 0, 0, 0, 0, 0, 0, 0];
      const p75 = [1900, 2000, 2050, 2100, 2150, 2200, 2250, 0, 0, 0, 0, 0, 0, 0];
      const p25 = [1700, 1800, 1850, 1900, 1950, 2000, 2050, 0, 0, 0, 0, 0, 0, 0];

      const enrichedGauge = enrichGaugeWithSeries(c2Station, dates, discharge, max, p75, p25);
      expect(enrichedGauge.currentDischargeCms).toBe(2180);
      expect(enrichedGauge.waterElevationMsl).toBeGreaterThan(c2Station.zeroGaugeMsl + 1.0);
      expect(enrichedGauge.alertLevel).not.toBe('drought');

      const enrichedDam = enrichDamWithSeries(bhumibolDam, dates, discharge, max, p75, p25);
      expect(enrichedDam.inflowCms).toBe(2180);
      expect(enrichedDam.outflowCms).toBeGreaterThan(0);
    });

    it('parses RID dam public API payload and rejects SPA text/html fallback traps', async () => {
      const mockRidJson = {
        data: [
          {
            dam_name: 'เขื่อนภูมิพล',
            storage_pct: 79.4,
            storage_mcm: 10688.8,
            inflow_cms: 640.5,
            outflow_cms: 310.2
          },
          {
            name: 'เขื่อนป่าสักชลสิทธิ์',
            percent_storage: 92.5,
            inflow: 480.0,
            outflow: 410.0
          }
        ]
      };

      const parsedMap = parseRidDamApiResponse(mockRidJson);
      expect(parsedMap.get('dam-bhumibol')).toBeDefined();
      expect(parsedMap.get('dam-bhumibol')?.storagePct).toBe(79.4);
      expect(parsedMap.get('dam-bhumibol')?.inflowCms).toBe(640.5);
      expect(parsedMap.get('dam-pasak')?.storagePct).toBe(92.5);

      // Verify SPA HTML trap rejection when /api/rid-dams returns index.html with 200 OK
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (h: string) => (h.toLowerCase() === 'content-type' ? 'text/html; charset=utf-8' : null)
        },
        json: async () => ({ data: [] })
      } as unknown as Response);

      const trapResult = await fetchRidDamPublicData();
      expect(trapResult.size).toBe(0);
    });

    it('matches each wildfire cluster to its geographically nearest regional HydrometStationData node', () => {
      const mockNodes = [
        { id: 'met-cnx', nameTh: 'เชียงใหม่', lat: 18.7883, lng: 98.9853, precipitationMm: 0, rainMm: 0, windSpeedKmh: 18, windDirectionDeg: 225, windGustsKmh: 28, pm25: 75, pm10: 95, usAqi: 162 },
        { id: 'met-nsw', nameTh: 'นครสวรรค์', lat: 15.6987, lng: 100.1372, precipitationMm: 0, rainMm: 0, windSpeedKmh: 24, windDirectionDeg: 180, windGustsKmh: 36, pm25: 42, pm10: 60, usAqi: 118 },
        { id: 'met-kkc', nameTh: 'ขอนแก่น', lat: 16.4419, lng: 102.836, precipitationMm: 0, rainMm: 0, windSpeedKmh: 29, windDirectionDeg: 110, windGustsKmh: 44, pm25: 55, pm10: 78, usAqi: 148 }
      ];

      // Chiang Dao (19.39°N, 98.92°E) -> Chiang Mai (met-cnx)
      expect(findNearestHydrometNode(19.39, 98.92, mockNodes)?.id).toBe('met-cnx');
      // Huai Kha Khaeng (15.60°N, 99.32°E) -> Nakhon Sawan (met-nsw)
      expect(findNearestHydrometNode(15.60, 99.32, mockNodes)?.id).toBe('met-nsw');
      // Phu Kradueng (16.88°N, 101.88°E) -> Khon Kaen (met-kkc)
      expect(findNearestHydrometNode(16.88, 101.88, mockNodes)?.id).toBe('met-kkc');
      // Empty list -> null
      expect(findNearestHydrometNode(16.88, 101.88, [])).toBeNull();
    });

    it('provides synchronous pre-enriched gauges and dams at t=0ms via getInitialHydrologySnapshot', () => {
      const initial = getInitialHydrologySnapshot();
      expect(initial.gauges).toHaveLength(10);
      expect(initial.dams).toHaveLength(15);

      for (const g of initial.gauges) {
        expect(g.currentDischargeCms).toBeGreaterThan(0);
        expect(g.waterElevationMsl).toBeGreaterThan(g.zeroGaugeMsl);
        expect(g.forecastDischargeCms).toHaveLength(14);
      }

      for (const d of initial.dams) {
        expect(d.currentStoragePct).toBeGreaterThan(0);
        expect(d.currentStorageMcm).toBeGreaterThan(0);
        expect(d.inflowCms).toBeGreaterThan(0);
        expect(d.outflowCms).toBeGreaterThan(0);
      }
    });
  });
});

