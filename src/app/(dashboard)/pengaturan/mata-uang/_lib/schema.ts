import { z } from "zod";

export const mataUangFormSchema = z.object({
  kode: z
    .string()
    .length(3, "Kode mata uang harus 3 karakter ISO (misal: USD, EUR)")
    .regex(/^[A-Za-z]{3}$/, "Kode hanya boleh huruf alfabet"),
  nama: z
    .string()
    .min(1, "Nama mata uang wajib diisi")
    .max(100, "Maksimal 100 karakter"),
  simbol: z
    .string()
    .min(1, "Simbol mata uang wajib diisi")
    .max(10, "Maksimal 10 karakter"),
  jumlahDesimal: z
    .number()
    .int("Jumlah desimal harus bilangan bulat")
    .min(0, "Minimal 0 desimal")
    .max(8, "Maksimal 8 desimal"),
  aktif: z.boolean(),
});

export type MataUangFormValues = z.infer<typeof mataUangFormSchema>;

export const kursFormSchema = z.object({
  mataUangId: z.string().uuid("Pilih mata uang asing yang valid"),
  tanggalBerlaku: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  kurs: z
    .string()
    .min(1, "Nilai kurs wajib diisi")
    .regex(/^[0-9]+(\.[0-9]+)?$/, "Nilai kurs harus berupa desimal positif"),
  sumber: z.string().max(100, "Maksimal 100 karakter").optional().nullable(),
});

export type KursFormValues = z.infer<typeof kursFormSchema>;
