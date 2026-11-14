# Production Runbook & Kesiapan Produksi — Elysia Finance ERP

> Dokumen panduan operasional, kesiapan produksi, observabilitas, strategi migrasi tanpa downtime, dan prosedur disaster recovery.

---

## 1. Arsitektur Produksi & Komponen Kunci

Elysia Finance dirancang untuk performa tinggi, isolasi multi-tenant yang aman, dan integritas double-entry yang ketat.

| Komponen | Implementasi | Peran & Skalabilitas |
| :--- | :--- | :--- |
| **API Server** | Elysia 1.4 (TypeBox JIT) | Rute REST secepat C++/Go dengan throughput 10x-20x framework Node standar. |
| **Database** | PostgreSQL 16+ (Drizzle ORM) | Penyimpanan transaksi ACID berpresisi tinggi (`numeric(18, 4)` & `numeric(18, 8)`). |
| **Connection Pooling** | Node-Postgres Pool / PgBouncer | Batas pool terkonfigurasi via `DATABASE_POOL_MAX` (default 5-20 per instance). |
| **Idempotensi** | Tabel `idempotency_keys` | Menjamin idempotensi POST transaksi finansial, aman terhadap retry jaringan. |
| **Audit Trail** | Tabel `audit_logs` | Jejak kronologis immutable untuk seluruh perubahan data bisnis. |
| **Health Check** | `/api/keuangan/produksi/health` | Diagnostik latensi DB ping, uptime, dan status heap memori. |

---

## 2. Idempotency Key (Pencegahan Transaksi Ganda)

Pada aplikasi finansial, gangguan jaringan atau timeout HTTP dapat memicu client melakukan retry otomatis. Jika tidak ditangani, retry dapat menghasilkan jurnal ganda atau faktur terduplikasi.

### Kontrak Penggunaan:
1. Client mengirim header HTTP `idempotency-key: <uuidv4>` pada setiap request transaksi (`POST`).
2. Server menghitung hash SHA-256 dari payload request body.
3. Jika request dengan key dan hash yang sama diterima kembali:
   - Server langsung mengembalikan respons yang sama yang tersimpan di DB.
   - Mengembalikan header `x-idempotent-replay: true`.
   - Logika bisnis (pembuatan jurnal/faktur) **TIDAK** dieksekusi ulang.
4. Jika payload berbeda dikirimkan dengan key yang sama, server melempar error `422 UNPROCESSABLE_ENTITY`.
5. Masa kedaluwarsa record idempotensi diatur 24 jam.

---

## 3. Strategi Migrasi Database Tanpa Downtime (Zero-Downtime)

Prinsip dasar: **Expand and Contract Pattern** (Never break backward compatibility).

### Aturan Eksekusi:
1. **Fase 1: Expand (Non-Breaking Changes)**
   - Menambah kolom baru dengan nilai `DEFAULT` atau `NULLable`.
   - Membuat tabel baru atau indeks baru secara koncurrent (`CREATE INDEX CONCURRENTLY`).
   - Kode aplikasi versi lama masih dapat berjalan tanpa error karena kolom lama tetap ada.
2. **Fase 2: Deploy Kode Aplikasi Baru**
   - Aplikasi baru mulai menulis dan membaca ke struktur baru.
   - Jika ada backfill data lama, jalankan via worker script background bertahap (batch size 1.000).
3. **Fase 3: Contract (Pembersihan Kolom/Tabel Usang)**
   - Setelah seluruh instance aplikasi berjalan pada versi baru minimal 24-48 jam, hapus kolom atau tabel lama melalui migrasi terpisah.

---

## 4. Strategi Backup & Disaster Recovery (DR)

### A. Cadangan Rutin (Automated Backups)
- **Snapshot Harian (pg_dump)**:
  ```bash
  pg_dump -Fc --no-acl --no-owner -h <host> -U <user> -d <dbname> > backup_$(date +%Y%m%d_%H%M%S).dump
  ```
- **Point-in-Time Recovery (PITR)**:
  - Aktifkan Write-Ahead Logging (WAL) archiving di cloud provider (Neon / AWS RDS / Supabase).
  - Retensi WAL minimal 7 hari untuk memungkinkan rollback ke detik spesifik saat terjadi human error.

### B. Prosedur Restorasi Cepat
```bash
# 1. Hentikan traffic masuk (aktifkan maintenance mode)
# 2. Buat database baru / target restore
createdb -h <host> -U <user> elysia_restore
# 3. Jalankan pg_restore dengan opsi parallel
pg_restore -v -j 4 -h <host> -U <user> -d elysia_restore backup_file.dump
# 4. Verifikasi koneksi dan arahkan DATABASE_URL
```

---

## 5. Observabilitas, Health Check & Alerting

### Endpoint Diagnostik:
- `GET /api/keuangan/produksi/health`:
  ```json
  {
    "success": true,
    "data": {
      "status": "OK",
      "waktu": "2026-11-14T14:30:00.000Z",
      "uptimeDetik": 86400,
      "database": {
        "status": "HEALTHY",
        "latensiMs": 1.45,
        "error": null
      },
      "memori": {
        "heapUsedMb": 64.2,
        "heapTotalMb": 98.5,
        "rssMb": 142.1
      },
      "lingkungan": "production"
    }
  }
  ```

### Ambang Batas Alerting (Thresholds):
- **Latensi Database**: > 250ms selama 3 interval berturut-turut $\to$ Peringatan Warning.
- **Tingkat Error HTTP 5xx**: > 1% dari total traffic dalam window 5 menit $\to$ Critical Alert (PagerDuty/Slack).
- **Kapasitas Koneksi Pool**: > 85% pool digunakan $\to$ Scale out worker atau naikkan batas pool.
