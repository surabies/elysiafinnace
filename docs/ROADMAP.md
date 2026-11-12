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
| M1  | Master data & multi-currency                        | done (perlu hardening) |
| M2  | Jurnal, buku besar, biaya                           | done (perlu hardening) |
| M3  | Kas & bank (mutasi, transfer, rekonsiliasi)         | todo                   |
| M4  | Pembelian (AP)                                      | todo                   |
| M5  | Penjualan (AR)                                      | todo                   |
| M6  | Pembayaran & alokasi, uang muka, selisih kurs       | todo                   |
| M7  | Inventori lanjutan (multi-gudang, transfer, opname) | todo                   |
| M8  | Pajak Indonesia (PPN, PPh, e-Faktur/Coretax)        | todo                   |
| M9  | Aset tetap & penyusutan                             | todo                   |
| M10 | Anggaran & dimensi (cabang/departemen/proyek)       | todo                   |
| M11 | RBAC penuh, multi-perusahaan, audit log, approval   | todo                   |
| M12 | Laporan enterprise & ekspor                         | todo                   |
| M13 | Otomasi (recurring, reminder, import/ekspor data)   | todo                   |
| M14 | Produksi: keamanan, performa, observabilitas, test  | todo                   |

---

## M0 — Fondasi & restrukturisasi backend

- [x] Struktur modul Elysia `modules/<fitur>/{index,service,model}.ts` (lihat ARCHITECTURE.md)
- [x] Root layout Next dipisah dari layout `(site)` / `(dashboard)` / `(auth)`
- [x] ESLint & `tsc` bersih di `src/server`
- [ ] Pecah `modules/keuangan/shared/common.ts` → `errors.ts`, `response.ts`, `pagination.ts`, `access.ts`
- [ ] Satukan sistem error: `core/errors.ts` (`ApiError`) vs `GalatAplikasi` → satu kelas
- [x] Konvensi response seragam `{ success, data, meta }` / `{ success:false, error }` + OpenAPI di `/api/openapi`
- [ ] **blocked** Test harness DB: port default diperbaiki (5432), tapi Docker daemon tidak berjalan di mesin dev ? jalankan Docker Desktop + `docker compose up -d db`, lalu `bun test`
- [x] Modul `system/echo` DIPERTAHANKAN � masih dipakai halaman playground & e2e

## M1 — Master data & multi-currency

- [x] Mata uang + kurs historis, mata uang dasar
- [x] COA hierarkis + `normal_balance` + peran sistem
- [x] Kontak (pelanggan/pemasok) + termin pembayaran
- [x] Item, kategori, satuan
- [x] Rekening kas/bank terhubung COA
- [ ] Kontak: multi-alamat, multi-kontak person, batas kredit, NPWP/NIK, grup kontak
- [ ] Item: multi-satuan + konversi, harga jual bertingkat (price list), barcode, item jasa/non-stok/bundel
- [ ] Revaluasi kurs akhir periode (unrealized gain/loss)
- [ ] Import master data via CSV (COA, kontak, item, saldo awal)
- [ ] Saldo awal (opening balance) akun, piutang, hutang, stok

## M2 — Jurnal, buku besar, biaya

- [x] Jurnal draft/posting/balik + validasi debit = kredit
- [x] Buku besar, biaya, tutup periode bulanan
- [ ] Neraca saldo (trial balance) + worksheet penyesuaian
- [ ] Jurnal berulang (recurring) & template jurnal
- [ ] Lampiran dokumen pada jurnal/biaya
- [ ] Tutup buku akhir tahun → Laba Ditahan (tabel `year_end_closings` sudah ada)

## M3 — Kas & bank

- [ ] API transaksi bank: kas masuk, kas keluar, transfer antar-rekening (tabel `bank_transactions` ada)
- [ ] Rekonsiliasi bank: import mutasi (CSV), pencocokan otomatis/manual (tabel `bank_reconciliations` ada)
- [ ] Biaya admin/bunga bank, transfer beda mata uang
- [ ] Laporan: mutasi rekening, rekonsiliasi

## M4 — Pembelian (AP)

- [ ] Permintaan pembelian (opsional) → Pesanan Pembelian (PO) → Penerimaan Barang → Faktur Pembelian
- [ ] Posting faktur: Dr Persediaan/Beban + PPN Masukan, Cr Hutang Usaha
- [ ] Retur pembelian / nota debit
- [ ] Uang muka pemasok
- [ ] Status dokumen: draft/terbuka/sebagian/lunas/batal

