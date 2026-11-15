# Cetak Biru & Spesifikasi Halaman Analytics (`/analytics`)
## Elysia Finance — Executive Business Intelligence & Risk Mitigation

> **Dokumen Perencanaan & Hasil Audit Backend**  
> Dibuat: 15 November 2026 | Milestone Terkait: **F6 (Business Intelligence & Executive Analytics)**  
> Tujuan: Menyediakan panduan komprehensif, arsitektur data, dan spesifikasi fungsional untuk pembangunan halaman `/analytics` agar manajemen dapat memantau pergerakan bisnis, tren profitabilitas, serta melakukan mitigasi risiko finansial secara proaktif.

---

## 1. Filosofi & Perbedaan Peran: Dashboard vs Analytics

Dalam sistem ERP kelas enterprise, halaman **Dashboard** dan halaman **Analytics** memiliki tujuan kognitif yang berbeda:

| Aspek | **Executive Dashboard** (`/dashboard`) | **Business Analytics** (`/analytics`) |
| :--- | :--- | :--- |
| **Pertanyaan Inti** | *"What is happening right now?"* (Apa yang sedang terjadi hari ini?) | *"Why is it happening, where is the risk, and what is next?"* (Mengapa terjadi, di mana risiko, dan apa proyeksi ke depan?) |
| **Fungsi Utama** | Denyut operasional harian (*operational pulse*), saldo kas terkini, notifikasi persetujuan, dan jurnal terbaru. | Diagnosa tren bisnis, dekomposisi margin, pemantauan siklus modal kerja, dan deteksi anomali. |
| **Horizon Waktu** | Hari ini, minggu ini, bulan berjalan. | Kuartal (QoQ), Semester, 12 Bulan (YoY), dan rentang komparatif multi-tahun. |
| **Tindakan Lanjutan** | Menyetujui transaksi, meninjau jurnal, membayar faktur jatuh tempo. | Menyesuaikan alokasi anggaran, restrukturisasi harga jual, renegosiasi termin pemasok, mitigasi stok mati. |

---

## 2. Hasil Audit Ketersediaan Data Backend

Seluruh modul backend Elysia Finance telah memiliki endpoint dan kueri SQL riil yang siap dikonsumsi langsung oleh halaman `/analytics` tanpa perlu mengubah skema database dasar:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          MODUL BACKEND ELYSIA FINANCE                                  │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ Modul Backend            │ Endpoint Kunci              │ Data Riil yang Dihasilkan     │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ laporan                  │ /dashboard-ringkasan        │ Tren kas, laba, pendapatan 12M│
│                          │ /laba-rugi-komparatif       │ Perbandingan performa periode │
│                          │ /neraca                     │ Posisi aset lancar & hutang   │
│                          │ /arus-kas                   │ Kas operasi, investasi, dana  │
│                          │ /aging-piutang              │ AR Aging bucket & risiko macet│
│                          │ /aging-hutang               │ AP Aging & jadwal pembayaran  │
│                          │ /penjualan/pelanggan        │ Rekap omset per pelanggan     │
│                          │ /penjualan/item             │ Kontribusi omset per item     │
│                          │ /pembelian/pemasok          │ Konsentrasi belanja vendor    │
│                          │ /konsolidasi-holding        │ Laporan multi-entitas anak    │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ penjualan                │ /penjualan/ringkasan        │ Tren penjualan & kanal omset  │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ pembelian                │ /pembelian/ringkasan        │ Tren pengadaan & top belanja  │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ inventori                │ /inventori-laporan/kartu-stok│ Pergerakan kuantitas & HPP   │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ anggaran & dimensi       │ /anggaran/laporan/realisasi │ Budget vs actual variance     │
│                          │ /anggaran/laporan/laba-rugi │ Laba rugi per cabang/proyek   │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ bank                     │ /rekening-bank              │ Saldo kas riil multi-rekening │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ payroll, pos, marketplace│ /payroll, /pos, /marketplace│ Beban SDM, POS & e-commerce   │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

---

## 3. Enam Pilar Analitik & Mitigasi Risiko Bisnis

Halaman `/analytics` dirancang dengan 6 pilar analitik terstruktur untuk memitigasi risiko bisnis secara menyeluruh:

