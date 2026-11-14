import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema } from "../shared/schema";
import {
  skemaBatal,
  skemaQueryFakturPembelian,
  skemaQueryPesananPembelian,
  skemaQueryReturPembelian,
  skemaSimpanFakturPembelian,
  skemaSimpanPesananPembelian,
  skemaSimpanReturPembelian,
} from "./model";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("ID") });

export const rutaPembelian = new Elysia({ prefix: "/pembelian", name: "keuangan.pembelian" })
  .use(dasarKeuangan)

  /* ------------------- Pesanan Pembelian (PO) ------------------- */
  .get("/pesanan", async ({ query }) => ok(await layanan.daftarPesananPembelian(query)), {
    beforeHandle: wajibIzin("pembelian.baca"),
    query: skemaQueryPesananPembelian,
  })
  .get("/pesanan/:id", async ({ params }) => ok(await layanan.ambilPesananPembelian(params.id)), {
    beforeHandle: wajibIzin("pembelian.baca"),
    params: parameterId,
  })
  .post(
    "/pesanan",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatPesananPembelian(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("pembelian.kelola"), body: skemaSimpanPesananPembelian },
  )
  .patch(
    "/pesanan/:id",
    async ({ params, body, sesi }) => ok(await layanan.ubahPesananPembelian(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("pembelian.kelola"),
      params: parameterId,
      body: skemaSimpanPesananPembelian,
    },
  )
  .post(
    "/pesanan/:id/setujui",
    async ({ params, sesi }) => ok(await layanan.setujuiPesananPembelian(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("pembelian.posting"),
      params: parameterId,
    },
  )
  .post(
    "/pesanan/:id/batal",
    async ({ params, sesi }) => ok(await layanan.batalkanPesananPembelian(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("pembelian.posting"),
      params: parameterId,
    },
  )

  /* ------------------- Faktur Pembelian (Bill) ------------------- */
  .get("/faktur", async ({ query }) => ok(await layanan.daftarFakturPembelian(query)), {
    beforeHandle: wajibIzin("pembelian.baca"),
    query: skemaQueryFakturPembelian,
  })
  .get("/faktur/:id", async ({ params }) => ok(await layanan.ambilFakturPembelian(params.id)), {
    beforeHandle: wajibIzin("pembelian.baca"),
    params: parameterId,
  })
  .post(
    "/faktur",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatFakturPembelian(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("pembelian.kelola"), body: skemaSimpanFakturPembelian },
  )
  .patch(
    "/faktur/:id",
    async ({ params, body, sesi }) => ok(await layanan.ubahFakturPembelian(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("pembelian.kelola"),
      params: parameterId,
      body: skemaSimpanFakturPembelian,
    },
  )
  .post(
    "/faktur/:id/posting",
    async ({ params, sesi }) => ok(await layanan.postingFakturPembelian(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("pembelian.posting"),
      params: parameterId,
    },
  )
  .post(
    "/faktur/:id/batal",
    async ({ params, body, sesi }) => ok(await layanan.batalkanFakturPembelian(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("pembelian.posting"),
      params: parameterId,
      body: skemaBatal,
    },
  )

  /* ------------------- Retur Pembelian (Debit Note) ------------------- */
  .get("/retur", async ({ query }) => ok(await layanan.daftarReturPembelian(query)), {
    beforeHandle: wajibIzin("pembelian.baca"),
    query: skemaQueryReturPembelian,
  })
  .get("/retur/:id", async ({ params }) => ok(await layanan.ambilReturPembelian(params.id)), {
    beforeHandle: wajibIzin("pembelian.baca"),
    params: parameterId,
  })
  .post(
    "/retur",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatReturPembelian(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("pembelian.kelola"), body: skemaSimpanReturPembelian },
  )
  .post(
    "/retur/:id/posting",
    async ({ params, sesi }) => ok(await layanan.postingReturPembelian(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("pembelian.posting"),
      params: parameterId,
    },
  )
  .post(
    "/retur/:id/batal",
    async ({ params, body, sesi }) => ok(await layanan.batalkanReturPembelian(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("pembelian.posting"),
      params: parameterId,
      body: skemaBatal,
    },
  );
