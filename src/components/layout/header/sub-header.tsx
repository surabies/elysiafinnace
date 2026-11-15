"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconCalendar,
  IconChevronRight,
  IconHome,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { resolveBreadcrumbs } from "../shared/breadcrumb/breadcrumb-resolver";

export function SubHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const isRoot = pathname === "/dashboard" || pathname === "/" || pathname === "";
  const breadcrumbs = React.useMemo(() => resolveBreadcrumbs(pathname), [pathname]);

  const currentPeriod = React.useMemo(() => {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(new Date());
    } catch {
      return "Bulan Berjalan";
    }
  }, []);

  const handleBack = () => {
    if (!isRoot) {
      router.back();
    }
  };

  return (
    <div className="flex h-10 w-full items-center justify-between bg-muted/25 px-3 sm:px-6 lg:px-8 transition-colors">
      {/* Kiri: Breadcrumb Navigasi Murni & Bersih */}
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1.5 text-xs">
          {/* Ikon Home / Dasbor + Badge Periode Bulan Berjalan saat di Root */}
          <li className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
                isRoot
                  ? "font-semibold text-foreground bg-background/80 shadow-2xs border border-border/70"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
              title="Dasbor Utama"
            >
              <IconHome className="size-3.5 shrink-0" stroke={1.8} />
              <span className={cn(isRoot ? "inline" : "hidden sm:inline")}>
                Dasbor
              </span>
            </Link>

            {isRoot && (
              <>
                <span
                  className="text-muted-foreground/40 font-normal select-none"
                  aria-hidden
                >
                  •
                </span>
                <div className="flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow-2xs">
                  <IconCalendar
                    className="size-3 text-primary shrink-0"
                    stroke={1.8}
                  />
                  <span>Periode {currentPeriod}</span>
                </div>
              </>
            )}
          </li>

          {!isRoot && (
            <>
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <li key={crumb.href || idx} className="flex items-center gap-1.5 min-w-0">
                    <IconChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
                    {isLast || !crumb.href ? (
                      <span
                        className={cn(
                          "truncate max-w-[200px] sm:max-w-xs",
                          isLast
                            ? "font-semibold text-foreground tracking-tight"
                            : "text-muted-foreground/90 font-medium",
                        )}
                        aria-current={isLast ? "page" : undefined}
                      >
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="truncate max-w-[150px] text-muted-foreground hover:text-foreground transition-colors font-medium hover:underline underline-offset-4 decoration-border/80"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </>
          )}
        </ol>
      </nav>

      {/* Kanan: Tombol Kembali di Pojok Kanan */}
      <div className="shrink-0 pl-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleBack}
          disabled={isRoot}
          className={cn(
            "h-7 gap-1.5 px-2.5 rounded-md border border-border/80 bg-background/80 text-xs font-medium text-muted-foreground transition-all shadow-2xs",
            isRoot
              ? "opacity-30 cursor-not-allowed hover:bg-background hover:text-muted-foreground"
              : "hover:bg-muted/80 hover:text-foreground hover:border-border active:scale-95 cursor-pointer",
          )}
          title={isRoot ? "Anda sedang di halaman utama" : "Kembali ke halaman sebelumnya"}
          aria-label="Kembali ke halaman sebelumnya"
        >
          <IconArrowLeft className="size-3.5" />
          <span className="hidden sm:inline">Kembali</span>
        </Button>
      </div>
    </div>
  );
}
