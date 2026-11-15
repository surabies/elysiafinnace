# ROADMAP — Elysia Finance ERP

> **Sumber kebenaran tunggal** untuk arah pengembangan. Setiap sesi (manusia atau AI) WAJIB:
>
> 1. Membaca file ini + entri terakhir [SESSION-LOG.md](./SESSION-LOG.md) sebelum mulai.
> 2. Memilih tugas teratas yang statusnya `todo` di milestone aktif (atau melanjutkan `in-progress`).
> 3. Setelah selesai: centang tugas, perbarui status milestone, tambah entri di SESSION-LOG.md.
>
> Konvensi arsitektur: [ARCHITECTURE.md](./ARCHITECTURE.md). Keputusan teknis: [DECISIONS.md](./DECISIONS.md).

**Target produk:** ERP akuntansi setara **Jurnal.id, Kledo, Accurate Online** — double-entry ketat,
multi-currency, multi-gudang, RBAC, pajak Indonesia, siap produksi.

**Wewenang:** skema DB dan backend **boleh diubah, diedit, atau dihapus** bila perlu demi target ini
(proyek belum produksi). Perubahan skema wajib lewat migrasi Drizzle baru dan dicatat di SESSION-LOG.

Status: `todo` · `in-progress` · `done` · `blocked`

---

## Ringkasan milestone

### Backend (Selesai — Siap Konsumsi API)

| ID  | Milestone                                           | Status      |
| --- | --------------------------------------------------- | ----------- |
| M0  | Fondasi & restrukturisasi backend                   | in-progress |
| M1  | Master data & multi-currency                        | done        |
| M2  | Jurnal, buku besar, biaya                           | done        |
| M3  | Kas & bank (mutasi, transfer, rekonsiliasi)         | done        |
| M4  | Pembelian (AP)                                      | done        |
| M5  | Penjualan (AR)                                      | done        |
| M6  | Pembayaran & alokasi, uang muka, selisih kurs       | done        |
| M7  | Inventori lanjutan (multi-gudang, transfer, opname) | done        |
| M8  | Pajak Indonesia (PPN, PPh, e-Faktur/Coretax)        | done        |
| M9  | Aset tetap & penyusutan                             | done        |
| M10 | Anggaran & dimensi (cabang/departemen/proyek)       | done        |
| M11 | RBAC penuh, multi-perusahaan, audit log, approval   | done        |
| M12 | Laporan enterprise & ekspor                         | done        |
| M13 | Otomasi (recurring, reminder, import/ekspor data)   | done        |
| M14 | Produksi: keamanan, performa, observabilitas, test  | done        |

### Frontend (Skala Prioritas Standar Industri ERP)

| ID  | Milestone Frontend                                  | Skala Prioritas       | Status      |
| --- | --------------------------------------------------- | --------------------- | ----------- |
| F0  | Fondasi UI/UX, Data-Table & Input Finansial         | Tier 0 (Kritikal)     | done        |
| F1  | Master Data & Fondasi Bisnis (COA, Kontak, Produk)  | Tier 1 (Fondasi Data) | done        |
| F2  | Kas & Bank, Biaya, dan Buku Besar (General Ledger)  | Tier 2 (Inti Kas)     | todo        |
| F3  | Siklus Dagang Inti: Pembelian (AP) & Penjualan (AR) | Tier 3 (Transaksi)    | todo        |
| F4  | Inventori Lanjutan, Multi-Gudang & Aset Tetap       | Tier 4 (Operasional)  | todo        |
| F5  | Pajak Indonesia, Anggaran & Dimensi, Tutup Buku     | Tier 5 (Kepatuhan)    | todo        |
| F6  | Laporan Enterprise SAK & Cetak Dokumen Print-Ready  | Tier 6 (Eksekutif)    | todo        |
| F7  | Tata Kelola Sistem, RBAC, Approval, & Otomasi       | Tier 7 (Governance)   | todo        |

### Ekosistem Enterprise Lanjutan (Payroll, POS, Omnichannel, CRM)

| ID  | Milestone                                                  | Skala Prioritas       | Status |
| --- | ---------------------------------------------------------- | --------------------- | ------ |
| E1  | HR & Payroll (Gaji, PPh 21 TER, BPJS, Jurnal Pengeluaran)  | Tier 1 (SDM & Gaji)   | done   |
| E2  | POS / Kasir Retail (Multi-Register, Shift, Struk, Jurnal)  | Tier 1 (Penjualan POS)| done   |
| E3  | Integrasi Marketplace Omnichannel (Tokopedia, Shopee, dsb) | Tier 1 (Omnichannel)  | done   |
| E4  | CRM Terintegrasi (Leads Pipeline, Deals, Kontak Pelanggan) | Tier 1 (Pertumbuhan)  | done   |

### Database Seeding & Setup Wizard Engine (Fondasi Data Produksi)

| ID  | Milestone Seeding & Setup Engine                      | Skala Prioritas       | Status |
| --- | ----------------------------------------------------- | --------------------- | ------ |
| S0  | Database Reset Engine (`reset.ts` / TRUNCATE CASCADE) | Tier 0 (Clean Canvas) | done   |
| S1  | System Foundation Seeds (Valas, Pajak, UOM, RBAC)     | Tier 1 (Data Wajib)   | done   |
| S2  | Industry COA Presets (Dagang, Jasa, Manufaktur)       | Tier 2 (Template COA) | done   |
| S3  | Realistic Demo Fixtures (Perusahaan, Kontak, Trx)     | Tier 3 (Demo Mode)    | done   |
| S4  | Master Seeder Runner CLI & Onboarding Wizard Hook     | Tier 4 (Produksi/API) | done   |

