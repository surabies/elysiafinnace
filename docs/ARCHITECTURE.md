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

| Tujuan       | Perintah                                                    |
| ------------ | ----------------------------------------------------------- |
| Type-check   | `bun run typecheck`                                         |
| Lint         | `bun run lint`                                              |
| Test         | `bun test ./tests` (butuh Postgres; `docker compose up -d`) |
| Migrasi baru | `bun run db:generate` lalu `bun run db:migrate`             |
| Seed         | `bun run db:seed`                                           |

## Standar Antarmuka & Frontend

### 1. Standar Ikon UI (Icon Library Policy)
- **HANYA gunakan `@tabler/icons-react`** di seluruh komponen proyek (sidebar, header, dialog, KPI card, dsb).
- **Dilarang keras** menggunakan `@iconify/react` atau `lucide-react` (kedua pustaka ini telah dihapus permanen dari dependencies).
- Setiap icon diimpor langsung sebagai komponen React (misal `IconLayoutDashboard`, `IconChevronDown`, `IconSearch`), mencegah overhead fetch SVG via network dan menjaga konsistensi visual stroke/size.

### 2. Standar Navigasi & Menu Sidebar
- Definisi URL halaman bersifat tersentralisasi di `src/components/layout/sidebar/routes.ts`.
- Pohon menu navigasi tersentralisasi di `src/components/layout/navigation/sidebar-menu.ts`.
- Struktur menu terbagi dalam 6 pilar fungsional (sinkron dengan backend M1–M14):
  1. **Utama:** Dasbor & Analytics
  2. **Transaksi:** Penjualan, Pembelian, Biaya Operasional, Kas & Bank
  3. **Operasional & Persediaan:** Persediaan & Multi-Gudang, Aset Tetap & Depresiasi
  4. **Akuntansi & Pajak:** COA & Jurnal, Dimensi Biaya, Anggaran, Tutup Buku, PPN & PPh
  5. **Laporan Enterprise:** Finansial, Subledger & Aging AR/AP, Dagang, Multi-Periode, Konsolidasi Holding
  6. **Otomasi & Sistem:** Transaksi Berulang, Pengingat Jatuh Tempo, API Key & Webhook, Profil & RBAC, Persetujuan, Kunci Tanggal, Audit Log, Diagnostik & Health Check
