import { z } from "zod";

export const gudangFormSchema = z.object({
  kode: z
    .string()
    .min(1, "Kode gudang wajib diisi.")
    .max(30, "Kode gudang maksimal 30 karakter.")
    .trim(),
  nama: z
    .string()
    .min(1, "Nama gudang wajib diisi.")
    .max(150, "Nama gudang maksimal 150 karakter.")
    .trim(),
  alamat: z.string().max(1000, "Alamat maksimal 1000 karakter.").optional().or(z.literal("")),
  penanggungJawab: z
    .string()
    .max(150, "Nama penanggung jawab maksimal 150 karakter.")
    .optional()
    .or(z.literal("")),
  adalahGudangUtama: z.boolean(),
  keterangan: z.string().max(1000, "Keterangan maksimal 1000 karakter.").optional().or(z.literal("")),
  aktif: z.boolean(),
});

export type GudangFormValues = z.infer<typeof gudangFormSchema>;
