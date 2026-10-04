import { z } from 'zod';
import {
  wgs84CoordSchema,
  latLonDmsSchema,
  utmCoordSchema,
  indian1975CoordSchema,
  traverseLegSchema,
  traverseSetupSchema,
  levelingRowSchema,
  levelingSetupSchema,
  thaiLandAreaSchema,
  sqMetersInputSchema,
  THAILAND_BOUNDS,
  type ValidatedWgs84Coord,
  type ValidatedLatLonDms,
  type ValidatedUtmCoord,
  type ValidatedIndian1975Coord,
  type ValidatedTraverseLeg,
  type ValidatedTraverseSetup,
  type ValidatedLevelingRow,
  type ValidatedLevelingSetup,
  type ValidatedThaiLandArea
} from './survey-schemas';

export interface ValidationSuccess<T> {
  isValid: true;
  data: T;
  warning?: string;
  isInsideThailand?: boolean;
}

export interface ValidationFailure {
  isValid: false;
  error: string;
  issues?: z.ZodIssue[];
  isInsideThailand?: boolean;
}

export type SurveyValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Production-grade numeric sanitizer for survey data entry forms and string inputs.
 * Normalizes:
 * - Thai numerals (๐-๙ -> 0-9)
 * - Unicode minus signs (U+2212, U+2013, U+2014, U+FF0D -> -)
 * - Thousands separator commas (e.g. "669,656.82" -> 669656.82)
 * - European / Thai comma as decimal separator (e.g. "13,84664" -> 13.84664)
 * - Leading/trailing whitespace
 * - Strictly rejects strings with multiple decimal points or trailing invalid characters (e.g. "13.84abc", "13.84.64")
 * Returns number or null if invalid.
 */
export function sanitizeSurveyNumber(val: unknown): number | null {
  if (typeof val === 'number') {
    return !isNaN(val) && isFinite(val) ? val : null;
  }
  if (val === null || val === undefined) return null;
  if (typeof val !== 'string') return null;

  let s = val.trim();
  if (!s) return null;

  // Convert Thai numerals ๐-๙ to 0-9
  s = s.replace(/[๐-๙]/g, d => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(d)));

  // Convert Unicode minus and dashes to ASCII '-'
  s = s.replace(/[\u2212\u2013\u2014\uFF0D]/g, '-');

  // Strip inner spaces if any
  s = s.replace(/\s+/g, '');

  // Handle commas
  if (s.includes(',') && s.includes('.')) {
    // Both comma and dot: comma is thousands separator e.g. "669,656.82"
    s = s.replace(/,/g, '');
  } else if (s.includes(',') && !s.includes('.')) {
    // Only comma present
    if (/^[+-]?\d{1,3}(?:,\d{3})+$/.test(s)) {
      // Thousands separator without decimal e.g. "669,656"
      s = s.replace(/,/g, '');
    } else {
      // Comma decimal separator e.g. "13,84664"
      s = s.replace(',', '.');
    }
  }

  // Strict valid decimal pattern
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(s)) {
    return null;
  }

  const num = Number(s);
  return !isNaN(num) && isFinite(num) ? num : null;
}

/**
 * Formats Zod issues into human-friendly Thai error text for surveyors.
 * Deduplicates identical messages across fields.
 */
export function formatZodError(error: z.ZodError): string {
  const issues = error.issues;
  if (!issues || issues.length === 0) return 'ข้อมูลไม่ถูกต้องตามรูปแบบที่กำหนด';
  const uniqueMessages = Array.from(new Set(issues.map(i => i.message)));
  return uniqueMessages.join(' | ');
}

/**
 * Checks whether coordinates fall strictly within Thailand's geodetic bounding envelope.
 */
export function isWithinThailand(lat: number, lng: number): boolean {
  return (
    lat >= THAILAND_BOUNDS.minLat &&
    lat <= THAILAND_BOUNDS.maxLat &&
    lng >= THAILAND_BOUNDS.minLng &&
    lng <= THAILAND_BOUNDS.maxLng
  );
}

