# Arsitektur Backend

Stack: Next.js 16 (host) · Elysia 1.4 (API, di-mount di `src/app/api/[[...slugs]]/route.ts`) ·
Drizzle ORM + PostgreSQL · Better Auth · Bun (tooling/test).

## Tata letak

```
src/
├─ db/
│  ├─ index.ts                 klien Drizzle (pool pg)
│  ├─ schema/                  satu file per domain; keuangan/_helper.ts = kolom umum
│  ├─ migrations/              HANYA hasil `bun run db:generate` — jangan edit manual
│  └─ seed/                    data awal (COA standar, mata uang, peran)
├─ lib/                        util lintas frontend/backend (auth, env, format)
└─ server/
   ├─ app.ts                   composition root: plugin global + modul. Ekspor `App` (Eden)
   ├─ core/                    hal lintas-modul tanpa domain: errors, (nanti) response, logger
   ├─ plugins/                 plugin Elysia global: auth, cors, error-handler, rate-limit
   └─ modules/
      ├─ system/               health, me
      └─ keuangan/
         ├─ index.ts           agregator, prefix /keuangan
         ├─ shared/            dipakai banyak fitur: context (db/sesi), common (galat, izin,
         │                     paginasi), transaction (Tx, penomoran), decimal, kurs, rbac, dagang
         └─ <fitur>/
            ├─ index.ts        CONTROLLER: rute Elysia saja (validasi via model, panggil service)
            ├─ model.ts        skema TypeBox (`t.Object`) untuk body/query/params
            ├─ service.ts      logika bisnis + query DB; tanpa objek Elysia/HTTP
            └─ *.ts            engine khusus (mis. jurnal/engine.ts, inventori/mutasi.ts)
```

## Aturan

1. **Alur dependensi satu arah:** `index.ts → service.ts → shared/ → db`. Service tidak mengimpor controller.
   Antar fitur hanya lewat service publik atau `shared/`.
2. **Uang = string desimal / bigint**, tidak pernah `number`. Gunakan `shared/decimal.ts` (skala 4, kurs skala 8).
3. **Double-entry:** semua dokumen yang berdampak keuangan membuat jurnal via `jurnal/engine.ts`
   (`simpanJurnal`) di dalam **satu transaksi DB** (`db.transaction`). Debit = kredit wajib.
4. **Dokumen terposting tidak diedit** — koreksi dengan jurnal balik (`balikJurnal`).
5. **Penomoran dokumen** via `shared/transaction.ts` (`PREFIKS`, tabel `document_sequences`).
6. **Izin:** setiap rute memakai `wajibIzin(...)` / `izinPerMetode`; katalog di `db/schema/keuangan/konstanta.ts`.
7. **Bahasa:** domain & pesan dalam Bahasa Indonesia; nama tabel DB bahasa Inggris (snake_case).
8. **Fitur baru** = folder baru di `modules/keuangan/` + daftarkan di `modules/keuangan/index.ts`
   - izin baru di `konstanta.ts` + migrasi bila ada tabel + entri ROADMAP & SESSION-LOG.

## Kontrak HTTP

- Sukses: `{ "success": true, "data": ..., "meta"?: {...} }` � gunakan `ok(data, meta)` dari `core/response.ts`.
- Gagal: `{ "success": false, "error": { "code", "message", "details"? } }` � lempar `ApiError`/`galat.*`.
  Kode: `BAD_REQUEST, VALIDATION_ERROR(422), UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, IN_USE(409), BUSINESS_RULE(422), RATE_LIMITED, INTERNAL_ERROR`.
- Pesan constraint DB baru ? tambahkan di `core/db-errors.ts` (`CONSTRAINT_MESSAGES`).
- Dokumentasi: `GET /api/openapi` (UI), `/api/openapi/json` (spec). Produksi: set `OPENAPI_ENABLED=true` untuk mengaktifkan.

## Perintah

| Tujuan          | Perintah                                                               |
| --------------- | ---------------------------------------------------------------------- |
| Type-check      | `bun run typecheck`                                                    |
| Lint            | `bun run lint`                                                         |
| Test            | `bun test ./tests` (butuh Postgres; `docker compose up -d`)            |
| Migrasi baru    | `bun run db:generate` lalu `bun run db:migrate`                        |
| Reset database  | `bun run db:reset` (lihat [SEEDING-AND-WIZARD.md](./SEEDING-AND-WIZARD.md)) |
| Seed modular    | `bun run db:seed` (opsi: `--demo`, `--clean`)                          |

