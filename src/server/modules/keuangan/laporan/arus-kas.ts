import type { Akun } from "@/db/schema/keuangan";
import { keBigInt, keString } from "../shared/decimal";

type BarisSaldoKas = Pick<Akun, "normalBalance"> & {
  debit: string;
  kredit: string;
};

export type BarisLawanKas = Pick<
  Akun,
  "kode" | "nama" | "tipeAkun" | "kategoriArusKas"
> & {
  debit: string;
  kredit: string;
};

type RincianArusKas = { kode: string; nama: string; jumlah: string };

function saldoNormal(debit: bigint, kredit: bigint, normal: Akun["normalBalance"]) {
  return normal === "DEBIT" ? debit - kredit : kredit - debit;
}

export function susunLaporanArusKas(input: {
  dari: string;
  sampai: string;
  saldoKasAwal: BarisSaldoKas[];
  akunLawan: BarisLawanKas[];
}) {
  const saldoAwal = input.saldoKasAwal.reduce(
    (total, baris) =>
      total +
      saldoNormal(
        keBigInt(baris.debit),
        keBigInt(baris.kredit),
        baris.normalBalance,
      ),
    BigInt(0),
  );
  const rincianOperasi: RincianArusKas[] = [];
  const rincianInvestasi: RincianArusKas[] = [];
  const rincianPendanaan: RincianArusKas[] = [];
  let arusOperasi = BigInt(0);
  let arusInvestasi = BigInt(0);
  let arusPendanaan = BigInt(0);

  for (const akun of input.akunLawan) {
    const jumlah = keBigInt(akun.kredit) - keBigInt(akun.debit);
    if (jumlah === BigInt(0)) continue;

    const kategori =
      akun.kategoriArusKas ??
      (akun.tipeAkun === "EKUITAS" ? "PENDANAAN" : "OPERASI");
    const rincian = {
      kode: akun.kode,
      nama: akun.nama,
      jumlah: keString(jumlah),
    };

    if (kategori === "INVESTASI") {
      arusInvestasi += jumlah;
      rincianInvestasi.push(rincian);
    } else if (kategori === "PENDANAAN") {
      arusPendanaan += jumlah;
      rincianPendanaan.push(rincian);
    } else {
      arusOperasi += jumlah;
      rincianOperasi.push(rincian);
    }
  }

  const perubahanKasBersih = arusOperasi + arusInvestasi + arusPendanaan;

  return {
    dari: input.dari,
    sampai: input.sampai,
    saldoKasAwal: keString(saldoAwal),
    arusKasOperasi: {
      rincian: rincianOperasi,
      total: keString(arusOperasi),
    },
    arusKasInvestasi: {
      rincian: rincianInvestasi,
      total: keString(arusInvestasi),
    },
    arusKasPendanaan: {
      rincian: rincianPendanaan,
      total: keString(arusPendanaan),
    },
    kenaikanPenurunanKasBersih: keString(perubahanKasBersih),
    saldoKasAkhir: keString(saldoAwal + perubahanKasBersih),
  };
}
