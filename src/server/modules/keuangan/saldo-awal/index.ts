import { Elysia } from "elysia";
import { dasarKeuangan, izinPerMetode } from "../shared/access";
import { ok } from "@/server/core/response";
import {
  skemaSimpanSaldoAwalAkun,
  skemaSimpanSaldoAwalHutang,
  skemaSimpanSaldoAwalPiutang,
  skemaSimpanSaldoAwalStok,
} from "./model";
import * as layanan from "./service";

export const rutaSaldoAwal = new Elysia({ prefix: "/saldo-awal", name: "keuangan.saldo-awal" })
  .use(dasarKeuangan)
  .onBeforeHandle(izinPerMetode("master_data"))
  // Buku Besar (GL)
  .get("/akun", async () => ok(await layanan.ambilSaldoAwalAkun()))
  .post(
    "/akun",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.simpanSaldoAwalAkun(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaSimpanSaldoAwalAkun },
  )
  // Piutang (AR)
  .post(
    "/piutang",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.simpanSaldoAwalPiutang(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaSimpanSaldoAwalPiutang },
  )
  // Hutang (AP)
  .post(
    "/hutang",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.simpanSaldoAwalHutang(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaSimpanSaldoAwalHutang },
  )
  // Persediaan (Inventory)
  .post(
    "/persediaan",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.simpanSaldoAwalStok(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaSimpanSaldoAwalStok },
  );
