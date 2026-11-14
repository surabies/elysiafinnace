import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { kolomId, kolomWaktu } from "./_helper";

/**
 * Penyimpanan Idempotency Key untuk pencegahan eksekusi ganda pada POST transaksi finansial.
 */
export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: kolomId(),
    kunci: varchar("kunci", { length: 128 }).notNull().unique(),
    penggunaId: text("pengguna_id"),
    metode: varchar("metode", { length: 10 }).notNull(), // 'POST', 'PUT', etc.
    path: text("path").notNull(),
    /** SHA-256 hash dari body request untuk memastikan muatan request identik */
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    statusHttp: integer("status_http").notNull(),
    responseBody: text("response_body").notNull(),
    kedaluwarsaPada: timestamp("kedaluwarsa_pada", { withTimezone: true }).notNull(),
    ...kolomWaktu,
  },
  (t) => [
    index("idx_idempotency_kunci").on(t.kunci),
    index("idx_idempotency_kedaluwarsa").on(t.kedaluwarsaPada),
  ],
);

export type IdempotencyRecord = typeof idempotencyKeys.$inferSelect;
