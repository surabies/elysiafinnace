import { z } from "zod";

export const produkFormSchema = z.object({
  sku: z
    .string()
    .min(1, "SKU / Kode produk wajib diisi.")
    .max(50, "SKU maksimal 50 karakter.")
    .trim(),
  barcode: z.string().max(50, "Barcode maksimal 50 karakter.").optional().or(z.literal("")),
  nama: z
    .string()
    .min(1, "Nama produk wajib diisi.")
    .max(200, "Nama produk maksimal 200 karakter.")
    .trim(),
  deskripsi: z.string().max(2000, "Deskripsi maksimal 2000 karakter.").optional().or(z.literal("")),
  tipeBarang: z.enum([
    "BARANG_PERSEDIAAN",
    "BARANG_NON_PERSEDIAAN",
    "JASA",
    "BUNDEL",
  ]),
  kategoriId: z.string().uuid().nullable().optional(),
  satuanId: z.string().min(1, "Satuan dasar wajib dipilih."),
  mataUangId: z.string().uuid().nullable().optional(),
  hargaBeliStandar: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Harga beli harus berupa angka desimal positif."),
  hargaJualStandar: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Harga jual harus berupa angka desimal positif."),
  stokMinimum: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Stok minimum harus berupa angka positif."),
  akunPersediaanId: z.string().uuid().nullable().optional(),
  akunHppId: z.string().uuid().nullable().optional(),
  akunPendapatanId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  aktif: z.boolean(),
});

export type ProdukFormValues = z.infer<typeof produkFormSchema>;
