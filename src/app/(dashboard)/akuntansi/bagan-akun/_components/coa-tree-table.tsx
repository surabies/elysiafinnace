"use client";

import * as React from "react";
import {
  IconChevronDown,
  IconChevronRight,
  IconDots,
  IconEdit,
  IconFolder,
  IconFolderOpen,
  IconPlus,
} from "@tabler/icons-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/feedback/empty-state";
import { cn } from "@/lib/utils";
import type { NodeAkun, TipeAkun } from "../_lib/types";

export interface CoaTreeTableRef {
  expandAll: () => void;
  collapseAll: () => void;
}

interface CoaTreeTableProps {
  nodes: NodeAkun[];
  onEdit: (node: NodeAkun) => void;
  onAddSub: (node: NodeAkun) => void;
  searchQuery?: string;
  selectedType?: string;
}

function getTypeBadge(tipe: TipeAkun) {
  switch (tipe) {
    case "ASET":
      return (
        <Badge variant="success-light" size="sm">
          Aset
        </Badge>
      );
    case "KEWAJIBAN":
      return (
        <Badge variant="warning-light" size="sm">
          Kewajiban
        </Badge>
      );
    case "EKUITAS":
      return (
        <Badge variant="primary-light" size="sm">
          Ekuitas
        </Badge>
      );
    case "PENDAPATAN":
      return (
        <Badge variant="info-light" size="sm">
          Pendapatan
        </Badge>
      );
    case "BEBAN":
      return (
        <Badge variant="destructive-light" size="sm">
          Beban
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" size="sm">
          {tipe}
        </Badge>
      );
  }
}

