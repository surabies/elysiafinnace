import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../shared/context";
import {
  bankAccounts,
  chartOfAccounts,
  departments,
  employees,
  payrollItems,
  payrolls,
  salaryComponents,
  type Karyawan,
  type KomponenGaji,
} from "@/db/schema/keuangan";
import { galat } from "@/server/core/errors";
import { keBigInt, keString } from "../shared/decimal";
import { simpanJurnal } from "../jurnal/engine";
import { bacaHalaman } from "../shared/pagination";
import type {
  ProsesHitungPayrollInput,
  QueryKaryawanInput,
  QueryPayrollInput,
  SimpanKaryawanInput,
  SimpanKomponenGajiInput,
  UbahKaryawanInput,
} from "./model";

// ==========================================
// 1. MANAJEMEN KARYAWAN
// ==========================================

export async function daftarKaryawan(query: QueryKaryawanInput) {
  const { halaman, ukuran, offset } = bacaHalaman(query);

  const conditions = [];
  if (query.q) {
    const qLower = `%${query.q.toLowerCase()}%`;
    conditions.push(
      or(
        ilike(employees.nama, qLower),
        ilike(employees.nik, qLower),
        ilike(employees.jabatan, qLower),
        ilike(employees.email, qLower),
      ),
    );
  }
  if (query.departemenId) {
    conditions.push(eq(employees.departemenId, query.departemenId));
  }
  if (query.statusKaryawan) {
    conditions.push(eq(employees.statusKaryawan, query.statusKaryawan));
  }
  if (query.aktif !== undefined) {
    conditions.push(eq(employees.aktif, query.aktif));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(employees)
    .where(whereClause);

  const items = await db
    .select({
      id: employees.id,
      nik: employees.nik,
      nama: employees.nama,
      email: employees.email,
      telepon: employees.telepon,
      departemenId: employees.departemenId,
      departemenNama: departments.nama,
      jabatan: employees.jabatan,
      statusKaryawan: employees.statusKaryawan,
      statusPtkp: employees.statusPtkp,
      npwp: employees.npwp,
      tanggalMasuk: employees.tanggalMasuk,
      tanggalKeluar: employees.tanggalKeluar,
      gajiPokok: employees.gajiPokok,
      tunjanganTetap: employees.tunjanganTetap,
      bankNama: employees.bankNama,
      bankRekening: employees.bankRekening,
      bankAtasNama: employees.bankAtasNama,
      aktif: employees.aktif,
      dibuatPada: employees.dibuatPada,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departemenId, departments.id))
    .where(whereClause)
    .orderBy(asc(employees.nama))
    .limit(ukuran)
    .offset(offset);

  return {
    items,
    total: totalRow?.total ?? 0,
    halaman,
    ukuran,
    totalHalaman: Math.ceil((totalRow?.total ?? 0) / ukuran),
  };
}

export async function ambilKaryawan(id: string): Promise<Karyawan> {
  const [item] = await db.select().from(employees).where(eq(employees.id, id));
  if (!item) throw galat.tidakDitemukan(`Karyawan dengan ID ${id}`);
  return item;
}

export async function simpanKaryawan(input: SimpanKaryawanInput, oleh: string): Promise<Karyawan> {
  const nikBersih = input.nik.trim().toUpperCase();

  const [ada] = await db.select({ id: employees.id }).from(employees).where(eq(employees.nik, nikBersih));
  if (ada) throw galat.aturanBisnis(`Karyawan dengan NIK '${nikBersih}' sudah terdaftar.`);

  const [baru] = await db
    .insert(employees)
    .values({
      nik: nikBersih,
      nama: input.nama.trim(),
      email: input.email?.trim() || null,
      telepon: input.telepon?.trim() || null,
      departemenId: input.departemenId || null,
      jabatan: input.jabatan.trim(),
      statusKaryawan: input.statusKaryawan,
      statusPtkp: input.statusPtkp,
      npwp: input.npwp?.trim() || null,
      tanggalMasuk: input.tanggalMasuk,
      tanggalKeluar: input.tanggalKeluar || null,
      gajiPokok: input.gajiPokok,
      tunjanganTetap: input.tunjanganTetap || "0.0000",
      bankNama: input.bankNama?.trim() || null,
      bankRekening: input.bankRekening?.trim() || null,
      bankAtasNama: input.bankAtasNama?.trim() || null,
      aktif: input.aktif ?? true,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();

  if (!baru) throw galat.aturanBisnis("Gagal menyimpan data karyawan.");
  return baru;
}

export async function ubahKaryawan(id: string, input: UbahKaryawanInput, oleh: string): Promise<Karyawan> {
  await ambilKaryawan(id);

  if (input.nik) {
    const nikBersih = input.nik.trim().toUpperCase();
    const [duplikat] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.nik, nikBersih), or(eq(employees.id, id) ? undefined : undefined)));
    if (duplikat && duplikat.id !== id) {
      throw galat.aturanBisnis(`NIK '${nikBersih}' sudah dipakai oleh karyawan lain.`);
    }
  }

  const [updated] = await db
    .update(employees)
    .set({
      ...(input.nik && { nik: input.nik.trim().toUpperCase() }),
      ...(input.nama && { nama: input.nama.trim() }),
      ...(input.email !== undefined && { email: input.email ? input.email.trim() : null }),
      ...(input.telepon !== undefined && { telepon: input.telepon ? input.telepon.trim() : null }),
      ...(input.departemenId !== undefined && { departemenId: input.departemenId || null }),
      ...(input.jabatan && { jabatan: input.jabatan.trim() }),
      ...(input.statusKaryawan && { statusKaryawan: input.statusKaryawan }),
      ...(input.statusPtkp && { statusPtkp: input.statusPtkp }),
      ...(input.npwp !== undefined && { npwp: input.npwp ? input.npwp.trim() : null }),
      ...(input.tanggalMasuk && { tanggalMasuk: input.tanggalMasuk }),
      ...(input.tanggalKeluar !== undefined && { tanggalKeluar: input.tanggalKeluar || null }),
      ...(input.gajiPokok && { gajiPokok: input.gajiPokok }),
      ...(input.tunjanganTetap && { tunjanganTetap: input.tunjanganTetap }),
      ...(input.bankNama !== undefined && { bankNama: input.bankNama ? input.bankNama.trim() : null }),
      ...(input.bankRekening !== undefined && { bankRekening: input.bankRekening ? input.bankRekening.trim() : null }),
      ...(input.bankAtasNama !== undefined && { bankAtasNama: input.bankAtasNama ? input.bankAtasNama.trim() : null }),
      ...(input.aktif !== undefined && { aktif: input.aktif }),
      diubahOleh: oleh,
      diubahPada: new Date(),
    })
    .where(eq(employees.id, id))
    .returning();

  if (!updated) throw galat.aturanBisnis("Gagal memperbarui data karyawan.");
  return updated;
}

