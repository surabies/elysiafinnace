import { z } from "zod";

export const perusahaanFormSchema = z.object({
  kode: z
    .string()
    .min(2, "Kode perusahaan minimal 2 karakter.")
    .max(50, "Kode perusahaan maksimal 50 karakter.")
    .regex(/^[A-Z0-9_-]+$/, "Kode hanya boleh huruf kapital, angka, strip, dan underscore."),
  nama: z
    .string()
    .min(3, "Nama perusahaan minimal 3 karakter.")
    .max(200, "Nama perusahaan maksimal 200 karakter."),
  npwp: z
    .string()
    .max(32, "NPWP maksimal 32 karakter.")
    .optional(),
  alamat: z
    .string()
    .max(1000, "Alamat maksimal 1000 karakter.")
    .optional(),
  telepon: z
    .string()
    .max(30, "Telepon maksimal 30 karakter.")
    .optional(),
  email: z
    .string()
    .max(100, "Email maksimal 100 karakter.")
    .optional(),
  mataUangDasarId: z.string().optional(),
  adalahHolding: z.boolean(),
  indukId: z.string().optional(),
  logo: z
    .string()
    .max(500, "URL logo maksimal 500 karakter.")
    .optional(),
  aktif: z.boolean(),
});

export type PerusahaanFormValues = z.infer<typeof perusahaanFormSchema>;