## Standar Antarmuka & Frontend

### 1. Stack & Fondasi Antarmuka
- **Host & Framework:** Next.js 16 (App Router) + React 19 (Server Components secara default).
- **Styling & Design Tokens:** Tailwind CSS v4 + Shadcn UI primitives (`@radix-ui`, `base-ui`).
- **Icon Library Policy:** **HANYA gunakan `@tabler/icons-react`**. Dilarang keras menggunakan `lucide-react` atau `@iconify/react`.
- **Motion & Micro-interactions:** `motion` (`motion/react`) untuk animasi layout/akordeon.
- **Client API:** `@elysiajs/eden` (`treaty`) — Server Component memakai `apiServer` (`src/lib/api-server.ts`), Client Component memakai `getApi()` (`src/lib/api-client.ts`).

---

### 2. Standar Navigasi & Menu Sidebar
- Definisi URL halaman bersifat tersentralisasi di `src/components/layout/sidebar/routes.ts`. Semua navigasi wajib mengimpor objek `ROUTES`.
- Pohon menu navigasi tersentralisasi di `src/components/layout/navigation/sidebar-menu.ts`.
- Struktur menu terbagi dalam 6 pilar fungsional (sinkron dengan backend M1–M14):
  1. **Utama:** Dasbor & Analytics
  2. **Transaksi:** Penjualan, Pembelian, Biaya Operasional, Kas & Bank
  3. **Operasional & Persediaan:** Persediaan & Multi-Gudang, Aset Tetap & Depresiasi
  4. **Akuntansi & Pajak:** COA & Jurnal, Dimensi Biaya, Anggaran, Tutup Buku, PPN & PPh
  5. **Laporan Enterprise:** Finansial, Subledger & Aging AR/AP, Dagang, Multi-Periode, Konsolidasi Holding
  6. **Otomasi & Sistem:** Transaksi Berulang, Pengingat Jatuh Tempo, API Key & Webhook, Profil & RBAC, Persetujuan, Kunci Tanggal, Audit Log, Diagnostik & Health Check

---

### 3. Skala Prioritas Pengerjaan Halaman (ERP Dependency Hierarchy)
Pengembangan UI finansial tidak dapat dilakukan acak karena adanya dependensi data relasional yang ketat. Urutan pengerjaan halaman mengikuti 8 tingkatan prioritas standar industri:

1. **Tier F0 — Fondasi Komponen Finansial & Data-Table Engine:**
   - Komponen tabel data generik (`DataTable`: sorting, server-side pagination, search debounce, column visibility, row selection, export button).
   - Form controls khusus finansial: `CurrencyInput` (input Rupiah/valas format rapi tapi menghasilkan string desimal), `CoaCombobox`, `ContactCombobox`, `DatePickerWithPresets`.
   - Feedback & status primitives: `FinancialStatusBadge` (Draft, Posted, Partial, Paid, Void), `ConfirmationDialog`, `EmptyState`.
2. **Tier F1 — Master Data & Pengaturan Bisnis (Fondasi Utama):**
   - Bagan Akun / COA (`/akuntansi/bagan-akun`): tree view hierarki, modal tambah akun, normal balance.
   - Kontak Pelanggan & Pemasok (`/kontak/pelanggan`, `/kontak/pemasok`): detail rekening, batas kredit, NPWP.
   - Master Produk & Gudang (`/persediaan/produk`, `/persediaan/gudang`): multi-satuan, harga bertingkat, kode barcode.
   - Pengaturan Perusahaan & Mata Uang (`/pengaturan/perusahaan`, `/pengaturan/kunci-transaksi`): mata uang dasar, kurs historis, tanggal kunci transaksi.
   - Saldo Awal (`/akuntansi/bagan-akun/saldo-awal`): opening balance akun & mitra dagang.