---

## M0 — Fondasi & restrukturisasi backend

- [x] Struktur modul Elysia `modules/<fitur>/{index,service,model}.ts` (lihat ARCHITECTURE.md)
- [x] Root layout Next dipisah dari layout `(site)` / `(dashboard)` / `(auth)`
- [x] ESLint & `tsc` bersih di `src/server`
- [x] Pecah `modules/keuangan/shared/common.ts` → `errors.ts`, `response.ts`, `pagination.ts`, `access.ts`
- [x] Satukan sistem error: `core/errors.ts` (`ApiError`) vs `GalatAplikasi` → satu kelas
- [x] Konvensi response seragam `{ success, data, meta }` / `{ success:false, error }` + OpenAPI di `/api/openapi`
- [ ] **blocked** Test harness DB: port default diperbaiki (5432), tapi Docker daemon tidak berjalan di mesin dev — jalankan Docker Desktop + `docker compose up -d db`, lalu `bun test`
- [x] Modul `system/echo` DIPERTAHANKAN — masih dipakai halaman playground & e2e

## M1 — Master data & multi-currency

- [x] Mata uang + kurs historis, mata uang dasar
- [x] COA hierarkis + `normal_balance` + peran sistem
- [x] Kontak (pelanggan/pemasok) + termin pembayaran
- [x] Item, kategori, satuan
- [x] Rekening kas/bank terhubung COA
- [x] Kontak: multi-alamat, multi-kontak person, batas kredit, NPWP/NIK, grup kontak
- [x] Item: multi-satuan + konversi, harga jual bertingkat (price list), barcode, item jasa/non-stok/bundel
- [x] Revaluasi kurs akhir periode (unrealized gain/loss)
- [x] Import master data via CSV (COA, kontak, item, saldo awal)
- [x] Saldo awal (opening balance) akun, piutang, hutang, stok

## M2 — Jurnal, buku besar, biaya

- [x] Jurnal draft/posting/balik + validasi debit = kredit
- [x] Buku besar, biaya, tutup periode bulanan
- [x] Neraca saldo (trial balance) + worksheet penyesuaian
- [x] Jurnal berulang (recurring) & template jurnal
- [x] Lampiran dokumen pada jurnal/biaya
- [x] Tutup buku akhir tahun → Laba Ditahan (tabel `year_end_closings` sudah ada)

## M3 — Kas & bank

- [x] API transaksi bank: kas masuk, kas keluar, transfer antar-rekening (tabel `bank_transactions` ada)
- [x] Rekonsiliasi bank: import mutasi (CSV), pencocokan otomatis/manual (tabel `bank_reconciliations` ada)
- [x] Biaya admin/bunga bank, transfer beda mata uang
- [x] Laporan: mutasi rekening, rekonsiliasi

## M4 — Pembelian (AP)

- [x] Permintaan pembelian (opsional) → Pesanan Pembelian (PO) → Penerimaan Barang → Faktur Pembelian
- [x] Posting faktur: Dr Persediaan/Beban + PPN Masukan, Cr Hutang Usaha
- [x] Retur pembelian / nota debit
- [x] Uang muka pemasok
- [x] Status dokumen: draft/terbuka/sebagian/lunas/batal

## M5 — Penjualan (AR)

- [x] Penawaran (quotation) → Pesanan Penjualan (SO) → Pengiriman → Faktur Penjualan
- [x] Posting faktur: Dr Piutang, Cr Pendapatan Penjualan + PPN Keluaran; Dr HPP, Cr Persediaan (rata-rata)
- [x] Diskon per baris & per faktur, ongkir, biaya lain
- [x] Retur penjualan / nota kredit
- [x] Uang muka pelanggan, batas kredit pelanggan

## M6 — Pembayaran

- [x] Penerimaan pelanggan & pembayaran pemasok (tabel `payments`, `payment_allocations` ada)
- [x] Alokasi ke banyak faktur, pembayaran sebagian, potongan pelunasan
- [x] Selisih kurs terealisasi otomatis
- [ ] Giro/cek mundur (opsional)

## M7 — Inventori lanjutan

- [x] Gudang (multi-lokasi) + stok per gudang (ubah skema `item_stocks`)
- [x] Transfer antar gudang, stok opname, penyesuaian stok (API)
- [x] Metode penilaian: rata-rata (ada) + FIFO
- [x] Nomor seri / batch & kedaluwarsa, stok minimum & reorder
- [x] Rakitan/produksi sederhana (Bill of Materials)
- [x] Laporan: kartu stok, nilai persediaan, pergerakan stok

## M8 — Pajak Indonesia

- [x] Master pajak (PPN 11/12%, DPP nilai lain, PPh 21/22/23/4(2)/15), pajak majemuk per baris
- [x] PPN masukan/keluaran, PPh dipotong/dipungut, bukti potong
- [x] Nomor seri faktur pajak, ekspor e-Faktur/Coretax (CSV/XML)
- [x] Laporan rekap PPN (SPT Masa), daftar bukti potong

## M9 — Aset tetap

- [x] Registrasi aset, kategori aset (akun aset, akumulasi, beban penyusutan)
- [x] Metode: garis lurus, saldo menurun; masa manfaat sesuai golongan fiskal
- [x] Posting penyusutan bulanan (batch), pelepasan/penjualan aset (laba/rugi)
- [x] Laporan daftar aset & penyusutan

## M10 — Anggaran & dimensi

