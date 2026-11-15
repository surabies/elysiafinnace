import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu, uang } from "./_helper";
import { chartOfAccounts } from "./akun";
import { bankAccounts } from "./bank";
import { departments } from "./dimensi";
import { journalEntries } from "./jurnal";
import {
  JENIS_KOMPONEN_GAJI,
  METODE_HITUNG_KOMPONEN,
  STATUS_KARYAWAN,
  STATUS_PAYROLL,
  STATUS_PTKP,
} from "./konstanta";

export const statusKaryawanEnum = pgEnum("status_karyawan", STATUS_KARYAWAN);
export const statusPtkpEnum = pgEnum("status_ptkp", STATUS_PTKP);
export const jenisKomponenGajiEnum = pgEnum("jenis_komponen_gaji", JENIS_KOMPONEN_GAJI);
export const metodeHitungKomponenEnum = pgEnum(
  "metode_hitung_komponen",
  METODE_HITUNG_KOMPONEN,
);
export const statusPayrollEnum = pgEnum("status_payroll", STATUS_PAYROLL);

/**
 * Master data karyawan (Employees)
 */
export const employees = pgTable(
  "employees",
  {
    id: kolomId(),
    nik: varchar("nik", { length: 50 }).notNull().unique(),
    nama: varchar("nama", { length: 200 }).notNull(),
    email: varchar("email", { length: 150 }),
    telepon: varchar("telepon", { length: 30 }),
    departemenId: uuid("departemen_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    jabatan: varchar("jabatan", { length: 100 }).notNull(),
    statusKaryawan: statusKaryawanEnum("status_karyawan").notNull().default("TETAP"),
    statusPtkp: statusPtkpEnum("status_ptkp").notNull().default("TK/0"),
    npwp: varchar("npwp", { length: 32 }),
    tanggalMasuk: date("tanggal_masuk", { mode: "string" }).notNull(),
    tanggalKeluar: date("tanggal_keluar", { mode: "string" }),
    gajiPokok: uang("gaji_pokok").notNull().default("0.0000"),
    tunjanganTetap: uang("tunjangan_tetap").notNull().default("0.0000"),
    bankNama: varchar("bank_nama", { length: 50 }),
    bankRekening: varchar("bank_rekening", { length: 50 }),
    bankAtasNama: varchar("bank_atas_nama", { length: 150 }),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_employees_nama").on(t.nama),
    index("idx_employees_departemen").on(t.departemenId),
    index("idx_employees_status").on(t.statusKaryawan, t.aktif),
  ],
);

/**
 * Master komponen gaji (Tunjangan, Bonus, Lembur, BPJS, Potongan, PPh 21)
 */
export const salaryComponents = pgTable(
  "salary_components",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    jenis: jenisKomponenGajiEnum("jenis").notNull(), // PENDAPATAN / POTONGAN
    metode: metodeHitungKomponenEnum("metode").notNull().default("TETAP"),
    nilaiDefault: uang("nilai_default").notNull().default("0.0000"),
    kenaPajak: boolean("kena_pajak").notNull().default(true),
    akunBebanId: uuid("akun_beban_id").references(() => chartOfAccounts.id, {
      onDelete: "restrict",
    }),
    akunHutangId: uuid("akun_hutang_id").references(() => chartOfAccounts.id, {
      onDelete: "restrict",
    }),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_salary_components_jenis").on(t.jenis)],
);

/**
 * Header periode penggajian (Payroll Run)
 */
export const payrolls = pgTable(
  "payrolls",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 50 }).notNull().unique(),
    periodeBulan: smallint("periode_bulan").notNull(),
    periodeTahun: integer("periode_tahun").notNull(),
    tanggalBayar: date("tanggal_bayar", { mode: "string" }).notNull(),
    status: statusPayrollEnum("status").notNull().default("DRAFT"),
    totalGajiKotor: uang("total_gaji_kotor").notNull().default("0.0000"),
    totalPotongan: uang("total_potongan").notNull().default("0.0000"),
    totalPph21: uang("total_pph21").notNull().default("0.0000"),
    totalBpjs: uang("total_bpjs").notNull().default("0.0000"),
    totalGajiBersih: uang("total_gaji_bersih").notNull().default("0.0000"),
    rekeningKasBankId: uuid("rekening_kas_bank_id").references(() => bankAccounts.id, {
      onDelete: "restrict",
    }),
    jurnalId: uuid("jurnal_id").references(() => journalEntries.id, {
      onDelete: "set null",
    }),
    catatan: text("catatan"),
    dipostingOleh: text("diposting_oleh"),
    dipostingPada: timestamp("diposting_pada", { withTimezone: true }),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    uniqueIndex("uq_payrolls_periode").on(t.periodeTahun, t.periodeBulan),
    index("idx_payrolls_status").on(t.status),
  ],
);

/**
 * Detail slip gaji per karyawan dalam suatu payroll run
 */
export const payrollItems = pgTable(
  "payroll_items",
  {
    id: kolomId(),
    payrollId: uuid("payroll_id")
      .notNull()
      .references(() => payrolls.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),
    gajiPokok: uang("gaji_pokok").notNull(),
    totalTunjangan: uang("total_tunjangan").notNull().default("0.0000"),
    totalPotongan: uang("total_potongan").notNull().default("0.0000"),
    pph21: uang("pph21").notNull().default("0.0000"),
    bpjsKesehatan: uang("bpjs_kesehatan").notNull().default("0.0000"),
    bpjsKetenagakerjaan: uang("bpjs_ketenagakerjaan").notNull().default("0.0000"),
    gajiBersih: uang("gaji_bersih").notNull(),
    catatan: text("catatan"),
    ...kolomWaktu,
  },
  (t) => [
    uniqueIndex("uq_payroll_items_run_employee").on(t.payrollId, t.employeeId),
    index("idx_payroll_items_employee").on(t.employeeId),
  ],
);

export type Karyawan = typeof employees.$inferSelect;
export type KomponenGaji = typeof salaryComponents.$inferSelect;
export type Payroll = typeof payrolls.$inferSelect;
export type BarisPayroll = typeof payrollItems.$inferSelect;
