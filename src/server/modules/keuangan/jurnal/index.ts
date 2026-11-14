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
import { skemaSimpanLampiran } from "./lampiran.model";
import {
  skemaBuatJurnalBerulang,
  skemaBuatTemplate,
  skemaQueryTemplate,
  skemaUbahTemplate,
} from "./template.model";
import * as layanan from "./service";
import * as layananLampiran from "./lampiran.service";
import * as layananTemplate from "./template.service";

const parameterId = t.Object({ id: skema.uuid("id") });
const parameterLampiranId = t.Object({ lampiranId: skema.uuid("lampiranId") });

export const rutaJurnal = new Elysia({ prefix: "/jurnal", name: "keuangan.jurnal" })
  .use(dasarKeuangan)
  .get("/", async ({ query }) => ok(await layanan.daftarJurnal(query)), {
    beforeHandle: wajibIzin("jurnal.baca"),
    query: skemaQueryJurnal,
  })
  // Template Jurnal
  .get("/template", async ({ query }) => ok(await layananTemplate.daftarTemplate(query)), {
    beforeHandle: wajibIzin("jurnal.baca"),
    query: skemaQueryTemplate,
  })
  .get("/template/:id", async ({ params }) => ok(await layananTemplate.ambilTemplate(params.id)), {
    beforeHandle: wajibIzin("jurnal.baca"),
    params: parameterId,
  })
  .post(
    "/template",
    async ({ body, sesi, set }) => {
      const hasil = await layananTemplate.buatTemplate(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("jurnal.kelola"), body: skemaBuatTemplate },
  )
  .patch(
    "/template/:id",
    async ({ params, body, sesi }) => ok(await layananTemplate.ubahTemplate(params.id, body, sesi.penggunaId)),
    { beforeHandle: wajibIzin("jurnal.kelola"), params: parameterId, body: skemaUbahTemplate },
  )
  .delete(
    "/template/:id",
    async ({ params }) => ok(await layananTemplate.hapusTemplate(params.id)),
    { beforeHandle: wajibIzin("jurnal.kelola"), params: parameterId },
  )
  // Jurnal Berulang (Recurring)
  .get("/berulang", async () => ok(await layananTemplate.daftarJurnalBerulang()), {
    beforeHandle: wajibIzin("jurnal.baca"),
  })
  .post(
    "/berulang",
    async ({ body, sesi, set }) => {
      const hasil = await layananTemplate.buatJurnalBerulang(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("jurnal.kelola"), body: skemaBuatJurnalBerulang },
  )
  .post(
    "/berulang/:id/eksekusi",
    async ({ params, sesi }) => ok(await layananTemplate.eksekusiJurnalBerulang(params.id, sesi.penggunaId)),
    { beforeHandle: wajibIzin("jurnal.posting"), params: parameterId },
  )
  // Lampiran dokumen jurnal
  .get("/:id/lampiran", async ({ params }) => ok(await layananLampiran.daftarLampiran("JURNAL", params.id)), {
    beforeHandle: wajibIzin("jurnal.baca"),
    params: parameterId,
  })
  .post(
    "/:id/lampiran",
    async ({ params, body, sesi, set }) => {
      const hasil = await layananLampiran.tambahLampiran("JURNAL", params.id, body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("jurnal.kelola"), params: parameterId, body: skemaSimpanLampiran },
  )
  .delete(
    "/lampiran/:lampiranId",
    async ({ params }) => ok(await layananLampiran.hapusLampiran(params.lampiranId)),
    { beforeHandle: wajibIzin("jurnal.kelola"), params: parameterLampiranId },
  )
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
