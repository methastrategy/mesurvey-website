/**
 * RFC 7946 GeoJSON Validator for Survey Engineering & Field WebGIS
 * Validates coordinate reference system (WGS84 EPSG:4326), geometry bounds,
 * and detects common surveyor blunders such as UTM projected meters or inverted Lat/Lng.
 */

export interface GeoJsonValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  featureCount: number;
  bounds?: [[number, number], [number, number]]; // [[minLat, minLng], [maxLat, maxLng]]
}

export function validateGeoJsonRFC7946(rawJson: unknown): GeoJsonValidationResult {
  if (!rawJson || typeof rawJson !== 'object') {
    return {
      isValid: false,
      error: 'รูปแบบข้อมูลไม่ถูกต้อง: ไฟล์ต้องเป็น JSON Object ตามมาตรฐาน RFC 7946',
      featureCount: 0
    };
  }

  const obj = rawJson as Record<string, any>;
  const validTypes = [
    'FeatureCollection',
    'Feature',
    'Point',
    'MultiPoint',
    'LineString',
    'MultiLineString',
    'Polygon',
    'MultiPolygon',
    'GeometryCollection'
  ];

  if (!obj.type || !validTypes.includes(obj.type)) {
    return {
      isValid: false,
      error: `ประเภทข้อมูลไม่ถูกต้อง: ตรวจพบ type "${obj.type || 'ไม่มี'}" ซึ่งไม่ตรงกับมาตรฐาน GeoJSON RFC 7946`,
      featureCount: 0
    };
  }

  // Extract features
  let features: any[] = [];
  if (obj.type === 'FeatureCollection') {
    if (!Array.isArray(obj.features)) {
      return {
        isValid: false,
        error: 'โครงสร้าง FeatureCollection ไม่ถูกต้อง: คุณสมบัติ "features" ต้องเป็น Array',
        featureCount: 0
      };
    }
    if (obj.features.length === 0) {
      return {
        isValid: false,
        error: 'ไฟล์ FeatureCollection ว่างเปล่า: ไม่พบชั้นข้อมูลหรือฟีเจอร์สำรวจ (features = 0) กรุณาตรวจสอบการเลือกเลเยอร์ส่งออกจากโปรแกรม GIS',
        featureCount: 0
      };
    }
    features = obj.features;
  } else if (obj.type === 'Feature') {
    features = [obj];
  } else {
    // Direct geometry object
    features = [{ type: 'Feature', geometry: obj, properties: {} }];
  }

  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  let detectedUtmMeters = false;
  let detectedInvertedCoords = false;
  let detectedOutOfRange = false;
  let coordCount = 0;

  function scanCoordinates(coords: any): void {
    if (!Array.isArray(coords)) return;

    if (
      coords.length >= 2 &&
      typeof coords[0] === 'number' &&
      typeof coords[1] === 'number'
    ) {
      // RFC 7946 specifies coordinates as [longitude, latitude, (elevation)]
      const lng = coords[0];
      const lat = coords[1];
      coordCount++;

      // Check for UTM projected meters blunder (coordinates > 1,000 or > 100,000)
      if (Math.abs(lng) > 1000 || Math.abs(lat) > 1000) {
        detectedUtmMeters = true;
      }
      // Check for latitude/longitude inversion: lat > 90 but <= 180 and lng <= 90
      else if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
        detectedInvertedCoords = true;
      }
      // Check for general out-of-bounds WGS84 coordinates
      else if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        detectedOutOfRange = true;
      }

      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      }
      return;
    }

    for (const item of coords) {
      scanCoordinates(item);
    }
  }

  function scanGeometry(geom: any): void {
    if (!geom || typeof geom !== 'object') return;
    if (geom.type === 'GeometryCollection' && Array.isArray(geom.geometries)) {
      for (const subGeom of geom.geometries) {
        scanGeometry(subGeom);
      }
    } else if (geom.coordinates) {
      scanCoordinates(geom.coordinates);
    }
  }

  for (const feat of features) {
    if (feat && feat.geometry) {
      scanGeometry(feat.geometry);
    }
  }

  if (detectedUtmMeters) {
    return {
      isValid: false,
      error: 'ตรวจพบพิกัดกริดโปรเจกชันเมตร (เช่น UTM E/N > 100,000 ม.) แทนค่าพิกัดภูมิศาสตร์องศา WGS84: มาตรฐาน RFC 7946 กำหนดให้ใช้พิกัด WGS84 EPSG:4326 (Longitude, Latitude) ในหน่วยองศาทศนิยม กรุณาแปลงค่าพิกัดด้วยเครื่องมือแปลงพิกัด (Coordinate Converter) หรือ Reproject ใน QGIS/ArcGIS ก่อนนำเข้า',
      featureCount: features.length
    };
  }

  if (detectedInvertedCoords) {
    return {
      isValid: false,
      error: 'ตรวจพบการสลับแกนพิกัด (Inverted Latitude/Longitude): ค่าพิกัดแกน Y เกิน 90° ตามมาตรฐาน RFC 7946 ลำดับต้องเป็น [Longitude, Latitude]',
      featureCount: features.length
    };
  }

  if (detectedOutOfRange) {
    return {
      isValid: false,
      error: 'ค่าพิกัดอยู่นอกขอบเขตระบบพิกัดภูมิศาสตร์ WGS84: Latitude ต้องอยู่ในช่วง [-90, 90] และ Longitude ต้องอยู่ในช่วง [-180, 180]',
      featureCount: features.length
    };
  }

  if (coordCount === 0) {
    return {
      isValid: false,
      error: 'ไม่พบพิกัดเรขาคณิต (Geometry Coordinates) ในข้อมูลฟีเจอร์ กรุณาตรวจสอบไฟล์',
      featureCount: features.length
    };
  }

  let warning: string | undefined;
  // Thailand domain check: roughly Lat 5.5 to 20.5 N, Lng 97.3 to 105.7 E
  const isOutsideThailand =
    maxLat < 5.0 || minLat > 21.0 || maxLng < 97.0 || minLng > 106.0;

  if (isOutsideThailand) {
    warning = `พิกัดอยู่นอกขอบเขตประเทศไทย (Lat: ${minLat.toFixed(4)}° ถึง ${maxLat.toFixed(4)}°, Lng: ${minLng.toFixed(4)}° ถึง ${maxLng.toFixed(4)}°) แผนที่จะปรับมุมมองไปยังตำแหน่งพิกัดจริงตามไฟล์`;
  }

  return {
    isValid: true,
    warning,
    featureCount: features.length,
    bounds: [
      [minLat, minLng],
      [maxLat, maxLng]
    ]
  };
}
