export type DisasterLayerId =
  | 'river-flow'
  | 'dams-gauges'
  | 'rain-radar'
  | 'wind-storm'
  | 'wildfire-smoke'
  | 'satellite-cloud'
  | 'seismic-dem';

export type HydroAlertLevel = 'normal' | 'watch' | 'warning' | 'critical' | 'drought';

export type WaterwayType = 'river' | 'tributary' | 'canal';

export interface DirectedRiverSegment {
  id: string;
  nameTh: string;
  nameEn: string;
  basin: string;
  streamOrder: 1 | 2 | 3 | 4 | 5 | 6;
  waterwayType?: WaterwayType;
  lengthKm?: number;
  headwaterTh?: string;
  mouthTh?: string;
  provinces?: string[];
  upstreamIds?: string[];
  downstreamId?: string | null;
  bankfullCapacityCms: number; // ความจุลำน้ำวิกฤต (m³/s)
  linkedGaugeId: string;
  upstreamElevationMsl: number; // ระดับความสูงต้นน้ำ (ม.รทก.)
  downstreamElevationMsl: number; // ระดับความสูงปลายน้ำ (ม.รทก.)
  // พิกัด [lat, lng] เรียงจากต้นน้ำ (Upstream) -> ปลายน้ำ (Downstream) เสมอ
  coordinates: [number, number][];
}

export interface DamTelemetryStation {
  id: string;
  nameTh: string;
  nameEn: string;
  river: string;
  basin: string;
  agency: 'EGAT' | 'RID';
  lat: number;
  lng: number;
  queryLat: number; // พิกัดบนร่องน้ำหลักสำหรับ GloFAS 5km Grid
  queryLng: number;
  maxCapacityMcm: number; // ความจุเก็บกักสูงสุด (ล้าน ลบ.ม.)
  normalHighWaterLevelMsl: number; // ระดับเก็บกักปกติ (ม.รทก.)
  baselineStoragePct: number;
  currentStorageMcm?: number;
  currentStoragePct?: number;
  inflowCms?: number;
  outflowCms?: number;
  forecastDates?: string[];
  forecastDischargeCms?: number[];
  forecastMaxCms?: number[];
  forecastP75Cms?: number[];
  forecastP25Cms?: number[];
  alertLevel?: HydroAlertLevel;
  updatedAtIso?: string;
  dataSourceLabel?: string;
}

export interface RiverGaugeStation {
  id: string;
  code: string; // เช่น C.2, C.13, P.1, M.7
  nameTh: string;
  river: string;
  province: string;
  lat: number;
  lng: number;
  queryLat: number;
  queryLng: number;
  bankfullElevationMsl: number; // ระดับตลิ่ง (ม.รทก.)
  zeroGaugeMsl: number; // ระดับศูนย์เสาวัดน้ำ (ม.รทก.)
  bankfullCapacityCms: number; // อัตราการไหลเต็มตลิ่ง (m³/s)
  currentDischargeCms?: number;
  waterElevationMsl?: number;
  freeboardMeters?: number; // ระยะพ้นน้ำ (+ ต่ำกว่าตลิ่ง, - ล้นตลิ่ง)
  bankCapacityPct?: number; // ร้อยละของความจุลำน้ำเทียบตลิ่ง (ThaiWater % of bank capacity)
  forecastDates?: string[];
  forecastDischargeCms?: number[];
  forecastMaxCms?: number[];
  forecastP75Cms?: number[];
  forecastP25Cms?: number[];
  alertLevel?: HydroAlertLevel;
  updatedAtIso?: string;
  dataSourceLabel?: string;
}

export interface BasinFlowTourStep {
  stepOrder: number;
  titleTh: string;
  stationCode: string;
  lat: number;
  lng: number;
  zoom: number;
  lagTimeHoursFromOrigin: number;
  engineeringNoteTh: string;
}

export interface RainViewerFrame {
  time: number;
  path: string;
}

export interface RainViewerData {
  host: string;
  past: RainViewerFrame[];
  nowcast: RainViewerFrame[];
}

export interface HydrometStationData {
  id: string;
  nameTh: string;
  region: string;
  lat: number;
  lng: number;
  rain24hMm: number;
  rain7dMm: number;
  windSpeed10mKmh: number;
  windDirection10mDeg: number;
  windGusts10mKmh: number;
  surfacePressureHpa: number;
  pm25: number;
  pm10: number;
  usAqi: number;
}

export interface WildfireHotspotCluster {
  id: string;
  nameTh: string;
  province: string;
  lat: number;
  lng: number;
  frpMw: number;
  confidence: 'high' | 'nominal';
}

export interface EarthquakeEvent {
  id: string;
  title: string;
  magnitude: number;
  depthKm: number;
  lat: number;
  lng: number;
  time: number;
  place: string;
}

export interface DemCrossSectionSample {
  index: number;
  distanceMeters: number;
  lat: number;
  lng: number;
  elevationMsl: number;
}

export interface DemCrossSectionProfile {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  totalDistanceMeters: number;
  minElevationMsl: number;
  maxElevationMsl: number;
  samples: DemCrossSectionSample[];
}
