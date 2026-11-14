import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import {
  bankAccounts,
  chartOfAccounts,
  expenses,
  partners,
  paymentAllocations,
  payments,
  purchaseInvoices,
  salesInvoices,
} from "@/db/schema/keuangan";
import { galat } from "@/server/core/errors";
import { akunByPeran, pastikanAkunDetail } from "../akun/service";
import { balikJurnal, simpanJurnal, type BarisJurnalInput } from "../jurnal/engine";
import { ambilKontak } from "../kontak/service";
import { ambilMataUangDasar } from "../mata-uang/service";
import { db } from "../shared/context";
import {
  kaliKurs,
  keBigInt,
  keString,
  SKALA_KURS,
} from "../shared/decimal";
import { tentukanMataUangKurs } from "../shared/kurs";
import { bacaHalaman } from "../shared/pagination";
import { escapeLike, nullJikaKosong } from "../shared/text";
import { nomorBerikut, PREFIKS, type Tx } from "../shared/transaction";
import type {
  InputBatal,
  InputSimpanPembayaran,
  QueryPembayaran,
} from "./model";

/* ------------------------------------------------------------------ */
/* Helper Akun Potongan Bawaan                                        */
/* ------------------------------------------------------------------ */

async function ambilAkunPotonganPenjualanDefault() {
  const [akun4200] = await db
    .select()
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.kode, "4200"), eq(chartOfAccounts.aktif, true)));
  if (akun4200) return akun4200;
  return akunByPeran("PENDAPATAN_PENJUALAN");
}

/* ================================================================== */
/* PEMBACAAN DATA PEMBAYARAN                                          */
/* ================================================================== */

export async function ambilPembayaran(id: string, koneksi: Tx | typeof db = db) {
  const [header] = await koneksi
    .select({
      pembayaran: payments,
      kontakKode: partners.kode,
      kontakNama: partners.nama,
      bankKode: bankAccounts.kode,
      bankNama: bankAccounts.namaBank,
      bankAkunCoaId: bankAccounts.akunCoaId,
    })
    .from(payments)
    .innerJoin(partners, eq(payments.kontakId, partners.id))
    .innerJoin(bankAccounts, eq(payments.rekeningBankId, bankAccounts.id))
    .where(eq(payments.id, id));

  if (!header) throw galat.tidakDitemukan("Pembayaran");

  const alokasi = await koneksi
    .select({
      alokasi: paymentAllocations,
      fakturPenjualanNomor: salesInvoices.nomor,
      fakturPembelianNomor: purchaseInvoices.nomor,
      biayaNomor: expenses.nomor,
    })
    .from(paymentAllocations)
    .leftJoin(salesInvoices, eq(paymentAllocations.fakturPenjualanId, salesInvoices.id))
    .leftJoin(purchaseInvoices, eq(paymentAllocations.fakturPembelianId, purchaseInvoices.id))
    .leftJoin(expenses, eq(paymentAllocations.biayaId, expenses.id))
    .where(eq(paymentAllocations.pembayaranId, id));

  return {
    ...header.pembayaran,
    kontak: { id: header.pembayaran.kontakId, kode: header.kontakKode, nama: header.kontakNama },
    rekeningBank: {
      id: header.pembayaran.rekeningBankId,
      kode: header.bankKode,
      namaBank: header.bankNama,
      akunCoaId: header.bankAkunCoaId,
    },
    alokasi: alokasi.map((a) => ({
      ...a.alokasi,
      nomorDokumen: a.fakturPenjualanNomor ?? a.fakturPembelianNomor ?? a.biayaNomor ?? "-",
    })),
  };
}

