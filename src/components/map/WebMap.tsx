import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { BasemapProvider, CoordinateDatum, DistancePoint, MapInteractionMode } from '../../types/map';
import {
  DisasterLayerId,
  DamTelemetryStation,
  RiverGaugeStation,
  DirectedRiverSegment,
  HydroAlertLevel,
  RainViewerFrame,
  HydrometStationData,
  EarthquakeEvent,
  DemCrossSectionProfile
} from '../../types/disaster';
import { forwardWgs84ToUtm } from '../../core/projections';
import { sqMetersToThaiLand, formatThaiLandString } from '../../core/land-units';
import { validateGeoJsonRFC7946 } from '../../core/geojson-validator';
import { sanitizeFeatureProperties, escapeHtml } from '../../utils/sanitize';
import { SURVEY_BOOKMARKS } from '../../data/survey-presets';
import {
  THAILAND_RIVER_SEGMENTS,
  THAILAND_MAJOR_DAMS,
  THAILAND_RIVER_GAUGES,
  BASIN_FLOW_TOURS,
  WILDFIRE_SURVEILLANCE_CLUSTERS
} from '../../data/thailand-hydro-network';
import {
  fetchRiverHydrologySnapshot,
  fetchHydrometAndAirQualityBatch,
  fetchRainViewerTimeline,
  fetchUsgsEarthquakes,
  fetchDemCrossSection,
  computeDownwindHazardCone,
  getNasaGibsDefaultDateString,
  getInitialHydrologySnapshot,
  findNearestHydrometNode,
  traceConnectedRiverNetwork
} from '../../core/disaster-services';
import { MapToolbar, MapWorkspaceTab } from './MapToolbar';
import { GeoJsonUploader } from './GeoJsonUploader';
import { RiverFlowCanvas } from './RiverFlowCanvas';
import { DisasterCommandPanel } from './DisasterCommandPanel';
import { HydroTelemetryDrawer } from './HydroTelemetryDrawer';
import { WebMapLayoutType, CommonMapLayoutProps } from './layouts/types';
import { AdaptiveWorkspace } from './AdaptiveWorkspace';
import { DynamicIslandMapLayout } from './layouts/DynamicIslandMapLayout';
import { FloatingPodsMapLayout } from './layouts/FloatingPodsMapLayout';
import { MonolithRailMapLayout } from './layouts/MonolithRailMapLayout';
import { SplitCadMapLayout } from './layouts/SplitCadMapLayout';
import { MapLibreGlobeEngine } from './MapLibreGlobeEngine';

const WindParticleCanvas = React.lazy(() =>
  import('./WindParticleCanvas').then(m => ({ default: m.WindParticleCanvas }))
);
import {
  Crosshair,
  Check,
  MapPin,
  Ruler,
  Square,
  RotateCcw,
  Undo2,
  Calculator,
  Scissors,
  X
} from 'lucide-react';
import { trackEvent } from '../../lib/telemetry';
import { useSurveyStore } from '../../store/useSurveyStore';
import { PlaceSearchResult, RouteResult, SavedPlace, WorkspaceMode } from '../../types/memaps';
import { reverseGeocode, getCategoryEmoji, getCategoryColor } from '../../core/memaps-services';
import { MeMapsMapControls } from './memaps/MeMapsMapControls';

interface WebMapProps {
  externalPoint?: { lat: number; lng: number; label: string } | null;
  onSendToCalculator?: (lat: number, lng: number) => void;
}

interface ContextMenuData {
  lat: number;
  lng: number;
  x: number;
  y: number;
}

const TOUR_STATION_CODE_TO_DAM_ID: Record<string, string> = {
  'EGAT-BB': 'dam-bhumibol',
  'EGAT-UR': 'dam-ubolratana',
  'RID-LP': 'dam-lampao',
  'EGAT-SN': 'dam-srinagarind',
  'EGAT-VK': 'dam-vajiralongkorn'
};

