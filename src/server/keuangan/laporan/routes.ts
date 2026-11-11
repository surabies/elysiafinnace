import { Elysia } from "elysia";
import { dasarKeuangan, ok, wajibIzin } from "../_umum";
import { skemaQueryNeraca, skemaQueryRentang } from "./skema";
import * as layanan from "./service";

export const rutaLaporan = new Elysia({ prefix: "/laporan", name: "keuangan.laporan" })
  .use(dasarKeuangan)
  .get("/neraca", async ({ query }) => ok(await layanan.laporanNeraca(query.perTanggal)), {
    beforeHandle: wajibIzin("laporan.baca"),
    query: skemaQueryNeraca,
  })
  .get("/laba-rugi", async ({ query }) => ok(await layanan.laporanLabaRugi(query.dari, query.sampai)), {
    beforeHandle: wajibIzin("laporan.baca"),
    query: skemaQueryRentang,
  })
  .get(
    "/perubahan-modal",
    async ({ query }) => ok(await layanan.laporanPerubahanModal(query.dari, query.sampai)),
    {
      beforeHandle: wajibIzin("laporan.baca"),
      query: skemaQueryRentang,
    },
  )
  .get("/arus-kas", async ({ query }) => ok(await layanan.laporanArusKas(query.dari, query.sampai)), {
    beforeHandle: wajibIzin("laporan.baca"),
    query: skemaQueryRentang,
  });
