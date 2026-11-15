import { t, type Static } from "elysia";
import { skema } from "../shared/schema";
import { skemaHalaman } from "../shared/pagination";
import {
  JENIS_KOMPONEN_GAJI,
  METODE_HITUNG_KOMPONEN,
  STATUS_KARYAWAN,
  STATUS_PAYROLL,
  STATUS_PTKP,
} from "@/db/schema/keuangan";

// ==========================================
// 1. KARYAWAN (EMPLOYEES)
// ==========================================

export const skemaQueryKaryawan = t.Object({
  ...skemaHalaman,
  departemenId: t.Optional(t.String()),
  statusKaryawan: t.Optional(skema.pilihan("Status Karyawan", STATUS_KARYAWAN)),
  aktif: t.Optional(t.BooleanString({ error: "aktif harus bernilai true atau false." })),
});
export type QueryKaryawanInput = Static<typeof skemaQueryKaryawan>;

export const skemaSimpanKaryawan = t.Object({
  nik: skema.kode("NIK Karyawan", 50),
  nama: skema.teks("Nama Karyawan", 200),
  email: skema.emailOpsional("Email"),
  telepon: skema.teksOpsional("Telepon", 30),
  departemenId: t.Optional(skema.uuid("Departemen")),
  jabatan: skema.teks("Jabatan", 100),
  statusKaryawan: skema.pilihan("Status Karyawan", STATUS_KARYAWAN),
  statusPtkp: skema.pilihan("Status PTKP", STATUS_PTKP),
  npwp: skema.teksOpsional("NPWP", 32),
  tanggalMasuk: skema.tanggal("Tanggal Masuk"),
  tanggalKeluar: t.Optional(skema.tanggal("Tanggal Keluar")),
  gajiPokok: skema.uang("Gaji Pokok"),
  tunjanganTetap: t.Optional(skema.uang("Tunjangan Tetap")),
  bankNama: skema.teksOpsional("Nama Bank", 50),
  bankRekening: skema.teksOpsional("Nomor Rekening", 50),
  bankAtasNama: skema.teksOpsional("Atas Nama Rekening", 150),
  aktif: t.Optional(skema.boolean("Aktif")),
});
export type SimpanKaryawanInput = Static<typeof skemaSimpanKaryawan>;

export const skemaUbahKaryawan = t.Partial(skemaSimpanKaryawan);
export type UbahKaryawanInput = Static<typeof skemaUbahKaryawan>;

// ==========================================
// 2. KOMPONEN GAJI (SALARY COMPONENTS)
// ==========================================

export const skemaSimpanKomponenGaji = t.Object({
  kode: skema.kode("Kode Komponen", 30),
  nama: skema.teks("Nama Komponen", 150),
  jenis: skema.pilihan("Jenis Komponen", JENIS_KOMPONEN_GAJI),
  metode: skema.pilihan("Metode Perhitungan", METODE_HITUNG_KOMPONEN),
  nilaiDefault: t.Optional(skema.uang("Nilai Default")),
  kenaPajak: t.Optional(skema.boolean("Kena Pajak")),
  akunBebanId: t.Optional(skema.uuid("Akun Beban")),
  akunHutangId: t.Optional(skema.uuid("Akun Hutang")),
  keterangan: skema.teksOpsional("Keterangan", 500),
});
export type SimpanKomponenGajiInput = Static<typeof skemaSimpanKomponenGaji>;

// ==========================================
// 3. PROSES PAYROLL (RUN PAYROLL)
// ==========================================

export const skemaQueryPayroll = t.Object({
  ...skemaHalaman,
  periodeTahun: t.Optional(t.Numeric()),
  status: t.Optional(skema.pilihan("Status Payroll", STATUS_PAYROLL)),
});
export type QueryPayrollInput = Static<typeof skemaQueryPayroll>;

export const skemaProsesHitungPayroll = t.Object({
  periodeBulan: t.Numeric({ minimum: 1, maximum: 12, error: "Bulan harus antara 1-12." }),
  periodeTahun: t.Numeric({ minimum: 2020, maximum: 2050, error: "Tahun tidak valid." }),
  tanggalBayar: skema.tanggal("Tanggal Bayar"),
  rekeningKasBankId: skema.uuid("Rekening Kas/Bank Pembayaran"),
  catatan: skema.teksOpsional("Catatan Payroll", 500),
});
export type ProsesHitungPayrollInput = Static<typeof skemaProsesHitungPayroll>;

export const skemaBayarPayroll = t.Object({
  payrollId: skema.uuid("ID Payroll"),
  rekeningKasBankId: t.Optional(skema.uuid("Rekening Kas/Bank")),
});
export type BayarPayrollInput = Static<typeof skemaBayarPayroll>;
