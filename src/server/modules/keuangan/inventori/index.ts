import { Elysia, t } from "elysia";
import { bacaHalaman } from "../shared/pagination";
import { dasarKeuangan, izinPerMetode } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema, skemaImportCsv } from "../shared/schema";
import {
  skemaAturItemBundel,
  skemaBuatBatch,
  skemaBuatDaftarHarga,
  skemaBuatGudang,
  skemaBuatItem,
  skemaBuatKategori,
  skemaBuatSatuan,
  skemaItemBundelKomponen,
  skemaItemSatuan,
  skemaQueryAktif,
  skemaQueryBatch,
  skemaQueryCariHarga,
  skemaQueryDaftarHarga,
  skemaQueryGudang,
  skemaQueryItem,
  skemaQueryKartuStok,
  skemaQueryNilaiPersediaan,
  skemaQueryPenyesuaianStok,
  skemaQueryTransferGudang,
  skemaSimpanBarisDaftarHarga,
  skemaSimpanPenyesuaianStok,
  skemaSimpanTransferGudang,
  skemaUbahDaftarHarga,
  skemaUbahGudang,
  skemaUbahItem,
  skemaUbahItemSatuan,
  skemaUbahKategori,
  skemaUbahSatuan,
} from "./model";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("id") });
const parameterSubId = t.Object({ id: skema.uuid("id"), subId: skema.uuid("subId") });

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
  .post(
    "/import",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.importItem(body.csv, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaImportCsv },
  )
  .patch("/:id", async ({ params, body, sesi }) => ok(await layanan.ubahItem(params.id, body, sesi.penggunaId)), {
    params: parameterId,
    body: skemaUbahItem,
  })
  // Cari harga kalkulasi untuk item (berdasarkan satuan, volume, daftar harga)
  .get(
    "/:id/harga",
    async ({ params, query }) =>
      ok(
        await layanan.cariHargaItem(params.id, {
          satuanId: query.satuanId,
          daftarHargaId: query.daftarHargaId,
          kuantitas: query.kuantitas,
        }),
      ),
    {
      params: parameterId,
      query: skemaQueryCariHarga,
    },
  )
  // Sub-resource multi-satuan
  .get("/:id/satuan", async ({ params }) => ok(await layanan.daftarItemSatuan(params.id)), { params: parameterId })
  .post(
    "/:id/satuan",
    async ({ params, body, sesi, set }) => {
      const hasil = await layanan.tambahItemSatuan(params.id, body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      params: parameterId,
      body: skemaItemSatuan,
    },
  )
  .patch(
    "/:id/satuan/:subId",
    async ({ params, body, sesi }) => ok(await layanan.ubahItemSatuan(params.subId, body, sesi.penggunaId)),
    {
      params: parameterSubId,
      body: skemaUbahItemSatuan,
    },
  )
  .delete("/:id/satuan/:subId", async ({ params }) => ok(await layanan.hapusItemSatuan(params.subId)), {
    params: parameterSubId,
  })
  // Sub-resource bundel
  .get("/:id/bundel", async ({ params }) => ok(await layanan.daftarItemBundel(params.id)), { params: parameterId })
  .put(
    "/:id/bundel",
    async ({ params, body, sesi }) => ok(await layanan.aturItemBundel(params.id, body, sesi.penggunaId)),
    {
      params: parameterId,
      body: skemaAturItemBundel,
    },
  )
  .post(
    "/:id/bundel",
    async ({ params, body, sesi, set }) => {
      const hasil = await layanan.tambahItemBundel(params.id, body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      params: parameterId,
      body: skemaItemBundelKomponen,
    },
  )
  .delete("/:id/bundel/:subId", async ({ params }) => ok(await layanan.hapusItemBundel(params.subId)), {
    params: parameterSubId,
  });

export const rutaDaftarHarga = new Elysia({ prefix: "/daftar-harga", name: "keuangan.daftar-harga" })
  .use(dasarKeuangan)
  .onBeforeHandle(izinPerMetode("master_data"))
  .get(
    "/",
    async ({ query }) => {
      const { halaman, ukuran, offset } = bacaHalaman(query);
      const { data, total } = await layanan.daftarDaftarHarga({
        aktif: query.aktif,
        q: query.q,
        offset,
        ukuran,
      });
      return ok(data, { halaman, ukuran, total });
    },
    { query: skemaQueryDaftarHarga },
  )
  .get("/:id", async ({ params }) => ok(await layanan.ambilDaftarHarga(params.id)), { params: parameterId })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatDaftarHarga(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaBuatDaftarHarga },
  )
  .patch(
    "/:id",
    async ({ params, body, sesi }) => ok(await layanan.ubahDaftarHarga(params.id, body, sesi.penggunaId)),
    {
      params: parameterId,
      body: skemaUbahDaftarHarga,
    },
  )
  .delete("/:id", async ({ params }) => ok(await layanan.hapusDaftarHarga(params.id)), { params: parameterId })
  .post(
    "/:id/item",
    async ({ params, body, sesi, set }) => {
      const hasil = await layanan.simpanBarisDaftarHarga(params.id, body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      params: parameterId,
      body: skemaSimpanBarisDaftarHarga,
    },
  )
  .delete("/:id/item/:subId", async ({ params }) => ok(await layanan.hapusBarisDaftarHarga(params.subId)), {
    params: parameterSubId,
  });

/* ------------------------------- Gudang ------------------------------ */

export const rutaGudang = new Elysia({ prefix: "/gudang", name: "keuangan.gudang" })
  .use(dasarKeuangan)
  .onBeforeHandle(izinPerMetode("master_data"))
  .get("/", async ({ query }) => ok(await layanan.daftarGudang(query)), { query: skemaQueryGudang })
  .get("/:id", async ({ params }) => ok(await layanan.ambilGudang(params.id)), { params: parameterId })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatGudang(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaBuatGudang },
  )
  .patch(
    "/:id",
    async ({ params, body, sesi }) => ok(await layanan.ubahGudang(params.id, body, sesi.penggunaId)),
    {
      params: parameterId,
      body: skemaUbahGudang,
    },
  )
  .delete("/:id", async ({ params }) => ok(await layanan.hapusGudang(params.id)), { params: parameterId });

/* -------------------------- Transfer Gudang -------------------------- */

export const rutaTransferGudang = new Elysia({ prefix: "/transfer-gudang", name: "keuangan.transfer-gudang" })
  .use(dasarKeuangan)
  .onBeforeHandle(izinPerMetode("persediaan"))
  .get("/", async ({ query }) => ok(await layanan.daftarTransferGudang(query)), { query: skemaQueryTransferGudang })
  .get("/:id", async ({ params }) => ok(await layanan.ambilTransferGudang(params.id)), { params: parameterId })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatTransferGudang(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaSimpanTransferGudang },
  )
  .post(
    "/:id/posting",
    async ({ params, sesi }) => ok(await layanan.postingTransferGudang(params.id, sesi.penggunaId)),
    { params: parameterId },
  )
  .post(
    "/:id/batal",
    async ({ params, sesi }) => ok(await layanan.batalkanTransferGudang(params.id, sesi.penggunaId)),
    { params: parameterId },
  );

