export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <span>Sistem Informasi Laporan Keuangan Enterprise</span>
        <span>
          API Health: <code className="font-mono">GET /api/health</code>
        </span>
      </div>
    </footer>
  );
}
