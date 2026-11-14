import crypto from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { idempotencyKeys } from "@/db/schema/keuangan";
import { db } from "../shared/context";

export async function periksaIdempotency(
  kunci: string,
  metode: string,
  path: string,
  body: unknown,
) {
  const requestHash = crypto
    .createHash("sha256")
    .update(typeof body === "string" ? body : JSON.stringify(body ?? {}))
    .digest("hex");

  const [existing] = await db
    .select()
    .from(idempotencyKeys)
    .where(
      and(
        eq(idempotencyKeys.kunci, kunci),
        gt(idempotencyKeys.kedaluwarsaPada, new Date()),
      ),
    );

  if (existing) {
    if (existing.requestHash !== requestHash) {
      throw new Error(
        `Idempotency-Key '${kunci}' telah digunakan untuk request berbeda (hash payload tidak cocok).`,
      );
    }
    return {
      replay: true,
      statusHttp: existing.statusHttp,
      responseBody: JSON.parse(existing.responseBody),
    };
  }

  return {
    replay: false,
    requestHash,
  };
}

export async function simpanIdempotency(
  kunci: string,
  penggunaId: string | null,
  metode: string,
  path: string,
  requestHash: string,
  statusHttp: number,
  responseBody: unknown,
  retensiJam = 24,
) {
  const kedaluwarsaPada = new Date(Date.now() + retensiJam * 3600 * 1000);

  await db
    .insert(idempotencyKeys)
    .values({
      kunci,
      penggunaId,
      metode,
      path,
      requestHash,
      statusHttp,
      responseBody: JSON.stringify(responseBody),
      kedaluwarsaPada,
    })
    .onConflictDoNothing();
}
