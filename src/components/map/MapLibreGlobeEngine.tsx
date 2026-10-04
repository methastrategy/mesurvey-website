import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { BasemapProvider } from '../../types/map';
import { PlaceSearchResult } from '../../types/memaps';
import { forwardWgs84ToUtm } from '../../core/projections';
import { getCategoryEmoji, getCategoryColor } from '../../core/memaps-services';

export interface MapLibreGlobeEngineProps {
  currentBasemap: BasemapProvider;
  activePlace?: PlaceSearchResult | null;
  categoryPlaces?: PlaceSearchResult[];
  onSelectPlace?: (place: PlaceSearchResult) => void;
  onTelemetryChange?: (telemetry: {
    lat: number;
    lng: number;
    utmE: number;
    utmN: number;
    zone: number;
    zoom: number;
  }) => void;
  onClickMap?: (lat: number, lng: number) => void;
  onContextMenuMap?: (lat: number, lng: number) => void;
  flyToLocation?: { lat: number; lng: number; zoom?: number } | null;
  liveLocation?: { lat: number; lng: number; heading?: number | null } | null;
  measurePoints?: { lat: number; lng: number }[];
  measureMode?: string;
  measureSubMode?: 'distance' | 'area';
  isLocked?: boolean;
  className?: string;
}

