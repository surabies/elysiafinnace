import { t } from "elysia";
import {
  STAGE_DEAL,
  STATUS_AKTIVITAS_CRM,
  STATUS_LEAD,
  TIPE_AKTIVITAS_CRM,
} from "@/db/schema/keuangan/konstanta";
import { skema } from "../shared/schema";

export const skemaStatusLead = skema.pilihan("Status Lead", STATUS_LEAD);
export const skemaStageDeal = skema.pilihan("Stage Deal", STAGE_DEAL);
export const skemaTipeAktivitasCrm = skema.pilihan("Tipe Aktivitas", TIPE_AKTIVITAS_CRM);
export const skemaStatusAktivitasCrm = skema.pilihan("Status Aktivitas", STATUS_AKTIVITAS_CRM);

// 1. Leads
export const skemaSimpanLead = t.Object({
  nama: skema.teks("Nama Lead", 150),
  perusahaan: skema.teksOpsional("Perusahaan", 150),
  email: skema.emailOpsional("Email"),
  telepon: skema.teksOpsional("Telepon", 30),
  sumber: skema.teksOpsional("Sumber Lead", 50),
  status: t.Optional(skemaStatusLead),
  nilaiEstimasi: t.Optional(skema.uang("Nilai Estimasi")),
  assignedTo: skema.teksOpsional("Assigned To", 100),
  catatan: skema.teksOpsional("Catatan", 500),
});

export type SimpanLeadInput = typeof skemaSimpanLead.static;

export const skemaUbahLead = t.Partial(skemaSimpanLead);
export type UbahLeadInput = typeof skemaUbahLead.static;

export const skemaQueryLead = t.Object({
  status: t.Optional(skemaStatusLead),
  cari: t.Optional(t.String()),
  halaman: t.Optional(t.Numeric()),
  ukuran: t.Optional(t.Numeric()),
});

export type QueryLeadInput = typeof skemaQueryLead.static;

// 2. Deals / Opportunities
export const skemaSimpanDeal = t.Object({
  judul: skema.teks("Judul Deal", 200),
  leadId: t.Optional(skema.uuid("Lead ID")),
  kontakId: t.Optional(skema.uuid("Kontak ID")),
  stage: t.Optional(skemaStageDeal),
  nilaiPeluang: skema.uang("Nilai Peluang"),
  probabilitas: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
  targetClosing: t.Optional(skema.tanggal("Target Closing")),
  assignedTo: skema.teksOpsional("Assigned To", 100),
  keterangan: skema.teksOpsional("Keterangan", 500),
});

export type SimpanDealInput = typeof skemaSimpanDeal.static;

export const skemaUbahDeal = t.Partial(skemaSimpanDeal);
export type UbahDealInput = typeof skemaUbahDeal.static;

export const skemaPindahStageDeal = t.Object({
  stage: skemaStageDeal,
});

export const skemaQueryDeal = t.Object({
  stage: t.Optional(skemaStageDeal),
  cari: t.Optional(t.String()),
  halaman: t.Optional(t.Numeric()),
  ukuran: t.Optional(t.Numeric()),
});

export type QueryDealInput = typeof skemaQueryDeal.static;

// 3. Aktivitas Interaksi CRM
export const skemaSimpanAktivitas = t.Object({
  tipe: skemaTipeAktivitasCrm,
  judul: skema.teks("Judul Aktivitas", 200),
  leadId: t.Optional(skema.uuid("Lead ID")),
  dealId: t.Optional(skema.uuid("Deal ID")),
  kontakId: t.Optional(skema.uuid("Kontak ID")),
  tanggal: t.Optional(t.String()),
  status: t.Optional(skemaStatusAktivitasCrm),
  hasil: skema.teksOpsional("Hasil Aktivitas", 1000),
});

export type SimpanAktivitasInput = typeof skemaSimpanAktivitas.static;

export const skemaQueryAktivitas = t.Object({
  leadId: t.Optional(t.String()),
  dealId: t.Optional(t.String()),
  kontakId: t.Optional(t.String()),
  halaman: t.Optional(t.Numeric()),
  ukuran: t.Optional(t.Numeric()),
});

export type QueryAktivitasInput = typeof skemaQueryAktivitas.static;
