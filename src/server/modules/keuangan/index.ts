import { Elysia } from "elysia";
import { rutaAkun } from "./akun";
import { rutaRekeningBank } from "./bank";
import { rutaBiaya } from "./biaya";
import { rutaKategoriProduk, rutaItem, rutaSatuan } from "./inventori";
import { rutaJurnal, rutaBukuBesar } from "./jurnal";
import { rutaKontak, rutaTermin } from "./kontak";
import { rutaLaporan } from "./laporan";
import { rutaKurs, rutaMataUang } from "./mata-uang";
import { rutaPeriode } from "./periode";

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
  .use(rutaAkun)
  .use(rutaTermin)
  .use(rutaKontak)
  .use(rutaKategoriProduk)
  .use(rutaSatuan)
  .use(rutaItem)
  .use(rutaRekeningBank)
  .use(rutaJurnal)
  .use(rutaBukuBesar)
  .use(rutaBiaya)
  .use(rutaPeriode)
  .use(rutaLaporan);

export type ModulKeuangan = typeof modulKeuangan;
