import { and, desc, eq } from "drizzle-orm";
import {
  chartOfAccounts,
  journalEntries,
  journalItems,
  purchaseInvoices,
  salesInvoices,
} from "@/db/schema/keuangan";
import { db } from "../shared/context";
import { galat } from "@/server/core/errors";
import { akunByPeran, daftarAkun } from "../akun/service";
import { ambilMataUangDasar } from "../mata-uang/service";
import { ambilKontak } from "../kontak/service";
import { ambilItem } from "../inventori/service";
import { catatMutasiStok } from "../inventori/mutasi";
import { simpanJurnal, type BarisJurnalInput } from "../jurnal/engine";
import { keBigInt, keString } from "../shared/decimal";
import { nullJikaKosong } from "../shared/text";
import { PREFIKS, nomorBerikut } from "../shared/transaction";
import type {
  InputSimpanSaldoAwalAkun,
  InputSimpanSaldoAwalHutang,
  InputSimpanSaldoAwalPiutang,
  InputSimpanSaldoAwalStok,
} from "./model";

/* -------------------------- Saldo Awal Akun -------------------------- */

export async function ambilSaldoAwalAkun() {
  const [jurnal] = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.sumber, "SALDO_AWAL"), eq(journalEntries.status, "POSTED")))
    .orderBy(desc(journalEntries.tanggal))
    .limit(1);

  if (jurnal) {
    const baris = await db
      .select({
        id: journalItems.id,
        akunId: journalItems.akunId,
        akunKode: chartOfAccounts.kode,
        akunNama: chartOfAccounts.nama,
        tipeAkun: chartOfAccounts.tipeAkun,
        debit: journalItems.debit,
        kredit: journalItems.kredit,
        deskripsi: journalItems.deskripsi,
      })
      .from(journalItems)
      .innerJoin(chartOfAccounts, eq(journalItems.akunId, chartOfAccounts.id))
      .where(eq(journalItems.jurnalId, jurnal.id))
      .orderBy(chartOfAccounts.kode);

    return {
      sudahDiposting: true,
      jurnal,
      daftarBaris: baris,
    };
  }

  // Belum diposting: tampilkan template akun-akun riil (Neraca)
  const coa = await daftarAkun({ aktif: true });
  const akunNeraca = coa
    .filter((a) => a.bisaDiposting && (a.tipeAkun === "ASET" || a.tipeAkun === "KEWAJIBAN" || a.tipeAkun === "EKUITAS"))
    .map((a) => ({
      akunId: a.id,
      akunKode: a.kode,
      akunNama: a.nama,
      tipeAkun: a.tipeAkun,
      normalBalance: a.normalBalance,
      debit: "0",
      kredit: "0",
      deskripsi: "Saldo awal",
    }));

  return {
    sudahDiposting: false,
    jurnal: null,
    daftarBaris: akunNeraca,
  };
}

