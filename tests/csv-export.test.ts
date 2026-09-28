import { describe, it, expect } from 'vitest';
import { exportToCsv, generateCsvContent, escapeCsvCell } from '../src/utils/csv-export';

describe('Universal CSV Export Utility (csv-export.ts)', () => {
  describe('UTF-8 Byte Order Mark (BOM)', () => {
    it('prepends UTF-8 BOM (\\uFEFF) at index 0 of CSV string for Excel Thai compatibility', () => {
      const headers = ['Station', 'Easting', 'Northing'];
      const rows = [['BM-01', 669656.82, 1531321.89]];
      const csv = generateCsvContent(headers, rows);

      expect(csv.charCodeAt(0)).toBe(0xFEFF);
      expect(csv.startsWith('\uFEFF')).toBe(true);
    });

    it('exports CSV content containing UTF-8 BOM via exportToCsv', () => {
      const content = exportToCsv({
        filename: 'survey_export_test.csv',
        headers: ['หมุด', 'ค่าระดับ'],
        rows: [['BM-KU', 10.0]]
      });

      expect(content.charCodeAt(0)).toBe(0xFEFF);
      expect(content).toContain('หมุด');
      expect(content).toContain('ค่าระดับ');
    });
  });

  describe('Thai Language Preservation', () => {
    it('preserves complex Thai characters with tone marks and vowels without corruption', () => {
      const thaiHeaders = ['ลำดับ', 'ชื่อสถานี', 'ส่องหลัง (BS)', 'ระดับความสูง (ม.รทก.)', 'คำอธิบาย'];
      const thaiRows = [
        [1, 'หมุดหลักฐาน KU1', 1.452, 10.000, 'อาคารชูชาติ กำภู คณะวิศวกรรมศาสตร์ มก. บางเขน'],
        [2, 'จุดเปลี่ยน TP_1', 1.625, 10.332, 'เต่าเหล็กบนพื้นคอนกรีตแน่นหนา']
      ];

      const csv = generateCsvContent(thaiHeaders, thaiRows);

      expect(csv).toContain('ลำดับ,ชื่อสถานี');
      expect(csv).toContain('หมุดหลักฐาน KU1');
      expect(csv).toContain('อาคารชูชาติ กำภู คณะวิศวกรรมศาสตร์ มก. บางเขน');
      expect(csv).toContain('เต่าเหล็กบนพื้นคอนกรีตแน่นหนา');
    });
  });

  describe('RFC 4180 Escaping Rules', () => {
    it('escapes cells containing commas with double quotes', () => {
      expect(escapeCsvCell('Bangkok, Thailand')).toBe('"Bangkok, Thailand"');
      expect(escapeCsvCell('123,456.78')).toBe('"123,456.78"');
    });

    it('escapes double quotes by doubling them inside quoted string', () => {
      expect(escapeCsvCell('Point "A" (Primary)')).toBe('"Point ""A"" (Primary)"');
    });

    it('escapes cells containing newlines', () => {
      expect(escapeCsvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
      expect(escapeCsvCell("Line 1\r\nLine 2")).toBe('"Line 1\r\nLine 2"');
    });

    it('leaves plain strings and numbers unquoted', () => {
      expect(escapeCsvCell('BM-101')).toBe('BM-101');
      expect(escapeCsvCell(123.456)).toBe('123.456');
    });

    it('handles null and undefined gracefully as empty strings', () => {
      expect(escapeCsvCell(null)).toBe('');
      expect(escapeCsvCell(undefined)).toBe('');
    });
  });
});
