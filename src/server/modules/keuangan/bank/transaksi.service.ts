import { and, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  bankAccounts,
  bankTransactions,
  chartOfAccounts,
  currencies,
  journalItems,
  partners,
} from "@/db/schema/keuangan";
import { akunByPeran, pastikanAkunDetail } from "../akun/service";
import { db } from "../shared/context";
import { kaliKurs, keBigInt, keString } from "../shared/decimal";
import { tentukanMataUangKurs } from "../shared/kurs";
import { PREFIKS, nomorBerikut } from "../shared/transaction";
import { bacaHalaman } from "../shared/pagination";
import { galat } from "@/server/core/errors";
import { nullJikaKosong } from "../shared/text";
import { balikJurnal, simpanJurnal, type BarisJurnalInput } from "../jurnal/engine";
import type { InputBatalTransaksiBank, InputSimpanTransaksiBank } from "./transaksi.model";

const rekAsal = alias(bankAccounts, "rek_asal");
const rekTujuan = alias(bankAccounts, "rek_tujuan");
const akunLawan = alias(chartOfAccounts, "akun_lawan");
const akunAdmin = alias(chartOfAccounts, "akun_admin");
const kontak = alias(partners, "kontak");
const mataUang = alias(currencies, "mata_uang");

const kolomTransaksiBank = {
  id: bankTransactions.id,
  nomor: bankTransactions.nomor,
  tanggal: bankTransactions.tanggal,
  jenis: bankTransactions.jenis,
  rekeningBankId: bankTransactions.rekeningBankId,
  namaRekeningBank: rekAsal.nama,
  kodeRekeningBank: rekAsal.kode,
  rekeningTujuanId: bankTransactions.rekeningTujuanId,
  namaRekeningTujuan: rekTujuan.nama,
  kodeRekeningTujuan: rekTujuan.kode,
  jumlahTujuan: bankTransactions.jumlahTujuan,
  kursTujuan: bankTransactions.kursTujuan,
  biayaAdmin: bankTransactions.biayaAdmin,
  akunBiayaAdminId: bankTransactions.akunBiayaAdminId,
  kodeAkunBiayaAdmin: akunAdmin.kode,
  namaAkunBiayaAdmin: akunAdmin.nama,
  akunLawanId: bankTransactions.akunLawanId,
  kodeAkunLawan: akunLawan.kode,
  namaAkunLawan: akunLawan.nama,
  kontakId: bankTransactions.kontakId,
  namaKontak: kontak.nama,
  referensi: bankTransactions.referensi,
  deskripsi: bankTransactions.deskripsi,
  mataUangId: bankTransactions.mataUangId,
  kodeMataUang: mataUang.kode,
  kurs: bankTransactions.kurs,
  jumlah: bankTransactions.jumlah,
  status: bankTransactions.status,
  jurnalId: bankTransactions.jurnalId,
  dipostingOleh: bankTransactions.dipostingOleh,
  dipostingPada: bankTransactions.dipostingPada,
  dibuatOleh: bankTransactions.dibuatOleh,
  diubahOleh: bankTransactions.diubahOleh,
  dibuatPada: bankTransactions.dibuatPada,
  diubahPada: bankTransactions.diubahPada,
};

const dasarQuery = () =>
  db
    .select(kolomTransaksiBank)
    .from(bankTransactions)
    .innerJoin(rekAsal, eq(rekAsal.id, bankTransactions.rekeningBankId))
    .leftJoin(rekTujuan, eq(rekTujuan.id, bankTransactions.rekeningTujuanId))
    .leftJoin(akunLawan, eq(akunLawan.id, bankTransactions.akunLawanId))
    .leftJoin(akunAdmin, eq(akunAdmin.id, bankTransactions.akunBiayaAdminId))
    .leftJoin(kontak, eq(kontak.id, bankTransactions.kontakId))
    .innerJoin(mataUang, eq(mataUang.id, bankTransactions.mataUangId));

async function ambil(id: string) {
  const [data] = await dasarQuery().where(eq(bankTransactions.id, id));
  if (!data) throw galat.tidakDitemukan("Transaksi kas/bank");
  return data;
}

