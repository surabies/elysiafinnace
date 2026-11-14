import { t, type Static } from "elysia";
import { skema } from "../shared/schema";

/* -------------------------- Saldo Awal Akun -------------------------- */

export const skemaBarisSaldoAwalAkun = t.Object({
  akunId: skema.uuid("akunId"),
  debit: t.Optional(skema.uang("debit")),
  kredit: t.Optional(skema.uang("kredit")),
  deskripsi: skema.teksOpsional("deskripsi", 200),
});
export type InputBarisSaldoAwalAkun = Static<typeof skemaBarisSaldoAwalAkun>;

export const skemaSimpanSaldoAwalAkun = t.Object({
  tanggal: skema.tanggal("Tanggal saldo awal"),
  keterangan: skema.teksOpsional("keterangan", 500),
  daftarBaris: t.Array(skemaBarisSaldoAwalAkun),
});
export type InputSimpanSaldoAwalAkun = Static<typeof skemaSimpanSaldoAwalAkun>;

/* ------------------------- Saldo Awal Piutang ------------------------- */

export const skemaBarisSaldoAwalPiutang = t.Object({
  kontakId: skema.uuid("kontakId"),
  nomorFaktur: skema.kode("Nomor faktur", 50),
  tanggal: skema.tanggal("Tanggal faktur"),
  tanggalJatuhTempo: skema.tanggal("Tanggal jatuh tempo"),
  jumlah: skema.uang("jumlah"),
  catatan: skema.teksOpsional("catatan", 500),
});
export type InputBarisSaldoAwalPiutang = Static<typeof skemaBarisSaldoAwalPiutang>;

export const skemaSimpanSaldoAwalPiutang = t.Object({
  daftarFaktur: t.Array(skemaBarisSaldoAwalPiutang),
});
export type InputSimpanSaldoAwalPiutang = Static<typeof skemaSimpanSaldoAwalPiutang>;

/* -------------------------- Saldo Awal Hutang -------------------------- */

export const skemaBarisSaldoAwalHutang = t.Object({
  kontakId: skema.uuid("kontakId"),
  nomorFakturPemasok: skema.teks("Nomor faktur pemasok", 100),
  tanggal: skema.tanggal("Tanggal faktur"),
  tanggalJatuhTempo: skema.tanggal("Tanggal jatuh tempo"),
  jumlah: skema.uang("jumlah"),
  catatan: skema.teksOpsional("catatan", 500),
});
export type InputBarisSaldoAwalHutang = Static<typeof skemaBarisSaldoAwalHutang>;

export const skemaSimpanSaldoAwalHutang = t.Object({
  daftarTagihan: t.Array(skemaBarisSaldoAwalHutang),
});
export type InputSimpanSaldoAwalHutang = Static<typeof skemaSimpanSaldoAwalHutang>;

/* ------------------------ Saldo Awal Persediaan ------------------------ */

export const skemaBarisSaldoAwalStok = t.Object({
  itemId: skema.uuid("itemId"),
  kuantitas: skema.kuantitas("kuantitas"),
  biayaSatuan: skema.uang("biayaSatuan"),
  keterangan: skema.teksOpsional("keterangan", 500),
});
export type InputBarisSaldoAwalStok = Static<typeof skemaBarisSaldoAwalStok>;

export const skemaSimpanSaldoAwalStok = t.Object({
  tanggal: skema.tanggal("Tanggal saldo awal"),
  daftarItem: t.Array(skemaBarisSaldoAwalStok),
});
export type InputSimpanSaldoAwalStok = Static<typeof skemaSimpanSaldoAwalStok>;

/* ------------------------------ Import CSV ------------------------------ */

export const skemaImportCsv = t.Object({
  csv: t.String({ minLength: 1, error: "Konten CSV wajib diisi." }),
});
export type InputImportCsv = Static<typeof skemaImportCsv>;
