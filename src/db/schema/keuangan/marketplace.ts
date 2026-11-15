import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu, uang } from "./_helper";
import { chartOfAccounts } from "./akun";
import { salesInvoices } from "./dagang";
import { items, warehouses } from "./inventori";
import {
  CHANNEL_MARKETPLACE,
  STATUS_ORDER_MARKETPLACE,
  STATUS_SYNC_MARKETPLACE,
  STATUS_SYNC_ORDER,
} from "./konstanta";

export const channelMarketplaceEnum = pgEnum("channel_marketplace", CHANNEL_MARKETPLACE);
export const statusSyncMarketplaceEnum = pgEnum(
  "status_sync_marketplace",
  STATUS_SYNC_MARKETPLACE,
);
export const statusOrderMarketplaceEnum = pgEnum(
  "status_order_marketplace",
  STATUS_ORDER_MARKETPLACE,
);
export const statusSyncOrderEnum = pgEnum("status_sync_order", STATUS_SYNC_ORDER);

/**
 * Akun integrasi marketplace (Tokopedia, Shopee, TikTok Shop, dll.)
 */
export const marketplaceChannels = pgTable(
  "marketplace_channels",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 100 }).notNull(),
    channel: channelMarketplaceEnum("channel").notNull(),
    shopId: varchar("shop_id", { length: 100 }),
    apiKey: text("api_key"),
    apiSecret: text("api_secret"),
    accessToken: text("access_token"),
    gudangId: uuid("gudang_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "restrict" }),
    akunPendapatanId: uuid("akun_pendapatan_id").references(() => chartOfAccounts.id, {
      onDelete: "restrict",
    }),
    akunBiayaAdminId: uuid("akun_biaya_admin_id").references(() => chartOfAccounts.id, {
      onDelete: "restrict",
    }),
    status: statusSyncMarketplaceEnum("status").notNull().default("AKTIF"),
    autoSyncStock: boolean("auto_sync_stock").notNull().default(true),
    autoSyncOrders: boolean("auto_sync_orders").notNull().default(true),
    terakhirSinkron: timestamp("terakhir_sinkron", { withTimezone: true }),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_marketplace_channels_channel").on(t.channel)],
);

/**
 * Pemetaan SKU Marketplace ke Item Produk di ERP (Omnichannel SKU Mapping)
 */
export const marketplaceProductMappings = pgTable(
  "marketplace_product_mappings",
  {
    id: kolomId(),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => marketplaceChannels.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    marketplaceSku: varchar("marketplace_sku", { length: 100 }).notNull(),
    marketplaceItemId: varchar("marketplace_item_id", { length: 100 }),
    marketplaceItemName: varchar("marketplace_item_name", { length: 250 }),
    hargaSinkron: uang("harga_sinkron"),
    aktif: kolomAktif(),
    terakhirSinkron: timestamp("terakhir_sinkron", { withTimezone: true }),
    ...kolomWaktu,
  },
  (t) => [
    uniqueIndex("uq_mkt_mapping_channel_item").on(t.channelId, t.itemId),
    index("idx_mkt_mapping_sku").on(t.marketplaceSku),
  ],
);

/**
 * Riwayat pesanan yang ditarik dari Marketplace
 */
export const marketplaceOrders = pgTable(
  "marketplace_orders",
  {
    id: kolomId(),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => marketplaceChannels.id, { onDelete: "restrict" }),
    externalOrderId: varchar("external_order_id", { length: 100 }).notNull(),
    nomorPesanan: varchar("nomor_pesanan", { length: 100 }).notNull(),
    namaPembeli: varchar("nama_pembeli", { length: 150 }),
    tanggalPesanan: timestamp("tanggal_pesanan", { withTimezone: true }).notNull(),
    totalNilai: uang("total_nilai").notNull(),
    biayaAdmin: uang("biaya_admin").notNull().default("0.0000"),
    totalBersih: uang("total_bersih").notNull(),
    statusExternal: varchar("status_external", { length: 50 }).notNull(),
    statusSync: statusSyncOrderEnum("status_sync").notNull().default("SELESAI"),
    salesInvoiceId: uuid("sales_invoice_id").references(() => salesInvoices.id, {
      onDelete: "set null",
    }),
    catatan: text("catatan"),
    ...kolomWaktu,
  },
  (t) => [
    uniqueIndex("uq_mkt_orders_channel_ext").on(t.channelId, t.externalOrderId),
    index("idx_mkt_orders_tanggal").on(t.tanggalPesanan),
  ],
);

export type SaluranMarketplace = typeof marketplaceChannels.$inferSelect;
export type PemetaanProdukMarketplace = typeof marketplaceProductMappings.$inferSelect;
export type PesananMarketplace = typeof marketplaceOrders.$inferSelect;
