import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu, persen, uang } from "./_helper";
import { chartOfAccounts } from "./akun";
import {
  JENIS_BUPOT,
  JENIS_FAKTUR_PAJAK,
  KATEGORI_PAJAK,
  STATUS_BUPOT,
  STATUS_FAKTUR_PAJAK,
  TIPE_PAJAK,
} from "./konstanta";
import { partners } from "./kontak";
import { purchaseInvoices, salesInvoices } from "./dagang";
import { expenses } from "./transaksi";

export const tipePajakEnum = pgEnum("tipe_pajak", TIPE_PAJAK);
export const kategoriPajakEnum = pgEnum("kategori_pajak", KATEGORI_PAJAK);
export const jenisFakturPajakEnum = pgEnum("jenis_faktur_pajak", JENIS_FAKTUR_PAJAK);
export const statusFakturPajakEnum = pgEnum("status_faktur_pajak", STATUS_FAKTUR_PAJAK);
export const jenisBupotEnum = pgEnum("jenis_bupot", JENIS_BUPOT);
export const statusBupotEnum = pgEnum("status_bupot", STATUS_BUPOT);

/**
 * Master Data Pajak Indonesia (PPN 11%, 12%, PPh 21, 22, 23, 4(2), 15).
 */
export const taxes = pgTable(
  "taxes",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    tipePajak: tipePajakEnum("tipe_pajak").notNull(),
    kategoriPajak: kategoriPajakEnum("kategori_pajak").notNull(),
    persentaseTarif: persen("persentase_tarif").notNull(),
    dppNilaiLain: boolean("dpp_nilai_lain").notNull().default(false),
    faktorDpp: persen("faktor_dpp").notNull().default("100"),
    akunPajakPenjualanId: uuid("akun_pajak_penjualan_id").references(() => chartOfAccounts.id, {
      onDelete: "restrict",
    }),
    akunPajakPembelianId: uuid("akun_pajak_pembelian_id").references(() => chartOfAccounts.id, {
      onDelete: "restrict",
    }),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_taxes_tipe").on(t.tipePajak),
    check("ck_taxes_tarif_tidak_negatif", sql`${t.persentaseTarif} >= 0`),
    check("ck_taxes_faktor_dpp_positif", sql`${t.faktorDpp} > 0 AND ${t.faktorDpp} <= 100`),
  ],
);

/**
 * Alokasi Nomor Seri Faktur Pajak (NSFP) dari DJP.
 */
export const taxInvoiceRanges = pgTable(
  "tax_invoice_ranges",
  {
    id: kolomId(),
    nomorAwal: varchar("nomor_awal", { length: 20 }).notNull(),
    nomorAkhir: varchar("nomor_akhir", { length: 20 }).notNull(),
    nomorBerikutnya: varchar("nomor_berikutnya", { length: 20 }).notNull(),
    tanggalSurat: date("tanggal_surat", { mode: "string" }).notNull(),
    tahun: smallint("tahun").notNull(),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    uniqueIndex("uq_tax_invoice_ranges").on(t.tahun, t.nomorAwal, t.nomorAkhir),
    check("ck_tax_invoice_ranges_urutan", sql`${t.nomorAkhir} >= ${t.nomorAwal}`),
  ],
);

/**
 * Faktur Pajak Elektronik (e-Faktur / Coretax DJP).
 */