- [x] Dimensi: cabang, departemen, proyek, tag pada baris jurnal & dokumen
- [x] Anggaran per akun/periode/dimensi; Anggaran vs Realisasi
- [x] Laporan laba-rugi per proyek/cabang

## M11 — RBAC, multi-perusahaan, kontrol

- [x] API kelola peran, izin, penugasan pengguna (tabel `roles`, `role_permissions`, `user_roles` ada)
- [x] Multi-perusahaan (tenant): `company_id` di semua tabel bisnis + isolasi query
- [x] Undang pengguna, batasi akses per cabang/gudang
- [x] Audit log (siapa, apa, kapan, sebelum/sesudah)
- [x] Alur persetujuan (approval) bertingkat per jenis dokumen & nominal
- [x] Kunci tanggal transaksi (lock date)

## M12 — Laporan enterprise

- [x] Neraca, laba-rugi, arus kas (dasar)
- [x] KPI dashboard 12 bulan dari jurnal terposting dengan tren kas, pendapatan, beban, dan laba
- [x] Agregasi neraca hanya menghitung jurnal terposting sampai tanggal laporan; arus kas diklasifikasikan dari akun lawan kas
- [x] Aktivitas jurnal terposting terbaru pada dashboard, hanya untuk pengguna berizin `jurnal.baca`
- [x] Perubahan ekuitas, neraca saldo, buku besar pembantu piutang/hutang
- [x] Umur piutang/hutang (aging), laporan penjualan/pembelian per pelanggan/pemasok/item
- [x] Laporan perbandingan (periode vs periode), konsolidasi multi-perusahaan
- [x] Ekspor PDF/Excel (CSV RFC-4180), cetak dokumen (faktur, PO) dengan template HTML/print-ready

## M13 — Otomasi

- [x] Transaksi berulang (faktur, biaya, jurnal)
- [x] Pengingat jatuh tempo via email
- [x] Webhook & API key untuk integrasi pihak ketiga

## M14 — Kesiapan produksi

- [x] Idempotency key untuk POST transaksi
- [x] Rate limit per pengguna, validasi input menyeluruh
- [x] Indeks DB untuk laporan, paginasi cursor, materialized saldo bila perlu
- [x] Logging terstruktur + tracing, health check DB
- [x] Test integrasi per modul (aturan double-entry, stok, kurs) + e2e
- [x] Backup & strategi migrasi tanpa downtime (lihat docs/PRODUCTION-RUNBOOK.md)

---

## F0 — Fondasi UI/UX, Data-Table & Input Finansial (Tier 0)

_Tujuan: Menyediakan blok pembangun (*building blocks*) standar sebelum halaman bisnis dibangun, mencegah duplikasi kode tabel, input nilai uang, dan pemformatan angka._

- [x] **Data Table Engine Reusable (`src/components/data-table/`)**:
  - [x] Tabel data dengan header sortable, search debounce, filter dropdown, dan pagination bar.
  - [x] Kolom finansial terstandarisasi (`font-mono tabular-nums text-right`).
  - [x] State loading skeleton baris & tampilan data kosong (_EmptyState_) dengan call-to-action.
- [x] **Kontrol Input Khusus Finansial (`src/components/form/`)**:
  - [x] `CurrencyInput`: input nominal Rupiah/Valas bertopeng desimal interaktif (pemisah ribuan visual titik, internal state string desimal murni tanpa floating point drift).
  - [x] `CoaCombobox`: pemilih akun hierarkis dengan kode akun + nama + saldo normal.
  - [x] `ContactCombobox`: pemilih kontak pintar dengan badge tipe (Pelanggan/Pemasok).
  - [x] `DateRangePicker`: pemilih rentang tanggal cepat (Hari Ini, Bulan Ini, Kuartal Ini, Tahun Berjalan).
- [x] **Feedback & Action Primitives (`src/components/feedback/`)**:
  - [x] `FinancialStatusBadge`: pemetaan warna & semantik teks untuk Draft, Terbuka, Disetujui, Terposting, Sebagian, Lunas, dan Batal.
  - [x] `ConfirmActionDialog`: konfirmasi penghapusan, posting permanen, atau pembatalan dokumen.
