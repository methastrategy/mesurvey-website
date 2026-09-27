import proj4 from 'proj4';
import { 
  LatLonDD, 
  DMSVal, 
  UTMCoord, 
  Indian1975Coord, 
  CompleteCoordinateSet 
} from '../types/survey';

// Define Projections in Proj4
// WGS84 Geographic
const EPSG_4326 = 'EPSG:4326';

// WGS84 UTM Zones for Thailand (Zone 47 and Zone 48)
const EPSG_32647 = '+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs';
const EPSG_32648 = '+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs';

// Indian 1975 (Everest 1830 ellipsoid with Thailand RTSD 7-param Helmert shifts: dx=204, dy=837, dz=294)
// Published & verified by Royal Thai Survey Department
const EPSG_24047 = '+proj=utm +zone=47 +a=6377276.345 +rf=300.8017 +towgs84=204,837,294,0,0,0,0 +units=m +no_defs';
const EPSG_24048 = '+proj=utm +zone=48 +a=6377276.345 +rf=300.8017 +towgs84=204,837,294,0,0,0,0 +units=m +no_defs';

proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
proj4.defs('EPSG:32647', EPSG_32647);
proj4.defs('EPSG:32648', EPSG_32648);
proj4.defs('EPSG:24047', EPSG_24047);
proj4.defs('EPSG:24048', EPSG_24048);

/**
 * Determine Thailand UTM zone (Zone 47: 96°E - 102°E, Zone 48: 102°E - 108°E)
 */
export function calculateUtmZone(lng: number): 47 | 48 {
  // Boundary line is 102.0 degrees East longitude
  return lng >= 102.0 ? 48 : 47;
}

/**
 * Convert DMS to Decimal Degrees
 */
export function dmsToDecimal(deg: number, min: number, sec: number, direction?: 'N' | 'S' | 'E' | 'W'): number {
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
