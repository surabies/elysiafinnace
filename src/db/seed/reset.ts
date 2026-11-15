import { sql } from "drizzle-orm";
import { db } from "@/db";

interface ResetOptions {
  /** Jika true, tabel Better Auth (user, session, account, verification) tidak dihapus */
  keepAuth?: boolean;
}

const TABEL_AUTH = new Set(["user", "session", "account", "verification", "invitations"]);

/**
 * Mengosongkan seluruh data di database menggunakan TRUNCATE ... RESTART IDENTITY CASCADE.
 * Struktur skema Drizzle, enum, indeks, dan tabel '__drizzle_migrations' TETAP AMAN.
 */
export async function resetDatabase(options: ResetOptions = {}) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "BAHAYA: Eksekusi reset database diblokir secara otomatis pada lingkungan PRODUCTION!"
    );
  }

  const startTime = Date.now();

  // Ambil seluruh nama tabel di skema public
  const queryResult = await db.execute<{ tablename: string }>(sql`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename != '__drizzle_migrations';
  `);

  const rows = (queryResult.rows || queryResult) as Array<{ tablename: string }>;
  const tableNames = rows
    .map((r) => r.tablename)
    .filter((name) => {
      if (options.keepAuth && TABEL_AUTH.has(name)) {
        return false;
      }
      return true;
    });

  if (tableNames.length === 0) {
    console.log("[db:reset] Tidak ada tabel yang ditemukan untuk di-truncate.");
    return;
  }

  console.log(`[db:reset] Mengosongkan ${tableNames.length} tabel...`);

  // Gabungkan seluruh tabel ke dalam satu perintah TRUNCATE CASCADE
  const quotedTables = tableNames.map((name) => `"${name}"`).join(", ");
  await db.execute(sql.raw(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE;`));

  const duration = Date.now() - startTime;
  console.log(`[db:reset] Berhasil mengosongkan seluruh data dalam ${duration}ms.`);
}

// Eksekusi langsung jika dipanggil via CLI: bun run src/db/seed/reset.ts
if (import.meta.main) {
  const keepAuth = process.argv.includes("--keep-auth");
  try {
    await resetDatabase({ keepAuth });
    process.exit(0);
  } catch (err) {
    console.error("[db:reset] Gagal:", err);
    process.exit(1);
  }
}
