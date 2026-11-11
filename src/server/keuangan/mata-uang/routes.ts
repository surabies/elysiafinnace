import { Elysia, t } from "elysia";
import { bacaHalaman, dasarKeuangan, ok, skema } from "../_umum";
import {
  skemaBuatMataUang,
  skemaQueryKurs,
  skemaQueryKursBerlaku,
  skemaQueryMataUang,
  skemaSimpanKurs,
  skemaUbahMataUang,
} from "./skema";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("id") });

export const rutaMataUang = new Elysia({ prefix: "/mata-uang", name: "keuangan.mata-uang" })
  .use(dasarKeuangan)
  .get("/", async ({ query }) => ok(await layanan.daftarMataUang({ aktif: query.aktif })), {
    query: skemaQueryMataUang,
  })
  .get("/dasar", async () => ok(await layanan.ambilMataUangDasar()))
  .get("/:id", async ({ params }) => ok(await layanan.ambilMataUang(params.id)), { params: parameterId })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatMataUang(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaBuatMataUang },
  )
  .patch("/:id", async ({ params, body, sesi }) => ok(await layanan.ubahMataUang(params.id, body, sesi.penggunaId)), {
    params: parameterId,
    body: skemaUbahMataUang,
  });

export const rutaKurs = new Elysia({ prefix: "/kurs", name: "keuangan.kurs" })
  .use(dasarKeuangan)
  .get(
    "/",
    async ({ query }) => {
      const { halaman, ukuran, offset } = bacaHalaman(query);
      const { data, total } = await layanan.daftarKurs({
        mataUangId: query.mataUangId,
        dari: query.dari,
        sampai: query.sampai,
        offset,
        ukuran,
      });
      return ok(data, { halaman, ukuran, total });
    },
    { query: skemaQueryKurs },
  )
  .get("/berlaku", async ({ query }) => ok(await layanan.dapatkanKursBerlaku(query.mataUangId, query.tanggal)), {
    query: skemaQueryKursBerlaku,
  })
  .put("/", async ({ body, sesi }) => ok(await layanan.simpanKurs(body, sesi.penggunaId)), {
    body: skemaSimpanKurs,
  });
