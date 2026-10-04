/**
 * Production Coordinate String Parser for MeMaps Search Box
 * Handles:
 * 1. Decimal Degrees (DD): e.g. "13.8476, 100.5696", "13.8476 100.5696", "13,8476; 100,5696", "-13.84, 100.56"
 * 2. Reversed Longitude/Latitude: e.g. "100.5696, 13.8476" (Auto-swaps based on Thailand bounds Lat 5-21, Lng 97-106)
 * 3. Degrees Minutes Seconds (DMS): e.g. "13°50'51.4\"N 100°34'10.6\"E", "13 50 51.4 N; 100 34 10.6 E"
 * 4. UTM Grid with MGRS Latitude Bands:
 *    - 47N (0-8°N Southern Thailand, e.g. Songkhla, Yala)
 *    - 47P (8-16°N Central Thailand, e.g. Bangkok)
 *    - 47Q (16-24°N Northern Thailand, e.g. Chiang Mai, Chiang Rai)
 *    - 48P (8-16°N Eastern/Northeastern Thailand, e.g. Ubon, Khon Kaen)
 * 5. Datum Selection: WGS84 vs Indian 1975
 */

import { inverseUtmToWgs84, inverseIndian1975ToWgs84, dmsToDecimal } from '../core/projections';
import { LatLng } from '../types/survey';

export interface ParsedCoordinateResult {
  coord: LatLng;
  format: 'DD' | 'DMS' | 'UTM';
  datum: 'WGS84' | 'INDIAN1975';
  rawInput: string;
  label: string;
  wasSwapped?: boolean;
  latitudeBand?: string;
  warning?: string;
}

