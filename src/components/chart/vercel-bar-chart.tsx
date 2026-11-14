"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatRupiah, formatRupiahCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                         DATA TYPES & UTILITIES                             */
/* -------------------------------------------------------------------------- */

export interface VercelBarPoint {
  key?: string | number;
  label: string;
  shortLabel?: string;
  value: number;
  formattedValue?: string;
  secondaryValue?: number;
  secondaryFormattedValue?: string;
  transactionCount?: number;
}

export type VercelVisxPoint = VercelBarPoint;

export interface VercelBarChartProps {
  data: VercelBarPoint[];
  yAxisFormat?: "compact" | "idr-compact" | "idr-full";
  barColor?: string;
  seriesName?: string;
  secondaryBarColor?: string;
  secondarySeriesName?: string;
  showYAxis?: boolean;
  chartHeight?: number;
  className?: string;
}

export function truncateChartLabel(text: string, maxChars = 8): string {
  if (!text) return "";
  return text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text;
}

export function calculateNiceMax(max: number): number {
  if (max <= 0) return 100;
  const rawStep = max / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const niceNormalized =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10;

  const niceStep = niceNormalized * magnitude;
  return niceStep * 5;
}

export function defaultCompactNumberFormatter(value: number): string {
  if (value === 0) return "0";
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}Jt`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  return String(value);
}

const fullAxisTickFractions = [1, 0.8, 0.6, 0.4, 0.2, 0] as const;
const standardAxisTickFractions = [1, 0.8, 0.6, 0.4, 0.2, 0] as const;

/* -------------------------------------------------------------------------- */
/*                   STANDARDIZED VERCEL VISX BAR CHART                       */
/* -------------------------------------------------------------------------- */

export function VercelBarChart({
  data,
  yAxisFormat = "compact",
  barColor = "var(--chart-3)",
  seriesName = "Nilai",
  secondaryBarColor = "var(--chart-5)",
  secondarySeriesName,
  showYAxis = true,
  chartHeight = 180,
  className,
}: VercelBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState<number>(500);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [lastHoveredIndex, setLastHoveredIndex] = useState<number | null>(null);
  const [pointerY, setPointerY] = useState<number | null>(null);
  const tooltipId = useId();

  // Compute maximum scale
  const rawMax = useMemo(() => {
    const values = data.flatMap((point) =>
      secondarySeriesName
        ? [point.value, point.secondaryValue ?? 0]
        : [point.value],
    );
    return values.length ? Math.max(...values) : 0;
  }, [data, secondarySeriesName]);

  const niceMax = useMemo(() => calculateNiceMax(rawMax), [rawMax]);
  const yFormatter =
    yAxisFormat === "idr-compact"
      ? formatRupiahCompact
      : yAxisFormat === "idr-full"
        ? formatRupiah
        : defaultCompactNumberFormatter;

  const yAxisWidth = useMemo(() => {
    if (!showYAxis) return 0;

    if (yAxisFormat === "idr-full") {
      const maxLabelLength = fullAxisTickFractions.reduce<number>(
        (maxLength, fraction) =>
          Math.max(
            maxLength,
            formatRupiah(niceMax * fraction).length,
          ),
        0,
      );
      return Math.max(84, Math.ceil(maxLabelLength * 5.5 + 12));
    }

    return 52;
  }, [niceMax, showYAxis, yAxisFormat]);
  const chartTop = 14;
  const baseline = chartTop + chartHeight;
  const rotateXLabels =
    data.length > 10 &&
    data.some(
      (point) =>
        (point.shortLabel ?? truncateChartLabel(point.label, 8)).length > 4,
    );
  const totalSvgHeight = baseline + (rotateXLabels ? 72 : 33);
  const yAxisFontSize = yAxisFormat === "idr-full" ? 10 : 13;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateWidth = () => {
      setPlotWidth(Math.max(100, container.clientWidth - yAxisWidth));
    };

    const observer = new ResizeObserver(calculateWidth);
    observer.observe(container);
    calculateWidth();

    return () => observer.disconnect();
  }, [yAxisWidth]);

  const seriesCount = secondarySeriesName ? 2 : 1;
  const tickFractions =
    yAxisFormat === "idr-full"
      ? fullAxisTickFractions
      : standardAxisTickFractions;

  const yTicks = useMemo(() => {
    return tickFractions.map((fraction, index) => ({
      y: chartTop + (chartHeight * index) / (tickFractions.length - 1),
      value: niceMax * fraction,
    }));
  }, [chartHeight, chartTop, niceMax, tickFractions]);

  const columns = useMemo(() => {
    const count = data.length;
    if (count === 0) return [];
    const slotWidth = plotWidth / count;
    const barGap = seriesCount === 2 ? 2 : 0;
    const desiredBarWidth = Math.min(
      30,
      (slotWidth * 0.9 - barGap * (seriesCount - 1)) / seriesCount,
    );
    const minimumBarWidth = Math.min(6, slotWidth * 0.34);
    const barWidth = Math.max(minimumBarWidth, desiredBarWidth);

    return data.map((item, idx) => {
      const slotX = idx * slotWidth;
      const groupWidth = barWidth * seriesCount + barGap * (seriesCount - 1);
      const groupX = slotX + (slotWidth - groupWidth) / 2;
      const series = [
        {
          value: item.value,
          formattedValue: item.formattedValue,
          color: barColor,
          seriesName,
        },
        ...(secondarySeriesName
          ? [
              {
                value: item.secondaryValue ?? 0,
                formattedValue: item.secondaryFormattedValue,
                color: secondaryBarColor,
                seriesName: secondarySeriesName,
              },
            ]
          : []),
      ];
      const bars = series.map((entry, seriesIndex) => {
        const height =
          (Math.max(0, entry.value) / (niceMax || 1)) * chartHeight;
        return {
          ...entry,
          x: groupX + seriesIndex * (barWidth + barGap),
          width: barWidth,
          height,
          y: baseline - height,
        };
      });
      const hoverPadding = Math.min(
        5,
        Math.max(0, Math.floor((slotWidth - groupWidth) / 2)),
      );
      const overlayWidth = groupWidth + hoverPadding * 2;

      return {
        item,
        index: idx,
        slotX,
        slotWidth,
        groupX,
        groupWidth,
        overlayX: groupX - hoverPadding,
        overlayWidth,
        bars,
      };
    });
  }, [
    barColor,
    baseline,
    chartHeight,
    data,
    niceMax,
    plotWidth,
    secondaryBarColor,
    secondarySeriesName,
    seriesCount,
    seriesName,
  ]);

  const xTicks = useMemo(() => {
    return columns.map((col) => ({
      x: col.slotX + col.slotWidth / 2,
      label: col.item.shortLabel ?? truncateChartLabel(col.item.label, 8),
    }));
  }, [columns]);

  const activeColumn = hoveredIndex !== null ? columns[hoveredIndex] : null;
  const displayColumn =
    activeColumn ??
    (lastHoveredIndex !== null ? columns[lastHoveredIndex] ?? null : null);

  const targetCol = displayColumn;
  const barCenter = targetCol
    ? yAxisWidth + targetCol.groupX + targetCol.groupWidth / 2
    : 0;
  const groupLeft = targetCol ? yAxisWidth + targetCol.groupX : 0;
  const groupRight = targetCol
    ? groupLeft + targetCol.groupWidth
    : 0;
  const chartWidth = plotWidth + yAxisWidth;
  const tooltipHeight =
    (secondarySeriesName ? 78 : 58) +
    (displayColumn?.item.transactionCount !== undefined ? 18 : 0);
  const barTop = targetCol
    ? Math.min(...targetCol.bars.map((bar) => (bar.height > 0 ? bar.y : baseline)))
    : chartTop;
  const aboveBarTop = barTop - tooltipHeight - 10;
  const canPositionAboveBar = aboveBarTop >= chartTop + 4;
  const rightSpace = chartWidth - groupRight - 8;
  const leftSpace = groupLeft - 8;
  const sideSpace = Math.max(leftSpace, rightSpace);
  const tooltipWidth = canPositionAboveBar
    ? Math.min(280, chartWidth - 16)
    : Math.min(280, Math.max(120, sideSpace - 8));
  const minLeft = 8;
  const maxLeft = Math.max(minLeft, chartWidth - tooltipWidth - 8);
  const sideLeft =
    rightSpace >= tooltipWidth + 8
      ? groupRight + 8
      : leftSpace >= tooltipWidth + 8
        ? groupLeft - tooltipWidth - 8
        : rightSpace >= leftSpace
          ? groupRight + 8
          : groupLeft - tooltipWidth - 8;
  const preferredLeft = canPositionAboveBar
    ? barCenter - tooltipWidth / 2
    : sideLeft;
  const tooltipLeft = Math.max(minLeft, Math.min(maxLeft, preferredLeft));
  const tooltipTop = canPositionAboveBar
    ? aboveBarTop
    : Math.max(
        chartTop + 4,
        Math.min(
          baseline - tooltipHeight - 8,
          (pointerY ?? barTop) - tooltipHeight / 2,
        ),
      );

  return (
    <figure
      role="group"
      aria-label={`Grafik ${seriesName}${secondarySeriesName ? ` dan ${secondarySeriesName}` : ""}`}
      className={cn("relative w-full select-none overflow-visible", className)}
      onMouseLeave={() => {
        setHoveredIndex(null);
        setPointerY(null);
      }}
    >
      <div
        ref={containerRef}
        className="flex w-full items-start overflow-visible"
      >
        {showYAxis && (
          <svg
            height={totalSvgHeight}
            width={yAxisWidth}
            className="shrink-0 overflow-visible"
          >
            <g className="visx-group visx-axis visx-axis-left" transform="translate(8, 0)">
              {yTicks.map((tick, i) => (
                <g key={i} className="visx-group visx-axis-tick" transform="translate(0, 0)">
                  <svg x="0" y="0" fontSize="13" style={{ overflow: "visible" }}>
                    <text
                      x="-8"
                      y={tick.y}
                      fill="var(--muted-foreground)"
                      fontSize={yAxisFontSize}
                      dominantBaseline="middle"
                      textAnchor="start"
                      className="font-sans tabular-nums"
                    >
                      <tspan x="-8" dy="0em">
                        {yFormatter(tick.value)}
                      </tspan>
                    </text>
                  </svg>
                </g>
              ))}
            </g>
          </svg>
        )}

        {/* SVG Main Chart Area */}
        <svg
          height={totalSvgHeight}
          width={plotWidth}
          className="overflow-visible"
        >
          {/* Bottom X-Axis */}
          <g
            className="visx-group visx-axis visx-axis-bottom"
            transform={`translate(0, ${baseline})`}
          >
            {xTicks.map((tick, i) => (
              <g key={i} className="visx-group visx-axis-tick" transform="translate(0, 0)">
                <svg x="0" y="0" fontSize="13" style={{ overflow: "visible" }}>
                  <text
                    x={tick.x}
                    y="22"
                    fill="var(--muted-foreground)"
                    fontSize={data.length > 20 ? 10 : 12}
                    textAnchor={rotateXLabels ? "end" : "middle"}
                    transform={
                      rotateXLabels
                        ? `rotate(-45 ${tick.x} 22)`
                        : undefined
                    }
                    className="font-sans"
                  >
                    <tspan x={tick.x} dy="0em">
                      {tick.label}
                    </tspan>
                  </text>
                </svg>
              </g>
            ))}
          </g>

          {/* Horizontal Grid Lines */}
          <g className="visx-group visx-rows" transform="translate(0, 0)">
            {yTicks.map((tick, i) => (
              <line
                key={i}
                className="visx-line"
                x1="0"
                y1={tick.y}
                x2={plotWidth}
                y2={tick.y}
                fill="transparent"
                shapeRendering="crispEdges"
                stroke="var(--border)"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Modular Columns & Bars */}
          <g className="visx-group" transform="translate(0, 0)">
            {/* Invisible Slot Hit Areas for effortless cursor interaction */}
            {columns.map((col) => (
              <rect
                key={`hit-${col.index}`}
                role="img"
                tabIndex={0}
                aria-label={`${col.item.label}: ${col.bars
                  .map((bar) => `${bar.seriesName} ${bar.formattedValue ?? bar.value.toLocaleString("id-ID")}`)
                  .join(", ")}${col.item.transactionCount === undefined ? "" : `, ${col.item.transactionCount} transaksi`}`}
                aria-describedby={
                  hoveredIndex === col.index ? tooltipId : undefined
                }
                className="cursor-pointer focus:outline-none"
                height={chartHeight + 25}
                width={col.slotWidth}
                x={col.slotX}
                y={chartTop}
                fill="transparent"
                onMouseEnter={() => {
                  setHoveredIndex(col.index);
                  setLastHoveredIndex(col.index);
                }}
                onMouseMove={(event) => {
                  const bounds = containerRef.current?.getBoundingClientRect();
                  if (bounds) setPointerY(event.clientY - bounds.top);
                }}
                onFocus={() => {
                  setHoveredIndex(col.index);
                  setLastHoveredIndex(col.index);
                  setPointerY(null);
                }}
                onBlur={() => {
                  setHoveredIndex(null);
                  setPointerY(null);
                }}
              />
            ))}

            {/* Hover Highlight Overlay: slightly enlarged with rounded corners */}
            {columns.map((col) =>
              hoveredIndex === col.index ? (
                <rect
                  key={`overlay-${col.index}`}
                  className="pointer-events-none transition-opacity duration-150"
                  height={chartHeight}
                  width={col.overlayWidth}
                  x={col.overlayX}
                  y={chartTop}
                  rx={3}
                  fill="var(--ds-gray-alpha-200)"
                />
              ) : null
            )}

            {/* Grouped bars */}
            {columns.map((col) =>
              col.bars.map((bar, seriesIndex) =>
                bar.height > 0 ? (
                  <rect
                    key={`bar-${col.index}-${seriesIndex}`}
                    className="pointer-events-none transition-colors duration-150"
                    fill={bar.color}
                    height={bar.height}
                    width={bar.width}
                    x={bar.x}
                    y={bar.y}
                  />
                ) : null,
              ),
            )}
          </g>
        </svg>
      </div>

      {displayColumn && (
        <div
          className={cn(
            "pointer-events-none absolute z-30 min-w-[9rem] rounded-lg border border-border/50 bg-background px-2.5 py-2 text-xs text-foreground shadow-xl",
            "transition-[opacity,transform,left] duration-150 ease-out motion-reduce:transition-none",
            activeColumn
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-[0.98] translate-y-1",
          )}
          style={{
            left: tooltipLeft,
            top: tooltipTop,
            width: tooltipWidth,
          }}
          id={tooltipId}
          role="tooltip"
        >
          <div className="mb-2 truncate text-xs font-medium leading-tight">
            {displayColumn.item.label}
          </div>
          <div className="grid gap-1.5">
            {displayColumn.bars.map((bar) => (
              <div
                key={bar.seriesName}
                className="flex items-center justify-between gap-3"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: bar.color }}
                  />
                  <span className="truncate text-muted-foreground">
                    {bar.seriesName}
                  </span>
                </span>
                <span className="shrink-0 font-mono font-medium tabular-nums">
                  {bar.formattedValue ?? bar.value.toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
          {displayColumn.item.transactionCount !== undefined && (
            <div className="mt-2 border-t border-border/70 pt-1.5 text-[11px] text-muted-foreground">
              {displayColumn.item.transactionCount.toLocaleString("id-ID")} transaksi
            </div>
          )}
        </div>
      )}
    </figure>
  );
}

// Aliases for compatibility
export const VercelVisxBarChart = VercelBarChart;
