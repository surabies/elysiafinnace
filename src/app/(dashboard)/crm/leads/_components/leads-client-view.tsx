"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconEdit,
  IconLoader2,
  IconMail,
  IconPhone,
  IconPlus,
  IconSearch,
  IconTargetArrow,
  IconUserCheck,
  IconUserPlus,
} from "@tabler/icons-react";
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { toast } from "sonner";
import { getApi } from "@/lib/api-client";
import { LeadDialog } from "./lead-dialog";
import Link from "next/link";
import { ROUTES } from "@/components/layout/sidebar/routes";

export type StatusLeadType = "BARU" | "DIHUBUNGI" | "KUALIFIKASI" | "PROPOSAL" | "NEGOSIASI" | "MENANG" | "KALAH";

export interface ItemLead {
  id: string;
  kode: string;
  nama: string;
  perusahaan?: string | null;
  email?: string | null;
  telepon?: string | null;
  sumber: string;
  status: StatusLeadType;
  nilaiEstimasi: string;
  kontakId?: string | null;
  kontakNama?: string | null;
  assignedTo?: string | null;
  catatan?: string | null;
  dibuatPada: Date | string;
}

interface LeadsClientViewProps {
  initialLeads: ItemLead[];
}

export function LeadsClientView({ initialLeads }: LeadsClientViewProps) {
  const router = useRouter();
  const [leads, setLeads] = React.useState<ItemLead[]>(initialLeads);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<ItemLead | null>(null);
  const [convertingId, setConvertingId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    if (!search) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.nama?.toLowerCase().includes(q) ||
        l.perusahaan?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.kode?.toLowerCase().includes(q),
    );
  }, [leads, search]);

  const handleKonversi = async (id: string, nama: string) => {
    if (!confirm(`Konfirmasi konversi prospek '${nama}' menjadi Kontak Pelanggan resmi?`)) return;

    try {
      setConvertingId(id);
      const res = await getApi().keuangan.crm.lead({ id }).konversi.post();
      if (res.error) {
        toast.error((res.error.value as { message?: string })?.message || "Gagal mengonversi prospek");
        return;
      }

      toast.success(res.data?.pesan || "Prospek berhasil dikonversi menjadi Kontak Pelanggan!");
      router.refresh();
      setLeads(
        leads.map((l) =>
          l.id === id ? { ...l, status: "MENANG", kontakNama: nama } : l,
        ),
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setConvertingId(null);
    }
  };

  const totalPotensi = leads.reduce((sum, l) => sum + Number(l.nilaiEstimasi || 0), 0);
  const leadsBaru = leads.filter((l) => l.status === "BARU").length;
  const leadsConverted = leads.filter((l) => l.kontakId || l.status === "MENANG").length;

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconTargetArrow className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Estimasi Pipeline</p>
            <h3 className="text-2xl font-bold tracking-tight">
              Rp {totalPotensi.toLocaleString("id-ID")}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <IconUserPlus className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Prospek Baru Masuk</p>
            <h3 className="text-2xl font-bold tracking-tight">{leadsBaru} Leads</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <IconUserCheck className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Berhasil Konversi ke Klien</p>
            <h3 className="text-2xl font-bold tracking-tight">{leadsConverted} Klien</h3>
          </div>
        </div>
      </div>

      {/* Main Frame */}
      <Frame>
        <FrameHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <FrameTitle>Daftar Calon Klien & Prospek (CRM Leads)</FrameTitle>
            <p className="text-xs text-muted-foreground">
              Kelola prospek bisnis potensial dan konversikan dengan satu klik ke Master Data Pelanggan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={ROUTES.crm.deals}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <IconTargetArrow className="size-4" />
                Pipeline Deals
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => {
                setSelectedLead(null);
                setDialogOpen(true);
              }}
              className="gap-1.5"
            >
              <IconPlus className="size-4" />
              Tambah Prospek
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
                placeholder="Cari nama, perusahaan, atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground border-b font-medium">
                <tr>
                  <th className="p-3">Kode & PIC</th>
                  <th className="p-3">Perusahaan</th>
                  <th className="p-3">Kontak</th>
                  <th className="p-3">Sumber</th>
                  <th className="p-3 text-right">Potensi Nilai</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      Belum ada prospek tercatat. Klik &quot;Tambah Prospek&quot; untuk memulai.
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3">
                        <p className="font-semibold">{l.nama}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{l.kode}</p>
                      </td>
                      <td className="p-3 font-medium">
                        {l.perusahaan || "-"}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {l.email && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <IconMail className="size-3" />
                            {l.email}
                          </div>
                        )}
                        {l.telepon && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <IconPhone className="size-3" />
                            {l.telepon}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] py-0">{l.sumber}</Badge>
                      </td>
                      <td className="p-3 text-right font-bold text-primary">
                        Rp {Number(l.nilaiEstimasi || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={
                            l.status === "MENANG"
                              ? "success"
                              : l.status === "BARU"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {l.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {!l.kontakId && l.status !== "MENANG" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 px-2 gap-1 text-xs"
                              disabled={convertingId === l.id}
                              onClick={() => handleKonversi(l.id, l.nama)}
                            >
                              {convertingId === l.id ? (
                                <IconLoader2 className="size-3.5 animate-spin" />
                              ) : (
                                <IconUserCheck className="size-3.5" />
                              )}
                              Konversi ke Pelanggan
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-7 p-0"
                            onClick={() => {
                              setSelectedLead(l);
                              setDialogOpen(true);
                            }}
                          >
                            <IconEdit className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </FramePanel>

        <FrameFooter className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Menampilkan {filtered.length} prospek</span>
        </FrameFooter>
      </Frame>

      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={selectedLead}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
