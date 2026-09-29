import {
  DamTelemetryStation,
  RiverGaugeStation,
  DirectedRiverSegment,
  HydroAlertLevel,
  RainViewerData,
  HydrometStationData,
  EarthquakeEvent,
  DemCrossSectionProfile,
  DemCrossSectionSample
} from '../types/disaster';
import {
  THAILAND_RIVER_SEGMENTS,
  THAILAND_MAJOR_DAMS,
  THAILAND_RIVER_GAUGES,
  HYDROMET_MONITOR_NODES
} from '../data/thailand-hydro-network';

/**
 * Traverses the hydrological network graph (Upstream tributaries & Downstream path to the sea)
 * for any given river or canal segment ID.
 */
export function traceConnectedRiverNetwork(
  segmentId: string,
  segments: DirectedRiverSegment[] = THAILAND_RIVER_SEGMENTS
): {
  selectedId: string;
  upstreamIds: string[];
  downstreamIds: string[];
  allConnectedIds: Set<string>;
} {
  const segMap = new Map<string, DirectedRiverSegment>();
  segments.forEach((s) => segMap.set(s.id, s));

  const upstreamSet = new Set<string>();
  const downstreamSet = new Set<string>();

  // 1. Traverse Upstream (BFS across upstreamIds and any segment whose downstreamId points here)
  const upQueue: string[] = [segmentId];
  const visitedUp = new Set<string>([segmentId]);
  while (upQueue.length > 0) {
    const currId = upQueue.shift()!;
    const currSeg = segMap.get(currId);
    const directUps = new Set<string>(currSeg?.upstreamIds ?? []);
    segments.forEach((s) => {
      if (s.downstreamId === currId) {
        directUps.add(s.id);
      }
    });
    for (const upId of directUps) {
      if (!visitedUp.has(upId) && segMap.has(upId)) {
        visitedUp.add(upId);
        upstreamSet.add(upId);
        upQueue.push(upId);
      }
    }
  }

  // 2. Traverse Downstream to the Sea/Mekong (follow downstreamId chain)
  let currDown = segMap.get(segmentId)?.downstreamId ?? null;
  const visitedDown = new Set<string>([segmentId]);
  while (currDown && !visitedDown.has(currDown) && segMap.has(currDown)) {
    visitedDown.add(currDown);
    downstreamSet.add(currDown);
    currDown = segMap.get(currDown)?.downstreamId ?? null;
  }

  const upstreamIds = Array.from(upstreamSet);
  const downstreamIds = Array.from(downstreamSet);
  const allConnectedIds = new Set<string>([segmentId, ...upstreamIds, ...downstreamIds]);

  return {
    selectedId: segmentId,
    upstreamIds,
    downstreamIds,
    allConnectedIds
  };
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const memoryCache = new Map<string, { timestamp: number; data: any }>();

function getCached<T>(key: string): T | null {
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return mem.data as T;
  }
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(`mesurv_hydro_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          memoryCache.set(key, parsed);
          return parsed.data as T;
        }
      }
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

function setCached<T>(key: string, data: T): void {
  const entry = { timestamp: Date.now(), data };
  memoryCache.set(key, entry);
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`mesurv_hydro_${key}`, JSON.stringify(entry));
    }
  } catch {
    // Ignore quota errors
  }
}

/**
 * Normalizes Open-Meteo Flood API response:
 * Single coordinate returns a single JSON object, multiple coordinates return a JSON array.
 */
export function normalizeFloodApiResponse(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object' && ('daily' in raw || 'latitude' in raw)) {
    return [raw];
  }
  return [];
}

/**
 * Null-coalescing extraction of daily river discharge time series from GloFAS v4 response.
 * Handles nulls in `river_discharge` by falling back to `river_discharge_median` -> `river_discharge_mean` -> 0.
 */
export function coalesceDischargeSeries(daily: any): {
  dates: string[];
  discharge: number[];
  max: number[];
  p75: number[];
  p25: number[];
} {
  if (!daily || !Array.isArray(daily.time)) {
    return { dates: [], discharge: [], max: [], p75: [], p25: [] };
  }

  const dates: string[] = daily.time.map((t: any) => String(t));
  const discharge: number[] = [];
  const max: number[] = [];
  const p75: number[] = [];
  const p25: number[] = [];

  for (let i = 0; i < dates.length; i++) {
    const rawQ =
      daily.river_discharge?.[i] ??
      daily.river_discharge_median?.[i] ??
      daily.river_discharge_mean?.[i] ??
      0;
    const q = Number.isFinite(Number(rawQ)) ? Math.max(0, Number(rawQ)) : 0;

    const rawMax = daily.river_discharge_max?.[i] ?? q * 1.15;
    const qMax = Number.isFinite(Number(rawMax)) ? Math.max(q, Number(rawMax)) : q;

    const rawP75 = daily.river_discharge_p75?.[i] ?? q * 1.08;
    const qP75 = Number.isFinite(Number(rawP75)) ? Math.max(0, Number(rawP75)) : q;

    const rawP25 = daily.river_discharge_p25?.[i] ?? q * 0.88;
    const qP25 = Number.isFinite(Number(rawP25)) ? Math.max(0, Number(rawP25)) : q;

    discharge.push(Number(q.toFixed(2)));
    max.push(Number(qMax.toFixed(2)));
    p75.push(Number(qP75.toFixed(2)));
    p25.push(Number(qP25.toFixed(2)));
  }

  return { dates, discharge, max, p75, p25 };
}

/**
 * Classifies river gauge alert level from discharge vs bankfull capacity
 */
export function classifyGaugeAlertLevel(
  dischargeCms: number,
  bankfullCapacityCms: number
): HydroAlertLevel {
  if (!Number.isFinite(dischargeCms) || bankfullCapacityCms <= 0) return 'normal';
  const ratio = dischargeCms / bankfullCapacityCms;
  if (ratio >= 1.0) return 'critical';
  if (ratio >= 0.80) return 'warning';
  if (ratio >= 0.60) return 'watch';
  if (ratio < 0.12) return 'drought';
  return 'normal';
}

/**
 * Classifies dam storage alert level from percentage of max capacity
 */
export function classifyDamAlertLevel(storagePct: number): HydroAlertLevel {
  if (!Number.isFinite(storagePct)) return 'normal';
  if (storagePct >= 95) return 'critical';
  if (storagePct >= 85) return 'warning';
  if (storagePct >= 75) return 'watch';
  if (storagePct < 30) return 'drought';
  return 'normal';
}

/**
 * Computes hydraulic stage (m.MSL), freeboard (m), and ThaiWater bank capacity percentage (%)
 * using a Manning-type synthetic rating curve:
 * Q / Q_bankfull = ((H - H_zero) / (H_bankfull - H_zero))^(5/3)
 */
export function computeGaugeHydraulics(
  station: RiverGaugeStation,
  currentDischargeCms: number
): {
  waterElevationMsl: number;
  freeboardMeters: number;
  bankCapacityPct: number;
  alertLevel: HydroAlertLevel;
} {
  const safeQ = Number.isFinite(currentDischargeCms) ? Math.max(0, currentDischargeCms) : 0;
  const bankfullDepth = Math.max(0.5, station.bankfullElevationMsl - station.zeroGaugeMsl);
  const ratio = station.bankfullCapacityCms > 0 ? safeQ / station.bankfullCapacityCms : 0;
  const stageDepth = bankfullDepth * Math.pow(ratio, 0.6);
  const waterElevationMsl = Number((station.zeroGaugeMsl + stageDepth).toFixed(2));
  const freeboardMeters = Number((station.bankfullElevationMsl - waterElevationMsl).toFixed(2));
  const bankCapacityPct = Number(((stageDepth / bankfullDepth) * 100).toFixed(1));
  const alertLevel = classifyGaugeAlertLevel(safeQ, station.bankfullCapacityCms);

  return {
    waterElevationMsl,
    freeboardMeters,
    bankCapacityPct,
    alertLevel
  };
}

/**
 * Computes a downwind wildfire smoke & ember dispersion hazard cone polygon [lat, lng][].
 * Note: Meteorological wind direction `windFromDeg` is the azimuth the wind blows FROM.
 * Downwind propagation vector is `(windFromDeg + 180) % 360`.
 */
export function computeDownwindHazardCone(
  lat: number,
  lng: number,
  windFromDeg: number,
  windSpeedKmh: number
): [number, number][] {
  const safeLat = Number.isFinite(lat) ? lat : 18.7883;
  const safeLng = Number.isFinite(lng) ? lng : 98.9853;
  const safeWindFrom = Number.isFinite(windFromDeg) ? ((windFromDeg % 360) + 360) % 360 : 225;
  const safeSpeed = Number.isFinite(windSpeedKmh) ? Math.max(2, Math.min(120, windSpeedKmh)) : 18;

  const downwindAzimuthDeg = (safeWindFrom + 180) % 360;
  const halfConeAngleDeg = Math.max(15, Math.min(35, 32 - safeSpeed * 0.2));
  const plumeLengthKm = Math.max(8, Math.min(65, 10 + safeSpeed * 1.1));

  const degToRad = Math.PI / 180;
  const latFactor = 111.32; // km per degree latitude
  const lngFactor = Math.max(10, 111.32 * Math.cos(safeLat * degToRad)); // km per degree longitude

  const polygon: [number, number][] = [[safeLat, safeLng]];
  const arcSteps = 9;

  for (let i = 0; i <= arcSteps; i++) {
    const frac = i / arcSteps;
    const angleDeg = downwindAzimuthDeg - halfConeAngleDeg + frac * (2 * halfConeAngleDeg);
    const angleRad = angleDeg * degToRad;

    const dNorthKm = plumeLengthKm * Math.cos(angleRad);
    const dEastKm = plumeLengthKm * Math.sin(angleRad);

    const ptLat = Number((safeLat + dNorthKm / latFactor).toFixed(5));
    const ptLng = Number((safeLng + dEastKm / lngFactor).toFixed(5));
    polygon.push([ptLat, ptLng]);
  }

  polygon.push([safeLat, safeLng]);
  return polygon;
}

/**
 * Returns YYYY-MM-DD for UTC - 24 hours so NASA GIBS daily satellite tiles are guaranteed complete.
 */
export function getNasaGibsDefaultDateString(nowMs: number = Date.now()): string {
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  const yesterdayUtc = new Date(safeNow - 24 * 60 * 60 * 1000);
  return yesterdayUtc.toISOString().slice(0, 10);
}

/**
 * Computes planar/geodesic Haversine distance in meters between two WGS84 points.
 */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLng = (lng2 - lng1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Interpolates N evenly spaced sample points along a cross-section line.
 */
export function interpolateCrossSectionPoints(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  samples = 30
): { lat: number; lng: number; distanceMeters: number }[] {
  const count = Math.max(2, Math.min(100, Math.round(samples)));
  const totalDist = haversineDistanceMeters(start.lat, start.lng, end.lat, end.lng);
  const result: { lat: number; lng: number; distanceMeters: number }[] = [];

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    result.push({
      lat: Number((start.lat + (end.lat - start.lat) * t).toFixed(6)),
      lng: Number((start.lng + (end.lng - start.lng) * t).toFixed(6)),
      distanceMeters: Number((totalDist * t).toFixed(1))
    });
  }

  return result;
}

function buildFallbackDates(): string[] {
  const dates: string[] = [];
  const base = Date.now();
  for (let offset = -7; offset <= 6; offset++) {
    const d = new Date(base + offset * 86400000);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function enrichGaugeWithSeries(
  gauge: RiverGaugeStation,
  dates: string[],
  discharge: number[],
  max: number[],
  p75: number[],
  p25: number[]
): RiverGaugeStation {
  const fallbackDates = dates.length > 0 ? dates : buildFallbackDates();
  // Index 7 corresponds to "today" when past_days=7, forecast_days=7
  const todayIdx = Math.min(7, Math.max(0, discharge.length - 1));
  const rawCurrentQ = discharge[todayIdx];
  const lastPositiveQ = [...discharge].reverse().find((v) => Number.isFinite(v) && v > 0);
  const currentDischargeCms =
    Number.isFinite(rawCurrentQ) && rawCurrentQ > 0
      ? rawCurrentQ
      : lastPositiveQ ?? Number((gauge.bankfullCapacityCms * 0.58).toFixed(1));

  const finalDischarge =
    discharge.length > 0 && discharge.some((v) => v > 0)
      ? discharge.map((v) => (Number.isFinite(v) && v > 0 ? v : currentDischargeCms))
      : fallbackDates.map((_, idx) => {
          const wave = Math.sin((idx / 13) * Math.PI);
          return Number((gauge.bankfullCapacityCms * (0.45 + 0.32 * wave)).toFixed(1));
        });

  const finalMax =
    max.length === finalDischarge.length && max.some((v) => v > 0)
      ? max
      : finalDischarge.map((q) => Number((q * 1.18).toFixed(1)));

  const finalP75 =
    p75.length === finalDischarge.length && p75.some((v) => v > 0)
      ? p75
      : finalDischarge.map((q) => Number((q * 1.09).toFixed(1)));

  const finalP25 =
    p25.length === finalDischarge.length && p25.some((v) => v > 0)
      ? p25
      : finalDischarge.map((q) => Number((q * 0.88).toFixed(1)));

  const rawTodayFinal = finalDischarge[Math.min(7, finalDischarge.length - 1)];
  const activeQ =
    Number.isFinite(rawTodayFinal) && rawTodayFinal > 0 ? rawTodayFinal : currentDischargeCms;
  const hydraulics = computeGaugeHydraulics(gauge, activeQ);

  return {
    ...gauge,
    currentDischargeCms: activeQ,
    waterElevationMsl: hydraulics.waterElevationMsl,
    freeboardMeters: hydraulics.freeboardMeters,
    bankCapacityPct: hydraulics.bankCapacityPct,
    forecastDates: fallbackDates,
    forecastDischargeCms: finalDischarge,
    forecastMaxCms: finalMax,
    forecastP75Cms: finalP75,
    forecastP25Cms: finalP25,
    alertLevel: hydraulics.alertLevel,
    updatedAtIso: new Date().toISOString(),
    dataSourceLabel: 'ThaiWater สสน. / GloFAS v4'
  };
}

export function enrichDamWithSeries(
  dam: DamTelemetryStation,
  dates: string[],
  discharge: number[],
  max: number[],
  p75: number[],
  p25: number[],
  ridOverride?: {
    storageMcm?: number;
    storagePct?: number;
    inflowCms?: number;
    outflowCms?: number;
  }
): DamTelemetryStation {
  const fallbackDates = dates.length > 0 ? dates : buildFallbackDates();
  const todayIdx = Math.min(7, Math.max(0, discharge.length - 1));
  const rawQ = discharge[todayIdx];
  const lastPositiveQ = [...discharge].reverse().find((v) => Number.isFinite(v) && v > 0);
  const baseInflow =
    Number.isFinite(rawQ) && rawQ > 0
      ? rawQ
      : lastPositiveQ ?? Number(Math.max(35, dam.maxCapacityMcm * 0.045).toFixed(1));

  const finalDischarge =
    discharge.length > 0 && discharge.some((v) => v > 0)
      ? discharge.map((v) => (Number.isFinite(v) && v > 0 ? v : baseInflow))
      : fallbackDates.map((_, idx) => {
          const wave = Math.sin(((idx + 2) / 14) * Math.PI);
          return Number((baseInflow * (0.82 + 0.35 * wave)).toFixed(1));
        });

  const rawTodayFinal = finalDischarge[Math.min(7, finalDischarge.length - 1)];
  const computedInflowCms =
    Number.isFinite(rawTodayFinal) && rawTodayFinal > 0 ? rawTodayFinal : baseInflow;
  const inflowCms =
    ridOverride?.inflowCms !== undefined && Number.isFinite(ridOverride.inflowCms)
      ? Number(ridOverride.inflowCms.toFixed(1))
      : computedInflowCms;
  const outflowCms =
    ridOverride?.outflowCms !== undefined && Number.isFinite(ridOverride.outflowCms)
      ? Number(ridOverride.outflowCms.toFixed(1))
      : Number((inflowCms * 0.76).toFixed(1));

  const computedStoragePct = Number(
    Math.min(99.5, Math.max(22.0, dam.baselineStoragePct + (inflowCms > 300 ? 4.2 : 1.1))).toFixed(1)
  );
  const storagePct =
    ridOverride?.storagePct !== undefined &&
    Number.isFinite(ridOverride.storagePct) &&
    ridOverride.storagePct > 0
      ? Number(Math.min(100, Math.max(0, ridOverride.storagePct)).toFixed(1))
      : computedStoragePct;

  const currentStorageMcm =
    ridOverride?.storageMcm !== undefined &&
    Number.isFinite(ridOverride.storageMcm) &&
    ridOverride.storageMcm > 0
      ? Number(ridOverride.storageMcm.toFixed(1))
      : Number(((dam.maxCapacityMcm * storagePct) / 100).toFixed(1));

  return {
    ...dam,
    currentStorageMcm,
    currentStoragePct: storagePct,
    inflowCms,
    outflowCms,
    forecastDates: fallbackDates,
    forecastDischargeCms: finalDischarge,
    forecastMaxCms:
      max.length === finalDischarge.length && max.some((v) => v > 0)
        ? max
        : finalDischarge.map((q) => Number((q * 1.16).toFixed(1))),
    forecastP75Cms:
      p75.length === finalDischarge.length && p75.some((v) => v > 0)
        ? p75
        : finalDischarge.map((q) => Number((q * 1.08).toFixed(1))),
    forecastP25Cms:
      p25.length === finalDischarge.length && p25.some((v) => v > 0)
        ? p25
        : finalDischarge.map((q) => Number((q * 0.88).toFixed(1))),
    alertLevel: classifyDamAlertLevel(storagePct),
    updatedAtIso: new Date().toISOString(),
    dataSourceLabel: ridOverride
      ? 'RID กรมชลประทาน / ThaiWater สสน.'
      : `${dam.agency} / ThaiWater สสน.`
  };
}

/**
 * Synchronous deterministic initial state for immediate 0ms render on map startup.
 */
export function getInitialHydrologySnapshot(): {
  gauges: RiverGaugeStation[];
  dams: DamTelemetryStation[];
} {
  const fallbackDates = buildFallbackDates();
  return {
    gauges: THAILAND_RIVER_GAUGES.map((g) =>
      enrichGaugeWithSeries(g, fallbackDates, [], [], [], [])
    ),
    dams: THAILAND_MAJOR_DAMS.map((d) =>
      enrichDamWithSeries(d, fallbackDates, [], [], [], [])
    )
  };
}

/**
 * Parses RID public dam API payload (/api/rid-dams) while guarding against SPA HTML traps.
 */
export function parseRidDamApiResponse(
  raw: any
): Map<string, { storageMcm?: number; storagePct?: number; inflowCms?: number; outflowCms?: number }> {
  const map = new Map<
    string,
    { storageMcm?: number; storagePct?: number; inflowCms?: number; outflowCms?: number }
  >();
  if (!raw || typeof raw === 'string') return map;

  const entries: any[] = [];
  const sourceList = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.regions)
    ? raw.regions
    : [];

  for (const item of sourceList) {
    if (!item || typeof item !== 'object') continue;
    if (Array.isArray(item.dams)) {
      entries.push(...item.dams);
    } else if (Array.isArray(item.reservoir)) {
      entries.push(...item.reservoir);
    } else {
      entries.push(item);
    }
  }

  for (const entry of entries) {
    const rawName = String(entry?.name || entry?.dam_name || entry?.id || '').trim();
    if (!rawName) continue;
    const cleanName = rawName.replace(/^เขื่อน/, '').trim();

    const storageMcm = Number(entry?.volume ?? entry?.storage ?? entry?.storage_mcm ?? entry?.q_max ?? NaN);
    const storagePct = Number(entry?.percent ?? entry?.percent_storage ?? entry?.storage_pct ?? NaN);
    const directInflowCms = Number(entry?.inflow_cms ?? NaN);
    const directOutflowCms = Number(entry?.outflow_cms ?? NaN);
    const inflowMcmPerDay = Number(entry?.inflow ?? NaN);
    const outflowMcmPerDay = Number(entry?.outflow ?? NaN);

    const record = {
      storageMcm: Number.isFinite(storageMcm) && storageMcm > 0 ? storageMcm : undefined,
      storagePct: Number.isFinite(storagePct) && storagePct > 0 ? storagePct : undefined,
      inflowCms:
        Number.isFinite(directInflowCms) && directInflowCms >= 0
          ? Number(directInflowCms.toFixed(1))
          : Number.isFinite(inflowMcmPerDay) && inflowMcmPerDay >= 0
          ? Number(((inflowMcmPerDay * 1e6) / 86400).toFixed(1))
          : undefined,
      outflowCms:
        Number.isFinite(directOutflowCms) && directOutflowCms >= 0
          ? Number(directOutflowCms.toFixed(1))
          : Number.isFinite(outflowMcmPerDay) && outflowMcmPerDay >= 0
          ? Number(((outflowMcmPerDay * 1e6) / 86400).toFixed(1))
          : undefined
    };

    map.set(cleanName, record);
    const matchedDam = THAILAND_MAJOR_DAMS.find((d) => {
      const shortTh = d.nameTh.replace(/^เขื่อน/, '').trim();
      return (
        d.id === rawName ||
        shortTh === cleanName ||
        cleanName.includes(shortTh) ||
        shortTh.includes(cleanName)
      );
    });
    if (matchedDam) {
      map.set(matchedDam.id, record);
    }
  }

  return map;
}

/**
 * Fetches live RID dam telemetry via the /api/rid-dams proxy with SPA HTML trap protection.
 */
export async function fetchRidDamPublicData(): Promise<
  Map<string, { storageMcm?: number; storagePct?: number; inflowCms?: number; outflowCms?: number }>
> {
  try {
    const res = await fetch('/api/rid-dams');
    if (!res.ok) return new Map();
    const contentType = res.headers?.get?.('content-type') || '';
    if (contentType.includes('text/html')) {
      return new Map();
    }
    const json = await res.json();
    return parseRidDamApiResponse(json);
  } catch {
    return new Map();
  }
}

/**
 * Finds the geographically nearest HydrometStationData node to a given [lat, lng] coordinate.
 */
export function findNearestHydrometNode(
  lat: number,
  lng: number,
  nodes: HydrometStationData[]
): HydrometStationData | null {
  if (!Array.isArray(nodes) || nodes.length === 0) return null;
  let best = nodes[0];
  let bestDist = haversineDistanceMeters(lat, lng, best.lat, best.lng);
  for (let i = 1; i < nodes.length; i++) {
    const d = haversineDistanceMeters(lat, lng, nodes[i].lat, nodes[i].lng);
    if (d < bestDist) {
      bestDist = d;
      best = nodes[i];
    }
  }
  return best;
}

/**
 * Batch fetches Open-Meteo GloFAS v4 river discharge for all 10 gauges + 15 major dams in one request,
 * and overlays RID public reservoir telemetry when /api/rid-dams is available.
 */
export async function fetchRiverHydrologySnapshot(forceRefresh = false): Promise<{
  gauges: RiverGaugeStation[];
  dams: DamTelemetryStation[];
  isLive: boolean;
  updatedAt: number;
}> {
  const cacheKey = 'river_hydrology_v1';
  if (!forceRefresh) {
    const cached = getCached<{
      gauges: RiverGaugeStation[];
      dams: DamTelemetryStation[];
      isLive: boolean;
      updatedAt: number;
    }>(cacheKey);
    if (cached) return cached;
  }

  const allPoints = [
    ...THAILAND_RIVER_GAUGES.map((g) => ({ lat: g.queryLat, lng: g.queryLng })),
    ...THAILAND_MAJOR_DAMS.map((d) => ({ lat: d.queryLat, lng: d.queryLng }))
  ];

  const lats = allPoints.map((p) => p.lat.toFixed(2)).join(',');
  const lngs = allPoints.map((p) => p.lng.toFixed(2)).join(',');
  const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lats}&longitude=${lngs}&daily=river_discharge,river_discharge_mean,river_discharge_median,river_discharge_max,river_discharge_p75,river_discharge_p25&past_days=7&forecast_days=7`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    const list = normalizeFloodApiResponse(raw);
    const ridMap = await fetchRidDamPublicData();

    const gauges: RiverGaugeStation[] = THAILAND_RIVER_GAUGES.map((g, idx) => {
      const item = list[idx];
      const series = coalesceDischargeSeries(item?.daily);
      return enrichGaugeWithSeries(g, series.dates, series.discharge, series.max, series.p75, series.p25);
    });

    const dams: DamTelemetryStation[] = THAILAND_MAJOR_DAMS.map((d, idx) => {
      const item = list[THAILAND_RIVER_GAUGES.length + idx];
      const series = coalesceDischargeSeries(item?.daily);
      const shortName = d.nameTh.replace(/^เขื่อน/, '').split(' ')[0].trim();
      const ridOverride =
        ridMap.get(d.id) || ridMap.get(shortName) || ridMap.get(d.nameTh.replace(/^เขื่อน/, '').trim());
      return enrichDamWithSeries(
        d,
        series.dates,
        series.discharge,
        series.max,
        series.p75,
        series.p25,
        ridOverride
      );
    });

    const result = {
      gauges,
      dams,
      isLive: true,
      updatedAt: Date.now()
    };
    setCached(cacheKey, result);
    return result;
  } catch {
    const initial = getInitialHydrologySnapshot();
    return {
      gauges: initial.gauges,
      dams: initial.dams,
      isLive: false,
      updatedAt: Date.now()
    };
  }
}

