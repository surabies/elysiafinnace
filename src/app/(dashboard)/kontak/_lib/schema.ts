import { z } from "zod";

export const kontakFormSchema = z.object({
  kode: z
    .string()
    .min(1, "Kode kontak wajib diisi")
    .max(30, "Maksimal 30 karakter")
    .regex(/^[A-Za-z0-9._-]+$/, "Kode hanya boleh huruf, angka, titik, minus, atau garis bawah"),
  nama: z.string().min(1, "Nama kontak wajib diisi").max(200, "Maksimal 200 karakter"),
  adalahPelanggan: z.boolean(),
  adalahPemasok: z.boolean(),
  npwp: z.string().max(32, "Maksimal 32 karakter").optional().nullable(),
  nik: z.string().max(16, "Maksimal 16 karakter").optional().nullable(),
  adalahPkp: z.boolean(),
  grup: z.string().max(50, "Maksimal 50 karakter").optional().nullable(),
  namaKontak: z.string().max(150, "Maksimal 150 karakter").optional().nullable(),
  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .nullable()
    .or(z.literal("")),
  telepon: z.string().max(30, "Maksimal 30 karakter").optional().nullable(),
  alamat: z.string().max(1000, "Maksimal 1000 karakter").optional().nullable(),
  kota: z.string().max(100, "Maksimal 100 karakter").optional().nullable(),
  provinsi: z.string().max(100, "Maksimal 100 karakter").optional().nullable(),
  kodePos: z.string().max(10, "Maksimal 10 karakter").optional().nullable(),
  negara: z.string().max(100),
  terminPembayaranId: z.string().uuid("Pilihan termin tidak valid").optional().nullable(),
  mataUangId: z.string().uuid("Pilihan mata uang tidak valid").optional().nullable(),
  batasKredit: z.string(),
  catatan: z.string().max(2000, "Maksimal 2000 karakter").optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  aktif: z.boolean(),
});

export type KontakFormValues = z.infer<typeof kontakFormSchema>;
