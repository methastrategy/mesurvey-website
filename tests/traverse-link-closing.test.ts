import { describe, it, expect } from 'vitest';
import { computeTraverse } from '../src/components/calculator/TraverseCalculator';
import { TraverseLeg } from '../src/types/survey';

describe('TraverseCalculator: Link Traverse Closing Azimuth and Misclosure', () => {
  it('correctly calculates angular misclosure and distributes corrections in link traverse with known closing azimuth', () => {
    // 3 legs link traverse:
    // Leg 1: Station A -> B, distance 100m, interior angle 90°
    // Leg 2: Station B -> C, distance 100m, interior angle 90°
    // Leg 3: Station C -> D, distance 100m, interior angle 90°
    const legs: TraverseLeg[] = [
      { id: '1', station: 'A', targetStation: 'B', distance: '100', obsD: '90', obsM: '00', obsS: '00' },
      { id: '2', station: 'B', targetStation: 'C', distance: '100', obsD: '90', obsM: '00', obsS: '00' },
      { id: '3', station: 'C', targetStation: 'D', distance: '100', obsD: '90', obsM: '00', obsS: '00' },
    ];

    // Starting Azimuth = 0° (North)
    // After 3 successive (Az + Angle + 180):
    // Stn 1: 0 + 90 + 180 = 270°
    // Stn 2: 270 + 90 + 180 = 180°
    // Stn 3: 180 + 90 + 180 = 90° (observed closing azimuth = 90°)
    // If known closing azimuth is 90° 00' 15":
    // Misclosure = 90° - 90°00'15" = -15"
    const result = computeTraverse(
      legs,
      1000, 2000, // start E, N
      0, 0, 0,    // start Az = 0°
      'link',
      1100, 2100, // end E, N
      90, 0, 15   // known closing Az = 90° 00' 15"
    );

    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.closingAzObs).toBeCloseTo(90.0, 3);
    expect(result.closingAzKnown).toBeCloseTo(90.004167, 4);
    // Angular error in seconds = -15"
    expect(result.angularErrorSec).toBeCloseTo(-15.0, 1);
    // Allowable = 60 * sqrt(3) ≈ 103.92"
    expect(result.allowableAngularSec).toBeCloseTo(60 * Math.sqrt(3), 1);
    expect(result.angularOk).toBe(true);

    // Each angle gets correction = -(-15) / 3 = +5"
    expect(result.legs[0].corrAngleDeg).toBeCloseTo(90 + 5 / 3600, 5);
  });

  it('triggers angular error warning when misclosure exceeds RTSD tolerance', () => {
    const legs: TraverseLeg[] = [
      { id: '1', station: 'A', targetStation: 'B', distance: '100', obsD: '90', obsM: '00', obsS: '00' },
      { id: '2', station: 'B', targetStation: 'C', distance: '100', obsD: '90', obsM: '00', obsS: '00' },
    ];
    // Allowable for n=2 is 60 * sqrt(2) ≈ 84.85"
    // Set known closing azimuth differing by 120"
    const result = computeTraverse(
      legs,
      1000, 2000,
      0, 0, 0,
      'link',
      1100, 2100,
      180, 2, 0 // differing by 2 arc-minutes = 120"
    );

    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.angularOk).toBe(false);
    expect(result.warnings.some(w => w.includes('Angular Error') && w.includes('เกิน Allowable'))).toBe(true);
  });
});
