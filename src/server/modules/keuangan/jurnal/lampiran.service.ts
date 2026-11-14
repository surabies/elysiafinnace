import { and, desc, eq } from "drizzle-orm";
import { documentAttachments } from "@/db/schema/keuangan";
import { db } from "../shared/context";
import { galat } from "@/server/core/errors";
import { nullJikaKosong } from "../shared/text";
import type { InputSimpanLampiran } from "./lampiran.model";

export async function daftarLampiran(tipeDokumen: string, dokumenId: string) {
  return db
    .select()
    .from(documentAttachments)
    .where(and(eq(documentAttachments.tipeDokumen, tipeDokumen), eq(documentAttachments.dokumenId, dokumenId)))
    .orderBy(desc(documentAttachments.dibuatPada));
}

export async function tambahLampiran(tipeDokumen: string, dokumenId: string, input: InputSimpanLampiran, oleh: string) {
  const [baru] = await db
    .insert(documentAttachments)
    .values({
      tipeDokumen,
      dokumenId,
      namaFile: input.namaFile.trim(),
      ukuranBytes: input.ukuranBytes ?? 0,
      mimeType: input.mimeType.trim(),
      url: input.url.trim(),
      keterangan: nullJikaKosong(input.keterangan),
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();

  return baru!;
}

export async function hapusLampiran(id: string) {
  const [dihapus] = await db.delete(documentAttachments).where(eq(documentAttachments.id, id)).returning();
  if (!dihapus) throw galat.tidakDitemukan("Lampiran dokumen");
  return { id };
}
