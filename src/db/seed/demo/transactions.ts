import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import {
  branches,
  chartOfAccounts,
  currencies,
  departments,
  fiscalPeriods,
  journalEntries,
  journalItems,
  partners,
} from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

interface BarisItem {
  urutan: number;
  akunId: string;
  kontakId?: string;
  deskripsi: string;
  debit: string;
  kredit: string;
}

interface DraftJurnal {
  nomor: string;
  tanggal: string;
  periodeKode: string;
  referensi: string;
  deskripsi: string;
  total: string;
  baris: BarisItem[];
}

export async function seedDemoTransactions(db: Db): Promise<{ totalJurnal: number }> {
  console.log("  [demo] Menyiapkan Jurnal Umum Multi-Bulan (12 Bulan Historis + Transaksi Harian/Mingguan)...");

  const [idr] = await db.select({ id: currencies.id }).from(currencies).where(eq(currencies.kode, "IDR"));
  const [cabangPusat] = await db.select({ id: branches.id }).from(branches).where(eq(branches.kode, "JKT-PST"));
  const [deptKeu] = await db.select({ id: departments.id }).from(departments).where(eq(departments.kode, "KEU"));

  // Ambil ID Akun COA
  const getAkunId = async (kode: string) => {
    const res = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(eq(chartOfAccounts.kode, kode));
    return res[0]?.id;
  };

  const id1111 = await getAkunId("1111"); // Kas Kecil
  const id1112 = await getAkunId("1112"); // Bank BCA
  const id1113 = await getAkunId("1113"); // Bank Mandiri Payroll
  const id1120 = await getAkunId("1120"); // Piutang Usaha
  const id1130 = await getAkunId("1130"); // Persediaan
  const id1210 = await getAkunId("1210"); // Peralatan Kantor
  const id1219 = await getAkunId("1219"); // Akumulasi Penyusutan
  const id2110 = await getAkunId("2110"); // Hutang Usaha
  const id2120 = await getAkunId("2120"); // PPN Keluaran
  const id3100 = await getAkunId("3100"); // Modal Disetor
  const id3200 = await getAkunId("3200"); // Laba Ditahan
  const id4100 = await getAkunId("4100"); // Pendapatan Penjualan
  const id5100 = await getAkunId("5100"); // HPP
  const id6100 = await getAkunId("6100"); // Beban Gaji
  const id6200 = await getAkunId("6200"); // Beban Sewa
  const id6300 = await getAkunId("6300"); // Beban Utilitas
  const id6400 = await getAkunId("6400"); // Beban Pemasaran
  const id6600 = await getAkunId("6600"); // Beban Penyusutan

  if (!idr || !id1111 || !id1112 || !id1120 || !id1130 || !id2110 || !id3100 || !id4100 || !id5100 || !id6100) {
    throw new Error("[seed demo] Akun-akun COA wajib belum lengkap di database.");
  }

  // Kontak
  const [custMega] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "CUST-001"));
  const [custBerkah] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "CUST-002"));
  const [custGlobal] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "CUST-003"));
  const [vendIndo] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "VEND-001"));
  const [vendUtil] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "VEND-003"));

  const periodCache = new Map<string, string>();
  const getPeriodId = async (kode: string) => {
    if (periodCache.has(kode)) return periodCache.get(kode)!;
    const [p] = await db.select({ id: fiscalPeriods.id }).from(fiscalPeriods).where(eq(fiscalPeriods.kode, kode));
    if (p) periodCache.set(kode, p.id);
    return p?.id;
  };

  const DAFTAR_TRANSAKSI: DraftJurnal[] = [];
  let noUrut = 1;
  const genNo = (periode: string) => `JU/${periode.replace("-", "/")}/${String(noUrut++).padStart(5, "0")}`;

  // =========================================================================
  // 1. SALDO AWAL NERACA DESEMBER 2025 (Kekayaan Bersih Rp 1.5 Milyar)
  // =========================================================================
  DAFTAR_TRANSAKSI.push({
    nomor: genNo("2025-12"),
    tanggal: "2025-12-01",
    periodeKode: "2025-12",
    referensi: "OB-20251201",
    deskripsi: "Saldo awal pembukuan neraca PT Elysia Niaga Nusantara",
    total: "1500000000.0000",
    baris: [
      { urutan: 1, akunId: id1111, deskripsi: "Saldo awal Kas Kecil", debit: "15000000.0000", kredit: "0.0000" },
      { urutan: 2, akunId: id1112, deskripsi: "Saldo awal Bank BCA Giro Operasional", debit: "480000000.0000", kredit: "0.0000" },
      { urutan: 3, akunId: id1113 ?? id1112, deskripsi: "Saldo awal Bank Mandiri Payroll", debit: "220000000.0000", kredit: "0.0000" },
      { urutan: 4, akunId: id1120, kontakId: custMega?.id, deskripsi: "Saldo awal Piutang PT Mega Retailindo", debit: "125000000.0000", kredit: "0.0000" },
      { urutan: 5, akunId: id1130, deskripsi: "Saldo awal Persediaan Barang Dagang Gudang", debit: "360000000.0000", kredit: "0.0000" },
      { urutan: 6, akunId: id1210 ?? id1130, deskripsi: "Saldo awal Aset Peralatan & Kendaraan", debit: "300000000.0000", kredit: "0.0000" },
      { urutan: 7, akunId: id2110, kontakId: vendIndo?.id, deskripsi: "Saldo awal Hutang Dagang PT Indofood Tbk", debit: "0.0000", kredit: "250000000.0000" },
      { urutan: 8, akunId: id3100, deskripsi: "Modal Disetor Pendiri", debit: "0.0000", kredit: "850000000.0000" },
      { urutan: 9, akunId: id3200 ?? id3100, deskripsi: "Laba Ditahan Akumulasi Tahun Lalu", debit: "0.0000", kredit: "400000000.0000" },
    ],
  });

  // =========================================================================
  // 2. TREN HISTORIS 12 BULAN (2025-12 s/d 2026-10)
  // Menghasilkan grafik bulanan yang tumbuh realistis di Dashboard KPI & Arus Kas
  // =========================================================================
  const DATA_BULANAN = [
    { bulan: "2025-12", omzet: 290000000, hpp: 174000000, gaji: 45000000, utilitas: 4800000, iklan: 12000000 },
    { bulan: "2026-01", omzet: 260000000, hpp: 156000000, gaji: 46000000, utilitas: 5100000, iklan: 10000000 },
    { bulan: "2026-02", omzet: 275000000, hpp: 165000000, gaji: 46000000, utilitas: 4900000, iklan: 11500000 },
    { bulan: "2026-03", omzet: 310000000, hpp: 186000000, gaji: 48000000, utilitas: 5300000, iklan: 14000000 },
    { bulan: "2026-04", omzet: 295000000, hpp: 177000000, gaji: 48000000, utilitas: 5200000, iklan: 13000000 },
    { bulan: "2026-05", omzet: 320000000, hpp: 192000000, gaji: 48000000, utilitas: 5400000, iklan: 15000000 },
    { bulan: "2026-06", omzet: 345000000, hpp: 207000000, gaji: 50000000, utilitas: 5600000, iklan: 16500000 },
    { bulan: "2026-07", omzet: 335000000, hpp: 201000000, gaji: 50000000, utilitas: 5500000, iklan: 15000000 },
    { bulan: "2026-08", omzet: 360000000, hpp: 216000000, gaji: 52000000, utilitas: 5800000, iklan: 18000000 },
    { bulan: "2026-09", omzet: 375000000, hpp: 225000000, gaji: 52000000, utilitas: 5700000, iklan: 17500000 },
    { bulan: "2026-10", omzet: 395000000, hpp: 237000000, gaji: 54000000, utilitas: 6100000, iklan: 19000000 },
  ];

  for (const b of DATA_BULANAN) {
    const ppnJual = Math.round(b.omzet * 0.11);
    const totalPiutang = b.omzet + ppnJual;

    // A. Penjualan Bulanan
    DAFTAR_TRANSAKSI.push({
      nomor: genNo(b.bulan),
      tanggal: `${b.bulan}-10`,
      periodeKode: b.bulan,
      referensi: `RECAP-SLS-${b.bulan.replace("-", "")}`,
      deskripsi: `Rekapitulasi penjualan barang dagang periode ${b.bulan}`,
      total: `${totalPiutang}.0000`,
      baris: [
        { urutan: 1, akunId: id1120, kontakId: custGlobal?.id, deskripsi: `Piutang dagang penjualan ${b.bulan}`, debit: `${totalPiutang}.0000`, kredit: "0.0000" },
        { urutan: 2, akunId: id4100, deskripsi: `Pendapatan penjualan ${b.bulan}`, debit: "0.0000", kredit: `${b.omzet}.0000` },
        { urutan: 3, akunId: id2120 ?? id2110, deskripsi: "PPN Keluaran 11%", debit: "0.0000", kredit: `${ppnJual}.0000` },
      ],
    });

    // B. Pengakuan HPP
    DAFTAR_TRANSAKSI.push({
      nomor: genNo(b.bulan),
      tanggal: `${b.bulan}-10`,
      periodeKode: b.bulan,
      referensi: `COGS-${b.bulan.replace("-", "")}`,
      deskripsi: `Beban harga pokok penjualan atas persediaan keluar ${b.bulan}`,
      total: `${b.hpp}.0000`,
      baris: [
        { urutan: 1, akunId: id5100, deskripsi: `HPP barang dagang ${b.bulan}`, debit: `${b.hpp}.0000`, kredit: "0.0000" },
        { urutan: 2, akunId: id1130, deskripsi: `Pengurangan persediaan gudang ${b.bulan}`, debit: "0.0000", kredit: `${b.hpp}.0000` },
      ],
    });

    // C. Pelunasan Piutang via Bank BCA
    const bayarPiutang = Math.round(totalPiutang * 0.88);
    DAFTAR_TRANSAKSI.push({
      nomor: genNo(b.bulan),
      tanggal: `${b.bulan}-18`,
      periodeKode: b.bulan,
      referensi: `BKM-${b.bulan.replace("-", "")}`,
      deskripsi: `Penerimaan transfer pelunasan piutang pelanggan ke Bank BCA ${b.bulan}`,
      total: `${bayarPiutang}.0000`,
      baris: [
        { urutan: 1, akunId: id1112, deskripsi: `Penerimaan kas bank operasional ${b.bulan}`, debit: `${bayarPiutang}.0000`, kredit: "0.0000" },
        { urutan: 2, akunId: id1120, kontakId: custGlobal?.id, deskripsi: "Pelunasan piutang pelanggan", debit: "0.0000", kredit: `${bayarPiutang}.0000` },
      ],
    });

    // D. Penggajian / Payroll Staf
    DAFTAR_TRANSAKSI.push({
      nomor: genNo(b.bulan),
      tanggal: `${b.bulan}-25`,
      periodeKode: b.bulan,
      referensi: `PAY-${b.bulan.replace("-", "")}`,
      deskripsi: `Payroll gaji dan tunjangan karyawan kantor & gudang ${b.bulan}`,
      total: `${b.gaji}.0000`,
      baris: [
        { urutan: 1, akunId: id6100, deskripsi: `Beban gaji karyawan ${b.bulan}`, debit: `${b.gaji}.0000`, kredit: "0.0000" },
        { urutan: 2, akunId: id1113 ?? id1112, deskripsi: "Pengeluaran payroll Bank Mandiri", debit: "0.0000", kredit: `${b.gaji}.0000` },
      ],
    });

    // E. Sewa Kantor & Utilitas Listrik
    const totalOps = 20000000 + b.utilitas;
    DAFTAR_TRANSAKSI.push({
      nomor: genNo(b.bulan),
      tanggal: `${b.bulan}-05`,
      periodeKode: b.bulan,
      referensi: `OPS-${b.bulan.replace("-", "")}`,
      deskripsi: `Pembayaran sewa kantor SCBD & utilitas listrik/air/internet ${b.bulan}`,
      total: `${totalOps}.0000`,
      baris: [
        { urutan: 1, akunId: id6200 ?? id6100, deskripsi: "Beban sewa kantor SCBD", debit: "20000000.0000", kredit: "0.0000" },
        { urutan: 2, akunId: id6300 ?? id6100, deskripsi: "Beban listrik PLN & internet IndiHome", debit: `${b.utilitas}.0000`, kredit: "0.0000" },
        { urutan: 3, akunId: id1112, kontakId: vendUtil?.id, deskripsi: "Pengeluaran Bank BCA Giro", debit: "0.0000", kredit: `${totalOps}.0000` },
      ],
    });

    // F. Beban Pemasaran & Iklan Digital
    DAFTAR_TRANSAKSI.push({
      nomor: genNo(b.bulan),
      tanggal: `${b.bulan}-15`,
      periodeKode: b.bulan,
      referensi: `MKT-${b.bulan.replace("-", "")}`,
      deskripsi: `Beban kampanye digital ads Google/Meta & promosi ritel ${b.bulan}`,
      total: `${b.iklan}.0000`,
      baris: [
        { urutan: 1, akunId: id6400 ?? id6100, deskripsi: "Biaya promosi & iklan produk", debit: `${b.iklan}.0000`, kredit: "0.0000" },
        { urutan: 2, akunId: id1112, deskripsi: "Pembayaran debit Bank BCA", debit: "0.0000", kredit: `${b.iklan}.0000` },
      ],
    });

    // G. Penyusutan Aset Tetap Bulanan
    DAFTAR_TRANSAKSI.push({
      nomor: genNo(b.bulan),
      tanggal: `${b.bulan}-28`,
      periodeKode: b.bulan,
      referensi: `DEP-${b.bulan.replace("-", "")}`,
      deskripsi: `Penyusutan aset tetap peralatan kantor & kendaraan logistik ${b.bulan}`,
      total: "8250000.0000",
      baris: [
        { urutan: 1, akunId: id6600 ?? id6100, deskripsi: "Beban penyusutan aset tetap", debit: "8250000.0000", kredit: "0.0000" },
        { urutan: 2, akunId: id1219 ?? id1210 ?? id1130, deskripsi: "Akumulasi penyusutan aset tetap", debit: "0.0000", kredit: "8250000.0000" },
      ],
    });
  }

  // =========================================================================
  // 3. TRANSAKSI MINGGUAN & HARIAN BULAN BERJALAN (NOVEMBER 2026)
  // Menghasilkan fluktuasi harian yang nyata untuk grafik interaktif & sparkline
  // =========================================================================
  const TRANSAKSI_HARIAN_NOV = [
    {
      tgl: "2026-11-01",
      ref: "SLS-20261101",
      ket: "Penjualan ritel awal bulan gerai Jabodetabek",
      omzet: 42000000,
      hpp: 25200000,
      pelanggan: custMega,
    },
    {
      tgl: "2026-11-03",
      ref: "SLS-20261103",
      ket: "Pengiriman partai 15 unit monitor ke Toko Berkah",
      omzet: 27750000,
      hpp: 18750000,
      pelanggan: custBerkah,
    },
    {
      tgl: "2026-11-05",
      ref: "SLS-20261105",
      ket: "Penjualan laptop enterprise ke PT Global Distribusi",
      omzet: 60000000,
      hpp: 42500000,
      pelanggan: custGlobal,
    },
    {
      tgl: "2026-11-07",
      ref: "BKK-20261107",
      ket: "Pembelian konsumsi meeting & ATK kas kecil",
      biayaKasKecil: 1850000,
    },
    {
      tgl: "2026-11-09",
      ref: "SLS-20261109",
      ket: "Penjualan kertas fotokopi 200 rim",
      omzet: 11000000,
      hpp: 8400000,
      pelanggan: custMega,
    },
    {
      tgl: "2026-11-11",
      ref: "BKM-20261111",
      ket: "Penerimaan pelunasan piutang PT Mega Retailindo",
      penerimaanBank: 55000000,
      pelanggan: custMega,
    },
    {
      tgl: "2026-11-13",
      ref: "SLS-20261113",
      ket: "Penjualan paket bundling akhir pekan",
      omzet: 35000000,
      hpp: 22000000,
      pelanggan: custBerkah,
    },
    {
      tgl: "2026-11-14",
      ref: "BKK-20261114",
      ket: "Beban logistik kurir ekspres & kurir darurat",
      biayaKasKecil: 950000,
    },
  ];

  for (const h of TRANSAKSI_HARIAN_NOV) {
    if (h.omzet && h.hpp) {
      const ppn = Math.round(h.omzet * 0.11);
      const total = h.omzet + ppn;

      // Jurnal Penjualan
      DAFTAR_TRANSAKSI.push({
        nomor: genNo("2026-11"),
        tanggal: h.tgl,
        periodeKode: "2026-11",
        referensi: h.ref,
        deskripsi: h.ket,
        total: `${total}.0000`,
        baris: [
          { urutan: 1, akunId: id1120, kontakId: h.pelanggan?.id, deskripsi: `Piutang dagang ${h.ref}`, debit: `${total}.0000`, kredit: "0.0000" },
          { urutan: 2, akunId: id4100, deskripsi: "Pendapatan penjualan barang", debit: "0.0000", kredit: `${h.omzet}.0000` },
          { urutan: 3, akunId: id2120 ?? id2110, deskripsi: "PPN Keluaran 11%", debit: "0.0000", kredit: `${ppn}.0000` },
        ],
      });

      // Jurnal HPP
      DAFTAR_TRANSAKSI.push({
        nomor: genNo("2026-11"),
        tanggal: h.tgl,
        periodeKode: "2026-11",
        referensi: `HPP-${h.ref}`,
        deskripsi: `HPP atas ${h.ket}`,
        total: `${h.hpp}.0000`,
        baris: [
          { urutan: 1, akunId: id5100, deskripsi: "Harga Pokok Penjualan", debit: `${h.hpp}.0000`, kredit: "0.0000" },
          { urutan: 2, akunId: id1130, deskripsi: "Persediaan barang keluar", debit: "0.0000", kredit: `${h.hpp}.0000` },
        ],
      });
    }

    if (h.biayaKasKecil) {
      DAFTAR_TRANSAKSI.push({
        nomor: genNo("2026-11"),
        tanggal: h.tgl,
        periodeKode: "2026-11",
        referensi: h.ref,
        deskripsi: h.ket,
        total: `${h.biayaKasKecil}.0000`,
        baris: [
          { urutan: 1, akunId: id6300 ?? id6100, deskripsi: h.ket, debit: `${h.biayaKasKecil}.0000`, kredit: "0.0000" },
          { urutan: 2, akunId: id1111, deskripsi: "Pengeluaran Kas Kecil Kantor", debit: "0.0000", kredit: `${h.biayaKasKecil}.0000` },
        ],
      });
    }

    if (h.penerimaanBank) {
      DAFTAR_TRANSAKSI.push({
        nomor: genNo("2026-11"),
        tanggal: h.tgl,
        periodeKode: "2026-11",
        referensi: h.ref,
        deskripsi: h.ket,
        total: `${h.penerimaanBank}.0000`,
        baris: [
          { urutan: 1, akunId: id1112, deskripsi: "Penerimaan transfer Bank BCA", debit: `${h.penerimaanBank}.0000`, kredit: "0.0000" },
          { urutan: 2, akunId: id1120, kontakId: h.pelanggan?.id, deskripsi: "Pelunasan piutang pelanggan", debit: "0.0000", kredit: `${h.penerimaanBank}.0000` },
        ],
      });
    }
  }

  // =========================================================================
  // EKSEKUSI PENYISIPAN SELURUH JURNAL UMUM KE DATABASE
  // =========================================================================
  let totalInserted = 0;

  for (const trx of DAFTAR_TRANSAKSI) {
    const periodeId = await getPeriodId(trx.periodeKode);
    if (!periodeId) continue;

    await db
      .insert(journalEntries)
      .values({
        nomor: trx.nomor,
        tanggal: trx.tanggal,
        periodeId,
        referensi: trx.referensi,
        deskripsi: trx.deskripsi,
        status: "POSTED",
        sumber: "MANUAL",
        cabangId: cabangPusat?.id,
        mataUangId: idr.id,
        kurs: "1",
        totalDebit: trx.total,
        totalKredit: trx.total,
        dipostingOleh: "Administrator Demo",
        dipostingPada: new Date(`${trx.tanggal}T12:00:00Z`),
      })
      .onConflictDoNothing({ target: journalEntries.nomor });

    const [jurnal] = await db
      .select({ id: journalEntries.id })
      .from(journalEntries)
      .where(eq(journalEntries.nomor, trx.nomor));

    if (jurnal) {
      totalInserted++;
      for (const b of trx.baris) {
        await db
          .insert(journalItems)
          .values({
            jurnalId: jurnal.id,
            urutan: b.urutan,
            akunId: b.akunId,
            kontakId: b.kontakId ?? null,
            cabangId: cabangPusat?.id,
            departemenId: deptKeu?.id,
            deskripsi: b.deskripsi,
            debit: b.debit,
            kredit: b.kredit,
            mataUangId: idr.id,
            kurs: "1",
            debitDasar: b.debit,
            kreditDasar: b.kredit,
          })
          .onConflictDoNothing();
      }
    }
  }

  return { totalJurnal: totalInserted };
}
