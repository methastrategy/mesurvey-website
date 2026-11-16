/**
 * Universal Total Station Raw Stream Decoder (total-station-decoder.ts)
 * 
 * High-performance, pure TypeScript parser for survey raw observation streams:
 * 1. Leica Geosystems: GSI-8 and GSI-16 format (.gsi)
 * 2. Topcon / Gowin: GTS-7 / GTS-6 field book format (.gt7, .raw)
 * 3. Sokkia: SDR2x / SDR33 format (.sdr)
 * 4. Nikon / Trimble: Nikon AP-800 RAW format (.raw)
 * 
 * Replaces proprietary office download utilities and USB Dongle software.
 */

export type TotalStationFormat = 
  | 'leica-gsi'
  | 'topcon-gts7'
  | 'sokkia-sdr'
  | 'nikon-raw'
  | 'generic-raw';

export interface RawStationSetup {
  station: string;
  instrumentHeight: number; // HI in meters
  easting?: number;
  northing?: number;
  elevation?: number;
  backsiteStation?: string;
  backsiteAzimuthDeg?: number;
}

export interface RawObservation {
  id: string;
  station: string;
  targetStation: string;
  targetHeight: number; // HT in meters
  horizontalAngleDeg: number; // HA (0-360)
  verticalAngleDeg: number;   // VA (Zenith angle)
  slopeDistance: number;      // SD (m)
  horizontalDistance?: number;// HD (m)
  easting?: number;
  northing?: number;
  elevation?: number;
  code?: string;
}

export interface DecodedTraverseLeg {
  station: string;
  targetStation: string;
  distance: number;
  angleD: number;
  angleM: number;
  angleS: number;
}

export interface DecodedTotalStationFile {
  format: TotalStationFormat;
  formatLabel: string;
  stations: RawStationSetup[];
  observations: RawObservation[];
  traverseLegs: DecodedTraverseLeg[];
  errors: string[];
}

/**
 * Converts decimal degrees into integer Degree, Minute, and Second (D, M, S)
 */
export function decDegToDms(decDeg: number): { d: number; m: number; s: number } {
  const norm = ((decDeg % 360) + 360) % 360;
  const d = Math.floor(norm);
  const minRemainder = (norm - d) * 60;
  const m = Math.floor(minRemainder);
  const s = Math.round((minRemainder - m) * 60 * 10) / 10;
  return { d, m, s };
}

/**
 * Detects format of total station raw file by inspecting headers and keywords
 */
export function detectTotalStationFormat(content: string): TotalStationFormat {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return 'generic-raw';

  // 1. Sokkia SDR check
  if (lines.some(l => l.startsWith('00NMSDR') || l.startsWith('00POSDR') || /^\d{2}[A-Z]{2}/.test(l))) {
    return 'sokkia-sdr';
  }

  // 2. Leica GSI check (e.g. 110001+00000001 or 11....+00000001)
  if (lines.some(l => /^(11|41|21|81)[0-9.]{2,4}[+-]/.test(l.trim()))) {
    return 'leica-gsi';
  }

  // 3. Topcon GTS-7 check (STN, or GTS in header)
  if (lines.some(l => l.toUpperCase().includes('GTS') || /^STN,/i.test(l) || /^NEZ,/i.test(l) || /^BS,/i.test(l))) {
    return 'topcon-gts7';
  }

  // 4. Nikon RAW check (CO, or ST,)
  if (lines.some(l => /^CO,/i.test(l) || /^MP,/i.test(l) || /^ST,/i.test(l))) {
    return 'nikon-raw';
  }

  // Fallback check
  if (lines.some(l => /^SS,/i.test(l))) {
    return 'topcon-gts7';
  }

  return 'generic-raw';
}

/**
 * 1. Leica GSI Parser (GSI-8 & GSI-16)
 * Word identifiers:
 * 11: Point ID (Station or Target)
 * 21: Horizontal Angle (Hz) in dms: DDDMMSS or gon
 * 22: Vertical Angle (V) in dms: DDDMMSS or gon
 * 31: Slope distance (m)
 * 32: Horizontal distance (m)
 * 81: Easting (m)
 * 82: Northing (m)
 * 83: Elevation (m)
 * 87/88: Reflector / Instrument height (m)
 */
