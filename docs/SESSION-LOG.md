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