async function simpan(id: string | null, input: InputSimpanTransaksiBank, oleh: string) {
  const jumlah = keBigInt(input.jumlah);
  if (jumlah <= BigInt(0)) throw galat.aturanBisnis("Jumlah transaksi harus lebih dari 0.");

  const [rek] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.rekeningBankId));
  if (!rek || !rek.aktif) throw galat.tidakDitemukan("Rekening kas/bank");

  const mu = await tentukanMataUangKurs({
    mataUangId: input.mataUangId,
    kurs: input.kurs,
    tanggal: input.tanggal,
  });

  if (rek.mataUangId !== mu.mataUangId) {
    throw galat.aturanBisnis("Mata uang transaksi harus sama dengan mata uang rekening kas/bank.");
  }

  let jumlahTujuanStr: string | null = null;
  let kursTujuanStr: string | null = null;

  if (input.jenis === "TRANSFER") {
    if (!input.rekeningTujuanId) throw galat.aturanBisnis("Transfer kas/bank wajib memilih rekening tujuan.");
    if (input.rekeningTujuanId === input.rekeningBankId) {
      throw galat.aturanBisnis("Rekening tujuan tidak boleh sama dengan rekening asal.");
    }
    const [rekTujuanRow] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.rekeningTujuanId));
    if (!rekTujuanRow || !rekTujuanRow.aktif) throw galat.tidakDitemukan("Rekening kas/bank tujuan");

    if (rekTujuanRow.mataUangId === mu.mataUangId) {
      jumlahTujuanStr = input.jumlahTujuan ? keString(keBigInt(input.jumlahTujuan)) : keString(jumlah);
      kursTujuanStr = mu.kurs;
    } else {
      if (!input.jumlahTujuan) {
        throw galat.aturanBisnis(
          "Transfer beda mata uang wajib mengisi jumlah tujuan yang diterima di rekening tujuan.",
        );
      }
      const muTujuan = await tentukanMataUangKurs({
        mataUangId: rekTujuanRow.mataUangId,
        kurs: input.kursTujuan,
        tanggal: input.tanggal,
      });
      jumlahTujuanStr = keString(keBigInt(input.jumlahTujuan));
      kursTujuanStr = muTujuan.kurs;
    }
  } else {
    if (!input.akunLawanId) throw galat.aturanBisnis("Transaksi kas masuk/keluar wajib memilih akun lawan.");
    await pastikanAkunDetail(input.akunLawanId, { label: "Akun lawan" });
  }

  const biayaAdmin = input.biayaAdmin ? keBigInt(input.biayaAdmin) : BigInt(0);
  if (biayaAdmin < BigInt(0)) throw galat.aturanBisnis("Biaya admin tidak boleh negatif.");
  if (biayaAdmin > BigInt(0)) {
    if (!input.akunBiayaAdminId) {
      throw galat.aturanBisnis("Biaya admin terisi; wajib memilih akun beban biaya admin.");
    }
    await pastikanAkunDetail(input.akunBiayaAdminId, { label: "Akun beban admin", tipe: "BEBAN" });
  }

  if (input.kontakId) {
    const [kontakRow] = await db.select().from(partners).where(eq(partners.id, input.kontakId));
    if (!kontakRow || !kontakRow.aktif) throw galat.tidakDitemukan("Kontak");
  }

  const nilai = {
    tanggal: input.tanggal,
    jenis: input.jenis,
    rekeningBankId: input.rekeningBankId,
    rekeningTujuanId: input.jenis === "TRANSFER" ? input.rekeningTujuanId! : null,
    jumlahTujuan: input.jenis === "TRANSFER" ? jumlahTujuanStr : null,
    kursTujuan: input.jenis === "TRANSFER" ? kursTujuanStr : null,
    biayaAdmin: keString(biayaAdmin),
    akunBiayaAdminId: biayaAdmin > BigInt(0) ? input.akunBiayaAdminId! : null,
    akunLawanId: input.jenis !== "TRANSFER" ? input.akunLawanId! : null,
    kontakId: input.kontakId ?? null,
    referensi: nullJikaKosong(input.referensi),
    deskripsi: input.deskripsi.trim(),
    mataUangId: mu.mataUangId,
    kurs: mu.kurs,
    jumlah: keString(jumlah),
    diubahOleh: oleh,
  };

  return db.transaction(async (tx) => {
    let trxId = id;
    if (!trxId) {
      const nomor = await nomorBerikut(tx, PREFIKS.MUTASI_BANK, input.tanggal);
      const [baru] = await tx
        .insert(bankTransactions)
        .values({ ...nilai, nomor, dibuatOleh: oleh })
        .returning({ id: bankTransactions.id });
      trxId = baru!.id;
    } else {
      await tx.update(bankTransactions).set(nilai).where(eq(bankTransactions.id, trxId));
    }
    return trxId!;
  });
}

