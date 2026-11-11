import { Elysia, t } from "elysia";
import { bacaHalaman, dasarKeuangan, izinPerMetode, ok, skema } from "../_umum";
import {
  skemaBuatItem,
  skemaBuatKategori,
  skemaBuatSatuan,
  skemaQueryAktif,
  skemaQueryItem,
  skemaUbahItem,
  skemaUbahKategori,
  skemaUbahSatuan,
} from "./skema";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("id") });

export const rutaKategoriProduk = new Elysia({ prefix: "/kategori-produk", name: "keuangan.kategori-produk" })
  .use(dasarKeuangan)
  .onBeforeHandle(izinPerMetode("master_data"))
  .get("/", async ({ query }) => ok(await layanan.daftarKategori({ aktif: query.aktif })), { query: skemaQueryAktif })
  .get("/:id", async ({ params }) => ok(await layanan.ambilKategori(params.id)), { params: parameterId })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatKategori(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaBuatKategori },
  )
  .patch("/:id", async ({ params, body, sesi }) => ok(await layanan.ubahKategori(params.id, body, sesi.penggunaId)), {
    params: parameterId,
    body: skemaUbahKategori,
  });

export const rutaSatuan = new Elysia({ prefix: "/satuan", name: "keuangan.satuan" })
  .use(dasarKeuangan)
  .onBeforeHandle(izinPerMetode("master_data"))
  .get("/", async ({ query }) => ok(await layanan.daftarSatuan({ aktif: query.aktif })), { query: skemaQueryAktif })
  .get("/:id", async ({ params }) => ok(await layanan.ambilSatuan(params.id)), { params: parameterId })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatSatuan(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaBuatSatuan },
  )
  .patch("/:id", async ({ params, body, sesi }) => ok(await layanan.ubahSatuan(params.id, body, sesi.penggunaId)), {
    params: parameterId,
    body: skemaUbahSatuan,
  });

export const rutaItem = new Elysia({ prefix: "/item", name: "keuangan.item" })
  .use(dasarKeuangan)
  .onBeforeHandle(izinPerMetode("master_data"))
  .get(
    "/",
    async ({ query }) => {
      const { halaman, ukuran, offset } = bacaHalaman(query);
      const { data, total } = await layanan.daftarItem({
        tipeBarang: query.tipeBarang,
        kategoriId: query.kategoriId,
        aktif: query.aktif,
        q: query.q,
        offset,
        ukuran,
      });
      return ok(data, { halaman, ukuran, total });
    },
    { query: skemaQueryItem },
  )
  .get("/:id", async ({ params }) => ok(await layanan.ambilItem(params.id)), { params: parameterId })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatItem(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaBuatItem },
  )
  .patch("/:id", async ({ params, body, sesi }) => ok(await layanan.ubahItem(params.id, body, sesi.penggunaId)), {
    params: parameterId,
    body: skemaUbahItem,
  });
