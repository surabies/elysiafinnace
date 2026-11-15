import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import {
  skemaQueryMappingMarketplace,
  skemaQueryPesananMarketplace,
  skemaSimpanChannelMarketplace,
  skemaSimpanMappingMarketplace,
  skemaSyncPesananMarketplace,
  skemaUbahChannelMarketplace,
} from "./model";
import {
  ambilChannel,
  daftarChannel,
  daftarMapping,
  daftarPesananMarketplace,
  hapusMapping,
  simpanChannel,
  simpanMapping,
  sinkronisasiPesanan,
  triggerSyncChannel,
  ubahChannel,
} from "./service";

export const rutaMarketplace = new Elysia({ prefix: "/marketplace", name: "keuangan.marketplace" })
  .use(dasarKeuangan)

  // 1. Channel Integrasi Toko
  .get("/channel", () => daftarChannel(), {
    beforeHandle: wajibIzin("marketplace.kelola"),
    detail: { summary: "Daftar akun toko marketplace terhubung", tags: ["Marketplace Integration"] },
  })
  .get("/channel/:id", ({ params }) => ambilChannel(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("marketplace.kelola"),
    detail: { summary: "Detail akun toko marketplace", tags: ["Marketplace Integration"] },
  })
  .post("/channel", ({ body, sesi }) => simpanChannel(body, sesi.penggunaId), {
    body: skemaSimpanChannelMarketplace,
    beforeHandle: wajibIzin("marketplace.kelola"),
    detail: { summary: "Menghubungkan channel toko marketplace baru", tags: ["Marketplace Integration"] },
  })
  .put("/channel/:id", ({ params, body, sesi }) => ubahChannel(params.id, body, sesi.penggunaId), {
    params: t.Object({ id: t.String() }),
    body: skemaUbahChannelMarketplace,
    beforeHandle: wajibIzin("marketplace.kelola"),
    detail: { summary: "Memperbarui konfigurasi akun marketplace", tags: ["Marketplace Integration"] },
  })
  .post("/channel/:id/sync", ({ params }) => triggerSyncChannel(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("marketplace.kelola"),
    detail: { summary: "Memicu sinkronisasi manual stok dan pesanan marketplace", tags: ["Marketplace Integration"] },
  })

  // 2. Pemetaan SKU (Product Mapping)
  .get("/mapping", ({ query }) => daftarMapping(query), {
    query: skemaQueryMappingMarketplace,
    beforeHandle: wajibIzin("marketplace.kelola"),
    detail: { summary: "Daftar pemetaan SKU marketplace dengan produk ERP", tags: ["Marketplace Integration"] },
  })
  .post("/mapping", ({ body }) => simpanMapping(body), {
    body: skemaSimpanMappingMarketplace,
    beforeHandle: wajibIzin("marketplace.kelola"),
    detail: { summary: "Menyimpan atau memperbarui mapping SKU marketplace", tags: ["Marketplace Integration"] },
  })
  .delete("/mapping/:id", ({ params }) => hapusMapping(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("marketplace.kelola"),
    detail: { summary: "Menghapus mapping SKU marketplace", tags: ["Marketplace Integration"] },
  })

  // 3. Tarik & Sinkron Pesanan (Order Ingestion)
  .get("/pesanan", ({ query }) => daftarPesananMarketplace(query), {
    query: skemaQueryPesananMarketplace,
    beforeHandle: wajibIzin("marketplace.kelola"),
    detail: { summary: "Riwayat pesanan ditarik dari seluruh marketplace", tags: ["Marketplace Integration"] },
  })
  .post("/pesanan/webhook-sync", ({ body }) => sinkronisasiPesanan(body), {
    body: skemaSyncPesananMarketplace,
    beforeHandle: wajibIzin("marketplace.kelola"),
    detail: { summary: "Webhook ingestion: sinkron pesanan marketplace & potong inventori gudang", tags: ["Marketplace Integration"] },
  });