- [x] **Navigasi Enterprise & Shell Premium (`src/components/layout/`)**:
  - [x] Perilaku buka/tutup menu sidebar stabil dengan sinkronisasi cookie ganda (`app-sidebar-collapsed` dan `app-sidebar-open-groups`) — persistensi sempurna, zero layout shift (CLS = 0), dan zero visual flickering saat SSR/refresh.
  - [x] Tipografi label kategori menu disesuaikan ke proporsi compact elegan (`text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80`) dengan hairline divider halus.
  - [x] Logo icon & text diperkecil ke ukuran proporsional (24x27 icon, 120x16 wordmark) dengan arsitektur mounted tunggal zero-flicker (bebas kedip saat sidebar diciutkan atau dilebarkan).
  - [x] Search box diposisikan di Tier 2 sidebar tepat sejajar dengan SubHeader Navbar (`h-10`, 40px) tanpa garis border pembatas atas/bawah yang kaku (tampilan _floating smooth & seamless_), mengangkat seluruh menu navigasi di bawahnya naik secara otomatis.
  - [x] Penyederhanaan penamaan menu yang ringkas, fungsional, dan standar enterprise ERP.
  - [x] Subheader bar terintegrasi bersih: breadcrumb di sisi kiri mengalir alami dengan ikon Home diperbesar (`size-4.5`, stroke 1.8), konten PT dihapus, dan tombol Kembali diletakkan rapi di pojok kanan atas.
  - [x] Penyelarasan garis pandu vertikal (_vertical alignment guide line_): ikon hamburger Navbar, ikon Home Breadcrumb, dan konten utama halaman kini sejajar lurus secara presisi di seluruh breakpoint layar.
  - [x] Optimasi layout mobile: eliminasi padding statis berlebih di header (`px-15`/`ps-15`), tombol kontrol adaptif (`size-9 sm:size-10`), penyembunyian logo pada navbar mobile untuk tampilan bersih, dan drawer Sheet mobile dengan sudut lengkung asimetris (`rounded-s-none rounded-e-2xl`) yang menyatu dengan tepi layar.
  - [x] Profile & Entity Sheet eksekutif (`src/components/layout/header/profile.tsx`): floating drawer modern dengan margin atas-bawah-kanan presisi `6px-8px` (`rounded-xl border border-border/80 shadow-2xl`), avatar besar 96px, tombol edit foto 28px, multi-entitas holding SurabieDev, menu 2 grup Akun & Aplikasi, kartu bawah gradien periode Tutup Buku Laporan Keuangan SurabieDev, serta tombol close pojok kiri atas.
  - [x] Menu header desktop (Aplikasi, Laporan, Kalender, Bantuan) disederhanakan: meniadakan kotak menutab kaku, menggunakan tombol independen bergaya ghost/palette button dengan aksen palet lembut (`bg-primary/10 text-primary font-semibold`), sangat bersih dan berkelas.
  - [x] Eliminasi aksen hitam pada menu dasbor/top-level (diganti dengan aksen lembut `bg-primary/10 text-primary font-semibold` dan hover pill `bg-muted/60`), sementara sub-item tetap mempertahankan highlight aksen aslinya.
  - [x] Efek transisi sub-menu dot interaktif: dot membesar secara dinamis (`scale: [0.5, 1.35, 1]`) dengan luminous aura halus saat sub-item diklik/aktif.

---

## F1 — Master Data & Fondasi Bisnis (Tier 1)

_Tujuan: Membangun halaman penyedia entitas dasar yang menjadi prasyarat seluruh transaksi keuangan._

- [x] **Bagan Akun / COA (`/akuntansi/bagan-akun`)**:
  - [x] Tampilan tabel daftar datar & pohon hierarki akun (Aset, Kewajiban, Ekuitas, Pendapatan, Beban).
  - [x] Seleksi baris checkbox massal & visualisasi berjenjang level akun (teks tebal header, indentasi dinamis, ikon folder/dokumen, dan badge klasifikasi tingkat).
  - [x] Modal Tambah, Edit & Tambah Sub-Akun (Kode Akun, Nama, Kategori, Saldo Normal, Peran Sistem).
  - [x] Import COA via CSV & form Saldo Awal Akun (`/akuntansi/bagan-akun/saldo-awal`).
- [x] **Kontak Bisnis (`/kontak/pelanggan` & `/kontak/pemasok`)**:
  - [x] Daftar pelanggan & pemasok dengan pencarian instan, filter grup, dan saldo piutang/hutang.
  - [x] Form kontak lengkap: informasi umum, multi-alamat, termin pembayaran default (Net 30, COD), NPWP/NIK, batas kredit.
- [x] **Produk & Persediaan Dasar (`/persediaan/produk` & `/persediaan/gudang`)**:
  - [x] Daftar produk & layanan dengan filter kategori, satuan, tipe barang, dan status aktif.
  - [x] Form produk: kode item/SKU, nama, barcode, multi-satuan, harga beli/jual standar, ambang batas stok minimum, pemetaan akun persediaan/pendapatan/HPP.
  - [x] Import katalog produk via Excel (.xlsx) multi-sheet resmi dengan validasi kolom dan preview table mini.
  - [x] Manajemen gudang/lokasi penyimpanan (`/persediaan/gudang`): kode, nama, penanggung jawab, penanda gudang utama, dan status operasional aktif.
  - [x] Master Kategori Produk mandiri (`/persediaan/kategori`) & Quick Create terintegrasi di dalam menu dropdown Select.
  - [x] Master Satuan Pengukuran / UOM mandiri (`/persediaan/satuan`) & Quick Create terintegrasi di dalam menu dropdown Select.
- [x] **Konfigurasi Penomoran Dokumen & Master Data (`/pengaturan/penomoran`)**:
  - [x] Sistem penomoran otomatis dengan prefiks dinamis, format tahun/bulan, padding sequence, dan nomor berikutnya instan.
  - [x] Mencakup seluruh siklus transaksi dan Master Data (Pelanggan `CUST`, Pemasok `SUPP`, Produk `PRD`, Kategori `CAT`, Gudang `GDG`).
- [x] **Manajemen Tag Transaksi Multi-Warna (`/pengaturan/tag`)**:
  - [x] Master data label analitis multi-warna untuk segmentasi transaksi, filter laporan, dan klasifikasi kustom Kledo-style.
  - [x] Sistem tagging polimorfik universal (`entity_tags`) terintegrasi penuh di backend & frontend untuk Kontak (Pelanggan/Pemasok), Produk/SKU, dan Kategori Produk dengan filter DataGrid dan popover multi-select pill badge warna.
