import { boolean, index, pgTable, primaryKey, text, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "../auth";
import { kolomAudit, kolomId, kolomWaktu } from "./_helper";

/**
 * RBAC (Role-Based Access Control) modul keuangan.
 *
 *  roles             : peran, mis. ADMIN, AKUNTAN, KASIR, AUDITOR.
 *  role_permissions  : izin yang dimiliki sebuah peran (kode izin dari KATALOG_IZIN).
 *  user_roles        : peran yang dimiliki pengguna Better-Auth.
 *
 * Kode izin disimpan sebagai teks (bukan enum DB) agar katalog izin bisa
 * bertambah tanpa migrasi; validasi dilakukan di lapisan API.
 */
export const roles = pgTable("roles", {
  id: kolomId(),
  kode: varchar("kode", { length: 50 }).notNull().unique(),
  nama: varchar("nama", { length: 100 }).notNull(),
  keterangan: text("keterangan"),
  /** Peran dengan akses penuh otomatis memiliki seluruh izin. */
  aksesPenuh: boolean("akses_penuh").notNull().default(false),
  /** Peran bawaan sistem tidak boleh dihapus. */
  adalahSistem: boolean("adalah_sistem").notNull().default(false),
  ...kolomAudit,
  ...kolomWaktu,
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    peranId: uuid("peran_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    izin: varchar("izin", { length: 100 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.peranId, t.izin], name: "pk_role_permissions" })],
);

export const userRoles = pgTable(
  "user_roles",
  {
    penggunaId: text("pengguna_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    peranId: uuid("peran_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    dibuatOleh: text("dibuat_oleh"),
    dibuatPada: kolomWaktu.dibuatPada,
  },
  (t) => [
    primaryKey({ columns: [t.penggunaId, t.peranId], name: "pk_user_roles" }),
    index("idx_user_roles_peran").on(t.peranId),
  ],
);

export type Peran = typeof roles.$inferSelect;
