import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  TraverseLegInput,
  LevelingRowInput,
  TraverseDmsLeg,
  DmsField,
  StadiaRowInput,
  CadastralPolygonPoint
} from '../types/survey';
import { 
  SAMPLE_TRAVERSE_LEGS, 
  SAMPLE_TRAVERSE_START, 
  SAMPLE_LEVELING_ROWS, 
  SAMPLE_LEVELING_START_ELEVATION 
} from '../data/survey-presets';
import {
  Station2D,
  Observation2D,
  LevelingPoint,
  LevelingObservation,
  SAMPLE_2D_TRAVERSE_NETWORK,
  SAMPLE_LEVELING_NETWORK
} from '../utils/least-squares';
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

export const SAMPLE_TRAVERSE_DMS_LEGS: TraverseDmsLeg[] = [
  { id: 'leg-1', station: 'A', targetStation: 'B', distance: '125.340', obsD: '98', obsM: '12', obsS: '30' },
  { id: 'leg-2', station: 'B', targetStation: 'C', distance: '112.880', obsD: '101', obsM: '45', obsS: '15' },
  { id: 'leg-3', station: 'C', targetStation: 'D', distance: '98.450',  obsD: '95', obsM: '30', obsS: '45' },
  { id: 'leg-4', station: 'D', targetStation: 'E', distance: '108.760', obsD: '108', obsM: '20', obsS: '00' },
  { id: 'leg-5', station: 'E', targetStation: 'A', distance: '130.120', obsD: '136', obsM: '11', obsS: '30' },
];

export const SAMPLE_STADIA_ROWS: StadiaRowInput[] = [
  { id: '1', station: 'BM1', bsTop: '1.628', bsMid: '1.512', bsBot: '1.396', fsTop: '', fsMid: '', fsBot: '', remark: 'หมุดเริ่มต้น' },
  { id: '2', station: 'TP1', bsTop: '1.483', bsMid: '1.374', bsBot: '1.265', fsTop: '1.923', fsMid: '1.811', fsBot: '1.699', remark: '' },
  { id: '3', station: 'TP2', bsTop: '1.722', bsMid: '1.605', bsBot: '1.488', fsTop: '1.612', fsMid: '1.497', fsBot: '1.382', remark: '' },
  { id: '4', station: 'BM2', bsTop: '', bsMid: '', bsBot: '', fsTop: '1.543', fsMid: '1.428', fsBot: '1.313', remark: 'หมุดปลาย' },
];

export const SAMPLE_CADASTRAL_POINTS: CadastralPolygonPoint[] = [
  { id: 'p1', name: 'หมุด 1 (SW)', easting: 669500.0, northing: 1531000.0 },
  { id: 'p2', name: 'หมุด 2 (SE)', easting: 669600.0, northing: 1531000.0 },
  { id: 'p3', name: 'หมุด 3 (NE)', easting: 669600.0, northing: 1531100.0 },
  { id: 'p4', name: 'หมุด 4 (NW)', easting: 669500.0, northing: 1531100.0 },
];

interface SurveyStoreState {
  // --- Traverse State ---
  traverseStartE: string;
  traverseStartN: string;
  traverseIsClosedLoop: boolean;
  traverseEndE: string;
  traverseEndN: string;
  traverseLegs: TraverseLegInput[];
  traverseLastSaved: number;

  // Modern DMS Traverse State
  traverseMode: 'loop' | 'link' | 'open';
  traverseDmsLegs: TraverseDmsLeg[];
  traverseStartAz: DmsField;
  traverseEndAz: DmsField;

  // Traverse Actions
  setTraverseStart: (e: string, n: string) => void;
  setTraverseEnd: (e: string, n: string, isClosed: boolean) => void;
  setTraverseIsClosed: (isClosed: boolean) => void;
  updateTraverseLeg: (index: number, field: keyof TraverseLegInput, value: any) => void;
  addTraverseLeg: () => void;
  removeTraverseLeg: (index: number) => void;
  resetTraverseToSample: () => void;
  clearTraverse: () => void;

  setTraverseMode: (mode: 'loop' | 'link' | 'open') => void;
  setTraverseDmsLegs: (legs: TraverseDmsLeg[]) => void;
  setTraverseStartAz: (az: DmsField) => void;
  setTraverseEndAz: (az: DmsField) => void;
  resetTraverseDmsToSample: () => void;
  clearTraverseDms: () => void;

