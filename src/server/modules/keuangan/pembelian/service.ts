import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import {
  chartOfAccounts,
  items,
  partners,
  paymentTerms,
  purchaseInvoiceItems,
  purchaseInvoices,
  purchaseOrderItems,
  purchaseOrders,
  purchaseReturnItems,
  purchaseReturns,
} from "@/db/schema/keuangan";
import { galat } from "@/server/core/errors";
import { akunByPeran, pastikanAkunDetail } from "../akun/service";
import { catatMutasiStok, balikMutasiDokumen } from "../inventori/mutasi";
import { ambilItem } from "../inventori/service";
import { balikJurnal, simpanJurnal, type BarisJurnalInput } from "../jurnal/engine";
import { ambilKontak } from "../kontak/service";
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
  InputSimpanFakturPembelian,
  InputSimpanPesananPembelian,
  InputSimpanReturPembelian,
  QueryFakturPembelian,
  QueryPesananPembelian,
  QueryReturPembelian,
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
/* Helper Kalkulasi Dokumen Dagang Pembelian                          */
/* ------------------------------------------------------------------ */

function hitungKalkulasi(input: {
  baris: Array<{
    itemId?: string | null;
    gudangId?: string | null;
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
      gudangId: b.gudangId ?? null,
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

  // Alokasikan diskon header ke baris secara proporsional untuk keperluan costing net per baris
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
/* PESANAN PEMBELIAN (PURCHASE ORDER - PO)                           */
/* ================================================================== */

export async function ambilPesananPembelian(id: string, koneksi: Tx | typeof db = db) {
  const [header] = await koneksi
    .select({
      pesanan: purchaseOrders,
      pemasokKode: partners.kode,
      pemasokNama: partners.nama,
    })
    .from(purchaseOrders)
    .innerJoin(partners, eq(purchaseOrders.pemasokId, partners.id))
    .where(eq(purchaseOrders.id, id));

  if (!header) throw galat.tidakDitemukan("Pesanan Pembelian");

  const baris = await koneksi
    .select({
      baris: purchaseOrderItems,
      itemSku: items.sku,
      itemNama: items.nama,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
    })
    .from(purchaseOrderItems)
    .leftJoin(items, eq(purchaseOrderItems.itemId, items.id))
    .leftJoin(chartOfAccounts, eq(purchaseOrderItems.akunId, chartOfAccounts.id))
    .where(eq(purchaseOrderItems.pesananId, id))
    .orderBy(purchaseOrderItems.urutan);

  return {
    ...header.pesanan,
    pemasok: { id: header.pesanan.pemasokId, kode: header.pemasokKode, nama: header.pemasokNama },
    baris: baris.map((b) => ({
      ...b.baris,
      item: b.baris.itemId ? { id: b.baris.itemId, sku: b.itemSku, nama: b.itemNama } : null,
      akun: b.baris.akunId ? { id: b.baris.akunId, kode: b.akunKode, nama: b.akunNama } : null,
    })),
  };
}

export async function daftarPesananPembelian(opsi: QueryPesananPembelian) {
  const { offset, ukuran, halaman } = bacaHalaman(opsi);
  const q = opsi.q?.trim();
  const kondisi = and(
    opsi.status ? eq(purchaseOrders.status, opsi.status) : undefined,
    opsi.pemasokId ? eq(purchaseOrders.pemasokId, opsi.pemasokId) : undefined,
    opsi.dari ? gte(purchaseOrders.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(purchaseOrders.tanggal, opsi.sampai) : undefined,
    q
      ? or(
          ilike(purchaseOrders.nomor, `%${escapeLike(q)}%`),
          ilike(purchaseOrders.referensi, `%${escapeLike(q)}%`),
          ilike(partners.nama, `%${escapeLike(q)}%`),
        )
      : undefined,
  );

  const [data, [hitungTotal]] = await Promise.all([
    db
      .select({
        pesanan: purchaseOrders,
        pemasokKode: partners.kode,
        pemasokNama: partners.nama,
      })
      .from(purchaseOrders)
      .innerJoin(partners, eq(purchaseOrders.pemasokId, partners.id))
      .where(kondisi)
      .orderBy(desc(purchaseOrders.tanggal), desc(purchaseOrders.nomor))
      .limit(ukuran)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(purchaseOrders)
      .innerJoin(partners, eq(purchaseOrders.pemasokId, partners.id))
      .where(kondisi),
  ]);

  return {
    data: data.map((d) => ({
      ...d.pesanan,
      pemasok: { id: d.pesanan.pemasokId, kode: d.pemasokKode, nama: d.pemasokNama },
    })),
    total: hitungTotal?.total ?? 0,
    halaman,
    ukuran,
  };
}

export async function buatPesananPembelian(input: InputSimpanPesananPembelian, oleh: string) {
  const pemasok = await ambilKontak(input.pemasokId);
  if (!pemasok.adalahPemasok) throw galat.aturanBisnis("Kontak yang dipilih bukan pemasok.");

  for (const b of input.baris) {
    if (b.itemId) await ambilItem(b.itemId);
    if (b.akunId) await pastikanAkunDetail(b.akunId, { label: "Akun transaksi" });
  }
  if (input.akunUangMukaId) await pastikanAkunDetail(input.akunUangMukaId, { label: "Akun uang muka", tipe: "ASET" });
  if (input.akunOngkirId) await pastikanAkunDetail(input.akunOngkirId, { label: "Akun ongkir" });

  const mu = await tentukanMataUangKurs({
    mataUangId: input.mataUangId ?? pemasok.mataUangId ?? undefined,
    kurs: input.kurs,
    tanggal: input.tanggal,
  });

  const hitung = hitungKalkulasi(input);

  return db.transaction(async (tx) => {
    const nomor = await nomorBerikut(tx, PREFIKS.PESANAN_PEMBELIAN, input.tanggal);
    const [pesanan] = await tx
      .insert(purchaseOrders)
      .values({
        nomor,
        tanggal: input.tanggal,
        pemasokId: input.pemasokId,
        tanggalDiharapkan: input.tanggalDiharapkan ?? null,
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

    await tx.insert(purchaseOrderItems).values(
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

    return ambilPesananPembelian(pesanan!.id, tx);
  });
}

export async function ubahPesananPembelian(id: string, input: InputSimpanPesananPembelian, oleh: string) {
  const ada = await ambilPesananPembelian(id);
  if (ada.status !== "DRAFT") {
    throw galat.aturanBisnis(`Pesanan pembelian ${ada.nomor} berstatus ${ada.status} dan tidak dapat diubah.`);
  }

  const pemasok = await ambilKontak(input.pemasokId);
  if (!pemasok.adalahPemasok) throw galat.aturanBisnis("Kontak yang dipilih bukan pemasok.");

  for (const b of input.baris) {
    if (b.itemId) await ambilItem(b.itemId);
    if (b.akunId) await pastikanAkunDetail(b.akunId, { label: "Akun transaksi" });
  }
  if (input.akunUangMukaId) await pastikanAkunDetail(input.akunUangMukaId, { label: "Akun uang muka", tipe: "ASET" });
  if (input.akunOngkirId) await pastikanAkunDetail(input.akunOngkirId, { label: "Akun ongkir" });

  const mu = await tentukanMataUangKurs({
    mataUangId: input.mataUangId ?? pemasok.mataUangId ?? undefined,
    kurs: input.kurs,
    tanggal: input.tanggal,
  });

  const hitung = hitungKalkulasi(input);

  return db.transaction(async (tx) => {
    await tx
      .update(purchaseOrders)
      .set({
        tanggal: input.tanggal,
        pemasokId: input.pemasokId,
        tanggalDiharapkan: input.tanggalDiharapkan ?? null,
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
      .where(eq(purchaseOrders.id, id));

    await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.pesananId, id));
    await tx.insert(purchaseOrderItems).values(
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

    return ambilPesananPembelian(id, tx);
  });
}

export async function setujuiPesananPembelian(id: string, oleh: string) {
  const ada = await ambilPesananPembelian(id);
  if (ada.status !== "DRAFT") {
    throw galat.aturanBisnis(`Pesanan pembelian ${ada.nomor} berstatus ${ada.status} dan tidak dapat disetujui.`);
  }

  const [diubah] = await db
    .update(purchaseOrders)
    .set({
      status: "DISETUJUI",
      disetujuiOleh: oleh,
      disetujuiPada: new Date(),
      diubahOleh: oleh,
    })
    .where(eq(purchaseOrders.id, id))
    .returning();

  return ambilPesananPembelian(diubah!.id);
}

export async function batalkanPesananPembelian(id: string, oleh: string) {
  const ada = await ambilPesananPembelian(id);
  if (ada.status === "DIBATALKAN") {
    throw galat.aturanBisnis(`Pesanan pembelian ${ada.nomor} sudah dibatalkan.`);
  }
  if (ada.status === "SELESAI" || ada.status === "SEBAGIAN") {
    throw galat.aturanBisnis(`Pesanan pembelian ${ada.nomor} sudah ditagih dan tidak dapat dibatalkan langsung.`);
  }

  const [diubah] = await db
    .update(purchaseOrders)
    .set({
      status: "DIBATALKAN",
      diubahOleh: oleh,
    })
    .where(eq(purchaseOrders.id, id))
    .returning();

  return ambilPesananPembelian(diubah!.id);
}

/* ================================================================== */
/* FAKTUR PEMBELIAN (PURCHASE INVOICE / BILL)                        */
/* ================================================================== */

export async function ambilFakturPembelian(id: string, koneksi: Tx | typeof db = db) {
  const [header] = await koneksi
    .select({
      faktur: purchaseInvoices,
      pemasokKode: partners.kode,
      pemasokNama: partners.nama,
      pesananNomor: purchaseOrders.nomor,
      terminNama: paymentTerms.nama,
    })
    .from(purchaseInvoices)
    .innerJoin(partners, eq(purchaseInvoices.pemasokId, partners.id))
    .leftJoin(purchaseOrders, eq(purchaseInvoices.pesananId, purchaseOrders.id))
    .leftJoin(paymentTerms, eq(purchaseInvoices.terminPembayaranId, paymentTerms.id))
    .where(eq(purchaseInvoices.id, id));

  if (!header) throw galat.tidakDitemukan("Faktur Pembelian");

  const baris = await koneksi
    .select({
      baris: purchaseInvoiceItems,
      itemSku: items.sku,
      itemNama: items.nama,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
    })
    .from(purchaseInvoiceItems)
    .leftJoin(items, eq(purchaseInvoiceItems.itemId, items.id))
    .leftJoin(chartOfAccounts, eq(purchaseInvoiceItems.akunId, chartOfAccounts.id))
    .where(eq(purchaseInvoiceItems.fakturId, id))
    .orderBy(purchaseInvoiceItems.urutan);

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
    pemasok: { id: header.faktur.pemasokId, kode: header.pemasokKode, nama: header.pemasokNama },
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

export async function daftarFakturPembelian(opsi: QueryFakturPembelian) {
  const { offset, ukuran, halaman } = bacaHalaman(opsi);
  const q = opsi.q?.trim();

  let kondisiPembayaran = undefined;
  if (opsi.statusPembayaran === "LUNAS") {
    kondisiPembayaran = eq(purchaseInvoices.sisaTagihan, "0");
  } else if (opsi.statusPembayaran === "BELUM_LUNAS") {
    kondisiPembayaran = sql`${purchaseInvoices.sisaTagihan} > 0`;
  }

  const kondisi = and(
    opsi.status ? eq(purchaseInvoices.status, opsi.status) : undefined,
    kondisiPembayaran,
    opsi.pemasokId ? eq(purchaseInvoices.pemasokId, opsi.pemasokId) : undefined,
    opsi.pesananId ? eq(purchaseInvoices.pesananId, opsi.pesananId) : undefined,
    opsi.dari ? gte(purchaseInvoices.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(purchaseInvoices.tanggal, opsi.sampai) : undefined,
    q
      ? or(
          ilike(purchaseInvoices.nomor, `%${escapeLike(q)}%`),
          ilike(purchaseInvoices.nomorFakturPemasok, `%${escapeLike(q)}%`),
          ilike(partners.nama, `%${escapeLike(q)}%`),
        )
      : undefined,
  );

  const [data, [hitungTotal]] = await Promise.all([
    db
      .select({
        faktur: purchaseInvoices,
        pemasokKode: partners.kode,
        pemasokNama: partners.nama,
      })
      .from(purchaseInvoices)
      .innerJoin(partners, eq(purchaseInvoices.pemasokId, partners.id))
      .where(kondisi)
      .orderBy(desc(purchaseInvoices.tanggal), desc(purchaseInvoices.nomor))
      .limit(ukuran)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(purchaseInvoices)
      .innerJoin(partners, eq(purchaseInvoices.pemasokId, partners.id))
      .where(kondisi),
  ]);

  return {
    data: data.map((d) => ({
      ...d.faktur,
      pemasok: { id: d.faktur.pemasokId, kode: d.pemasokKode, nama: d.pemasokNama },
    })),
    total: hitungTotal?.total ?? 0,
    halaman,
    ukuran,
  };
}

export async function buatFakturPembelian(input: InputSimpanFakturPembelian, oleh: string) {
  const pemasok = await ambilKontak(input.pemasokId);
  if (!pemasok.adalahPemasok) throw galat.aturanBisnis("Kontak yang dipilih bukan pemasok.");

  if (input.pesananId) {
    const pesanan = await ambilPesananPembelian(input.pesananId);
    if (pesanan.status !== "DISETUJUI" && pesanan.status !== "SEBAGIAN") {
      throw galat.aturanBisnis(`Pesanan ${pesanan.nomor} berstatus ${pesanan.status} dan tidak dapat ditagihkan.`);
    }
    if (pesanan.pemasokId !== input.pemasokId) {
      throw galat.aturanBisnis("Pemasok faktur harus sama dengan pemasok pada pesanan.");
    }
  }

  // Tentukan tanggal jatuh tempo dari termin pembayaran bila tidak diisi manual
  let tanggalJatuhTempo = input.tanggalJatuhTempo ?? null;
  const terminId = input.terminPembayaranId ?? pemasok.terminPembayaranId;
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
  if (input.akunUangMukaId) await pastikanAkunDetail(input.akunUangMukaId, { label: "Akun uang muka", tipe: "ASET" });
  if (input.akunOngkirId) await pastikanAkunDetail(input.akunOngkirId, { label: "Akun ongkir" });

  const mu = await tentukanMataUangKurs({
    mataUangId: input.mataUangId ?? pemasok.mataUangId ?? undefined,
    kurs: input.kurs,
    tanggal: input.tanggal,
  });

  const hitung = hitungKalkulasi(input);

  return db.transaction(async (tx) => {
    const nomor = await nomorBerikut(tx, PREFIKS.FAKTUR_PEMBELIAN, input.tanggal);
    const [faktur] = await tx
      .insert(purchaseInvoices)
      .values({
        nomor,
        nomorFakturPemasok: nullJikaKosong(input.nomorFakturPemasok),
        tanggal: input.tanggal,
        tanggalJatuhTempo: tanggalJatuhTempo!,
        pemasokId: input.pemasokId,
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
        status: "DRAFT",
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    await tx.insert(purchaseInvoiceItems).values(
      hitung.baris.map((b) => ({
        fakturId: faktur!.id,
        urutan: b.urutan,
        itemId: b.itemId,
        gudangId: b.gudangId ?? null,
        akunId: b.akunId,
        deskripsi: b.deskripsi,
        kuantitas: b.kuantitas,
        hargaSatuan: b.hargaSatuan,
        persenDiskon: b.persenDiskon,
        subtotal: b.subtotal,
        barisPesananId: b.barisPesananId,
      })),
    );

    return ambilFakturPembelian(faktur!.id, tx);
  });
}

export async function ubahFakturPembelian(id: string, input: InputSimpanFakturPembelian, oleh: string) {
  const ada = await ambilFakturPembelian(id);
  if (ada.status !== "DRAFT") {
    throw galat.aturanBisnis(`Faktur pembelian ${ada.nomor} berstatus ${ada.status} dan tidak dapat diubah.`);
  }

  const pemasok = await ambilKontak(input.pemasokId);
  if (!pemasok.adalahPemasok) throw galat.aturanBisnis("Kontak yang dipilih bukan pemasok.");

  let tanggalJatuhTempo = input.tanggalJatuhTempo ?? null;
  const terminId = input.terminPembayaranId ?? pemasok.terminPembayaranId;
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
  if (input.akunUangMukaId) await pastikanAkunDetail(input.akunUangMukaId, { label: "Akun uang muka", tipe: "ASET" });
  if (input.akunOngkirId) await pastikanAkunDetail(input.akunOngkirId, { label: "Akun ongkir" });

  const mu = await tentukanMataUangKurs({
    mataUangId: input.mataUangId ?? pemasok.mataUangId ?? undefined,
    kurs: input.kurs,
    tanggal: input.tanggal,
  });

  const hitung = hitungKalkulasi(input);

  return db.transaction(async (tx) => {
    await tx
      .update(purchaseInvoices)
      .set({
        nomorFakturPemasok: nullJikaKosong(input.nomorFakturPemasok),
        tanggal: input.tanggal,
        tanggalJatuhTempo: tanggalJatuhTempo!,
        pemasokId: input.pemasokId,
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
      .where(eq(purchaseInvoices.id, id));

    await tx.delete(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.fakturId, id));
    await tx.insert(purchaseInvoiceItems).values(
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
      })),
    );

    return ambilFakturPembelian(id, tx);
  });
}

export async function postingFakturPembelian(id: string, oleh: string) {
  return db.transaction(async (tx) => {
    const [faktur] = await tx.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, id)).for("update");
    if (!faktur) throw galat.tidakDitemukan("Faktur Pembelian");
    if (faktur.status !== "DRAFT") {
      throw galat.aturanBisnis(`Faktur pembelian ${faktur.nomor} berstatus ${faktur.status} dan tidak dapat diposting.`);
    }

    const baris = await tx
      .select()
      .from(purchaseInvoiceItems)
      .where(eq(purchaseInvoiceItems.fakturId, id))
      .orderBy(purchaseInvoiceItems.urutan);

    if (baris.length === 0) throw galat.aturanBisnis("Faktur pembelian tidak memiliki baris item.");

    // Hitung alokasi diskon header ke baris
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

    // 1. Susun Baris Jurnal Double Entry
    const barisJurnal: BarisJurnalInput[] = [];

    for (const b of hitung.baris) {
      let akunDebitId = b.akunId;
      if (b.itemId) {
        const item = petaItem.get(b.itemId);
        if (!item) throw galat.tidakDitemukan("Item");
        if (item.tipeBarang === "BARANG_PERSEDIAAN") {
          akunDebitId = item.akunPersediaanId ?? (await akunPersediaanDefault()).id;
        } else {
          akunDebitId = item.akunHppId ?? b.akunId;
          if (!akunDebitId) {
            throw galat.aturanBisnis(`Item "${item.nama}" bukan persediaan dan wajib memiliki akun beban.`);
          }
        }
      }
      barisJurnal.push({
        akunId: akunDebitId!,
        debit: b.netSubtotal,
        deskripsi: b.deskripsi ?? `Tagihan ${faktur.nomor}`,
      });
    }

    // PPN Masukan
    if (hitung.ppnInt > BigInt(0)) {
      const akunPpn = await akunByPeran("PPN_MASUKAN");
      barisJurnal.push({
        akunId: akunPpn.id,
        debit: hitung.ppn,
        deskripsi: `PPN Masukan ${faktur.nomor}`,
      });
    }

    // Ongkos Kirim (Beban)
    if (hitung.ongkirInt > BigInt(0)) {
      const akunOngkirId = faktur.akunOngkirId ?? (await akunByPeran("HARGA_POKOK_PENJUALAN")).id;
      barisJurnal.push({
        akunId: akunOngkirId,
        debit: hitung.ongkir,
        deskripsi: `Ongkos kirim ${faktur.nomor}`,
      });
    }

    // Uang Muka Pemasok (Kredit - Pengurangan Aset Uang Muka)
    if (hitung.uangMukaInt > BigInt(0)) {
      const akunUangMukaId = faktur.akunUangMukaId ?? (await akunByPeran("UANG_MUKA_PEMASOK")).id;
      barisJurnal.push({
        akunId: akunUangMukaId,
        kredit: hitung.uangMuka,
        deskripsi: `Penggunaan uang muka pemasok ${faktur.nomor}`,
      });
    }

    // Hutang Usaha (Kredit)
    if (hitung.totalInt > BigInt(0)) {
      const akunHutang = await akunByPeran("HUTANG_USAHA");
      barisJurnal.push({
        akunId: akunHutang.id,
        kredit: hitung.total,
        kontakId: faktur.pemasokId,
        deskripsi: `Hutang pembelian ${faktur.nomor}`,
      });
    }

    // Simpan Jurnal
    const jurnal = await simpanJurnal(
      tx,
      {
        tanggal: faktur.tanggal,
        deskripsi: `Faktur Pembelian ${faktur.nomor}`,
        referensi: faktur.nomorFakturPemasok,
        sumber: "FAKTUR_PEMBELIAN",
        sumberId: faktur.id,
        mataUangId: faktur.mataUangId,
        kurs: faktur.kurs,
        posting: true,
        baris: barisJurnal,
      },
      oleh,
    );

    // 2. Catat Mutasi Stok (Average Cost) untuk Barang Persediaan
    const kursInt = keBigInt(faktur.kurs, SKALA_KURS);
    for (const b of hitung.baris) {
      if (b.itemId) {
        const item = petaItem.get(b.itemId)!;
        if (item.tipeBarang === "BARANG_PERSEDIAAN") {
          // Biaya satuan dalam mata uang dasar = (netSubtotal * kurs) / kuantitas
          const netSubtotalDasar = kaliKurs(b.netSubtotalInt, kursInt);
          const biayaSatuanDasar = bagi(netSubtotalDasar, b.kuantitasInt);

          await catatMutasiStok(tx, {
            tanggal: faktur.tanggal,
            itemId: item.id,
            gudangId: b.gudangId ?? null,
            jenis: "MASUK",
            kuantitas: b.kuantitas,
            biayaSatuan: keString(biayaSatuanDasar),
            sumber: "FAKTUR_PEMBELIAN",
            sumberId: faktur.id,
            keterangan: `Faktur Pembelian ${faktur.nomor}`,
            jurnalId: jurnal.id,
            oleh,
          });
        }
      }
    }

    // 3. Update Kuantitas Ditagih pada PO bila tertaut
    if (faktur.pesananId) {
      for (const b of hitung.baris) {
        if (b.barisPesananId) {
          const [barisPo] = await tx
            .select()
            .from(purchaseOrderItems)
            .where(eq(purchaseOrderItems.id, b.barisPesananId))
            .for("update");
          if (barisPo) {
            const ditagihBaru = keBigInt(barisPo.kuantitasDitagih) + b.kuantitasInt;
            await tx
              .update(purchaseOrderItems)
              .set({ kuantitasDitagih: keString(ditagihBaru) })
              .where(eq(purchaseOrderItems.id, b.barisPesananId));
          }
        }
      }

      // Evaluasi status PO
      const semuaBarisPo = await tx
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.pesananId, faktur.pesananId));
      const semuaSelesai = semuaBarisPo.every(
        (bp) => keBigInt(bp.kuantitasDitagih) >= keBigInt(bp.kuantitas),
      );
      const adaDitagih = semuaBarisPo.some((bp) => keBigInt(bp.kuantitasDitagih) > BigInt(0));
      const statusPo = semuaSelesai ? "SELESAI" : adaDitagih ? "SEBAGIAN" : "DISETUJUI";

      await tx
        .update(purchaseOrders)
        .set({ status: statusPo, diubahOleh: oleh })
        .where(eq(purchaseOrders.id, faktur.pesananId));
    }

    // 4. Update Header Faktur ke POSTED
    await tx
      .update(purchaseInvoices)
      .set({
        status: "POSTED",
        jurnalId: jurnal.id,
        sisaTagihan: hitung.total,
        dipostingOleh: oleh,
        dipostingPada: new Date(),
        diubahOleh: oleh,
      })
      .where(eq(purchaseInvoices.id, id));

    return ambilFakturPembelian(id, tx);
  });
}

export async function batalkanFakturPembelian(id: string, input: InputBatal, oleh: string) {
  return db.transaction(async (tx) => {
    const [faktur] = await tx.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, id)).for("update");
    if (!faktur) throw galat.tidakDitemukan("Faktur Pembelian");
    if (faktur.status !== "POSTED") {
      throw galat.aturanBisnis(`Faktur pembelian ${faktur.nomor} berstatus ${faktur.status} dan tidak dapat dibatalkan.`);
    }

    // Pastikan belum ada pembayaran atau retur yang dialokasikan
    if (keBigInt(faktur.sisaTagihan) !== keBigInt(faktur.total)) {
      throw galat.aturanBisnis(
        `Faktur pembelian ${faktur.nomor} sudah memiliki pembayaran atau retur. Batalkan alokasi tersebut terlebih dahulu.`,
      );
    }

    // 1. Balik Jurnal
    const jurnalPembalik = await balikJurnal(
      tx,
      faktur.jurnalId!,
      {
        tanggal: input.tanggal,
        deskripsi: input.deskripsi ?? `Pembalikan Faktur Pembelian ${faktur.nomor}`,
        sumber: "FAKTUR_PEMBELIAN",
      },
      oleh,
    );

    // 2. Balik Mutasi Stok
    await balikMutasiDokumen(tx, "FAKTUR_PEMBELIAN", faktur.id, input.tanggal, oleh);

    // 3. Kembalikan kuantitas ditagih pada PO bila tertaut
    if (faktur.pesananId) {
      const baris = await tx.select().from(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.fakturId, id));
      for (const b of baris) {
        if (b.barisPesananId) {
          const [barisPo] = await tx
            .select()
            .from(purchaseOrderItems)
            .where(eq(purchaseOrderItems.id, b.barisPesananId))
            .for("update");
          if (barisPo) {
            const ditagihBaru = keBigInt(barisPo.kuantitasDitagih) - keBigInt(b.kuantitas);
            await tx
              .update(purchaseOrderItems)
              .set({ kuantitasDitagih: keString(ditagihBaru < BigInt(0) ? BigInt(0) : ditagihBaru) })
              .where(eq(purchaseOrderItems.id, b.barisPesananId));
          }
        }
      }

      const semuaBarisPo = await tx
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.pesananId, faktur.pesananId));
      const adaDitagih = semuaBarisPo.some((bp) => keBigInt(bp.kuantitasDitagih) > BigInt(0));
      await tx
        .update(purchaseOrders)
        .set({ status: adaDitagih ? "SEBAGIAN" : "DISETUJUI", diubahOleh: oleh })
        .where(eq(purchaseOrders.id, faktur.pesananId));
    }

    // 4. Update status faktur ke DIBATALKAN
    await tx
      .update(purchaseInvoices)
      .set({
        status: "DIBATALKAN",
        sisaTagihan: "0",
        diubahOleh: oleh,
      })
      .where(eq(purchaseInvoices.id, id));

    return {
      ...(await ambilFakturPembelian(id, tx)),
      jurnalPembalikId: jurnalPembalik.id,
    };
  });
}

/* ================================================================== */
/* RETUR PEMBELIAN (PURCHASE RETURN / DEBIT NOTE)                     */
/* ================================================================== */

export async function ambilReturPembelian(id: string, koneksi: Tx | typeof db = db) {
  const [header] = await koneksi
    .select({
      retur: purchaseReturns,
      pemasokKode: partners.kode,
      pemasokNama: partners.nama,
      fakturNomor: purchaseInvoices.nomor,
    })
    .from(purchaseReturns)
    .innerJoin(partners, eq(purchaseReturns.pemasokId, partners.id))
    .innerJoin(purchaseInvoices, eq(purchaseReturns.fakturId, purchaseInvoices.id))
    .where(eq(purchaseReturns.id, id));

  if (!header) throw galat.tidakDitemukan("Retur Pembelian");

  const baris = await koneksi
    .select({
      baris: purchaseReturnItems,
      itemSku: items.sku,
      itemNama: items.nama,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
    })
    .from(purchaseReturnItems)
    .leftJoin(items, eq(purchaseReturnItems.itemId, items.id))
    .leftJoin(chartOfAccounts, eq(purchaseReturnItems.akunId, chartOfAccounts.id))
    .where(eq(purchaseReturnItems.returId, id))
    .orderBy(purchaseReturnItems.urutan);

  return {
    ...header.retur,
    pemasok: { id: header.retur.pemasokId, kode: header.pemasokKode, nama: header.pemasokNama },
    faktur: { id: header.retur.fakturId, nomor: header.fakturNomor },
    baris: baris.map((b) => ({
      ...b.baris,
      item: b.baris.itemId ? { id: b.baris.itemId, sku: b.itemSku, nama: b.itemNama } : null,
      akun: b.baris.akunId ? { id: b.baris.akunId, kode: b.akunKode, nama: b.akunNama } : null,
    })),
  };
}

export async function daftarReturPembelian(opsi: QueryReturPembelian) {
  const { offset, ukuran, halaman } = bacaHalaman(opsi);
  const q = opsi.q?.trim();
  const kondisi = and(
    opsi.status ? eq(purchaseReturns.status, opsi.status) : undefined,
    opsi.pemasokId ? eq(purchaseReturns.pemasokId, opsi.pemasokId) : undefined,
    opsi.fakturId ? eq(purchaseReturns.fakturId, opsi.fakturId) : undefined,
    opsi.dari ? gte(purchaseReturns.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(purchaseReturns.tanggal, opsi.sampai) : undefined,
    q
      ? or(
          ilike(purchaseReturns.nomor, `%${escapeLike(q)}%`),
          ilike(partners.nama, `%${escapeLike(q)}%`),
        )
      : undefined,
  );

  const [data, [hitungTotal]] = await Promise.all([
    db
      .select({
        retur: purchaseReturns,
        pemasokKode: partners.kode,
        pemasokNama: partners.nama,
        fakturNomor: purchaseInvoices.nomor,
      })
      .from(purchaseReturns)
      .innerJoin(partners, eq(purchaseReturns.pemasokId, partners.id))
      .innerJoin(purchaseInvoices, eq(purchaseReturns.fakturId, purchaseInvoices.id))
      .where(kondisi)
      .orderBy(desc(purchaseReturns.tanggal), desc(purchaseReturns.nomor))
      .limit(ukuran)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(purchaseReturns)
      .innerJoin(partners, eq(purchaseReturns.pemasokId, partners.id))
      .innerJoin(purchaseInvoices, eq(purchaseReturns.fakturId, purchaseInvoices.id))
      .where(kondisi),
  ]);

  return {
    data: data.map((d) => ({
      ...d.retur,
      pemasok: { id: d.retur.pemasokId, kode: d.pemasokKode, nama: d.pemasokNama },
      faktur: { id: d.retur.fakturId, nomor: d.fakturNomor },
    })),
    total: hitungTotal?.total ?? 0,
    halaman,
    ukuran,
  };
}

export async function buatReturPembelian(input: InputSimpanReturPembelian, oleh: string) {
  const faktur = await ambilFakturPembelian(input.fakturId);
  if (faktur.status !== "POSTED") {
    throw galat.aturanBisnis(`Faktur pembelian ${faktur.nomor} berstatus ${faktur.status} dan tidak dapat diretur.`);
  }

  const hitung = hitungKalkulasi(input);

  // Pastikan total retur tidak melebihi sisa tagihan faktur
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
    const nomor = await nomorBerikut(tx, PREFIKS.RETUR_PEMBELIAN, input.tanggal);
    const [retur] = await tx
      .insert(purchaseReturns)
      .values({
        nomor,
        tanggal: input.tanggal,
        pemasokId: faktur.pemasokId,
        fakturId: input.fakturId,
        catatan: nullJikaKosong(input.catatan),
        mataUangId: faktur.mataUangId,
        kurs: faktur.kurs,
        subtotal: hitung.subtotal,
        diskonNominal: hitung.diskonNominal,
        persenPpn: hitung.persenPpn,
        ppn: hitung.ppn,
        total: hitung.total,
        status: "DRAFT",
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    await tx.insert(purchaseReturnItems).values(
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
      })),
    );

    return ambilReturPembelian(retur!.id, tx);
  });
}

