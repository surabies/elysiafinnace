import Link from "next/link";
import { IconArrowDown, IconArrowRight, IconArrowUp } from "@tabler/icons-react";
import type { MetricCardData } from "../types/MetricCardTypes";
import { MetricVisualBars } from "./MetricVisualBars";

export function MetricCard({ data }: { data: MetricCardData }) {
  const DeltaIcon =
    data.delta?.direction === "up"
      ? IconArrowUp
      : data.delta?.direction === "down"
        ? IconArrowDown
        : null;

  const toneClass = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  }[data.delta?.tone ?? "neutral"];

  return (
    <article className="flex h-[220px] w-full flex-col overflow-hidden rounded-md border border-border/80 bg-card transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-xs">
      <div className="flex flex-1 flex-col px-4 pt-3.5 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-[15px] font-medium tracking-tight">
              {data.title}
            </h3>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {data.rightLabel}
          </span>
        </div>

        <div className="mt-1 flex min-w-0 items-baseline gap-2">
          <div className="flex min-w-0 items-baseline gap-1">
            <span className="truncate font-display text-2xl font-semibold leading-none tracking-tight tabular-nums">
              {data.value}
            </span>
            {data.denominator && (
              <span className="text-lg text-muted-foreground tabular-nums">
                {data.denominator}
              </span>
            )}
            {data.unit && (
              <span className="text-base text-muted-foreground">
                {data.unit}
              </span>
            )}
          </div>
          {data.delta && (
            <span
              className={`inline-flex shrink-0 items-center gap-0.5 font-mono text-xs font-medium ${toneClass}`}
            >
              {DeltaIcon && <DeltaIcon className="size-3" aria-hidden />}
              {data.delta.text}
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {data.helperText}
        </p>

        <div className="mt-auto pt-1">
          <MetricVisualBars
            label={data.title}
            data={data.visual.data}
            color={data.visual.color}
          />
        </div>
      </div>

      <Link
        href={data.footer.href}
        className="group flex h-9 w-full items-center justify-between border-t border-border bg-muted/30 px-4 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="transition-colors group-hover:text-foreground">
          {data.footer.label}
        </span>
        <IconArrowRight className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
      </Link>
    </article>
  );
}
