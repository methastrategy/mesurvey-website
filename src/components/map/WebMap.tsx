import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BasemapProvider, TelemetryState, DistancePoint } from '../../types/map';
import { forwardWgs84ToUtm, calculateUtmZone } from '../../core/projections';
import { sqMetersToThaiLand, formatThaiLandString } from '../../core/land-units';
import { SURVEY_BOOKMARKS } from '../../data/survey-presets';
import { MapToolbar } from './MapToolbar';
import { TelemetryHud } from './TelemetryHud';
import { GeoJsonUploader } from './GeoJsonUploader';

interface WebMapProps {
  externalPoint?: { lat: number; lng: number; label: string } | null;
}

export const WebMap: React.FC<WebMapProps> = ({ externalPoint }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  const vectorLayerRef = useRef<L.GeoJSON | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  const [currentBasemap, setCurrentBasemap] = useState<BasemapProvider>('satellite');
  const [measureMode, setMeasureMode] = useState<'none' | 'distance' | 'area' | 'marker'>('none');
  const [measurePoints, setMeasurePoints] = useState<DistancePoint[]>([]);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  const [telemetry, setTelemetry] = useState<TelemetryState>({
    lat: 13.84664,
    lng: 100.56982,
    easting: 669735.2,
    northing: 1531520.2,
    zone: 47,
    zoom: 16
  });

  const [measurementResultText, setMeasurementResultText] = useState<string | null>(null);

  // Basemap URLs
  const basemapUrls: { [key in BasemapProvider]: { url: string; maxZoom: number; attr: string } } = {
    osm: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maxZoom: 19,
      attr: '&copy; OpenStreetMap contributors'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
      attr: 'Tiles &copy; Esri, Maxar, Earthstar Geographics'
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      maxZoom: 17,
      attr: '&copy; OpenTopoMap contributors'
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
      zoomControl: false // Custom placement if needed
    });

    // Add Zoom Control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer (Satellite default)
    const baseConfig = basemapUrls['satellite'];
    const tileLayer = L.tileLayer(baseConfig.url, {
      maxZoom: baseConfig.maxZoom,
      attribution: baseConfig.attr
    }).addTo(map);

    // Layer groups for measurements and custom markers
    const measureGroup = L.layerGroup().addTo(map);
    const markerGroup = L.layerGroup().addTo(map);

    tileLayerRef.current = tileLayer;
    measureLayerRef.current = measureGroup;
    markerGroupRef.current = markerGroup;
    mapInstanceRef.current = map;

    // Drop initial marker at KU Survey Department
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
          อาคารชูชาติ กำภู (KU Surveying & Geomatics Hub)<br/>
          <span style="font-family: monospace; font-size: 11px; color: #555;">
            13.846640° N, 100.569820° E
          </span>
        </div>
      `)
      .addTo(markerGroup);

    // Telemetry Mousemove listener
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const zone = calculateUtmZone(lng);
      const utm = forwardWgs84ToUtm(lat, lng, zone);
      setTelemetry({
        lat,
        lng,
        easting: utm.easting,
        northing: utm.northing,
        zone,
        zoom: map.getZoom()
      });
    });

    map.on('zoomend', () => {
      const center = map.getCenter();
      const zone = calculateUtmZone(center.lng);
      const utm = forwardWgs84ToUtm(center.lat, center.lng, zone);
      setTelemetry((prev) => ({
        ...prev,
        zoom: map.getZoom(),
        lat: center.lat,
        lng: center.lng,
        easting: utm.easting,
        northing: utm.northing
      }));
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

  // Handle Measurement and Marker Click Events
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (measureMode === 'marker') {
        const zone = calculateUtmZone(lng);
        const utm = forwardWgs84ToUtm(lat, lng, zone);

        const pinIcon = L.divIcon({
          className: 'custom-user-pin',
          html: `<div style="background-color: #06b6d4; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 0 8px rgba(6, 182, 212, 0.7);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        if (markerGroupRef.current) {
          L.marker([lat, lng], { icon: pinIcon })
            .bindPopup(`
              <div style="font-family: sans-serif; font-size: 12px;">
                <strong style="color: #0891b2;">หมุดสำรวจใหม่ (User Waypoint)</strong><br/>
                WGS84: ${lat.toFixed(6)}°, ${lng.toFixed(6)}°<br/>
                UTM Zone ${zone}N: E ${utm.easting.toFixed(2)}, N ${utm.northing.toFixed(2)}
              </div>
            `)
            .addTo(markerGroupRef.current)
            .openPopup();
        }
      } else if (measureMode === 'distance' || measureMode === 'area') {
        setMeasurePoints((prev) => [...prev, { lat, lng }]);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [measureMode]);

  // Render Measurement Layers (Polylines and Polygons)
  useEffect(() => {
    const measureGroup = measureLayerRef.current;
    if (!measureGroup) return;
    measureGroup.clearLayers();

    if (measurePoints.length === 0) {
      setMeasurementResultText(null);
      return;
    }

    const latlngs = measurePoints.map((p) => [p.lat, p.lng] as [number, number]);

    // Draw vertex dots
    latlngs.forEach((pt) => {
      L.circleMarker(pt, {
        radius: 4,
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

        // Compute total distance
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

        // Approximate Polygon Area using geodesic projection
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

  // Geolocation Handler
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
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[500px] rounded-3xl overflow-hidden shadow-geo border border-slate-200 dark:border-slate-800 bg-slate-900">
      
      {/* Leaflet Map DOM Root */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Toolbar */}
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

      {/* Measurement Result Pill */}
      {measurementResultText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-survey-950/90 backdrop-blur-md text-survey-200 border border-survey-500/50 px-4 py-2 rounded-full shadow-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-survey-400 animate-pulse" />
          <span>{measurementResultText}</span>
        </div>
      )}

      {/* Live Coordinate Telemetry HUD */}
      <TelemetryHud telemetry={telemetry} />

      {/* GeoJSON Import Modal */}
      <GeoJsonUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onGeoJsonLoaded={handleGeoJsonLoaded}
      />

    </div>
  );
};