export async function daftarPembayaran(opsi: QueryPembayaran) {
  const { offset, ukuran, halaman } = bacaHalaman(opsi);
  const q = opsi.q?.trim();

  const kondisi = and(
    opsi.jenis ? eq(payments.jenis, opsi.jenis) : undefined,
    opsi.status ? eq(payments.status, opsi.status) : undefined,
    opsi.kontakId ? eq(payments.kontakId, opsi.kontakId) : undefined,
    opsi.rekeningBankId ? eq(payments.rekeningBankId, opsi.rekeningBankId) : undefined,
    opsi.dari ? gte(payments.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(payments.tanggal, opsi.sampai) : undefined,
    q
      ? or(
          ilike(payments.nomor, `%${escapeLike(q)}%`),
          ilike(payments.referensi, `%${escapeLike(q)}%`),
          ilike(partners.nama, `%${escapeLike(q)}%`),
        )
      : undefined,
  );

  const [data, [hitungTotal]] = await Promise.all([
    db
      .select({
        pembayaran: payments,
        kontakKode: partners.kode,
        kontakNama: partners.nama,
        bankKode: bankAccounts.kode,
        bankNama: bankAccounts.namaBank,
        bankAkunCoaId: bankAccounts.akunCoaId,
      })
      .from(payments)
      .innerJoin(partners, eq(payments.kontakId, partners.id))
      .innerJoin(bankAccounts, eq(payments.rekeningBankId, bankAccounts.id))
      .where(kondisi)
      .orderBy(desc(payments.tanggal), desc(payments.nomor))
      .limit(ukuran)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(payments)
      .innerJoin(partners, eq(payments.kontakId, partners.id))
      .innerJoin(bankAccounts, eq(payments.rekeningBankId, bankAccounts.id))
      .where(kondisi),
  ]);

  return {
    data: data.map((d) => ({
      ...d.pembayaran,
      kontak: { id: d.pembayaran.kontakId, kode: d.kontakKode, nama: d.kontakNama },
      rekeningBank: {
        id: d.pembayaran.rekeningBankId,
        kode: d.bankKode,
        namaBank: d.bankNama,
        akunCoaId: d.bankAkunCoaId,
      },
    })),
    total: hitungTotal?.total ?? 0,
    halaman,
    ukuran,
  };
}

/* ================================================================== */
/* PEMBUATAN & PENGUBAHAN PEMBAYARAN                                  */
/* ================================================================== */

export async function buatPembayaran(input: InputSimpanPembayaran, oleh: string) {
  const kontak = await ambilKontak(input.kontakId);
  if (input.jenis === "PENERIMAAN" && !kontak.adalahPelanggan) {
    throw galat.aturanBisnis("Kontak untuk penerimaan pembayaran harus berupa pelanggan.");
  }
  if (input.jenis === "PENGELUARAN" && !kontak.adalahPemasok) {
    throw galat.aturanBisnis("Kontak untuk pengeluaran pembayaran harus berupa pemasok.");
  }

  const [rekening] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.rekeningBankId));
  if (!rekening || !rekening.aktif) {
    throw galat.tidakDitemukan("Rekening kas/bank aktif");
  }

  const jumlahBayarInt = keBigInt(input.jumlah);
  if (jumlahBayarInt <= BigInt(0)) {
    throw galat.aturanBisnis("Jumlah pembayaran harus lebih dari 0.");
  }

  // Validasi total alokasi
  let totalAlokasiBayarInt = BigInt(0);
  for (let i = 0; i < input.alokasi.length; i++) {
    const a = input.alokasi[i]!;
    const docs = [a.fakturPenjualanId, a.fakturPembelianId, a.biayaId].filter(Boolean);
    if (docs.length !== 1) {
      throw galat.aturanBisnis(`Alokasi baris ${i + 1}: wajib memilih tepat satu dokumen (faktur atau biaya).`);
    }

    const bayarBarisInt = keBigInt(a.jumlah);
    if (bayarBarisInt <= BigInt(0)) {
      throw galat.aturanBisnis(`Alokasi baris ${i + 1}: jumlah alokasi harus lebih dari 0.`);
    }
    const potonganBarisInt = keBigInt(a.potongan ?? "0");
    if (potonganBarisInt < BigInt(0)) {
      throw galat.aturanBisnis(`Alokasi baris ${i + 1}: potongan tidak boleh negatif.`);
    }

    if (a.akunPotonganId) {
      await pastikanAkunDetail(a.akunPotonganId, { label: `Akun potongan baris ${i + 1}` });
    }

    totalAlokasiBayarInt += bayarBarisInt;
  }

  if (jumlahBayarInt !== totalAlokasiBayarInt) {
    throw galat.aturanBisnis(
      `Total pembayaran (${input.jumlah}) harus sama persis dengan total alokasi kas (${keString(totalAlokasiBayarInt)}).`,
    );
  }

  const mu = await tentukanMataUangKurs({
    mataUangId: input.mataUangId ?? rekening.mataUangId,
    kurs: input.kurs,
    tanggal: input.tanggal,
  });

  return db.transaction(async (tx) => {
    const prefiks = input.jenis === "PENERIMAAN" ? PREFIKS.PENERIMAAN : PREFIKS.PENGELUARAN;
    const nomor = await nomorBerikut(tx, prefiks, input.tanggal);

    const [pembayaran] = await tx
      .insert(payments)
      .values({
        nomor,
        tanggal: input.tanggal,
        jenis: input.jenis,
        kontakId: input.kontakId,
        rekeningBankId: input.rekeningBankId,
        referensi: nullJikaKosong(input.referensi),
        catatan: nullJikaKosong(input.catatan),
        mataUangId: mu.mataUangId,
        kurs: mu.kurs,
        jumlah: input.jumlah,
        status: "DRAFT",
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    await tx.insert(paymentAllocations).values(
      input.alokasi.map((a) => ({
        pembayaranId: pembayaran!.id,
        fakturPenjualanId: a.fakturPenjualanId ?? null,
        fakturPembelianId: a.fakturPembelianId ?? null,
        biayaId: a.biayaId ?? null,
        jumlah: a.jumlah,
        potongan: a.potongan ?? "0",
        akunPotonganId: a.akunPotonganId ?? null,
        selisihKurs: "0",
      })),
    );

    return ambilPembayaran(pembayaran!.id, tx);
  });
}

export async function ubahPembayaran(id: string, input: InputSimpanPembayaran, oleh: string) {
  const ada = await ambilPembayaran(id);
  if (ada.status !== "DRAFT") {
    throw galat.aturanBisnis(`Pembayaran ${ada.nomor} berstatus ${ada.status} dan tidak dapat diubah.`);
  }

  const kontak = await ambilKontak(input.kontakId);
  if (input.jenis === "PENERIMAAN" && !kontak.adalahPelanggan) {
    throw galat.aturanBisnis("Kontak untuk penerimaan pembayaran harus berupa pelanggan.");
  }
  if (input.jenis === "PENGELUARAN" && !kontak.adalahPemasok) {
    throw galat.aturanBisnis("Kontak untuk pengeluaran pembayaran harus berupa pemasok.");
  }

  const [rekening] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.rekeningBankId));
  if (!rekening || !rekening.aktif) {
    throw galat.tidakDitemukan("Rekening kas/bank aktif");
  }

  const jumlahBayarInt = keBigInt(input.jumlah);
  if (jumlahBayarInt <= BigInt(0)) {
    throw galat.aturanBisnis("Jumlah pembayaran harus lebih dari 0.");
  }

  let totalAlokasiBayarInt = BigInt(0);
  for (let i = 0; i < input.alokasi.length; i++) {
    const a = input.alokasi[i]!;
    const docs = [a.fakturPenjualanId, a.fakturPembelianId, a.biayaId].filter(Boolean);
    if (docs.length !== 1) {
      throw galat.aturanBisnis(`Alokasi baris ${i + 1}: wajib memilih tepat satu dokumen.`);
    }

    const bayarBarisInt = keBigInt(a.jumlah);
    if (bayarBarisInt <= BigInt(0)) {
      throw galat.aturanBisnis(`Alokasi baris ${i + 1}: jumlah alokasi harus lebih dari 0.`);
    }
    const potonganBarisInt = keBigInt(a.potongan ?? "0");
    if (potonganBarisInt < BigInt(0)) {
      throw galat.aturanBisnis(`Alokasi baris ${i + 1}: potongan tidak boleh negatif.`);
    }

    if (a.akunPotonganId) {
      await pastikanAkunDetail(a.akunPotonganId, { label: `Akun potongan baris ${i + 1}` });
    }

    totalAlokasiBayarInt += bayarBarisInt;
  }

  if (jumlahBayarInt !== totalAlokasiBayarInt) {
    throw galat.aturanBisnis(
      `Total pembayaran (${input.jumlah}) harus sama persis dengan total alokasi kas (${keString(totalAlokasiBayarInt)}).`,
    );
  }

  const mu = await tentukanMataUangKurs({
    mataUangId: input.mataUangId ?? rekening.mataUangId,
    kurs: input.kurs,
    tanggal: input.tanggal,
  });

  return db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({
        tanggal: input.tanggal,
        jenis: input.jenis,
        kontakId: input.kontakId,
        rekeningBankId: input.rekeningBankId,
        referensi: nullJikaKosong(input.referensi),
        catatan: nullJikaKosong(input.catatan),
        mataUangId: mu.mataUangId,
        kurs: mu.kurs,
        jumlah: input.jumlah,
        diubahOleh: oleh,
      })
      .where(eq(payments.id, id));

    await tx.delete(paymentAllocations).where(eq(paymentAllocations.pembayaranId, id));
    await tx.insert(paymentAllocations).values(
      input.alokasi.map((a) => ({
        pembayaranId: id,
        fakturPenjualanId: a.fakturPenjualanId ?? null,
        fakturPembelianId: a.fakturPembelianId ?? null,
        biayaId: a.biayaId ?? null,
        jumlah: a.jumlah,
        potongan: a.potongan ?? "0",
        akunPotonganId: a.akunPotonganId ?? null,
        selisihKurs: "0",
      })),
    );

    return ambilPembayaran(id, tx);
  });
}

