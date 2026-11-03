import { readSheet } from "read-excel-file/browser";

const CODE_HEADER_PATTERN = /^code$/i;

function normalizeCell(value: unknown): string {
  return String(value ?? "").trim();
}

interface CodeColumnInfo {
  headerRowIndex: number;
  columnIndex: number;
}

function findCodeColumn(rows: unknown[][]): CodeColumnInfo | null {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!Array.isArray(row)) continue;
    const columnIndex = row.findIndex((cell) =>
      CODE_HEADER_PATTERN.test(normalizeCell(cell)),
    );
    if (columnIndex !== -1) {
      return { headerRowIndex: rowIndex, columnIndex };
    }
  }
  return null;
}

/**
 * Extract subject codes from the rows of a Neptun "Registered subjects"
 * spreadsheet export. Rows are arrays of cells as returned by read-excel-file.
 */
export function extractSubjectCodesFromRows(rows: unknown[][]): string[] {
  if (!Array.isArray(rows)) return [];

  const codeColumn = findCodeColumn(rows);
  if (!codeColumn) return [];

  const codes: string[] = [];
  for (const row of rows.slice(codeColumn.headerRowIndex + 1)) {
    if (!Array.isArray(row)) continue;
    const code = normalizeCell(row[codeColumn.columnIndex]);
    if (code) codes.push(code);
  }
  return [...new Set(codes)];
}

/**
 * Read a "Registered subjects" .xlsx export and return its subject codes.
 */
export async function readRegisteredSubjectCodes(
  file: File | Blob,
): Promise<string[]> {
  const rows = (await readSheet(file)) as unknown[][];
  return extractSubjectCodesFromRows(rows);
}
