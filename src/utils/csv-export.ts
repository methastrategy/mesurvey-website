/**
 * Universal CSV Exporter with UTF-8 BOM (\uFEFF) for Thai language compatibility in Microsoft Excel.
 */

export interface CsvExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

/**
 * Escapes an individual cell value according to RFC 4180.
 * If value contains quotes, commas, or newlines, encloses it in double quotes and escapes internal quotes.
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates the CSV string with UTF-8 BOM (\uFEFF) prepended.
 */
export function generateCsvContent(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map(row => row.map(escapeCsvCell).join(','));
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Exports data to a CSV file and triggers a browser download with UTF-8 BOM.
 */
export function exportToCsv(options: CsvExportOptions): string {
  const { filename, headers, rows } = options;
  const csvContent = generateCsvContent(headers, rows);

  // If in a browser environment, trigger download
  if (typeof document !== 'undefined' && typeof window !== 'undefined' && typeof Blob !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return csvContent;
}
