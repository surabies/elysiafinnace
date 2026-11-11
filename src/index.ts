import { Elysia } from "elysia";
import { rutaAkun } from "./akun/routes";
import { rutaRekeningBank } from "./bank/routes";
import { rutaKategoriProduk, rutaItem, rutaSatuan } from "./inventori/routes";
import { rutaKontak, rutaTermin } from "./kontak/routes";
import { rutaKurs, rutaMataUang } from "./mata-uang/routes";

/**
 * Modul API Keuangan (Phase 1: master data).
 *
 * Pasang SATU kali di app Elysia yang sudah ada:
 *     const app = new Elysia({ prefix: "/api" }) ...  .use(modulKeuangan)
 * Semua rute berawalan /keuangan dan wajib login (Better-Auth).
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
  .use(rutaRekeningBank);

export type ModulKeuangan = typeof modulKeuangan;
