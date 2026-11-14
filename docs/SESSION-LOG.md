# Session Log

Catatan kronologis setiap sesi kerja. **Tambahkan entri baru di paling atas.** Jangan hapus entri lama.

Format:

```
## YYYY-MM-DD — S-xxx — <judul singkat>
- Milestone: Mx
- Dikerjakan: ...
- File/skema berubah: ...
- Migrasi: <nama file> | tidak ada
- Verifikasi: tsc / eslint / bun test (hasil nyata)
- Belum selesai / langkah berikutnya: ...
```

## 2026-11-14 — S-023 — Perbaikan Bug Multi-Hover & Lingering Ghost Pill: Single Source of Truth Hover & Diferensiasi Halaman Aktif
- Milestone: Antarmuka & Sidebar Bugfix (Selesai — Done)
- Dikerjakan:
  - **Penyelesaian Bug Hover Tertinggal (Lingering Ghost Pill)**:
    - Mengidentifikasi akar masalah: pemisahan state `hoveredTopId` dan `hoveredSubId` menyebabkan sub-item tetap menyimpan state hover saat kursor bergerak cepat ke menu tingkat atas atau menu bawah.
    - Menggabungkan seluruh state hover sidebar menjadi satu sumber kebenaran tunggal (*single source of truth*): `hoveredId: string | null`.
    - Menyatukan seluruh elemen navigasi (menu utama, tombol grup, dan sub-menu anak) ke dalam satu `layoutId="sidebar-hover-pill"`. Dengan ini, secara fisik mustahil ada lebih dari 1 kapsul hover yang aktif atau tertinggal di seluruh sidebar.
  - **Diferensiasi Jelas Halaman Aktif vs Kapsul Hover**:
    - Memberikan identitas visual yang tegas untuk halaman yang sedang aktif dibuka: bilah aksen vertikal primer di sisi kiri (`h-5 w-1 rounded-r-full bg-primary`) serta tipografi `font-semibold`.
    - Kapsul hover berseluncur kini tampil sebagai highlight interaktif lembut (`bg-sidebar-accent/50`), sehingga pengguna dapat membedakan dengan jelas antara *halaman yang sedang dibuka saat ini* dan *menu yang sedang diarahkan kursor*.
- File/skema berubah:
  - [src/components/layout/sidebar/SidebarNav.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/sidebar/SidebarNav.tsx).
- Migrasi: tidak ada (frontend UI layer).
- Verifikasi:
  - `bun run typecheck` (`tsc --noEmit`) lulus 100% (0 errors).
  - `bun run lint` (`eslint .`) lulus 100% (0 errors, 0 warnings).


## 2026-11-14 — S-022 — Implementasi Motion Interaktif Sidebar: Sliding Hover Pill Berseluncur & Animasi Akordeon/Collapse Ultra-Smooth
- Milestone: Antarmuka & Motion UX (Selesai — Done)
- Dikerjakan:
  - **Sliding Hover Pill Berseluncur (`layoutId`)**:
    - Mengintegrasikan Motion v14 (`motion/react`) untuk efek hover navigasi yang meluncur mulus mengikuti pergerakan kursor mouse (*magnetic floating capsule*):
      - Di menu tingkat atas: `motion.span` dengan `layoutId="sidebar-top-hover-pill"` meluncur mulus dari satu menu ke menu lainnya dengan fisika pegas (`type: "spring", stiffness: 450, damping: 35`).
      - Di sub-menu: `motion.span` dengan `layoutId={`sub-hover-pill-${group.id}`}` meluncur antar item sub-menu dalam grup yang sama.
      - Saat kursor meninggalkan area sidebar (`onMouseLeave`), kapsul hover otomatis memudar (*fade-out*) dengan anggun.
  - **Animasi Akordeon Sub-menu & Rotasi Chevron**:
    - Mengganti transisi CSS grid pada `SidebarGroup` dengan `AnimatePresence` dan `motion.div` (`height: 0 -> auto`, `opacity: 0 -> 1` dengan kurva pegas non-bouncy).
    - Menganimasikan rotasi ikon panah `IconChevronRight` (`rotate: open ? 90 : 0`) dengan transisi pegas responsif.
  - **Animasi Transisi Collapse / Expand Sidebar**:
    - Menambahkan `AnimatePresence` pada teks tautan `SidebarLink` dan label kategori `SidebarNav` agar saat sidebar diciutkan ke mode rel (rail icon), teks memudar dan menyusut mulus tanpa lonjakan visual (*layout pop*).
    - Menambahkan transisi transisi pergantian logo pada `Sidebar.tsx` antara logo penuh (*Full Logo*) dan logo ikon ringkas (*Compact Logo*) menggunakan animasi scale & opacity halus.