export const taxInvoices = pgTable(
  "tax_invoices",
  {
    id: kolomId(),
    nomorFakturPajak: varchar("nomor_faktur_pajak", { length: 30 }).notNull().unique(),
    jenis: jenisFakturPajakEnum("jenis").notNull(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    masaPajak: smallint("masa_pajak").notNull(),
    tahunPajak: smallint("tahun_pajak").notNull(),
    kontakId: uuid("kontak_id").references(() => partners.id, { onDelete: "restrict" }),
    namaLawanTransaksi: varchar("nama_lawan_transaksi", { length: 200 }).notNull(),
    npwpLawanTransaksi: varchar("npwp_lawan_transaksi", { length: 30 }),
    nikLawanTransaksi: varchar("nik_lawan_transaksi", { length: 20 }),
    alamatLawanTransaksi: text("alamat_lawan_transaksi"),
    jumlahDpp: uang("jumlah_dpp").notNull().default("0"),
    jumlahPpn: uang("jumlah_ppn").notNull().default("0"),
    jumlahPpnbm: uang("jumlah_ppnbm").notNull().default("0"),
    statusFaktur: statusFakturPajakEnum("status_faktur").notNull().default("DRAFT"),
    referensiDokumen: varchar("referensi_dokumen", { length: 100 }),
    fakturPenjualanId: uuid("faktur_penjualan_id").references(() => salesInvoices.id, { onDelete: "set null" }),
    fakturPembelianId: uuid("faktur_pembelian_id").references(() => purchaseInvoices.id, { onDelete: "set null" }),
    dapatDikreditkan: boolean("dapat_dikreditkan").notNull().default(true),
    keterangan: text("keterangan"),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_tax_invoices_masa_tahun").on(t.tahunPajak, t.masaPajak),
    index("idx_tax_invoices_jenis").on(t.jenis),
    check("ck_tax_invoices_masa_valid", sql`${t.masaPajak} >= 1 AND ${t.masaPajak} <= 12`),
    check("ck_tax_invoices_nilai_positif", sql`${t.jumlahDpp} >= 0 AND ${t.jumlahPpn} >= 0`),
  ],
);

/**
 * Bukti Potong Pajak Penghasilan (e-Bupot PPh 21, 22, 23/26, 4(2), Unifikasi).
 */
export const withholdingTaxSlips = pgTable(
  "withholding_tax_slips",
  {
    id: kolomId(),
    nomorBuktiPotong: varchar("nomor_bukti_potong", { length: 50 }).notNull().unique(),
    jenisBupot: jenisBupotEnum("jenis_bupot").notNull(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    masaPajak: smallint("masa_pajak").notNull(),
    tahunPajak: smallint("tahun_pajak").notNull(),
    kontakId: uuid("kontak_id").references(() => partners.id, { onDelete: "restrict" }),
    namaWajibPajak: varchar("nama_wajib_pajak", { length: 200 }).notNull(),
    npwpWajibPajak: varchar("npwp_wajib_pajak", { length: 30 }),
    nikWajibPajak: varchar("nik_wajib_pajak", { length: 20 }),
    kodeObjekPajak: varchar("kode_objek_pajak", { length: 30 }).notNull(),
    jumlahBruto: uang("jumlah_bruto").notNull(),
    tarif: persen("tarif").notNull(),
    jumlahPph: uang("jumlah_pph").notNull(),
    dokumenReferensi: varchar("dokumen_referensi", { length: 100 }),
    fakturPembelianId: uuid("faktur_pembelian_id").references(() => purchaseInvoices.id, { onDelete: "set null" }),
    biayaId: uuid("biaya_id").references(() => expenses.id, { onDelete: "set null" }),
    status: statusBupotEnum("status").notNull().default("DRAFT"),
    keterangan: text("keterangan"),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_bupot_masa_tahun").on(t.tahunPajak, t.masaPajak),
    index("idx_bupot_jenis").on(t.jenisBupot),
    check("ck_bupot_masa_valid", sql`${t.masaPajak} >= 1 AND ${t.masaPajak} <= 12`),
    check("ck_bupot_nilai_positif", sql`${t.jumlahBruto} >= 0 AND ${t.jumlahPph} >= 0`),
  ],
);

export type Pajak = typeof taxes.$inferSelect;
export type AlokasiNsfp = typeof taxInvoiceRanges.$inferSelect;
export type FakturPajak = typeof taxInvoices.$inferSelect;
export type BuktiPotong = typeof withholdingTaxSlips.$inferSelect;
