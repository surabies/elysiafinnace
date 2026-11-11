import { Elysia } from "elysia";
import { rutaAkun } from "./akun/routes";
import { rutaRekeningBank } from "./bank/routes";
import { rutaBiaya } from "./biaya/routes";
import { rutaKategoriProduk, rutaItem, rutaSatuan } from "./inventori/routes";
import { rutaJurnal, rutaBukuBesar } from "./jurnal/routes";
import { rutaKontak, rutaTermin } from "./kontak/routes";
import { rutaLaporan } from "./laporan/routes";
import { rutaKurs, rutaMataUang } from "./mata-uang/routes";
import { rutaPeriode } from "./periode/routes";

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
