import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TraverseLegInput, LevelingRowInput } from '../types/survey';
import { 
  SAMPLE_TRAVERSE_LEGS, 
  SAMPLE_TRAVERSE_START, 
  SAMPLE_LEVELING_ROWS, 
  SAMPLE_LEVELING_START_ELEVATION 
} from '../data/survey-presets';
import { trackEvent } from '../lib/telemetry';

export interface PlottedTraverseOverlay {
  stations: {
    station: string;
    lat: number;
    lng: number;
    easting: number;
    northing: number;
  }[];
  polyline: [number, number][]; // [lat, lng] for Leaflet polyline
  isClosed: boolean;
  totalPerimeter: number;
  linearMisclosure: number;
  precisionRatio: number;
  precisionGrade: string;
}

export interface InspectedCoordinate {
  lat: number;
  lng: number;
  label?: string;
  timestamp: number;
}

interface SurveyStoreState {
  // --- Traverse State ---
  traverseStartE: string;
  traverseStartN: string;
  traverseIsClosedLoop: boolean;
  traverseEndE: string;
  traverseEndN: string;
  traverseLegs: TraverseLegInput[];
  traverseLastSaved: number;

  // Traverse Actions
  setTraverseStart: (e: string, n: string) => void;
  setTraverseEnd: (e: string, n: string, isClosed: boolean) => void;
  setTraverseIsClosed: (isClosed: boolean) => void;
  updateTraverseLeg: (index: number, field: keyof TraverseLegInput, value: any) => void;
  addTraverseLeg: () => void;
  removeTraverseLeg: (index: number) => void;
  resetTraverseToSample: () => void;
  clearTraverse: () => void;

  // --- Leveling State ---
  levelingStartElevation: string;
  levelingLoopDistanceKm: string;
  levelingRows: LevelingRowInput[];
  levelingLastSaved: number;

  // Leveling Actions
  setLevelingStartElevation: (elev: string) => void;
  setLevelingLoopDistanceKm: (distKm: string) => void;
  updateLevelingRow: (index: number, field: keyof LevelingRowInput, value: string) => void;
  addLevelingRow: () => void;
  removeLevelingRow: (index: number) => void;
  resetLevelingToSample: () => void;
  clearLeveling: () => void;

  // --- Cross-Module Coordinate Bridge & Overlays ---
  inspectedCoordinate: InspectedCoordinate | null;
  setInspectedCoordinate: (coord: { lat: number; lng: number; label?: string; timestamp?: number } | null) => void;
  clearInspectedCoordinate: () => void;
  consumeInspectedCoordinate: () => InspectedCoordinate | null;

  plottedTraverseOverlay: PlottedTraverseOverlay | null;
  setPlottedTraverseOverlay: (overlay: PlottedTraverseOverlay | null) => void;
  clearPlottedTraverseOverlay: () => void;
}

