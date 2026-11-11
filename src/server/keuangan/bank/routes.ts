import { Elysia, t } from "elysia";
import { dasarKeuangan, izinPerMetode, ok, skema } from "../_umum";
import { skemaBuatRekening, skemaQueryRekening, skemaUbahRekening } from "./skema";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("id") });

export const rutaRekeningBank = new Elysia({ prefix: "/rekening-bank", name: "keuangan.rekening-bank" })
  .use(dasarKeuangan)
  .onBeforeHandle(izinPerMetode("master_data"))
  .get("/", async ({ query }) => ok(await layanan.daftarRekening(query)), { query: skemaQueryRekening })
  .get("/:id", async ({ params }) => ok(await layanan.ambilRekening(params.id)), { params: parameterId })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatRekening(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaBuatRekening },
  )
  .patch("/:id", async ({ params, body, sesi }) => ok(await layanan.ubahRekening(params.id, body, sesi.penggunaId)), {
    params: parameterId,
    body: skemaUbahRekening,
  });