export async function postingReturPembelian(id: string, oleh: string) {
  return db.transaction(async (tx) => {
    const [retur] = await tx.select().from(purchaseReturns).where(eq(purchaseReturns.id, id)).for("update");
    if (!retur) throw galat.tidakDitemukan("Retur Pembelian");
    if (retur.status !== "DRAFT") {
      throw galat.aturanBisnis(`Retur pembelian ${retur.nomor} berstatus ${retur.status} dan tidak dapat diposting.`);
    }

    const [faktur] = await tx.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, retur.fakturId)).for("update");
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
      .from(purchaseReturnItems)
      .where(eq(purchaseReturnItems.returId, id))
      .orderBy(purchaseReturnItems.urutan);

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

    // 1. Double entry journal untuk retur pembelian:
    // Debit: Hutang Usaha (mengurangi kewajiban)
    // Kredit: Persediaan / Beban (mengurangi nilai pembelian)
    // Kredit: PPN Masukan (mengurangi PPN masukan yang diklaim)
    const barisJurnal: BarisJurnalInput[] = [];

    const akunHutang = await akunByPeran("HUTANG_USAHA");
    barisJurnal.push({
      akunId: akunHutang.id,
      debit: retur.total,
      kontakId: retur.pemasokId,
      deskripsi: `Pengurangan hutang retur pembelian ${retur.nomor}`,
    });

    for (const b of hitung.baris) {
      let akunKreditId = b.akunId;
      if (b.itemId) {
        const item = petaItem.get(b.itemId)!;
        if (item.tipeBarang === "BARANG_PERSEDIAAN") {
          akunKreditId = item.akunPersediaanId ?? (await akunPersediaanDefault()).id;
        } else {
          akunKreditId = item.akunHppId ?? b.akunId;
        }
      }
      barisJurnal.push({
        akunId: akunKreditId!,
        kredit: b.netSubtotal,
        deskripsi: b.deskripsi ?? `Retur item ${retur.nomor}`,
      });
    }

    if (hitung.ppnInt > BigInt(0)) {
      const akunPpn = await akunByPeran("PPN_MASUKAN");
      barisJurnal.push({
        akunId: akunPpn.id,
        kredit: hitung.ppn,
        deskripsi: `Koreksi PPN Masukan retur ${retur.nomor}`,
      });
    }

    const jurnal = await simpanJurnal(
      tx,
      {
        tanggal: retur.tanggal,
        deskripsi: `Retur Pembelian ${retur.nomor} untuk Faktur ${faktur.nomor}`,
        referensi: retur.nomor,
        sumber: "RETUR_PEMBELIAN",
        sumberId: retur.id,
        mataUangId: retur.mataUangId,
        kurs: retur.kurs,
        posting: true,
        baris: barisJurnal,
      },
      oleh,
    );

    // 2. Mutasi Stok Keluar (Average Cost) untuk Barang Persediaan yang diretur
    for (const b of hitung.baris) {
      if (b.itemId) {
        const item = petaItem.get(b.itemId)!;
        if (item.tipeBarang === "BARANG_PERSEDIAAN") {
          await catatMutasiStok(tx, {
            tanggal: retur.tanggal,
            itemId: item.id,
            jenis: "KELUAR",
            kuantitas: b.kuantitas,
            sumber: "RETUR_PEMBELIAN",
            sumberId: retur.id,
            keterangan: `Retur Pembelian ${retur.nomor}`,
            jurnalId: jurnal.id,
            oleh,
          });
        }
      }
    }

    // 3. Kurangi sisaTagihan faktur
    const sisaTagihanBaru = sisaTagihanFakturInt - returTotalInt;
    await tx
      .update(purchaseInvoices)
      .set({
        sisaTagihan: keString(sisaTagihanBaru),
        diubahOleh: oleh,
      })
      .where(eq(purchaseInvoices.id, faktur.id));

    // 4. Update Header Retur ke POSTED
    await tx
      .update(purchaseReturns)
      .set({
        status: "POSTED",
        jurnalId: jurnal.id,
        dipostingOleh: oleh,
        dipostingPada: new Date(),
        diubahOleh: oleh,
      })
      .where(eq(purchaseReturns.id, id));

    return ambilReturPembelian(id, tx);
  });
}