  // --- Leveling State ---
  levelingStartElevation: string;
  levelingLoopDistanceKm: string;
  levelingRows: LevelingRowInput[];
  levelingStadiaRows: StadiaRowInput[];
  levelingLastSaved: number;

  // Leveling Actions
  setLevelingStartElevation: (elev: string) => void;
  setLevelingLoopDistanceKm: (distKm: string) => void;
  setLevelingRows: (rows: LevelingRowInput[]) => void;
  setLevelingStadiaRows: (rows: StadiaRowInput[] | ((prev: StadiaRowInput[]) => StadiaRowInput[])) => void;
  updateLevelingRow: (index: number, field: keyof LevelingRowInput, value: string) => void;
  addLevelingRow: () => void;
  removeLevelingRow: (index: number) => void;
  resetLevelingToSample: () => void;
  resetLevelingStadiaToSample: () => void;
  clearLeveling: () => void;
  clearLevelingStadia: () => void;

  // --- GNSS Studio & Network Adjustment State ---
  networkAdjustmentMode: '2d' | '1d';
  networkStations2D: Station2D[];
  networkObs2D: Observation2D[];
  networkPoints1D: LevelingPoint[];
  networkObs1D: LevelingObservation[];

  // Network Adjustment Actions
  setNetworkAdjustmentMode: (mode: '2d' | '1d') => void;
  setNetworkStations2D: (stations: Station2D[]) => void;
  setNetworkObs2D: (obs: Observation2D[]) => void;
  setNetworkPoints1D: (points: LevelingPoint[]) => void;
  setNetworkObs1D: (obs: LevelingObservation[]) => void;
  resetNetworkToSample: () => void;
  clearNetwork: () => void;

  // --- Cadastral Parcel Polygon State (Shoelace Area) ---
  cadastralPoints: CadastralPolygonPoint[];
  cadastralPricePerWah: string;

  // Cadastral Actions
  setCadastralPoints: (points: CadastralPolygonPoint[]) => void;
  setCadastralPricePerWah: (price: string) => void;
  addCadastralPoint: (pt: CadastralPolygonPoint) => void;
  removeCadastralPoint: (index: number) => void;
  updateCadastralPoint: (index: number, field: keyof CadastralPolygonPoint, value: any) => void;
  resetCadastralToSample: () => void;
  clearCadastral: () => void;

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

      // Modern DMS Traverse Defaults
      traverseMode: 'loop',
      traverseDmsLegs: SAMPLE_TRAVERSE_DMS_LEGS,
      traverseStartAz: { d: '45', m: '30', s: '00' },
      traverseEndAz: { d: '225', m: '30', s: '00' },

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

      setTraverseMode: (mode) => {
        set({ traverseMode: mode, traverseLastSaved: Date.now() });
      },

      setTraverseDmsLegs: (legs) => {
        set({ traverseDmsLegs: legs, traverseLastSaved: Date.now() });
      },

      setTraverseStartAz: (az) => {
        set({ traverseStartAz: az, traverseLastSaved: Date.now() });
      },

      setTraverseEndAz: (az) => {
        set({ traverseEndAz: az, traverseLastSaved: Date.now() });
      },

      resetTraverseDmsToSample: () => {
        set({
          traverseStartE: '500000.000',
          traverseStartN: '1500000.000',
          traverseStartAz: { d: '45', m: '30', s: '00' },
          traverseEndE: '500500.000',
          traverseEndN: '1500200.000',
          traverseEndAz: { d: '225', m: '30', s: '00' },
          traverseMode: 'loop',
          traverseDmsLegs: SAMPLE_TRAVERSE_DMS_LEGS,
          traverseLastSaved: Date.now()
        });
        trackEvent('traverse_dms_reset_sample');
      },

      clearTraverseDms: () => {
        set({
          traverseDmsLegs: [
            { id: 'leg-1', station: 'ST-1', targetStation: 'ST-2', distance: '100.000', obsD: '90', obsM: '00', obsS: '00' }
          ],
          traverseLastSaved: Date.now()
        });
        trackEvent('traverse_dms_clear');
      },