- [x] **Manajemen Mata Uang & Kurs Valas (`/pengaturan/mata-uang`)**:
  - [x] Antarmuka manajemen master mata uang global (ISO 4217) & tabel kurs historis valuta asing (DataGrid, pagination, filter valas).
  - [x] Komponen universal `MataUangSelect` (`src/components/form/mata-uang-select.tsx`).
  - [x] Integrasi pemilih mata uang ke seluruh formulir Master Data: Bagan Akun (COA), Kontak Bisnis (Pelanggan/Pemasok), dan Katalog Produk.
  - [x] Seeding nilai tukar benchmark awal (USD, EUR, SGD, JPY, CNY, MYR, AUD) di database.
  - [x] Integrasi navigasi lengkap: Sidebar Menu (`sidebar-menu.ts`), Command Palette & Search Index (`search.tsx`), dan Mega Menu Quick Links (`mega-menu.ts`).
  - [x] Standardisasi pola antarmuka enterprise seragam (tanpa hero header berlebih, KPI cards strip presisi dengan icon container, FrameHeader terpadu yang memuat pencarian, filter status valas, dan tombol aksi dialog).
- [x] **Pengaturan Perusahaan & Kunci Transaksi (`/pengaturan/perusahaan` & `/pengaturan/kunci-transaksi`)**:
  - [x] Profil entitas bisnis (nama legal, alamat domisili, NPWP 16-digit, telepon, email, mata uang pembukuan, logo untuk cetak faktur komersial).
  - [x] Manajemen multi-perusahaan & struktur grup holding (DataGrid, filter status entitas, modal dialog pendaftaran entitas baru dan pembaruan profil).
  - [x] Pengaturan kunci tanggal transaksi / Lock Date (`/pengaturan/kunci-transaksi`): batas kunci mutlak (Lock All) & batas kunci operasional (Lock Non-Admin), pintasan tanggal cepat, proteksi double-entry PSAK, dan catatan audit trail.

---

## F2 — Kas & Bank, Biaya, dan Buku Besar (Tier 2)

_Tujuan: Mengelola likuiditas harian kas/bank dan pencatatan pembukuan jurnal akuntansi._

- [ ] **Rekening Kas & Bank (`/kas-bank/rekening`)**:
  - [ ] Kartu ringkasan saldo per rekening (Kas Kecil, Rekening Bank Operasional, Deposito).
  - [ ] Daftar rekening terhubung COA + tombol aksi cepat (Kas Masuk, Kas Keluar, Transfer).
- [ ] **Biaya Operasional (`/biaya`)**:
  - [ ] Daftar pengeluaran biaya dengan filter kategori beban dan tanggal.
  - [ ] Form catat biaya: pilih akun kas keluar, akun beban, nominal, penerima, dan upload lampiran kuitansi/bukti bayar.
- [ ] **Mutasi & Transfer Kas/Bank (`/kas-bank/mutasi` & `/kas-bank/transfer`)**:
  - [ ] Buku mutasi transaksi per rekening kas/bank dengan status debit/kredit dan saldo berjalan.
  - [ ] Form transfer antar-rekening kas/bank (mendukung konversi beda mata uang & biaya admin bank).
- [ ] **Rekonsiliasi Bank (`/kas-bank/rekonsiliasi`)**:
  - [ ] Unggah mutasi rekening koran CSV (BCA, Mandiri, BNI, BRI, dsb).
  - [ ] Antarmuka pencocokan dua panel (mutasi bank vs pencatatan sistem) + tombol pencocokan otomatis (_auto-match_).
- [ ] **Jurnal Umum & Buku Besar (`/akuntansi/jurnal-umum`)**:
  - [ ] Form pembuatan voucher Jurnal Umum: baris multi-debet & multi-kredit dengan validasi balance instan (debit == kredit).
  - [ ] Filter buku besar per akun, rentang tanggal, status posting, dan tombol cetak bukti jurnal.

---

## F3 — Siklus Dagang Inti: Pembelian (AP) & Penjualan (AR) (Tier 3)

_Tujuan: Alur pengadaan barang dan penjualan pendapatan harian secara end-to-end._

- [ ] **Siklus Pembelian / AP (`/pembelian/*`)**:
  - [ ] Pesanan Pembelian / PO (`/pembelian/pesanan`): daftar & form PO ke pemasok.
  - [ ] Faktur Pembelian / Bill (`/pembelian/faktur`): input tagihan pemasok, alokasi PPN Masukan, termin jatuh tempo, posting ke Hutang Usaha.
  - [ ] Pembayaran Hutang (`/pembelian/pembayaran`): pembayaran ke pemasok, alokasi multi-faktur, potongan pelunasan, selisih kurs.
  - [ ] Retur Pembelian / Nota Debit (`/pembelian/retur`).
- [ ] **Siklus Penjualan / AR (`/penjualan/*`)**:
  - [ ] Pesanan Penjualan / SO (`/penjualan/pesanan`): form SO dari pelanggan, cek batas kredit (_credit limit check_).
  - [ ] Faktur Penjualan / Invoice (`/penjualan/faktur`): pembuatan invoice penagihan, kalkulasi diskon per baris/faktur, PPN Keluaran, cetak template siap kirim.
  - [ ] Penerimaan Pembayaran (`/penjualan/pembayaran`): penerimaan kas/bank dari pelanggan, alokasi faktur terbuka, uang muka.
  - [ ] Retur Penjualan / Nota Kredit (`/penjualan/retur`).

---

## F4 — Inventori Lanjutan & Aset Tetap (Tier 4)

_Tujuan: Pengendalian stok fisik multi-lokasi dan manajemen aktiva tetap perusahaan._

