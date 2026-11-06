import { describe, it, expect, beforeEach } from 'vitest';
import { solveStaticBaseline } from '../src/utils/gnss-baseline';
import { parseRinexText, SAMPLE_RINEX_BASE, SAMPLE_RINEX_ROVER } from '../src/utils/rinex-parser';
import { adjust2DNetwork, type Station2D, type Observation2D } from '../src/utils/least-squares';
import { forwardWgs84ToUtm } from '../src/core/projections';
import { useSurveyStore } from '../src/store/useSurveyStore';

describe('GNSS & Network Adjustment Studio: Unified Emlid & CGO2 Workflow', () => {
  beforeEach(() => {
    useSurveyStore.getState().clearNetwork();
  });

  it('computes double-difference static baseline in-place without page transition', () => {
    const base = parseRinexText(SAMPLE_RINEX_BASE);
    const rover = parseRinexText(SAMPLE_RINEX_ROVER);

    const sol = solveStaticBaseline(base, rover, {
      elevationMaskDeg: 15,
      snrThresholdDbHz: 35
    });

    expect(sol.status).toBe('FIXED');
    expect(sol.ratioTest).toBeGreaterThanOrEqual(3.0);
    expect(sol.vectorENU.distance2D).toBeGreaterThan(0);
    expect(sol.commonSatellites).toBeGreaterThanOrEqual(8);
  });

  it('seamlessly bridges baseline vector into 2D Least Squares adjustment network', () => {
    const base = parseRinexText(SAMPLE_RINEX_BASE);
    const rover = parseRinexText(SAMPLE_RINEX_ROVER);

    const sol = solveStaticBaseline(base, rover, { elevationMaskDeg: 15 });

    // Derive Base UTM coordinates
    const baseUtm = forwardWgs84ToUtm(base.header.approxGeodetic!.lat, base.header.approxGeodetic!.lng);

    const stations: Station2D[] = [
      {
        id: sol.baseStation,
        isFixed: true,
        knownE: baseUtm.easting,
        knownN: baseUtm.northing
      },
      {
        id: sol.roverStation,
        isFixed: false,
        approxE: baseUtm.easting + sol.vectorENU.dE,
        approxN: baseUtm.northing + sol.vectorENU.dN
      }
    ];

    const obs: Observation2D[] = [
      {
        id: `GNSS_${sol.id}`,
        type: 'baseline_vector',
        fromStation: sol.baseStation,
        toStation: sol.roverStation,
        measuredValue: sol.vectorENU.dE,
        measuredValue2: sol.vectorENU.dN,
        stdDev: sol.stdDevMm.dE / 1000,
        stdDev2: sol.stdDevMm.dN / 1000
      }
    ];

    const adjResult = adjust2DNetwork(stations, obs);
    expect(adjResult.converged).toBe(true);
    expect(adjResult.stations.length).toBe(2);

    const adjustedRover = adjResult.stations.find(s => s.id === sol.roverStation);
    expect(adjustedRover).toBeDefined();
    expect(adjustedRover?.errorEllipse).toBeDefined();
    expect(adjustedRover?.errorEllipse?.conf95MajorMm).toBeGreaterThan(0);
  });
});
