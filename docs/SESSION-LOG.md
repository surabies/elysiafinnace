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

## 2026-11-15 — S-068 — Halaman Input Khusus Enterprise & Pembersihan Header Penjualan & Pembelian
- Milestone: F3/UI (Dedicated Full-Page Entry & Enterprise Data Standards)
- Dikerjakan:
  - **Pembersihan Total Header Blok & Tombol Ganda**:
    - Menghapus blok header judul besar (`<h1>Faktur Penjualan (Invoicing)</h1>`, `<h1>Tagihan Pembelian (Bills & AP)</h1>`) dan deskripsinya yang memakan ruang layar.
    - Menghapus tombol pojok kanan atas yang redundant dan memindahkan tombol aksi utama (*"Faktur Baru"* & *"Catat Tagihan"*) ke dalam `FrameHeader` DataGrid secara ergonomis.
  - **Arsitektur Formulir Penuh Khusus (Dedicated Full-Page Entry)**:
    - Mengganti sistem modal/dialog popup dengan halaman penuh khusus enterprise untuk mencegah isu pemotongan dropdown, batasan z-index, dan keterbatasan ruang tabel multi-baris:
      - `src/app/(dashboard)/penjualan/faktur/baru/page.tsx` & `_components/faktur-penjualan-form-page.tsx`
      - `src/app/(dashboard)/pembelian/faktur/baru/page.tsx` & `_components/faktur-pembelian-form-page.tsx`
    - Menghapus komponen dialog form usang (`faktur-penjualan-form-dialog.tsx` dan `faktur-pembelian-form-dialog.tsx`).
  - **Standardisasi Data Finansial Enterprise Lengkap**:
    - **Header Dokumen**: Pemilihan Pelanggan/Pemasok dengan status PKP & NPWP, Nomor Referensi PO / Faktur Pemasok, Tanggal Dokumen, Termin Pembayaran dengan auto-kalkulasi Jatuh Tempo, dan Mata Uang.
    - **Tabel Rincian Item (Full-Width Line Items)**: Mendukung baris barang persediaan ber-SKU maupun baris biaya/jasa langsung dengan akun buku besar (COA), kuantitas, harga satuan, diskon baris %, dan subtotal bersih.
    - **Rekapitulasi Finansial Komprehensif**: Subtotal DPP, Diskon Tambahan/Global, PPN Keluaran/Masukan (11%/12%/0%), Biaya Ongkos Kirim, Uang Muka, dan Grand Total Piutang/Hutang.
    - **Aksi Dokumen Ganda**: Tombol *"Simpan Draft"* dan *"Simpan & Posting"* yang langsung terintegrasi dengan backend API Elysia.
    - **Dialog Rincian Enterprise**: Menyempurnakan modal detail pada tabel dengan kolom diskon terperinci, metadata kontak, serta aksi posting & pembatalan.
- File/skema berubah:
  - `src/app/(dashboard)/penjualan/faktur/page.tsx`
  - `src/app/(dashboard)/penjualan/faktur/_components/faktur-penjualan-client-view.tsx`
  - `src/app/(dashboard)/penjualan/faktur/_components/faktur-penjualan-detail-dialog.tsx`
  - `src/app/(dashboard)/penjualan/faktur/baru/page.tsx` (baru)
  - `src/app/(dashboard)/penjualan/faktur/baru/_components/faktur-penjualan-form-page.tsx` (baru)
  - `src/app/(dashboard)/pembelian/faktur/page.tsx`
  - `src/app/(dashboard)/pembelian/faktur/_components/faktur-pembelian-client-view.tsx`
  - `src/app/(dashboard)/pembelian/faktur/_components/faktur-pembelian-detail-dialog.tsx`
  - `src/app/(dashboard)/pembelian/faktur/baru/page.tsx` (baru)
  - `src/app/(dashboard)/pembelian/faktur/baru/_components/faktur-pembelian-form-page.tsx` (baru)
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% (33 rute Next.js Partial Prerendering)
- Belum selesai / langkah berikutnya: Membangun modul pengiriman pesanan (DO) dan penerimaan pengadaan (GRN).


## 2026-11-15 — S-067 — Standardisasi DataGrid Tabel & Fungsionalitas Penuh Tombol Transaksi Penjualan & Pembelian
- Milestone: F3/UI (DataGrid Standar, Form Dialog, Detail Dialog & Aksi Tombol Komersial)
- Dikerjakan:
  - **Penyelarasan Total Standar Desain Tabel (`DataGrid` & `Frame`)**:
    - Mengganti tabel HTML primitif dengan ekosistem standar proyek: `DataGrid`, `Frame`, `FrameHeader`, `FramePanel`, `FrameFooter`, `DataGridTable`, `DataGridScrollArea`, `DataGridPagination`, `DataGridColumnHeader`, `DataGridTableRowSelect`, dan `DataGridTableRowSelectAll`.
    - Mengintegrasikan `@tanstack/react-table` (`useTable`) dengan `dataGridFeatures` untuk sorting, pagination teratur, dan multi-row selection.
  - **Fungsionalitas Penuh Seluruh Tombol Aksi Transaksi**:
    - **Pembuatan Faktur & Tagihan Baru**:
      - Membangun `FakturPenjualanFormDialog` dan `FakturPembelianFormDialog` yang terhubung ke API `POST /penjualan/faktur` dan `POST /pembelian/faktur`.
      - Fitur pemilihan kontak (*pelanggan/pemasok*), termin pembayaran, tanggal jatuh tempo, catatan, baris item dinamis (*item picker, kuantitas, harga, diskon persen*), kalkulasi otomatis subtotal & PPN, serta opsi "Simpan Draft" atau "Simpan & Langsung Posting".
    - **Aksi Baris Tabel (*Row Action Dropdown*)**:
      - Menu titik tiga (`IconDots`): *Lihat Detail*, *Posting Faktur / Tagihan*, *Batalkan Dokumen*, dan *Salin Nomor Faktur*.
      - Membangun `FakturPenjualanDetailDialog` dan `FakturPembelianDetailDialog` untuk melihat rincian item, subtotal, status, dan riwayat jurnal.
      - Menghubungkan tombol posting instan ke endpoint `POST /penjualan/faktur/:id/posting` dan `POST /pembelian/faktur/:id/posting`.
      - Menghubungkan pembatalan ke endpoint `POST /penjualan/faktur/:id/batal` dan `POST /pembelian/faktur/:id/batal` dengan alasan pembatalan.
    - **Bilah Kontrol Header Terpadu**:
      - Pencarian instan (nomor faktur, nama/kode kontak) dengan tombol hapus teks pencarian.
      - Filter dropdown status terintegrasi (*SEMUA, DRAFT, POSTED, LUNAS, BELUM_LUNAS, DIBATALKAN*).
      - Tombol batal seleksi dengan badge counter jika ada baris yang dipilih.
  - **Koneksi Data Master Opsi Dropdown**:
    - Di `src/app/(dashboard)/penjualan/faktur/page.tsx` dan `src/app/(dashboard)/pembelian/faktur/page.tsx`, mengambil data master pelanggan/pemasok, katalog item, dan termin pembayaran secara paralel melalui `apiServer`.
- File/skema berubah:
  - `src/app/(dashboard)/penjualan/faktur/page.tsx`
  - `src/app/(dashboard)/penjualan/faktur/_components/faktur-penjualan-client-view.tsx`
  - `src/app/(dashboard)/penjualan/faktur/_components/faktur-penjualan-form-dialog.tsx` (baru)
  - `src/app/(dashboard)/penjualan/faktur/_components/faktur-penjualan-detail-dialog.tsx` (baru)
  - `src/app/(dashboard)/pembelian/faktur/page.tsx`
  - `src/app/(dashboard)/pembelian/faktur/_components/faktur-pembelian-client-view.tsx`
  - `src/app/(dashboard)/pembelian/faktur/_components/faktur-pembelian-form-dialog.tsx` (baru)
  - `src/app/(dashboard)/pembelian/faktur/_components/faktur-pembelian-detail-dialog.tsx` (baru)
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% (31 rute Next.js Partial Prerendering)
- Belum selesai / langkah berikutnya: Membangun modul penerimaan barang (Goods Receipt / GRN) dan pengiriman pesanan (Delivery Order / DO) terkait.


## 2026-11-15 — S-066 — Integrasi Data Riil Database & Desain Tab Ergonomis Penjualan & Pembelian
- Milestone: F3/UI (Siklus Dagang Inti: Faktur Penjualan & Tagihan Pembelian)
- Dikerjakan:
  - **Koneksi Data Riil Backend Aggregation**:
    - Menambahkan endpoint `GET /penjualan/ringkasan` (`ringkasanPenjualan`) dan `GET /pembelian/ringkasan` (`ringkasanPembelian`) di modul keuangan backend.
    - Mengagregasi data aktual database PostgreSQL (`sales_invoices`, `sales_invoice_items`, `purchase_invoices`, `purchase_invoice_items`, `items`) per bulan berjalan & tahun sebelumnya, top 5 item/produk terlaris/terbanyak, serta kalkulasi pangsa distribusi.
    - Menghubungkan SSR Next.js di `src/app/(dashboard)/penjualan/faktur/page.tsx` dan `src/app/(dashboard)/pembelian/faktur/page.tsx` ke endpoint ringkasan.
  - **Pembersihan Pembungkus Kontainer Ganda**:
    - Menghilangkan kontainer ganda (`rounded-2xl border bg-card/60 p-5`) pada `SalesOverview` dan `PurchasesOverview`.
    - Merender komponen ikhtisar secara bersih (*native & container-free*) memanfaatkan styling internal kartu bawaan tanpa penumpukan border.
  - **Tata Letak Tab Ergonomis (Dual Tab Workflow)**:
    - Menerapkan sistem 2 tab modern pada kedua halaman:
      - **Tab 1: "Daftar Faktur / Tagihan"** (Default): 4 strip KPI ringkas (*Total Nilai, Sisa Piutang/Hutang, Lewat Jatuh Tempo, Lunas*) + bilah pencarian & filter status + tabel data lengkap.
      - **Tab 2: "Analisis & Tren"**: Tampilan visual analitik interaktif penuh (*SalesOverview* / *PurchasesOverview*) dengan pemilihan metrik omset/pesanan/AOV/pelanggan, grafik tren bulanan, top produk, dan rasio saluran.
  - **Penyelarasan Tipe & Ikon Serilisasi JSON**:
    - Membuat properti `icon?: CommerceIconType` opsional pada `SalesProduct` agar data dari API JSON tidak memerlukan objek fungsi React ikon, dengan fallback otomatis ke `IconPackage` / `IconBuildingStore`.
- File/skema berubah:
  - `src/components/sales-overview.tsx`
  - `src/server/modules/keuangan/penjualan/service.ts`
  - `src/server/modules/keuangan/penjualan/index.ts`
  - `src/server/modules/keuangan/pembelian/service.ts`
  - `src/server/modules/keuangan/pembelian/index.ts`
  - `src/app/(dashboard)/penjualan/faktur/page.tsx`
  - `src/app/(dashboard)/penjualan/faktur/_components/faktur-penjualan-client-view.tsx`
  - `src/app/(dashboard)/pembelian/faktur/page.tsx`
  - `src/app/(dashboard)/pembelian/faktur/_components/faktur-pembelian-client-view.tsx`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error (16 warnings dari existing libraries/data-grid)
  - `bun run build`: Berhasil 100% (31 rute Next.js Partial Prerendering)
- Belum selesai / langkah berikutnya: Membangun formulir dialog / modal interaktif untuk pembuatan faktur penjualan dan tagihan pembelian baru.


## 2026-11-15 — S-065 — Penerapan Halaman Faktur Penjualan & Tagihan Pembelian Terintegrasi Ikhtisar Analitik
- Milestone: F3 (Siklus Dagang Inti: Faktur Penjualan & Tagihan Pembelian)
- Dikerjakan:
  - **Penerapan Halaman Faktur Penjualan (`/penjualan/faktur`)**:
    - Memasang komponen analitik `<SalesOverview modeType="penjualan" currency="Rp " />` di bagian atas halaman faktur penjualan.
    - Menampilkan tabel riwayat transaksi faktur penjualan (`salesInvoices`), terintegrasi langsung dengan API backend `apiServer.keuangan.penjualan.faktur.get`.
    - Fitur pencarian instan (nomor faktur, nama/kode pelanggan), filter status dokumen (*SEMUA, DRAFT, DISETUJUI, SELESAI, BATAL*), indikator status pelunasan piutang (*Lunas / Sisa Piutang*), dan tombol aksi cepat buat faktur baru.
  - **Penerapan Halaman Tagihan Pembelian (`/pembelian/faktur`)**:
    - Memasang komponen analitik pengadaan `<PurchasesOverview currency="Rp " />` di bagian atas halaman tagihan pembelian.
    - Menampilkan tabel riwayat transaksi tagihan vendor/pemasok (`purchaseInvoices`), terintegrasi langsung dengan API backend `apiServer.keuangan.pembelian.faktur.get`.
    - Fitur pencarian instan (nomor tagihan, nama/kode pemasok), filter status dokumen, pemantauan sisa hutang usaha (*AP*), tanggal jatuh tempo, dan tombol aksi catat tagihan baru.
  - **Rute Hub & Redirect Cerdas**:
    - Menambahkan rute `/penjualan` yang secara otomatis mengarahkan ke `/penjualan/faktur`.
    - Menambahkan rute `/pembelian` yang secara otomatis mengarahkan ke `/pembelian/faktur`.
- File/skema berubah:
  - `src/app/(dashboard)/penjualan/page.tsx` (baru)
  - `src/app/(dashboard)/penjualan/faktur/page.tsx` (baru)
  - `src/app/(dashboard)/penjualan/faktur/_components/faktur-penjualan-client-view.tsx` (baru)
  - `src/app/(dashboard)/pembelian/page.tsx` (baru)
  - `src/app/(dashboard)/pembelian/faktur/page.tsx` (baru)
  - `src/app/(dashboard)/pembelian/faktur/_components/faktur-pembelian-client-view.tsx` (baru)
  - `docs/SESSION-LOG.md`
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% (31 rute Next.js Partial Prerendering)
- Belum selesai / langkah berikutnya: Membangun formulir dialog / modal pembuatan faktur penjualan dan tagihan pembelian baru.

## 2026-11-15 — S-064 — Modularisasi Komponen Ikhtisar Finansial Penjualan & Pembelian (Sales & Purchases Overview)
- Milestone: F3/UI (Komponen Analitik & Ikhtisar Transaksi Penjualan & Pembelian)
- Dikerjakan:
  - **Perbaikan Total Bug & Error TypeScript (`sales-overview.tsx`)**:
    - Memperbaiki seluruh error indeks `noUncheckedIndexedAccess: true` pada `years[yearIndex]`, `ResizeObserver ([entry])`, `values[hover]`, dan `products[0]`.
    - Menghilangkan akses ref saat render (`react-hooks/refs` pada `lastSize.current !== size`) agar kompatibel penuh dengan React 19 Compiler.
  - **Modularisasi Dual-Mode (`modeType="penjualan"` | `"pembelian"`)**:
    - Mengintegrasikan dukungan dwiguna untuk **Penjualan (Sales Overview)** dan **Pembelian (Purchases Overview)** dalam satu komponen yang terstandarisasi.
    - Menyesuaikan metrik, judul, tooltip, dan hint bahasa Indonesia:
      - **Mode Penjualan**: Total Penjualan, Jumlah Pesanan, Rata-rata Order, Pelanggan Aktif, Produk Terlaris, dan Saluran Penjualan.
      - **Mode Pembelian**: Total Pembelian, Pesanan Beli (PO), Rata-rata Tagihan, Pemasok Aktif, Barang Pengadaan Terbanyak, dan Saluran Pemasok & Vendor.
    - Mengekspor komponen siap pakai: `<SalesOverview />`, `<PurchasesOverview />`, generator fixture data (`sampleSalesYear`, `samplePurchaseYear`), dan tipe data terkait.
  - **Lokalisasi Mata Uang & Angka**:
    - Mendukung format mata uang Rupiah (`Rp `) dengan pembulatan compact lokal (`M` untuk Miliar, `Jt` untuk Juta, `Rb` untuk Ribu) dan rolling digit animasi.
  - **Penyelarasan Ikon Tabler**:
    - Mengganti seluruh ikon Lucide ke `@tabler/icons-react` (`IconArrowUpRight`, `IconArrowDownRight`, `IconChartLine`, `IconChartBar`, `IconPackage`, `IconCoffee`, `IconHeadphones`, `IconShirt`, `IconBuildingStore`).
- File/skema berubah:
  - `src/components/sales-overview.tsx`
  - `docs/SESSION-LOG.md`
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% (27 rute Next.js Partial Prerendering)
- Belum selesai / langkah berikutnya: Memasang komponen ini ke dashboard penjualan (`/penjualan/pesanan`, `/penjualan/faktur`) dan pembelian (`/pembelian/pesanan`, `/pembelian/faktur`).

## 2026-11-15 — S-063 — Penyelarasan Posisi Badge PRO, Skema Warna Biru Enterprise & Penggantian Arrow Accordion
- Milestone: F0/UI-UX (Sidebar Alignment, Blue PRO Palette, Smart Chevron Replacement)
- Dikerjakan:
  - **Penyelarasan Posisi Badge PRO (100% Right-Aligned)**:
    - Menyelaraskan seluruh badge `PRO` pada posisi tepi kanan (`ml-auto`), baik pada item tautan tunggal (`SidebarLink`) maupun menu grup bertingkat (`SidebarGroup`), sehingga seluruh badge berjejer sejajar vertikal dengan presisi.
  - **Palet Warna Biru Enterprise Modern**:
    - Mengganti palet warna badge menjadi biru enterprise yang kontras, bersih, dan jelas (`bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400 border border-blue-500/25`).
  - **Penggantian Arrow Accordion pada Menu PRO**:
    - Menyembunyikan panah chevron (`IconChevronRight`) pada menu grup yang berlabel `PRO` (seperti *Payroll & Karyawan*, *CRM & Prospek Bisnis*, *Aset Tetap*), dan menempatkan badge `PRO` di posisi kanan tersebut.
    - Fungsi expand/collapse dan animasi accordion tetap berjalan 100% normal saat tombol baris diklik.
  - **Pembersihan Badge Heading Section**:
    - Menghilangkan badge `PRO` pada judul seksi *"Ekosistem Enterprise"*, membiarkan judul seksi bersih dan profesional, dengan badge `PRO` hanya disematkan pada masing-masing item fitur.
- File/skema berubah:
  - `src/components/layout/sidebar/sidebar-nav.tsx`
  - `src/components/layout/navigation/sidebar-menu.ts`
  - `docs/SESSION-LOG.md`
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% (27 rute Next.js Partial Prerendering)
- Belum selesai / langkah berikutnya: Melanjutkan ke Milestone F2 (Kas & Bank, Biaya Operasional, dan Buku Besar / General Ledger).

## 2026-11-15 — S-062 — Restrukturisasi Navigasi Sidebar Enterprise, Perbaikan Bug Active State & Implementasi Badge PRO
- Milestone: F0/UI-UX (Restrukturisasi Navigasi Sidebar & Ekosistem Enterprise)
- Dikerjakan:
  - **Penyusunan Ulang Struktur Menu Sidebar**:
    - Memisahkan secara bersih antara transaksi operasional standar (*Core Finance & Accounting*) dengan modul bisnis bernilai tinggi (*Enterprise Ecosystem*).
    - Membentuk 6 section teratur dan intuitif:
      1. **Ringkasan**: Dasbor & Analytics
      2. **Keuangan & Akuntansi**: Penjualan (AR), Pembelian (AP), Biaya Operasional, Kas & Bank, Akuntansi (COA, Jurnal, Dimensi, Anggaran, Tutup Buku), dan Perpajakan.
      3. **Persediaan & Gudang**: Persediaan, Multi-Gudang, Kategori, Satuan, Transfer, dan Stok Opname.
      4. **Ekosistem Enterprise `[PRO]`**: POS (Kasir), Payroll & Karyawan, Marketplace Omnichannel, CRM (Leads & Deals), dan Aset Tetap.
      5. **Pusat Laporan**: Laporan Keuangan, Buku Pembantu & Aging, Komersial, Komparatif, Konsolidasi Holding.
      6. **Otomasi & Sistem**: Otomasi (Recurring, Reminders, API) & Pengaturan Komprehensif.
  - **Desain Badge `PRO` yang Minimalis, Elegan & Hemat Ruang**:
    - Menambahkan dukungan properti `badge?: string` pada `NavSection`, `NavGroup`, dan `NavLink`.
    - Merancang badge mini pill `PRO` berkelas (`text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20`) yang tidak memakan ruang layout vertikal/horizontal.
    - Pada mode collapsed (rail sidebar), badge otomatis ditampilkan di tooltip deskriptif (`RailTooltip`).
  - **Perbaikan Bug State Aktif Sub-menu Payroll (`/payroll` vs `/payroll/karyawan`)**:
    - **Penyebab**: Fungsi `isPathActive` sebelumnya menggunakan `pathname.startsWith(`${href}/`)` tanpa mengecek tautan saudara (*sibling links*). Akibatnya, saat berada di `/payroll/karyawan`, `/payroll` dianggap aktif secara bersamaan sehingga kedua menu ter-highlight aktif dan berkedip.
    - **Solusi**:
      1. Memperbarui `isPathActive` di `utils.ts` untuk membandingkan spesifisitas `siblingHrefs`. Jika ada sibling yang lebih panjang/spesifik dan cocok dengan pathname, URL induk tidak akan dianggap aktif.
      2. Menambahkan dukungan flag `exact?: boolean` pada `NavLink` untuk kontrol mutlak.
      3. Menetapkan `exact: true` pada `Proses Penggajian` (`/payroll`), sehingga hanya aktif jika berada tepat di `/payroll`.
