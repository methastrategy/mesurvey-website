import proj4 from 'proj4';
import { 
  LatLonDD, 
  DMSVal, 
  UTMCoord, 
  Indian1975Coord, 
  CompleteCoordinateSet 
} from '../types/survey';
import { validateWgs84, validateUtm, validateIndian1975 } from './validation';

// Define Projections in Proj4
// WGS84 Geographic
const EPSG_4326 = 'EPSG:4326';

// WGS84 UTM Zones for Thailand (Zone 47 and Zone 48)
const EPSG_32647 = '+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs';
const EPSG_32648 = '+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs';

// Indian 1975 (Everest 1830 ellipsoid with Thailand RTSD 3-parameter geocentric translation: dx=204, dy=837, dz=294)
// Source: Royal Thai Survey Department (RTSD) military mapping grid standards.
// Note: This is a 3-parameter geocentric shift (translation only; rotation & scale = 0).
// Compared to EPSG:1157 (209, 818, 290) and EPSG:1313 (210, 814, 289), empirical deviation across Thailand is ~1.3 to 3.7 m.
// Suitable for general mapping and visualization (~±5m accuracy); rigorous cadastral work requires localized ground control.
const EPSG_24047 = '+proj=utm +zone=47 +a=6377276.345 +rf=300.8017 +towgs84=204,837,294,0,0,0,0 +units=m +no_defs';
const EPSG_24048 = '+proj=utm +zone=48 +a=6377276.345 +rf=300.8017 +towgs84=204,837,294,0,0,0,0 +units=m +no_defs';

proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
proj4.defs('EPSG:32647', EPSG_32647);
proj4.defs('EPSG:32648', EPSG_32648);
proj4.defs('EPSG:24047', EPSG_24047);
proj4.defs('EPSG:24048', EPSG_24048);

/**
 * Thailand Geographic and UTM Bounding Envelope
 */
export const THAILAND_EXTENT = {
  minLat: 5.5,
  maxLat: 20.5,
  minLng: 97.0,
  maxLng: 106.0,
  minUtmEasting: 150000,
  maxUtmEasting: 850000,
  minUtmNorthing: 550000,
  maxUtmNorthing: 2350000
};

/**
 * Checks whether a geographic coordinate falls within Thailand's general geographical envelope.
 */
export function isInThailandBounds(lat: number, lng: number): boolean {
  return lat >= THAILAND_EXTENT.minLat && 
         lat <= THAILAND_EXTENT.maxLat && 
         lng >= THAILAND_EXTENT.minLng && 
         lng <= THAILAND_EXTENT.maxLng;
}

/**
 * Validates geographic latitude and longitude bounds using Zod geodetic engine.
 */
export function validateGeographicCoordinates(lat: number, lng: number): { isValid: boolean; error?: string } {
  const res = validateWgs84({ lat, lng });
  if (!res.isValid) {
    return { isValid: false, error: res.error };
  }
  return { isValid: true };
}

/**
 * Validates UTM easting and northing bounds for Thailand zones (47N/48N) using Zod.
 */
export function validateUtmCoordinates(easting: number, northing: number, zone: 47 | 48): { isValid: boolean; error?: string } {
  const res = validateUtm({ easting, northing, zone });
  if (!res.isValid) {
    return { isValid: false, error: res.error };
  }
  return { isValid: true };
}

/**
 * Validates Indian 1975 UTM easting and northing bounds for Thailand zones (47N/48N) using Zod.
 */
export function validateIndian1975Coordinates(easting: number, northing: number, zone: 47 | 48): { isValid: boolean; error?: string } {
  const res = validateIndian1975({ easting, northing, zone });
  if (!res.isValid) {
    return { isValid: false, error: res.error };
  }
  return { isValid: true };
}

/**
 * Determine Thailand UTM zone (Zone 47: 96°E - 102°E, Zone 48: 102°E - 108°E)
 */
export function calculateUtmZone(lng: number): 47 | 48 {
  // Boundary line is 102.0 degrees East longitude
  return lng >= 102.0 ? 48 : 47;
}

/**
 * Convert DMS to Decimal Degrees with validation
 */
export function dmsToDecimal(deg: number, min: number, sec: number, direction?: 'N' | 'S' | 'E' | 'W'): number {
  if (isNaN(deg) || isNaN(min) || isNaN(sec)) {
    throw new Error('ค่าองศา ลิปดา หรือพิลิปดาต้องเป็นตัวเลขที่ถูกต้อง');
  }
  if (min < 0 || min >= 60) {
    throw new Error(`ค่าลิปดา (Minute) ต้องอยู่ระหว่าง 0 ถึง 59 ลิปดา (ตรวจพบ: ${min})`);
  }
  if (sec < 0 || sec >= 60) {
    throw new Error(`ค่าพิลิปดา (Second) ต้องอยู่ระหว่าง 0.00 ถึง 59.99 พิลิปดา (ตรวจพบ: ${sec})`);
  }
  let dd = Math.abs(deg) + (min / 60.0) + (sec / 3600.0);
  if (deg < 0 || direction === 'S' || direction === 'W') {
    dd = -dd;
  }
  return Number(dd.toFixed(8));
}

