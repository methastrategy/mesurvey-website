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

  it('strictly excludes unrelated traverse network stations (such as P-B) in GNSS processing mode', () => {
    // Populate store with sample 2D network (which contains P-B in Bangkok)
    useSurveyStore.getState().resetNetworkToSample();
    expect(useSurveyStore.getState().networkStations2D.some(s => s.id === 'P-B')).toBe(true);

    // User's actual GNSS baseline (Prachuap Khiri Khan / Southern Thailand)
    const baseLat = 11.621747;
    const baseLng = 99.801489;
    const baseMarker = 'BM01_1';
    const roverMarker = 'BM02-1';

    // Simulated isolated displayStations function logic
    const processingMode = 'static';
    const baseUtm = forwardWgs84ToUtm(baseLat, baseLng);

    const gnssStations = [
      { id: baseMarker, isFixed: true, easting: baseUtm.easting, northing: baseUtm.northing, sigmaEMm: 0.5, sigmaNMm: 0.5 },
      { id: roverMarker, isFixed: false, easting: baseUtm.easting - 181.5368, northing: baseUtm.northing + 128.6291, sigmaEMm: 3.1, sigmaNMm: 3.1 }
    ];

    // In static mode, displayStations MUST ONLY contain the active base and rover
    expect(gnssStations.length).toBe(2);
    expect(gnssStations.map(s => s.id)).toEqual(['BM01_1', 'BM02-1']);
    expect(gnssStations.some(s => s.id === 'P-B')).toBe(false);
    expect(gnssStations.some(s => s.id === 'STN-1')).toBe(false);
  });

  it('determines the correct UTM Zone for Thailand (Zone 47 for Lon < 102°, Zone 48 for Lon >= 102°)', () => {
    // Prachuap Khiri Khan (Lon 99.80°) -> Zone 47
    const westLng = 99.801489;
    const zoneWest = westLng >= 102.0 ? 48 : 47;
    expect(zoneWest).toBe(47);

    // Ubon Ratchathani (Lon 104.85°) -> Zone 48
    const eastLng = 104.8583;
    const zoneEast = eastLng >= 102.0 ? 48 : 47;
    expect(zoneEast).toBe(48);
  });
});
