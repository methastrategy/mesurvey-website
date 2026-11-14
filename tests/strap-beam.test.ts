import { describe, it, expect } from 'vitest';
import { 
  computeStrapBeamReactions, 
  computeStrapBeamReinforcement, 
  computeStrapBeamComplete 
} from '../src/utils/strap-beam';

describe('Strap Beam & Boundary Footing Calculator Tests', () => {
  it('satisfies vertical equilibrium Sigma Fy = 0 and moment equilibrium Sigma M = 0', () => {
    const P1 = 40;
    const P2 = 70;
    const L = 5.0;
    const L1 = 1.8;
    const c1 = 0.30;

    const res = computeStrapBeamReactions(P1, P2, L, L1, c1);

    // e = 1.8/2 - 0.3/2 = 0.75 m
    expect(res.e).toBeCloseTo(0.75, 4);
    // L' = 5.0 - 0.75 = 4.25 m
    expect(res.Lprime).toBeCloseTo(4.25, 4);

    // R1 = 40 * 5.0 / 4.25 = 47.0588 ton
    expect(res.r1).toBeCloseTo(47.0588, 3);
    // R2 = 110 - 47.0588 = 62.9412 ton
    expect(res.r2).toBeCloseTo(62.9412, 3);

    // Check sum of reactions equals total load (Sigma Fy = 0)
    expect(res.sumReactions).toBeCloseTo(res.totalLoad, 4);

    // Check moment equilibrium about reaction 2: R1 * L' - P1 * L = 0
    const momentAbout2 = res.r1 * res.Lprime - P1 * L;
    expect(momentAbout2).toBeCloseTo(0, 4);

    expect(res.isUplift).toBe(false);
  });

  it('handles zero eccentricity (concentric case e = 0) with zero design moment', () => {
    const P1 = 50;
    const P2 = 80;
    const L = 6.0;
    // When L1 = c1, e = 0
    const res = computeStrapBeamReactions(P1, P2, L, 0.40, 0.40);

    expect(res.e).toBe(0);
    expect(res.r1).toBeCloseTo(50, 4);
    expect(res.r2).toBeCloseTo(80, 4);
    expect(res.designMomentTonM).toBe(0);
    expect(res.isUplift).toBe(false);

    // Complete solver should also yield zero moment and 0 required steel
    const complete = computeStrapBeamComplete({
      p1Tons: 50,
      p2Tons: 80,
      colSpacingM: 6.0,
      footing1LengthM: 0.40,
      col1WidthM: 0.40,
      qaTonsPerSqm: 15.0,
      beamWidthCm: 40,
      beamDepthCm: 70,
      rebarGrade: 'SD40',
      designMethod: 'WSD',
    });

    expect(complete.eccentricityM).toBe(0);
    expect(complete.mMaxTonM).toBe(0);
    expect(complete.finalAsCm2).toBe(0);
    expect(complete.r1).toBe(50);
    expect(complete.r2).toBe(80);
    expect(complete.isInvalidGeometry).toBe(false);
  });

  it('detects critical uplift when exterior moment exceeds interior column load', () => {
    // Extreme eccentricity: P1 = 80t, P2 = 15t, L = 4.0m, e = 1.0m
    // L' = 3.0m
    // R1 = 80 * 4.0 / 3.0 = 106.67t
    // R2 = (80 + 15) - 106.67 = -11.67t < 0 (Uplift!)
    const res = computeStrapBeamReactions(80, 15, 4.0, 2.4, 0.4);

    expect(res.e).toBeCloseTo(1.0, 4);
    expect(res.r1).toBeCloseTo(106.6667, 3);
    expect(res.r2).toBeLessThan(0);
    expect(res.isUplift).toBe(true);

    const complete = computeStrapBeamComplete({
      p1Tons: 80,
      p2Tons: 15,
      colSpacingM: 4.0,
      footing1LengthM: 2.4,
      col1WidthM: 0.4,
      qaTonsPerSqm: 15.0,
      beamWidthCm: 40,
      beamDepthCm: 70,
      rebarGrade: 'SD40',
      designMethod: 'WSD',
    });
    expect(complete.isUplift).toBe(true);
    expect(complete.r2).toBeLessThan(0);
  });

  it('computes required top reinforcement As and enforces minimum steel As,min', () => {
    // M = 30 ton-m, b = 40 cm, h = 70 cm, d = 63.5 cm, fy = 4000 ksc (SD40)
    const res = computeStrapBeamReinforcement(30, 40, 70, 4000);

    expect(res.dCm).toBeCloseTo(63.5, 2);
    // As,req = 30 * 100,000 / (1700 * 0.875 * 63.5) = 31.76 cm2
    expect(res.asReq).toBeCloseTo(31.76, 1);
    // As,min = (14 / 4000) * 40 * 63.5 = 8.89 cm2
    expect(res.asMin).toBeCloseTo(8.89, 1);
    expect(res.finalAs).toBe(res.asReq);

    // Low moment case where As,min controls
    const lowMomentRes = computeStrapBeamReinforcement(5, 40, 70, 4000);
    expect(lowMomentRes.asReq).toBeLessThan(lowMomentRes.asMin);
    expect(lowMomentRes.finalAs).toBe(lowMomentRes.asMin);
  });

  it('throws error when eccentricity equals or exceeds column spacing', () => {
    expect(() => {
      computeStrapBeamReactions(50, 50, 2.0, 5.0, 0.2);
    }).toThrow('Footing eccentricity exceeds or equals column spacing');

    const complete = computeStrapBeamComplete({
      p1Tons: 50,
      p2Tons: 50,
      colSpacingM: 2.0,
      footing1LengthM: 5.0,
      col1WidthM: 0.2,
      qaTonsPerSqm: 15.0,
      beamWidthCm: 40,
      beamDepthCm: 70,
      rebarGrade: 'SD40',
      designMethod: 'WSD',
    });
    expect(complete.isInvalidGeometry).toBe(true);
  });
});
