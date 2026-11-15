"use client";

import { useEffect } from "react";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default function BaganAkunError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Gagal memuat Bagan Akun:", error);
  }, [error]);

  return (
    <div className="flex min-h-[360px] w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center shadow-xs">
      <div className="flex size-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-4 ring-rose-500/10">
        <IconAlertTriangle className="size-6" aria-hidden="true" />
      </div>

      <h2 className="mt-4 text-base font-semibold text-foreground">
        Gagal Memuat Bagan Akun
      </h2>
      <p className="mt-1.5 max-w-md text-xs text-muted-foreground leading-relaxed">
        Terjadi kendala saat menghubungkan data bagan akun ke server. Silakan coba lagi atau hubungi administrator sistem.
      </p>

      <div className="mt-5 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="text-xs"
        >
          Muat Ulang Halaman
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => reset()}
          className="text-xs"
        >
          <IconRefresh className="mr-1.5 size-3.5" aria-hidden="true" />
          Coba Lagi
        </Button>
      </div>
    </div>
  );
}