3. **Tier F2 — Kas & Bank, Biaya, dan Buku Besar (Jantung Likuiditas):**
   - Rekening Kas & Bank (`/kas-bank/rekening`): kartu saldo, daftar akun kas/bank terhubung COA.
   - Biaya Operasional (`/biaya`): pencatatan pengeluaran cepat, akun beban, bukti bayar lampiran.
   - Kas Masuk, Kas Keluar & Mutasi (`/kas-bank/mutasi`).
   - Transfer Kas/Bank (`/kas-bank/transfer`) & Rekonsiliasi Bank (`/kas-bank/rekonsiliasi`): upload mutasi CSV & matching engine.
   - Jurnal Umum & Buku Besar (`/akuntansi/jurnal-umum`): voucher jurnal debet-kredit seimbang, filter tanggal/akun.
4. **Tier F3 — Siklus Dagang Inti: Pembelian (AP) & Penjualan (AR):**
   - Pembelian (`/pembelian/*`): Pesanan Pembelian (PO) → Faktur Pembelian → Pembayaran Hutang & Alokasi Faktur → Retur Pembelian.
   - Penjualan (`/penjualan/*`): Pesanan Penjualan (SO) → Faktur Penjualan → Penerimaan Piutang & Alokasi → Retur Penjualan.
5. **Tier F4 — Inventori Lanjutan & Aset Tetap:**
   - Transfer Antar Gudang (`/persediaan/transfer`) & Penyesuaian/Stok Opname (`/persediaan/penyesuaian`).
   - Daftar Aset Tetap (`/aset-tetap/daftar`), Jadwal Penyusutan Bulanan (`/aset-tetap/penyusutan`), dan Pelepasan Aset (`/aset-tetap/pelepasan`).
6. **Tier F5 — Kepatuhan Pajak Indonesia & Dimensi Akuntansi:**
   - Pajak Indonesia (`/pajak/*`): Rekap PPN Faktur Pajak Masukan/Keluaran, PPh Bukti Potong (PPh 21/23/4(2)), Ekspor Coretax.
   - Dimensi Biaya (`/akuntansi/dimensi`) & Anggaran vs Realisasi (`/akuntansi/anggaran`).
   - Tutup Buku Periode (`/akuntansi/tutup-buku`): tutup bulanan & tutup buku akhir tahun ke laba ditahan.
7. **Tier F6 — Laporan Finansial Enterprise & Cetak Dokumen:**
   - Laporan Finansial Standar SAK (`/laporan/finansial`): Neraca (Balance Sheet), Laba Rugi (Income Statement), Arus Kas (Cash Flow), Perubahan Ekuitas.
   - Laporan Pembantu & Umur Piutang/Hutang (`/laporan/subledger-aging`): Aging AR/AP per pelanggan/pemasok.
   - Laporan Dagang & Nilai Persediaan (`/laporan/dagang`).
   - Template Cetak Siap Pakai (Print-Ready HTML/PDF) untuk Faktur Penjualan, PO, dan Bukti Kas.
8. **Tier F7 — Tata Kelola Sistem, Keamanan & Otomasi:**
   - Manajemen Pengguna, Peran & Izin RBAC (`/pengaturan/pengguna-peran`).
   - Alur Persetujuan Bertingkat (`/pengaturan/persetujuan`).
   - Jejak Audit Log (`/pengaturan/audit-log`) & Diagnostik Sistem (`/pengaturan/diagnostik`).
   - Transaksi Berulang (`/otomasi/berulang`) & Pengingat Piutang/Hutang Jatuh Tempo (`/otomasi/pengingat`).

---

### 4. Struktur Folder & Co-location Pattern
Setiap rute halaman di `src/app/(dashboard)/` wajib mengikuti arsitektur modular terko-lokasi (*co-location*):

