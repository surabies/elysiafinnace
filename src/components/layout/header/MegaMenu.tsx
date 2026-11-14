"use client";

import { useRef } from "react";
import Link from "next/link";
import { IconChevronDown, IconHelpCircle } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  MEGA_MENU_APPS,
  MEGA_MENU_FOOTER,
  MEGA_MENU_QUICK_LINKS,
  type MegaMenuTone,
} from "../navigation/mega-menu";
import { headerNavItemClass } from "../types/styles";
import { useHoverMenu } from "../types/use-hover-menu";

const TONE_CLASS: Record<MegaMenuTone, string> = {
  primary: "bg-accent text-accent-foreground",
  secondary: "bg-muted text-muted-foreground",
  success: "bg-lightsuccess text-successemphasis",
  warning: "bg-lightwarning text-warningemphasis",
  danger: "bg-lighterror text-erroremphasis",
  info: "bg-lightinfo text-infoemphasis",
};
/*
 * Catatan: semua elemen interaktif dibungkus <DropdownMenuItem asChild> agar
 * bisa dijangkau keyboard (Radix mencegat Tab di dalam menu). Styling
 * ditaruh di DropdownMenuItem, bukan di <Link>, supaya tailwind-merge
 * bisa menimpa gaya bawaan shadcn dengan benar.
 */
export default function MegaMenu() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hover = useHoverMenu();

  return (
    <DropdownMenu
      modal={false}
      open={hover.open}
      onOpenChange={hover.onOpenChange}
    >
      <DropdownMenuTrigger
        asChild
        onPointerEnter={hover.onPointerEnter}
        onPointerLeave={hover.onPointerLeave}
        // Mouse sudah ditangani hover; cegah klik menutup menu yang baru terbuka.
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") event.preventDefault();
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          className={cn(headerNavItemClass, "group")}
        >
          Aplikasi
          <IconChevronDown
            size={14}
            className="transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        onPointerEnter={hover.onPointerEnter}
        onPointerLeave={hover.onPointerLeave}
        onInteractOutside={(event) => {
          if (triggerRef.current?.contains(event.target as Node))
            event.preventDefault();
        }}
        className="w-[min(94vw,56rem)] overflow-hidden p-0"
      >
        <div className="grid md:grid-cols-[1fr_17rem]">
          {/* Kiri: modul + footer */}
          <div className="flex flex-col p-6">
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {MEGA_MENU_APPS.map((app) => (
                <DropdownMenuItem
                  key={app.id}
                  asChild
                  className="cursor-pointer gap-4 rounded-lg p-2"
                >
                  <Link href={app.href}>
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-lg",
                        TONE_CLASS[app.tone],
                      )}
                    >
                      <app.icon size={22} stroke={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-heading-14">
                        {app.title}
                      </span>
                      <span className="block truncate text-label-12 text-muted-foreground">
                        {app.description}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
              <DropdownMenuItem
                asChild
                className="cursor-pointer gap-2 font-semibold"
              >
                <Link href={MEGA_MENU_FOOTER.faq.href}>
                  <IconHelpCircle
                    size={20}
                    stroke={1.75}
                  />
                  {MEGA_MENU_FOOTER.faq.label}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                asChild
                className="cursor-pointer bg-primary px-4 py-2 text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground"
              >
                <Link href={MEGA_MENU_FOOTER.cta.href}>
                  {MEGA_MENU_FOOTER.cta.label}
                </Link>
              </DropdownMenuItem>
            </div>
          </div>

          {/* Kanan: pintasan */}
          <div className="border-t border-border p-6 md:border-s md:border-t-0">
            <h3 className="mb-3 px-2 text-heading-20">Pintasan</h3>
            <div className="flex flex-col">
              {MEGA_MENU_QUICK_LINKS.map((link) => (
                <DropdownMenuItem
                  key={link.id}
                  asChild
                  className="cursor-pointer px-2 py-2 text-label-14 font-medium"
                >
                  <Link href={link.href}>{link.label}</Link>
                </DropdownMenuItem>
              ))}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
