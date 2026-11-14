import { Reveal } from "@/app/(dashboard)/dashboard/_components/reveal";
import type { Kpi } from "../_lib/types";
import { KpiCard } from "./kpi-card";

type Props = { kpis: Kpi[]; comparisonLabel: string };

export function KpiStrip({ kpis, comparisonLabel }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi, i) => (
        <Reveal key={kpi.id} index={i}>
          <KpiCard kpi={kpi} comparisonLabel={comparisonLabel} />
        </Reveal>
      ))}
    </div>
  );
}
