import React, { useState, useRef, useMemo } from 'react';
import { 
  Network, 
  Ruler, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  MapPin, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Compass, 
  Satellite, 
  Radio, 
  ArrowRight,
  TrendingUp,
  Download,
  ShieldCheck,
  Layers,
  ChevronDown,
  Settings,
  Upload,
  Trash2,
  X,
  Play,
  Crosshair,
  Activity,
  FileText
} from 'lucide-react';
import {
  adjust1DLevelingNetwork,
  adjust2DNetwork,
  type LevelingPoint,
  type LevelingObservation,
  type LevelingAdjustmentResult,
  type Station2D,
  type Observation2D,
  type AdjustedObs2D,
  type Network2DAdjustmentResult,
  type AdjustedStation2D
} from '../../utils/least-squares';
import {
  parseRinexText,
  type RinexParseResult,
  type SatelliteTrack
} from '../../utils/rinex-parser';
import {
  solveStaticBaseline,
  type BaselineSolution
} from '../../utils/gnss-baseline';
import { 
  parseHcnBuffer, 
  isHcnBuffer, 
  type HcnParseResult 
} from '../../utils/hcn-parser';
import { 
  parseEmlidPosText, 
  isEmlidPosText, 
  type EmlidPosParseResult 
} from '../../utils/emlid-pos-parser';
import { EmbeddedNetworkMap } from './EmbeddedNetworkMap';
import { NetworkAdjustmentInputTable } from './NetworkAdjustmentInputTable';
import { exportToCsv } from '../../utils/csv-export';
import { inverseUtmToWgs84, forwardWgs84ToUtm } from '../../core/projections';
import { useSurveyStore } from '../../store/useSurveyStore';

interface NetworkAdjustmentProps {
  onPlotOnMap?: (lat: number, lng: number, label: string) => void;
}

export type ProcessingMode = 'static' | 'kinematic' | 'adjustment' | 'rinex';
export type CanvasView = 'map' | 'skyplot' | 'adjustment' | 'report';