export function parseCoordinateString(
  input: string,
  targetDatum: 'WGS84' | 'INDIAN1975' = 'WGS84'
): ParsedCoordinateResult | null {
  if (!input || typeof input !== 'string') return null;
  const text = input.trim();
  if (!text || text.length > 300) return null;

  // Normalize delimiters: replace tabs and semicolons with commas or spaces
  const normalized = text.replace(/[\t;]+/g, ' ');

  // 1. Try Decimal Degrees (DD): e.g. "13.8476, 100.5696" or "13,8476 100,5696"
  // Normalize comma decimal if both parts use it with space separator e.g. "13,8476 100,5696"
  const commaDecMatch = normalized.match(/^([+-]?\d{1,2}),(\d+)\s+([+-]?\d{1,3}),(\d+)$/);
  const ddSource = commaDecMatch
    ? `${commaDecMatch[1]}.${commaDecMatch[2]}, ${commaDecMatch[3]}.${commaDecMatch[4]}`
    : normalized;

  const ddRegex = /^([+-]?\d{1,3}(?:\.\d+)?)[,\s]+([+-]?\d{1,3}(?:\.\d+)?)$/;
  const ddMatch = ddSource.match(ddRegex);
  if (ddMatch) {
    let valA = parseFloat(ddMatch[1]);
    let valB = parseFloat(ddMatch[2]);

    if (!isNaN(valA) && !isNaN(valB)) {
      let lat = valA;
      let lng = valB;
      let wasSwapped = false;

      // Detect inverted Lng, Lat: e.g. "100.5696, 13.8476"
      // Thailand envelope: Lat is ~5 to 21, Lng is ~97 to 106
      if (valA >= 90 && valA <= 115 && valB >= -10 && valB <= 30) {
        lat = valB;
        lng = valA;
        wasSwapped = true;
      }

      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          coord: { lat, lng },
          format: 'DD',
          datum: targetDatum,
          rawInput: text,
          wasSwapped,
          label: `พิกัด DD: ${lat.toFixed(6)}, ${lng.toFixed(6)}${wasSwapped ? ' (สลับ Lng, Lat อัตโนมัติ)' : ''}`
        };
      }
    }
  }

  // 2. Try DMS format: e.g. 13°50'51.4"N 100°34'10.6"E or 13 50 51.4 N 100 34 10.6 E
  const dmsRegex = /(\d{1,2})[°\s]+(\d{1,2})['\s]+(\d{1,2}(?:\.\d+)?)["]?\s*([NSns])[,\s]+(\d{1,3})[°\s]+(\d{1,2})['\s]+(\d{1,2}(?:\.\d+)?)["]?\s*([EWew])/;
  const dmsMatch = normalized.match(dmsRegex);
  if (dmsMatch) {
    try {
      const latDeg = parseInt(dmsMatch[1], 10);
      const latMin = parseInt(dmsMatch[2], 10);
      const latSec = parseFloat(dmsMatch[3]);
      const latDir = dmsMatch[4].toUpperCase() as 'N' | 'S';

      const lngDeg = parseInt(dmsMatch[5], 10);
      const lngMin = parseInt(dmsMatch[6], 10);
      const lngSec = parseFloat(dmsMatch[7]);
      const lngDir = dmsMatch[8].toUpperCase() as 'E' | 'W';

      const lat = dmsToDecimal(latDeg, latMin, latSec, latDir);
      const lng = dmsToDecimal(lngDeg, lngMin, lngSec, lngDir);

      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          coord: { lat, lng },
          format: 'DMS',
          datum: targetDatum,
          rawInput: text,
          label: `พิกัด DMS: ${latDeg}°${latMin}'${latSec}"${latDir} ${lngDeg}°${lngMin}'${lngSec}"${lngDir}`
        };
      }
    } catch {
      // Invalid DMS component values (e.g. min >= 60)
    }
  }

  // 3. Try UTM format: e.g. "47P 667000 1531000", "47Q 492071 2078928", "47N 676021 797456", "48P 269354 1818738"
  // Format 3A: Zone + Band + Easting + Northing
  const utmMgrs = /^(4[78])\s*([NPQnpq])?\s+(\d{6}(?:\.\d+)?)[,\s]+(\d{6,7}(?:\.\d+)?)$/i;
  const matchA = normalized.match(utmMgrs);
  if (matchA) {
    const zone = parseInt(matchA[1], 10) as 47 | 48;
    const band = matchA[2] ? matchA[2].toUpperCase() : undefined;
    const easting = parseFloat(matchA[3]);
    const northing = parseFloat(matchA[4]);

    try {
      const coord =
        targetDatum === 'INDIAN1975'
          ? inverseIndian1975ToWgs84(easting, northing, zone)
          : inverseUtmToWgs84(easting, northing, zone);

      let warning: string | undefined;
      // Validate latitude band consistency against northing
      if (band === 'N' && northing >= 885000) {
        warning = 'แถบละติจูด N ครอบคลุมภาคใต้ (0–8°N) แต่ค่า Northing อยู่ในเขตภาคกลาง/เหนือ';
      } else if (band === 'Q' && northing < 1770000) {
        warning = 'แถบละติจูด Q ครอบคลุมภาคเหนือ (16–24°N) แต่ค่า Northing อยู่ในเขตภาคกลาง/ใต้';
      }

      return {
        coord,
        format: 'UTM',
        datum: targetDatum,
        latitudeBand: band,
        rawInput: text,
        warning,
        label: `UTM ${zone}${band || 'N'} · ${targetDatum}: E ${easting.toLocaleString()} m, N ${northing.toLocaleString()} m`
      };
    } catch {
      // Out of bounds UTM numbers
    }
  }

  // Format 3B: "E 667000 N 1531000 zone 47" or "zone 47 E 667000 N 1531000"
  const utmVerbose = /(?:zone\s*(4[78]))?.*?[Ee](?:asting)?\s*[:=]?\s*(\d{6}(?:\.\d+)?).*?[Nn](?:orthing)?\s*[:=]?\s*(\d{6,7}(?:\.\d+)?)(?:.*?zone\s*(4[78]))?/i;
  const matchB = normalized.match(utmVerbose);
  if (matchB) {
    const zoneStr = matchB[1] || matchB[4] || '47';
    const zone = parseInt(zoneStr, 10) as 47 | 48;
    const easting = parseFloat(matchB[2]);
    const northing = parseFloat(matchB[3]);

    try {
      const coord =
        targetDatum === 'INDIAN1975'
          ? inverseIndian1975ToWgs84(easting, northing, zone)
          : inverseUtmToWgs84(easting, northing, zone);

      return {
        coord,
        format: 'UTM',
        datum: targetDatum,
        rawInput: text,
        label: `UTM Zone ${zone}N · ${targetDatum}: E ${easting.toLocaleString()} m, N ${northing.toLocaleString()} m`
      };
    } catch {
      // Out of bounds UTM numbers
    }
  }

  return null;
}
