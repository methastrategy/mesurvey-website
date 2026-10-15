import { describe, it, expect, beforeEach } from 'vitest';
import { useSurveyStore } from '../src/store/useSurveyStore';

describe('GNSS Studio & Network Adjustment Blank Slate Initialization', () => {
  beforeEach(() => {
    useSurveyStore.getState().clearNetwork();
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
});