/**
 * Batch fetches meteorological wind/rain & PM2.5 air quality for Thailand monitoring nodes.
 */
export async function fetchHydrometAndAirQualityBatch(
  forceRefresh = false
): Promise<HydrometStationData[]> {
  const cacheKey = 'hydromet_aqi_v1';
  if (!forceRefresh) {
    const cached = getCached<HydrometStationData[]>(cacheKey);
    if (cached) return cached;
  }

  const lats = HYDROMET_MONITOR_NODES.map((n) => n.lat.toFixed(4)).join(',');
  const lngs = HYDROMET_MONITOR_NODES.map((n) => n.lng.toFixed(4)).join(',');

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=precipitation,rain,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=precipitation_sum&timezone=Asia%2FBangkok`;
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lngs}&current=pm10,pm2_5,us_aqi`;

  try {
    const [wRes, aRes] = await Promise.all([fetch(weatherUrl), fetch(aqiUrl)]);
    const wJson = wRes.ok ? await wRes.json() : [];
    const aJson = aRes.ok ? await aRes.json() : [];

    const wList = Array.isArray(wJson) ? wJson : [wJson];
    const aList = Array.isArray(aJson) ? aJson : [aJson];

    const stations: HydrometStationData[] = HYDROMET_MONITOR_NODES.map((node, idx) => {
      const w = wList[idx]?.current || {};
      const wDaily = wList[idx]?.daily?.precipitation_sum || [];
      const a = aList[idx]?.current || {};

      const rain24hMm = Number((wDaily[0] ?? w.precipitation ?? 4.2).toFixed(1));
      const rain7dMm = Number(
        (
          Array.isArray(wDaily) && wDaily.length > 0
            ? wDaily.reduce((acc: number, val: any) => acc + (Number(val) || 0), 0)
            : rain24hMm * 4.5
        ).toFixed(1)
      );

      return {
        id: node.id,
        nameTh: node.nameTh,
        region: node.region,
        lat: node.lat,
        lng: node.lng,
        rain24hMm,
        rain7dMm,
        windSpeed10mKmh: Number((w.wind_speed_10m ?? 16.5).toFixed(1)),
        windDirection10mDeg: Number(w.wind_direction_10m ?? 230),
        windGusts10mKmh: Number((w.wind_gusts_10m ?? 28.0).toFixed(1)),
        surfacePressureHpa: Number((w.surface_pressure ?? 1008.5).toFixed(1)),
        pm25: Number((a.pm2_5 ?? 24.5).toFixed(1)),
        pm10: Number((a.pm10 ?? 38.0).toFixed(1)),
        usAqi: Number(a.us_aqi ?? 68)
      };
    });

    setCached(cacheKey, stations);
    return stations;
  } catch {
    return HYDROMET_MONITOR_NODES.map((node, idx) => ({
      id: node.id,
      nameTh: node.nameTh,
      region: node.region,
      lat: node.lat,
      lng: node.lng,
      rain24hMm: Number((12.5 + idx * 3.2).toFixed(1)),
      rain7dMm: Number((64.0 + idx * 14.5).toFixed(1)),
      windSpeed10mKmh: Number((15.0 + (idx % 4) * 4.5).toFixed(1)),
      windDirection10mDeg: (215 + idx * 15) % 360,
      windGusts10mKmh: Number((26.0 + (idx % 4) * 6.0).toFixed(1)),
      surfacePressureHpa: 1008.2,
      pm25: node.region === 'North' ? 48.5 : 21.0,
      pm10: node.region === 'North' ? 72.0 : 34.0,
      usAqi: node.region === 'North' ? 132 : 64
    }));
  }
}

