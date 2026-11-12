"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-5xl flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-semibold">Gagal memuat dashboard keuangan</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Terjadi kendala saat memuat data. Silakan coba kembali.
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Coba Lagi
      </Button>
    </main>
  );
}
