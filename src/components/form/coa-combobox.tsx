"use client";

import * as React from "react";
import { IconCheck, IconSelector } from "@tabler/icons-react";
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

export interface CoaAccountOption {
  id: string;
  code: string;
  name: string;
  normalBalance?: "debit" | "credit";
  category?: string;
}

interface CoaComboboxProps {
  accounts: CoaAccountOption[];
  value?: string;
  onChange?: (account: CoaAccountOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CoaCombobox({
  accounts = [],
  value,
  onChange,
  placeholder = "Pilih akun COA...",
  disabled = false,
  className,
}: CoaComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedAccount = React.useMemo(() => {
    return accounts.find((acc) => acc.id === value || acc.code === value);
  }, [accounts, value]);

  // Kelompokkan akun berdasarkan kategori bila ada
  const groupedAccounts = React.useMemo(() => {
    const map = new Map<string, CoaAccountOption[]>();
    for (const acc of accounts) {
      const category = acc.category || "Akun Lainnya";
      const list = map.get(category) ?? [];
      list.push(acc);
      map.set(category, list);
    }
    return map;
  }, [accounts]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between text-left font-normal text-xs",
            !selectedAccount && "text-muted-foreground",
            className,
          )}
        >
          {selectedAccount ? (
            <span className="flex items-center gap-2 truncate">
              <span className="font-mono text-muted-foreground font-semibold">
                {selectedAccount.code}
              </span>
              <span className="truncate">{selectedAccount.name}</span>
            </span>
          ) : (
            placeholder
          )}
          <IconSelector
            className="ml-2 size-4 shrink-0 opacity-50"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Cari kode atau nama akun..."
            className="h-9 text-xs"
          />
          <CommandList className="max-h-65">
            <CommandEmpty className="p-3 text-xs text-muted-foreground text-center">
              Akun tidak ditemukan.
            </CommandEmpty>
            {Array.from(groupedAccounts.entries()).map(([category, items]) => (
              <CommandGroup
                key={category}
                heading={category}
                className="text-xs"
              >
                {items.map((acc) => {
                  const isSelected = selectedAccount?.id === acc.id;
                  return (
                    <CommandItem
                      key={acc.id}
                      value={`${acc.code} ${acc.name} ${acc.category ?? ""}`}
                      onSelect={() => {
                        onChange?.(isSelected ? null : acc);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between py-2 text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <IconCheck
                          className={cn(
                            "size-3.5 shrink-0 text-primary",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                          aria-hidden="true"
                        />
                        <span className="font-mono font-medium text-foreground">
                          {acc.code}
                        </span>
                        <span className="truncate text-muted-foreground">
                          {acc.name}
                        </span>
                      </div>
                      {acc.normalBalance && (
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-mono px-1 py-0 h-4 border-muted-foreground/30 text-muted-foreground"
                        >
                          {acc.normalBalance === "debit" ? "Dr" : "Cr"}
                        </Badge>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