- File/skema berubah:
  - `src/components/layout/navigation/types.ts`
  - `src/components/layout/navigation/utils.ts`
  - `src/components/layout/navigation/sidebar-menu.ts`
  - `src/components/layout/sidebar/sidebar-nav.tsx`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada (perubahan level UI/UX Navigasi)
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% (27 rute Next.js Partial Prerendering)
- Belum selesai / langkah berikutnya: Melanjutkan ke Milestone F2 (Kas & Bank, Biaya Operasional, dan Buku Besar / General Ledger).

## 2026-11-15 — S-061 — Ekspansi Modul Enterprise: Payroll (HR), POS Retail, Marketplace Omnichannel, & CRM
- Milestone: E1 (HR & Payroll), E2 (POS Kasir), E3 (Marketplace Omnichannel), E4 (CRM)
- Dikerjakan:
  - **Pembangunan Modul HR & Payroll (`/payroll` & `/payroll/karyawan`)**:
    - **Skema Database (`hr-payroll.ts`)**: `employees`, `salary_components`, `payrolls`, `payroll_items`.
    - **Backend Engine (`src/server/modules/keuangan/payroll/`)**:
      - Master data karyawan terstruktur (NIK, PTKP TK/0 s/d K/3, status kontrak/tetap/magang/freelance, nomor rekening bank).
      - Komponen gaji dinamis (gaji pokok, tunjangan, lembur, bonus, potongan).
      - Kalkulator Pajak PPh 21 TER bulanan sesuai PMK 168/2023 (Kategori A, B, C) dan BPJS Ketenagakerjaan/Kesehatan.
      - Auto-posting Jurnal GL Pengeluaran Gaji (Debit Beban Gaji vs Kredit Utang Pajak PPh 21, Utang BPJS, dan Kas/Bank).
    - **Frontend Terpadu**:
      - Halaman Penggajian (`/payroll`), KPI Strip penggajian, dialog proses batch payroll, dan modal cetak Slip Gaji print-ready.
      - Halaman Karyawan (`/payroll/karyawan`), tabel karyawan terstruktur, dan form modal tambah/ubah karyawan.
  - **Pembangunan Modul POS (Point of Sale) Kasir Retail (`/pos`)**:
    - **Skema Database (`pos.ts`)**: `pos_registers`, `pos_shifts`, `pos_orders`, `pos_order_items`.
    - **Backend Engine (`src/server/modules/keuangan/pos/`)**:
      - Registrasi terminal mesin kasir yang terhubung ke gudang cabang fisik dan akun kas laci.
      - Manajemen shift kasir: Buka shift dengan kas modal awal, tutup shift dengan rekonsiliasi kas fisik dan kalkulasi selisih kas (*cash discrepancy reconciliation*).
      - Pemrosesan transaksi checkout: Pemotongan kuantitas stok gudang secara otomatis (*atomic inventory stock deduction*) dan posting jurnal penjualan kasir ke buku besar.
    - **Frontend Terpadu**:
      - Antarmuka kasir Split-Grid (`/pos`): katalog produk dengan pencarian instan/barcode dan panel keranjang belanja dinamis.
      - Pilihan multi-metode pembayaran (Tunai, QRIS, Kartu Debit/EDC, Transfer Bank) dengan kalkulasi uang kembalian instan.
      - Modal Buka Shift, Modal Tutup Shift Kasir, dan Modal Cetak Struk Kasir Thermal print-ready.
  - **Pembangunan Modul Integrasi Marketplace Omnichannel (`/integrasi/marketplace`)**:
    - **Skema Database (`marketplace.ts`)**: `marketplace_channels`, `marketplace_product_mappings`, `marketplace_orders`.
    - **Backend Engine (`src/server/modules/keuangan/marketplace/`)**:
      - Master saluran marketplace multi-platform (Tokopedia, Shopee, TikTok Shop, Lazada, dsb).
      - Pemetaan SKU marketplace ke SKU master produk gudang ERP.
      - Ingestion pesanan e-commerce dengan auto-deduct persediaan gudang ERP secara terpusat.
    - **Frontend Terpadu**:
      - Halaman Marketplace (`/integrasi/marketplace`) dengan 3 tab kerja: Saluran Terhubung, Pemetaan Produk SKU, dan Riwayat Pesanan Omnichannel.
      - Form modal penambahan channel marketplace dan modal pemetaan SKU produk.
  - **Pembangunan Modul CRM & Prospek Bisnis (`/crm/leads` & `/crm/deals`)**:
    - **Skema Database (`crm.ts`)**: `crm_leads`, `crm_deals`, `crm_activities`.
    - **Backend Engine (`src/server/modules/keuangan/crm/`)**:
      - Manajemen data leads dari multi-sumber (Website, Iklan, Rekomendasi, Walk-in, Telemarketing).
      - One-click konversi leads yang disetujui langsung menjadi entitas Pelanggan resmi (`partners` tipe PELANGGAN) untuk transaksi penjualan.
      - Manajemen pipeline tahapan deals bisnis (Prospek, Kualifikasi, Proposal, Negosiasi, Won, Lost) dan aktivitas interaksi.
    - **Frontend Terpadu**:
      - Halaman Leads (`/crm/leads`), filter status, KPI konversi, dialog form lead, dan tombol konversi ke kontak pelanggan.
      - Halaman Deals (`/crm/deals`), pelacakan tahapan pipeline negosiasi, estimasi nilai deals, dan dialog deal baru.
  - **Integrasi Navigasi & Sidebar**:
    - Memasang seluruh rute baru ke `src/components/layout/sidebar/routes.ts` dan `src/components/layout/navigation/sidebar-menu.ts` dengan ikon modern dari `@tabler/icons-react`.
  - **Migrasi Database & Sinkronisasi**:
    - Drizzle migration `0016_payroll_pos_marketplace_crm.sql` berhasil diterapkan ke database PostgreSQL Neon.
- File/skema berubah:
  - `src/db/schema/keuangan/hr-payroll.ts` (baru)
  - `src/db/schema/keuangan/pos.ts` (baru)
  - `src/db/schema/keuangan/marketplace.ts` (baru)
  - `src/db/schema/keuangan/crm.ts` (baru)
  - `src/db/schema/keuangan/index.ts`
  - `src/db/schema/keuangan/konstanta.ts`
  - `src/db/migrations/0016_payroll_pos_marketplace_crm.sql` (baru)
  - `src/db/migrations/meta/_journal.json`
  - `src/server/modules/keuangan/payroll/` (model.ts, service.ts, index.ts)
  - `src/server/modules/keuangan/pos/` (model.ts, service.ts, index.ts)
  - `src/server/modules/keuangan/marketplace/` (model.ts, service.ts, index.ts)
  - `src/server/modules/keuangan/crm/` (model.ts, service.ts, index.ts)
  - `src/server/modules/keuangan/index.ts`
  - `src/components/layout/sidebar/routes.ts`
  - `src/components/layout/navigation/sidebar-menu.ts`
  - `src/app/(dashboard)/payroll/`
  - `src/app/(dashboard)/pos/`
  - `src/app/(dashboard)/integrasi/marketplace/`
  - `src/app/(dashboard)/crm/`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: `0016_payroll_pos_marketplace_crm.sql` (berhasil diterapkan via `drizzle-kit migrate`)
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error (14 warnings kompatibilitas React Hook Form non-breaking)
  - `bun run build`: Berhasil 100% mengompilasi 27 rute Next.js 16 (Turbopack) dengan Partial Prerendering
- Belum selesai / langkah berikutnya: Melanjutkan ke Milestone F2 (Kas & Bank, Biaya Operasional, dan Buku Besar / General Ledger).

## 2026-11-15 — S-060 — Penyelesaian Penuh Milestone F1: Halaman Profil Perusahaan & Kunci Transaksi
- Milestone: F1 (Master Data & Fondasi Bisnis — 100% Selesai)
- Dikerjakan:
  - **Pembangunan Halaman Profil Perusahaan & Multi-Entitas (`/pengaturan/perusahaan`)**:
    - Membangun antarmuka terpadu pengelolaan identitas badan hukum bisnis dan struktur grup holding:
      - **Tab 1 (Profil Perusahaan Utama)**: Form kartu enterprise untuk nama legal, NPWP 16-digit, telepon kantor, email faktur, domisili legal operasional, mata uang dasar, dan URL logo cetak faktur komersial (dengan preview instan).
      - **Tab 2 (Multi-Entitas & Holding)**: DataGrid tabel seluruh entitas/anak perusahaan dengan fitur search debounce, filter status aktif, dan pagination.
      - **Modal Dialog Entitas Baru & Ubah Profil**: Form modal lengkap dengan validasi Zod + React Hook Form, integrasi switch holding group, pemetaan perusahaan induk, dan mutasi Eden Treaty.
      - **KPI Stats Strip (4 Kartu)**: Holding/Utama, Total Entitas, Entitas Aktif, dan Mata Uang Pembukuan.
  - **Pembangunan Halaman Kunci Transaksi (`/pengaturan/kunci-transaksi`)**:
    - Mengimplementasikan antarmuka kontrol internal kepatuhan audit PSAK untuk mencegah manipulasi dan entri tanggal mundur (*backdating*):
      - **Batas Kunci Semua Transaksi (Lock All)**: Penguncian mutlak yang mengunci seluruh pembuatan, pengubahan, atau penghapusan transaksi bagi seluruh pengguna termasuk Administrator.
      - **Batas Kunci Pengguna Non-Admin**: Penguncian bagi staf dan operator biasa, memberi hak kelola hanya bagi Administrator Keuangan.
      - **Pintasan Tanggal Cepat**: Tombol *Akhir Bulan Lalu* dan *Akhir Tahun Buku Lalu* untuk kemudahan operasional saat Tutup Buku.
      - **Audit Trail & Catatan Penguncian**: Catatan alasan penguncian buku untuk dokumentasi audit eksternal.
      - **Kartu Edukasi & Integritas PSAK**: Ringkasan dampak modul (AR, AP, Kas & Bank, Jurnal, Biaya, Aset) dan instruksi penggunaan jurnal balik/penyesuaian.
      - **KPI Stats Strip**: Status Pembukuan (Terkunci/Parsial/Terbuka), Tanggal Kunci Semua, Tanggal Kunci Non-Admin, dan Proteksi PSAK.
  - **Penyelesaian Milestone F1**:
    - Seluruh item Master Data & Fondasi Bisnis pada Roadmap F1 kini resmi bertatus `done` 100%.
- File/skema berubah:
  - `src/app/(dashboard)/pengaturan/perusahaan/page.tsx`
  - `src/app/(dashboard)/pengaturan/perusahaan/_components/perusahaan-client-view.tsx`
  - `src/app/(dashboard)/pengaturan/perusahaan/_components/perusahaan-form-dialog.tsx`
  - `src/app/(dashboard)/pengaturan/perusahaan/_lib/types.ts`
  - `src/app/(dashboard)/pengaturan/perusahaan/_lib/schema.ts`
  - `src/app/(dashboard)/pengaturan/kunci-transaksi/page.tsx`
  - `src/app/(dashboard)/pengaturan/kunci-transaksi/_components/kunci-transaksi-client-view.tsx`
  - `src/app/(dashboard)/pengaturan/kunci-transaksi/_lib/types.ts`
  - `src/app/(dashboard)/pengaturan/kunci-transaksi/_lib/schema.ts`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada (mengonsumsi skema Drizzle & endpoint Elysia `companies` dan `transaction_locks` yang sudah ada)
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error (14 warnings bawaan non-breaking)
  - `bun run build`: Berhasil 100% mengompilasi 21 rute Next.js 16 (Turbopack) dengan Partial Prerendering
- Belum selesai / langkah berikutnya: Melanjutkan ke Milestone F2 (Kas & Bank, Biaya Operasional, dan Buku Besar / General Ledger).

## 2026-11-15 — S-059 — Integrasi Navigasi & Penyelarasan Layout Enterprise Halaman Mata Uang & Kurs Valas
- Milestone: F1 (Master Data & Multi-Currency UI Pattern Consistency)
- Dikerjakan:
  - **Integrasi Navigasi Komprehensif Mata Uang**:
    - Memastikan rute `/pengaturan/mata-uang` terdaftar di menu sidebar `sidebar-menu.ts` (`id: "set-currencies"`, label: `"Mata Uang & Kurs"`) tepat di bawah Profil Perusahaan.
    - Menambahkan modul Mata Uang ke daftar `POPULAR_MODULES` di Command Palette (`search.tsx`) agar pengguna dapat langsung menemukannya via pencarian cepat (Ctrl+K).
    - Mendaftarkan pintasan `"Mata uang & kurs valas"` ke `MEGA_MENU_QUICK_LINKS` di menu dropdown header `Aplikasi` (`mega-menu.ts`).
  - **Penyelarasan Antarmuka & Pola Layout Enterprise (`mata-uang-client-view.tsx`)**:
    - **Menghilangkan Hero Header Redundan**: Menghapus blok `<h1>` dan deskripsi yang memakan ruang vertikal; konsisten dengan halaman Tag dan Penomoran di mana judul halaman diakomodasi rapi oleh Breadcrumbs SubHeader.
    - **Standardisasi KPI Stats Strip (4 Kartu)**:
      - Menggunakan pola enterprise `flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs` dengan kontainer ikon beraksen warna (`size-10 rounded-lg`).
      - Menampilkan metrik: *Mata Uang Dasar* (primary), *Total Mata Uang* (blue), *Valas Aktif* (emerald), dan *Catatan Kurs* (purple).
    - **Penyelarasan Frame & FrameHeader**:
      - Memindahkan tombol aksi utama (*Tambah Mata Uang* & *Entri Kurs Baru*) masuk ke dalam `FrameHeader` sejajar dengan bilah pencarian dan filter dropdown.
      - Menambahkan filter status valas (*Semua Status*, *Aktif*, *Nonaktif*) pada Tab 1 (Daftar Mata Uang).
      - Menyelaraskan filter dropdown mata uang dan pencarian pada Tab 2 (Kurs Valas).
    - **Standardisasi Kolom Aksi DataGrid**:
      - Mengganti tombol aksi edit teks biasa dengan menu dropdown seragam (`DropdownMenu` + `IconDots` size 4 + `DropdownMenuItem`) yang konsisten dengan Bagan Akun, Tag, dan Katalog Produk.
    - **Konfigurasi DataGrid & Frame**:
      - Menambahkan properti `tableLayout={{ width: "auto", columnsPinnable: true, columnsResizable: false, columnsMovable: true, columnsVisibility: true }}` dan `Frame className="w-full" stacked dense`.
      - Menstandarkan ukuran paginasi: `[10, 20, 50, 100]`.
- File/skema berubah:
  - `src/app/(dashboard)/pengaturan/mata-uang/_components/mata-uang-client-view.tsx`
  - `src/components/layout/header/search.tsx`
  - `src/components/layout/navigation/mega-menu.ts`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error (14 warnings bawaan non-breaking)
  - `bun run build`: Berhasil 100% mengompilasi 19 rute Next.js 16 (Turbopack) dengan PPR
- Belum selesai / langkah berikutnya: Melanjutkan pembangunan modul Kas & Bank (F2) atau siklus Pembelian/Penjualan (F3).

## 2026-11-15 — S-058 — Resolusi Zero-Flicker Logo Sidebar, Floating Gap Presisi & Penyelarasan Identitas SurabieDev
- Milestone: F0 (Penyempurnaan Animasi Shell & Konsistensi Identitas Produk)
- Dikerjakan:
  - **Resolusi Bug Kedipan Icon Logo Saat Sidebar Diciutkan (`sidebar.tsx`)**:
    - Menganalisis penyebab kedipan: mode `mode="wait"` pada `<AnimatePresence>` menyebabkan elemen logo lama unmount total sebelum logo baru me-mount, mengakibatkan jeda kosong (flicker) selama ~180ms.
    - Mengubah struktur logo panel menjadi komponen tunggal permanen:
      - Ikon logo `/images/logos/logo.png` tetap terpasang permanen di DOM (`shrink-0 size-9`) tanpa pernah unmount.
      - Teks wordmark Surabie.Dev dianimasikan lebar dan opasitasnya secara halus (`width: 0 -> auto, opacity: 0 -> 1`) menggunakan Motion.
      - Kontainer transisi padding dari `px-4 sm:px-5` ke `px-0` (center) via CSS `transition-[padding] duration-300 ease-in-out`.
      - Hasilnya, transisi buka/tutup sidebar kini 100% mulus, tanpa kedipan (*zero-flicker & buttery smooth*).
  - **Penyempurnaan Margin & Sudut Floating Profile Sheet (`profile.tsx`)**:
    - Mempersempit floating margin sheet dari `14px-16px` menjadi `6px-8px` (`inset-y-1.5 right-1.5 sm:inset-y-2 sm:right-2`) agar ruang kosong tidak berlebihan dan lebih efisien.
    - Mempertajam radius sudut panel sheet dari `rounded-2xl` (16px) menjadi `rounded-xl` (12px) dengan border keliling `border border-border/80 shadow-2xl`, menghasilkan tampilan sharp, modern, dan presisi.
  - **Koreksi Identitas Aplikasi pada Profile Sheet (`profile.tsx`)**:
    - Menghilangkan referensi template lama ("Periode Baca Meter") dan menyelaraskannya dengan identitas produk:
      - Teks label kartu bawah: **`LAPORAN KEUANGAN SURABIEDEV`**
      - Teks aksi utama: **`Tutup Buku November 2026`** (dengan bulan digarisbawahi)
      - Entitas akun holding: *SurabieDev Financial Holdings*, *SurabieDev Retail*, dan *SurabieDev Solusi Digital*.
      - Email default: `admin@surabiedev.com`.
- File/skema berubah:
  - `src/components/layout/sidebar/sidebar.tsx`
  - `src/components/layout/header/profile.tsx`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% mengompilasi 19 rute Next.js 16 (Turbopack)
- Belum selesai / langkah berikutnya: Melanjutkan pembangunan modul Kas & Bank (F2) atau siklus Pembelian/Penjualan (F3).

## 2026-11-15 — S-057 — Penyederhanaan Menu Header Ghost/Palette & Estetika Floating Profile Sheet
- Milestone: F0 (Penyempurnaan Navigasi Header & Visual Floating Profile)
- Dikerjakan:
  - **Penyederhanaan Menu Header Menjadi Ghost/Palette Buttons**:
    - Di `src/components/layout/header/header.tsx` dan `src/components/layout/header/mega-menu.tsx`:
      - Menghapus pembungkus segmented tab (`menutab`) yang tebal, menggantikannya dengan susunan tombol navigasi independen yang clean (`gap-1`).
      - Setiap menu (*Aplikasi*, *Laporan*, *Kalender*, *Bantuan*) kini bergaya ghost/palette button dengan micro-typography `text-xs font-medium` dan transisi hover halus (`hover:bg-accent/60 hover:text-foreground`).
      - Menu aktif ditandai dengan aksen palet lembut `bg-primary/10 text-primary font-semibold` tanpa kotak border ganda, menciptakan kesan minimalis, mewah, dan tidak berlebihan.
  - **Floating Profile Sheet dengan Margin Keliling Halus**:
    - Di `src/components/layout/header/profile.tsx`:
      - Menambahkan ruang kosong (*floating margin*) di sisi atas, bawah, dan kanan saat sheet terbuka (`inset-y-3.5 right-3.5 sm:inset-y-4 sm:right-4`).
      - Seluruh sudut panel sheet dibuat melengkung anggun (`rounded-2xl`) dengan border tipis mengelilingi (`border border-border/80 shadow-2xl`).
      - Pada mobile (`w-[calc(100vw-1.75rem)]`) maupun desktop (`sm:w-[346px]`), panel kini tampak melayang secara modern (*floating drawer*) di atas latar overlay gelap, sangat mulus dan sedap dipandang.
- File/skema berubah:
  - `src/components/layout/header/header.tsx`
  - `src/components/layout/header/mega-menu.tsx`
  - `src/components/layout/header/profile.tsx`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% mengompilasi 19 rute Next.js 16 (Turbopack)