```
src/app/(dashboard)/<domain>/[...subroute]/
├─ page.tsx                  # Server Component (RSC): ambil data awal via apiServer / session
├─ loading.tsx               # Skeleton loading spesifik halaman
├─ error.tsx                 # Error boundary terisolasi ramah pengguna
├─ _components/              # Komponen privat hanya untuk fitur ini
│  ├─ <fitur>-table.tsx      # Komponen Client: tabel data, pagination, sorting
│  ├─ <fitur>-form-dialog.tsx# Komponen Client: form modal / drawer input & edit
│  ├─ <fitur>-filter-bar.tsx # Komponen Client: filter status, tanggal, search input
│  ├─ <fitur>-stats.tsx      # Komponen Server/Client: ringkasan metrik mini di atas tabel
│  └─ <fitur>-actions.tsx    # Menu aksi baris (edit, posting, batal, cetak)
├─ _lib/                     # Logika murni, schema, dan mapper domain
│  ├─ schema.ts              # Zod form validation schema
│  ├─ types.ts               # UI view-model types bila diperlukan
│  └─ formatters.ts          # Pemetaan status ke label/warna badge
└─ _hooks/                   # Custom hooks terisolasi untuk fitur ini (bila ada)
```

Komponen yang dipakai oleh **lebih dari 1 domain** ditempatkan di `src/components/`:
- `src/components/ui/`: Primitif Shadcn/Radix (Button, Dialog, Input, Table, Badge, Popover).
- `src/components/data-table/`: Sistem tabel data enterprise (sorting, pagination, debounce filter).
- `src/components/form/`: Kontrol form khusus finansial (`CurrencyInput`, `CoaSelect`, `ContactSelect`).
- `src/components/feedback/`: Dialog konfirmasi (`ConfirmActionDialog`), status banner, empty states.

---

### 5. Separation of Concerns (SoC) & 4-Layer Architecture
Setiap fitur antarmuka wajib memisahkan tanggung jawab ke dalam 4 lapisan:

1. **Layer 1: Orchestrator Page (Server Component / `page.tsx`)**
   - Berjalan di server. Memeriksa sesi dan izin akses pengguna (`requireSession()`).
   - Melakukan pre-fetching data awal menggunakan `apiServer` (in-process, tanpa overhead HTTP network hop).
   - Membungkus area dinamis dengan `<Suspense fallback={<CustomSkeleton />}>`.
   - Mengalirkan data awal ke Client Container melalui props.
2. **Layer 2: Client Container & Interaction Controller (`_components/*-table.tsx`, `*-form.tsx`)**
   - Diberi direktif `'use client'`.
   - Mengelola state interaktif (dialog terbuka/tertutup, filter aktif, sorting).
   - Memanggil mutasi data menggunakan Eden Treaty `getApi()` yang type-safe.
   - Menangani notifikasi feedback menggunakan `sonner` (`toast.success`, `toast.error`).
3. **Layer 3: Dumb / Presentational Components**
   - Komponen murni penerima props tanpa side-effect data-fetching.
   - Fokus 100% pada HTML semantik, aksesibilitas ARIA, dan styling Tailwind.
   - Contoh: baris tabel, kartu metrik, status badge, tombol aksi.
4. **Layer 4: Pure Business Domain Utilities (`_lib/` atau `src/lib/`)**
   - Fungsi murni tanpa JSX/React.
   - Format uang, normalisasi string desimal, kalkulasi subtotal/diskon/pajak.
   - Skema validasi Zod yang selaras dengan TypeBox backend.

---

### 6. Standar Penulisan & Form Idiomatik
- **Form State Management:** Wajib menggunakan `react-hook-form` + `@hookform/resolvers/zod`.
- **Validasi Sinkron Backend-Frontend:** Skema validasi input form (Zod) harus mencerminkan batasan model TypeBox backend (panjang string, batas desimal, enum status).
- **Nilai Finansial (Desimal Ketat):**
  - **Dilarang keras** menggunakan tipe `number` JavaScript murni untuk menampung atau menjumlahkan uang di frontend (mencegah bug presisi floating-point IEEE-754).
  - Nilai moneter dikelola sebagai `string` desimal terstandarisasi.
  - Tampilan visual menggunakan utilitas `formatCurrency(val, currencyCode)` atau `formatRupiah()`.
  - Kontrol input uang (`CurrencyInput`) menampilkan format ribuan interaktif ke pengguna, namun nilai di dalam form state tetap berupa `string` desimal murni (misal `"1500000.0000"`).

---

