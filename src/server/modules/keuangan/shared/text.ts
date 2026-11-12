/** Escape karakter wildcard LIKE agar pencarian pengguna diperlakukan sebagai teks biasa. */
export const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Membersihkan string kosong menjadi null untuk kolom teks opsional. */
export const nullJikaKosong = (v: string | null | undefined) => {
  const s = v?.trim();
  return s ? s : null;
};
