import type { NavEntry, NavGroup, NavIcon, NavSection } from "./types";

export const isNavGroup = (entry: NavEntry): entry is NavGroup =>
  "children" in entry;

/** Aktif jika URL sama persis, atau berada di bawah href (mis. /biaya/baru → /biaya). */
export function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const hasActiveChild = (group: NavGroup, pathname: string): boolean =>
  group.children.some((child) => isPathActive(pathname, child.href));

export interface SearchableLink {
  id: string;
  label: string;
  href: string;
  icon?: NavIcon;
  /** Jejak menu, mis. "Penjualan → Faktur Penjualan". Dipakai untuk pencarian. */
  trail: string;
  /** Kategori induk, mis. "Transaksi", "Laporan Enterprise", "Utama". */
  category: string;
}

/** Meratakan struktur menu menjadi daftar tautan untuk pencarian. */
export function flattenNavigation(sections: NavSection[]): SearchableLink[] {
  return sections.flatMap((section) => {
    const categoryName = section.heading ?? "Utama";
    return section.items.flatMap((entry): SearchableLink[] =>
      isNavGroup(entry)
        ? entry.children.map((child) => ({
            id: child.id,
            label: child.label,
            href: child.href,
            icon: entry.icon,
            trail: `${entry.label} → ${child.label}`,
            category: categoryName,
          }))
        : [
            {
              id: entry.id,
              label: entry.label,
              href: entry.href,
              icon: entry.icon,
              trail: entry.label,
              category: categoryName,
            },
          ],
    );
  });
}
