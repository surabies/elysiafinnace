import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema } from "../shared/schema";
import {
  skemaBatal,
  skemaQueryFakturPenjualan,
  skemaQueryPesananPenjualan,
  skemaQueryReturPenjualan,
  skemaSimpanFakturPenjualan,
  skemaSimpanPesananPenjualan,
  skemaSimpanReturPenjualan,
} from "./model";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("ID") });

export const rutaPenjualan = new Elysia({ prefix: "/penjualan", name: "keuangan.penjualan" })
  .use(dasarKeuangan)

  /* ------------------- Pesanan Penjualan (SO) ------------------- */
  .get("/pesanan", async ({ query }) => ok(await layanan.daftarPesananPenjualan(query)), {
    beforeHandle: wajibIzin("penjualan.baca"),
    query: skemaQueryPesananPenjualan,
  })
  .get("/pesanan/:id", async ({ params }) => ok(await layanan.ambilPesananPenjualan(params.id)), {
    beforeHandle: wajibIzin("penjualan.baca"),
    params: parameterId,
  })
  .post(
    "/pesanan",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatPesananPenjualan(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("penjualan.kelola"), body: skemaSimpanPesananPenjualan },
  )
  .patch(
    "/pesanan/:id",
    async ({ params, body, sesi }) => ok(await layanan.ubahPesananPenjualan(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("penjualan.kelola"),
      params: parameterId,
      body: skemaSimpanPesananPenjualan,
    },
  )
  .post(
    "/pesanan/:id/setujui",
    async ({ params, sesi }) => ok(await layanan.setujuiPesananPenjualan(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("penjualan.posting"),
      params: parameterId,
    },
  )
  .post(
    "/pesanan/:id/batal",
    async ({ params, sesi }) => ok(await layanan.batalkanPesananPenjualan(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("penjualan.posting"),
      params: parameterId,
    },
  )

  /* ------------------- Faktur Penjualan (Invoice) ------------------- */
  .get("/faktur", async ({ query }) => ok(await layanan.daftarFakturPenjualan(query)), {
    beforeHandle: wajibIzin("penjualan.baca"),
    query: skemaQueryFakturPenjualan,
  })
  .get("/faktur/:id", async ({ params }) => ok(await layanan.ambilFakturPenjualan(params.id)), {
    beforeHandle: wajibIzin("penjualan.baca"),
    params: parameterId,
  })
  .post(
    "/faktur",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatFakturPenjualan(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("penjualan.kelola"), body: skemaSimpanFakturPenjualan },
  )
  .patch(
    "/faktur/:id",
    async ({ params, body, sesi }) => ok(await layanan.ubahFakturPenjualan(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("penjualan.kelola"),
      params: parameterId,
      body: skemaSimpanFakturPenjualan,
    },
  )
  .post(
    "/faktur/:id/posting",
    async ({ params, sesi }) => ok(await layanan.postingFakturPenjualan(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("penjualan.posting"),
      params: parameterId,
    },
  )
  .post(
    "/faktur/:id/batal",
    async ({ params, body, sesi }) => ok(await layanan.batalkanFakturPenjualan(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("penjualan.posting"),
      params: parameterId,
      body: skemaBatal,
    },
  )

  /* ------------------- Retur Penjualan (Credit Note) ------------------- */
  .get("/retur", async ({ query }) => ok(await layanan.daftarReturPenjualan(query)), {
    beforeHandle: wajibIzin("penjualan.baca"),
    query: skemaQueryReturPenjualan,
  })
  .get("/retur/:id", async ({ params }) => ok(await layanan.ambilReturPenjualan(params.id)), {
    beforeHandle: wajibIzin("penjualan.baca"),
    params: parameterId,
  })
  .post(
    "/retur",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatReturPenjualan(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("penjualan.kelola"), body: skemaSimpanReturPenjualan },
  )
  .post(
    "/retur/:id/posting",
    async ({ params, sesi }) => ok(await layanan.postingReturPenjualan(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("penjualan.posting"),
      params: parameterId,
    },
  )
  .post(
    "/retur/:id/batal",
    async ({ params, body, sesi }) => ok(await layanan.batalkanReturPenjualan(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("penjualan.posting"),
      params: parameterId,
      body: skemaBatal,
    },
  );
