import { formatDate } from "@/lib/format";

type Props = {
  name: string;
  periodLabel: string;
  updatedAt: string;
  isSample: boolean;
};

export function PageHeader({ name, periodLabel, updatedAt, isSample }: Props) {
  const firstName = name.trim().split(/\s+/)[0] || "Pengguna";

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold md:text-3xl">
          Selamat datang, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan keuangan {periodLabel}
        </p>
      </div>
      <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
        {isSample && (
          <span className="rounded-full border border-signal/50 bg-signal/15 px-2.5 py-0.5 text-xs font-medium text-signal-foreground">
            Data contoh
          </span>
        )}
        <span>Diperbarui {formatDate(updatedAt)}</span>
      </div>
    </header>
  );
}
