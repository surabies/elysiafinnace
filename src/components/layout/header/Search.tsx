"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { IconButton } from "../shared/IconButton";
import { SIDEBAR_MENU } from "../navigation/sidebar-menu";
import { flattenNavigation } from "../navigation/utils";

// Indeks dibuat sekali saat modul dimuat; menu bersifat statis.
const SEARCH_INDEX = flattenNavigation(SIDEBAR_MENU);

/** Tombol ikon pencarian + command palette (Ctrl/Cmd + K). */
export default function Search() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <>
      <IconButton
        icon="solar:magnifer-linear"
        label="Cari menu (Ctrl+K)"
        onClick={() => setOpen(true)}
      />

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Cari menu, mis. faktur, neraca, pelanggan…" />
        <CommandList>
          <CommandEmpty>Menu tidak ditemukan.</CommandEmpty>
          <CommandGroup heading="Menu">
            {SEARCH_INDEX.map((item) => (
              <CommandItem key={item.id} value={item.trail} onSelect={() => go(item.href)}>
                {item.icon && <Icon icon={item.icon} width={18} height={18} />}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.trail}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