/* ================================================================== */
/* POSTING PEMBAYARAN                                                 */
/* ================================================================== */

export async function postingPembayaran(id: string, oleh: string) {
  return db.transaction(async (tx) => {
    const [pembayaran] = await tx.select().from(payments).where(eq(payments.id, id)).for("update");
    if (!pembayaran) throw galat.tidakDitemukan("Pembayaran");
    if (pembayaran.status !== "DRAFT") {
      throw galat.aturanBisnis(`Pembayaran ${pembayaran.nomor} berstatus ${pembayaran.status} dan tidak dapat diposting.`);
    }

    const [rekening] = await tx
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, pembayaran.rekeningBankId))
      .for("update");
    if (!rekening || !rekening.aktif) throw galat.aturanBisnis("Rekening kas/bank tidak aktif.");

    const alokasiList = await tx
      .select()
      .from(paymentAllocations)
      .where(eq(paymentAllocations.pembayaranId, id));
    if (alokasiList.length === 0) throw galat.aturanBisnis("Pembayaran tidak memiliki alokasi dokumen.");

    const kursBayarInt = keBigInt(pembayaran.kurs, SKALA_KURS);
    const muDasar = await ambilMataUangDasar();

    const barisJurnal: BarisJurnalInput[] = [];

    /* -------------------------------------------------------------- */
    /* A. PENERIMAAN (CUSTOMER RECEIPT / PELUNASAN PIUTANG)           */
    /* -------------------------------------------------------------- */
    if (pembayaran.jenis === "PENERIMAAN") {
      const akunPiutang = await akunByPeran("PIUTANG_USAHA");

      // 1. Debit Kas/Bank (uang masuk ke rekening)
      barisJurnal.push({
        akunId: rekening.akunCoaId,
        debit: pembayaran.jumlah,
        mataUangId: pembayaran.mataUangId,
        kurs: pembayaran.kurs,
        deskripsi: `Penerimaan kas/bank ${pembayaran.nomor}`,
      });

      for (const a of alokasiList) {
        if (!a.fakturPenjualanId) {
          throw galat.aturanBisnis("Penerimaan pembayaran hanya dapat dialokasikan ke faktur penjualan.");
        }

        const [faktur] = await tx
          .select()
          .from(salesInvoices)
          .where(eq(salesInvoices.id, a.fakturPenjualanId))
          .for("update");
        if (!faktur || faktur.status !== "POSTED") {
          throw galat.aturanBisnis(`Faktur penjualan ${faktur?.nomor ?? a.fakturPenjualanId} belum diposting.`);
        }

        const bayarBarisInt = keBigInt(a.jumlah);
        const potonganBarisInt = keBigInt(a.potongan);
        const totalDilunasiInt = bayarBarisInt + potonganBarisInt;
        const sisaTagihanFakturInt = keBigInt(faktur.sisaTagihan);

        if (totalDilunasiInt > sisaTagihanFakturInt) {
          throw galat.aturanBisnis(
            `Total alokasi (${keString(totalDilunasiInt)}) melebihi sisa tagihan faktur ${faktur.nomor} (${faktur.sisaTagihan}).`,
          );
        }

        // Potongan Pelunasan (Beban/Diskon yang diberikan ke pelanggan)
        if (potonganBarisInt > BigInt(0)) {
          let akunPotonganId = a.akunPotonganId;
          if (!akunPotonganId) {
            akunPotonganId = (await ambilAkunPotonganPenjualanDefault()).id;
          }
          barisJurnal.push({
            akunId: akunPotonganId,
            debit: a.potongan,
            mataUangId: faktur.mataUangId,
            kurs: faktur.kurs,
            deskripsi: `Potongan pelunasan faktur ${faktur.nomor}`,
          });
        }

        // Hitung Selisih Kurs Terealisasi pada bagian kas yang dibayar
        const kursFakturInt = keBigInt(faktur.kurs, SKALA_KURS);
        const kasDasarPadaKursBayar = kaliKurs(bayarBarisInt, kursBayarInt);
        const kasDasarPadaKursFaktur = kaliKurs(bayarBarisInt, kursFakturInt);
        const selisihKursDasar = kasDasarPadaKursBayar - kasDasarPadaKursFaktur;

        // Piutang Usaha dikredit sebesar nilai piutang yang dilunasi
        barisJurnal.push({
          akunId: akunPiutang.id,
          kredit: keString(totalDilunasiInt),
          mataUangId: faktur.mataUangId,
          kurs: faktur.kurs,
          kontakId: pembayaran.kontakId,
          deskripsi: `Pelunasan piutang faktur ${faktur.nomor}`,
        });

        // Pengakuan Laba / Rugi Selisih Kurs Terealisasi
        if (selisihKursDasar > BigInt(0)) {
          const akunLabaKurs = await akunByPeran("LABA_SELISIH_KURS");
          barisJurnal.push({
            akunId: akunLabaKurs.id,
            kredit: keString(selisihKursDasar),
            mataUangId: muDasar.id,
            kurs: "1",
            deskripsi: `Laba selisih kurs pelunasan ${faktur.nomor}`,
          });
        } else if (selisihKursDasar < BigInt(0)) {
          const akunRugiKurs = await akunByPeran("RUGI_SELISIH_KURS");
          barisJurnal.push({
            akunId: akunRugiKurs.id,
            debit: keString(-selisihKursDasar),
            mataUangId: muDasar.id,
            kurs: "1",
            deskripsi: `Rugi selisih kurs pelunasan ${faktur.nomor}`,
          });
        }

        // Catat selisih kurs pada baris alokasi
        await tx
          .update(paymentAllocations)
          .set({ selisihKurs: keString(selisihKursDasar) })
          .where(eq(paymentAllocations.id, a.id));

        // Kurangi sisa tagihan pada faktur
        const sisaTagihanBaru = sisaTagihanFakturInt - totalDilunasiInt;
        await tx
          .update(salesInvoices)
          .set({
            sisaTagihan: keString(sisaTagihanBaru),
            diubahOleh: oleh,
          })
          .where(eq(salesInvoices.id, faktur.id));
      }
    }

    /* -------------------------------------------------------------- */
    /* B. PENGELUARAN (VENDOR PAYMENT / PELUNASAN HUTANG)             */
    /* -------------------------------------------------------------- */
    if (pembayaran.jenis === "PENGELUARAN") {
      const akunHutang = await akunByPeran("HUTANG_USAHA");

      // 1. Kredit Kas/Bank (uang keluar dari rekening)
      barisJurnal.push({
        akunId: rekening.akunCoaId,
        kredit: pembayaran.jumlah,
        mataUangId: pembayaran.mataUangId,
        kurs: pembayaran.kurs,
        deskripsi: `Pengeluaran kas/bank ${pembayaran.nomor}`,
      });

      for (const a of alokasiList) {
        let kursDocInt = kursBayarInt;
        let kursDocStr = pembayaran.kurs;
        let mataUangIdDoc = pembayaran.mataUangId;
        let sisaTagihanDocInt = BigInt(0);
        let nomorDoc = "";

        if (a.fakturPembelianId) {
          const [faktur] = await tx
            .select()
            .from(purchaseInvoices)
            .where(eq(purchaseInvoices.id, a.fakturPembelianId))
            .for("update");
          if (!faktur || faktur.status !== "POSTED") {
            throw galat.aturanBisnis(`Faktur pembelian ${faktur?.nomor ?? a.fakturPembelianId} belum diposting.`);
          }
          kursDocInt = keBigInt(faktur.kurs, SKALA_KURS);
          kursDocStr = faktur.kurs;
          mataUangIdDoc = faktur.mataUangId;
          sisaTagihanDocInt = keBigInt(faktur.sisaTagihan);
          nomorDoc = faktur.nomor;
        } else if (a.biayaId) {
          const [biaya] = await tx
            .select()
            .from(expenses)
            .where(eq(expenses.id, a.biayaId))
            .for("update");
          if (!biaya || biaya.status !== "POSTED") {
            throw galat.aturanBisnis(`Biaya ${biaya?.nomor ?? a.biayaId} belum diposting.`);
          }
          if (biaya.metodeBayar !== "HUTANG") {
            throw galat.aturanBisnis(`Biaya ${biaya.nomor} bukan metode HUTANG.`);
          }
          kursDocInt = keBigInt(biaya.kurs, SKALA_KURS);
          kursDocStr = biaya.kurs;
          mataUangIdDoc = biaya.mataUangId;
          sisaTagihanDocInt = keBigInt(biaya.sisaTagihan);
          nomorDoc = biaya.nomor;
        } else {
          throw galat.aturanBisnis("Pengeluaran pembayaran harus dialokasikan ke faktur pembelian atau biaya hutang.");
        }

        const bayarBarisInt = keBigInt(a.jumlah);
        const potonganBarisInt = keBigInt(a.potongan);
        const totalDilunasiInt = bayarBarisInt + potonganBarisInt;

        if (totalDilunasiInt > sisaTagihanDocInt) {
          throw galat.aturanBisnis(
            `Total alokasi (${keString(totalDilunasiInt)}) melebihi sisa tagihan ${nomorDoc} (${keString(sisaTagihanDocInt)}).`,
          );
        }

        // Debit Hutang Usaha (pengurangan kewajiban)
        barisJurnal.push({
          akunId: akunHutang.id,
          debit: keString(totalDilunasiInt),
          mataUangId: mataUangIdDoc,
          kurs: kursDocStr,
          kontakId: pembayaran.kontakId,
          deskripsi: `Pelunasan hutang tagihan ${nomorDoc}`,
        });

        // Potongan Pembelian (Pendapatan/Diskon yang diperoleh dari pemasok)
        if (potonganBarisInt > BigInt(0)) {
          let akunPotonganId = a.akunPotonganId;
          if (!akunPotonganId) {
            akunPotonganId = (await akunByPeran("HARGA_POKOK_PENJUALAN")).id;
          }
          barisJurnal.push({
            akunId: akunPotonganId,
            kredit: a.potongan,
            mataUangId: mataUangIdDoc,
            kurs: kursDocStr,
            deskripsi: `Potongan pembayaran tagihan ${nomorDoc}`,
          });
        }

        // Hitung Selisih Kurs Terealisasi pada hutang:
        // Jika kurs bayar < kurs faktur, kita membayar lebih sedikit dalam mata uang dasar -> LABA
        const kasDasarPadaKursBayar = kaliKurs(bayarBarisInt, kursBayarInt);
        const kasDasarPadaKursDoc = kaliKurs(bayarBarisInt, kursDocInt);
        const selisihKursDasar = kasDasarPadaKursDoc - kasDasarPadaKursBayar;

        if (selisihKursDasar > BigInt(0)) {
          const akunLabaKurs = await akunByPeran("LABA_SELISIH_KURS");
          barisJurnal.push({
            akunId: akunLabaKurs.id,
            kredit: keString(selisihKursDasar),
            mataUangId: muDasar.id,
            kurs: "1",
            deskripsi: `Laba selisih kurs pelunasan ${nomorDoc}`,
          });
        } else if (selisihKursDasar < BigInt(0)) {
          const akunRugiKurs = await akunByPeran("RUGI_SELISIH_KURS");
          barisJurnal.push({
            akunId: akunRugiKurs.id,
            debit: keString(-selisihKursDasar),
            mataUangId: muDasar.id,
            kurs: "1",
            deskripsi: `Rugi selisih kurs pelunasan ${nomorDoc}`,
          });
        }

        await tx
          .update(paymentAllocations)
          .set({ selisihKurs: keString(selisihKursDasar) })
          .where(eq(paymentAllocations.id, a.id));

        // Kurangi sisa tagihan pada dokumen terkait
        const sisaTagihanBaru = sisaTagihanDocInt - totalDilunasiInt;
        if (a.fakturPembelianId) {
          await tx
            .update(purchaseInvoices)
            .set({ sisaTagihan: keString(sisaTagihanBaru), diubahOleh: oleh })
            .where(eq(purchaseInvoices.id, a.fakturPembelianId));
        } else if (a.biayaId) {
          await tx
            .update(expenses)
            .set({ sisaTagihan: keString(sisaTagihanBaru), diubahOleh: oleh })
            .where(eq(expenses.id, a.biayaId));
        }
      }
    }

    // 2. Simpan Jurnal Double Entry
    const jurnal = await simpanJurnal(
      tx,
      {
        tanggal: pembayaran.tanggal,
        deskripsi: `${pembayaran.jenis === "PENERIMAAN" ? "Penerimaan" : "Pengeluaran"} Pembayaran ${pembayaran.nomor}`,
        referensi: pembayaran.referensi,
        sumber: "PEMBAYARAN",
        sumberId: pembayaran.id,
        mataUangId: pembayaran.mataUangId,
        kurs: pembayaran.kurs,
        posting: true,
        baris: barisJurnal,
      },
      oleh,
    );

    // 3. Update Header Pembayaran ke POSTED
    await tx
      .update(payments)
      .set({
        status: "POSTED",
        jurnalId: jurnal.id,
        dipostingOleh: oleh,
        dipostingPada: new Date(),
        diubahOleh: oleh,
      })
      .where(eq(payments.id, id));

    return ambilPembayaran(id, tx);
  });
}