export async function batalkanReturPembelian(id: string, input: InputBatal, oleh: string) {
  return db.transaction(async (tx) => {
    const [retur] = await tx.select().from(purchaseReturns).where(eq(purchaseReturns.id, id)).for("update");
    if (!retur) throw galat.tidakDitemukan("Retur Pembelian");
    if (retur.status !== "POSTED") {
      throw galat.aturanBisnis(`Retur pembelian ${retur.nomor} berstatus ${retur.status} dan tidak dapat dibatalkan.`);
    }

    const [faktur] = await tx.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, retur.fakturId)).for("update");
    if (!faktur) throw galat.tidakDitemukan("Faktur Pembelian asal retur");

    // 1. Balik Jurnal
    const jurnalPembalik = await balikJurnal(
      tx,
      retur.jurnalId!,
      {
        tanggal: input.tanggal,
        deskripsi: input.deskripsi ?? `Pembalikan Retur Pembelian ${retur.nomor}`,
        sumber: "RETUR_PEMBELIAN",
      },
      oleh,
    );

    // 2. Balik Mutasi Stok
    await balikMutasiDokumen(tx, "RETUR_PEMBELIAN", retur.id, input.tanggal, oleh);

    // 3. Kembalikan sisa tagihan pada faktur
    const sisaTagihanBaru = keBigInt(faktur.sisaTagihan) + keBigInt(retur.total);
    await tx
      .update(purchaseInvoices)
      .set({
        sisaTagihan: keString(sisaTagihanBaru),
        diubahOleh: oleh,
      })
      .where(eq(purchaseInvoices.id, faktur.id));

    // 4. Update status retur ke DIBATALKAN
    await tx
      .update(purchaseReturns)
      .set({
        status: "DIBATALKAN",
        diubahOleh: oleh,
      })
      .where(eq(purchaseReturns.id, id));

    return {
      ...(await ambilReturPembelian(id, tx)),
      jurnalPembalikId: jurnalPembalik.id,
    };
  });
}
