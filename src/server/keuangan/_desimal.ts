/**
 * Aritmetika desimal presisi tetap berbasis BigInt.
 *
 * Nilai uang/kuantitas disimpan sebagai NUMERIC dan diterima dari Drizzle/API
 * sebagai STRING. Modul ini TIDAK PERNAH memakai Number/float, sehingga tidak
 * ada galat pembulatan floating point.
 *
 * Representasi internal: bigint berskala tetap SKALA (4 desimal) untuk uang &
 * kuantitas. Kurs memakai skala 8. Perkalian uang x kurs menghasilkan skala 12
 * yang kemudian dibulatkan (half-up, menjauhi nol) kembali ke skala 4.
 */

export const SKALA_UANG = 4;
export const SKALA_KURS = 8;

const pangkat = (n: number) => BigInt("1" + "0".repeat(n));

/** Mengubah string desimal ("1234.5", "-0.25") menjadi bigint berskala `skala`. */
export function keBigInt(nilai: string | number | null | undefined, skala = SKALA_UANG): bigint {
  if (nilai === null || nilai === undefined || nilai === "") return BigInt(0);
  const s = String(nilai).trim();
  const cocok = /^(-|\+)?(\d+)(?:\.(\d+))?$/.exec(s);
  if (!cocok) throw new Error(`Nilai desimal tidak valid: "${s}"`);
  const [, tanda, bulat, pecahan = ""] = cocok;
  let hasil: bigint;
  if (pecahan.length <= skala) {
    hasil = BigInt(bulat! + pecahan.padEnd(skala, "0"));
  } else {
    // Bulatkan half-up digit yang terpotong.
    const dipakai = BigInt(bulat! + pecahan.slice(0, skala));
    const digitBerikut = Number(pecahan[skala]);
    hasil = digitBerikut >= 5 ? dipakai + BigInt(1) : dipakai;
  }
  return tanda === "-" ? -hasil : hasil;
}

/** Mengubah bigint berskala menjadi string desimal dengan `skala` digit pecahan. */
export function keString(nilai: bigint, skala = SKALA_UANG): string {
  const negatif = nilai < BigInt(0);
  const abs = negatif ? -nilai : nilai;
  const teks = abs.toString().padStart(skala + 1, "0");
  const bulat = teks.slice(0, teks.length - skala);
  const pecahan = teks.slice(teks.length - skala);
  return `${negatif ? "-" : ""}${bulat}${skala > 0 ? `.${pecahan}` : ""}`;
}

/** Membagi dengan pembulatan half-up (menjauhi nol). */
export function bagiBulat(pembilang: bigint, penyebut: bigint): bigint {
  if (penyebut === BigInt(0)) throw new Error("Pembagian dengan nol.");
  const negatif = pembilang < BigInt(0) !== penyebut < BigInt(0);
  const a = pembilang < BigInt(0) ? -pembilang : pembilang;
  const b = penyebut < BigInt(0) ? -penyebut : penyebut;
  const q = (a * BigInt(2) + b) / (b * BigInt(2));
  return negatif ? -q : q;
}

/** uang (skala 4) x kurs (skala 8) -> uang (skala 4), dibulatkan. */
export function kaliKurs(uang: bigint, kurs: bigint): bigint {
  return bagiBulat(uang * kurs, pangkat(SKALA_KURS));
}

/** kuantitas (skala 4) x harga (skala 4) -> uang (skala 4), dibulatkan. */
export function kali(a: bigint, b: bigint): bigint {
  return bagiBulat(a * b, pangkat(SKALA_UANG));
}

/** a / b, keduanya skala 4, hasil skala 4 dibulatkan. */
export function bagi(a: bigint, b: bigint): bigint {
  return bagiBulat(a * pangkat(SKALA_UANG), b);
}

/** nilai x persen/100 (persen berskala 4, mis. "11" untuk PPN 11%). */
export function persenDari(nilai: bigint, persen: bigint): bigint {
  return bagiBulat(nilai * persen, BigInt(100) * pangkat(SKALA_UANG));
}

export const jumlahkan = (daftar: bigint[]) => daftar.reduce((a, b) => a + b, BigInt(0));

/** Helper ringkas: string -> string hasil (a + b). */
export const tambahStr = (a: string, b: string) => keString(keBigInt(a) + keBigInt(b));
