# Arsitektur Database Seeding & Setup Wizard Engine

Dokumentasi ini adalah spesifikasi teknis untuk sistem **modular seeding** dan **onboarding wizard** pada Elysia Finance ERP. Sistem ini dirancang agar data awal database bersih, matang, berstandar industri, dan siap digunakan baik lewat CLI pengembang maupun melalui wizard pengguna di frontend saat pertama kali mengatur perusahaan.

---

## 1. Prinsip Desain Seeding

1. **Pemisahan 3 Lapisan Data (3-Tier Separation)**:
   - **Layer 1 (System Foundation)**: Metadata statis universal yang wajib ada di setiap sistem (mata uang, satuan, termin, pajak, RBAC).
   - **Layer 2 (Industry COA Presets)**: Template bagan akun terstruktur sesuai bidang usaha (Dagang, Jasa, Manufaktur, Minimal) yang dapat dipilih pengguna saat wizard setup.
   - **Layer 3 (Demo Fixtures)**: Dataset contoh realistis (perusahaan contoh, bank, kontak, produk, dan transaksi) yang bersifat **opsional** (hanya diaktifkan untuk demo/pengembangan).
2. **Idempoten & Aman (Idempotent Execution)**:
   - Setiap entitas master memiliki kode unik. Penanaman data menggunakan klausa `onConflictDoNothing({ target: [kode] })` sehingga aman dijalankan berulang kali tanpa merusak atau menduplikasi data yang sudah ada.
3. **Pembersihan Bersih & Aman (Safe Reset Engine)**:
   - Utilitas `reset.ts` menggunakan perintah `TRUNCATE TABLE ... RESTART IDENTITY CASCADE`.
   - **Production Safeguard**: Skrip reset otomatis memblokir eksekusi jika variabel `NODE_ENV === "production"`.
4. **Transaksional**:
   - Seluruh proses setup tenant dan COA dalam wizard dijalankan dalam satu blok `db.transaction(...)`. Jika terjadi kegagalan di tengah jalan, database otomatis di-rollback ke keadaan bersih.

---

## 2. Pohon Dependensi Relasional (Execution Order Graph)

Karena tabel-tabel di database memiliki relasi kunci asing (*foreign keys*) yang ketat, urutan penanaman data wajib mengikuti pohon ketergantungan berikut:

```
[Level 0: Master Independen]
├─ currencies (Mata Uang)
├─ payment_terms (Termin Pembayaran)
├─ units_of_measurement (Satuan)
├─ taxes (Pajak Indonesia)
├─ asset_categories (Golongan Aset Fiskal)
└─ roles & permissions (RBAC)
         │
         ▼
[Level 1: Perusahaan / Tenant]
└─ companies
         │
         ▼
[Level 2: Unit Organisasi & Lokasi]
├─ branches (Cabang)
├─ departments (Departemen)
└─ warehouses (Gudang)
         │
         ▼
[Level 3: Bagan Akun (COA)]
└─ chart_of_accounts (Induk Level 1 -> Sub-Induk Level 2 -> Detail Level 3/4)
         │
         ▼
[Level 4: Rekening Finansial & Master Dagang]
├─ bank_accounts (Terhubung ke COA Kas/Bank)
├─ contacts (Pelanggan/Pemasok, Terhubung ke Termin & COA Piutang/Hutang)
└─ product_categories & items (Terhubung ke Satuan, Kategori, & COA Persediaan/HPP/Pendapatan)
         │
         ▼
[Level 5: Transaksi Demo]
├─ opening_balances (Saldo Awal Jurnal)
├─ purchase_orders & purchase_invoices (Pembelian AP)
├─ sales_orders & sales_invoices (Penjualan AR)
└─ payments & bank_transactions (Kas & Bank)
```

---

## 3. Struktur Direktori Modular (`src/db/seed/`)

