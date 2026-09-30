/**
 * MeMaps Services - High Precision Mapping, Geocoding & Routing for MeSurv
 * Powered by OpenStreetMap Nominatim & OSRM Open Routing with Survey-Grade Thai Landmarks
 */

import { PlaceSearchResult, RouteResult, RouteStep, SavedPlace, TravelMode } from '../types/memaps';
import { forwardWgs84ToUtm } from './projections';

// Curated Thai Landmarks & Survey Reference Stations
export const THAI_PRESET_PLACES: PlaceSearchResult[] = [
  {
    id: 'ku-survey',
    name: 'ภาควิชาวิศวกรรมสำรวจ ม.เกษตรศาสตร์ (บางเขน)',
    nameEn: 'Dept of Survey Engineering, Kasetsart University',
    description: 'คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ บางเขน กรุงเทพฯ',
    lat: 13.8476,
    lng: 100.5696,
    category: 'university',
    address: '50 ถนนงามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900'
  },
  {
    id: 'rtsd-hq',
    name: 'กรมแผนที่ทหาร (Royal Thai Survey Dept)',
    nameEn: 'Royal Thai Survey Department',
    description: 'กองบัญชาการกองทัพไทย หลักหมุดปฐมภูมิรังวัดประเทศไทย',
    lat: 13.7525,
    lng: 100.4941,
    category: 'survey',
    address: 'ถนนกัลยาณไมตรี แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพฯ'
  },
  {
    id: 'grand-palace',
    name: 'พระบรมมหาราชวัง & วัดพระแก้ว',
    nameEn: 'Grand Palace & Wat Phra Kaew',
    description: 'ศูนย์กลางประวัติศาสตร์และหลักเมืองกรุงเทพมหานคร',
    lat: 13.7500,
    lng: 100.4914,
    category: 'landmark',
    address: 'ถนนหน้าพระลาน แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพฯ'
  },
  {
    id: 'bkk-central-station',
    name: 'สถานีกลางกรุงเทพอภิวัฒน์ (บางซื่อ)',
    nameEn: 'Krung Thep Aphiwat Central Terminal',
    description: 'ศูนย์กลางระบบรางและโครงข่ายขนส่งมวลชนแห่งชาติ',
    lat: 13.8038,
    lng: 100.5404,
    category: 'station',
    address: 'ถนนกำแพงเพชร แขวงจตุจักร เขตจตุจักร กรุงเทพฯ'
  },
  {
    id: 'suvarnabhumi-airport',
    name: 'ท่าอากาศยานสุวรรณภูมิ (BKK)',
    nameEn: 'Suvarnabhumi International Airport',
    description: 'สนามบินหลักนานาชาติและหมุดควบคุมการบิน',
    lat: 13.6900,
    lng: 100.7501,
    category: 'station',
    address: 'ตำบลหนองปรือ อำเภอบางพลี จังหวัดสมุทรปราการ'
  },
  {
    id: 'victory-monument',
    name: 'อนุสาวรีย์ชัยสมรภูมิ',
    nameEn: 'Victory Monument',
    description: 'วงเวียนหลักคมนาคมและจุดตัดระบบรางใจกลางกรุงเทพฯ',
    lat: 13.7649,
    lng: 100.5383,
    category: 'landmark',
    address: 'ถนนพญาไท แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพฯ'
  },
  {
    id: 'iconsiam',
    name: 'ไอคอนสยาม (ICONSIAM)',
    nameEn: 'ICONSIAM',
    description: 'แลนด์มาร์กริมแม่น้ำเจ้าพระยา เขตคลองสาน',
    lat: 13.7267,
    lng: 100.5108,
    category: 'landmark',
    address: '299 ถนนเจริญนคร แขวงคลองต้นไทร เขตคลองสาน กรุงเทพฯ'
  },
  {
    id: 'rtsd-khao-krasang',
    name: 'หมุดหลักฐานปฐมภูมิ เขากระโจม / เขากระสัง',
    nameEn: 'RTSD Primary Geodetic Network Station',
    description: 'สถานีโครงข่ายยีโอเดซีปฐมภูมิสำหรับการรังวัดพิกัดระวางแผนที่',
    lat: 14.5320,
    lng: 100.9150,
    category: 'survey',
    address: 'สถานีหมุดหลักฐานดาวเทียมถาวร GNSS CORS กรมแผนที่ทหาร'
  }
];

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org';
const SAVED_PLACES_KEY = 'mesurv_memaps_saved_places';

