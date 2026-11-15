import {
  date,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { kolomAudit, kolomId, kolomWaktu, uang } from "./_helper";
import { partners } from "./kontak";
import {
  STAGE_DEAL,
  STATUS_AKTIVITAS_CRM,
  STATUS_LEAD,
  TIPE_AKTIVITAS_CRM,
} from "./konstanta";

export const statusLeadEnum = pgEnum("status_lead", STATUS_LEAD);
export const stageDealEnum = pgEnum("stage_deal", STAGE_DEAL);
export const tipeAktivitasCrmEnum = pgEnum("tipe_aktivitas_crm", TIPE_AKTIVITAS_CRM);
export const statusAktivitasCrmEnum = pgEnum(
  "status_aktivitas_crm",
  STATUS_AKTIVITAS_CRM,
);

/**
 * Master prospek / Calon Pelanggan (Leads)
 */
export const crmLeads = pgTable(
  "crm_leads",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    perusahaan: varchar("perusahaan", { length: 150 }),
    email: varchar("email", { length: 150 }),
    telepon: varchar("telepon", { length: 30 }),
    sumber: varchar("sumber", { length: 50 }).notNull().default("WEBSITE"),
    status: statusLeadEnum("status").notNull().default("BARU"),
    nilaiEstimasi: uang("nilai_estimasi").notNull().default("0.0000"),
    kontakId: uuid("kontak_id").references(() => partners.id, { onDelete: "set null" }),
    assignedTo: text("assigned_to"),
    catatan: text("catatan"),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_crm_leads_status").on(t.status),
    index("idx_crm_leads_assigned").on(t.assignedTo),
  ],
);

/**
 * Pipeline Peluang Penjualan (Deals / Opportunities)
 */
export const crmDeals = pgTable(
  "crm_deals",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    judul: varchar("judul", { length: 200 }).notNull(),
    leadId: uuid("lead_id").references(() => crmLeads.id, { onDelete: "set null" }),
    kontakId: uuid("kontak_id").references(() => partners.id, { onDelete: "set null" }),
    stage: stageDealEnum("stage").notNull().default("PROSPEK"),
    nilaiPeluang: uang("nilai_peluang").notNull().default("0.0000"),
    probabilitas: smallint("probabilitas").notNull().default(50),
    targetClosing: date("target_closing", { mode: "string" }),
    assignedTo: text("assigned_to"),
    keterangan: text("keterangan"),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_crm_deals_stage").on(t.stage),
    index("idx_crm_deals_closing").on(t.targetClosing),
  ],
);

/**
 * Catatan Aktivitas Komunikasi / Interaksi CRM
 */
export const crmActivities = pgTable(
  "crm_activities",
  {
    id: kolomId(),
    tipe: tipeAktivitasCrmEnum("tipe").notNull().default("TELEPON"),
    judul: varchar("judul", { length: 200 }).notNull(),
    leadId: uuid("lead_id").references(() => crmLeads.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => crmDeals.id, { onDelete: "cascade" }),
    kontakId: uuid("kontak_id").references(() => partners.id, { onDelete: "cascade" }),
    tanggal: timestamp("tanggal", { withTimezone: true }).notNull().defaultNow(),
    status: statusAktivitasCrmEnum("status").notNull().default("PENDING"),
    hasil: text("hasil"),
    dibuatOleh: text("dibuat_oleh"),
    ...kolomWaktu,
  },
  (t) => [
    index("idx_crm_activities_tanggal").on(t.tanggal),
    index("idx_crm_activities_status").on(t.status),
  ],
);

export type ProspekLead = typeof crmLeads.$inferSelect;
export type PeluangDeal = typeof crmDeals.$inferSelect;
export type AktivitasCrm = typeof crmActivities.$inferSelect;
