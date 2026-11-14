import Link from "next/link";
import { Button } from "@/components/ui/button";

const endpoints = [
  { method: "GET", path: "/api/keuangan/akun", note: "Bagan Akun (Chart of Accounts) Hierarkis" },
  { method: "GET", path: "/api/keuangan/jurnal", note: "Jurnal Umum Double-Entry" },
  { method: "GET", path: "/api/keuangan/buku-besar", note: "Buku Besar & Mutasi Akun" },
  { method: "GET", path: "/api/keuangan/biaya", note: "Pencatatan Biaya Operasional" },
  { method: "GET", path: "/api/keuangan/laporan/neraca", note: "Laporan Neraca (Balance Sheet)" },
  { method: "GET", path: "/api/keuangan/laporan/laba-rugi", note: "Laporan Laba Rugi (Income Statement)" },
  { method: "GET", path: "/api/keuangan/laporan/arus-kas", note: "Laporan Arus Kas (Cash Flow)" },
  { method: "GET", path: "/api/keuangan/laporan/perubahan-modal", note: "Laporan Perubahan Modal" },
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:py-16">
        <div>
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Sistem ERP Keuangan Enterprise
          </span>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.08] sm:text-5xl">
            Laporan Keuangan & Akuntansi Double-Entry
          </h1>
          <p className="mt-5 max-w-prose text-lg text-muted-foreground">
            Platform akuntansi terintegrasi dengan validasi ketat double-entry, multi-currency presisi desimal tanpa floating point,
            bagan akun hierarkis, pelacakan persediaan, dan otomatisasi tutup buku.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">Buka Dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">Masuk Akun</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Fondasi & Standar Akuntansi</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Double-Entry Rigorous:</strong> Total debit dan kredit dijamin selalu seimbang sebelum posting.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Akurasi Finansial:</strong> Tipe data numeric/desimal presisi tinggi bebas floating-point error.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Pelaporan Real-time:</strong> Neraca, Laba Rugi, Perubahan Modal, dan Arus Kas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Keamanan RBAC:</strong> Pembatasan hak akses berbasis peran untuk integritas audit.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto w-full max-w-5xl px-4 py-10">
          <h2 className="text-2xl font-semibold">REST API Modul Keuangan</h2>
          <dl className="mt-5 divide-y rounded-md border bg-card">
            {endpoints.map((endpoint) => (
              <div
                key={`${endpoint.method} ${endpoint.path}`}
                className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] sm:gap-6"
              >
                <dt className="font-mono text-sm break-all">
                  <span className="font-semibold text-primary">{endpoint.method}</span> {endpoint.path}
                </dt>
                <dd className="text-sm text-muted-foreground">{endpoint.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}
