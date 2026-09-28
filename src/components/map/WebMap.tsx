import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BasemapProvider, DistancePoint, MapInteractionMode } from '../../types/map';
import { forwardWgs84ToUtm } from '../../core/projections';
import { sqMetersToThaiLand, formatThaiLandString } from '../../core/land-units';
import { validateGeoJsonRFC7946 } from '../../core/geojson-validator';
import { SURVEY_BOOKMARKS } from '../../data/survey-presets';
import { MapToolbar } from './MapToolbar';
import { GeoJsonUploader } from './GeoJsonUploader';
import { 
  Crosshair, 
  Check, 
  MapPin, 
  Ruler, 
  Square, 
  Copy, 
  RotateCcw,
  Compass,
  Layers,
  Calculator,
  X
} from 'lucide-react';
import { trackEvent } from '../../lib/telemetry';
import { useSurveyStore } from '../../store/useSurveyStore';

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

export const WebMap: React.FC<WebMapProps> = ({ externalPoint, onSendToCalculator }) => {
  const {
    plottedTraverseOverlay,
    clearPlottedTraverseOverlay,
    setInspectedCoordinate
  } = useSurveyStore();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  const vectorLayerRef = useRef<L.GeoJSON | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const gpsLocationLayerRef = useRef<L.LayerGroup | null>(null);
  const inspectMarkerRef = useRef<L.Marker | null>(null);
  const clickPopupRef = useRef<L.Popup | null>(null);
  const traverseOverlayLayerRef = useRef<L.LayerGroup | null>(null);

  const [currentBasemap, setCurrentBasemap] = useState<BasemapProvider>('satellite');
  const [measureMode, setMeasureMode] = useState<MapInteractionMode>('none');
  const [measurePoints, setMeasurePoints] = useState<DistancePoint[]>([]);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [measurementResultText, setMeasurementResultText] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
  const handleSendToConverter = (lat: number, lng: number) => {
    trackEvent('map_send_to_converter', { lat, lng });
    setInspectedCoordinate({
      lat,
      lng,
      label: 'พิกัดจากการตรวจสอบบนแผนที่',
      timestamp: Date.now()
    });
    if (onSendToCalculator) {
      onSendToCalculator(lat, lng);
    }
    window.location.hash = '#/calculator/coord';
  };

  useEffect(() => {
    (window as any).__mesurvSendToConverter = (lat: number, lng: number) => {
      handleSendToConverter(lat, lng);
    };
    return () => {
      delete (window as any).__mesurvSendToConverter;
    };
  }, [onSendToCalculator, setInspectedCoordinate]);

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

    const initialLat = 13.84664;
    const initialLng = 100.56982;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer (High-Res Satellite default)
    const baseConfig = basemapUrls['satellite'];
    const tileLayer = L.tileLayer(baseConfig.url, {
      maxZoom: baseConfig.maxZoom,
      attribution: baseConfig.attr
    }).addTo(map);

    const measureGroup = L.layerGroup().addTo(map);
    const markerGroup = L.layerGroup().addTo(map);
    const gpsGroup = L.layerGroup().addTo(map);
    const traverseGroup = L.layerGroup().addTo(map);

    tileLayerRef.current = tileLayer;
    measureLayerRef.current = measureGroup;
    markerGroupRef.current = markerGroup;
    gpsLocationLayerRef.current = gpsGroup;
    traverseOverlayLayerRef.current = traverseGroup;
    mapInstanceRef.current = map;

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
      if (mode === 'distance' || mode === 'area') {
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

  // Handle External Point Plot (from Coordinate Converter)
  useEffect(() => {
    if (!externalPoint || !mapInstanceRef.current || !markerGroupRef.current) return;

    const { lat, lng, label } = externalPoint;
    mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.5 });

    dropStationMarker(lat, lng, label);
  }, [externalPoint]);

  // Render Measurement Polylines & Polygons
  useEffect(() => {
    const measureGroup = measureLayerRef.current;
    if (!measureGroup) return;
    measureGroup.clearLayers();

    if (measurePoints.length === 0) {
      setMeasurementResultText(null);
      return;
    }

    const latlngs = measurePoints.map((p) => [p.lat, p.lng] as [number, number]);

    latlngs.forEach((pt) => {
      L.circleMarker(pt, {
        radius: 5,
        color: '#ffffff',
        fillColor: '#0284c7',
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

        const text = totalMeters > 1000 
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
        const text = `พื้นที่: ${areaSqM.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m² | ${formatThaiLandString(thai.rai, thai.ngan, thai.wah)}`;
        setMeasurementResultText(text);
      }
    }
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

          const elevText = altitude !== null && altitude !== undefined
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
          case 1: // PERMISSION_DENIED
            msg = 'ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง (Permission Denied): กรุณาอนุญาตสิทธิ์ Location ในการตั้งค่าเบราว์เซอร์หรืออุปกรณ์ของคุณ เพื่อใช้งานระบุตำแหน่งภาคสนาม';
            break;
          case 2: // POSITION_UNAVAILABLE
            msg = 'ไม่พบสัญญาณดาวเทียม (Signal Loss / Obstructed): เครื่องรับสัญญาณ GNSS/GPS ไม่สามารถคำนวณตำแหน่งได้ เสาสัญญาณอาจถูกบดบังด้วยอาคาร อุโมงค์ หรือร่มไม้หนาทึบ กรุณาย้ายไปยังพื้นที่โล่งแจ้ง';
            break;
          case 3: // TIMEOUT
            msg = 'หมดเวลารับสัญญาณพิกัด (Timeout): อุปกรณ์ใช้เวลาค้นหาดาวเทียมนานเกินไป (เกิน 15 วินาที) กรุณาเปิดโหมด High Accuracy GPS แล้วลองใหม่อีกครั้งกลางแจ้ง';
            break;
          default:
            msg = `ระบุพิกัด GPS ไม่สำเร็จ: ${err.message}`;
        }
        showToast(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSelectBookmark = (bm: typeof SURVEY_BOOKMARKS[0]) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([bm.lat, bm.lng], bm.zoom, { duration: 1.2 });
  };

  const handleClearMeasurements = () => {
    setMeasurePoints([]);
    setMeasurementResultText(null);
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
        return [];
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

  return (
    <div 
      className={`relative w-full h-full min-h-0 overflow-hidden bg-slate-900 select-none map-locked-viewport ${
        measureMode === 'inspect' ? 'cursor-crosshair' : ''
      }`}
      onAuxClick={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          handleClearMeasurements();
          showToast('ยกเลิกโหมดการวัดแล้ว (Middle-Click)');
        }
      }}
    >
      
      {/* Leaflet Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0 touch-none overscroll-none" />

      {/* Modern Floating Toolbar (44x44px touch targets) */}
      <MapToolbar
        currentBasemap={currentBasemap}
        onSelectBasemap={setCurrentBasemap}
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
      />

      {/* Floating Inspect Mode Guidance Banner (Rested Surface) */}
      {measureMode === 'inspect' && (
        <div className="absolute top-28 sm:top-20 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/95 dark:bg-[#131b2c]/95 backdrop-blur-md text-white border border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-sm text-xs font-medium flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Crosshair className="w-4 h-4 text-sky-400 shrink-0" />
          <span>แตะจุดใดๆ บนแผนที่เพื่อดูและคัดลอกพิกัด WGS84 & UTM</span>
          <button 
            onClick={() => setMeasureMode('none')}
            className="ml-2 min-h-[44px] px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            เสร็จสิ้น
          </button>
        </div>
      )}

      {/* Floating Dynamic Measurement Result Pill (Rested Surface, Tabular-nums) */}
      {measurementResultText && (
        <div className="absolute top-28 sm:top-20 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/95 dark:bg-[#131b2c]/95 backdrop-blur-md text-white border border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-sm text-xs font-medium flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 max-w-[90vw]">
          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
          <span className="font-mono tabular-nums tracking-tight truncate">{measurementResultText}</span>
          <span className="text-xs text-slate-400 hidden lg:inline pl-1">(คลิกขวาเพื่อย้อนจุด)</span>
        </div>
      )}

      {/* Floating Traverse Network Indicator Pill (Precision Instrument Styling) */}
      {plottedTraverseOverlay && (
        <div 
          className={`absolute ${
            measureMode === 'inspect' || measurementResultText ? 'top-44 sm:top-36' : 'top-28 sm:top-20'
          } left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/95 dark:bg-[#131b2c]/95 backdrop-blur-md text-white border border-emerald-500/80 px-3.5 py-1.5 rounded-xl shadow-xs text-xs font-medium flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 max-w-[90vw]`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-semibold text-emerald-400">
            กำลังแสดงโครงข่ายวงรอบ: {plottedTraverseOverlay.stations.length} สถานี
          </span>
          {plottedTraverseOverlay.precisionGrade && (
            <span className="hidden sm:inline font-mono tabular-nums text-[11px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              {plottedTraverseOverlay.precisionGrade} (1:{plottedTraverseOverlay.precisionRatio?.toLocaleString()})
            </span>
          )}
          <button
            onClick={() => {
              clearPlottedTraverseOverlay();
              showToast('ปิดการแสดงโครงข่ายวงรอบแล้ว');
            }}
            aria-label="ปิดการแสดงโครงข่ายวงรอบ"
            className="ml-2 min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700 transition-colors"
            title="ปิดการแสดงผลโครงข่ายวงรอบ"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ปิด</span>
          </button>
        </div>
      )}

      {/* Bottom Telemetry HUD Bar (Rested Surface, Tabular Precision Rule) */}
      <div className="absolute bottom-20 md:bottom-4 left-3 sm:left-4 z-[990] bg-white/95 dark:bg-[#131b2c]/95 backdrop-blur-md text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs font-mono tabular-nums text-xs pointer-events-none flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold">
          <Compass className="w-3.5 h-3.5 shrink-0" />
          <span>ศูนย์กลางแผนที่</span>
        </div>
        <div className="text-slate-600 dark:text-slate-300">
          WGS84: {telemetry.lat.toFixed(6)}°, {telemetry.lng.toFixed(6)}°
        </div>
        <div className="text-slate-400 dark:text-slate-600 hidden sm:inline">
          |
        </div>
        <div className="text-slate-600 dark:text-slate-300 hidden sm:inline">
          UTM {telemetry.zone}N: E {telemetry.utmE.toLocaleString()} m, N {telemetry.utmN.toLocaleString()} m
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-xs px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
          Z: {telemetry.zoom}
        </div>
      </div>

      {/* Right-Click Geomatics Context Menu (Instrument Rarity: Single Sky Accent) */}
      {contextMenu && (
        <div 
          className="absolute z-[1100] bg-white/95 dark:bg-[#131b2c]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-md min-w-[220px] text-xs font-medium text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95"
          style={{
            top: Math.max(84, Math.min(contextMenu.y, window.innerHeight - 330)),
            left: Math.min(contextMenu.x, window.innerWidth - 240)
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-xs font-mono text-slate-400 border-b border-slate-100 dark:border-slate-800">
            {contextMenu.lat.toFixed(6)}°, {contextMenu.lng.toFixed(6)}°
          </div>

          <button
            onClick={() => {
              dropStationMarker(contextMenu.lat, contextMenu.lng);
              setContextMenu(null);
              showToast('ปักหมุดรังวัดเรียบร้อยแล้ว');
            }}
            className="group w-full min-h-[44px] text-left px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-2 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            <span>ปักหมุดรังวัดที่นี่</span>
          </button>

          <button
            onClick={() => {
              inspectCoordinate(contextMenu.lat, contextMenu.lng);
              setContextMenu(null);
            }}
            className="group w-full min-h-[44px] text-left px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-2 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            <span>ตรวจสอบพิกัดละเอียด</span>
          </button>

          <button
            onClick={() => {
              handleSendToConverter(contextMenu.lat, contextMenu.lng);
              setContextMenu(null);
            }}
            className="group w-full min-h-[44px] text-left px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-2 transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            <span>ส่งพิกัดไปยังเครื่องมือแปลงพิกัด</span>
          </button>

          <button
            onClick={() => {
              setMeasureMode('distance');
              setMeasurePoints([{ lat: contextMenu.lat, lng: contextMenu.lng }]);
              setContextMenu(null);
            }}
            className="group w-full min-h-[44px] text-left px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-2 transition-colors"
          >
            <Ruler className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            <span>เริ่มวัดระยะทางจากจุดนี้</span>
          </button>

          <button
            onClick={() => {
              setMeasureMode('area');
              setMeasurePoints([{ lat: contextMenu.lat, lng: contextMenu.lng }]);
              setContextMenu(null);
            }}
            className="group w-full min-h-[44px] text-left px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-2 transition-colors"
          >
            <Square className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            <span>เริ่มวัดพื้นที่จากจุดนี้</span>
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

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
            className="group w-full min-h-[44px] text-left px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
            <span>ล้างหมุดและเส้นทั้งหมด</span>
          </button>
        </div>
      )}

      {/* Floating Canvas Toast (Rested Surface) */}
      {toastMessage && (
        <div className="absolute bottom-28 md:bottom-16 left-1/2 -translate-x-1/2 z-[1150] bg-slate-900/90 text-white px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-sm text-xs font-medium flex items-center space-x-1.5 animate-in fade-in slide-in-from-bottom-2">
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
  );
};
