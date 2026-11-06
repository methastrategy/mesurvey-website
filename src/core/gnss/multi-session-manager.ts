/**
 * 🛰️ MESURV Geomatics Core: Multi-Session Station Manager
 * Handles multi-station RINEX & HCN observation files, station metadata registry,
 * antenna height conversion (Slant to True Vertical), and common observation windows.
 */

import { type RinexParseResult, parseRinexText, ecefToGeodetic } from '../../utils/rinex-parser';
import { type HcnParseResult, parseHcnBuffer, isHcnBuffer } from '../../utils/hcn-parser';

export type AntennaMeasurementMethod = 'vertical' | 'slant';

export interface AntennaOffsetConfig {
  radiusMm: number; // Antenna radius to measurement notch (e.g. 90mm - 120mm)
  l1PcoMm: number;  // Phase Center Offset L1 in millimeters (e.g. 50mm - 110mm)
  l2PcoMm: number;  // Phase Center Offset L2 in millimeters
}

// Standard default Geodetic GNSS antenna specs (CHCNAV, Emlid Reach RS2/RS3, Trimble, Leica)
export const DEFAULT_ANTENNA_PRESETS: Record<string, AntennaOffsetConfig> = {
  'EMLID_REACH_RS2_RS3': { radiusMm: 80.0, l1PcoMm: 134.0, l2PcoMm: 140.0 },
  'CHCNAV_IBOW_ICHO':    { radiusMm: 95.0, l1PcoMm: 105.0, l2PcoMm: 110.0 },
  'TRIMBLE_R10_R12':     { radiusMm: 79.0, l1PcoMm: 129.0, l2PcoMm: 120.0 },
  'GENERIC_GEODETIC':    { radiusMm: 85.0, l1PcoMm: 110.0, l2PcoMm: 115.0 },
};

export interface StationSession {
  id: string; // Internal unique ID
  stationCode: string; // e.g. "BM01", "CORS_BKK", "ROV1"
  fileName: string;
  fileSizeBytes: number;
  format: 'RINEX' | 'HCN';
  startTimeUtc: Date;
  endTimeUtc: Date;
  durationMinutes: number;
  intervalSec: number;
  epochsCount: number;
  satellitesObserved: string[]; // PRNs observed, e.g. ["G01", "G03", "C01", "E05"]
  constellations: string[];
  approxCoordinates: {
    x: number; // ECEF X
    y: number; // ECEF Y
    z: number; // ECEF Z
    latDeg: number;
    lonDeg: number;
    ellipHeightM: number;
  };
  antenna: {
    model: string;
    measuredHeightM: number;
    measurementMethod: AntennaMeasurementMethod;
    trueVerticalHeightM: number;
  };
  isFixedControl: boolean; // Flag if this station has a known fixed geodetic coordinate (RTSD / Department of Lands)
  knownControlCoord?: {
    eastingM: number;
    northingM: number;
    elevationM: number;
    zone: number;
  };
  parsedRinex?: RinexParseResult;
  parsedHcn?: HcnParseResult;
}

/**
 * Converts a measured slant height to a true vertical height from benchmark to ARP/Phase Center:
 * True Vertical = sqrt(Slant^2 - Radius^2) + Offset
 */
export function calculateTrueVerticalAntennaHeight(
  measuredHeightM: number,
  method: AntennaMeasurementMethod,
  antennaPreset: string = 'GENERIC_GEODETIC'
): number {
  if (method === 'vertical' || measuredHeightM <= 0) {
    return measuredHeightM;
  }

  const preset = DEFAULT_ANTENNA_PRESETS[antennaPreset] || DEFAULT_ANTENNA_PRESETS['GENERIC_GEODETIC'];
  const radiusM = preset.radiusMm / 1000.0;
  
  if (measuredHeightM <= radiusM) {
    return measuredHeightM; // Fallback if slant is unrealistically small
  }

  const verticalToNotch = Math.sqrt(measuredHeightM * measuredHeightM - radiusM * radiusM);
  return Number(verticalToNotch.toFixed(4));
}

/**
 * Extracts a StationSession metadata object from a text RINEX file or binary HCN buffer
 */