export function parseLeicaGsi(content: string): DecodedTotalStationFile {
  const lines = content.split(/\r?\n/);
  const observations: RawObservation[] = [];
  const stations: RawStationSetup[] = [];
  const errors: string[] = [];

  let currentStation = 'STN-1';
  let currentHI = 1.500;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx].trim();
    if (!rawLine) continue;

    // Split words by space
    const words = rawLine.split(/\s+/).filter(Boolean);
    const wordMap: Record<string, string> = {};

    for (const word of words) {
      if (word.length >= 7) {
        const wi = word.slice(0, 2);
        // Find sign (+ or -)
        const signIdx = word.indexOf('+') !== -1 ? word.indexOf('+') : word.indexOf('-');
        if (signIdx !== -1) {
          const sign = word[signIdx];
          const valStr = word.slice(signIdx + 1);
          wordMap[wi] = sign + valStr;
        }
      }
    }

    if (Object.keys(wordMap).length === 0) continue;

    const ptIdRaw = wordMap['11'] || wordMap['41'] || '';
    const ptId = ptIdRaw ? String(parseInt(ptIdRaw.replace(/^[+-]/, ''), 10) || ptIdRaw.replace(/^[+-]/, '')) : `PT-${lineIdx + 1}`;

    // Parse Angles (GSI DMS format: DDDMMSS.s)
    const parseGsiAngle = (raw: string | undefined): number => {
      if (!raw) return 0;
      const clean = raw.replace(/[+-]/g, '');
      const num = parseFloat(clean);
      if (isNaN(num)) return 0;
      // GSI DDDMMSS format: e.g. 09030450 => 90° 30' 45.0"
      if (clean.length >= 7) {
        const d = parseFloat(clean.slice(0, clean.length - 5));
        const m = parseFloat(clean.slice(clean.length - 5, clean.length - 3));
        const s = parseFloat(clean.slice(clean.length - 3)) / 10;
        return d + m / 60 + s / 3600;
      }
      if (clean.length >= 6) {
        const d = parseFloat(clean.slice(0, clean.length - 4));
        const m = parseFloat(clean.slice(clean.length - 4, clean.length - 2));
        const s = parseFloat(clean.slice(clean.length - 2));
        return d + m / 60 + s / 3600;
      }
      return num / 10000;
    };

    const parseGsiDistance = (raw: string | undefined): number => {
      if (!raw) return 0;
      const num = parseFloat(raw);
      if (isNaN(num)) return 0;
      // Leica typically uses mm format (1 mm unit): e.g. +00125340 = 125.340 m
      return Math.abs(num) / 1000;
    };

    const ha = parseGsiAngle(wordMap['21']);
    const va = parseGsiAngle(wordMap['22']);
    const sd = parseGsiDistance(wordMap['31']);
    const hd = parseGsiDistance(wordMap['32']);

    const easting = wordMap['81'] ? parseGsiDistance(wordMap['81']) : undefined;
    const northing = wordMap['82'] ? parseGsiDistance(wordMap['82']) : undefined;
    const elev = wordMap['83'] ? parseGsiDistance(wordMap['83']) : undefined;
    const ht = wordMap['87'] ? parseGsiDistance(wordMap['87']) : 1.500;
    const hi = wordMap['88'] ? parseGsiDistance(wordMap['88']) : 1.500;

    if (wordMap['88']) {
      currentHI = hi;
      currentStation = ptId;
      stations.push({
        station: ptId,
        instrumentHeight: hi,
        easting,
        northing,
        elevation: elev,
      });
    }

    if (sd > 0 || (ha > 0 && va > 0)) {
      observations.push({
        id: `OBS-${observations.length + 1}`,
        station: currentStation,
        targetStation: ptId,
        targetHeight: ht,
        horizontalAngleDeg: ha,
        verticalAngleDeg: va,
        slopeDistance: sd,
        horizontalDistance: hd > 0 ? hd : sd * Math.sin((va * Math.PI) / 180),
        easting,
        northing,
        elevation: elev,
      });
    }
  }

  const traverseLegs: DecodedTraverseLeg[] = observations.map(obs => {
    const dms = decDegToDms(obs.horizontalAngleDeg);
    return {
      station: obs.station,
      targetStation: obs.targetStation,
      distance: obs.horizontalDistance || obs.slopeDistance,
      angleD: dms.d,
      angleM: dms.m,
      angleS: dms.s,
    };
  });

  return {
    format: 'leica-gsi',
    formatLabel: 'Leica Geosystems GSI (GSI-8 / GSI-16)',
    stations,
    observations,
    traverseLegs,
    errors,
  };
}

/**
 * 2. Topcon GTS-7 / Gowin Raw Fieldbook Parser (.gt7, .raw)
 */
