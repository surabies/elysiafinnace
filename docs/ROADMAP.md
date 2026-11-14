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

| ID  | Milestone                                           | Status                 |
| --- | --------------------------------------------------- | ---------------------- |
| M0  | Fondasi & restrukturisasi backend                   | in-progress            |
| M1  | Master data & multi-currency                        | done                   |
| M2  | Jurnal, buku besar, biaya                           | done                   |
| M3  | Kas & bank (mutasi, transfer, rekonsiliasi)         | done                   |
| M4  | Pembelian (AP)                                      | done                   |
| M5  | Penjualan (AR)                                      | done                   |
| M6  | Pembayaran & alokasi, uang muka, selisih kurs       | done                   |
| M7  | Inventori lanjutan (multi-gudang, transfer, opname) | done                   |
| M8  | Pajak Indonesia (PPN, PPh, e-Faktur/Coretax)        | done                   |
| M9  | Aset tetap & penyusutan                             | done                   |
| M10 | Anggaran & dimensi (cabang/departemen/proyek)       | done                   |
| M11 | RBAC penuh, multi-perusahaan, audit log, approval   | done                   |
| M12 | Laporan enterprise & ekspor                         | done                   |
| M13 | Otomasi (recurring, reminder, import/ekspor data)   | done                   |
| M14 | Produksi: keamanan, performa, observabilitas, test  | done                   |

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