export function createStationSessionFromFile(
  fileName: string,
  content: string | ArrayBuffer,
  fileSize: number,
  overrideStationCode?: string
): StationSession {
  let isHcn = false;
  if (content instanceof ArrayBuffer) {
    isHcn = isHcnBuffer(content);
  }

  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const defaultStationCode = overrideStationCode || fileName.split('.')[0].slice(0, 8).toUpperCase();

  if (isHcn && content instanceof ArrayBuffer) {
    const hcnResult = parseHcnBuffer(content);
    const lat = hcnResult.metadata.approxGeodetic.lat;
    const lon = hcnResult.metadata.approxGeodetic.lng;
    const h = hcnResult.metadata.approxGeodetic.height;

    const startTime = new Date();
    const duration = hcnResult.asRinex?.durationMinutes || 60;
    const endTime = new Date(startTime.getTime() + duration * 60000);

    return {
      id,
      stationCode: hcnResult.metadata.markerName || defaultStationCode,
      fileName,
      fileSizeBytes: fileSize,
      format: 'HCN',
      startTimeUtc: startTime,
      endTimeUtc: endTime,
      durationMinutes: duration,
      intervalSec: hcnResult.metadata.intervalSec || 1.0,
      epochsCount: hcnResult.asRinex?.totalEpochs || 3600,
      satellitesObserved: hcnResult.asRinex?.satellitesTracked.map(s => s.id) || ['G01', 'G03', 'C01'],
      constellations: ['GPS', 'BEIDOU', 'GLONASS'],
      approxCoordinates: {
        x: hcnResult.metadata.approxEcef.x,
        y: hcnResult.metadata.approxEcef.y,
        z: hcnResult.metadata.approxEcef.z,
        latDeg: lat,
        lonDeg: lon,
        ellipHeightM: h,
      },
      antenna: {
        model: hcnResult.metadata.antennaType || 'CHC_GENERIC',
        measuredHeightM: hcnResult.metadata.antennaHeight || 1.8000,
        measurementMethod: 'vertical',
        trueVerticalHeightM: hcnResult.metadata.antennaHeight || 1.8000,
      },
      isFixedControl: false,
      parsedHcn: hcnResult,
    };
  }

  // Parse as RINEX text
  const text = typeof content === 'string' ? content : new TextDecoder('utf-8').decode(content);
  const rinexResult = parseRinexText(text);

  const approxEcef = rinexResult.header.approxPositionECEF || { x: 0, y: 0, z: 0 };
  const approxGeo = rinexResult.header.approxGeodetic || ecefToGeodetic(approxEcef.x, approxEcef.y, approxEcef.z);

  const durationMin = Math.max(1, rinexResult.durationMinutes);
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + durationMin * 60000);

  const measuredAnt = rinexResult.header.antennaDelta?.h || 1.8000;
  const trueVert = calculateTrueVerticalAntennaHeight(measuredAnt, 'vertical');

  return {
    id,
    stationCode: rinexResult.header.markerName || defaultStationCode,
    fileName,
    fileSizeBytes: fileSize,
    format: 'RINEX',
    startTimeUtc: startTime,
    endTimeUtc: endTime,
    durationMinutes: durationMin,
    intervalSec: rinexResult.header.intervalSec || 1.0,
    epochsCount: rinexResult.totalEpochs,
    satellitesObserved: rinexResult.satellitesTracked.map(s => s.id),
    constellations: rinexResult.constellationsDetected,
    approxCoordinates: {
      x: approxEcef.x,
      y: approxEcef.y,
      z: approxEcef.z,
      latDeg: approxGeo.lat,
      lonDeg: approxGeo.lng,
      ellipHeightM: approxGeo.height,
    },
    antenna: {
      model: rinexResult.header.antennaType || 'GENERIC_GEODETIC',
      measuredHeightM: measuredAnt,
      measurementMethod: 'vertical',
      trueVerticalHeightM: trueVert,
    },
    isFixedControl: false,
    parsedRinex: rinexResult,
  };
}

/**
 * Calculates the overlap duration between two station sessions in minutes.
 * Overlap = min(end1, end2) - max(start1, start2)
 */
export function calculateSessionOverlapMinutes(s1: StationSession, s2: StationSession): number {
  const start = Math.max(s1.startTimeUtc.getTime(), s2.startTimeUtc.getTime());
  const end = Math.min(s1.endTimeUtc.getTime(), s2.endTimeUtc.getTime());
  const diffMs = end - start;
  return diffMs > 0 ? Math.round(diffMs / 60000) : 0;
}
