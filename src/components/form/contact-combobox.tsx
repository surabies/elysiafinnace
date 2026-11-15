"use client";

import * as React from "react";
import { IconCheck, IconSelector, IconUser } from "@tabler/icons-react";
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

export interface ContactOption {
  id: string;
  name: string;
  companyName?: string;
  type?: "customer" | "supplier" | "both" | string;
}

interface ContactComboboxProps {
  contacts: ContactOption[];
  value?: string;
  onChange?: (contact: ContactOption | null) => void;
  filterType?: "customer" | "supplier";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ContactCombobox({
  contacts = [],
  value,
  onChange,
  filterType,
  placeholder = "Pilih kontak...",
  disabled = false,
  className,
}: ContactComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const filteredContacts = React.useMemo(() => {
    if (!filterType) return contacts;
    return contacts.filter((c) => c.type === filterType || c.type === "both");
  }, [contacts, filterType]);

  const selectedContact = React.useMemo(() => {
    return contacts.find((c) => c.id === value);
  }, [contacts, value]);

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "customer":
        return (
          <Badge
            variant="outline"
            className="text-[10px] py-0 px-1.5 h-4 border-blue-500/30 text-blue-600 dark:text-blue-400"
          >
            Pelanggan
          </Badge>
        );
      case "supplier":
        return (
          <Badge
            variant="outline"
            className="text-[10px] py-0 px-1.5 h-4 border-amber-500/30 text-amber-600 dark:text-amber-400"
          >
            Pemasok
          </Badge>
        );
      case "both":
        return (
          <Badge
            variant="outline"
            className="text-[10px] py-0 px-1.5 h-4 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          >
            Keduanya
          </Badge>
        );
      default:
        return null;
    }
  };

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
            !selectedContact && "text-muted-foreground",
            className,
          )}
        >
          {selectedContact ? (
            <span className="flex items-center gap-2 truncate">
              <IconUser
                className="size-3.5 text-muted-foreground shrink-0"
                aria-hidden="true"
              />
              <span className="font-medium text-foreground truncate">
                {selectedContact.name}
              </span>
              {selectedContact.companyName && (
                <span className="text-muted-foreground truncate text-[11px]">
                  ({selectedContact.companyName})
                </span>
              )}
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
            placeholder="Cari nama atau perusahaan..."
            className="h-9 text-xs"
          />
          <CommandList className="max-h-65">
            <CommandEmpty className="p-3 text-xs text-muted-foreground text-center">
              Kontak tidak ditemukan.
            </CommandEmpty>
            <CommandGroup className="text-xs">
              {filteredContacts.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;
                return (
                  <CommandItem
                    key={contact.id}
                    value={`${contact.name} ${contact.companyName ?? ""}`}
                    onSelect={() => {
                      onChange?.(isSelected ? null : contact);
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
                      <div className="truncate">
                        <span className="font-medium text-foreground block truncate">
                          {contact.name}
                        </span>
                        {contact.companyName && (
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {contact.companyName}
                          </span>
                        )}
                      </div>
                    </div>
                    {getTypeBadge(contact.type)}
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
