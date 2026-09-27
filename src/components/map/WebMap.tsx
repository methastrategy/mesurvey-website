import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BasemapProvider, DistancePoint, MapInteractionMode } from '../../types/map';
import { 
  forwardWgs84ToUtm 
} from '../../core/projections';
import { sqMetersToThaiLand, formatThaiLandString } from '../../core/land-units';
import { SURVEY_BOOKMARKS } from '../../data/survey-presets';
import { MapToolbar } from './MapToolbar';
import { GeoJsonUploader } from './GeoJsonUploader';
import { Crosshair, Check } from 'lucide-react';
import { trackEvent } from '../../lib/telemetry';

interface WebMapProps {
  externalPoint?: { lat: number; lng: number; label: string } | null;
  onSendToCalculator?: (lat: number, lng: number) => void;
}

export const WebMap: React.FC<WebMapProps> = ({ externalPoint, onSendToCalculator }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  const vectorLayerRef = useRef<L.GeoJSON | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const inspectMarkerRef = useRef<L.Marker | null>(null);
  const clickPopupRef = useRef<L.Popup | null>(null);

  const [currentBasemap, setCurrentBasemap] = useState<BasemapProvider>('satellite');
  const [measureMode, setMeasureMode] = useState<MapInteractionMode>('none');
  const [measurePoints, setMeasurePoints] = useState<DistancePoint[]>([]);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [measurementResultText, setMeasurementResultText] = useState<string | null>(null);

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

    tileLayerRef.current = tileLayer;
    measureLayerRef.current = measureGroup;
    markerGroupRef.current = markerGroup;
    mapInstanceRef.current = map;

    // Dynamic Map Click Event (Google Maps style)
    map.on('click', (e: L.LeafletMouseEvent) => {
      const mode = measureModeRef.current;
      const { lat, lng } = e.latlng;

      // 1. In Distance / Area mode: Handled by measure points listener
      if (mode === 'distance' || mode === 'area') {
        setMeasurePoints((prev) => [...prev, { lat, lng }]);
        return;
      }

      // 2. In Marker mode: Drop a permanent station marker
      if (mode === 'marker') {
        trackEvent('map_drop_marker', { lat, lng });
        const markerPinIcon = L.divIcon({
          className: 'custom-marker-pin',
          html: `<div style="background-color: #f59e0b; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        L.marker([lat, lng], { icon: markerPinIcon })
          .bindPopup(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; padding: 2px;">
              <strong style="color: #b45309;">หมุดรังวัดภาคสนาม</strong><br/>
              <span style="font-family: monospace; font-size: 11px;">
                ${lat.toFixed(6)}, ${lng.toFixed(6)}
              </span>
            </div>
          `)
          .addTo(markerGroup);
        return;
      }

      // 3. Default & Inspect click: Google Maps style single-format coordinate pin
      trackEvent('map_inspect_point', { lat, lng });

      // Remove previous temporary inspect pin
      if (inspectMarkerRef.current) {
        map.removeLayer(inspectMarkerRef.current);
      }

      const googlePin = L.divIcon({
        className: 'custom-google-pin',
        html: `
          <div style="width: 28px; height: 36px; transform: translate(-14px, -36px); cursor: pointer;">
            <svg viewBox="0 0 24 24" width="28" height="36" fill="#EA4335" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35));">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const newMarker = L.marker([lat, lng], { icon: googlePin }).addTo(map);
      inspectMarkerRef.current = newMarker;

      const coordStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      const popupHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 3px 5px; min-width: 180px; color: #1e293b;">
          <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 2px;">
            📍 พิกัดตำแหน่งที่เลือก
          </div>
          <div style="font-size: 13.5px; font-weight: 700; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin-bottom: 8px; letter-spacing: -0.2px;">
            ${coordStr}
          </div>
          <button 
            id="btn-copy-popup-coord"
            style="
              width: 100%;
              padding: 6px 12px;
              background: #007AFF;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 11.5px;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              box-shadow: 0 1px 4px rgba(0,122,255,0.3);
              transition: background 0.15s ease;
            "
            onmouseover="this.style.background='#0066d6'"
            onmouseout="this.style.background='#007AFF'"
            onclick="
              navigator.clipboard.writeText('${coordStr}');
              this.innerText = 'คัดลอกพิกัดแล้ว ✓';
              setTimeout(() => { this.innerText = 'คัดลอกพิกัด'; }, 1800);
            "
          >
            คัดลอกพิกัด
          </button>
        </div>
      `;

      if (clickPopupRef.current) {
        map.closePopup(clickPopupRef.current);
      }

      const popup = L.popup({
        closeButton: true,
        autoClose: true,
        closeOnClick: false,
        offset: [0, -32],
        maxWidth: 240,
        className: 'google-style-popup'
      })
        .setLatLng([lat, lng])
        .setContent(popupHtml)
        .openOn(map);

      clickPopupRef.current = popup;
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
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

    const pinIcon = L.divIcon({
      className: 'custom-target-pin',
      html: `<div style="background-color: #f59e0b; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 12px rgba(245, 158, 11, 0.8);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const marker = L.marker([lat, lng], { icon: pinIcon })
      .bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px;">
          <strong style="color: #b45309;">${label}</strong><br/>
          <span style="font-family: monospace; font-size: 11px;">
            Lat: ${lat.toFixed(6)}°, Lng: ${lng.toFixed(6)}°
          </span>
        </div>
      `)
      .addTo(markerGroupRef.current);

    setTimeout(() => {
      marker.openPopup();
    }, 600);
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
        radius: 4.5,
        color: '#ffffff',
        fillColor: '#10b981',
        fillOpacity: 1,
        weight: 2
      }).addTo(measureGroup);
    });

    if (measureMode === 'distance') {
      if (latlngs.length >= 2) {
        L.polyline(latlngs, {
          color: '#10b981',
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
          color: '#059669',
          fillColor: '#10b981',
          fillOpacity: 0.25,
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

  // Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) {
      alert('เบราว์เซอร์ไม่รองรับการระบุพิกัด Geolocation');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        mapInstanceRef.current?.flyTo([latitude, longitude], 17);

        if (markerGroupRef.current) {
          L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.2
          }).addTo(markerGroupRef.current);

          L.marker([latitude, longitude])
            .bindPopup(`
              <div style="font-family: sans-serif; font-size: 12px;">
                <strong style="color: #0284c7;">ตำแหน่งปัจจุบันของคุณ (GPS)</strong><br/>
                ความแม่นยำ: ±${accuracy.toFixed(1)} เมตร
              </div>
            `)
            .addTo(markerGroupRef.current)
            .openPopup();
        }
      },
      (err) => {
        alert(`ไม่สามารถดึงตำแหน่งพิกัดได้: ${err.message}`);
      },
      { enableHighAccuracy: true }
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
    if (inspectMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(inspectMarkerRef.current);
      inspectMarkerRef.current = null;
    }
  };

  const handleGeoJsonLoaded = (data: any, fileName: string) => {
    if (!mapInstanceRef.current) return;

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
          layer.bindPopup(`<div style="font-size: 12px;">${props}</div>`);
        }
      }
    }).addTo(mapInstanceRef.current);

    vectorLayerRef.current = geoLayer;
    mapInstanceRef.current.fitBounds(geoLayer.getBounds());
  };

  return (
    <div className={`relative w-full h-[calc(100vh-140px)] min-h-[500px] rounded-3xl overflow-hidden shadow-geo border border-slate-200 dark:border-slate-800 bg-slate-900 ${
      measureMode === 'inspect' ? 'cursor-crosshair' : ''
    }`}>
      
      {/* Leaflet Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Modern Floating Toolbar */}
      <MapToolbar
        currentBasemap={currentBasemap}
        onSelectBasemap={setCurrentBasemap}
        measureMode={measureMode}
        onSetMeasureMode={(m) => {
          setMeasureMode(m);
          setMeasurePoints([]);
        }}
        onClearMeasurements={handleClearMeasurements}
        onLocateMe={handleLocateMe}
        onSelectBookmark={handleSelectBookmark}
        onOpenUploader={() => setIsUploaderOpen(true)}
      />

      {/* Floating Inspect Mode Guidance Banner */}
      {measureMode === 'inspect' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl text-white border border-ios-blue/40 px-4 py-2 rounded-full shadow-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Crosshair className="w-4 h-4 text-ios-blue animate-pulse" />
          <span>แตะจุดใดๆ บนแผนที่เพื่อดูและคัดลอกพิกัด</span>
          <button 
            onClick={() => setMeasureMode('none')}
            className="ml-2 px-2.5 py-0.5 rounded-full bg-ios-blue hover:bg-ios-blueDark text-white text-[11px] font-medium flex items-center gap-1 shadow-xs transition-colors"
          >
            <Check className="w-3 h-3" />
            เสร็จสิ้น
          </button>
        </div>
      )}

      {/* Floating Dynamic Measurement Result Pill */}
      {measurementResultText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl text-white border border-ios-blue/40 px-4 py-2 rounded-full shadow-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-ios-blue animate-pulse" />
          <span>{measurementResultText}</span>
        </div>
      )}

      {/* Minimal Helper Hint when in default clean view */}
      {measureMode === 'none' && !measurementResultText && (
        <div className="absolute bottom-4 left-4 z-[990] bg-slate-900/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md text-slate-300 px-3.5 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.08] shadow-md text-[11px] pointer-events-none flex items-center space-x-1.5 opacity-80 hover:opacity-100 transition-opacity">
          <span>📍 คลิกจุดใดๆ บนแผนที่เพื่อดูและคัดลอกพิกัด</span>
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
