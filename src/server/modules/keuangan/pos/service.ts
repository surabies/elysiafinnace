import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../shared/context";
import {
  bankAccounts,
  chartOfAccounts,
  itemStocks,
  posOrderItems,
  posOrders,
  posRegisters,
  posShifts,
  stockMovements,
  warehouses,
  type MesinKasirPos,
  type ShiftPos,
} from "@/db/schema/keuangan";
import { galat } from "@/server/core/errors";
import { keBigInt, keString } from "../shared/decimal";
import { simpanJurnal } from "../jurnal/engine";
import { bacaHalaman } from "../shared/pagination";
import type {
  BukaShiftInput,
  QueryShiftInput,
  SimpanOrderPosInput,
  SimpanRegisterInput,
  TutupShiftInput,
} from "./model";

// ==========================================
// 1. TERMINAL / REGISTER KASIR
// ==========================================

export async function daftarRegister(): Promise<MesinKasirPos[]> {
  return await db
    .select({
      id: posRegisters.id,
      kode: posRegisters.kode,
      nama: posRegisters.nama,
      gudangId: posRegisters.gudangId,
      gudangNama: warehouses.nama,
      akunKasId: posRegisters.akunKasId,
      akunKasNama: bankAccounts.nama,
      keterangan: posRegisters.keterangan,
      aktif: posRegisters.aktif,
      dibuatOleh: posRegisters.dibuatOleh,
      diubahOleh: posRegisters.diubahOleh,
      dibuatPada: posRegisters.dibuatPada,
      diubahPada: posRegisters.diubahPada,
    })
    .from(posRegisters)
    .innerJoin(warehouses, eq(posRegisters.gudangId, warehouses.id))
    .innerJoin(bankAccounts, eq(posRegisters.akunKasId, bankAccounts.id))
    .orderBy(asc(posRegisters.kode));
}