- [ ] **Mutasi & Kontrol Persediaan (`/persediaan/*`)**:
  - [ ] Transfer Antar Gudang (`/persediaan/transfer`): form surat jalan pengiriman dan penerimaan barang antar lokasi.
  - [ ] Penyesuaian Stok & Opname (`/persediaan/penyesuaian`): form input hasil hitung fisik stok, posting selisih ke akun penyesuaian persediaan.
  - [ ] Kartu Stok & Laporan Pergerakan Barang.
- [ ] **Aset Tetap & Penyusutan (`/aset-tetap/*`)**:
  - [ ] Registrasi Aktiva Tetap (`/aset-tetap/daftar`): pencatatan aset baru, kategori fiskal/komersial, masa manfaat, nilai residu, metode penyusutan (Garis Lurus / Saldo Menurun).
  - [ ] Eksekusi Penyusutan Bulanan (`/aset-tetap/penyusutan`): tinjauan batch depresiasi & eksekusi posting jurnal otomatis.
  - [ ] Pelepasan & Penjualan Aset (`/aset-tetap/pelepasan`): hitung laba/rugi pelepasan aset.

---

## F5 — Pajak Indonesia, Anggaran & Dimensi, Tutup Buku (Tier 5)

_Tujuan: Kepatuhan regulasi fiskal DJP/Coretax, perencanaan anggaran, dan penutupan buku periodik._

- [ ] **Pajak Indonesia (`/pajak/*`)**:
  - [ ] Rekap Faktur Pajak PPN Masukan & Keluaran (`/pajak/faktur-pajak`).
  - [ ] Bukti Potong PPh Pasal 21, 23, 4 ayat 2 (`/pajak/bukti-potong`).
  - [ ] SPT Masa Rekapitulasi & Ekspor File Coretax/e-Faktur (`/pajak/rekap`).
- [ ] **Dimensi Biaya & Anggaran (`/akuntansi/*`)**:
  - [ ] Kelola Dimensi: Departemen, Cabang, dan Proyek (`/akuntansi/dimensi`).
  - [ ] Form Anggaran Tahunan/Bulanan per Akun & Dimensi (`/akuntansi/anggaran`).
  - [ ] Tinjauan Analisis Anggaran vs Realisasi (_Budget vs Actual_).
- [ ] **Tutup Buku Periode (`/akuntansi/tutup-buku`)**:
  - [ ] Wizard Tutup Buku Bulanan (validasi jurnal tertunda, saldo kas, depresiasi selesai).
  - [ ] Tutup Buku Akhir Tahun: pemindahan saldo akun nominal pendapatan & beban ke Laba Ditahan.

---

## F6 — Laporan Finansial Enterprise & Cetak Dokumen (Tier 6)

_Tujuan: Penyajian laporan keuangan berstandar SAK untuk jajaran manajemen dan audit._

- [ ] **Laporan Finansial Standar (`/laporan/finansial`)**:
  - [ ] Neraca (Balance Sheet): format skontro & stafel, pembanding periode.
  - [ ] Laba Rugi (Profit & Loss / Income Statement): single-step & multi-step (Laba Kotor, Operasional, Bersih).
  - [ ] Laporan Arus Kas (Cash Flow Statement): metode langsung & tidak langsung.
  - [ ] Laporan Perubahan Ekuitas.
- [ ] **Laporan Pembantu & Aging (`/laporan/subledger-aging`)**:
  - [ ] Laporan Umur Piutang (AR Aging) & Umur Hutang (AP Aging): bucket 0-30, 31-60, 61-90, >90 hari.
  - [ ] Buku Besar Pembantu Piutang & Hutang per Mitra Dagang.
- [ ] **Laporan Dagang & Komparatif (`/laporan/dagang` & `/laporan/komparatif`)**:
  - [ ] Laporan Penjualan per Pelanggan/Produk/Sales.
  - [ ] Laporan Pembelian per Pemasok/Produk.
  - [ ] Laporan Komparatif Periode vs Periode (Bulan ini vs Bulan lalu, Tahun ini vs Tahun lalu).
- [ ] **Cetak Dokumen Print-Ready (HTML/CSS & PDF Preview)**:
  - [x] Template cetak Faktur Penjualan komersial resmi (`src/components/documents/invoice-document.tsx` dengan kop surat, nomor faktur, badge status finansial, rincian pajak PPN, terbilang otomatis Rupiah, dan layout cetak A4 presisi).
  - [ ] Template cetak Surat Jalan & Bukti Penerimaan Barang.
  - [ ] Template cetak Bukti Kas Keluar / Kuitansi Pembayaran.

---

## F7 — Tata Kelola Sistem, RBAC, Approval, & Otomasi (Tier 7)

_Tujuan: Pengamanan hak akses institusional, alur otorisasi multi-level, dan integrasi otomatis._

- [ ] **Manajemen Pengguna & Peran RBAC (`/pengaturan/pengguna-peran`)**:
  - [ ] Daftar pengguna aktif, status akun, dan penugasan peran (_role assignment_).
  - [ ] Konfigurasi hak akses matriks izin (baca, buat, edit, hapus, posting, balik jurnal).
- [ ] **Alur Persetujuan Dokumen (`/pengaturan/persetujuan`)**:
  - [ ] Konfigurasi alur bertingkat berdasarkan nominal batas nilai (_threshold approval_).
  - [ ] Inbox persetujuan bagi manajer/eksekutif (terima, tolak dengan catatan revisi).
- [ ] **Audit Log & Keamanan (`/pengaturan/audit-log` & `/pengaturan/diagnostik`)**:
  - [ ] Rekaman jejak audit waktu-nyata (siapa, aksi apa, alamat IP, perubahan data _before-after_).
  - [ ] Panel diagnostik koneksi database, status redis/cache, dan integritas double-entry.
