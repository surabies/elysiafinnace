import type { NavEntry, NavGroup, NavSection } from "./types";

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
  icon?: string;
  /** Jejak menu, mis. "Penjualan → Faktur Penjualan". Dipakai untuk pencarian. */
  trail: string;
}

/** Meratakan struktur menu menjadi daftar tautan untuk pencarian. */
export function flattenNavigation(sections: NavSection[]): SearchableLink[] {
  return sections.flatMap((section) =>
    section.items.flatMap((entry): SearchableLink[] =>
      isNavGroup(entry)
        ? entry.children.map((child) => ({
            id: child.id,
            label: child.label,
            href: child.href,
            icon: entry.icon,
            trail: `${entry.label} → ${child.label}`,
          }))
        : [
            {
              id: entry.id,
              label: entry.label,
              href: entry.href,
              icon: entry.icon,
              trail: entry.label,
            },
          ],
    ),
  );
}
