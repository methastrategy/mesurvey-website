import React from 'react';
import { BasemapProvider, DistancePoint, MapInteractionMode } from '../../../types/map';
import { SURVEY_BOOKMARKS } from '../../../data/survey-presets';
import { MapWorkspaceTab } from '../MapToolbar';

import { PlaceSearchResult, RouteResult, SavedPlace } from '../../../types/memaps';

export type WebMapLayoutType = 'dynamic-island' | 'floating-pods' | 'monolith-rail' | 'split-cad' | 'classic-dock';

export interface CommonMapLayoutProps {
  currentBasemap: BasemapProvider;
  onSelectBasemap: (provider: BasemapProvider) => void;
  activeWorkspace: MapWorkspaceTab;
  onSelectWorkspace: (tab: MapWorkspaceTab) => void;
  activeOverlayCount: number;
  onClearAllOverlays: () => void;
  measureMode: MapInteractionMode;
  onSetMeasureMode: (mode: MapInteractionMode) => void;
  onClearMeasurements: () => void;
  onUndoPoint?: () => void;
  canUndo?: boolean;
  onLocateMe: () => void;
  onSelectBookmark: (bm: (typeof SURVEY_BOOKMARKS)[0]) => void;
  onOpenUploader: () => void;
  telemetry?: {
    lat: number;
    lng: number;
    utmE: number;
    utmN: number;
    zone: number;
    zoom: number;
  };
  measurePoints?: DistancePoint[];
  measurementResultText?: string | null;
  onSendToCalculator?: (lat: number, lng: number) => void;
  disasterPanel?: React.ReactNode;
  hydroDrawer?: React.ReactNode;
  activeLayout: WebMapLayoutType;
  onChangeLayout: (layout: WebMapLayoutType) => void;

  // MeMaps Integrated Navigation, Places & Routing
  activePlace?: PlaceSearchResult | null;
  onSelectPlace?: (place: PlaceSearchResult | null) => void;
  originPlace?: PlaceSearchResult | null;
  destinationPlace?: PlaceSearchResult | null;
  onSelectOrigin?: (place: PlaceSearchResult | null) => void;
  onSelectDestination?: (place: PlaceSearchResult | null) => void;
  activeRoute?: RouteResult | null;
  onRouteCalculated?: (route: RouteResult | null) => void;
  onSendToSurveyTable?: (stations: Array<{ name: string; lat: number; lng: number; utmE?: number; utmN?: number }>) => void;
  savedPlacesRefresh?: number;
  onPlaceSaved?: (saved: SavedPlace) => void;
}

export const MAP_LAYOUT_CONFIGS: {
  id: WebMapLayoutType;
  name: string;
  nameEn: string;
  icon: string;
  tagline: string;
}[] = [
  {
    id: 'dynamic-island',
    name: 'Dynamic Island',
    nameEn: 'Capsule & Floating Dock',
    icon: '🏝️',
    tagline: 'แคปซูลข้อมูลลอยด้านบน + ด็อกเครื่องมือด้านล่าง แผนที่โปร่ง 100%'
  },
  {
    id: 'floating-pods',
    name: 'Floating Pods',
    nameEn: '4-Corner Telemetry Pods',
    icon: '📦',
    tagline: 'การ์ดลอย 4 มุม แยกระบบค้นหา พิกัด เครื่องมือวัด และแผนที่ฐาน'
  },
  {
    id: 'monolith-rail',
    name: 'Monolith Rail',
    nameEn: 'Linear Precision 56px Rail',
    icon: '📏',
    tagline: 'แถบเรลไอคอนแนวดิ่งซ้ายสไตล์ Linear & CAD พร้อมค้นหา ⌘K'
  },
  {
    id: 'split-cad',
    name: 'Split CAD Studio',
    nameEn: 'Dual-Pane 50/50 Workbench',
    icon: '📐',
    tagline: 'จอคู่ แบ่งตารางพิกัดคำนวณสดทางซ้าย และแผนที่ดาวเทียมทางขวา'
  },
  {
    id: 'classic-dock',
    name: 'Classic Dock',
    nameEn: 'Original Left Stack',
    icon: '📋',
    tagline: 'กล่องเครื่องมือมาตรฐานรวมทุกฟังก์ชันด้านซ้าย'
  }
];