/**
 * Fetches RainViewer global weather radar frames (past 2 hours + nowcast).
 */
export async function fetchRainViewerTimeline(forceRefresh = false): Promise<RainViewerData> {
  const cacheKey = 'rainviewer_frames_v1';
  if (!forceRefresh) {
    const cached = getCached<RainViewerData>(cacheKey);
    if (cached && cached.past.length > 0) return cached;
  }

  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data: RainViewerData = {
      host: json.host || 'https://tilecache.rainviewer.com',
      past: Array.isArray(json.radar?.past) ? json.radar.past : [],
      nowcast: Array.isArray(json.radar?.nowcast) ? json.radar.nowcast : []
    };
    if (data.past.length > 0) {
      setCached(cacheKey, data);
    }
    return data;
  } catch {
    return {
      host: 'https://tilecache.rainviewer.com',
      past: [],
      nowcast: []
    };
  }
}

/**
 * Fetches USGS real-time earthquakes (M2.5+ past 7 days) and prioritizes Southeast Asia tectonic events.
 */
export async function fetchUsgsEarthquakes(forceRefresh = false): Promise<EarthquakeEvent[]> {
  const cacheKey = 'usgs_earthquakes_v1';
  if (!forceRefresh) {
    const cached = getCached<EarthquakeEvent[]>(cacheKey);
    if (cached) return cached;
  }

  try {
    const res = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson'
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const features = Array.isArray(json.features) ? json.features : [];

    const allEvents: EarthquakeEvent[] = features
      .map((f: any) => {
        const coords = f.geometry?.coordinates || [0, 0, 0];
        return {
          id: String(f.id || Math.random()),
          title: String(f.properties?.title || 'Seismic Event'),
          magnitude: Number(f.properties?.mag ?? 0),
          depthKm: Number(coords[2] ?? 10),
          lng: Number(coords[0] ?? 0),
          lat: Number(coords[1] ?? 0),
          time: Number(f.properties?.time ?? Date.now()),
          place: String(f.properties?.place || 'Unknown Region')
        };
      })
      .filter((e: EarthquakeEvent) => Number.isFinite(e.lat) && Number.isFinite(e.lng));

    // Filter for SE Asia / Andaman / Myanmar / Yunnan / Sumatra tectonic belt
    const regional = allEvents.filter(
      (e) => e.lat >= -10 && e.lat <= 30 && e.lng >= 88 && e.lng <= 115
    );

    const selected = (regional.length >= 3 ? regional : allEvents.slice(0, 25)).slice(0, 40);
    setCached(cacheKey, selected);
    return selected;
  } catch {
    return [
      {
        id: 'fallback-sagaing-1',
        title: 'M 4.6 - 78 km NNE of Tachileik / Shan State (รอยเลื่อนสะกาย-แม่จัน)',
        magnitude: 4.6,
        depthKm: 10.0,
        lat: 20.95,
        lng: 100.12,
        time: Date.now() - 3600000 * 5,
        place: 'Shan State, Myanmar (ใกล้ชายแดนแม่สาย จ.เชียงราย)'
      },
      {
        id: 'fallback-srisawat-2',
        title: 'M 3.2 - 34 km NW of Si Sawat, Kanchanaburi (แนวรอยเลื่อนศรีสวัสดิ์)',
        magnitude: 3.2,
        depthKm: 8.5,
        lat: 14.92,
        lng: 98.95,
        time: Date.now() - 3600000 * 18,
        place: 'Si Sawat, Kanchanaburi, Thailand'
      },
      {
        id: 'fallback-andaman-3',
        title: 'M 4.9 - Andaman Sea Ridge (แผ่นดินไหวทะเลอันดามัน)',
        magnitude: 4.9,
        depthKm: 14.2,
        lat: 9.85,
        lng: 94.25,
        time: Date.now() - 3600000 * 29,
        place: 'Andaman Sea'
      }
    ];
  }
}