      // Default Leveling
      levelingStartElevation: SAMPLE_LEVELING_START_ELEVATION.toString(),
      levelingLoopDistanceKm: '0.85',
      levelingRows: SAMPLE_LEVELING_ROWS,
      levelingStadiaRows: SAMPLE_STADIA_ROWS,
      levelingLastSaved: Date.now(),

      setLevelingStartElevation: (elev) => {
        set({ levelingStartElevation: elev, levelingLastSaved: Date.now() });
      },

      setLevelingLoopDistanceKm: (distKm) => {
        set({ levelingLoopDistanceKm: distKm, levelingLastSaved: Date.now() });
      },

      setLevelingRows: (rows) => {
        set({ levelingRows: rows, levelingLastSaved: Date.now() });
        trackEvent('leveling_import_csv', { rowCount: rows.length });
      },

      setLevelingStadiaRows: (rows) => {
        const next = typeof rows === 'function' ? rows(get().levelingStadiaRows) : rows;
        set({ levelingStadiaRows: next, levelingLastSaved: Date.now() });
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

      resetLevelingStadiaToSample: () => {
        set({
          levelingStadiaRows: SAMPLE_STADIA_ROWS,
          levelingLastSaved: Date.now()
        });
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

      clearLevelingStadia: () => {
        set({
          levelingStadiaRows: [
            { id: '1', station: 'BM1', bsTop: '', bsMid: '', bsBot: '', fsTop: '', fsMid: '', fsBot: '', remark: 'Start BM' }
          ],
          levelingLastSaved: Date.now()
        });
      },

      // --- Network Adjustment State ---
      networkAdjustmentMode: '2d',
      networkStations2D: SAMPLE_2D_TRAVERSE_NETWORK.stations,
      networkObs2D: SAMPLE_2D_TRAVERSE_NETWORK.observations,
      networkPoints1D: SAMPLE_LEVELING_NETWORK.points,
      networkObs1D: SAMPLE_LEVELING_NETWORK.observations,

      setNetworkAdjustmentMode: (mode) => set({ networkAdjustmentMode: mode }),
      setNetworkStations2D: (stations) => set({ networkStations2D: stations }),
      setNetworkObs2D: (obs) => set({ networkObs2D: obs }),
      setNetworkPoints1D: (points) => set({ networkPoints1D: points }),
      setNetworkObs1D: (obs) => set({ networkObs1D: obs }),

      resetNetworkToSample: () => {
        set({
          networkStations2D: SAMPLE_2D_TRAVERSE_NETWORK.stations,
          networkObs2D: SAMPLE_2D_TRAVERSE_NETWORK.observations,
          networkPoints1D: SAMPLE_LEVELING_NETWORK.points,
          networkObs1D: SAMPLE_LEVELING_NETWORK.observations
        });
      },

      clearNetwork: () => {
        set({
          networkStations2D: [
            { id: 'BASE', isFixed: true, knownE: 669500.0, knownN: 1531000.0 },
            { id: 'ROV1', isFixed: false, approxE: 669600.0, approxN: 1531100.0 }
          ],
          networkObs2D: [],
          networkPoints1D: [
            { id: 'BM1', isFixed: true, knownElevation: 100.0 },
            { id: 'BM2', isFixed: false, approxElevation: 102.0 }
          ],
          networkObs1D: []
        });
      },

      // --- Cadastral Parcel Polygon State (Shoelace Area) ---
      cadastralPoints: SAMPLE_CADASTRAL_POINTS,
      cadastralPricePerWah: '25000',

      setCadastralPoints: (points) => set({ cadastralPoints: points }),
      setCadastralPricePerWah: (price) => set({ cadastralPricePerWah: price }),

      addCadastralPoint: (pt) => {
        set((state) => ({ cadastralPoints: [...state.cadastralPoints, pt] }));
      },

      removeCadastralPoint: (index) => {
        set((state) => ({
          cadastralPoints: state.cadastralPoints.filter((_, i) => i !== index)
        }));
      },

      updateCadastralPoint: (index, field, value) => {
        set((state) => {
          const updated = [...state.cadastralPoints];
          updated[index] = { ...updated[index], [field]: value };
          return { cadastralPoints: updated };
        });
      },

      resetCadastralToSample: () => {
        set({ cadastralPoints: SAMPLE_CADASTRAL_POINTS, cadastralPricePerWah: '25000' });
      },

      clearCadastral: () => {
        set({ cadastralPoints: [], cadastralPricePerWah: '0' });
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