## M5 — Penjualan (AR)

- [ ] Penawaran (quotation) → Pesanan Penjualan (SO) → Pengiriman → Faktur Penjualan
- [ ] Posting faktur: Dr Piutang, Cr Pendapatan Penjualan + PPN Keluaran; Dr HPP, Cr Persediaan (rata-rata)
- [ ] Diskon per baris & per faktur, ongkir, biaya lain
- [ ] Retur penjualan / nota kredit
- [ ] Uang muka pelanggan, batas kredit pelanggan

## M6 — Pembayaran

- [ ] Penerimaan pelanggan & pembayaran pemasok (tabel `payments`, `payment_allocations` ada)
- [ ] Alokasi ke banyak faktur, pembayaran sebagian, potongan pelunasan
- [ ] Selisih kurs terealisasi otomatis
- [ ] Giro/cek mundur (opsional)

## M7 — Inventori lanjutan

- [ ] Gudang (multi-lokasi) + stok per gudang (ubah skema `item_stocks`)
- [ ] Transfer antar gudang, stok opname, penyesuaian stok (API)
- [ ] Metode penilaian: rata-rata (ada) + FIFO
- [ ] Nomor seri / batch & kedaluwarsa, stok minimum & reorder
- [ ] Rakitan/produksi sederhana (Bill of Materials)
- [ ] Laporan: kartu stok, nilai persediaan, pergerakan stok

## M8 — Pajak Indonesia

- [ ] Master pajak (PPN 11/12%, DPP nilai lain, PPh 21/22/23/4(2)/15), pajak majemuk per baris
- [ ] PPN masukan/keluaran, PPh dipotong/dipungut, bukti potong
- [ ] Nomor seri faktur pajak, ekspor e-Faktur/Coretax (CSV/XML)
- [ ] Laporan rekap PPN (SPT Masa), daftar bukti potong

## M9 — Aset tetap

- [ ] Registrasi aset, kategori aset (akun aset, akumulasi, beban penyusutan)
- [ ] Metode: garis lurus, saldo menurun; masa manfaat sesuai golongan fiskal
- [ ] Posting penyusutan bulanan (batch), pelepasan/penjualan aset (laba/rugi)
- [ ] Laporan daftar aset & penyusutan

## M10 — Anggaran & dimensi

- [ ] Dimensi: cabang, departemen, proyek, tag pada baris jurnal & dokumen
- [ ] Anggaran per akun/periode/dimensi; Anggaran vs Realisasi
- [ ] Laporan laba-rugi per proyek/cabang

## M11 — RBAC, multi-perusahaan, kontrol

- [ ] API kelola peran, izin, penugasan pengguna (tabel `roles`, `role_permissions`, `user_roles` ada)
- [ ] Multi-perusahaan (tenant): `company_id` di semua tabel bisnis + isolasi query
- [ ] Undang pengguna, batasi akses per cabang/gudang
- [ ] Audit log (siapa, apa, kapan, sebelum/sesudah)
- [ ] Alur persetujuan (approval) bertingkat per jenis dokumen & nominal
- [ ] Kunci tanggal transaksi (lock date)

## M12 — Laporan enterprise

- [x] Neraca, laba-rugi, arus kas (dasar)
- [ ] Perubahan ekuitas, neraca saldo, buku besar pembantu piutang/hutang
- [ ] Umur piutang/hutang (aging), laporan penjualan/pembelian per pelanggan/pemasok/item
- [ ] Laporan perbandingan (periode vs periode), konsolidasi multi-perusahaan
- [ ] Ekspor PDF/Excel, cetak dokumen (faktur, PO) dengan template

## M13 — Otomasi

- [ ] Transaksi berulang (faktur, biaya, jurnal)
- [ ] Pengingat jatuh tempo via email
- [ ] Webhook & API key untuk integrasi pihak ketiga

## M14 — Kesiapan produksi

- [ ] Idempotency key untuk POST transaksi
- [ ] Rate limit per pengguna, validasi input menyeluruh
- [ ] Indeks DB untuk laporan, paginasi cursor, materialized saldo bila perlu
- [ ] Logging terstruktur + tracing, health check DB
- [ ] Test integrasi per modul (aturan double-entry, stok, kurs) + e2e
- [ ] Backup & strategi migrasi tanpa downtime
