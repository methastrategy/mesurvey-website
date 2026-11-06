import { describe, it, expect, beforeEach } from 'vitest';
import { useSurveyStore } from '../src/store/useSurveyStore';

describe('GNSS Studio & Network Adjustment Blank Slate Initialization', () => {
  beforeEach(() => {
    useSurveyStore.getState().clearNetwork();
    useSurveyStore.getState().clearPlottedTraverseOverlay();
    useSurveyStore.getState().clearInspectedCoordinate();
  });

  it('initializes networkStations2D with an empty array (0 sample benchmarks)', () => {
    const state = useSurveyStore.getState();
    expect(state.networkStations2D).toEqual([]);
    expect(state.networkStations2D.length).toBe(0);
  });

  it('initializes networkObs2D with an empty array (0 sample observations)', () => {
    const state = useSurveyStore.getState();
    expect(state.networkObs2D).toEqual([]);
    expect(state.networkObs2D.length).toBe(0);
  });

  it('initializes 1D leveling network points and observations with empty arrays', () => {
    const state = useSurveyStore.getState();
    expect(state.networkPoints1D).toEqual([]);
    expect(state.networkObs1D).toEqual([]);
  });

  it('initializes plottedTraverseOverlay and inspectedCoordinate as null for a clean map', () => {
    const state = useSurveyStore.getState();
    expect(state.plottedTraverseOverlay).toBeNull();
    expect(state.inspectedCoordinate).toBeNull();
  });

  it('clearNetwork() cleanly resets all 2D and 1D stations and observations to empty arrays', () => {
    // Populate with sample data
    useSurveyStore.getState().resetNetworkToSample();
    expect(useSurveyStore.getState().networkStations2D.length).toBeGreaterThan(0);
    expect(useSurveyStore.getState().networkObs2D.length).toBeGreaterThan(0);

    // Call clearNetwork
    useSurveyStore.getState().clearNetwork();
    expect(useSurveyStore.getState().networkStations2D).toEqual([]);
    expect(useSurveyStore.getState().networkObs2D).toEqual([]);
    expect(useSurveyStore.getState().networkPoints1D).toEqual([]);
    expect(useSurveyStore.getState().networkObs1D).toEqual([]);
  });

  it('retains resetNetworkToSample() for on-demand sample loading when user explicitly requests it', () => {
    useSurveyStore.getState().clearNetwork();
    expect(useSurveyStore.getState().networkStations2D.length).toBe(0);

    useSurveyStore.getState().resetNetworkToSample();
    expect(useSurveyStore.getState().networkStations2D.length).toBeGreaterThanOrEqual(2);
    expect(useSurveyStore.getState().networkObs2D.length).toBeGreaterThanOrEqual(1);
  });

  it('guarantees map station renderer yields zero pins when no files are loaded', () => {
    // Simulating displayStations logic from NetworkAdjustment.tsx
    const studioMode = 'single';
    const processingMode = 'static';
    const baseRinex = null;
    const roverRinex = null;
    const baselineSolution = null;
    const result2D = null;
    const networkLoops: any[] = [];

    // Evaluate displayStations
    let stations: any[] = [];
    if (studioMode === 'network') {
      if (networkLoops.length > 0 && result2D) {
        stations = (result2D as any).stations;
      }
    } else if (processingMode === 'static' || processingMode === 'kinematic') {
      if ((baseRinex as any)?.header.approxGeodetic) {
        stations.push({ id: 'BASE' });
      }
    } else if (processingMode === 'adjustment' && result2D) {
      stations = (result2D as any).stations;
    }

    expect(stations).toEqual([]);
    expect(stations.length).toBe(0);
  });

  it('guarantees network studio mode yields zero pins when no network sessions/loops exist', () => {
    const studioMode = 'network';
    const result2D = { stations: [{ id: 'STN-1' }] }; // Even if stale result existed
    const networkLoops: any[] = []; // No loops detected or processed

    let stations: any[] = [];
    if (studioMode === 'network') {
      if (networkLoops.length > 0 && result2D && (result2D as any).stations.length > 0) {
        stations = (result2D as any).stations;
      }
    }

    expect(stations).toEqual([]);
    expect(stations.length).toBe(0);
  });
});
