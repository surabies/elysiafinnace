Kita sedang melanjutkan pengembangan project fullstack yang sudah ada (menggunakan Next.js, Elysia.js, Drizzle ORM, PostgreSQL, Better-Auth, dan Shadcn UI). 

⚠️ **INSTRUKSI UTAMA & BATASAN KRITIS:**
1. **JANGAN membangun ulang (rebuild)** struktur project yang sudah ada atau menghapus file yang sudah berfungsi (seperti setup awal login, logout, cek kesehatan, dan klien Drizzle). 
2. Lanjutkan dan integrasikan arsitektur database serta backend secara **inkremental dan bertahap**.
3. Gunakan tipe data desimal/numeric yang presisi untuk nilai uang (hindari floating point).
4. Pastikan semua entitas dan logika akuntansi menggunakan **Bahasa Indonesia** sebagai standar utama (termasuk penamaan field deskriptif dan log pesan).
5. Terapkan standar akuntansi **Double-Entry Bookkeeping** yang ketat.

Silakan kerjakan modul backend dan skema database ERP Keuangan Enterprise ini secara berurutan dalam **4 Segmen (Phase)** berikut di dalam project yang sudah ada:

---

### PHASE 1: Fondasi Master Data & Multi-Currency
- **Multi-Currency**: Buat tabel mata uang (`currencies`) dengan kurs aktif/historis. Setiap transaksi wajib mendukung *base currency* dan *exchange rate*.
- **Chart of Accounts (COA) Hierarkis**: Buat tabel COA bersarang (parent-child / sub-account) dengan tipe: Aset, Kewajiban, Ekuitas, Pendapatan, dan Beban. 
  - *Catatan Penting*: Mapping penjualan wajib masuk ke akun Pendapatan Penjualan (`Pendapatan Penjualan`), BUKAN ke Laba Ditahan. Sertakan kolom `normal_balance` (DEBIT/KREDIT).
- **Kontak (Partners)**: Tabel terpusat untuk Pelanggan (Customer) dan Pemasok (Vendor) lengkap dengan termin pembayaran.
- **Inventory Master**: Tabel Kategori Produk, Satuan (Unit of Measurement), dan Master Item/Produk (SKU, tipe barang, harga standar, akun COA persediaan).
- **Akun Bank & Kas**: Tabel rekening bank perusahaan yang terhubung langsung dengan COA tipe Kas/Bank.

---

### PHASE 2: Modul Transaksi Inti (Jurnal, Buku Besar, & Biaya)
- **Jurnal Umum (Double-Entry Engine)**:
  - Header Jurnal (`journal_entries`: nomor, tanggal, referensi, deskripsi, status posted, periode).
  - Item Jurnal (`journal_items`: akun COA ID, debit, kredit, mata uang, kurs).
  - **Validasi Keras**: Buat fungsi helper/service di Elysia yang memastikan total `DEBIT` wajib sama persis dengan total `KREDIT` sebelum jurnal disimpan/diposting ke database.
- **Buku Besar (General Ledger)**: Sediakan fungsi/query untuk merangkum mutasi dan saldo per akun COA dalam rentang tanggal tertentu.
- **Modul Biaya (Expenses)**: Pencatatan beban operasional yang otomatis menjurnal ke akun beban dan mengurangi kas/bank atau mencatat hutang.
- **Mutasi & Rekonsiliasi Bank**: Pencatatan arus kas masuk/keluar dari akun bank yang terhubung otomatis ke jurnal.

---

### PHASE 3: Inventory Movement & Siklus Dagang (AP/AR)
- **Inventory Stock Ledger (Mutasi Stok)**: Melacak keluar-masuk barang secara real-time dengan metode penilaian biaya rata-rata (*Average Cost*).
- **Accounts Payable (Hutang / Pembelian)**: Siklus dari Purchase Order (PO) hingga Bill/Faktur Pemasok yang otomatis menjurnal: (Dr) Persediaan/Beban & (Cr) Hutang Usaha.
- **Accounts Receivable (Piutang / Penjualan)**: Siklus dari Sales Order (SO) hingga Invoice Pelanggan yang otomatis menjurnal: (Dr) Piutang Usaha & (Cr) Pendapatan Penjualan (`Pendapatan Penjualan`) + PPN Keluaran.
- **Alokasi Pembayaran**: Pelunasan piutang/hutang yang memotong kas/bank dan mengurangi saldo AR/AP terkait.

---

### PHASE 4: Pelaporan Keuangan Enterprise & Tutup Buku
- **Periode Akuntansi & Tutup Buku**: Fitur penguncian periode transaksi bulanan/tahunan. Mekanisme *Year-End Closing* untuk memindahkan saldo akun nominal (Pendapatan & Beban) ke Laba Ditahan (*Retained Earnings*), serta membawa saldo awal akun riil ke periode berikutnya.
- **Laporan Keuangan Utama (Financial Reports)**:
  1. Neraca (Balance Sheet - Aset = Kewajiban + Ekuitas).
  2. Laporan Laba Rugi (Income Statement).
  3. Laporan Perubahan Modal.
  4. Laporan Arus Kas (Cash Flow).
- **REST API Endpoint**: Sediakan endpoint Elysia.js yang bersih, modular, aman, dan siap dikonsumsi oleh frontend Next.js.

Mohon mulai implementasikan dari **Phase 1** terlebih dahulu, buat migrasi Drizzle-nya, lalu beritahu saya jika sudah siap lanjut ke Phase berikutnya.