export async function daftarTransaksiBank(opsi: {
  rekeningBankId?: string | null;
  jenis?: "MASUK" | "KELUAR" | "TRANSFER";
  status?: "DRAFT" | "POSTED" | "DIBATALKAN";
  dari?: string;
  sampai?: string;
  halaman?: number;
  ukuran?: number;
}) {
  const { offset, ukuran, halaman } = bacaHalaman(opsi);
  const kondisi = and(
    opsi.rekeningBankId
      ? or(
          eq(bankTransactions.rekeningBankId, opsi.rekeningBankId),
          eq(bankTransactions.rekeningTujuanId, opsi.rekeningBankId),
        )
      : undefined,
    opsi.jenis ? eq(bankTransactions.jenis, opsi.jenis) : undefined,
    opsi.status ? eq(bankTransactions.status, opsi.status) : undefined,
    opsi.dari ? gte(bankTransactions.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(bankTransactions.tanggal, opsi.sampai) : undefined,
  );

  const [data, [hitungTotal]] = await Promise.all([
    dasarQuery()
      .where(kondisi)
      .orderBy(desc(bankTransactions.tanggal), desc(bankTransactions.nomor))
      .limit(ukuran)
      .offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(bankTransactions).where(kondisi),
  ]);

  return { data, total: hitungTotal?.total ?? 0, halaman, ukuran };
}

export const ambilTransaksiBank = ambil;

export async function buatTransaksiBank(input: InputSimpanTransaksiBank, oleh: string) {
  const id = await simpan(null, input, oleh);
  return ambil(id);
}

export async function ubahTransaksiBank(id: string, input: InputSimpanTransaksiBank, oleh: string) {
  const ada = await ambil(id);
  if (ada.status !== "DRAFT") throw galat.aturanBisnis(`Transaksi kas/bank ${ada.nomor} bukan DRAFT.`);
  await simpan(id, input, oleh);
  return ambil(id);
}

export async function hapusTransaksiBank(id: string) {
  const ada = await ambil(id);
  if (ada.status !== "DRAFT") throw galat.aturanBisnis(`Transaksi kas/bank ${ada.nomor} bukan DRAFT.`);
  await db.delete(bankTransactions).where(eq(bankTransactions.id, id));
  return { id };
}

export async function postingTransaksiBank(id: string, oleh: string) {
  return db.transaction(async (tx) => {
    const [header] = await tx.select().from(bankTransactions).where(eq(bankTransactions.id, id)).for("update");
    if (!header) throw galat.tidakDitemukan("Transaksi kas/bank");
    if (header.status !== "DRAFT") {
      throw galat.aturanBisnis(`Transaksi kas/bank ${header.nomor} berstatus ${header.status}.`);
    }

    const [rekAsalRow] = await tx.select().from(bankAccounts).where(eq(bankAccounts.id, header.rekeningBankId));
    if (!rekAsalRow) throw galat.tidakDitemukan("Rekening kas/bank");

    const biayaAdmin = keBigInt(header.biayaAdmin ?? "0");
    let barisJurnal: BarisJurnalInput[];

    if (header.jenis === "MASUK") {
      barisJurnal = [
        {
          akunId: rekAsalRow.akunCoaId,
          debit: header.jumlah,
          deskripsi: header.deskripsi,
        },
      ];
      if (biayaAdmin > BigInt(0) && header.akunBiayaAdminId) {
        barisJurnal.push({
          akunId: header.akunBiayaAdminId,
          debit: keString(biayaAdmin),
          deskripsi: `Biaya admin: ${header.deskripsi}`,
        });
      }
      const totalCr = keBigInt(header.jumlah) + biayaAdmin;
      barisJurnal.push({
        akunId: header.akunLawanId!,
        kredit: keString(totalCr),
        deskripsi: header.deskripsi,
        kontakId: header.kontakId ?? undefined,
      });
    } else if (header.jenis === "KELUAR") {
      barisJurnal = [
        {
          akunId: header.akunLawanId!,
          debit: header.jumlah,
          deskripsi: header.deskripsi,
          kontakId: header.kontakId ?? undefined,
        },
      ];
      if (biayaAdmin > BigInt(0) && header.akunBiayaAdminId) {
        barisJurnal.push({
          akunId: header.akunBiayaAdminId,
          debit: keString(biayaAdmin),
          deskripsi: `Biaya admin: ${header.deskripsi}`,
        });
      }
      const totalKeluar = keBigInt(header.jumlah) + biayaAdmin;
      barisJurnal.push({
        akunId: rekAsalRow.akunCoaId,
        kredit: keString(totalKeluar),
        deskripsi: header.deskripsi,
      });
    } else {
      // TRANSFER
      const [rekTujuanRow] = await tx.select().from(bankAccounts).where(eq(bankAccounts.id, header.rekeningTujuanId!));
      if (!rekTujuanRow) throw galat.tidakDitemukan("Rekening kas/bank tujuan");

      const jumlahTujuan = header.jumlahTujuan ? keBigInt(header.jumlahTujuan) : keBigInt(header.jumlah);
      const kursTujuan = header.kursTujuan ?? header.kurs;
      const totalKeluarAsal = keBigInt(header.jumlah) + biayaAdmin;

      barisJurnal = [
        {
          akunId: rekTujuanRow.akunCoaId,
          debit: keString(jumlahTujuan),
          mataUangId: rekTujuanRow.mataUangId,
          kurs: kursTujuan,
          deskripsi: `Transfer masuk dari ${rekAsalRow.nama}: ${header.deskripsi}`,
        },
      ];

      if (biayaAdmin > BigInt(0) && header.akunBiayaAdminId) {
        barisJurnal.push({
          akunId: header.akunBiayaAdminId,
          debit: keString(biayaAdmin),
          mataUangId: header.mataUangId,
          kurs: header.kurs,
          deskripsi: `Biaya admin transfer: ${header.deskripsi}`,
        });
      }

      barisJurnal.push({
        akunId: rekAsalRow.akunCoaId,
        kredit: keString(totalKeluarAsal),
        mataUangId: header.mataUangId,
        kurs: header.kurs,
        deskripsi: `Transfer keluar ke ${rekTujuanRow.nama}: ${header.deskripsi}`,
      });

      // Menghitung selisih kurs nilai dasar
      const nilaiDasarTujuan = kaliKurs(jumlahTujuan, keBigInt(kursTujuan));
      const nilaiDasarAdmin = kaliKurs(biayaAdmin, keBigInt(header.kurs));
      const nilaiDasarAsal = kaliKurs(totalKeluarAsal, keBigInt(header.kurs));

      const totalDebitDasar = nilaiDasarTujuan + nilaiDasarAdmin;
      const totalKreditDasar = nilaiDasarAsal;
      const selisihDasar = totalDebitDasar - totalKreditDasar;

      if (selisihDasar < BigInt(0)) {
        const rugiKursAkun = await akunByPeran("RUGI_SELISIH_KURS");
        barisJurnal.push({
          akunId: rugiKursAkun.id,
          debit: keString(-selisihDasar),
          nilaiDasar: keString(-selisihDasar),
          deskripsi: `Rugi selisih kurs transfer ${header.nomor}`,
        });
      } else if (selisihDasar > BigInt(0)) {
        const labaKursAkun = await akunByPeran("LABA_SELISIH_KURS");
        barisJurnal.push({
          akunId: labaKursAkun.id,
          kredit: keString(selisihDasar),
          nilaiDasar: keString(selisihDasar),
          deskripsi: `Laba selisih kurs transfer ${header.nomor}`,
        });
      }
    }

    const jenisLabel =
      header.jenis === "MASUK" ? "Kas Masuk" : header.jenis === "KELUAR" ? "Kas Keluar" : "Transfer Kas";

    const jurnal = await simpanJurnal(
      tx,
      {
        tanggal: header.tanggal,
        deskripsi: `${jenisLabel} ${header.nomor}: ${header.deskripsi}`,
        referensi: header.referensi,
        sumber: "MUTASI_BANK",
        sumberId: header.id,
        mataUangId: header.mataUangId,
        kurs: header.kurs,
        posting: true,
        baris: barisJurnal,
      },
      oleh,
    );

    const [hasil] = await tx
      .update(bankTransactions)
      .set({
        status: "POSTED",
        jurnalId: jurnal.id,
        dipostingOleh: oleh,
        dipostingPada: new Date(),
        diubahOleh: oleh,
      })
      .where(eq(bankTransactions.id, id))
      .returning();

    return hasil!;
  });
}

export async function batalTransaksiBank(id: string, input: InputBatalTransaksiBank, oleh: string) {
  return db.transaction(async (tx) => {
    const [header] = await tx.select().from(bankTransactions).where(eq(bankTransactions.id, id)).for("update");
    if (!header) throw galat.tidakDitemukan("Transaksi kas/bank");
    if (header.status !== "POSTED") {
      throw galat.aturanBisnis(
        `Transaksi kas/bank ${header.nomor} tidak dapat dibatalkan (status ${header.status}).`,
      );
    }

    if (header.jurnalId) {
      const [barisTercocok] = await tx
        .select({ id: journalItems.id })
        .from(journalItems)
        .where(and(eq(journalItems.jurnalId, header.jurnalId), sql`${journalItems.rekonsiliasiId} IS NOT NULL`))
        .limit(1);
      if (barisTercocok) {
        throw galat.aturanBisnis(
          "Transaksi ini sudah direkonsiliasi di bank. Batalkan rekonsiliasi terlebih dahulu sebelum membatalkan transaksi.",
        );
      }
    }

    const pembalik = await balikJurnal(
      tx,
      header.jurnalId!,
      {
        tanggal: input.tanggal,
        deskripsi: input.deskripsi ?? undefined,
        sumber: "MUTASI_BANK",
      },
      oleh,
    );

    const [hasil] = await tx
      .update(bankTransactions)
      .set({
        status: "DIBATALKAN",
        diubahOleh: oleh,
      })
      .where(eq(bankTransactions.id, id))
      .returning();

    return { ...hasil!, jurnalPembalikId: pembalik.id };
  });
}
