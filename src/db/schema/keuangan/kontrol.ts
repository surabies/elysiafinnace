import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "../auth";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu, uang } from "./_helper";
import { currencies } from "./mata-uang";
import { roles } from "./rbac";
import { branches } from "./dimensi";
import { warehouses } from "./inventori";
import {
  AKSI_PERSETUJUAN,
  JENIS_DOKUMEN_PERSETUJUAN,
  STATUS_PERSETUJUAN,
  STATUS_UNDANGAN,
} from "./konstanta";

export const statusUndanganEnum = pgEnum("status_undangan", STATUS_UNDANGAN);
export const jenisDokumenPersetujuanEnum = pgEnum(
  "jenis_dokumen_persetujuan",
  JENIS_DOKUMEN_PERSETUJUAN,
);
export const statusPersetujuanEnum = pgEnum("status_persetujuan", STATUS_PERSETUJUAN);
export const aksiPersetujuanEnum = pgEnum("aksi_persetujuan", AKSI_PERSETUJUAN);

// ==========================================
// 1. MULTI-PERUSAHAAN (TENANT / COMPANIES)
// ==========================================

export const companies = pgTable("companies", {
  id: kolomId(),
  kode: varchar("kode", { length: 50 }).notNull().unique(),
  nama: varchar("nama", { length: 200 }).notNull(),
  npwp: varchar("npwp", { length: 32 }),
  alamat: text("alamat"),
  telepon: varchar("telepon", { length: 30 }),
  email: varchar("email", { length: 100 }),
  mataUangDasarId: uuid("mata_uang_dasar_id").references(() => currencies.id),
  adalahHolding: boolean("adalah_holding").notNull().default(false),
  indukId: uuid("induk_id"),
  logo: text("logo"),
  aktif: kolomAktif(),
  ...kolomAudit,
  ...kolomWaktu,
});

