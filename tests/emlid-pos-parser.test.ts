import { describe, it, expect } from 'vitest';
import { parseEmlidPosText, isEmlidPosText } from '../src/utils/emlid-pos-parser';

describe('Emlid Studio / RTKLIB .pos Solution Parser Core', () => {
  const samplePosText = `% program   : ES 1.11
% inp file  : D:\\METHA\\SURVEY METHA\\survey camp\\01_gnss\\baseline01\\rinex\\baseline-1307E.26O
% inp file  : D:\\METHA\\SURVEY METHA\\survey camp\\01_gnss\\bm02\\rinex\\BM-02307E.26N
% inp file  : D:\\METHA\\SURVEY METHA\\survey camp\\01_gnss\\bm02\\rinex\\BM-02307E.26O
% obs start : 2026/11/03 04:15:20.0 GPST (week2443 188120.0s)
% obs end   : 2026/11/03 04:41:37.0 GPST (week2443 189697.0s)
% ref pos   : 11.622908475  99.689804244  -25.8230
%
% (lat/lon/height=WGS84/ellipsoidal,Q=1:fix,2:float,3:sbas,4:dgps,5:single,6:ppp,ns=# of satellites)
%  GPST                  latitude(deg) longitude(deg)  height(m)   Q  ns   sdn(m)   sde(m)   sdu(m)  sdne(m)  sdeu(m)  sdun(m) age(s)  ratio
2026/11/03 04:15:20.000   11.620801898   99.693190000   -25.5972   1   5   0.0002   0.0005   0.0008  -0.0000   0.0005  -0.0000   0.00  166.8
2026/11/03 04:15:25.000   11.620801899   99.693190002   -25.5970   1   6   0.0002   0.0004   0.0007  -0.0000   0.0004  -0.0000   0.00  172.4
`;

  it('validates Emlid Studio .pos header signature', () => {
    expect(isEmlidPosText(samplePosText)).toBe(true);
    expect(isEmlidPosText('Random text string')).toBe(false);
  });

  it('parses metadata, reference base position, and rover coordinates', () => {
    const result = parseEmlidPosText(samplePosText, 'BM-02_to_BL01.pos');

    expect(result.program).toBe('ES 1.11');
    expect(result.roverFile).toBe('baseline-1307E.26O');
    expect(result.baseFile).toBe('BM-02307E.26O');
    expect(result.refPosition).toBeDefined();
    expect(result.refPosition?.lat).toBeCloseTo(11.622908, 5);
    expect(result.refPosition?.lng).toBeCloseTo(99.689804, 5);
    expect(result.refPosition?.height).toBeCloseTo(-25.823, 3);

    expect(result.computedPosition.lat).toBeCloseTo(11.6208019, 6);
    expect(result.computedPosition.lng).toBeCloseTo(99.6931900, 6);
    expect(result.overallStatus).toBe('FIXED');
    expect(result.bestRatio).toBe(172.4);
    expect(result.records.length).toBe(2);
  });

  it('computes ENU delta baseline vector relative to base station', () => {
    const result = parseEmlidPosText(samplePosText);
    expect(result.vectorENU.distance2D).toBeGreaterThan(0);
    expect(result.vectorENU.distance3D).toBeGreaterThan(0);
    expect(result.vectorENU.azimuthDeg).toBeGreaterThanOrEqual(0);
    expect(result.vectorENU.azimuthDeg).toBeLessThanOrEqual(360);
  });

  it('exports into BaselineSolution compatible with Studio Network Adjustment', () => {
    const result = parseEmlidPosText(samplePosText);
    const baseline = result.asBaselineSolution('BM-02', 'BL01');

    expect(baseline.baseStation).toBe('BM-02');
    expect(baseline.roverStation).toBe('BL01');
    expect(baseline.status).toBe('FIXED');
    expect(baseline.ratioTest).toBeGreaterThanOrEqual(3.0);
    expect(baseline.vectorENU.distance2D).toBeCloseTo(result.vectorENU.distance2D, 2);
  });
});
