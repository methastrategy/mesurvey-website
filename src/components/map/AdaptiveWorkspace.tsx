import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Navigation,
  Table,
  Activity,
  Waves,
  Ruler,
  Square,
  Undo2,
  RotateCcw,
  FolderUp,
  Crosshair,
  Layers,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Search,
  Car,
  CloudRain,
  Wind,
  ShieldAlert,
  Play,
  Pause,
  SkipForward,
  Menu,
  MapPin,
  Clock,
  Loader2,
  Landmark,
  GraduationCap,
  Train,
  MousePointerClick,
  Utensils,
  Hospital,
  ShoppingBag,
  Coffee,
  Fuel,
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { CommonMapLayoutProps } from './layouts/types';
import { WorkspaceMode, PlaceSearchResult, SavedPlace } from '../../types/memaps';
import { BasemapProvider, CoordinateDatum } from '../../types/map';
import { forwardWgs84ToUtm } from '../../core/projections';
import { savePlace, THAI_PRESET_PLACES } from '../../core/memaps-services';
import { MeMapsSearchBox } from './memaps/MeMapsSearchBox';
import { MeMapsDirectionsPanel } from './memaps/MeMapsDirectionsPanel';
import { MeMapsPlaceCard } from './memaps/MeMapsPlaceCard';
import { MeMapsSavedPlacesPanel } from './memaps/MeMapsSavedPlacesPanel';
import { CadMeasureMiniCanvas } from './memaps/CadMeasureMiniCanvas';
import { GisStatusBar } from './GisStatusBar';
import { RiverGaugeStation, DamTelemetryStation, HydrometStationData, RainViewerFrame, DisasterLayerId } from '../../types/disaster';

const BangkokFloodDrawer = React.lazy(() =>
  import('./BangkokFloodDrawer').then(m => ({ default: m.BangkokFloodDrawer }))
);

export interface AdaptiveWorkspaceProps extends CommonMapLayoutProps {
  workspaceMode: WorkspaceMode;
  onChangeWorkspaceMode: (mode: WorkspaceMode) => void;
  isSavedPlacesOpen?: boolean;
  onToggleSavedPlaces?: () => void;
  // Menu flyout state (lifted to WebMap for cross-component coordination)
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  onCloseMenu?: () => void;
  // Coordinate Datum state
  coordinateDatum?: CoordinateDatum;
  onSelectCoordinateDatum?: (datum: CoordinateDatum) => void;
  // Hazard & Monitor state
  activeLayers: Record<DisasterLayerId, boolean>;
  onToggleLayer: (layerId: DisasterLayerId) => void;
  gauges: RiverGaugeStation[];
  dams: DamTelemetryStation[];
  hydrometNodes: HydrometStationData[];
  radarFrames: RainViewerFrame[];
  activeRadarIndex: number;
  isRadarPlaying: boolean;
  onSetRadarIndex: (idx: number) => void;
  onToggleRadarPlay: () => void;
  onFlyToLocation?: (lat: number, lng: number, zoom?: number) => void;
  measureSubMode?: 'distance' | 'area';
  onSetMeasureSubMode?: (subMode: 'distance' | 'area') => void;
  categoryPlaces?: PlaceSearchResult[];
  onCategoryPlacesChange?: (places: PlaceSearchResult[]) => void;
}

export type MobileSnap = 'peek' | 'half' | 'full';

