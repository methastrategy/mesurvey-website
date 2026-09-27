export type BasemapProvider = 'osm' | 'satellite' | 'topo' | 'dark';

export interface BasemapConfig {
  id: BasemapProvider;
  name: string;
  nameEn: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export interface MapWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  easting: number;
  northing: number;
  zone: 47 | 48;
  elevation?: number;
  note?: string;
  createdAt: string;
  color?: string;
}

export interface BookmarkPreset {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  zoom: number;
  category: 'university' | 'benchmark' | 'survey-center';
}

export interface DistancePoint {
  lat: number;
  lng: number;
}

export interface MeasurementState {
  mode: 'none' | 'distance' | 'area';
  points: DistancePoint[];
  totalDistanceMeters: number;
  totalAreaSqMeters: number;
  thaiArea?: {
    rai: number;
    ngan: number;
    wah: number;
  };
}

export interface TelemetryState {
  lat: number;
  lng: number;
  easting: number;
  northing: number;
  zone: 47 | 48;
  zoom: number;
  scaleText?: string;
}