export function parseTopconGts7(content: string): DecodedTotalStationFile {
  const lines = content.split(/\r?\n/);
  const observations: RawObservation[] = [];
  const stations: RawStationSetup[] = [];
  const errors: string[] = [];

  let currentStation = 'STN-1';
  let currentHI = 1.500;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();
    if (!line) continue;

    const parts = line.split(',').map(p => p.trim());
    const tag = parts[0]?.toUpperCase();

    // Station setup: STN,station_id,hi,code or STN,station_id,ih,code
    if (tag === 'STN') {
      currentStation = parts[1] || `STN-${stations.length + 1}`;
      currentHI = parseFloat(parts[2]) || 1.500;
      stations.push({
        station: currentStation,
        instrumentHeight: currentHI,
      });
      continue;
    }

    // Side shot or Traverse shot: SS,point,th,sd,ha,va,code or SS,point,target,sd,ha,va
    if (tag === 'SS' || tag === 'FS' || tag === 'SD') {
      const targetStation = parts[1] || `PT-${observations.length + 1}`;
      const ht = parseFloat(parts[2]) || 1.500;
      const sd = parseFloat(parts[3]) || 0;
      
      // Parse HA (either decimal degree or DDD.MMSS)
      const parseTopconAngle = (val: string): number => {
        if (!val) return 0;
        const num = parseFloat(val);
        if (val.includes('.')) {
          const [degStr, fracStr] = val.split('.');
          const d = parseFloat(degStr) || 0;
          const mm = parseFloat(fracStr.slice(0, 2)) || 0;
          const ss = parseFloat(fracStr.slice(2, 4) + '.' + fracStr.slice(4)) || 0;
          return d + mm / 60 + ss / 3600;
        }
        return num;
      };

      const ha = parseTopconAngle(parts[4]);
      const va = parseTopconAngle(parts[5]);
      const code = parts[6] || '';

      const hd = sd * Math.sin((va * Math.PI) / 180);

      observations.push({
        id: `OBS-${observations.length + 1}`,
        station: currentStation,
        targetStation,
        targetHeight: ht,
        horizontalAngleDeg: ha,
        verticalAngleDeg: va,
        slopeDistance: sd,
        horizontalDistance: hd > 0 ? hd : sd,
        code,
      });
    }
  }

  const traverseLegs: DecodedTraverseLeg[] = observations.map(obs => {
    const dms = decDegToDms(obs.horizontalAngleDeg);
    return {
      station: obs.station,
      targetStation: obs.targetStation,
      distance: obs.horizontalDistance || obs.slopeDistance,
      angleD: dms.d,
      angleM: dms.m,
      angleS: dms.s,
    };
  });

  return {
    format: 'topcon-gts7',
    formatLabel: 'Topcon / Gowin GTS-7 Raw Fieldbook',
    stations,
    observations,
    traverseLegs,
    errors,
  };
}

/**
 * 3. Sokkia SDR33 / SDR2x Parser (.sdr)
 */
export function parseSokkiaSdr(content: string): DecodedTotalStationFile {
  const lines = content.split(/\r?\n/);
  const observations: RawObservation[] = [];
  const stations: RawStationSetup[] = [];
  const errors: string[] = [];

  let currentStation = 'STN-1';

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();
    if (!line || line.length < 4) continue;

    const recType = line.slice(0, 2);

    // 02: Station coordinate or Station ID
    // Format: 02KI <stn> <E> <N> <Z> <HI>
    if (recType === '02') {
      const parts = line.split(/\s+/);
      const stn = parts[1]?.slice(2) || `STN-${stations.length + 1}`;
      const e = parseFloat(parts[2]) || undefined;
      const n = parseFloat(parts[3]) || undefined;
      const z = parseFloat(parts[4]) || undefined;
      const hi = parseFloat(parts[5]) || 1.500;
      currentStation = stn;
      stations.push({
        station: stn,
        instrumentHeight: hi,
        easting: e,
        northing: n,
        elevation: z,
      });
      continue;
    }

    // 07: Observation record (Direction & Distance)
    // Format: 07KI <stn> <target> <dist> <va> <ha>
    if (recType === '07' || recType === '08') {
      const parts = line.split(/\s+/);
      if (parts.length >= 5) {
        const stn = parts[1] || currentStation;
        const target = parts[2] || `PT-${observations.length + 1}`;
        const sd = parseFloat(parts[3]) || 0;
        const va = parseFloat(parts[4]) || 90.0;
        const ha = parseFloat(parts[5]) || 0.0;

        observations.push({
          id: `OBS-${observations.length + 1}`,
          station: stn,
          targetStation: target,
          targetHeight: 1.500,
          horizontalAngleDeg: ha,
          verticalAngleDeg: va,
          slopeDistance: sd,
          horizontalDistance: sd * Math.sin((va * Math.PI) / 180),
        });
      }
    }
  }

  const traverseLegs: DecodedTraverseLeg[] = observations.map(obs => {
    const dms = decDegToDms(obs.horizontalAngleDeg);
    return {
      station: obs.station,
      targetStation: obs.targetStation,
      distance: obs.horizontalDistance || obs.slopeDistance,
      angleD: dms.d,
      angleM: dms.m,
      angleS: dms.s,
    };
  });

  return {
    format: 'sokkia-sdr',
    formatLabel: 'Sokkia SDR33 / SDR2x Electronic Field Book',
    stations,
    observations,
    traverseLegs,
    errors,
  };
}