/**
 * Convert Decimal Degrees to DMS format
 */
export function decimalToDms(dd: number, isLat: boolean): DMSVal {
  const sign = dd < 0 ? -1 : 1;
  const absDd = Math.abs(dd);
  let deg = Math.floor(absDd);
  const remMin = (absDd - deg) * 60.0;
  let min = Math.floor(remMin);
  let sec = Number(((remMin - min) * 60.0).toFixed(3));

  if (sec >= 60.0) {
    sec = 0.0;
    min += 1;
  }
  if (min >= 60) {
    min = 0;
    deg += 1;
  }

  let direction: 'N' | 'S' | 'E' | 'W';
  if (isLat) {
    direction = sign >= 0 ? 'N' : 'S';
  } else {
    direction = sign >= 0 ? 'E' : 'W';
  }

  return { deg, min, sec, direction };
}

/**
 * Format DMS nicely into string
 */
export function formatDms(dms: DMSVal): string {
  const s = dms.sec.toFixed(2).padStart(5, '0');
  return `${dms.deg}° ${dms.min}' ${s}" ${dms.direction}`;
}

/**
 * Convert WGS84 Geographic to UTM
 */
export function forwardWgs84ToUtm(lat: number, lng: number, forcedZone?: 47 | 48): UTMCoord {
  const geoVal = validateGeographicCoordinates(lat, lng);
  if (!geoVal.isValid) {
    throw new Error(geoVal.error);
  }
  const zone = forcedZone || calculateUtmZone(lng);
  const epsgCode = `EPSG:326${zone}`;
  
  // Proj4 takes [lng, lat] and returns [easting, northing]
  const [easting, northing] = proj4(EPSG_4326, epsgCode, [lng, lat]);

  return {
    zone,
    hemisphere: 'N',
    easting: Number(easting.toFixed(4)),
    northing: Number(northing.toFixed(4)),
    epsg: epsgCode
  };
}

/**
 * Convert UTM to WGS84 Geographic
 */
export function inverseUtmToWgs84(easting: number, northing: number, zone: 47 | 48): LatLonDD {
  const utmVal = validateUtmCoordinates(easting, northing, zone);
  if (!utmVal.isValid) {
    throw new Error(utmVal.error);
  }
  const epsgCode = `EPSG:326${zone}`;
  const [lng, lat] = proj4(epsgCode, EPSG_4326, [easting, northing]);

  return {
    lat: Number(lat.toFixed(8)),
    lng: Number(lng.toFixed(8))
  };
}

/**
 * Convert WGS84 Geographic to Indian 1975 UTM (with Thailand 7-parameter shift)
 */
export function forwardWgs84ToIndian1975(lat: number, lng: number, forcedZone?: 47 | 48): Indian1975Coord {
  const geoVal = validateGeographicCoordinates(lat, lng);
  if (!geoVal.isValid) {
    throw new Error(geoVal.error);
  }
  const zone = forcedZone || calculateUtmZone(lng);
  const epsgCode = `EPSG:240${zone}`;
  
  const [easting, northing] = proj4(EPSG_4326, epsgCode, [lng, lat]);

  return {
    zone,
    easting: Number(easting.toFixed(4)),
    northing: Number(northing.toFixed(4)),
    epsg: epsgCode
  };
}

/**
 * Convert Indian 1975 UTM to WGS84 Geographic
 */
export function inverseIndian1975ToWgs84(easting: number, northing: number, zone: 47 | 48): LatLonDD {
  const val = validateIndian1975Coordinates(easting, northing, zone);
  if (!val.isValid) {
    throw new Error(val.error);
  }
  const epsgCode = `EPSG:240${zone}`;
  const [lng, lat] = proj4(epsgCode, EPSG_4326, [easting, northing]);

  return {
    lat: Number(lat.toFixed(8)),
    lng: Number(lng.toFixed(8))
  };
}

/**
 * Complete synchronized coordinate converter
 */
export function convertComplete(lat: number, lng: number): CompleteCoordinateSet {
  const zone = calculateUtmZone(lng);
  const utm = forwardWgs84ToUtm(lat, lng, zone);
  const ind1975 = forwardWgs84ToIndian1975(lat, lng, zone);

  return {
    wgs84_dd: { lat, lng },
    wgs84_dms: {
      lat: decimalToDms(lat, true),
      lng: decimalToDms(lng, false)
    },
    wgs84_utm: utm,
    indian1975_utm: ind1975
  };
}