/**
 * Search places by query string (combines Thai presets + OSM Nominatim)
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal
): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return THAI_PRESET_PLACES;
  }

  const qLower = trimmed.toLowerCase();

  // 1. Filter local presets first
  const localMatches = THAI_PRESET_PLACES.filter(
    p =>
      p.name.toLowerCase().includes(qLower) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(qLower)) ||
      p.description.toLowerCase().includes(qLower) ||
      (p.address && p.address.toLowerCase().includes(qLower))
  );

  // 2. Fetch from OSM Nominatim (bounded to Thailand for fast relevance)
  try {
    const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&countrycodes=th&limit=7&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'th,en',
        'User-Agent': 'MeSurv-Platform/1.0 (https://mesurv.org)'
      },
      signal
    });

    if (res.ok) {
      const data = await res.json();
      const onlineResults: PlaceSearchResult[] = (data || []).map((item: any, idx: number) => {
        let category: PlaceSearchResult['category'] = 'address';
        const type = item.type || item.class || '';
        if (type.includes('university') || type.includes('school') || type.includes('college')) {
          category = 'university';
        } else if (type.includes('hospital') || type.includes('clinic')) {
          category = 'hospital';
        } else if (type.includes('station') || type.includes('aerodrome') || type.includes('halt') || type.includes('bus_stop')) {
          category = 'station';
        } else if (type.includes('monument') || type.includes('place_of_worship') || type.includes('attraction') || type.includes('tourism')) {
          category = 'landmark';
        }

        const name = item.name || item.display_name.split(',')[0] || trimmed;
        return {
          id: `osm-${item.place_id || idx}`,
          name,
          description: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          category,
          address: item.display_name
        };
      });

      // Merge and deduplicate by proximity (within 50 meters)
      const combined = [...localMatches];
      for (const online of onlineResults) {
        const isDuplicate = combined.some(
          existing =>
            Math.abs(existing.lat - online.lat) < 0.0005 &&
            Math.abs(existing.lng - online.lng) < 0.0005
        );
        if (!isDuplicate) {
          combined.push(online);
        }
      }

      return combined.slice(0, 10);
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    console.warn('MeMaps: Nominatim search failed, fallback to local presets', err);
  }

  return localMatches;
}

/**
 * Reverse geocode a latitude/longitude coordinate to a human address
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<{ name: string; address: string }> {
  try {
    const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'th,en',
        'User-Agent': 'MeSurv-Platform/1.0 (https://mesurv.org)'
      },
      signal
    });

    if (res.ok) {
      const data = await res.json();
      return {
        name: data.name || data.display_name?.split(',')[0] || `พิกัด ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        address: data.display_name || ''
      };
    }
  } catch (err) {
    console.warn('MeMaps: Reverse geocode error', err);
  }

  return {
    name: `พิกัด ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    address: `WGS84: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
  };
}

/**
 * Translate OSRM maneuvers into friendly Thai navigation instructions
 */
function formatStepInstruction(step: any): string {
  const type = step.maneuver?.type || 'continue';
  const modifier = step.maneuver?.modifier || '';
  const road = step.name ? ` เข้าสู่ ${step.name}` : '';

  switch (type) {
    case 'depart':
      return `เริ่มต้นการเดินทาง มุ่งหน้า${modifier ? `ไปทาง${translateModifier(modifier)}` : ''}${road}`;
    case 'arrive':
      return 'ถึงจุดหมายปลายทาง';
    case 'turn':
      return `เลี้ยว${translateModifier(modifier)}${road}`;
    case 'roundabout':
      return `เข้าสู่วงเวียน${step.maneuver?.exit ? ` ทางออกที่ ${step.maneuver.exit}` : ''}${road}`;
    case 'merge':
      return `เบี่ยงรวมเลน${road}`;
    case 'on ramp':
      return `ขึ้นทางลาด/ทางด่วน${road}`;
    case 'off ramp':
      return `ลงทางลาด/ทางออก${road}`;
    case 'fork':
      return `แยก${translateModifier(modifier)}${road}`;
    case 'end of road':
      return `สุดทาง ให้เลี้ยว${translateModifier(modifier)}${road}`;
    case 'continue':
    case 'new name':
    default:
      if (modifier && modifier !== 'straight') {
        return `ชิด${translateModifier(modifier)}${road}`;
      }
      return `ตรงต่อไปตาม${step.name || 'เส้นทาง'}`;
  }
}

