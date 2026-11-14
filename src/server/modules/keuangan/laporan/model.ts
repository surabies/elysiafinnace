import { t } from "elysia";
import { skema } from "../shared/schema";

export const skemaQueryNeraca = t.Object({
  perTanggal: skema.tanggal("perTanggal"),
});

export const skemaQueryRingkasanDashboard = t.Object({
  perTanggal: skema.tanggal("perTanggal"),
});

export const skemaQueryRentang = t.Object({
  dari: skema.tanggal("dari"),
  sampai: skema.tanggal("sampai"),
});

export const skemaQueryMutasiRekening = t.Object({
  rekeningBankId: skema.uuid("rekeningBankId"),
  dari: skema.tanggal("dari"),
  sampai: skema.tanggal("sampai"),
});

export const skemaQueryLaporanRekonsiliasi = t.Object({
  rekonsiliasiId: skema.uuid("rekonsiliasiId"),
});

export const skemaQueryNeracaSaldo = t.Object({
  dari: t.Optional(skema.tanggal("dari")),
  sampai: skema.tanggal("sampai"),
});

export const skemaQueryWorksheet = t.Object({
  dari: skema.tanggal("dari"),
  sampai: skema.tanggal("sampai"),
});

export const skemaQueryBukuBesarPembantu = t.Object({
  kontakId: t.Optional(skema.uuid("kontakId")),
  dari: skema.tanggal("dari"),
  sampai: skema.tanggal("sampai"),
});

export const skemaQueryAging = t.Object({
  perTanggal: skema.tanggal("perTanggal"),
  kontakId: t.Optional(skema.uuid("kontakId")),
});

export const skemaQueryLaporanDagang = t.Object({
  dari: skema.tanggal("dari"),
  sampai: skema.tanggal("sampai"),
  kontakId: t.Optional(skema.uuid("kontakId")),
  itemId: t.Optional(skema.uuid("itemId")),
});

export const skemaQueryKomparatif = t.Object({
  periode1Dari: skema.tanggal("periode1Dari"),
  periode1Sampai: skema.tanggal("periode1Sampai"),
  periode2Dari: skema.tanggal("periode2Dari"),
  periode2Sampai: skema.tanggal("periode2Sampai"),
});

export const skemaQueryKonsolidasi = t.Object({
  holdingId: skema.uuid("holdingId"),
  perTanggal: skema.tanggal("perTanggal"),
});

export const skemaQueryCetakDokumen = t.Object({
  jenisDokumen: skema.pilihan("jenisDokumen", [
    "FAKTUR_PENJUALAN",
    "FAKTUR_PEMBELIAN",
    "PESANAN_PENJUALAN",
    "PESANAN_PEMBELIAN",
  ] as const),
  dokumenId: skema.uuid("dokumenId"),
});

