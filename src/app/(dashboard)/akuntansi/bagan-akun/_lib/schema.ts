import { z } from "zod";

export const akunFormSchema = z.object({
  kode: z
    .string()
    .min(1, "Kode akun wajib diisi")
    .max(20, "Kode akun maksimal 20 karakter")
    .regex(/^[A-Za-z0-9.-]+$/, "Kode hanya boleh huruf, angka, titik, atau strip"),
  nama: z
    .string()
    .min(1, "Nama akun wajib diisi")
    .max(150, "Nama akun maksimal 150 karakter"),
  tipeAkun: z.enum(["ASET", "KEWAJIBAN", "EKUITAS", "PENDAPATAN", "BEBAN"], {
    error: "Pilih tipe akun yang valid",
  }),
  indukId: z.string().optional().nullable(),
  bisaDiposting: z.boolean(),
  adalahAkunKontra: z.boolean(),
  normalBalance: z.enum(["DEBIT", "KREDIT"]).optional(),
  peranSistem: z.string().optional().nullable(),
  mataUangId: z.string().optional().nullable(),
  keterangan: z.string().max(1000).optional().nullable(),
});

export type AkunFormValues = z.infer<typeof akunFormSchema>;