/* --------------------- Penyesuaian Stok / Opname --------------------- */

export const rutaPenyesuaianStok = new Elysia({ prefix: "/penyesuaian-stok", name: "keuangan.penyesuaian-stok" })
  .use(dasarKeuangan)
  .onBeforeHandle(izinPerMetode("persediaan"))
  .get("/", async ({ query }) => ok(await layanan.daftarPenyesuaianStok(query)), { query: skemaQueryPenyesuaianStok })
  .get("/:id", async ({ params }) => ok(await layanan.ambilPenyesuaianStok(params.id)), { params: parameterId })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatPenyesuaianStok(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaSimpanPenyesuaianStok },
  )
  .post(
    "/:id/posting",
    async ({ params, sesi }) => ok(await layanan.postingPenyesuaianStok(params.id, sesi.penggunaId)),
    { params: parameterId },
  )
  .post(
    "/:id/batal",
    async ({ params, sesi }) => ok(await layanan.batalkanPenyesuaianStok(params.id, sesi.penggunaId)),
    { params: parameterId },
  );

/* -------------------------- Laporan Stok ----------------------------- */

export const rutaLaporanInventori = new Elysia({ prefix: "/inventori-laporan", name: "keuangan.inventori-laporan" })
  .use(dasarKeuangan)
  .onBeforeHandle(izinPerMetode("persediaan"))
  .get("/kartu-stok", async ({ query }) => ok(await layanan.ambilKartuStok(query)), { query: skemaQueryKartuStok })
  .get("/nilai-persediaan", async ({ query }) => ok(await layanan.ambilNilaiPersediaan(query)), {
    query: skemaQueryNilaiPersediaan,
  })
  .get("/batch", async ({ query }) => ok(await layanan.daftarBatch(query)), { query: skemaQueryBatch })
  .post(
    "/batch",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatBatch(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { body: skemaBuatBatch },
  );