- [ ] **Otomasi & Integrasi (`/otomasi/*`)**:
  - [ ] Penjadwalan Transaksi Berulang (`/otomasi/berulang`): biaya sewa bulanan, faktur langganan rutin.
  - [ ] Manajemen Pengingat Jatuh Tempo Email/Notifikasi (`/otomasi/pengingat`).
  - [ ] Manajemen API Key & Webhook Outbound (`/otomasi/integrasi`).

---

## S0 — Database Reset Engine (`src/db/seed/reset.ts`)

_Tujuan: Menyediakan utilitas penghapusan data bersih berkecepatan tinggi tanpa merusak skema Drizzle / migrasi._

- [x] Skrip `reset.ts` dengan eksekusi `TRUNCATE TABLE ... RESTART IDENTITY CASCADE` untuk seluruh tabel transaksi dan master data.
- [x] Safeguard pengaman: cegah eksekusi tidak sengaja bila `NODE_ENV === "production"`.
- [x] Daftarkan skrip `"db:reset": "bun run src/db/seed/reset.ts"` di `package.json`.

---

## S1 — System Foundation Seeds (`src/db/seed/system/`)

_Tujuan: Menanamkan data sistem wajib (universal) yang tidak boleh hilang di semua tenant/perusahaan._

- [x] `currencies.ts`: Mata uang global (IDR dasar, USD, EUR, SGD, JPY, CNY, MYR, AUD) + kurs awal.
- [x] `payment-terms.ts`: Termin pembayaran standar (Tunai/COD, Net 7, Net 14, Net 30, Net 45, Net 60, 2/10 Net 30, EOM).
- [x] `uom.ts`: Satuan pengukuran komprehensif (PCS, UNIT, BOX, DUS, PACK, KG, GRAM, LITER, METER, M2, M3, RIM, SET, JAM, HARI, BULAN).
- [x] `taxes.ts`: Master Pajak Indonesia (PPN 11%, PPN 12% UU HPP, PPh 21, PPh 22, PPh 23, PPh 4(2) Final, PPh 15).
- [x] `asset-categories.ts`: Kategori Aset Tetap Fiskal DJP (Gol 1: 4 thn, Gol 2: 8 thn, Gol 3: 16 thn, Gol 4: 20 thn, Bangunan Permanen: 20 thn, Bangunan Non-Permanen: 10 thn).
- [x] `rbac.ts`: Katalog Peran & Matriks Izin (Super Admin, Finance Manager, Accountant, Cashier, Sales, Purchasing, Warehouse, Auditor).

---

## S2 — Industry COA Presets (`src/db/seed/coa/`)

_Tujuan: Menyediakan template bagan akun profesional terstruktur sesuai sektor industri untuk Onboarding Setup._

- [x] `trading-coa.ts`: Template Perusahaan Dagang & Ritel (Persediaan Barang Dagang, HPP, Retur Jual/Beli, Potongan, Ongkir, PPN).
- [x] `service-coa.ts`: Template Perusahaan Jasa & Konsultasi (Pendapatan Jasa, Beban Subkontraktor, Beban Proyek, Biaya Operasional Profesional).
- [x] `manufacturing-coa.ts`: Template Manufaktur & Produksi (Bahan Baku, WIP, Barang Jadi, Tenaga Kerja Langsung, Biaya Overhead Pabrik BOP).
- [x] `minimal-coa.ts`: Template Minimalis (Hanya akun peran sistem kunci, siap untuk import mandiri).

---

## S3 — Realistic Demo Fixtures (`src/db/seed/demo/`)

_Tujuan: Menyediakan dataset dummy realistis untuk eksplorasi, pengujian fitur frontend, dan demonstrasi bisnis._

- [x] `company.ts`: Profil legal `PT Elysia Niaga Nusantara`, Cabang Utama Jakarta, Gudang Utama & Gudang Transit.
- [x] `bank-accounts.ts`: Rekening Kas Kecil (Rp 5.000.000), BCA Giro Operasional (Rp 250.000.000), Mandiri Payroll (Rp 100.000.000).
- [x] `contacts.ts`: 5 Pelanggan B2B/Retail realistis & 4 Pemasok Utama lengkap dengan NPWP, alamat, kontak person, dan batas kredit.
- [x] `products.ts`: 10 item produk dagang & jasa (multi-satuan PCS/DUS/BOX, harga jual bertingkat, stok awal).
- [x] `transactions.ts`: Jurnal saldo awal, 2 Faktur Penjualan (Posted & Unpaid), 2 Faktur Pembelian (PO -> Bill), 1 Bukti Kas Masuk/Keluar.

---

## S4 — Master Seeder Runner & Onboarding Wizard Integration (`src/db/seed/index.ts`)

_Tujuan: Menyatukan seluruh modul seed ke runner CLI interaktif dan menyiapkan API hook untuk frontend Onboarding Wizard._

- [x] `index.ts`: CLI Runner dengan argumen fleksibel:
  - `bun run db:seed`: Menanamkan data sistem (S1) + template default dagang (S2).
  - `bun run db:seed --demo`: Menanamkan S1 + S2 + data demo lengkap (S3).
  - `bun run db:seed --clean`: Menjalankan reset database (S0) lalu re-seed bersih.
- [x] Endpoint backend Onboarding Wizard (`POST /api/keuangan/onboarding`): Menerima pilihan nama perusahaan, template COA industri, dan opsi demo, lalu mengeksekusi modul seed yang bersangkutan di dalam satu transaksi database.

---