/**
 * Checks whether UTM coordinates fall within Thailand's expected grid envelope.
 */
export function isWithinThailandUtm(easting: number, northing: number): boolean {
  return (
    easting >= THAILAND_BOUNDS.minUtmEasting &&
    easting <= THAILAND_BOUNDS.maxUtmEasting &&
    northing >= THAILAND_BOUNDS.minUtmNorthing &&
    northing <= THAILAND_BOUNDS.maxUtmNorthing
  );
}

/**
 * Validates WGS84 Geographic Coordinates (Decimal Degrees)
 * Safely accepts numbers or sanitized input strings.
 */
export function validateWgs84(input: unknown): SurveyValidationResult<ValidatedWgs84Coord> {
  let normalized = input;
  if (input && typeof input === 'object') {
    const raw = input as Record<string, unknown>;
    normalized = {
      ...raw,
      lat: typeof raw.lat === 'string' ? (sanitizeSurveyNumber(raw.lat) ?? NaN) : raw.lat,
      lng: typeof raw.lng === 'string' ? (sanitizeSurveyNumber(raw.lng) ?? NaN) : raw.lng
    };
  }

  const parseResult = wgs84CoordSchema.safeParse(normalized);
  if (!parseResult.success) {
    return {
      isValid: false,
      error: formatZodError(parseResult.error),
      issues: parseResult.error.issues
    };
  }

  const { lat, lng } = parseResult.data;
  const inThailand = isWithinThailand(lat, lng);
  const warning = !inThailand
    ? `พิกัดอยู่นอกขอบเขตประเทศไทย (Lat: ${lat.toFixed(4)}°, Lng: ${lng.toFixed(4)}°)`
    : undefined;

  return {
    isValid: true,
    data: parseResult.data,
    isInsideThailand: inThailand,
    warning
  };
}

/**
 * Validates Degrees, Minutes, Seconds (DMS)
 * Safely accepts numbers or sanitized input strings.
 */
export function validateDms(input: unknown): SurveyValidationResult<ValidatedLatLonDms> {
  let normalized = input;
  if (input && typeof input === 'object') {
    const raw = input as Record<string, any>;
    const normPart = (p: any) => {
      if (!p || typeof p !== 'object') return p;
      return {
        ...p,
        deg: typeof p.deg === 'string' ? (sanitizeSurveyNumber(p.deg) ?? NaN) : p.deg,
        min: typeof p.min === 'string' ? (sanitizeSurveyNumber(p.min) ?? NaN) : p.min,
        sec: typeof p.sec === 'string' ? (sanitizeSurveyNumber(p.sec) ?? NaN) : p.sec
      };
    };
    normalized = {
      lat: normPart(raw.lat),
      lng: normPart(raw.lng)
    };
  }

  const parseResult = latLonDmsSchema.safeParse(normalized);
  if (!parseResult.success) {
    return {
      isValid: false,
      error: formatZodError(parseResult.error),
      issues: parseResult.error.issues
    };
  }

  return {
    isValid: true,
    data: parseResult.data
  };
}

/**
 * Validates UTM Coordinates (Zone 47N / 48N)
 * Safely accepts numbers or sanitized input strings (e.g. "669,656.82").
 */
export function validateUtm(input: unknown): SurveyValidationResult<ValidatedUtmCoord> {
  let normalized = input;
  if (input && typeof input === 'object') {
    const raw = input as Record<string, unknown>;
    normalized = {
      ...raw,
      easting: typeof raw.easting === 'string' ? (sanitizeSurveyNumber(raw.easting) ?? NaN) : raw.easting,
      northing: typeof raw.northing === 'string' ? (sanitizeSurveyNumber(raw.northing) ?? NaN) : raw.northing,
      zone: typeof raw.zone === 'string' ? (parseInt(raw.zone, 10) || raw.zone) : raw.zone
    };
  }

  const parseResult = utmCoordSchema.safeParse(normalized);
  if (!parseResult.success) {
    return {
      isValid: false,
      error: formatZodError(parseResult.error),
      issues: parseResult.error.issues
    };
  }

  const { easting, northing } = parseResult.data;
  const inThailand = isWithinThailandUtm(easting, northing);
  const warning = !inThailand
    ? `ค่าพิกัด UTM (E: ${easting.toLocaleString()} ม., N: ${northing.toLocaleString()} ม.) อยู่นอกพื้นที่ทำงานหลักในประเทศไทย`
    : undefined;

  return {
    isValid: true,
    data: parseResult.data,
    isInsideThailand: inThailand,
    warning
  };
}

