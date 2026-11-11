import { ambilMataUang, ambilMataUangDasar, dapatkanKursBerlaku } from "./mata-uang/service";
import { galat } from "./_umum";

/**
 * Menentukan mata uang & kurs dokumen transaksi.
 *  - mataUangId kosong  -> mata uang dasar, kurs 1
 *  - kurs kosong        -> kurs berlaku pada tanggal transaksi (tabel kurs historis)
 *  - mata uang dasar    -> kurs selalu 1
 */
export async function tentukanMataUangKurs(opsi: { mataUangId?: string | null; kurs?: string | null; tanggal: string }) {
  const mu = opsi.mataUangId ? await ambilMataUang(opsi.mataUangId) : await ambilMataUangDasar();
  if (!mu.aktif) throw galat.aturanBisnis(`Mata uang ${mu.kode} tidak aktif.`);
  if (mu.adalahMataUangDasar) {
    if (opsi.kurs && Number(opsi.kurs) !== 1) {
      throw galat.aturanBisnis(`Kurs untuk mata uang dasar (${mu.kode}) harus 1.`);
    }
    return { mataUangId: mu.id, kodeMataUang: mu.kode, kurs: "1", adalahDasar: true };
  }
  const kurs = opsi.kurs ?? (await dapatkanKursBerlaku(mu.id, opsi.tanggal)).kurs;
  return { mataUangId: mu.id, kodeMataUang: mu.kode, kurs, adalahDasar: false };
}
