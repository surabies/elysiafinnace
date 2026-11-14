"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { formatRupiah, rupiahToBigInt } from "@/lib/format";
import type { Kpi } from "../_lib/types";
import { Panel } from "./panel";

type CashBalancePoint = {
  period: string;
  shortPeriod: string;
  plotValue: number;
  formattedValue: string;
};

const chartConfig = {
  saldoKas: {
    label: "Saldo kas",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function isCashBalancePoint(value: unknown): value is CashBalancePoint {
  return (
    typeof value === "object" &&
    value !== null &&
    "period" in value &&
    typeof value.period === "string" &&
    "shortPeriod" in value &&
    typeof value.shortPeriod === "string" &&
    "plotValue" in value &&
    typeof value.plotValue === "number" &&
    "formattedValue" in value &&
    typeof value.formattedValue === "string"
  );
}

export function CashBalanceChart({ trend }: { trend: Kpi["trend"] }) {
  const chartData = useMemo(() => {
    const values = trend.map((point) => rupiahToBigInt(point.value));
    const maximum = values.reduce((result, value) => {
      const absolute = value < BigInt(0) ? -value : value;
      return absolute > result ? absolute : result;
    }, BigInt(0));

    return trend.map((point, index) => {
      const month = point.period.split(" ")[0] ?? point.period;
      const relativeValue =
        maximum === BigInt(0)
          ? 0
          : Number((values[index]! * BigInt(1_000_000)) / maximum) / 1_000_000;

      return {
        period: point.period,
        shortPeriod: month.slice(0, 3),
        plotValue: relativeValue,
        formattedValue: formatRupiah(point.value),
      };
    });
  }, [trend]);

  return (
    <Panel
      title="Saldo kas dan setara kas"
      description="Perkembangan saldo akhir per bulan"
      action={
        <span className="text-xs text-muted-foreground">12 bulan terakhir</span>
      }
    >
      {chartData.length > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="h-55 w-full aspect-auto"
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 8, right: 12, bottom: 0, left: 12 }}
          >
            <defs>
              <linearGradient
                id="saldo-kas-gradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-saldoKas)"
                  stopOpacity={0.24}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-saldoKas)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="shortPeriod"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload;
                if (!active || !isCashBalancePoint(point)) return null;

                return (
                  <div className="min-w-36 rounded-lg border border-border/50 bg-background px-2.5 py-2 text-xs text-foreground shadow-xl">
                    <p className="mb-1.5 text-muted-foreground">
                      {point.period}
                    </p>
                    <p className="font-mono font-medium tabular-nums">
                      {point.formattedValue}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="plotValue"
              stroke="var(--color-saldoKas)"
              strokeWidth={2}
              fill="url(#saldo-kas-gradient)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--color-saldoKas)" }}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <div className="flex h-55 items-center justify-center text-sm text-muted-foreground">
          Tren saldo kas belum tersedia.
        </div>
      )}
    </Panel>
  );
}
