import { describe, it, expect } from 'vitest';
import {
  parseStationsCsv,
  parseObservationsCsv,
  parseLevelingCsv,
  parseTraverseCsv,
  parseLevelingFieldbookCsv
} from '../src/utils/survey-csv-parser';

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

  it('parses traverse fieldbook CSV with DMS angles and distances', () => {
    const csv = `
Station,Target_Station,Distance_m,Angle_Deg,Angle_Min,Angle_Sec,Remark
A,B,125.340,98,12,30,หมุด A ส่อง B
B,C,112.880,101,45,15,หมุด B ส่อง C
C,A,98.450,160,02,15,หมุด C บรรจบ A
    `;
    const res = parseTraverseCsv(csv);
    expect(res.errors.length).toBe(0);
    expect(res.legs.length).toBe(3);
    expect(res.legs[0].station).toBe('A');
    expect(res.legs[0].targetStation).toBe('B');
    expect(res.legs[0].distance).toBe('125.340');
    expect(res.legs[0].obsD).toBe('98');
    expect(res.legs[0].obsM).toBe('12');
    expect(res.legs[0].obsS).toBe('30');
  });

  it('parses leveling fieldbook CSV with BS, IFS, FS readings', () => {
    const csv = `
Station,BS_m,IFS_m,FS_m,Remark
BM1,1.542,,,Start BM
TP1,1.325,,1.108,Turn 1
TP2,,1.220,,Side point
BM2,,,1.455,End BM
    `;
    const res = parseLevelingFieldbookCsv(csv);
    expect(res.errors.length).toBe(0);
    expect(res.rows.length).toBe(4);
    expect(res.rows[0].station).toBe('BM1');
    expect(res.rows[0].bs).toBe(1.542);
    expect(res.rows[0].fs).toBeNull();
    expect(res.rows[1].station).toBe('TP1');
    expect(res.rows[1].bs).toBe(1.325);
    expect(res.rows[1].fs).toBe(1.108);
    expect(res.rows[2].station).toBe('TP2');
    expect(res.rows[2].ifs).toBe(1.220);
    expect(res.rows[3].station).toBe('BM2');
    expect(res.rows[3].fs).toBe(1.455);
  });
});
