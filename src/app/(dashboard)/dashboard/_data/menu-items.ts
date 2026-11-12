export type QuickLink = {
  title: string;
  desc: string;
  href: string;
};

// Pintasan lama ke endpoint API. Ganti href ke halaman UI saat sudah tersedia.
export const quickLinks: QuickLink[] = [
  { title: "Bagan akun (COA)", desc: "Kelola bagan akun bersarang: aset, kewajiban, ekuitas, pendapatan, beban.", href: "/api/keuangan/akun" },
  { title: "Jurnal umum", desc: "Catat transaksi double-entry dengan validasi debit = kredit.", href: "/api/keuangan/jurnal" },
  { title: "Buku besar", desc: "Mutasi dan saldo per akun pada periode berjalan.", href: "/api/keuangan/buku-besar?dari=2026-01-01&sampai=2026-12-31" },
  { title: "Biaya operasional", desc: "Catat beban operasional tunai atau hutang ke pemasok.", href: "/api/keuangan/biaya" },
  { title: "Neraca", desc: "Posisi keuangan: aset = kewajiban + ekuitas.", href: "/api/keuangan/laporan/neraca" },
  { title: "Laba rugi", desc: "Pendapatan, beban, dan laba/rugi bersih operasional.", href: "/api/keuangan/laporan/laba-rugi" },
];