export const CoaTreeTable = React.forwardRef<CoaTreeTableRef, CoaTreeTableProps>(
  function CoaTreeTable(
    {
      nodes,
      onEdit,
      onAddSub,
      searchQuery = "",
      selectedType = "ALL",
    },
    ref
  ) {
    // State untuk ID node yang dibuka (expanded)
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => {
      // Default: buka akun level 1 & 2
      const initial = new Set<string>();
      const collect = (list: NodeAkun[]) => {
        for (const n of list) {
          if (n.level <= 2 && n.anak?.length > 0) {
            initial.add(n.id);
          }
          if (n.anak?.length > 0) collect(n.anak);
        }
      };
      collect(nodes);
      return initial;
    });

    const toggleExpand = (id: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    };

    const expandAll = React.useCallback(() => {
      const all = new Set<string>();
      const collect = (list: NodeAkun[]) => {
        for (const n of list) {
          if (n.anak?.length > 0) all.add(n.id);
          if (n.anak?.length > 0) collect(n.anak);
        }
      };
      collect(nodes);
      setExpandedIds(all);
    }, [nodes]);

    const collapseAll = React.useCallback(() => {
      setExpandedIds(new Set());
    }, []);

    React.useImperativeHandle(
      ref,
      () => ({
        expandAll,
        collapseAll,
      }),
      [expandAll, collapseAll]
    );

    const filteredTree = React.useMemo(() => {
      const filterNode = (node: NodeAkun): NodeAkun | null => {
        const matchesSearch =
          !searchQuery ||
          node.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.nama.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType =
          selectedType === "ALL" || node.tipeAkun === selectedType;

        const filteredChildren = node.anak
          ? (node.anak.map(filterNode).filter(Boolean) as NodeAkun[])
          : [];

        if ((matchesSearch && matchesType) || filteredChildren.length > 0) {
          return {
            ...node,
            anak: filteredChildren,
          };
        }
        return null;
      };

      return nodes.map(filterNode).filter(Boolean) as NodeAkun[];
    }, [nodes, searchQuery, selectedType]);

    const renderRows = (list: NodeAkun[], depth: number = 0): React.ReactNode => {
      return list.map((node) => {
        const hasChildren = node.anak && node.anak.length > 0;
        const isExpanded = expandedIds.has(node.id) || Boolean(searchQuery);

        return (
          <React.Fragment key={node.id}>
            <tr
              className={cn(
                "border-b border-border/40 hover:bg-muted/40 transition-colors h-10",
                node.level === 1
                  ? "bg-muted/25 font-semibold"
                  : !node.bisaDiposting
                  ? "bg-muted/10 font-medium"
                  : ""
              )}
            >
              {/* Kolom Spacer (sebagai pengganti checkbox agar sejajar dengan DataGrid) */}
              <td className="w-10 px-3 py-2 text-center text-muted-foreground/30">
                <span className="text-[10px] select-none">•</span>
              </td>

              {/* Kolom Kode Akun dengan Tree Expander */}
              <td className="w-56 px-3 py-2 font-mono text-xs">
                <div
                  className="flex items-center gap-1.5"
                  style={{ paddingLeft: `${depth * 18}px` }}
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(node.id)}
                      className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-transform"
                      aria-label={isExpanded ? "Tutup grup akun" : "Buka grup akun"}
                    >
                      {isExpanded ? (
                        <IconChevronDown className="size-3.5" aria-hidden="true" />
                      ) : (
                        <IconChevronRight className="size-3.5" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    <span className="inline-block size-5 shrink-0" />
                  )}

                  {!node.bisaDiposting ? (
                    isExpanded ? (
                      <IconFolderOpen
                        className="size-4 shrink-0 text-amber-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <IconFolder
                        className="size-4 shrink-0 text-amber-500"
                        aria-hidden="true"
                      />
                    )
                  ) : null}

                  <span
                    className={cn(
                      "font-mono text-xs",
                      node.level === 1
                        ? "font-bold text-foreground"
                        : node.level === 2
                        ? "font-semibold text-foreground"
                        : !node.bisaDiposting
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {node.kode}
                  </span>
                </div>
              </td>

              {/* Kolom Nama Akun (Penebalan berjenjang, tanpa badge kontra/peran) */}
              <td className="px-3 py-2 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className={cn(
                      "truncate",
                      node.level === 1
                        ? "text-sm font-bold tracking-tight text-foreground"
                        : node.level === 2
                        ? "text-xs font-semibold text-foreground"
                        : !node.bisaDiposting
                        ? "text-xs font-medium text-foreground"
                        : "text-xs font-normal text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {node.nama}
                  </span>
                  {node.kodeMataUang && (
                    <Badge variant="outline" className="px-1 py-0 text-[10px] h-4 font-mono font-medium text-primary border-primary/30 bg-primary/5 shrink-0">
                      {node.kodeMataUang}
                    </Badge>
                  )}
                </div>
              </td>

              {/* Kolom Tipe Akun (REUI Badge) */}
              <td className="w-32 px-3 py-2 text-xs">
                {getTypeBadge(node.tipeAkun)}
              </td>

              {/* Kolom Klasifikasi */}
              <td className="w-36 px-3 py-2 text-xs">
                {!node.bisaDiposting ? (
                  <Badge variant="secondary" size="sm">
                    Header (L{node.level})
                  </Badge>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Posting</span>
                )}
              </td>

              {/* Kolom Saldo Normal */}
              <td className="w-32 px-3 py-2 text-xs">
                {node.normalBalance === "DEBIT" ? (
                  <Badge variant="success-light" size="sm" className="font-mono">
                    Debit (Dr)
                  </Badge>
                ) : (
                  <Badge variant="info-light" size="sm" className="font-mono">
                    Kredit (Cr)
                  </Badge>
                )}
              </td>

              {/* Kolom Aksi (Titik 3 Horizontal) */}
              <td className="w-16 px-3 py-2 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-foreground"
                    >
                      <IconDots className="size-4" />
                      <span className="sr-only">Buka menu aksi</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => onEdit(node)}>
                      <IconEdit className="mr-2 size-3.5" />
                      Ubah
                    </DropdownMenuItem>
                    {!node.bisaDiposting && (
                      <DropdownMenuItem onClick={() => onAddSub(node)}>
                        <IconPlus className="mr-2 size-3.5" />
                        Tambah Sub
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>

            {/* Render anak jika sedang di-expand */}
            {hasChildren && isExpanded && renderRows(node.anak, depth + 1)}
          </React.Fragment>
        );
      });
    };

    return (
      <div className="w-full">
        <table className="w-full caption-bottom text-xs border-collapse">
          {/* Thead dengan style 100% identik dengan DataGridTable */}
          <thead className="border-b border-border bg-muted/40">
            <tr className="h-10 border-b border-border text-left">
              <th className="w-10 px-3 text-center text-xs font-medium text-muted-foreground">
                #
              </th>
              <th className="w-56 px-3 text-xs font-medium text-muted-foreground">
                Kode Akun
              </th>
              <th className="px-3 text-xs font-medium text-muted-foreground">
                Nama Akun
              </th>
              <th className="w-32 px-3 text-xs font-medium text-muted-foreground">
                Tipe Akun
              </th>
              <th className="w-36 px-3 text-xs font-medium text-muted-foreground">
                Klasifikasi
              </th>
              <th className="w-32 px-3 text-xs font-medium text-muted-foreground">
                Saldo Normal
              </th>
              <th className="w-16 px-3 text-right text-xs font-medium text-muted-foreground">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filteredTree.length > 0 ? (
              renderRows(filteredTree)
            ) : (
              <tr>
                <td colSpan={7} className="h-44 text-center p-6">
                  <EmptyState
                    title="Tidak ada akun yang sesuai"
                    description="Coba ubah kata kunci pencarian atau sesuaikan filter tipe akun."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
);