export const NetworkAdjustment: React.FC<NetworkAdjustmentProps> = ({ onPlotOnMap }) => {
  // ── Mode & View State ──
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('static');
  const [canvasView, setCanvasView] = useState<CanvasView>('map');
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Processing Settings ──
  const [elevMask, setElevMask] = useState<number>(15);
  const [snrThreshold, setSnrThreshold] = useState<number>(35);

  // ── File References & Ingestion State ──
  const baseFileInputRef = useRef<HTMLInputElement>(null);
  const roverFileInputRef = useRef<HTMLInputElement>(null);
  const navFileInputRef = useRef<HTMLInputElement>(null);
  const hcnFileInputRef = useRef<HTMLInputElement>(null);

  const [baseRinex, setBaseRinex] = useState<RinexParseResult | null>(null);
  const [roverRinex, setRoverRinex] = useState<RinexParseResult | null>(null);
  const [baseFileName, setBaseFileName] = useState<string>('');
  const [roverFileName, setRoverFileName] = useState<string>('');
  const [navFileName, setNavFileName] = useState<string>('');

  const [baseHcn, setBaseHcn] = useState<HcnParseResult | null>(null);
  const [roverHcn, setRoverHcn] = useState<HcnParseResult | null>(null);
  const [lastEmlidPos, setLastEmlidPos] = useState<EmlidPosParseResult | null>(null);

  // ── Station Metadata & Antenna Heights (Inline Editable) ──
  const [baseAntennaHeight, setBaseAntennaHeight] = useState<number>(1.7085);
  const [roverAntennaHeight, setRoverAntennaHeight] = useState<number>(1.8000);
  const [isEditingBaseAntenna, setIsEditingBaseAntenna] = useState<boolean>(false);
  const [isEditingRoverAntenna, setIsEditingRoverAntenna] = useState<boolean>(false);

  const [baseCoords, setBaseCoords] = useState<{ lat: number; lng: number; height: number }>({
    lat: 13.847600,
    lng: 100.569600,
    height: 18.524
  });
  const [isEditingBaseCoords, setIsEditingBaseCoords] = useState<boolean>(false);

  // ── Drag & Drop States ──
  const [isBaseDragging, setIsBaseDragging] = useState(false);
  const [isRoverDragging, setIsRoverDragging] = useState(false);

  // ── Solution State ──
  const [baselineSolution, setBaselineSolution] = useState<BaselineSolution | null>(null);
  const [baselineError, setBaselineError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // ── Notifications ──
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // ── Skyplot Filter ──
  const [selectedStationView, setSelectedStationView] = useState<'base' | 'rover'>('base');
  const [constellationFilter, setConstellationFilter] = useState<string>('ALL');

  // ── Network Adjustment State (Zustand Store) ──
  const {
    networkAdjustmentMode: adjustmentMode,
    networkStations2D: stations2D,
    networkObs2D: obs2D,
    networkPoints1D: points1D,
    networkObs1D: obs1D,
    setNetworkAdjustmentMode: setAdjustmentMode,
    setNetworkStations2D: setStations2D,
    setNetworkObs2D: setObs2D,
    setNetworkPoints1D: setPoints1D,
    setNetworkObs1D: setObs1D,
    resetNetworkToSample,
    clearNetwork
  } = useSurveyStore();

  const [result2D, setResult2D] = useState<Network2DAdjustmentResult | null>(() => {
    if (stations2D.length === 0 || obs2D.length === 0) return null;
    try {
      return adjust2DNetwork(stations2D, obs2D);
    } catch {
      return null;
    }
  });

  const [result1D, setResult1D] = useState<LevelingAdjustmentResult | null>(() => {
    if (points1D.length === 0 || obs1D.length === 0) return null;
    try {
      return adjust1DLevelingNetwork(points1D, obs1D);
    } catch {
      return null;
    }
  });
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // FILE PROCESSING & PARSING
  // ─────────────────────────────────────────────────────────────────────────
  const processFile = async (file: File, target: 'base' | 'rover' | 'nav' | 'hcn') => {
    setBannerMessage(null);
    setBaselineError(null);

    // If existing store network is just sample data (STN-1, STN-2, P-A, P-B), cleanly purge it
    if (stations2D.some(s => ['STN-1', 'STN-2', 'P-A', 'P-B'].includes(s.id))) {
      clearNetwork();
      setResult2D(null);
    }

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      // 1. Navigation Ephemeris File
      if (target === 'nav' || ext === 'nav' || ext.endsWith('p') || ext.endsWith('n')) {
        setNavFileName(file.name);
        setBannerMessage({ text: `โหลดไฟล์นำทางดาวเทียม (Broadcast Ephemeris) ${file.name} เรียบร้อย`, type: 'success' });
        return;
      }

      // 2. CHCNAV HCN Binary Files
      if (ext === 'hcn' || ext === 'hrc') {
        const buffer = await file.arrayBuffer();
        if (!isHcnBuffer(buffer)) {
          throw new Error('ไฟล์นี้ไม่มีรูปแบบหัวตารางของ CHCNAV ที่ถูกต้อง');
        }
        const hcnResult = parseHcnBuffer(buffer, file.name);

        if (target === 'base' || target === 'hcn') {
          setBaseHcn(hcnResult);
          setBaseRinex(hcnResult.asRinex);
          setBaseFileName(file.name);
          if (hcnResult.metadata.antennaHeight) {
            setBaseAntennaHeight(hcnResult.metadata.antennaHeight);
          }
          if (hcnResult.asRinex.header.approxGeodetic) {
            setBaseCoords(hcnResult.asRinex.header.approxGeodetic);
          }
        } else {
          setRoverHcn(hcnResult);
          setRoverRinex(hcnResult.asRinex);
          setRoverFileName(file.name);
          if (hcnResult.metadata.antennaHeight) {
            setRoverAntennaHeight(hcnResult.metadata.antennaHeight);
          }
        }

        setBannerMessage({
          text: `โหลดหมุด ${hcnResult.metadata.markerName} จากไฟล์ CHCNAV (${hcnResult.metadata.receiverType || 'GNSS'}) เรียบร้อย`,
          type: 'success'
        });
        return;
      }

      // 3. Emlid Studio / RTKLIB .pos Solution Files
      if (ext === 'pos') {
        const text = await file.text();
        if (isEmlidPosText(text)) {
          const posResult = parseEmlidPosText(text, file.name);
          setLastEmlidPos(posResult);
          setRoverFileName(file.name);

          // Synthesize Baseline Solution directly from .pos
          const baseName = posResult.baseFile ? posResult.baseFile.replace(/\.[^/.]+$/, '').toUpperCase() : 'BASE_MASTER';
          const rovName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
          const synthSol = posResult.asBaselineSolution(baseName, rovName);
          setBaselineSolution(synthSol);

          // Synthesize Rover RINEX result for UI
          setRoverRinex({
            header: {
              version: '3.04',
              fileType: 'O (Emlid Studio .pos)',
              markerName: rovName,
              approxGeodetic: {
                lat: posResult.computedPosition.lat,
                lng: posResult.computedPosition.lng,
                height: posResult.computedPosition.height
              },
              obsTypes: ['L1', 'L2', 'C1', 'C2']
            },
            totalEpochs: posResult.totalEpochsCount,
            durationMinutes: Math.max(15, Math.round(posResult.totalEpochsCount / 60)),
            constellationsDetected: ['GPS', 'BeiDou', 'GLONASS', 'Galileo'],
            satellitesTracked: [],
            averageSnr: 46.0,
            cycleSlipCount: 0,
            healthStatus: posResult.overallStatus === 'FIXED' ? 'HEALTHY' : 'DEGRADED'
          });

          setBannerMessage({
            text: `นำเข้าโซลูชัน Emlid Studio .pos: สถานะ ${posResult.overallStatus} (Ratio: ${posResult.bestRatio}) สำเร็จ`,
            type: 'success'
          });
          return;
        }
      }

      // 4. Standard Text RINEX (2.xx / 3.xx)
      const text = await file.text();
      if (isEmlidPosText(text)) {
        const posResult = parseEmlidPosText(text, file.name);
        setLastEmlidPos(posResult);
        const synthSol = posResult.asBaselineSolution('BASE_MASTER', file.name.replace(/\.[^/.]+$/, '').toUpperCase());
        setBaselineSolution(synthSol);
        setBannerMessage({ text: `นำเข้าโซลูชัน .pos สำเร็จ`, type: 'success' });
        return;
      }

      const parsed = parseRinexText(text);
      if (target === 'base') {
        setBaseHcn(null);
        setBaseRinex(parsed);
        setBaseFileName(file.name);
        if (parsed.header.antennaDelta?.h) {
          setBaseAntennaHeight(parsed.header.antennaDelta.h);
        }
        if (parsed.header.approxGeodetic) {
          setBaseCoords(parsed.header.approxGeodetic);
        }
      } else {
        setRoverHcn(null);
        setRoverRinex(parsed);
        setRoverFileName(file.name);
        if (parsed.header.antennaDelta?.h) {
          setRoverAntennaHeight(parsed.header.antennaDelta.h);
        }
      }

      setBannerMessage({
        text: `โหลดไฟล์ RINEX หมุด ${parsed.header.markerName} (${file.name}) สำเร็จ`,
        type: 'success'
      });
    } catch (err: any) {
      setBannerMessage({
        text: `ไม่สามารถอ่านไฟล์ ${file.name}: ${err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`,
        type: 'error'
      });
    }
  };

  const handleDrop = (e: React.DragEvent, target: 'base' | 'rover') => {
    e.preventDefault();
    if (target === 'base') setIsBaseDragging(false);
    else setIsRoverDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file, target);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // BASELINE SOLVER (PROCESS BUTTON)
  // ─────────────────────────────────────────────────────────────────────────
  const handleProcessBaseline = () => {
    setBaselineError(null);
    if (!baseRinex || !roverRinex) {
      setBaselineError('กรุณาเลือกหรือนำเข้าไฟล์ของทั้งสถานีฐาน (Base) และสถานีรังวัด (Rover) ก่อนประมวลผล');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const sol = solveStaticBaseline(baseRinex, roverRinex, {
          elevationMaskDeg: elevMask,
          snrThresholdDbHz: snrThreshold
        });
        setBaselineSolution(sol);
        setBannerMessage({
          text: `ประมวลผลเวกเตอร์ฐานสำเร็จ: สถานะ ${sol.status} (Ratio: ${sol.ratioTest.toFixed(1)}) ระยะทาง ${sol.vectorENU.distance2D.toFixed(3)} m`,
          type: 'success'
        });
        // Stay on map or switch to map to display vector
        setCanvasView('map');
      } catch (err: any) {
        setBaselineError(err?.message || 'เกิดข้อผิดพลาดในการคำนวณเวกเตอร์ฐาน');
      } finally {
        setIsProcessing(false);
      }
    }, 250);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSFER TO 2D LEAST SQUARES ADJUSTMENT
  // ─────────────────────────────────────────────────────────────────────────
  const handleTransferToAdjustment = () => {
    if (!baselineSolution) return;

    const baseName = baselineSolution.baseStation;
    const roverName = baselineSolution.roverStation;

    let baseRefE = 669500.0;
    let baseRefN = 1531000.0;
    if (baseRinex?.header.approxGeodetic) {
      const utm = forwardWgs84ToUtm(baseRinex.header.approxGeodetic.lat, baseRinex.header.approxGeodetic.lng);
      baseRefE = Math.round(utm.easting * 1000) / 1000;
      baseRefN = Math.round(utm.northing * 1000) / 1000;
    }

    const isSampleNetwork = stations2D.some(s => ['STN-1', 'STN-2', 'P-A', 'P-B'].includes(s.id));
    const updatedStations = isSampleNetwork ? [] : [...stations2D];
    const existingBase = updatedStations.find(s => s.id === baseName);
    if (!existingBase) {
      updatedStations.push({
        id: baseName,
        isFixed: true,
        knownE: baseRefE,
        knownN: baseRefN
      });
    }

    const existingRover = updatedStations.find(s => s.id === roverName);
    if (!existingRover) {
      updatedStations.push({
        id: roverName,
        isFixed: false,
        approxE: Math.round((baseRefE + baselineSolution.vectorENU.dE) * 1000) / 1000,
        approxN: Math.round((baseRefN + baselineSolution.vectorENU.dN) * 1000) / 1000
      });
    }

    const newVectorObs: Observation2D = {
      id: `GNSS_${baselineSolution.id}`,
      type: 'baseline_vector',
      fromStation: baseName,
      toStation: roverName,
      measuredValue: baselineSolution.vectorENU.dE,
      measuredValue2: baselineSolution.vectorENU.dN,
      stdDev: Math.max(0.002, baselineSolution.stdDevMm.dE / 1000.0),
      stdDev2: Math.max(0.002, baselineSolution.stdDevMm.dN / 1000.0)
    };

    const updatedObs = [
      ...(isSampleNetwork ? [] : obs2D.filter(o => o.id !== newVectorObs.id)),
      newVectorObs
    ];
    setStations2D(updatedStations);
    setObs2D(updatedObs);

    try {
      const res = adjust2DNetwork(updatedStations, updatedObs);
      setResult2D(res);
      setBannerMessage({
        text: `เชื่อมโยงเวกเตอร์ ${baselineSolution.id} เข้าสู่การปรับแก้โครงข่าย 2D เรียบร้อย`,
        type: 'success'
      });
      setCanvasView('map');
    } catch (err: any) {
      setAdjustmentError(String(err));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SAMPLE & CLEAR ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  const handleClearAll = () => {
    setBaseRinex(null);
    setRoverRinex(null);
    setBaseFileName('');
    setRoverFileName('');
    setNavFileName('');
    setBaseHcn(null);
    setRoverHcn(null);
    setLastEmlidPos(null);
    setBaselineSolution(null);
    setBaselineError(null);
    setAdjustmentError(null);
    clearNetwork();
    setResult2D(null);
    setResult1D(null);
    setBannerMessage({
      text: 'ล้างข้อมูลทั้งหมดในพื้นที่ทำงานเรียบร้อย (Blank Workspace)',
      type: 'info'
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // EXPORT UTILITIES
  // ─────────────────────────────────────────────────────────────────────────
  const handleExportCsv = () => {
    if (!result2D) return;
    exportToCsv({
      filename: `mesurv_adjusted_network_${new Date().toISOString().slice(0, 10)}`,
      headers: [
        'Station_ID', 'Status', 'Easting_m', 'Northing_m', 'SigmaE_mm', 'SigmaN_mm',
        'SemiMajor_a_mm', 'SemiMinor_b_mm', 'Orientation_deg', 'Conf95_a95_mm'
      ],
      rows: result2D.stations.map(s => [
        s.id,
        s.isFixed ? 'FIXED' : 'ADJUSTED',
        s.easting.toFixed(4),
        s.northing.toFixed(4),
        s.sigmaEMm.toFixed(1),
        s.sigmaNMm.toFixed(1),
        s.errorEllipse?.semiMajorAxisMm.toFixed(1) ?? '',
        s.errorEllipse?.semiMinorAxisMm.toFixed(1) ?? '',
        s.errorEllipse?.orientationDeg.toFixed(1) ?? '',
        s.errorEllipse?.conf95MajorMm.toFixed(1) ?? ''
      ])
    });
  };

  const handleExportGeoJson = () => {
    if (!result2D) return;
    const features = result2D.stations.map(s => {
      const geo = inverseUtmToWgs84(s.easting, s.northing, 47);
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [geo.lng, geo.lat]
        },
        properties: {
          id: s.id,
          isFixed: s.isFixed,
          easting: s.easting,
          northing: s.northing,
          sigmaE_mm: s.sigmaEMm,
          sigmaN_mm: s.sigmaNMm,
          a95_mm: s.errorEllipse?.conf95MajorMm,
          b95_mm: s.errorEllipse?.conf95MinorMm,
          theta_deg: s.errorEllipse?.orientationDeg
        }
      };
    });

    const geoJson = {
      type: 'FeatureCollection',
      name: 'MESURV_Adjusted_Network',
      features
    };

    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mesurv_network_stations_${new Date().toISOString().slice(0, 10)}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleCopyReport = () => {
    let report = `=== MESURV UNIFIED GNSS & NETWORK ADJUSTMENT REPORT ===\n`;
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Standards: RTSD & CKST-PL JV (Ch. Karnchang Engineering)\n\n`;

    if (baselineSolution) {
      report += `[1. GNSS BASELINE PROCESSING]\n`;
      report += `Baseline: ${baselineSolution.id}\n`;
      report += `Status: ${baselineSolution.status} (Ratio Test = ${baselineSolution.ratioTest.toFixed(2)})\n`;
      report += `Common Satellites: ${baselineSolution.commonSatellites}\n`;
      report += `Vector ENU: dE = ${baselineSolution.vectorENU.dE.toFixed(4)} m, dN = ${baselineSolution.vectorENU.dN.toFixed(4)} m, dU = ${baselineSolution.vectorENU.dU.toFixed(4)} m\n`;
      report += `Distance: 2D = ${baselineSolution.vectorENU.distance2D.toFixed(3)} m, 3D = ${baselineSolution.vectorENU.distance3D.toFixed(3)} m | Azimuth = ${baselineSolution.vectorENU.azimuthDeg.toFixed(2)}°\n`;
      report += `Precision: sigmaE = ${baselineSolution.stdDevMm.dE} mm, sigmaN = ${baselineSolution.stdDevMm.dN} mm, sigmaU = ${baselineSolution.stdDevMm.dU} mm\n\n`;
    }

    if (result2D) {
      report += `[2. 2D GEODETIC NETWORK ADJUSTMENT (LEAST SQUARES)]\n`;
      report += `Convergence: ${result2D.converged} in ${result2D.iterations} iterations\n`;
      report += `Degrees of Freedom (r): ${result2D.dof} | Std Error (sigma0): ${result2D.sigma0.toFixed(4)}\n`;
      report += `Chi-Square Test: ${result2D.chiSquarePassed ? 'PASSED (95%)' : 'WARNING'}\n`;
      report += `ADJUSTED STATIONS & 95% ERROR ELLIPSES:\n`;
      result2D.stations.forEach(s => {
        report += ` - ${s.id} ${s.isFixed ? '[FIXED]' : ''}: E=${s.easting.toFixed(4)}m, N=${s.northing.toFixed(4)}m`;
        if (s.errorEllipse) {
          report += ` | a=${s.errorEllipse.semiMajorAxisMm.toFixed(1)}mm, b=${s.errorEllipse.semiMinorAxisMm.toFixed(1)}mm, theta=${s.errorEllipse.orientationDeg.toFixed(1)}°, 95% a95=${s.errorEllipse.conf95MajorMm.toFixed(1)}mm`;
        }
        report += `\n`;
      });
    }

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // COMPOSING STATIONS & OBSERVATIONS FOR EMBEDDED MAP
  // ─────────────────────────────────────────────────────────────────────────
  const currentUtmZone: 47 | 48 = useMemo(() => {
    if (baseCoords && typeof baseCoords.lng === 'number' && !isNaN(baseCoords.lng)) {
      return baseCoords.lng >= 102.0 ? 48 : 47;
    }
    return 47;
  }, [baseCoords]);

  const displayStations: AdjustedStation2D[] = useMemo(() => {
    // 1. Static and Kinematic GNSS modes: strictly isolated to active Base and Rover!
    // Never show unrelated 2D traverse networks, previous samples, or other tools.
    if (processingMode === 'static' || processingMode === 'kinematic') {
      const stns: AdjustedStation2D[] = [];
      if (baseRinex?.header.approxGeodetic) {
        const baseUtm = forwardWgs84ToUtm(baseCoords.lat, baseCoords.lng);
        const baseName = baseRinex.header.markerName || 'BASE';
        stns.push({
          id: baseName,
          isFixed: true,
          easting: baseUtm.easting,
          northing: baseUtm.northing,
          sigmaEMm: 0.5,
          sigmaNMm: 0.5
        });

        if (baselineSolution) {
          const roverName = baselineSolution.roverStation || roverRinex?.header.markerName || 'ROVER';
          stns.push({
            id: roverName,
            isFixed: false,
            easting: baseUtm.easting + baselineSolution.vectorENU.dE,
            northing: baseUtm.northing + baselineSolution.vectorENU.dN,
            sigmaEMm: baselineSolution.stdDevMm.dE,
            sigmaNMm: baselineSolution.stdDevMm.dN,
            errorEllipse: {
              semiMajorAxisMm: baselineSolution.stdDevMm.dN * 2.45,
              semiMinorAxisMm: baselineSolution.stdDevMm.dE * 2.45,
              orientationDeg: baselineSolution.vectorENU.azimuthDeg,
              conf95MajorMm: baselineSolution.stdDevMm.dN * 2.45,
              conf95MinorMm: baselineSolution.stdDevMm.dE * 2.45
            }
          });
        } else if (roverRinex?.header.approxGeodetic) {
          const rovUtm = forwardWgs84ToUtm(roverRinex.header.approxGeodetic.lat, roverRinex.header.approxGeodetic.lng);
          const roverName = roverRinex.header.markerName || 'ROVER';
          stns.push({
            id: roverName,
            isFixed: false,
            easting: rovUtm.easting,
            northing: rovUtm.northing,
            sigmaEMm: 2.5,
            sigmaNMm: 2.5
          });
        }
      }
      return stns;
    }

    // 2. Network Adjustment Mode:
    // Only display 2D network adjustment result stations when user is in 'adjustment' mode!
    if (result2D && result2D.stations.length > 0) {
      return result2D.stations;
    }
    return [];
  }, [processingMode, baseRinex, roverRinex, baselineSolution, baseCoords, result2D]);

  const displayObservations: (Observation2D | AdjustedObs2D)[] = useMemo(() => {
    // 1. Static and Kinematic GNSS modes: strictly the baseline vector
    if (processingMode === 'static' || processingMode === 'kinematic') {
      if (baselineSolution && baseRinex) {
        return [{
          id: `GNSS_${baselineSolution.id}`,
          type: 'baseline_vector',
          fromStation: baselineSolution.baseStation || baseRinex.header.markerName || 'BASE',
          toStation: baselineSolution.roverStation || roverRinex?.header.markerName || 'ROVER',
          measuredValue: baselineSolution.vectorENU.dE,
          measuredValue2: baselineSolution.vectorENU.dN,
          stdDev: baselineSolution.stdDevMm.dE / 1000,
          stdDev2: baselineSolution.stdDevMm.dN / 1000
        }];
      }
      return [];
    }

    // 2. Network Adjustment Mode:
    if (result2D && result2D.observations.length > 0) {
      return result2D.observations;
    }
    return [];
  }, [processingMode, baselineSolution, baseRinex, roverRinex, result2D]);

  // Skyplot Active Satellites
  const activeSkyplotRinex = selectedStationView === 'base' ? baseRinex : roverRinex;
  const filteredSatellites = activeSkyplotRinex ? activeSkyplotRinex.satellitesTracked.filter(s => {
    if (constellationFilter === 'ALL') return true;
    return s.constellation.toUpperCase() === constellationFilter;
  }) : [];

  return (
    <div className="space-y-4">
      
      {/* ── Banner Notification ── */}
      {bannerMessage && (
        <div className={`p-2.5 px-3 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-xs ${
          bannerMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
            : bannerMessage.type === 'error'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
            : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-2)]'
        }`}>
          <div className="flex items-center gap-2">
            {bannerMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {bannerMessage.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {bannerMessage.type === 'info' && <Radio className="w-4 h-4 shrink-0" />}
            <span>{bannerMessage.text}</span>
          </div>
          <button type="button" onClick={() => setBannerMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* UNIFIED SPLIT VIEW: LEFT CONTROL DECK + RIGHT CANVAS               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* LEFT CONTROL DECK (Emlid Studio Side Deck)                         */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-3">
          
          <div className="fusion-card p-4 space-y-3.5">
            
            {/* Mode Selector Dropdown (Styled after Emlid Studio 1.11) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-xs font-bold text-[var(--text-1)] transition-all micro-press"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
                    <Crosshair className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    {processingMode === 'static' && 'Static processing'}
                    {processingMode === 'kinematic' && 'Kinematic'}
                    {processingMode === 'adjustment' && 'Network Adjustment'}
                    {processingMode === 'rinex' && 'Convert to RINEX'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[var(--text-3)] transition-transform ${modeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {modeDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-full z-30 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl p-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => { setProcessingMode('static'); setModeDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-bold text-left transition-colors ${
                      processingMode === 'static' ? 'bg-sky-500/15 text-sky-500' : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <Crosshair className="w-4 h-4" />
                    <span>Static processing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setProcessingMode('kinematic'); setModeDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-bold text-left transition-colors ${
                      processingMode === 'kinematic' ? 'bg-sky-500/15 text-sky-500' : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Kinematic</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setProcessingMode('adjustment'); setModeDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-bold text-left transition-colors ${
                      processingMode === 'adjustment' ? 'bg-sky-500/15 text-sky-500' : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <Network className="w-4 h-4" />
                    <span>Network Adjustment (2D / 1D)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setProcessingMode('rinex'); setModeDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-bold text-left transition-colors ${
                      processingMode === 'rinex' ? 'bg-sky-500/15 text-sky-500' : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Convert to RINEX (HCN to RNX)</span>
                  </button>
                </div>
              )}
            </div>

            {/* ── STATIC & KINEMATIC PROCESSING CONTROLS ── */}
            {(processingMode === 'static' || processingMode === 'kinematic') && (
              <div className="space-y-3">
                
                {/* 1. Base Station Slot */}
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsBaseDragging(true); }}
                  onDragLeave={() => setIsBaseDragging(false)}
                  onDrop={(e) => handleDrop(e, 'base')}
                  className={`p-3 rounded-xl border transition-all ${
                    isBaseDragging 
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5' 
                      : 'border-[var(--border)] bg-[var(--surface-2)]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-1)]">
                      <span className={`w-2 h-2 rounded-full ${baseRinex ? 'bg-emerald-500' : 'bg-[var(--text-3)]'}`} />
                      <span>Base</span>
                    </div>
                    {baseRinex && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface)] text-emerald-500 border border-emerald-500/20 font-bold">
                        {baseRinex.header.markerName}
                      </span>
                    )}
                  </div>

                  {baseRinex ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                          <span className="font-mono font-semibold truncate text-[11px]">{baseFileName || 'Base Station'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setBaseRinex(null); setBaseFileName(''); setBaseHcn(null); }}
                          className="p-1 text-[var(--text-3)] hover:text-rose-500 transition-colors"
                          title="ลบไฟล์ Base"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Coordinates Readout */}
                      <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] space-y-1 font-mono">
                        <div className="flex justify-between text-[var(--text-3)]">
                          <span>Latitude:</span>
                          <span className="text-[var(--text-1)] font-semibold">{baseCoords.lat.toFixed(6)}° N</span>
                        </div>
                        <div className="flex justify-between text-[var(--text-3)]">
                          <span>Longitude:</span>
                          <span className="text-[var(--text-1)] font-semibold">{baseCoords.lng.toFixed(6)}° E</span>
                        </div>
                        <div className="flex justify-between text-[var(--text-3)]">
                          <span>Ellip. height:</span>
                          <span className="text-[var(--text-1)] font-semibold">{baseCoords.height.toFixed(4)} m</span>
                        </div>
                      </div>

                      {/* Antenna Height Line */}
                      <div className="flex items-center justify-between text-xs text-[var(--text-2)] px-1">
                        {isEditingBaseAntenna ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="text-[11px]">เสา:</span>
                            <input
                              type="number"
                              step="0.0001"
                              value={baseAntennaHeight}
                              onChange={(e) => setBaseAntennaHeight(parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--accent)] text-xs font-mono font-bold"
                            />
                            <span className="text-[11px]">m.</span>
                            <button
                              type="button"
                              onClick={() => setIsEditingBaseAntenna(false)}
                              className="px-2 py-0.5 rounded bg-[var(--accent)] text-black dark:text-white font-bold text-[10px]"
                            >
                              Done
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-[11px]">Antenna height is <b>{baseAntennaHeight.toFixed(4)}</b> m.</span>
                            <button
                              type="button"
                              onClick={() => setIsEditingBaseAntenna(true)}
                              className="text-[11px] text-sky-500 hover:underline font-semibold"
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => baseFileInputRef.current?.click()}
                      className="w-full py-4 px-2 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-sky-500 bg-[var(--surface)]/50 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                    >
                      <Upload className="w-4 h-4 text-[var(--text-3)]" />
                      <span className="text-xs font-semibold text-[var(--text-1)]">เลือกหรือลากไฟล์สถานีฐาน</span>
                      <span className="text-[10px] text-[var(--text-3)]">.HCN, .RNX, .OBS</span>
                    </button>
                  )}

                  <input
                    ref={baseFileInputRef}
                    type="file"
                    accept=".obs,.rnx,.txt,.hcn,.hrc,.*o,.*d"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processFile(file, 'base');
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </div>

                {/* 2. Rover Station Slot */}
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsRoverDragging(true); }}
                  onDragLeave={() => setIsRoverDragging(false)}
                  onDrop={(e) => handleDrop(e, 'rover')}
                  className={`p-3 rounded-xl border transition-all ${
                    isRoverDragging 
                      ? 'border-cyan-400 bg-cyan-400/5' 
                      : 'border-[var(--border)] bg-[var(--surface-2)]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-1)]">
                      <span className={`w-2 h-2 rounded-full ${roverRinex ? 'bg-cyan-400' : 'bg-[var(--text-3)]'}`} />
                      <span>Rover</span>
                    </div>
                    {roverRinex && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface)] text-cyan-400 border border-cyan-400/20 font-bold">
                        {roverRinex.header.markerName}
                      </span>
                    )}
                  </div>

                  {roverRinex ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="font-mono font-semibold truncate text-[11px]">{roverFileName || 'Rover Station'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setRoverRinex(null); setRoverFileName(''); setRoverHcn(null); setLastEmlidPos(null); }}
                          className="p-1 text-[var(--text-3)] hover:text-rose-500 transition-colors"
                          title="ลบไฟล์ Rover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Antenna Height Line */}
                      <div className="flex items-center justify-between text-xs text-[var(--text-2)] px-1">
                        {isEditingRoverAntenna ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="text-[11px]">เสา:</span>
                            <input
                              type="number"
                              step="0.0001"
                              value={roverAntennaHeight}
                              onChange={(e) => setRoverAntennaHeight(parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--accent)] text-xs font-mono font-bold"
                            />
                            <span className="text-[11px]">m.</span>
                            <button
                              type="button"
                              onClick={() => setIsEditingRoverAntenna(false)}
                              className="px-2 py-0.5 rounded bg-[var(--accent)] text-black dark:text-white font-bold text-[10px]"
                            >
                              Done
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-[11px]">Antenna height is <b>{roverAntennaHeight.toFixed(4)}</b> m.</span>
                            <button
                              type="button"
                              onClick={() => setIsEditingRoverAntenna(true)}
                              className="text-[11px] text-sky-500 hover:underline font-semibold"
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => roverFileInputRef.current?.click()}
                      className="w-full py-4 px-2 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-cyan-400 bg-[var(--surface)]/50 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                    >
                      <Upload className="w-4 h-4 text-[var(--text-3)]" />
                      <span className="text-xs font-semibold text-[var(--text-1)]">เลือกหรือลากไฟล์สถานีรังวัด</span>
                      <span className="text-[10px] text-[var(--text-3)]">.HCN, .RNX, .POS</span>
                    </button>
                  )}

                  <input
                    ref={roverFileInputRef}
                    type="file"
                    accept=".obs,.rnx,.txt,.hcn,.hrc,.pos,.*o,.*d"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processFile(file, 'rover');
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </div>

                {/* 3. Navigation (Broadcast Ephemeris) Slot */}
                <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-2)]">
                    <span>Navigation (Ephemeris)</span>
                    <span className="text-[9px] text-[var(--text-3)] font-normal">Optional</span>
                  </div>

                  {navFileName ? (
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs">
                      <span className="font-mono text-[10px] text-[var(--text-1)] truncate">{navFileName}</span>
                      <button
                        type="button"
                        onClick={() => setNavFileName('')}
                        className="p-1 text-[var(--text-3)] hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navFileInputRef.current?.click()}
                      className="w-full py-1.5 px-2 rounded-lg border border-dashed border-[var(--border)] hover:border-[var(--accent)] text-center text-[10px] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
                    >
                      + เพิ่มไฟล์นำทาง (.nav, .26p)
                    </button>
                  )}

                  <input
                    ref={navFileInputRef}
                    type="file"
                    accept=".nav,.26p,.*p,.*n"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processFile(file, 'nav');
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </div>

                {/* 4. Action & Settings Bar (Gear + Big Blue Process Button) */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className={`p-2.5 rounded-xl border transition-colors micro-press ${
                      settingsOpen 
                        ? 'bg-[var(--accent)] text-black dark:text-white border-[var(--accent)]' 
                        : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text-1)] border-[var(--border)]'
                    }`}
                    title="การตั้งค่าพารามิเตอร์การประมวลผล (Settings)"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleProcessBaseline}
                    disabled={!baseRinex || !roverRinex || isProcessing}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-sky-500/25 transition-all micro-press"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>กำลังประมวลผล...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Process</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Settings Popover */}
                {settingsOpen && (
                  <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2.5 shadow-md text-xs">
                    <span className="font-bold text-[var(--text-1)] block pb-1 border-b border-[var(--border)]">
                      Processing Settings
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-2)]">Elevation mask:</span>
                      <select
                        value={elevMask}
                        onChange={(e) => setElevMask(Number(e.target.value))}
                        className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono font-bold"
                      >
                        <option value={10}>10°</option>
                        <option value={15}>15° (Standard)</option>
                        <option value={20}>20° (High Obstruction)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-2)]">SNR Threshold:</span>
                      <select
                        value={snrThreshold}
                        onChange={(e) => setSnrThreshold(Number(e.target.value))}
                        className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono font-bold"
                      >
                        <option value={30}>30 dB-Hz</option>
                        <option value={35}>35 dB-Hz (Standard)</option>
                        <option value={40}>40 dB-Hz (High Quality)</option>
                      </select>
                    </div>
                    <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center">
                      <span className="text-[11px] text-[var(--text-3)]">รีเซ็ตพื้นที่ทำงาน:</span>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer"
                        title="ล้างข้อมูลทั้งหมดในพื้นที่ทำงาน"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ล้างข้อมูล</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Error Callout */}
                {baselineError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{baselineError}</span>
                  </div>
                )}

                {/* 5. INLINE SOLUTION CARD (Emlid Studio Immediate Feedback) */}
                {baselineSolution && (
                  <div className="p-3 rounded-xl bg-[var(--surface)] border border-emerald-500/30 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold font-mono text-emerald-500 text-xs">
                          {baselineSolution.status}: 100%
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[var(--accent)] px-1.5 py-0.5 rounded bg-[var(--surface-2)]">
                        Ratio: {baselineSolution.ratioTest.toFixed(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-[var(--surface-2)]/60">
                        <span className="text-[9px] text-[var(--text-3)] uppercase block">2D Distance</span>
                        <span className="font-bold text-[var(--text-1)]">
                          {baselineSolution.vectorENU.distance2D.toFixed(3)} m
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--surface-2)]/60">
                        <span className="text-[9px] text-[var(--text-3)] uppercase block">Azimuth</span>
                        <span className="font-bold text-[var(--text-1)]">
                          {baselineSolution.vectorENU.azimuthDeg.toFixed(2)}°
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[var(--surface-2)]/60 text-[11px] font-mono space-y-1 text-[var(--text-2)]">
                      <div className="flex justify-between">
                        <span>ΔE:</span>
                        <span className="font-bold text-[var(--text-1)]">{baselineSolution.vectorENU.dE.toFixed(4)} m (±{baselineSolution.stdDevMm.dE}mm)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ΔN:</span>
                        <span className="font-bold text-[var(--text-1)]">{baselineSolution.vectorENU.dN.toFixed(4)} m (±{baselineSolution.stdDevMm.dN}mm)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ΔU:</span>
                        <span className="font-bold text-[var(--text-1)]">{baselineSolution.vectorENU.dU.toFixed(4)} m (±{baselineSolution.stdDevMm.dU}mm)</span>
                      </div>
                    </div>

                    {/* Direct Action Pathway */}
                    <div className="pt-1 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={handleTransferToAdjustment}
                        className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors micro-press"
                      >
                        <Network className="w-3.5 h-3.5" />
                        <span>นำเข้าโครงข่ายปรับแก้ (Send to LSA)</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ── NETWORK ADJUSTMENT CONTROLS ── */}
            {processingMode === 'adjustment' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-2)] text-xs">
                  <span className="text-[var(--text-3)]">มิติโครงข่าย:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAdjustmentMode('2d')}
                      className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                        adjustmentMode === '2d' ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs' : 'text-[var(--text-3)]'
                      }`}
                    >
                      2D ราบ
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentMode('1d')}
                      className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                        adjustmentMode === '1d' ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs' : 'text-[var(--text-3)]'
                      }`}
                    >
                      1D ระดับ
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    try {
                      if (adjustmentMode === '2d') {
                        setResult2D(adjust2DNetwork(stations2D, obs2D));
                      } else {
                        setResult1D(adjust1DLevelingNetwork(points1D, obs1D));
                      }
                      setBannerMessage({ text: 'คำนวณปรับแก้โครงข่าย Least Squares สำเร็จ', type: 'success' });
                      setCanvasView('map');
                    } catch (err: any) {
                      setAdjustmentError(err?.message || 'การคำนวณปรับแก้ไม่ลู่เข้า');
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm micro-press"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>คำนวณปรับแก้ (Compute LSA)</span>
                </button>

                {result2D && adjustmentMode === '2d' && (
                  <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs space-y-2">
                    <div className="flex justify-between font-mono">
                      <span className="text-[var(--text-3)]">DoF (r):</span>
                      <span className="font-bold text-[var(--text-1)]">{result2D.dof}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-[var(--text-3)]">Std Error (σ₀):</span>
                      <span className="font-bold text-[var(--accent)]">{result2D.sigma0.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-[var(--text-3)]">Chi-Square:</span>
                      <span className={`font-bold ${result2D.chiSquarePassed ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {result2D.chiSquarePassed ? 'PASSED (95%)' : 'WARNING'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── CONVERT TO RINEX CONTROLS ── */}
            {processingMode === 'rinex' && (
              <div className="space-y-3">
                <div 
                  onClick={() => hcnFileInputRef.current?.click()}
                  className="p-4 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface-2)]/40 text-center cursor-pointer space-y-1 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-[var(--accent)] mx-auto" />
                  <span className="text-xs font-bold text-[var(--text-1)] block">เลือกไฟล์ CHCNAV .HCN</span>
                  <span className="text-[10px] text-[var(--text-3)]">แปลงรหัส ASCII Header & RINEX 3.04</span>
                </div>

                <input
                  ref={hcnFileInputRef}
                  type="file"
                  accept=".hcn,.hrc"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processFile(file, 'hcn');
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                {baseHcn && (
                  <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs space-y-2 font-mono">
                    <div className="font-bold text-[var(--accent)] font-sans">
                      ถอดรหัส CHCNAV สำเร็จ
                    </div>
                    <div className="text-[11px] text-[var(--text-2)] space-y-1">
                      <div>หมุด: <b>{baseHcn.metadata.markerName}</b></div>
                      <div>เครื่องรับ: <b>{baseHcn.metadata.receiverType}</b></div>
                      <div>OEM Core: <b className="text-emerald-500">{baseHcn.metadata.oemEngine}</b></div>
                      <div>ความสูงเสา: <b>{baseHcn.metadata.antennaHeight.toFixed(4)} m</b></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([baseHcn.syntheticRinexHeader], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${baseHcn.metadata.markerName}.rnx`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-[var(--accent)] text-black dark:text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลดไฟล์ .RNX Header</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* RIGHT INTERACTIVE CANVAS (Map, Skyplot, Adjustment, Report)        */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-3">
          
          <div className="fusion-card overflow-hidden flex flex-col">
            
            {/* Canvas Header Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-[var(--border)] bg-[var(--surface-2)]/40">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCanvasView('map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all micro-press flex items-center gap-1.5 ${
                    canvasView === 'map'
                      ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Ground track (แผนที่)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCanvasView('skyplot')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all micro-press flex items-center gap-1.5 ${
                    canvasView === 'skyplot'
                      ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                  }`}
                >
                  <Satellite className="w-3.5 h-3.5" />
                  <span>Polar Skyplot (ผังดาวเทียม)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCanvasView('adjustment')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all micro-press flex items-center gap-1.5 ${
                    canvasView === 'adjustment'
                      ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>Adjustment Table</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCanvasView('report')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all micro-press flex items-center gap-1.5 ${
                    canvasView === 'report'
                      ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Survey Report</span>
                </button>
              </div>

              {/* Quick Actions in Canvas Bar */}
              <div className="flex items-center gap-1.5">
                {result2D && (
                  <>
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] text-xs flex items-center gap-1"
                      title="ส่งออก CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="hidden sm:inline">CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportGeoJson}
                      className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] text-xs flex items-center gap-1"
                      title="ส่งออก GeoJSON"
                    >
                      <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span className="hidden sm:inline">GeoJSON</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] text-xs flex items-center gap-1"
                  title="คัดลอกรายงานสรุป"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
            </div>

            {/* ── CANVAS BODY: VIEW 1 - GROUND TRACK MAP ── */}
            {canvasView === 'map' && (
              <div className="min-h-[580px] flex flex-col justify-between">
                <EmbeddedNetworkMap
                  stations={displayStations}
                  observations={displayObservations}
                  utmZone={currentUtmZone}
                  title="Ground Track & Survey Network Vector Map"
                />
              </div>
            )}

            {/* ── CANVAS BODY: VIEW 2 - POLAR SKYPLOT ── */}
            {canvasView === 'skyplot' && (
              <div className="p-4 sm:p-5 space-y-4 min-h-[580px]">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStationView('base')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        selectedStationView === 'base'
                          ? 'bg-[var(--accent)] text-black dark:text-white'
                          : 'bg-[var(--surface-2)] text-[var(--text-3)]'
                      }`}
                    >
                      Base ({baseRinex?.header.markerName || 'ยังไม่มีไฟล์'})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStationView('rover')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        selectedStationView === 'rover'
                          ? 'bg-cyan-400 text-black'
                          : 'bg-[var(--surface-2)] text-[var(--text-3)]'
                      }`}
                    >
                      Rover ({roverRinex?.header.markerName || 'ยังไม่มีไฟล์'})
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <span className="text-[var(--text-3)]">Constellation:</span>
                    {['ALL', 'GPS', 'BEIDOU', 'GLONASS', 'GALILEO'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setConstellationFilter(c)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          constellationFilter === c
                            ? 'bg-[var(--surface-3)] text-[var(--accent)] border border-[var(--accent)]/40'
                            : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {!activeSkyplotRinex ? (
                  <div className="p-8 text-center text-xs text-[var(--text-3)] border-2 border-dashed border-[var(--border)] rounded-xl">
                    สถานีที่เลือกยังไม่มีข้อมูลดาวเทียม กรุณานำเข้าไฟล์ RINEX/HCN ทางฝั่งซ้าย
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Polar Radar Circles SVG */}
                    <div className="md:col-span-5 flex flex-col items-center space-y-3">
                      <div className="relative w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="-120 -120 240 240">
                          <circle cx="0" cy="0" r="100" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                          <circle cx="0" cy="0" r="66.6" fill="none" stroke="var(--border)" strokeDasharray="3 3" strokeWidth="1" />
                          <circle cx="0" cy="0" r="33.3" fill="none" stroke="var(--border)" strokeDasharray="3 3" strokeWidth="1" />
                          <circle cx="0" cy="0" r="83.3" fill="none" stroke="rgba(239, 68, 68, 0.4)" strokeDasharray="2 2" strokeWidth="1" />
                          <line x1="0" y1="-100" x2="0" y2="100" stroke="var(--border)" strokeWidth="1" />
                          <line x1="-100" y1="0" x2="100" y2="0" stroke="var(--border)" strokeWidth="1" />
                          <text x="0" y="-104" textAnchor="middle" className="text-[9px] font-mono fill-[var(--accent)] font-bold">N</text>
                          <text x="108" y="3" textAnchor="start" className="text-[9px] font-mono fill-[var(--text-3)]">E</text>
                          <text x="0" y="112" textAnchor="middle" className="text-[9px] font-mono fill-[var(--text-3)]">S</text>
                          <text x="-108" y="3" textAnchor="end" className="text-[9px] font-mono fill-[var(--text-3)]">W</text>
                          <text x="0" y="4" textAnchor="middle" className="text-[8px] font-mono fill-[var(--text-3)]">Zenith</text>

                          {filteredSatellites.map((sat) => {
                            const radius = (100.0 * (90.0 - sat.elevationDeg)) / 90.0;
                            const theta = ((sat.azimuthDeg - 90.0) * Math.PI) / 180.0;
                            const px = radius * Math.cos(theta);
                            const py = radius * Math.sin(theta);
                            const markerColor = sat.snrDbHz >= 46 ? '#10b981' : sat.snrDbHz >= 40 ? '#0ea5e9' : sat.snrDbHz >= 35 ? '#f59e0b' : '#ef4444';

                            return (
                              <g key={sat.id} className="cursor-pointer">
                                <circle cx={px} cy={py} r="4.5" fill={markerColor} stroke="#000" strokeWidth="1" />
                                <text x={px} y={py - 6} textAnchor="middle" className="text-[8px] font-mono font-bold fill-[var(--text-1)]">
                                  {sat.id}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-3)]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> &ge;46 dB-Hz</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> 40-45</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 35-39</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> &lt;35</span>
                      </div>
                    </div>

                    {/* Satellites Table */}
                    <div className="md:col-span-7 overflow-x-auto max-h-96">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)]">
                          <tr className="text-[var(--text-3)] font-mono text-[11px]">
                            <th className="py-2 px-2">PRN</th>
                            <th className="py-2 px-2">กลุ่ม</th>
                            <th className="py-2 px-2 text-right">Az (°)</th>
                            <th className="py-2 px-2 text-right">El (°)</th>
                            <th className="py-2 px-2 text-right">SNR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] font-mono">
                          {filteredSatellites.map((sat) => (
                            <tr key={sat.id} className="hover:bg-[var(--surface-2)]">
                              <td className="py-1.5 px-2 font-bold text-[var(--text-1)]">{sat.id}</td>
                              <td className="py-1.5 px-2 text-[var(--text-2)]">{sat.constellation}</td>
                              <td className="py-1.5 px-2 text-right">{sat.azimuthDeg.toFixed(1)}°</td>
                              <td className="py-1.5 px-2 text-right text-[var(--accent)] font-bold">{sat.elevationDeg.toFixed(1)}°</td>
                              <td className="py-1.5 px-2 text-right font-bold text-emerald-500">{sat.snrDbHz.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── CANVAS BODY: VIEW 3 - ADJUSTMENT TABLE ── */}
            {canvasView === 'adjustment' && (
              <div className="p-4 sm:p-5 space-y-4 min-h-[580px]">
                <NetworkAdjustmentInputTable
                  adjustmentMode={adjustmentMode}
                  stations2D={stations2D}
                  obs2D={obs2D}
                  points1D={points1D}
                  obs1D={obs1D}
                  onUpdateStations2D={setStations2D}
                  onUpdateObs2D={setObs2D}
                  onUpdatePoints1D={setPoints1D}
                  onUpdateObs1D={setObs1D}
                  onResetSample={resetNetworkToSample}
                  onClearAll={clearNetwork}
                />

                {result2D && adjustmentMode === '2d' && (
                  <div className="p-4 rounded-xl bg-[var(--surface-2)]/50 border border-[var(--border)] space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text-1)]">
                      พิกัดปรับแก้และวงรีความคลาดเคลื่อน 95% Confidence (Adjusted Stations)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="border-b border-[var(--border)] text-[var(--text-3)] text-[11px]">
                            <th className="py-2 px-2">หมุด</th>
                            <th className="py-2 px-2">สถานะ</th>
                            <th className="py-2 px-2 text-right">Easting (m)</th>
                            <th className="py-2 px-2 text-right">Northing (m)</th>
                            <th className="py-2 px-2 text-right">σE (mm)</th>
                            <th className="py-2 px-2 text-right">σN (mm)</th>
                            <th className="py-2 px-2 text-right">95% a₉₅ (mm)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {result2D.stations.map((s) => (
                            <tr key={s.id} className="hover:bg-[var(--surface-2)]">
                              <td className="py-1.5 px-2 font-bold text-[var(--text-1)]">{s.id}</td>
                              <td className="py-1.5 px-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${s.isFixed ? 'bg-emerald-500/15 text-emerald-500 font-bold' : 'bg-[var(--surface-2)] text-[var(--text-2)]'}`}>
                                  {s.isFixed ? 'FIXED' : 'ADJUSTED'}
                                </span>
                              </td>
                              <td className="py-1.5 px-2 text-right">{s.easting.toFixed(4)}</td>
                              <td className="py-1.5 px-2 text-right">{s.northing.toFixed(4)}</td>
                              <td className="py-1.5 px-2 text-right">{s.sigmaEMm.toFixed(1)}</td>
                              <td className="py-1.5 px-2 text-right">{s.sigmaNMm.toFixed(1)}</td>
                              <td className="py-1.5 px-2 text-right font-bold text-amber-500">{s.errorEllipse?.conf95MajorMm.toFixed(1) ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── CANVAS BODY: VIEW 4 - SURVEY REPORT ── */}
            {canvasView === 'report' && (
              <div className="p-4 sm:p-5 space-y-4 min-h-[580px]">
                <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-1)] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[var(--accent)]" />
                      <span>แบบจำลองความสูงยี่ออยด์แห่งประเทศไทย (RTSD TGM2017)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-mono text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-2)] leading-relaxed">
                    การแปลงระดับความสูงทรงรีจากดาวเทียมสู่ระดับความสูงออร์โธเมตริกเทียบระดับน้ำทะเลปานกลาง ($H = h - N$) โดยใช้แบบจำลอง TGM2017 กรมแผนที่ทหาร มีความถูกต้องในแนวดิ่งระดับ &plusmn;3 cm
                  </p>
                </div>

                {baselineSolution ? (
                  <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2 font-mono text-xs">
                    <span className="font-bold text-[var(--text-1)] block font-sans">
                      สรุปผลการรังวัด GNSS Baseline ({baselineSolution.id})
                    </span>
                    <div className="text-[var(--text-2)] space-y-1">
                      <div>สถานะโซลูชัน: <b className="text-emerald-500">{baselineSolution.status}</b> (Ratio: {baselineSolution.ratioTest.toFixed(2)})</div>
                      <div>ระยะราบ (2D Length): <b>{baselineSolution.vectorENU.distance2D.toFixed(3)} m</b> | 3D: <b>{baselineSolution.vectorENU.distance3D.toFixed(3)} m</b></div>
                      <div>มุมทิศ (Azimuth): <b>{baselineSolution.vectorENU.azimuthDeg.toFixed(2)}°</b></div>
                      <div>เวกเตอร์ ENU: ΔE = {baselineSolution.vectorENU.dE.toFixed(4)} m, ΔN = {baselineSolution.vectorENU.dN.toFixed(4)} m, ΔU = {baselineSolution.vectorENU.dU.toFixed(4)} m</div>
                      <div>ความคลาดเคลื่อนมาตรฐาน: σE = ±{baselineSolution.stdDevMm.dE} mm, σN = ±{baselineSolution.stdDevMm.dN} mm, σU = ±{baselineSolution.stdDevMm.dU} mm</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[var(--text-3)] border-2 border-dashed border-[var(--border)] rounded-xl">
                    ยังไม่มีผลลัพธ์เวกเตอร์ฐาน กรุณานำเข้าไฟล์และกด Process ทางฝั่งซ้าย
                  </div>
                )}
              </div>
            )}

            {/* ── EMLID STUDIO TELEMETRY BOTTOM RIBBON ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-t border-[var(--border)] bg-[var(--surface-2)]/60 text-[11px] font-mono select-none">
              
              {/* Left: Time Span */}
              <div className="flex items-center gap-2 text-[var(--text-3)]">
                <span className="text-[var(--text-2)]">📅</span>
                <span>
                  {baseRinex?.header.firstEpoch 
                    ? `${baseRinex.header.firstEpoch} - ${baseRinex.header.lastEpoch || 'End'} (GPST)` 
                    : '2026/03/11 02:48:08 - 04:12:00 (GPST)'}
                </span>
              </div>

              {/* Center: Baseline Chord Distance */}
              <div className="flex items-center gap-2 text-[var(--text-2)]">
                <span className="font-bold">Ⓑ</span>
                <span>
                  {baselineSolution 
                    ? `Baseline: ${baselineSolution.vectorENU.distance2D.toFixed(3)} m` 
                    : displayStations.length >= 2 
                    ? 'Distance: Multi-point' 
                    : '0.000 m'}
                </span>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5">
                <span className={`font-bold ${
                  baselineSolution?.status === 'FIXED' 
                    ? 'text-emerald-500' 
                    : baselineSolution?.status === 'FLOAT' 
                    ? 'text-amber-500' 
                    : 'text-[var(--text-3)]'
                }`}>
                  {baselineSolution 
                    ? `${baselineSolution.status}: 100% (Ratio: ${baselineSolution.ratioTest.toFixed(1)})` 
                    : baseRinex && roverRinex 
                    ? 'READY TO SOLVE' 
                    : 'STANDBY'}
                </span>
              </div>

              {/* Right: Layer / Ground track indicators */}
              <div className="hidden sm:flex items-center gap-3 text-[10px] text-[var(--text-3)]">
                <span>Ground track ▾</span>
                <span>All quality flags ▾</span>
                <span>Layers: {displayStations.length} ▾</span>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
