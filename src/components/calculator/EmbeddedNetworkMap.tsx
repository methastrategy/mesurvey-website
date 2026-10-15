import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Maximize2, 
  Minimize2, 
  Layers, 
  Compass, 
  MapPin, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Sliders
} from 'lucide-react';
import type { AdjustedStation2D, Observation2D, AdjustedObs2D } from '../../utils/least-squares';
import { inverseUtmToWgs84 } from '../../core/projections';

interface EmbeddedNetworkMapProps {
  stations: AdjustedStation2D[];
  observations?: (Observation2D | AdjustedObs2D)[];
  utmZone?: 47 | 48;
  title?: string;
}

export const EmbeddedNetworkMap: React.FC<EmbeddedNetworkMapProps> = ({
  stations,
  observations = [],
  utmZone = 47,
  title = 'แผนที่โครงข่ายรังวัดและวงรีความคลาดเคลื่อน 95% (Embedded Network Map)'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [basemapType, setBasemapType] = useState<'satellite' | 'street'>('satellite');
  const [showEllipses, setShowEllipses] = useState<boolean>(true);
  const [showLines, setShowLines] = useState<boolean>(true);
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(5000);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.8476, 100.5696], // Bangkok / KU default
        zoom: 16,
        zoomControl: true,
        attributionControl: false
      });

      // Attribution small control
      L.control.attribution({ position: 'bottomright', prefix: 'MESURV Geomatics' }).addTo(map);

      mapInstanceRef.current = map;
      layersGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add selected Basemap
    if (basemapType === 'satellite') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Esri World Imagery'
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
    }

    // Force map invalidate size
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [basemapType]);

  // Handle Fullscreen resize
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    }
  }, [isFullscreen]);

  // Render Stations, Baselines, and Error Ellipses
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (stations.length === 0) return;

    const latLngMap = new Map<string, [number, number]>();
    const bounds = L.latLngBounds([]);

    // 1. Process Stations & Coordinates
    stations.forEach((stn) => {
      try {
        const geo = inverseUtmToWgs84(stn.easting, stn.northing, utmZone);
        const latLng: [number, number] = [geo.lat, geo.lng];
        latLngMap.set(stn.id, latLng);
        bounds.extend(latLng);

        // Custom Geodetic Pin Icon
        const isFixed = stn.isFixed;
        const pinColor = isFixed ? '#10b981' : '#06b6d4'; // Emerald for fixed, Cyan for adjusted
        const pinBg = isFixed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)';

        const customIcon = L.divIcon({
          className: 'custom-survey-marker',
          html: `
            <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${pinBg}; border: 1.5px solid ${pinColor}; animation: pulse 2s infinite;"></div>
              <div style="width: 12px; height: 12px; border-radius: 50%; background: ${pinColor}; box-shadow: 0 0 6px ${pinColor}; border: 1.5px solid #fff;"></div>
              <span style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.75); color: #fff; font-family: monospace; font-size: 10px; font-weight: bold; padding: 1px 4px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); white-space: nowrap; pointer-events: none;">
                ${stn.id}
              </span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker(latLng, { icon: customIcon });

        // Popup Content
        const popupHtml = `
          <div style="font-family: inherit; font-size: 11px; line-height: 1.5; min-width: 180px; color: #111;">
            <div style="font-weight: bold; font-size: 13px; color: ${pinColor}; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 5px;">
              ${stn.id} ${isFixed ? '<span style="font-size: 9px; background: #e6f4ea; color: #137333; padding: 1px 4px; border-radius: 3px;">FIXED CONTROL</span>' : '<span style="font-size: 9px; background: #e8f0fe; color: #1a73e8; padding: 1px 4px; border-radius: 3px;">ADJUSTED</span>'}
            </div>
            <div><b>Easting:</b> ${stn.easting.toFixed(4)} m</div>
            <div><b>Northing:</b> ${stn.northing.toFixed(4)} m</div>
            <div><b>WGS84:</b> ${geo.lat.toFixed(6)}°, ${geo.lng.toFixed(6)}°</div>
            <div style="margin-top: 4px; border-top: 1px dashed #ccc; padding-top: 4px;">
              <div><b>σE:</b> ${stn.sigmaEMm.toFixed(1)} mm | <b>σN:</b> ${stn.sigmaNMm.toFixed(1)} mm</div>
              ${stn.errorEllipse ? `
                <div style="color: #d97706; font-weight: bold; margin-top: 2px;">
                  95% Error Ellipse:<br/>
                  • a₉₅ = ${stn.errorEllipse.conf95MajorMm.toFixed(1)} mm<br/>
                  • b₉₅ = ${stn.errorEllipse.conf95MinorMm.toFixed(1)} mm<br/>
                  • θ = ${stn.errorEllipse.orientationDeg.toFixed(1)}°
                </div>
              ` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        group.addLayer(marker);

        // 2. Plot 95% Confidence Error Ellipse Polygon
        if (showEllipses && stn.errorEllipse && !isFixed) {
          const { conf95MajorMm, conf95MinorMm, orientationDeg } = stn.errorEllipse;

          // Convert scaled millimeters to ground meters
          const aM = (conf95MajorMm * scaleMultiplier) / 1000.0;
          const bM = (conf95MinorMm * scaleMultiplier) / 1000.0;
          const thetaRad = (orientationDeg * Math.PI) / 180.0;

          const ellipsePoints: [number, number][] = [];
          const STEPS = 36;

          // Approx 1 meter to degrees in Thailand
          const mToLat = 1.0 / 110900.0;
          const mToLng = 1.0 / (111320.0 * Math.cos((geo.lat * Math.PI) / 180.0));

          for (let step = 0; step < STEPS; step++) {
            const t = (step / STEPS) * 2 * Math.PI;
            // Parametric ellipse
            const u = aM * Math.cos(t);
            const v = bM * Math.sin(t);

            // Rotate by azimuth theta (clockwise from North)
            const dN = u * Math.cos(thetaRad) - v * Math.sin(thetaRad);
            const dE = u * Math.sin(thetaRad) + v * Math.cos(thetaRad);

            const ptLat = geo.lat + dN * mToLat;
            const ptLng = geo.lng + dE * mToLng;

            ellipsePoints.push([ptLat, ptLng]);
          }

          const ellipsePolygon = L.polygon(ellipsePoints, {
            color: '#06b6d4',
            weight: 2,
            dashArray: '3 3',
            fillColor: '#06b6d4',
            fillOpacity: 0.22
          });

          ellipsePolygon.bindTooltip(
            `<b>${stn.id} 95% Error Ellipse</b><br/>a = ${conf95MajorMm.toFixed(1)} mm, b = ${conf95MinorMm.toFixed(1)} mm<br/>θ = ${orientationDeg.toFixed(1)}° (ขยาย ${scaleMultiplier}x)`,
            { sticky: true }
          );

          group.addLayer(ellipsePolygon);
        }
      } catch (err) {
        console.warn(`[EmbeddedMap] Failed to project station ${stn.id}:`, err);
      }
    });

    // 3. Plot Observations / Baseline Vector Lines
    if (showLines && observations.length > 0) {
      observations.forEach((obs) => {
        const p1 = latLngMap.get(obs.fromStation);
        const p2 = latLngMap.get(obs.toStation);

        if (p1 && p2) {
          const polyline = L.polyline([p1, p2], {
            color: obs.type === 'baseline_vector' ? '#10b981' : '#f59e0b',
            weight: 2,
            opacity: 0.75,
            dashArray: obs.type === 'baseline_vector' ? undefined : '4 4'
          });

          const measuredNum = 'measured' in obs ? obs.measured : obs.measuredValue;
          polyline.bindTooltip(
            `<b>${obs.id}</b> (${obs.type})<br/>${obs.fromStation} &rarr; ${obs.toStation}<br/>ค่ารังวัด: ${typeof measuredNum === 'number' ? measuredNum.toFixed(3) : '-'} m`,
            { sticky: true }
          );

          group.addLayer(polyline);
        }
      });
    }

    // Auto-fit Bounds with generous padding
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
    }
  }, [stations, observations, utmZone, showEllipses, showLines, scaleMultiplier]);

  const handleFitBounds = () => {
    if (!mapInstanceRef.current || stations.length === 0) return;
    const bounds = L.latLngBounds([]);
    stations.forEach((stn) => {
      try {
        const geo = inverseUtmToWgs84(stn.easting, stn.northing, utmZone);
        bounds.extend([geo.lat, geo.lng]);
      } catch {}
    });
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  return (
    <div className={`fusion-card transition-all overflow-hidden flex flex-col ${
      isFullscreen 
        ? 'fixed inset-3 z-50 shadow-2xl border-2 border-[var(--accent)] bg-[var(--surface)]' 
        : 'p-4 sm:p-5 space-y-3'
    }`}>
      
      {/* ── Map Header Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-3)] border border-[var(--border)]">
                UTM Zone {utmZone}N
              </span>
            </h3>
            <p className="text-[11px] text-[var(--text-3)]">
              แสดงตำแหน่งหมุดจริง เส้นโครงข่ายรังวัด และวงรีความคลาดเคลื่อน 95% ซ้อนทับภาพถ่ายดาวเทียม
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Basemap Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setBasemapType('satellite')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                basemapType === 'satellite'
                  ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              ดาวเทียม
            </button>
            <button
              type="button"
              onClick={() => setBasemapType('street')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                basemapType === 'street'
                  ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              แผนที่ถนน
            </button>
          </div>

          {/* Ellipse Toggle & Multiplier */}
          <button
            type="button"
            onClick={() => setShowEllipses(!showEllipses)}
            className={`px-2.5 py-1 rounded-[var(--btn-radius)] border text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
              showEllipses
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-500 dark:text-cyan-400'
                : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-3)]'
            }`}
            title="เปิด/ปิดการแสดงผลวงรีความคลาดเคลื่อน 95%"
          >
            {showEllipses ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>วงรี 95%</span>
          </button>

          {showEllipses && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-[var(--btn-radius)] bg-[var(--surface-2)] border border-[var(--border)] text-[10px] font-mono">
              <span className="text-[var(--text-3)]">Scale:</span>
              <select
                value={scaleMultiplier}
                onChange={(e) => setScaleMultiplier(Number(e.target.value))}
                className="bg-transparent text-[var(--accent)] font-bold cursor-pointer focus:outline-none"
              >
                <option value={1000} className="bg-[var(--surface)] text-[var(--text-1)]">1,000x</option>
                <option value={2500} className="bg-[var(--surface)] text-[var(--text-1)]">2,500x</option>
                <option value={5000} className="bg-[var(--surface)] text-[var(--text-1)]">5,000x</option>
                <option value={10000} className="bg-[var(--surface)] text-[var(--text-1)]">10,000x</option>
              </select>
            </div>
          )}

          {/* Fit Bounds */}
          <button
            type="button"
            onClick={handleFitBounds}
            className="p-1.5 rounded-[var(--btn-radius)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border)] transition-colors"
            title="รีเซ็ตมุมมองโครงข่าย (Fit Bounds)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-[var(--btn-radius)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border)] transition-colors"
            title={isFullscreen ? 'ย่อหน้าต่างกลับ' : 'ขยายเต็มหน้าจอ'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Map Leaflet Canvas Container ── */}
      <div 
        className="relative w-full rounded-xl overflow-hidden border border-[var(--border)] shadow-inner"
        style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '420px' }}
      >
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[400] p-2.5 rounded-xl bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] text-[10px] space-y-1.5 shadow-lg select-none">
          <div className="font-bold text-[var(--text-1)] font-mono border-b border-[var(--border)] pb-1">
            NETWORK LEGEND
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shrink-0" />
            <span className="text-[var(--text-2)]">หมุดหลักฐานอ้างอิง (Fixed Control)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 border border-white shrink-0" />
            <span className="text-[var(--text-2)]">หมุดปรับแก้ (Adjusted Station)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-2.5 rounded border border-cyan-400 bg-cyan-400/25 shrink-0" />
            <span className="text-[var(--text-2)]">วงรีความคลาดเคลื่อน 95% ({scaleMultiplier}x)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-emerald-500 shrink-0" />
            <span className="text-[var(--text-2)]">เส้นฐานดาวเทียม GNSS Baseline</span>
          </div>
        </div>
      </div>

    </div>
  );
};
