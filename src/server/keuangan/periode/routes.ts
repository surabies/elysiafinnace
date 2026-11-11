import { Elysia, t } from "elysia";
import { dasarKeuangan, ok, skema, wajibIzin } from "../_umum";
import { skemaQueryPeriode, skemaSiapkanPeriode } from "./skema";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("id") });

export const rutaPeriode = new Elysia({ prefix: "/periode", name: "keuangan.periode" })
  .use(dasarKeuangan)
  .get("/", async ({ query }) => ok(await layanan.daftarPeriode(query)), {
    beforeHandle: wajibIzin("periode.baca"),
    query: skemaQueryPeriode,
  })
  .post(
    "/siapkan",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.siapkanPeriodeTahun(Number(body.tahun), sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("periode.kelola"), body: skemaSiapkanPeriode },
  )
  .post("/:id/tutup", async ({ params, sesi }) => ok(await layanan.tutupPeriode(params.id, sesi.penggunaId)), {
    beforeHandle: wajibIzin("periode.kelola"),
    params: parameterId,
  })
  .post(
    "/:id/buka",
    async ({ params, sesi }) =>
      ok(await layanan.bukaPeriode(params.id, sesi.penggunaId, layanan.tahunSudahTutupBuku)),
    {
      beforeHandle: wajibIzin("periode.kelola"),
      params: parameterId,
    },
  );
