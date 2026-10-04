export interface LatLonDD {
  lat: number;
  lng: number;
}

export type LatLng = LatLonDD;

export function fromGeoJsonCoord(coord: [number, number]): LatLng {
  return { lat: coord[1], lng: coord[0] };
}

export function toGeoJsonCoord(ll: LatLng): [number, number] {
  return [ll.lng, ll.lat];
}

export function toLeafletCoord(ll: LatLng): [number, number] {
  return [ll.lat, ll.lng];
}

export interface DMSVal {
  deg: number;
  min: number;
  sec: number;
  direction: 'N' | 'S' | 'E' | 'W';
}

export interface LatLonDMS {
  lat: DMSVal;
  lng: DMSVal;
}

export interface UTMCoord {
  zone: 47 | 48;
  hemisphere: 'N';
  easting: number;
  northing: number;
  epsg: string;
}

export interface Indian1975Coord {
  zone: 47 | 48;
  easting: number;
  northing: number;
  epsg: string;
}

export interface CompleteCoordinateSet {
  wgs84_dd: LatLonDD;
  wgs84_dms: LatLonDMS;
  wgs84_utm: UTMCoord;
  indian1975_utm: Indian1975Coord;
}

// Traverse Types
export interface TraverseLegInput {
  station: string;
  targetStation: string;
  distance: number;
  azimuthDeg: number; // Decimal degrees or azimuth from bearing
}

export interface AdjustedLegOutput {
  leg: string;
  distance: number;
  rawDe: number;
  rawDn: number;
  corrDe: number;
  corrDn: number;
  adjDe: number;
  adjDn: number;
  adjustedEasting: number;
  adjustedNorthing: number;
}

export interface TraverseAdjustmentResult {
  totalPerimeter: number;
  misclosureE: number;
  misclosureN: number;
  linearMisclosure: number;
  precisionRatio: number; // 1:N
  precisionGrade: string; // e.g., "1st Order", "2nd Order", "Needs Resurvey"
  adjustedLegs: AdjustedLegOutput[];
  stationCoordinates: { [station: string]: { easting: number; northing: number } };
}

// Leveling Types
export interface LevelingRowInput {
  id: string;
  station: string;
  bs: number | null;
  ifs: number | null;
  fs: number | null;
  remark?: string;
}

export interface LevelingRowOutput extends LevelingRowInput {
  hi: number | null;
  elevation: number;
  rise: number | null;
  fall: number | null;
}

export interface LevelingLoopResult {
  rows: LevelingRowOutput[];
  sumBs: number;
  sumFs: number;
  diffBsFs: number;
  startElevation: number;
  endElevation: number;
  deltaBenchmarks: number;
  closureErrorMeters: number;
  closureErrorMm: number;
  totalDistanceKm: number;
  arithmeticCheckPassed: boolean;
  orderCompliance: {
    firstOrderMaxMm: number;
    secondOrderMaxMm: number;
    thirdOrderMaxMm: number;
    constructionMaxMm: number;
    achievedOrder: string;
  };
}

// Thai Land Area Types
export interface ThaiLandArea {
  rai: number;
  ngan: number;
  wah: number;
  sqMeters: number;
  hectares: number;
  acres: number;
  isValid?: boolean;
}

// Knowledge Hub Types
export type KnowledgeCategory = 
  | 'survey-instrument'
  | 'gnss-gps'
  | 'drone-uav'
  | 'scanner-slam'
  | 'hydrographic'
  | 'tbm-tunnel'
  | 'total-station'
  | 'gnss-geodesy'
  | 'differential-leveling'
  | 'drone-photogrammetry'
  | 'lidar-scan-bim'
  | 'field-qa-qc';

export interface FieldChecklistStep {
  title: string;
  details: string;
  criticalCaution?: string;
}

export interface DeviceScreenStep {
  stepNumber: number;
  stageName: string;
  targetHardware: string; // e.g. "Topcon / Sokkia / Leica / Trimble"
  buttonKey: string;      // Keypad button to press, e.g. "[MENU] -> [F1:COORD] -> [1.OCC.ORIENT]"
  actionLabel: string;
  screenTitle: string;
  screenLines: string[];  // Simulated LCD/OLED display text
  explanation: string;
  qaCheck?: string;
  downstreamUsage?: string;
}

export interface DownstreamWorkflow {
  outputDataFormat: string; // e.g. "CSV (PT,N,E,Z,CD), SDR33, GSI-8, DXF"
  outputDescription: string;
  nextStepTitle: string;
  nextStepProcedure: string;
  recommendedToolTab?: 'coord' | 'converter' | 'traverse' | 'leveling' | 'map';
  toolActionLabel?: string;
}

export interface InstrumentAnatomyPart {
  number: number;
  name: string;
  nameEn: string;
  description: string;
}

export interface InstrumentAnatomy {
  imagePath?: string; // e.g. "/images/instruments/auto-level.jpg"
  imageCaption: string;
  modelExamples: string;
  parts: InstrumentAnatomyPart[];
}

export interface InstrumentVariantUseCase {
  name: string;
  equipmentCombo: string;
  useCases: string[];
}

export interface KnowledgeTopic {
  id: string;
  code?: string;
  title: string;
  titleEn: string;
  category: KnowledgeCategory;
  categoryName: string;
  summary: string;
  badge: string;
  iconName: string;
  verificationStatus: 'draft' | 'verified';
  verificationProof?: string;
  instrumentVariants?: InstrumentVariantUseCase[];
  instrumentAnatomy?: InstrumentAnatomy;
  equipmentRequired?: string[];
  workingPrinciple: string[];
  fieldProcedures: FieldChecklistStep[];
  deviceWorkflow?: DeviceScreenStep[];
  downstreamWorkflow?: DownstreamWorkflow;
  errorSourcesAndMitigation: string[];
  courseRelation?: string;
  formulas?: { label: string; formula: string; explanation: string }[];
}