/**
 * 4. Nikon RAW / AP-800 Parser (.raw)
 */
export function parseNikonRaw(content: string): DecodedTotalStationFile {
  const lines = content.split(/\r?\n/);
  const observations: RawObservation[] = [];
  const stations: RawStationSetup[] = [];
  const errors: string[] = [];

  let currentStation = 'STN-1';
  let currentHI = 1.500;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();
    if (!line) continue;

    const parts = line.split(',').map(p => p.trim());
    const recType = parts[0]?.toUpperCase();

    // ST: Station Record (ST,stn,pt,th,ih,azimuth or ST,stn,ih)
    if (recType === 'ST') {
      currentStation = parts[1] || `STN-${stations.length + 1}`;
      // In Nikon: ST,stn,backsite,th,ih,azimuth => parts[4] is ih, or parts[3]
      const ihVal = parseFloat(parts[4]) || parseFloat(parts[3]) || parseFloat(parts[2]) || 1.500;
      currentHI = ihVal;
      stations.push({
        station: currentStation,
        instrumentHeight: currentHI,
      });
      continue;
    }

    // SS: Sideshot Record (SS,point,th,sd,ha,va,time,desc)
    if (recType === 'SS' || recType === 'FS') {
      const target = parts[1] || `PT-${observations.length + 1}`;
      const ht = parseFloat(parts[2]) || 1.500;
      const sd = parseFloat(parts[3]) || 0;

      const parseNikonAngle = (val: string): number => {
        if (!val) return 0;
        const [degStr, fracStr] = val.split('.');
        const d = parseFloat(degStr) || 0;
        if (!fracStr) return d;
        const mm = parseFloat(fracStr.slice(0, 2)) || 0;
        const ss = parseFloat(fracStr.slice(2, 4) + '.' + fracStr.slice(4)) || 0;
        return d + mm / 60 + ss / 3600;
      };

      const ha = parseNikonAngle(parts[4]);
      const va = parseNikonAngle(parts[5]);
      const desc = parts[7] || '';

      const hd = sd * Math.sin((va * Math.PI) / 180);

      observations.push({
        id: `OBS-${observations.length + 1}`,
        station: currentStation,
        targetStation: target,
        targetHeight: ht,
        horizontalAngleDeg: ha,
        verticalAngleDeg: va,
        slopeDistance: sd,
        horizontalDistance: hd > 0 ? hd : sd,
        code: desc,
      });
    }
  }

  const traverseLegs: DecodedTraverseLeg[] = observations.map(obs => {
    const dms = decDegToDms(obs.horizontalAngleDeg);
    return {
      station: obs.station,
      targetStation: obs.targetStation,
      distance: obs.horizontalDistance || obs.slopeDistance,
      angleD: dms.d,
      angleM: dms.m,
      angleS: dms.s,
    };
  });

  return {
    format: 'nikon-raw',
    formatLabel: 'Nikon AP-800 / Trimble Nikon RAW',
    stations,
    observations,
    traverseLegs,
    errors,
  };
}

/**
 * Master Universal Total Station Decoder Entrypoint
 */
export function decodeTotalStationFile(content: string): DecodedTotalStationFile {
  const format = detectTotalStationFormat(content);
  switch (format) {
    case 'leica-gsi':
      return parseLeicaGsi(content);
    case 'topcon-gts7':
      return parseTopconGts7(content);
    case 'sokkia-sdr':
      return parseSokkiaSdr(content);
    case 'nikon-raw':
      return parseNikonRaw(content);
    default:
      // Attempt topcon or leica fallback
      if (content.includes(',')) {
        return parseTopconGts7(content);
      }
      return parseLeicaGsi(content);
  }
}
