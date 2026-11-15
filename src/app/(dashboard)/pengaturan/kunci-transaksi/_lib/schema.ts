import { z } from "zod";

export const kunciTransaksiSchema = z.object({
  kunciSemuaSebelum: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  kunciNonAdminSebelum: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  catatan: z
    .string()
    .max(500, "Catatan maksimal 500 karakter.")
    .optional()
    .or(z.literal("")),
});

export type KunciTransaksiFormValues = z.infer<typeof kunciTransaksiSchema>;
