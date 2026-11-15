import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../shared/context";
import {
  chartOfAccounts,
  itemStocks,
  items,
  marketplaceChannels,
  marketplaceOrders,
  marketplaceProductMappings,
  stockMovements,
  warehouses,
  type SaluranMarketplace,
} from "@/db/schema/keuangan";
import { galat } from "@/server/core/errors";
import { keBigInt, keString } from "../shared/decimal";
import { bacaHalaman } from "../shared/pagination";
import type {
  QueryMappingMarketplaceInput,
  QueryPesananMarketplaceInput,
  SimpanChannelMarketplaceInput,
  SimpanMappingMarketplaceInput,
  SyncPesananMarketplaceInput,
  UbahChannelMarketplaceInput,
} from "./model";

// ==========================================
// 1. SALURAN / CHANNEL MARKETPLACE
// ==========================================

export async function daftarChannel(): Promise<
  (SaluranMarketplace & { gudangNama: string; akunPendapatanNama?: string; akunBiayaAdminNama?: string })[]
> {
  const data = await db
    .select({
      id: marketplaceChannels.id,
      kode: marketplaceChannels.kode,
      nama: marketplaceChannels.nama,
      channel: marketplaceChannels.channel,
      shopId: marketplaceChannels.shopId,
      apiKey: marketplaceChannels.apiKey,
      apiSecret: marketplaceChannels.apiSecret,
      accessToken: marketplaceChannels.accessToken,
      gudangId: marketplaceChannels.gudangId,
      gudangNama: warehouses.nama,
      akunPendapatanId: marketplaceChannels.akunPendapatanId,
      akunPendapatanNama: chartOfAccounts.nama,
      akunBiayaAdminId: marketplaceChannels.akunBiayaAdminId,
      status: marketplaceChannels.status,
      autoSyncStock: marketplaceChannels.autoSyncStock,
      autoSyncOrders: marketplaceChannels.autoSyncOrders,
      terakhirSinkron: marketplaceChannels.terakhirSinkron,
      dibuatOleh: marketplaceChannels.dibuatOleh,
      diubahOleh: marketplaceChannels.diubahOleh,
      dibuatPada: marketplaceChannels.dibuatPada,
      diubahPada: marketplaceChannels.diubahPada,
    })
    .from(marketplaceChannels)
    .innerJoin(warehouses, eq(marketplaceChannels.gudangId, warehouses.id))
    .leftJoin(chartOfAccounts, eq(marketplaceChannels.akunPendapatanId, chartOfAccounts.id))
    .orderBy(asc(marketplaceChannels.nama));

  return data as (SaluranMarketplace & { gudangNama: string; akunPendapatanNama?: string; akunBiayaAdminNama?: string })[];
}

export async function ambilChannel(id: string) {
  const [saluran] = await db
    .select()
    .from(marketplaceChannels)
    .where(eq(marketplaceChannels.id, id));

  if (!saluran) throw galat.tidakDitemukan(`Channel Marketplace dengan ID ${id}`);
  return saluran;
}

