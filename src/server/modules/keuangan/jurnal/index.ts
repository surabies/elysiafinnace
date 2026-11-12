import { Elysia, t } from "elysia";
import { dasarKeuangan, pastikanIzin, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema } from "../shared/schema";
import {
  skemaBalikJurnal,
  skemaQueryBukuBesar,
  skemaQueryJurnal,
  skemaSimpanJurnal,
  skemaUbahJurnal,
} from "./model";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("id") });

export const rutaJurnal = new Elysia({ prefix: "/jurnal", name: "keuangan.jurnal" })
  .use(dasarKeuangan)
  .get("/", async ({ query }) => ok(await layanan.daftarJurnal(query)), {
    beforeHandle: wajibIzin("jurnal.baca"),
    query: skemaQueryJurnal,
  })
  .get("/:id", async ({ params }) => ok(await layanan.ambilJurnal(params.id)), {
    beforeHandle: wajibIzin("jurnal.baca"),
    params: parameterId,
  })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      if (body.posting) pastikanIzin(sesi, "jurnal.posting");
      const hasil = await layanan.buatJurnalManual(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("jurnal.kelola"), body: skemaSimpanJurnal },
  )
  .patch("/:id", async ({ params, body, sesi }) => ok(await layanan.ubahJurnalManual(params.id, body, sesi.penggunaId)), {
    beforeHandle: wajibIzin("jurnal.kelola"),
    params: parameterId,
    body: skemaUbahJurnal,
  })
  .delete("/:id", async ({ params }) => ok(await layanan.hapusJurnalDraft(params.id)), {
    beforeHandle: wajibIzin("jurnal.kelola"),
    params: parameterId,
  })
  .post("/:id/posting", async ({ params, sesi }) => ok(await layanan.postingJurnal(params.id, sesi.penggunaId)), {
    beforeHandle: wajibIzin("jurnal.posting"),
    params: parameterId,
  })
  .post("/:id/balik", async ({ params, body, sesi, set }) => {
    const hasil = await layanan.balikJurnalManual(params.id, body, sesi.penggunaId);
    set.status = 201;
    return ok(hasil);
  }, {
    beforeHandle: wajibIzin("jurnal.posting"),
    params: parameterId,
    body: skemaBalikJurnal,
  });

export const rutaBukuBesar = new Elysia({ prefix: "/buku-besar", name: "keuangan.buku-besar" })
  .use(dasarKeuangan)
  .get("/", async ({ query }) => ok(await layanan.bukuBesar(query)), {
    beforeHandle: wajibIzin("jurnal.baca"),
    query: skemaQueryBukuBesar,
  });
