/** Satu tautan navigasi (daun menu). */
export interface NavLink {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

/** Grup yang bisa di-expand. Sengaja hanya 1 level anak agar sidebar tetap ringkas. */
export interface NavGroup {
  id: string;
  label: string;
  icon: string;
  children: NavLink[];
}

export type NavEntry = NavLink | NavGroup;

/** Kumpulan menu dengan judul opsional (mis. "Transaksi"). */
export interface NavSection {
  id: string;
  heading?: string;
  items: NavEntry[];
}