export const WebMap: React.FC<WebMapProps> = ({ externalPoint, onSendToCalculator }) => {
  const {
    plottedTraverseOverlay,
    clearPlottedTraverseOverlay,
    setInspectedCoordinate,
    setLevelingStartElevation,
    levelingRows,
    updateLevelingRow,
    setTraverseStart
  } = useSurveyStore();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  const vectorLayerRef = useRef<L.GeoJSON | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const gpsLocationLayerRef = useRef<L.LayerGroup | null>(null);
  const inspectMarkerRef = useRef<L.Marker | null>(null);
  const clickPopupRef = useRef<L.Popup | null>(null);
  const traverseOverlayLayerRef = useRef<L.LayerGroup | null>(null);

  // Multi-Hazard & Hydrological Layer Refs
  const riverBaseLayerRef = useRef<L.LayerGroup | null>(null);
  const hydroStationsLayerRef = useRef<L.LayerGroup | null>(null);
  const rainRadarTileRef = useRef<L.TileLayer | null>(null);
  const windStormLayerRef = useRef<L.LayerGroup | null>(null);
  const wildfireWmsRef = useRef<L.TileLayer.WMS | null>(null);
  const wildfireConeLayerRef = useRef<L.LayerGroup | null>(null);
  const satelliteCloudTileRef = useRef<L.TileLayer | null>(null);
  const seismicLayerRef = useRef<L.LayerGroup | null>(null);

  const [currentBasemap, setCurrentBasemap] = useState<BasemapProvider>('satellite');
  const [activeWorkspace, setActiveWorkspace] = useState<MapWorkspaceTab>('survey');

  // Unified MeMaps Workspace Mode: Default to 'explorer' (Google Maps style)
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('explorer');

  const [mapLayout, setMapLayout] = useState<WebMapLayoutType>('dynamic-island');

  const handleSelectWorkspaceMode = (mode: WorkspaceMode) => {
    setWorkspaceMode(mode);
    try {
      localStorage.setItem('mesurv-workspace-mode', mode);
      localStorage.setItem('mesurv-map-layout', mode === 'survey' ? 'split-cad' : 'dynamic-island');
    } catch {}
    if (mode === 'survey') {
      setMapLayout('split-cad');
    } else {
      setMapLayout('dynamic-island');
    }
    if (mode === 'monitor') {
      setActiveLayers((prev) => ({
        ...prev,
        'rain-radar': true,
        'river-flow': true,
        'wind-storm': true
      }));
    }
    trackEvent('map_switch_mode', { mode });
  };

  // MeMaps Tactical Geodetic Navigation & Turn-by-Turn Routing State
  const [activePlace, setActivePlace] = useState<PlaceSearchResult | null>(null);
  const [originPlace, setOriginPlace] = useState<PlaceSearchResult | null>(null);
  const [destinationPlace, setDestinationPlace] = useState<PlaceSearchResult | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [savedPlacesRefresh, setSavedPlacesRefresh] = useState<number>(0);
  const [isSavedPlacesOpen, setIsSavedPlacesOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [coordinateDatum, setCoordinateDatum] = useState<CoordinateDatum>('WGS84');
  const [isGlobe3D, setIsGlobe3D] = useState<boolean>(true);
  const [globeFlyTo, setGlobeFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const [categoryPlaces, setCategoryPlaces] = useState<PlaceSearchResult[]>([]);
  const categoryMarkersLayerRef = useRef<L.LayerGroup | null>(null);

  // Re-invalidate Leaflet map canvas size whenever layout switches (especially Split CAD pane changes)
  useEffect(() => {
    const t = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 180);
    return () => clearTimeout(t);
  }, [mapLayout]);
  const [measureMode, setMeasureMode] = useState<MapInteractionMode>('none');
  const [measurePoints, setMeasurePoints] = useState<DistancePoint[]>([]);
  const [measureSubMode, setMeasureSubMode] = useState<'distance' | 'area'>('distance');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number; heading?: number | null } | null>(null);
  const watchPositionIdRef = useRef<number | null>(null);
  const headingRef = useRef<number | null>(null);
  const orientationHandlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const liveMarkerRef = useRef<L.Marker | null>(null);
  const liveCircleRef = useRef<L.Circle | null>(null);
  const isFirstFixRef = useRef<boolean>(true);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [measurementResultText, setMeasurementResultText] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Clean up geolocation watch and orientation listener on unmount
  useEffect(() => {
    return () => {
      if (watchPositionIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchPositionIdRef.current);
        watchPositionIdRef.current = null;
      }
      if (orientationHandlerRef.current) {
        window.removeEventListener('deviceorientation', orientationHandlerRef.current, true);
        orientationHandlerRef.current = null;
      }
    };
  }, []);

  // Multi-Hazard & Hydrological Tactical State (All disabled by default so Normal Map opens clean)
  const [activeLayers, setActiveLayers] = useState<Record<DisasterLayerId, boolean>>({
    'river-flow': false,
    'dams-gauges': false,
    'rain-radar': false,
    'wind-storm': false,
    'wildfire-smoke': false,
    'satellite-cloud': false,
    'seismic-dem': false
  });

  const [gauges, setGauges] = useState<RiverGaugeStation[]>(() => getInitialHydrologySnapshot().gauges);
  const [dams, setDams] = useState<DamTelemetryStation[]>(() => getInitialHydrologySnapshot().dams);
  const [hydrometNodes, setHydrometNodes] = useState<HydrometStationData[]>([]);
  const [earthquakes, setEarthquakes] = useState<EarthquakeEvent[]>([]);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true);
  const [isRefreshingHydro, setIsRefreshingHydro] = useState<boolean>(false);

  // RainViewer Radar state
  const [radarHost, setRadarHost] = useState<string>('https://tilecache.rainviewer.com');
  const [radarFrames, setRadarFrames] = useState<RainViewerFrame[]>([]);
  const [activeRadarIndex, setActiveRadarIndex] = useState<number>(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(false);

  // NASA GIBS Satellite Date (defaults to UTC - 24h to prevent missing swath gaps)
  const [gibsDate, setGibsDate] = useState<string>(() => getNasaGibsDefaultDateString());

  // Basin Flow Tour state
  const [selectedTourId, setSelectedTourId] = useState<string>('chaophraya');
  const [activeTourStepIndex, setActiveTourStepIndex] = useState<number | null>(null);
  const [isTourPlaying, setIsTourPlaying] = useState<boolean>(false);

  // Selected Engineering Telemetry Drawer state + Topological River Network Focus
  const [selectedRiver, setSelectedRiver] = useState<DirectedRiverSegment | null>(null);
  const [selectedGauge, setSelectedGauge] = useState<RiverGaugeStation | null>(null);
  const [selectedDam, setSelectedDam] = useState<DamTelemetryStation | null>(null);
  const [crossSectionProfile, setCrossSectionProfile] = useState<DemCrossSectionProfile | null>(null);
  const [isLoadingCrossSection, setIsLoadingCrossSection] = useState<boolean>(false);
  const [hydroStatusFilter, setHydroStatusFilter] = useState<HydroAlertLevel | 'all'>('all');

  const connectedNetwork = useMemo(
    () => (selectedRiver ? traceConnectedRiverNetwork(selectedRiver.id) : null),
    [selectedRiver]
  );

  // Live Telemetry HUD state
  const [telemetry, setTelemetry] = useState<{
    lat: number;
    lng: number;
    utmE: number;
    utmN: number;
    zone: number;
    zoom: number;
  }>({
    lat: 13.84664,
    lng: 100.56982,
    utmE: 669820,
    utmN: 1531245,
    zone: 47,
    zoom: 16
  });

  // Locked Coordinate state (locks bottom status bar onto clicked point instead of mouse hover)
  const [lockedPoint, setLockedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const lockedPointRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    lockedPointRef.current = lockedPoint;
  }, [lockedPoint]);

  // Synchronous ref to prevent stale closures and touch event traps
  const measureModeRef = useRef<MapInteractionMode>(measureMode);
  useEffect(() => {
    measureModeRef.current = measureMode;
  }, [measureMode]);

  // Basemap Tile Providers
  const basemapUrls: { [key in BasemapProvider]: { url: string; maxZoom: number; maxNativeZoom?: number; attr: string } } = {
    osm: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maxZoom: 19,
      attr: '&copy; OpenStreetMap'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 21,
      maxNativeZoom: 18,
      attr: 'Tiles &copy; Esri, Maxar'
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      maxZoom: 17,
      attr: '&copy; OpenTopoMap'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      maxZoom: 20,
      attr: '&copy; CARTO'
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Cross-Module Coordinate Bridge to Coordinate Converter
  const handleSendToConverter = (lat: number, lng: number, customLabel?: string) => {
    trackEvent('map_send_to_converter', { lat, lng });
    setInspectedCoordinate({
      lat,
      lng,
      label: customLabel || 'พิกัดจากการตรวจสอบบนแผนที่',
      timestamp: Date.now()
    });
    if (onSendToCalculator) {
      onSendToCalculator(lat, lng);
    }
    window.location.hash = '#/calculator/coord';
  };

  // Cross-Module Elevation Bridge to Differential Leveling Calculator
  const handleSendElevationToLeveling = (elevationMsl: number, stationLabel: string) => {
    trackEvent('map_send_elevation_to_leveling', { elevationMsl, stationLabel });
    setLevelingStartElevation(elevationMsl.toFixed(3));
    if (levelingRows.length > 0) {
      updateLevelingRow(
        0,
        'remark',
        `BM อ้างอิงจาก MeMap: ${stationLabel} (+${elevationMsl.toFixed(3)} ม.รทก.)`
      );
    }
    showToast(`ส่งค่าระดับ BM +${elevationMsl.toFixed(3)} ม.รทก. (${stationLabel}) ไปยังงานระดับแล้ว`);
    window.location.hash = '#/calculator/leveling';
  };

  useEffect(() => {
    (window as any).__mesurvSendToConverter = (lat: number, lng: number) => {
      handleSendToConverter(lat, lng);
    };
    return () => {
      delete (window as any).__mesurvSendToConverter;
    };
  }, [onSendToCalculator, setInspectedCoordinate]);

  // Fetch all real-time Open API disaster & hydrological feeds
  const loadAllDisasterTelemetry = async (forceRefresh = false) => {
    setIsRefreshingHydro(true);
    try {
      const [hydroSnap, hydrometList, rvData, usgsList] = await Promise.all([
        fetchRiverHydrologySnapshot(forceRefresh),
        fetchHydrometAndAirQualityBatch(forceRefresh),
        fetchRainViewerTimeline(forceRefresh),
        fetchUsgsEarthquakes(forceRefresh)
      ]);

      setGauges(hydroSnap.gauges);
      setDams(hydroSnap.dams);
      setSelectedGauge((prev) =>
        prev ? hydroSnap.gauges.find((g) => g.id === prev.id) || prev : null
      );
      setSelectedDam((prev) =>
        prev ? hydroSnap.dams.find((d) => d.id === prev.id) || prev : null
      );
      setIsLiveApi(hydroSnap.isLive);
      setHydrometNodes(hydrometList);
      setEarthquakes(usgsList);

      const combinedFrames = [...rvData.past, ...rvData.nowcast];
      setRadarHost(rvData.host);
      setRadarFrames(combinedFrames);
      if (combinedFrames.length > 0) {
        setActiveRadarIndex(Math.max(0, rvData.past.length - 1));
      }

      if (forceRefresh) {
        showToast('อัปเดตข้อมูลอุทกวิทยา เรดาร์ฝน และแผ่นดินไหวล่าสุดแล้ว');
      }
    } finally {
      setIsRefreshingHydro(false);
    }
  };

  useEffect(() => {
    loadAllDisasterTelemetry(false);
  }, []);

  // Drop a station benchmark pin
  const dropStationMarker = (lat: number, lng: number, label?: string) => {
    if (!mapInstanceRef.current || !markerGroupRef.current) return;
    trackEvent('map_drop_marker', { lat, lng });

    const utm = forwardWgs84ToUtm(lat, lng);
    const stationName = label || `Station-${markerGroupRef.current.getLayers().length + 1}`;

    const markerPinIcon = L.divIcon({
      className: 'custom-marker-pin',
      html: `
        <div style="position: relative; width: 22px; height: 22px; transform: translate(-11px, -11px); display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid #f59e0b; background: rgba(245, 158, 11, 0.2); box-shadow: 0 0 10px rgba(245,158,11,0.6);"></div>
          <div style="position: absolute; width: 6px; height: 6px; border-radius: 50%; background: #f59e0b;"></div>
          <div style="position: absolute; width: 22px; height: 1.5px; background: #f59e0b;"></div>
          <div style="position: absolute; width: 1.5px; height: 22px; background: #f59e0b;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    const coordStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const utmStr = `UTM ${utm.zone}N: E ${utm.easting.toFixed(2)} m<br/>N ${utm.northing.toFixed(2)} m`;
    const utmCopyStr = `UTM ${utm.zone}N: E ${utm.easting.toFixed(2)} m, N ${utm.northing.toFixed(2)} m`;

    const popupHtml = `
      <div style="padding: 4px 6px; min-width: 220px;">
        <div style="font-size: 12px; font-weight: 700; color: #f59e0b; margin-bottom: 2px;">
          📍 ${stationName} (หมุดรังวัด)
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
          WGS84: ${coordStr}
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 12px; color: #475569; margin-bottom: 8px;">
          ${utmStr}
        </div>
        <button 
          style="
            width: 100%;
            min-height: 44px;
            padding: 10px 14px;
            background: #f59e0b;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: background 0.15s ease;
          "
          onmouseover="this.style.background='#d97706'"
          onmouseout="this.style.background='#f59e0b'"
          onclick="
            navigator.clipboard.writeText('${coordStr}\\n${utmCopyStr}');
            this.innerText = 'คัดลอกพิกัดแล้ว';
            setTimeout(() => { this.innerText = 'คัดลอกพิกัด WGS84 & UTM'; }, 1800);
          "
        >
          คัดลอกพิกัด WGS84 & UTM
        </button>
      </div>
    `;

    L.marker([lat, lng], { icon: markerPinIcon })
      .bindPopup(popupHtml, {
        autoPanPaddingTopLeft: [16, 120],
        autoPanPaddingBottomRight: [16, 84]
      })
      .addTo(markerGroupRef.current)
      .openPopup();
  };

  // Synchronize marker removal when activePlace is cleared
  useEffect(() => {
    if (!activePlace) {
      if (inspectMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(inspectMarkerRef.current);
        inspectMarkerRef.current = null;
      }
    }
  }, [activePlace]);

  // Inspect coordinate click handler with Geodetic Reticle & Flyout Dropdown Integration
  const inspectCoordinate = (lat: number, lng: number) => {
    trackEvent('map_inspect_point', { lat, lng });

    // 1. Lock coordinates on bottom telemetry status bar
    setLockedPoint({ lat, lng });
    const utm = forwardWgs84ToUtm(lat, lng);
    setTelemetry({
      lat,
      lng,
      utmE: Math.round(utm.easting),
      utmN: Math.round(utm.northing),
      zone: utm.zone,
      zoom: Math.round(mapInstanceRef.current?.getZoom() || 5)
    });

    // 2. Set activePlace immediately with formatted geodetic info & open dropdown flyout
    const initialPlace: PlaceSearchResult = {
      id: `click-${Date.now()}`,
      name: `พิกัด ${lat.toFixed(5)}°, ${lng.toFixed(5)}°`,
      description: `WGS84: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      address: `UTM: Zone ${utm.zone}N E: ${Math.round(utm.easting).toLocaleString()} N: ${Math.round(utm.northing).toLocaleString()}`,
      lat,
      lng,
      category: 'address'
    };
    setActivePlace(initialPlace);
    setIsMenuOpen(true);

    // 3. Leaflet 2D reticle pin (if in 2D mode)
    if (mapInstanceRef.current) {
      if (inspectMarkerRef.current) {
        mapInstanceRef.current.removeLayer(inspectMarkerRef.current);
      }
      const crosshairIcon = L.divIcon({
        className: 'custom-crosshair-reticle',
        html: `
          <div style="position: relative; width: 36px; height: 42px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45)); cursor: pointer; pointer-events: auto;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #ffffff; border: 2.5px solid #ea4335; display: flex; align-items: center; justify-content: center; font-size: 18px; line-height: 1;">
              📍
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #ea4335; margin-top: -1px;"></div>
          </div>
        `,
        iconSize: [36, 42],
        iconAnchor: [18, 42]
      });

      const newMarker = L.marker([lat, lng], { icon: crosshairIcon }).addTo(mapInstanceRef.current);
      inspectMarkerRef.current = newMarker;
    }

    // 4. Asynchronously resolve human readable place name for MeMaps
    reverseGeocode(lat, lng)
      .then((info) => {
        setActivePlace((prev) => {
          if (!prev || Math.abs(prev.lat - lat) > 1e-6 || Math.abs(prev.lng - lng) > 1e-6) return prev;
          return {
            ...prev,
            name: info.name || prev.name,
            description: info.address || prev.description,
            address: info.address || prev.address
          };
        });
      })
      .catch(() => {
        // Keep geodetic coordinate card if offline or lookup fails
      });
  };

  // Instantly remove inspect pin / reticle when exiting inspect mode
  useEffect(() => {
    if (measureMode !== 'inspect') {
      if (inspectMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(inspectMarkerRef.current);
        inspectMarkerRef.current = null;
      }
      setLockedPoint(null);
      if (activePlace?.id?.startsWith('click-')) {
        setActivePlace(null);
      }
    }
  }, [measureMode]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = 15.1583;
    const initialLng = 100.4500;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 7,
      maxZoom: 21,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer (High-Res Satellite default)
    const baseConfig = basemapUrls['satellite'];
    const tileLayer = L.tileLayer(baseConfig.url, {
      maxZoom: baseConfig.maxZoom,
      maxNativeZoom: baseConfig.maxNativeZoom,
      attribution: baseConfig.attr
    }).addTo(map);

    const riverBaseGroup = L.layerGroup().addTo(map);
    const windStormGroup = L.layerGroup().addTo(map);
    const wildfireConeGroup = L.layerGroup().addTo(map);
    const seismicGroup = L.layerGroup().addTo(map);
    const hydroStationsGroup = L.layerGroup().addTo(map);
    const measureGroup = L.layerGroup().addTo(map);
    const markerGroup = L.layerGroup().addTo(map);
    const gpsGroup = L.layerGroup().addTo(map);
    const traverseGroup = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);
    const categoryGroup = L.layerGroup().addTo(map);

    tileLayerRef.current = tileLayer;
    riverBaseLayerRef.current = riverBaseGroup;
    windStormLayerRef.current = windStormGroup;
    wildfireConeLayerRef.current = wildfireConeGroup;
    seismicLayerRef.current = seismicGroup;
    hydroStationsLayerRef.current = hydroStationsGroup;
    measureLayerRef.current = measureGroup;
    markerGroupRef.current = markerGroup;
    gpsLocationLayerRef.current = gpsGroup;
    traverseOverlayLayerRef.current = traverseGroup;
    routeLayerRef.current = routeGroup;
    categoryMarkersLayerRef.current = categoryGroup;
    mapInstanceRef.current = map;
    setMapInstance(map);

    // Attach listener for popup bridge buttons
    map.on('popupopen', (e: L.PopupEvent) => {
      const el = e.popup.getElement();
      if (!el) return;
      const bridgeBtn = el.querySelector<HTMLButtonElement>('#btn-bridge-to-converter');
      if (bridgeBtn) {
        bridgeBtn.onclick = (evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          const lat = parseFloat(bridgeBtn.getAttribute('data-lat') || '0');
          const lng = parseFloat(bridgeBtn.getAttribute('data-lng') || '0');
          handleSendToConverter(lat, lng);
        };
      }
    });

    // Track live telemetry on map move
    const updateTelemetry = () => {
      const center = map.getCenter();
      const utm = forwardWgs84ToUtm(center.lat, center.lng);
      setTelemetry({
        lat: center.lat,
        lng: center.lng,
        utmE: Math.round(utm.easting),
        utmN: Math.round(utm.northing),
        zone: utm.zone,
        zoom: map.getZoom()
      });
    };

    map.on('move', updateTelemetry);
    map.on('zoomend', updateTelemetry);

    // Track live telemetry on mouse hover across map (without clicking)
    const mapContainer = map.getContainer();
    const handleContainerMouseMove = (e: MouseEvent) => {
      // If a point is locked by clicking, keep showing the locked point coordinates
      if (lockedPointRef.current) return;

      try {
        const latlng = map.mouseEventToLatLng(e);
        if (latlng && Number.isFinite(latlng.lat) && Number.isFinite(latlng.lng)) {
          const utm = forwardWgs84ToUtm(latlng.lat, latlng.lng);
          setTelemetry({
            lat: latlng.lat,
            lng: latlng.lng,
            utmE: Math.round(utm.easting),
            utmN: Math.round(utm.northing),
            zone: utm.zone,
            zoom: map.getZoom()
          });
        }
      } catch {
        // Ignore during zoom animations or unmount
      }
    };
    mapContainer.addEventListener('mousemove', handleContainerMouseMove);

    // Dismiss flyout menu on map drag / pan
    map.on('movestart', () => {
      setIsMenuOpen(false);
    });

    // Dynamic Map Click Event
    map.on('click', (e: L.LeafletMouseEvent) => {
      setIsMenuOpen(false);
      setContextMenu(null);
      const mode = measureModeRef.current;
      const { lat, lng } = e.latlng;

      if (mode === 'distance' || mode === 'area' || mode === 'measure') {
        setMeasurePoints((prev) => [...prev, { lat, lng }]);
        return;
      }

      if (mode === 'cross-section') {
        setMeasurePoints((prev) => {
          if (prev.length >= 2) {
            return [{ lat, lng }];
          }
          return [...prev, { lat, lng }];
        });
        return;
      }

      if (mode === 'marker') {
        dropStationMarker(lat, lng);
        return;
      }

      // Only inspect & drop pin if user explicitly activated Inspect Mode from top-right!
      if (mode === 'inspect') {
        inspectCoordinate(lat, lng);
      }
    });

    // Right-Click Event (Context Menu / Undo Point)
    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      e.originalEvent.preventDefault();
      const mode = measureModeRef.current;

      // Right-click during active measurement: Undo Last Vertex!
      if (mode === 'distance' || mode === 'area' || mode === 'cross-section' || mode === 'measure') {
        setMeasurePoints((prev) => {
          if (prev.length <= 1) {
            setMeasurementResultText(null);
            return [];
          }
          return prev.slice(0, -1);
        });
        showToast('ย้อนกลับจุดรังวัดล่าสุดแล้ว (Undo)');
        return;
      }

      // In normal / inspect mode: open quick geomatics context menu
      setContextMenu({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        x: e.containerPoint.x,
        y: e.containerPoint.y
      });
    });

    // Middle Mouse Button (Wheel Click) Drag to Pan (CAD / GIS Standard)
    const handleAuxClick = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };

    let isMiddleDragging = false;
    let middleStartPoint = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        isMiddleDragging = true;
        middleStartPoint = { x: e.clientX, y: e.clientY };
        mapContainer.style.cursor = 'grabbing';
      }
    };

    const handleMouseMoveMiddle = (e: MouseEvent) => {
      if (isMiddleDragging) {
        e.preventDefault();
        const dx = middleStartPoint.x - e.clientX;
        const dy = middleStartPoint.y - e.clientY;
        middleStartPoint = { x: e.clientX, y: e.clientY };
        map.panBy([dx, dy], { animate: false });
      }
    };

    const handleMouseUpMiddle = (e: MouseEvent) => {
      if (e.button === 1 && isMiddleDragging) {
        e.preventDefault();
        isMiddleDragging = false;
        mapContainer.style.cursor = '';
      }
    };

    mapContainer.addEventListener('auxclick', handleAuxClick);
    mapContainer.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMoveMiddle);
    window.addEventListener('mouseup', handleMouseUpMiddle);

    // Initial Telemetry Update
    updateTelemetry();

    // Invalidate size after layout settles to guarantee 100% full-screen canvas fill
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      mapContainer.removeEventListener('auxclick', handleAuxClick);
      mapContainer.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMoveMiddle);
      window.removeEventListener('mouseup', handleMouseUpMiddle);
      mapContainer.removeEventListener('mousemove', handleContainerMouseMove);
      map.remove();
      mapInstanceRef.current = null;
      setMapInstance(null);
      traverseOverlayLayerRef.current = null;
    };
  }, []);

  // Handle Basemap Switch
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const config = basemapUrls[currentBasemap];
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      maxNativeZoom: config.maxNativeZoom,
      attribution: config.attr
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
    trackEvent('map_switch_basemap', { basemap: currentBasemap });
  }, [currentBasemap]);

  // MeMaps Active Route Leaflet Polyline Rendering & Auto-Fit Bounds
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;
    routeLayerRef.current.clearLayers();

    if (!activeRoute || activeRoute.coordinates.length === 0) return;

    // 1. Casing polyline (darker shadow underlayer for crisp contrast)
    L.polyline(activeRoute.coordinates, {
      color: '#0f172a',
      weight: 8,
      opacity: 0.7,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(routeLayerRef.current);

    // 2. High-contrast neon routing polyline
    const routePolyline = L.polyline(activeRoute.coordinates, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(routeLayerRef.current);

    // 3. Start marker (Green circle 'A')
    const startCoord = activeRoute.coordinates[0];
    const startIcon = L.divIcon({
      className: 'memaps-route-start-pin',
      html: `
        <div style="background: #10b981; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2px solid #ffffff;">
          A
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    L.marker(startCoord, { icon: startIcon }).addTo(routeLayerRef.current);

    // 4. End marker (Red circle 'B')
    const endCoord = activeRoute.coordinates[activeRoute.coordinates.length - 1];
    const endIcon = L.divIcon({
      className: 'memaps-route-end-pin',
      html: `
        <div style="background: #ef4444; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2px solid #ffffff;">
          B
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    L.marker(endCoord, { icon: endIcon }).addTo(routeLayerRef.current);

    // Smooth fit bounds to entire route
    mapInstanceRef.current.fitBounds(routePolyline.getBounds(), {
      padding: [60, 60],
      maxZoom: 17,
      animate: true
    });
  }, [activeRoute]);

  // MeMaps Active Place Pin Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (searchMarkerRef.current) {
      mapInstanceRef.current.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }

    if (!activePlace) return;

    const emoji = getCategoryEmoji(activePlace.category, activePlace.name);
    const color = getCategoryColor(activePlace.category);

    const pinIcon = L.divIcon({
      className: 'memaps-place-pin',
      html: `
        <div style="position: relative; width: 36px; height: 42px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45)); cursor: pointer;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #ffffff; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 18px; line-height: 1;">
            ${emoji}
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${color}; margin-top: -1px;"></div>
        </div>
      `,
      iconSize: [36, 42],
      iconAnchor: [18, 42]
    });

    const marker = L.marker([activePlace.lat, activePlace.lng], { icon: pinIcon }).addTo(mapInstanceRef.current);
    searchMarkerRef.current = marker;

    mapInstanceRef.current.flyTo([activePlace.lat, activePlace.lng], Math.max(mapInstanceRef.current.getZoom(), 15), {
      duration: 0.8
    });
  }, [activePlace]);

  // Render Category / Search Results Markers with Place Names on Map
  useEffect(() => {
    if (!categoryMarkersLayerRef.current || !mapInstanceRef.current) return;
    const group = categoryMarkersLayerRef.current;
    group.clearLayers();

    if (categoryPlaces.length === 0) return;

    const bounds = L.latLngBounds([]);

    categoryPlaces.forEach((place) => {
      bounds.extend([place.lat, place.lng]);

      const emoji = getCategoryEmoji(place.category, place.name);
      const color = getCategoryColor(place.category);

      // Marker pin with place name label above pin
      const pinIcon = L.divIcon({
        className: 'category-marker-pin',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; pointer-events: auto; cursor: pointer; user-select: none;">
            <div style="background: rgba(15, 23, 42, 0.92); color: #ffffff; padding: 2px 7px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.25); margin-bottom: 2px; text-shadow: 0 1px 2px rgba(0,0,0,0.5); max-width: 170px; overflow: hidden; text-overflow: ellipsis;">
              ${place.name}
            </div>
            <div style="position: relative; width: 34px; height: 38px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
              <div style="width: 30px; height: 30px; border-radius: 50%; background: #ffffff; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 16px; line-height: 1;">
                ${emoji}
              </div>
              <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 7px solid ${color}; margin-top: -1px;"></div>
            </div>
          </div>
        `,
        iconSize: [170, 64],
        iconAnchor: [85, 64]
      });

      const marker = L.marker([place.lat, place.lng], { icon: pinIcon }).addTo(group);
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setActivePlace(place);
        setIsMenuOpen(true);
      });
    });

    if (bounds.isValid() && categoryPlaces.length > 0) {
      mapInstanceRef.current.flyToBounds(bounds, {
        padding: [80, 80],
        maxZoom: 15,
        duration: 1.0
      });
    }
  }, [categoryPlaces]);

  // Entity selection handlers with smooth camera flyTo & topological highlighting
  const handleSelectRiverEntity = (river: DirectedRiverSegment) => {
    setActiveLayers((prev) => ({ ...prev, 'river-flow': true }));
    setSelectedDam(null);
    setSelectedGauge(null);
    setCrossSectionProfile(null);
    setSelectedRiver(river);

    if (mapInstanceRef.current && river.coordinates.length >= 2) {
      const bounds = L.latLngBounds(river.coordinates);
      mapInstanceRef.current.flyToBounds(bounds, {
        padding: [64, 64],
        maxZoom: river.waterwayType === 'canal' ? 11 : 9,
        duration: 1.1
      });
    }
  };

  const handleSelectDamEntity = (dam: DamTelemetryStation) => {
    setActiveLayers((prev) => ({ ...prev, 'dams-gauges': true }));
    setSelectedRiver(null);
    setSelectedGauge(null);
    setCrossSectionProfile(null);
    setSelectedDam(dam);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([dam.lat, dam.lng], Math.max(9, telemetry.zoom), {
        duration: 1.1
      });
    }
  };

  const handleSelectGaugeEntity = (gauge: RiverGaugeStation) => {
    setActiveLayers((prev) => ({ ...prev, 'dams-gauges': true }));
    setSelectedRiver(null);
    setSelectedDam(null);
    setCrossSectionProfile(null);
    setSelectedGauge(gauge);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([gauge.lat, gauge.lng], Math.max(10, telemetry.zoom), {
        duration: 1.1
      });
    }
  };

  // L1 Base River Polylines Layer (underneath 60 FPS RiverFlowCanvas)
  useEffect(() => {
    const group = riverBaseLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!activeLayers['river-flow']) return;

    const gaugeMap = new Map<string, RiverGaugeStation>();
    gauges.forEach((g) => gaugeMap.set(g.id, g));
    const currentZoom = telemetry.zoom;
    const hasRiverFocus = Boolean(selectedRiver && connectedNetwork);

    THAILAND_RIVER_SEGMENTS.forEach((seg) => {
      const isSelected = selectedRiver?.id === seg.id;
      const isConnected = connectedNetwork ? connectedNetwork.allConnectedIds.has(seg.id) : false;

      // Zoom-dependent progressive disclosure (canals >= zoom 8, minor streams >= zoom 7 unless selected/connected)
      if (!isSelected && !isConnected) {
        if (seg.waterwayType === 'canal' && currentZoom < 8) return;
        if (seg.streamOrder <= 3 && currentZoom < 7) return;
      }

      const linked = gaugeMap.get(seg.linkedGaugeId);
      const alertLevel = linked?.alertLevel ?? 'normal';
      const baseColor =
        alertLevel === 'critical'
          ? '#ef4444'
          : alertLevel === 'warning'
          ? '#f59e0b'
          : seg.waterwayType === 'canal'
          ? '#06b6d4'
          : '#0284c7';

      const baseWeight =
        seg.waterwayType === 'canal'
          ? 2.4
          : Math.max(2.5, seg.streamOrder * 0.95);

      const lineOpacity = hasRiverFocus
        ? isSelected
          ? 0.98
          : isConnected
          ? 0.85
          : 0.2
        : 0.65;

      // Glowing outer casing for selected or connected rivers
      if (isSelected || isConnected) {
        L.polyline(seg.coordinates, {
          color: isSelected ? '#38bdf8' : baseColor,
          weight: isSelected ? baseWeight + 6 : baseWeight + 3,
          opacity: isSelected ? 0.38 : 0.22,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false
        }).addTo(group);
      }

      const poly = L.polyline(seg.coordinates, {
        color: isSelected ? '#38bdf8' : baseColor,
        weight: isSelected ? baseWeight + 1.6 : isConnected ? baseWeight + 0.6 : baseWeight,
        opacity: lineOpacity,
        dashArray: seg.waterwayType === 'canal' && !isSelected ? '6, 4' : undefined,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(group);

      poly.on('click', (evt: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(evt);
        handleSelectRiverEntity(seg);
      });
    });
  }, [activeLayers['river-flow'], gauges, selectedRiver, connectedNetwork, telemetry.zoom]);

  // L2 Dams & River Gauges Tactical Markers Layer
  useEffect(() => {
    const group = hydroStationsLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!activeLayers['dams-gauges']) return;

    const currentZoom = telemetry.zoom;

    // Render 15 Major Dams (filtered by hydroStatusFilter)
    dams
      .filter((dam) => hydroStatusFilter === 'all' || (dam.alertLevel ?? 'normal') === hydroStatusFilter)
      .forEach((dam) => {
        const pct = dam.currentStoragePct ?? dam.baselineStoragePct;
        const badgeColor =
          dam.alertLevel === 'critical'
            ? '#ef4444'
            : dam.alertLevel === 'warning'
            ? '#f59e0b'
            : dam.alertLevel === 'watch'
            ? '#38bdf8'
            : dam.alertLevel === 'drought'
            ? '#a8a29e'
            : '#10b981';

        const showCompactDot =
          currentZoom <= 6 && dam.alertLevel !== 'critical' && dam.alertLevel !== 'warning';

        const damIcon = L.divIcon({
          className: 'custom-dam-badge',
          html: showCompactDot
            ? `<div title="${dam.nameTh} (${pct.toFixed(0)}%)" style="transform: translate(-50%, -50%); width: 12px; height: 12px; border-radius: 9999px; background: ${badgeColor}; border: 2px solid #0f172a; box-shadow: 0 2px 6px rgba(0,0,0,0.45); cursor: pointer;"></div>`
            : `
          <div style="transform: translate(-50%, -50%); display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 9999px; background: #0f172a; color: #ffffff; border: 1.5px solid ${badgeColor}; font-family: 'Geist Mono', 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.45); cursor: pointer;">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${badgeColor};"></span>
            <span>${dam.nameTh.replace('เขื่อน', '')} ${pct.toFixed(0)}%</span>
          </div>
        `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        const marker = L.marker([dam.lat, dam.lng], { icon: damIcon }).addTo(group);
        marker.on('click', (evt) => {
          L.DomEvent.stopPropagation(evt);
          setSelectedRiver(null);
          setSelectedGauge(null);
          setCrossSectionProfile(null);
          setSelectedDam(dam);
        });
      });

    // Render 10 Index River Gauges (filtered by hydroStatusFilter)
    gauges
      .filter(
        (gauge) => hydroStatusFilter === 'all' || (gauge.alertLevel ?? 'normal') === hydroStatusFilter
      )
      .forEach((gauge) => {
        const q = gauge.currentDischargeCms ?? 0;
        const bankPct = gauge.bankCapacityPct;
        const badgeColor =
          gauge.alertLevel === 'critical'
            ? '#ef4444'
            : gauge.alertLevel === 'warning'
            ? '#f59e0b'
            : gauge.alertLevel === 'watch'
            ? '#38bdf8'
            : gauge.alertLevel === 'drought'
            ? '#a8a29e'
            : '#10b981';

        const showCompactDot =
          currentZoom <= 6 && gauge.alertLevel !== 'critical' && gauge.alertLevel !== 'warning';

        const gaugeIcon = L.divIcon({
          className: 'custom-gauge-badge',
          html: showCompactDot
            ? `<div title="${gauge.code} (${Math.round(q)} m³/s)" style="transform: translate(-50%, -50%); width: 11px; height: 11px; border-radius: 9999px; background: #050505; border: 2.5px solid ${badgeColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.45); cursor: pointer;"></div>`
            : `
          <div style="transform: translate(-50%, -50%); display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 9999px; background: #050505; color: ${badgeColor}; border: 1.5px solid ${badgeColor}; font-family: 'Geist Mono', 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.45); cursor: pointer;">
            <span>${gauge.code}</span>
            <span style="color:#ffffff;">${Math.round(q)} m³/s</span>
            ${typeof bankPct === 'number' ? `<span style="opacity:0.85;">(${bankPct.toFixed(0)}%)</span>` : ''}
          </div>
        `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        const marker = L.marker([gauge.lat, gauge.lng], { icon: gaugeIcon }).addTo(group);
        marker.on('click', (evt) => {
          L.DomEvent.stopPropagation(evt);
          setSelectedRiver(null);
          setSelectedDam(null);
          setCrossSectionProfile(null);
          setSelectedGauge(gauge);
        });
      });
  }, [activeLayers['dams-gauges'], dams, gauges, hydroStatusFilter, telemetry.zoom]);

  // Dynamic fetch of RainViewer host and radar frames when rain radar layer is enabled
  useEffect(() => {
    if (!activeLayers['rain-radar']) return;
    let isMounted = true;
    fetchRainViewerTimeline().then((data) => {
      if (isMounted && data) {
        if (data.host) {
          setRadarHost(data.host);
        }
        const frames = [...(data.past || []), ...(data.nowcast || [])];
        if (frames.length > 0) {
          setRadarFrames(frames);
          setActiveRadarIndex(Math.max(0, (data.past || []).length - 1));
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeLayers['rain-radar']]);

  // L3 RainViewer Doppler Radar Tile Layer + Animation Timer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (rainRadarTileRef.current) {
      map.removeLayer(rainRadarTileRef.current);
      rainRadarTileRef.current = null;
    }

    if (!activeLayers['rain-radar'] || radarFrames.length === 0) return;

    const frame = radarFrames[activeRadarIndex] || radarFrames[radarFrames.length - 1];
    if (!frame) return;

    // Crucial: tileSize: 256, zoomOffset: 0, maxNativeZoom: 7, maxZoom: 19 prevents HTTP 400/404 when zooming deep
    const radarUrl = `${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
    const layer = L.tileLayer(radarUrl, {
      tileSize: 256,
      zoomOffset: 0,
      maxNativeZoom: 7,
      maxZoom: 19,
      opacity: 0.72,
      attribution: 'RainViewer Doppler Radar'
    }).addTo(map);

    rainRadarTileRef.current = layer;
  }, [activeLayers['rain-radar'], radarHost, radarFrames, activeRadarIndex]);

  useEffect(() => {
    if (!activeLayers['rain-radar'] || !isRadarPlaying || radarFrames.length <= 1) return;
    const timer = setInterval(() => {
      setActiveRadarIndex((prev) => (prev + 1) % radarFrames.length);
    }, 900);
    return () => clearInterval(timer);
  }, [activeLayers['rain-radar'], isRadarPlaying, radarFrames.length]);

  // L4 Wind Field, Surface Pressure & 24h Rainfall Layer
  useEffect(() => {
    const group = windStormLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!activeLayers['wind-storm']) return;

    hydrometNodes.forEach((node) => {
      const downwindDeg = (node.windDirection10mDeg + 180) % 360;
      const windIcon = L.divIcon({
        className: 'custom-wind-vector',
        html: `
          <div style="transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; pointer-events: auto;">
            <div style="transform: rotate(${downwindDeg}deg); color: #38bdf8; font-size: 16px; font-weight: 900; line-height: 1; text-shadow: 0 1px 4px rgba(0,0,0,0.8);">
              ↑
            </div>
            <div style="background: rgba(15,23,42,0.92); color: #e2e8f0; border: 1px solid #38bdf8; border-radius: 9999px; padding: 2px 7px; font-family: 'Geist Mono', monospace; font-size: 9px; font-weight: 700; white-space: nowrap;">
              ${node.windSpeed10mKmh} km/h • ฝน ${node.rain24hMm} mm • PM2.5 ${node.pm25}
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      L.circle([node.lat, node.lng], {
        radius: Math.max(18000, node.rain24hMm * 1600),
        color: '#0ea5e9',
        fillColor: '#38bdf8',
        fillOpacity: 0.14,
        weight: 1
      }).addTo(group);

      L.marker([node.lat, node.lng], { icon: windIcon })
        .bindPopup(
          `<div style="font-size:12px;font-family:'JetBrains Mono',monospace;padding:4px;">
            <strong style="color:#0284c7;">${node.nameTh}</strong><br/>
            ความเร็วลม 10m: ${node.windSpeed10mKmh} km/h (ทิศ ${node.windDirection10mDeg}°)<br/>
            ลมกระโชก: ${node.windGusts10mKmh} km/h<br/>
            ความกดอากาศ: ${node.surfacePressureHpa} hPa<br/>
            ฝนสะสม 24 ชม.: ${node.rain24hMm} mm (7 วัน: ${node.rain7dMm} mm)<br/>
            คุณภาพอากาศ: PM2.5 ${node.pm25} µg/m³ | PM10 ${node.pm10} µg/m³ (US AQI ${node.usAqi})
          </div>`
        )
        .addTo(group);
    });
  }, [activeLayers['wind-storm'], hydrometNodes]);

  // L5 NASA GIBS Wildfire WMS + Downwind Smoke Dispersion Cones
  useEffect(() => {
    const map = mapInstanceRef.current;
    const coneGroup = wildfireConeLayerRef.current;
    if (!map || !coneGroup) return;

    coneGroup.clearLayers();
    if (wildfireWmsRef.current) {
      map.removeLayer(wildfireWmsRef.current);
      wildfireWmsRef.current = null;
    }

    if (!activeLayers['wildfire-smoke']) return;

    // Crucial: Use NASA GIBS WMS (image/png) instead of WMTS .mvt vector tiles
    const wmsLayer = L.tileLayer.wms(
      'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi',
      {
        layers: 'VIIRS_SNPP_Thermal_Anomalies_375m_All',
        format: 'image/png',
        transparent: true,
        version: '1.3.0',
        opacity: 0.9,
        attribution: 'NASA GIBS VIIRS 375m Fires',
        time: gibsDate
      } as any
    ).addTo(map);
    wildfireWmsRef.current = wmsLayer;

    WILDFIRE_SURVEILLANCE_CLUSTERS.forEach((cluster) => {
      const nearestMet = findNearestHydrometNode(cluster.lat, cluster.lng, hydrometNodes);
      const refWindDir = nearestMet?.windDirection10mDeg ?? 225;
      const refWindSpd = nearestMet?.windSpeed10mKmh ?? 22;
      const refPm25 = nearestMet?.pm25 ?? 48.5;
      const refAqi = nearestMet?.usAqi ?? 132;

      const coneCoords = computeDownwindHazardCone(
        cluster.lat,
        cluster.lng,
        refWindDir,
        refWindSpd
      );

      L.polygon(coneCoords, {
        color: '#f97316',
        fillColor: '#ef4444',
        fillOpacity: 0.22,
        weight: 1.5,
        dashArray: '4, 4'
      })
        .bindPopup(
          `<div style="font-size:12px;font-family:'JetBrains Mono',monospace;padding:4px;">
            <strong style="color:#ef4444;">พื้นที่เฝ้าระวังไฟป่า & กรวยควันใต้ลม</strong><br/>
            ${cluster.nameTh} (จ.${cluster.province})<br/>
            พลังงานความร้อน (FRP): ${cluster.frpMw} MW<br/>
            ทิศทางลมพาควัน: ${(refWindDir + 180) % 360}° (${refWindSpd} km/h)<br/>
            ฝุ่นควันใกล้เคียง: PM2.5 ${refPm25} µg/m³ (US AQI ${refAqi})
          </div>`
        )
        .addTo(coneGroup);

      L.circleMarker([cluster.lat, cluster.lng], {
        radius: 7,
        color: '#fef2f2',
        fillColor: '#dc2626',
        fillOpacity: 0.95,
        weight: 2
      }).addTo(coneGroup);
    });
  }, [activeLayers['wildfire-smoke'], gibsDate, hydrometNodes]);

  // L6 NASA GIBS True Color Satellite Cloud Layer (WMTS Level 9 with {z}/{y}/{x}.jpg)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (satelliteCloudTileRef.current) {
      map.removeLayer(satelliteCloudTileRef.current);
      satelliteCloudTileRef.current = null;
    }

    if (!activeLayers['satellite-cloud']) return;

    const gibsTileUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
    const cloudLayer = L.tileLayer(gibsTileUrl, {
      maxNativeZoom: 9,
      maxZoom: 19,
      opacity: 0.62,
      attribution: 'NASA EOSDIS GIBS TrueColor'
    }).addTo(map);

    satelliteCloudTileRef.current = cloudLayer;
  }, [activeLayers['satellite-cloud'], gibsDate]);

  // L7 USGS Real-Time Earthquakes GeoJSON Layer
  useEffect(() => {
    const group = seismicLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!activeLayers['seismic-dem']) return;

    earthquakes.forEach((eq) => {
      const radiusPx = Math.max(6, Math.min(22, (eq.magnitude - 2.0) * 4.5));
      const color = eq.magnitude >= 5.0 ? '#ef4444' : eq.magnitude >= 4.0 ? '#f59e0b' : '#eab308';

      L.circleMarker([eq.lat, eq.lng], {
        radius: radiusPx,
        color,
        fillColor: color,
        fillOpacity: 0.35,
        weight: 2
      })
        .bindPopup(
          `<div style="font-size:12px;font-family:'JetBrains Mono',monospace;padding:4px;">
            <strong style="color:${color};">แผ่นดินไหว M ${eq.magnitude.toFixed(1)}</strong><br/>
            บริเวณ: ${eq.place}<br/>
            ความลึกศูนย์เกิดแผ่นดินไหว: ${eq.depthKm.toFixed(1)} km<br/>
            พิกัด: ${eq.lat.toFixed(4)}°, ${eq.lng.toFixed(4)}°
          </div>`
        )
        .addTo(group);
    });
  }, [activeLayers['seismic-dem'], earthquakes]);

  // Basin Flow Tour Camera Choreography (flyTo)
  const executeTourStep = (tourId: string, stepIdx: number) => {
    const tour = BASIN_FLOW_TOURS[tourId] || BASIN_FLOW_TOURS.chaophraya;
    const step = tour.steps[stepIdx];
    if (!step || !mapInstanceRef.current) return;

    // Ensure L1 and L2 layers are visible during the tour
    setActiveLayers((prev) => ({
      ...prev,
      'river-flow': true,
      'dams-gauges': true
    }));

    mapInstanceRef.current.flyTo([step.lat, step.lng], step.zoom, {
      duration: 2.0
    });

    // Automatically select matching river gauge or dam in HydroTelemetryDrawer
    const matchedGauge = gauges.find((g) => g.code === step.stationCode);
    if (matchedGauge) {
      setSelectedDam(null);
      setCrossSectionProfile(null);
      setSelectedGauge(matchedGauge);
      return;
    }

    const mappedDamId = TOUR_STATION_CODE_TO_DAM_ID[step.stationCode];
    const matchedDam = mappedDamId ? dams.find((d) => d.id === mappedDamId) : undefined;
    if (matchedDam) {
      setSelectedGauge(null);
      setCrossSectionProfile(null);
      setSelectedDam(matchedDam);
      return;
    }

    // Clear stale drawer if step is an estuary/confluence without a gauge or dam
    setSelectedGauge(null);
    setSelectedDam(null);
    setCrossSectionProfile(null);
  };

  useEffect(() => {
    if (!isTourPlaying || activeTourStepIndex === null) return;
    const tour = BASIN_FLOW_TOURS[selectedTourId] || BASIN_FLOW_TOURS.chaophraya;

    const timer = setTimeout(() => {
      const nextIdx = activeTourStepIndex + 1;
      if (nextIdx < tour.steps.length) {
        setActiveTourStepIndex(nextIdx);
        executeTourStep(selectedTourId, nextIdx);
      } else {
        setIsTourPlaying(false);
        showToast('จบรอบการบินสำรวจเส้นทางลุ่มน้ำแล้ว');
      }
    }, 5500);

    return () => clearTimeout(timer);
  }, [isTourPlaying, activeTourStepIndex, selectedTourId, gauges, dams]);

  const handleStartOrToggleTour = () => {
    if (activeTourStepIndex === null) {
      setActiveTourStepIndex(0);
      setIsTourPlaying(true);
      executeTourStep(selectedTourId, 0);
      trackEvent('hydro_tour_start', { tourId: selectedTourId });
    } else {
      setIsTourPlaying((prev) => !prev);
    }
  };

  const handleNextTourStep = () => {
    const tour = BASIN_FLOW_TOURS[selectedTourId] || BASIN_FLOW_TOURS.chaophraya;
    const nextIdx = activeTourStepIndex === null ? 0 : (activeTourStepIndex + 1) % tour.steps.length;
    setActiveTourStepIndex(nextIdx);
    executeTourStep(selectedTourId, nextIdx);
  };

  const handleStopTour = () => {
    setIsTourPlaying(false);
    setActiveTourStepIndex(null);
  };

  // Handle External Point Plot (from Coordinate Converter)
  useEffect(() => {
    if (!externalPoint || !mapInstanceRef.current || !markerGroupRef.current) return;

    const { lat, lng, label } = externalPoint;
    mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.5 });

    dropStationMarker(lat, lng, label);
  }, [externalPoint]);

  // Render Measurement Polylines, Polygons & DEM Cross-Section Lines
  useEffect(() => {
    let cancelled = false;
    const measureGroup = measureLayerRef.current;
    if (measureGroup) {
      measureGroup.clearLayers();
    }

    if (measurePoints.length === 0) {
      setMeasurementResultText(null);
      if (measureMode === 'cross-section') {
        setCrossSectionProfile(null);
        setIsLoadingCrossSection(false);
      }
      return () => {
        cancelled = true;
      };
    }

    const latlngs = measurePoints.map((p) => [p.lat, p.lng] as [number, number]);

    if (measureGroup) {
      latlngs.forEach((pt) => {
        L.circleMarker(pt, {
          radius: 5,
          color: '#ffffff',
          fillColor: measureMode === 'cross-section' ? '#f59e0b' : '#0284c7',
          fillOpacity: 1,
          weight: 2.5
        }).addTo(measureGroup);
      });
    }

    const isMeasuringMode = measureMode === 'distance' || measureMode === 'area' || measureMode === 'measure';
    const isAreaMode = measureMode === 'area' || (measureMode === 'measure' && measureSubMode === 'area');

    if (isMeasuringMode) {
      if (latlngs.length === 1) {
        setMeasurementResultText('คลิกจุดที่ 2 เพื่อวัดระยะทาง');
      } else if (latlngs.length === 2) {
        if (measureGroup) {
          L.polyline(latlngs, {
            color: '#0284c7',
            weight: 3.5,
            dashArray: '6, 6'
          }).addTo(measureGroup);
        }

        const distMeters = L.latLng(latlngs[0]).distanceTo(L.latLng(latlngs[1]));
        const text =
          distMeters > 1000
            ? `ระยะทาง: ${(distMeters / 1000).toFixed(3)} กม. (${distMeters.toFixed(1)} ม.)`
            : `ระยะทาง: ${distMeters.toFixed(2)} ม.`;
        setMeasurementResultText(text);
      } else if (latlngs.length >= 3) {
        if (!isAreaMode) {
          if (measureGroup) {
            L.polyline(latlngs, {
              color: '#0284c7',
              weight: 3.5,
              dashArray: '6, 6'
            }).addTo(measureGroup);
          }

          let totalMeters = 0;
          for (let i = 0; i < latlngs.length - 1; i++) {
            totalMeters += L.latLng(latlngs[i]).distanceTo(L.latLng(latlngs[i + 1]));
          }

          const text =
            totalMeters > 1000
              ? `ระยะทางรวม (${latlngs.length} จุด): ${(totalMeters / 1000).toFixed(3)} กม. (${totalMeters.toFixed(1)} ม.)`
              : `ระยะทางรวม (${latlngs.length} จุด): ${totalMeters.toFixed(2)} ม.`;
          setMeasurementResultText(text);
        } else {
          if (measureGroup) {
            L.polygon(latlngs, {
              color: '#0284c7',
              fillColor: '#38bdf8',
              fillOpacity: 0.3,
              weight: 2.5
            }).addTo(measureGroup);
          }

          const utmCoords = measurePoints.map((p) => {
            const u = forwardWgs84ToUtm(p.lat, p.lng);
            return [u.easting, u.northing];
          });

          let areaSqM = 0;
          const n = utmCoords.length;
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            areaSqM += utmCoords[i][0] * utmCoords[j][1];
            areaSqM -= utmCoords[j][0] * utmCoords[i][1];
          }
          areaSqM = Math.abs(areaSqM) / 2.0;

          const thai = sqMetersToThaiLand(areaSqM);
          const text = `พื้นที่ (${latlngs.length} จุด): ${areaSqM.toLocaleString('en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          })} ตร.ม. | ${formatThaiLandString(thai.rai, thai.ngan, thai.wah)}`;
          setMeasurementResultText(text);
        }
      }
    } else if (measureMode === 'cross-section') {
      if (latlngs.length < 2) {
        setCrossSectionProfile(null);
        setIsLoadingCrossSection(false);
      } else if (latlngs.length === 2) {
        if (measureGroup) {
          L.polyline(latlngs, {
            color: '#f59e0b',
            weight: 4,
            dashArray: '8, 4'
          }).addTo(measureGroup);
        }

        const startPt = measurePoints[0];
        const endPt = measurePoints[1];
        setSelectedGauge(null);
        setSelectedDam(null);
        setIsLoadingCrossSection(true);

        fetchDemCrossSection(startPt, endPt, 30)
          .then((profile) => {
            if (cancelled) return;
            setCrossSectionProfile(profile);
            setMeasurementResultText(
              `ตัดขวางลำน้ำ DEM: กว้าง ${profile.totalDistanceMeters.toFixed(0)} m | ท้องน้ำ +${profile.minElevationMsl.toFixed(1)} ม.รทก.`
            );
          })
          .finally(() => {
            if (!cancelled) {
              setIsLoadingCrossSection(false);
            }
          });
      }
    }

    return () => {
      cancelled = true;
    };
  }, [measurePoints, measureMode, measureSubMode]);

  // Render Traverse Vector Network Overlay
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const layer = traverseOverlayLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!plottedTraverseOverlay || plottedTraverseOverlay.polyline.length === 0) return;

    // 1. Draw Polyline
    const poly = L.polyline(plottedTraverseOverlay.polyline, {
      color: '#10b981',
      weight: 3.5,
      dashArray: plottedTraverseOverlay.isClosed ? undefined : '6, 6'
    }).addTo(layer);

    // 2. Draw Station Pins with custom badges and popups
    plottedTraverseOverlay.stations.forEach((st) => {
      const stationIcon = L.divIcon({
        className: 'custom-traverse-pin',
        html: `
          <div style="position: relative; width: 24px; height: 24px; transform: translate(-12px, -12px); display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 0 8px rgba(16,185,129,0.7);"></div>
            <div style="position: absolute; width: 4px; height: 4px; border-radius: 50%; background: #ffffff;"></div>
            <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 11px; font-weight: 700; background: #0f172a; color: #10b981; padding: 1px 6px; border-radius: 4px; border: 1px solid #10b981; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-family: 'JetBrains Mono', monospace;">
              ${st.station}
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const popupContent = `
        <div style="font-size: 12px; font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; min-width: 200px; padding: 4px 6px;">
          <div style="font-weight: 700; color: #10b981; font-size: 13px; margin-bottom: 4px;">
            หมุดวงรอบ: ${st.station}
          </div>
          <div style="color: #0f172a; margin-bottom: 2px;">
            WGS84: ${st.lat.toFixed(6)}, ${st.lng.toFixed(6)}
          </div>
          <div style="color: #475569;">
            UTM: E ${st.easting.toFixed(3)}, N ${st.northing.toFixed(3)}
          </div>
        </div>
      `;

      L.marker([st.lat, st.lng], { icon: stationIcon })
        .bindPopup(popupContent, {
          autoPanPaddingTopLeft: [16, 120],
          autoPanPaddingBottomRight: [16, 84]
        })
        .addTo(layer);
    });

    // 3. Automatically call fitBounds
    const bounds = poly.getBounds();
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
    showToast(`แสดงโครงข่ายวงรอบ: ${plottedTraverseOverlay.stations.length} สถานี`);
  }, [plottedTraverseOverlay]);

  // Geolocation & Real-time Live Tracking
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showToast('เบราว์เซอร์ไม่รองรับการระบุพิกัด Geolocation');
      return;
    }

    // If currently active, toggle OFF
    if (isLocating) {
      if (watchPositionIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
        watchPositionIdRef.current = null;
      }
      if (orientationHandlerRef.current) {
        window.removeEventListener('deviceorientation', orientationHandlerRef.current, true);
        orientationHandlerRef.current = null;
      }
      if (gpsLocationLayerRef.current) {
        gpsLocationLayerRef.current.clearLayers();
      }
      liveMarkerRef.current = null;
      liveCircleRef.current = null;
      setLiveLocation(null);
      setIsLocating(false);
      showToast('ปิดการติดตามตำแหน่ง GPS แล้ว');
      return;
    }

    // Toggle ON
    setIsLocating(true);
    isFirstFixRef.current = true;
    showToast('เริ่มระบุพิกัดและติดตามตำแหน่ง GPS สดแบบเรียลไทม์...');

    // Device orientation for heading cone
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let h: number | null = null;
      if ((e as any).webkitCompassHeading !== undefined && (e as any).webkitCompassHeading !== null) {
        h = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null && e.alpha !== undefined) {
        h = (360 - e.alpha) % 360;
      }
      if (h !== null && !isNaN(h)) {
        headingRef.current = h;
        const coneEl = document.querySelector('.memaps-live-heading-cone') as HTMLElement;
        if (coneEl) {
          coneEl.style.transform = `rotate(${Math.round(h)}deg)`;
          coneEl.style.display = 'block';
        }
        setLiveLocation((prev) => (prev ? { ...prev, heading: h } : null));
      }
    };
    orientationHandlerRef.current = handleOrientation;
    window.addEventListener('deviceorientation', handleOrientation, true);

    const updatePosition = (latitude: number, longitude: number, accuracy: number, heading?: number | null) => {
      setLiveLocation({ lat: latitude, lng: longitude, heading: heading ?? headingRef.current });

      if (isFirstFixRef.current) {
        isFirstFixRef.current = false;
        if (isGlobe3D) {
          setGlobeFlyTo({ lat: latitude, lng: longitude, zoom: 17 });
        } else if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 1.0 });
        }
      }

      if (mapInstanceRef.current && gpsLocationLayerRef.current) {
        // Update or create accuracy circle
        if (liveCircleRef.current) {
          liveCircleRef.current.setLatLng([latitude, longitude]);
          liveCircleRef.current.setRadius(accuracy || 15);
        } else {
          liveCircleRef.current = L.circle([latitude, longitude], {
            radius: accuracy || 15,
            color: '#38bdf8',
            fillColor: '#38bdf8',
            fillOpacity: 0.12,
            weight: 1
          }).addTo(gpsLocationLayerRef.current);
        }

        const currentHeading = heading ?? headingRef.current;
        const headingStyle =
          currentHeading !== null && currentHeading !== undefined
            ? `transform: rotate(${Math.round(currentHeading)}deg); display: block;`
            : 'display: none;';

        const liveIcon = L.divIcon({
          className: 'custom-gps-live-dot',
          html: `
            <div style="position: relative; width: 56px; height: 56px; transform: translate(-28px, -28px); display: flex; align-items: center; justify-content: center; pointer-events: none;">
              <!-- Heading Beam / Cone pointing in device direction -->
              <div class="memaps-live-heading-cone" style="position: absolute; width: 56px; height: 56px; transform-origin: 28px 28px; transition: transform 0.15s ease-out; ${headingStyle}">
                <svg viewBox="0 0 56 56" width="56" height="56" style="overflow: visible;">
                  <defs>
                    <radialGradient id="liveHeadingBeam" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.45"/>
                      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
                    </radialGradient>
                  </defs>
                  <path d="M 28 28 L 8 2 A 36 36 0 0 1 48 2 Z" fill="url(#liveHeadingBeam)" />
                </svg>
              </div>
              <!-- Subtle pulsing halo -->
              <div class="memaps-pulse-halo" style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(56, 189, 248, 0.45);"></div>
              <!-- Inner core dot -->
              <div style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 0 8px rgba(2,132,199,0.85);"></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        const utm = forwardWgs84ToUtm(latitude, longitude);
        const coordStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        const utmStr = `UTM ${utm.zone}N: E ${utm.easting.toFixed(2)} m | N ${utm.northing.toFixed(2)} m`;
        const gpsPopupContent = `
          <div style="font-size: 12px; padding: 4px 6px; min-width: 230px;">
            <strong style="color: #0284c7; font-size: 14px;">🛰️ ตำแหน่งรังวัดดาวเทียม GNSS (Live)</strong>
            <div style="font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 13px; margin-top: 4px; color: #0f172a; font-weight: 700;">
              WGS84: ${coordStr}
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 12px; color: #475569; margin-top: 2px;">
              ${utmStr}
            </div>
            <div style="font-size: 12px; color: #10b981; font-weight: 600; margin-top: 4px;">
              ความถูกต้องเชิงตำแหน่ง (Accuracy): ±${accuracy.toFixed(1)} ม.
            </div>
            <button 
              id="btn-copy-gps"
              style="
                width: 100%;
                min-height: 44px;
                padding: 10px 14px;
                background: #0284c7;
                color: #ffffff;
                border: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                margin-top: 8px;
                transition: background 0.15s ease;
              "
              onmouseover="this.style.background='#0369a1'"
              onmouseout="this.style.background='#0284c7'"
              onclick="
                navigator.clipboard.writeText('${coordStr}\\nUTM ${utm.zone}N E: ${utm.easting.toFixed(2)} m N: ${utm.northing.toFixed(2)} m');
                this.innerText = 'คัดลอกพิกัด GPS แล้ว';
                setTimeout(() => { this.innerText = 'คัดลอกพิกัด WGS84 & UTM'; }, 1800);
              "
            >
              คัดลอกพิกัด WGS84 & UTM
            </button>
          </div>
        `;

        if (liveMarkerRef.current) {
          liveMarkerRef.current.setLatLng([latitude, longitude]);
          liveMarkerRef.current.setIcon(liveIcon);
          liveMarkerRef.current.setPopupContent(gpsPopupContent);
        } else {
          liveMarkerRef.current = L.marker([latitude, longitude], { icon: liveIcon })
            .bindPopup(gpsPopupContent, {
              autoPanPaddingTopLeft: [16, 120],
              autoPanPaddingBottomRight: [16, 84]
            })
            .addTo(gpsLocationLayerRef.current);
        }
      }
    };

    watchPositionIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading } = pos.coords;
        if (heading !== null && heading !== undefined && !isNaN(heading)) {
          headingRef.current = heading;
        }
        updatePosition(latitude, longitude, accuracy, heading);
      },
      (err) => {
        let msg = '';
        switch (err.code) {
          case 1:
            msg = 'ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง (Permission Denied): กรุณาอนุญาตสิทธิ์ Location ในเบราว์เซอร์';
            break;
          case 2:
            msg = 'ไม่พบสัญญาณดาวเทียม (Signal Loss): เครื่องรับสัญญาณ GNSS/GPS ไม่สามารถคำนวณตำแหน่งได้';
            break;
          case 3:
            msg = 'หมดเวลารับสัญญาณพิกัด (Timeout): กรุณาลองใหม่อีกครั้ง';
            break;
          default:
            msg = `ระบุพิกัด GPS ไม่สำเร็จ: ${err.message}`;
        }
        showToast(msg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );
  };

  const handleSelectBookmark = (bm: (typeof SURVEY_BOOKMARKS)[0]) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([bm.lat, bm.lng], bm.zoom, { duration: 1.2 });
  };

  const handleClearMeasurements = () => {
    setMeasurePoints([]);
    setMeasurementResultText(null);
    setCrossSectionProfile(null);
    setIsLoadingCrossSection(false);
    setContextMenu(null);
    if (inspectMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(inspectMarkerRef.current);
      inspectMarkerRef.current = null;
    }
  };

  const handleUndoPoint = () => {
    setMeasurePoints((prev) => {
      if (prev.length <= 1) {
        setMeasurementResultText(null);
        setCrossSectionProfile(null);
        setIsLoadingCrossSection(false);
        return [];
      }
      if (measureModeRef.current === 'cross-section') {
        setCrossSectionProfile(null);
        setIsLoadingCrossSection(false);
      }
      return prev.slice(0, -1);
    });
    showToast('ย้อนกลับจุดรังวัดล่าสุดแล้ว (Undo)');
  };

  const handleGeoJsonLoaded = (data: any, fileName: string) => {
    if (!mapInstanceRef.current) return;

    const validation = validateGeoJsonRFC7946(data);
    if (!validation.isValid) {
      showToast(validation.error || 'ไฟล์ไม่ตรงตามมาตรฐาน RFC 7946 GeoJSON');
      return;
    }

    if (vectorLayerRef.current) {
      mapInstanceRef.current.removeLayer(vectorLayerRef.current);
    }

    const geoLayer = L.geoJSON(data, {
      style: {
        color: '#f59e0b',
        weight: 3,
        fillColor: '#fbbf24',
        fillOpacity: 0.2
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          const props = sanitizeFeatureProperties(feature.properties, 8);
          layer.bindPopup(`<div style="font-size: 12px; line-height: 1.4;">${props}</div>`, {
            autoPanPaddingTopLeft: [16, 120],
            autoPanPaddingBottomRight: [16, 84]
          });
        }
      }
    }).addTo(mapInstanceRef.current);

    vectorLayerRef.current = geoLayer;
    const bounds = geoLayer.getBounds();
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds);
    }
    showToast(`โหลดไฟล์ ${fileName} สำเร็จ (${validation.featureCount} ฟีเจอร์)`);
  };

  // Keyboard accelerators
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClearMeasurements();
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        if (measurePoints.length > 0) {
          handleUndoPoint();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [measurePoints]);

  const handleToggleDisasterLayer = (layerId: DisasterLayerId) => {
    setActiveLayers((prev) => {
      const nextVal = !prev[layerId];
      trackEvent('map_toggle_disaster_layer', { layerId, enabled: nextVal });
      return { ...prev, [layerId]: nextVal };
    });
  };

  const activeOverlayCount = Object.values(activeLayers).filter(Boolean).length;

  const handleClearAllOverlays = () => {
    setActiveLayers({
      'river-flow': false,
      'dams-gauges': false,
      'rain-radar': false,
      'wind-storm': false,
      'wildfire-smoke': false,
      'satellite-cloud': false,
      'seismic-dem': false
    });
    setIsRadarPlaying(false);
    setIsTourPlaying(false);
    setActiveTourStepIndex(null);
    setSelectedRiver(null);
    setSelectedGauge(null);
    setSelectedDam(null);
    setCrossSectionProfile(null);
    if (measureMode === 'cross-section') {
      setMeasureMode('none');
      setMeasurePoints([]);
    }
  };

  const handleClearCategoryLayers = (category: 'weather' | 'hydro') => {
    if (category === 'weather') {
      setActiveLayers((prev) => ({
        ...prev,
        'rain-radar': false,
        'wind-storm': false,
        'wildfire-smoke': false,
        'satellite-cloud': false,
        'seismic-dem': false
      }));
      setIsRadarPlaying(false);
      showToast('ซ่อนชั้นข้อมูลสภาพอากาศและภัยพิบัติแล้ว');
    } else {
      setActiveLayers((prev) => ({
        ...prev,
        'river-flow': false,
        'dams-gauges': false
      }));
      setIsTourPlaying(false);
      setActiveTourStepIndex(null);
      setSelectedRiver(null);
      setSelectedGauge(null);
      setSelectedDam(null);
      setCrossSectionProfile(null);
      if (measureMode === 'cross-section') {
        setMeasureMode('none');
        setMeasurePoints([]);
      }
      showToast('ซ่อนชั้นข้อมูลน้ำและเขื่อนแล้ว');
    }
  };

  const handleSelectWorkspace = (tab: MapWorkspaceTab) => {
    setActiveWorkspace(tab);
    trackEvent('map_switch_workspace', { workspace: tab });

    if (tab === 'survey') {
      // Switching back to normal map clears active weather/hydro overlays so nothing remains stuck
      handleClearAllOverlays();
    } else if (tab === 'hydro') {
      // When entering Hydrology workspace for the first time with no hydro layer active, enable river flow
      setActiveLayers((prev) => {
        if (!prev['river-flow'] && !prev['dams-gauges']) {
          return { ...prev, 'river-flow': true };
        }
        return prev;
      });
    }
  };

  const disasterPanelNode = (
    <DisasterCommandPanel
      activeWorkspace={activeWorkspace}
      activeLayers={activeLayers}
      onToggleLayer={handleToggleDisasterLayer}
      onClearCategoryLayers={handleClearCategoryLayers}
      measureMode={measureMode}
      onSetMeasureMode={(m) => {
        setMeasureMode(m);
        setMeasurePoints([]);
        setContextMenu(null);
      }}
      radarFrames={radarFrames}
      activeRadarIndex={activeRadarIndex}
      isRadarPlaying={isRadarPlaying}
      onSetRadarIndex={setActiveRadarIndex}
      onToggleRadarPlay={() => setIsRadarPlaying((p) => !p)}
      gibsDate={gibsDate}
      onChangeGibsDate={setGibsDate}
      selectedTourId={selectedTourId}
      onSelectTourId={(id) => {
        setSelectedTourId(id);
        setActiveTourStepIndex(null);
        setIsTourPlaying(false);
      }}
      activeTourStepIndex={activeTourStepIndex}
      isTourPlaying={isTourPlaying}
      onStartOrToggleTour={handleStartOrToggleTour}
      onNextTourStep={handleNextTourStep}
      onStopTour={handleStopTour}
      rivers={THAILAND_RIVER_SEGMENTS}
      dams={dams}
      gauges={gauges}
      statusFilter={hydroStatusFilter}
      onChangeStatusFilter={setHydroStatusFilter}
      onSelectRiver={handleSelectRiverEntity}
      onSelectDam={handleSelectDamEntity}
      onSelectGauge={handleSelectGaugeEntity}
      isRefreshing={isRefreshingHydro}
      isLiveApi={isLiveApi}
      onRefreshAll={() => loadAllDisasterTelemetry(true)}
    />
  );

  const hydroDrawerNode = (
    <HydroTelemetryDrawer
      selectedRiver={selectedRiver}
      selectedGauge={selectedGauge}
      selectedDam={selectedDam}
      crossSection={crossSectionProfile}
      isLoadingCrossSection={isLoadingCrossSection}
      allRivers={THAILAND_RIVER_SEGMENTS}
      allDams={dams}
      allGauges={gauges}
      onSelectRiver={handleSelectRiverEntity}
      onSelectDam={handleSelectDamEntity}
      onSelectGauge={handleSelectGaugeEntity}
      onClose={() => {
        setSelectedRiver(null);
        setSelectedGauge(null);
        setSelectedDam(null);
        setCrossSectionProfile(null);
      }}
      onSendToConverter={handleSendToConverter}
      onSendElevationToLeveling={handleSendElevationToLeveling}
    />
  );

  const commonLayoutProps: CommonMapLayoutProps = {
    currentBasemap,
    onSelectBasemap: setCurrentBasemap,
    activeWorkspace,
    onSelectWorkspace: handleSelectWorkspace,
    activeOverlayCount,
    onClearAllOverlays: () => {
      handleClearAllOverlays();
      showToast('ซ่อนชั้นข้อมูลสภาพอากาศและน้ำทั้งหมดแล้ว');
    },
    measureMode,
    onSetMeasureMode: (m) => {
      setMeasureMode(m);
      setMeasurePoints([]);
      setContextMenu(null);
    },
    onClearMeasurements: handleClearMeasurements,
    onUndoPoint: handleUndoPoint,
    canUndo: measurePoints.length > 0,
    onLocateMe: handleLocateMe,
    onSelectBookmark: handleSelectBookmark,
    onOpenUploader: () => setIsUploaderOpen(true),
    telemetry,
    measurePoints,
    measurementResultText,
    onSendToCalculator,
    disasterPanel: disasterPanelNode,
    hydroDrawer: hydroDrawerNode,
    activeLayout: mapLayout,
    onChangeLayout: setMapLayout,

    // MeMaps Integrated Navigation, Places & Routing
    activePlace,
    onSelectPlace: (place) => {
      setActivePlace(place);
      if (place && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([place.lat, place.lng], Math.max(mapInstanceRef.current.getZoom(), 15), {
          duration: 0.8
        });
      }
    },
    originPlace,
    destinationPlace,
    onSelectOrigin: setOriginPlace,
    onSelectDestination: setDestinationPlace,
    activeRoute,
    onRouteCalculated: setActiveRoute,
    onSendToSurveyTable: (stations) => {
      stations.forEach((st) => {
        setInspectedCoordinate({
          lat: st.lat,
          lng: st.lng,
          label: st.name,
          timestamp: Date.now()
        });
        if (st.utmE && st.utmN) {
          setTraverseStart(st.utmE.toFixed(3), st.utmN.toFixed(3));
        }
      });
      showToast(`ส่งพิกัด ${stations.length} จุดเข้าตารางรังวัดแล้ว`);
    },
    savedPlacesRefresh,
    onPlaceSaved: () => {
      setSavedPlacesRefresh((prev) => prev + 1);
      showToast('บันทึกหมุดสถานที่ลงใน MeMaps สำเร็จ');
    }
  };

  return (
    <div
      className={`relative w-full h-full min-h-0 overflow-hidden bg-slate-900 select-none map-locked-viewport ${
        mapLayout === 'split-cad' ? 'flex flex-col md:flex-row' : ''
      } ${measureMode === 'inspect' || measureMode === 'cross-section' ? 'cursor-crosshair' : ''}`}
      onAuxClick={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          if (
            (measureModeRef.current === 'measure' ||
              measureModeRef.current === 'distance' ||
              measureModeRef.current === 'area') &&
            measurePoints.length > 0
          ) {
            handleClearMeasurements();
            showToast('ยกเลิกโหมดการวัดแล้ว (Middle-Click)');
          }
        }
      }}
    >
      {/* If Split CAD is active, show the 50/50 Dual-Pane Left Workbench on Desktop */}
      {mapLayout === 'split-cad' && (
        <div className="hidden md:block md:w-[420px] lg:w-[480px] md:h-full shrink-0 z-10">
          <SplitCadMapLayout {...commonLayoutProps} />
        </div>
      )}

      {/* Map Canvas Viewport (Flex-1 on Desktop if Split CAD, else Full-Width/Height) */}
      <div className={`relative ${mapLayout === 'split-cad' ? 'w-full md:flex-1 h-full' : 'w-full h-full'} overflow-hidden`}>
        {/* 3D Adaptive Globe Viewport (MapLibre GL JS) or 2D Leaflet Engine */}
        {isGlobe3D ? (
          <MapLibreGlobeEngine
            currentBasemap={currentBasemap}
            activePlace={activePlace}
            categoryPlaces={categoryPlaces}
            onSelectPlace={(p) => {
              setActivePlace(p);
              setIsMenuOpen(true);
            }}
            onTelemetryChange={(t) => setTelemetry(t)}
            onClickMap={(lat, lng) => {
              setContextMenu(null);
              const mode = measureModeRef.current;
              if (mode === 'distance' || mode === 'area' || mode === 'measure') {
                setMeasurePoints((prev) => [...prev, { lat, lng }]);
                return;
              }
              if (mode === 'inspect') {
                inspectCoordinate(lat, lng);
              }
            }}
            onContextMenuMap={() => {
              const mode = measureModeRef.current;
              if (mode === 'distance' || mode === 'area' || mode === 'measure') {
                setMeasurePoints((prev) => {
                  if (prev.length <= 1) {
                    setMeasurementResultText(null);
                    return [];
                  }
                  return prev.slice(0, -1);
                });
                showToast('เลิกทำจุดล่าสุดแล้ว (Right-Click Undo)');
              }
            }}
            flyToLocation={globeFlyTo}
            liveLocation={liveLocation}
            measurePoints={measurePoints}
            measureMode={measureMode}
            measureSubMode={measureSubMode}
            isLocked={Boolean(lockedPoint)}
          />
        ) : (
          <>
            {/* Leaflet Map DOM Canvas */}
            <div ref={mapContainerRef} className="w-full h-full z-0 touch-none overscroll-none" />

            {/* 60 FPS Pre-Projected River Flow Particle Canvas Overlay */}
            <RiverFlowCanvas
              map={mapInstance}
              segments={THAILAND_RIVER_SEGMENTS}
              gauges={gauges}
              visible={activeLayers['river-flow']}
              selectedRiverId={selectedRiver?.id ?? null}
              connectedRiverIds={connectedNetwork?.allConnectedIds}
            />

            {/* 60 FPS Windy-Style Wind Particle Streamlet Canvas Overlay (Lazy-loaded) */}
            <React.Suspense fallback={null}>
              {activeLayers['wind-storm'] && (
                <WindParticleCanvas
                  map={mapInstance}
                  nodes={hydrometNodes}
                  visible={activeLayers['wind-storm']}
                />
              )}
            </React.Suspense>
          </>
        )}

        {/* Floating MeMaps Essential Controls: Satellite thumbnail and controls pillar always visible and accessible */}
        <div className="absolute top-4 right-4 z-[1000] pointer-events-auto">
          <MeMapsMapControls
            currentBasemap={currentBasemap}
            onBasemapChange={setCurrentBasemap}
            onResetNorth={() => {
              if (isGlobe3D) {
                setGlobeFlyTo({ lat: 13.84664, lng: 100.56982, zoom: 4.8 });
              } else if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo(
                  mapInstanceRef.current.getCenter(),
                  mapInstanceRef.current.getZoom(),
                  { duration: 0.6, easeLinearity: 0.25 }
                );
              }
              showToast('รีเซ็ตมุมมองทิศเหนือเรียบร้อย (Bearing 0°)');
            }}
            onLocateMe={handleLocateMe}
            isLocating={isLocating}
            isSavedPlacesOpen={isSavedPlacesOpen}
            onToggleSavedPlaces={() => setIsSavedPlacesOpen(prev => !prev)}
            isInspectMode={measureMode === 'inspect'}
            onToggleInspectMode={() => {
              const nextMode = measureMode === 'inspect' ? 'none' : 'inspect';
              setMeasureMode(nextMode);
              if (nextMode === 'none') {
                if (inspectMarkerRef.current && mapInstanceRef.current) {
                  mapInstanceRef.current.removeLayer(inspectMarkerRef.current);
                  inspectMarkerRef.current = null;
                }
                setLockedPoint(null);
                setActivePlace(null);
                setIsMenuOpen(false);
              }
            }}
            isMeasureMode={measureMode === 'measure' || measureMode === 'distance' || measureMode === 'area'}
            onToggleMeasure={() => {
              const isCurrentlyMeasuring =
                measureMode === 'measure' || measureMode === 'distance' || measureMode === 'area';
              if (isCurrentlyMeasuring) {
                setMeasureMode('none');
                handleClearMeasurements();
              } else {
                setMeasureMode('measure');
                showToast('เปิดโหมดการวัด (จิ้มบนแผนที่เพื่อวัดระยะ/พื้นที่)');
              }
            }}
            coordinateDatum={coordinateDatum}
            onSelectCoordinateDatum={setCoordinateDatum}
            isMenuOpen={false}
          />
        </div>

        {/* Unified Adaptive Workspace (Mobile 3-Snap Bottom Sheet + Mode Orchestration) */}
        <AdaptiveWorkspace
          {...commonLayoutProps}
          measureSubMode={measureSubMode}
          onSetMeasureSubMode={setMeasureSubMode}
          categoryPlaces={categoryPlaces}
          onCategoryPlacesChange={setCategoryPlaces}
          onSelectPlace={(p) => {
            setActivePlace(p);
            if (!p) {
              setLockedPoint(null);
              if (inspectMarkerRef.current && mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(inspectMarkerRef.current);
                inspectMarkerRef.current = null;
              }
            }
          }}
          workspaceMode={workspaceMode}
          onChangeWorkspaceMode={handleSelectWorkspaceMode}
          isSavedPlacesOpen={isSavedPlacesOpen}
          onToggleSavedPlaces={() => setIsSavedPlacesOpen(prev => !prev)}
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen(prev => !prev)}
          onCloseMenu={() => setIsMenuOpen(false)}
          coordinateDatum={coordinateDatum}
          onSelectCoordinateDatum={setCoordinateDatum}
          activeLayers={activeLayers}
          onToggleLayer={(layerId) =>
            setActiveLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }))
          }
          gauges={gauges}
          dams={dams}
          hydrometNodes={hydrometNodes}
          radarFrames={radarFrames}
          activeRadarIndex={activeRadarIndex}
          isRadarPlaying={isRadarPlaying}
          onSetRadarIndex={setActiveRadarIndex}
          onToggleRadarPlay={() => setIsRadarPlaying((p) => !p)}
          onFlyToLocation={(lat, lng, zoom = 15) => {
            setGlobeFlyTo({ lat, lng, zoom });
            mapInstanceRef.current?.flyTo([lat, lng], zoom, { duration: 0.8, easeLinearity: 0.25 });
          }}
        />

        {/* Legacy Layout Overlays (for users with explicit layout preference) */}
        {mapLayout === 'floating-pods' && <FloatingPodsMapLayout {...commonLayoutProps} />}
        {mapLayout === 'monolith-rail' && <MonolithRailMapLayout {...commonLayoutProps} />}

        {/* Classic Dock Layout (Original Left Stack) */}
        {mapLayout === 'classic-dock' && (
          <div className="absolute top-3 sm:top-4 left-3 right-3 sm:right-auto sm:left-4 sm:w-[392px] max-w-[400px] max-h-[calc(100dvh-96px)] md:max-h-[calc(100dvh-32px)] overflow-y-auto z-[1010] flex flex-col gap-2.5 pointer-events-none">
            <MapToolbar
              currentBasemap={currentBasemap}
              onSelectBasemap={setCurrentBasemap}
              activeWorkspace={activeWorkspace}
              onSelectWorkspace={handleSelectWorkspace}
              activeOverlayCount={activeOverlayCount}
              onClearAllOverlays={() => {
                handleClearAllOverlays();
                showToast('ซ่อนชั้นข้อมูลสภาพอากาศและน้ำทั้งหมดแล้ว');
              }}
              measureMode={measureMode}
              onSetMeasureMode={(m) => {
                setMeasureMode(m);
                setMeasurePoints([]);
                setContextMenu(null);
              }}
              onClearMeasurements={handleClearMeasurements}
              onUndoPoint={handleUndoPoint}
              canUndo={measurePoints.length > 0}
              onLocateMe={handleLocateMe}
              onSelectBookmark={handleSelectBookmark}
              onOpenUploader={() => setIsUploaderOpen(true)}
              telemetry={telemetry}
            />
            {disasterPanelNode}
            {hydroDrawerNode}
          </div>
        )}

      {/* Floating Cross-Section Mode Guidance Banner (Solid Surface) */}
      {measureMode === 'cross-section' && (
        <div
          className="absolute bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-2xl text-xs font-medium flex items-center space-x-2 max-w-[90vw]"
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--text-1)',
            border: '1px solid var(--border-strong)',
            borderRadius: '16px',
            boxShadow: '0 12px 28px -8px rgba(0, 0, 0, 0.45)'
          }}
        >
          {measureMode === 'cross-section' ? (
            <Scissors className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
          ) : (
            <Crosshair className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
          )}
          <span className="truncate">
            {measureMode === 'cross-section'
              ? `คลิกเลือก 2 จุดข้ามลำน้ำเพื่อตัดขวางภูมิประเทศ DEM (${measurePoints.length}/2)`
              : 'แตะจุดใดๆ บนแผนที่เพื่อดูและคัดลอกพิกัด'}
          </span>
          <button
            onClick={() => {
              setMeasureMode('none');
              setMeasurePoints([]);
            }}
            className="btn-primary ml-2 min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>เสร็จสิ้น</span>
          </button>
        </div>
      )}



      {/* Floating Dynamic Measurement Result Pill for non-measure modes */}
      {measurementResultText &&
        measureMode !== 'measure' &&
        measureMode !== 'distance' &&
        measureMode !== 'area' && (
          <div
            className="absolute top-3 sm:top-4 right-3 sm:right-4 z-[1000] px-4 py-2.5 rounded-2xl text-xs font-medium flex items-center space-x-2 max-w-[88vw]"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text-1)',
              border: '1px solid var(--border-strong)',
              borderRadius: '16px',
              boxShadow: '0 12px 28px -8px rgba(0, 0, 0, 0.45)'
            }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
            <span className="font-mono tabular-nums tracking-tight truncate">{measurementResultText}</span>
            <span className="text-xs hidden lg:inline pl-1" style={{ color: 'var(--text-3)' }}>
              (คลิกขวาเพื่อย้อนจุด)
            </span>
          </div>
        )}

      {/* Floating Traverse Network Indicator Pill (Precision Instrument Styling) */}
      {plottedTraverseOverlay && (
        <div
          className="absolute top-3 sm:top-4 right-3 sm:right-4 z-[1000] px-4 py-2 rounded-2xl text-xs font-medium flex items-center space-x-2 max-w-[90vw]"
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--text-1)',
            border: '1px solid var(--accent-2)',
            borderRadius: '16px',
            boxShadow: '0 12px 28px -8px rgba(0, 0, 0, 0.45)'
          }}
        >
          <span className="status-dot shrink-0" />
          <span className="font-semibold" style={{ color: 'var(--accent-2)' }}>
            กำลังแสดงโครงข่ายวงรอบ: {plottedTraverseOverlay.stations.length} สถานี
          </span>
          {plottedTraverseOverlay.precisionGrade && (
            <span
              className="hidden sm:inline font-mono tabular-nums text-[11px] px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text-2)',
                border: '1px solid var(--border)'
              }}
            >
              {plottedTraverseOverlay.precisionGrade} (1:{plottedTraverseOverlay.precisionRatio?.toLocaleString()})
            </span>
          )}
          <button
            onClick={() => {
              clearPlottedTraverseOverlay();
              showToast('ปิดการแสดงโครงข่ายวงรอบแล้ว');
            }}
            aria-label="ปิดการแสดงโครงข่ายวงรอบ"
            className="btn-outline ml-2 min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
            title="ปิดการแสดงผลโครงข่ายวงรอบ"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ปิด</span>
          </button>
        </div>
      )}

      {/* Right-Click Geomatics Context Menu */}
      {contextMenu && (
        <div
          className="absolute z-[1100] rounded-2xl p-1.5 min-w-[230px] text-xs font-medium"
          style={{
            top: Math.max(84, Math.min(contextMenu.y, window.innerHeight - 360)),
            left: Math.min(contextMenu.x, window.innerWidth - 245),
            backgroundColor: 'var(--surface)',
            color: 'var(--text-1)',
            border: '1px solid var(--border-strong)',
            borderRadius: '16px',
            boxShadow: '0 14px 36px -10px rgba(0, 0, 0, 0.45)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="px-3 py-1.5 text-xs font-mono"
            style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}
          >
            {contextMenu.lat.toFixed(6)}°, {contextMenu.lng.toFixed(6)}°
          </div>

          <button
            onClick={() => {
              dropStationMarker(contextMenu.lat, contextMenu.lng);
              setContextMenu(null);
              showToast('ปักหมุดรังวัดเรียบร้อยแล้ว');
            }}
            className="group w-full min-h-[44px] text-left px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>ปักหมุดรังวัดที่นี่</span>
          </button>

          <button
            onClick={() => {
              inspectCoordinate(contextMenu.lat, contextMenu.lng);
              setContextMenu(null);
            }}
            className="group w-full min-h-[44px] text-left px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>ตรวจสอบพิกัดละเอียด</span>
          </button>

          <button
            onClick={() => {
              handleSendToConverter(contextMenu.lat, contextMenu.lng);
              setContextMenu(null);
            }}
            className="group w-full min-h-[44px] text-left px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
          >
            <Calculator className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>ส่งพิกัดไปยังเครื่องมือแปลงพิกัด</span>
          </button>

          <button
            onClick={() => {
              setActiveWorkspace('hydro');
              setMeasureMode('cross-section');
              setMeasurePoints([{ lat: contextMenu.lat, lng: contextMenu.lng }]);
              setContextMenu(null);
            }}
            className="group w-full min-h-[44px] text-left px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
          >
            <Scissors className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>เริ่มลากเส้นตัดขวางลำน้ำ DEM จากจุดนี้</span>
          </button>

          <button
            onClick={() => {
              setMeasureMode('distance');
              setMeasurePoints([{ lat: contextMenu.lat, lng: contextMenu.lng }]);
              setContextMenu(null);
            }}
            className="group w-full min-h-[44px] text-left px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
          >
            <Ruler className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>เริ่มวัดระยะทางจากจุดนี้</span>
          </button>

          <button
            onClick={() => {
              setMeasureMode('area');
              setMeasurePoints([{ lat: contextMenu.lat, lng: contextMenu.lng }]);
              setContextMenu(null);
            }}
            className="group w-full min-h-[44px] text-left px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
          >
            <Square className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>เริ่มวัดพื้นที่จากจุดนี้</span>
          </button>

          <div className="my-1" style={{ borderTop: '1px solid var(--border)' }} />

          <button
            onClick={() => {
              if (markerGroupRef.current) {
                markerGroupRef.current.clearLayers();
              }
              if (traverseOverlayLayerRef.current) {
                clearPlottedTraverseOverlay();
              }
              handleClearMeasurements();
              setContextMenu(null);
              showToast('ล้างหมุดและเส้นรังวัดทั้งหมดแล้ว');
            }}
            className="group w-full min-h-[44px] text-left px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>ล้างหมุดและเส้นทั้งหมด</span>
          </button>
        </div>
      )}

      {/* Floating Canvas Toast (Solid Surface) */}
      {toastMessage && (
        <div
          className="absolute bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 z-[1150] px-4 py-2 rounded-full text-xs font-medium flex items-center space-x-1.5"
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--text-1)',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 12px 28px -8px rgba(0, 0, 0, 0.45)'
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* GeoJSON Import Modal */}
      <GeoJsonUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onGeoJsonLoaded={handleGeoJsonLoaded}
      />
      </div>
    </div>
  );
};
