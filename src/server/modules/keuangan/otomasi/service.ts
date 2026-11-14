import crypto from "node:crypto";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import {
  apiKeys,
  partners,
  recurringExecutionLogs,
  recurringTransactions,
  reminderLogs,
  salesInvoices,
  webhookDeliveries,
  webhooks,
} from "@/db/schema/keuangan";
import { db } from "../shared/context";
import { nomorBerikut } from "../shared/transaction";
import { galat } from "@/server/core/errors";
import { simpanJurnal } from "../jurnal/engine";
import { buatFakturPenjualan, postingFakturPenjualan } from "../penjualan/service";
import { buatFakturPembelian, postingFakturPembelian } from "../pembelian/service";

// ==========================================
// 1. HELPER TANGGAL & FREKUENSI
// ==========================================

export function hitungTanggalBerikutnya(
  tanggalStr: string,
  frekuensi: "HARIAN" | "MINGGUAN" | "BULANAN" | "TAHUNAN",
): string {
  const [y, m, d] = tanggalStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));

  if (frekuensi === "HARIAN") {
    dt.setUTCDate(dt.getUTCDate() + 1);
  } else if (frekuensi === "MINGGUAN") {
    dt.setUTCDate(dt.getUTCDate() + 7);
  } else if (frekuensi === "BULANAN") {
    dt.setUTCMonth(dt.getUTCMonth() + 1);
  } else if (frekuensi === "TAHUNAN") {
    dt.setUTCFullYear(dt.getUTCFullYear() + 1);
  }

  const yr = dt.getUTCFullYear();
  const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const da = String(dt.getUTCDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

// ==========================================
// 2. TRANSAKSI BERULANG (RECURRING TRANSACTIONS)
// ==========================================

export async function buatJadwalTransaksiBerulang(
  input: {
    nama: string;
    jenis: "JURNAL" | "FAKTUR_PENJUALAN" | "FAKTUR_PEMBELIAN";
    frekuensi: "HARIAN" | "MINGGUAN" | "BULANAN" | "TAHUNAN";
    tanggalMulai: string;
    tanggalSelesai?: string;
    templatePayload: Record<string, unknown>;
    catatan?: string;
  },
  oleh: string,
) {
  return db.transaction(async (tx) => {
    const nomor = await nomorBerikut(tx, "REC", input.tanggalMulai);
    const [baru] = await tx
      .insert(recurringTransactions)
      .values({
        nomor,
        nama: input.nama.trim(),
        jenis: input.jenis,
        frekuensi: input.frekuensi,
        tanggalMulai: input.tanggalMulai,
        tanggalSelesai: input.tanggalSelesai ?? null,
        tanggalBerikutnya: input.tanggalMulai,
        templatePayload: input.templatePayload,
        catatan: input.catatan?.trim() ?? null,
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    return baru!;
  });
}

export async function daftarJadwalTransaksiBerulang(query?: { aktif?: boolean }) {
  const conditions = [];
  if (query?.aktif !== undefined) conditions.push(eq(recurringTransactions.aktif, query.aktif));

  return db
    .select()
    .from(recurringTransactions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(recurringTransactions.dibuatPada));
}

export async function ambilJadwalTransaksiBerulang(id: string) {
  const [jadwal] = await db
    .select()
    .from(recurringTransactions)
    .where(eq(recurringTransactions.id, id));
  if (!jadwal) throw galat.tidakDitemukan("Jadwal Transaksi Berulang");

  const riwayat = await db
    .select()
    .from(recurringExecutionLogs)
    .where(eq(recurringExecutionLogs.jadwalId, id))
    .orderBy(desc(recurringExecutionLogs.dibuatPada))
    .limit(50);

  return { ...jadwal, riwayat };
}

export async function ubahJadwalTransaksiBerulang(
  id: string,
  input: Partial<{
    nama: string;
    frekuensi: "HARIAN" | "MINGGUAN" | "BULANAN" | "TAHUNAN";
    tanggalSelesai: string | null;
    aktif: boolean;
    catatan: string | null;
  }>,
  oleh: string,
) {
  const [ubah] = await db
    .update(recurringTransactions)
    .set({
      ...input,
      diubahOleh: oleh,
      diubahPada: new Date(),
    })
    .where(eq(recurringTransactions.id, id))
    .returning();
  if (!ubah) throw galat.tidakDitemukan("Jadwal Transaksi Berulang");
  return ubah;
}

export async function eksekusiTransaksiBerulang(
  params: { perTanggal?: string; jadwalId?: string },
  oleh: string,
) {
  const perTanggal = params.perTanggal ?? new Date().toISOString().slice(0, 10);
  const conditions = [
    eq(recurringTransactions.aktif, true),
    lte(recurringTransactions.tanggalBerikutnya, perTanggal),
  ];
  if (params.jadwalId) conditions.push(eq(recurringTransactions.id, params.jadwalId));

  const antrean = await db
    .select()
    .from(recurringTransactions)
    .where(and(...conditions))
    .orderBy(asc(recurringTransactions.tanggalBerikutnya));

  const hasilEksekusi = [];

  for (const jadwal of antrean) {
    let sukses = true;
    let pesan = "Transaksi berhasil digenerate otomatis.";
    let dokumenId: string | null = null;
    let nomorDokumen: string | null = null;

    try {
      const payload = jadwal.templatePayload as Record<string, unknown>;

      if (jadwal.jenis === "JURNAL") {
        const jr = await db.transaction(async (tx) => {
          return simpanJurnal(
            tx,
            {
              tanggal: jadwal.tanggalBerikutnya,
              deskripsi: `[Otomatis] ${jadwal.nama} - ${jadwal.tanggalBerikutnya}`,
              sumber: "MANUAL",
              posting: true,
              baris: payload.baris as never,
              mataUangId: payload.mataUangId as string,
              kurs: (payload.kurs as string) ?? "1",
            },
            oleh,
          );
        });
        dokumenId = jr.id;
        nomorDokumen = jr.nomor;
      } else if (jadwal.jenis === "FAKTUR_PENJUALAN") {
        const inputInv = {
          ...payload,
          tanggal: jadwal.tanggalBerikutnya,
          tanggalJatuhTempo: payload.tanggalJatuhTempo ?? jadwal.tanggalBerikutnya,
        };
        const inv = await buatFakturPenjualan(inputInv as never, oleh);
        const posted = await postingFakturPenjualan(inv.id, oleh);
        dokumenId = posted.id;
        nomorDokumen = posted.nomor;
      } else if (jadwal.jenis === "FAKTUR_PEMBELIAN") {
        const inputBill = {
          ...payload,
          tanggal: jadwal.tanggalBerikutnya,
          tanggalJatuhTempo: payload.tanggalJatuhTempo ?? jadwal.tanggalBerikutnya,
        };
        const bill = await buatFakturPembelian(inputBill as never, oleh);
        const posted = await postingFakturPembelian(bill.id, oleh);
        dokumenId = posted.id;
        nomorDokumen = posted.nomor;
      }

      // Hitung jadwal berikutnya
      const tglBerikutnya = hitungTanggalBerikutnya(
        jadwal.tanggalBerikutnya,
        jadwal.frekuensi as "HARIAN" | "MINGGUAN" | "BULANAN" | "TAHUNAN",
      );
      const sudahSelesai =
        jadwal.tanggalSelesai && tglBerikutnya > jadwal.tanggalSelesai ? true : false;

      await db
        .update(recurringTransactions)
        .set({
          tanggalBerikutnya: tglBerikutnya,
          totalDijalankan: jadwal.totalDijalankan + 1,
          terakhirDipostingPada: new Date(),
          dokumenTerakhirId: dokumenId,
          aktif: sudahSelesai ? false : true,
          diubahOleh: oleh,
          diubahPada: new Date(),
        })
        .where(eq(recurringTransactions.id, jadwal.id));
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      sukses = false;
      pesan = `Gagal eksekusi: ${errObj?.message ?? String(err)}`;
    }

    // Catat riwayat eksekusi
    const [log] = await db
      .insert(recurringExecutionLogs)
      .values({
        jadwalId: jadwal.id,
        tanggalEksekusi: jadwal.tanggalBerikutnya,
        sukses,
        dokumenId,
        nomorDokumen,
        pesan,
      })
      .returning();

    // Picu webhook jika berhasil
    if (sukses) {
      kirimWebhook("transaksi.berulang.dieksekusi", {
        jadwalId: jadwal.id,
        jenis: jadwal.jenis,
        dokumenId,
        nomorDokumen,
        tanggal: jadwal.tanggalBerikutnya,
      }).catch(() => {});
    }

    hasilEksekusi.push(log!);
  }

  return {
    totalDiproses: antrean.length,
    hasil: hasilEksekusi,
  };
}

// ==========================================
// 3. PENGINGAT JATUH TEMPO (DUE DATE REMINDERS)
// ==========================================

export async function prosesPengingatJatuhTempo(params: {
  perTanggal: string;
  offsetsHari?: number[];
}) {
  const perTanggal = params.perTanggal;
  const offsets = params.offsetsHari ?? [-3, 0, 7]; // H-3, Hari H, H+7 (overdue)
  const MS_PER_DAY = 1000 * 3600 * 24;
  const tRef = new Date(perTanggal).getTime();

  // 1. Ambil faktur penjualan belum lunas
  const openSales = await db
    .select({
      id: salesInvoices.id,
      nomor: salesInvoices.nomor,
      tanggalJatuhTempo: salesInvoices.tanggalJatuhTempo,
      sisaTagihan: salesInvoices.sisaTagihan,
      pelangganId: salesInvoices.pelangganId,
      pelangganNama: partners.nama,
      pelangganEmail: partners.npwp, // NPWP or contact email placeholder
    })
    .from(salesInvoices)
    .innerJoin(partners, eq(salesInvoices.pelangganId, partners.id))
    .where(and(eq(salesInvoices.status, "POSTED")));

  const logsTerkirim = [];

  for (const inv of openSales) {
    if (Number(inv.sisaTagihan) <= 0) continue;
    const tJt = new Date(inv.tanggalJatuhTempo).getTime();
    const selisihHari = Math.round((tRef - tJt) / MS_PER_DAY);

    // Cek apakah selisih hari ini cocok dengan target offset
    if (offsets.includes(selisihHari)) {
      // Cek apakah reminder untuk dokumen + offset ini sudah pernah dikirim
      const [pernahKirim] = await db
        .select()
        .from(reminderLogs)
        .where(
          and(
            eq(reminderLogs.dokumenId, inv.id),
            eq(reminderLogs.hariOffset, selisihHari),
          ),
        );

      if (pernahKirim) continue; // Jangan kirim ganda

      const emailTujuan = "finance@" + inv.pelangganNama.toLowerCase().replace(/\s+/g, "") + ".com";
      const statusPesan =
        selisihHari < 0
          ? `PEMBERITAHUAN: Faktur ${inv.nomor} akan jatuh tempo dalam ${Math.abs(selisihHari)} hari.`
          : selisihHari === 0
            ? `PEMBERITAHUAN: Faktur ${inv.nomor} jatuh tempo HARI INI.`
            : `PERINGATAN TUNGGAKAN: Faktur ${inv.nomor} telah terlambat ${selisihHari} hari.`;

      const kontenEmail = `
Kepada Yth. ${inv.pelangganNama},

${statusPesan}
Nomor Faktur: ${inv.nomor}
Tanggal Jatuh Tempo: ${inv.tanggalJatuhTempo}
Sisa Tagihan: Rp ${Number(inv.sisaTagihan).toLocaleString("id-ID")}

Mohon segera melakukan konfirmasi pembayaran ke rekening perusahaan kami.
Terima kasih atas kerja samanya.

Salam,
Departemen Keuangan Elysia Finance
      `.trim();

      const [log] = await db
        .insert(reminderLogs)
        .values({
          jenisDokumen: "FAKTUR_PENJUALAN",
          dokumenId: inv.id,
          nomorDokumen: inv.nomor,
          kontakId: inv.pelangganId,
          emailPenerima: emailTujuan,
          hariOffset: selisihHari,
          sisaTagihan: inv.sisaTagihan,
          statusPengiriman: "TERKIRIM",
          kontenEmail,
        })
        .returning();

      kirimWebhook("pengingat.jatuh_tempo.terkirim", {
        dokumenId: inv.id,
        nomorDokumen: inv.nomor,
        pelanggan: inv.pelangganNama,
        hariOffset: selisihHari,
      }).catch(() => {});

      logsTerkirim.push(log!);
    }
  }

  return {
    perTanggal,
    totalPengingatTerkirim: logsTerkirim.length,
    daftarLog: logsTerkirim,
  };
}

export async function daftarLogPengingat(dokumenId?: string) {
  const conds = [];
  if (dokumenId) conds.push(eq(reminderLogs.dokumenId, dokumenId));
  return db
    .select()
    .from(reminderLogs)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(reminderLogs.dibuatPada))
    .limit(100);
}

// ==========================================
// 4. API KEYS (INTEGRASI PIHAK KETIGA)
// ==========================================

export async function buatApiKey(
  input: {
    nama: string;
    scopes: string[];
    kedaluwarsaHari?: number;
  },
  oleh: string,
) {
  const rawKey = `ef_live_${crypto.randomBytes(24).toString("hex")}`;
  const kunciHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const prefix = rawKey.slice(0, 12);

  const kedaluwarsaPada = input.kedaluwarsaHari
    ? new Date(Date.now() + input.kedaluwarsaHari * 24 * 3600 * 1000)
    : null;

  const [baru] = await db
    .insert(apiKeys)
    .values({
      nama: input.nama.trim(),
      prefix,
      kunciHash,
      scopes: input.scopes,
      kedaluwarsaPada,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();

  return {
    ...baru!,
    /** Kunci rahasia mentah HANYA ditampilkan sekali saat pembuatan */
    kunciRahasia: rawKey,
  };
}

export async function daftarApiKey() {
  return db
    .select({
      id: apiKeys.id,
      nama: apiKeys.nama,
      prefix: apiKeys.prefix,
      scopes: apiKeys.scopes,
      aktif: apiKeys.aktif,
      kedaluwarsaPada: apiKeys.kedaluwarsaPada,
      terakhirDigunakanPada: apiKeys.terakhirDigunakanPada,
      dibuatPada: apiKeys.dibuatPada,
    })
    .from(apiKeys)
    .orderBy(desc(apiKeys.dibuatPada));
}

export async function cabutApiKey(id: string, oleh: string) {
  const [ubah] = await db
    .update(apiKeys)
    .set({ aktif: false, diubahOleh: oleh, diubahPada: new Date() })
    .where(eq(apiKeys.id, id))
    .returning();
  if (!ubah) throw galat.tidakDitemukan("API Key");
  return ubah;
}

export async function verifikasiApiKey(rawKey: string) {
  if (!rawKey || !rawKey.startsWith("ef_live_")) return null;
  const kunciHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const [ak] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.kunciHash, kunciHash), eq(apiKeys.aktif, true)));

  if (!ak) return null;
  if (ak.kedaluwarsaPada && new Date() > ak.kedaluwarsaPada) return null;

  // Update last used asynchronously
  db.update(apiKeys)
    .set({ terakhirDigunakanPada: new Date() })
    .where(eq(apiKeys.id, ak.id))
    .catch(() => {});

  return ak;
}

// ==========================================
// 5. WEBHOOKS (EVENT DRIVEN INTEGRATION)
// ==========================================

export async function buatWebhook(
  input: {
    nama: string;
    url: string;
    events: string[];
  },
  oleh: string,
) {
  const secret = crypto.randomBytes(32).toString("hex");
  const [baru] = await db
    .insert(webhooks)
    .values({
      nama: input.nama.trim(),
      url: input.url.trim(),
      secret,
      events: input.events,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();

  return baru!;
}

export async function daftarWebhook() {
  return db.select().from(webhooks).orderBy(desc(webhooks.dibuatPada));
}

export async function ubahWebhook(
  id: string,
  input: Partial<{
    nama: string;
    url: string;
    events: string[];
    aktif: boolean;
  }>,
  oleh: string,
) {
  const [ubah] = await db
    .update(webhooks)
    .set({
      ...input,
      diubahOleh: oleh,
      diubahPada: new Date(),
    })
    .where(eq(webhooks.id, id))
    .returning();
  if (!ubah) throw galat.tidakDitemukan("Webhook");
  return ubah;
}

export async function hapusWebhook(id: string) {
  const [hapus] = await db.delete(webhooks).where(eq(webhooks.id, id)).returning();
  if (!hapus) throw galat.tidakDitemukan("Webhook");
  return { berhasil: true, id };
}

export async function kirimWebhook(event: string, payload: unknown) {
  const activeHooks = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.aktif, true));

  const eligible = activeHooks.filter(
    (wh) => wh.events.includes(event) || wh.events.includes("*"),
  );

  const payloadStr = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  const promises = eligible.map(async (wh) => {
    const t0 = Date.now();
    const signature = crypto
      .createHmac("sha256", wh.secret)
      .update(payloadStr)
      .digest("hex");

    let sukses = false;
    let statusHttp = 0;
    let responsBody = "";

    try {
      // Jika url testing atau localhost tanpa server penerima nyata, tangani graceful
      const res = await fetch(wh.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-elysia-event": event,
          "x-elysia-signature": signature,
        },
        body: payloadStr,
        signal: AbortSignal.timeout(5000),
      });
      statusHttp = res.status;
      responsBody = (await res.text()).slice(0, 1000);
      sukses = res.ok;
    } catch (err: unknown) {
      statusHttp = 0;
      const errObj = err as { message?: string };
      responsBody = `Network Error: ${errObj?.message ?? String(err)}`;
      sukses = false;
    }

    const durasiMs = Date.now() - t0;

    await db.insert(webhookDeliveries).values({
      webhookId: wh.id,
      event,
      payload: JSON.parse(payloadStr),
      statusHttp,
      sukses,
      responsBody,
      durasiMs,
    });
  });

  await Promise.allSettled(promises);
}