export async function simpanSaldoAwalAkun(input: InputSimpanSaldoAwalAkun, oleh: string) {
  const [sudahAda] = await db
    .select({ id: journalEntries.id, nomor: journalEntries.nomor })
    .from(journalEntries)
    .where(and(eq(journalEntries.sumber, "SALDO_AWAL"), eq(journalEntries.status, "POSTED")))
    .limit(1);

  if (sudahAda) {
    throw galat.aturanBisnis(
      `Saldo awal buku besar sudah pernah diposting dengan nomor ${sudahAda.nomor}. Batalkan jurnal tersebut bila ingin memasukkan ulang.`,
    );
  }

  const mataUangDasar = await ambilMataUangDasar();
  let totalDebitBig = BigInt(0);
  let totalKreditBig = BigInt(0);

  const barisBersih: BarisJurnalInput[] = [];

  for (const b of input.daftarBaris) {
    const deb = keBigInt(b.debit ?? "0");
    const kre = keBigInt(b.kredit ?? "0");
    if (deb === BigInt(0) && kre === BigInt(0)) continue;

    if (deb > BigInt(0) && kre > BigInt(0)) {
      throw galat.aturanBisnis("Setiap baris akun hanya boleh memiliki salah satu nilai debit atau kredit.");
    }

    totalDebitBig += deb;
    totalKreditBig += kre;

    barisBersih.push({
      akunId: b.akunId,
      debit: deb > BigInt(0) ? keString(deb) : undefined,
      kredit: kre > BigInt(0) ? keString(kre) : undefined,
      deskripsi: nullJikaKosong(b.deskripsi) ?? "Saldo awal akun",
      mataUangId: mataUangDasar.id,
      kurs: "1.00000000",
    });
  }

  if (barisBersih.length === 0) {
    throw galat.aturanBisnis("Minimal harus ada satu baris saldo awal yang tidak nol.");
  }

  // Selisih pembuka ditampung otomatis ke Ekuitas Saldo Awal agar debit = kredit
  const selisihBig = totalDebitBig - totalKreditBig;
  if (selisihBig !== BigInt(0)) {
    let akunEkuitas;
    try {
      akunEkuitas = await akunByPeran("EKUITAS_SALDO_AWAL");
    } catch {
      try {
        akunEkuitas = await akunByPeran("MODAL_DISETOR");
      } catch {
        akunEkuitas = await akunByPeran("LABA_DITAHAN");
      }
    }

    if (selisihBig > BigInt(0)) {
      // Debit > Kredit -> Kredit ke Ekuitas
      barisBersih.push({
        akunId: akunEkuitas.id,
        kredit: keString(selisihBig),
        deskripsi: "Penyeimbang saldo awal ekuitas (Opening Balance Equity)",
        mataUangId: mataUangDasar.id,
        kurs: "1.00000000",
      });
    } else {
      // Kredit > Debit -> Debit ke Ekuitas
      barisBersih.push({
        akunId: akunEkuitas.id,
        debit: keString(-selisihBig),
        deskripsi: "Penyeimbang saldo awal ekuitas (Opening Balance Equity)",
        mataUangId: mataUangDasar.id,
        kurs: "1.00000000",
      });
    }
  }

  return db.transaction(async (tx) => {
    const nomor = await nomorBerikut(tx, PREFIKS.SALDO_AWAL, input.tanggal);
    const jurnal = await simpanJurnal(
      tx,
      {
        tanggal: input.tanggal,
        deskripsi: nullJikaKosong(input.keterangan) ?? `Saldo awal buku besar per ${input.tanggal}`,
        referensi: nomor,
        sumber: "SALDO_AWAL",
        mataUangId: mataUangDasar.id,
        kurs: "1.00000000",
        baris: barisBersih,
        posting: true,
      },
      oleh,
    );

    return jurnal;
  });
}

/* ------------------------- Saldo Awal Piutang ------------------------- */

export async function simpanSaldoAwalPiutang(input: InputSimpanSaldoAwalPiutang, oleh: string) {
  if (input.daftarFaktur.length === 0) {
    throw galat.aturanBisnis("Daftar faktur saldo awal tidak boleh kosong.");
  }

  const mataUangDasar = await ambilMataUangDasar();

  return db.transaction(async (tx) => {
    const hasil = [];

    for (const f of input.daftarFaktur) {
      const kontak = await ambilKontak(f.kontakId);
      if (!kontak.adalahPelanggan) {
        throw galat.aturanBisnis(`Kontak ${kontak.nama} bukan berstatus pelanggan.`);
      }

      const jml = keBigInt(f.jumlah);
      if (jml <= BigInt(0)) throw galat.aturanBisnis("Nominal faktur saldo awal harus lebih dari nol.");

      const [baru] = await tx
        .insert(salesInvoices)
        .values({
          nomor: f.nomorFaktur.trim().toUpperCase(),
          tanggal: f.tanggal,
          tanggalJatuhTempo: f.tanggalJatuhTempo,
          pelangganId: f.kontakId,
          catatan: nullJikaKosong(f.catatan) ?? "Saldo awal piutang pelanggan",
          mataUangId: mataUangDasar.id,
          kurs: "1.00000000",
          subtotal: f.jumlah,
          persenPpn: "0",
          ppn: "0",
          total: f.jumlah,
          sisaTagihan: f.jumlah,
          status: "POSTED",
          dipostingOleh: oleh,
          dipostingPada: new Date(),
          dibuatOleh: oleh,
          diubahOleh: oleh,
        })
        .returning();

      hasil.push(baru!);
    }

    return hasil;
  });
}

