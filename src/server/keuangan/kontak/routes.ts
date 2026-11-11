import { Elysia, t } from "elysia";
import { bacaHalaman, dasarKeuangan, ok, skema } from "../_umum";
import {
  skemaBuatKontak,
  skemaBuatTermin,
  skemaQueryKontak,
  skemaQueryTermin,
  skemaUbahKontak,
  skemaUbahTermin,
} from "./skema";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("id") });

export const rutaTermin = new Elysia({ prefix: "/termin-pembayaran", name: "keuangan.termin-pembayaran" })
  .use(dasarKeuangan)
  .get("/", async ({ query }) => ok(await layanan.daftarTermin({ aktif: query.aktif })), { query: skemaQueryTermin })
  .get("/:id", async ({ params }) => ok(await layanan.ambilTermin(params.id)), { params: parameterId })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatTermin(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaBuatTermin },
  )
  .patch("/:id", async ({ params, body, sesi }) => ok(await layanan.ubahTermin(params.id, body, sesi.penggunaId)), {
    params: parameterId,
    body: skemaUbahTermin,
  });

export const rutaKontak = new Elysia({ prefix: "/kontak", name: "keuangan.kontak" })
  .use(dasarKeuangan)
  .get(
    "/",
    async ({ query }) => {
      const { halaman, ukuran, offset } = bacaHalaman(query);
      const { data, total } = await layanan.daftarKontak({
        jenis: query.jenis,
        aktif: query.aktif,
        q: query.q,
        offset,
        ukuran,
      });
      return ok(data, { halaman, ukuran, total });
    },
    { query: skemaQueryKontak },
  )
  .get("/:id", async ({ params }) => ok(await layanan.ambilKontak(params.id)), { params: parameterId })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatKontak(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaBuatKontak },
  )
  .patch("/:id", async ({ params, body, sesi }) => ok(await layanan.ubahKontak(params.id, body, sesi.penggunaId)), {
    params: parameterId,
    body: skemaUbahKontak,
  });
