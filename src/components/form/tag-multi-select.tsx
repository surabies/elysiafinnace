"use client";

import * as React from "react";
import {
  IconTag,
  IconCheck,
  IconPlus,
  IconSearch,
  IconX,
  IconLoader2,
} from "@tabler/icons-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { TagFormDialog } from "@/app/(dashboard)/pengaturan/tag/_components/tag-form-dialog";

export interface ItemTagOption {
  id: string;
  nama: string;
  warna: string | null;
}

interface TagMultiSelectProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
  options?: ItemTagOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TagMultiSelect({
  value = [],
  onChange,
  options: externalOptions,
  placeholder = "Pilih label tag transaksi...",
  disabled = false,
  className,
}: TagMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [internalOptions, setInternalOptions] = React.useState<ItemTagOption[]>(
    [],
  );
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = React.useState(false);

  // Ambil opsi tag dari backend jika tidak di-pass externalOptions
  const fetchTags = React.useCallback(async () => {
    if (externalOptions) return;
    setIsLoading(true);
    try {
      const api = getApi();
      const res = await api.keuangan.dimensi.tag.get({ query: { limit: 100 } });
      const payload = res.data?.data;
      const rawList = Array.isArray(payload)
        ? payload
        : payload &&
            typeof payload === "object" &&
            "items" in payload &&
            Array.isArray((payload as { items: unknown[] }).items)
          ? (payload as { items: unknown[] }).items
          : [];

      const mapped: ItemTagOption[] = (
        rawList as Record<string, unknown>[]
      ).map((t) => ({
        id: String(t.id),
        nama: String(t.nama),
        warna: t.warna ? String(t.warna) : "#475569",
      }));
      setInternalOptions(mapped);
    } catch {
      // Abaikan jika error jaringan
    } finally {
      setIsLoading(false);
    }
  }, [externalOptions]);

  React.useEffect(() => {
    if (externalOptions) return;

    let ignore = false;
    const loadTags = async () => {
      try {
        const api = getApi();
        const res = await api.keuangan.dimensi.tag.get({ query: { limit: 100 } });
        if (ignore) return;
        const payload = res.data?.data;
        const rawList = Array.isArray(payload)
          ? payload
          : payload &&
              typeof payload === "object" &&
              "items" in payload &&
              Array.isArray((payload as { items: unknown[] }).items)
            ? (payload as { items: unknown[] }).items
            : [];

        const mapped: ItemTagOption[] = (
          rawList as Record<string, unknown>[]
        ).map((t) => ({
          id: String(t.id),
          nama: String(t.nama),
          warna: t.warna ? String(t.warna) : "#475569",
        }));
        setInternalOptions(mapped);
      } catch {
        // Abaikan
      }
    };

    void loadTags();

    return () => {
      ignore = true;
    };
  }, [externalOptions]);

  const availableTags = externalOptions ?? internalOptions;

  const selectedTags = React.useMemo(() => {
    return availableTags.filter((t) => value.includes(t.id));
  }, [availableTags, value]);

  const filteredTags = React.useMemo(() => {
    if (!search) return availableTags;
    return availableTags.filter((t) =>
      t.nama.toLowerCase().includes(search.toLowerCase()),
    );
  }, [availableTags, search]);

  const toggleTag = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const removeTag = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== id));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-left",
              selectedTags.length === 0 && "text-muted-foreground",
            )}
          >
            <IconTag className="size-3.5 text-muted-foreground shrink-0" />
            {selectedTags.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedTags.map((tag) => {
                  const warna = tag.warna || "#475569";
                  return (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium shadow-2xs transition-all"
                      style={{
                        backgroundColor: `${warna}15`,
                        color: warna,
                        border: `1px solid ${warna}40`,
                      }}
                    >
                      <span
                        className="size-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: warna }}
                      />
                      <span>{tag.nama}</span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => removeTag(e, tag.id)}
                        className="hover:opacity-80 cursor-pointer ml-0.5"
                      >
                        <IconX className="size-2.5" />
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-64 p-0" align="start">
          {/* Header Search Box */}
          <div className="flex items-center border-b border-border/80 px-2.5 py-1.5">
            <IconSearch className="mr-2 size-3.5 text-muted-foreground shrink-0" />
            <Input
              placeholder="Cari label tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 text-xs border-0 shadow-none focus-visible:ring-0 p-0"
            />
          </div>

          {/* List Tag */}
          <div className="max-h-52 overflow-y-auto p-1 text-xs">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-xs">
                <IconLoader2 className="size-3.5 animate-spin" />
                <span>Memuat tag...</span>
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                Tidak ada tag yang sesuai.
              </div>
            ) : (
              filteredTags.map((tag) => {
                const isSelected = value.includes(tag.id);
                const warna = tag.warna || "#475569";
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded px-2 py-1.5 text-xs text-left cursor-pointer transition-colors",
                      isSelected
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-muted/60 text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: warna }}
                      />
                      <span className="truncate">{tag.nama}</span>
                    </div>
                    {isSelected && (
                      <IconCheck className="size-3.5 text-primary shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Tombol Buat Tag Baru */}
          <div className="border-t border-border/80 p-1 bg-muted/20">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setQuickCreateOpen(true);
              }}
              className="w-full justify-start h-7 text-xs font-normal gap-1.5 text-primary hover:text-primary cursor-pointer"
            >
              <IconPlus className="size-3.5" />
              <span>Buat Tag Baru...</span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Dialog Pembuatan Tag Cepat jika belum ada */}
      <TagFormDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        onSuccess={() => {
          fetchTags();
        }}
      />
    </div>
  );
}
