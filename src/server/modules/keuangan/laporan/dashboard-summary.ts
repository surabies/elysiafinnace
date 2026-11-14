import type { Akun } from "@/db/schema/keuangan";
import { keBigInt, keString } from "../shared/decimal";

export type BarisAkunBulanan = Pick<
  Akun,
  "kode" | "tipeAkun" | "normalBalance" | "peranSistem"
> & {
  bulan: string;
  debit: string;
  kredit: string;
};

export type BarisKasBulanan = Pick<Akun, "normalBalance"> & {
  bulan: string;
  debit: string;
  kredit: string;
};

type NilaiPeriode = {
  pendapatan: bigint;
  hpp: bigint;
  bebanOperasional: bigint;
  pendapatanBebanLain: bigint;
  kas: bigint;
};

type TitikTren = { period: string; value: string };

type KpiRingkasan = {
  id: "pendapatan" | "beban" | "laba" | "kas";
  label: string;
  value: string;
  deltaPct: number;
  positiveIsGood: boolean;
  trend: TitikTren[];
};

export type RingkasanKpiDashboard = {
  perTanggal: string;
  comparisonLabel: string;
  kpis: KpiRingkasan[];
};

function kunciBulan(tanggal: Date): string {
  const tahun = tanggal.getUTCFullYear();
  const bulan = String(tanggal.getUTCMonth() + 1).padStart(2, "0");
  return `${tahun}-${bulan}`;
}

function tanggalBulan(tanggal: Date): string {
  return `${kunciBulan(tanggal)}-01`;
}

function labelBulan(tanggal: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(tanggal);
}

export function bulanDashboard(perTanggal: string) {
  const [tahun, bulan] = perTanggal.split("-").map(Number);
  const tanggal = new Date(Date.UTC(tahun!, bulan! - 1, 1));

  if (
    Number.isNaN(tanggal.getTime()) ||
    tanggal.getUTCFullYear() !== tahun ||
    tanggal.getUTCMonth() !== bulan! - 1
  ) {
    throw new Error(`Tanggal ringkasan dashboard tidak valid: ${perTanggal}`);
  }

  const bulanList = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(tahun!, bulan! - 12 + index, 1));
    return {
      kunci: kunciBulan(date),
      label: labelBulan(date),
      dari: tanggalBulan(date),
    };
  });

  return {
    dari: bulanList[0]!.dari,
    bulanList,
  };
}

function saldoNormal(debit: bigint, kredit: bigint, normal: Akun["normalBalance"]) {
  return normal === "DEBIT" ? debit - kredit : kredit - debit;
}

function perubahanPersen(sekarang: bigint, sebelumnya: bigint): number {
  if (sebelumnya === BigInt(0)) return 0;
  const penyebut = sebelumnya < BigInt(0) ? -sebelumnya : sebelumnya;
  return Number(((sekarang - sebelumnya) * BigInt(1000)) / penyebut) / 10;
}

function nilaiPeriodeKosong(): NilaiPeriode {
  return {
    pendapatan: BigInt(0),
    hpp: BigInt(0),
    bebanOperasional: BigInt(0),
    pendapatanBebanLain: BigInt(0),
    kas: BigInt(0),
  };
}

