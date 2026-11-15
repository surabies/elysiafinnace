import { SIDEBAR_MENU } from "../../navigation/sidebar-menu";
import { isNavGroup } from "../../navigation/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Mengubah slug seperti "saldo-awal" menjadi "Saldo Awal" */
function formatSegmentTitle(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Menyelesaikan hierarki breadcrumb secara otomatis dari URL pathname aktif
 * mencocokkan dengan data menu navigasi resmi (SIDEBAR_MENU).
 */
export function resolveBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Bersihkan trailing slash
  const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  if (cleanPath === "" || cleanPath === "/" || cleanPath === "/dashboard") {
    return [{ label: "Dasbor", href: "/dashboard" }];
  }

  // 1. Coba pencocokan langsung di pohon menu navigasi
  for (const section of SIDEBAR_MENU) {
    for (const item of section.items) {
      // Menu tingkat atas tunggal (NavLink)
      if (!isNavGroup(item) && item.href === cleanPath) {
        return [
          { label: section.heading ?? "Utama" },
          { label: item.label, href: item.href },
        ];
      }

      // Menu grup accordion (NavGroup)
      if (isNavGroup(item)) {
        for (const child of item.children) {
          if (child.href === cleanPath) {
            return [
              { label: item.label },
              { label: child.label, href: child.href },
            ];
          }

          // Cek apakah pathname merupakan sub-halaman dari child (mis. /akuntansi/bagan-akun/saldo-awal)
          if (cleanPath.startsWith(child.href + "/")) {
            const subSegment = cleanPath.slice(child.href.length + 1);
            const subTitle = formatSegmentTitle(subSegment);
            return [
              { label: item.label },
              { label: child.label, href: child.href },
              { label: subTitle, href: cleanPath },
            ];
          }
        }
      }
    }
  }

  // 2. Fallback cerdas berdasarkan potongan URL jika tidak ada di menu statis
  const segments = cleanPath.split("/").filter(Boolean);
  const crumbs: BreadcrumbItem[] = [];
  let accumulatedPath = "";

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    accumulatedPath += `/${seg}`;
    crumbs.push({
      label: formatSegmentTitle(seg),
      href: i === segments.length - 1 ? undefined : accumulatedPath,
    });
  }

  return crumbs;
}
