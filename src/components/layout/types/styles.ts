import { cn } from "@/lib/utils";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

/** Geser 4px ke kanan saat kursor lewat (sama seperti sidebar template sebelumnya). */
const slideOnHover =
  "transition-all duration-300 ease-in-out hover:translate-x-1 motion-reduce:transition-none motion-reduce:hover:translate-x-0";

/**
 * active       → halaman ini sedang dibuka (latar solid)
 * child-active → grup berisi halaman aktif (hanya teks berwarna)
 * idle         → normal
 */
export type NavItemState = "active" | "child-active" | "idle";

const STATE_CLASS: Record<NavItemState, string> = {
  active: "bg-primary text-primary-foreground shadow-sm",
  "child-active": "text-primary hover:bg-lightprimary",
  idle: "text-sidebar-foreground hover:bg-lightprimary hover:text-primary",
};

/** Item tingkat atas: satu baris saat expanded, kotak ikon saat collapsed. */
export function navItemClass(state: NavItemState, collapsed: boolean) {
  return cn(
    "flex cursor-pointer items-center rounded-lg text-sm font-medium",
    focusRing,
    collapsed
      ? "mx-auto size-11 justify-center transition-colors duration-200"
      : cn("h-10 w-full gap-3 px-3", slideOnHover),
    STATE_CLASS[state],
  );
}

/** Item anak di dalam grup yang terbuka. */
export function subLinkClass(active: boolean) {
  return cn(
    "flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-medium",
    slideOnHover,
    focusRing,
    active
      ? "bg-lightprimary text-primary"
      : "text-sidebar-foreground hover:bg-lightprimary hover:text-primary",
  );
}

/** Gaya tombol teks di bar navigasi header (dipakai MegaMenu dan HeaderNav). */
export const headerNavItemClass =
  "inline-flex h-10 cursor-pointer items-center gap-1 rounded-lg px-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-lightprimary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=open]:bg-lightprimary data-[state=open]:text-primary dark:text-muted-foreground";
 

  