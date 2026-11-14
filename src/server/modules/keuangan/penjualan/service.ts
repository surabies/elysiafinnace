import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import {
  chartOfAccounts,
  items,
  partners,
  paymentTerms,
  salesInvoiceItems,
  salesInvoices,
  salesOrderItems,
  salesOrders,
  salesReturnItems,
  salesReturns,
} from "@/db/schema/keuangan";
import { galat } from "@/server/core/errors";
import { akunByPeran, pastikanAkunDetail } from "../akun/service";
import { catatMutasiStok, balikMutasiDokumen } from "../inventori/mutasi";
import { ambilItem } from "../inventori/service";
import { balikJurnal, simpanJurnal, type BarisJurnalInput } from "../jurnal/engine";
import { ambilKontak, cekBatasKredit } from "../kontak/service";
import { ambilMataUangDasar } from "../mata-uang/service";
import { db } from "../shared/context";
import {
  bagi,
  bagiBulat,
  kali,
  kaliKurs,
  keBigInt,
  keString,
  persenDari,
  SKALA_KURS,
} from "../shared/decimal";
import { tentukanMataUangKurs } from "../shared/kurs";
import { bacaHalaman } from "../shared/pagination";
import { escapeLike, nullJikaKosong } from "../shared/text";
import { nomorBerikut, PREFIKS, tambahHari, type Tx } from "../shared/transaction";
import type {
  InputBatal,
  InputSimpanFakturPenjualan,
  InputSimpanPesananPenjualan,
  InputSimpanReturPenjualan,
  QueryFakturPenjualan,
  QueryPesananPenjualan,
  QueryReturPenjualan,
} from "./model";

async function akunPersediaanDefault() {
  const [baris] = await db
    .select()
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.peranSistem, "PERSEDIAAN"), eq(chartOfAccounts.aktif, true)))
    .limit(1);
  if (!baris) {
    throw galat.aturanBisnis("Akun dengan peran PERSEDIAAN belum ditetapkan di Bagan Akun (atau tidak aktif).");
  }
  return baris;
}

/* ------------------------------------------------------------------ */
/* Helper Kalkulasi Dokumen Dagang Penjualan                          */
/* ------------------------------------------------------------------ */

function hitungKalkulasi(input: {
  baris: Array<{
    itemId?: string | null;
    akunId?: string | null;
    deskripsi?: string | null;
    kuantitas: string;
    hargaSatuan: string;
    persenDiskon?: string | null;
    barisPesananId?: string | null;
    barisFakturId?: string | null;
  }>;
  diskonNominal?: string | null;
  persenPpn?: string | null;
  ongkir?: string | null;
  uangMuka?: string | null;
}) {
  const baris = input.baris.map((b, i) => {
    if (!b.itemId && !b.akunId) {
      throw galat.aturanBisnis(`Baris ${i + 1}: wajib memilih item persediaan atau akun.`);
    }
    const qty = keBigInt(b.kuantitas);
    if (qty <= BigInt(0)) throw galat.aturanBisnis(`Baris ${i + 1}: kuantitas harus lebih dari 0.`);
    const harga = keBigInt(b.hargaSatuan);
    if (harga < BigInt(0)) throw galat.aturanBisnis(`Baris ${i + 1}: harga satuan tidak boleh negatif.`);
    const diskonPersen = keBigInt(b.persenDiskon ?? "0");
    if (diskonPersen < BigInt(0) || diskonPersen > keBigInt("100")) {
      throw galat.aturanBisnis(`Baris ${i + 1}: persen diskon harus antara 0 dan 100.`);
    }
    const gross = kali(qty, harga);
    const diskonNominalBaris = persenDari(gross, diskonPersen);
    const subtotal = gross - diskonNominalBaris;
    return {
      urutan: i + 1,
      itemId: b.itemId ?? null,
      akunId: b.akunId ?? null,
      deskripsi: b.deskripsi?.trim() || null,
      kuantitas: keString(qty),
      kuantitasInt: qty,
      hargaSatuan: keString(harga),
      hargaSatuanInt: harga,
      persenDiskon: keString(diskonPersen),
      subtotal: keString(subtotal),
      subtotalInt: subtotal,
      barisPesananId: b.barisPesananId ?? null,
      barisFakturId: b.barisFakturId ?? null,
    };
  });

  const subtotalInt = baris.reduce((sum, b) => sum + b.subtotalInt, BigInt(0));
  const diskonHeaderInt = keBigInt(input.diskonNominal ?? "0");
  if (diskonHeaderInt < BigInt(0)) throw galat.aturanBisnis("Diskon header tidak boleh negatif.");
  if (diskonHeaderInt > subtotalInt) throw galat.aturanBisnis("Diskon header tidak boleh melebihi subtotal.");

  const dppInt = subtotalInt - diskonHeaderInt;
  const persenPpnInt = keBigInt(input.persenPpn ?? "0");
  if (persenPpnInt < BigInt(0) || persenPpnInt > keBigInt("100")) {
    throw galat.aturanBisnis("Persen PPN harus antara 0 dan 100.");
  }
  const ppnInt = persenDari(dppInt, persenPpnInt);
  const ongkirInt = keBigInt(input.ongkir ?? "0");
  if (ongkirInt < BigInt(0)) throw galat.aturanBisnis("Ongkos kirim tidak boleh negatif.");
  const uangMukaInt = keBigInt(input.uangMuka ?? "0");
  if (uangMukaInt < BigInt(0)) throw galat.aturanBisnis("Uang muka tidak boleh negatif.");

  const tagihanKotor = dppInt + ppnInt + ongkirInt;
  if (uangMukaInt > tagihanKotor) {
    throw galat.aturanBisnis("Uang muka tidak boleh melebihi total tagihan (DPP + PPN + ongkir).");
  }
  const totalInt = tagihanKotor - uangMukaInt;

  // Alokasikan diskon header ke baris secara proporsional untuk pendapatan net per baris
  let sisaAlokasiDiskon = diskonHeaderInt;
  const barisDenganNet = baris.map((b, idx) => {
    let alokasi = BigInt(0);
    if (subtotalInt > BigInt(0) && diskonHeaderInt > BigInt(0)) {
      if (idx === baris.length - 1) {
        alokasi = sisaAlokasiDiskon;
      } else {
        alokasi = bagiBulat(b.subtotalInt * diskonHeaderInt, subtotalInt);
        sisaAlokasiDiskon -= alokasi;
      }
    }
    const netSubtotalInt = b.subtotalInt - alokasi;
    return {
      ...b,
      alokasiDiskonInt: alokasi,
      netSubtotalInt,
      netSubtotal: keString(netSubtotalInt),
    };
  });

  return {
    baris: barisDenganNet,
    subtotal: keString(subtotalInt),
    subtotalInt,
    diskonNominal: keString(diskonHeaderInt),
    diskonNominalInt: diskonHeaderInt,
    persenPpn: keString(persenPpnInt),
    persenPpnInt,
    ppn: keString(ppnInt),
    ppnInt,
    ongkir: keString(ongkirInt),
    ongkirInt,
    uangMuka: keString(uangMukaInt),
    uangMukaInt,
    total: keString(totalInt),
    totalInt,
  };
}

/* ================================================================== */
/* PESANAN PENJUALAN (SALES ORDER - SO)                               */
/* ================================================================== */