/**
 * Validates Indian 1975 UTM Coordinates
 * Safely accepts numbers or sanitized input strings.
 */
export function validateIndian1975(input: unknown): SurveyValidationResult<ValidatedIndian1975Coord> {
  let normalized = input;
  if (input && typeof input === 'object') {
    const raw = input as Record<string, unknown>;
    normalized = {
      ...raw,
      easting: typeof raw.easting === 'string' ? (sanitizeSurveyNumber(raw.easting) ?? NaN) : raw.easting,
      northing: typeof raw.northing === 'string' ? (sanitizeSurveyNumber(raw.northing) ?? NaN) : raw.northing,
      zone: typeof raw.zone === 'string' ? (parseInt(raw.zone, 10) || raw.zone) : raw.zone
    };
  }

  const parseResult = indian1975CoordSchema.safeParse(normalized);
  if (!parseResult.success) {
    return {
      isValid: false,
      error: formatZodError(parseResult.error),
      issues: parseResult.error.issues
    };
  }

  return {
    isValid: true,
    data: parseResult.data
  };
}

/**
 * Validates a single Traverse Leg Input
 */
export function validateTraverseLeg(input: unknown): SurveyValidationResult<ValidatedTraverseLeg> {
  const parseResult = traverseLegSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      isValid: false,
      error: formatZodError(parseResult.error),
      issues: parseResult.error.issues
    };
  }

  return {
    isValid: true,
    data: parseResult.data
  };
}

/**
 * Validates complete Traverse Setup (Start, End, Legs)
 */
export function validateTraverseSetup(input: unknown): SurveyValidationResult<ValidatedTraverseSetup> {
  const parseResult = traverseSetupSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      isValid: false,
      error: formatZodError(parseResult.error),
      issues: parseResult.error.issues
    };
  }

  return {
    isValid: true,
    data: parseResult.data
  };
}

/**
 * Validates a single Leveling Row Input
 */
export function validateLevelingRow(input: unknown): SurveyValidationResult<ValidatedLevelingRow> {
  const parseResult = levelingRowSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      isValid: false,
      error: formatZodError(parseResult.error),
      issues: parseResult.error.issues
    };
  }

  return {
    isValid: true,
    data: parseResult.data
  };
}

/**
 * Validates complete Differential Leveling Setup
 */
export function validateLevelingSetup(input: unknown): SurveyValidationResult<ValidatedLevelingSetup> {
  const parseResult = levelingSetupSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      isValid: false,
      error: formatZodError(parseResult.error),
      issues: parseResult.error.issues
    };
  }

  return {
    isValid: true,
    data: parseResult.data
  };
}

/**
 * Validates Thai Land Area representation
 */
export function validateThaiLandArea(input: unknown): SurveyValidationResult<ValidatedThaiLandArea> {
  const parseResult = thaiLandAreaSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      isValid: false,
      error: formatZodError(parseResult.error),
      issues: parseResult.error.issues
    };
  }

  return {
    isValid: true,
    data: parseResult.data
  };
}

/**
 * Validates raw square meters input
 */
export function validateSqMeters(input: unknown): SurveyValidationResult<number> {
  const normalized = typeof input === 'string' ? (sanitizeSurveyNumber(input) ?? NaN) : input;
  const parseResult = sqMetersInputSchema.safeParse(normalized);
  if (!parseResult.success) {
    return {
      isValid: false,
      error: formatZodError(parseResult.error),
      issues: parseResult.error.issues
    };
  }

  return {
    isValid: true,
    data: parseResult.data
  };
}