```
src/db/seed/
├─ index.ts                     # CLI Runner utama: mendukung flag --clean, --demo, --template=<jenis>
├─ reset.ts                     # Utilitas TRUNCATE CASCADE seluruh tabel dengan safeguard produksi
│
├─ system/                      # Layer 1: Data Sistem Wajib
│  ├─ currencies.ts             # IDR (Dasar), USD, SGD, EUR, JPY, CNY, MYR, AUD
│  ├─ payment-terms.ts          # COD/Tunai, Net 7, Net 14, Net 30, Net 45, Net 60, 2/10 Net 30, EOM
│  ├─ uom.ts                    # Satuan komprehensif: PCS, UNIT, BOX, DUS, PACK, KG, LITER, M, M2, M3, RIM, SET, JAM
│  ├─ taxes.ts                  # Master Pajak Indonesia: PPN 11%, PPN 12% (UU HPP), PPh 21, 22, 23, 4(2), 15
│  ├─ asset-categories.ts       # Golongan Fiskal DJP (Gol 1: 4 thn, Gol 2: 8 thn, Gol 3: 16 thn, Bangunan: 20 thn)
│  └─ rbac.ts                   # Role: Super Admin, Finance Manager, Accountant, Cashier, Sales, Purchasing, Auditor
│
├─ coa/                         # Layer 2: Template Bagan Akun Industri
│  ├─ trading-coa.ts            # Template 1: Perusahaan Dagang & Ritel (Persediaan, HPP, Retur, Ongkir, PPN)
│  ├─ service-coa.ts            # Template 2: Perusahaan Jasa & Konsultasi (Pendapatan Jasa, Beban Subkontraktor, Proyek)
│  ├─ manufacturing-coa.ts      # Template 3: Manufaktur/F&B/Pabrik (Bahan Baku, WIP, Barang Jadi, Tenaga Kerja, BOP)
│  └─ minimal-coa.ts            # Template 4: Minimalis (Hanya akun peran sistem kunci untuk custom CSV import)
│
└─ demo/                        # Layer 3: Data Contoh Realistis
   ├─ company.ts                # Profil PT Elysia Niaga Nusantara, Cabang Jakarta, Gudang Utama
   ├─ bank-accounts.ts          # Kas Kecil (Rp 5jt), BCA Operasional (Rp 250jt), Mandiri Payroll (Rp 100jt)
   ├─ contacts.ts               # Pelanggan & Pemasok lokal dengan NPWP, alamat, dan batas kredit
   ├─ products.ts               # Katalog produk elektronik/FMCG (multi-satuan PCS/BOX, harga grosir/eceran)
   └─ transactions.ts           # Jurnal saldo awal, contoh faktur penjualan terposting, faktur pembelian, dan mutasi kas
```

---

## 4. Rincian Template Bagan Akun (COA Presets)

Setiap template menjamin **seluruh Peran Sistem Wajib** terisi dengan tepat sehingga otomatisasi jurnal (penjualan, pembelian, penyusutan, tutup buku) berfungsi 100% tanpa galat:

### Peran Sistem Wajib yang Harus Ditetapkan:
1. `KAS_BANK`: Kas Kecil & Bank Utama
2. `PIUTANG_USAHA`: Piutang Dagang / Usaha
3. `HUTANG_USAHA`: Hutang Usaha / Dagang
4. `PERSEDIAAN`: Persediaan Barang Dagang / Bahan Baku (khusus Dagang & Manufaktur)
5. `PENDAPATAN_PENJUALAN`: Pendapatan Utama
6. `HARGA_POKOK_PENJUALAN`: HPP
7. `PPN_MASUKAN`: PPN Masukan (Klaim Pajak Masukan)
8. `PPN_KELUARAN`: PPN Keluaran (Pajak Penjualan)
9. `HUTANG_PAJAK`: PPh Terutang
10. `PAJAK_DIBAYAR_DIMUKA`: Uang Muka PPh
11. `UANG_MUKA_PELANGGAN`: Titipan Uang Muka Penjualan
12. `UANG_MUKA_PEMASOK`: Uang Muka Pembelian
13. `MODAL_DISETOR`: Modal Saham Pemilik
14. `LABA_DITAHAN`: Laba Ditahan Kumulatif
15. `EKUITAS_SALDO_AWAL`: Akun Penyeimbang Saldo Awal (Opening Balance Offset)
16. `LABA_SELISIH_KURS`: Keuntungan Selisih Kurs Valas
17. `RUGI_SELISIH_KURS`: Kerugian Selisih Kurs Valas