export async function ambilPesananPenjualan(id: string, koneksi: Tx | typeof db = db) {
  const [header] = await koneksi
    .select({
      pesanan: salesOrders,
      pelangganKode: partners.kode,
      pelangganNama: partners.nama,
    })
    .from(salesOrders)
    .innerJoin(partners, eq(salesOrders.pelangganId, partners.id))
    .where(eq(salesOrders.id, id));

  if (!header) throw galat.tidakDitemukan("Pesanan Penjualan");

  const baris = await koneksi
    .select({
      baris: salesOrderItems,
      itemSku: items.sku,
      itemNama: items.nama,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
    })
    .from(salesOrderItems)
    .leftJoin(items, eq(salesOrderItems.itemId, items.id))
    .leftJoin(chartOfAccounts, eq(salesOrderItems.akunId, chartOfAccounts.id))
    .where(eq(salesOrderItems.pesananId, id))
    .orderBy(salesOrderItems.urutan);

  return {
    ...header.pesanan,
    pelanggan: { id: header.pesanan.pelangganId, kode: header.pelangganKode, nama: header.pelangganNama },
    baris: baris.map((b) => ({
      ...b.baris,
      item: b.baris.itemId ? { id: b.baris.itemId, sku: b.itemSku, nama: b.itemNama } : null,
      akun: b.baris.akunId ? { id: b.baris.akunId, kode: b.akunKode, nama: b.akunNama } : null,
    })),
  };
}

