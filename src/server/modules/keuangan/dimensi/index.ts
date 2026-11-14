import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema } from "../shared/schema";
import {
  skemaQueryCabang,
  skemaQueryDepartemen,
  skemaQueryProyek,
  skemaQueryTag,
  skemaSimpanCabang,
  skemaSimpanDepartemen,
  skemaSimpanProyek,
  skemaSimpanTag,
} from "./model";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("ID") });

export const rutaDimensi = new Elysia({ prefix: "/dimensi", name: "keuangan.dimensi" })
  .use(dasarKeuangan)

  // ==========================================
  // 1. MASTER CABANG (BRANCHES)
  // ==========================================
  .get("/cabang", async ({ query }) => ok(await layanan.daftarCabang(query)), {
    beforeHandle: wajibIzin("dimensi.baca"),
    query: skemaQueryCabang,
  })
  .get("/cabang/:id", async ({ params }) => ok(await layanan.ambilCabang(params.id)), {
    beforeHandle: wajibIzin("dimensi.baca"),
    params: parameterId,
  })
  .post(
    "/cabang",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatCabang(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("dimensi.kelola"),
      body: skemaSimpanCabang,
    },
  )
  .put(
    "/cabang/:id",
    async ({ params, body, sesi }) =>
      ok(await layanan.ubahCabang(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("dimensi.kelola"),
      params: parameterId,
      body: t.Partial(skemaSimpanCabang),
    },
  )

  // ==========================================
  // 2. MASTER DEPARTEMEN (DEPARTMENTS)
  // ==========================================
  .get("/departemen", async ({ query }) => ok(await layanan.daftarDepartemen(query)), {
    beforeHandle: wajibIzin("dimensi.baca"),
    query: skemaQueryDepartemen,
  })
  .get("/departemen/:id", async ({ params }) => ok(await layanan.ambilDepartemen(params.id)), {
    beforeHandle: wajibIzin("dimensi.baca"),
    params: parameterId,
  })
  .post(
    "/departemen",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatDepartemen(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("dimensi.kelola"),
      body: skemaSimpanDepartemen,
    },
  )
  .put(
    "/departemen/:id",
    async ({ params, body, sesi }) =>
      ok(await layanan.ubahDepartemen(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("dimensi.kelola"),
      params: parameterId,
      body: t.Partial(skemaSimpanDepartemen),
    },
  )

  // ==========================================
  // 3. MASTER PROYEK (PROJECTS)
  // ==========================================
  .get("/proyek", async ({ query }) => ok(await layanan.daftarProyek(query)), {
    beforeHandle: wajibIzin("dimensi.baca"),
    query: skemaQueryProyek,
  })
  .get("/proyek/:id", async ({ params }) => ok(await layanan.ambilProyek(params.id)), {
    beforeHandle: wajibIzin("dimensi.baca"),
    params: parameterId,
  })
  .post(
    "/proyek",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatProyek(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("dimensi.kelola"),
      body: skemaSimpanProyek,
    },
  )
  .put(
    "/proyek/:id",
    async ({ params, body, sesi }) =>
      ok(await layanan.ubahProyek(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("dimensi.kelola"),
      params: parameterId,
      body: t.Partial(skemaSimpanProyek),
    },
  )

  // ==========================================
  // 4. MASTER TAG
  // ==========================================
  .get("/tag", async ({ query }) => ok(await layanan.daftarTag(query)), {
    beforeHandle: wajibIzin("dimensi.baca"),
    query: skemaQueryTag,
  })
  .get("/tag/:id", async ({ params }) => ok(await layanan.ambilTag(params.id)), {
    beforeHandle: wajibIzin("dimensi.baca"),
    params: parameterId,
  })
  .post(
    "/tag",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatTag(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("dimensi.kelola"),
      body: skemaSimpanTag,
    },
  )
  .put(
    "/tag/:id",
    async ({ params, body, sesi }) =>
      ok(await layanan.ubahTag(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("dimensi.kelola"),
      params: parameterId,
      body: t.Partial(skemaSimpanTag),
    },
  );
