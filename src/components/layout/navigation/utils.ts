import type { NavEntry, NavGroup, NavIcon, NavSection } from "./types";

export const isNavGroup = (entry: NavEntry): entry is NavGroup =>
  "children" in entry;

/**
 * Aktif jika URL sama persis, atau berada di bawah href (mis. /biaya/baru → /biaya).
 * Jika ada siblingHrefs, tautan yang lebih spesifik (panjang string lebih besar) yang menang,
 * sehingga URL induk seperti /payroll tidak ikut aktif saat pengguna membuka /payroll/karyawan.
 */
export function isPathActive(
  pathname: string,
  href: string,
  siblingHrefs?: string[],
  exact?: boolean,
): boolean {
  if (href === "/") return pathname === "/";
  if (pathname === href) return true;
  if (exact) return false;

  if (pathname.startsWith(`${href}/`)) {
    if (siblingHrefs && siblingHrefs.length > 0) {
      const hasMoreSpecific = siblingHrefs.some(
        (sibling) =>
          sibling !== href &&
          (pathname === sibling || pathname.startsWith(`${sibling}/`)) &&
          sibling.length > href.length,
      );
      if (hasMoreSpecific) return false;
    }
    return true;
  }

  return false;
}

export const hasActiveChild = (group: NavGroup, pathname: string): boolean => {
  const siblings = group.children.map((child) => child.href);
  return group.children.some((child) =>
    isPathActive(pathname, child.href, siblings, child.exact),
  );
};

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
