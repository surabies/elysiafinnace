export interface ItemTag {
  id: string;
  nama: string;
  warna: string | null;
  keterangan: string | null;
  aktif: boolean;
  dibuatPada: string;
  diubahPada: string;
}

export interface TagStats {
  total: number;
  aktif: number;
  nonaktif: number;
}

export const PRESET_WARNA_TAG = [
  { label: "Biru Finansial", hex: "#2563eb" },
  { label: "Hijau Sukses", hex: "#16a34a" },
  { label: "Kuning Amber", hex: "#d97706" },
  { label: "Merah Bahaya", hex: "#dc2626" },
  { label: "Ungu Royal", hex: "#7c3aed" },
  { label: "Cyan Langit", hex: "#0891b2" },
  { label: "Oranye Hangat", hex: "#ea580c" },
  { label: "Abu-abu Netral", hex: "#475569" },
  { label: "Rose Pink", hex: "#e11d48" },
  { label: "Indigo Gelap", hex: "#4f46e5" },
];
