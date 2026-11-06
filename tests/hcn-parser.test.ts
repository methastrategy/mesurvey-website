import { describe, it, expect } from 'vitest';
import { parseHcnBuffer, isHcnBuffer, generateRinex3FromHcn } from '../src/utils/hcn-parser';

describe('CHCNAV HCN Binary Parser & Bridge Core', () => {
  // Construct a realistic 512-byte HCN header modeled after KU Survey Department B11_03 base station
  const buildSampleHcnBytes = (syncByte2: number = 0xB5): Uint8Array => {
    const headerLines = [
      'HUACENAV COLLECTED DATA FILE',
      'ver 1.00',
      'ReceiverID:3798411',
      'Date:2026/3/11',
      'Model:CHC IBASE',
      'AntHigh:1.6500',
      'AntType:CHCIBASE',
      'MeasuredTo:3',
      'X:-1136125.8023',
      'Y:6088902.1343',
      'Z:1516398.0656',
      'MARKER NAME:B11_03',
      'MARKER NUMBER:B11_03',
      'OBSERVER:KU_SURVEYOR',
      'AGENCY:KU SURVEY DEPT',
      'REC #:3798411',
      'REC TYPE:CHC IBASE',
      'REC VERS:2.3.7',
      'ANT #:3798411',
      'ANT TYPE:CHCIBASE',
      'INTERVAL:1.000000',
      'TIME OF FIRST OBS:2026/3/11/2/48/8.0000',
      'LEAP SECONDS:0',
      ''
    ].join('\r\n');

    const totalBytes = 1024;
    const buffer = new Uint8Array(totalBytes);
    for (let i = 0; i < headerLines.length; i++) {
      buffer[i] = headerLines.charCodeAt(i);
    }

    // Set binary sync bytes at offset 512
    buffer[512] = 0xAA;
    buffer[513] = 0x44;
    buffer[514] = syncByte2;

    return buffer;
  };

  it('detects a valid CHCNAV HCN file using isHcnBuffer()', () => {
    const valid = buildSampleHcnBytes(0xB5);
    expect(isHcnBuffer(valid)).toBe(true);

    const invalid = new Uint8Array(100);
    expect(isHcnBuffer(invalid)).toBe(false);
  });

  it('correctly parses 512-byte ASCII header and converts ECEF to WGS84 & UTM', () => {
    const bytes = buildSampleHcnBytes(0xB5);
    const result = parseHcnBuffer(bytes, 'B11_03070C.HCN');

    expect(result.metadata.markerName).toBe('B11_03');
    expect(result.metadata.model).toBe('CHC IBASE');
    expect(result.metadata.antennaHeight).toBe(1.65);
    expect(result.metadata.approxEcef.x).toBeCloseTo(-1136125.8023, 3);
    expect(result.metadata.approxEcef.y).toBeCloseTo(6088902.1343, 3);
    expect(result.metadata.approxEcef.z).toBeCloseTo(1516398.0656, 3);

    // Kasetsart University Bangkhen latitude ~13.8456, longitude ~100.5693
    expect(result.metadata.approxGeodetic.lat).toBeCloseTo(13.8456, 3);
    expect(result.metadata.approxGeodetic.lng).toBeCloseTo(100.5693, 3);
    expect(result.metadata.approxUtm.zone).toBe(47);
  });

  it('detects Unicore Nebulas OEM engine from sync bytes AA-44-B5', () => {
    const unicoreBytes = buildSampleHcnBytes(0xB5);
    const result = parseHcnBuffer(unicoreBytes);
    expect(result.metadata.oemEngine).toBe('Unicore Nebulas (UM980/UM982/NebulasIV)');
    expect(result.metadata.oemSyncBytesHex).toBe('AA-44-B5');
  });

  it('detects NovAtel OEM engine from sync bytes AA-44-12', () => {
    const novatelBytes = buildSampleHcnBytes(0x12);
    const result = parseHcnBuffer(novatelBytes);
    expect(result.metadata.oemEngine).toBe('NovAtel OEM (OEM6/OEM7/719)');
    expect(result.metadata.oemSyncBytesHex).toBe('AA-44-12');
  });

  it('generates standard RINEX 3.04 Header from HCN metadata', () => {
    const bytes = buildSampleHcnBytes(0xB5);
    const result = parseHcnBuffer(bytes);
    const rnxHeader = generateRinex3FromHcn(result.metadata);

    expect(rnxHeader).toContain('3.04');
    expect(rnxHeader).toContain('OBSERVATION DATA');
    expect(rnxHeader).toContain('B11_03');
    expect(rnxHeader).toContain('CHCIBASE');
    expect(rnxHeader).toContain('APPROX POSITION XYZ');
    expect(rnxHeader).toContain('END OF HEADER');
  });
});
