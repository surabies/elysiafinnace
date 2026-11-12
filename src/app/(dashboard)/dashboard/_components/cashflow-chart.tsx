import { Panel } from "@/app/(dashboard)/dashboard/_components/panel";
import { formatRupiah, formatRupiahCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MonthlyPoint } from "../_lib/types";

const GRID_TICKS = [1, 0.75, 0.5, 0.25, 0];

/** Pembulatan ke atas ke angka "bulat" (1/2/5 × 10^n) agar sumbu rapi. */
function niceCeil(value: number) {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function Bar({
  value,
  max,
  index,
  className,
}: {
  value: number;
  max: number;
  index: number;
  className: string;
}) {
  return (
    <div
      className={cn(
        "w-full max-w-4 origin-bottom animate-grow-y rounded-t-sm",
        className,
      )}
      style={{
        height: `${(value / max) * 100}%`,
        animationDelay: `${450 + index * 45}ms`,
      }}
    />
  );
}

function Legend() {
  return (
    <ul className="flex items-center gap-4 text-xs text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-2.5 rounded-sm bg-primary" />{" "}
        Pendapatan
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-2.5 rounded-sm bg-signal" /> Beban
      </li>
    </ul>
  );
}

export function CashflowChart({ data }: { data: MonthlyPoint[] }) {
  const max = niceCeil(
    Math.max(...data.flatMap((p) => [p.pendapatan, p.beban])),
  );

  return (
    <Panel
      title="Pendapatan dan beban"
      description="12 bulan terakhir"
      action={<Legend />}
      className="h-full"
    >
      <div className="grid grid-cols-[4rem_1fr] gap-3">
        {/* sumbu Y */}
        <div aria-hidden className="relative mt-2 h-56">
          {GRID_TICKS.map((t) => (
            <span
              key={t}
              className="absolute right-0 translate-y-1/2 text-[11px] tabular-nums text-muted-foreground"
              style={{ bottom: `${t * 100}%` }}
            >
              {formatRupiahCompact(max * t)}
            </span>
          ))}
        </div>

        <div>
          <div
            role="img"
            aria-label="Grafik batang pendapatan dan beban per bulan selama 12 bulan terakhir"
            className="relative mt-2 h-56"
          >
            {GRID_TICKS.map((t) => (
              <div
                key={t}
                className={cn(
                  "absolute inset-x-0 border-t",
                  t !== 0 && "border-dashed",
                )}
                style={{ bottom: `${t * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex gap-2">
              {data.map((p, i) => (
                <div
                  key={p.month}
                  title={`${p.month}: pendapatan ${formatRupiah(p.pendapatan)}, beban ${formatRupiah(p.beban)}`}
                  className="flex flex-1 items-end justify-center gap-1 rounded-md px-0.5 transition-colors duration-200 hover:bg-muted/70"
                >
                  <Bar
                    value={p.pendapatan}
                    max={max}
                    index={i}
                    className="bg-primary"
                  />
                  <Bar
                    value={p.beban}
                    max={max}
                    index={i}
                    className="bg-signal"
                  />
                </div>
              ))}
            </div>
          </div>

          <div aria-hidden className="mt-2 flex gap-2">
            {data.map((p) => (
              <span
                key={p.month}
                className="flex-1 text-center text-[11px] text-muted-foreground"
              >
                {p.month}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