export function susunRingkasanKpiDashboard(input: {
  perTanggal: string;
  akunBulanan: BarisAkunBulanan[];
  saldoKasAwal: (Pick<Akun, "normalBalance"> & {
    debit: string;
    kredit: string;
  })[];
  mutasiKasBulanan: BarisKasBulanan[];
}): RingkasanKpiDashboard {
  const { bulanList } = bulanDashboard(input.perTanggal);
  const nilaiPerBulan = new Map(
    bulanList.map(({ kunci }) => [kunci, nilaiPeriodeKosong()]),
  );
  const mutasiKas = new Map(bulanList.map(({ kunci }) => [kunci, BigInt(0)]));

  for (const baris of input.akunBulanan) {
    const nilai = nilaiPerBulan.get(baris.bulan);
    if (!nilai) throw new Error(`Periode jurnal di luar rentang: ${baris.bulan}`);

    const saldo = saldoNormal(
      keBigInt(baris.debit),
      keBigInt(baris.kredit),
      baris.normalBalance,
    );

    if (baris.tipeAkun === "PENDAPATAN") {
      if (baris.peranSistem === "LABA_SELISIH_KURS") {
        nilai.pendapatanBebanLain += saldo;
      } else {
        nilai.pendapatan += saldo;
      }
    } else if (baris.tipeAkun === "BEBAN") {
      if (
        baris.peranSistem === "HARGA_POKOK_PENJUALAN" ||
        baris.kode.startsWith("5")
      ) {
        nilai.hpp += saldo;
      } else if (baris.peranSistem === "RUGI_SELISIH_KURS") {
        nilai.pendapatanBebanLain -= saldo;
      } else {
        nilai.bebanOperasional += saldo;
      }
    } else {
      throw new Error(`Tipe akun tidak sesuai untuk ringkasan: ${baris.tipeAkun}`);
    }
  }

  let saldoKas = input.saldoKasAwal.reduce(
    (total, baris) =>
      total +
      saldoNormal(
        keBigInt(baris.debit),
        keBigInt(baris.kredit),
        baris.normalBalance,
      ),
    BigInt(0),
  );

  for (const baris of input.mutasiKasBulanan) {
    const sebelumnya = mutasiKas.get(baris.bulan);
    if (sebelumnya === undefined) {
      throw new Error(`Periode mutasi kas di luar rentang: ${baris.bulan}`);
    }
    mutasiKas.set(
      baris.bulan,
      sebelumnya +
        saldoNormal(
          keBigInt(baris.debit),
          keBigInt(baris.kredit),
          baris.normalBalance,
        ),
    );
  }

  for (const periode of bulanList) {
    const nilai = nilaiPerBulan.get(periode.kunci)!;
    saldoKas += mutasiKas.get(periode.kunci)!;
    nilai.kas = saldoKas;
  }

  const periodeKini = bulanList[11]!;
  const periodeSebelumnya = bulanList[10]!;
  const nilaiKini = nilaiPerBulan.get(periodeKini.kunci)!;
  const nilaiSebelumnya = nilaiPerBulan.get(periodeSebelumnya.kunci)!;
  const labaBersih = (nilai: NilaiPeriode) =>
    nilai.pendapatan - nilai.hpp - nilai.bebanOperasional + nilai.pendapatanBebanLain;
  const titikTren = (
    ambilNilai: (nilai: NilaiPeriode) => bigint,
  ): TitikTren[] =>
    bulanList.map((periode) => ({
      period: periode.label,
      value: keString(ambilNilai(nilaiPerBulan.get(periode.kunci)!)),
    }));

  return {
    perTanggal: input.perTanggal,
    comparisonLabel: `vs ${periodeSebelumnya.label}`,
    kpis: [
      {
        id: "pendapatan",
        label: `Pendapatan ${periodeKini.label}`,
        value: keString(nilaiKini.pendapatan),
        deltaPct: perubahanPersen(nilaiKini.pendapatan, nilaiSebelumnya.pendapatan),
        positiveIsGood: true,
        trend: titikTren((nilai) => nilai.pendapatan),
      },
      {
        id: "beban",
        label: "Beban operasional",
        value: keString(nilaiKini.bebanOperasional),
        deltaPct: perubahanPersen(
          nilaiKini.bebanOperasional,
          nilaiSebelumnya.bebanOperasional,
        ),
        positiveIsGood: false,
        trend: titikTren((nilai) => nilai.bebanOperasional),
      },
      {
        id: "laba",
        label: "Laba bersih",
        value: keString(labaBersih(nilaiKini)),
        deltaPct: perubahanPersen(labaBersih(nilaiKini), labaBersih(nilaiSebelumnya)),
        positiveIsGood: true,
        trend: titikTren(labaBersih),
      },
      {
        id: "kas",
        label: "Kas dan setara kas",
        value: keString(nilaiKini.kas),
        deltaPct: perubahanPersen(nilaiKini.kas, nilaiSebelumnya.kas),
        positiveIsGood: true,
        trend: titikTren((nilai) => nilai.kas),
      },
    ],
  };
}
