import { Elysia, t } from "elysia";
import { dasarKeuangan, ok, skema } from "../_umum";
import { skemaBuatAkun, skemaQueryAkun, skemaQueryPohonAkun, skemaUbahAkun } from "./skema";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("id") });

export const rutaAkun = new Elysia({ prefix: "/akun", name: "keuangan.akun" })
  .use(dasarKeuangan)
  .get("/", async ({ query }) => ok(await layanan.daftarAkun(query)), { query: skemaQueryAkun })
  .get("/pohon", async ({ query }) => ok(await layanan.pohonAkun({ aktif: query.aktif })), {
    query: skemaQueryPohonAkun,
  })
  .get("/:id", async ({ params }) => ok(await layanan.ambilAkun(params.id)), { params: parameterId })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatAkun(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaBuatAkun },
  )
  .patch("/:id", async ({ params, body, sesi }) => ok(await layanan.ubahAkun(params.id, body, sesi.penggunaId)), {
    params: parameterId,
    body: skemaUbahAkun,
  });
