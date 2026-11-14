import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  partners,
  salesInvoices,
  taxInvoiceRanges,
  taxInvoices,
  taxes,
  withholdingTaxSlips,
  type AlokasiNsfp,
  type BuktiPotong,
  type FakturPajak,
  type JenisBupot,
  type JenisFakturPajak,
  type KategoriPajak,
  type Pajak,
  type StatusBupot,
  type StatusFakturPajak,
  type TipePajak,
} from "@/db/schema/keuangan";
import { galat } from "@/server/core/errors";
import { keBigInt, keString } from "../shared/decimal";

// ==========================================
// 1. MASTER DATA PAJAK
// ==========================================

export async function daftarPajak(query: {
  q?: string;
  tipe?: TipePajak;
  kategori?: KategoriPajak;
  aktif?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query.q) {
    conditions.push(or(ilike(taxes.kode, `%${query.q}%`), ilike(taxes.nama, `%${query.q}%`)));
  }
  if (query.tipe) conditions.push(eq(taxes.tipePajak, query.tipe));
  if (query.kategori) conditions.push(eq(taxes.kategoriPajak, query.kategori));
  if (query.aktif !== undefined) conditions.push(eq(taxes.aktif, query.aktif));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taxes)
    .where(whereClause);

  const rows = await db
    .select()
    .from(taxes)
    .where(whereClause)
    .orderBy(taxes.kode)
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    total: totalRows?.count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((totalRows?.count ?? 0) / limit),
  };
}

export async function ambilPajak(id: string): Promise<Pajak> {
  const [row] = await db.select().from(taxes).where(eq(taxes.id, id));
  if (!row) throw galat.tidakDitemukan(`Data pajak dengan ID ${id}`);
  return row;
}

export async function buatPajak(
  input: Omit<typeof taxes.$inferInsert, "id" | "dibuatPada" | "diubahPada">,
  penggunaId: string,
): Promise<Pajak> {
  const [existing] = await db.select().from(taxes).where(eq(taxes.kode, input.kode));
  if (existing) throw galat.sudahAda(`Pajak dengan kode '${input.kode}' sudah terdaftar.`);

  const [row] = await db
    .insert(taxes)
    .values({
      ...input,
      dibuatOleh: penggunaId,
      diubahOleh: penggunaId,
    })
    .returning();

  if (!row) throw galat.aturanBisnis("Gagal membuat data master pajak.");
  return row;
}

export async function ubahPajak(
  id: string,
  input: Partial<Omit<typeof taxes.$inferInsert, "id" | "dibuatPada" | "diubahPada">>,
  penggunaId: string,
): Promise<Pajak> {
  await ambilPajak(id);

  if (input.kode) {
    const [conflict] = await db
      .select()
      .from(taxes)
      .where(and(eq(taxes.kode, input.kode), sql`${taxes.id} != ${id}`));
    if (conflict) throw galat.sudahAda(`Pajak dengan kode '${input.kode}' sudah digunakan.`);
  }

  const [updated] = await db
    .update(taxes)
    .set({
      ...input,
      diubahOleh: penggunaId,
      diubahPada: new Date(),
    })
    .where(eq(taxes.id, id))
    .returning();

  if (!updated) throw galat.aturanBisnis("Gagal memperbarui data master pajak.");
  return updated;
}

// ==========================================
// 2. NOMOR SERI FAKTUR PAJAK (NSFP)
// ==========================================

export async function daftarAlokasiNsfp(query: { tahun?: number; aktif?: boolean }) {
  const conditions = [];
  if (query.tahun) conditions.push(eq(taxInvoiceRanges.tahun, query.tahun));
  if (query.aktif !== undefined) conditions.push(eq(taxInvoiceRanges.aktif, query.aktif));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db.select().from(taxInvoiceRanges).where(whereClause).orderBy(desc(taxInvoiceRanges.tahun));
}

export async function buatAlokasiNsfp(
  input: Omit<typeof taxInvoiceRanges.$inferInsert, "id" | "nomorBerikutnya" | "dibuatPada" | "diubahPada">,
  penggunaId: string,
): Promise<AlokasiNsfp> {
  const awal = input.nomorAwal.trim();
  const akhir = input.nomorAkhir.trim();

  if (akhir < awal) {
    throw galat.aturanBisnis("Nomor akhir NSFP tidak boleh lebih kecil dari nomor awal.");
  }

  const [row] = await db
    .insert(taxInvoiceRanges)
    .values({
      ...input,
      nomorAwal: awal,
      nomorAkhir: akhir,
      nomorBerikutnya: awal,
      dibuatOleh: penggunaId,
      diubahOleh: penggunaId,
    })
    .returning();

  if (!row) throw galat.aturanBisnis("Gagal membuat alokasi NSFP.");
  return row;
}

