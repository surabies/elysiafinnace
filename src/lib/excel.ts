import * as XLSX from "xlsx";

export interface ExcelSheetData {
  name: string;
  data: Record<string, unknown>[];
  columnWidths?: number[];
}

/**
 * Membuat dan mengunduh berkas Excel (.xlsx) langsung di browser
 */
export function downloadExcelFile(
  fileName: string,
  sheets: ExcelSheetData[]
): void {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data);

    if (sheet.columnWidths && sheet.columnWidths.length > 0) {
      worksheet["!cols"] = sheet.columnWidths.map((wch) => ({ wch }));
    }

    const safeSheetName = sheet.name.replace(/[*?:/[\]]/g, "_").slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  }

  const safeFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, safeFileName, { bookType: "xlsx", type: "binary" });
}

export interface ParseExcelResult {
  sheetName: string;
  rows: Record<string, string>[];
}

/**
 * Membaca berkas Excel (.xlsx, .xls) atau CSV dari input file dan mengonversinya ke array baris data
 */
export async function parseExcelFile(file: File): Promise<ParseExcelResult[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const results: ParseExcelResult[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert ke JSON dengan raw string untuk menjaga kode angka seperti "01.234" tidak terpotong
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      raw: false,
      defval: "",
    });

    const sanitizedRows: Record<string, string>[] = rows.map((row) => {
      const cleanRow: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        cleanRow[key.trim()] = String(value ?? "").trim();
      }
      return cleanRow;
    });

    results.push({
      sheetName,
      rows: sanitizedRows,
    });
  }

  return results;
}
