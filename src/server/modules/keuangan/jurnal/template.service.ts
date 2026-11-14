import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import {
  chartOfAccounts,
  currencies,
  journalTemplateItems,
  journalTemplates,
  recurringJournals,
} from "@/db/schema/keuangan";
import { db } from "../shared/context";
import { galat } from "@/server/core/errors";
import { pastikanAkunDetail } from "../akun/service";
import { ambilMataUangDasar } from "../mata-uang/service";
import { simpanJurnal, type BarisJurnalInput } from "./engine";
import { escapeLike, nullJikaKosong } from "../shared/text";
import { PREFIKS, nomorBerikut } from "../shared/transaction";
import type {
  InputBuatJurnalBerulang,
  InputBuatTemplate,
  InputUbahTemplate,
} from "./template.model";

/* ---------------------------- Template Jurnal ---------------------------- */

export async function daftarTemplate(opsi: { aktif?: boolean; q?: string } = {}) {
  const q = opsi.q?.trim();
  const kondisi = and(
    opsi.aktif === undefined ? undefined : eq(journalTemplates.aktif, opsi.aktif),
    q ? or(ilike(journalTemplates.kode, `${escapeLike(q)}%`), ilike(journalTemplates.nama, `%${escapeLike(q)}%`)) : undefined,
  );

  return db.select().from(journalTemplates).where(kondisi).orderBy(asc(journalTemplates.nama));
}

export async function ambilTemplate(id: string) {
  const [header] = await db.select().from(journalTemplates).where(eq(journalTemplates.id, id));
  if (!header) throw galat.tidakDitemukan("Template jurnal");

  const items = await db
    .select({
      id: journalTemplateItems.id,
      urutan: journalTemplateItems.urutan,
      akunId: journalTemplateItems.akunId,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
      tipeAkun: chartOfAccounts.tipeAkun,
      posisi: journalTemplateItems.posisi,
      nominalDefault: journalTemplateItems.nominalDefault,
      persentase: journalTemplateItems.persentase,
      deskripsi: journalTemplateItems.deskripsi,
    })
    .from(journalTemplateItems)
    .innerJoin(chartOfAccounts, eq(journalTemplateItems.akunId, chartOfAccounts.id))
    .where(eq(journalTemplateItems.templateId, id))
    .orderBy(asc(journalTemplateItems.urutan));

  return {
    ...header,
    daftarBaris: items,
  };
}