export async function hapusKaryawan(id: string): Promise<void> {
  await ambilKaryawan(id);

  // Periksa apakah sudah ada slip gaji terkait
  const [slipAda] = await db
    .select({ id: payrollItems.id })
    .from(payrollItems)
    .where(eq(payrollItems.employeeId, id))
    .limit(1);

  if (slipAda) {
    // Nonaktifkan saja demi integritas audit historis
    await db.update(employees).set({ aktif: false }).where(eq(employees.id, id));
    return;
  }

  await db.delete(employees).where(eq(employees.id, id));
}

// ==========================================
// 2. KOMPONEN GAJI
// ==========================================

export async function daftarKomponenGaji(): Promise<KomponenGaji[]> {
  return await db
    .select()
    .from(salaryComponents)
    .orderBy(asc(salaryComponents.jenis), asc(salaryComponents.kode));
}

export async function simpanKomponenGaji(input: SimpanKomponenGajiInput, oleh: string): Promise<KomponenGaji> {
  const kodeBersih = input.kode.trim().toUpperCase();

  const [ada] = await db
    .select({ id: salaryComponents.id })
    .from(salaryComponents)
    .where(eq(salaryComponents.kode, kodeBersih));

  if (ada) {
    const [updated] = await db
      .update(salaryComponents)
      .set({
        nama: input.nama.trim(),
        jenis: input.jenis,
        metode: input.metode,
        nilaiDefault: input.nilaiDefault || "0.0000",
        kenaPajak: input.kenaPajak ?? true,
        akunBebanId: input.akunBebanId || null,
        akunHutangId: input.akunHutangId || null,
        keterangan: input.keterangan?.trim() || null,
        diubahOleh: oleh,
        diubahPada: new Date(),
      })
      .where(eq(salaryComponents.id, ada.id))
      .returning();
    if (!updated) throw galat.aturanBisnis("Gagal memperbarui komponen gaji.");
    return updated;
  }

  const [baru] = await db
    .insert(salaryComponents)
    .values({
      kode: kodeBersih,
      nama: input.nama.trim(),
      jenis: input.jenis,
      metode: input.metode,
      nilaiDefault: input.nilaiDefault || "0.0000",
      kenaPajak: input.kenaPajak ?? true,
      akunBebanId: input.akunBebanId || null,
      akunHutangId: input.akunHutangId || null,
      keterangan: input.keterangan?.trim() || null,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();

  if (!baru) throw galat.aturanBisnis("Gagal menambahkan komponen gaji.");
  return baru;
}

// ==========================================
// 3. PROSES PENGGAJIAN (PAYROLL RUN)
// ==========================================

export async function daftarPayroll(query: QueryPayrollInput) {
  const { halaman, ukuran, offset } = bacaHalaman(query);

  const conditions = [];
  if (query.periodeTahun) {
    conditions.push(eq(payrolls.periodeTahun, Number(query.periodeTahun)));
  }
  if (query.status) {
    conditions.push(eq(payrolls.status, query.status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(payrolls)
    .where(whereClause);

  const items = await db
    .select({
      id: payrolls.id,
      kode: payrolls.kode,
      periodeBulan: payrolls.periodeBulan,
      periodeTahun: payrolls.periodeTahun,
      tanggalBayar: payrolls.tanggalBayar,
      status: payrolls.status,
      totalGajiKotor: payrolls.totalGajiKotor,
      totalPotongan: payrolls.totalPotongan,
      totalPph21: payrolls.totalPph21,
      totalBpjs: payrolls.totalBpjs,
      totalGajiBersih: payrolls.totalGajiBersih,
      rekeningKasBankId: payrolls.rekeningKasBankId,
      rekeningNama: bankAccounts.nama,
      jurnalId: payrolls.jurnalId,
      catatan: payrolls.catatan,
      dipostingPada: payrolls.dipostingPada,
      dibuatPada: payrolls.dibuatPada,
    })
    .from(payrolls)
    .leftJoin(bankAccounts, eq(payrolls.rekeningKasBankId, bankAccounts.id))
    .where(whereClause)
    .orderBy(desc(payrolls.periodeTahun), desc(payrolls.periodeBulan))
    .limit(ukuran)
    .offset(offset);

  return {
    items,
    total: totalRow?.total ?? 0,
    halaman,
    ukuran,
    totalHalaman: Math.ceil((totalRow?.total ?? 0) / ukuran),
  };
}

export async function ambilDetailPayroll(id: string) {
  const [payroll] = await db
    .select({
      id: payrolls.id,
      kode: payrolls.kode,
      periodeBulan: payrolls.periodeBulan,
      periodeTahun: payrolls.periodeTahun,
      tanggalBayar: payrolls.tanggalBayar,
      status: payrolls.status,
      totalGajiKotor: payrolls.totalGajiKotor,
      totalPotongan: payrolls.totalPotongan,
      totalPph21: payrolls.totalPph21,
      totalBpjs: payrolls.totalBpjs,
      totalGajiBersih: payrolls.totalGajiBersih,
      rekeningKasBankId: payrolls.rekeningKasBankId,
      rekeningNama: bankAccounts.nama,
      rekeningNomor: bankAccounts.nomorRekening,
      jurnalId: payrolls.jurnalId,
      catatan: payrolls.catatan,
      dipostingOleh: payrolls.dipostingOleh,
      dipostingPada: payrolls.dipostingPada,
      dibuatPada: payrolls.dibuatPada,
    })
    .from(payrolls)
    .leftJoin(bankAccounts, eq(payrolls.rekeningKasBankId, bankAccounts.id))
    .where(eq(payrolls.id, id));

  if (!payroll) throw galat.tidakDitemukan(`Payroll dengan ID ${id}`);

  const items = await db
    .select({
      id: payrollItems.id,
      employeeId: payrollItems.employeeId,
      nik: employees.nik,
      nama: employees.nama,
      jabatan: employees.jabatan,
      statusKaryawan: employees.statusKaryawan,
      statusPtkp: employees.statusPtkp,
      bankNama: employees.bankNama,
      bankRekening: employees.bankRekening,
      gajiPokok: payrollItems.gajiPokok,
      totalTunjangan: payrollItems.totalTunjangan,
      totalPotongan: payrollItems.totalPotongan,
      pph21: payrollItems.pph21,
      bpjsKesehatan: payrollItems.bpjsKesehatan,
      bpjsKetenagakerjaan: payrollItems.bpjsKetenagakerjaan,
      gajiBersih: payrollItems.gajiBersih,
      catatan: payrollItems.catatan,
    })
    .from(payrollItems)
    .innerJoin(employees, eq(payrollItems.employeeId, employees.id))
    .where(eq(payrollItems.payrollId, id))
    .orderBy(asc(employees.nama));

  return {
    ...payroll,
    items,
  };
}

/**
 * Kalkulator PPh 21 TER (Tarif Efektif Rata-Rata Bulanan sesuai PMK 168/2023)
 */
function hitungPph21Ter(gajiKotor: number, ptkp: string): number {
  const isKategoriB = ["TK/2", "TK/3", "K/1", "K/2"].includes(ptkp);
  const isKategoriC = ptkp === "K/3";

  if (isKategoriC) {
    if (gajiKotor <= 6600000) return 0;
    if (gajiKotor <= 6950000) return Math.round(gajiKotor * 0.0025);
    return Math.round(gajiKotor * 0.005);
  }

  if (isKategoriB) {
    if (gajiKotor <= 6200000) return 0;
    if (gajiKotor <= 6500000) return Math.round(gajiKotor * 0.0025);
    return Math.round(gajiKotor * 0.005);
  }

  // Tarif TER Kategori A (TK/0, TK/1, K/0)
  // Penghasilan bruto bulanan s/d 5.400.000 tarif 0%
  if (gajiKotor <= 5400000) return 0;
  if (gajiKotor <= 5650000) return Math.round(gajiKotor * 0.0025);
  if (gajiKotor <= 5950000) return Math.round(gajiKotor * 0.005);
  if (gajiKotor <= 6300000) return Math.round(gajiKotor * 0.0075);
  if (gajiKotor <= 6750000) return Math.round(gajiKotor * 0.01);
  if (gajiKotor <= 7500000) return Math.round(gajiKotor * 0.0125);
  if (gajiKotor <= 8550000) return Math.round(gajiKotor * 0.015);
  if (gajiKotor <= 9650000) return Math.round(gajiKotor * 0.0175);
  if (gajiKotor <= 10050000) return Math.round(gajiKotor * 0.02);
  if (gajiKotor <= 11800000) return Math.round(gajiKotor * 0.025);
  if (gajiKotor <= 13600000) return Math.round(gajiKotor * 0.03);
  if (gajiKotor <= 15100000) return Math.round(gajiKotor * 0.04);
  if (gajiKotor <= 16950000) return Math.round(gajiKotor * 0.05);
  if (gajiKotor <= 20600000) return Math.round(gajiKotor * 0.07);
  if (gajiKotor <= 25500000) return Math.round(gajiKotor * 0.09);
  return Math.round(gajiKotor * 0.12);
}

export async function prosesHitungPayroll(input: ProsesHitungPayrollInput, oleh: string) {
  const bulan = Number(input.periodeBulan);
  const tahun = Number(input.periodeTahun);

  // Periksa apakah periode ini sudah pernah diproses & dibayar
  const [existing] = await db
    .select()
    .from(payrolls)
    .where(and(eq(payrolls.periodeTahun, tahun), eq(payrolls.periodeBulan, bulan)));

  if (existing && existing.status === "DIBAYAR") {
    throw galat.aturanBisnis(
      `Payroll untuk periode ${bulan}/${tahun} sudah berstatus DIBAYAR dan tidak dapat dihitung ulang.`,
    );
  }

  // Ambil semua karyawan yang aktif
  const activeEmployees = await db
    .select()
    .from(employees)
    .where(eq(employees.aktif, true))
    .orderBy(asc(employees.nama));

  if (activeEmployees.length === 0) {
    throw galat.aturanBisnis("Tidak ada karyawan aktif untuk diproses payroll.");
  }

  return await db.transaction(async (tx) => {
    let payrollId = existing?.id;
    const kodePayroll = existing?.kode ?? `PAY-${tahun}${String(bulan).padStart(2, "0")}-001`;

    if (existing) {
      // Hapus item lama untuk dihitung ulang
      await tx.delete(payrollItems).where(eq(payrollItems.payrollId, existing.id));
    } else {
      const [newPayroll] = await tx
        .insert(payrolls)
        .values({
          kode: kodePayroll,
          periodeBulan: bulan,
          periodeTahun: tahun,
          tanggalBayar: input.tanggalBayar,
          status: "DRAFT",
          rekeningKasBankId: input.rekeningKasBankId,
          catatan: input.catatan?.trim() || null,
          dibuatOleh: oleh,
          diubahOleh: oleh,
        })
        .returning();
      if (!newPayroll) throw galat.aturanBisnis("Gagal membuat batch penggajian.");
      payrollId = newPayroll.id;
    }

    let grandGajiKotor = BigInt(0);
    let grandPotongan = BigInt(0);
    let grandPph21 = BigInt(0);
    let grandBpjs = BigInt(0);
    let grandGajiBersih = BigInt(0);

    for (const emp of activeEmployees) {
      const pokok = keBigInt(emp.gajiPokok);
      const tunjangan = keBigInt(emp.tunjanganTetap);
      const kotor = pokok + tunjangan;
      const kotorNum = Number(emp.gajiPokok) + Number(emp.tunjanganTetap);

      // BPJS Kesehatan (1% dari gaji, cap 12jt = max 120rb)
      const dasarBpjsKes = Math.min(kotorNum, 12000000);
      const bpjsKesNum = Math.round(dasarBpjsKes * 0.01);

      // BPJS Ketenagakerjaan (JHT 2% + JP 1% = 3%)
      const bpjsTkNum = Math.round(kotorNum * 0.03);

      // PPh 21 TER
      const pph21Num = hitungPph21Ter(kotorNum, emp.statusPtkp);

      const totalPotonganNum = bpjsKesNum + bpjsTkNum + pph21Num;
      const totalBpjsNum = bpjsKesNum + bpjsTkNum;
      const gajiBersihNum = kotorNum - totalPotonganNum;

      const pph21Big = keBigInt(pph21Num.toString());
      const bpjsBig = keBigInt(totalBpjsNum.toString());
      const potonganBig = keBigInt(totalPotonganNum.toString());
      const bersihBig = keBigInt(gajiBersihNum.toString());

      grandGajiKotor += kotor;
      grandPotongan += potonganBig;
      grandPph21 += pph21Big;
      grandBpjs += bpjsBig;
      grandGajiBersih += bersihBig;

      await tx.insert(payrollItems).values({
        payrollId: payrollId!,
        employeeId: emp.id,
        gajiPokok: emp.gajiPokok,
        totalTunjangan: emp.tunjanganTetap,
        totalPotongan: keString(potonganBig),
        pph21: keString(pph21Big),
        bpjsKesehatan: keString(keBigInt(bpjsKesNum.toString())),
        bpjsKetenagakerjaan: keString(keBigInt(bpjsTkNum.toString())),
        gajiBersih: keString(bersihBig),
      });
    }

    const [updatedPayroll] = await tx
      .update(payrolls)
      .set({
        totalGajiKotor: keString(grandGajiKotor),
        totalPotongan: keString(grandPotongan),
        totalPph21: keString(grandPph21),
        totalBpjs: keString(grandBpjs),
        totalGajiBersih: keString(grandGajiBersih),
        tanggalBayar: input.tanggalBayar,
        rekeningKasBankId: input.rekeningKasBankId,
        catatan: input.catatan?.trim() || null,
        diubahOleh: oleh,
        diubahPada: new Date(),
      })
      .where(eq(payrolls.id, payrollId!))
      .returning();

    return updatedPayroll;
  });
}

/**
 * Eksekusi Pembayaran Payroll & Otomatisasi Jurnal Akuntansi (GL Integration)
 */
export async function bayarDanPostingPayroll(payrollId: string, oleh: string) {
  const detail = await ambilDetailPayroll(payrollId);

  if (detail.status === "DIBAYAR") {
    throw galat.aturanBisnis(`Payroll '${detail.kode}' sudah berstatus DIBAYAR.`);
  }

  if (!detail.rekeningKasBankId) {
    throw galat.aturanBisnis("Rekening kas/bank untuk pembayaran payroll belum ditentukan.");
  }

  // Ambil rekening bank
  const [bank] = await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.id, detail.rekeningKasBankId));
  if (!bank) throw galat.tidakDitemukan("Rekening Bank Payroll");

  // Ambil akun Beban Gaji (6100) & Hutang Pajak PPh 21 (2140)
  const [akunBebanGaji] = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(or(eq(chartOfAccounts.kode, "6100"), ilike(chartOfAccounts.nama, "%Beban Gaji%")))
    .limit(1);

  if (!akunBebanGaji) {
    throw galat.aturanBisnis("Akun Beban Gaji (6100) belum terdaftar di Bagan Akun.");
  }

  const [akunHutangPph21] = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(or(eq(chartOfAccounts.kode, "2140"), ilike(chartOfAccounts.nama, "%PPh 21%")))
    .limit(1);

  return await db.transaction(async (tx) => {
    // Susun baris jurnal double-entry:
    // 1. Dr. Beban Gaji (Total Kotor)
    // 2. Cr. Hutang PPh 21 (Bila ada pemotongan)
    // 3. Cr. Bank Payroll / Kas (Total Gaji Bersih Dibayarkan)
    const barisJurnal = [
      {
        akunId: akunBebanGaji.id,
        deskripsi: `Beban Gaji Karyawan Periode ${detail.periodeBulan}/${detail.periodeTahun}`,
        debit: detail.totalGajiKotor,
        kredit: "0.0000",
      },
    ];

    if (Number(detail.totalPph21) > 0 && akunHutangPph21) {
      barisJurnal.push({
        akunId: akunHutangPph21.id,
        deskripsi: `Pemotongan PPh Pasal 21 Payroll ${detail.periodeBulan}/${detail.periodeTahun}`,
        debit: "0.0000",
        kredit: detail.totalPph21,
      });
    }

    // Kredit ke rekening kas/bank
    barisJurnal.push({
      akunId: bank.akunCoaId,
      deskripsi: `Pembayaran Payroll Karyawan via ${bank.nama}`,
      debit: "0.0000",
      kredit: detail.totalGajiBersih,
    });

    const hasilJurnal = await simpanJurnal(
      tx,
      {
        tanggal: detail.tanggalBayar,
        deskripsi: `Disbursement Payroll Karyawan: ${detail.kode}`,
        referensi: detail.kode,
        sumber: "BIAYA",
        sumberId: detail.id,
        mataUangId: bank.mataUangId,
        kurs: "1.00000000",
        posting: true,
        baris: barisJurnal,
      },
      oleh,
    );

    const [updated] = await tx
      .update(payrolls)
      .set({
        status: "DIBAYAR",
        jurnalId: hasilJurnal.id,
        dipostingOleh: oleh,
        dipostingPada: new Date(),
        diubahOleh: oleh,
        diubahPada: new Date(),
      })
      .where(eq(payrolls.id, detail.id))
      .returning();

    return updated;
  });
}
