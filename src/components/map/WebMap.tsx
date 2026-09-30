import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { BasemapProvider, DistancePoint, MapInteractionMode } from '../../types/map';
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
import { DynamicIslandMapLayout } from './layouts/DynamicIslandMapLayout';
import { FloatingPodsMapLayout } from './layouts/FloatingPodsMapLayout';
import { MonolithRailMapLayout } from './layouts/MonolithRailMapLayout';
import { SplitCadMapLayout } from './layouts/SplitCadMapLayout';
import {
  Crosshair,
  Check,
  MapPin,
  Ruler,
  Square,
  RotateCcw,
  Calculator,
  Scissors,
  X
} from 'lucide-react';
import { trackEvent } from '../../lib/telemetry';
import { useSurveyStore } from '../../store/useSurveyStore';
import { PlaceSearchResult, RouteResult, SavedPlace } from '../../types/memaps';
import { reverseGeocode } from '../../core/memaps-services';
import { MeMapsMapControls } from './memaps/MeMapsMapControls';
import { MeMapsPlaceCard } from './memaps/MeMapsPlaceCard';

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

  // Primary Layout Architecture: Dynamic Island Engine for MeMaps
  const [mapLayout, setMapLayout] = useState<WebMapLayoutType>(() => {
    try {
      localStorage.setItem('mesurv-map-layout', 'dynamic-island');
    } catch {}
    return 'dynamic-island';
  });

  // MeMaps Tactical Geodetic Navigation & Turn-by-Turn Routing State
  const [activePlace, setActivePlace] = useState<PlaceSearchResult | null>(null);
  const [originPlace, setOriginPlace] = useState<PlaceSearchResult | null>(null);
  const [destinationPlace, setDestinationPlace] = useState<PlaceSearchResult | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [savedPlacesRefresh, setSavedPlacesRefresh] = useState<number>(0);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);

  // Re-invalidate Leaflet map canvas size whenever layout switches (especially Split CAD pane changes)
  useEffect(() => {
    const t = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 180);
    return () => clearTimeout(t);
  }, [mapLayout]);
  const [measureMode, setMeasureMode] = useState<MapInteractionMode>('none');
  const [measurePoints, setMeasurePoints] = useState<DistancePoint[]>([]);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [measurementResultText, setMeasurementResultText] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Synchronous ref to prevent stale closures and touch event traps
  const measureModeRef = useRef<MapInteractionMode>(measureMode);
  useEffect(() => {
    measureModeRef.current = measureMode;
  }, [measureMode]);

  // Basemap Tile Providers
  const basemapUrls: { [key in BasemapProvider]: { url: string; maxZoom: number; attr: string } } = {
    osm: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maxZoom: 19,
      attr: '&copy; OpenStreetMap'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
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

  // Inspect coordinate click handler with Geodetic Crosshair Reticle
  const inspectCoordinate = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;
    trackEvent('map_inspect_point', { lat, lng });

    if (inspectMarkerRef.current) {
      mapInstanceRef.current.removeLayer(inspectMarkerRef.current);
    }

    const utm = forwardWgs84ToUtm(lat, lng);

    const crosshairIcon = L.divIcon({
      className: 'custom-crosshair-reticle',
      html: `
        <div style="position: relative; width: 26px; height: 26px; transform: translate(-13px, -13px); display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid #0284c7; background: rgba(2,132,199,0.12);"></div>
          <div style="position: absolute; width: 4px; height: 4px; border-radius: 50%; background: #0284c7;"></div>
          <div style="position: absolute; width: 26px; height: 1.5px; background: #0284c7;"></div>
          <div style="position: absolute; width: 1.5px; height: 26px; background: #0284c7;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    const newMarker = L.marker([lat, lng], { icon: crosshairIcon }).addTo(mapInstanceRef.current);
    inspectMarkerRef.current = newMarker;

    const coordStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const utmStr = `UTM ${utm.zone}N: E ${utm.easting.toFixed(2)} m, N ${utm.northing.toFixed(2)} m`;

    // Asynchronously resolve human readable place for MeMaps
    reverseGeocode(lat, lng)
      .then((info) => {
        setActivePlace({
          id: `click-${Date.now()}`,
          name: info.name,
          description: info.address,
          address: info.address,
          lat,
          lng,
          category: 'address'
        });
      })
      .catch(() => {
        setActivePlace({
          id: `click-${Date.now()}`,
          name: `พิกัด ${lat.toFixed(5)}°, ${lng.toFixed(5)}°`,
          description: `WGS84: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          address: `UTM: Zone ${utm.zone}N E: ${utm.easting.toFixed(1)} N: ${utm.northing.toFixed(1)}`,
          lat,
          lng,
          category: 'address'
        });
      });

    const popupHtml = `
      <div style="padding: 4px 6px; min-width: 240px;">
        <div style="font-size: 12px; font-weight: 700; color: #0284c7; margin-bottom: 3px;">
          พิกัดตำแหน่งที่เลือก (Geodetic Point)
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
          WGS84: ${coordStr}
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 12px; color: #475569; margin-bottom: 8px;">
          ${utmStr}
        </div>
        <button 
          id="btn-copy-popup-coord"
          style="
            width: 100%;
            min-height: 44px;
            padding: 10px 14px;
            background: #0284c7;
            color: #ffffff;
            border: 1px solid #0284c7;
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
          onmouseover="this.style.background='#0369a1'"
          onmouseout="this.style.background='#0284c7'"
          onclick="
            navigator.clipboard.writeText('${coordStr}\\n${utmStr}');
            this.innerText = 'คัดลอกพิกัดแล้ว';
            setTimeout(() => { this.innerText = 'คัดลอกพิกัด WGS84 & UTM'; }, 1800);
          "
        >
          คัดลอกพิกัด WGS84 & UTM
        </button>
        <button 
          id="btn-bridge-to-converter"
          data-lat="${lat}"
          data-lng="${lng}"
          style="
            width: 100%;
            min-height: 44px;
            padding: 10px 14px;
            margin-top: 6px;
            background: #0f172a;
            color: #38bdf8;
            border: 1px solid #38bdf8;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.15s ease;
          "
          onmouseover="this.style.background='#1e293b'"
          onmouseout="this.style.background='#0f172a'"
          onclick="
            if (window.__mesurvSendToConverter) {
              window.__mesurvSendToConverter(${lat}, ${lng});
            } else {
              window.location.hash = '#/calculator/coord';
            }
          "
        >
          ส่งพิกัดไปยังเครื่องมือแปลงพิกัด ➔
        </button>
      </div>
    `;

    if (clickPopupRef.current) {
      mapInstanceRef.current.closePopup(clickPopupRef.current);
    }

    const popup = L.popup({
      closeButton: true,
      autoClose: true,
      closeOnClick: false,
      offset: [0, -18],
      maxWidth: 280,
      autoPanPaddingTopLeft: [16, 120],
      autoPanPaddingBottomRight: [16, 84],
      className: 'google-style-popup'
    })
      .setLatLng([lat, lng])
      .setContent(popupHtml)
      .openOn(mapInstanceRef.current);

    clickPopupRef.current = popup;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = 15.1583;
    const initialLng = 100.4500;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 7,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer (High-Res Satellite default)
    const baseConfig = basemapUrls['satellite'];
    const tileLayer = L.tileLayer(baseConfig.url, {
      maxZoom: baseConfig.maxZoom,
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

    // Dynamic Map Click Event
    map.on('click', (e: L.LeafletMouseEvent) => {
      setContextMenu(null);
      const mode = measureModeRef.current;
      const { lat, lng } = e.latlng;

      if (mode === 'distance' || mode === 'area') {
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

      // Default & Inspect click
      inspectCoordinate(lat, lng);
    });

    // Right-Click Event (Context Menu / Undo Point)
    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      e.originalEvent.preventDefault();
      const mode = measureModeRef.current;

      // Right-click during active measurement: Undo Last Vertex!
      if (mode === 'distance' || mode === 'area' || mode === 'cross-section') {
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

    const pinIcon = L.divIcon({
      className: 'memaps-place-pin',
      html: `
        <div style="position: relative; width: 34px; height: 34px; transform: translate(-17px, -34px); display: flex; align-items: center; justify-content: center;">
          <div style="width: 32px; height: 32px; border-radius: 50% 50% 50% 0; background: #2563eb; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(37,99,235,0.45); border: 2px solid #ffffff;">
            <div style="transform: rotate(45deg); width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    const marker = L.marker([activePlace.lat, activePlace.lng], { icon: pinIcon }).addTo(mapInstanceRef.current);
    searchMarkerRef.current = marker;

    mapInstanceRef.current.flyTo([activePlace.lat, activePlace.lng], Math.max(mapInstanceRef.current.getZoom(), 15), {
      duration: 0.8
    });
  }, [activePlace]);

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
    if (!measureGroup) return;
    measureGroup.clearLayers();

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

    latlngs.forEach((pt) => {
      L.circleMarker(pt, {
        radius: 5,
        color: '#ffffff',
        fillColor: measureMode === 'cross-section' ? '#f59e0b' : '#0284c7',
        fillOpacity: 1,
        weight: 2.5
      }).addTo(measureGroup);
    });

    if (measureMode === 'distance') {
      if (latlngs.length >= 2) {
        L.polyline(latlngs, {
          color: '#0284c7',
          weight: 3.5,
          dashArray: '6, 6'
        }).addTo(measureGroup);

        let totalMeters = 0;
        for (let i = 0; i < latlngs.length - 1; i++) {
          totalMeters += L.latLng(latlngs[i]).distanceTo(L.latLng(latlngs[i + 1]));
        }

        const text =
          totalMeters > 1000
            ? `ระยะทางรวม: ${(totalMeters / 1000).toFixed(3)} km (${totalMeters.toFixed(1)} m)`
            : `ระยะทางรวม: ${totalMeters.toFixed(2)} m`;
        setMeasurementResultText(text);
      }
    } else if (measureMode === 'area') {
      if (latlngs.length >= 3) {
        L.polygon(latlngs, {
          color: '#0284c7',
          fillColor: '#38bdf8',
          fillOpacity: 0.3,
          weight: 2.5
        }).addTo(measureGroup);

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
        const text = `พื้นที่: ${areaSqM.toLocaleString('en-US', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        })} m² | ${formatThaiLandString(thai.rai, thai.ngan, thai.wah)}`;
        setMeasurementResultText(text);
      }
    } else if (measureMode === 'cross-section') {
      if (latlngs.length < 2) {
        setCrossSectionProfile(null);
        setIsLoadingCrossSection(false);
      } else if (latlngs.length === 2) {
        L.polyline(latlngs, {
          color: '#f59e0b',
          weight: 4,
          dashArray: '8, 4'
        }).addTo(measureGroup);

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
  }, [measurePoints, measureMode]);

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

  // Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) {
      showToast('เบราว์เซอร์ไม่รองรับการระบุพิกัด Geolocation');
      return;
    }

    showToast('กำลังค้นหาและรับสัญญาณดาวเทียม GNSS...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy, altitude } = pos.coords;
        const utm = forwardWgs84ToUtm(latitude, longitude);

        mapInstanceRef.current?.flyTo([latitude, longitude], 17, { duration: 1.2 });

        if (gpsLocationLayerRef.current) {
          gpsLocationLayerRef.current.clearLayers();

          L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.18,
            weight: 1.5
          }).addTo(gpsLocationLayerRef.current);

          const gpsIcon = L.divIcon({
            className: 'custom-gps-pin',
            html: `
              <div style="position: relative; width: 22px; height: 22px; transform: translate(-11px, -11px); display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(2,132,199,0.7);"></div>
                <div style="position: absolute; width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          });

          const elevText =
            altitude !== null && altitude !== undefined
              ? `<div style="font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 11px; color: #475569; margin-top: 2px;">ระดับความสูง (Altitude): ${altitude.toFixed(2)} m (MSL)</div>`
              : '';

          const coordStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          const utmStr = `UTM ${utm.zone}N: E ${utm.easting.toFixed(2)} m | N ${utm.northing.toFixed(2)} m`;

          const gpsPopupContent = `
            <div style="font-size: 12px; padding: 4px 6px; min-width: 230px;">
              <strong style="color: #0284c7; font-size: 14px;">🛰️ ตำแหน่งรังวัดดาวเทียม GNSS (Fix)</strong>
              <div style="font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 13px; margin-top: 4px; color: #0f172a; font-weight: 700;">
                WGS84: ${coordStr}
              </div>
              <div style="font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 12px; color: #475569; margin-top: 2px;">
                ${utmStr}
              </div>
              ${elevText}
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

          L.marker([latitude, longitude], { icon: gpsIcon })
            .bindPopup(gpsPopupContent, {
              autoPanPaddingTopLeft: [16, 120],
              autoPanPaddingBottomRight: [16, 84]
            })
            .addTo(gpsLocationLayerRef.current)
            .openPopup();
        }
        showToast(`ตรึงตำแหน่งพิกัดดาวเทียม GNSS สำเร็จ (ความแม่นยำ ±${accuracy.toFixed(1)} ม.)`);
      },
      (err) => {
        let msg = '';
        switch (err.code) {
          case 1:
            msg =
              'ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง (Permission Denied): กรุณาอนุญาตสิทธิ์ Location ในการตั้งค่าเบราว์เซอร์หรืออุปกรณ์ของคุณ เพื่อใช้งานระบุตำแหน่งภาคสนาม';
            break;
          case 2:
            msg =
              'ไม่พบสัญญาณดาวเทียม (Signal Loss / Obstructed): เครื่องรับสัญญาณ GNSS/GPS ไม่สามารถคำนวณตำแหน่งได้ เสาสัญญาณอาจถูกบดบังด้วยอาคาร อุโมงค์ หรือร่มไม้หนาทึบ กรุณาย้ายไปยังพื้นที่โล่งแจ้ง';
            break;
          case 3:
            msg =
              'หมดเวลารับสัญญาณพิกัด (Timeout): อุปกรณ์ใช้เวลาค้นหาดาวเทียมนานเกินไป (เกิน 15 วินาที) กรุณาเปิดโหมด High Accuracy GPS แล้วลองใหม่อีกครั้งกลางแจ้ง';
            break;
          default:
            msg = `ระบุพิกัด GPS ไม่สำเร็จ: ${err.message}`;
        }
        showToast(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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
    setMeasureMode('none');
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
          const props = Object.entries(feature.properties)
            .slice(0, 5)
            .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
            .join('<br/>');
          layer.bindPopup(`<div style="font-size: 12px;">${props}</div>`, {
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
          handleClearMeasurements();
          showToast('ยกเลิกโหมดการวัดแล้ว (Middle-Click)');
        }
      }}
    >
      {/* If Split CAD is active, show the 50/50 Dual-Pane Left Workbench */}
      {mapLayout === 'split-cad' && (
        <div className="w-full md:w-[420px] lg:w-[480px] h-[36vh] md:h-full shrink-0 z-10">
          <SplitCadMapLayout {...commonLayoutProps} />
        </div>
      )}

      {/* Map Canvas Viewport (Flex-1 if Split CAD, else Full-Width/Height) */}
      <div className={`relative ${mapLayout === 'split-cad' ? 'flex-1 h-[64vh] md:h-full' : 'w-full h-full'} overflow-hidden`}>
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

        {/* Floating MeMaps Essential Controls: 1-Click Satellite/Street Toggle, Compass North, Locate Me, Zoom */}
        <div className="absolute top-4 right-4 z-[1000] pointer-events-auto">
          <MeMapsMapControls
            currentBasemap={currentBasemap}
            onBasemapChange={setCurrentBasemap}
            onZoomIn={() => mapInstanceRef.current?.zoomIn()}
            onZoomOut={() => mapInstanceRef.current?.zoomOut()}
            onResetNorth={() => {
              mapInstanceRef.current?.setView(
                mapInstanceRef.current.getCenter(),
                mapInstanceRef.current.getZoom(),
                { animate: true }
              );
              showToast('รีเซ็ตมุมมองทิศเหนือเรียบร้อย (Bearing 0°)');
            }}
            onLocateMe={handleLocateMe}
          />
        </div>

        {/* Floating Place Card when not in Split CAD mode */}
        {mapLayout !== 'split-cad' && activePlace && (
          <div className="absolute top-16 left-4 z-[1005] w-[90vw] max-w-[360px] pointer-events-auto shadow-2xl">
            <MeMapsPlaceCard
              place={activePlace}
              onClose={() => setActivePlace(null)}
              onSetAsOrigin={(p) => setOriginPlace(p)}
              onSetAsDestination={(p) => setDestinationPlace(p)}
              onSendToSurvey={(st) => {
                setInspectedCoordinate({
                  lat: st.lat,
                  lng: st.lng,
                  label: st.name,
                  timestamp: Date.now()
                });
                if (st.utmE && st.utmN) {
                  setTraverseStart(st.utmE.toFixed(3), st.utmN.toFixed(3));
                }
                showToast(`ส่งพิกัด ${st.name} เข้าตารางรังวัดแล้ว`);
              }}
              onSaved={() => {
                setSavedPlacesRefresh((prev) => prev + 1);
                showToast('บันทึกสถานที่แล้ว');
              }}
            />
          </div>
        )}

        {/* Active Redesigned Layout Overlays */}
        {mapLayout === 'dynamic-island' && <DynamicIslandMapLayout {...commonLayoutProps} />}
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

      {/* Floating Inspect or Cross-Section Mode Guidance Banner (Solid Surface) */}
      {(measureMode === 'inspect' || measureMode === 'cross-section') && (
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

      {/* Floating Dynamic Measurement Result Pill (Solid Surface, Tabular-nums) */}
      {measurementResultText && (
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
