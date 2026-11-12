import { CheckCircle2, TriangleAlert } from "lucide-react";
import { Panel } from "@/app/(dashboard)/dashboard/_components/panel";
import { formatPercent, formatRupiah, formatRupiahCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FinancialPosition } from "../_lib/types";

type Props = { position: FinancialPosition; asOfLabel: string };

/** Baris bar: label di kiri, bar di kanan. Tanpa label = baris pengisi (untuk skala). */
function BarRow({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-2 sm:grid-cols-[9.5rem_1fr] sm:gap-4">
      {label ? (
        <span className="text-[13px] font-medium">{label}</span>
      ) : (
        <span aria-hidden className="hidden sm:block" />
      )}
      {children}
    </div>
  );
}

/** Skala tick tiap 5% — gema dari penggaris di sidebar. */
function TickScale() {
  return (
    <div
      aria-hidden
      className="h-1.5 w-full border-t"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px 5%)",
      }}
    />
  );
}

/** Hero dashboard: persamaan akuntansi digambar sebagai dua bar yang harus sama panjang. */
export function EquationCard({ position, asOfLabel }: Props) {
  const { aset, kewajiban, ekuitas } = position;
  const difference = aset - (kewajiban + ekuitas);
  const balanced = difference === 0;
  const share = (value: number) => (aset > 0 ? (value / aset) * 100 : 0);

  const [asetSeg, ...sumberSeg] = [
    {
      key: "aset",
      label: "Aset",
      value: aset,
      swatch: "bg-primary",
      note: "Total sumber daya yang dimiliki",
    },
    {
      key: "kewajiban",
      label: "Kewajiban",
      value: kewajiban,
      swatch: "bg-signal",
      note: `${formatPercent(share(kewajiban))} dari aset`,
    },
    {
      key: "ekuitas",
      label: "Ekuitas",
      value: ekuitas,
      swatch: "bg-foreground",
      note: `${formatPercent(share(ekuitas))} dari aset`,
    },
  ];
  const segments = [asetSeg, ...sumberSeg];

  const status = balanced ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
      <CheckCircle2 className="size-3.5" aria-hidden /> Seimbang
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
      <TriangleAlert className="size-3.5" aria-hidden /> Selisih{" "}
      {formatRupiahCompact(difference)}
    </span>
  );

  return (
    <Panel
      title="Posisi keuangan"
      description={`Aset = kewajiban + ekuitas, per ${asOfLabel}`}
      action={status}
    >
      <div className="flex flex-col gap-3">
        <BarRow label="Aset">
          <div
            className="h-9 origin-left animate-grow-x rounded-md bg-primary"
            style={{ animationDelay: "250ms" }}
          />
        </BarRow>
        <BarRow label="Kewajiban + ekuitas">
          <div className="flex h-9 gap-0.5">
            {sumberSeg.map((seg, i) => (
              <div
                key={seg.key}
                className={cn(
                  "origin-left animate-grow-x rounded-md",
                  seg.swatch,
                )}
                style={{
                  flex: `${share(seg.value)} 1 0%`,
                  animationDelay: `${330 + i * 80}ms`,
                }}
              />
            ))}
          </div>
        </BarRow>
        <BarRow>
          <TickScale />
        </BarRow>
      </div>

      <dl className="grid gap-4 border-t pt-4 sm:grid-cols-3">
        {segments.map((seg) => (
          <div key={seg.key} className="space-y-1">
            <dt className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <span
                aria-hidden
                className={cn("size-2.5 rounded-sm", seg.swatch)}
              />
              {seg.label}
            </dt>
            <dd className="font-display text-xl font-semibold tabular-nums tracking-tight">
              {formatRupiah(seg.value)}
            </dd>
            <dd className="text-xs text-muted-foreground">{seg.note}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