### 7. Semantik HTML, Tabular Numerik, & Aksesibilitas (A11y)
- **Tabel Data Keuangan:**
  - Wajib menggunakan elemen tabel semantik: `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>` dengan `scope="col"`, `<td>`.
  - **Kolom Angka & Finansial:** Wajib menggunakan kelas `text-right font-mono tabular-nums`. Angka debit/kredit harus sejajar vertikal sempurna.
  - **Indikator Debit / Kredit / Saldo Negatif:** Nilai negatif atau pengurang diformat jelas (misal dengan tanda kurung `(Rp 50.000)` atau warna peringatan semantik `text-rose-600 dark:text-rose-400`).
- **Status Dokumen Transaksi:**
  - Status tidak boleh hanya diidentifikasi oleh warna. Wajib menyertakan teks deskriptif yang jelas (misal: "Draft", "Menunggu Persetujuan", "Terposting", "Lunas", "Dibatalkan").
  - Gunakan elemen semantik badge `<span role="status" className="...">`.
- **Form Accessibility:**
  - Setiap field input wajib memiliki elemen `<label htmlFor="...">` yang terhubung dengan `id` input.
  - Pesan error validasi wajib memiliki `role="alert"` atau terhubung via `aria-describedby`.

---

### 8. Idiomatik Next.js 16 & React 19
- **Server Components by Default:** Jangan pernah menambahkan `'use client'` di tingkat `page.tsx` atau `layout.tsx`. Selalu jaga halaman sebagai RSC dan dorong batasan client (`'use client'`) ke daun komponen terluar (*leaf components*).
- **Async Route Params:** Di Next.js 16, `params` dan `searchParams` adalah Promise:
  ```tsx
  interface PageProps {
    params: Promise<{ slug: string[] }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  }
  export default async function Page(props: PageProps) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    // ...
  }
  ```
- **Streaming & Suspense Boundaries:** Setiap halaman yang mengambil data server wajib menyediakan `loading.tsx` atau `<Suspense fallback={<Skeleton />}>` agar transisi navigasi instan dan tanpa jeda layar putih (*zero layout shift*).
- **Error Boundaries:** Setiap domain memiliki `error.tsx` dengan penanganan galat yang ramah, tombol coba lagi (*retry button*), dan kode diagnostik.

---

### 9. Konvensi Penamaan File & Direktori Frontend (Strict Kebab-Case Standard)
Untuk menjaga kebersihan, keteraturan, dan mencegah inkonsistensi antar-sistem operasi (Windows/Linux/CI), seluruh penamaan di frontend diatur secara ketat:

- **Aturan Baku (Wajib 100% Kebab-Case):**
  - Seluruh file dan direktori di area frontend (`src/app/`, `src/components/`, `src/lib/`, `src/hooks/`) **WAJIB menggunakan format `kebab-case` huruf kecil dengan pemisah tanda hubung** (`-`).
  - **Dilarang Keras** menggunakan format `PascalCase` (seperti `AppShell.tsx`, `SidebarNav.tsx`, `ThemeToggle.tsx`, `MetricCard.tsx`) atau `camelCase` (seperti `useHoverMenu.ts`, `metricTypes.ts`) untuk nama file atau folder.
- **Nama Komponen React:**
  - Nama file ditulis dalam `kebab-case.tsx` (contoh: `app-shell.tsx`, `sidebar-nav.tsx`, `financial-status-badge.tsx`).
  - Di dalam kode file, fungsi/komponen React tetap diekspor menggunakan nama `PascalCase` idomatik (contoh: `export function SidebarNav()`, `export default function AppShell()`).
- **Custom Hooks:**
  - Wajib diawali prefiks `use-` diikuti nama deskriptif dalam kebab-case (contoh: `use-scrolled.ts`, `use-hover-menu.ts`, `use-chart-interaction.ts`).
- **Tipe Data & Skema Validasi:**
  - File definisi tipe dan skema ditulis dalam format `kebab-case.ts` (contoh: `metric-card-types.ts`, `constants.ts`, `schema.ts`).
- **Pengecualian:**
  - **File Konvensi Next.js App Router:** Mengikuti standar resmi Next.js (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`).
  - **UI Library Primitives (`src/components/ui/`):** Primitif bawaan Shadcn UI (`button.tsx`, `dialog.tsx`, `table.tsx`, dll.) dipertahankan sesuai konvensi ekosistem shadcn.
  - **Backend Layer:** File di `src/server/` dan `src/db/` mengikuti arsitektur backend yang telah ada.