- Belum selesai / langkah berikutnya: Melanjutkan pembangunan modul Kas & Bank (F2) atau siklus Pembelian/Penjualan (F3).

## 2026-11-15 — S-056 — Desain Executive Profile Sheet, Eliminasi Logo Mobile, dan Elevasi Segmented Menu Bar Navbar
- Milestone: F0 (Penyempurnaan Navigasi Executive & Spesifikasi Profile Sheet)
- Dikerjakan:
  - **Implementasi Profile & Entity Sheet Sesuai `avatar-profile.md` (`src/components/layout/header/profile.tsx`)**:
    - Menggantikan dropdown profil lama dengan `<Sheet>` sliding dari sisi kanan (`side="right"`, lebar `w-full sm:max-w-[346px]`, padding horizontal `px-7` / 28px).
    - **Tombol Tutup**: Ikon X (`18px`) di pojok kiri atas (16px dari tepi) tanpa border.
    - **Header Profil Rata Tengah**: Avatar besar `96px` bulat dengan badge tombol edit pensil `28px` di pojok kanan bawah, nama pengguna, email terhubung session (`authClient`), serta badge status `Superadmin`.
    - **Baris Multi-Entitas Akun**: 4 lingkaran `40px` (gap 12px) terdiri dari 3 avatar akun (PT Elysia Niaga, PT Elysia Distribusi, PT Elysia Industri) dengan ring indikator entitas aktif + 1 tombol tambah entitas bergaris putus-putus.
    - **Pemisah Garis Putus-Putus**: Garis horizontal dashed tipis (`my-4 border-t border-dashed border-border/80`).
    - **Daftar Menu 2 Grup**:
      - Grup *Akun*: "Lihat Profil", "Pengguna" (ke `/pengaturan/pengguna-peran`), dan "Notifikasi" dengan badge angka `5`.
      - Grup *Aplikasi*: "Pengaturan" (ke `/pengaturan/perusahaan`), "Bantuan" (ke `/bantuan`), dan tombol "Keluar" berwarna merah (`text-destructive`) yang memicu proses logout Better-Auth.
    - **Kartu Bawah Gradien**: Kartu berukuran `h-[145px]` dengan gradien diagonal biru ke ungu (`from-[#2563eb] via-[#4f46e5] to-[#9333ea]`), lingkaran ikon putih transparan `44px` (`IconCalendarEvent`), teks label mono `PERIODE BACA METER`, dan teks utama `Closing November 2026` dengan bulan digarisbawahi, terhubung langsung ke modul Closing.
  - **Penyembunyian Logo pada Tampilan Mobile**:
    - Menghapus elemen logo mobile di `src/components/layout/header/header.tsx` sehingga tampilan header pada ponsel bersih, lapang, dan berfokus pada navigasi serta aksi utama.
  - **Modernisasi Segmented Bar Menu Header Desktop (Aplikasi, Laporan, Kalender, Bantuan)**:
    - Di `src/components/layout/header/header.tsx`: Membungkus navigasi dengan kontainer segmented modern (`rounded-xl border border-border/60 bg-muted/30 p-0.5 shadow-2xs`).
    - Menambahkan ikon outline presisi (`size={14}`, stroke 1.75) pada setiap menu (`IconLayoutGrid`, `IconFileReport`, `IconCalendar`, `IconHelpCircle`).
    - Mengatur ukuran seragam `h-8` dengan state aktif floating card (`bg-background text-foreground font-semibold shadow-2xs border border-border/70`) yang memberikan impresi mewah dan berwibawa khas dashboard enterprise papan atas.
- File/skema berubah:
  - `src/components/layout/header/profile.tsx`
  - `src/components/layout/header/header.tsx`
  - `src/components/layout/header/mega-menu.tsx`
  - `src/components/layout/navigation/header-links.ts`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% mengompilasi 19 rute Next.js 16 (Turbopack)
- Belum selesai / langkah berikutnya: Melanjutkan pembangunan modul Kas & Bank (F2) atau siklus Pembelian/Penjualan (F3).

## 2026-11-15 — S-055 — Estetika Seamless Sidebar & Responsivitas Mobile: Penghapusan Border Search Box, Sudut Sheet Asimetris, dan Optimasi Header Mobile
- Milestone: F0 (Penyempurnaan Tampilan Mobile & Estetika Seamless)
- Dikerjakan:
  - **Penghapusan Garis Border Atas & Bawah Search Box Sidebar**:
    - Di `src/components/layout/sidebar/sidebar.tsx`: Menghapus border pembatas `border-b border-border/40` pada kontainer logo dan kontainer search box, serta menghapus latar `bg-muted/15`.
    - Hasilnya, kotak pencarian kini melayang (*floating*) secara mulus (*smooth & seamless*) menyatu dengan latar belakang sidebar tanpa sekat garis horizontal yang kaku.
  - **Sudut Lengkung Asimetris Mobile Sheet Drawer**:
    - Di `src/components/layout/sidebar/sidebar.tsx` pada komponen `<SheetContent>`:
      - Menambahkan kelas `rounded-s-none rounded-e-2xl border-s-0 border-e border-border/80 overflow-hidden`.
      - Sisi kiri (tepi dalam yang menempel ke layar) menjadi rata murni (`0px`), sedangkan sisi kanan (ujung luar yang menghadap konten) memiliki sudut melengkung anggun (`16px / rounded-e-2xl`).
  - **Optimasi Tata Letak Header pada Layar Mobile**:
    - Menghilangkan padding statis berlebih `px-15` (60px) pada `src/components/layout/header/notifications.tsx` dan `ps-15` (60px) pada `src/components/layout/header/profile.tsx`.
    - Di `src/components/layout/header/header.tsx`: Mengelompokkan ikon aksi kanan (`ThemeToggle`, `Notifications`, `Profile`) dengan gap responsif `gap-0.5 sm:gap-1.5`, menyetel ukuran tombol `size-9 sm:size-10`, serta menetapkan padding kontainer `px-3 sm:px-6 lg:px-8`.
    - Di `src/components/layout/header/sub-header.tsx` dan `src/components/layout/app-shell.tsx`: Menstandarkan padding mobile menjadi `px-3` sehingga seluruh elemen header dan konten sejajar rapi, proporsional, dan bebas dari clipping pada seluruh perangkat ponsel.
- File/skema berubah:
  - `src/components/layout/sidebar/sidebar.tsx`
  - `src/components/layout/header/header.tsx`
  - `src/components/layout/header/notifications.tsx`
  - `src/components/layout/header/profile.tsx`
  - `src/components/layout/theme-toggle.tsx`
  - `src/components/layout/header/sub-header.tsx`
  - `src/components/layout/app-shell.tsx`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% mengompilasi 19 rute Next.js 16 (Turbopack)
- Belum selesai / langkah berikutnya: Melanjutkan pembangunan modul Kas & Bank (F2) atau siklus Pembelian/Penjualan (F3).

## 2026-11-15 — S-054 — Penyelarasan Grid Presisi Shell: Elevasi Search Box Sejajar Subheader, Garis Vertikal Konten Lurus Sempurna, dan Pembesaran Ikon Home Breadcrumb
- Milestone: F0 (Penyelarasan Tata Letak & Grid Enterprise Shell)
- Dikerjakan:
  - **Elevasi & Penjajaran Search Box Sejajar Subheader (`SidebarPanel`)**:
    - Menata ulang arsitektur layout sidebar menjadi sistem 3-tier presisi:
      - **Tier 1 (Header Brand / Logo)**: Diturunkan tingginya menjadi `h-14` (56px) dengan border bawah `border-b border-border/40`, persis sama tinggi dengan baris pertama Navbar (Header).
      - **Tier 2 (Search Box Row)**: Diposisikan di container `h-10` (40px) dengan `border-b border-border/40 bg-muted/15`, sejajar secara horizontal tepat dengan SubHeader Navbar (`h-10`, 40px). Search button dioptimasi menjadi `h-7.5` (expanded) dan `size-8` (collapsed) agar terpusat rapi.
      - **Tier 3 (Menu Navigasi)**: `SimpleBar` dengan tinggi dinamis `h-[calc(100dvh-6rem)]` (100dvh - 56px - 40px). Menghilangkan wrapper search dari `sidebar-nav.tsx` sehingga seluruh menu di bawahnya (mulai dari Dasbor) otomatis terangkat naik sejajar dengan konten utama.
  - **Penyelarasan Garis Start Konten Lurus Sempurna (Vertical Alignment Guide Line)**:
    - Menstandarkan horizontal container padding `px-4 sm:px-6 lg:px-8` secara seragam di seluruh elemen: Navbar Header, SubHeader, dan Konten Utama (`AppShell` / `<main>`).
    - Menyempurnakan posisi start ikon hamburger menu pada Navbar (`-ms-2 size-9 rounded-lg`) dan link ikon Home pada SubHeader (`-ms-1 size-7 rounded-md`):
      - Hasilnya, visual left edge dari ikon hamburger di atas, ikon Home di subheader, dan heading/konten utama di bawah berada di garis vertikal yang sama (sejajar lurus 100% pada mobile, tablet, maupun layar desktop besar).
  - **Pembesaran Ikon Home pada Breadcrumb Subheader**:
    - Memperbesar `IconHome` dari `size-3.5` (14px) menjadi `size-4.5` (18px, stroke 1.8) di `src/components/layout/header/sub-header.tsx`, memberikan kontras visual yang seimbang, tegas, dan berwibawa pada awal jejak navigasi.
  - **Perbaikan Tooltip Context (`TooltipProvider`)**:
    - Membungkus `SidebarPanel` di `src/components/layout/sidebar/sidebar.tsx` dan `AppShell` di `src/components/layout/app-shell.tsx` dengan `<TooltipProvider delayDuration={0}>` untuk memastikan `RailTooltip` pada mode collapsed search box dan seluruh elemen shell memiliki akses context tooltip secara global, mengeliminasi galat runtime `Tooltip must be used within TooltipProvider`.
- File/skema berubah:
  - `src/components/layout/app-shell.tsx`
  - `src/components/layout/sidebar/sidebar.tsx`
  - `src/components/layout/sidebar/sidebar.tsx`
  - `src/components/layout/sidebar/sidebar-nav.tsx`
  - `src/components/layout/header/search.tsx`
  - `src/components/layout/header/header.tsx`
  - `src/components/layout/header/sub-header.tsx`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% mengompilasi 19 rute Next.js 16 (Turbopack)
- Belum selesai / langkah berikutnya: Melanjutkan pembangunan modul Kas & Bank (F2) atau siklus Pembelian/Penjualan (F3).

## 2026-11-15 — S-053 — Penyempurnaan Shell & Navigasi: Proporsi Logo Sleek, Sidebar Search Box, Layout Subheader Rapi, dan Transisi Dot Sub-Menu Interaktif
- Milestone: F0 (Penyempurnaan Shell & Navigasi Enterprise)
- Dikerjakan:
  - **Proporsi Logo & Wordmark Compact (`FullLogo` & `Sidebar`)**:
    - Memperkecil dimensi icon logo menjadi 24x27 (collapsed/expanded) dan wordmark menjadi 120x16 di `src/components/layout/shared/logo/full-logo.tsx` dan `src/components/layout/sidebar/sidebar.tsx` agar tampilan header sidebar proporsional, hemat ruang vertikal, dan bergaya modern.
  - **Relokasi Search Box ke Sidebar Paling Atas (`Search` & `SidebarNav`)**:
    - Memindahkan komponen pencarian palet perintah (`Search`) dari navbar atas ke dalam sidebar di bawah panel logo dan tepat di atas menu Dasbor.
    - Menghapus elemen `<Search />` dari `src/components/layout/header/header.tsx`.
    - Di `src/components/layout/header/search.tsx`, menambahkan dukungan properti `collapsed?: boolean`:
      - Mode expanded: Tombol input pencarian penuh `h-9.5 w-full` dengan shortcut badge `Ctrl K`.
      - Mode collapsed: Icon button `size-11` dengan `RailTooltip` deskriptif.
  - **Refaktorisasi Subheader Navbar (`SubHeader`)**:
    - Di `src/components/layout/header/sub-header.tsx`:
      - Menghapus badge informasi PT (`PT Elysia Niaga Nusantara | IDR`) sesuai permintaan pengguna.
      - Memindahkan tombol Kembali (*Back Button*) ke pojok kanan subheader (`shrink-0 pl-3`) lengkap dengan teks responsif `Kembali` pada layar sm+.
      - Menjadikan Breadcrumb trail di sisi kiri mengalir murni, tidak terganggu oleh tombol kembali atau separator vertikal.
  - **Penyelarasan Tipografi Label Grup Sidebar**:
    - Menyesuaikan ukuran teks heading kategori di `src/components/layout/sidebar/sidebar-nav.tsx` dari `text-[13px]` menjadi `text-[11px] font-bold tracking-wider uppercase text-muted-foreground/80` dengan hairline divider tipis.
  - **Penghapusan Aksen Gelap pada Top-Level Item (Dasbor)**:
    - Di `src/components/layout/types/styles.ts`: Memperbarui `STATE_CLASS.active` menjadi `bg-primary/10 text-primary font-semibold` dan hover pill menjadi `bg-muted/60` (menggantikan `bg-sidebar-accent` yang terlalu kontras/gelap).
    - Mempertahankan styling aktif sub-item dengan aksen bawaan (`subLinkClass`) sesuai arahan pengguna.
  - **Efek Transisi Membesar pada Sub-Menu Dot**:
    - Di `src/components/layout/sidebar/sidebar-nav.tsx`: Menambahkan micro-animation berbasis Framer Motion (`scale: [0.5, 1.35, 1]`, durasi 0.35s) dengan layout spring animation dan aura luminous blur (`bg-primary/25 blur-[1px]`) pada dot aktif, serta efek `group-hover/sub:scale-125` pada dot idle sehingga memberikan efek fisik membesar saat menu diklik.
- File/skema berubah:
  - `src/components/layout/shared/logo/full-logo.tsx`
  - `src/components/layout/sidebar/sidebar.tsx`
  - `src/components/layout/sidebar/sidebar-nav.tsx`
  - `src/components/layout/header/header.tsx`
  - `src/components/layout/header/search.tsx`
  - `src/components/layout/header/sub-header.tsx`
  - `src/components/layout/types/styles.ts`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error (14 warnings pada data-grid reusable external)
  - `bun run build`: Berhasil 100% mengompilasi 19 rute Next.js 16 (Turbopack)
- Belum selesai / langkah berikutnya: Melanjutkan pembangunan modul Kas & Bank (F2) atau siklus Pembelian/Penjualan (F3).

## 2026-11-15 — S-052 — Modernisasi UI/UX Enterprise: Subheader Navbar (Breadcrumb & Back Button), Label Menu Tegas, dan Persistensi Cookie Sidebar Matang
- Milestone: F0 (Peningkatan Standar Shell & Navigasi Enterprise)
- Dikerjakan:
  - **Arsitektur Subheader Navbar Terintegrasi (`SubHeader`)**:
    - Dibuat di `src/components/layout/header/sub-header.tsx`: Baris kedua pada navbar dengan border pemisah halus `border-b border-border/60 bg-muted/20 backdrop-blur-md`.
    - **Menu Navigasi Kembali (*Back Button*)**: Tombol kembali enterprise bersih (`size-7 rounded-md border border-border/80 bg-background`) dengan interaksi hover halus, tooltip deskriptif, dan proteksi disabled cerdas saat pengguna berada di root dasbor (`/dashboard`).
    - **Breadcrumb Resolver Dinamis**: Modul pemecah path otomatis di `src/components/layout/shared/breadcrumb/breadcrumb-resolver.ts` yang membaca `SIDEBAR_MENU` secara hierarkis, menyajikan breadcrumb dengan ikon Home, separator chevron halus (`IconChevronRight`), tautan interaktif pada level induk, dan teks tebal pada halaman aktif.
    - **Indikator Live Workspace**: Menampilkan identitas perusahaan (`PT Elysia Niaga Nusantara`), ikon status toko, dan kode valas dasar (`IDR`) dengan dot hijau berdenyut (*pulse*) di sisi kanan subheader.
  - **Peningkatan Tipografi Label Kategori Menu**:
    - Memperbaiki hierarki teks pada `src/components/layout/sidebar/sidebar-nav.tsx`: Label heading kategori (misal "TRANSAKSI", "OPERASIONAL & PERSEDIAAN", "AKUNTANSI & PAJAK", "PENGATURAN") ditingkatkan ukurannya menjadi `text-[13px] font-bold uppercase tracking-wider text-foreground/85` disertai garis pemisah horizontal tipis (`h-px flex-1 ml-3 bg-border/40`). Hal ini membuat judul kategori tampak lebih besar, tegas, dan berwibawa dibanding item menunya.
  - **Penyederhanaan Penamaan Menu yang Ringkas & Fungsional**:
    - Mengeliminasi kata redundan pada `src/components/layout/navigation/sidebar-menu.ts`:
      - "Data Pelanggan" → "Pelanggan", "Data Pemasok" → "Pemasok"
      - "Katalog Produk & Stok" → "Katalog Produk", "Satuan Pengukuran (UOM)" → "Satuan Ukur"
      - "Daftar Multi-Gudang" → "Lokasi Gudang", "Penyesuaian & Opname" → "Stok Opname"
      - "Bagan Akun (COA)" → "Bagan Akun", "Jurnal Penyesuaian" → "Jurnal Umum"
      - "Dimensi Biaya (Cost Center)" → "Dimensi Biaya", "Tutup Buku Periode" → "Tutup Buku"
      - "Faktur Pajak (PPN)" → "Faktur Pajak", "Rekapitulasi SPT Masa" → "Rekap SPT Masa"
      - "Laporan Finansial Inti" → "Laporan Keuangan", "Pengguna & Peran (RBAC)" → "Pengguna & Peran"
  - **Persistensi Cookie Sidebar Matang (Zero Layout Shift / CLS = 0)**:
    - Menambahkan konstanta `SIDEBAR_OPEN_GROUPS_COOKIE` (`app-sidebar-open-groups`) dan `SIDEBAR_OPEN_GROUPS_STORAGE` di `src/components/layout/types/constants.ts`.
    - Memperbarui `src/components/layout/sidebar/sidebar-provider.tsx` dan `src/app/(dashboard)/layout.tsx`:
      - Server Components membaca cookie `app-sidebar-open-groups` dan `app-sidebar-collapsed` pada saat render awal (SSR).
      - Menghindari flicker atau delay saat membuka/menutup accordion grup menu.
      - Menghapus synchronous `setState` dalam `useEffect` agar 100% kompatibel dengan aturan React 19 (`activeGroupId` diturunkan secara murni via `useMemo`).
      - Menyimpan preferensi buka/tutup grup menu ke cookie berumur 1 tahun dengan atribut `SameSite=Lax; Path=/`.
- File/skema berubah:
  - `src/components/layout/types/constants.ts`
  - `src/components/layout/navigation/sidebar-menu.ts`
  - `src/components/layout/sidebar/sidebar-provider.tsx`
  - `src/components/layout/sidebar/sidebar-nav.tsx`
  - `src/components/layout/shared/breadcrumb/breadcrumb-resolver.ts` (baru)
  - `src/components/layout/header/sub-header.tsx` (baru)
  - `src/components/layout/header/header.tsx`
  - `src/components/layout/app-shell.tsx`
  - `src/app/(dashboard)/layout.tsx`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% mengompilasi 19 rute App Router Next.js 16 (Turbopack)
- Belum selesai / langkah berikutnya: Melanjutkan pembangunan modul Kas & Bank (F2) atau siklus Pembelian/Penjualan (F3).