function translateModifier(modifier: string): string {
  switch (modifier) {
    case 'left':
      return 'ซ้าย';
    case 'right':
      return 'ขวา';
    case 'slight left':
      return 'ซ้ายเล็กน้อย';
    case 'slight right':
      return 'ขวาเล็กน้อย';
    case 'sharp left':
      return 'ซ้ายหักศอก';
    case 'sharp right':
      return 'ขวาหักศอก';
    case 'straight':
      return 'ตรง';
    case 'uturn':
      return 'กลับรถ';
    default:
      return modifier;
  }
}

/**
 * Fetch Turn-by-Turn routing directions via OSRM
 */
export async function fetchRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TravelMode = 'driving',
  signal?: AbortSignal
): Promise<RouteResult> {
  // Map travel mode to OSRM profile (driving, walking, bike)
  const profile = mode === 'cycling' ? 'bike' : mode;
  const url = `${OSRM_BASE}/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Routing request failed with status: ${res.status}`);
  }

  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error(data.message || 'ไม่พบเส้นทางที่สามารถเชื่อมต่อได้');
  }

  const primaryRoute = data.routes[0];
  const leg = primaryRoute.legs?.[0];

  // OSRM coordinates are [lng, lat], Leaflet polyline requires [lat, lng]
  const coordinates: [number, number][] = primaryRoute.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng]
  );

  const steps: RouteStep[] = (leg?.steps || []).map((step: any) => ({
    instruction: formatStepInstruction(step),
    distanceMeters: Math.round(step.distance || 0),
    durationSeconds: Math.round(step.duration || 0),
    roadName: step.name || 'ทางไม่มีชื่อ',
    modifier: step.maneuver?.modifier,
    type: step.maneuver?.type
  }));

  const distanceMeters = Math.round(primaryRoute.distance || 0);
  const durationSeconds = Math.round(primaryRoute.duration || 0);

  // Formulate a concise summary (e.g. "ผ่าน ถนนวิภาวดีรังสิต (14.2 กม., 22 นาที)")
  const mainRoad = steps.find(s => s.roadName && s.roadName !== 'ทางไม่มีชื่อ')?.roadName;
  const distanceFormatted =
    distanceMeters >= 1000
      ? `${(distanceMeters / 1000).toFixed(1)} กม.`
      : `${distanceMeters} ม.`;
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  const timeFormatted =
    minutes >= 60
      ? `${Math.floor(minutes / 60)} ชม. ${minutes % 60} นาที`
      : `${minutes} นาที`;

  const summary = mainRoad
    ? `ผ่าน ${mainRoad} (${distanceFormatted}, ~${timeFormatted})`
    : `${distanceFormatted}, ~${timeFormatted}`;

  return {
    distanceMeters,
    durationSeconds,
    coordinates,
    steps,
    mode,
    summary
  };
}

/**
 * Storage helpers for Saved Places
 */
export function getSavedPlaces(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(SAVED_PLACES_KEY);
    if (!raw) {
      // Initialize with preset favorite
      const initial: SavedPlace[] = [
        {
          id: 'fav-ku-survey',
          name: 'ภาควิชาวิศวกรรมสำรวจ มก.',
          lat: 13.8476,
          lng: 100.5696,
          utmE: 669670.12,
          utmN: 1531640.45,
          zone: 47,
          category: 'survey',
          note: 'ฐานการเรียนรู้รังวัดและปฏิบัติการ GNSS ประจำ มก.',
          createdAt: new Date().toISOString(),
          color: '#22c55e'
        }
      ];
      localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load saved places', e);
    return [];
  }
}

export function savePlace(place: Omit<SavedPlace, 'id' | 'createdAt'>): SavedPlace {
  const places = getSavedPlaces();
  
  // Calculate UTM automatically if missing
  let utmE = place.utmE;
  let utmN = place.utmN;
  let zone = place.zone;
  if (!utmE || !utmN || !zone) {
    try {
      const utm = forwardWgs84ToUtm(place.lat, place.lng);
      utmE = utm.easting;
      utmN = utm.northing;
      zone = utm.zone;
    } catch {
      // Fallback
      zone = 47;
    }
  }

  const newPlace: SavedPlace = {
    ...place,
    id: `saved-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    utmE,
    utmN,
    zone,
    createdAt: new Date().toISOString()
  };

  const updated = [newPlace, ...places];
  localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updated));
  return newPlace;
}

export function deleteSavedPlace(id: string): void {
  const places = getSavedPlaces().filter(p => p.id !== id);
  localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(places));
}