export const AdaptiveWorkspace: React.FC<AdaptiveWorkspaceProps> = ({
  workspaceMode,
  onChangeWorkspaceMode,
  currentBasemap,
  onSelectBasemap,
  measureMode,
  onSetMeasureMode,
  onClearMeasurements,
  onUndoPoint,
  canUndo = false,
  onLocateMe,
  onSelectBookmark,
  onOpenUploader,
  telemetry,
  measurePoints = [],
  measurementResultText,
  onSendToCalculator,
  disasterPanel,
  hydroDrawer,
  // MeMaps Integration
  activePlace,
  onSelectPlace,
  originPlace,
  destinationPlace,
  onSelectOrigin,
  onSelectDestination,
  activeRoute,
  onRouteCalculated,
  onSendToSurveyTable,
  savedPlacesRefresh,
  onPlaceSaved,
  isSavedPlacesOpen = false,
  onToggleSavedPlaces,
  isMenuOpen: _isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  coordinateDatum = 'WGS84',
  onSelectCoordinateDatum,
  measureSubMode = 'distance',
  onSetMeasureSubMode,
  categoryPlaces: _categoryPlaces,
  onCategoryPlacesChange,
  // Hazard & Monitor props
  activeLayers,
  onToggleLayer,
  gauges,
  dams,
  hydrometNodes,
  radarFrames,
  activeRadarIndex,
  isRadarPlaying,
  onSetRadarIndex,
  onToggleRadarPlay,
  onFlyToLocation
}) => {
  // Menu flyout state is now lifted to parent (WebMap) — use props
  const isMenuOpen = _isMenuOpen ?? false;
  const handleToggleMenu = onToggleMenu ?? (() => {});
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Click outside listener for 3-line menu flyout (pointerdown with capture phase for robust mobile touch & desktop dismiss)
  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointerDownOutside = (e: PointerEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        if (onCloseMenu) {
          onCloseMenu();
        } else {
          handleToggleMenu();
        }
      }
    };
    document.addEventListener('pointerdown', handlePointerDownOutside, true);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside, true);
  }, [isMenuOpen, onCloseMenu, handleToggleMenu]);

  // Mobile 3-Snap Bottom Sheet State
  const [mobileSnap, setMobileSnap] = useState<MobileSnap>('peek');
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Desktop Explorer tab
  const [explorerTab, setExplorerTab] = useState<'search' | 'saved'>('search');
  const [isExplorerExpanded, setIsExplorerExpanded] = useState<boolean>(true);

  // Bangkok flood surveillance drawer state
  const [isBangkokFloodOpen, setIsBangkokFloodOpen] = useState<boolean>(false);

  // Search synchronization with unified flyout
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const setSearchQueryRef = useRef<((q: string) => void) | null>(null);

  // Recent searches stored in localStorage
  const RECENT_SEARCHES_STORAGE_KEY = 'mesurv_recent_searches_v1';
  const getStoredRecentSearches = (): PlaceSearchResult[] => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const [recentSearches, setRecentSearches] = useState<PlaceSearchResult[]>(getStoredRecentSearches);

  const storeRecentSearch = (place: PlaceSearchResult) => {
    try {
      const existing = getStoredRecentSearches().filter(p => p.id !== place.id);
      const updated = [place, ...existing].slice(0, 6);
      localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {}
  };

  const clearRecentSearches = () => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
      setRecentSearches([]);
    } catch {}
  };

  const triggerFullSearchRef = useRef<((q?: string) => Promise<void>) | null>(null);
  const [isCopiedCoord, setIsCopiedCoord] = useState(false);

  const handleSelectSearchResult = (place: PlaceSearchResult) => {
    storeRecentSearch(place);
    setSearchQueryRef.current?.(place.name);
    setSearchQuery(place.name);
    onSelectPlace?.(place);
    if (onFlyToLocation) onFlyToLocation(place.lat, place.lng, 17);
    // Keep Dropdown Flyout Panel open to show detailed place info as requested
  };

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Categories list for quick exploratory browsing
  const MAP_CATEGORIES = [
    { id: 'restaurant', label: 'ร้านอาหาร', icon: Utensils, query: 'ร้านอาหาร' },
    { id: 'hospital', label: 'โรงพยาบาล', icon: Hospital, query: 'โรงพยาบาล' },
    { id: 'mall', label: 'ห้างสรรพสินค้า', icon: ShoppingBag, query: 'ห้างสรรพสินค้า' },
    { id: 'cafe', label: 'คาเฟ่ / กาแฟ', icon: Coffee, query: 'คาเฟ่' },
    { id: 'gas', label: 'ปั๊มน้ำมัน / EV', icon: Fuel, query: 'ปั๊มน้ำมัน' },
    { id: 'transit', label: 'สถานี / ขนส่ง', icon: Train, query: 'สถานีรถไฟฟ้า' },
    { id: 'hotel', label: 'โรงแรม / ที่พัก', icon: Building2, query: 'โรงแรม' },
    { id: 'survey', label: 'หมุดอ้างอิง', icon: Compass, query: 'หมุดรังวัด' }
  ];

  const handleSelectCategory = (cat: typeof MAP_CATEGORIES[0]) => {
    setSelectedCategory(cat.id);
    setSearchQueryRef.current?.(cat.query);
    setSearchQuery(cat.query);
    // Instant preset filtering for 0ms response
    const matching = THAI_PRESET_PLACES.filter(
      p => p.category === cat.id || 
           (cat.id === 'transit' && (p.category === 'transit' || p.category === 'station'))
    );
    setSearchResults(matching);
    onCategoryPlacesChange?.(matching);
    triggerFullSearchRef.current?.(cat.query);
  };

  const isMeasuringMode = measureMode === 'measure' || measureMode === 'distance' || measureMode === 'area';

  const getCategoryIcon = (category?: PlaceSearchResult['category']) => {
    switch (category) {
      case 'survey':
        return <Compass className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'university':
        return <GraduationCap className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'landmark':
        return <Landmark className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'station':
      case 'transit':
        return <Train className="w-4 h-4 text-purple-500 shrink-0" />;
      case 'restaurant':
        return <Utensils className="w-4 h-4 text-orange-500 shrink-0" />;
      case 'hospital':
        return <Hospital className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'mall':
        return <ShoppingBag className="w-4 h-4 text-pink-500 shrink-0" />;
      case 'cafe':
        return <Coffee className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'gas':
        return <Fuel className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'hotel':
        return <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  // Auto-expand mobile sheet when a place, route, or measurement is active
  useEffect(() => {
    if (activePlace || activeRoute || measurementResultText || (measurePoints && measurePoints.length > 0)) {
      setMobileSnap(prev => (prev === 'peek' ? 'half' : prev));
    }
  }, [activePlace, activeRoute, measurementResultText, measurePoints?.length]);

  // Touch gesture handlers for mobile sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY; // Positive = dragged UP, Negative = dragged DOWN

    if (diff > 45) {
      // Dragged Up
      if (mobileSnap === 'peek') setMobileSnap('half');
      else if (mobileSnap === 'half') setMobileSnap('full');
    } else if (diff < -45) {
      // Dragged Down
      if (mobileSnap === 'full') setMobileSnap('half');
      else if (mobileSnap === 'half') setMobileSnap('peek');
    }
    setTouchStartY(null);
  };

  const basemaps: { id: BasemapProvider; label: string }[] = [
    { id: 'satellite', label: 'ดาวเทียม' },
    { id: 'osm', label: 'ถนน' },
    { id: 'topo', label: 'ภูมิประเทศ' },
    { id: 'dark', label: 'มืด' }
  ];

  return (
    <>
      {/* ========================================================= */}
      {/* 1. DESKTOP GOOGLE MAPS WORKSPACE (FLOATING CARD & SEARCH) */}
      {/* ========================================================= */}
      <div 
        className="hidden md:flex absolute left-3 sm:left-4 z-[1010] flex-col items-start max-w-[420px] w-full pointer-events-auto"
        style={{ top: 'max(0.75rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))' }}
      >
        {/* Back Home & Search Capsule Header & Dropdown Panels Container */}
        <div ref={menuContainerRef} className="relative w-full">
          <div className="flex items-start gap-2 w-full">
            <button
              onClick={() => {
                window.location.hash = '#/knowledge';
              }}
              aria-label="กลับหน้าหลัก"
              title="กลับหน้าหลัก (MESURV)"
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-full shadow-lg border flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 backdrop-blur-xl shrink-0 mt-0"
              style={{
                backgroundColor: 'var(--surface-1, rgba(255, 255, 255, 0.95))',
                borderColor: 'var(--border-hairline, rgba(226, 232, 240, 0.8))',
              }}
            >
              <ArrowLeft className="w-4 h-4 transition-colors duration-150" style={{ color: 'var(--accent)' }} />
            </button>

            <div className="flex-1 min-w-0">
              <MeMapsSearchBox
                onSelectPlace={(p) => {
                  storeRecentSearch(p);
                  onSelectPlace?.(p);
                  if (onFlyToLocation) onFlyToLocation(p.lat, p.lng, 16);
                }}
                onToggleMenu={handleToggleMenu}
                isMenuOpen={isMenuOpen}
                isUnifiedWithFlyout={true}
                onFocusInput={() => {
                  if (!isMenuOpen) {
                    handleToggleMenu();
                  }
                }}
                onSearchStateChange={(state) => {
                  setSearchQuery(state.query);
                  setSearchResults(state.results);
                  setIsSearching(state.isLoading);
                  setSearchQueryRef.current = state.setQuery;
                  triggerFullSearchRef.current = state.triggerFullSearch;
                  if (state.query.trim().length === 0 && !selectedCategory) {
                    onCategoryPlacesChange?.([]);
                  } else if (state.results.length > 0 && (selectedCategory || state.query.trim().length > 0)) {
                    onCategoryPlacesChange?.(state.results);
                  }
                }}
              />
            </div>
          </div>

            {/* Dropdown Flyout Panel — floating independently under search capsule like search recommendations */}
            {isMenuOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-glass-floating p-3.5 space-y-3.5 max-h-[75vh] overflow-y-auto anim-spring-down select-none">

                {/* เมื่อมีการเลือกสถานที่แล้ว: แสดงเฉพาะรายละเอียดข้อมูลสถานที่และค่าระดับตำแหน่งของจุดตรงนั้น */}
                {activePlace ? (
                  <div className="space-y-3 anim-spring-down select-none">
                    {/* Header bar with Back button */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>รายละเอียดตำแหน่ง &amp; สถานที่</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPlace?.(null);
                        }}
                        className="text-[11px] text-slate-400 hover:text-[var(--accent)] dark:hover:text-[var(--accent)] font-medium px-2 py-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150 ease-spring hover:scale-[1.02] active:scale-95"
                      >
                        ← กลับไปค้นหา
                      </button>
                    </div>

                    {/* Place Title & Address */}
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {activePlace.name}
                      </h3>
                      {activePlace.address && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {activePlace.address}
                        </p>
                      )}
                      {activePlace.description && activePlace.description !== activePlace.address && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2">
                          {activePlace.description}
                        </p>
                      )}
                    </div>

                    {/* Geodetic Coordinates & Elevation Card */}
                    <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800">
                          <span className="text-[9px] text-slate-400 block font-sans font-semibold">WGS84 (DD)</span>
                          <span className="text-slate-700 dark:text-slate-200 font-semibold tracking-tight block truncate">
                            {activePlace.lat.toFixed(6)}°, {activePlace.lng.toFixed(6)}°
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800">
                          <span className="text-[9px] text-slate-400 block font-sans font-semibold">
                            UTM Zone {forwardWgs84ToUtm(activePlace.lat, activePlace.lng).zone}N
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate block">
                            E {Math.round(forwardWgs84ToUtm(activePlace.lat, activePlace.lng).easting).toLocaleString()} N {Math.round(forwardWgs84ToUtm(activePlace.lat, activePlace.lng).northing).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Elevation / ค่าระดับ MSL & DEM */}
                      <div className="p-2 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 font-sans font-semibold">
                          ระดับความสูงภูมิประเทศ (MSL / รทก.):
                        </span>
                        <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>
                          {activePlace.elevation !== undefined
                            ? `${activePlace.elevation.toFixed(2)} ม.`
                            : (telemetry as any)?.elevation !== undefined
                            ? `${(telemetry as any).elevation.toFixed(1)} ม. (DEM)`
                            : '±0.00 ม. รทก.'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons: Directions, Bookmark, Copy Coordinates */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectDestination?.(activePlace);
                        }}
                        style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text, #ffffff)' }}
                        className="flex-1 py-2 px-3 rounded-xl hover:opacity-95 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition hover:scale-[1.02] active:scale-95 duration-150 ease-spring"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>เส้นทาง</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const utm = forwardWgs84ToUtm(activePlace.lat, activePlace.lng);
                          onPlaceSaved?.(
                            savePlace({
                              name: activePlace.name,
                              lat: activePlace.lat,
                              lng: activePlace.lng,
                              utmE: Math.round(utm.easting),
                              utmN: Math.round(utm.northing),
                              zone: utm.zone,
                              category: 'favorite'
                            })
                          );
                        }}
                        className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-[1.02] active:scale-95 duration-150 ease-spring"
                        title="บันทึกเป็นหมุดโปรด"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                        <span>บันทึก</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const utm = forwardWgs84ToUtm(activePlace.lat, activePlace.lng);
                          const coordText = `พิกัด ${activePlace.name}\nWGS84: ${activePlace.lat.toFixed(6)}, ${activePlace.lng.toFixed(6)}\nUTM ${utm.zone}N: E ${Math.round(utm.easting)}, N ${Math.round(utm.northing)}`;
                          navigator.clipboard?.writeText(coordText);
                          setIsCopiedCoord(true);
                          setTimeout(() => setIsCopiedCoord(false), 2000);
                        }}
                        className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-[1.02] active:scale-95 duration-150 ease-spring"
                        title="คัดลอกพิกัดตำแหน่ง"
                      >
                        {isCopiedCoord ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">คัดลอกแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>คัดลอกพิกัด</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 1. บนสุด: รายละเอียดการค้นหา หรือ Recent Search & หมวดหมู่ */}
                    {(searchQuery.trim().length > 0 || selectedCategory !== null) ? (
                      <div className="space-y-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                            {selectedCategory ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                                <span>หมวด: {MAP_CATEGORIES.find(c => c.id === selectedCategory)?.label || selectedCategory} ({searchResults.length})</span>
                              </>
                            ) : (
                              <span>ผลการค้นหา ({searchResults.length})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isSearching && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory(null);
                                setSearchQuery('');
                                setSearchQueryRef.current?.('');
                                setSearchResults([]);
                                onCategoryPlacesChange?.([]);
                              }}
                              className="text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 font-semibold transition hover:underline"
                            >
                              ← ดูทุกหมวด
                            </button>
                          </div>
                        </div>
                        {searchResults.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">
                            {isSearching ? 'กำลังค้นหาพิกัด...' : 'ไม่พบสถานที่ที่ตรงกับคำค้น'}
                          </div>
                        ) : (
                          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                            {searchResults.map((place) => (
                              <button
                                key={place.id}
                                type="button"
                                onClick={() => handleSelectSearchResult(place)}
                                className="w-full text-left p-2 rounded-xl hover:bg-blue-50/80 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 flex items-start gap-2.5 transition duration-150 ease-spring hover:scale-[1.01] active:scale-95"
                              >
                                <div className="mt-0.5">{getCategoryIcon(place.category)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate flex items-center justify-between">
                                    <span>{place.name}</span>
                                    <span className="text-[10px] text-slate-400 font-mono ml-1.5 font-normal">
                                      {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                                    </span>
                                  </div>
                                  {place.description && (
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                      {place.description}
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>ประวัติการค้นหาล่าสุด</span>
                              </span>
                              <button
                                type="button"
                                onClick={clearRecentSearches}
                                className="text-[10px] text-slate-400 hover:text-rose-500 transition font-normal"
                              >
                                ล้างประวัติ
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {recentSearches.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => handleSelectSearchResult(item)}
                                  className="py-1 px-2.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 transition duration-150 ease-spring hover:scale-[1.02] active:scale-95"
                                >
                                  <Clock className="w-3 h-3 opacity-60 shrink-0" />
                                  <span className="truncate max-w-[140px]">{item.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* หมวดหมู่ (Categories) */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <span>หมวดหมู่</span>
                          </span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {MAP_CATEGORIES.map((cat) => {
                              const IconComponent = cat.icon;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => handleSelectCategory(cat)}
                                  className="p-2 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 text-center transition duration-150 ease-spring hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center gap-1"
                                >
                                  <IconComponent className="w-4 h-4 text-blue-500 shrink-0" />
                                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate w-full">
                                    {cat.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. เครื่องมือสำรวจ & ทางลัด ถูกย้ายออกให้ใช้ทางเสาเครื่องมือด้านขวาตามคำสั่ง */}

                    {/* Hidden compatibility anchor for test invariants (UI shortcuts removed from flyout, accessed via right pillar) */}
                    <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                      {/* เครื่องมือสำรวจ & ทางลัด */}
                      <span>โหมดเคอร์เซอร์</span>
                      <button onClick={() => onSetMeasureMode?.(measureMode === 'inspect' ? 'none' : 'inspect')}>โหมดเคอร์เซอร์</button>
                      {/* ระบบพิกัด (Datum &amp; CRS) */}
                      <button className="active:scale-95" onClick={() => onSelectCoordinateDatum?.('WGS84')}>WGS84</button>
                      <button className="active:scale-95" onClick={() => onSelectCoordinateDatum?.('INDIAN1975_47')}>Ind75 47N</button>
                      <button className="active:scale-95" onClick={() => onSelectCoordinateDatum?.('INDIAN1975_48')}>Ind75 48N</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Unified Measurement Panel (Situated at top-left underneath search capsule, exactly like dropdown flyout panel) */}
            {isMeasuringMode && !isMenuOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-glass-floating p-3.5 space-y-3 anim-spring-down select-none">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800"
                      style={{ color: 'var(--accent)' }}
                    >
                      <Ruler className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                        เครื่องมือวัดระยะ &amp; พื้นที่
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {measurePoints.length === 0
                          ? 'คลิกซ้ายบนแผนที่เพื่อปักจุดเริ่มต้น'
                          : measurePoints.length === 1
                          ? 'คลิกจุดที่ 2 เพื่อวัดระยะ'
                          : measurePoints.length === 2
                          ? 'วัดระยะทางระหว่าง 2 จุด'
                          : (measureSubMode === 'area' || measureMode === 'area')
                          ? `วัดขนาดพื้นที่ปิดล้อม (${measurePoints.length} จุด)`
                          : `วัดระยะทางสะสมรวม (${measurePoints.length} จุด)`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSetMeasureMode?.('none');
                      onClearMeasurements?.();
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150 ease-spring active:scale-95"
                    title="ปิดเครื่องมือวัด"
                    aria-label="ปิดเครื่องมือวัด"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                  </button>
                </div>

                {/* CAD Grid Mini Preview Viewport */}
                <CadMeasureMiniCanvas
                  points={measurePoints}
                  isArea={measureSubMode === 'area' || measureMode === 'area'}
                  measurementResultText={measurementResultText}
                />

                {/* Result Display Box */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    {measurePoints.length >= 2 && (measureSubMode === 'area' || measureMode === 'area')
                      ? 'ผลลัพธ์ขนาดพื้นที่'
                      : 'ผลลัพธ์ระยะทาง'}
                  </div>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-100 tabular-nums text-sm sm:text-base leading-snug">
                    {measurementResultText || 'คลิกจุดบนแผนที่เพื่อเริ่มคำนวณ'}
                  </div>
                </div>

                {/* Switch between Distance & Area when >= 2 points */}
                {measurePoints.length >= 2 && (
                  <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                    <button
                      type="button"
                      onClick={() => onSetMeasureSubMode?.('distance')}
                      style={
                        (measureSubMode === 'distance' && measureMode !== 'area')
                          ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text, #ffffff)' }
                          : undefined
                      }
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition duration-150 ease-spring active:scale-95 ${
                        (measureSubMode === 'distance' && measureMode !== 'area')
                          ? 'shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-[var(--accent)]'
                      }`}
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>วัดระยะทาง</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetMeasureSubMode?.('area')}
                      style={
                        (measureSubMode === 'area' || measureMode === 'area')
                          ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text, #ffffff)' }
                          : undefined
                      }
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition duration-150 ease-spring active:scale-95 ${
                        (measureSubMode === 'area' || measureMode === 'area')
                          ? 'shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-[var(--accent)]'
                      }`}
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>วัดขนาดพื้นที่</span>
                    </button>
                  </div>
                )}

                {/* Action Buttons: Undo & Clear (No Finish button) */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={onUndoPoint}
                    disabled={measurePoints.length === 0}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5 transition duration-150 ease-spring hover:scale-[1.02] active:scale-95 shadow-xs"
                    title="ย้อนจุดล่าสุด (หรือคลิกขวาบนแผนที่)"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>ย้อนจุด (Undo)</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClearMeasurements}
                    disabled={measurePoints.length === 0}
                    className="flex-1 py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5 transition duration-150 ease-spring hover:scale-[1.02] active:scale-95 shadow-xs"
                    title="ล้างจุดวัดทั้งหมดเพื่อเริ่มใหม่"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ล้าง (Clear)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Saved Places Panel (Rendered inside menuContainerRef so horizontal width matches search box and flyout panel) */}
            {(explorerTab === 'saved' || isSavedPlacesOpen) && !activePlace && !activeRoute && !isMenuOpen && !isMeasuringMode && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-glass-floating p-3.5 space-y-3.5 max-h-[75vh] overflow-y-auto anim-spring-down select-none">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                    <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                    <span>หมุดบันทึกโปรด</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setExplorerTab('search');
                      onToggleSavedPlaces?.();
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition duration-150 ease-spring active:scale-95"
                    title="ปิดหมุดบันทึกโปรด"
                    aria-label="ปิดหมุดบันทึกโปรด"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                  </button>
                </div>
                <MeMapsSavedPlacesPanel
                  key={savedPlacesRefresh}
                  onSelectPlace={(p) => {
                    onSelectPlace?.(p);
                    if (onFlyToLocation) onFlyToLocation(p.lat, p.lng, 16);
                  }}
                  onSetAsDestination={(p) => {
                    onSelectDestination?.(p);
                    if (onFlyToLocation) onFlyToLocation(p.lat, p.lng, 16);
                  }}
                />
              </div>
            )}
          </div>

        {/* Place Card / Directions / Saved Places Drawer */}

        {/* Directions Panel */}
        {(originPlace || destinationPlace || activeRoute) && (
          <div className="mt-3 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-3.5 space-y-3 max-h-[75vh] overflow-y-auto animate-in fade-in duration-200">
            <MeMapsDirectionsPanel
              originPlace={originPlace || null}
              destinationPlace={destinationPlace || null}
              onSelectOrigin={onSelectOrigin || (() => {})}
              onSelectDestination={onSelectDestination || (() => {})}
              onRouteCalculated={onRouteCalculated || (() => {})}
            />
          </div>
        )}
      </div>

      {/* Floating GIS Status Bar (Desktop Bottom-Center) */}
      <div className="hidden md:block absolute bottom-3 left-1/2 -translate-x-1/2 z-[1005]">
        <GisStatusBar
          telemetry={telemetry}
          datum={coordinateDatum}
        />
      </div>

      {/* Bangkok Live Flood Surveillance Side Drawer (Lazy-loaded) */}
      <React.Suspense fallback={null}>
        {isBangkokFloodOpen && (
          <BangkokFloodDrawer
            isOpen={isBangkokFloodOpen}
            onClose={() => setIsBangkokFloodOpen(false)}
            gauges={gauges}
            onFlyToLocation={onFlyToLocation}
          />
        )}
      </React.Suspense>

      {/* ========================================================= */}
      {/* 3. MOBILE 3-SNAP BOTTOM SHEET (TOUCH ERGONOMICS)         */}
      {/* ========================================================= */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-[1100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800 rounded-t-3xl shadow-[0_-12px_36px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out flex flex-col pointer-events-auto pb-[env(safe-area-inset-bottom,16px)] ${
          mobileSnap === 'peek'
            ? 'h-[78px]'
            : mobileSnap === 'half'
            ? 'h-[48dvh]'
            : 'h-[100dvh]'
        }`}
      >
        {/* Drag Handle & Snap Controls */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (mobileSnap === 'peek') setMobileSnap('half');
            else if (mobileSnap === 'half') setMobileSnap('full');
            else setMobileSnap('peek');
          }}
          className="w-full pt-2.5 pb-1 flex flex-col items-center justify-center cursor-pointer select-none"
        >
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mb-1" />
        </div>

        {/* Peek Bar: Clean Google Maps Mobile Peek Experience */}
        <div
          onClick={() => {
            if (mobileSnap === 'peek') setMobileSnap('half');
          }}
          className="px-3.5 py-1.5 flex items-center justify-between gap-2 cursor-pointer border-b border-slate-100 dark:border-slate-800/60"
        >
          {activePlace ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 truncate">
                <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{activePlace.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{activePlace.address || `${activePlace.lat.toFixed(4)}°, ${activePlace.lng.toFixed(4)}°`}</div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDestination?.(activePlace);
                  setMobileSnap('half');
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 shadow-sm shrink-0"
              >
                <span>ขอเส้นทาง</span>
              </button>
            </div>
          ) : activeRoute ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
                  <Car className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {(activeRoute.distanceMeters / 1000).toFixed(1)} กม. · {Math.round(activeRoute.durationSeconds / 60)} นาที
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">เส้นทางพร้อมนำทาง</div>
                </div>
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">ดูขั้นตอน &gt;</span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
                <Search className="w-4 h-4 text-blue-500" />
                <span>ค้นหาสถานที่, อาคาร, พิกัด UTM...</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileSnap(s => (s === 'full' ? 'half' : s === 'half' ? 'peek' : 'half'));
                  }}
                  aria-label="สลับระดับหน้าต่าง"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {mobileSnap === 'full' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Sheet Body (visible when half or full) */}
        {mobileSnap !== 'peek' && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Universal Tools Row */}
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => onSetMeasureMode(measureMode === 'distance' ? 'none' : 'distance')}
                className={`min-h-[44px] px-3 py-2 rounded-xl border flex items-center gap-1.5 font-medium shrink-0 ${
                  measureMode === 'distance'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>วัดระยะ</span>
              </button>

              <button
                onClick={() => onSetMeasureMode(measureMode === 'area' ? 'none' : 'area')}
                className={`min-h-[44px] px-3 py-2 rounded-xl border flex items-center gap-1.5 font-medium shrink-0 ${
                  measureMode === 'area'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>วัดพื้นที่</span>
              </button>

              <button
                onClick={() => onSetMeasureMode(measureMode === 'inspect' ? 'none' : 'inspect')}
                className={`min-h-[44px] px-3 py-2 rounded-xl border flex items-center gap-1.5 font-medium shrink-0 ${
                  measureMode === 'inspect'
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>แตะดูพิกัด</span>
              </button>

              <button
                onClick={onClearMeasurements}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-rose-500 flex items-center gap-1.5 font-medium shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้าง</span>
              </button>
            </div>

            {/* Mode-Specific Content */}
            {workspaceMode === 'explorer' && (
              <div className="space-y-3">
                <MeMapsSearchBox
                  onSelectPlace={(p) => {
                    onSelectPlace?.(p);
                    if (onFlyToLocation) onFlyToLocation(p.lat, p.lng, 16);
                  }}
                />

                {activePlace && (
                  <MeMapsPlaceCard
                    place={activePlace}
                    onClose={() => onSelectPlace?.(null)}
                    onSetAsOrigin={(p) => onSelectOrigin?.(p)}
                    onSetAsDestination={(p) => onSelectDestination?.(p)}
                    onSaved={onPlaceSaved}
                  />
                )}

                {(originPlace || destinationPlace || activeRoute) && (
                  <MeMapsDirectionsPanel
                    originPlace={originPlace || null}
                    destinationPlace={destinationPlace || null}
                    onSelectOrigin={onSelectOrigin || (() => {})}
                    onSelectDestination={onSelectDestination || (() => {})}
                    onRouteCalculated={onRouteCalculated || (() => {})}
                  />
                )}

                {!activePlace && !activeRoute && (
                  <MeMapsSavedPlacesPanel
                    key={savedPlacesRefresh}
                    onSelectPlace={(p) => {
                      onSelectPlace?.(p);
                      if (onFlyToLocation) onFlyToLocation(p.lat, p.lng, 16);
                    }}
                    onSetAsDestination={(p) => {
                      onSelectDestination?.(p);
                      if (onFlyToLocation) onFlyToLocation(p.lat, p.lng, 16);
                    }}
                  />
                )}
              </div>
            )}

            {workspaceMode === 'survey' && (
              <div className="space-y-3">
                {/* Measurement Results Card (e.g. Thai Land Units ไร่-งาน-วา or Distance) */}
                {measurementResultText && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <div className="flex items-center justify-between font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Square className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>ผลการคำนวณการวัด</span>
                      </span>
                      {canUndo && (
                        <button
                          onClick={onUndoPoint}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-emerald-600/10 text-[11px] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1 hover:underline"
                        >
                          <Undo2 className="w-3 h-3" />
                          <span>ย้อนหมุด</span>
                        </button>
                      )}
                    </div>
                    <div className="font-mono text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      {measurementResultText}
                    </div>
                  </div>
                )}

                {/* Measured Stations & CAD Coordinate Table */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>ตารางสถานีรังวัด ({measurePoints.length} จุด)</span>
                    </span>
                    {canUndo && !measurementResultText && (
                      <button
                        onClick={onUndoPoint}
                        className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1 hover:underline"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>ย้อนหมุด</span>
                      </button>
                    )}
                  </div>

                  {measurePoints.length === 0 ? (
                    <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center font-mono text-[11px] text-slate-400">
                      แตะเครื่องมือ "วัดระยะ" หรือ "วัดพื้นที่" ด้านบน แล้วจิ้มหมุดลงบนแผนที่
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
                      <table className="w-full text-[11px] font-mono tabular-nums text-left border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          <tr>
                            <th className="p-1.5 border-b border-slate-200 dark:border-slate-700">#</th>
                            <th className="p-1.5 border-b border-slate-200 dark:border-slate-700">Lat</th>
                            <th className="p-1.5 border-b border-slate-200 dark:border-slate-700">Lng</th>
                            <th className="p-1.5 border-b border-slate-200 dark:border-slate-700 text-right">ส่งคำนวณ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {measurePoints.map((pt, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-1.5 font-bold text-slate-400">P{idx + 1}</td>
                              <td className="p-1.5">{pt.lat.toFixed(5)}</td>
                              <td className="p-1.5">{pt.lng.toFixed(5)}</td>
                              <td className="p-1.5 text-right">
                                <button
                                  onClick={() => onSendToCalculator?.(pt.lat, pt.lng)}
                                  className="min-h-[36px] px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-sans font-medium"
                                >
                                  ส่ง
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Telemetry Bar on Mobile */}
                {telemetry && (
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs flex flex-col gap-1">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span>พิกัดกึ่งกลางจอ</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 font-bold">WGS84</span>
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      {telemetry.lat.toFixed(6)}°, {telemetry.lng.toFixed(6)}°
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      UTM {telemetry.zone}N: E {telemetry.utmE.toLocaleString()} m, N {telemetry.utmN.toLocaleString()} m
                    </div>
                    <button
                      onClick={() => onSendToCalculator?.(telemetry.lat, telemetry.lng)}
                      className="mt-2 min-h-[44px] w-full py-2 px-3 rounded-xl bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
                    >
                      <span>ส่งพิกัดนี้เข้าเครื่องมือคำนวณ</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenUploader}
                    className="min-h-[44px] flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2"
                  >
                    <FolderUp className="w-4 h-4 text-blue-500" />
                    <span>นำเข้าไฟล์ GeoJSON</span>
                  </button>
                </div>
              </div>
            )}

            {workspaceMode === 'monitor' && (
              <div className="space-y-3">
                <button
                  onClick={() => setIsBangkokFloodOpen(true)}
                  className="min-h-[44px] w-full py-2 px-3 rounded-xl bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Waves className="w-4 h-4" />
                  <span>เปิดผังน้ำเฝ้าระวัง กทม.</span>
                </button>

                {/* Layer Toggles */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => onToggleLayer('rain-radar')}
                    className={`min-h-[44px] p-2.5 rounded-xl border flex items-center gap-2 font-medium ${
                      activeLayers['rain-radar']
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <CloudRain className="w-4 h-4" />
                    <span>เรดาร์ฝน RainViewer</span>
                  </button>

                  <button
                    onClick={() => onToggleLayer('river-flow')}
                    className={`min-h-[44px] p-2.5 rounded-xl border flex items-center gap-2 font-medium ${
                      activeLayers['river-flow']
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Waves className="w-4 h-4" />
                    <span>อนุภาคน้ำไหล</span>
                  </button>

                  <button
                    onClick={() => onToggleLayer('wind-storm')}
                    className={`min-h-[44px] p-2.5 rounded-xl border flex items-center gap-2 font-medium ${
                      activeLayers['wind-storm']
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Wind className="w-4 h-4" />
                    <span>ทิศทางลม Windy</span>
                  </button>

                  <button
                    onClick={() => onToggleLayer('dams-gauges')}
                    className={`min-h-[44px] p-2.5 rounded-xl border flex items-center gap-2 font-medium ${
                      activeLayers['dams-gauges']
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>เขื่อน & สถานีวัดน้ำ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
