/**
 * Central Coordinate Reference System (CRS) Registry for MeSurv & MeMaps
 * Consolidates all Projection Definitions, Transformation Parameters, and Provenance Metadata.
 */

export interface CrsDefinition {
  id: string;
  name: string;
  code: string;
  type: 'geographic' | 'projected';
  datum: 'WGS84' | 'INDIAN1975';
  zone?: 47 | 48;
  proj4Def: string;
  source: string;
  provenanceStatus: 'OFFICIAL_EPSG' | 'UNVERIFIED_HISTORICAL_RTSD';
  accuracyNote: string;
}

export const CRS_REGISTRY: Record<string, CrsDefinition> = {
  'EPSG:4326': {
    id: 'EPSG:4326',
    name: 'WGS 84 Geographic (Lat/Lng)',
    code: 'EPSG:4326',
    type: 'geographic',
    datum: 'WGS84',
    proj4Def: '+proj=longlat +datum=WGS84 +no_defs',
    source: 'EPSG Registry / IOGP',
    provenanceStatus: 'OFFICIAL_EPSG',
    accuracyNote: 'Global geodetic reference standard for GPS and modern WebGIS.'
  },
  'EPSG:32647': {
    id: 'EPSG:32647',
    name: 'WGS 84 / UTM Zone 47N (Western/Central/Southern Thailand)',
    code: 'EPSG:32647',
    type: 'projected',
    datum: 'WGS84',
    zone: 47,
    proj4Def: '+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs',
    source: 'EPSG Registry / IOGP',
    provenanceStatus: 'OFFICIAL_EPSG',
    accuracyNote: 'Sub-millimeter mathematical projection accuracy from WGS84 ellipsoid.'
  },
  'EPSG:32648': {
    id: 'EPSG:32648',
    name: 'WGS 84 / UTM Zone 48N (Eastern/Northeastern Thailand >= 102°E)',
    code: 'EPSG:32648',
    type: 'projected',
    datum: 'WGS84',
    zone: 48,
    proj4Def: '+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs',
    source: 'EPSG Registry / IOGP',
    provenanceStatus: 'OFFICIAL_EPSG',
    accuracyNote: 'Sub-millimeter mathematical projection accuracy from WGS84 ellipsoid.'
  },
  'EPSG:24047': {
    id: 'EPSG:24047',
    name: 'Indian 1975 / UTM Zone 47N (Thailand RTSD Grid)',
    code: 'EPSG:24047',
    type: 'projected',
    datum: 'INDIAN1975',
    zone: 47,
    proj4Def: '+proj=utm +zone=47 +a=6377276.345 +rf=300.8017 +towgs84=204,837,294,0,0,0,0 +units=m +no_defs',
    source: 'Royal Thai Survey Department (RTSD) Historical Military Grid',
    provenanceStatus: 'UNVERIFIED_HISTORICAL_RTSD',
    accuracyNote: '3-parameter geocentric translation (dx=204, dy=837, dz=294). Empirical accuracy ~±5-10m across Thailand. Suitable for mapping; not for legal cadastral demarcation.'
  },
  'EPSG:24048': {
    id: 'EPSG:24048',
    name: 'Indian 1975 / UTM Zone 48N (Thailand RTSD Grid)',
    code: 'EPSG:24048',
    type: 'projected',
    datum: 'INDIAN1975',
    zone: 48,
    proj4Def: '+proj=utm +zone=48 +a=6377276.345 +rf=300.8017 +towgs84=204,837,294,0,0,0,0 +units=m +no_defs',
    source: 'Royal Thai Survey Department (RTSD) Historical Military Grid',
    provenanceStatus: 'UNVERIFIED_HISTORICAL_RTSD',
    accuracyNote: '3-parameter geocentric translation (dx=204, dy=837, dz=294). Empirical accuracy ~±5-10m across Thailand. Suitable for mapping; not for legal cadastral demarcation.'
  }
};
