import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard Keuangan" };

export default async function DashboardPage() {
  const { user } = await requireSession();

  const menuItems = [
    {
      title: "Bagan Akun (COA)",
      desc: "Kelola bagan akun bersarang (Aset, Kewajiban, Ekuitas, Pendapatan, Beban).",
      link: "/api/keuangan/akun",
      label: "Lihat Akun",
    },
    {
      title: "Jurnal Umum",
      desc: "Pencatatan transaksi double-entry dengan validasi debit = kredit.",
      link: "/api/keuangan/jurnal",
      label: "Buka Jurnal",
    },
    {
      title: "Buku Besar",
      desc: "Ringkasan mutasi dan saldo per akun dalam periode berjalan.",
      link: "/api/keuangan/buku-besar?dari=2026-01-01&sampai=2026-12-31",
      label: "Buku Besar",
    },
    {
      title: "Biaya Operasional",
      desc: "Pencatatan beban operasional tunai atau hutang ke pemasok.",
      link: "/api/keuangan/biaya",
      label: "Daftar Biaya",
    },
    {
      title: "Neraca (Balance Sheet)",
      desc: "Laporan posisi keuangan entitas (Aset = Kewajiban + Ekuitas).",
      link: "/api/keuangan/laporan/neraca",
      label: "Neraca",
    },
    {
      title: "Laba Rugi (Income Statement)",
      desc: "Laporan pendapatan, beban, dan laba/rugi bersih operasional.",
      link: "/api/keuangan/laporan/laba-rugi",
      label: "Laba Rugi",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Selamat Datang, {user.name}</h1>
          <p className="mt-1 text-muted-foreground">Masuk sebagai {user.email}.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <div key={item.title} className="flex flex-col justify-between rounded-lg border bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <div className="mt-6">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={item.link}>{item.label}</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
