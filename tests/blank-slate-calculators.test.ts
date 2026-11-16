import { describe, it, expect, beforeEach } from 'vitest';
import { useSurveyStore } from '../src/store/useSurveyStore';

describe('Blank Slate Calculators & On-Demand Sample Loading Architecture', () => {
  beforeEach(() => {
    // Reset store to its blank initial slate
    const store = useSurveyStore.getState();
    store.clearTraverse();
    store.clearTraverseDms();
    store.clearLeveling();
    store.clearLevelingStadia();
    store.clearCadastral();
  });

  it('initializes survey store with clean empty arrays (Blank Slate)', () => {
    const state = useSurveyStore.getState();

    expect(state.traverseLegs).toEqual([]);
    expect(state.traverseDmsLegs).toEqual([]);
    expect(state.levelingRows).toEqual([]);
    expect(state.levelingStadiaRows).toEqual([]);
    expect(state.cadastralPoints).toEqual([]);
  });

  it('loads traverse sample data on demand via resetTraverseToSample', () => {
    const store = useSurveyStore.getState();
    expect(store.traverseLegs.length).toBe(0);

    store.resetTraverseToSample();
    const updatedState = useSurveyStore.getState();
    expect(updatedState.traverseLegs.length).toBeGreaterThanOrEqual(4);
    expect(updatedState.traverseDmsLegs.length).toBeGreaterThanOrEqual(4);

    // Verify clearing brings it back to blank slate
    store.clearTraverse();
    expect(useSurveyStore.getState().traverseLegs).toEqual([]);
  });

  it('loads leveling sample data on demand via resetLevelingToSample', () => {
    const store = useSurveyStore.getState();
    expect(store.levelingRows.length).toBe(0);

    store.resetLevelingToSample();
    const updatedState = useSurveyStore.getState();
    expect(updatedState.levelingRows.length).toBeGreaterThanOrEqual(4);
    expect(updatedState.levelingStadiaRows.length).toBeGreaterThanOrEqual(4);

    // Verify clearing brings it back to blank slate
    store.clearLeveling();
    expect(useSurveyStore.getState().levelingRows).toEqual([]);
  });

  it('loads cadastral polygon sample data on demand via resetCadastralToSample', () => {
    const store = useSurveyStore.getState();
    expect(store.cadastralPoints.length).toBe(0);

    store.resetCadastralToSample();
    const updatedState = useSurveyStore.getState();
    expect(updatedState.cadastralPoints.length).toBe(4);
    expect(updatedState.cadastralPoints[0].name).toContain('หมุด 1');

    // Verify clearing brings it back to blank slate
    store.clearCadastral();
    expect(useSurveyStore.getState().cadastralPoints).toEqual([]);
  });
});