- File/skema berubah:
  - [src/components/layout/sidebar/SidebarNav.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/sidebar/SidebarNav.tsx), [src/components/layout/sidebar/Sidebar.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/sidebar/Sidebar.tsx), [src/components/layout/types/styles.ts](file:///e:/Coding/elysiafinnace/src/components/layout/types/styles.ts).
- Migrasi: tidak ada (frontend UI layer).
- Verifikasi:
  - `bun run typecheck` (`tsc --noEmit`) lulus 100% (0 errors).
  - `bun run lint` (`eslint .`) lulus 100% (0 errors, 0 warnings).
  - `bun run build` (Next.js Turbopack) lulus 100% (9/9 routes).


## 2026-11-14 — S-021 — Penyempurnaan Garis Pemandu & Dot Sub-menu: Garis Terputus Tanpa Menempel, Dot Lebih Besar & Warna Lembut
- Milestone: Antarmuka & Sidebar Polish (Selesai — Done)
- Dikerjakan:
  - **Garis Vertikal Terputus Rapi (Segmented Guide Rail)**:
    - Menghapus garis solid vertikal tunggal yang sebelumnya menembus/menempel dot.
    - Mengganti dengan segmen garis diskrit per item: segmen atas berhenti sebelum dot (`top-0 h-2`), dan segmen bawah dimulai setelah dot (`bottom-[-2px] h-2.5`), menyisakan ruang bebas bernapas 18px di sekeliling dot.
    - Garis tidak lagi menyentuh dot, menciptakan ritme visual terputus-putus (*interrupted nodes rail*) yang bersih dan teratur. Segmen garis otomatis berhenti di item terakhir tanpa sisa menjuntai.
  - **Peningkatan Ukuran & Pewarnaan Dot**:
    - **Ukuran Diperbesar**: Memperbesar ukuran dasar dot dari `size-1` (4px) menjadi `size-2` (8px), sehingga tampak jelas dan proporsional di dalam kolom 20px.
    - **Penurunan Intensitas Warna**: Mengganti warna dot gelap/hitam dengan abu-abu netral lembut (`bg-muted-foreground/20 border border-border/80`), menghilangkan kontras hitam pekat yang terlalu tajam.
    - **Ekspansi Dinamis Saat Aktif**: Saat sub-menu aktif, dot membesar secara mulus (`transition-all duration-200`) menjadi kapsul pil bercahaya warna primer (`h-2 w-3.5 bg-primary shadow-xs`).
- File/skema berubah:
  - [src/components/layout/sidebar/SidebarNav.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/sidebar/SidebarNav.tsx).
- Migrasi: tidak ada (frontend UI layer).
- Verifikasi:
  - `bun run typecheck` (`tsc --noEmit`) lulus 100% (0 errors).
  - `bun run lint` (`eslint .`) lulus 100% (0 errors, 0 warnings).


## 2026-11-14 — S-020 — Penataan Linear & Presisi Sub-menu Sidebar: Label Segaris 100% dengan Induk & Indikator Kapsul Elegan
- Milestone: Antarmuka & Sidebar UX (Selesai — Done)
- Dikerjakan:
  - **Penjajaran Sempurna Label Sub-Menu dengan Label Induk (Collinear Alignment)**:
    - Menghapus indentasi berlebihan (`ms-5.5 ps-2` ~30px) pada daftar `<ul>` anak yang sebelumnya membuat sub-menu menjorok terlalu jauh ke depan seperti tangga teks.
    - Menyelaraskan posisi awal teks sub-menu pada koordinat horizontal yang sama persis dengan teks tombol grup induk (`x = 44px` yang dibentuk dari `px-3 (12px)` + `kolom ikon/indikator (20px)` + `gap-3 (12px)`).
    - Menghilangkan efek translasi horizontal melompat (`slideOnHover: hover:translate-x-1`) pada teks tautan agar posisi vertikal tetap stabil, solid, dan tenang saat kursor melintas.
  - **Relokasi & Peningkatan Estetika Titik Indikator (Modern Capsule Pip & Guide Rail)**:
    - Memundurkan posisi titik indikator dari yang sebelumnya menempel di depan teks anak menjadi tepat berada di kolom 20px di bawah ikon induk (`x = 22px`).
    - Menambahkan garis vertikal pemandu tipis (*subtle tree guide rail*) di sepanjang tengah kolom ikon (`left-[21.5px]`).
    - Mengganti dot bulat biasa dengan indikator kapsul mikro dinamis:
      - *Idle*: Titik mikro halus (`size-1`) yang memanjang secara elegan saat di-hover (`h-1 w-2`).
      - *Active*: Kapsul bercahaya warna primer (`h-1.5 w-3 bg-primary shadow-xs`) yang mempertegas menu aktif.
- File/skema berubah:
  - [src/components/layout/sidebar/SidebarNav.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/sidebar/SidebarNav.tsx), [src/components/layout/types/styles.ts](file:///e:/Coding/elysiafinnace/src/components/layout/types/styles.ts).
- Migrasi: tidak ada (frontend UI layer).
- Verifikasi:
  - `bun run typecheck` (`tsc --noEmit`) lulus 100% (0 errors).
  - `bun run lint` (`eslint .`) lulus 100% (0 errors, 0 warnings).
  - `bun run build` (Next.js Turbopack) lulus 100% (9/9 static & dynamic routes compiled).


## 2026-11-14 — S-019 — Redesign Palet Perintah (Command Center) Eksekutif: Luxury Glassmorphic Styling, Filter Kategori Interaktif, dan Aksi Cepat Finansial
- Milestone: Antarmuka & UX Eksekutif (Selesai — Done)
- Dikerjakan:
  - **Redesign Search Trigger Bar (Header)**:
    - Mengganti tombol button template dengan search cockpit minimalis-elegan beraksen frosted glass (`backdrop-blur-md`), micro-badge `Ctrl K`, dan efek hover responsif.
  - **Redesign Command Dialog & Primitif (`src/components/ui/command.tsx`)**:
    - Dialog diperlebar ke standar modern (`sm:max-w-2xl md:max-w-3xl`) dengan hairline border halus, bayangan mewah (`shadow-2xl`), dan background glassmorphism.
    - Input header setinggi `h-14` dengan ikon pencarian berbingkai aksen, kontras tipografi tinggi, dan tombol clear interaktif.
    - Area daftar diperlebar hingga `max-h-[460px]` dengan styling item kartu modern (`rounded-xl`), highlight saat aktif, dan micro-label uppercase untuk heading kelompok.
  - **Fitur Fungsional & Pusat Kendali (`Search.tsx`)**:
    - **Filter Kategori Interaktif**: Menambahkan tab chips (`Semua`, `⚡ Aksi Cepat`, `Transaksi`, `Persediaan`, `Akuntansi`, `Laporan`, `Otomasi`) yang dapat diklik langsung untuk memfilter ruang lingkup pencarian.
    - **Beranda Aksi Cepat Finansial (Quick Actions)** saat query kosong:
      - *Buat Faktur Penjualan Baru* (`/penjualan/faktur`)
      - *Catat Biaya Operasional* (`/biaya`)
      - *Transfer Saldo Kas & Bank* (`/kas-bank/transfer`)
      - *Input Jurnal Penyesuaian* (`/akuntansi/jurnal-umum`)
      - *Diagnostik & Latensi DB* (`/pengaturan/diagnostik`)
    - **Modul Sering Diakses**: Pintasan cepat ke Laporan Finansial, Subledger Aging, Bagan Akun COA, Multi-Gudang, dan Otomasi Transaksi Berulang.
    - **Footer Toolbar Mewah**: Menampilkan live status badge (total aksi & rute terindeks) dan keycap keyboard helpers (`↑↓ Pilih`, `↵ Buka`, `Esc Tutup`).
- File/skema berubah:
  - [src/components/layout/header/Search.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/header/Search.tsx), [src/components/ui/command.tsx](file:///e:/Coding/elysiafinnace/src/components/ui/command.tsx), [src/components/layout/navigation/utils.ts](file:///e:/Coding/elysiafinnace/src/components/layout/navigation/utils.ts).
- Migrasi: tidak ada (frontend UI layer).
- Verifikasi:
  - `bun run typecheck` (`tsc --noEmit`) lulus 100% (0 errors).
  - `bun run lint` (`eslint .`) lulus 100% (0 errors, 0 warnings).


## 2026-11-14 — S-018 — Sinkronisasi Penuh Menu Sidebar 6 Pilar & Migrasi Total ke Tabler Icons (@tabler/icons-react)
- Milestone: Antarmuka & Navigasi (Selesai — Done)
- Dikerjakan:
  - **Sinkronisasi Menu Sidebar 6 Pilar (M1–M14)**:
    - Memetakan ulang seluruh modul backend ke navigasi frontend di `src/components/layout/sidebar/routes.ts` dan `src/components/layout/navigation/sidebar-menu.ts`:
      1. *Utama*: Dasbor & Analytics
      2. *Transaksi*: Penjualan, Pembelian, Biaya Operasional, Kas & Bank
      3. *Operasional & Persediaan*: Katalog Produk, Multi-Gudang, Transfer Stok, Penyesuaian & Opname, Aset Tetap & Depresiasi
      4. *Akuntansi & Pajak*: Bagan Akun (COA), Jurnal Penyesuaian, Dimensi Biaya (Cost Center), Anggaran, Tutup Buku Periode, Faktur Pajak PPN & Bukti Potong PPh
      5. *Laporan Enterprise*: Finansial Inti, Subledger & Aging AR/AP, Laporan Dagang, Laba Rugi Komparatif, Konsolidasi Holding & Eliminasi Antar-Entitas
      6. *Otomasi & Sistem*: Transaksi Berulang, Pengingat Jatuh Tempo, API Key & Webhook, Profil & RBAC, Persetujuan, Kunci Transaksi, Jejak Audit, Diagnostik Latensi DB
    - Memperbarui komponen `SidebarNav.tsx`, `Search.tsx`, `Header.tsx`, `MegaMenu.tsx`, `Notifications.tsx`, `Profile.tsx`, dan `header-links.ts` agar membaca struktur dan rute baru.
  - **Migrasi Total Library Ikon**:
    - Mencabut dan menghapus dependensi `@iconify/react` dan `lucide-react` dari `package.json`.
    - Menginstal `@tabler/icons-react` (v3.52.0) sebagai satu-satunya pustaka ikon di seluruh aplikasi.
    - Mengganti seluruh pemanggilan ikon di:
      - Seluruh menu navigasi, sidebar, search modal, dan header
      - `kpi-card.tsx` dan `MetricCard.tsx`
      - Semua komponen `src/components/ui/` (`accordion`, `breadcrumb`, `calendar`, `carousel`, `checkbox`, `combobox`, `command`, `context-menu`, `dialog`, `dropdown-menu`, `input-otp`, `menubar`, `message-scroller`, `native-select`, `navigation-menu`, `pagination`, `radio-group`, `resizable`, `select`, `sheet`, `sidebar`, `sonner`, `spinner`)
    - Memperbarui `ThemeToggle.tsx` dan `use-mobile.ts` menggunakan standar `useSyncExternalStore` (React 19) tanpa trigger lint/hydration warnings.
  - **Dokumentasi Arsitektur**:
    - Menambahkan klausul aturan tegas di `docs/ARCHITECTURE.md` mengenai standar penggunaan eksklusif `@tabler/icons-react` dan larangan penggunaan iconify / lucide.
- File/skema berubah:
  - `package.json`, `docs/ARCHITECTURE.md`, `src/components/layout/navigation/sidebar-menu.ts`, `src/components/layout/sidebar/routes.ts`, `src/components/layout/navigation/types.ts`, `src/components/layout/sidebar/SidebarNav.tsx`, `src/components/layout/header/Search.tsx`, `src/components/layout/header/Header.tsx`, `src/components/layout/header/MegaMenu.tsx`, `src/components/layout/header/Notifications.tsx`, `src/components/layout/header/Profile.tsx`, `src/components/layout/navigation/header-links.ts`, `src/components/layout/ThemeToggle.tsx`, `src/app/(dashboard)/dashboard/_components/kpi-card.tsx`, `src/components/chart/MetricCard.tsx`, seluruh file di `src/components/ui/*.tsx`.
- Migrasi: tidak ada (frontend & UI layer)
- Verifikasi:
  - `bun run typecheck` (`tsc --noEmit`) lulus 100% (0 errors).
  - `bun run lint` (`eslint .`) lulus 100% (0 errors, 0 warnings).
  - `tests/otomasi-m13.test.ts` lulus 5/5 skenario.
  - `tests/produksi-m14.test.ts` lulus 5/5 skenario.
- Belum selesai / langkah berikutnya:
  - Pengembangan UI pages / screen view untuk masing-masing modul M1–M14 yang telah didaftarkan pada rute sidebar.


## 2026-11-14 — S-017 — Implementasi Penuh Milestone M13 (Otomasi: Transaksi Berulang, Pengingat Jatuh Tempo, API Key & Webhook) dan M14 (Kesiapan Produksi: Idempotensi, Observabilitas, Indeks DB & Runbook)
- Milestone: M13 & M14 (100% Selesai — Done)
- Dikerjakan:
  - **Milestone M13 — Otomasi**:
    - **Transaksi Berulang (Recurring Transactions)**:
      - Tabel `recurring_transactions` dan `recurring_execution_logs`.
      - CRUD jadwal transaksi berulang (`HARIAN`, `MINGGUAN`, `BULANAN`, `TAHUNAN`) untuk jurnal umum, faktur penjualan, dan faktur pembelian.
      - Engine eksekusi otomatis (`eksekusiTransaksiBerulang`): membaca jadwal jatuh tempo, membuat dan memposting dokumen riil (jurnal/faktur), memajukan `tanggalBerikutnya` sesuai frekuensi, merekam riwayat eksekusi, dan menembakkan event webhook.
    - **Pengingat Jatuh Tempo via Email (Due Date Reminder Engine)**:
      - Tabel `reminder_logs` mencatat riwayat pengiriman notifikasi agar tidak terjadi spamming duplikat pada offset yang sama.
      - Service `prosesPengingatJatuhTempo`: memindai faktur piutang/hutang belum lunas, menghitung hari selisih jatuh tempo terhadap target offset (default H-3, Hari H, H+7), menyusun konten email tagihan profesional, dan menembakkan event webhook.
    - **Integrasi API Key & Webhook**:
      - Tabel `api_keys` dengan prefix aman `ef_live_` dan hashing SHA-256 untuk autentikasi pihak ketiga.
      - Tabel `webhooks` dan `webhook_deliveries` dengan signature HMAC-SHA256 (`x-elysia-signature`) pada setiap payload event (`transaksi.berulang.dieksekusi`, `pengingat.jatuh_tempo.terkirim`).
      - Service dispatching webhook asinkronus dengan timeout handling dan pencatatan status respons HTTP serta durasi latensi.
    - **REST API Elysia**:
      - Controller terpasang di `/api/keuangan/otomasi` (rute jadwal, eksekusi, pengingat, api-keys, dan webhooks).
  - **Milestone M14 — Kesiapan Produksi**:
    - **Idempotency Key Engine**:
      - Tabel `idempotency_keys` untuk menyimpan hash request body (SHA-256), status HTTP, dan response body dengan masa retensi 24 jam.
      - Pengecekan idempotensi (`periksaIdempotency` & `simpanIdempotency`): me-replay respons yang sama tanpa mengeksekusi ulang logika bisnis jika key dan payload identik, serta menolak request dengan key yang sama tetapi payload berbeda (mencegah collision payload).
    - **Diagnostik Health Check & Database Latency**:
      - Endpoint `/api/keuangan/produksi/health`: mengukur latensi real-time ping database PostgreSQL (`SELECT 1`), status connection pool, uptime server, dan penggunaan memori (heapUsed, heapTotal, rss).
    - **Structured Logging & Tracing**:
      - Modul logger terstruktur `src/server/core/logger.ts` format JSON (`timestamp`, `level`, `requestId`, `modul`, `durasiMs`, `statusHttp`).
    - **Indeks Database Performa Tinggi**:
      - Ditambahkan 4 indeks query kritis pada migrasi `0014_otomasi_dan_produksi_m13_m14.sql`:
        - `idx_journal_items_akun_jurnal` pada `journal_items(akun_id, jurnal_id)`
        - `idx_sales_invoices_jatuh_tempo_sisa` pada `sales_invoices(tanggal_jatuh_tempo, sisa_tagihan)`
        - `idx_purchase_invoices_jatuh_tempo_sisa` pada `purchase_invoices(tanggal_jatuh_tempo, sisa_tagihan)`
        - `idx_audit_logs_waktu_entitas` pada `audit_logs(waktu, entitas)`
    - **Dokumentasi Runbook Produksi & Strategi Migrasi Tanpa Downtime**:
      - Dibuat `docs/PRODUCTION-RUNBOOK.md` mencakup: panduan arsitektur produksi, standar idempotensi, pola migrasi tanpa downtime (expand & contract), strategi automated backup (`pg_dump` & WAL archiving PITR), dan ambang batas monitoring (alerting thresholds).
  - **Migrasi Database**:
    - Dibuat migrasi `0014_otomasi_dan_produksi_m13_m14.sql`, didaftarkan di `meta/_journal.json`, dan sukses diterapkan ke database Neon PostgreSQL.
  - **Pengujian & Verifikasi Menyeluruh**:
    - Dibuat skrip integrasi `tests/otomasi-m13.test.ts` (5 skenario uji M13) -> 100% PASSED.
    - Dibuat skrip integrasi `tests/produksi-m14.test.ts` (5 skenario uji M14) -> 100% PASSED.
    - `bun x tsc --noEmit` -> 0 error.
    - `bun x eslint` -> 0 error, 0 warning.
    - `bun run build` (Next.js 16.4.5 Turbopack build) -> sukses 100%.
- File/skema berubah:
  - `src/db/schema/keuangan/otomasi.ts`
  - `src/db/schema/keuangan/produksi.ts`
  - `src/db/schema/keuangan/konstanta.ts`
  - `src/db/schema/keuangan/index.ts`
  - `src/db/migrations/0014_otomasi_dan_produksi_m13_m14.sql`
  - `src/db/migrations/meta/_journal.json`
  - `src/server/modules/keuangan/otomasi/model.ts`
  - `src/server/modules/keuangan/otomasi/service.ts`
  - `src/server/modules/keuangan/otomasi/index.ts`
  - `src/server/modules/keuangan/produksi/idempotency.ts`
  - `src/server/modules/keuangan/produksi/health.ts`
  - `src/server/modules/keuangan/produksi/index.ts`
  - `src/server/modules/keuangan/shared/access.ts`
  - `src/server/modules/keuangan/index.ts`
  - `src/server/core/logger.ts`
  - `docs/PRODUCTION-RUNBOOK.md`
  - `tests/otomasi-m13.test.ts`
  - `tests/produksi-m14.test.ts`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: `0014_otomasi_dan_produksi_m13_m14.sql` (diterapkan ke Neon PostgreSQL)
- Verifikasi:
  - `bun run tests/otomasi-m13.test.ts` -> 5 skenario pengujian lulus 100%
  - `bun run tests/produksi-m14.test.ts` -> 5 skenario pengujian lulus 100%
  - `bun x tsc --noEmit` -> 0 error
  - `bun x eslint` -> 0 error, 0 warning
  - `bun run build` -> Next.js 16.4.5 Turbopack build sukses 100%
- Belum selesai / langkah berikutnya:
  - Seluruh milestone backend ERP (M1 s/d M14) telah selesai 100% dan siap produksi.

## 2026-11-14 — S-016 — Implementasi Penuh Milestone M12 (Laporan Enterprise, Buku Besar Pembantu AR/AP, Aging AR/AP, Laporan Dagang, Laba Rugi Komparatif, Konsolidasi Holding & Cetak Dokumen)
- Milestone: M12 (100% Selesai — Done)
- Dikerjakan:
  - **Buku Besar Pembantu (Subledger) Piutang & Hutang Usaha**:
    - `bukuBesarPembantuPiutang`: kalkulasi saldo awal (debit - kredit), mutasi debit/kredit per pelanggan dari jurnal terposting akun piutang usaha (1120 / PERAN PIUTANG_USAHA), saldo akhir berjalan, dan ringkasan grand total.
    - `bukuBesarPembantuHutang`: kalkulasi saldo awal (kredit - debit), mutasi kredit/debit per pemasok dari jurnal terposting akun hutang usaha (2110 / PERAN HUTANG_USAHA), saldo akhir berjalan, dan ringkasan grand total.
  - **Laporan Umur Piutang & Hutang (AR / AP Aging Reports)**:
    - `laporanAgingPiutang`: pengelompokan sisa tagihan faktur penjualan (`salesInvoices` terposting dengan sisa > 0) ke dalam 5 interval umur jatuh tempo: `current` (belum jatuh tempo), `hari1_30` (1-30 hari), `hari31_60` (31-60 hari), `hari61_90` (61-90 hari), dan `hari90Plus` (> 90 hari) per pelanggan dan grand total.
    - `laporanAgingHutang`: pengelompokan sisa tagihan faktur pembelian (`purchaseInvoices` terposting dengan sisa > 0) ke dalam 5 interval umur jatuh tempo yang sama per pemasok dan grand total.
  - **Laporan Penjualan & Pembelian (Sales & Purchase Reports)**:
    - `laporanPenjualanPelanggan`: agregasi penjualan per pelanggan (jumlah faktur, subtotal, ppn, diskon, total penjualan, total HPP, margin laba kotor nominal dan persentase margin).
    - `laporanPenjualanItem`: agregasi kuantitas terjual, total nilai penjualan, total HPP, dan rata-rata harga jual per SKU item persediaan.
    - `laporanPembelianPemasok`: agregasi pembelian per pemasok (jumlah faktur, subtotal, ppn, total nilai pembelian).
    - `laporanPembelianItem`: agregasi kuantitas dibeli, total nilai pembelian, dan rata-rata harga beli per SKU item persediaan.
  - **Laporan Laba Rugi Komparatif**:
    - `laporanLabaRugiKomparatif`: membandingkan dua periode waktu (misalnya Q1 vs Q2, atau Bulan Berjalan vs Bulan Lalu), menyajikan pendapatan, total beban (HPP + beban operasional), dan laba bersih beserta selisih nominal dan persentase perubahan.
  - **Laporan Konsolidasi Holding (Multi-Company Consolidation)**:
    - `laporanKonsolidasiHolding`: mengonsolidasikan laporan neraca dan laba rugi tahun berjalan (YTD) untuk seluruh entitas grup perusahaan di bawah holding company (`indukId`), memverifikasi keseimbangan neraca konsolidasian (Aset = Kewajiban + Ekuitas).
  - **Cetak Dokumen Transaksi (Printable / PDF-Ready View)**:
    - `cetakDokumenTransaksi`: menyusun layout siap cetak / PDF untuk dokumen `FAKTUR_PENJUALAN` dan `FAKTUR_PEMBELIAN`, lengkap dengan kop dokumen, nomor faktur, status, tanggal transaksi, tanggal jatuh tempo, identitas partner, tabel rincian baris barang (SKU, nama item, kuantitas terformat, harga satuan, subtotal), kalkulasi pajak & diskon, total tagihan, serta kotak tanda tangan.
  - **Generator Ekspor CSV RFC-4180**:
    - `buatCsv`: utilitas ekspor data tabel dan laporan keuangan ke format file CSV sesuai standar RFC 4180 dengan escaping karakter kutip ganda (`""`), koma, dan newline secara presisi.
  - **Eksposur REST API Elysia (`src/server/modules/keuangan/laporan/`)**:
    - Ditambahkan skema TypeBox dan 10 rute endpoint laporan baru:
      - `GET /api/keuangan/laporan/subledger-piutang`
      - `GET /api/keuangan/laporan/subledger-hutang`
      - `GET /api/keuangan/laporan/aging-piutang`
      - `GET /api/keuangan/laporan/aging-hutang`
      - `GET /api/keuangan/laporan/penjualan-pelanggan`
      - `GET /api/keuangan/laporan/penjualan-item`
      - `GET /api/keuangan/laporan/pembelian-pemasok`
      - `GET /api/keuangan/laporan/pembelian-item`
      - `GET /api/keuangan/laporan/laba-rugi-komparatif`
      - `GET /api/keuangan/laporan/konsolidasi-holding`
      - `GET /api/keuangan/laporan/cetak-dokumen`
  - **Pengujian & Verifikasi Menyeluruh**:
    - Dibuat skrip integrasi `tests/laporan-enterprise-m12.test.ts` mencakup 13 skenario pengujian:
      1. Setup master data satuan, item persediaan, pelanggan, dan pemasok.
      2. Pembuatan dan posting Faktur Pembelian (AP).
      3. Pembuatan dan posting Faktur Penjualan (AR).
      4. Verifikasi Buku Besar Pembantu Piutang (AR Subledger) dan saldo akhir berjalan.
      5. Verifikasi Buku Besar Pembantu Hutang (AP Subledger) dan saldo akhir berjalan.
      6. Verifikasi Laporan Aging Piutang (pengujian bucket current vs bucket hari1_30).
      7. Verifikasi Laporan Aging Hutang.
      8. Verifikasi Laporan Penjualan per Pelanggan dan per Item.
      9. Verifikasi Laporan Pembelian per Pemasok dan per Item.
      10. Verifikasi Laporan Laba Rugi Komparatif (selisih & persentase perubahan).
      11. Verifikasi Laporan Konsolidasi Holding.
      12. Verifikasi Engine Cetak Dokumen Faktur Penjualan dan Faktur Pembelian (HTML layout).
      13. Verifikasi Generator Ekspor CSV RFC-4180.
    - `bun run tests/laporan-enterprise-m12.test.ts`: PASSED (13 skenario lulus 100%).
    - `bun x tsc --noEmit`: PASSED (0 error).
    - `bun x eslint`: PASSED (0 error, 0 warning).
    - `bun run build` (Next.js 16.4.5 Turbopack build): PASSED (sukses 0 error).
- File/skema berubah:
  - `src/server/modules/keuangan/shared/csv.ts`
  - `src/server/modules/keuangan/laporan/model.ts`
  - `src/server/modules/keuangan/laporan/service.ts`
  - `src/server/modules/keuangan/laporan/index.ts`
  - `tests/laporan-enterprise-m12.test.ts`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada (memanfaatkan skema tabel dagang, jurnal, dan kontrol yang sudah ada)
- Verifikasi:
  - `bun run tests/laporan-enterprise-m12.test.ts` -> 13 skenario pengujian lulus 100%
  - `bun x tsc --noEmit` -> 0 error
  - `bun x eslint src/server/modules/keuangan/laporan src/server/modules/keuangan/shared/csv.ts tests/laporan-enterprise-m12.test.ts` -> 0 error, 0 warning
  - `bun run build` -> Next.js 16.4.5 Turbopack build sukses 100%
- Belum selesai / langkah berikutnya:
  - Siap lanjut ke **Milestone M13 — Otomasi (Recurring transactions, reminder jatuh tempo, webhook & integrasi API pihak ketiga)**.

## 2026-11-14 — S-015 — Implementasi Penuh Milestone M11 (RBAC Penuh, Multi-Perusahaan/Tenant, Audit Log, Persetujuan Bertingkat & Kunci Transaksi)
- Milestone: M11 (100% Selesai — Done)
- Dikerjakan:
  - **RBAC Penuh & Hak Akses Pengguna (`src/server/modules/keuangan/rbac/`)**:
    - Proteksi peran sistem bawaan (`ADMIN`, `AKUNTAN`, `KASIR`, `AUDITOR`) dengan penanda `adalahSistem` agar tidak bisa dihapus.
    - Penambahan peran `AUDITOR` dengan seluruh izin baca (`.baca`).
    - Modul model, service, dan router Elysia `/api/keuangan/rbac`:
      - CRUD peran kustom dengan validasi terhadap katalog izin sistem (`KATALOG_IZIN`).
      - Endpoint katalog izin terstruktur berkelompok per modul bisnis.
      - Penugasan peran pengguna (`user_roles`), pencabutan peran, dan kalkulasi izin efektif pengguna per request (tanpa cache memori, aman untuk serverless).
  - **Multi-Perusahaan (Multi-Tenant / Companies)**:
    - Tabel `companies` dengan dukungan hierarki grup holding (`adalahHolding`, `indukId`), alamat, kontak, logo, dan mata uang dasar.
    - Tabel `company_users` (keanggotaan user di perusahaan) dan `company_invitations` berbasis token aman acak dengan masa kedaluwarsa 7 hari.
    - Seeding perusahaan holding bawaan `PT-ELYSIA` (PT Elysia Finance Indonesia).
  - **Pembatasan Akses Cabang & Gudang Per Pengguna**:
    - Tabel `user_branch_access` dan `user_warehouse_access` untuk mengunci pengguna ke cabang/gudang spesifik (jika kosong = akses tidak dibatasi / unrestricted).
    - API konfigurasi pembatasan akses dan pengecekan cabang/gudang yang diizinkan untuk pengguna.
  - **Sistem Audit Log Lengkap (Audit Trail)**:
    - Tabel `audit_logs` merekam siapa (`penggunaId`, `penggunaNama`), apa (`aksi`, `entitas`, `entitasId`), kapan (`waktu`), nomor referensi, serta snapshot JSON `dataSebelum` vs `dataSesudah` beserta jejak IP address dan user agent.
    - API query audit log dengan filter entitas, aksi, pengguna, dan rentang tanggal.
  - **Alur Persetujuan Bertingkat (Approval Workflow)**:
    - Master aturan persetujuan (`approval_rules`) bertingkat per jenis dokumen (`PESANAN_PEMBELIAN`, `FAKTUR_PEMBELIAN`, `FAKTUR_PENJUALAN`, `PEMBAYARAN`, `BIAYA`, `JURNAL_UMUM`, `ANGGARAN`) dan batas nominal target.
    - Pengajuan persetujuan dokumen (`document_approvals`) dan riwayat aksi peninjauan bertingkat (`approval_actions`).
    - Evaluasi threshold otomatis (dokumen di bawah ambang batas disetujui otomatis; dokumen di atas ambang batas masuk antrean persetujuan bertingkat hingga tingkat maksimal tercapai).
  - **Kunci Tanggal Transaksi (Lock Date)**:
    - Tabel `transaction_locks` menyimpan batas tanggal `kunciSemuaSebelum` (penguncian buku total) dan `kunciNonAdminSebelum` (penguncian untuk non-admin).
    - Integrasi validasi ke double-entry engine (`simpanJurnal`, `gantiJurnalDraft`, `balikJurnal`) menolak transaksi pada tanggal buku terkunci.
  - **Migrasi Database**:
    - Dibuat migrasi `0013_rbac_multi_tenant_audit_m11.sql`, didaftarkan di `meta/_journal.json`, dan sukses diterapkan ke database Neon PostgreSQL.
  - **Pengujian & Verifikasi Menyeluruh**:
    - Dibuat skrip integrasi `tests/rbac-kontrol-m11.test.ts` mencakup 7 skenario pengujian:
      1. Verifikasi peran sistem (ADMIN, AKUNTAN, KASIR, AUDITOR), penolakan penghapusan peran sistem, pembuatan peran kustom, update peran, dan katalog izin.
      2. Penugasan peran pengguna dummy, verifikasi izin efektif gabungan, pencabutan peran, dan update izin.
      3. Pembuatan anak perusahaan di bawah holding, verifikasi hierarki grup, pengiriman undangan token, dan penerimaan undangan.
      4. Pembatasan akses cabang dan gudang per pengguna.
      5. Perekaman audit log dengan snapshot sebelum/sesudah dan pembacaan kembali.
      6. Evaluasi alur persetujuan bertingkat: auto-approve di bawah batas, multi-tier escalation (Level 1 $\to$ Level 2 $\to$ DISETUJUI), serta alur penolakan (DITOLAK).
      7. Penegakan kunci tanggal transaksi pada double-entry engine (menolak posting pada tanggal terkunci).
    - `bun run tests/rbac-kontrol-m11.test.ts`: PASSED (7 skenario lulus 100%).
    - `bun run typecheck` (`tsc --noEmit`): PASSED (0 error).
    - `bun run eslint`: PASSED (0 error, 0 warning).
    - `bun run build` (Next.js 16.4.5 Turbopack build): PASSED (sukses 0 error).
- File/skema berubah:
  - `src/db/schema/keuangan/konstanta.ts`
  - `src/server/modules/keuangan/shared/access.ts`
  - `src/db/schema/keuangan/kontrol.ts` (baru)
  - `src/db/schema/keuangan/index.ts`
  - `src/db/seed/keuangan.ts`
  - `src/server/modules/keuangan/rbac/model.ts`, `service.ts`, `index.ts` (baru)
  - `src/server/modules/keuangan/kontrol/model.ts`, `service.ts`, `index.ts` (baru)
  - `src/server/modules/keuangan/jurnal/engine.ts`
  - `src/server/modules/keuangan/index.ts`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: `src/db/migrations/0013_rbac_multi_tenant_audit_m11.sql` (sukses diaplikasikan)
- Verifikasi:
  - `bun run tests/rbac-kontrol-m11.test.ts`: PASSED (7 skenario)
  - `bun run typecheck` (`tsc --noEmit`): PASSED (0 error)
  - `bun run eslint`: PASSED (0 error, 0 warning)
  - `bun run build`: PASSED (Next.js 16.4.5 Turbopack build sukses)
- Belum selesai / langkah berikutnya: M12 — Laporan enterprise (Perubahan ekuitas, neraca saldo, umur piutang/hutang aging, konsolidasi multi-perusahaan, template ekspor PDF/Excel).

## 2026-11-14 — S-014 — Implementasi Penuh Milestone M10 (Anggaran & Dimensi Bisnis) dan Perbaikan Interaktivitas Sparkline Crosshair
- Milestone: M10 (100% Selesai — Done)
- Dikerjakan:
  - **Perbaikan Crosshair Garis Vertikal Titik-Titik Bklit Sparklines**:
    - Mendiagnosis penyebab ketiadaan garis crosshair saat kursor hover di sparkline chart: variabel CSS `--chart-crosshair` dan `--chart-background` belum terdefinisi di `src/app/css/globals.css`.
    - Menambahkan token tema `--chart-crosshair: var(--ds-gray-700)` dan fallback solid di `src/components/charts/chart-context.tsx`.
    - Memperbaiki `crosshair="dashed"` dan `dot={true}` pada seluruh komponen KPI card di `kpi-card.tsx`.
  - **Skema & Database Dimensi Bisnis & Anggaran (M10)**:
    - Enum PostgreSQL baru: `status_proyek` (`PERENCANAAN`, `BERJALAN`, `SELESAI`, `DIBATALKAN`) dan `status_anggaran` (`DRAFT`, `DISETUJUI`, `DITUTUP`).
    - Izin RBAC: `dimensi.baca`, `dimensi.kelola`, `anggaran.baca`, `anggaran.kelola`.
    - Prefiks nomor transaksi: `PRJ` untuk Proyek (`PRJ/YYYY/XXXXX`) dan `BDG` untuk Anggaran (`BDG/YYYY/XXXXX`).
    - Tabel Dimensi Bisnis (`src/db/schema/keuangan/dimensi.ts`):
      - `branches`: Master kantor cabang (multi-branch), flag kantor pusat (`pusat`), alamat, kontak, penanggung jawab, status aktif.
      - `departments`: Master departemen hierarkis (`induk_id`), manajer, status aktif.
      - `projects`: Master proyek / job costing, kode PRJ auto-numbering, relasi klien (`pelanggan_id` $\to$ `partners.id`), tanggal mulai & selesai, nilai kontrak (`numeric(18,4)`), status proyek, penanggung jawab.
      - `tags`: Tag kustom fleksibel (`#tag-name`), warna hex, keterangan.
    - Tabel Anggaran / Budgeting (`src/db/schema/keuangan/anggaran.ts`):
      - `budgets`: Header anggaran, nomor BDG auto-numbering, nama, tahun, dimensi opsional (`cabang_id`, `departemen_id`, `proyek_id`), `total_anggaran`, status, `disetujui_oleh`, `disetujui_pada`.
      - `budget_lines`: Rincian target pagu per akun COA dan per periode bulanan `YYYY-MM`, nominal target `jumlah`, keterangan, serta unique constraint `(anggaran_id, akun_id, periode)`.
    - Integrasi Dimensi ke Double-Entry Engine:
      - Kolom dimensi `cabang_id` dan `proyek_id` pada header `journal_entries`.
      - Kolom dimensi `cabang_id`, `departemen_id`, `proyek_id`, dan `tag` pada baris `journal_items`.
      - Engine akuntansi (`simpanJurnal`, `validasiDanHitung`, `gantiJurnalDraft`) mengalirkan dimensi otomatis dari header dokumen hingga baris buku besar.
    - Drizzle Migrasi `0012_anggaran_dimensi_m10.sql` dibuat, didaftarkan di `meta/_journal.json`, dan sukses diterapkan ke database Neon PostgreSQL.
    - Seeding default cabang `HO` (Jakarta Pusat) & `SBY` (Surabaya) serta departemen `DIR`, `FIN`, `IT`, `OPS` di `src/db/seed/keuangan.ts`.
  - **Modul Server Dimensi (`src/server/modules/keuangan/dimensi/`)**:
    - `model.ts`: Skema TypeBox untuk Cabang, Departemen, Proyek, dan Tag.
    - `service.ts`: Logika bisnis lengkap CRUD cabang, hierarki departemen, registrasi & approval status proyek, serta tag hashtag.
    - `index.ts`: Elysia router `rutaDimensi` di bawah `/api/keuangan/dimensi` dengan guard RBAC.
  - **Modul Server Anggaran & Laporan Berdimensi (`src/server/modules/keuangan/anggaran/`)**:
    - `model.ts`: Skema TypeBox untuk Anggaran CRUD, approval workflow, penutupan anggaran, serta kueri laporan enterprise berdimensi.
    - `service.ts`:
      - Anggaran CRUD & Approval: Pembuatan anggaran, kalkulasi total pagu berbasis BigInt, pembatasan edit hanya status `DRAFT`, persetujuan (`DISETUJUI`), dan penutupan (`DITUTUP`).
      - Laporan Anggaran vs Realisasi (`laporanAnggaranVsRealisasi`): Mengagregasi target pagu vs realisasi dari baris jurnal POSTED, varian selisih nominal, persentase realisasi, penentuan status varian (`OVER_BUDGET`/`UNDER_BUDGET` untuk beban, `ACHIEVED`/`UNACHIEVED` untuk pendapatan), serta ringkasan laba anggaran vs laba realisasi.
      - Laporan Laba Rugi per Proyek (`laporanLabaRugiProyek`): Menghitung pendapatan proyek, rincian beban operasional per akun, laba bersih proyek, dan profit margin (%).
      - Laporan Laba Rugi per Cabang (`laporanLabaRugiCabang`): Segmentasi laba rugi multi-cabang (pendapatan, beban, laba bersih, profit margin per cabang) disandingkan dengan total konsolidasi perusahaan.
    - `index.ts`: Elysia router `rutaAnggaran` di bawah `/api/keuangan/anggaran` dengan guard RBAC.
    - Kedua router terhubung di router utama `modulKeuangan` (`src/server/modules/keuangan/index.ts`).
  - **Pengujian & Verifikasi Menyeluruh**:
    - Dibuat skrip integrasi `tests/anggaran-dimensi-m10.test.ts` mencakup 9 skenario:
      1. Verifikasi cabang default (HO, SBY) dan pembuatan cabang baru (BDG).
      2. Verifikasi departemen default dan pembuatan sub-departemen hierarkis.
      3. Pembuatan klien & proyek enterprise dengan kode auto-numbering `PRJ/2026/XXXXX`.
      4. Pembuatan master tag transaksi dengan auto-prefix hashtag.
      5. Posting jurnal dengan tagging multi-dimensi (cabang, departemen, proyek, tag) yang balanced.
      6. Siklus hidup anggaran: Buat draft BDG $\to$ Ubah pagu $\to$ Setujui $\to$ Ambil detail.
      7. Laporan Anggaran vs Realisasi: Verifikasi perbandingan target vs aktual, persentase realisasi, dan varian status.
      8. Laporan Laba Rugi per Proyek: Verifikasi laba bersih proyek dan kalkulasi margin profit (70%).
      9. Laporan Laba Rugi per Cabang: Verifikasi segmentasi performa laba rugi per cabang vs konsolidasi.
    - `bun run tests/anggaran-dimensi-m10.test.ts`: 9 skenario lulus 100%.
    - `bun run typecheck` (`tsc --noEmit`): PASSED (0 error).
    - `bun run eslint`: PASSED (0 error, 0 warning).
    - `bun run build` (Next.js 16.4.5 Turbopack production build): berhasil sukses (0 error).
- File/skema berubah:
  - `src/app/css/globals.css`
  - `src/components/charts/chart-context.tsx`
  - `src/app/(dashboard)/dashboard/_components/kpi-card.tsx`
  - `src/db/schema/keuangan/konstanta.ts`
  - `src/server/modules/keuangan/shared/access.ts`
  - `src/server/modules/keuangan/shared/transaction.ts`
  - `src/db/schema/keuangan/dimensi.ts` (baru)
  - `src/db/schema/keuangan/anggaran.ts` (baru)
  - `src/db/schema/keuangan/jurnal.ts`
  - `src/db/schema/keuangan/index.ts`
  - `src/db/seed/keuangan.ts`
  - `src/server/modules/keuangan/jurnal/engine.ts`
  - `src/server/modules/keuangan/dimensi/model.ts`, `service.ts`, `index.ts` (baru)
  - `src/server/modules/keuangan/anggaran/model.ts`, `service.ts`, `index.ts` (baru)
  - `src/server/modules/keuangan/index.ts`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: `src/db/migrations/0012_anggaran_dimensi_m10.sql` (sukses diaplikasikan)
- Verifikasi:
  - `bun run tests/anggaran-dimensi-m10.test.ts`: PASSED (9 skenario)
  - `bun run typecheck` (`tsc --noEmit`): PASSED (0 error)
  - `bun run eslint`: PASSED (0 error, 0 warning)
  - `bun run build`: PASSED (Next.js 16.4.5 Turbopack build sukses)
- Belum selesai / langkah berikutnya: M11 — RBAC penuh, multi-perusahaan (tenant isolation), audit log, dan persetujuan bertingkat (approval workflow).

## 2026-11-14 — S-013 — Implementasi Menyeluruh Milestone M9 (Aset Tetap & Penyusutan) dan Modernisasi KPI Sparkline Dashboard
- Milestone: M9 (100% Selesai — Done)
- Dikerjakan:
  - **Modernisasi Dashboard KPI Card dengan Bklit Sparklines**:
    - Memperbarui komponen `kpi-card.tsx` dan layout dashboard: menghilangkan footer link untuk tampilan lebih ringkas dan elegan.
    - Menerapkan variasi visual chart yang kontekstual: BarSparkline (Pendapatan & Total Beban), LineSparkline dengan endDot (Laba Bersih), dan AreaSparkline dengan smooth gradient fill (Kas & Setara Kas).
    - Menghubungkan interaksi `useSparklineHover` untuk menampilkan angka dan bulan saat kursor hover di setiap data point.
  - **Skema & Database Aset Tetap & Penyusutan**:
    - Penambahan sumber jurnal baru: `PENYUSUTAN_ASET` dan `PELEPASAN_ASET`.
    - Pembuatan enum PostgreSQL: `metode_penyusutan` (`GARIS_LURUS`, `SALDO_MENURUN`, `TIDAK_DISUSUTKAN`), `golongan_fiskal_aset` (`NON_FISKAL`, `GOLONGAN_1`, `GOLONGAN_2`, `GOLONGAN_3`, `GOLONGAN_4`, `BANGUNAN_PERMANEN`, `BANGUNAN_SEMI_PERMANEN`), `status_aset` (`DRAFT`, `AKTIF`, `DISUSUTKAN_PENUH`, `DILEPAS`), dan `status_penyusutan_aset` (`DRAFT`, `POSTED`, `DIBATALKAN`).
    - Izin RBAC: `aset_tetap.baca`, `aset_tetap.kelola`, `aset_tetap.penyusutan`, `aset_tetap.pelepasan`.
    - Prefiks penomoran transaksi: `FA` untuk aset tetap (`FA/YYYY/XXXXX`) dan `DP` untuk penyusutan.
    - Tabel `asset_categories`: Master kategori aset, metode penyusutan, golongan fiskal, masa manfaat bulan, tarif fiskal tahunan, serta binding akun COA (Akun Aset, Akun Akumulasi Penyusutan, Akun Beban Penyusutan).
    - Tabel `fixedAssets`: Registrasi aset, kode auto/manual, nama, kategori, tanggal perolehan, tanggal mulai susut, nilai perolehan, nilai residu, masa manfaat, lokasi, penanggung jawab, status, akumulasi penyusutan, nilai buku berjalan, dan sisa masa manfaat.
    - Tabel `asset_depreciations`: Riwayat penyusutan bulanan per aset dan per periode (format `YYYY-MM`), nilai penyusutan, nilai buku awal & akhir, binding `jurnal_id`, status, dan partial unique index `(aset_id, periode) WHERE status = 'POSTED'`.
    - Penambahan COA akun `4920` (Laba Pelepasan Aset Tetap) dan `7110` (Rugi Pelepasan Aset Tetap) serta seeding default kategori `KAT-PERALATAN` dan `KAT-KENDARAAN` di `src/db/seed/keuangan.ts`.
    - Drizzle migrasi `0011_aset_tetap_m9.sql` dibuat dan diaplikasikan ke database live Neon PostgreSQL.
  - **Modul Server Aset Tetap (`src/server/modules/keuangan/aset-tetap/`)**:
    - `model.ts`: Skema TypeBox untuk Kategori Aset, Registrasi Aset, Posting Penyusutan (Tunggal & Batch), Pembatalan Penyusutan, Pelepasan Aset, dan Kueri Laporan.
    - `service.ts`:
      - Master Kategori: CRUD kategori aset dengan validasi keabsahan akun COA terkait.
      - Registrasi Aset Tetap: Auto-numbering kode unik `FA/YYYY/XXXXX`, inisialisasi nilai buku = nilai perolehan, akumulasi = 0, status = AKTIF.
      - Kalkulasi Penyusutan: Straight-line `(perolehan - residu) / bulan` dan Declining-balance `nilaiBuku * (tarifTahunan / 12)` dengan capping batas nilai residu.
      - Posting Penyusutan (Tunggal & Batch): Eksekusi transaksi penyusutan bulanan menghasilkan jurnal akuntansi balanced `(Dr) Beban Penyusutan` vs `(Cr) Akumulasi Penyusutan`, pengurangan nilai buku, penambahan akumulasi, decrement sisa bulan, serta penandaan otomatis `DISUSUTKAN_PENUH`.
      - Pembatalan Penyusutan: Membalikkan jurnal pembalik otomatis (`balikJurnal`) dan mengembalikan saldo nilai buku, akumulasi, serta sisa masa manfaat aset.
      - Pelepasan / Penjualan Aset (`lepasAsetTetap`): Menutup nilai perolehan aset dari neraca, menutup akumulasi penyusutan berjalan, mencatat penerimaan kas (jika dijual), dan mengakui Laba Pelepasan (Cr 4920) atau Rugi Pelepasan (Dr 7110) dengan debit/kredit yang 100% seimbang.
      - Laporan Aset: Laporan Daftar Aset Tetap (Asset Register) & Rekapitulasi Penyusutan Bulanan (Depreciation Schedule).
    - `index.ts`: Rute Elysia `/api/keuangan/aset-tetap` dengan kontrol RBAC berbasis izin.
    - Terhubung di router utama `modulKeuangan` (`src/server/modules/keuangan/index.ts`).
  - **Pengujian & Verifikasi**:
    - Dibuat skrip integrasi `tests/aset-tetap-m9.test.ts` mencakup 8 skenario pengujian:
      1. Verifikasi kategori bawaan seed & pembuatan kategori baru.
      2. Registrasi aset metode Garis Lurus (MacBook Pro) dan Saldo Menurun (Server Rack).
      3. Eksekusi penyusutan tunggal & verifikasi auto-jurnal balanced 900.000 (Dr Beban Susut = Cr Akum. Susut).
      4. Pembatalan penyusutan via pembalik jurnal & pemulihan saldo aset.
      5. Posting batch penyusutan bulanan lintas beberapa aset aktif sekaligus beserta pencegahan double-posting (idempotensi).
      6. Pelepasan aset dengan Laba Penjualan (jurnal seimbang Dr Kas 25jt, Dr Akumulasi 1.8jt, Cr Laba 2.8jt, Cr Aset 24jt).
      7. Pelepasan aset dengan Rugi Penjualan (jurnal seimbang Dr Kas 10jt, Dr Akumulasi 1.25jt, Dr Rugi 48.75jt, Cr Aset 60jt).
      8. Verifikasi laporan daftar aset & rekap penyusutan bulanan.
    - Seluruh pengujian `bun run tests/aset-tetap-m9.test.ts` lulus 100%.
    - `bun run typecheck` (`tsc --noEmit`): 0 error.
    - `bun run eslint src/server/modules/keuangan/aset-tetap tests/aset-tetap-m9.test.ts`: 0 error / 0 warning.
    - `bun run build` (Next.js 16.4.5 Turbopack production build): berhasil sukses (0 error).
- File/skema berubah:
  - `src/app/(dashboard)/dashboard/_components/kpi-card.tsx`
  - `src/app/(dashboard)/dashboard/page.tsx`
  - `src/db/schema/keuangan/konstanta.ts`
  - `src/db/schema/keuangan/aset-tetap.ts`
  - `src/db/schema/keuangan/index.ts`
  - `src/db/seed/keuangan.ts`
  - `src/db/migrations/0011_aset_tetap_m9.sql`
  - `src/server/modules/keuangan/shared/access.ts`
  - `src/server/modules/keuangan/shared/transaction.ts`
  - `src/server/modules/keuangan/aset-tetap/model.ts`
  - `src/server/modules/keuangan/aset-tetap/service.ts`
  - `src/server/modules/keuangan/aset-tetap/index.ts`
  - `src/server/modules/keuangan/index.ts`
  - `tests/aset-tetap-m9.test.ts`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: `0011_aset_tetap_m9.sql` (diterapkan ke Neon PostgreSQL)
- Verifikasi: tsc --noEmit (0 error), eslint (0 error), bun run tests/aset-tetap-m9.test.ts (PASS), bun run build (PASS)
- Belum selesai / langkah berikutnya: M10 — Anggaran & dimensi (cabang/departemen/proyek).

## 2026-11-14 — S-012 — Implementasi Menyeluruh Milestone M8 (Pajak Indonesia: PPN, PPh, e-Faktur, e-Bupot & Coretax)
- Milestone: M8 (100% Selesai — Done)
- Dikerjakan:
  - **Skema & Database Pajak Indonesia**:
    - Penambahan peran sistem akun perpajakan: `PAJAK_DIBAYAR_DIMUKA` (tipe ASET) dan `HUTANG_PAJAK` (tipe KEWAJIBAN).
    - Pembuatan enum perpajakan PostgreSQL: `tipe_pajak` (`PPN`, `PPH_21`, `PPH_22`, `PPH_23`, `PPH_4_AYAT_2`, `PPH_15`, `PPH_25`, `PPH_26`, `LAINNYA`), `kategori_pajak` (`PAJAK_KELUARAN`, `PAJAK_MASUKAN`, `PEMOTONGAN_PEMUNGUTAN`), `jenis_faktur_pajak` (`KELUARAN`, `MASUKAN`, `DIBATALKAN`, `DIGANTI`), `status_faktur_pajak` (`DRAFT`, `SIAP_UPLOAD`, `DISETUJUI_DJP`, `DITOLAK_DJP`, `BATAL`), `jenis_bupot` (`BP_PASAL_21`, `BP_PASAL_22`, `BP_PASAL_23`, `BP_PASAL_4_2`, `BP_PASAL_15`, `BP_UNIFIKASI`), dan `status_bupot` (`DRAFT`, `TERBIT`, `DIBATALKAN`).
    - Pembuatan tabel `taxes` (Master Pajak: kode, nama, tipe, kategori, tarif, DPP nilai lain & faktor DPP, akun penjualan & pembelian).
    - Pembuatan tabel `tax_invoice_ranges` (Alokasi Nomor Seri Faktur Pajak 16-digit DJP & auto-incrementing pointer).
    - Pembuatan tabel `tax_invoices` (Faktur Pajak Elektronik: nomor NSFP, tanggal, masa & tahun pajak, data lawan transaksi NPWP/NIK/nama/alamat, DPP, PPN, PPnBM, relasi faktur penjualan/pembelian, flag kredit).
    - Pembuatan tabel `withholding_tax_slips` (Bukti Potong PPh Unifikasi: nomor bukti, tanggal, masa & tahun, wajib pajak, kode objek pajak, jumlah bruto, tarif, jumlah PPh, dokumen referensi).
    - Penambahan akun default COA `1160` (Pajak Dibayar Dimuka PPh) dan `2150` (Hutang Pajak PPh) serta seed default pajak PPN 11%, PPN 12%, PPh 23 Jasa 2%, dan PPh 4(2) Sewa 10% di `src/db/seed/keuangan.ts`.
    - Drizzle custom migration `0010_pajak_indonesia_m8.sql` dieksekusi dan sukses diaplikasikan ke database live Neon PostgreSQL.
  - **Modul Server Pajak (`src/server/modules/keuangan/pajak/`)**:
    - `model.ts`: Skema validasi TypeBox untuk Master Pajak, Alokasi NSFP, Faktur Pajak Elektronik, Bukti Potong PPh, Kueri Ekspor e-Faktur CSV, Ekspor Coretax, dan Rekap SPT Masa PPN 1111.
    - `service.ts`:
      - Master Data Pajak: CRUD master pajak, kalkulasi persentase tarif & faktor DPP nilai lain.
      - NSFP Engine: Rekam alokasi rentang nomor seri dari DJP, pengambilan nomor berikutnya secara atomic dengan serial numbering padding otomatis 16-digit (`010.000-26.XXXXXXXX`).
      - Faktur Pajak Elektronik: Integrasi langsung dengan Faktur Penjualan (auto-generate faktur pajak dari sales invoice yang disetujui beserta lawan transaksi & nilai DPP/PPN), perekaman manual Faktur Pajak Masukan vendor (dapat dikreditkan vs tidak dapat dikreditkan), dan pencegahan nomor faktur duplikat.
      - Bukti Potong e-Bupot: Rekam dan kelola bukti potong PPh 23, PPh 4(2), dsb., update status DRAFT $\to$ TERBIT.
      - Ekspor e-Faktur CSV: Menghasilkan format resmi CSV DJP e-Faktur (baris `FK` untuk Pajak Keluaran dan `FM` untuk Pajak Masukan lengkap dengan flag `IS_CREDITABLE`).
      - Ekspor Coretax: Menghasilkan payload JSON/XML standar Coretax DJP memuat `taxPeriod`, `invoices`, dan `withholdings`.
      - Laporan Rekap SPT Masa PPN 1111: Mengagregasi PPN Keluaran, PPN Masukan dapat dikreditkan, PPN Masukan tidak dapat dikreditkan, menghitung selisih Kurang/Lebih Bayar secara presisi tanpa pembulatan float menggunakan BigInt arithmetic (`shared/decimal.ts`).
    - `index.ts`: Rute Elysia di `/api/keuangan/pajak` terhubung hak akses RBAC (`pajak.baca`, `pajak.kelola`, `pajak.ekspor`).
    - Mount rute `rutaPajak` di `src/server/modules/keuangan/index.ts`.
  - **Pengujian & Verifikasi**:
    - Pembuatan skrip uji integrasi komprehensif `tests/pajak-m8.test.ts` yang mencakup 8 skenario:
      1. Verifikasi master pajak hasil seed & pembuatan pajak kustom (PPh 22).
      2. Alokasi NSFP & auto-assignment nomor seri 16 digit terurut.
      3. Integrasi faktur penjualan $\to$ auto-generate e-Faktur Keluaran (DPP 10jt, PPN 1.1jt) & proteksi duplikasi.
      4. Perekaman Faktur Pajak Masukan (Kredit DPP 5jt PPN 550rb; Non-Kredit DPP 2jt PPN 220rb).
      5. Perekaman Bukti Potong e-Bupot PPh 23 & PPh 4(2) Final dan penerbitan bukti potong.
      6. Ekspor e-Faktur CSV header FK dan FM.
      7. Ekspor Coretax format DJP (invoices & withholdings).
      8. Rekapitulasi SPT Masa PPN 1111: PK 3.3jt, PM Kredit 1.65jt $\to$ Kurang Bayar 1.65jt.
    - Semua test suite sebelumnya (`tests/dagang-m4-m5.test.ts`, `tests/pembayaran-m6.test.ts`, `tests/inventori-m7.test.ts`, dan `tests/pajak-m8.test.ts`) lulus 100%.
    - `bun run typecheck` (`tsc --noEmit`): 0 error.
    - `bun run eslint src/server/modules/keuangan/pajak`: 0 problem.
    - `bun run build` (Next.js 16.4.5 Turbopack production build): berhasil sempurna.
- File/skema berubah:
  - `src/db/schema/keuangan/konstanta.ts` (penambahan enum peran_sistem, pajak, dan izin RBAC pajak)
  - `src/db/schema/keuangan/pajak.ts` (tabel master pajak, NSFP, faktur pajak, dan bukti potong)
  - `src/db/schema/keuangan/index.ts` (ekspor schema pajak)
  - `src/db/seed/keuangan.ts` (COA akun pajak 1160, 2150, dan seed default taxes)
  - `src/db/migrations/0010_pajak_indonesia_m8.sql` (DDL Postgres migrasi M8)
  - `src/server/modules/keuangan/shared/access.ts` (izin modul pajak)
  - `src/server/modules/keuangan/pajak/model.ts`
  - `src/server/modules/keuangan/pajak/service.ts`
  - `src/server/modules/keuangan/pajak/index.ts`
  - `src/server/modules/keuangan/index.ts` (mount `rutaPajak`)
  - `tests/pajak-m8.test.ts`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: `0010_pajak_indonesia_m8.sql` (diterapkan ke Neon PostgreSQL)
- Verifikasi:
  - `bun run tests/pajak-m8.test.ts` $\to$ PASS (100%)
  - `bun run tests/inventori-m7.test.ts` $\to$ PASS (100%)
  - `bun run tests/pembayaran-m6.test.ts` $\to$ PASS (100%)
  - `bun run tests/dagang-m4-m5.test.ts` $\to$ PASS (100%)
  - `bun run typecheck` $\to$ PASS (0 error)
  - `bun run eslint src/server/modules/keuangan/pajak` $\to$ PASS (0 problem)
  - `bun run build` $\to$ PASS (Next.js production build berhasil)
- Belum selesai / langkah berikutnya:
  - Lanjutkan ke **Milestone M9 — Aset Tetap & Penyusutan** (registrasi aset tetap, metode garis lurus/saldo menurun, masa manfaat fiskal, posting penyusutan batch bulanan, pelepasan/penjualan aset dengan laba/rugi).

- Milestone: M7 (100% Selesai — Done)
- Dikerjakan:
  - **Skema & Database Multi-Gudang (Multi-Warehouse)**:
    - Pembuatan tabel master data gudang `warehouses` (`id`, `kode`, `nama`, `alamat`, `penanggungJawab`, `adalahGudangUtama`, `aktif`).
    - Penambahan enum `metode_penilaian_stok` (`RATA_RATA`, `FIFO`) dan `status_transfer_gudang` (`DRAFT`, `POSTED`, `DIBATALKAN`), serta penambahan nilai `TRANSFER_GUDANG` pada enum `sumber_jurnal`.
    - Penambahan kolom `metode_penilaian` pada tabel `items`.
    - Peningkatan skema `item_stocks` dari level global menjadi level gudang: penambahan `id: uuid PRIMARY KEY`, `gudang_id: uuid REFERENCES warehouses(id)`, dan unique constraint `(item_id, gudang_id)`.
    - Penambahan `gudang_id` pada tabel mutasi `stock_movements`, serta tabel transaksi dagang: `purchase_order_items`, `purchase_invoice_items`, `purchase_return_items`, `sales_order_items`, `sales_invoice_items`, dan `sales_return_items`.
    - Pembuatan tabel `item_batches` untuk pelacakan nomor batch, nomor seri, dan tanggal kedaluwarsa per gudang.
    - Pembuatan tabel `warehouse_transfers` dan `warehouse_transfer_items` untuk alur transfer barang antar gudang.
    - Pembaruan struktur `stock_adjustments` dan pembuatan tabel `stock_adjustment_items` untuk mendukung stok opname multi-item per gudang.
    - Migrasi Drizzle `0009_multi_warehouse_m7.sql` dibuat dan sukses diaplikasikan ke database live Neon PostgreSQL dengan otomatis menginisialisasi Gudang Utama default.
  - **Modul Inventori Lanjutan (`src/server/modules/keuangan/inventori/`)**:
    - `model.ts`: Skema TypeBox untuk Gudang, Transfer Gudang, Penyesuaian Stok Opname, Item Batches, serta kueri Laporan Kartu Stok dan Rekap Nilai Persediaan.
    - `mutasi.ts`:
      - Penyelarasan mutasi stok rata-rata bergerak (`catatMutasiStok`) agar mencatat dan mengunci saldo per kombinasi `(item_id, gudang_id)` dengan fallback otomatis ke Gudang Utama.
      - Penyelarasan pembalikan mutasi dokumen (`balikMutasiDokumen`) per gudang.
    - `service.ts`:
      - Master Gudang: CRUD gudang, penanganan flag `adalahGudangUtama`, dan proteksi penghapusan gudang yang masih memiliki saldo stok.
      - Transfer Gudang: Pemindahan stok antar-gudang (mutasi KELUAR dari gudang asal dan MASUK ke gudang tujuan dengan biaya rata-rata berjalan yang konsisten), posting transfer, dan pembatalan transfer yang memulihkan saldo kedua gudang.
      - Penyesuaian Stok & Opname: Pencatatan kuantitas fisik vs sistem, kalkulasi selisih otomatis, mutasi stok, auto-jurnal persediaan seimbang ((Dr) Persediaan vs (Cr) Akun Penyesuaian untuk selisih lebih; (Dr) Akun Penyesuaian vs (Cr) Persediaan untuk selisih kurang), serta pembatalan & pembalikan jurnal.
      - Item Batches: Pendaftaran nomor batch dan tanggal kedaluwarsa stok per gudang.
      - Laporan: Pengambilan kartu stok historis per item & gudang, serta rekap nilai persediaan multi-gudang.
    - `index.ts`: Pemasangan endpoint Elysia `rutaGudang` (`/api/keuangan/gudang`), `rutaTransferGudang` (`/api/keuangan/transfer-gudang`), `rutaPenyesuaianStok` (`/api/keuangan/penyesuaian-stok`), dan `rutaLaporanInventori` (`/api/keuangan/inventori-laporan`).
  - **Pengujian & Verifikasi**:
    - Pembuatan skrip uji integrasi komprehensif `tests/inventori-m7.test.ts` yang mencakup 7 skenario:
      1. Setup master gudang (Utama, Surabaya, Bandung).
      2. Pembelian stok masuk ke Gudang Utama (100 unit @ Rp 100.000).
      3. Transfer antar gudang (40 unit: Gudang Utama -> Gudang Surabaya) $\to$ verifikasi saldo Utama = 60, Surabaya = 40.
      4. Stok opname di Gudang Surabaya (+5 unit fisik lebih banyak) $\to$ verifikasi saldo menjadi 45 unit dan jurnal penyesuaian seimbang.
      5. Pendaftaran dan pelacakan batch & expired date.
      6. Laporan kartu stok dan rekap nilai persediaan perusahaan (105 unit = Rp 10.500.000).
      7. Pembatalan transfer & pemulihan saldo stok secara utuh.
    - Menjalankan kembali seluruh test suite integrasi (`dagang-m4-m5.test.ts`, `pembayaran-m6.test.ts`, `inventori-m7.test.ts`) dan semuanya lolos 100%.
  - File/skema berubah:
    - Skema: `src/db/schema/keuangan/konstanta.ts`, `inventori.ts`, `dagang.ts`, `src/db/migrations/0009_multi_warehouse_m7.sql`
    - Backend: `src/server/modules/keuangan/shared/transaction.ts`, `shared/access.ts`, `inventori/mutasi.ts`, `inventori/model.ts`, `inventori/service.ts`, `inventori/index.ts`, `pembelian/model.ts`, `pembelian/service.ts`, `index.ts`
    - Pengujian: `tests/dagang-m4-m5.test.ts`, `tests/inventori-m7.test.ts`
    - Dokumentasi: `docs/ROADMAP.md`, `docs/SESSION-LOG.md`
  - Migrasi: `0009_multi_warehouse_m7.sql` (sukses diaplikasikan ke Neon PostgreSQL)
  - Verifikasi:
    - `bun run typecheck`: 0 error
    - `bun run eslint src/server tests`: 0 error, 0 warning
    - `bun run tests/inventori-m7.test.ts`: ALL MILESTONE M7 TESTS PASSED!
    - `bun run tests/dagang-m4-m5.test.ts`: ALL PASSED!
    - `bun run tests/pembayaran-m6.test.ts`: ALL PASSED!
    - `bun run build`: Next.js 16.4.5 Turbopack production build berhasil 100%
  - Belum selesai / langkah berikutnya: Milestone M8 — Pajak Indonesia (Master Pajak PPN 11/12%, PPh 21/22/23/4(2)/15, e-Faktur/Coretax, bukti potong, SPT Masa PPN).

## 2026-11-14 — S-010 — Implementasi Menyeluruh Milestone M6 (Pembayaran / Payments & Settlements)
- Milestone: M6 (100% Selesai — Done)
- Dikerjakan:
  - **Skema & Migrasi Database**:
    - Menambahkan kolom `potongan`, `akun_potongan_id`, dan `selisih_kurs` pada tabel `payment_allocations` di `src/db/schema/keuangan/dagang.ts`.
    - Migrasi Drizzle `0008_tired_shooting_star.sql` berhasil digenerate dan diaplikasikan ke live database Neon PostgreSQL.
  - **Modul Pembayaran (`src/server/modules/keuangan/pembayaran/`)**:
    - `model.ts`: Skema TypeBox untuk `skemaSimpanPembayaran`, `skemaItemAlokasiPembayaran`, `skemaQueryPembayaran`, dan `skemaBatal`.
    - `service.ts`:
      - Penerimaan Pembayaran Pelanggan (`jenis: "PENERIMAAN"`): Alokasi kas ke faktur penjualan, partial payments, pencatatan diskon penyelesaian / potongan pelunasan awal (`potongan`), penyesuaian sisa tagihan faktur, dan penjurnalan (Dr Kas/Bank + Dr Potongan vs Cr Piutang Usaha).
      - Pengeluaran Pembayaran Pemasok (`jenis: "PENGELUARAN"`): Alokasi kas keluar ke faktur pembelian dan/atau biaya operasional metode hutang, penanganan potongan pembayaran, pengurangan sisa tagihan bill/biaya, dan penjurnalan (Dr Hutang Usaha vs Cr Kas/Bank + Cr Potongan).
      - Otomatisasi Selisih Kurs Terealisasi (Realized FX Gain/Loss): Perhitungan selisih kurs antara kurs transaksi bayar dan kurs historis dokumen (PSAK 10 / IAS 21), otomatis mendebit `RUGI_SELISIH_KURS` atau mengkredit `LABA_SELISIH_KURS`, serta menyimpan `selisihKurs` pada baris alokasi.
      - Pembatalan Pembayaran (`batalkanPembayaran`): Pembalikan jurnal otomatis via `balikJurnal`, pengubahan status dokumen menjadi `DIBATALKAN`, dan pemulihan sisa tagihan dokumen yang dialokasikan secara presisi.
    - `index.ts`: Endpoint Elysia `/api/keuangan/pembayaran` dengan proteksi RBAC `pembayaran.baca`, `pembayaran.kelola`, `pembayaran.posting`.
    - `src/server/modules/keuangan/index.ts`: Menghubungkan dan me-mount `rutaPembayaran` ke modul utama keuangan.
  - **Pengujian & Verifikasi**:
    - Pembuatan skrip uji integrasi komprehensif `tests/pembayaran-m6.test.ts` yang mencakup 4 skenario inti:
      1. Customer Receipt IDR: Multi-invoice allocation, partial payment, potongan pelunasan, pemutakhiran sisa tagihan, dan double-entry balancing.
      2. Multi-Currency & Realized FX: Pelunasan piutang valas (USD) dengan fluktuasi kurs, pengakuan laba selisih kurs terealisasi, dan verifikasi keseimbangan debit/kredit dalam mata uang dasar.
      3. Vendor Payment: Pelunasan multi-dokumen (Faktur Pembelian + Biaya Hutang), potongan pelunasan, dan keseimbangan jurnal.
      4. Pembatalan Pembayaran: Verifikasi jurnal pembalik (reversal) dan pemulihan sisa tagihan dokumen secara utuh.
  - File/skema berubah:
    - Skema: `src/db/schema/keuangan/dagang.ts`, `src/db/migrations/0008_tired_shooting_star.sql`
    - Backend: `src/server/modules/keuangan/pembayaran/model.ts`, `service.ts`, `index.ts`, `src/server/modules/keuangan/index.ts`
    - Pengujian: `tests/pembayaran-m6.test.ts`
    - Dokumentasi: `docs/ROADMAP.md`, `docs/SESSION-LOG.md`
  - Migrasi: `0008_tired_shooting_star.sql` (sukses diaplikasikan ke Neon PostgreSQL)
  - Verifikasi:
    - `bun run typecheck`: 0 error
    - `bun run eslint src/server tests/pembayaran-m6.test.ts`: 0 error, 0 warning
    - `bun run tests/pembayaran-m6.test.ts`: ALL MILESTONE M6 TESTS PASSED SUCCESSFULLY!
    - `bun run build`: Next.js 16.4.5 Turbopack production build berhasil 100%
  - Belum selesai / langkah berikutnya: Milestone M7 — Inventori Lanjutan (Multi-lokasi gudang, transfer antar-gudang, penyesuaian stok/stok opname, FIFO valuation, nomor seri/batch tracking).

## 2026-11-14 — S-009 — Implementasi Sinkron Milestone M4 (Pembelian / AP) & M5 (Penjualan / AR)
- Milestone: M4 & M5 (Keduanya 100% Selesai — Done)
- Dikerjakan:
  - **Arsitektur Simetris Siklus Dagang**:
    - Penyelarasan siklus pembelian (PO -> Bill -> Retur Pembelian) dan penjualan (SO -> Invoice -> Retur Penjualan) secara simetris, konsisten, dan memenuhi standar ERP enterprise (Jurnal.id, Kledo, Accurate).
    - Perhitungan simetris: diskon bertingkat per baris (`persenDiskon`), diskon header faktur (`diskonNominal`), pajak PPN (`persenPpn`, `ppn`), ongkir/freight (`ongkir`), dan pemotongan uang muka (`uangMuka`).
  - **Skema & Database**:
    - Penambahan peran sistem akun `UANG_MUKA_PEMASOK` (Aset) dan `UANG_MUKA_PELANGGAN` (Kewajiban), serta sumber jurnal `RETUR_PEMBELIAN` dan `RETUR_PENJUALAN`.
    - Penambahan kolom `diskon_nominal`, `ongkir`, `uang_muka`, `akun_uang_muka_id`, `akun_ongkir_id` pada tabel `purchase_orders`, `purchase_invoices`, `sales_orders`, dan `sales_invoices`.
    - Pembuatan tabel `purchase_returns`, `purchase_return_items`, `sales_returns`, dan `sales_return_items` dengan foreign key, cascade item, dan check constraint.
    - Migrasi Drizzle `0007_simple_reptil.sql` berhasil digenerate dan diaplikasikan ke database live Neon PostgreSQL.
  - **Modul Pembelian / AP (`src/server/modules/keuangan/pembelian/`)**:
    - `model.ts`: Skema TypeBox untuk input, query, dan pembatalan PO, Faktur Pembelian, dan Retur Pembelian.
    - `service.ts`:
      - Pesanan Pembelian (PO): CRUD, alokasi diskon & pajak, approval (`setujuiPesananPembelian`), pelacakan kuantitas ditagih (`kuantitasDitagih`), dan status pesanan otomatis (`DRAFT` -> `DISETUJUI` -> `SEBAGIAN` / `SELESAI` -> `DIBATALKAN`).
      - Faktur Pembelian (Bill): Pembentukan dari PO atau mandiri, double-entry auto-balancing: (Dr) Persediaan/Beban + (Dr) PPN Masukan + (Dr) Ongkir vs (Cr) Uang Muka Pemasok + (Cr) Hutang Usaha; pencatatan mutasi stok masuk (`catatMutasiStok`) metode Average Cost (PSAK 14 / IAS 2) berbasis biaya bersih per unit; pembatalan faktur (`batalkanFakturPembelian`) membalik jurnal (`balikJurnal`) dan membalik mutasi stok (`balikMutasiDokumen`).
      - Retur Pembelian: Menautkan faktur asal, validasi total retur tidak melebihi `sisaTagihan`, penjurnalan (Dr) Hutang Usaha vs (Cr) Persediaan/Beban + (Cr) PPN Masukan, stok keluar, dan pengurangan `sisaTagihan` faktur asal secara otomatis.
    - `index.ts`: Endpoint Elysia `/api/keuangan/pembelian/pesanan`, `/faktur`, `/retur` terlindungi izin RBAC `pembelian.baca`, `pembelian.kelola`, `pembelian.posting`.
  - **Modul Penjualan / AR (`src/server/modules/keuangan/penjualan/`)**:
    - `model.ts`: Skema TypeBox simetris untuk SO, Faktur Penjualan, dan Retur Penjualan.
    - `service.ts`:
      - Pesanan Penjualan (SO): CRUD, approval (`setujuiPesananPenjualan`), pelacakan kuantitas ditagih, dan transisi status (`DRAFT` -> `DISETUJUI` -> `SEBAGIAN` / `SELESAI`).
      - Faktur Penjualan (Invoice): Validasi batas kredit pelanggan real-time (`cekBatasKredit`), auto-jurnal simetris: (Dr) Piutang Usaha + (Dr) Uang Muka Pelanggan vs (Cr) Pendapatan Penjualan + (Cr) PPN Keluaran + (Cr) Ongkir, dan pengakuan HPP & mutasi stok keluar: (Dr) HPP vs (Cr) Persediaan; pembatalan faktur membalik jurnal dan stok.
      - Retur Penjualan: Menautkan faktur penjualan asal, stok masuk kembali, pengembalian HPP ((Dr) Persediaan vs (Cr) HPP), koreksi pendapatan & PPN ((Dr) Pendapatan + (Dr) PPN Keluaran vs (Cr) Piutang Usaha), dan pengurangan `sisaTagihan` faktur.
    - `index.ts`: Endpoint Elysia `/api/keuangan/penjualan/pesanan`, `/faktur`, `/retur` terlindungi izin RBAC `penjualan.baca`, `penjualan.kelola`, `penjualan.posting`.
  - **Pengujian & Verifikasi**:
    - Test integrasi E2E end-to-end `tests/dagang-m4-m5.test.ts` memverifikasi seluruh siklus: pembuatan master data, siklus PO -> Bill -> Stok Masuk -> Retur Beli -> Stok Keluar -> Pengurangan Tagihan, dan siklus SO -> Credit Limit Enforcement -> Invoice -> Stok Keluar -> Pengakuan HPP -> Retur Jual -> Stok Masuk -> Pengembalian HPP -> Pengurangan Piutang.
    - Keseimbangan double-entry (Debit = Kredit) terverifikasi 100%.
- File/skema berubah:
  - Skema: `src/db/schema/keuangan/konstanta.ts`, `dagang.ts`, `index.ts`, `src/db/migrations/0007_simple_reptil.sql`, `src/db/seed/keuangan.ts`
  - Backend: `src/server/modules/keuangan/shared/transaction.ts`, `src/server/modules/keuangan/kontak/service.ts`, `src/server/modules/keuangan/pembelian/model.ts`, `service.ts`, `index.ts`, `src/server/modules/keuangan/penjualan/model.ts`, `service.ts`, `index.ts`, `src/server/modules/keuangan/index.ts`
  - Pengujian: `tests/dagang-m4-m5.test.ts`
  - Dokumentasi: `docs/ROADMAP.md`, `docs/SESSION-LOG.md`
- Migrasi: `0007_simple_reptil.sql` (sukses diaplikasikan ke Neon PostgreSQL)
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run eslint src/server`: 0 error, 0 warning
  - `bun run tests/dagang-m4-m5.test.ts`: ALL M4 & M5 E2E INTEGRATION TESTS PASSED
  - `next build`: build berhasil 100% (semua route compiled)
- Belum selesai / langkah berikutnya: M6 — Pembayaran (Penerimaan pelanggan & Pembayaran pemasok, alokasi banyak faktur, potongan pelunasan, selisih kurs terealisasi otomatis)

## 2026-11-14 — S-008 — Penuntasan & Hardening Menyeluruh Milestone M1 & M2
- Milestone: M1 & M2 (Keduanya 100% Selesai — Done)
- Dikerjakan:
  - **Hardening Master Data M1**:
    - **Item Multi-Satuan, Price List, Bundel, & Barcode**:
      - Pembuatan tabel `item_units` (multi-satuan kemasan, rasio konversi, barcode kemasan, harga khusus), `price_lists` & `price_list_items` (daftar harga bertingkat & tiering kuantitas/volume discount), serta `item_bundles` (BOM sederhana/paket produk bertipe `BUNDEL`).
      - Penambahan tipe barang `BUNDEL` pada `TIPE_BARANG` dan migrasi enum PostgreSQL.
      - Migrasi Drizzle `0003_yielding_ezekiel.sql` digenerate dan diaplikasikan ke database Neon.
      - Logika bisnis lengkap: konversi kuantitas antar-satuan (`konversiKuantitas`), kalkulasi harga dinamis berbasis volume & price list (`cariHargaItem`), serta endpoint CRUD multi-satuan, bundel, dan daftar harga di `/api/keuangan/item` dan `/api/keuangan/daftar-harga`.
    - **Revaluasi Kurs Akhir Periode (PSAK 10 / IAS 21)**:
      - Pembuatan tabel `currency_revaluations` dan `currency_revaluation_lines` untuk mencatat audit trail revaluasi akun-akun valas.
      - Migrasi Drizzle `0004_overrated_white_tiger.sql` digenerate dan diaplikasikan ke Neon.
      - Algoritma revaluasi valas (`hitungRevaluasi` & `eksekusiRevaluasi`) menghitung saldo valas berjalan, kurs buku, kurs penutupan, selisih laba/rugi belum terealisasi, penjurnalan otomatis ke `LABA_SELISIH_KURS` / `RUGI_SELISIH_KURS`, dan otomatis membuat jurnal balik (`PEMBALIK`) pada hari pertama periode berikutnya bila opsi `balikOtomatis` aktif.
      - Endpoint di `/api/keuangan/revaluasi-kurs` (GET, POST preview, POST eksekusi).
    - **Import Master Data via CSV**:
      - Parser CSV RFC 4180 mandiri di `shared/csv.ts` mendukung pemisah koma/titik-koma, escaped quotes, dan trim.
      - Endpoint import batch via CSV pada `/api/keuangan/akun/import`, `/api/keuangan/kontak/import`, dan `/api/keuangan/item/import`.
    - **Saldo Awal (Opening Balance)**:
      - Penambahan peran sistem `EKUITAS_SALDO_AWAL` dan sumber jurnal `SALDO_AWAL` pada migrasi `0005_odd_absorbing_man.sql` (diaplikasikan ke Neon).
      - Modul baru `/api/keuangan/saldo-awal`:
        - `saldo-awal/akun`: posting saldo awal buku besar, auto-balance debit = kredit ke `EKUITAS_SALDO_AWAL`.
        - `saldo-awal/piutang`: pencatatan faktur piutang berjalan per pelanggan.
        - `saldo-awal/hutang`: pencatatan tagihan hutang berjalan per pemasok.
        - `saldo-awal/persediaan`: pencatatan mutasi stok pembuka via `catatMutasiStok` Average Cost.
  - **Hardening Laporan & Kontrol M2**:
    - **Neraca Saldo & Kertas Kerja 10 Kolom**:
      - `laporanNeracaSaldo`: Neraca saldo 6 kolom (Saldo Awal, Mutasi Debit/Kredit Periode, Saldo Akhir Debit/Kredit) dengan pembuktian keseimbangan total.
      - `laporanWorksheetPenyesuaian`: Kertas kerja akuntansi 10 kolom (Neraca Saldo Sebelum Penyesuaian, Jurnal Penyesuaian, Neraca Saldo Disesuaikan, Laba Rugi, Neraca, serta kalkulasi Laba Bersih penyeimbang).
      - Endpoint di `/api/keuangan/laporan/neraca-saldo` dan `/api/keuangan/laporan/worksheet`.
    - **Tutup Buku Akhir Tahun (`year_end_closings`)**:
      - Implementasi `tutupBukuTahunan`: memvalidasi seluruh 12 bulan berstatus `DITUTUP`, menutup seluruh akun nominal `PENDAPATAN` dan `BEBAN` ke nol, mengalokasikan laba/rugi bersih ke `LABA_DITAHAN`, dan memposting jurnal penutup `TUTUP_BUKU`.
      - Fitur pembatalan tutup buku kronologis mundur (`batalkanTutupBukuTahunan`) via `balikJurnal`.
      - Endpoint di `/api/keuangan/periode/tutup-buku-tahunan`.
    - **Template Jurnal & Jurnal Berulang (Recurring)**:
      - Pembuatan tabel `journal_templates`, `journal_template_items`, dan `recurring_journals` pada migrasi `0006_amusing_steve_rogers.sql` (diaplikasikan ke Neon).
      - Layanan preset template jurnal dan otomasi jadwal posting berulang (`eksekusiJurnalBerulang`).
      - Endpoint di `/api/keuangan/jurnal/template` dan `/api/keuangan/jurnal/berulang`.
    - **Lampiran Dokumen Transaksi**:
      - Tabel `document_attachments` pada migrasi `0006_amusing_steve_rogers.sql`.
      - Endpoint lampiran dokumen pendukung transaksi pada `/api/keuangan/jurnal/:id/lampiran` dan `/api/keuangan/biaya/:id/lampiran`.
  - Pembaruan status milestone M1 & M2 pada `ROADMAP.md` menjadi `done`.
- File/skema berubah:
  - Skema: `src/db/schema/keuangan/inventori.ts`, `konstanta.ts`, `revaluasi.ts`, `recurring.ts`, `lampiran.ts`, `index.ts`, `src/db/migrations/0003_yielding_ezekiel.sql`, `0004_overrated_white_tiger.sql`, `0005_odd_absorbing_man.sql`, `0006_amusing_steve_rogers.sql`
  - Backend: `src/server/modules/keuangan/shared/csv.ts`, `src/server/modules/keuangan/shared/schema.ts`, `src/server/modules/keuangan/shared/transaction.ts`, `src/server/modules/keuangan/akun/`, `src/server/modules/keuangan/kontak/`, `src/server/modules/keuangan/inventori/`, `src/server/modules/keuangan/mata-uang/`, `src/server/modules/keuangan/saldo-awal/`, `src/server/modules/keuangan/periode/`, `src/server/modules/keuangan/jurnal/`, `src/server/modules/keuangan/biaya/`, `src/server/modules/keuangan/laporan/`, `src/server/modules/keuangan/index.ts`
  - Dokumentasi: `docs/ROADMAP.md`, `docs/SESSION-LOG.md`
- Migrasi: `0003_yielding_ezekiel.sql`, `0004_overrated_white_tiger.sql`, `0005_odd_absorbing_man.sql`, `0006_amusing_steve_rogers.sql` (seluruhnya sukses diaplikasikan ke Neon DB)
- Verifikasi: `bun run typecheck` lolos (0 error), `bun run eslint src/server` bersih (0 error, 0 warning), `bun run build` lolos (0 error).
- Belum selesai / langkah berikutnya: Milestone M4 — Pembelian (AP) siap dikerjakan secara berurutan: Permintaan Pembelian (PR) -> Pesanan Pembelian (PO) -> Penerimaan Barang (GR) -> Faktur Pembelian (AP Bill) dengan double-entry ketat dan PPN masukan.

## 2026-11-14 — S-007 — Penyelesaian Milestone M3: Transfer Beda Mata Uang, Biaya Admin, Laporan Mutasi & Rekonsiliasi
- Milestone: M3 (Selesai — perlu hardening)
- Dikerjakan:
  - **Transfer Multi-Currency & Biaya Admin**:
    - Penambahan kolom `jumlah_tujuan`, `kurs_tujuan`, `biaya_admin`, dan `akun_biaya_admin_id` pada tabel `bank_transactions`.
    - Drizzle migration baru `src/db/migrations/0001_warm_alice.sql` dibuat dan diaplikasikan ke database PostgreSQL Neon via `bun run db:migrate`.
    - Dukungan transfer kas/bank antar-rekening beda mata uang di `transaksi.service.ts` dengan konversi nilai dasar, pembebanan biaya administrasi bank, dan penjurnalan otomatis selisih kurs (`LABA_SELISIH_KURS` / `RUGI_SELISIH_KURS`).
  - **Laporan Kas & Bank**:
    - `laporanMutasiRekening`: laporan buku mutasi per rekening bank dalam rentang tanggal, menghitung saldo awal, daftar mutasi masuk & keluar berurutan, running balance tiap baris transaksi, serta total mutasi & saldo akhir.
    - `laporanRekonsiliasiBank`: laporan rekonsiliasi formal mencocokkan Saldo Rekening Koran vs Saldo Buku Besar Kas/Bank, menyajikan Setoran dalam Perjalanan (Deposit in Transit), Pengeluaran Beredar (Outstanding Checks), Saldo Bank Disesuaikan, dan pembuktian selisih nol.
    - Endpoint baru didaftarkan di `modules/keuangan/laporan/` pada `/api/keuangan/laporan/mutasi-rekening` dan `/api/keuangan/laporan/rekonsiliasi-bank`.
  - Pembaruan status milestone M3 pada `ROADMAP.md` menjadi `done (perlu hardening)` setelah seluruh 4 target tugas tercapai.
- File/skema berubah:
  - Skema: `src/db/schema/keuangan/transaksi.ts`, migrasi `src/db/migrations/0001_warm_alice.sql`
  - Backend: `src/server/modules/keuangan/bank/transaksi.model.ts`, `src/server/modules/keuangan/bank/transaksi.service.ts`, `src/server/modules/keuangan/laporan/model.ts`, `src/server/modules/keuangan/laporan/service.ts`, `src/server/modules/keuangan/laporan/index.ts`
  - Dokumentasi: `docs/ROADMAP.md`, `docs/SESSION-LOG.md`
- Migrasi: `0001_warm_alice.sql` (sukses diaplikasikan)
- Verifikasi: `bun run db:migrate` sukses, `bun run typecheck` lolos (0 error), `bun run eslint src/server` bersih (0 error, 0 warning), `bun run build` lolos (0 error).
- Belum selesai / langkah berikutnya: Milestone M4 — Pembelian (AP) dimulai dari Permintaan Pembelian (opsional), Pesanan Pembelian (PO), Penerimaan Barang, hingga Faktur Pembelian (AP Invoice).

## 2026-11-14 — S-006 — Fitur Rekonsiliasi Bank (Import CSV, Pencocokan Otomatis/Manual, Penyelesaian)
- Milestone: M3
- Dikerjakan:
  - Mengimplementasikan modul rekonsiliasi bank lengkap pada `/api/keuangan/rekonsiliasi-bank`:
    - Model & skema TypeBox (`rekonsiliasi.model.ts`): pembuatan draft rekonsiliasi, pengubahan saldo rekening koran/tanggal, pencocokan baris (`skemaCocokkanBaris`), pelepasan baris, import mutasi bank CSV (`skemaImportMutasiBank`), dan filter daftar rekonsiliasi.
    - Layanan logika bisnis (`rekonsiliasi.service.ts`):
      - Penghitungan dinamis `saldoBukuTercocok` dan `selisih` berbasis baris kas/bank yang tercocok (termasuk rekonsiliasi SELESAI sebelumnya).
      - Pencocokan manual (`cocokkanBaris`) dan pembatalan pencocokan (`lepasBaris`) baris jurnal kas/bank.
      - Fitur asisten import mutasi rekening koran (`importDanCocokkanMutasi`) dengan algoritma pencocokan otomatis berdasarkan nominal, arah aliran kas (CR/DB), dan tanggal, serta opsi auto-match langsung.
      - Penyelesaian rekonsiliasi (`selesaikanRekonsiliasi`) dengan penegakan integritas selisih nol (`ck_bank_reconciliations_selesai_seimbang`).
      - Pembukaan kembali rekonsiliasi (`bukaKembaliRekonsiliasi`) dengan perlindungan audit trail kronologis.
      - Penghapusan draft rekonsiliasi (`hapusRekonsiliasi`) yang secara aman melepas kaitan baris jurnal.
    - Controller rute Elysia (`rekonsiliasi.ts`) dengan proteksi izin RBAC `kas_bank.baca` & `kas_bank.rekonsiliasi`.
    - Pendaftaran rute di `modules/keuangan/bank/index.ts` dan agregator `modules/keuangan/index.ts`.
  - Pembaruan checklist tugas rekonsiliasi bank pada `ROADMAP.md`.
- File/skema berubah:
  - Baru: `src/server/modules/keuangan/bank/rekonsiliasi.model.ts`, `src/server/modules/keuangan/bank/rekonsiliasi.service.ts`, `src/server/modules/keuangan/bank/rekonsiliasi.ts`
  - Diubah: `src/server/modules/keuangan/bank/index.ts`, `src/server/modules/keuangan/index.ts`, `docs/ROADMAP.md`, `docs/SESSION-LOG.md`
- Migrasi: tidak ada (tabel `bank_reconciliations` dan kolom `rekonsiliasi_id` pada `journal_items` sudah ada di skema)
- Verifikasi: `bun run typecheck` lolos (0 error), `bun run eslint src/server` bersih (0 error, 0 warning), `bun run build` lolos (0 error).
- Belum selesai / langkah berikutnya: M3 — Biaya admin/bunga bank & transfer beda mata uang, serta laporan mutasi kas/bank & rekonsiliasi.

## 2026-11-14 — S-005 — API Transaksi Kas & Bank (Mutasi Masuk, Keluar, Transfer)
- Milestone: M3 (dan penuntasan checklist M0 di roadmap)
- Dikerjakan:
  - Mengimplementasikan endpoint API transaksi kas & bank lengkap pada `/api/keuangan/transaksi-bank`:
    - Model & skema validasi TypeBox (`transaksi.model.ts`): simpan transaksi (MASUK, KELUAR, TRANSFER), query filter (rekening, jenis, status dokumen, rentang tanggal, paginasi), dan pembatalan transaksi.
    - Layanan logika bisnis (`transaksi.service.ts`):
      - Penomoran otomatis berbasis transaksi atomik dengan prefix `MB` (`PREFIKS.MUTASI_BANK`).
      - Validasi rekening asal/tujuan, mata uang, dan akun lawan detail (`pastikanAkunDetail`).
      - Posting otomatis ke jurnal umum double-entry (`(Dr) Kas/Bank / (Cr) Akun Lawan` untuk MASUK, `(Dr) Akun Lawan / (Cr) Kas/Bank` untuk KELUAR, serta transfer kas/bank antar-rekening).
      - Pembatalan transaksi terposting dengan pembuatan jurnal balik otomatis via `balikJurnal` dan perlindungan guardrail rekonsiliasi bank.
    - Controller rute Elysia (`transaksi.ts`) dilindungi izin RBAC `kas_bank.baca` & `kas_bank.kelola`.
    - Pendaftaran rute di `modules/keuangan/bank/index.ts` dan agregator `modules/keuangan/index.ts`.
  - Pelonggaran tipe akun opsional pada `pastikanAkunDetail` di `modules/keuangan/akun/service.ts` agar akun lawan transaksi bank dapat mencakup berbagai kategori akun riil/nominal.
  - Pembaruan status milestone M3 ke `in-progress` dan penandaan item M0 yang telah selesai pada `ROADMAP.md`.
- File/skema berubah:
  - Baru: `src/server/modules/keuangan/bank/transaksi.model.ts`, `src/server/modules/keuangan/bank/transaksi.service.ts`, `src/server/modules/keuangan/bank/transaksi.ts`
  - Diubah: `src/server/modules/keuangan/bank/index.ts`, `src/server/modules/keuangan/index.ts`, `src/server/modules/keuangan/akun/service.ts`, `docs/ROADMAP.md`, `docs/SESSION-LOG.md`
- Migrasi: tidak ada (tabel `bank_transactions` sudah ada di skema)
- Verifikasi: `bun run typecheck` lolos (0 error), `bun run eslint src/server` bersih (0 error), `bun run build` lolos (0 error).
- Belum selesai / langkah berikutnya: M3 — Rekonsiliasi bank (import mutasi CSV, pencocokan otomatis/manual dengan baris jurnal kas/bank) dan laporan mutasi kas/bank.

## 2026-11-18 — S-004 — Perbaikan laporan dan aktivitas dashboard
- Milestone: M12
- Dikerjakan: Memfilter agregasi neraca ke jurnal POSTED sampai tanggal laporan; menghitung arus kas dari akun lawan dan menangani transfer antar kas/bank; menambahkan aktivitas jurnal terbaru yang hanya dikirim kepada pengguna dengan izin `jurnal.baca`.
- File/skema berubah: layanan laporan, endpoint ringkasan dashboard, panel aktivitas jurnal, tes laporan, roadmap.
- Migrasi: tidak ada
- Verifikasi: `bun run typecheck`, ESLint terarah, `bun run build`, dan 9 tes dashboard terarah lolos. Tes database penuh belum dijalankan karena autentikasi PostgreSQL lokal tidak tersedia.
- Belum selesai / langkah berikutnya: grafik utama masih berupa data contoh; jurnal hanya menyimpan tanggal transaksi, sehingga grafik intrahari yang akurat memerlukan sumber waktu transaksi yang sesuai.

## 2026-11-18 — S-003 — KPI dashboard berbasis jurnal
- Milestone: M12
- Dikerjakan: Menghubungkan KPI ke jurnal terposting, menambahkan endpoint ringkasan 12 bulan, menghapus ikon judul kartu, dan menambahkan tooltip bar yang bisa di-hover/fokus.
- File/skema berubah: laporan dashboard, komponen KPI, formatter rupiah, tes dashboard, roadmap.
- Migrasi: tidak ada
- Verifikasi: `bun run typecheck`, ESLint terarah, dan `bun run build` lolos; tes dashboard terarah lolos tanpa preload DB. `bun test` dari root terhambat autentikasi PostgreSQL lokal (`app`).
- Belum selesai / langkah berikutnya: grafik utama masih memakai data contoh dan perlu diganti setelah sumber transaksi terkait tersedia.

---

## 2026-11-13 — S-002 — Roadmap & dokumentasi

- Milestone: M0
- Dikerjakan: membuat `docs/ROADMAP.md`, `docs/SESSION-LOG.md`, `docs/ARCHITECTURE.md`; menambahkan petunjuk di `AGENTS.md`.
- Migrasi: tidak ada
- Langkah berikutnya: M0 — pecah `shared/common.ts`, satukan sistem error, jalankan test DB; lalu M3/M4.

## 2026-11-13 — S-001 — Restrukturisasi backend & perbaikan

- Milestone: M0
- Dikerjakan:
  - Root layout `src/app/layout.tsx` dibuat (hanya html/body); layout `(auth)` ditambah; CSS dashboard di-import di layout dashboard.
  - `/dashboard` dibungkus `<Suspense>` (Next 16 cache components).
  - `.env`: `sslmode=verify-full`.
  - Backend dipindah ke `src/server/modules/keuangan/<fitur>/{index,service,model}.ts`, `shared/` (eks file `_*.ts`), `core/errors.ts`, `modules/system/*` (via `git mv`).
  - Perbaikan ESLint (`any`, `prefer-const`, import tak terpakai).
- Migrasi: tidak ada
- Verifikasi: `tsc --noEmit` lolos; `eslint src/server` bersih; `bun test` gagal — DB lokal tidak berjalan (connection refused).