/* ================================================================== */
/* PEMBATALAN PEMBAYARAN                                              */
/* ================================================================== */

export async function batalkanPembayaran(id: string, input: InputBatal, oleh: string) {
  return db.transaction(async (tx) => {
    const [pembayaran] = await tx.select().from(payments).where(eq(payments.id, id)).for("update");
    if (!pembayaran) throw galat.tidakDitemukan("Pembayaran");
    if (pembayaran.status !== "POSTED") {
      throw galat.aturanBisnis(`Pembayaran ${pembayaran.nomor} berstatus ${pembayaran.status} dan tidak dapat dibatalkan.`);
    }

    // 1. Balik Jurnal
    const tanggalBatal = input.tanggal ?? pembayaran.tanggal;
    const jurnalPembalik = await balikJurnal(
      tx,
      pembayaran.jurnalId!,
      {
        tanggal: tanggalBatal,
        deskripsi: input.deskripsi ?? `Pembalikan Pembayaran ${pembayaran.nomor}`,
        sumber: "PEMBAYARAN",
      },
      oleh,
    );

    // 2. Kembalikan sisa tagihan pada semua dokumen yang dialokasikan
    const alokasiList = await tx
      .select()
      .from(paymentAllocations)
      .where(eq(paymentAllocations.pembayaranId, id));

    for (const a of alokasiList) {
      const totalKembaliInt = keBigInt(a.jumlah) + keBigInt(a.potongan);

      if (a.fakturPenjualanId) {
        const [faktur] = await tx
          .select()
          .from(salesInvoices)
          .where(eq(salesInvoices.id, a.fakturPenjualanId))
          .for("update");
        if (faktur) {
          const sisaBaru = keBigInt(faktur.sisaTagihan) + totalKembaliInt;
          await tx
            .update(salesInvoices)
            .set({ sisaTagihan: keString(sisaBaru), diubahOleh: oleh })
            .where(eq(salesInvoices.id, a.fakturPenjualanId));
        }
      } else if (a.fakturPembelianId) {
        const [faktur] = await tx
          .select()
          .from(purchaseInvoices)
          .where(eq(purchaseInvoices.id, a.fakturPembelianId))
          .for("update");
        if (faktur) {
          const sisaBaru = keBigInt(faktur.sisaTagihan) + totalKembaliInt;
          await tx
            .update(purchaseInvoices)
            .set({ sisaTagihan: keString(sisaBaru), diubahOleh: oleh })
            .where(eq(purchaseInvoices.id, a.fakturPembelianId));
        }
      } else if (a.biayaId) {
        const [biaya] = await tx
          .select()
          .from(expenses)
          .where(eq(expenses.id, a.biayaId))
          .for("update");
        if (biaya) {
          const sisaBaru = keBigInt(biaya.sisaTagihan) + totalKembaliInt;
          await tx
            .update(expenses)
            .set({ sisaTagihan: keString(sisaBaru), diubahOleh: oleh })
            .where(eq(expenses.id, a.biayaId));
        }
      }
    }

    // 3. Update status pembayaran ke DIBATALKAN
    await tx
      .update(payments)
      .set({
        status: "DIBATALKAN",
        diubahOleh: oleh,
      })
      .where(eq(payments.id, id));

    return {
      ...(await ambilPembayaran(id, tx)),
      jurnalPembalikId: jurnalPembalik.id,
    };
  });
}