export const companyUsers = pgTable(
  "company_users",
  {
    id: kolomId(),
    perusahaanId: uuid("perusahaan_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    penggunaId: text("pengguna_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    peranId: uuid("peran_id").references(() => roles.id, { onDelete: "set null" }),
    adalahUtama: boolean("adalah_utama").notNull().default(false),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    uniqueIndex("uq_company_users_perusahaan_pengguna").on(t.perusahaanId, t.penggunaId),
    index("idx_company_users_pengguna").on(t.penggunaId),
  ],
);

export const companyInvitations = pgTable(
  "company_invitations",
  {
    id: kolomId(),
    perusahaanId: uuid("perusahaan_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 150 }).notNull(),
    peranId: uuid("peran_id").references(() => roles.id, { onDelete: "set null" }),
    token: varchar("token", { length: 100 }).notNull().unique(),
    status: statusUndanganEnum("status").notNull().default("MENUNGGU"),
    kedaluwarsaPada: timestamp("kedaluwarsa_pada", { withTimezone: true }).notNull(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_company_invitations_email").on(t.email),
    index("idx_company_invitations_token").on(t.token),
  ],
);

// ==========================================
// 2. PEMBATASAN AKSES CABANG & GUDANG
// ==========================================

export const userBranchAccess = pgTable(
  "user_branch_access",
  {
    penggunaId: text("pengguna_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    cabangId: uuid("cabang_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    dibuatOleh: text("dibuat_oleh"),
    dibuatPada: kolomWaktu.dibuatPada,
  },
  (t) => [
    primaryKey({ columns: [t.penggunaId, t.cabangId], name: "pk_user_branch_access" }),
    index("idx_user_branch_access_cabang").on(t.cabangId),
  ],
);

export const userWarehouseAccess = pgTable(
  "user_warehouse_access",
  {
    penggunaId: text("pengguna_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    gudangId: uuid("gudang_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    dibuatOleh: text("dibuat_oleh"),
    dibuatPada: kolomWaktu.dibuatPada,
  },
  (t) => [
    primaryKey({ columns: [t.penggunaId, t.gudangId], name: "pk_user_warehouse_access" }),
    index("idx_user_warehouse_access_gudang").on(t.gudangId),
  ],
);

// ==========================================
// 3. AUDIT LOG (SIAPA, APA, KAPAN, PERUBAHAN)
// ==========================================

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: kolomId(),
    perusahaanId: uuid("perusahaan_id").references(() => companies.id, { onDelete: "set null" }),
    penggunaId: text("pengguna_id").notNull(),
    penggunaNama: text("pengguna_nama"),
    aksi: varchar("aksi", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, POSTING, BATAL, SETUJUI, TOLAK, KUNCI
    entitas: varchar("entitas", { length: 50 }).notNull(), // JURNAL, FAKTUR, ANGGARAN, PERAN, dsb.
    entitasId: text("entitas_id").notNull(),
    nomorReferensi: text("nomor_referensi"),
    dataSebelum: text("data_sebelum"), // JSON string
    dataSesudah: text("data_sesudah"), // JSON string
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    waktu: timestamp("waktu", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_audit_logs_entitas").on(t.entitas, t.entitasId),
    index("idx_audit_logs_pengguna").on(t.penggunaId),
    index("idx_audit_logs_waktu").on(t.waktu),
  ],
);

// ==========================================
// 4. ALUR PERSETUJUAN BERTINGKAT (APPROVAL)
// ==========================================

export const approvalRules = pgTable(
  "approval_rules",
  {
    id: kolomId(),
    perusahaanId: uuid("perusahaan_id").references(() => companies.id, { onDelete: "cascade" }),
    jenisDokumen: jenisDokumenPersetujuanEnum("jenis_dokumen").notNull(),
    nominalMin: uang("nominal_min").notNull().default("0.0000"),
    nominalMax: uang("nominal_max"),
    tingkat: integer("tingkat").notNull().default(1),
    peranId: uuid("peran_id").references(() => roles.id, { onDelete: "set null" }),
    penggunaId: text("pengguna_id"),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_approval_rules_jenis").on(t.jenisDokumen, t.tingkat),
    index("idx_approval_rules_perusahaan").on(t.perusahaanId),
  ],
);

export const documentApprovals = pgTable(
  "document_approvals",
  {
    id: kolomId(),
    perusahaanId: uuid("perusahaan_id").references(() => companies.id, { onDelete: "cascade" }),
    jenisDokumen: jenisDokumenPersetujuanEnum("jenis_dokumen").notNull(),
    dokumenId: text("dokumen_id").notNull(),
    nomorDokumen: text("nomor_dokumen").notNull(),
    nominal: uang("nominal").notNull().default("0.0000"),
    diajukanOleh: text("diajukan_oleh").notNull(),
    diajukanPada: timestamp("diajukan_pada", { withTimezone: true }).notNull().defaultNow(),
    tingkatSaatIni: integer("tingkat_saat_ini").notNull().default(1),
    tingkatMaksimal: integer("tingkat_maksimal").notNull().default(1),
    status: statusPersetujuanEnum("status").notNull().default("MENUNGGU"),
    catatan: text("catatan"),
    diubahPada: timestamp("diubah_pada", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_document_approvals_dokumen").on(t.dokumenId, t.jenisDokumen),
    index("idx_document_approvals_status").on(t.status),
  ],
);

export const approvalActions = pgTable(
  "approval_actions",
  {
    id: kolomId(),
    persetujuanId: uuid("persetujuan_id")
      .notNull()
      .references(() => documentApprovals.id, { onDelete: "cascade" }),
    tingkat: integer("tingkat").notNull(),
    penyetujuId: text("penyetuju_id").notNull(),
    penyetujuNama: text("penyetuju_nama"),
    aksi: aksiPersetujuanEnum("aksi").notNull(),
    catatan: text("catatan"),
    dilakukanPada: timestamp("dilakukan_pada", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_approval_actions_persetujuan").on(t.persetujuanId)],
);

// ==========================================
// 5. KUNCI TANGGAL TRANSAKSI (LOCK DATE)
// ==========================================

export const transactionLocks = pgTable("transaction_locks", {
  id: kolomId(),
  perusahaanId: uuid("perusahaan_id").references(() => companies.id, { onDelete: "cascade" }),
  kunciSemuaSebelum: date("kunci_semua_sebelum", { mode: "string" }),
  kunciNonAdminSebelum: date("kunci_non_admin_sebelum", { mode: "string" }),
  catatan: text("catatan"),
  ...kolomAudit,
  ...kolomWaktu,
});

export type Perusahaan = typeof companies.$inferSelect;
export type PenggunaPerusahaan = typeof companyUsers.$inferSelect;
export type UndanganPerusahaan = typeof companyInvitations.$inferSelect;
export type CatatanAudit = typeof auditLogs.$inferSelect;
export type AturanPersetujuan = typeof approvalRules.$inferSelect;
export type PersetujuanDokumen = typeof documentApprovals.$inferSelect;
export type TindakanPersetujuan = typeof approvalActions.$inferSelect;
export type KunciTransaksi = typeof transactionLocks.$inferSelect;