export async function daftarPesananPenjualan(opsi: QueryPesananPenjualan) {
  const { offset, ukuran, halaman } = bacaHalaman(opsi);
  const q = opsi.q?.trim();
  const kondisi = and(
    opsi.status ? eq(salesOrders.status, opsi.status) : undefined,
    opsi.pelangganId ? eq(salesOrders.pelangganId, opsi.pelangganId) : undefined,
    opsi.dari ? gte(salesOrders.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(salesOrders.tanggal, opsi.sampai) : undefined,
    q
      ? or(
          ilike(salesOrders.nomor, `%${escapeLike(q)}%`),
          ilike(salesOrders.referensi, `%${escapeLike(q)}%`),
          ilike(partners.nama, `%${escapeLike(q)}%`),
        )
      : undefined,
  );

  const [data, [hitungTotal]] = await Promise.all([
    db
      .select({
        pesanan: salesOrders,
        pelangganKode: partners.kode,
        pelangganNama: partners.nama,
      })
      .from(salesOrders)
      .innerJoin(partners, eq(salesOrders.pelangganId, partners.id))
      .where(kondisi)
      .orderBy(desc(salesOrders.tanggal), desc(salesOrders.nomor))
      .limit(ukuran)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(salesOrders)
      .innerJoin(partners, eq(salesOrders.pelangganId, partners.id))
      .where(kondisi),
  ]);

  return {
    data: data.map((d) => ({
      ...d.pesanan,
      pelanggan: { id: d.pesanan.pelangganId, kode: d.pelangganKode, nama: d.pelangganNama },
    })),
    total: hitungTotal?.total ?? 0,
    halaman,
    ukuran,
  };
}

export async function buatPesananPenjualan(input: InputSimpanPesananPenjualan, oleh: string) {
  const pelanggan = await ambilKontak(input.pelangganId);
  if (!pelanggan.adalahPelanggan) throw galat.aturanBisnis("Kontak yang dipilih bukan pelanggan.");

  for (const b of input.baris) {
    if (b.itemId) await ambilItem(b.itemId);
    if (b.akunId) await pastikanAkunDetail(b.akunId, { label: "Akun transaksi" });
  }
  if (input.akunUangMukaId) await pastikanAkunDetail(input.akunUangMukaId, { label: "Akun uang muka", tipe: "KEWAJIBAN" });
  if (input.akunOngkirId) await pastikanAkunDetail(input.akunOngkirId, { label: "Akun ongkir" });

  const mu = await tentukanMataUangKurs({
    mataUangId: input.mataUangId ?? pelanggan.mataUangId ?? undefined,
    kurs: input.kurs,
    tanggal: input.tanggal,
  });

  const hitung = hitungKalkulasi(input);

  return db.transaction(async (tx) => {
    const nomor = await nomorBerikut(tx, PREFIKS.PESANAN_PENJUALAN, input.tanggal);
    const [pesanan] = await tx
      .insert(salesOrders)
      .values({
        nomor,
        tanggal: input.tanggal,
        pelangganId: input.pelangganId,
        tanggalKirim: input.tanggalKirim ?? null,
        referensi: nullJikaKosong(input.referensi),
        catatan: nullJikaKosong(input.catatan),
        mataUangId: mu.mataUangId,
        kurs: mu.kurs,
        subtotal: hitung.subtotal,
        diskonNominal: hitung.diskonNominal,
        persenPpn: hitung.persenPpn,
        ppn: hitung.ppn,
        ongkir: hitung.ongkir,
        uangMuka: hitung.uangMuka,
        akunUangMukaId: input.akunUangMukaId ?? null,
        akunOngkirId: input.akunOngkirId ?? null,
        total: hitung.total,
        status: "DRAFT",
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    await tx.insert(salesOrderItems).values(
      hitung.baris.map((b) => ({
        pesananId: pesanan!.id,
        urutan: b.urutan,
        itemId: b.itemId,
        akunId: b.akunId,
        deskripsi: b.deskripsi,
        kuantitas: b.kuantitas,
        hargaSatuan: b.hargaSatuan,
        persenDiskon: b.persenDiskon,
        subtotal: b.subtotal,
        kuantitasDitagih: "0",
      })),
    );

    return ambilPesananPenjualan(pesanan!.id, tx);
  });
}

export async function ubahPesananPenjualan(id: string, input: InputSimpanPesananPenjualan, oleh: string) {
  const ada = await ambilPesananPenjualan(id);
  if (ada.status !== "DRAFT") {
    throw galat.aturanBisnis(`Pesanan penjualan ${ada.nomor} berstatus ${ada.status} dan tidak dapat diubah.`);
  }

  const pelanggan = await ambilKontak(input.pelangganId);
  if (!pelanggan.adalahPelanggan) throw galat.aturanBisnis("Kontak yang dipilih bukan pelanggan.");

  for (const b of input.baris) {
    if (b.itemId) await ambilItem(b.itemId);
    if (b.akunId) await pastikanAkunDetail(b.akunId, { label: "Akun transaksi" });
  }
  if (input.akunUangMukaId) await pastikanAkunDetail(input.akunUangMukaId, { label: "Akun uang muka", tipe: "KEWAJIBAN" });
  if (input.akunOngkirId) await pastikanAkunDetail(input.akunOngkirId, { label: "Akun ongkir" });

  const mu = await tentukanMataUangKurs({
    mataUangId: input.mataUangId ?? pelanggan.mataUangId ?? undefined,
    kurs: input.kurs,
    tanggal: input.tanggal,
  });

  const hitung = hitungKalkulasi(input);

  return db.transaction(async (tx) => {
    await tx
      .update(salesOrders)
      .set({
        tanggal: input.tanggal,
        pelangganId: input.pelangganId,
        tanggalKirim: input.tanggalKirim ?? null,
        referensi: nullJikaKosong(input.referensi),
        catatan: nullJikaKosong(input.catatan),
        mataUangId: mu.mataUangId,
        kurs: mu.kurs,
        subtotal: hitung.subtotal,
        diskonNominal: hitung.diskonNominal,
        persenPpn: hitung.persenPpn,
        ppn: hitung.ppn,
        ongkir: hitung.ongkir,
        uangMuka: hitung.uangMuka,
        akunUangMukaId: input.akunUangMukaId ?? null,
        akunOngkirId: input.akunOngkirId ?? null,
        total: hitung.total,
        diubahOleh: oleh,
      })
      .where(eq(salesOrders.id, id));

    await tx.delete(salesOrderItems).where(eq(salesOrderItems.pesananId, id));
    await tx.insert(salesOrderItems).values(
      hitung.baris.map((b) => ({
        pesananId: id,
        urutan: b.urutan,
        itemId: b.itemId,
        akunId: b.akunId,
        deskripsi: b.deskripsi,
        kuantitas: b.kuantitas,
        hargaSatuan: b.hargaSatuan,
        persenDiskon: b.persenDiskon,
        subtotal: b.subtotal,
        kuantitasDitagih: "0",
      })),
    );

    return ambilPesananPenjualan(id, tx);
  });
}

export async function setujuiPesananPenjualan(id: string, oleh: string) {
  const ada = await ambilPesananPenjualan(id);
  if (ada.status !== "DRAFT") {
    throw galat.aturanBisnis(`Pesanan penjualan ${ada.nomor} berstatus ${ada.status} dan tidak dapat disetujui.`);
  }

  const [diubah] = await db
    .update(salesOrders)
    .set({
      status: "DISETUJUI",
      disetujuiOleh: oleh,
      disetujuiPada: new Date(),
      diubahOleh: oleh,
    })
    .where(eq(salesOrders.id, id))
    .returning();

  return ambilPesananPenjualan(diubah!.id);
}

export async function batalkanPesananPenjualan(id: string, oleh: string) {
  const ada = await ambilPesananPenjualan(id);
  if (ada.status === "DIBATALKAN") {
    throw galat.aturanBisnis(`Pesanan penjualan ${ada.nomor} sudah dibatalkan.`);
  }
  if (ada.status === "SELESAI" || ada.status === "SEBAGIAN") {
    throw galat.aturanBisnis(`Pesanan penjualan ${ada.nomor} sudah ditagih dan tidak dapat dibatalkan langsung.`);
  }

  const [diubah] = await db
    .update(salesOrders)
    .set({
      status: "DIBATALKAN",
      diubahOleh: oleh,
    })
    .where(eq(salesOrders.id, id))
    .returning();

  return ambilPesananPenjualan(diubah!.id);
}

/* ================================================================== */
/* FAKTUR PENJUALAN (SALES INVOICE)                                   */
/* ================================================================== */

export async function ambilFakturPenjualan(id: string, koneksi: Tx | typeof db = db) {
  const [header] = await koneksi
    .select({
      faktur: salesInvoices,
      pelangganKode: partners.kode,
      pelangganNama: partners.nama,
      pesananNomor: salesOrders.nomor,
      terminNama: paymentTerms.nama,
    })
    .from(salesInvoices)
    .innerJoin(partners, eq(salesInvoices.pelangganId, partners.id))
    .leftJoin(salesOrders, eq(salesInvoices.pesananId, salesOrders.id))
    .leftJoin(paymentTerms, eq(salesInvoices.terminPembayaranId, paymentTerms.id))
    .where(eq(salesInvoices.id, id));

  if (!header) throw galat.tidakDitemukan("Faktur Penjualan");

  const baris = await koneksi
    .select({
      baris: salesInvoiceItems,
      itemSku: items.sku,
      itemNama: items.nama,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
    })
    .from(salesInvoiceItems)
    .leftJoin(items, eq(salesInvoiceItems.itemId, items.id))
    .leftJoin(chartOfAccounts, eq(salesInvoiceItems.akunId, chartOfAccounts.id))
    .where(eq(salesInvoiceItems.fakturId, id))
    .orderBy(salesInvoiceItems.urutan);

  // Hitung status pembayaran
  let statusPembayaran: "BELUM_LUNAS" | "SEBAGIAN" | "LUNAS" = "BELUM_LUNAS";
  const sisa = keBigInt(header.faktur.sisaTagihan);
  const total = keBigInt(header.faktur.total);
  if (header.faktur.status === "POSTED") {
    if (sisa === BigInt(0)) statusPembayaran = "LUNAS";
    else if (sisa < total) statusPembayaran = "SEBAGIAN";
  }

  return {
    ...header.faktur,
    statusPembayaran,
    pelanggan: { id: header.faktur.pelangganId, kode: header.pelangganKode, nama: header.pelangganNama },
    pesanan: header.faktur.pesananId ? { id: header.faktur.pesananId, nomor: header.pesananNomor } : null,
    terminPembayaran: header.faktur.terminPembayaranId
      ? { id: header.faktur.terminPembayaranId, nama: header.terminNama }
      : null,
    baris: baris.map((b) => ({
      ...b.baris,
      item: b.baris.itemId ? { id: b.baris.itemId, sku: b.itemSku, nama: b.itemNama } : null,
      akun: b.baris.akunId ? { id: b.baris.akunId, kode: b.akunKode, nama: b.akunNama } : null,
    })),
  };
}

export async function daftarFakturPenjualan(opsi: QueryFakturPenjualan) {
  const { offset, ukuran, halaman } = bacaHalaman(opsi);
  const q = opsi.q?.trim();

  let kondisiPembayaran = undefined;
  if (opsi.statusPembayaran === "LUNAS") {
    kondisiPembayaran = eq(salesInvoices.sisaTagihan, "0");
  } else if (opsi.statusPembayaran === "BELUM_LUNAS") {
    kondisiPembayaran = sql`${salesInvoices.sisaTagihan} > 0`;
  }

  const kondisi = and(
    opsi.status ? eq(salesInvoices.status, opsi.status) : undefined,
    kondisiPembayaran,
    opsi.pelangganId ? eq(salesInvoices.pelangganId, opsi.pelangganId) : undefined,
    opsi.pesananId ? eq(salesInvoices.pesananId, opsi.pesananId) : undefined,
    opsi.dari ? gte(salesInvoices.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(salesInvoices.tanggal, opsi.sampai) : undefined,
    q
      ? or(
          ilike(salesInvoices.nomor, `%${escapeLike(q)}%`),
          ilike(partners.nama, `%${escapeLike(q)}%`),
        )
      : undefined,
  );

  const [data, [hitungTotal]] = await Promise.all([
    db
      .select({
        faktur: salesInvoices,
        pelangganKode: partners.kode,
        pelangganNama: partners.nama,
      })
      .from(salesInvoices)
      .innerJoin(partners, eq(salesInvoices.pelangganId, partners.id))
      .where(kondisi)
      .orderBy(desc(salesInvoices.tanggal), desc(salesInvoices.nomor))
      .limit(ukuran)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(salesInvoices)
      .innerJoin(partners, eq(salesInvoices.pelangganId, partners.id))
      .where(kondisi),
  ]);

  return {
    data: data.map((d) => ({
      ...d.faktur,
      pelanggan: { id: d.faktur.pelangganId, kode: d.pelangganKode, nama: d.pelangganNama },
    })),
    total: hitungTotal?.total ?? 0,
    halaman,
    ukuran,
  };
}

export async function buatFakturPenjualan(input: InputSimpanFakturPenjualan, oleh: string) {
  const pelanggan = await ambilKontak(input.pelangganId);
  if (!pelanggan.adalahPelanggan) throw galat.aturanBisnis("Kontak yang dipilih bukan pelanggan.");

  if (input.pesananId) {
    const pesanan = await ambilPesananPenjualan(input.pesananId);
    if (pesanan.status !== "DISETUJUI" && pesanan.status !== "SEBAGIAN") {
      throw galat.aturanBisnis(`Pesanan ${pesanan.nomor} berstatus ${pesanan.status} dan tidak dapat ditagihkan.`);
    }
    if (pesanan.pelangganId !== input.pelangganId) {
      throw galat.aturanBisnis("Pelanggan faktur harus sama dengan pelanggan pada pesanan.");
    }
  }

  let tanggalJatuhTempo = input.tanggalJatuhTempo ?? null;
  const terminId = input.terminPembayaranId ?? pelanggan.terminPembayaranId;
  if (!tanggalJatuhTempo && terminId) {
    const [termin] = await db.select().from(paymentTerms).where(eq(paymentTerms.id, terminId));
    if (termin) {
      tanggalJatuhTempo = tambahHari(input.tanggal, termin.jumlahHari);
    }
  }
  if (!tanggalJatuhTempo) {
    tanggalJatuhTempo = tambahHari(input.tanggal, 30);
  }

  for (const b of input.baris) {
    if (b.itemId) await ambilItem(b.itemId);
    if (b.akunId) await pastikanAkunDetail(b.akunId, { label: "Akun transaksi" });
  }
  if (input.akunUangMukaId) await pastikanAkunDetail(input.akunUangMukaId, { label: "Akun uang muka", tipe: "KEWAJIBAN" });
  if (input.akunOngkirId) await pastikanAkunDetail(input.akunOngkirId, { label: "Akun ongkir" });

  const mu = await tentukanMataUangKurs({
    mataUangId: input.mataUangId ?? pelanggan.mataUangId ?? undefined,
    kurs: input.kurs,
    tanggal: input.tanggal,
  });

  const hitung = hitungKalkulasi(input);

  return db.transaction(async (tx) => {
    const nomor = await nomorBerikut(tx, PREFIKS.FAKTUR_PENJUALAN, input.tanggal);
    const [faktur] = await tx
      .insert(salesInvoices)
      .values({
        nomor,
        tanggal: input.tanggal,
        tanggalJatuhTempo: tanggalJatuhTempo!,
        pelangganId: input.pelangganId,
        pesananId: input.pesananId ?? null,
        terminPembayaranId: terminId ?? null,
        catatan: nullJikaKosong(input.catatan),
        mataUangId: mu.mataUangId,
        kurs: mu.kurs,
        subtotal: hitung.subtotal,
        diskonNominal: hitung.diskonNominal,
        persenPpn: hitung.persenPpn,
        ppn: hitung.ppn,
        ongkir: hitung.ongkir,
        uangMuka: hitung.uangMuka,
        akunUangMukaId: input.akunUangMukaId ?? null,
        akunOngkirId: input.akunOngkirId ?? null,
        total: hitung.total,
        totalHpp: "0",
        sisaTagihan: hitung.total,
        status: "DRAFT",
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    await tx.insert(salesInvoiceItems).values(
      hitung.baris.map((b) => ({
        fakturId: faktur!.id,
        urutan: b.urutan,
        itemId: b.itemId,
        akunId: b.akunId,
        deskripsi: b.deskripsi,
        kuantitas: b.kuantitas,
        hargaSatuan: b.hargaSatuan,
        persenDiskon: b.persenDiskon,
        subtotal: b.subtotal,
        barisPesananId: b.barisPesananId,
        hpp: "0",
      })),
    );

    return ambilFakturPenjualan(faktur!.id, tx);
  });
}

export async function ubahFakturPenjualan(id: string, input: InputSimpanFakturPenjualan, oleh: string) {
  const ada = await ambilFakturPenjualan(id);
  if (ada.status !== "DRAFT") {
    throw galat.aturanBisnis(`Faktur penjualan ${ada.nomor} berstatus ${ada.status} dan tidak dapat diubah.`);
  }

  const pelanggan = await ambilKontak(input.pelangganId);
  if (!pelanggan.adalahPelanggan) throw galat.aturanBisnis("Kontak yang dipilih bukan pelanggan.");

  let tanggalJatuhTempo = input.tanggalJatuhTempo ?? null;
  const terminId = input.terminPembayaranId ?? pelanggan.terminPembayaranId;
  if (!tanggalJatuhTempo && terminId) {
    const [termin] = await db.select().from(paymentTerms).where(eq(paymentTerms.id, terminId));
    if (termin) {
      tanggalJatuhTempo = tambahHari(input.tanggal, termin.jumlahHari);
    }
  }
  if (!tanggalJatuhTempo) {
    tanggalJatuhTempo = tambahHari(input.tanggal, 30);
  }

  for (const b of input.baris) {
    if (b.itemId) await ambilItem(b.itemId);
    if (b.akunId) await pastikanAkunDetail(b.akunId, { label: "Akun transaksi" });
  }
  if (input.akunUangMukaId) await pastikanAkunDetail(input.akunUangMukaId, { label: "Akun uang muka", tipe: "KEWAJIBAN" });
  if (input.akunOngkirId) await pastikanAkunDetail(input.akunOngkirId, { label: "Akun ongkir" });

  const mu = await tentukanMataUangKurs({
    mataUangId: input.mataUangId ?? pelanggan.mataUangId ?? undefined,
    kurs: input.kurs,
    tanggal: input.tanggal,
  });

  const hitung = hitungKalkulasi(input);

  return db.transaction(async (tx) => {
    await tx
      .update(salesInvoices)
      .set({
        tanggal: input.tanggal,
        tanggalJatuhTempo: tanggalJatuhTempo!,
        pelangganId: input.pelangganId,
        pesananId: input.pesananId ?? null,
        terminPembayaranId: terminId ?? null,
        catatan: nullJikaKosong(input.catatan),
        mataUangId: mu.mataUangId,
        kurs: mu.kurs,
        subtotal: hitung.subtotal,
        diskonNominal: hitung.diskonNominal,
        persenPpn: hitung.persenPpn,
        ppn: hitung.ppn,
        ongkir: hitung.ongkir,
        uangMuka: hitung.uangMuka,
        akunUangMukaId: input.akunUangMukaId ?? null,
        akunOngkirId: input.akunOngkirId ?? null,
        total: hitung.total,
        sisaTagihan: hitung.total,
        diubahOleh: oleh,
      })
      .where(eq(salesInvoices.id, id));

    await tx.delete(salesInvoiceItems).where(eq(salesInvoiceItems.fakturId, id));
    await tx.insert(salesInvoiceItems).values(
      hitung.baris.map((b) => ({
        fakturId: id,
        urutan: b.urutan,
        itemId: b.itemId,
        akunId: b.akunId,
        deskripsi: b.deskripsi,
        kuantitas: b.kuantitas,
        hargaSatuan: b.hargaSatuan,
        persenDiskon: b.persenDiskon,
        subtotal: b.subtotal,
        barisPesananId: b.barisPesananId,
        hpp: "0",
      })),
    );

    return ambilFakturPenjualan(id, tx);
  });
}

export async function postingFakturPenjualan(id: string, oleh: string) {
  return db.transaction(async (tx) => {
    const [faktur] = await tx.select().from(salesInvoices).where(eq(salesInvoices.id, id)).for("update");
    if (!faktur) throw galat.tidakDitemukan("Faktur Penjualan");
    if (faktur.status !== "DRAFT") {
      throw galat.aturanBisnis(`Faktur penjualan ${faktur.nomor} berstatus ${faktur.status} dan tidak dapat diposting.`);
    }

    // 1. Validasi Batas Kredit Pelanggan
    const kursInt = keBigInt(faktur.kurs, SKALA_KURS);
    const totalPiutangInt = keBigInt(faktur.total);
    const totalPiutangDasar = kaliKurs(totalPiutangInt, kursInt);
    const cekKredit = await cekBatasKredit(faktur.pelangganId, keString(totalPiutangDasar));
    if (cekKredit.melebihiBatas) {
      throw galat.aturanBisnis(
        `Transaksi melebihi batas kredit pelanggan (${cekKredit.batasKredit}). Saldo piutang berjalan: ${cekKredit.saldoPiutangBerjalan}, total setelah transaksi: ${cekKredit.totalSetelahTransaksi}.`,
      );
    }

    const baris = await tx
      .select()
      .from(salesInvoiceItems)
      .where(eq(salesInvoiceItems.fakturId, id))
      .orderBy(salesInvoiceItems.urutan);

    if (baris.length === 0) throw galat.aturanBisnis("Faktur penjualan tidak memiliki baris item.");

    const hitung = hitungKalkulasi({
      baris: baris.map((b) => ({
        itemId: b.itemId,
        akunId: b.akunId,
        deskripsi: b.deskripsi,
        kuantitas: b.kuantitas,
        hargaSatuan: b.hargaSatuan,
        persenDiskon: b.persenDiskon,
        barisPesananId: b.barisPesananId,
      })),
      diskonNominal: faktur.diskonNominal,
      persenPpn: faktur.persenPpn,
      ongkir: faktur.ongkir,
      uangMuka: faktur.uangMuka,
    });

    const itemIds = baris.filter((b) => b.itemId).map((b) => b.itemId!);
    const petaItem = new Map<string, typeof items.$inferSelect>();
    if (itemIds.length > 0) {
      const itemsDb = await tx.select().from(items).where(or(...itemIds.map((iid) => eq(items.id, iid))));
      for (const item of itemsDb) {
        petaItem.set(item.id, item);
      }
    }

    // 2. Catat Mutasi Stok Keluar (Average Cost) & Hitung HPP untuk Barang Persediaan
    let totalHppInt = BigInt(0);
    const hppPerBarisId = new Map<string, bigint>();

    for (const b of hitung.baris) {
      if (b.itemId) {
        const item = petaItem.get(b.itemId)!;
        if (item.tipeBarang === "BARANG_PERSEDIAAN") {
          const mutasi = await catatMutasiStok(tx, {
            tanggal: faktur.tanggal,
            itemId: item.id,
            jenis: "KELUAR",
            kuantitas: b.kuantitas,
            sumber: "FAKTUR_PENJUALAN",
            sumberId: faktur.id,
            keterangan: `Faktur Penjualan ${faktur.nomor}`,
            jurnalId: null,
            oleh,
          });

          hppPerBarisId.set(b.itemId, mutasi.nilai);
          totalHppInt += mutasi.nilai;
        }
      }
    }

    // Update HPP per baris di database
    for (const b of baris) {
      if (b.itemId && hppPerBarisId.has(b.itemId)) {
        const hppVal = hppPerBarisId.get(b.itemId)!;
        await tx
          .update(salesInvoiceItems)
          .set({ hpp: keString(hppVal) })
          .where(eq(salesInvoiceItems.id, b.id));
      }
    }

    // 3. Susun Jurnal Double Entry
    // Bagian Pendapatan & Piutang (mata uang transaksi):
    // Debit: Piutang Usaha (net total)
    // Debit: Uang Muka Pelanggan (jika ada)
    // Kredit: Pendapatan Penjualan per baris
    // Kredit: PPN Keluaran (jika ada)
    // Kredit: Ongkir / Pendapatan Pengiriman (jika ada)
    const barisJurnal: BarisJurnalInput[] = [];

    if (hitung.totalInt > BigInt(0)) {
      const akunPiutang = await akunByPeran("PIUTANG_USAHA");
      barisJurnal.push({
        akunId: akunPiutang.id,
        debit: hitung.total,
        kontakId: faktur.pelangganId,
        deskripsi: `Piutang penjualan ${faktur.nomor}`,
      });
    }

    if (hitung.uangMukaInt > BigInt(0)) {
      const akunUangMukaId = faktur.akunUangMukaId ?? (await akunByPeran("UANG_MUKA_PELANGGAN")).id;
      barisJurnal.push({
        akunId: akunUangMukaId,
        debit: hitung.uangMuka,
        deskripsi: `Penggunaan uang muka pelanggan ${faktur.nomor}`,
      });
    }

    for (const b of hitung.baris) {
      let akunKreditId = b.akunId;
      if (b.itemId) {
        const item = petaItem.get(b.itemId)!;
        akunKreditId = item.akunPendapatanId ?? (await akunByPeran("PENDAPATAN_PENJUALAN")).id;
      }
      barisJurnal.push({
        akunId: akunKreditId!,
        kredit: b.netSubtotal,
        deskripsi: b.deskripsi ?? `Penjualan ${faktur.nomor}`,
      });
    }

    if (hitung.ppnInt > BigInt(0)) {
      const akunPpn = await akunByPeran("PPN_KELUARAN");
      barisJurnal.push({
        akunId: akunPpn.id,
        kredit: hitung.ppn,
        deskripsi: `PPN Keluaran ${faktur.nomor}`,
      });
    }

    if (hitung.ongkirInt > BigInt(0)) {
      const akunOngkirId = faktur.akunOngkirId ?? (await akunByPeran("PENDAPATAN_PENJUALAN")).id;
      barisJurnal.push({
        akunId: akunOngkirId,
        kredit: hitung.ongkir,
        deskripsi: `Ongkos kirim penjualan ${faktur.nomor}`,
      });
    }

    // Bagian HPP & Persediaan (dalam mata uang dasar):
    // Debit: Harga Pokok Penjualan
    // Kredit: Persediaan per item
    if (totalHppInt > BigInt(0)) {
      const muDasar = await ambilMataUangDasar();
      const akunHpp = await akunByPeran("HARGA_POKOK_PENJUALAN");
      barisJurnal.push({
        akunId: akunHpp.id,
        debit: keString(totalHppInt),
        mataUangId: muDasar.id,
        kurs: "1",
        deskripsi: `HPP faktur ${faktur.nomor}`,
      });

      for (const b of hitung.baris) {
        if (b.itemId && hppPerBarisId.has(b.itemId)) {
          const item = petaItem.get(b.itemId)!;
          const lineHpp = hppPerBarisId.get(b.itemId)!;
          const akunPersediaanId = item.akunPersediaanId ?? (await akunPersediaanDefault()).id;
          barisJurnal.push({
            akunId: akunPersediaanId,
            kredit: keString(lineHpp),
            mataUangId: muDasar.id,
            kurs: "1",
            deskripsi: `Pengurangan persediaan ${faktur.nomor}`,
          });
        }
      }
    }

    const jurnal = await simpanJurnal(
      tx,
      {
        tanggal: faktur.tanggal,
        deskripsi: `Faktur Penjualan ${faktur.nomor}`,
        referensi: faktur.nomor,
        sumber: "FAKTUR_PENJUALAN",
        sumberId: faktur.id,
        mataUangId: faktur.mataUangId,
        kurs: faktur.kurs,
        posting: true,
        baris: barisJurnal,
      },
      oleh,
    );

    // 4. Update Kuantitas Ditagih pada SO bila tertaut
    if (faktur.pesananId) {
      for (const b of hitung.baris) {
        if (b.barisPesananId) {
          const [barisSo] = await tx
            .select()
            .from(salesOrderItems)
            .where(eq(salesOrderItems.id, b.barisPesananId))
            .for("update");
          if (barisSo) {
            const ditagihBaru = keBigInt(barisSo.kuantitasDitagih) + b.kuantitasInt;
            await tx
              .update(salesOrderItems)
              .set({ kuantitasDitagih: keString(ditagihBaru) })
              .where(eq(salesOrderItems.id, b.barisPesananId));
          }
        }
      }

      // Evaluasi status SO
      const semuaBarisSo = await tx
        .select()
        .from(salesOrderItems)
        .where(eq(salesOrderItems.pesananId, faktur.pesananId));
      const semuaSelesai = semuaBarisSo.every(
        (bp) => keBigInt(bp.kuantitasDitagih) >= keBigInt(bp.kuantitas),
      );
      const adaDitagih = semuaBarisSo.some((bp) => keBigInt(bp.kuantitasDitagih) > BigInt(0));
      const statusSo = semuaSelesai ? "SELESAI" : adaDitagih ? "SEBAGIAN" : "DISETUJUI";

      await tx
        .update(salesOrders)
        .set({ status: statusSo, diubahOleh: oleh })
        .where(eq(salesOrders.id, faktur.pesananId));
    }

    // 5. Update Header Faktur ke POSTED
    await tx
      .update(salesInvoices)
      .set({
        status: "POSTED",
        jurnalId: jurnal.id,
        totalHpp: keString(totalHppInt),
        sisaTagihan: hitung.total,
        dipostingOleh: oleh,
        dipostingPada: new Date(),
        diubahOleh: oleh,
      })
      .where(eq(salesInvoices.id, id));

    return ambilFakturPenjualan(id, tx);
  });
}

export async function batalkanFakturPenjualan(id: string, input: InputBatal, oleh: string) {
  return db.transaction(async (tx) => {
    const [faktur] = await tx.select().from(salesInvoices).where(eq(salesInvoices.id, id)).for("update");
    if (!faktur) throw galat.tidakDitemukan("Faktur Penjualan");
    if (faktur.status !== "POSTED") {
      throw galat.aturanBisnis(`Faktur penjualan ${faktur.nomor} berstatus ${faktur.status} dan tidak dapat dibatalkan.`);
    }

    if (keBigInt(faktur.sisaTagihan) !== keBigInt(faktur.total)) {
      throw galat.aturanBisnis(
        `Faktur penjualan ${faktur.nomor} sudah memiliki pelunasan atau retur. Batalkan alokasi tersebut terlebih dahulu.`,
      );
    }

    // 1. Balik Jurnal
    const jurnalPembalik = await balikJurnal(
      tx,
      faktur.jurnalId!,
      {
        tanggal: input.tanggal,
        deskripsi: input.deskripsi ?? `Pembalikan Faktur Penjualan ${faktur.nomor}`,
        sumber: "FAKTUR_PENJUALAN",
      },
      oleh,
    );

    // 2. Balik Mutasi Stok
    await balikMutasiDokumen(tx, "FAKTUR_PENJUALAN", faktur.id, input.tanggal, oleh);

    // 3. Kembalikan kuantitas ditagih pada SO bila tertaut
    if (faktur.pesananId) {
      const baris = await tx.select().from(salesInvoiceItems).where(eq(salesInvoiceItems.fakturId, id));
      for (const b of baris) {
        if (b.barisPesananId) {
          const [barisSo] = await tx
            .select()
            .from(salesOrderItems)
            .where(eq(salesOrderItems.id, b.barisPesananId))
            .for("update");
          if (barisSo) {
            const ditagihBaru = keBigInt(barisSo.kuantitasDitagih) - keBigInt(b.kuantitas);
            await tx
              .update(salesOrderItems)
              .set({ kuantitasDitagih: keString(ditagihBaru < BigInt(0) ? BigInt(0) : ditagihBaru) })
              .where(eq(salesOrderItems.id, b.barisPesananId));
          }
        }
      }

      const semuaBarisSo = await tx
        .select()
        .from(salesOrderItems)
        .where(eq(salesOrderItems.pesananId, faktur.pesananId));
      const adaDitagih = semuaBarisSo.some((bp) => keBigInt(bp.kuantitasDitagih) > BigInt(0));
      await tx
        .update(salesOrders)
        .set({ status: adaDitagih ? "SEBAGIAN" : "DISETUJUI", diubahOleh: oleh })
        .where(eq(salesOrders.id, faktur.pesananId));
    }

    // 4. Update status faktur ke DIBATALKAN
    await tx
      .update(salesInvoices)
      .set({
        status: "DIBATALKAN",
        sisaTagihan: "0",
        diubahOleh: oleh,
      })
      .where(eq(salesInvoices.id, id));

    return {
      ...(await ambilFakturPenjualan(id, tx)),
      jurnalPembalikId: jurnalPembalik.id,
    };
  });
}

/* ================================================================== */
/* RETUR PENJUALAN (SALES RETURN / CREDIT NOTE)                       */
/* ================================================================== */

export async function ambilReturPenjualan(id: string, koneksi: Tx | typeof db = db) {
  const [header] = await koneksi
    .select({
      retur: salesReturns,
      pelangganKode: partners.kode,
      pelangganNama: partners.nama,
      fakturNomor: salesInvoices.nomor,
    })
    .from(salesReturns)
    .innerJoin(partners, eq(salesReturns.pelangganId, partners.id))
    .innerJoin(salesInvoices, eq(salesReturns.fakturId, salesInvoices.id))
    .where(eq(salesReturns.id, id));

  if (!header) throw galat.tidakDitemukan("Retur Penjualan");

  const baris = await koneksi
    .select({
      baris: salesReturnItems,
      itemSku: items.sku,
      itemNama: items.nama,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
    })
    .from(salesReturnItems)
    .leftJoin(items, eq(salesReturnItems.itemId, items.id))
    .leftJoin(chartOfAccounts, eq(salesReturnItems.akunId, chartOfAccounts.id))
    .where(eq(salesReturnItems.returId, id))
    .orderBy(salesReturnItems.urutan);

  return {
    ...header.retur,
    pelanggan: { id: header.retur.pelangganId, kode: header.pelangganKode, nama: header.pelangganNama },
    faktur: { id: header.retur.fakturId, nomor: header.fakturNomor },
    baris: baris.map((b) => ({
      ...b.baris,
      item: b.baris.itemId ? { id: b.baris.itemId, sku: b.itemSku, nama: b.itemNama } : null,
      akun: b.baris.akunId ? { id: b.baris.akunId, kode: b.akunKode, nama: b.akunNama } : null,
    })),
  };
}

export async function daftarReturPenjualan(opsi: QueryReturPenjualan) {
  const { offset, ukuran, halaman } = bacaHalaman(opsi);
  const q = opsi.q?.trim();
  const kondisi = and(
    opsi.status ? eq(salesReturns.status, opsi.status) : undefined,
    opsi.pelangganId ? eq(salesReturns.pelangganId, opsi.pelangganId) : undefined,
    opsi.fakturId ? eq(salesReturns.fakturId, opsi.fakturId) : undefined,
    opsi.dari ? gte(salesReturns.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(salesReturns.tanggal, opsi.sampai) : undefined,
    q
      ? or(
          ilike(salesReturns.nomor, `%${escapeLike(q)}%`),
          ilike(partners.nama, `%${escapeLike(q)}%`),
        )
      : undefined,
  );

  const [data, [hitungTotal]] = await Promise.all([
    db
      .select({
        retur: salesReturns,
        pelangganKode: partners.kode,
        pelangganNama: partners.nama,
        fakturNomor: salesInvoices.nomor,
      })
      .from(salesReturns)
      .innerJoin(partners, eq(salesReturns.pelangganId, partners.id))
      .innerJoin(salesInvoices, eq(salesReturns.fakturId, salesInvoices.id))
      .where(kondisi)
      .orderBy(desc(salesReturns.tanggal), desc(salesReturns.nomor))
      .limit(ukuran)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(salesReturns)
      .innerJoin(partners, eq(salesReturns.pelangganId, partners.id))
      .innerJoin(salesInvoices, eq(salesReturns.fakturId, salesInvoices.id))
      .where(kondisi),
  ]);

  return {
    data: data.map((d) => ({
      ...d.retur,
      pelanggan: { id: d.retur.pelangganId, kode: d.pelangganKode, nama: d.pelangganNama },
      faktur: { id: d.retur.fakturId, nomor: d.fakturNomor },
    })),
    total: hitungTotal?.total ?? 0,
    halaman,
    ukuran,
  };
}

export async function buatReturPenjualan(input: InputSimpanReturPenjualan, oleh: string) {
  const faktur = await ambilFakturPenjualan(input.fakturId);
  if (faktur.status !== "POSTED") {
    throw galat.aturanBisnis(`Faktur penjualan ${faktur.nomor} berstatus ${faktur.status} dan tidak dapat diretur.`);
  }

  const hitung = hitungKalkulasi(input);

  if (hitung.totalInt > keBigInt(faktur.sisaTagihan)) {
    throw galat.aturanBisnis(
      `Total retur (${hitung.total}) tidak boleh melebihi sisa tagihan faktur (${faktur.sisaTagihan}).`,
    );
  }

  for (const b of input.baris) {
    if (b.itemId) await ambilItem(b.itemId);
    if (b.akunId) await pastikanAkunDetail(b.akunId, { label: "Akun transaksi" });
  }

  return db.transaction(async (tx) => {
    const nomor = await nomorBerikut(tx, PREFIKS.RETUR_PENJUALAN, input.tanggal);
    const [retur] = await tx
      .insert(salesReturns)
      .values({
        nomor,
        tanggal: input.tanggal,
        pelangganId: faktur.pelangganId,
        fakturId: input.fakturId,
        catatan: nullJikaKosong(input.catatan),
        mataUangId: faktur.mataUangId,
        kurs: faktur.kurs,
        subtotal: hitung.subtotal,
        diskonNominal: hitung.diskonNominal,
        persenPpn: hitung.persenPpn,
        ppn: hitung.ppn,
        total: hitung.total,
        totalHpp: "0",
        status: "DRAFT",
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    await tx.insert(salesReturnItems).values(
      hitung.baris.map((b) => ({
        returId: retur!.id,
        urutan: b.urutan,
        itemId: b.itemId,
        akunId: b.akunId,
        deskripsi: b.deskripsi,
        kuantitas: b.kuantitas,
        hargaSatuan: b.hargaSatuan,
        persenDiskon: b.persenDiskon,
        subtotal: b.subtotal,
        barisFakturId: b.barisFakturId,
        hpp: "0",
      })),
    );

    return ambilReturPenjualan(retur!.id, tx);
  });
}

export async function postingReturPenjualan(id: string, oleh: string) {
  return db.transaction(async (tx) => {
    const [retur] = await tx.select().from(salesReturns).where(eq(salesReturns.id, id)).for("update");
    if (!retur) throw galat.tidakDitemukan("Retur Penjualan");
    if (retur.status !== "DRAFT") {
      throw galat.aturanBisnis(`Retur penjualan ${retur.nomor} berstatus ${retur.status} dan tidak dapat diposting.`);
    }

    const [faktur] = await tx.select().from(salesInvoices).where(eq(salesInvoices.id, retur.fakturId)).for("update");
    if (!faktur || faktur.status !== "POSTED") {
      throw galat.aturanBisnis("Faktur asal retur tidak valid atau belum diposting.");
    }

    const returTotalInt = keBigInt(retur.total);
    const sisaTagihanFakturInt = keBigInt(faktur.sisaTagihan);
    if (returTotalInt > sisaTagihanFakturInt) {
      throw galat.aturanBisnis(
        `Total retur (${retur.total}) melebihi sisa tagihan faktur (${faktur.sisaTagihan}).`,
      );
    }

    const baris = await tx
      .select()
      .from(salesReturnItems)
      .where(eq(salesReturnItems.returId, id))
      .orderBy(salesReturnItems.urutan);

    const hitung = hitungKalkulasi({
      baris: baris.map((b) => ({
        itemId: b.itemId,
        akunId: b.akunId,
        deskripsi: b.deskripsi,
        kuantitas: b.kuantitas,
        hargaSatuan: b.hargaSatuan,
        persenDiskon: b.persenDiskon,
        barisFakturId: b.barisFakturId,
      })),
      diskonNominal: retur.diskonNominal,
      persenPpn: retur.persenPpn,
    });

    const itemIds = baris.filter((b) => b.itemId).map((b) => b.itemId!);
    const petaItem = new Map<string, typeof items.$inferSelect>();
    if (itemIds.length > 0) {
      const itemsDb = await tx.select().from(items).where(or(...itemIds.map((iid) => eq(items.id, iid))));
      for (const item of itemsDb) {
        petaItem.set(item.id, item);
      }
    }

    // Ambil baris faktur asal untuk menghitung HPP yang dikembalikan
    const barisFakturDb = await tx
      .select()
      .from(salesInvoiceItems)
      .where(eq(salesInvoiceItems.fakturId, faktur.id));
    const petaBarisFaktur = new Map(barisFakturDb.map((bf) => [bf.id, bf]));

    // 1. Mutasi Stok Masuk & Hitung HPP Kembali
    let totalHppKembaliInt = BigInt(0);
    const hppReturPerBarisId = new Map<string, bigint>();

    for (const b of hitung.baris) {
      if (b.itemId) {
        const item = petaItem.get(b.itemId)!;
        if (item.tipeBarang === "BARANG_PERSEDIAAN") {
          // Cari HPP per unit dari baris faktur asal bila ada
          let biayaSatuanHpp = BigInt(0);
          if (b.barisFakturId && petaBarisFaktur.has(b.barisFakturId)) {
            const bf = petaBarisFaktur.get(b.barisFakturId)!;
            const hppFaktur = keBigInt(bf.hpp);
            const qtyFaktur = keBigInt(bf.kuantitas);
            if (qtyFaktur > BigInt(0)) {
              biayaSatuanHpp = bagi(hppFaktur, qtyFaktur);
            }
          }
          if (biayaSatuanHpp === BigInt(0)) {
            biayaSatuanHpp = keBigInt(item.hargaBeliStandar);
          }

          const mutasi = await catatMutasiStok(tx, {
            tanggal: retur.tanggal,
            itemId: item.id,
            jenis: "MASUK",
            kuantitas: b.kuantitas,
            biayaSatuan: keString(biayaSatuanHpp),
            sumber: "RETUR_PENJUALAN",
            sumberId: retur.id,
            keterangan: `Retur Penjualan ${retur.nomor}`,
            jurnalId: null,
            oleh,
          });

          hppReturPerBarisId.set(b.itemId, mutasi.nilai);
          totalHppKembaliInt += mutasi.nilai;
        }
      }
    }

    for (const b of baris) {
      if (b.itemId && hppReturPerBarisId.has(b.itemId)) {
        await tx
          .update(salesReturnItems)
          .set({ hpp: keString(hppReturPerBarisId.get(b.itemId)!) })
          .where(eq(salesReturnItems.id, b.id));
      }
    }

    // 2. Susun Jurnal Retur Penjualan:
    // Debit: Pendapatan Penjualan per baris (mengurangi pendapatan)
    // Debit: PPN Keluaran (mengurangi hutang pajak)
    // Kredit: Piutang Usaha (mengurangi tagihan pelanggan)
    // Debit: Persediaan (memasukkan kembali aset persediaan)
    // Kredit: Harga Pokok Penjualan (mengurangi beban HPP)
    const barisJurnal: BarisJurnalInput[] = [];

    for (const b of hitung.baris) {
      let akunDebitId = b.akunId;
      if (b.itemId) {
        const item = petaItem.get(b.itemId)!;
        akunDebitId = item.akunPendapatanId ?? (await akunByPeran("PENDAPATAN_PENJUALAN")).id;
      }
      barisJurnal.push({
        akunId: akunDebitId!,
        debit: b.netSubtotal,
        deskripsi: b.deskripsi ?? `Pengurangan pendapatan retur ${retur.nomor}`,
      });
    }

    if (hitung.ppnInt > BigInt(0)) {
      const akunPpn = await akunByPeran("PPN_KELUARAN");
      barisJurnal.push({
        akunId: akunPpn.id,
        debit: hitung.ppn,
        deskripsi: `Koreksi PPN Keluaran retur ${retur.nomor}`,
      });
    }

    const akunPiutang = await akunByPeran("PIUTANG_USAHA");
    barisJurnal.push({
      akunId: akunPiutang.id,
      kredit: retur.total,
      kontakId: retur.pelangganId,
      deskripsi: `Pengurangan piutang retur penjualan ${retur.nomor}`,
    });

    if (totalHppKembaliInt > BigInt(0)) {
      const muDasar = await ambilMataUangDasar();
      const akunHpp = await akunByPeran("HARGA_POKOK_PENJUALAN");

      for (const b of hitung.baris) {
        if (b.itemId && hppReturPerBarisId.has(b.itemId)) {
          const item = petaItem.get(b.itemId)!;
          const lineHpp = hppReturPerBarisId.get(b.itemId)!;
          const akunPersediaanId = item.akunPersediaanId ?? (await akunPersediaanDefault()).id;
          barisJurnal.push({
            akunId: akunPersediaanId,
            debit: keString(lineHpp),
            mataUangId: muDasar.id,
            kurs: "1",
            deskripsi: `Pengembalian persediaan retur ${retur.nomor}`,
          });
        }
      }

      barisJurnal.push({
        akunId: akunHpp.id,
        kredit: keString(totalHppKembaliInt),
        mataUangId: muDasar.id,
        kurs: "1",
        deskripsi: `Pengurangan HPP retur ${retur.nomor}`,
      });
    }

    const jurnal = await simpanJurnal(
      tx,
      {
        tanggal: retur.tanggal,
        deskripsi: `Retur Penjualan ${retur.nomor} untuk Faktur ${faktur.nomor}`,
        referensi: retur.nomor,
        sumber: "RETUR_PENJUALAN",
        sumberId: retur.id,
        mataUangId: retur.mataUangId,
        kurs: retur.kurs,
        posting: true,
        baris: barisJurnal,
      },
      oleh,
    );

    // 3. Kurangi sisaTagihan faktur
    const sisaTagihanBaru = sisaTagihanFakturInt - returTotalInt;
    await tx
      .update(salesInvoices)
      .set({
        sisaTagihan: keString(sisaTagihanBaru),
        diubahOleh: oleh,
      })
      .where(eq(salesInvoices.id, faktur.id));

    // 4. Update Header Retur ke POSTED
    await tx
      .update(salesReturns)
      .set({
        status: "POSTED",
        jurnalId: jurnal.id,
        totalHpp: keString(totalHppKembaliInt),
        dipostingOleh: oleh,
        dipostingPada: new Date(),
        diubahOleh: oleh,
      })
      .where(eq(salesReturns.id, id));

    return ambilReturPenjualan(id, tx);
  });
}

export async function batalkanReturPenjualan(id: string, input: InputBatal, oleh: string) {
  return db.transaction(async (tx) => {
    const [retur] = await tx.select().from(salesReturns).where(eq(salesReturns.id, id)).for("update");
    if (!retur) throw galat.tidakDitemukan("Retur Penjualan");
    if (retur.status !== "POSTED") {
      throw galat.aturanBisnis(`Retur penjualan ${retur.nomor} berstatus ${retur.status} dan tidak dapat dibatalkan.`);
    }

    const [faktur] = await tx.select().from(salesInvoices).where(eq(salesInvoices.id, retur.fakturId)).for("update");
    if (!faktur) throw galat.tidakDitemukan("Faktur Penjualan asal retur");

    // 1. Balik Jurnal
    const jurnalPembalik = await balikJurnal(
      tx,
      retur.jurnalId!,
      {
        tanggal: input.tanggal,
        deskripsi: input.deskripsi ?? `Pembalikan Retur Penjualan ${retur.nomor}`,
        sumber: "RETUR_PENJUALAN",
      },
      oleh,
    );

    // 2. Balik Mutasi Stok
    await balikMutasiDokumen(tx, "RETUR_PENJUALAN", retur.id, input.tanggal, oleh);

    // 3. Kembalikan sisa tagihan pada faktur
    const sisaTagihanBaru = keBigInt(faktur.sisaTagihan) + keBigInt(retur.total);
    await tx
      .update(salesInvoices)
      .set({
        sisaTagihan: keString(sisaTagihanBaru),
        diubahOleh: oleh,
      })
      .where(eq(salesInvoices.id, faktur.id));

    // 4. Update status retur ke DIBATALKAN
    await tx
      .update(salesReturns)
      .set({
        status: "DIBATALKAN",
        diubahOleh: oleh,
      })
      .where(eq(salesReturns.id, id));

    return {
      ...(await ambilReturPenjualan(id, tx)),
      jurnalPembalikId: jurnalPembalik.id,
    };
  });
}