export async function buatTemplate(input: InputBuatTemplate, oleh: string) {
  if (input.daftarBaris.length < 2) {
    throw galat.aturanBisnis("Template jurnal minimal terdiri dari 2 baris.");
  }

  for (const b of input.daftarBaris) {
    await pastikanAkunDetail(b.akunId, { label: "Akun template" });
  }

  return db.transaction(async (tx) => {
    const [baru] = await tx
      .insert(journalTemplates)
      .values({
        kode: input.kode.trim().toUpperCase(),
        nama: input.nama.trim(),
        deskripsi: nullJikaKosong(input.deskripsi),
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    let urutan = 1;
    for (const b of input.daftarBaris) {
      await tx.insert(journalTemplateItems).values({
        templateId: baru!.id,
        urutan: urutan++,
        akunId: b.akunId,
        posisi: b.posisi,
        nominalDefault: b.nominalDefault ?? "0",
        persentase: b.persentase ?? "0",
        deskripsi: nullJikaKosong(b.deskripsi),
      });
    }

    return ambilTemplate(baru!.id);
  });
}

export async function ubahTemplate(id: string, input: InputUbahTemplate, oleh: string) {
  await ambilTemplate(id);

  const set: Partial<typeof journalTemplates.$inferInsert> = {};
  if (input.kode !== undefined) set.kode = input.kode.trim().toUpperCase();
  if (input.nama !== undefined) set.nama = input.nama.trim();
  if (input.deskripsi !== undefined) set.deskripsi = nullJikaKosong(input.deskripsi);
  if (input.aktif !== undefined) set.aktif = input.aktif;

  return db.transaction(async (tx) => {
    if (Object.keys(set).length > 0) {
      await tx.update(journalTemplates).set({ ...set, diubahOleh: oleh }).where(eq(journalTemplates.id, id));
    }

    if (input.daftarBaris) {
      if (input.daftarBaris.length < 2) {
        throw galat.aturanBisnis("Template jurnal minimal terdiri dari 2 baris.");
      }
      for (const b of input.daftarBaris) {
        await pastikanAkunDetail(b.akunId, { label: "Akun template" });
      }

      await tx.delete(journalTemplateItems).where(eq(journalTemplateItems.templateId, id));
      let urutan = 1;
      for (const b of input.daftarBaris) {
        await tx.insert(journalTemplateItems).values({
          templateId: id,
          urutan: urutan++,
          akunId: b.akunId,
          posisi: b.posisi,
          nominalDefault: b.nominalDefault ?? "0",
          persentase: b.persentase ?? "0",
          deskripsi: nullJikaKosong(b.deskripsi),
        });
      }
    }

    return ambilTemplate(id);
  });
}

export async function hapusTemplate(id: string) {
  const [dihapus] = await db.delete(journalTemplates).where(eq(journalTemplates.id, id)).returning();
  if (!dihapus) throw galat.tidakDitemukan("Template jurnal");
  return { id };
}

/* --------------------------- Jurnal Berulang --------------------------- */

function hitungTanggalBerikutnya(tanggalSekarang: string, frekuensi: string): string {
  const [thn, bln, tgl] = tanggalSekarang.split("-").map(Number);
  const d = new Date(Date.UTC(thn!, bln! - 1, tgl!));

  if (frekuensi === "HARIAN") {
    d.setUTCDate(d.getUTCDate() + 1);
  } else if (frekuensi === "MINGGUAN") {
    d.setUTCDate(d.getUTCDate() + 7);
  } else if (frekuensi === "BULANAN") {
    d.setUTCMonth(d.getUTCMonth() + 1);
  } else if (frekuensi === "TAHUNAN") {
    d.setUTCFullYear(d.getUTCFullYear() + 1);
  }

  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

export async function daftarJurnalBerulang(opsi: { aktif?: boolean } = {}) {
  return db
    .select({
      id: recurringJournals.id,
      nomor: recurringJournals.nomor,
      deskripsi: recurringJournals.deskripsi,
      frekuensi: recurringJournals.frekuensi,
      tanggalMulai: recurringJournals.tanggalMulai,
      tanggalSelesai: recurringJournals.tanggalSelesai,
      tanggalBerikutnya: recurringJournals.tanggalBerikutnya,
      templateId: recurringJournals.templateId,
      templateNama: journalTemplates.nama,
      mataUangId: recurringJournals.mataUangId,
      mataUangKode: currencies.kode,
      totalDebit: recurringJournals.totalDebit,
      totalKredit: recurringJournals.totalKredit,
      aktif: recurringJournals.aktif,
      terakhirDipostingPada: recurringJournals.terakhirDipostingPada,
    })
    .from(recurringJournals)
    .leftJoin(journalTemplates, eq(recurringJournals.templateId, journalTemplates.id))
    .innerJoin(currencies, eq(recurringJournals.mataUangId, currencies.id))
    .where(opsi.aktif === undefined ? undefined : eq(recurringJournals.aktif, opsi.aktif))
    .orderBy(desc(recurringJournals.dibuatPada));
}

export async function buatJurnalBerulang(input: InputBuatJurnalBerulang, oleh: string) {
  const mataUangDasar = await ambilMataUangDasar();
  const mataUangId = input.mataUangId ?? mataUangDasar.id;

  if (input.templateId) {
    await ambilTemplate(input.templateId);
  }

  return db.transaction(async (tx) => {
    const nomor = await nomorBerikut(tx, PREFIKS.JURNAL, input.tanggalMulai);

    const [baru] = await tx
      .insert(recurringJournals)
      .values({
        nomor,
        deskripsi: input.deskripsi.trim(),
        frekuensi: input.frekuensi,
        tanggalMulai: input.tanggalMulai,
        tanggalSelesai: input.tanggalSelesai ?? null,
        tanggalBerikutnya: input.tanggalMulai,
        templateId: input.templateId ?? null,
        mataUangId,
        totalDebit: input.totalDebit ?? "0",
        totalKredit: input.totalKredit ?? "0",
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    return baru!;
  });
}

export async function eksekusiJurnalBerulang(id: string, oleh: string) {
  const [rec] = await db.select().from(recurringJournals).where(eq(recurringJournals.id, id));
  if (!rec) throw galat.tidakDitemukan("Jurnal berulang");
  if (!rec.aktif) throw galat.aturanBisnis("Jurnal berulang ini tidak aktif.");

  const tanggalPosting = rec.tanggalBerikutnya;
  if (rec.tanggalSelesai && tanggalPosting > rec.tanggalSelesai) {
    await db.update(recurringJournals).set({ aktif: false }).where(eq(recurringJournals.id, id));
    throw galat.aturanBisnis("Jurnal berulang sudah melewati tanggal selesai.");
  }

  if (!rec.templateId) {
    throw galat.aturanBisnis("Jurnal berulang belum terhubung dengan template jurnal.");
  }

  const template = await ambilTemplate(rec.templateId);
  const barisJurnal: BarisJurnalInput[] = template.daftarBaris.map((b) => ({
    akunId: b.akunId,
    debit: b.posisi === "DEBIT" ? (b.nominalDefault !== "0" ? b.nominalDefault : rec.totalDebit) : undefined,
    kredit: b.posisi === "KREDIT" ? (b.nominalDefault !== "0" ? b.nominalDefault : rec.totalKredit) : undefined,
    deskripsi: b.deskripsi ?? rec.deskripsi,
    mataUangId: rec.mataUangId,
    kurs: "1.00000000",
  }));

  return db.transaction(async (tx) => {
    const jurnal = await simpanJurnal(
      tx,
      {
        tanggal: tanggalPosting,
        deskripsi: `${rec.deskripsi} (${rec.frekuensi} - ${tanggalPosting})`,
        sumber: "MANUAL",
        mataUangId: rec.mataUangId,
        kurs: "1.00000000",
        baris: barisJurnal,
        posting: true,
      },
      oleh,
    );

    const tanggalBerikutnya = hitungTanggalBerikutnya(tanggalPosting, rec.frekuensi);
    const melewatiSelesai = rec.tanggalSelesai ? tanggalBerikutnya > rec.tanggalSelesai : false;

    await tx
      .update(recurringJournals)
      .set({
        tanggalBerikutnya,
        aktif: !melewatiSelesai,
        terakhirDipostingPada: new Date(),
        jurnalTerakhirId: jurnal.id,
        diubahOleh: oleh,
      })
      .where(eq(recurringJournals.id, id));

    return jurnal;
  });
}
