/**
 * Parser CSV RFC 4180 ringan dan andal.
 * Mendukung pembatas koma (,) dan titik koma (;), nilai berpetik ganda ("..."),
 * petik ganda yang di-escape (""), baris kosong, dan pembersihan spasi (trim).
 */

export function parseCsvKeBaris(csv: string): string[][] {
  const hasil: string[][] = [];
  if (!csv || !csv.trim()) return hasil;

  // Deteksi pembatas dari baris pertama: titik koma (;) atau koma (,)
  const barisPertama = csv.split(/\r\n|\n|\r/)[0] ?? "";
  const jumlahTitikKoma = (barisPertama.match(/;/g) || []).length;
  const jumlahKoma = (barisPertama.match(/,/g) || []).length;
  const pembatas = jumlahTitikKoma > jumlahKoma ? ";" : ",";

  let i = 0;
  const panjang = csv.length;
  let barisSaatIni: string[] = [];
  let nilaiSaatIni = "";
  let dalamPetik = false;

  while (i < panjang) {
    const c = csv[i];

    if (dalamPetik) {
      if (c === '"') {
        if (i + 1 < panjang && csv[i + 1] === '"') {
          // Escaped quote: ""
          nilaiSaatIni += '"';
          i += 2;
          continue;
        } else {
          // Selesai petik
          dalamPetik = false;
          i++;
          continue;
        }
      } else {
        nilaiSaatIni += c;
        i++;
        continue;
      }
    } else {
      if (c === '"') {
        dalamPetik = true;
        i++;
        continue;
      }

      if (c === pembatas) {
        barisSaatIni.push(nilaiSaatIni.trim());
        nilaiSaatIni = "";
        i++;
        continue;
      }

      if (c === "\r" || c === "\n") {
        if (c === "\r" && i + 1 < panjang && csv[i + 1] === "\n") {
          i++;
        }
        barisSaatIni.push(nilaiSaatIni.trim());
        if (barisSaatIni.some((kolom) => kolom.length > 0)) {
          hasil.push(barisSaatIni);
        }
        barisSaatIni = [];
        nilaiSaatIni = "";
        i++;
        continue;
      }

      nilaiSaatIni += c;
      i++;
    }
  }

  // Sisa nilai terakhir bila file tidak berakhir dengan newline
  if (nilaiSaatIni.length > 0 || barisSaatIni.length > 0) {
    barisSaatIni.push(nilaiSaatIni.trim());
    if (barisSaatIni.some((kolom) => kolom.length > 0)) {
      hasil.push(barisSaatIni);
    }
  }

  return hasil;
}

/**
 * Mengubah teks CSV dengan baris header menjadi array of Record<string, string>.
 * Header otomatis di-trim dan di-lowercase untuk pencocokan yang fleksibel.
 */
export function parseCsvKeObjek(csv: string): Record<string, string>[] {
  const baris = parseCsvKeBaris(csv);
  if (baris.length < 2) return [];

  const headers = baris[0]!.map((h) => h.trim().toLowerCase());
  const objek: Record<string, string>[] = [];

  for (let r = 1; r < baris.length; r++) {
    const barisData = baris[r]!;
    const item: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const kunci = headers[c]!;
      item[kunci] = barisData[c] ?? "";
    }
    objek.push(item);
  }

  return objek;
}

/**
 * Membuat string CSV standar RFC 4180 dari headers dan array of rows.
 */
export function buatCsv(
  headers: string[],
  baris: (string | number | null | undefined)[][],
): string {
  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines: string[] = [];
  lines.push(headers.map(escapeCell).join(","));
  for (const b of baris) {
    lines.push(b.map(escapeCell).join(","));
  }
  return lines.join("\r\n");
}