export const MapLibreGlobeEngine: React.FC<MapLibreGlobeEngineProps> = ({
  currentBasemap,
  activePlace,
  categoryPlaces = [],
  onSelectPlace,
  onTelemetryChange,
  onClickMap,
  onContextMenuMap,
  flyToLocation,
  liveLocation,
  measurePoints = [],
  measureMode = 'none',
  measureSubMode = 'distance',
  isLocked = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const measureMarkersRef = useRef<maplibregl.Marker[]>([]);
  const isLockedRef = useRef(isLocked);
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  const onClickMapRef = useRef(onClickMap);
  useEffect(() => {
    onClickMapRef.current = onClickMap;
  }, [onClickMap]);

  const onContextMenuMapRef = useRef(onContextMenuMap);
  useEffect(() => {
    onContextMenuMapRef.current = onContextMenuMap;
  }, [onContextMenuMap]);

  const onTelemetryChangeRef = useRef(onTelemetryChange);
  useEffect(() => {
    onTelemetryChangeRef.current = onTelemetryChange;
  }, [onTelemetryChange]);

  const [isLoaded, setIsLoaded] = useState(false);

  // Basemap tile definitions (100% Free - Esri World Imagery & OpenStreetMap)
  const getStyleForBasemap = (bm: BasemapProvider): maplibregl.StyleSpecification => {
    const isSatellite = bm === 'satellite';
    const isTopo = bm === 'topo';
    const isDark = bm === 'dark';

    // 100% Free Open Basemap Endpoints
    // Note: Esri World Imagery native tiles cap at z=18. Setting maxzoom: 18 ensures MapLibre
    // smoothly oversamples (bilinear filter) up to z=22 without requesting non-existent tiles
    // and completely prevents the "Map data not yet available" placeholder watermark!
    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let attribution = 'Tiles &copy; Esri &mdash; Esri World Imagery';
    let maxZoom = 18;

    if (!isSatellite) {
      if (isTopo) {
        tileUrl = 'https://tile.opentopomap.org/{z}/{x}/{y}.png';
        attribution = 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)';
        maxZoom = 17;
      } else if (isDark) {
        tileUrl = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
        attribution = '&copy; OpenStreetMap contributors &copy; CARTO';
        maxZoom = 19;
      } else {
        tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        attribution = '&copy; OpenStreetMap contributors';
        maxZoom = 19;
      }
    }

    return {
      version: 8,
      sources: {
        'base-tiles': {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          attribution,
          maxzoom: maxZoom
        }
      },
      layers: [
        {
          id: 'base-layer',
          type: 'raster',
          source: 'base-tiles',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    };
  };

  // Initialize MapLibre GL instance with Globe projection & controlled rotation physics
  useEffect(() => {
    if (!containerRef.current) return;

    const initialStyle = getStyleForBasemap(currentBasemap);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: initialStyle,
      center: [100.56982, 13.84664], // Bangkok / Thailand default
      zoom: 4.8, // Initial zoom showing Southeast Asia on Globe
      minZoom: 1.2,
      maxZoom: 21,
      pitch: 0,
      bearing: 0,
      renderWorldCopies: false,
      attributionControl: false
    });

    // Add navigation controls (compass + tilt) without intrusive zoom buttons
    const navControl = new maplibregl.NavigationControl({
      showZoom: false,
      showCompass: true,
      visualizePitch: true
    });
    map.addControl(navControl, 'bottom-right');

    map.on('load', () => {
      try {
        map.setProjection({ type: 'globe' });
      } catch {
        // Fallback to Mercator on older WebGL contexts
      }
      setIsLoaded(true);
    });

    // Inertia & Physics Dampening: Prevents excessive spinning and overshoot
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    // Enable smooth, controlled right-click drag rotation
    let isRotating = false;
    let startX = 0;
    let startBearing = 0;

    const canvas = map.getCanvas();

    const onMouseDown = (e: MouseEvent) => {
      // Right button or Ctrl + Left button for silky smooth 3D rotation
      if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
        isRotating = true;
        startX = e.clientX;
        startBearing = map.getBearing();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isRotating) return;
      const deltaX = e.clientX - startX;
      // Controlled sensitivity (0.35 deg per pixel) prevents dizzying spins
      const newBearing = startBearing + deltaX * 0.35;
      map.setBearing(newBearing);
    };

    const onMouseUp = () => {
      isRotating = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Controlled Left / Right Rotation API accessible by compass
    (map as any).__memapsRotate = (deltaDegrees: number) => {
      const current = map.getBearing();
      map.easeTo({
        bearing: current + deltaDegrees,
        duration: 800,
        easing: (t) => t * (2 - t)
      });
    };

    (map as any).__memapsResetNorth = () => {
      map.easeTo({
        bearing: 0,
        pitch: 0,
        duration: 700,
        easing: (t) => t * (2 - t)
      });
    };

    // Telemetry synchronization
    const updateTelemetry = () => {
      if (isLockedRef.current) return;
      const center = map.getCenter();
      const zoom = map.getZoom();
      const utm = forwardWgs84ToUtm(center.lat, center.lng);

      onTelemetryChangeRef.current?.({
        lat: center.lat,
        lng: center.lng,
        utmE: Math.round(utm.easting),
        utmN: Math.round(utm.northing),
        zone: utm.zone,
        zoom: Math.round(zoom)
      });
    };

    map.on('move', updateTelemetry);

    // Live hover telemetry across globe
    map.on('mousemove', (e: maplibregl.MapMouseEvent) => {
      if (isLockedRef.current) return;
      const { lat, lng } = e.lngLat;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const utm = forwardWgs84ToUtm(lat, lng);
        onTelemetryChangeRef.current?.({
          lat,
          lng,
          utmE: Math.round(utm.easting),
          utmN: Math.round(utm.northing),
          zone: utm.zone,
          zoom: Math.round(map.getZoom())
        });
      }
    });

    // Map Click Handler (always fresh ref)
    map.on('click', (e: maplibregl.MapMouseEvent) => {
      onClickMapRef.current?.(e.lngLat.lat, e.lngLat.lng);
    });

    // Map Right-Click (Context Menu / Undo Measurement Point)
    map.on('contextmenu', (e: maplibregl.MapMouseEvent) => {
      e.preventDefault();
      onContextMenuMapRef.current?.(e.lngLat.lat, e.lngLat.lng);
    });

    mapRef.current = map;

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update basemap when currentBasemap prop changes
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    const style = getStyleForBasemap(currentBasemap);
    mapRef.current.setStyle(style);
    mapRef.current.once('style.load', () => {
      try {
        mapRef.current?.setProjection({ type: 'globe' });
      } catch {}
    });
  }, [currentBasemap, isLoaded]);

  // Handle external flyTo requests (e.g. from search, GPS, or bookmark)
  useEffect(() => {
    if (!mapRef.current || !flyToLocation) return;
    mapRef.current.flyTo({
      center: [flyToLocation.lng, flyToLocation.lat],
      zoom: flyToLocation.zoom ?? 15,
      speed: 1.2,
      curve: 1.4,
      essential: true
    });
  }, [flyToLocation]);

  // Handle Active Place Pin Marker (Solid, Immovable, No CSS Transition Lag)
  useEffect(() => {
    if (!mapRef.current) return;

    if (!activePlace) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const emoji = getCategoryEmoji(activePlace.category, activePlace.name);
    const color = getCategoryColor(activePlace.category);

    const pinHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; pointer-events: auto; cursor: pointer; user-select: none;">
        <div style="background: rgba(15, 23, 42, 0.94); color: #ffffff; padding: 2px 8px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.25); margin-bottom: 2px; text-shadow: 0 1px 2px rgba(0,0,0,0.6); max-width: 180px; overflow: hidden; text-overflow: ellipsis;">
          ${activePlace.name}
        </div>
        <div style="position: relative; width: 36px; height: 42px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45));">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #ffffff; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 18px; line-height: 1;">
            ${emoji}
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${color}; margin-top: -1px;"></div>
        </div>
      </div>
    `;

    if (!markerRef.current) {
      const el = document.createElement('div');
      // Strictly NO CSS transitions on root marker to ensure rock-solid coordinate stability during zoom/pan!
      el.className = 'memaps-active-pin cursor-pointer select-none';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.pointerEvents = 'auto';
      el.innerHTML = pinHtml;

      markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([activePlace.lng, activePlace.lat])
        .addTo(mapRef.current);
    } else {
      const el = markerRef.current.getElement();
      el.innerHTML = pinHtml;
      markerRef.current.setLngLat([activePlace.lng, activePlace.lat]);
    }
  }, [activePlace]);

  // Handle Category Places Markers with Place Names and Category Emojis in 3D Globe
  const categoryMarkersRef = useRef<maplibregl.Marker[]>([]);
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing category markers
    categoryMarkersRef.current.forEach(m => m.remove());
    categoryMarkersRef.current = [];

    if (!categoryPlaces || categoryPlaces.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();

    categoryPlaces.forEach((place) => {
      bounds.extend([place.lng, place.lat]);

      const emoji = getCategoryEmoji(place.category, place.name);
      const color = getCategoryColor(place.category);

      const el = document.createElement('div');
      // Strictly NO CSS transform transitions to ensure 100% rock-solid coordinate locking on zoom/pan!
      el.className = 'memaps-category-marker cursor-pointer select-none';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.pointerEvents = 'auto';

      el.innerHTML = `
        <div style="background: rgba(15, 23, 42, 0.92); color: #ffffff; padding: 2px 7px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.25); margin-bottom: 2px; text-shadow: 0 1px 2px rgba(0,0,0,0.5); max-width: 170px; overflow: hidden; text-overflow: ellipsis;">
          ${place.name}
        </div>
        <div style="position: relative; width: 34px; height: 38px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
          <div style="width: 30px; height: 30px; border-radius: 50%; background: #ffffff; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 16px; line-height: 1;">
            ${emoji}
          </div>
          <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 7px solid ${color}; margin-top: -1px;"></div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectPlace?.(place);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([place.lng, place.lat])
        .addTo(mapRef.current!);

      categoryMarkersRef.current.push(marker);
    });

    if (categoryPlaces.length > 0 && !bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, {
        padding: 80,
        maxZoom: 15,
        duration: 1200
      });
    }
  }, [categoryPlaces]);

  // Handle Real-time Live GPS Location Dot in 3D Globe
  const liveMarkerRef = useRef<maplibregl.Marker | null>(null);
  useEffect(() => {
    if (!mapRef.current) return;

    if (!liveLocation) {
      if (liveMarkerRef.current) {
        liveMarkerRef.current.remove();
        liveMarkerRef.current = null;
      }
      return;
    }

    const heading = liveLocation.heading;
    const headingStyle = heading !== null && heading !== undefined
      ? `transform: rotate(${Math.round(heading)}deg); display: block;`
      : 'display: none;';

    if (!liveMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'memaps-3d-live-dot pointer-events-none flex items-center justify-center';
      el.innerHTML = `
        <div style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;">
          <div class="memaps-3d-heading-cone" style="position: absolute; width: 56px; height: 56px; transform-origin: 28px 28px; ${headingStyle}">
            <svg viewBox="0 0 56 56" width="56" height="56" style="overflow: visible;">
              <defs>
                <radialGradient id="liveGlobeBeam" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#0284c7" stop-opacity="0.45"/>
                  <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
                </radialGradient>
              </defs>
              <path d="M 28 28 L 8 2 A 36 36 0 0 1 48 2 Z" fill="url(#liveGlobeBeam)" />
            </svg>
          </div>
          <div class="memaps-pulse-halo" style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(56, 189, 248, 0.45);"></div>
          <div style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 0 8px rgba(2,132,199,0.85);"></div>
        </div>
      `;

      liveMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([liveLocation.lng, liveLocation.lat])
        .addTo(mapRef.current);
    } else {
      liveMarkerRef.current.setLngLat([liveLocation.lng, liveLocation.lat]);
      const cone = document.querySelector('.memaps-3d-heading-cone') as HTMLElement;
      if (cone && heading !== null && heading !== undefined) {
        cone.style.transform = `rotate(${Math.round(heading)}deg)`;
        cone.style.display = 'block';
      }
    }
  }, [liveLocation]);

  // Handle Measurement Points, Lines & Polygons in 3D Globe
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // 1. Clear old measurement vertex markers
    measureMarkersRef.current.forEach((m) => m.remove());
    measureMarkersRef.current = [];

    if (!measurePoints || measurePoints.length === 0) {
      if (map.getSource('memaps-measure-source')) {
        (map.getSource('memaps-measure-source') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: []
        });
      }
      return;
    }

    // 2. Add numbered point markers at each vertex
    measurePoints.forEach((p, idx) => {
      const el = document.createElement('div');
      el.className = 'memaps-measure-point-marker flex items-center justify-center';
      el.innerHTML = `
        <div style="background: #0284c7; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.45); pointer-events: none;">
          ${idx + 1}
        </div>
      `;
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      measureMarkersRef.current.push(marker);
    });

    // 3. Update GeoJSON lines & polygon
    const lineCoords = measurePoints.map((p) => [p.lng, p.lat]);
    const isPolygon = (measureSubMode === 'area' || measureMode === 'area') && measurePoints.length >= 3;
    const polygonCoords = isPolygon ? [[...lineCoords, lineCoords[0]]] : [];

    const geoData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        ...(lineCoords.length >= 2
          ? [
              {
                type: 'Feature' as const,
                properties: {},
                geometry: {
                  type: 'LineString' as const,
                  coordinates: isPolygon ? [...lineCoords, lineCoords[0]] : lineCoords
                }
              }
            ]
          : []),
        ...(isPolygon
          ? [
              {
                type: 'Feature' as const,
                properties: {},
                geometry: {
                  type: 'Polygon' as const,
                  coordinates: polygonCoords
                }
              }
            ]
          : [])
      ]
    };

    const applySourceAndLayers = () => {
      const source = map.getSource('memaps-measure-source') as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(geoData);
      } else {
        try {
          map.addSource('memaps-measure-source', {
            type: 'geojson',
            data: geoData
          });
          map.addLayer({
            id: 'memaps-measure-fill',
            type: 'fill',
            source: 'memaps-measure-source',
            filter: ['==', '$type', 'Polygon'],
            paint: {
              'fill-color': '#0284c7',
              'fill-opacity': 0.25
            }
          });
          map.addLayer({
            id: 'memaps-measure-line',
            type: 'line',
            source: 'memaps-measure-source',
            paint: {
              'line-color': '#0284c7',
              'line-width': 3.5,
              'line-dasharray': [2, 1]
            }
          });
        } catch {}
      }
    };

    if (map.isStyleLoaded()) {
      applySourceAndLayers();
    } else {
      map.once('style.load', applySourceAndLayers);
    }
  }, [measurePoints, measureMode, measureSubMode, isLoaded]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-950 ${className}`}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
