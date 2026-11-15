import Link from "next/link";
import { IconClock } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HEADER_LINKS } from "./navigation/header-links";
import { MEGA_MENU_APPS, MEGA_MENU_QUICK_LINKS } from "./navigation/mega-menu";
import { SIDEBAR_MENU } from "./navigation/sidebar-menu";
import { flattenNavigation } from "./navigation/utils";
import { ROUTES } from "./sidebar/routes";

const PAGE_LINKS = [
  ...flattenNavigation(SIDEBAR_MENU).map(({ label, href }) => ({ label, href })),
  ...HEADER_LINKS.map(({ label, href }) => ({ label, href })),
  ...MEGA_MENU_APPS.map(({ title, href }) => ({ label: title, href })),
  ...MEGA_MENU_QUICK_LINKS,
];

function formatSlug(slug: string[]) {
  return slug
    .map((segment) =>
      segment
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    )
    .join(" / ");
}

export default function DevelopmentPage({ slug }: { slug: string[] }) {
  const pathname = `/${slug.join("/")}`;
  const title =
    PAGE_LINKS.find((page) => page.href === pathname)?.label ?? formatSlug(slug);

  return (
    <section
      aria-labelledby="development-page-title"
      className="flex w-full min-w-0 flex-col gap-6"
    >
      <header className="flex flex-col gap-2">
        <p className="text-label-12 font-medium text-muted-foreground">
          Modul keuangan
        </p>
        <h1 id="development-page-title" className="text-heading-32">
          {title}
        </h1>
      </header>

      <div className="material-medium flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:p-8">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <IconClock size={24} stroke={1.75} />
        </span>
        <div className="flex flex-col items-start">
          <Badge variant="outline">Dalam Pengembangan</Badge>
          <h2 className="mt-3 text-heading-16">Halaman ini sedang disiapkan</h2>
          <p className="mt-2 max-w-prose text-copy-14 text-muted-foreground">
            Modul {title} belum tersedia. Halaman ini akan diperbarui saat
            pengembangannya selesai.
          </p>
          <Button asChild className="mt-6">
            <Link href={ROUTES.dashboard}>Kembali ke Dasbor</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
