import { Elysia, t } from "elysia";
import { bacaHalaman } from "../shared/pagination";
import { dasarKeuangan, izinPerMetode } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema, skemaImportCsv } from "../shared/schema";
import {
  skemaBuatKontak,
  skemaBuatTermin,
  skemaQueryKontak,
  skemaQueryTermin,
  skemaSimpanAlamat,
  skemaSimpanPic,
  skemaUbahKontak,
  skemaUbahTermin,
} from "./model";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("id") });

export const rutaTermin = new Elysia({ prefix: "/termin-pembayaran", name: "keuangan.termin-pembayaran" })
  .use(dasarKeuangan)
  .onBeforeHandle(izinPerMetode("master_data"))
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
  .onBeforeHandle(izinPerMetode("master_data"))
  .get(
    "/",
    async ({ query }) => {
      const { halaman, ukuran, offset } = bacaHalaman(query);
      const { data, total } = await layanan.daftarKontak({
        jenis: query.jenis,
        grup: query.grup,
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
  .post(
    "/import",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.importKontak(body.csv, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaImportCsv },
  )
  .patch("/:id", async ({ params, body, sesi }) => ok(await layanan.ubahKontak(params.id, body, sesi.penggunaId)), {
    params: parameterId,
    body: skemaUbahKontak,
  })
  .post(
    "/:id/alamat",
    async ({ params, body, set }) => {
      const hasil = await layanan.tambahAlamatKontak(params.id, body);
      set.status = 201;
      return ok(hasil);
    },
    { params: parameterId, body: skemaSimpanAlamat },
  )
  .delete(
    "/alamat/:alamatId",
    async ({ params }) => ok(await layanan.hapusAlamatKontak(params.alamatId)),
    { params: t.Object({ alamatId: skema.uuid("alamatId") }) },
  )
  .post(
    "/:id/pic",
    async ({ params, body, set }) => {
      const hasil = await layanan.tambahPicKontak(params.id, body);
      set.status = 201;
      return ok(hasil);
    },
    { params: parameterId, body: skemaSimpanPic },
  )
  .delete(
    "/pic/:picId",
    async ({ params }) => ok(await layanan.hapusPicKontak(params.picId)),
    { params: t.Object({ picId: skema.uuid("picId") }) },
  )
  .get(
    "/:id/batas-kredit",
    async ({ params, query }) => ok(await layanan.cekBatasKredit(params.id, query.nominal ?? "0")),
    {
      params: parameterId,
      query: t.Object({ nominal: t.Optional(skema.uang("nominal")) }),
    },
  );