## 2026-11-15 — S-051 — Implementasi Antarmuka Manajemen Multi-Currency, Kurs Valas Historis, dan Integrasi ke Seluruh Master Data (COA, Kontak, Produk)
- Milestone: F1 (Multi-Currency & Exchange Rate Management)
- Dikerjakan:
  - **Audit Multi-Currency Backend vs Frontend**:
    - Backend: Skema tabel (`currencies`, `exchange_rates`, `revaluations`, `journal_entries.kurs`, `sales_invoices.kurs`, `purchase_invoices.kurs`, `payment_allocations.selisih_kurs`) dan endpoint API (`/api/keuangan/mata-uang`, `/api/keuangan/kurs`, `/api/keuangan/revaluasi-kurs`) sudah lengkap dan mendukung perhitungan laba/rugi selisih kurs (*realized/unrealized forex*).
    - Database Seed: Menambahkan benchmark nilai tukar awal (`KURS_BENCHMARK_AWAL` untuk USD, EUR, SGD, JPY, CNY, MYR, AUD per 2026-01-01) pada `src/db/seed/system/currencies.ts` agar transaksi valuta asing tidak gagal karena ketiadaan kurs berlaku.
    - COA Backend Service: Memperbarui `daftarAkun` di `src/server/modules/keuangan/akun/service.ts` dengan LEFT JOIN ke tabel `currencies` untuk menyertakan `kodeMataUang` dan `simbolMataUang`.
  - **Komponen Universal Pemilih Mata Uang (`MataUangSelect`)**:
    - Dibuat di `src/components/form/mata-uang-select.tsx`: Popover combobox dengan pencarian nama/kode valas, badge penanda mata uang dasar, pembersihan pilihan (*allowClear*), dan auto-fetch reaktif aman React 19.
    - Diekspor melalui `src/components/form/index.ts`.
  - **Integrasi Master Data Frontend**:
    - **Bagan Akun / COA (`/akuntansi/bagan-akun`)**:
      - Menambahkan field `mataUangId` pada `akunFormSchema` dan `AkunItem`.
      - Menambahkan pemilih mata uang di modal formulir akun `coa-form-dialog.tsx` untuk mengunci akun kas/bank atau piutang/hutang ke valas tertentu.
      - Menampilkan badge kode valas (misal `USD`) di samping nama akun pada tabel hierarki `coa-tree-table.tsx`.
    - **Kontak Bisnis Pelanggan & Pemasok (`/kontak/pelanggan` & `/kontak/pemasok`)**:
      - Menambahkan `mataUangId` pada `kontakFormSchema` dan menyertakannya di payload `POST`/`PATCH`.
      - Menambahkan kontrol `Mata Uang Transaksi Default` di Tab Ketentuan & Alamat pada `kontak-form-dialog.tsx` sehingga faktur otomatis menggunakan valas kontak tersebut.
    - **Katalog Produk (`/persediaan/produk`)**:
      - Menambahkan `mataUangId` pada `produkFormSchema` dan `ItemProduk`.
      - Menambahkan pemilih mata uang di Tab Harga & Manajemen Stok pada `produk-form-dialog.tsx` serta mendukung penyimpanan ke backend `item.post` / `item.patch`.
  - **Halaman Manajemen Mata Uang & Kurs Valas (`/pengaturan/mata-uang`)**:
    - Menghapus scaffold folder tidak baku `src/app/(dashboard)/pengaturan/mata_uang` (underscore).
    - Menambahkan rute navigasi `ROUTES.settings.currencies = "/pengaturan/mata-uang"` dan mendaftarkannya di `sidebar-menu.ts` ("Mata Uang & Kurs").
    - Membuat Server Component `page.tsx` yang mengambil data awal mata uang dan kurs secara in-process via `apiServer`.
    - Membuat Client Component `mata-uang-client-view.tsx` dengan:
      - 4 Kartu KPI Ringkasan: Mata Uang Dasar (IDR), Total Mata Uang, Valas Aktif, dan Total Catatan Kurs.
      - 2 Tab Terintegrasi: Tab 1 "Daftar Mata Uang" & Tab 2 "Kurs Valas Historis".
      - Frame DataGrid tabel interaktif dengan sorting kolom, debounce pencarian, dan paginasi.
      - Modal `MataUangFormDialog` untuk membuat mata uang ISO baru atau memperbarui status/desimal.
      - Modal `KursFormDialog` untuk mencatat kurs historis harian per valuta asing dengan tanggal berlaku dan sumber referensi (Bank Indonesia JISDOR, kurs transaksi, dll.).
- File/skema berubah:
  - `src/db/seed/system/currencies.ts`
  - `src/server/modules/keuangan/akun/service.ts`
  - `src/components/layout/sidebar/routes.ts`
  - `src/components/layout/navigation/sidebar-menu.ts`
  - `src/components/form/mata-uang-select.tsx` (baru)
  - `src/components/form/index.ts`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_lib/schema.ts`, `types.ts`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-form-dialog.tsx`, `coa-tree-table.tsx`
  - `src/app/(dashboard)/kontak/_lib/schema.ts`
  - `src/app/(dashboard)/kontak/_components/kontak-form-dialog.tsx`
  - `src/app/(dashboard)/persediaan/produk/_lib/schema.ts`, `types.ts`
  - `src/app/(dashboard)/persediaan/produk/_components/produk-form-dialog.tsx`
  - `src/app/(dashboard)/pengaturan/mata-uang/page.tsx` (baru)
  - `src/app/(dashboard)/pengaturan/mata-uang/_lib/types.ts` (baru), `schema.ts` (baru)
  - `src/app/(dashboard)/pengaturan/mata-uang/_components/mata-uang-client-view.tsx` (baru)
  - `src/app/(dashboard)/pengaturan/mata-uang/_components/mata-uang-form-dialog.tsx` (baru)
  - `src/app/(dashboard)/pengaturan/mata-uang/_components/kurs-form-dialog.tsx` (baru)
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada (skema tabel `currencies` dan `exchange_rates` sudah ada sejak migrasi awal)
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% mengompilasi 19 rute App Router Next.js 16 (Turbopack)
- Belum selesai / langkah berikutnya: Integrasi pemilih kurs langsung pada voucher Jurnal Umum dan Faktur Pembelian/Penjualan (Tier F2/F3).

## 2026-11-15 — S-050 — Integrasi Sistem Tag Multi-Warna Universal (Polymorphic Entity Tagging) ke Backend & Frontend Kontak, Produk, dan Kategori
- Milestone: F1 (Sistem Tag Universal Kledo-Style & Filter DataGrid Multi-Entitas)
- Dikerjakan:
  - **Resolusi Linter React 19 `fetchTags()` di `TagMultiSelect`**:
    - Mengeliminasi panggilan `setIsLoading(true)` sinkron di body `useEffect` pada `src/components/form/tag-multi-select.tsx` yang memicu error `react-hooks/set-state-in-effect`. Data fetching inisial dipisah ke async loader terisolasi dengan cleanup flag `ignore = true`, dan `fetchTags` tetap tersedia untuk refresh reaktif setelah Quick Create dialog selesai.
    - Menambahkan parameter query `{ limit: 100 }` saat mengambil daftar tag.
    - Menghapus unused import `EntityTag` dan memperbaiki signature `simpanEntityTags(tx: DbExecutor | undefined, ...)` di `src/server/modules/keuangan/dimensi/service.ts` agar kompatibel dengan instance `db` maupun transaksi `tx` tanpa `any`.
  - **Skema DB & Migrasi Polymorphic Tagging (`entity_tags`)**:
    - Menambahkan tabel relasi banyak-ke-banyak `entity_tags` di `src/db/schema/keuangan/dimensi.ts` (`tag_id`, `entity_type: 'KONTAK' | 'PRODUK' | 'KATEGORI' | 'TRANSAKSI' | 'JURNAL'`, `entity_id: uuid`, serta constraint unik kombinasi).
    - Menerapkan file migrasi SQL `src/db/migrations/0015_polymorphic_entity_tags.sql` dan mendaftarkannya di `meta/_journal.json`. Sukses dieksekusi via `bun run db:migrate`.
  - **Universal Backend Helper Service**:
    - Menambahkan fungsi `simpanEntityTags`, `ambilEntityTags`, dan `ambilPetaEntityTags` (batch SQL JOIN lookup anti N+1 query) di `src/server/modules/keuangan/dimensi/service.ts`.
  - **Integrasi Backend Kontak & Inventori**:
    - Modul Kontak: Mendukung input `tagIds` pada pembuatan/pembaruan kontak, menyematkan array `tags` pada respons query, dan mendukung filter `tagId`.
    - Modul Inventori (Item Produk & Kategori): Mendukung `tagIds` pada pembuatan/pembaruan item dan kategori, menyematkan array `tags` pada respons daftar item dan kategori.
  - **Komponen Frontend Reusable `TagMultiSelect`**:
    - Dibuat di `src/components/form/tag-multi-select.tsx`: Popover multi-select dengan dot warna asli, pill badge interaktif dengan tombol hapus, pencarian real-time, dan tombol `+ Buat Tag Baru...` (Quick Create via `TagFormDialog`).
  - **Integrasi Formulir & DataGrid Frontend**:
    - **Kontak (`/kontak/pelanggan` & `/kontak/pemasok`)**: Menambahkan pemilih tag di modal form kontak, menampilkan kolom Tag (pill badge warna hex) di tabel DataGrid, serta menambahkan filter dropdown Tag di toolbar FrameHeader.
    - **Produk (`/persediaan/produk`)**: Menambahkan pemilih tag di tab Informasi Umum modal produk, menampilkan kolom Tag di tabel DataGrid, serta menambahkan filter dropdown Tag di toolbar FrameHeader.
    - **Kategori Produk (`/persediaan/kategori`)**: Menambahkan pemilih tag di modal kategori, menampilkan kolom Tag di tabel DataGrid, serta menambahkan filter dropdown Tag di toolbar FrameHeader.
