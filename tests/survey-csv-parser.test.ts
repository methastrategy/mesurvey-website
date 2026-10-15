import { describe, it, expect } from 'vitest';
import { parseStationsCsv, parseObservationsCsv, parseLevelingCsv } from '../src/utils/survey-csv-parser';

describe('Survey CSV Parser Suite', () => {
  it('parses stations CSV with headers and fixed status', () => {
    const csv = `
Station,Easting,Northing,Fixed
CK-01,669500.25,1531000.50,true
STN-02,669750.80,1531200.10,false
STN-03,669900.00,1530800.00,0
    `;
    const res = parseStationsCsv(csv);
    expect(res.errors.length).toBe(0);
    expect(res.data.length).toBe(3);
    expect(res.data[0].id).toBe('CK-01');
    expect(res.data[0].isFixed).toBe(true);
    expect(res.data[0].knownE).toBe(669500.25);
    expect(res.data[1].id).toBe('STN-02');
    expect(res.data[1].isFixed).toBe(false);
    expect(res.data[1].approxE).toBe(669750.80);
  });

  it('parses observations CSV with distances, azimuths, and baseline vectors', () => {
    const csv = `
ID,Type,From,To,Value1,Value2,StdDev
DIST_1,distance,STN1,STN2,125.432,,0.003
AZ_1,azimuth,STN1,STN2,45.2500,,5.0
VEC_1,gnss,BASE,ROVER,254.120,412.330,0.008,0.012
    `;
    const res = parseObservationsCsv(csv);
    expect(res.errors.length).toBe(0);
    expect(res.data.length).toBe(3);
    expect(res.data[0].type).toBe('distance');
    expect(res.data[0].measuredValue).toBe(125.432);
    expect(res.data[1].type).toBe('azimuth');
    expect(res.data[2].type).toBe('baseline_vector');
    expect(res.data[2].measuredValue).toBe(254.120);
    expect(res.data[2].measuredValue2).toBe(412.330);
  });

  it('parses leveling CSV and auto-assigns datum reference', () => {
    const csv = `
From_BM,To_BM,DeltaH,Dist_Km,StdDev_mm
BM1,BM2,1.245,1.5,2.0
BM2,BM3,-0.650,2.1,2.5
BM3,BM1,-0.595,1.8,2.0
    `;
    const res = parseLevelingCsv(csv);
    expect(res.errors.length).toBe(0);
    expect(res.points.length).toBe(3);
    expect(res.observations.length).toBe(3);
    expect(res.points[0].isFixed).toBe(true);
    expect(res.points[0].knownElevation).toBe(100.0);
  });
});