/* -------------------------- Saldo Awal Hutang -------------------------- */

export async function simpanSaldoAwalHutang(input: InputSimpanSaldoAwalHutang, oleh: string) {
  if (input.daftarTagihan.length === 0) {
    throw galat.aturanBisnis("Daftar tagihan saldo awal tidak boleh kosong.");
  }

  const mataUangDasar = await ambilMataUangDasar();

  return db.transaction(async (tx) => {
    const hasil = [];

    for (const t of input.daftarTagihan) {
      const kontak = await ambilKontak(t.kontakId);
      if (!kontak.adalahPemasok) {
        throw galat.aturanBisnis(`Kontak ${kontak.nama} bukan berstatus pemasok.`);
      }

      const jml = keBigInt(t.jumlah);
      if (jml <= BigInt(0)) throw galat.aturanBisnis("Nominal tagihan saldo awal harus lebih dari nol.");

      const nomor = await nomorBerikut(tx, PREFIKS.FAKTUR_PEMBELIAN, t.tanggal);

      const [baru] = await tx
        .insert(purchaseInvoices)
        .values({
          nomor,
          nomorFakturPemasok: t.nomorFakturPemasok.trim(),
          tanggal: t.tanggal,
          tanggalJatuhTempo: t.tanggalJatuhTempo,
          pemasokId: t.kontakId,
          catatan: nullJikaKosong(t.catatan) ?? "Saldo awal hutang pemasok",
          mataUangId: mataUangDasar.id,
          kurs: "1.00000000",
          subtotal: t.jumlah,
          persenPpn: "0",
          ppn: "0",
          total: t.jumlah,
          sisaTagihan: t.jumlah,
          status: "POSTED",
          dipostingOleh: oleh,
          dipostingPada: new Date(),
          dibuatOleh: oleh,
          diubahOleh: oleh,
        })
        .returning();

      hasil.push(baru!);
    }

    return hasil;
  });
}

/* ------------------------ Saldo Awal Persediaan ------------------------ */

export async function simpanSaldoAwalStok(input: InputSimpanSaldoAwalStok, oleh: string) {
  if (input.daftarItem.length === 0) {
    throw galat.aturanBisnis("Daftar item saldo awal persediaan tidak boleh kosong.");
  }

  return db.transaction(async (tx) => {
    const hasil = [];

    for (const d of input.daftarItem) {
      const item = await ambilItem(d.itemId);
      if (item.tipeBarang !== "BARANG_PERSEDIAAN") {
        throw galat.aturanBisnis(`Item ${item.nama} bukan barang persediaan.`);
      }

      const mutasi = await catatMutasiStok(tx, {
        tanggal: input.tanggal,
        itemId: item.id,
        jenis: "MASUK",
        kuantitas: d.kuantitas,
        biayaSatuan: d.biayaSatuan,
        sumber: "SALDO_AWAL",
        sumberId: item.id,
        keterangan: nullJikaKosong(d.keterangan) ?? "Saldo awal persediaan",
        oleh,
      });

      hasil.push({
        itemId: item.id,
        sku: item.sku,
        nama: item.nama,
        kuantitas: d.kuantitas,
        biayaSatuan: d.biayaSatuan,
        nilai: keString(mutasi.nilai),
        saldoKuantitas: keString(mutasi.saldoKuantitas),
        biayaRataRata: keString(mutasi.biayaRataRata),
      });
    }

    return hasil;
  });
}
