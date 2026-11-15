"use client";

import * as React from "react";
import { IconCheck, IconSelector, IconCoin, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { getApi } from "@/lib/api-client";

export interface MataUangOption {
  id: string;
  kode: string;
  nama: string;
  simbol: string;
  jumlahDesimal: number;
  adalahMataUangDasar: boolean;
  aktif?: boolean;
}

interface MataUangSelectProps {
  value?: string | null;
  onChange?: (val: string | null, item?: MataUangOption | null) => void;
  options?: MataUangOption[];
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
}

export function MataUangSelect({
  value,
  onChange,
  options: externalOptions,
  placeholder = "Pilih mata uang...",
  disabled = false,
  allowClear = true,
  className,
}: MataUangSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [internalOptions, setInternalOptions] = React.useState<MataUangOption[]>([]);
  const [loading, setLoading] = React.useState(!externalOptions);

  React.useEffect(() => {
    if (externalOptions && externalOptions.length > 0) {
      return;
    }
    let ignore = false;
    async function loadCurrencies() {
      try {
        const api = getApi();
        const res = await api.keuangan["mata-uang"].get({ query: { aktif: true } });
        if (!ignore && res.data?.data) {
          setInternalOptions(res.data.data as MataUangOption[]);
        }
      } catch (err) {
        console.error("Gagal memuat daftar mata uang:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadCurrencies();
    return () => {
      ignore = true;
    };
  }, [externalOptions]);

  const items = externalOptions ?? internalOptions;

  const selected = React.useMemo(() => {
    if (!value) return null;
    return items.find((m) => m.id === value || m.kode.toUpperCase() === value.toUpperCase()) ?? null;
  }, [items, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between font-normal text-left h-9 text-xs",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <IconCoin className="size-3.5 shrink-0 text-muted-foreground" />
            {selected ? (
              <span className="flex items-center gap-1.5 truncate">
                <span className="font-semibold text-foreground">{selected.kode}</span>
                <span className="text-muted-foreground font-mono">({selected.simbol})</span>
                <span className="truncate text-muted-foreground">- {selected.nama}</span>
                {selected.adalahMataUangDasar && (
                  <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4">
                    Dasar
                  </Badge>
                )}
              </span>
            ) : (
              <span>{loading ? "Memuat mata uang..." : placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {allowClear && selected && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(null, null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onChange?.(null, null);
                  }
                }}
                className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title="Hapus pilihan"
              >
                <IconX className="size-3" />
              </span>
            )}
            <IconSelector className="size-3.5 text-muted-foreground opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari mata uang (mis. USD, IDR, Dolar)..." className="text-xs h-8" />
          <CommandList className="max-h-56">
            <CommandEmpty className="text-xs p-3 text-center text-muted-foreground">
              Mata uang tidak ditemukan.
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => {
                const isSelected = selected?.id === item.id;
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.kode} ${item.nama} ${item.simbol}`}
                    onSelect={() => {
                      onChange?.(item.id, item);
                      setOpen(false);
                    }}
                    className="text-xs flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-foreground w-10 shrink-0">{item.kode}</span>
                      <span className="text-muted-foreground font-mono w-6 text-center shrink-0">
                        {item.simbol}
                      </span>
                      <span className="truncate">{item.nama}</span>
                      {item.adalahMataUangDasar && (
                        <Badge variant="outline" className="px-1 py-0 text-[9px] h-3.5 shrink-0 bg-primary/5 text-primary border-primary/20">
                          Dasar
                        </Badge>
                      )}
                    </div>
                    <IconCheck
                      className={cn(
                        "size-3.5 shrink-0 ml-2 text-primary",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