---

## 5. Rencana Integrasi Onboarding Wizard (Frontend & API)

Ketika pengguna baru masuk pertama kali (atau membuat perusahaan baru di sistem multi-perusahaan):

### Alur Wizard:
1. **Langkah 1: Profil Bisnis**: Nama Perusahaan, Alamat, NPWP, Logo, Telepon.
2. **Langkah 2: Model Bisnis & Bagan Akun**:
   - Pilihan: `Dagang / Ritel`, `Jasa / Konsultasi`, `Manufaktur / Produksi`, atau `Minimalis / Import Mandiri`.
3. **Langkah 3: Kas & Rekening Bank Awal**:
   - Nama Bank (misal "BCA Giro Operasional"), Nomor Rekening, Saldo Kas Awal.
4. **Langkah 4: Opsi Data Contoh (Demo Fixtures)**:
   - Checkbox: *"Muat data demo transaksi untuk latihan eksplorasi"*.

### Kontrak Endpoint API Backend:
- **Rute**: `POST /api/keuangan/onboarding`
- **Body Request**:
  ```json
  {
    "namaPerusahaan": "PT Solusi Jaya Abadi",
    "alamat": "Jl. Sudirman Kav 21, Jakarta",
    "npwp": "01.234.567.8-012.000",
    "mataUangDasarId": "uuid-idr",
    "templateCoa": "TRADING", // TRADING | SERVICE | MANUFACTURING | MINIMAL
    "rekeningAwal": {
      "namaBank": "BCA Giro Operasional",
      "nomorRekening": "8820192831",
      "saldoAwal": "50000000.00"
    },
    "muatDataDemo": false
  }
  ```
- **Proses di Backend**:
  1. Buat record `companies`, `branches` (Kantor Pusat), dan `warehouses` (Gudang Utama).
  2. Eksekusi fungsi template COA yang dipilih (`tanamCoaTrading(companyId)`).
  3. Buat rekening bank operasional yang terhubung ke akun kas/bank yang baru dibuat.
  4. Jika `muatDataDemo === true`, eksekusi `tanamDataDemo(companyId)`.
  5. Catat audit log dan kembalikan response sukses.

---

## 6. Perintah Eksekusi CLI

| Perintah | Deskripsi |
| :--- | :--- |
| `bun run db:reset` | Membersihkan seluruh data database (TRUNCATE CASCADE) dengan safeguard produksi. |
| `bun run db:seed` | Menanamkan data sistem wajib (Layer 1) + template COA dagang standar (Layer 2). |
| `bun run db:seed --demo` | Menanamkan data sistem wajib + template COA + data demo lengkap (Layer 3). |
| `bun run db:seed --clean` | Melakukan reset total database terlebih dahulu, lalu menanamkan seed bersih. |
| `bun run db:seed --clean --demo` | Melakukan reset total, lalu menanamkan data sistem + COA dagang + data demo lengkap. |

---

## 7. Akun Kredensial Login Bawaan (Default Demo Credentials)

Ketika menjalankan seeder dengan opsi demo (`--demo`), sistem otomatis membuat akun administrator siap pakai di Better Auth (`user` dan `account` ter-hash):

| Properti | Nilai Kredensial |
| :--- | :--- |
| **Halaman Login** | `/sign-in` |
| **Email** | `admin@elysia.co.id` |
| **Password** | `AdminElysia2026!` |
| **Nama Pengguna** | `Administrator Elysia` |
| **Peran Sistem** | `ADMIN` (Akses Penuh / Super Admin) |
| **Perusahaan Terkait** | `PT Elysia Niaga Nusantara` (Kantor Pusat SCBD) |

