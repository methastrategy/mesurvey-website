import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BasemapProvider, DistancePoint, MapInteractionMode } from '../../types/map';
import { 
  forwardWgs84ToUtm, 
  forwardWgs84ToIndian1975, 
  calculateUtmZone,
  decimalToDms,
  formatDms
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

    // Initial reference landmark
    const customPinIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    L.marker([initialLat, initialLng], { icon: customPinIcon })
      .bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #047857;">ภาควิชาวิศวกรรมสำรวจ มก.</strong><br/>
          อาคารชูชาติ กำภู (KU Geomatics Hub)<br/>
          <span style="font-family: monospace; font-size: 11px; color: #555;">
            13.846640° N, 100.569820° E
          </span>
        </div>
      `)
      .addTo(markerGroup);

    // Dynamic Map Click Event
    map.on('click', (e: L.LeafletMouseEvent) => {
      const mode = measureModeRef.current;

      // 1. In default 'none' mode: DO NOTHING to eliminate accidental mobile touch traps
      if (mode === 'none') {
        return;
      }

      const { lat, lng } = e.latlng;

      // 2. In Distance / Area mode: Handled by measure points listener
      if (mode === 'distance' || mode === 'area') {
        setMeasurePoints((prev) => [...prev, { lat, lng }]);
        return;
      }

      // 3. In Marker mode: Drop a permanent station marker
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
            <div style="font-family: sans-serif; font-size: 12px;">
              <strong style="color: #b45309;">หมุดรังวัดภาคสนาม</strong><br/>
              <span style="font-family: monospace; font-size: 11px;">
                ${lat.toFixed(6)}°, ${lng.toFixed(6)}°
              </span>
            </div>
          `)
          .addTo(markerGroup);
        return;
      }

      // 4. In Explicit Inspect Mode ("เป้าเล็ง"): Show full geodetic datum popup
      if (mode === 'inspect') {
        trackEvent('map_inspect_point', { lat, lng });
        const zone = calculateUtmZone(lng);
        const utm = forwardWgs84ToUtm(lat, lng, zone);
        const ind = forwardWgs84ToIndian1975(lat, lng, zone);
        const dmsLat = decimalToDms(lat, true);
        const dmsLng = decimalToDms(lng, false);

        // Remove old inspection marker if present
        if (inspectMarkerRef.current) {
          map.removeLayer(inspectMarkerRef.current);
        }

        const crosshairPin = L.divIcon({
          className: 'custom-crosshair-pin',
          html: `<div style="background-color: #047857; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(4,120,87,0.8);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const newMarker = L.marker([lat, lng], { icon: crosshairPin }).addTo(map);
        inspectMarkerRef.current = newMarker;

        const popupHtml = `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; width: 100%; max-width: 260px; line-height: 1.45; color: #1e293b;">
            <div style="font-weight: 700; color: #047857; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
              <span>📍 พิกัดจุดรังวัดที่เลือก</span>
            </div>
            
            <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10.5px; background: #f8fafc; padding: 6px 8px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 6px;">
              <div style="color: #64748b; font-size: 9.5px; font-weight: 600;">WGS84 (DD):</div>
              <strong style="color: #0f172a;">${lat.toFixed(6)}°, ${lng.toFixed(6)}°</strong>
              
              <div style="color: #64748b; font-size: 9.5px; font-weight: 600; margin-top: 4px;">WGS84 (DMS):</div>
              <div>${formatDms(dmsLat)}</div>
              <div>${formatDms(dmsLng)}</div>
              
              <div style="color: #047857; font-size: 9.5px; font-weight: 600; margin-top: 4px;">UTM Zone ${zone}N (m):</div>
              <div>E: ${utm.easting.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div>N: ${utm.northing.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>

              <div style="color: #b45309; font-size: 9.5px; font-weight: 600; margin-top: 4px;">Indian 1975 (RTSD):</div>
              <div>E: ${ind.easting.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div>N: ${ind.northing.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <div style="display: flex; gap: 4px;">
              <button 
                id="btn-copy-popup-coord"
                style="flex: 1; padding: 5px 8px; background: #047857; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; text-align: center;"
                onclick="
                  navigator.clipboard.writeText('${lat.toFixed(6)}, ${lng.toFixed(6)}');
                  this.innerText = 'คัดลอกแล้ว ✓';
                  setTimeout(() => { this.innerText = 'คัดลอกพิกัด'; }, 1500);
                "
              >
                คัดลอกพิกัด WGS84
              </button>
            </div>
          </div>
        `;

        if (clickPopupRef.current) {
          map.closePopup(clickPopupRef.current);
        }

        const popup = L.popup({
          closeButton: true,
          autoClose: true,
          closeOnClick: false,
          maxWidth: 280,
          className: 'custom-survey-popup'
        })
          .setLatLng([lat, lng])
          .setContent(popupHtml)
          .openOn(map);

        clickPopupRef.current = popup;
      }
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
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-950/95 backdrop-blur-md text-emerald-200 border border-emerald-500/60 px-4 py-2 rounded-full shadow-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Crosshair className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>โหมดเป้าเล็ง: แตะบนแผนที่เพื่อดูพิกัด WGS84, UTM, Indian 1975</span>
          <button 
            onClick={() => setMeasureMode('none')}
            className="ml-2 px-2.5 py-0.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1 shadow-xs"
          >
            <Check className="w-3 h-3" />
            เสร็จสิ้น
          </button>
        </div>
      )}

      {/* Floating Dynamic Measurement Result Pill */}
      {measurementResultText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-survey-950/90 backdrop-blur-md text-survey-200 border border-survey-500/50 px-4 py-2 rounded-full shadow-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-survey-400 animate-pulse" />
          <span>{measurementResultText}</span>
        </div>
      )}

      {/* Minimal Helper Hint when in default clean view */}
      {measureMode === 'none' && !measurementResultText && (
        <div className="absolute bottom-4 left-4 z-[990] bg-slate-900/80 backdrop-blur-sm text-slate-300 px-3 py-1.5 rounded-full border border-slate-700/60 shadow-md text-[11px] pointer-events-none flex items-center space-x-1.5 opacity-80 hover:opacity-100 transition-opacity">
          <span>💡 แตะปุ่ม "เป้าเล็งพิกัด" บนแถบเครื่องมือเพื่ออ่านค่าพิกัดจุดใดๆ บนแผนที่</span>
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