/**
 * Mengambil nomor seri faktur pajak berikutnya secara atomic dari range aktif.
 */
export async function ambilNomorNsfpBerikutnya(tahun: number, penggunaId?: string): Promise<string> {
  return await db.transaction(async (tx) => {
    const [range] = await tx
      .select()
      .from(taxInvoiceRanges)
      .where(and(eq(taxInvoiceRanges.tahun, tahun), eq(taxInvoiceRanges.aktif, true)))
      .orderBy(taxInvoiceRanges.nomorBerikutnya)
      .for("update")
      .limit(1);

    if (!range) {
      throw galat.aturanBisnis(
        `Alokasi NSFP untuk tahun ${tahun} tidak tersedia atau kuota nomor telah habis. Silakan rekam rentang NSFP baru dari DJP.`,
      );
    }

    const nomorDipakai = range.nomorBerikutnya;

    // Hitung nomor berikutnya dengan padding numerik
    // Format NSFP DJP umumnya: 010.000-24.00000001 (13 atau 16 digit dengan/tanpa titik)
    const bersih = nomorDipakai.replace(/\D/g, "");
    const panjang = bersih.length;
    const angka = BigInt(bersih);
    const angkaBerikutnya = angka + BigInt(1);
    const strBerikutnya = angkaBerikutnya.toString().padStart(panjang, "0");

    let nomorBerikutnyaFormatted = strBerikutnya;
    if (nomorDipakai.includes(".") || nomorDipakai.includes("-")) {
      if (strBerikutnya.length === 16) {
        nomorBerikutnyaFormatted = `${strBerikutnya.slice(0, 3)}.${strBerikutnya.slice(3, 6)}-${strBerikutnya.slice(6, 8)}.${strBerikutnya.slice(8)}`;
      } else if (strBerikutnya.length === 13) {
        nomorBerikutnyaFormatted = `${strBerikutnya.slice(0, 3)}-${strBerikutnya.slice(3, 5)}.${strBerikutnya.slice(5)}`;
      }
    }

    const sudahHabis = nomorDipakai >= range.nomorAkhir;

    await tx
      .update(taxInvoiceRanges)
      .set({
        nomorBerikutnya: nomorBerikutnyaFormatted,
        aktif: !sudahHabis,
        diubahOleh: penggunaId,
        diubahPada: new Date(),
      })
      .where(eq(taxInvoiceRanges.id, range.id));

    return nomorDipakai;
  });
}

// ==========================================
// 3. FAKTUR PAJAK ELEKTRONIK (e-Faktur)
// ==========================================

