import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bankAccounts,
  branches,
  companies,
  companyUsers,
  currencies,
  roles,
  warehouses,
} from "@/db/schema/keuangan";
import { seedCoaByIndustry } from "@/db/seed/coa";
import { seedDemoData } from "@/db/seed/demo";
import { seedAssetCategories, seedSystemFoundation, seedTaxes } from "@/db/seed/system";
import type { InputOnboarding } from "./model";

export async function prosesOnboarding(
  input: InputOnboarding,
  penggunaId?: string
) {
  return await db.transaction(async (tx) => {
    // 1. Pastikan Layer 1 (System Foundation) sudah ada
    await seedSystemFoundation(tx);

    const [idr] = await tx
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.kode, "IDR"));

    if (!idr) throw new Error("Mata uang dasar IDR belum siap di sistem.");

    // 2. Buat profil perusahaan
    const kodeOtomatis = input.namaPerusahaan
      .split(" ")
      .map((w) => w[0]?.toUpperCase())
      .join("")
      .slice(0, 10) || "COMP";

    const [perusahaan] = await tx
      .insert(companies)
      .values({
        kode: `${kodeOtomatis}-${Date.now().toString().slice(-4)}`,
        nama: input.namaPerusahaan,
        alamat: input.alamat,
        telepon: input.telepon,
        email: input.email,
        npwp: input.npwp,
        mataUangDasarId: idr.id,
        adalahHolding: false,
        aktif: true,
      })
      .returning();

    if (!perusahaan) {
      throw new Error("Gagal membuat profil perusahaan onboarding.");
    }

    // 3. Hubungkan pengguna jika ada sesi aktif
    if (penggunaId) {
      const [adminRole] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.kode, "ADMIN"));

      await tx
        .insert(companyUsers)
        .values({
          perusahaanId: perusahaan.id,
          penggunaId,
          peranId: adminRole?.id,
          adalahUtama: true,
          aktif: true,
        })
        .onConflictDoNothing();
    }

    // 4. Cabang Utama & Gudang Utama
    const [cabangUtama] = await tx
      .insert(branches)
      .values({
        kode: `PST-${perusahaan.id.slice(0, 6)}`,
        nama: `Kantor Pusat - ${input.namaPerusahaan}`,
        alamat: input.alamat,
        telepon: input.telepon,
        pusat: true,
        aktif: true,
      })
      .returning();

    if (!cabangUtama) {
      throw new Error("Gagal membuat kantor cabang utama.");
    }

    await tx
      .insert(warehouses)
      .values({
        kode: `WH-${perusahaan.id.slice(0, 6)}`,
        nama: `Gudang Utama - ${input.namaPerusahaan}`,
        alamat: input.alamat,
        adalahGudangUtama: true,
        aktif: true,
        dibuatOleh: penggunaId ?? "system",
        diubahOleh: penggunaId ?? "system",
      })
      .onConflictDoNothing();

    // 5. Tanam Bagan Akun (COA) sesuai template pilihan
    const coa = await seedCoaByIndustry(tx, input.templateCoa);

    // 6. Hubungkan Pajak & Kategori Aset
    await seedTaxes(tx, {
      ppnKeluaranId: coa.idByPeran.get("PPN_KELUARAN"),
      ppnMasukanId: coa.idByPeran.get("PPN_MASUKAN"),
      pphDibayarDimukaId: coa.idByPeran.get("PAJAK_DIBAYAR_DIMUKA"),
      hutangPphId: coa.idByPeran.get("HUTANG_PAJAK"),
    });

    await seedAssetCategories(tx, {
      peralatanId: coa.idByKode.get("1210"),
      akumPenyusutanPeralatanId: coa.idByKode.get("1219"),
      bebanPenyusutanId: coa.idByKode.get("6600"),
    });

    // 7. Rekening Kas/Bank Awal bila dimasukkan
    if (input.rekeningAwal) {
      const akunBankId = coa.idByKode.get("1112") ?? coa.idByKode.get("1111") ?? coa.idByPeran.get("KAS_BANK");
      if (akunBankId) {
        await tx
          .insert(bankAccounts)
          .values({
            kode: `BANK-01-${perusahaan.id.slice(0, 4)}`,
            nama: input.rekeningAwal.namaBank,
            jenis: "BANK",
            namaBank: input.rekeningAwal.namaBank,
            nomorRekening: input.rekeningAwal.nomorRekening,
            atasNama: input.rekeningAwal.atasNama ?? input.namaPerusahaan,
            akunCoaId: akunBankId,
            mataUangId: idr.id,
            keterangan: "Rekening operasional bank awal saat onboarding",
            aktif: true,
          })
          .onConflictDoNothing();
      }
    }

    // 8. Opsi Muat Data Demo
    if (input.muatDataDemo) {
      await seedDemoData(tx);
    }

    return {
      success: true,
      perusahaanId: perusahaan.id,
      namaPerusahaan: perusahaan.nama,
      cabangUtamaId: cabangUtama.id,
      templateCoa: input.templateCoa,
      totalAkun: coa.totalInserted,
      dataDemoDimuat: input.muatDataDemo ?? false,
      pesan: `Inisialisasi perusahaan '${perusahaan.nama}' berhasil diselesaikan.`,
    };
  });
}