export async function simpanRegister(input: SimpanRegisterInput, oleh: string): Promise<MesinKasirPos> {
  const kodeBersih = input.kode.trim().toUpperCase();

  const [ada] = await db.select({ id: posRegisters.id }).from(posRegisters).where(eq(posRegisters.kode, kodeBersih));
  if (ada) throw galat.aturanBisnis(`Register kasir dengan kode '${kodeBersih}' sudah terdaftar.`);

  const [baru] = await db
    .insert(posRegisters)
    .values({
      kode: kodeBersih,
      nama: input.nama.trim(),
      gudangId: input.gudangId,
      akunKasId: input.akunKasId,
      keterangan: input.keterangan?.trim() || null,
      aktif: input.aktif ?? true,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();

  if (!baru) throw galat.aturanBisnis("Gagal membuat data register kasir.");
  return baru;
}

// ==========================================
// 2. SHIFT KASIR (BUKA & TUTUP)
// ==========================================

export async function ambilShiftAktif(registerId: string): Promise<ShiftPos | null> {
  const [shift] = await db
    .select()
    .from(posShifts)
    .where(and(eq(posShifts.registerId, registerId), eq(posShifts.status, "BUKA")))
    .orderBy(desc(posShifts.waktuBuka))
    .limit(1);

  return shift ?? null;
}

export async function bukaShift(input: BukaShiftInput, kasirId: string, kasirNama: string): Promise<ShiftPos> {
  const aktif = await ambilShiftAktif(input.registerId);
  if (aktif) {
    throw galat.aturanBisnis(`Register ini masih memiliki shift terbuka (Nomor: ${aktif.nomor}) oleh ${aktif.kasirNama}. Tutup shift terlebih dahulu.`);
  }

  const [totalShift] = await db.select({ total: count() }).from(posShifts);
  const urutan = ((totalShift?.total ?? 0) + 1).toString().padStart(4, "0");
  const nomorShift = `SHF-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${urutan}`;

  const [baru] = await db
    .insert(posShifts)
    .values({
      nomor: nomorShift,
      registerId: input.registerId,
      kasirId,
      kasirNama,
      kasAwal: input.kasAwal,
      status: "BUKA",
      catatan: input.catatan?.trim() || null,
    })
    .returning();

  if (!baru) throw galat.aturanBisnis("Gagal membuka shift kasir.");
  return baru;
}

export async function tutupShift(input: TutupShiftInput): Promise<ShiftPos> {
  const [shift] = await db.select().from(posShifts).where(eq(posShifts.id, input.shiftId));
  if (!shift) throw galat.tidakDitemukan("Shift Kasir");
  if (shift.status === "TUTUP") throw galat.aturanBisnis("Shift ini sudah ditutup sebelumnya.");

  // Hitung akumulasi penjualan selama shift ini berlangsung
  const orders = await db
    .select({
      total: posOrders.total,
      metodeBayar: posOrders.metodeBayar,
    })
    .from(posOrders)
    .where(and(eq(posOrders.shiftId, shift.id), eq(posOrders.status, "SELESAI")));

  let totalTunai = BigInt(0);
  let totalNonTunai = BigInt(0);

  for (const o of orders) {
    const val = keBigInt(o.total);
    if (o.metodeBayar === "TUNAI") {
      totalTunai += val;
    } else {
      totalNonTunai += val;
    }
  }

  const kasAwalBig = keBigInt(shift.kasAwal);
  const kasFisikBig = keBigInt(input.kasAkhirFisik);
  const kasSistemBig = kasAwalBig + totalTunai;
  const selisihBig = kasFisikBig - kasSistemBig;

  const [updated] = await db
    .update(posShifts)
    .set({
      waktuTutup: new Date(),
      kasAkhirFisik: input.kasAkhirFisik,
      totalPenjualanTunai: keString(totalTunai),
      totalPenjualanNonTunai: keString(totalNonTunai),
      totalTransaksi: orders.length,
      selisihKas: keString(selisihBig),
      status: "TUTUP",
      catatan: input.catatan?.trim() || shift.catatan,
      diubahPada: new Date(),
    })
    .where(eq(posShifts.id, shift.id))
    .returning();

  return updated!;
}

export async function daftarShift(query: QueryShiftInput) {
  const { halaman, ukuran, offset } = bacaHalaman(query);

  const conditions = [];
  if (query.registerId) conditions.push(eq(posShifts.registerId, query.registerId));
  if (query.status) conditions.push(eq(posShifts.status, query.status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db.select({ total: count() }).from(posShifts).where(whereClause);

  const items = await db
    .select({
      id: posShifts.id,
      nomor: posShifts.nomor,
      registerId: posShifts.registerId,
      registerNama: posRegisters.nama,
      kasirId: posShifts.kasirId,
      kasirNama: posShifts.kasirNama,
      waktuBuka: posShifts.waktuBuka,
      waktuTutup: posShifts.waktuTutup,
      kasAwal: posShifts.kasAwal,
      kasAkhirFisik: posShifts.kasAkhirFisik,
      totalPenjualanTunai: posShifts.totalPenjualanTunai,
      totalPenjualanNonTunai: posShifts.totalPenjualanNonTunai,
      totalTransaksi: posShifts.totalTransaksi,
      selisihKas: posShifts.selisihKas,
      status: posShifts.status,
      catatan: posShifts.catatan,
    })
    .from(posShifts)
    .innerJoin(posRegisters, eq(posShifts.registerId, posRegisters.id))
    .where(whereClause)
    .orderBy(desc(posShifts.waktuBuka))
    .limit(ukuran)
    .offset(offset);

  return {
    items,
    total: totalRow?.total ?? 0,
    halaman,
    ukuran,
    totalHalaman: Math.ceil((totalRow?.total ?? 0) / ukuran),
  };
}

// ==========================================
// 3. TRANSAKSI POS (CHECKOUT & THERMAL RECEIPT)
// ==========================================

export async function prosesTransaksiPos(input: SimpanOrderPosInput, kasirId: string, kasirNama: string) {
  const [shift] = await db.select().from(posShifts).where(eq(posShifts.id, input.shiftId));
  if (!shift || shift.status !== "BUKA") {
    throw galat.aturanBisnis("Shift kasir tidak aktif atau sudah ditutup.");
  }

  const [register] = await db.select().from(posRegisters).where(eq(posRegisters.id, input.registerId));
  if (!register) throw galat.tidakDitemukan("Register Kasir");

  const [akunKas] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, register.akunKasId));
  if (!akunKas) throw galat.tidakDitemukan("Akun Kas Kasir");

  // Ambil akun pendapatan (4100) & HPP (5100) & Persediaan (1140)
  const [akunPendapatan] = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(or(eq(chartOfAccounts.kode, "4100"), ilike(chartOfAccounts.nama, "%Pendapatan Penjualan%")))
    .limit(1);

  const [akunHpp] = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(or(eq(chartOfAccounts.kode, "5100"), ilike(chartOfAccounts.nama, "%Beban Pokok Penjualan%")))
    .limit(1);

  const [akunPersediaan] = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(or(eq(chartOfAccounts.kode, "1140"), ilike(chartOfAccounts.nama, "%Persediaan Barang%")))
    .limit(1);

  return await db.transaction(async (tx) => {
    // Generate nomor struk
    const [totalOrder] = await tx.select({ total: count() }).from(posOrders);
    const urutan = ((totalOrder?.total ?? 0) + 1).toString().padStart(5, "0");
    const tgl = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const nomorStruk = `POS-${tgl}-${urutan}`;

    let subtotalBig = BigInt(0);
    let totalHppBig = BigInt(0);

    const barisProcessed: {
      itemId: string;
      namaItem: string;
      satuanId: string;
      kuantitas: string;
      hargaSatuan: string;
      diskon: string;
      subtotal: string;
      biayaHpp: string;
    }[] = [];

    for (const b of input.baris) {
      const qtyBig = keBigInt(b.kuantitas);
      const hargaBig = keBigInt(b.hargaSatuan);
      const diskonBig = b.diskon ? keBigInt(b.diskon) : BigInt(0);
      const subtotalItemBig = (qtyBig * hargaBig) / BigInt(10000) - diskonBig;

      subtotalBig += subtotalItemBig;

      // Ambil stok & biaya rata-rata item di gudang toko
      const [stokItem] = await tx
        .select()
        .from(itemStocks)
        .where(and(eq(itemStocks.itemId, b.itemId), eq(itemStocks.gudangId, register.gudangId)))
        .for("update");

      const biayaSatuanBig = stokItem ? keBigInt(stokItem.biayaRataRata) : BigInt(0);
      const nilaiHppItemBig = (qtyBig * biayaSatuanBig) / BigInt(10000);
      totalHppBig += nilaiHppItemBig;

      // Potong stok persediaan di gudang toko
      if (stokItem) {
        const qtySekarang = keBigInt(stokItem.kuantitas);
        const nilaiSekarang = keBigInt(stokItem.nilai);
        const qtyBaru = qtySekarang - qtyBig;
        const nilaiBaru = nilaiSekarang - nilaiHppItemBig;

        await tx
          .update(itemStocks)
          .set({
            kuantitas: keString(qtyBaru < BigInt(0) ? BigInt(0) : qtyBaru),
            nilai: keString(nilaiBaru < BigInt(0) ? BigInt(0) : nilaiBaru),
            diubahPada: new Date(),
          })
          .where(eq(itemStocks.id, stokItem.id));
      }

      barisProcessed.push({
        itemId: b.itemId,
        namaItem: b.namaItem,
        satuanId: b.satuanId,
        kuantitas: b.kuantitas,
        hargaSatuan: b.hargaSatuan,
        diskon: b.diskon || "0.0000",
        subtotal: keString(subtotalItemBig),
        biayaHpp: keString(nilaiHppItemBig),
      });
    }

    const diskonNotaBig = input.diskonNota ? keBigInt(input.diskonNota) : BigInt(0);
    const pajakBig = input.pajak ? keBigInt(input.pajak) : BigInt(0);
    const totalBig = subtotalBig - diskonNotaBig + pajakBig;
    const bayarBig = keBigInt(input.jumlahBayar);
    const kembalianBig = bayarBig - totalBig;

    if (bayarBig < totalBig) {
      throw galat.aturanBisnis(
        `Pembayaran kurang: total transaksi ${keString(totalBig)}, uang diterima ${keString(bayarBig)}.`,
      );
    }

    const tanggalHariIni = new Date().toISOString().slice(0, 10);

    // Auto-posting Jurnal Akuntansi Kasir
    let jurnalId: string | undefined;
    if (akunPendapatan) {
      const barisJurnal = [
        {
          akunId: akunKas.akunCoaId,
          deskripsi: `Penerimaan Kasir POS Struk ${nomorStruk}`,
          debit: keString(totalBig),
          kredit: "0.0000",
        },
        {
          akunId: akunPendapatan.id,
          deskripsi: `Penjualan Kasir POS Struk ${nomorStruk}`,
          debit: "0.0000",
          kredit: keString(totalBig),
        },
      ];

      // Jurnal HPP bila ada persediaan
      if (totalHppBig > BigInt(0) && akunHpp && akunPersediaan) {
        barisJurnal.push(
          {
            akunId: akunHpp.id,
            deskripsi: `HPP Penjualan Kasir POS ${nomorStruk}`,
            debit: keString(totalHppBig),
            kredit: "0.0000",
          },
          {
            akunId: akunPersediaan.id,
            deskripsi: `Pengurangan Persediaan Kasir POS ${nomorStruk}`,
            debit: "0.0000",
            kredit: keString(totalHppBig),
          },
        );
      }

      const j = await simpanJurnal(
        tx,
        {
          tanggal: tanggalHariIni,
          deskripsi: `Transaksi Kasir POS: ${nomorStruk} (${kasirNama})`,
          referensi: nomorStruk,
          sumber: "FAKTUR_PENJUALAN",
          sumberId: nomorStruk,
          mataUangId: akunKas.mataUangId,
          kurs: "1.00000000",
          baris: barisJurnal,
          posting: true,
        },
        kasirId,
      );
      jurnalId = j.id;
    }

    // Simpan Header Order
    const [order] = await tx
      .insert(posOrders)
      .values({
        nomorStruk,
        shiftId: shift.id,
        registerId: register.id,
        kontakId: input.kontakId || null,
        namaPelanggan: input.namaPelanggan || "Pelanggan Umum",
        tanggal: tanggalHariIni,
        subtotal: keString(subtotalBig),
        diskon: keString(diskonNotaBig),
        pajak: keString(pajakBig),
        total: keString(totalBig),
        metodeBayar: input.metodeBayar,
        jumlahBayar: input.jumlahBayar,
        kembalian: keString(kembalianBig < BigInt(0) ? BigInt(0) : kembalianBig),
        referensiPembayaran: input.referensiPembayaran || null,
        status: "SELESAI",
        jurnalId: jurnalId || null,
        catatan: input.catatan?.trim() || null,
      })
      .returning();

    // Simpan Items
    let urutanIndex = 1;
    for (const b of barisProcessed) {
      await tx.insert(posOrderItems).values({
        orderId: order!.id,
        urutan: urutanIndex++,
        itemId: b.itemId,
        namaItem: b.namaItem,
        satuanId: b.satuanId,
        kuantitas: b.kuantitas,
        hargaSatuan: b.hargaSatuan,
        diskon: b.diskon,
        subtotal: b.subtotal,
        biayaHpp: b.biayaHpp,
      });

      // Catat kartu stok (Stock Movement)
      await tx.insert(stockMovements).values({
        tanggal: tanggalHariIni,
        itemId: b.itemId,
        gudangId: register.gudangId,
        jenis: "KELUAR",
        kuantitas: b.kuantitas,
        biayaSatuan: b.biayaHpp,
        nilai: b.biayaHpp,
        saldoKuantitas: "0.0000",
        saldoNilai: "0.0000",
        biayaRataRata: "0.0000",
        sumber: "POS",
        sumberId: order!.id,
        keterangan: `Penjualan Kasir POS: Struk ${nomorStruk}`,
      });
    }

    return {
      ...order!,
      items: barisProcessed,
      registerNama: register.nama,
      kasirNama,
    };
  });
}

export async function ambilDetailOrderPos(orderId: string) {
  const [order] = await db
    .select({
      id: posOrders.id,
      nomorStruk: posOrders.nomorStruk,
      shiftId: posOrders.shiftId,
      registerId: posOrders.registerId,
      registerNama: posRegisters.nama,
      namaPelanggan: posOrders.namaPelanggan,
      tanggal: posOrders.tanggal,
      waktuTransaksi: posOrders.waktuTransaksi,
      subtotal: posOrders.subtotal,
      diskon: posOrders.diskon,
      pajak: posOrders.pajak,
      total: posOrders.total,
      metodeBayar: posOrders.metodeBayar,
      jumlahBayar: posOrders.jumlahBayar,
      kembalian: posOrders.kembalian,
      referensiPembayaran: posOrders.referensiPembayaran,
      status: posOrders.status,
      catatan: posOrders.catatan,
      kasirNama: posShifts.kasirNama,
    })
    .from(posOrders)
    .innerJoin(posRegisters, eq(posOrders.registerId, posRegisters.id))
    .innerJoin(posShifts, eq(posOrders.shiftId, posShifts.id))
    .where(eq(posOrders.id, orderId));

  if (!order) throw galat.tidakDitemukan(`Struk POS dengan ID ${orderId}`);

  const items = await db
    .select()
    .from(posOrderItems)
    .where(eq(posOrderItems.orderId, orderId))
    .orderBy(asc(posOrderItems.urutan));

  return {
    ...order,
    items,
  };
}
