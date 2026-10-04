export type TravelMode = 'driving' | 'walking' | 'cycling';

export interface PlaceSearchResult {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  lat: number;
  lng: number;
  category: 'landmark' | 'survey' | 'university' | 'hospital' | 'station' | 'address' | 'restaurant' | 'cafe' | 'mall' | 'gas' | 'transit' | 'hotel';
  address?: string;
  elevation?: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  roadName: string;
  modifier?: string;
  type?: string;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][]; // [lat, lng] pairs for Leaflet polyline
  steps: RouteStep[];
  mode: TravelMode;
  summary: string;
}

export type WorkspaceMode = 'explorer' | 'survey' | 'monitor';

export interface SavedPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  utmE?: number;
  utmN?: number;
  zone?: number;
  elevation?: number;
  elevationDatum?: 'MSL' | 'WGS84';
  accuracyM?: number;
  source?: 'user' | 'gps' | 'search' | 'preset' | 'survey';
  schemaVersion?: number;
  note?: string;
  createdAt: string;
  color?: string;
  category: 'favorite' | 'work' | 'survey' | 'home';
}