## E1 — HR & Payroll Engine (`src/server/modules/keuangan/payroll/` & `/payroll`)

_Tujuan: Pengelolaan data karyawan terstruktur, komponen kompensasi, kalkulator pajak PPh 21 TER (PMK 168/2023), BPJS Ketenagakerjaan & Kesehatan, serta auto-posting jurnal pengeluaran gaji ke GL._

- [x] Master Karyawan (`employees`): NIK, nama, email, jabatan, departemen, status (Tetap/Kontrak/Magang/Freelance), tanggal masuk, rekening transfer bank, NPWP, dan PTKP (TK/0 s/d K/3).
- [x] Komponen Gaji (`salary_components`): Gaji Pokok, Tunjangan Tetap/Variabel, Lembur, Bonus, Potongan BPJS Ketenagakerjaan (JHT, JP, JKK, JKM), BPJS Kesehatan, dan Potongan PPh 21.
- [x] Kalkulasi Pajak PPh 21 TER: Perhitungan otomatis tarif bulanan TER Kategori A, B, C berdasarkan status PTKP dan penghasilan bruto sesuai PMK 168/2023.
- [x] Posting Jurnal GL Otomatis: Pencatatan Beban Gaji (Debit), Utang PPh 21 (Kredit), Utang BPJS (Kredit), dan Kas/Bank (Kredit).
- [x] UI Frontend: Manajemen Karyawan (`/payroll/karyawan`), Dialog Form Karyawan, Riwayat Payroll (`/payroll`), Modal Proses Payroll Bulanan, dan Cetak Slip Gaji Karyawan print-ready.

---

## E2 — Point of Sale (POS / Kasir) (`src/server/modules/keuangan/pos/` & `/pos`)

_Tujuan: Terminal kasir toko ritel/cabang cepat dengan pemindaian barcode, manajemen shift & kas laci, struk belanja, pemotongan stok otomatis, dan posting kas ke GL._

- [x] Terminal Register (`pos_registers`): Pemetaan mesin kasir ke gudang fisik toko dan akun kas per kasir.
- [x] Sesi Shift Kasir (`pos_shifts`): Buka shift dengan modal kas awal, tutup shift dengan rekonsiliasi kas fisik, perhitungan selisih kas (*cash over/short*), dan pencatatan audit.
- [x] Transaksi POS (`pos_orders` & `pos_order_items`): Barcode lookup, keranjang belanja dinamis, kalkulasi diskon, multi-metode pembayaran (Tunai, QRIS, Kartu Debit/EDC, Transfer), dan kembalian.
- [x] Integrasi Stok & Finansial: Pengurangan stok gudang otomatis (*atomic deduction*) dan auto-posting Jurnal Penjualan Kasir (Kas/Bank vs Pendapatan & HPP vs Persediaan).
- [x] UI Frontend: Terminal POS Split Grid (`/pos`), Buka Shift Dialog, Tutup Shift Dialog, dan Modal Struk Kasir Thermal Print-Ready.

---

## E3 — Marketplace & Omnichannel Integration (`src/server/modules/keuangan/marketplace/` & `/integrasi/marketplace`)

_Tujuan: Integrasi multichannel (Tokopedia, Shopee, TikTok Shop, Lazada, WooCommerce) untuk sinkronisasi pesanan penjualan dan pemotongan stok terpusat._

- [x] Master Saluran Channel (`marketplace_channels`): Konfigurasi kredensial API/webhook, pemetaan gudang asal stok, dan status integrasi.
- [x] Pemetaan Produk SKU (`marketplace_product_mappings`): Menghubungkan Marketplace Item ID & SKU Channel dengan Master Item ERP.
- [x] Sinkronisasi Pesanan (`marketplace_orders`): Ingestion pesanan e-commerce (nomor pesanan, nomor resi kurir, nilai pesanan, biaya komisi platform, status pengiriman).
- [x] Pengurangan Persediaan Otomatis: Sinkronisasi pemotongan kuantitas stok gudang secara real-time saat pesanan terkonfirmasi.
- [x] UI Frontend: Dashboard Channel Marketplace (`/integrasi/marketplace`), Dialog Tambah Saluran, Dialog Pemetaan SKU, dan Riwayat Pesanan Omnichannel.

---

## E4 — CRM (Customer Relationship Management) (`src/server/modules/keuangan/crm/` & `/crm/leads`, `/crm/deals`)

_Tujuan: Pelacakan prospek bisnis, pipeline negosiasi deals, riwayat komunikasi, dan konversi instan menjadi Pelanggan resmi (Customer Master Data)._

- [x] Manajemen Leads (`crm_leads`): Profil prospek, sumber lead (Website, Media Sosial, Iklan, Rekomendasi, Walk-in), status, potensi nilai, dan kontak.
- [x] Konversi One-Click ke Pelanggan: Konversi prospek berstatus `CONVERTED` langsung menjadi entitas `partners` (tipe PELANGGAN) yang siap diterbitkan faktur penjualan.
- [x] Deals & Opportunity Pipeline (`crm_deals`): Tahapan negosiasi (Prospek, Kualifikasi, Proposal, Negosiasi, Won, Lost), perkiraan nilai transaksi, dan tanggal penutupan.
- [x] Riwayat Aktivitas Interaksi (`crm_activities`): Log panggilan telepon, meeting, pengiriman email, dan catatan follow-up prospek.
- [x] UI Frontend: Manajemen Leads (`/crm/leads`), Dialog Prospek & Konversi, Pipeline Deals (`/crm/deals`), dan Dialog Pembuatan Deals Bisnis.