export async function simpanChannel(input: SimpanChannelMarketplaceInput, oleh: string) {
  const kodeBersih = input.kode.trim().toUpperCase();

  const [ada] = await db
    .select({ id: marketplaceChannels.id })
    .from(marketplaceChannels)
    .where(eq(marketplaceChannels.kode, kodeBersih));

  if (ada) throw galat.aturanBisnis(`Channel dengan kode '${kodeBersih}' sudah ada.`);

  const [baru] = await db
    .insert(marketplaceChannels)
    .values({
      kode: kodeBersih,
      nama: input.nama.trim(),
      channel: input.channel,
      shopId: input.shopId?.trim() || null,
      apiKey: input.apiKey?.trim() || null,
      apiSecret: input.apiSecret?.trim() || null,
      accessToken: input.accessToken?.trim() || null,
      gudangId: input.gudangId,
      akunPendapatanId: input.akunPendapatanId || null,
      akunBiayaAdminId: input.akunBiayaAdminId || null,
      autoSyncStock: input.autoSyncStock ?? true,
      autoSyncOrders: input.autoSyncOrders ?? true,
      status: input.status ?? "AKTIF",
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();

  return baru!;
}

export async function ubahChannel(id: string, input: UbahChannelMarketplaceInput, oleh: string) {
  const [ada] = await db.select().from(marketplaceChannels).where(eq(marketplaceChannels.id, id));
  if (!ada) throw galat.tidakDitemukan(`Channel Marketplace ID ${id}`);

  const [updated] = await db
    .update(marketplaceChannels)
    .set({
      nama: input.nama ? input.nama.trim() : ada.nama,
      channel: input.channel ?? ada.channel,
      shopId: input.shopId !== undefined ? (input.shopId ? input.shopId.trim() : null) : ada.shopId,
      apiKey: input.apiKey !== undefined ? (input.apiKey ? input.apiKey.trim() : null) : ada.apiKey,
      apiSecret: input.apiSecret !== undefined ? (input.apiSecret ? input.apiSecret.trim() : null) : ada.apiSecret,
      accessToken: input.accessToken !== undefined ? (input.accessToken ? input.accessToken.trim() : null) : ada.accessToken,
      gudangId: input.gudangId ?? ada.gudangId,
      akunPendapatanId: input.akunPendapatanId !== undefined ? input.akunPendapatanId : ada.akunPendapatanId,
      akunBiayaAdminId: input.akunBiayaAdminId !== undefined ? input.akunBiayaAdminId : ada.akunBiayaAdminId,
      autoSyncStock: input.autoSyncStock ?? ada.autoSyncStock,
      autoSyncOrders: input.autoSyncOrders ?? ada.autoSyncOrders,
      status: input.status ?? ada.status,
      diubahOleh: oleh,
      diubahPada: new Date(),
    })
    .where(eq(marketplaceChannels.id, id))
    .returning();

  return updated!;
}

export async function triggerSyncChannel(id: string) {
  const [ada] = await db.select().from(marketplaceChannels).where(eq(marketplaceChannels.id, id));
  if (!ada) throw galat.tidakDitemukan(`Channel Marketplace ID ${id}`);

  const [updated] = await db
    .update(marketplaceChannels)
    .set({
      terakhirSinkron: new Date(),
      status: "AKTIF",
      diubahPada: new Date(),
    })
    .where(eq(marketplaceChannels.id, id))
    .returning();

  return {
    pesan: `Sinkronisasi saluran ${ada.nama} (${ada.channel}) berhasil diselesaikan.`,
    terakhirSinkron: updated!.terakhirSinkron,
  };
}

// ==========================================
// 2. PEMETAAN SKU PRODUK (SKU MAPPING)
// ==========================================

export async function daftarMapping(query: QueryMappingMarketplaceInput) {
  const { halaman, ukuran, offset } = bacaHalaman(query);

  const conditions = [];
  if (query.channelId) conditions.push(eq(marketplaceProductMappings.channelId, query.channelId));
  if (query.cari) {
    conditions.push(
      or(
        ilike(marketplaceProductMappings.marketplaceSku, `%${query.cari}%`),
        ilike(marketplaceProductMappings.marketplaceItemName, `%${query.cari}%`),
        ilike(items.nama, `%${query.cari}%`),
        ilike(items.sku, `%${query.cari}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(marketplaceProductMappings)
    .innerJoin(items, eq(marketplaceProductMappings.itemId, items.id))
    .where(whereClause);

  const data = await db
    .select({
      id: marketplaceProductMappings.id,
      channelId: marketplaceProductMappings.channelId,
      channelNama: marketplaceChannels.nama,
      channelTipe: marketplaceChannels.channel,
      itemId: marketplaceProductMappings.itemId,
      itemSku: items.sku,
      itemNama: items.nama,
      marketplaceSku: marketplaceProductMappings.marketplaceSku,
      marketplaceItemId: marketplaceProductMappings.marketplaceItemId,
      marketplaceItemName: marketplaceProductMappings.marketplaceItemName,
      hargaSinkron: marketplaceProductMappings.hargaSinkron,
      aktif: marketplaceProductMappings.aktif,
      terakhirSinkron: marketplaceProductMappings.terakhirSinkron,
    })
    .from(marketplaceProductMappings)
    .innerJoin(marketplaceChannels, eq(marketplaceProductMappings.channelId, marketplaceChannels.id))
    .innerJoin(items, eq(marketplaceProductMappings.itemId, items.id))
    .where(whereClause)
    .orderBy(desc(marketplaceProductMappings.dibuatPada))
    .limit(ukuran)
    .offset(offset);

  return {
    items: data,
    total: totalRow?.total ?? 0,
    halaman,
    ukuran,
    totalHalaman: Math.ceil((totalRow?.total ?? 0) / ukuran),
  };
}

export async function simpanMapping(input: SimpanMappingMarketplaceInput) {
  const [channel] = await db.select().from(marketplaceChannels).where(eq(marketplaceChannels.id, input.channelId));
  if (!channel) throw galat.tidakDitemukan("Channel Marketplace");

  const [item] = await db.select().from(items).where(eq(items.id, input.itemId));
  if (!item) throw galat.tidakDitemukan("Item Produk ERP");

  // Upsert mapping on channelId + itemId
  const [existing] = await db
    .select()
    .from(marketplaceProductMappings)
    .where(
      and(
        eq(marketplaceProductMappings.channelId, input.channelId),
        eq(marketplaceProductMappings.itemId, input.itemId),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(marketplaceProductMappings)
      .set({
        marketplaceSku: input.marketplaceSku.trim(),
        marketplaceItemId: input.marketplaceItemId?.trim() || null,
        marketplaceItemName: input.marketplaceItemName?.trim() || item.nama,
        hargaSinkron: input.hargaSinkron || existing.hargaSinkron,
        aktif: input.aktif ?? existing.aktif,
        terakhirSinkron: new Date(),
        diubahPada: new Date(),
      })
      .where(eq(marketplaceProductMappings.id, existing.id))
      .returning();

    return updated!;
  }

  const [baru] = await db
    .insert(marketplaceProductMappings)
    .values({
      channelId: input.channelId,
      itemId: input.itemId,
      marketplaceSku: input.marketplaceSku.trim(),
      marketplaceItemId: input.marketplaceItemId?.trim() || null,
      marketplaceItemName: input.marketplaceItemName?.trim() || item.nama,
      hargaSinkron: input.hargaSinkron || "0.0000",
      aktif: input.aktif ?? true,
      terakhirSinkron: new Date(),
    })
    .returning();

  return baru!;
}

export async function hapusMapping(id: string) {
  await db.delete(marketplaceProductMappings).where(eq(marketplaceProductMappings.id, id));
  return { sukses: true };
}

// ==========================================
// 3. SINKRONISASI PESANAN (ORDERS SYNC)
// ==========================================

export async function sinkronisasiPesanan(input: SyncPesananMarketplaceInput) {
  const [channel] = await db.select().from(marketplaceChannels).where(eq(marketplaceChannels.id, input.channelId));
  if (!channel) throw galat.tidakDitemukan("Channel Marketplace");

  // Cek duplikasi external order
  const [ada] = await db
    .select()
    .from(marketplaceOrders)
    .where(
      and(
        eq(marketplaceOrders.channelId, input.channelId),
        eq(marketplaceOrders.externalOrderId, input.externalOrderId),
      ),
    );

  if (ada) {
    return { status: "LEWATI", pesan: "Pesanan ini sudah pernah ditarik sebelumnya.", order: ada };
  }

  return await db.transaction(async (tx) => {
    const tanggalHariIni = new Date().toISOString().slice(0, 10);

    const [orderBaru] = await tx
      .insert(marketplaceOrders)
      .values({
        channelId: input.channelId,
        externalOrderId: input.externalOrderId,
        nomorPesanan: input.nomorPesanan,
        namaPembeli: input.namaPembeli?.trim() || "Customer Marketplace",
        tanggalPesanan: new Date(input.tanggalPesanan),
        totalNilai: input.totalNilai,
        biayaAdmin: input.biayaAdmin || "0.0000",
        totalBersih: input.totalBersih,
        statusExternal: input.statusExternal,
        statusSync: "SELESAI",
        catatan: input.catatan?.trim() || null,
      })
      .returning();

    // Kurangi persediaan gudang channel jika autoSyncStock aktif & ada list items
    if (channel.autoSyncStock && input.items && input.items.length > 0) {
      for (const item of input.items) {
        const [stok] = await tx
          .select()
          .from(itemStocks)
          .where(and(eq(itemStocks.itemId, item.itemId), eq(itemStocks.gudangId, channel.gudangId)))
          .for("update");

        const qtyItemBig = keBigInt(item.kuantitas);
        const hargaBig = stok ? keBigInt(stok.biayaRataRata) : BigInt(0);
        const nilaiPengurangBig = (qtyItemBig * hargaBig) / BigInt(10000);

        if (stok) {
          const qtySekarang = keBigInt(stok.kuantitas);
          const nilaiSekarang = keBigInt(stok.nilai);
          const qtyBaru = qtySekarang - qtyItemBig;
          const nilaiBaru = nilaiSekarang - nilaiPengurangBig;

          await tx
            .update(itemStocks)
            .set({
              kuantitas: keString(qtyBaru < BigInt(0) ? BigInt(0) : qtyBaru),
              nilai: keString(nilaiBaru < BigInt(0) ? BigInt(0) : nilaiBaru),
              diubahPada: new Date(),
            })
            .where(eq(itemStocks.id, stok.id));
        }

        // Catat kartu stok (Stock Movement)
        await tx.insert(stockMovements).values({
          tanggal: tanggalHariIni,
          itemId: item.itemId,
          gudangId: channel.gudangId,
          jenis: "KELUAR",
          kuantitas: item.kuantitas,
          biayaSatuan: keString(hargaBig),
          nilai: keString(nilaiPengurangBig),
          saldoKuantitas: "0.0000",
          saldoNilai: "0.0000",
          biayaRataRata: "0.0000",
          sumber: "MARKETPLACE",
          sumberId: orderBaru!.id,
          keterangan: `Pesanan Marketplace ${channel.channel}: ${input.nomorPesanan}`,
        });
      }
    }

    return {
      status: "BERHASIL",
      pesan: "Pesanan marketplace berhasil disinkronkan dan memotong inventori gudang.",
      order: orderBaru!,
    };
  });
}

export async function daftarPesananMarketplace(query: QueryPesananMarketplaceInput) {
  const { halaman, ukuran, offset } = bacaHalaman(query);

  const conditions = [];
  if (query.channelId) conditions.push(eq(marketplaceOrders.channelId, query.channelId));
  if (query.statusSync) conditions.push(eq(marketplaceOrders.statusSync, query.statusSync));
  if (query.cari) {
    conditions.push(
      or(
        ilike(marketplaceOrders.nomorPesanan, `%${query.cari}%`),
        ilike(marketplaceOrders.externalOrderId, `%${query.cari}%`),
        ilike(marketplaceOrders.namaPembeli, `%${query.cari}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db.select({ total: count() }).from(marketplaceOrders).where(whereClause);

  const orders = await db
    .select({
      id: marketplaceOrders.id,
      channelId: marketplaceOrders.channelId,
      channelNama: marketplaceChannels.nama,
      channelTipe: marketplaceChannels.channel,
      externalOrderId: marketplaceOrders.externalOrderId,
      nomorPesanan: marketplaceOrders.nomorPesanan,
      namaPembeli: marketplaceOrders.namaPembeli,
      tanggalPesanan: marketplaceOrders.tanggalPesanan,
      totalNilai: marketplaceOrders.totalNilai,
      biayaAdmin: marketplaceOrders.biayaAdmin,
      totalBersih: marketplaceOrders.totalBersih,
      statusExternal: marketplaceOrders.statusExternal,
      statusSync: marketplaceOrders.statusSync,
      dibuatPada: marketplaceOrders.dibuatPada,
    })
    .from(marketplaceOrders)
    .innerJoin(marketplaceChannels, eq(marketplaceOrders.channelId, marketplaceChannels.id))
    .where(whereClause)
    .orderBy(desc(marketplaceOrders.tanggalPesanan))
    .limit(ukuran)
    .offset(offset);

  return {
    items: orders,
    total: totalRow?.total ?? 0,
    halaman,
    ukuran,
    totalHalaman: Math.ceil((totalRow?.total ?? 0) / ukuran),
  };
}
