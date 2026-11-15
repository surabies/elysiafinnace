import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../shared/context";
import {
  crmActivities,
  crmDeals,
  crmLeads,
  partners,
  type AktivitasCrm,
  type PeluangDeal,
  type ProspekLead,
} from "@/db/schema/keuangan";
import { galat } from "@/server/core/errors";
import { bacaHalaman } from "../shared/pagination";
import type {
  QueryAktivitasInput,
  QueryDealInput,
  QueryLeadInput,
  SimpanAktivitasInput,
  SimpanDealInput,
  SimpanLeadInput,
  UbahDealInput,
  UbahLeadInput,
} from "./model";

// ==========================================
// 1. PROSPEK / LEADS
// ==========================================

export async function daftarLeads(query: QueryLeadInput) {
  const { halaman, ukuran, offset } = bacaHalaman(query);

  const conditions = [];
  if (query.status) conditions.push(eq(crmLeads.status, query.status));
  if (query.cari) {
    conditions.push(
      or(
        ilike(crmLeads.kode, `%${query.cari}%`),
        ilike(crmLeads.nama, `%${query.cari}%`),
        ilike(crmLeads.perusahaan, `%${query.cari}%`),
        ilike(crmLeads.email, `%${query.cari}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db.select({ total: count() }).from(crmLeads).where(whereClause);

  const data = await db
    .select({
      id: crmLeads.id,
      kode: crmLeads.kode,
      nama: crmLeads.nama,
      perusahaan: crmLeads.perusahaan,
      email: crmLeads.email,
      telepon: crmLeads.telepon,
      sumber: crmLeads.sumber,
      status: crmLeads.status,
      nilaiEstimasi: crmLeads.nilaiEstimasi,
      kontakId: crmLeads.kontakId,
      kontakNama: partners.nama,
      assignedTo: crmLeads.assignedTo,
      catatan: crmLeads.catatan,
      dibuatPada: crmLeads.dibuatPada,
    })
    .from(crmLeads)
    .leftJoin(partners, eq(crmLeads.kontakId, partners.id))
    .where(whereClause)
    .orderBy(desc(crmLeads.dibuatPada))
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

export async function ambilLead(id: string): Promise<ProspekLead> {
  const [lead] = await db.select().from(crmLeads).where(eq(crmLeads.id, id));
  if (!lead) throw galat.tidakDitemukan(`Lead CRM dengan ID ${id}`);
  return lead;
}

export async function simpanLead(input: SimpanLeadInput, oleh: string): Promise<ProspekLead> {
  const [totalLeads] = await db.select({ total: count() }).from(crmLeads);
  const urutan = ((totalLeads?.total ?? 0) + 1).toString().padStart(4, "0");
  const kodeBaru = `LEAD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${urutan}`;

  const [baru] = await db
    .insert(crmLeads)
    .values({
      kode: kodeBaru,
      nama: input.nama.trim(),
      perusahaan: input.perusahaan?.trim() || null,
      email: input.email?.trim() || null,
      telepon: input.telepon?.trim() || null,
      sumber: input.sumber?.trim() || "WEBSITE",
      status: input.status ?? "BARU",
      nilaiEstimasi: input.nilaiEstimasi || "0.0000",
      assignedTo: input.assignedTo?.trim() || null,
      catatan: input.catatan?.trim() || null,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();

  return baru!;
}

export async function ubahLead(id: string, input: UbahLeadInput, oleh: string): Promise<ProspekLead> {
  const [ada] = await db.select().from(crmLeads).where(eq(crmLeads.id, id));
  if (!ada) throw galat.tidakDitemukan(`Lead CRM dengan ID ${id}`);

  const [updated] = await db
    .update(crmLeads)
    .set({
      nama: input.nama ? input.nama.trim() : ada.nama,
      perusahaan: input.perusahaan !== undefined ? (input.perusahaan ? input.perusahaan.trim() : null) : ada.perusahaan,
      email: input.email !== undefined ? (input.email ? input.email.trim() : null) : ada.email,
      telepon: input.telepon !== undefined ? (input.telepon ? input.telepon.trim() : null) : ada.telepon,
      sumber: input.sumber !== undefined ? (input.sumber ? input.sumber.trim() : "WEBSITE") : ada.sumber,
      status: input.status ?? ada.status,
      nilaiEstimasi: input.nilaiEstimasi ?? ada.nilaiEstimasi,
      assignedTo: input.assignedTo !== undefined ? (input.assignedTo ? input.assignedTo.trim() : null) : ada.assignedTo,
      catatan: input.catatan !== undefined ? (input.catatan ? input.catatan.trim() : null) : ada.catatan,
      diubahOleh: oleh,
      diubahPada: new Date(),
    })
    .where(eq(crmLeads.id, id))
    .returning();

  return updated!;
}

export async function konversiLeadKeKontak(leadId: string, oleh: string) {
  const [lead] = await db.select().from(crmLeads).where(eq(crmLeads.id, leadId));
  if (!lead) throw galat.tidakDitemukan(`Lead CRM dengan ID ${leadId}`);
  if (lead.kontakId) throw galat.aturanBisnis("Lead ini sudah pernah dikonversi ke kontak partner.");

  return await db.transaction(async (tx) => {
    // Generate kode partner
    const [totalPartners] = await tx.select({ total: count() }).from(partners);
    const urutan = ((totalPartners?.total ?? 0) + 1).toString().padStart(4, "0");
    const kodePartner = `CUST-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${urutan}`;

    const [partnerBaru] = await tx
      .insert(partners)
      .values({
        kode: kodePartner,
        nama: lead.perusahaan ? `${lead.perusahaan} (${lead.nama})` : lead.nama,
        namaKontak: lead.nama,
        email: lead.email,
        telepon: lead.telepon,
        adalahPelanggan: true,
        adalahPemasok: false,
        catatan: `Dikonversi dari prospek CRM ${lead.kode}. Sumber: ${lead.sumber}.`,
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    const [updatedLead] = await tx
      .update(crmLeads)
      .set({
        status: "MENANG",
        kontakId: partnerBaru!.id,
        diubahOleh: oleh,
        diubahPada: new Date(),
      })
      .where(eq(crmLeads.id, lead.id))
      .returning();

    return {
      partner: partnerBaru!,
      lead: updatedLead!,
      pesan: `Lead ${lead.nama} berhasil dikonversi menjadi Kontak Pelanggan (${partnerBaru!.nama}).`,
    };
  });
}

// ==========================================
// 2. PELUANG PENJUALAN / DEALS PIPELINE
// ==========================================

export async function daftarDeals(query: QueryDealInput) {
  const { halaman, ukuran, offset } = bacaHalaman(query);

  const conditions = [];
  if (query.stage) conditions.push(eq(crmDeals.stage, query.stage));
  if (query.cari) {
    conditions.push(
      or(
        ilike(crmDeals.kode, `%${query.cari}%`),
        ilike(crmDeals.judul, `%${query.cari}%`),
        ilike(crmDeals.assignedTo, `%${query.cari}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db.select({ total: count() }).from(crmDeals).where(whereClause);

  const data = await db
    .select({
      id: crmDeals.id,
      kode: crmDeals.kode,
      judul: crmDeals.judul,
      leadId: crmDeals.leadId,
      leadNama: crmLeads.nama,
      kontakId: crmDeals.kontakId,
      kontakNama: partners.nama,
      stage: crmDeals.stage,
      nilaiPeluang: crmDeals.nilaiPeluang,
      probabilitas: crmDeals.probabilitas,
      targetClosing: crmDeals.targetClosing,
      assignedTo: crmDeals.assignedTo,
      keterangan: crmDeals.keterangan,
      dibuatPada: crmDeals.dibuatPada,
    })
    .from(crmDeals)
    .leftJoin(crmLeads, eq(crmDeals.leadId, crmLeads.id))
    .leftJoin(partners, eq(crmDeals.kontakId, partners.id))
    .where(whereClause)
    .orderBy(desc(crmDeals.dibuatPada))
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

export async function ambilDeal(id: string): Promise<PeluangDeal> {
  const [deal] = await db.select().from(crmDeals).where(eq(crmDeals.id, id));
  if (!deal) throw galat.tidakDitemukan(`Deal CRM dengan ID ${id}`);
  return deal;
}

export async function simpanDeal(input: SimpanDealInput, oleh: string): Promise<PeluangDeal> {
  const [totalDeals] = await db.select({ total: count() }).from(crmDeals);
  const urutan = ((totalDeals?.total ?? 0) + 1).toString().padStart(4, "0");
  const kodeBaru = `DEAL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${urutan}`;

  const [baru] = await db
    .insert(crmDeals)
    .values({
      kode: kodeBaru,
      judul: input.judul.trim(),
      leadId: input.leadId || null,
      kontakId: input.kontakId || null,
      stage: input.stage ?? "PROSPEK",
      nilaiPeluang: input.nilaiPeluang,
      probabilitas: input.probabilitas ?? 50,
      targetClosing: input.targetClosing || null,
      assignedTo: input.assignedTo?.trim() || null,
      keterangan: input.keterangan?.trim() || null,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();

  return baru!;
}

export async function ubahDeal(id: string, input: UbahDealInput, oleh: string): Promise<PeluangDeal> {
  const [ada] = await db.select().from(crmDeals).where(eq(crmDeals.id, id));
  if (!ada) throw galat.tidakDitemukan(`Deal CRM dengan ID ${id}`);

  const [updated] = await db
    .update(crmDeals)
    .set({
      judul: input.judul ? input.judul.trim() : ada.judul,
      leadId: input.leadId !== undefined ? input.leadId : ada.leadId,
      kontakId: input.kontakId !== undefined ? input.kontakId : ada.kontakId,
      stage: input.stage ?? ada.stage,
      nilaiPeluang: input.nilaiPeluang ?? ada.nilaiPeluang,
      probabilitas: input.probabilitas !== undefined ? input.probabilitas : ada.probabilitas,
      targetClosing: input.targetClosing !== undefined ? input.targetClosing : ada.targetClosing,
      assignedTo: input.assignedTo !== undefined ? (input.assignedTo ? input.assignedTo.trim() : null) : ada.assignedTo,
      keterangan: input.keterangan !== undefined ? (input.keterangan ? input.keterangan.trim() : null) : ada.keterangan,
      diubahOleh: oleh,
      diubahPada: new Date(),
    })
    .where(eq(crmDeals.id, id))
    .returning();

  return updated!;
}

export async function pindahStageDeal(id: string, stage: PeluangDeal["stage"], oleh: string) {
  const [ada] = await db.select().from(crmDeals).where(eq(crmDeals.id, id));
  if (!ada) throw galat.tidakDitemukan(`Deal CRM dengan ID ${id}`);

  const [updated] = await db
    .update(crmDeals)
    .set({
      stage,
      diubahOleh: oleh,
      diubahPada: new Date(),
    })
    .where(eq(crmDeals.id, id))
    .returning();

  return updated!;
}

// ==========================================
// 3. AKTIVITAS INTERAKSI CRM
// ==========================================

export async function daftarAktivitas(query: QueryAktivitasInput) {
  const { halaman, ukuran, offset } = bacaHalaman(query);

  const conditions = [];
  if (query.leadId) conditions.push(eq(crmActivities.leadId, query.leadId));
  if (query.dealId) conditions.push(eq(crmActivities.dealId, query.dealId));
  if (query.kontakId) conditions.push(eq(crmActivities.kontakId, query.kontakId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db.select({ total: count() }).from(crmActivities).where(whereClause);

  const data = await db
    .select()
    .from(crmActivities)
    .where(whereClause)
    .orderBy(desc(crmActivities.tanggal))
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

export async function simpanAktivitas(input: SimpanAktivitasInput, oleh: string): Promise<AktivitasCrm> {
  const [baru] = await db
    .insert(crmActivities)
    .values({
      tipe: input.tipe,
      judul: input.judul.trim(),
      leadId: input.leadId || null,
      dealId: input.dealId || null,
      kontakId: input.kontakId || null,
      tanggal: input.tanggal ? new Date(input.tanggal) : new Date(),
      status: input.status ?? "PENDING",
      hasil: input.hasil?.trim() || null,
      dibuatOleh: oleh,
    })
    .returning();

  return baru!;
}