- File/skema berubah:
  - `src/db/schema/keuangan/dimensi.ts`
  - `src/db/migrations/0015_polymorphic_entity_tags.sql`
  - `src/db/migrations/meta/_journal.json`
  - `src/server/modules/keuangan/dimensi/service.ts`
  - `src/server/modules/keuangan/kontak/model.ts`, `service.ts`, `index.ts`
  - `src/server/modules/keuangan/inventori/model.ts`, `service.ts`, `index.ts`
  - `src/components/form/tag-multi-select.tsx` (baru)
  - `src/app/(dashboard)/kontak/_lib/schema.ts`, `types.ts`
  - `src/app/(dashboard)/kontak/_components/kontak-form-dialog.tsx`, `kontak-client-view.tsx`
  - `src/app/(dashboard)/persediaan/produk/_lib/schema.ts`, `types.ts`
  - `src/app/(dashboard)/persediaan/produk/_components/produk-form-dialog.tsx`, `produk-client-view.tsx`, `page.tsx`
  - `src/app/(dashboard)/persediaan/kategori/_lib/types.ts`
  - `src/app/(dashboard)/persediaan/kategori/_components/kategori-form-dialog.tsx`, `kategori-client-view.tsx`, `page.tsx`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: `0015_polymorphic_entity_tags.sql`
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run build`: Berhasil 100% mengompilasi seluruh 18 rute App Router Next.js 16 (Turbopack)
- Belum selesai / langkah berikutnya: Diskusi kelanjutan tag analitis pada siklus transaksi (Kas/Bank, Faktur Pembelian/Penjualan, dan Jurnal Umum).

## 2026-11-15 — S-049 — Implementasi Endpoint Read-Only Preview Penomoran Otomatis dan Auto-Fill Kode pada Formulir Master Data
- Milestone: F1 (Engine Penomoran Otomatis & UX Formulir Enterprise)
- Dikerjakan:
  - **Backend Read-Only Preview Penomoran Otomatis**:
    - Menambahkan fungsi `ambilNomorBerikutnyaPreview(prefiks, tahun)` di `src/server/modules/keuangan/penomoran/service.ts` yang mengintip nilai counter berikutnya (`nilaiTerakhir + 1`) tanpa menaikkan urutan di database sehingga nomor tidak terbuang jika form dibatalkan.
    - Menambahkan skema `skemaQueryNomorBerikutnya` di `src/server/modules/keuangan/penomoran/model.ts`.
    - Mendaftarkan rute `GET /api/keuangan/penomoran/berikutnya` di `src/server/modules/keuangan/penomoran/index.ts`.
  - **Helper Frontend**:
    - Membuat utilitas `ambilPratinjauNomor(prefiks: string)` di `src/lib/penomoran.ts` untuk pemanggilan API Eden Treaty secara reaktif dan aman.
  - **Integrasi Auto-Fill pada Formulir Master Data**:
    - **Kontak (Pelanggan & Pemasok)**: Otomatis mengisi field `kode` dengan `CUST/2026/00001` atau `SUPP/2026/00001` saat modal Tambah Kontak dibuka, dilengkapi badge visual `Auto` dan pesan petunjuk bahwa pengguna bebas mengubahnya manual.
    - **Produk (SKU Item)**: Otomatis mengisi field `sku` dengan `PRD/2026/00001` saat modal Tambah Produk dibuka.
    - **Kategori Produk**: Otomatis mengisi field `kode` dengan `CAT/2026/00001` baik pada modal utama kategori maupun modal Quick Create.
    - **Gudang**: Otomatis mengisi field `kode` dengan `GDG/2026/00001` pada modal Tambah Gudang.
- File/skema berubah:
  - `src/server/modules/keuangan/penomoran/model.ts`
  - `src/server/modules/keuangan/penomoran/service.ts`
  - `src/server/modules/keuangan/penomoran/index.ts`
  - `src/lib/penomoran.ts` (baru)
  - `src/app/(dashboard)/kontak/_components/kontak-form-dialog.tsx`
  - `src/app/(dashboard)/persediaan/produk/_components/produk-form-dialog.tsx`
  - `src/app/(dashboard)/persediaan/produk/_components/kategori-quick-create-dialog.tsx`
  - `src/app/(dashboard)/persediaan/kategori/_components/kategori-form-dialog.tsx`
  - `src/app/(dashboard)/persediaan/gudang/_components/gudang-form-dialog.tsx`
- Migrasi: tidak ada
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% mengompilasi seluruh 18 rute App Router Next.js 16 (Turbopack)
- Belum selesai / langkah berikutnya: Diskusi & implementasi penerapan tag analitis multi-warna pada modul-modul transaksi (Jurnal, Biaya, Invoice, PO, SO).

## 2026-11-15 — S-048 — Resolusi Runtime Error Halaman Tag dan Penyeragaman Sempurna Struktur & Warna Tabel
- Milestone: F1 (Stabilitas Tag Transaksi & Standarisasi UI Frame DataGrid Enterprise)
- Dikerjakan:
  - **Resolusi Bug Runtime Halaman Tag Transaksi (`/pengaturan/tag`)**:
    - Akar Masalah: Endpoint API `apiServer.keuangan.dimensi.tag.get` mengembalikan objek terpaginasi `{ items: Tag[], total: number, ... }`, sedangkan `page.tsx` sebelumnya mengasumsikan respons berupa array langsung `(res.data?.data as ItemTag[])`. Akibatnya, pemanggilan `initialData.filter(...)` di `tag-client-view.tsx` memicu runtime error `filter is not a function`.
    - Solusi: Melakukan normalisasi dan pemetaan data di `page.tsx` untuk mengekstrak array `items` secara aman dan mengonversi properti tanggal ke string, serta menghitung `stats` (total, aktif, nonaktif) secara reaktif.
  - **Penyeragaman Warna dan Struktur Tabel 100% Identik dengan COA, Kontak, dan Katalog**:
    - Menghilangkan wrapper padding dobel `p-4 sm:p-6` di `page.tsx` pada `/pengaturan/tag`, `/persediaan/kategori`, `/persediaan/satuan`, dan `/pengaturan/penomoran` (menggantinya dengan layout seragam `<div className="flex w-full min-w-0 flex-col gap-6">` karena kontainer padding utama sudah disediakan oleh `AppShell`).
    - Membungkus `DataGridTable` di dalam `<FramePanel className="p-0 shadow-none">` dan `<DataGridScrollArea className="w-full">` sehingga warna latar belakang, pemisah border antar panel, dan sudut rounded-nya identik dengan Bagan Akun (COA), Kontak, dan Katalog Produk.
    - Menambahkan `<FrameFooter className="py-1.5 pr-2 pl-2.5">` untuk membungkus `<DataGridPagination sizes={[10, 20, 50, 100]} />`.
    - Menyeragamkan status badge menggunakan `<Badge variant="success-light" size="sm">` dan `<Badge variant="destructive-light" size="sm">` dari `@/components/reui/badge`.
    - Menyeragamkan kolom Aksi menggunakan `<DropdownMenu>` dengan ikon `<IconDots className="size-4" />` untuk Ubah dan Hapus (lengkap dengan warna teks destructive).
    - Menyeragamkan tombol Tambah ke standar `<ToggleGroup type="single" variant="outline" size="sm" className="h-8 shadow-xs">`.
    - Menambahkan Strip KPI 3 kartu metrik ringkas di bagian atas halaman Tag.
- File/skema berubah:
  - `src/app/(dashboard)/pengaturan/tag/page.tsx`
  - `src/app/(dashboard)/pengaturan/tag/_lib/types.ts`
  - `src/app/(dashboard)/pengaturan/tag/_components/tag-client-view.tsx`
  - `src/app/(dashboard)/persediaan/kategori/page.tsx`
  - `src/app/(dashboard)/persediaan/kategori/_components/kategori-client-view.tsx`
  - `src/app/(dashboard)/persediaan/satuan/page.tsx`
  - `src/app/(dashboard)/persediaan/satuan/_components/satuan-client-view.tsx`
  - `src/app/(dashboard)/pengaturan/penomoran/page.tsx`
  - `src/app/(dashboard)/pengaturan/penomoran/_components/penomoran-client-view.tsx`
- Migrasi: tidak ada
- Verifikasi:
  - `bun run typecheck`: 0 error
  - `bun run lint`: 0 error
  - `bun run build`: Berhasil 100% mengompilasi seluruh 18 rute App Router Next.js 16 (Turbopack)
- Belum selesai / langkah berikutnya: Diskusi & implementasi penomoran otomatis transaksi dan penerapan tag pada modul berikutnya sesuai arahan user.

## 2026-11-15 — S-047 — Master Satuan Pengukuran (UOM), Pola Quick Create Terintegrasi di Select Dropdown, dan Penyeragaman Seluruh Tabel Dashboard
- Milestone: F1 (Master Satuan, Standar UX Quick Create Modern, dan Penyeragaman Visual Frame DataGrid)
- Dikerjakan:
  - **Pola Quick Create Terintegrasi di Dalam Menu Dropdown Select**:
    - Merevisi implementasi Quick Create Kategori Produk dan Satuan Dasar pada `produk-form-dialog.tsx`.
    - Memindahkan aksi Quick Create langsung ke dalam menu dropdown primitif `<SelectContent>` (item terbawah yang dipisahkan garis batas `border-t border-border/80 text-primary` dengan teks `+ Tambah Kategori Baru...` dan `+ Tambah Satuan Baru...`).
    - Menghilangkan tombol terpisah di samping label field, menghasilkan formulir yang jauh lebih bersih, rapi, dan intuitif layaknya aplikasi akuntansi modern (Kledo/Linear).
    - Menambahkan `satuan-quick-create-dialog.tsx` untuk pembuatan instan UOM langsung dari form produk.
  - **Halaman Mandiri Master Satuan Pengukuran (`/persediaan/satuan`)**:
    - Backend: menambahkan `buatSatuan`, `hapusSatuan(id)` (dengan proteksi integritas ketiadaan item dan aturan konversi UOM terkait) di `src/server/modules/keuangan/inventori/service.ts`, dan endpoint `DELETE /api/keuangan/satuan/:id`.
    - Frontend: modul lengkap (`page.tsx`, `satuan-client-view.tsx`, `satuan-form-dialog.tsx`, `satuan-delete-dialog.tsx`, `types.ts`).
    - Didaftarkan ke rute sidebar `ROUTES.inventory.units` ("Satuan").
  - **Penyeragaman Total Style Tabel Dashboard (Menghilangkan Judul Halaman di Luar Tabel)**:
    - Menghilangkan seluruh elemen judul `h1` dan subjudul yang berada di luar tabel pada `/persediaan/satuan`, `/persediaan/kategori`, `/pengaturan/penomoran`, dan `/pengaturan/tag`.
    - Mengintegrasikan seluruh judul modul ke dalam `<FrameTitle>` pada `<FrameHeader>` di atas tabel, berdampingan dengan `InputGroup` pencarian (lengkap dengan tombol clear silang), `Select` filter status, dan `ToggleGroup` aksi Tambah berikon murni (*icon-only*).
    - Seluruh tabel kini 100% konsisten dengan standar layout halaman mapan (Akun COA, Kontak, Katalog Produk).
- File/skema berubah:
  - `src/server/modules/keuangan/inventori/model.ts`
  - `src/server/modules/keuangan/inventori/service.ts`
  - `src/server/modules/keuangan/inventori/index.ts`
  - `src/components/layout/sidebar/routes.ts`
  - `src/components/layout/navigation/sidebar-menu.ts`
  - `src/app/(dashboard)/persediaan/produk/_components/satuan-quick-create-dialog.tsx` (baru)
  - `src/app/(dashboard)/persediaan/produk/_components/produk-form-dialog.tsx`
  - `src/app/(dashboard)/persediaan/satuan/*` (seluruh modul baru)
  - `src/app/(dashboard)/persediaan/kategori/_components/kategori-client-view.tsx`
  - `src/app/(dashboard)/pengaturan/penomoran/_components/penomoran-client-view.tsx`
  - `src/app/(dashboard)/pengaturan/tag/_components/tag-client-view.tsx`
  - `docs/ROADMAP.md`
- Migrasi: tidak ada (skema UOM & Kategori sudah ada di database)
- Verifikasi:
  - `bun run typecheck`: 0 error (TypeScript bersih)
  - `bun run lint`: 0 error (14 warning bawaan REUI data-grid dependencies)
  - `bun run build`: Berhasil 100% mengompilasi seluruh 18 rute statis dan dinamis Next.js 16 (Turbopack)
- Belum selesai / langkah berikutnya: Melanjutkan ke modul berikutnya sesuai arahan user.

## 2026-11-15 — S-046 — Implementasi Quick Create Kategori Produk, Halaman Mandiri Master Kategori, dan Perluasan Penomoran Otomatis ke Master Data
- Milestone: F1 (Master Data Kategori, Quick Create Form UX, dan Perluasan Engine Penomoran Otomatis)
- Dikerjakan:
  - **Quick Create Kategori Produk Langsung di Formulir Produk**:
    - Membuat komponen `kategori-quick-create-dialog.tsx`: dialog modal cepat untuk input nama kategori, kode opsional, dan keterangan tanpa perlu meninggalkan layar form produk.
    - Mengintegrasikan tombol `+ Tambah Cepat` di samping label "Kategori Produk" pada `produk-form-dialog.tsx`.
    - Menghubungkan state reaktif: saat kategori disimpan, langsung otomatis masuk ke daftar pilihan dan terpilih sebagai nilai `kategoriId` aktif tanpa menghilangkan data produk yang sedang diketik.
  - **Halaman Mandiri Master Kategori Produk (`/persediaan/kategori`)**:
    - `types.ts`: Definisi interface `KategoriItem` (dengan dukungan hierarki induk-anak) dan `KategoriStats`.
    - `kategori-form-dialog.tsx`: Modal tambah/edit kategori dengan selector Induk Kategori (memblokir pemilihan diri sendiri agar tidak terjadi siklus circular loop) dan switch status aktif.
    - `kategori-delete-dialog.tsx`: Dialog konfirmasi hapus permanen dengan proteksi integritas data relasi.
    - `kategori-client-view.tsx`: DataGrid REUI konsisten dengan Frame `stacked dense`, Strip KPI (Total Kategori, Kategori Aktif, Kategori Utama, Sub-Kategori), tab filter status (Semua, Aktif, Nonaktif), dan pencarian instan.
    - `page.tsx`: Server Component Next.js 16 App Router dengan `requireSession()`.
    - Backend: menambahkan fungsi `hapusKategori(id)` di `src/server/modules/keuangan/inventori/service.ts` yang memverifikasi ketiadaan sub-kategori dan produk terikat sebelum dihapus, serta rute `DELETE /api/keuangan/kategori-produk/:id`.
  - **Perluasan Engine Penomoran Otomatis ke Master Data**:
    - Menambahkan prefiks master data di `PREFIKS` (`src/server/modules/keuangan/shared/transaction.ts`): Pelanggan `CUST`, Pemasok `SUPP`, Katalog Produk `PRD`, Kategori `CAT`, dan Gudang `GDG`.
    - Mengupdate `DAFTAR_DOKUMEN_SISTEM` di `src/server/modules/keuangan/penomoran/service.ts` dengan klasifikasi modul `Master Data`.
    - Mengintegrasikan auto-numbering pada pembuatan Pelanggan (`CUST/2026/00001`) dan Pemasok (`SUPP/2026/00001`) bila field kode dikosongkan pada `buatKontak` (`src/server/modules/keuangan/kontak/service.ts`), lengkap dengan penanganan error kode ganda (duplicate key 23505) yang robust.
    - Mengintegrasikan auto-numbering pada pembuatan Kategori (`CAT/2026/00001`) bila kode dikosongkan.
    - Menyeragamkan tampilan tabel di `/pengaturan/penomoran`: menambahkan Strip KPI 4 kartu metrik (Total Konfigurasi, Siklus Dagang, Keuangan & Kas, Master Data & Inventori), tab filter modul terpadu (`Semua`, `Master Data`, `Penjualan`, `Pembelian`, `Kas & Bank`, `Akuntansi`, `Persediaan`), serta DataGrid Table konsisten.
  - **Navigasi Sidebar**:
    - Menambahkan rute `categories: "/persediaan/kategori"` di `routes.ts` dan menu "Kategori Produk" di `sidebar-menu.ts`.
- File/skema berubah:
  - `src/server/modules/keuangan/shared/transaction.ts`
  - `src/server/modules/keuangan/penomoran/service.ts`
  - `src/server/modules/keuangan/kontak/model.ts`
  - `src/server/modules/keuangan/kontak/service.ts`
  - `src/server/modules/keuangan/inventori/model.ts`
  - `src/server/modules/keuangan/inventori/service.ts`
  - `src/server/modules/keuangan/inventori/index.ts`
  - `src/components/layout/sidebar/routes.ts`
  - `src/components/layout/navigation/sidebar-menu.ts`
  - `src/app/(dashboard)/pengaturan/penomoran/_components/penomoran-client-view.tsx`
  - `src/app/(dashboard)/persediaan/produk/_components/kategori-quick-create-dialog.tsx` (baru)
  - `src/app/(dashboard)/persediaan/produk/_components/produk-form-dialog.tsx`
  - `src/app/(dashboard)/persediaan/kategori/*` (baru)
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error, 14 peringatan tidak terpakai).
  - `bun run build`: Lulus 100% (Seluruh rute Next.js 16 termasuk `/persediaan/kategori` terkompilasi sukses).
- Belum selesai / langkah berikutnya:
  - Melanjutkan implementasi modul berikutnya sesuai roadmap (Tier 2: Kas & Bank / General Ledger).



## 2026-11-15 — S-045 — Implementasi Backend & Antarmuka Penomoran Dokumen Otomatis dan Manajemen Tag Transaksi
- Milestone: F1 / F7 (Sistem Kontrol Penomoran Transaksi & Master Tag Dimensi)
- Dikerjakan:
  - **Backend Penomoran Dokumen Otomatis (`src/server/modules/keuangan/penomoran/`)**:
    - `model.ts` & `service.ts`: Metadata 17 jenis dokumen bisnis (Faktur Penjualan `FJ`, Pesanan Penjualan `SO`, Faktur Pembelian `FB`, Biaya `BY`, Kas Masuk `PM`, Kas Keluar `PK`, Mutasi Bank `MB`, Jurnal Umum `JU`, Penyesuaian Stok `PS`, Transfer Gudang `TG`, Aset Tetap `FA`, dll).
    - Menghubungkan engine atomik `documentSequences` untuk query daftar sequence dan pembaruan counter nomor terakhir (`PUT /api/keuangan/penomoran/:prefiks`).
    - `index.ts`: Endpoint `GET /api/keuangan/penomoran` dan `PUT /api/keuangan/penomoran/:prefiks` dengan otentikasi RBAC.
  - **Penyempurnaan Backend Tag Dimensi Transaksi (`src/server/modules/keuangan/dimensi/`)**:
    - Menambahkan fungsi proteksi bisnis `hapusTag(id)` pada `service.ts`: mengecek apakah tag sudah pernah dipakai di baris jurnal `journalItems`. Bila sudah pernah dipakai, sistem menolak penghapusan permanen dan menyarankan penonaktifan.
    - Menambahkan rute `DELETE /api/keuangan/dimensi/tag/:id` di `index.ts`.
  - **Antarmuka Halaman Penomoran Dokumen Otomatis (`/pengaturan/penomoran`)**:
    - `penomoran-client-view.tsx`: DataGrid REUI modern frame `stacked dense`, filter kategori modul (Semua, Penjualan, Pembelian, Kas & Bank, Akuntansi, Persediaan), badge prefiks, formula format pola, counter nilai terakhir, dan contoh nomor berikutnya yang interaktif.
    - `penomoran-edit-dialog.tsx`: Modal penyesuaian nomor urut counter dokumen dengan pratinjau dinamis nomor seri berikutnya secara instan (*Live Preview*).
    - `page.tsx`: Server Component Next.js 16 dengan proteksi sesi `requireSession()` dan `headersOption`.
  - **Antarmuka Halaman Manajemen Tag Transaksi (`/pengaturan/tag`)**:
    - `tag-client-view.tsx`: DataGrid REUI menampilkan nama tag dalam badge berwarna khas, kode HEX warna, deskripsi fungsi, status aktif/nonaktif, serta tombol aksi edit dan hapus.
    - `tag-form-dialog.tsx`: Modal enterprise berfitur visual color picker swatch (10 warna preset ala Kledo + input custom HEX), live badge preview, otomatisasi simbol tagar (`#`), dan switch status aktif.
    - `tag-delete-dialog.tsx`: Dialog konfirmasi penghapusan tag dengan peringatan proteksi integritas transaksi.
    - `page.tsx`: Server Component Next.js 16 terintegrasi `apiServer.keuangan.dimensi.tag`.
  - **Navigasi Sidebar**:
    - Mendaftarkan rute `numbering` dan `tags` di `src/components/layout/sidebar/routes.ts` dan `src/components/layout/navigation/sidebar-menu.ts`.
- File/skema berubah:
  - `src/server/modules/keuangan/penomoran/model.ts` (baru)
  - `src/server/modules/keuangan/penomoran/service.ts` (baru)
  - `src/server/modules/keuangan/penomoran/index.ts` (baru)
  - `src/server/modules/keuangan/dimensi/service.ts`
  - `src/server/modules/keuangan/dimensi/index.ts`
  - `src/server/modules/keuangan/index.ts`
  - `src/components/layout/sidebar/routes.ts`
  - `src/components/layout/navigation/sidebar-menu.ts`
  - `src/app/(dashboard)/pengaturan/penomoran/*` (baru)
  - `src/app/(dashboard)/pengaturan/tag/*` (baru)
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada (memanfaatkan tabel `document_sequences` dan `tags` yang telah ada).
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error).
  - `bun run build`: Lulus 100% (`/pengaturan/penomoran` dan `/pengaturan/tag` terkompilasi sukses).
- Belum selesai / langkah berikutnya:
  - Menjawab dan mengeksekusi kebutuhan pembuatan Kategori Produk (Quick create di formulir produk & halaman/tab master kategori produk).



## 2026-11-15 — S-044 — Perbaikan Bug Dropdown Select Terhimpit, Otentikasi SSR Satuan, dan Riset Fitur Tag Transaksi Kledo
- Milestone: F1 (Master Persediaan & Riset Dimensi/Tag Transaksi)
- Dikerjakan:
  - **Investigasi & Perbaikan Bug Dropdown Select Terhimpit**:
    - Menemukan akar penyebab bug "menu select terhimpit" pada `src/components/ui/select.tsx`: kelas CSS `h-[var(--radix-select-trigger-height)]` pada `SelectPrimitive.Viewport` saat `position="popper"` memaksa viewport dikunci setinggi tombol trigger (~36px/h-9), sehingga seluruh isi popup dropdown tercekik menjadi hanya 1 baris.
    - Menghapus pembatasan tinggi trigger tersebut agar viewport Select mengembang secara alami sesuai jumlah opsi item dengan batas scrolling `max-h-60 overflow-y-auto`.
  - **Perbaikan Otentikasi SSR pada Halaman Produk & Gudang**:
    - Memperbaiki `src/app/(dashboard)/persediaan/produk/page.tsx` dan `src/app/(dashboard)/persediaan/gudang/page.tsx`: menambahkan `requireSession()` dan meneruskan cookie sesi ke opsi pemanggilan `apiServer.keuangan.*.get({ fetch: { headers: headersOption } })` sehingga request Elysia Treaty SSR tidak lagi ditolak dengan error 401 Unauthorized.
    - Memperbarui `produk-form-dialog.tsx` dengan fallback informatif saat satuan kosong (`Belum ada satuan terdaftar di sistem.`) dan `sideOffset={4}`.
  - **Riset & Blueprint Fitur Tag Transaksi Standar Kledo**:
    - Meriset dokumentasi resmi Kledo terkait Tag Transaksi: tujuan multi-tagging (cabang, divisi, proyek, campaign, salesman), cakupan modul transaksi (Penjualan, Pembelian, Kas/Bank, Biaya, Jurnal Umum), serta laporan analitis (Laba Rugi per Tag & Buku Besar per Tag).
    - Memverifikasi kesiapan backend Elysia ERP: tabel `tags` di `src/db/schema/keuangan/dimensi.ts`, endpoint API `/api/keuangan/dimensi/tag`, data seed warna badge, serta sistem penomoran dokumen otomatis `documentSequences` di `src/server/modules/keuangan/shared/transaction.ts`.
- File/skema berubah:
  - `src/components/ui/select.tsx`
  - `src/app/(dashboard)/persediaan/produk/page.tsx`
  - `src/app/(dashboard)/persediaan/produk/_components/produk-form-dialog.tsx`
  - `src/app/(dashboard)/persediaan/gudang/page.tsx`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error, 14 peringatan tidak terpakai).
  - `bun run build`: Lulus 100% (Kompilasi Next.js 16 App Router sukses).
- Belum selesai / langkah berikutnya:
  - Eksekusi pembuatan halaman dan backend pengaturan Penomoran Dokumen Otomatis & Manajemen Warna Tag Transaksi.



## 2026-11-15 — S-043 — Perbaikan Konsistensi Header Tabel DataGrid & Penyeimbangan Dropdown Select Dialog
- Milestone: F1 (Frontend Polish & Bugfixes Master Produk/Gudang)
- Dikerjakan:
  - **Penyeragaman Header Tabel DataGrid (`produk-client-view.tsx` & `gudang-client-view.tsx`)**:
    - Memasang konfigurasi `tableLayout={{ width: "auto", columnsPinnable: true, columnsResizable: false, columnsMovable: true, columnsVisibility: true }}` dan `<Frame className="w-full" stacked dense>`.
    - Mengganti tombol batal seleksi menjadi format seamless ghost chip dengan badge counter merah destruktif halus dan ikon X di depan input pencarian.
    - Menyeragamkan `DataGridColumnHeader` dengan `visibility={true}` di semua header kolom tabel.
    - Mengubah kontrol aksi Tambah & Import di toolbar menjadi `ToggleGroup` Shadcn UI berikon murni (*Icon Only*) yang ringkas dan terpadu.
  - **Penyeimbangan Dropdown Select Dialog Form & Perbaikan Bug Satuan Dasar**:
    - Menambahkan `w-full` pada setiap `SelectTrigger` di dialog form (`produk-form-dialog`, `kontak-form-dialog`, `coa-form-dialog`) dan `position="popper"` dengan lebar `w-[var(--radix-select-trigger-width)]` agar ukuran dropdown menu select seimbang mengikuti grid halaman dan tidak menyusut (*w-fit*).
    - Memperbaiki bug pemilihan satuan dasar: menata grid informasi umum menjadi pasangan 2 kolom yang simetris (Tipe Produk & Satuan Dasar berdampingan 50%-50%), serta menangani nilai `value={field.value || undefined}` agar tidak terkunci saat rendering nilai awal.
- File/skema berubah:
  - `src/app/(dashboard)/persediaan/produk/_components/produk-form-dialog.tsx`
  - `src/app/(dashboard)/persediaan/produk/_components/produk-client-view.tsx`
  - `src/app/(dashboard)/persediaan/gudang/_components/gudang-client-view.tsx`
  - `src/app/(dashboard)/kontak/_components/kontak-form-dialog.tsx`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-form-dialog.tsx`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error).
  - `bun run build`: Lulus 100% (Seluruh rute Next.js 16 berhasil di-build tanpa error).
- Belum selesai / langkah berikutnya:
  - Diskusi arsitektur dan implementasi fitur Penomoran Dokumen Otomatis & Warna Tag/Dimensi Transaksi.

## 2026-11-15 — S-042 — Implementasi Frontend Master Produk & Manajemen Multi-Gudang (Tier 1 / F1)
- Milestone: F1 (Frontend Master Produk, Jasa & Fasilitas Gudang)
- Dikerjakan:
  - **Modul Katalog Produk & Jasa (`/persediaan/produk`)**:
    - `types.ts` & `schema.ts`: Definisi tipe `ItemProduk`, `KategoriOption`, `SatuanOption`, `AkunOption`, serta skema Zod `produkFormSchema` (SKU, barcode, nama, tipe barang: persediaan/non-stok/jasa/bundel, satuan, harga beli, harga jual, stok minimum, pemetaan akun persediaan, HPP, pendapatan).
    - `produk-stats.tsx`: KPI Strip metrik katalog (Total Item, Barang Persediaan, Non-Persediaan, Jasa).
    - `produk-form-dialog.tsx`: Modal dialog enterprise `sm:max-w-3xl` berstruktur fixed container (`h-[430px]`) bebas layout shift dengan navigasi tab segmented (Informasi Umum, Harga & Stok, Akun Finansial) dan header clean tanpa badge bertele-tele.
    - `produk-import-dialog.tsx`: Import katalog produk via Excel (.xlsx) multi-sheet resmi dengan validasi kolom dan tabel pratinjau mini.
    - `produk-client-view.tsx`: DataGrid REUI konsisten dengan pencarian SKU/nama, filter tipe barang, filter kategori, batch selection dengan ghost chip batal seleksi, dan aksi cepat edit.
    - `page.tsx`: Server Component Next.js 16 memuat item, kategori, satuan, dan akun COA secara paralel via `apiServer`.
  - **Modul Manajemen Gudang & Lokasi Penyimpanan (`/persediaan/gudang`)**:
    - `types.ts` & `schema.ts`: Definisi tipe `GudangItem`, `GudangStats`, serta skema Zod `gudangFormSchema` (kode, nama, PIC, alamat, adalahGudangUtama, keterangan, aktif).
    - `gudang-form-dialog.tsx`: Modal dialog enterprise `sm:max-w-3xl` untuk penambahan dan modifikasi lokasi gudang.
    - `gudang-client-view.tsx`: DataGrid REUI daftar gudang dengan KPI summary (total lokasi, gudang aktif, gudang utama), pencarian, filter status, dan tombol aksi.
    - `page.tsx`: Server Component Next.js 16 memuat data gudang via `apiServer`.
- File/skema berubah:
  - `src/app/(dashboard)/persediaan/produk/_lib/types.ts`
  - `src/app/(dashboard)/persediaan/produk/_lib/schema.ts`
  - `src/app/(dashboard)/persediaan/produk/_components/produk-stats.tsx`
  - `src/app/(dashboard)/persediaan/produk/_components/produk-form-dialog.tsx`
  - `src/app/(dashboard)/persediaan/produk/_components/produk-import-dialog.tsx`
  - `src/app/(dashboard)/persediaan/produk/_components/produk-client-view.tsx`
  - `src/app/(dashboard)/persediaan/produk/page.tsx`
  - `src/app/(dashboard)/persediaan/gudang/_lib/types.ts`
  - `src/app/(dashboard)/persediaan/gudang/_lib/schema.ts`
  - `src/app/(dashboard)/persediaan/gudang/_components/gudang-form-dialog.tsx`
  - `src/app/(dashboard)/persediaan/gudang/_components/gudang-client-view.tsx`
  - `src/app/(dashboard)/persediaan/gudang/page.tsx`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error).
  - `bun run build`: Lulus 100% (Rute `/persediaan/produk` dan `/persediaan/gudang` berhasil di-generate secara Partial Prerender).
- Belum selesai / langkah berikutnya:
  - Melanjutkan pengerjaan modul F1 berikutnya: Pengaturan Perusahaan & Mata Uang (`/pengaturan/perusahaan`).

## 2026-11-15 — S-041 — Penyeragaman Desain Seluruh Dialog Form & Import: Bagan Akun (COA) & Kontak Bisnis
- Milestone: F1 (Frontend Standarisasi Dialog Enterprise Master Data)
- Dikerjakan:
  - **Pembersihan Header Dialog Kontak (`src/app/(dashboard)/kontak/_components/kontak-form-dialog.tsx`)**:
    - Menghilangkan badge peran jenis kontak di samping judul form sesuai instruksi user untuk menciptakan visual header yang ultra-clean dan rapi.
  - **Standardisasi Dialog Import Kontak Bisnis (`src/app/(dashboard)/kontak/_components/kontak-import-dialog.tsx`)**:
    - Mengubah ukuran modal menjadi `sm:max-w-3xl` berarsitektur enterprise dengan header bersih (ikon berkas Excel + judul presisi tanpa deskripsi berlebihan).
    - Memasang bar aksi unduh template resmi berbingkai card, area upload drag-and-drop yang lapang, dan tabel pratinjau data mini terpadu.
    - Menambahkan footer terstandarisasi dengan keterangan format berkas didukung dan pemisah garis border.
  - **Standardisasi Dialog Bagan Akun COA (`src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-form-dialog.tsx`)**:
    - Meng-upgrade modal form tambah/edit/sub-akun menjadi `sm:max-w-3xl` dengan header bersih berikon `IconFolderPlus`.
    - Menata form dalam grid 2 kolom yang proporsional (Kode Akun, Tipe Akun, Nama Akun, Akun Induk), card switch konfigurasi (bisa diposting jurnal & akun kontra), dan footer enterprise.
  - **Standardisasi Dialog Import Bagan Akun COA (`src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-import-dialog.tsx`)**:
    - Meng-upgrade modal import Excel Bagan Akun menjadi `sm:max-w-3xl` dengan tata letak header, area unduh template, dropzone, tabel pratinjau, dan footer yang 100% konsisten dengan dialog kontak.
- File/skema berubah:
  - `src/app/(dashboard)/kontak/_components/kontak-form-dialog.tsx`
  - `src/app/(dashboard)/kontak/_components/kontak-import-dialog.tsx`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-form-dialog.tsx`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-import-dialog.tsx`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error).
  - `bun run build`: Lulus 100% (Next.js 16 build sukses).
- Belum selesai / langkah berikutnya:
  - Melanjutkan pengerjaan modul F1 berikutnya: Master Produk & Persediaan Dasar (`/persediaan/produk` & `/persediaan/gudang`).

## 2026-11-15 — S-040 — Redesain Dialog Form Kontak: Enterprise Grade, Ukuran Tetap & Zero Layout Shift Antar-Tab
- Milestone: F1 (Frontend Master Kontak Bisnis)
- Dikerjakan:
  - **Redesain Dialog Form Kontak (`src/app/(dashboard)/kontak/_components/kontak-form-dialog.tsx`)**:
    - Memperbesar ukuran modal dialog menjadi `sm:max-w-3xl` yang lapang, elegan, dan proporsional untuk standar aplikasi akuntansi enterprise.
    - Menghilangkan subtitle teks deskriptif yang berlebihan sesuai permintaan user, menggantinya dengan header minimalis berkelas: ikon entitas, judul dinamis (Tambah Kontak Baru / Ubah Kontak), dan badge peran entitas (Pelanggan / Pemasok).
    - Menghilangkan masalah *layout shift* (konten membesar/menyusut drastis saat berganti tab) dengan menerapkan kontainer viewport konten bertinggi tetap (`h-[430px] overflow-y-auto px-6 py-5`) yang seragam untuk seluruh tab ("Profil Dasar", "Pajak & Identitas", "Ketentuan & Alamat").
    - Menambahkan transisi animasi *fade-in* yang halus saat berpindah antar tab navigasi sehingga perpindahan konten terasa mulus (*seamless*).
    - Menata ulang tata letak kolom form, kontrol switch, info kepatuhan regulasi pajak Indonesia (PMK 136/2023 & Coretax), dan footer bergaris pemisah tegas dengan status kolom wajib `*`.
- File/skema berubah:
  - `src/app/(dashboard)/kontak/_components/kontak-form-dialog.tsx`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error).
  - `bun run build`: Lulus 100% (Next.js 16 build sukses).
- Belum selesai / langkah berikutnya:
  - Melanjutkan implementasi modul F1 berikutnya: Master Produk & Persediaan Dasar (`/persediaan/produk` & `/persediaan/gudang`).

## 2026-11-15 — S-039 — Upgrade Engine Import Excel (.xlsx) Multi-Sheet & Engine Dokumen Invoice PDF Print-Ready
- Milestone: F1 / F6 (Import Excel Master Data & Dokumen Transaksi Print-Ready)
- Dikerjakan:
  - **Engine Import Excel Terpusat (`src/lib/excel.ts`)**:
    - Memasang dependensi SheetJS `xlsx@0.18.5`.
    - Menyusun helper `downloadExcelFile(fileName, sheets)` untuk membuat file `.xlsx` resmi dengan dukungan multi-sheet (Sheet Data & Sheet Panduan Pengisian) serta lebar kolom terkalibrasi (`!cols`).
    - Menyusun helper `parseExcelFile(file)` yang mendukung parsing berkas `.xlsx`, `.xls`, dan `.csv` secara seragam ke dalam struktur data siap-impor dengan preservasi tipe teks (mencegah pemotongan digit angka/kode akun).
  - **Peningkatan Dialog Import Kontak Bisnis & Bagan Akun ke Excel**:
    - `src/app/(dashboard)/kontak/_components/kontak-import-dialog.tsx`: Mengganti textarea CSV manual dengan antarmuka unggah berkas Excel modern: template resmi 2 sheet (Data Pelanggan/Pemasok + Panduan Kolom), drag & drop file uploader, deteksi nama sheet, dan pratinjau tabel mini (5 baris pertama) sebelum dieksekusi.
    - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-import-dialog.tsx`: Menerapkan arsitektur import Excel yang sama untuk struktur hierarki Bagan Akun (COA) dengan template multi-sheet dan validasi baris akun otomatis.
  - **Engine Dokumen Invoice & Transaksi PDF Print-Ready**:
    - `src/lib/terbilang.ts`: Fungsi konversi nominal angka Rupiah ke teks terbilang Bahasa Indonesia resmi akuntansi (`angkaKeTerbilang`).
    - `src/components/documents/types.ts`: Definisi tipe data lengkap untuk dokumen faktur/transaksi (`InvoiceDocumentData`, `InvoiceCompanyInfo`, `InvoiceLineItem`, dll).
    - `src/components/documents/invoice-document.tsx`: Komponen tampilan faktur komersial standar A4 print-ready dengan kop surat perusahaan, status dokumen finansial, rincian barang/jasa, kalkulasi PPN & diskon, teks terbilang otomatis, kolom tanda tangan otorisasi, dan tombol aksi "Cetak Dokumen" (`window.print` dengan style `@media print`).
- File/skema berubah:
  - `package.json`
  - `src/lib/excel.ts`
  - `src/lib/terbilang.ts`
  - `src/components/documents/types.ts`
  - `src/components/documents/invoice-document.tsx`
  - `src/app/(dashboard)/kontak/_components/kontak-import-dialog.tsx`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-import-dialog.tsx`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error).
  - `bun run build`: Lulus 100% (Seluruh rute Next.js 16 berhasil di-build tanpa error).
- Belum selesai / langkah berikutnya:
  - Melanjutkan implementasi modul F1 berikutnya: Master Produk & Persediaan Dasar (`/persediaan/produk` & `/persediaan/gudang`).

## 2026-11-15 — S-038 — Implementasi Frontend Kontak Bisnis: Pelanggan & Pemasok (Tier 1 / F1)
- Milestone: F1 (Frontend Kontak Bisnis: Pelanggan & Pemasok)
- Dikerjakan:
  - **Tipe Data & Skema Validasi Kontak (`src/app/(dashboard)/kontak/_lib/`)**:
    - Mendefinisikan tipe `KontakItem`, `TerminOption`, dan `KontakStats` di `types.ts`.
    - Menyusun skema validasi Zod `kontakFormSchema` lengkap (kode, nama, peran pelanggan/pemasok, NPWP/NIK, PKP, grup, termin, plafon kredit, dan alamat) di `schema.ts`.
  - **Komponen KPI Stats Kontak (`src/app/(dashboard)/kontak/_components/kontak-stats.tsx`)**:
    - Menampilkan ringkasan metrik: Total Entitas, Kontak Aktif, Wajib Pajak PKP, dan Total Plafon Kredit (format Rupiah rapi).
  - **Modal Dialog Form Kontak & Import CSV (`src/app/(dashboard)/kontak/_components/`)**:
    - `KontakFormDialog`: Form multi-tab (Profil Dasar, Pajak & Identitas, Ketentuan Pembayaran & Alamat) dengan integrasi API treaty Elysia (`post` & `patch`).
    - `KontakImportDialog`: Unggah berkas CSV / paste CSV langsung dengan template otomatis sesuai jenis kontak (Pelanggan/Pemasok).
  - **Tampilan Utama DataGrid Enterprise Kontak (`src/app/(dashboard)/kontak/_components/kontak-client-view.tsx`)**:
    - Menggunakan arsitektur DataGrid REUI konsisten (seleksi baris massal, pencarian instan, filter grup & status aktif, badge REUI, format plafon kredit, dan pagination `sizes={[10, 20, 50, 100]}`).
    - Toolbar header terpadu dengan tombol batal seleksi seamless ghost chip dan `ToggleGroup` Shadcn UI untuk Import CSV & Tambah Baru.
  - **Halaman Server Components (`/kontak/pelanggan` & `/kontak/pemasok`)**:
    - `src/app/(dashboard)/kontak/pelanggan/page.tsx`: Memuat data pelanggan (`jenis: "PELANGGAN"`) dan termin pembayaran aktif secara paralel via `apiServer`.
    - `src/app/(dashboard)/kontak/pemasok/page.tsx`: Memuat data pemasok (`jenis: "PEMASOK"`) dan termin pembayaran aktif secara paralel via `apiServer`.
- File/skema berubah:
  - `src/app/(dashboard)/kontak/_lib/types.ts`
  - `src/app/(dashboard)/kontak/_lib/schema.ts`
  - `src/app/(dashboard)/kontak/_components/kontak-stats.tsx`
  - `src/app/(dashboard)/kontak/_components/kontak-form-dialog.tsx`
  - `src/app/(dashboard)/kontak/_components/kontak-import-dialog.tsx`
  - `src/app/(dashboard)/kontak/_components/kontak-client-view.tsx`
  - `src/app/(dashboard)/kontak/pelanggan/page.tsx`
  - `src/app/(dashboard)/kontak/pemasok/page.tsx`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error).
  - `bun run build`: Lulus 100% (Next.js 16 Partial Prerendering rute `/kontak/pelanggan` dan `/kontak/pemasok` sukses di-generate).
- Belum selesai / langkah berikutnya:
  - Melanjutkan pengerjaan Frontend F1: Master Produk & Persediaan Dasar (`/persediaan/produk` & `/persediaan/gudang`).

## 2026-11-15 — S-037 — Pemindahan Kontrol Tree Buka/Tutup ke Sebelah Judul & Perbaikan Default Rows Per Page DataGrid
- Milestone: F1 (Frontend Bagan Akun / Chart of Accounts)
- Dikerjakan:
  - **Pemindahan Kontrol Tree Buka/Tutup Semua ke Samping Judul**:
    - Menghilangkan strip bar di atas tabel pohon hierarki sehingga tabel pohon langsung menampilkan `<thead>` yang bersih.
    - Menempatkan teks status dan tombol interaktif "Buka Semua • Tutup Semua" tepat di sebelah teks judul "Bagan Akun" pada `FrameHeader` saat mode pohon hierarki dipilih.
    - Menggunakan `React.forwardRef` dan `useImperativeHandle` pada `CoaTreeTable` untuk mengontrol fungsi `expandAll` dan `collapseAll` langsung dari header.
  - **Perbaikan Angka Rows Per Page Paginasi DataGrid**:
    - Memperbaiki ketidakcocokan antara default `pageSize: 20` di tabel dengan opsi `sizes` pada `DataGridPagination`.
    - Menambahkan nilai `20` ke dalam opsi ukuran halaman (`[10, 20, 25, 50, 100]`) di `data-grid-pagination.tsx` dan memasang prop `sizes={[10, 20, 50, 100]}` pada `coa-client-view.tsx`.
    - Angka `20` kini langsung muncul secara otomatis dan jelas di kotak dropdown "Rows per page" pada saat pertama kali dimuat.
- File/skema berubah:
  - `src/components/reui/data-grid/data-grid-pagination.tsx`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-tree-table.tsx`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-client-view.tsx`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error).
  - `bun run build`: Lulus 100% (Next.js 16 Partial Prerendering sukses).
- Belum selesai / langkah berikutnya:
  - Melanjutkan pengerjaan Frontend F1: Manajemen Kontak Bisnis (`/kontak/pelanggan` & `/kontak/pemasok`).

## 2026-11-15 — S-036 — Penulisan Ulang CoaTreeTable Bergaya Konsisten, Integrasi ToggleGroup Shadcn UI, dan Tombol Seamless Batal Seleksi
- Milestone: F1 (Frontend Bagan Akun / Chart of Accounts)
- Dikerjakan:
  - **Penulisan Ulang Komponen Pohon Hierarki (`src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-tree-table.tsx`)**:
    - Menulis ulang tabel pohon hierarki dari awal menggunakan struktur kelas, header (`thead`, `tr`, `th`), styling hover, dan border yang 100% identik dan konsisten dengan `DataGridTable`.
    - Mempertahankan interaktivitas pohon (expand/collapse chevron per node, ikon folder terbuka/tertutup, serta tombol Buka Semua / Tutup Semua).
    - Memperbarui dropdown menu aksi dengan titik 3 horizontal (`IconDots`) dan opsi "Ubah" & "Tambah Sub".
    - Mengintegrasikan seluruh badge menggunakan REUI Badge (`src/components/reui/badge.tsx`).
  - **Integrasi Penuh `ToggleGroup` Shadcn UI (`src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-client-view.tsx`)**:
    - Menerapkan pola resmi `ToggleGroup` Shadcn UI (`type="single"` dengan `ToggleGroupItem` outline) yang menyatukan seluruh switcher tab ("Tabel Datar" & "Pohon Hierarki"), aksi "Import CSV", dan "Tambah Akun Baru" dalam satu wadah berjejer segmented yang rapi dan hanya menampilkan ikon (`IconLayoutGrid`, `IconListTree`, `IconFileSpreadsheet`, `IconPlus`).
  - **Penerapan Tombol Batal Seleksi Seamless (Ghost + Badge Count)**:
    - Menghilangkan kotak border merah kaku yang mengambang.
    - Menggantinya dengan desain *seamless ghost chip* khas Shadcn UI: transparan saat pasif dengan badge counter jumlah akun terpilih (`bg-destructive/10 text-destructive`) dan icon X yang menyatu mulus di depan search box, berubah lembut saat di-hover (`hover:bg-destructive/10`).
  - **Pembersihan Kolom Nama Akun**:
    - Menghapus badge kontra dan badge peran sistem (`KAS_BANK`) pada nama akun baik di tabel datar maupun di tabel pohon hierarki.
- File/skema berubah:
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-tree-table.tsx`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-client-view.tsx`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error).
  - `bun run build`: Lulus 100% (Next.js 16 Partial Prerendering sukses).
- Belum selesai / langkah berikutnya:
  - Melanjutkan pengerjaan Frontend F1: Manajemen Kontak Bisnis (`/kontak/pelanggan` & `/kontak/pemasok`).

## 2026-11-15 — S-035 — Perbaikan CSS Header Dark/Light Mode, Compact Icon-Only Tab & ButtonGroup, Smooth Destructive Selection
- Milestone: F1 (Frontend Bagan Akun / Chart of Accounts)
- Dikerjakan:
  - **Penyederhanaan Header**:
    - Menghapus subtitle deskripsi panjang dan `(Chart of Accounts)`, menjadikan judul bersih ringkas: "Bagan Akun".
  - **Perbaikan CSS Header Responsif Tema Gelap & Terang**:
    - Memperbaiki `DataGridColumnHeader` dan `DataGridTable` yang sebelumnya menggunakan `text-secondary-foreground/80` (yang di light mode Geist bernilai putih sehingga teks tidak terbaca) menjadi `text-muted-foreground` standar yang responsif kontras di tema terang maupun gelap.
  - **Menu Tab Switcher Compact (Icon-Only via ToggleGroup)**:
    - Mengubah switcher tampilan "Tabel Datar" dan "Pohon Hierarki" menjadi ikon tunggal compact (`IconLayoutGrid` & `IconListTree`) menggunakan `ToggleGroup` dan `ToggleGroupItem`.
  - **Aksi Ringkas Berkelompok (ButtonGroup)**:
    - Mengintegrasikan tombol "Import CSV" dan "Tambah Akun" ke dalam `ButtonGroup` segmented yang rapi dan compact.
  - **Tombol Batal Seleksi Smooth Destructive khas Shadcn UI**:
    - Mengganti tombol batal seleksi merah pekat dengan warna destruktif halus khas Shadcn UI (`bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/25`).
  - **Sinkronisasi & Perbaikan Bug Dropdown Menu Aksi di Pohon Hierarki (Tree Table)**:
    - Memperbaiki dropdown menu aksi pada `CoaTreeTable` agar seragam dengan daftar tabel (`size="icon" size-7`, menu `w-36`, opsi "Ubah" & "Tambah Sub", serta menghapus separator dan baris label dummy level).
- File/skema berubah:
  - `src/components/reui/data-grid/data-grid-column-header.tsx`
  - `src/components/reui/data-grid/data-grid-table.tsx`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-client-view.tsx`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-tree-table.tsx`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error).
  - `bun run build`: Lulus 100% (Next.js 16 Partial Prerendering sukses).
- Belum selesai / langkah berikutnya:
  - Melanjutkan pengerjaan Frontend F1: Manajemen Kontak Bisnis (`/kontak/pelanggan` & `/kontak/pemasok`).

## 2026-11-15 — S-034 — Migrasi Data-Grid Enterprise (REUI + TanStack Table v9), Frame Header Terpadu & Seamless Tree Container
- Milestone: F0 / F1 (Enterprise Data-Grid & Bagan Akun)
- Dikerjakan:
  - **Upgrade TanStack Table ke v9 (`@tanstack/react-table@9.3.1`)**:
    - Memutakhirkan dependensi ke TanStack Table v9 resmi untuk kompatibilitas penuh dengan komponen DataGrid modular (`useTable`, `dataGridFeatures`, atoms, sub-components).
  - **Penyempurnaan & Perbaikan Bug REUI DataGrid (`src/components/reui/data-grid/`)**:
    - Mengonversi 100% ikon `lucide-react` ke `@tabler/icons-react` sesuai aturan ketat proyek.
    - Memperbaiki prop Radix UI Trigger (`render={...}` diubah ke standard `asChild` pada `DropdownMenuTrigger` dan `PopoverTrigger`).
    - Memperbaiki penanganan `indeterminate` pada primitive `Checkbox` Radix UI.
    - Menghilangkan prop usang `alignItemWithTrigger` pada `SelectContent`.
    - Mengonfigurasi rule override React Compiler refs untuk library UI di `eslint.config.mjs`.
  - **Penerapan Pola FrameHeader Terpadu & Auto-Balance Sesuai Pola `c-data-grid-23.tsx` (`src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-client-view.tsx`)**:
    - Seluruh kontrol diletakkan langsung di dalam `FrameHeader`: Search (`InputGroup` dengan tombol clear), dropdown filter tipe akun, tombol batal seleksi dengan **style background merah destruktif** (`variant="destructive"` / `bg-destructive text-destructive-foreground` + ikon `IconX`), tab switcher ("Tabel Datar" vs "Pohon Hierarki"), tombol "Import CSV", dan tombol "Tambah Akun".
    - Mengonfigurasi `tableLayout={{ width: "auto", columnsPinnable: true, columnsResizable: false, columnsMovable: true, columnsVisibility: true }}` dan membungkus setiap header dengan `<DataGridColumnHeader title="..." visibility={true} column={column} />`, memastikan kolom auto-balance dan seluruh judul kolom tampil utuh tanpa terpotong.
    - Menyematkan konten Pohon Hierarki (`CoaTreeTable embedded`) langsung di dalam kontainer `Frame` & `DataGridScrollArea` yang sama, menghilangkan border/card ganda sehingga transisi antara flat view dan tree view mulus dan menyatu.
  - **Pembersihan Modul Usang**:
    - Folder `src/components/data-table/` lama telah dihapus permanen dan seluruh arsitektur tabel terpusat pada engine DataGrid baru.
- File/skema berubah:
  - `package.json` & `bun.lock`
  - `eslint.config.mjs`
  - `src/components/reui/data-grid/*` (perbaikan kompatibilitas Radix, Tabler icons, type safety)
  - `src/components/examples/c-data-grid-23.tsx` (perbaikan ikon Tabler dan trigger props)
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-client-view.tsx`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-tree-table.tsx`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error).
  - `bun run build`: Lulus 100% (Next.js 16 Partial Prerendering sukses).
- Belum selesai / langkah berikutnya:
  - Melanjutkan pengerjaan Frontend F1: Manajemen Kontak Bisnis (`/kontak/pelanggan` & `/kontak/pemasok`).

## 2026-11-15 — S-033 — Peningkatan UI/UX Tabel Bagan Akun: Kolom Checkbox & Visualisasi Hierarki Level Akun
- Milestone: F1 (Frontend Bagan Akun / Chart of Accounts)
- Dikerjakan:
  - **Peningkatan Reusable `DataTable` Engine (`src/components/data-table/data-table.tsx`)**:
    - Menambahkan dukungan opsional untuk *controlled row selection* (`rowSelection` & `onRowSelectionChange`).
    - Menambahkan `getRowId` kustom untuk integritas pelacakan baris lintas sorting/filter.
    - Menambahkan `getRowClassName` callback dinamis untuk styling baris kondisional (misal penegasan visual untuk baris Level 1 dan baris Header Grup).
  - **Penyederhanaan Layout Toolbar & Pembatalan Seleksi Cepat**:
    - Menghilangkan panel/card pembungkus pada toolbar filter dan tab switcher, membiarkan kontrol (pencarian, dropdown tipe, dan tab switcher) berdiri sendiri secara bersih tepat di atas tabel.
    - Menghapus banner/panel notifikasi seleksi massal di atas tabel.
    - Menambahkan tombol pembatalan seleksi berupa ikon `X` dengan border merah (`border-rose-500/60 text-rose-600`) tepat di sebelah kanan filter tipe akun yang hanya muncul saat baris dipilih.
  - **Kolom Checkbox Seleksi Baris (`src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-client-view.tsx`)**:
    - Mengintegrasikan kolom `select` sebagai kolom pertama di TanStack table dengan primitive `Checkbox` (`@/components/ui/checkbox`).
    - Menyediakan *select-all* dengan penanganan status *indeterminate* di header tabel.
  - **Diferensiasi Visual Berjenjang Berbasis Tipografi Murni (Sederhana & Bersih)**:
    - Menghilangkan dekorasi ikon cabang/folder/konektor pohon yang berlebihan pada sel nama akun agar tabel daftar datar tetap fungsional, bersih, dan tidak meniru tampilan pohon (tampilan pohon hierarki tetap terisolasi di tab "Pohon Hierarki").
    - **Penebalan Teks Berjenjang (Stepped Font-Weight) & Perataan Kiri Sempurna (Flat Alignment)**:
      - Seluruh teks nama akun diratakan kiri secara presisi (*flush left*, tanpa indentasi/padding bertingkat buatan).
      - **Level 1 (Kelas Akun / Induk Utama)**: `font-bold text-foreground text-sm tracking-tight` pada nama dan kode akun, dengan penanda baris pembatas atas dan latar halus (`bg-muted/30 border-t`).
      - **Level 2 (Sub-Grup / Golongan)**: `font-semibold text-foreground text-xs`.
      - **Level 3 (Grup Akun / Kelompok)**: `font-medium text-foreground text-xs`.
      - **Level 4+ / Akun Detail (Posting)**: `font-normal text-muted-foreground hover:text-foreground text-xs`.
    - **Kolom Klasifikasi**: Tampilan badge netral yang tenang (`Header (L1)`, `Header (L2)`, dst.) untuk header dan teks ringkas `Posting` untuk akun transaksi tanpa tumpang tindih warna yang ramai.
    - Menambahkan menu dropdown aksi per baris (`IconDotsVertical`) dengan opsi cepat "Ubah Akun" dan "Tambah Sub-Akun" (khusus akun header).
    - Menyelaraskan pewarnaan badge tipe akun (`ASET`, `KEWAJIBAN`, `EKUITAS`, `PENDAPATAN`, `BEBAN`) dan badge klasifikasi pada tampilan hierarki pohon (`coa-tree-table.tsx`).
- File/skema berubah:
  - `src/components/data-table/data-table.tsx`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-client-view.tsx`
  - `src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-tree-table.tsx`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error, 0 warning).
  - `bun run build`: Lulus 100% (Next.js 16 Partial Prerender sukses untuk `/akuntansi/bagan-akun`).
- Belum selesai / langkah berikutnya:
  - Melanjutkan pengerjaan Frontend F1: Manajemen Kontak Bisnis (`/kontak/pelanggan` & `/kontak/pemasok`) dan Produk/Gudang (`/persediaan/produk`).

## 2026-11-14 — S-032 — Peningkatan Komprehensif Dataset Demo 1 Tahun & Analitik Multi-Dimensi (Tahunan/Bulanan/Mingguan/Harian)
- Milestone: S3 (Enhanced Demo Dataset for Analytics & Multi-Module UI — Done)
- Dikerjakan:
  - **Kalender Periode Fiskal 14 Bulan (`src/db/seed/demo/periods.ts`)**:
    - Membuka kalender fiskal dari `2025-11` s/d `2026-12` berstatus `TERBUKA` untuk mendukung query rentang waktu historis.
  - **Saldo Awal Persediaan & Kartu Stok Multi-Gudang (`src/db/seed/demo/stock.ts`)**:
    - Mengalokasikan saldo kuantitas, nilai, dan average cost fisik untuk Laptop Bisnis Pro 14, Monitor IPS 24, dan Kertas HVS pada Gudang Cakung (Utama) dan Gudang Transit Surabaya.
    - Menghasilkan kartu stok awal (`stockMovements`) dengan jenis `MASUK` bersumber `SALDO_AWAL`.
  - **Pendaftaran Aset Tetap & Depresiasi Fiskal DJP (`src/db/seed/demo/fixed-assets.ts`)**:
    - Mendaftarkan Server Dell PowerEdge R750 (IT), Truk Box Isuzu Giga (Logistik), dan Workstation Ergonomis (SCBD) dengan kalkulasi akumulasi penyusutan dan sisa nilai buku.
  - **Rencana Kerja & Anggaran Perusahaan (RKAP) 2026 (`src/db/seed/demo/budgets.ts`)**:
    - Menanamkan target anggaran tahunan Rp 5.65 Miliar dengan rincian 12 bulan baris anggaran (`budgetLines`) pada akun Penjualan 4100, HPP 5100, Gaji 6100, Sewa 6200, Utilitas 6300, dan Iklan 6400 untuk mendukung analitik "Anggaran vs Realisasi".
  - **Faktur Dagang & Analitik Umur Piutang/Hutang Aging (`src/db/seed/demo/invoices.ts`)**:
    - Menanamkan faktur penjualan (`salesInvoices`) dan pembelian (`purchaseInvoices`) dengan spektrum umur lengkap (Lancar, 1–30 hari, 31–60 hari, dan Lunas) beserta alokasi pelunasan bank (`payments` & `paymentAllocations`) untuk mengaktifkan grafik AR/AP Aging.
  - **Engine Jurnal Umum Multi-Bulan & Harian (`src/db/seed/demo/transactions.ts`)**:
    - Menghasilkan 91 Jurnal Umum seimbang (`POSTED`) yang mencakup 12 bulan historis pertumbuhan omzet (Des 2025 Rp 290jt s/d Nov 2026 Rp 410jt), siklus payroll tanggal 25, sewa/utilitas tanggal 5, promosi tanggal 15, dan penyusutan tanggal 28.
    - Menambahkan transaksi harian dan mingguan acak realistis pada bulan berjalan (November 2026) untuk menghasilkan kurva sparkline dan fluktuasi harian/jam di grafik dashboard.
- File/skema berubah:
  - `src/db/seed/demo/periods.ts` (baru)
  - `src/db/seed/demo/stock.ts` (baru)
  - `src/db/seed/demo/fixed-assets.ts` (baru)
  - `src/db/seed/demo/budgets.ts` (baru)
  - `src/db/seed/demo/invoices.ts` (baru)
  - `src/db/seed/demo/transactions.ts` (diperkaya)
  - `src/db/seed/demo/index.ts` (diperbarui)
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run db:seed --clean --demo`: Sukses 100% menanamkan 91 Jurnal Umum, saldo stok, aset tetap, anggaran bulanan, dan faktur aging dalam 17.2 detik.
  - `layanan.ringkasanKpiDashboard("2026-11-14")`: Mengembalikan 12 titik tren bulanan otentik non-zero untuk Pendapatan, Beban, Laba Bersih, dan Kas dengan delta persentase dinamis.
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error, 0 warning).
  - `bun run build`: Lulus 100% (Next.js 16 build sukses).
- Belum selesai / langkah berikutnya:
  - Melanjutkan pengerjaan Frontend ERP: Modul F1 Bagan Akun (CRUD form & export/import dialog), dilanjutkan ke F2 Kas & Bank (`/akuntansi/kas-bank`).



## 2026-11-14 — S-031 — Pembersihan Seed Usang & Penanaman Akun Autentikasi Admin Demo
- Milestone: Database Seeding & Auth Credentials (Selesai — Done)
- Dikerjakan:
  - **Pembersihan File Seed Monolitik Usang**:
    - Menghapus file `src/db/seed/keuangan.ts` yang sudah tidak terpakai agar direktori seed bersih dan hanya menyisakan arsitektur modular 3-tier.
  - **Penanaman Kredensial Login Administrator Demo di Better Auth**:
    - Memperbarui `src/db/seed/demo/company.ts` untuk menggunakan `auth.api.signUpEmail` sehingga record dibuat lengkap pada tabel `user` dan `account` (dengan enkripsi password scrypt/bcrypt).
    - Memperbaiki pemetaan kode peran pada `companyUsers` agar menggunakan kode `roles.kode === "ADMIN"`.
    - Mengonfirmasi akun admin dapat melakukan autentikasi login via `/sign-in`.
  - **Dokumentasi Kredensial Login**:
    - Menambahkan Bagian 7 pada [docs/SEEDING-AND-WIZARD.md](file:///e:/Coding/elysiafinnace/docs/SEEDING-AND-WIZARD.md) yang merinci email, password, peran, dan nama perusahaan default.
- File/skema berubah:
  - `src/db/seed/keuangan.ts` (dihapus)
  - `src/db/seed/demo/company.ts`
  - `src/server/modules/keuangan/onboarding/service.ts`
  - `docs/SEEDING-AND-WIZARD.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run db:seed --clean --demo`: Berhasil dijalankan ulang dalam 6583ms.
  - `auth.api.signInEmail`: Berhasil melakukan login dengan token yang valid.
  - `bun run typecheck`: Lulus 100% (0 error).
  - `bun run lint`: Lulus 100% (0 error, 0 warning).
- Belum selesai / langkah berikutnya:
  - Melanjutkan pengerjaan Frontend ERP sesuai prioritas: Modul F1 Bagan Akun & F2 Kas Bank.



## 2026-11-14 — S-030 — Eksekusi Penuh Database Reset Engine & Modular Seeder 3-Tier (S0-S4)
- Milestone: S0, S1, S2, S3, S4 (Selesai — 100% Done)
- Dikerjakan:
  - **S0 Database Reset Engine (`src/db/seed/reset.ts`)**:
    - Skrip `resetDatabase()` dengan eksekusi `TRUNCATE TABLE ... RESTART IDENTITY CASCADE` yang membersihkan seluruh 90 tabel transaksi/master dalam 245–398ms.
    - Dilengkapi safeguard blokir otomatis jika `NODE_ENV === "production"` dan opsi `keepAuth: true`.
    - Didaftarkan di `package.json` sebagai `bun run db:reset`.
  - **S1 System Foundation Seeds (`src/db/seed/system/`)**:
    - `currencies.ts`: Mata uang dasar IDR beserta USD, EUR, SGD, JPY, CNY, MYR, AUD dan kurs awal.
    - `payment-terms.ts`: Termin TUNAI/COD, Net 7, Net 14, Net 30, Net 45, Net 60, 2/10-NET-30, EOM.
    - `uom.ts`: Satuan lengkap (PCS, UNIT, BOX, DUS, PACK, KG, GRAM, LITER, M, M2, M3, RIM, SET, JAM, HARI, BULAN) dan kategori produk dasar.
    - `taxes.ts`: Master Pajak Indonesia (PPN 11%, PPN 12% UU HPP, PPh 21, PPh 22, PPh 23, PPh 4(2), PPh 15).
    - `asset-categories.ts`: Kategori Aset Tetap Fiskal DJP (Golongan 1: 4 thn, Golongan 2: 8 thn).
    - `rbac.ts`: 8 Peran Sistem (ADMIN, MANAJER_KEUANGAN, AKUNTAN, KASIR, PEMBELIAN, PENJUALAN, GUDANG, AUDITOR) dengan pemetaan matriks izin otomatis `Izin` terikat penuh ke `KATALOG_IZIN`.
  - **S2 Industry COA Presets (`src/db/seed/coa/`)**:
    - `builder.ts`: Engine penyisipan pohon hierarki akun berurutan dengan kalkulasi normal balance akun kontra dan level kedalaman.
    - `trading-coa.ts`: 64 akun standar dagang & distribusi Indonesia.
    - `service-coa.ts`: 40 akun standar jasa, IT, software, dan agensi konsultan.
    - `manufacturing-coa.ts`: 50 akun standar pabrik/produksi (Bahan Baku, WIP, Barang Jadi, BTKL, BOP).
    - `minimal-coa.ts`: 20 akun ringkas yang mengunci 17 Peran Sistem Wajib.
    - `index.ts`: Ekspor `seedCoaByIndustry(db, template)` dengan validasi peringatan integritas peran sistem.
  - **S3 Realistic Demo Fixtures (`src/db/seed/demo/`)**:
    - `company.ts`: Profil legal `PT Elysia Niaga Nusantara`, Kantor Pusat SCBD, Cabang Surabaya, Gudang Cakung & Transit Surabaya, Departemen, Proyek Retail POS, dan Tag.
    - `bank-accounts.ts`: Rekening Kas Kecil (Rp 10jt), BCA Giro Operasional (Rp 350jt), Mandiri Giro Payroll (Rp 150jt).
    - `contacts.ts`: PT Mega Retailindo (VIP), Toko Grosir Berkah, PT Global Distribusi, PT Indofood Tbk, CV Prima Kemasan, dan utilitas Telkom/PLN.
    - `products.ts`: Laptop Bisnis Pro 14, Monitor IPS 24", Kertas HVS A4 (multi-satuan Rim & Box), Jasa Konsultasi ERP, dan Price List Grosir partai besar.
    - `transactions.ts`: Periode fiskal `2026-11`, Jurnal Saldo Awal Neraca seimbang Rp 800jt, faktur penjualan, HPP penjualan, pembelian stok, pembayaran utilitas, dan penerimaan pelunasan piutang (seluruhnya berstatus `POSTED` dan seimbang debit=kredit).
  - **S4 CLI Runner & Onboarding Wizard Integration (`src/db/seed/`)**:
    - `src/db/seed.ts`: CLI executable fleksibel mendukung flag `--clean`, `--demo`, `--template=<TYPE>`, `--keep-auth`, dan `--help`.
    - `src/db/seed/index.ts`: Orchestrator master seed terstruktur 3-tier.
    - `src/server/modules/keuangan/onboarding/`: Endpoint `POST /api/keuangan/onboarding` lengkap dengan skema validasi Elysia, transaksi database rollback-safe, dan otomatisasi setup tenant baru.
- File/skema berubah:
  - `src/db/seed/reset.ts`
  - `src/db/seed/system/` (`currencies.ts`, `payment-terms.ts`, `uom.ts`, `taxes.ts`, `asset-categories.ts`, `rbac.ts`, `index.ts`)
  - `src/db/seed/coa/` (`builder.ts`, `trading-coa.ts`, `service-coa.ts`, `manufacturing-coa.ts`, `minimal-coa.ts`, `index.ts`)
  - `src/db/seed/demo/` (`company.ts`, `bank-accounts.ts`, `contacts.ts`, `products.ts`, `transactions.ts`, `index.ts`)
  - `src/db/seed/index.ts`
  - `src/db/seed.ts`
  - `src/server/modules/keuangan/onboarding/` (`model.ts`, `service.ts`, `index.ts`)
  - `src/server/modules/keuangan/index.ts`
  - `docs/ROADMAP.md`
  - `docs/SESSION-LOG.md`
- Migrasi: tidak ada (hanya penambahan seeder dan modul onboarding API).
- Verifikasi:
  - `bun run db:seed --clean --demo`: Sukses 100% dalam 5419ms (90 tabel di-truncate dalam 245ms, 64 akun ditanam, profil PT Elysia Niaga Nusantara dibuat, 6 jurnal seimbang diposting).
  - `bun run db:seed`: Sukses 100% idempoten tanpa duplikasi dalam 2952ms.
  - `bun run typecheck`: Lulus 100% (`tsc --noEmit` exit 0).
  - `bun run lint`: Lulus 100% (`eslint .` exit 0, 0 warning, 0 error).
  - `bun run build`: Lulus 100% (semua rute Next.js berhasil ter-generate statis & dinamis).
- Belum selesai / langkah berikutnya:
  - Melanjutkan pengerjaan Frontend ERP sesuai prioritas: Modul F1 Bagan Akun (penyempurnaan aksi CRUD & import dialog), dilanjutkan ke F2 Kas & Bank (`/akuntansi/kas-bank`).

## 2026-11-14 — S-029 — Perencanaan & Perumusan Arsitektur Database Seeding Modular & Setup Wizard Engine
- Milestone: Database Seeding & Wizard Engine (Perencanaan Selesai — Done)
- Dikerjakan:
  - **Penyusunan Roadmap Database Seeding & Setup Wizard** di [docs/ROADMAP.md](file:///e:/Coding/elysiafinnace/docs/ROADMAP.md):
    - Merumuskan 5 sub-milestone pelaksana: S0 (Reset Engine), S1 (System Seeds), S2 (Industry COA Presets), S3 (Demo Fixtures), dan S4 (CLI Runner & Wizard API).
  - **Penyusunan Dokumentasi Arsitektur Teknis** di [docs/SEEDING-AND-WIZARD.md](file:///e:/Coding/elysiafinnace/docs/SEEDING-AND-WIZARD.md):
    - Menguraikan prinsip 3-Tier Modular Seeding: Layer 1 (System Foundation), Layer 2 (Industry Presets: Dagang, Jasa, Manufaktur, Minimal), dan Layer 3 (Demo Fixtures).
    - Memetakan Pohon Dependensi Relasional Level 0 s/d Level 5 untuk menjamin urutan penanaman kunci asing (*foreign keys*) tidak pernah gagal.
    - Mengunci 17 Peran Sistem Wajib akuntansi yang harus dimiliki oleh setiap template COA.
    - Merancang alur 4 langkah Onboarding Wizard dan kontrak API payload `POST /api/keuangan/onboarding`.
  - **Pembaruan Panduan Perintah** di [docs/ARCHITECTURE.md](file:///e:/Coding/elysiafinnace/docs/ARCHITECTURE.md) dengan menyertakan perintah `bun run db:reset` dan opsi `bun run db:seed`.
- File/skema berubah:
  - [docs/ROADMAP.md](file:///e:/Coding/elysiafinnace/docs/ROADMAP.md)
  - [docs/SEEDING-AND-WIZARD.md](file:///e:/Coding/elysiafinnace/docs/SEEDING-AND-WIZARD.md)
  - [docs/ARCHITECTURE.md](file:///e:/Coding/elysiafinnace/docs/ARCHITECTURE.md)
  - [docs/SESSION-LOG.md](file:///e:/Coding/elysiafinnace/docs/SESSION-LOG.md)
- Migrasi: tidak ada (layer arsitektur, perencanaan milestone, dan panduan dokumentasi).
- Verifikasi:
  - Integritas link dokumentasi & konsistensi roadmap.
- Belum selesai / langkah berikutnya:
  - Melakukan implementasi sub-milestone **S0 (Database Reset Engine)** di `src/db/seed/reset.ts` dengan penambahan script `"db:reset"` di `package.json`.

## 2026-11-14 — S-028 — Perbaikan UI/UX Bagan Akun & Koreksi Kontras Elevated Surface Dark Mode
- Milestone: F1 — Master Data & Fondasi Bisnis (Bugfix & UX Polish — Selesai)
- Dikerjakan:
  - **Penyelesaian Bug Kontras Gelap (Pitch-Black Flatness) di Dark Mode**:
    - Mengidentifikasi akar masalah di [src/app/css/globals.css](file:///e:/Coding/elysiafinnace/src/app/css/globals.css): token `--ds-background-100` dan `--ds-background-200` sama-sama diset ke `#000000`, sehingga kartu, kontainer tabel, toolbar, dan latar belakang utama menyatu tanpa kedalaman visual.
    - Mengatur ulang token dark mode: canvas dasar `--ds-background-200: #09090b` (deep dark) dan elevated surface `--ds-background-100: #121215`, sehingga kartu, dialog, popover, dan tabel kini memiliki kontras permukaan bertingkat (*elevated dark surfaces*) yang jelas dan mewah.
  - **Koreksi Warna & Urutan Tab Switcher (Tabel Datar vs Pohon Hierarki)**:
    - Mengganti tombol `variant="secondary"` yang menyebabkan warna abu-abu kontras aneh dengan komponen *segmented control pill switcher* standar industri (`bg-muted/60 p-0.5`, aktif: `bg-background text-foreground shadow-xs`, nonaktif: `text-muted-foreground`).
    - Menetapkan **Tabel Datar (Flat DataTable)** sebagai tampilan default pertama, dan **Pohon Hierarki** sebagai opsi kedua sesuai permintaan alur kerja pengguna.
  - **Penyelesaian Overflow & Penataan Dialog Import CSV**:
    - Memperbaiki batasan lebar dialog di [coa-import-dialog.tsx](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-import-dialog.tsx): mengganti batas default sempit `sm:max-w-lg` dengan `sm:max-w-3xl md:max-w-4xl max-h-[92vh]` agar muat luas di layar desktop.
    - Menambahkan wadah panduan kolom header CSV dengan badge pill rapi yang dapat membungkus secara responsif (*flex-wrap*), serta membatasi Textarea dengan `w-full max-h-[380px] overflow-x-auto whitespace-pre` sehingga tidak terjadi pelebaran layout modal (*zero layout overflow*).
- File/skema berubah:
  - [src/app/css/globals.css](file:///e:/Coding/elysiafinnace/src/app/css/globals.css)
  - [src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-client-view.tsx](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-client-view.tsx)
  - [src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-import-dialog.tsx](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-import-dialog.tsx)
  - [docs/SESSION-LOG.md](file:///e:/Coding/elysiafinnace/docs/SESSION-LOG.md)
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck` (`tsc --noEmit`) lulus 100% (0 errors).
  - `bun run lint` (`eslint .`) lulus 100% (0 errors, 0 warnings).
  - `bun run build` (`next build` Turbopack) lulus 100% (10/10 routes compiled cleanly).

## 2026-11-14 — S-027 — Implementasi Modul Bagan Akun (COA): Hierarki Pohon Interaktif, Modal Tambah/Edit, & Import CSV Massal
- Milestone: F1 — Master Data & Fondasi Bisnis (In Progress)
- Dikerjakan:
  - **Pembangunan Halaman Utama Bagan Akun (COA)** di [src/app/(dashboard)/akuntansi/bagan-akun/](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/):
    - [page.tsx](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/page.tsx): Server Component (RSC) dengan validasi sesi `requireSession()`, pengambilan data paralel struktur pohon (`apiServer.keuangan.akun.pohon`) dan daftar datar (`apiServer.keuangan.akun`), kalkulasi metrik stats akun, serta isolasi Suspense streaming.
    - [loading.tsx](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/loading.tsx) & [error.tsx](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/error.tsx): Loading skeleton animasi dan penanganan galat terisolasi dengan tombol coba lagi.
    - [_components/coa-stats.tsx](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-stats.tsx): Kartu ringkasan metrik (Aset, Kewajiban, Ekuitas, Pendapatan, Beban) dengan indikator saldo normal bawaan.
    - [_components/coa-tree-table.tsx](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-tree-table.tsx): Tabel hierarki pohon akun interaktif dengan fitur expand/collapse multi-level, tombol buka/tutup semua, indentasi per tingkat level, visual ikon folder & chevron, lencana klasifikasi (Header Grup vs Detail Postable), badge Saldo Normal (Debit Dr / Kredit Cr), serta menu aksi ubah dan tambah sub-akun.
    - [_components/coa-form-dialog.tsx](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-form-dialog.tsx): Modal dialog tambah dan ubah akun terintegrasi React Hook Form + Zod validation, auto-fill saldo normal berdasarkan tipe akun dan status kontra, filter dinamis akun induk sesama tipe, dan mutasi data type-safe via Eden Treaty `getApi()`.
    - [_components/coa-import-dialog.tsx](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-import-dialog.tsx): Modal import CSV massal dengan fitur upload file CSV lokal, pratinjau data, unduh template CSV standar, dan mutasi ke endpoint `POST /api/keuangan/akun/import`.
    - [_components/coa-client-view.tsx](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/_components/coa-client-view.tsx): Komponen container yang merakit toolbar filter tipe akun, pencarian instan, tombol switch tampilan pohon hierarki vs tabel datar (DataTable), serta manajemen dialog.
    - [_lib/schema.ts](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/_lib/schema.ts) & [_lib/types.ts](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/akuntansi/bagan-akun/_lib/types.ts): Skema validasi Zod input akun dan definisi tipe antarmuka TypeScript.
- File/skema berubah:
  - Seluruh file di `src/app/(dashboard)/akuntansi/bagan-akun/`
  - [docs/ROADMAP.md](file:///e:/Coding/elysiafinnace/docs/ROADMAP.md)
  - [docs/SESSION-LOG.md](file:///e:/Coding/elysiafinnace/docs/SESSION-LOG.md)
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck` (`tsc --noEmit`) lulus 100% (0 errors).
  - `bun run lint` (`eslint .`) lulus 100% (0 errors, 0 warnings).
  - `bun run build` (`next build` Turbopack) lulus 100% (10/10 routes compiled, rute `/akuntansi/bagan-akun` berstatus Partial Prerender).
- Belum selesai / langkah berikutnya:
  - Melanjutkan Tier F1 item ke-2: Halaman Kontak Bisnis Pelanggan & Pemasok (`/kontak/pelanggan` & `/kontak/pemasok`).

## 2026-11-14 — S-026 — Standardisasi Total Penamaan File Frontend: Migrasi 100% Kebab-Case & Refactor Seluruh Jalur Impor
- Milestone: Standardisasi Konvensi Penamaan Frontend (Selesai — Done)
- Dikerjakan:
  - **Penetapan Aturan Baku Penamaan File Frontend** di [docs/ARCHITECTURE.md](file:///e:/Coding/elysiafinnace/docs/ARCHITECTURE.md) (Bagian 9):
    - Seluruh file dan direktori di area frontend (`src/app/`, `src/components/`, `src/lib/`, `src/hooks/`) **WAJIB 100% menggunakan format `kebab-case`**.
    - Dilarang keras menggunakan `PascalCase` atau `camelCase` pada nama file atau folder di frontend.
    - Pengecualian hanya berlaku untuk file bawaan Next.js (`page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`, `route.ts`) dan UI library primitives (`src/components/ui/`).
  - **Refactor & Migrasi Seluruh File Frontend yang Melanggar ke `kebab-case`**:
    - Menggunakan `git mv` untuk merename 20 file yang sebelumnya menggunakan PascalCase peninggalan template lama:
      - `src/components/layout/AppShell.tsx` → [src/components/layout/app-shell.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/app-shell.tsx)
      - `src/components/layout/DevelopmentPage.tsx` → [src/components/layout/development-page.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/development-page.tsx)
      - `src/components/layout/ThemeToggle.tsx` → [src/components/layout/theme-toggle.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/theme-toggle.tsx)
      - `src/components/layout/header/Header.tsx` → [src/components/layout/header/header.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/header/header.tsx)
      - `src/components/layout/header/MegaMenu.tsx` → [src/components/layout/header/mega-menu.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/header/mega-menu.tsx)
      - `src/components/layout/header/Notifications.tsx` → [src/components/layout/header/notifications.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/header/notifications.tsx)
      - `src/components/layout/header/Profile.tsx` → [src/components/layout/header/profile.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/header/profile.tsx)
      - `src/components/layout/header/Search.tsx` → [src/components/layout/header/search.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/header/search.tsx)
      - `src/components/layout/sidebar/Sidebar.tsx` → [src/components/layout/sidebar/sidebar.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/sidebar/sidebar.tsx)
      - `src/components/layout/sidebar/SidebarNav.tsx` → [src/components/layout/sidebar/sidebar-nav.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/sidebar/sidebar-nav.tsx)
      - `src/components/layout/sidebar/SidebarProvider.tsx` → [src/components/layout/sidebar/sidebar-provider.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/sidebar/sidebar-provider.tsx)
      - `src/components/layout/sidebar/RailTooltip.tsx` → [src/components/layout/sidebar/rail-tooltip.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/sidebar/rail-tooltip.tsx)
      - `src/components/layout/shared/IconButton.tsx` → [src/components/layout/shared/icon-button.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/shared/icon-button.tsx)
      - `src/components/layout/shared/breadcrumb/BreadcrumbComp.tsx` → [src/components/layout/shared/breadcrumb/breadcrumb-comp.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/shared/breadcrumb/breadcrumb-comp.tsx)
      - `src/components/layout/shared/breadcrumb/CardBox.tsx` → [src/components/layout/shared/breadcrumb/card-box.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/shared/breadcrumb/card-box.tsx)
      - `src/components/layout/shared/logo/FullLogo.tsx` → [src/components/layout/shared/logo/full-logo.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/shared/logo/full-logo.tsx)
      - `src/components/layout/shared/logo/Logo.tsx` → [src/components/layout/shared/logo/logo.tsx](file:///e:/Coding/elysiafinnace/src/components/layout/shared/logo/logo.tsx)
      - `src/components/chart/MetricCard.tsx` → [src/components/chart/metric-card.tsx](file:///e:/Coding/elysiafinnace/src/components/chart/metric-card.tsx)
      - `src/components/chart/MetricVisualBars.tsx` → [src/components/chart/metric-visual-bars.tsx](file:///e:/Coding/elysiafinnace/src/components/chart/metric-visual-bars.tsx)
      - `src/components/types/MetricCardTypes.ts` → [src/components/types/metric-card-types.ts](file:///e:/Coding/elysiafinnace/src/components/types/metric-card-types.ts)
    - Memperbarui seluruh jalur impor di seluruh file terkait agar tidak ada broken import.
- File/skema berubah:
  - 20 file di `src/components/layout/`, `src/components/chart/`, dan `src/components/types/`
  - [src/app/(dashboard)/layout.tsx](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/layout.tsx), [src/app/(dashboard)/[...slug]/page.tsx](file:///e:/Coding/elysiafinnace/src/app/(dashboard)/[...slug]/page.tsx)
  - [docs/ARCHITECTURE.md](file:///e:/Coding/elysiafinnace/docs/ARCHITECTURE.md)
  - [docs/SESSION-LOG.md](file:///e:/Coding/elysiafinnace/docs/SESSION-LOG.md)
- Migrasi: tidak ada.
- Verifikasi:
  - `bun run typecheck` (`tsc --noEmit`) lulus 100% (0 errors).
  - `bun run lint` (`eslint .`) lulus 100% (0 errors, 0 warnings).
  - `bun run build` (`next build` Turbopack) lulus 100% (9/9 routes compiled cleanly).
- Belum selesai / langkah berikutnya:
  - Melanjutkan pengerjaan Tier F1 (Master Data & Fondasi Bisnis) dengan aturan penamaan seragam `kebab-case`.

## 2026-11-14 — S-025 — Implementasi Fondasi UI/UX F0: Data-Table Engine Reusable TanStack v8, Input Finansial Presisi, dan Primitif Status
- Milestone: F0 — Fondasi UI/UX, Data-Table & Input Finansial (Selesai — Done)
- Dikerjakan:
  - **Instalasi TanStack Table v8**: Memasang `@tanstack/react-table@8.21.3` sebagai mesin data grid headless berstandar industri untuk Next.js 16 + React 19 + Tailwind v4.
  - **Pembangunan Data Table Engine Reusable** di `src/components/data-table/`:
    - `DataTable`: Komponen tabel generik yang merakit TanStack Table dengan primitif tabel semantik (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`), mendukung sorting multi-arah, filtering, pemilihan baris (*row selection*), loading skeleton dinamis, dan integrasi *EmptyState*.
    - `DataTableColumnHeader`: Header kolom sortable dengan indikator arah panah (Asc/Desc/None) dan opsi sembunyikan kolom via dropdown menu.
    - `DataTablePagination`: Paginasi responsif lengkap dengan selector baris per halaman (10, 20, 30, 50, 100), navigasi halaman pertama/terakhir, dan counter data terpilih.
    - `DataTableToolbar`: Toolbar pencarian debounced instan dengan tombol reset filter dan integrasi toggle visibilitas kolom.
    - `DataTableViewOptions`: Dropdown menu untuk memilih kolom yang ingin ditampilkan/disembunyikan oleh pengguna.
  - **Pembangunan Primitif Status & Feedback Finansial** di `src/components/feedback/`:
    - `FinancialStatusBadge`: Lencana status dokumen transaksi finansial semantik (`role="status"`, dot indicator) dengan token warna Geist/Tailwind yang terstandarisasi untuk status: Draft, Terbuka, Disetujui, Terposting, Sebagian, Lunas, Batal, dan Ditolak.
    - `ConfirmActionDialog`: Modal dialog konfirmasi tindakan krusial akuntansi (posting permanen, pembatalan, pembalikan jurnal) dengan pesan konsekuensi buku besar dan status loading `isPending`.
    - `EmptyState`: Komponen visual elegan saat tabel/daftar tidak memiliki data, dilengkapi ikon Tabler, judul, deskripsi, dan slot tombol Call-to-Action.
  - **Pembangunan Kontrol Input Khusus Finansial** di `src/components/form/`:
    - `CurrencyInput`: Kontrol input nilai moneter bertopeng ribuan interaktif (Rupiah/valas), right-aligned dengan tipografi `font-mono tabular-nums`, yang menyimpan dan menghasilkan string desimal murni tanpa distorsi presisi *floating-point*.
    - `CoaCombobox`: Pemilih akun COA hierarkis dengan pencarian instan kode/nama, lencana saldo normal (Debit/Kredit), dan pengelompokan otomatis berdasarkan kategori akun.
    - `ContactCombobox`: Pemilih mitra bisnis (Pelanggan/Pemasok) dengan pencarian cerdas nama kontak atau nama perusahaan serta badge tipe mitra.
    - `DateRangePicker`: Pemilih rentang tanggal transaksi finansial dengan tombol rentang cepat (Hari Ini, 7 Hari, 30 Hari, Bulan Ini, Bulan Lalu, Tahun Berjalan) terintegrasi kalender dwibulan.
- File/skema berubah:
  - [package.json](file:///e:/Coding/elysiafinnace/package.json), [bun.lock](file:///e:/Coding/elysiafinnace/bun.lock)
  - [src/components/data-table/data-table.tsx](file:///e:/Coding/elysiafinnace/src/components/data-table/data-table.tsx), [src/components/data-table/data-table-column-header.tsx](file:///e:/Coding/elysiafinnace/src/components/data-table/data-table-column-header.tsx), [src/components/data-table/data-table-pagination.tsx](file:///e:/Coding/elysiafinnace/src/components/data-table/data-table-pagination.tsx), [src/components/data-table/data-table-toolbar.tsx](file:///e:/Coding/elysiafinnace/src/components/data-table/data-table-toolbar.tsx), [src/components/data-table/data-table-view-options.tsx](file:///e:/Coding/elysiafinnace/src/components/data-table/data-table-view-options.tsx), [src/components/data-table/index.ts](file:///e:/Coding/elysiafinnace/src/components/data-table/index.ts)
  - [src/components/feedback/financial-status-badge.tsx](file:///e:/Coding/elysiafinnace/src/components/feedback/financial-status-badge.tsx), [src/components/feedback/confirm-action-dialog.tsx](file:///e:/Coding/elysiafinnace/src/components/feedback/confirm-action-dialog.tsx), [src/components/feedback/empty-state.tsx](file:///e:/Coding/elysiafinnace/src/components/feedback/empty-state.tsx), [src/components/feedback/index.ts](file:///e:/Coding/elysiafinnace/src/components/feedback/index.ts)
  - [src/components/form/currency-input.tsx](file:///e:/Coding/elysiafinnace/src/components/form/currency-input.tsx), [src/components/form/coa-combobox.tsx](file:///e:/Coding/elysiafinnace/src/components/form/coa-combobox.tsx), [src/components/form/contact-combobox.tsx](file:///e:/Coding/elysiafinnace/src/components/form/contact-combobox.tsx), [src/components/form/date-range-picker.tsx](file:///e:/Coding/elysiafinnace/src/components/form/date-range-picker.tsx), [src/components/form/index.ts](file:///e:/Coding/elysiafinnace/src/components/form/index.ts)
  - [docs/ROADMAP.md](file:///e:/Coding/elysiafinnace/docs/ROADMAP.md)
  - [docs/SESSION-LOG.md](file:///e:/Coding/elysiafinnace/docs/SESSION-LOG.md)
- Migrasi: tidak ada (frontend UI foundation layer).
- Verifikasi:
  - `bun run typecheck` (`tsc --noEmit`) lulus 100% (0 errors).
  - `bun run lint` (`eslint .`) lulus 100% (0 errors, 0 warnings).
- Belum selesai / langkah berikutnya:
  - Eksekusi Tier F1: Membangun modul halaman Master Data & Fondasi Bisnis diawali dari Bagan Akun / COA (`/akuntansi/bagan-akun`) dan Kontak Mitra Bisnis (`/kontak/pelanggan` & `/kontak/pemasok`).

## 2026-11-14 — S-024 — Perumusan Roadmap Frontend ERP Berbasis Skala Prioritas Industri & Arsitektur Standar Rekayasa Kode Agent
- Milestone: Arsitektur & Roadmap Frontend (Selesai — Done)
- Dikerjakan:
  - **Penyusunan Roadmap Frontend Lengkap (Tier F0 s/d Tier F7)** di [docs/ROADMAP.md](file:///e:/Coding/elysiafinnace/docs/ROADMAP.md):
    - Menyusun roadmap berstandar industri ERP akuntansi (setara Jurnal, SAP, Kledo) berdasarkan hierarki dependensi data:
      - **Tier F0**: Fondasi UI/UX, Data-Table Enterprise Reusable, Kontrol Input Moneter (`CurrencyInput`), Combobox Hierarkis COA & Kontak, serta Feedback Primitives.
      - **Tier F1**: Master Data & Fondasi Bisnis (Bagan Akun/COA Hierarki, Kontak Pelanggan/Pemasok, Produk Multi-Satuan, Profil Perusahaan, Kurs Historis, Saldo Awal).
      - **Tier F2**: Kas & Bank, Biaya Operasional, dan Buku Besar (Rekening Kas/Bank, Biaya, Mutasi, Transfer Valas, Rekonsiliasi Bank CSV, Voucher Jurnal Umum Debet-Kredit Seimbang).
      - **Tier F3**: Siklus Dagang Inti: Pembelian (AP) & Penjualan (AR) (PO, Faktur Pembelian/Penjualan, Alokasi Pembayaran Multi-Faktur, Retur/Nota Debit/Kredit).
      - **Tier F4**: Inventori Lanjutan & Aset Tetap (Transfer Antar Gudang, Stok Opname, Registrasi Aset, Depresiasi Batch Bulanan, Pelepasan Aset).
      - **Tier F5**: Kepatuhan Pajak Indonesia (PPN Masukan/Keluaran, PPh Bukti Potong, Rekap Coretax/e-Faktur), Anggaran & Dimensi Biaya, Tutup Buku Periodik.
      - **Tier F6**: Laporan Finansial Enterprise (Neraca, Laba Rugi Multi-Step, Arus Kas Langsung/Tidak Langsung, Subledger & Aging AR/AP, Template Cetak Print-Ready HTML/PDF).
      - **Tier F7**: Tata Kelola Sistem, Manajemen Multi-Peran RBAC, Alur Persetujuan Bertingkat (*Approval Matrix*), Audit Log Forensik, dan Otomasi Integrasi.
    - Menghubungkan 100% rute halaman ke konstanta tersentralisasi `ROUTES` di `src/components/layout/sidebar/routes.ts`.
  - **Penetapan Standar Arsitektur Frontend & Rekayasa Kode Agent** di [docs/ARCHITECTURE.md](file:///e:/Coding/elysiafinnace/docs/ARCHITECTURE.md):
    - **Struktur Direktori & Co-location Pattern**: Mengatur folder halaman `src/app/(dashboard)/<domain>/[...subroute]/` dengan `_components/`, `_lib/` (schema Zod & mapper), dan `_hooks/` lokal.
    - **Separation of Concerns (SoC) 4-Layer**:
      1. Layer 1: *Server Orchestrator Page* (`page.tsx` RSC) — pre-fetch data in-process via `apiServer`, validasi sesi, Suspense streaming.
      2. Layer 2: *Client Interaction Container* (`*-table.tsx`, `*-form.tsx`) — state, filter, form submit, mutasi data type-safe via Eden Treaty `getApi()`.
      3. Layer 3: *Presentational Leaf Components* — komponen murni berbasis HTML semantik dan props.
      4. Layer 4: *Pure Business Utilities* — logika perhitungan moneter, formatting, dan validasi murni.
    - **Manajemen Nilai Finansial & Zero Float Drift**: Melarang penggunaan float `number` JS untuk nilai uang; mewajibkan string desimal presisi tinggi dan pemformatan angka tabular (`font-mono tabular-nums text-right`).
    - **Standar Semantik & Aksesibilitas (A11y)**: Aturan tabel finansial semantik (`<table>`, `<th>` scoped, `<td>`), kontras badge status, serta form labels & error aria-describedby.
    - **Idiomatik Next.js 16 + React 19**: Server Component secara default, async params, boundary suspense lokal, dan pemisahan leaf client boundary.
- File/skema berubah:
  - [docs/ROADMAP.md](file:///e:/Coding/elysiafinnace/docs/ROADMAP.md)
  - [docs/ARCHITECTURE.md](file:///e:/Coding/elysiafinnace/docs/ARCHITECTURE.md)
  - [docs/SESSION-LOG.md](file:///e:/Coding/elysiafinnace/docs/SESSION-LOG.md)
- Migrasi: tidak ada (layer arsitektur, panduan rekayasa sistem, dan roadmap frontend).
- Verifikasi:
  - `bun run typecheck` (`tsc --noEmit`) lulus 100% (0 errors).
  - `bun run lint` (`eslint .`) lulus 100% (0 errors, 0 warnings).
- Belum selesai / langkah berikutnya:
  - Eksekusi Tier F0: Membangun blok fondasi UI/UX generik (Data Table Engine, CurrencyInput, CoaCombobox, ContactCombobox, dan FinancialStatusBadge) sebagai pondasi bagi pengerjaan halaman F1.

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
