import { Elysia } from "elysia";
import { rutaAkun } from "./akun";
import { rutaRekeningBank, rutaRekonsiliasiBank, rutaTransaksiBank } from "./bank";
import { rutaBiaya } from "./biaya";
import {
  rutaKategoriProduk,
  rutaItem,
  rutaSatuan,
  rutaDaftarHarga,
  rutaGudang,
  rutaTransferGudang,
  rutaPenyesuaianStok,
  rutaLaporanInventori,
} from "./inventori";
import { rutaJurnal, rutaBukuBesar } from "./jurnal";
import { rutaKontak, rutaTermin } from "./kontak";
import { rutaLaporan } from "./laporan";
import { rutaKurs, rutaMataUang, rutaRevaluasiKurs } from "./mata-uang";
import { rutaPeriode } from "./periode";
import { rutaPembayaran } from "./pembayaran";
import { rutaPembelian } from "./pembelian";
import { rutaPenjualan } from "./penjualan";
import { rutaPajak } from "./pajak";
import { rutaAsetTetap } from "./aset-tetap";
import { rutaDimensi } from "./dimensi";
import { rutaAnggaran } from "./anggaran";
import { rutaRbac } from "./rbac";
import { rutaKontrol } from "./kontrol";
import { rutaSaldoAwal } from "./saldo-awal";
import { rutaOtomasi } from "./otomasi";
import { rutaProduksi } from "./produksi";

/**
 * Modul API Keuangan Enterprise (Phase 1 s/d Phase 4).
 *
 * Dipasang di app Elysia:
 *     const app = new Elysia({ prefix: "/api" }) ... .use(modulKeuangan)
 * Semua rute berawalan /api/keuangan dan dilindungi autentikasi & RBAC berbasis izin.
 */
export const modulKeuangan = new Elysia({ prefix: "/keuangan", name: "keuangan" })
  .use(rutaMataUang)
  .use(rutaKurs)
  .use(rutaRevaluasiKurs)
  .use(rutaAkun)
  .use(rutaTermin)
  .use(rutaKontak)
  .use(rutaKategoriProduk)
  .use(rutaSatuan)
  .use(rutaItem)
  .use(rutaDaftarHarga)
  .use(rutaGudang)
  .use(rutaTransferGudang)
  .use(rutaPenyesuaianStok)
  .use(rutaLaporanInventori)
  .use(rutaRekeningBank)
  .use(rutaTransaksiBank)
  .use(rutaRekonsiliasiBank)
  .use(rutaJurnal)
  .use(rutaBukuBesar)
  .use(rutaBiaya)
  .use(rutaPembelian)
  .use(rutaPenjualan)
  .use(rutaPembayaran)
  .use(rutaPajak)
  .use(rutaAsetTetap)
  .use(rutaDimensi)
  .use(rutaAnggaran)
  .use(rutaRbac)
  .use(rutaKontrol)
  .use(rutaPeriode)
  .use(rutaSaldoAwal)
  .use(rutaOtomasi)
  .use(rutaProduksi)
  .use(rutaLaporan);

export type ModulKeuangan = typeof modulKeuangan;