export const useSurveyStore = create<SurveyStoreState>()(
  persist(
    (set, get) => ({
      // Default Traverse
      traverseStartE: SAMPLE_TRAVERSE_START.easting.toString(),
      traverseStartN: SAMPLE_TRAVERSE_START.northing.toString(),
      traverseIsClosedLoop: true,
      traverseEndE: SAMPLE_TRAVERSE_START.easting.toString(),
      traverseEndN: SAMPLE_TRAVERSE_START.northing.toString(),
      traverseLegs: SAMPLE_TRAVERSE_LEGS,
      traverseLastSaved: Date.now(),

      setTraverseStart: (e, n) => {
        set({ traverseStartE: e, traverseStartN: n, traverseLastSaved: Date.now() });
      },

      setTraverseEnd: (e, n, isClosed) => {
        set({ traverseEndE: e, traverseEndN: n, traverseIsClosedLoop: isClosed, traverseLastSaved: Date.now() });
      },

      setTraverseIsClosed: (isClosed) => {
        const state = get();
        set({
          traverseIsClosedLoop: isClosed,
          traverseEndE: isClosed ? state.traverseStartE : state.traverseEndE,
          traverseEndN: isClosed ? state.traverseStartN : state.traverseEndN,
          traverseLastSaved: Date.now()
        });
      },

      updateTraverseLeg: (index, field, value) => {
        const { traverseLegs } = get();
        const updated = [...traverseLegs];
        updated[index] = {
          ...updated[index],
          [field]: field === 'distance' || field === 'azimuthDeg' ? parseFloat(value) || 0 : value
        };
        set({ traverseLegs: updated, traverseLastSaved: Date.now() });
      },

      addTraverseLeg: () => {
        const { traverseLegs } = get();
        const lastLeg = traverseLegs[traverseLegs.length - 1];
        const newStation = lastLeg ? lastLeg.targetStation : 'T-1';
        const newTarget = `T-${traverseLegs.length + 1}`;
        const newLeg: TraverseLegInput = {
          station: newStation,
          targetStation: newTarget,
          distance: 100.0,
          azimuthDeg: 90.0
        };
        set({ traverseLegs: [...traverseLegs, newLeg], traverseLastSaved: Date.now() });
        trackEvent('traverse_add_station', { totalStations: traverseLegs.length + 1 });
      },

      removeTraverseLeg: (index) => {
        const { traverseLegs } = get();
        if (traverseLegs.length <= 1) return;
        set({
          traverseLegs: traverseLegs.filter((_, i) => i !== index),
          traverseLastSaved: Date.now()
        });
      },

      resetTraverseToSample: () => {
        set({
          traverseStartE: SAMPLE_TRAVERSE_START.easting.toString(),
          traverseStartN: SAMPLE_TRAVERSE_START.northing.toString(),
          traverseIsClosedLoop: true,
          traverseEndE: SAMPLE_TRAVERSE_START.easting.toString(),
          traverseEndN: SAMPLE_TRAVERSE_START.northing.toString(),
          traverseLegs: SAMPLE_TRAVERSE_LEGS,
          traverseLastSaved: Date.now()
        });
        trackEvent('traverse_reset_sample');
      },

      clearTraverse: () => {
        set({
          traverseLegs: [
            { station: 'ST-1', targetStation: 'ST-2', distance: 100, azimuthDeg: 0 }
          ],
          traverseLastSaved: Date.now()
        });
        trackEvent('traverse_clear');
      },

      // Default Leveling
      levelingStartElevation: SAMPLE_LEVELING_START_ELEVATION.toString(),
      levelingLoopDistanceKm: '0.85',
      levelingRows: SAMPLE_LEVELING_ROWS,
      levelingLastSaved: Date.now(),

      setLevelingStartElevation: (elev) => {
        set({ levelingStartElevation: elev, levelingLastSaved: Date.now() });
      },

      setLevelingLoopDistanceKm: (distKm) => {
        set({ levelingLoopDistanceKm: distKm, levelingLastSaved: Date.now() });
      },

      updateLevelingRow: (index, field, value) => {
        const { levelingRows } = get();
        const updated = [...levelingRows];
        if (field === 'bs' || field === 'ifs' || field === 'fs') {
          const numVal = value.trim() === '' ? null : parseFloat(value);
          updated[index] = { ...updated[index], [field]: isNaN(numVal as any) ? null : numVal };
        } else {
          updated[index] = { ...updated[index], [field]: value };
        }
        set({ levelingRows: updated, levelingLastSaved: Date.now() });
      },

      addLevelingRow: () => {
        const { levelingRows } = get();
        const newId = (levelingRows.length + 1).toString();
        const newRow: LevelingRowInput = {
          id: newId,
          station: `ST-${newId}`,
          bs: null,
          ifs: null,
          fs: null,
          remark: ''
        };
        set({ levelingRows: [...levelingRows, newRow], levelingLastSaved: Date.now() });
        trackEvent('leveling_add_row', { totalRows: levelingRows.length + 1 });
      },

      removeLevelingRow: (index) => {
        const { levelingRows } = get();
        if (levelingRows.length <= 1) return;
        set({
          levelingRows: levelingRows.filter((_, i) => i !== index),
          levelingLastSaved: Date.now()
        });
      },

      resetLevelingToSample: () => {
        set({
          levelingStartElevation: SAMPLE_LEVELING_START_ELEVATION.toString(),
          levelingLoopDistanceKm: '0.85',
          levelingRows: SAMPLE_LEVELING_ROWS,
          levelingLastSaved: Date.now()
        });
        trackEvent('leveling_reset_sample');
      },

      clearLeveling: () => {
        set({
          levelingRows: [
            { id: '1', station: 'BM-1', bs: 1.5, ifs: null, fs: null, remark: 'Start Bench Mark' },
            { id: '2', station: 'TP-1', bs: null, ifs: null, fs: 1.2, remark: '' }
          ],
          levelingLastSaved: Date.now()
        });
        trackEvent('leveling_clear');
      },

      // --- Cross-Module Coordinate Bridge & Overlays ---
      inspectedCoordinate: null,
      setInspectedCoordinate: (coord) => {
        if (!coord) {
          set({ inspectedCoordinate: null });
        } else {
          set({
            inspectedCoordinate: {
              lat: coord.lat,
              lng: coord.lng,
              label: coord.label,
              timestamp: coord.timestamp || Date.now()
            }
          });
        }
      },
      clearInspectedCoordinate: () => {
        set({ inspectedCoordinate: null });
      },
      consumeInspectedCoordinate: () => {
        const current = get().inspectedCoordinate;
        if (current) {
          set({ inspectedCoordinate: null });
        }
        return current;
      },

      plottedTraverseOverlay: null,
      setPlottedTraverseOverlay: (overlay) => {
        set({ plottedTraverseOverlay: overlay });
      },
      clearPlottedTraverseOverlay: () => {
        set({ plottedTraverseOverlay: null });
      }
    }),
    {
      name: 'mesurv-survey-storage-v1',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