### Pilar 1: Likuiditas, Arus Kas & Daya Tahan (Solvency & Runway)
* **Tujuan Mitigasi:** Mencegah krisis kehabisan kas mendadak dan menjamin solvabilitas operasional jangka pendek.
* **Metrik Utama:**
  1. **Cash Conversion Cycle (CCC):**
     $$\text{CCC} = \text{DSO (Hari Piutang)} + \text{DSI (Hari Gudang)} - \text{DPO (Hari Hutang)}$$
     Mengukur berapa lama uang perusahaan terkunci di rantai pasok sebelum kembali menjadi kas.
  2. **Monthly Net Cash Burn & Runway Estimator:**
     $$\text{Cash Runway (Bulan)} = \frac{\text{Total Saldo Kas \& Setara Kas}}{\text{Rata-rata Pengeluaran Bersih Kas Operasional}}$$
     Menampilkan status indikator: *Aman (>6 Bulan)*, *Waspada (3–6 Bulan)*, atau *Kritis (<3 Bulan)*.
  3. **Rasio Likuiditas Neraca:**
     - *Current Ratio* ($\text{Aset Lancar} / \text{Kewajiban Lancar}$): Ambang ideal $\ge 1.5$.
     - *Quick Ratio* ($(\text{Kas} + \text{Piutang}) / \text{Kewajiban Lancar}$): Ambang ideal $\ge 1.0$.

### Pilar 2: Dekomposisi Profitabilitas & Unit Economics
* **Tujuan Mitigasi:** Mendeteksi fenomena *"Omset Naik tapi Laba Bersih Turun"* akibat pembengkakan HPP atau beban operasional.
* **Metrik Utama:**
  1. **Waterfall Margin Bertingkat (Tren 12 Bulan):**
     - **Gross Profit Margin (GPM):** Efisiensi biaya produksi/pengadaan langsung.
     - **Operating Profit Margin (OPM):** Efisiensi tata kelola beban usaha operasional.
     - **Net Profit Margin (NPM):** Hasil akhir setelah beban bunga, pajak, dan pos non-operasional.
  2. **Pareto Analisis Beban Usaha (OPEX 80/20):**
     - Proporsi alokasi: Beban Gaji & Upah (dari modul `payroll`), Pemasaran, Sewa/Utilitas, Logistik, dan Administrasi Umum.
     - Rasio Beban Operasional terhadap Pendapatan (*OPEX-to-Revenue Ratio*).

### Pilar 3: Kualitas Pendapatan & Resiko Konsentrasi Pelanggan (Credit Risk)
* **Tujuan Mitigasi:** Mencegah ketergantungan fatal pada segelintir pelanggan dan memitigasi risiko gagal bayar (*Bad Debt*).
* **Metrik Utama:**
  1. **Customer Revenue Concentration (Analisis Resiko Pareto):**
     - Persentase total omset yang dikontribusikan oleh Top 5 dan Top 10 pelanggan.
     - *Early Warning:* Jika 1 pelanggan menguasai $>20\%$ total omset, diberikan tanda *High Concentration Risk*.
  2. **Days Sales Outstanding (DSO):**
     - Rata-rata hari yang dibutuhkan pelanggan untuk melunasi tagihan (target standar $<45$ hari).
  3. **Credit Limit Exposure:**
     - Pemantauan pelanggan yang akumulasi sisa tagihannya telah melampaui $>85\%$ atau $100\%$ dari plafon kredit yang disetujui (`limitKredit`).

### Pilar 4: Efisiensi Rantai Pasok & Modal Tertahan di Gudang (Inventory Risk)
* **Tujuan Mitigasi:** Mencegah modal kerja membeku menjadi stok mati (*Dead Stock*) dan memitigasi ketergantungan pada vendor tunggal.
* **Metrik Utama:**
  1. **Dead Stock & Slow Moving Capital Indicator:**
     - Total nilai rupiah dari barang yang tidak mengalami mutasi keluar selama $>60$ atau $>90$ hari.
     - Rekomendasi aksi: Bundling promo, diskon clearance, atau pembatasan pembelian ulang.
  2. **Inventory Turnover Ratio (ITO) & Days Sales of Inventory (DSI):**
     - Kecepatan perputaran stok barang menjadi penjualan.
  3. **Vendor Dependency (Konsentrasi Pemasok):**
     - Persentase belanja yang terpusat pada pemasok tertentu guna menghindari risiko kenaikan harga sepihak atau gangguan suplai.

### Pilar 5: Pengendalian & Disiplin Anggaran (Budget Variance)
* **Tujuan Mitigasi:** Mencegah kebocoran anggaran operasional sebelum tahun buku berakhir.
* **Metrik Utama:**
  1. **Budget vs Actual Variance (%):**
     - Realisasi belanja operasional dibandingkan dengan plafon anggaran per departemen.
  2. **Early Warning Over-Budget Alerts:**
     - Notifikasi otomatis untuk pos beban atau departemen yang telah menyerap $>90\%$ plafon sebelum kuartal berakhir.
  3. **Profit & Loss per Cabang / Unit Bisnis (Segment Reporting):**
     - Evaluasi kontribusi laba per cabang atau proyek melalui modul `dimensi`.

