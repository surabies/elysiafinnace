import { t } from "elysia";
import {
  CHANNEL_MARKETPLACE,
  STATUS_SYNC_MARKETPLACE,
  STATUS_SYNC_ORDER,
} from "@/db/schema/keuangan/konstanta";
import { skema } from "../shared/schema";

export const skemaChannelMarketplace = skema.pilihan("Channel Marketplace", CHANNEL_MARKETPLACE);
export const skemaStatusSyncMarketplace = skema.pilihan("Status Sync Marketplace", STATUS_SYNC_MARKETPLACE);
export const skemaStatusSyncOrder = skema.pilihan("Status Sync Order", STATUS_SYNC_ORDER);

// 1. Channel / Toko
export const skemaSimpanChannelMarketplace = t.Object({
  kode: skema.kode("Kode Saluran", 30),
  nama: skema.teks("Nama Toko/Channel", 100),
  channel: skemaChannelMarketplace,
  shopId: skema.teksOpsional("Shop ID", 100),
  apiKey: skema.teksOpsional("API Key", 500),
  apiSecret: skema.teksOpsional("API Secret", 500),
  accessToken: skema.teksOpsional("Access Token", 1000),
  gudangId: skema.uuid("Gudang Penyimpanan"),
  akunPendapatanId: t.Optional(skema.uuid("Akun Pendapatan")),
  akunBiayaAdminId: t.Optional(skema.uuid("Akun Biaya Admin/Komisi")),
  autoSyncStock: t.Optional(skema.boolean("Auto Sync Stock")),
  autoSyncOrders: t.Optional(skema.boolean("Auto Sync Orders")),
  status: t.Optional(skemaStatusSyncMarketplace),
});

export type SimpanChannelMarketplaceInput = typeof skemaSimpanChannelMarketplace.static;

export const skemaUbahChannelMarketplace = t.Partial(skemaSimpanChannelMarketplace);
export type UbahChannelMarketplaceInput = typeof skemaUbahChannelMarketplace.static;

// 2. Pemetaan SKU (Product Mapping)
export const skemaSimpanMappingMarketplace = t.Object({
  channelId: skema.uuid("Channel ID"),
  itemId: skema.uuid("Item ID"),
  marketplaceSku: skema.teks("Marketplace SKU", 100),
  marketplaceItemId: skema.teksOpsional("Marketplace Item ID", 100),
  marketplaceItemName: skema.teksOpsional("Marketplace Item Name", 250),
  hargaSinkron: t.Optional(skema.uang("Harga Sinkron")),
  aktif: t.Optional(skema.boolean("Aktif")),
});

export type SimpanMappingMarketplaceInput = typeof skemaSimpanMappingMarketplace.static;

export const skemaQueryMappingMarketplace = t.Object({
  channelId: t.Optional(t.String()),
  cari: t.Optional(t.String()),
  halaman: t.Optional(t.Numeric()),
  ukuran: t.Optional(t.Numeric()),
});

export type QueryMappingMarketplaceInput = typeof skemaQueryMappingMarketplace.static;

// 3. Sinkronisasi Pesanan (Order Ingestion)
export const skemaItemSyncPesanan = t.Object({
  itemId: skema.uuid("Item ID"),
  kuantitas: skema.kuantitas("Kuantitas"),
  hargaSatuan: skema.uang("Harga Satuan"),
  subtotal: skema.uang("Subtotal"),
});

export const skemaSyncPesananMarketplace = t.Object({
  channelId: skema.uuid("Channel ID"),
  externalOrderId: skema.teks("External Order ID", 100),
  nomorPesanan: skema.teks("Nomor Pesanan Marketplace", 100),
  namaPembeli: skema.teksOpsional("Nama Pembeli", 150),
  tanggalPesanan: skema.teks("Tanggal Pesanan", 50),
  totalNilai: skema.uang("Total Nilai"),
  biayaAdmin: t.Optional(skema.uang("Biaya Admin")),
  totalBersih: skema.uang("Total Bersih"),
  statusExternal: skema.teks("Status External Marketplace", 50),
  catatan: skema.teksOpsional("Catatan", 500),
  items: t.Optional(t.Array(skemaItemSyncPesanan)),
});

export type SyncPesananMarketplaceInput = typeof skemaSyncPesananMarketplace.static;

export const skemaQueryPesananMarketplace = t.Object({
  channelId: t.Optional(t.String()),
  statusSync: t.Optional(skemaStatusSyncOrder),
  cari: t.Optional(t.String()),
  halaman: t.Optional(t.Numeric()),
  ukuran: t.Optional(t.Numeric()),
});

export type QueryPesananMarketplaceInput = typeof skemaQueryPesananMarketplace.static;
