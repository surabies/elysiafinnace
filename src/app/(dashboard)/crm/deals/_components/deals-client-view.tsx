"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowRight,
  IconCheck,
  IconClock,
  IconCoin,
  IconEdit,
  IconPlus,
  IconSearch,
  IconTargetArrow,
  IconUser,
} from "@tabler/icons-react";
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { toast } from "sonner";
import { getApi } from "@/lib/api-client";
import { DealDialog } from "./deal-dialog";
import Link from "next/link";
import { ROUTES } from "@/components/layout/sidebar/routes";

export type StageDealType = "PROSPEK" | "KUALIFIKASI" | "PENAWARAN" | "NEGOSIASI" | "MENANG" | "KALAH";

export interface ItemDeal {
  id: string;
  kode: string;
  judul: string;
  leadId?: string | null;
  leadNama?: string | null;
  kontakId?: string | null;
  kontakNama?: string | null;
  stage: StageDealType;
  nilaiPeluang: string;
  probabilitas: number;
  targetClosing?: string | null;
  assignedTo?: string | null;
  keterangan?: string | null;
  dibuatPada: Date | string;
}

interface OptionItem {
  id: string;
  nama: string;
}

interface DealsClientViewProps {
  initialDeals: ItemDeal[];
  leadsList: OptionItem[];
  kontakList: OptionItem[];
}

const STAGES: { id: StageDealType; title: string }[] = [
  { id: "PROSPEK", title: "Prospek Awal" },
  { id: "KUALIFIKASI", title: "Kualifikasi" },
  { id: "PENAWARAN", title: "Penawaran" },
  { id: "NEGOSIASI", title: "Negosiasi" },
  { id: "MENANG", title: "Closing (Menang)" },
];

export function DealsClientView({
  initialDeals,
  leadsList,
  kontakList,
}: DealsClientViewProps) {
  const router = useRouter();
  const [deals, setDeals] = React.useState<ItemDeal[]>(initialDeals);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedDeal, setSelectedDeal] = React.useState<ItemDeal | null>(null);

  const filtered = React.useMemo(() => {
    if (!search) return deals;
    const q = search.toLowerCase();
    return deals.filter(
      (d) =>
        d.judul?.toLowerCase().includes(q) ||
        d.kode?.toLowerCase().includes(q) ||
        d.leadNama?.toLowerCase().includes(q) ||
        d.kontakNama?.toLowerCase().includes(q),
    );
  }, [deals, search]);

  const handlePindahStage = async (dealId: string, nextStage: StageDealType) => {
    try {
      const res = await getApi().keuangan.crm.deal({ id: dealId }).stage.patch({
        stage: nextStage,
      });

      if (res.error) {
        toast.error("Gagal memindahkan tahapan deal.");
        return;
      }

      toast.success(`Deal berhasil dipindahkan ke tahapan '${nextStage}'.`);
      setDeals(
        deals.map((d) => (d.id === dealId ? { ...d, stage: nextStage } : d)),
      );
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan.");
    }
  };

  const totalNilaiPipeline = deals.reduce((sum, d) => sum + Number(d.nilaiPeluang || 0), 0);
  const totalMenang = deals
    .filter((d) => d.stage === "MENANG")
    .reduce((sum, d) => sum + Number(d.nilaiPeluang || 0), 0);
  const closingRate = deals.length > 0
    ? Math.round((deals.filter((d) => d.stage === "MENANG").length / deals.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconTargetArrow className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Nilai Pipeline Aktif</p>
            <h3 className="text-2xl font-bold tracking-tight">
              Rp {totalNilaiPipeline.toLocaleString("id-ID")}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <IconCoin className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Nilai Closing (Menang)</p>
            <h3 className="text-2xl font-bold tracking-tight">
              Rp {totalMenang.toLocaleString("id-ID")}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <IconCheck className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Win Rate Closing</p>
            <h3 className="text-2xl font-bold tracking-tight">{closingRate}%</h3>
          </div>
        </div>
      </div>

      {/* Main Kanban Board Frame */}
      <Frame>
        <FrameHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <FrameTitle>Pipeline Peluang Penjualan (Deals Board)</FrameTitle>
            <p className="text-xs text-muted-foreground">
              Visualisasi alur konversi peluang penjualan dari prospek awal hingga kontrak deal selesai.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={ROUTES.crm.leads}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <IconUser className="size-4" />
                Daftar Prospek (Leads)
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => {
                setSelectedDeal(null);
                setDialogOpen(true);
              }}
              className="gap-1.5"
            >
              <IconPlus className="size-4" />
              Peluang Deal Baru
            </Button>
          </div>
        </FrameHeader>

        <FramePanel className="space-y-4">
          <div className="flex items-center gap-3">
            <InputGroup className="max-w-sm">
              <InputGroupAddon>
                <IconSearch className="size-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Cari judul project atau klien..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </div>

          {/* Kanban Columns Strip */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start overflow-x-auto pb-4">
            {STAGES.map((stg, stgIdx) => {
              const stageDeals = filtered.filter((d) => d.stage === stg.id);
              const totalStageValue = stageDeals.reduce(
                (sum, d) => sum + Number(d.nilaiPeluang || 0),
                0,
              );

              return (
                <div
                  key={stg.id}
                  className="flex flex-col rounded-xl border bg-muted/20 p-3 min-w-[220px] space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div>
                      <h4 className="font-bold text-xs">{stg.title}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        Rp {totalStageValue.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] size-5 p-0 flex items-center justify-center">
                      {stageDeals.length}
                    </Badge>
                  </div>

                  <div className="space-y-2 min-h-[160px]">
                    {stageDeals.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground text-[11px] border border-dashed rounded-lg">
                        Tidak ada deal
                      </div>
                    ) : (
                      stageDeals.map((d) => (
                        <div
                          key={d.id}
                          className="p-3 rounded-lg border bg-card shadow-2xs hover:shadow-sm transition-all space-y-2 text-left"
                        >
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                            <span>{d.kode}</span>
                            <span className="font-bold text-primary">{d.probabilitas}%</span>
                          </div>

                          <h5 className="font-semibold text-xs leading-snug line-clamp-2">
                            {d.judul}
                          </h5>

                          <p className="font-bold text-xs text-foreground">
                            Rp {Number(d.nilaiPeluang || 0).toLocaleString("id-ID")}
                          </p>

                          {(d.leadNama || d.kontakNama) && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              Klien: {d.kontakNama || d.leadNama}
                            </p>
                          )}

                          {d.targetClosing && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <IconClock className="size-3" />
                              Target: {d.targetClosing}
                            </p>
                          )}

                          <div className="pt-2 border-t flex items-center justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-6 p-0"
                              onClick={() => {
                                setSelectedDeal(d);
                                setDialogOpen(true);
                              }}
                            >
                              <IconEdit className="size-3" />
                            </Button>

                            {stgIdx < STAGES.length - 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] gap-1"
                                onClick={() => {
                                  const next = STAGES[stgIdx + 1];
                                  if (next) handlePindahStage(d.id, next.id);
                                }}
                              >
                                Lanjut
                                <IconArrowRight className="size-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </FramePanel>

        <FrameFooter className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Menampilkan {filtered.length} total peluang deal di seluruh pipeline</span>
        </FrameFooter>
      </Frame>

      <DealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        leadsList={leadsList}
        kontakList={kontakList}
        deal={selectedDeal}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
