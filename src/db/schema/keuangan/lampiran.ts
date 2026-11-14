import { index, integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { kolomAudit, kolomId, kolomWaktu } from "./_helper";

/**
 * Lampiran dokumen transaksi (bukti potong, struk pengeluaran, bukti transfer, scan invoice).
 */
export const documentAttachments = pgTable(
  "document_attachments",
  {
    id: kolomId(),
    tipeDokumen: varchar("tipe_dokumen", { length: 30 }).notNull(), // 'JURNAL', 'BIAYA', 'FAKTUR_PEMBELIAN', 'FAKTUR_PENJUALAN', 'MUTASI_BANK'
    dokumenId: uuid("dokumen_id").notNull(),
    namaFile: varchar("nama_file", { length: 255 }).notNull(),
    ukuranBytes: integer("ukuran_bytes").notNull().default(0),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    url: text("url").notNull(),
    keterangan: text("keterangan"),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_document_attachments_dokumen").on(t.tipeDokumen, t.dokumenId)],
);

export type LampiranDokumen = typeof documentAttachments.$inferSelect;
