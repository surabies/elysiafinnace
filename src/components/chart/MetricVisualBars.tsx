import { formatRupiah, rupiahToBigInt } from "@/lib/format";

interface MetricVisualBarsProps {
  label: string;
  data: { period: string; value: string }[];
  color?: string;
}

export function MetricVisualBars({
  label,
  data,
  color = "var(--chart-3)",
}: MetricVisualBarsProps) {
  const values = data.map(({ value }) => rupiahToBigInt(value));
  const maxValue = values.reduce((max, value) => {
    const absolute = value < 0 ? -value : value;
    return absolute > max ? absolute : max;
  }, BigInt(0));
  const hasNegativeValue = values.some((value) => value < 0);

  return (
    <div
      role="group"
      aria-label={`Tren ${data.length} periode: ${label}`}
      className="relative flex h-14 items-end gap-1"
    >
      {hasNegativeValue && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 border-t border-border/70"
        />
      )}
      {data.map((point, index) => {
        const value = values[index]!;
        const absoluteValue =
          value < 0 ? -value : value;
        const heightPercentage =
          maxValue > BigInt(0) && absoluteValue > BigInt(0)
            ? Math.max(
                6,
                Number((absoluteValue * BigInt(10000)) / maxValue) / 100,
              )
            : 0;
        const height = hasNegativeValue
          ? heightPercentage / 2
          : heightPercentage;
        const center = ((index + 0.5) / data.length) * 100;
        const isNegative = value < 0;

        return (
          <div
            key={point.period}
            className="group flex h-full flex-1"
          >
            <button
              type="button"
              aria-label={`${point.period}, ${label}: ${formatRupiah(point.value)}`}
              className="relative z-20 h-full w-full rounded-t-[2px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span
                aria-hidden
                className={`absolute inset-x-0 transition-[height,opacity] duration-200 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none ${hasNegativeValue && isNegative ? "rounded-b-[2px]" : "rounded-t-[2px]"}`}
                style={{
                  height: `${height}%`,
                  top: hasNegativeValue && isNegative ? "50%" : undefined,
                  bottom: hasNegativeValue
                    ? isNegative
                      ? undefined
                      : "50%"
                    : "0",
                  backgroundColor: color,
                  opacity: index === data.length - 1 ? 1 : 0.45,
                }}
              />
            </button>
            <div
              role="tooltip"
              aria-hidden="true"
              className="pointer-events-none invisible absolute bottom-[calc(100%+0.5rem)] z-30 w-44 rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground opacity-0 shadow-md transition-[opacity,transform,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 motion-reduce:transition-none"
              style={{
                left: `clamp(0px, calc(${center}% - 5.5rem), calc(100% - 11rem))`,
              }}
            >
              <p className="truncate text-[11px] text-muted-foreground">
                {point.period}
              </p>
              <p className="truncate text-xs font-medium tabular-nums">
                {formatRupiah(point.value)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
