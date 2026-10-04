import { describe, it, expect } from 'vitest';
import proj4 from 'proj4';

const defWGS84 = '+proj=longlat +datum=WGS84 +no_defs';

// Set A: RTSD published 3-parameter geocentric translation (Royal Thai Survey Dept military grid)
const defA = '+proj=utm +zone=47 +a=6377276.345 +rf=300.8017 +towgs84=204,837,294,0,0,0,0 +units=m +no_defs';
// Set B: EPSG 1157 (Indian 1975 to WGS 84 (2) - Thailand)
const defB = '+proj=utm +zone=47 +a=6377276.345 +rf=300.8017 +towgs84=209,818,290,0,0,0,0 +units=m +no_defs';
// Set C: EPSG 1313 (Indian 1975 to WGS 84 (3) - Thailand DMA/NIMA TR8350.2)
const defC = '+proj=utm +zone=47 +a=6377276.345 +rf=300.8017 +towgs84=210,814,289,0,0,0,0 +units=m +no_defs';

const points = [
  { name: 'Bangkok (Grand Palace)', lat: 13.7500, lng: 100.4914, zone: 47 },
  { name: 'KU Survey Dept (Bangkhen)', lat: 13.84664, lng: 100.56982, zone: 47 },
  { name: 'Chiang Mai (Doi Suthep)', lat: 18.8048, lng: 98.9216, zone: 47 },
  { name: 'Songkhla (Khao Tang Kuan)', lat: 7.2144, lng: 100.5912, zone: 47 },
  { name: 'Khon Kaen (Zone 48)', lat: 16.4419, lng: 102.8360, zone: 48 },
  { name: 'Ubon Ratchathani (Zone 48)', lat: 15.2287, lng: 104.8564, zone: 48 }
];

describe('Indian 1975 Transformation Parameters Empirical Benchmark', () => {
  it('measures deviations between RTSD [204,837,294], EPSG:1157 [209,818,290], and EPSG:1313 [210,814,289]', () => {
    const report: any[] = [];
    for (const p of points) {
      const zoneDefA = defA.replace('+zone=47', '+zone=' + p.zone);
      const zoneDefB = defB.replace('+zone=47', '+zone=' + p.zone);
      const zoneDefC = defC.replace('+zone=47', '+zone=' + p.zone);

      const [eA, nA] = proj4(defWGS84, zoneDefA, [p.lng, p.lat]);
      const [eB, nB] = proj4(defWGS84, zoneDefB, [p.lng, p.lat]);
      const [eC, nC] = proj4(defWGS84, zoneDefC, [p.lng, p.lat]);

      const diffAB = Math.hypot(eA - eB, nA - nB);
      const diffAC = Math.hypot(eA - eC, nA - nC);
      const diffBC = Math.hypot(eB - eC, nB - nC);

      report.push({
        name: p.name,
        zone: p.zone,
        rtsd_E: eA.toFixed(2),
        rtsd_N: nA.toFixed(2),
        diff_vs_EPSG1157_m: diffAB.toFixed(2),
        diff_vs_EPSG1313_m: diffAC.toFixed(2),
        diff_EPSG1157_vs_1313_m: diffBC.toFixed(2)
      });

      // Deviations among all official 3-parameter sets in Thailand are within 10-25 meters
      expect(diffAB).toBeLessThan(25);
      expect(diffAC).toBeLessThan(25);
      expect(diffBC).toBeLessThan(10);
    }
    console.table(report);
  });
});
