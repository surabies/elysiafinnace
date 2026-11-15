import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import {
  bankAccounts,
  currencies,
  items,
  partners,
  paymentAllocations,
  payments,
  purchaseInvoiceItems,
  purchaseInvoices,
  salesInvoiceItems,
  salesInvoices,
  warehouses,
} from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export async function seedDemoInvoices(db: Db) {
  console.log("  [demo] Menyiapkan Faktur Penjualan, Pembelian, & Pembayaran untuk Analitik Umur Piutang/Hutang (Aging)...");

  const [idr] = await db.select({ id: currencies.id }).from(currencies).where(eq(currencies.kode, "IDR"));
  const [bca] = await db.select({ id: bankAccounts.id }).from(bankAccounts).where(eq(bankAccounts.kode, "BCA-OPS"));
  const [gudang] = await db.select({ id: warehouses.id }).from(warehouses).where(eq(warehouses.kode, "GUD-UTAMA"));

  const [custMega] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "CUST-001"));
  const [custBerkah] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "CUST-002"));
  const [custGlobal] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "CUST-003"));

  const [vendIndo] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "VEND-001"));
  const [vendPrima] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "VEND-002"));

  const [laptop] = await db.select({ id: items.id }).from(items).where(eq(items.sku, "SKU-LAP-001"));
  const [monitor] = await db.select({ id: items.id }).from(items).where(eq(items.sku, "SKU-MON-002"));
  const [kertas] = await db.select({ id: items.id }).from(items).where(eq(items.sku, "SKU-KRT-003"));

  if (!idr || !custMega || !custBerkah || !custGlobal || !vendIndo || !vendPrima || !laptop || !monitor || !kertas) {
    return;
  }

  // 1. FAKTUR PENJUALAN (Beragam Umur untuk Aging: Lancar, 1-30, 31-60, >90 hari)
  const DAFTAR_FAKTUR_JUAL = [
    // A. Lancar (Belum Jatuh Tempo - November 2026)
    {
      nomor: "INV/2026/11/0101",
      tanggal: "2026-11-04",
      tanggalJatuhTempo: "2026-12-04",
      pelangganId: custMega.id,
      subtotal: "60000000.0000",
      persenPpn: "11.0000",
      ppn: "6600000.0000",
      total: "66600000.0000",
      sisaTagihan: "66600000.0000", // Belum bayar (Current)
      status: "POSTED" as const,
      catatan: "Penjualan 5 unit Laptop Bisnis Pro 14 ke PT Mega Retailindo",
      items: [{ itemId: laptop.id, deskripsi: "Laptop Bisnis Pro 14", kuantitas: "5", harga: "12000000", subtotal: "60000000" }],
    },
    // B. Lewat Jatuh Tempo 1 - 30 Hari (Oktober 2026)
    {
      nomor: "INV/2026/10/0088",
      tanggal: "2026-10-02",
      tanggalJatuhTempo: "2026-11-01",
      pelangganId: custGlobal.id,
      subtotal: "37000000.0000",
      persenPpn: "11.0000",
      ppn: "4070000.0000",
      total: "41070000.0000",
      sisaTagihan: "20535000.0000", // Bayar sebagian 50% (Aging 1-30 hari)
      status: "POSTED" as const,
      catatan: "Penjualan Monitor LED ke PT Global Distribusi Sentosa",
      items: [{ itemId: monitor.id, deskripsi: "Monitor LED 24 IPS", kuantitas: "20", harga: "1850000", subtotal: "37000000" }],
    },
    // C. Lewat Jatuh Tempo 31 - 60 Hari (September 2026)
    {
      nomor: "INV/2026/09/0065",
      tanggal: "2026-09-05",
      tanggalJatuhTempo: "2026-10-05",
      pelangganId: custBerkah.id,
      subtotal: "11000000.0000",
      persenPpn: "0.0000", // Non-PKP
      ppn: "0.0000",
      total: "11000000.0000",
      sisaTagihan: "11000000.0000", // Belum bayar (Aging 31-60 hari)
      status: "POSTED" as const,
      catatan: "Penjualan Kertas HVS ke Toko Grosir Berkah Sejahtera",
      items: [{ itemId: kertas.id, deskripsi: "Kertas HVS A4 80gsm", kuantitas: "200", harga: "55000", subtotal: "11000000" }],
    },
    // D. LUNAS Sepenuhnya (Agustus 2026)
    {
      nomor: "INV/2026/08/0042",
      tanggal: "2026-08-10",
      tanggalJatuhTempo: "2026-09-10",
      pelangganId: custMega.id,
      subtotal: "96000000.0000",
      persenPpn: "11.0000",
      ppn: "10560000.0000",
      total: "106560000.0000",
      sisaTagihan: "0.0000", // Lunas
      status: "POSTED" as const,
      catatan: "Penjualan Laptop & Monitor pengadaan semester 2",
      items: [{ itemId: laptop.id, deskripsi: "Laptop Bisnis Pro 14", kuantitas: "8", harga: "12000000", subtotal: "96000000" }],
    },
  ];

  for (const inv of DAFTAR_FAKTUR_JUAL) {
    const [inserted] = await db
      .insert(salesInvoices)
      .values({
        nomor: inv.nomor,
        tanggal: inv.tanggal,
        tanggalJatuhTempo: inv.tanggalJatuhTempo,
        pelangganId: inv.pelangganId,
        mataUangId: idr.id,
        kurs: "1",
        subtotal: inv.subtotal,
        persenPpn: inv.persenPpn,
        ppn: inv.ppn,
        total: inv.total,
        sisaTagihan: inv.sisaTagihan,
        status: inv.status,
        catatan: inv.catatan,
        dipostingOleh: "Administrator Demo",
        dipostingPada: new Date(`${inv.tanggal}T10:00:00Z`),
      })
      .onConflictDoNothing({ target: salesInvoices.nomor })
      .returning({ id: salesInvoices.id });

    if (inserted) {
      for (let idx = 0; idx < inv.items.length; idx++) {
        const it = inv.items[idx]!;
        await db
          .insert(salesInvoiceItems)
          .values({
            fakturId: inserted.id,
            urutan: idx + 1,
            itemId: it.itemId,
            gudangId: gudang?.id,
            deskripsi: it.deskripsi,
            kuantitas: it.kuantitas,
            hargaSatuan: it.harga,
            subtotal: it.subtotal,
          })
          .onConflictDoNothing();
      }

      // Catat pembayaran untuk faktur lunas & sebagian
      if (inv.sisaTagihan === "0.0000" && bca) {
        const [pay] = await db
          .insert(payments)
          .values({
            nomor: `PAY-AR-${inv.nomor.slice(-4)}`,
            tanggal: inv.tanggalJatuhTempo,
            jenis: "PENERIMAAN",
            kontakId: inv.pelangganId,
            rekeningBankId: bca.id,
            mataUangId: idr.id,
            kurs: "1",
            jumlah: inv.total,
            status: "POSTED",
            catatan: `Pelunasan faktur ${inv.nomor}`,
            dipostingOleh: "Administrator Demo",
            dipostingPada: new Date(`${inv.tanggalJatuhTempo}T14:00:00Z`),
          })
          .onConflictDoNothing({ target: payments.nomor })
          .returning({ id: payments.id });

        if (pay) {
          await db
            .insert(paymentAllocations)
            .values({
              pembayaranId: pay.id,
              fakturPenjualanId: inserted.id,
              jumlah: inv.total,
            })
            .onConflictDoNothing();
        }
      }
    }
  }

  // 2. FAKTUR PEMBELIAN (AP Aging)
  const DAFTAR_TAGIHAN_BELI = [
    {
      nomor: "BILL/2026/11/0051",
      tanggal: "2026-11-02",
      tanggalJatuhTempo: "2026-12-02",
      pemasokId: vendIndo.id,
      subtotal: "85000000.0000",
      persenPpn: "11.0000",
      ppn: "9350000.0000",
      total: "94350000.0000",
      sisaTagihan: "94350000.0000", // Belum jatuh tempo (Current AP)
      status: "POSTED" as const,
      catatan: "Pembelian pasokan FMCG dari PT Indofood Tbk",
      items: [{ itemId: laptop.id, deskripsi: "Restock Komponen", kuantitas: "10", harga: "8500000", subtotal: "85000000" }],
    },
    {
      nomor: "BILL/2026/10/0034",
      tanggal: "2026-10-05",
      tanggalJatuhTempo: "2026-10-19",
      pemasokId: vendPrima.id,
      subtotal: "15000000.0000",
      persenPpn: "11.0000",
      ppn: "1650000.0000",
      total: "16650000.0000",
      sisaTagihan: "16650000.0000", // Lewat jatuh tempo ~25 hari (Aging AP 1-30 hari)
      status: "POSTED" as const,
      catatan: "Tagihan karton kemasan CV Prima Kemasan Nusantara",
      items: [{ itemId: kertas.id, deskripsi: "Karton Box & Lakban", kuantitas: "350", harga: "42857.1428", subtotal: "15000000" }],
    },
  ];

  for (const bill of DAFTAR_TAGIHAN_BELI) {
    const [insertedBill] = await db
      .insert(purchaseInvoices)
      .values({
        nomor: bill.nomor,
        tanggal: bill.tanggal,
        tanggalJatuhTempo: bill.tanggalJatuhTempo,
        pemasokId: bill.pemasokId,
        mataUangId: idr.id,
        kurs: "1",
        subtotal: bill.subtotal,
        persenPpn: bill.persenPpn,
        ppn: bill.ppn,
        total: bill.total,
        sisaTagihan: bill.sisaTagihan,
        status: bill.status,
        catatan: bill.catatan,
        dipostingOleh: "Administrator Demo",
        dipostingPada: new Date(`${bill.tanggal}T09:00:00Z`),
      })
      .onConflictDoNothing({ target: purchaseInvoices.nomor })
      .returning({ id: purchaseInvoices.id });

    if (insertedBill) {
      for (let idx = 0; idx < bill.items.length; idx++) {
        const it = bill.items[idx]!;
        await db
          .insert(purchaseInvoiceItems)
          .values({
            fakturId: insertedBill.id,
            urutan: idx + 1,
            itemId: it.itemId,
            gudangId: gudang?.id,
            deskripsi: it.deskripsi,
            kuantitas: it.kuantitas,
            hargaSatuan: it.harga,
            subtotal: it.subtotal,
          })
          .onConflictDoNothing();
      }
    }
  }
}
