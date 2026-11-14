import { boolean, date, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu } from "./_helper";
import { partners } from "./kontak";

/**
 * Jadwal Transaksi Berulang (Faktur Penjualan, Faktur Pembelian, Biaya, Jurnal Umum).
 */
export const recurringTransactions = pgTable(
  "recurring_transactions",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    jenis: varchar("jenis", { length: 30 }).notNull(), // 'JURNAL' | 'FAKTUR_PENJUALAN' | 'FAKTUR_PEMBELIAN' | 'BIAYA'
    frekuensi: varchar("frekuensi", { length: 20 }).notNull(), // 'HARIAN' | 'MINGGUAN' | 'BULANAN' | 'TAHUNAN'
    tanggalMulai: date("tanggal_mulai", { mode: "string" }).notNull(),
    tanggalSelesai: date("tanggal_selesai", { mode: "string" }),
    tanggalBerikutnya: date("tanggal_berikutnya", { mode: "string" }).notNull(),
    /** Payload input pembuatan transaksi dalam format JSON */
    templatePayload: jsonb("template_payload").notNull(),
    aktif: kolomAktif(),
    totalDijalankan: integer("total_dijalankan").notNull().default(0),
    terakhirDipostingPada: timestamp("terakhir_diposting_pada", { withTimezone: true }),
    dokumenTerakhirId: text("dokumen_terakhir_id"),
    catatan: text("catatan"),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_recurring_transactions_jadwal").on(t.aktif, t.tanggalBerikutnya)],
);

/**
 * Log Eksekusi Transaksi Berulang.
 */
export const recurringExecutionLogs = pgTable(
  "recurring_execution_logs",
  {
    id: kolomId(),
    jadwalId: uuid("jadwal_id")
      .notNull()
      .references(() => recurringTransactions.id, { onDelete: "cascade" }),
    tanggalEksekusi: date("tanggal_eksekusi", { mode: "string" }).notNull(),
    sukses: boolean("sukses").notNull(),
    dokumenId: text("dokumen_id"),
    nomorDokumen: varchar("nomor_dokumen", { length: 50 }),
    pesan: text("pesan"),
    ...kolomWaktu,
  },
  (t) => [index("idx_recurring_logs_jadwal").on(t.jadwalId, t.dibuatPada)],
);

/**
 * Log Pengingat Jatuh Tempo (Due Date Email Reminders).
 */
export const reminderLogs = pgTable(
  "reminder_logs",
  {
    id: kolomId(),
    jenisDokumen: varchar("jenis_dokumen", { length: 30 }).notNull(), // 'FAKTUR_PENJUALAN' | 'FAKTUR_PEMBELIAN'
    dokumenId: text("dokumen_id").notNull(),
    nomorDokumen: varchar("nomor_dokumen", { length: 50 }).notNull(),
    kontakId: uuid("kontak_id")
      .notNull()
      .references(() => partners.id, { onDelete: "restrict" }),
    emailPenerima: varchar("email_penerima", { length: 255 }).notNull(),
    hariOffset: integer("hari_offset").notNull(), // -3 (H-3), 0 (Hari H), 7 (H+7 overdue)
    sisaTagihan: text("sisa_tagihan").notNull(),
    statusPengiriman: varchar("status_pengiriman", { length: 20 }).notNull().default("TERKIRIM"), // 'TERKIRIM' | 'GAGAL'
    kontenEmail: text("konten_email").notNull(),
    ...kolomWaktu,
  },
  (t) => [index("idx_reminder_logs_dokumen").on(t.dokumenId, t.hariOffset)],
);

/**
 * Kunci API untuk Akses Pihak Ketiga (API Keys).
 */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: kolomId(),
    nama: varchar("nama", { length: 100 }).notNull(),
    prefix: varchar("prefix", { length: 20 }).notNull(), // e.g. 'ef_live_xxxx'
    kunciHash: varchar("kunci_hash", { length: 128 }).notNull().unique(), // SHA-256
    /** Daftar izin/scopes yang diizinkan untuk API key ini */
    scopes: jsonb("scopes").notNull().$type<string[]>(),
    aktif: kolomAktif(),
    kedaluwarsaPada: timestamp("kedaluwarsa_pada", { withTimezone: true }),
    terakhirDigunakanPada: timestamp("terakhir_digunakan_pada", { withTimezone: true }),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_api_keys_hash").on(t.kunciHash, t.aktif)],
);

/**
 * Pendaftaran Webhook Pihak Ketiga.
 */
export const webhooks = pgTable(
  "webhooks",
  {
    id: kolomId(),
    nama: varchar("nama", { length: 100 }).notNull(),
    url: text("url").notNull(),
    secret: varchar("secret", { length: 64 }).notNull(), // HMAC secret
    /** Daftar event yang diikuti, e.g. ['faktur.posted', 'pembayaran.dibuat'] */
    events: jsonb("events").notNull().$type<string[]>(),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_webhooks_aktif").on(t.aktif)],
);

/**
 * Log Pengiriman Webhook.
 */
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: kolomId(),
    webhookId: uuid("webhook_id")
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    event: varchar("event", { length: 50 }).notNull(),
    payload: jsonb("payload").notNull(),
    statusHttp: integer("status_http"),
    sukses: boolean("sukses").notNull(),
    responsBody: text("respons_body"),
    waktuKirim: timestamp("waktu_kirim", { withTimezone: true }).notNull().defaultNow(),
    durasiMs: integer("durasi_ms").notNull().default(0),
    ...kolomWaktu,
  },
  (t) => [index("idx_webhook_deliveries_webhook").on(t.webhookId, t.dibuatPada)],
);

export type TransaksiBerulang = typeof recurringTransactions.$inferSelect;
export type LogEksekusiBerulang = typeof recurringExecutionLogs.$inferSelect;
export type LogPengingat = typeof reminderLogs.$inferSelect;
export type KunciApi = typeof apiKeys.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type PengirimanWebhook = typeof webhookDeliveries.$inferSelect;