### Pilar 6: Analitika Multikanal & Omnichannel (Channel Economics)
* **Tujuan Mitigasi:** Menilai profitabilitas bersih per kanal distribusi untuk alokasi modal pemasaran yang optimal.
* **Metrik Utama:**
  1. **Perbandingan Kanal Penjualan:**
     - Direct B2B / Grosir vs POS Retail Kasir vs Marketplace (Shopee, Tokopedia, TikTok Shop).
  2. **Take Rate & Net Margin per Kanal:**
     - Pendapatan kotor dikurangi biaya admin/komisi e-commerce dan biaya promosi per kanal.

---

## 4. Rencana Tata Letak Komponen UI/UX (`/analytics`)

Halaman Analytics akan dibangun di dalam direktori `src/app/(dashboard)/analytics/` dengan struktur visual sebagai berikut:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Toolbar] Filter Periode (QTD / YTD / 12M / Custom) | Cabang / Konsolidasi | Export PDF │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Section 1: Solvency & Runway Bar]                                                     │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│ │ Cash Runway: 8 Bln│ │ Cash Conv Cycle:│ │ Net Margin: 18.4%│ │ Budget Health:   │    │
│ │ Status: Sehat    │ │ 34 Hari (DSO 42) │ │ Tren: +2.1% YoY  │ │ 82% Terserap     │    │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Section 2: Interactive Financial Trajectory & Margin Decomposition]                   │
│ • Grafik Area Komparatif 12 Bulan: Pendapatan vs HPP vs OPEX vs Laba Bersih            │
│ • Tab Toggle: Laba Rugi | Rasio Margin (GPM/OPM/NPM) | Arus Kas Operasional            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Section 3: Middle 2-Column Risk Radar]                                                │
│ ┌─────────────────────────────────────────┐ ┌────────────────────────────────────────┐ │
│ │ Kiri: Credit & AR Collection Risk       │ │ Kanan: Supply Chain & Dead Stock       │ │
│ │ • Konsentrasi Top 5 Pelanggan (Pareto)  │ │ • Modal Tertahan di Gudang (>60 hari)  │ │
│ │ • AR Overdue Meter (>30, >60, >90 hari) │ │ • Inventory Turnover Ratio (ITO)       │ │
│ │ • Plafon Kredit Mendekati Limit         │ │ • Top 3 Kategori Pengadaan Terbesar    │ │
│ └─────────────────────────────────────────┘ └────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Section 4: Bottom Operational Matrix]                                                 │
│ • Tabel Realisasi Anggaran per Departemen (Plafon vs Realisasi vs Sisa)                │
│ • Matriks Profitabilitas per Kanal Penjualan (Direct B2B vs POS vs E-Commerce)         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Rencana Tahapan Eksekusi (Implementation Roadmap)

1. **Fase 1 — Data Aggregator Server Function (`get-analytics-summary.ts`)**:
   - Memanggil secara paralel: `laporanLabaRugiKomparatif`, `laporanNeraca`, `laporanArusKas`, `laporanAgingPiutang`, `laporanAgingHutang`, `laporanAnggaranVsRealisasi`, dan `penjualan/ringkasan`.
   - Mengkalkulasi formula finansial standar (CCC, Runway, Margin Pct, Pareto %).
2. **Fase 2 — Komponen Visual Eksekutif**:
   - `analytics-header.tsx`: Filter periode & selektor cabang.
   - `solvency-runway-metrics.tsx`: 4 kartu metrik daya tahan kas.
   - `margin-trajectory-chart.tsx`: Grafik interaktif dekomposisi pendapatan & margin.
3. **Fase 3 — Komponen Mitigasi Risiko**:
   - `credit-risk-card.tsx`: Analisis konsentrasi pelanggan & umur piutang.
   - `inventory-risk-card.tsx`: Analisis modal kerja tertahan di gudang & turnover.
4. **Fase 4 — Komponen Pengendalian & Kanal**:
   - `budget-variance-table.tsx`: Monitoring serapan anggaran departemen.
   - `channel-performance-card.tsx`: Evaluasi laba bersih B2B vs POS vs Marketplace.
5. **Fase 5 — Verifikasi & Testing**:
   - `bun run typecheck`, `bun run lint`, dan `bun run build`.