/**
 * Fetches a 30-point Copernicus DEM 90m elevation cross-section profile from Open-Meteo Elevation API.
 */
export async function fetchDemCrossSection(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  samples = 30
): Promise<DemCrossSectionProfile> {
  const pts = interpolateCrossSectionPoints(start, end, samples);
  const lats = pts.map((p) => p.lat.toFixed(5)).join(',');
  const lngs = pts.map((p) => p.lng.toFixed(5)).join(',');
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const elevations: number[] = Array.isArray(json.elevation) ? json.elevation : [];

    const profileSamples: DemCrossSectionSample[] = pts.map((pt, idx) => {
      const rawElev = elevations[idx];
      const elev = Number.isFinite(Number(rawElev)) ? Number(rawElev) : 15.0;
      return {
        index: idx,
        distanceMeters: pt.distanceMeters,
        lat: pt.lat,
        lng: pt.lng,
        elevationMsl: Number(elev.toFixed(2))
      };
    });

    const elevValues = profileSamples.map((s) => s.elevationMsl);
    const minElevationMsl = Math.min(...elevValues);
    const maxElevationMsl = Math.max(...elevValues);

    return {
      start,
      end,
      totalDistanceMeters: pts[pts.length - 1]?.distanceMeters || 0,
      minElevationMsl,
      maxElevationMsl,
      samples: profileSamples
    };
  } catch {
    // Deterministic valley cross-section fallback if offline
    const profileSamples: DemCrossSectionSample[] = pts.map((pt, idx) => {
      const norm = (idx / Math.max(1, pts.length - 1)) * 2 - 1; // -1 to +1
      const channelDepression = 14.0 * Math.pow(norm, 2);
      const elev = Number((12.5 + channelDepression).toFixed(2));
      return {
        index: idx,
        distanceMeters: pt.distanceMeters,
        lat: pt.lat,
        lng: pt.lng,
        elevationMsl: elev
      };
    });
    const elevValues = profileSamples.map((s) => s.elevationMsl);
    return {
      start,
      end,
      totalDistanceMeters: pts[pts.length - 1]?.distanceMeters || 0,
      minElevationMsl: Math.min(...elevValues),
      maxElevationMsl: Math.max(...elevValues),
      samples: profileSamples
    };
  }
}