export async function daftarFakturPajak(query: {
  jenis?: JenisFakturPajak;
  masaPajak?: number;
  tahunPajak?: number;
  status?: StatusFakturPajak;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query.jenis) conditions.push(eq(taxInvoices.jenis, query.jenis));
  if (query.masaPajak) conditions.push(eq(taxInvoices.masaPajak, query.masaPajak));
  if (query.tahunPajak) conditions.push(eq(taxInvoices.tahunPajak, query.tahunPajak));
  if (query.status) conditions.push(eq(taxInvoices.statusFaktur, query.status));
  if (query.q) {
    conditions.push(
      or(
        ilike(taxInvoices.nomorFakturPajak, `%${query.q}%`),
        ilike(taxInvoices.namaLawanTransaksi, `%${query.q}%`),
        ilike(taxInvoices.npwpLawanTransaksi, `%${query.q}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taxInvoices)
    .where(whereClause);

  const rows = await db
    .select()
    .from(taxInvoices)
    .where(whereClause)
    .orderBy(desc(taxInvoices.tanggal), desc(taxInvoices.nomorFakturPajak))
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    total: totalRows?.count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((totalRows?.count ?? 0) / limit),
  };
}

export async function ambilFakturPajak(id: string): Promise<FakturPajak> {
  const [row] = await db.select().from(taxInvoices).where(eq(taxInvoices.id, id));
  if (!row) throw galat.tidakDitemukan(`Faktur pajak dengan ID ${id}`);
  return row;
}

export async function buatFakturPajakManual(
  input: Omit<typeof taxInvoices.$inferInsert, "id" | "dibuatPada" | "diubahPada">,
  penggunaId: string,
): Promise<FakturPajak> {
  const [conflict] = await db
    .select()
    .from(taxInvoices)
    .where(eq(taxInvoices.nomorFakturPajak, input.nomorFakturPajak));
  if (conflict) {
    throw galat.sudahAda(`Nomor faktur pajak '${input.nomorFakturPajak}' sudah terdaftar.`);
  }

  const [row] = await db
    .insert(taxInvoices)
    .values({
      ...input,
      dibuatOleh: penggunaId,
      diubahOleh: penggunaId,
    })
    .returning();

  if (!row) throw galat.aturanBisnis("Gagal membuat faktur pajak.");
  return row;
}

export async function generateFakturDariPenjualan(
  input: { fakturPenjualanId: string; nomorFakturPajak?: string; tanggal?: string },
  penggunaId: string,
): Promise<FakturPajak> {
  const [inv] = await db
    .select()
    .from(salesInvoices)
    .where(eq(salesInvoices.id, input.fakturPenjualanId));

  if (!inv) throw galat.tidakDitemukan(`Faktur penjualan dengan ID ${input.fakturPenjualanId}`);

  const [existing] = await db
    .select()
    .from(taxInvoices)
    .where(eq(taxInvoices.fakturPenjualanId, input.fakturPenjualanId));
  if (existing) {
    throw galat.aturanBisnis(
      `Faktur penjualan ${inv.nomor} sudah memiliki Faktur Pajak dengan nomor ${existing.nomorFakturPajak}.`,
    );
  }

  let partnerNama = "Pelanggan Umum";
  let partnerNpwp = "000000000000000";
  let partnerNik: string | null = null;
  let partnerAlamat = "-";

  if (inv.pelangganId) {
    const [p] = await db.select().from(partners).where(eq(partners.id, inv.pelangganId));
    if (p) {
      partnerNama = p.nama;
      partnerNpwp = p.npwp || "000000000000000";
      partnerNik = p.nik || null;
      partnerAlamat = p.alamat || "-";
    }
  }

  const tanggalFaktur = input.tanggal ?? inv.tanggal;
  const tanggalObj = new Date(tanggalFaktur);
  const masaPajak = tanggalObj.getMonth() + 1;
  const tahunPajak = tanggalObj.getFullYear();

  let nomorFaktur = input.nomorFakturPajak;
  if (!nomorFaktur) {
    nomorFaktur = await ambilNomorNsfpBerikutnya(tahunPajak, penggunaId);
  }

  const [row] = await db
    .insert(taxInvoices)
    .values({
      nomorFakturPajak: nomorFaktur,
      jenis: "KELUARAN",
      tanggal: tanggalFaktur,
      masaPajak,
      tahunPajak,
      kontakId: inv.pelangganId,
      namaLawanTransaksi: partnerNama,
      npwpLawanTransaksi: partnerNpwp,
      nikLawanTransaksi: partnerNik,
      alamatLawanTransaksi: partnerAlamat,
      jumlahDpp: inv.subtotal,
      jumlahPpn: inv.ppn,
      jumlahPpnbm: "0.0000",
      statusFaktur: "DISETUJUI_DJP",
      referensiDokumen: inv.nomor,
      fakturPenjualanId: inv.id,
      dapatDikreditkan: true,
      dibuatOleh: penggunaId,
      diubahOleh: penggunaId,
    })
    .returning();

  if (!row) throw galat.aturanBisnis("Gagal membuat faktur pajak dari penjualan.");
  return row;
}

export async function ubahStatusFakturPajak(
  id: string,
  status: StatusFakturPajak,
  penggunaId: string,
  keterangan?: string,
): Promise<FakturPajak> {
  const current = await ambilFakturPajak(id);

  if (current.statusFaktur === "BATAL" && status !== "BATAL") {
    throw galat.aturanBisnis("Faktur pajak yang sudah BATAL tidak dapat diubah statusnya lagi.");
  }

  const [updated] = await db
    .update(taxInvoices)
    .set({
      statusFaktur: status,
      keterangan: keterangan ?? current.keterangan,
      diubahOleh: penggunaId,
      diubahPada: new Date(),
    })
    .where(eq(taxInvoices.id, id))
    .returning();

  if (!updated) throw galat.aturanBisnis("Gagal memperbarui status faktur pajak.");
  return updated;
}

// ==========================================
// 4. BUKTI POTONG PPH (e-Bupot Unifikasi)
// ==========================================

export async function daftarBuktiPotong(query: {
  jenisBupot?: JenisBupot;
  masaPajak?: number;
  tahunPajak?: number;
  status?: StatusBupot;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query.jenisBupot) conditions.push(eq(withholdingTaxSlips.jenisBupot, query.jenisBupot));
  if (query.masaPajak) conditions.push(eq(withholdingTaxSlips.masaPajak, query.masaPajak));
  if (query.tahunPajak) conditions.push(eq(withholdingTaxSlips.tahunPajak, query.tahunPajak));
  if (query.status) conditions.push(eq(withholdingTaxSlips.status, query.status));
  if (query.q) {
    conditions.push(
      or(
        ilike(withholdingTaxSlips.nomorBuktiPotong, `%${query.q}%`),
        ilike(withholdingTaxSlips.namaWajibPajak, `%${query.q}%`),
        ilike(withholdingTaxSlips.npwpWajibPajak, `%${query.q}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(withholdingTaxSlips)
    .where(whereClause);

  const rows = await db
    .select()
    .from(withholdingTaxSlips)
    .where(whereClause)
    .orderBy(desc(withholdingTaxSlips.tanggal), desc(withholdingTaxSlips.nomorBuktiPotong))
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    total: totalRows?.count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((totalRows?.count ?? 0) / limit),
  };
}

export async function ambilBuktiPotong(id: string): Promise<BuktiPotong> {
  const [row] = await db.select().from(withholdingTaxSlips).where(eq(withholdingTaxSlips.id, id));
  if (!row) throw galat.tidakDitemukan(`Bukti potong dengan ID ${id}`);
  return row;
}

export async function buatBuktiPotong(
  input: Omit<typeof withholdingTaxSlips.$inferInsert, "id" | "dibuatPada" | "diubahPada">,
  penggunaId: string,
): Promise<BuktiPotong> {
  const [conflict] = await db
    .select()
    .from(withholdingTaxSlips)
    .where(eq(withholdingTaxSlips.nomorBuktiPotong, input.nomorBuktiPotong));
  if (conflict) {
    throw galat.sudahAda(`Nomor bukti potong '${input.nomorBuktiPotong}' sudah terdaftar.`);
  }

  const [row] = await db
    .insert(withholdingTaxSlips)
    .values({
      ...input,
      dibuatOleh: penggunaId,
      diubahOleh: penggunaId,
    })
    .returning();

  if (!row) throw galat.aturanBisnis("Gagal membuat bukti potong.");
  return row;
}

export async function ubahStatusBuktiPotong(
  id: string,
  status: StatusBupot,
  penggunaId: string,
  keterangan?: string,
): Promise<BuktiPotong> {
  const current = await ambilBuktiPotong(id);

  if (current.status === "DIBATALKAN" && status !== "DIBATALKAN") {
    throw galat.aturanBisnis("Bukti potong yang sudah DIBATALKAN tidak dapat diubah statusnya lagi.");
  }

  const [updated] = await db
    .update(withholdingTaxSlips)
    .set({
      status,
      keterangan: keterangan ?? current.keterangan,
      diubahOleh: penggunaId,
      diubahPada: new Date(),
    })
    .where(eq(withholdingTaxSlips.id, id))
    .returning();

  if (!updated) throw galat.aturanBisnis("Gagal memperbarui status bukti potong.");
  return updated;
}

// ==========================================
// 5. EKSPOR FORMAT e-FAKTUR CSV (DJP)
// ==========================================

export async function eksporEfakturCsv(params: {
  masaPajak: number;
  tahunPajak: number;
  jenis?: "KELUARAN" | "MASUKAN";
}): Promise<string> {
  const jenis = params.jenis ?? "KELUARAN";

  const rows = await db
    .select()
    .from(taxInvoices)
    .where(
      and(
        eq(taxInvoices.masaPajak, params.masaPajak),
        eq(taxInvoices.tahunPajak, params.tahunPajak),
        eq(taxInvoices.jenis, jenis),
        sql`${taxInvoices.statusFaktur} != 'BATAL'`,
      ),
    )
    .orderBy(taxInvoices.nomorFakturPajak);

  if (jenis === "KELUARAN") {
    const lines = [
      "FK,KD_JENIS_TRANSAKSI,FG_PENGGANTI,NOMOR_FAKTUR,MASA_PAJAK,TAHUN_PAJAK,TANGGAL_FAKTUR,NPWP,NAMA,ALAMAT_LENGKAP,JUMLAH_DPP,JUMLAH_PPN,JUMLAH_PPNBM,ID_KETERANGAN_TAMBAHAN,FG_UANG_MUKA,UANG_MUKA_DPP,UANG_MUKA_PPN,UANG_MUKA_PPNBM,REFERENSI",
    ];

    for (const r of rows) {
      const nomorBersih = r.nomorFakturPajak.replace(/\D/g, "");
      const kdJenis = nomorBersih.slice(0, 2) || "01";
      const fgPengganti = nomorBersih.slice(2, 3) || "0";
      const noFaktur = nomorBersih.slice(3) || nomorBersih;
      const npwp = (r.npwpLawanTransaksi || "000000000000000").replace(/\D/g, "");
      const nama = `"${(r.namaLawanTransaksi || "").replace(/"/g, '""')}"`;
      const alamat = `"${(r.alamatLawanTransaksi || "-").replace(/"/g, '""')}"`;
      const dpp = Math.round(Number(r.jumlahDpp));
      const ppn = Math.round(Number(r.jumlahPpn));
      const ppnbm = Math.round(Number(r.jumlahPpnbm));
      const ref = `"${(r.referensiDokumen || "").replace(/"/g, '""')}"`;

      lines.push(
        `FK,${kdJenis},${fgPengganti},${noFaktur},${r.masaPajak},${r.tahunPajak},${r.tanggal},${npwp},${nama},${alamat},${dpp},${ppn},${ppnbm},0,0,0,0,0,${ref}`,
      );
    }

    return lines.join("\r\n");
  } else {
    const lines = [
      "FM,KD_JENIS_TRANSAKSI,FG_PENGGANTI,NOMOR_FAKTUR,MASA_PAJAK,TAHUN_PAJAK,TANGGAL_FAKTUR,NPWP,NAMA,ALAMAT_LENGKAP,JUMLAH_DPP,JUMLAH_PPN,JUMLAH_PPNBM,IS_CREDITABLE",
    ];

    for (const r of rows) {
      const nomorBersih = r.nomorFakturPajak.replace(/\D/g, "");
      const kdJenis = nomorBersih.slice(0, 2) || "01";
      const fgPengganti = nomorBersih.slice(2, 3) || "0";
      const noFaktur = nomorBersih.slice(3) || nomorBersih;
      const npwp = (r.npwpLawanTransaksi || "000000000000000").replace(/\D/g, "");
      const nama = `"${(r.namaLawanTransaksi || "").replace(/"/g, '""')}"`;
      const alamat = `"${(r.alamatLawanTransaksi || "-").replace(/"/g, '""')}"`;
      const dpp = Math.round(Number(r.jumlahDpp));
      const ppn = Math.round(Number(r.jumlahPpn));
      const ppnbm = Math.round(Number(r.jumlahPpnbm));
      const isCreditable = r.dapatDikreditkan ? "1" : "0";

      lines.push(
        `FM,${kdJenis},${fgPengganti},${noFaktur},${r.masaPajak},${r.tahunPajak},${r.tanggal},${npwp},${nama},${alamat},${dpp},${ppn},${ppnbm},${isCreditable}`,
      );
    }

    return lines.join("\r\n");
  }
}

// ==========================================
// 6. EKSPOR FORMAT CORETAX DJP
// ==========================================

export async function eksporCoretax(params: { masaPajak: number; tahunPajak: number }) {
  const fakturList = await db
    .select()
    .from(taxInvoices)
    .where(
      and(
        eq(taxInvoices.masaPajak, params.masaPajak),
        eq(taxInvoices.tahunPajak, params.tahunPajak),
        sql`${taxInvoices.statusFaktur} != 'BATAL'`,
      ),
    )
    .orderBy(taxInvoices.nomorFakturPajak);

  const bupotList = await db
    .select()
    .from(withholdingTaxSlips)
    .where(
      and(
        eq(withholdingTaxSlips.masaPajak, params.masaPajak),
        eq(withholdingTaxSlips.tahunPajak, params.tahunPajak),
        sql`${withholdingTaxSlips.status} != 'DIBATALKAN'`,
      ),
    )
    .orderBy(withholdingTaxSlips.nomorBuktiPotong);

  return {
    coretaxVersion: "1.0",
    generatedAt: new Date().toISOString(),
    taxPeriod: {
      month: params.masaPajak,
      year: params.tahunPajak,
    },
    invoices: fakturList.map((f) => ({
      invoiceNumber: f.nomorFakturPajak,
      type: f.jenis,
      date: f.tanggal,
      counterparty: {
        name: f.namaLawanTransaksi,
        npwp: f.npwpLawanTransaksi,
        nik: f.nikLawanTransaksi,
        address: f.alamatLawanTransaksi,
      },
      amounts: {
        dpp: f.jumlahDpp,
        ppn: f.jumlahPpn,
        ppnbm: f.jumlahPpnbm,
      },
      isCreditable: f.dapatDikreditkan,
      status: f.statusFaktur,
      reference: f.referensiDokumen,
    })),
    withholdings: bupotList.map((b) => ({
      withholdingNumber: b.nomorBuktiPotong,
      type: b.jenisBupot,
      date: b.tanggal,
      taxpayer: {
        name: b.namaWajibPajak,
        npwp: b.npwpWajibPajak,
        nik: b.nikWajibPajak,
      },
      taxObjectCode: b.kodeObjekPajak,
      grossAmount: b.jumlahBruto,
      rate: b.tarif,
      taxWithheld: b.jumlahPph,
      status: b.status,
      reference: b.dokumenReferensi,
    })),
  };
}

// ==========================================
// 7. LAPORAN REKAP SPT MASA PPN
// ==========================================

export async function rekapSptMasaPpn(params: { masaPajak: number; tahunPajak: number }) {
  const rows = await db
    .select()
    .from(taxInvoices)
    .where(
      and(
        eq(taxInvoices.masaPajak, params.masaPajak),
        eq(taxInvoices.tahunPajak, params.tahunPajak),
        sql`${taxInvoices.statusFaktur} != 'BATAL'`,
      ),
    );

  let dppKeluaran = BigInt(0);
  let ppnKeluaran = BigInt(0);
  let jumlahFakturKeluaran = 0;

  let dppMasukanDapatDikreditkan = BigInt(0);
  let ppnMasukanDapatDikreditkan = BigInt(0);
  let jumlahFakturMasukanDapatDikreditkan = 0;

  let dppMasukanTidakDapatDikreditkan = BigInt(0);
  let ppnMasukanTidakDapatDikreditkan = BigInt(0);
  let jumlahFakturMasukanTidakDapatDikreditkan = 0;

  for (const r of rows) {
    if (r.jenis === "KELUARAN") {
      dppKeluaran += keBigInt(r.jumlahDpp);
      ppnKeluaran += keBigInt(r.jumlahPpn);
      jumlahFakturKeluaran++;
    } else if (r.jenis === "MASUKAN") {
      if (r.dapatDikreditkan) {
        dppMasukanDapatDikreditkan += keBigInt(r.jumlahDpp);
        ppnMasukanDapatDikreditkan += keBigInt(r.jumlahPpn);
        jumlahFakturMasukanDapatDikreditkan++;
      } else {
        dppMasukanTidakDapatDikreditkan += keBigInt(r.jumlahDpp);
        ppnMasukanTidakDapatDikreditkan += keBigInt(r.jumlahPpn);
        jumlahFakturMasukanTidakDapatDikreditkan++;
      }
    }
  }

  const selisih = ppnKeluaran - ppnMasukanDapatDikreditkan;
  let statusSpt: "KURANG_BAYAR" | "LEBIH_BAYAR" | "NIHIL" = "NIHIL";
  if (selisih > BigInt(0)) {
    statusSpt = "KURANG_BAYAR";
  } else if (selisih < BigInt(0)) {
    statusSpt = "LEBIH_BAYAR";
  }

  const absSelisih = selisih < BigInt(0) ? -selisih : selisih;

  return {
    masaPajak: params.masaPajak,
    tahunPajak: params.tahunPajak,
    pajakKeluaran: {
      totalDpp: keString(dppKeluaran),
      totalPpn: keString(ppnKeluaran),
      jumlahFaktur: jumlahFakturKeluaran,
    },
    pajakMasukanDapatDikreditkan: {
      totalDpp: keString(dppMasukanDapatDikreditkan),
      totalPpn: keString(ppnMasukanDapatDikreditkan),
      jumlahFaktur: jumlahFakturMasukanDapatDikreditkan,
    },
    pajakMasukanTidakDapatDikreditkan: {
      totalDpp: keString(dppMasukanTidakDapatDikreditkan),
      totalPpn: keString(ppnMasukanTidakDapatDikreditkan),
      jumlahFaktur: jumlahFakturMasukanTidakDapatDikreditkan,
    },
    rekapitulasi: {
      selisihPpn: keString(absSelisih),
      statusSpt,
    },
  };
}
