import { Elysia, t } from "elysia";
import { dasarKeuangan, izinPerMetode } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema, skemaImportCsv } from "../shared/schema";
import { skemaBuatAkun, skemaQueryAkun, skemaQueryPohonAkun, skemaUbahAkun } from "./model";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("id") });

export const rutaAkun = new Elysia({ prefix: "/akun", name: "keuangan.akun" })
  .use(dasarKeuangan)
  .onBeforeHandle(izinPerMetode("master_data"))
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
  .post(
    "/import",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.importAkun(body.csv, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaImportCsv },
  )
  .patch("/:id", async ({ params, body, sesi }) => ok(await layanan.ubahAkun(params.id, body, sesi.penggunaId)), {
    params: parameterId,
    body: skemaUbahAkun,
  });
