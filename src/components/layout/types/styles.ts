import { cn } from "@/lib/utils";

/**
 * active       → halaman ini sedang dibuka (latar aksen lembut)
 * child-active → grup berisi halaman aktif (hanya teks berwarna)
 * idle         → normal
 */
export type NavItemState = "active" | "child-active" | "idle";

const STATE_CLASS: Record<NavItemState, string> = {
  active: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
  "child-active": "text-sidebar-primary font-medium",
  idle: "text-sidebar-foreground font-medium",
};

/** Item tingkat atas: satu baris saat expanded, kotak ikon saat collapsed. */
export function navItemClass(state: NavItemState, collapsed: boolean) {
  return cn(
    "flex cursor-pointer items-center rounded-lg text-label-14 transition-colors duration-150 ease-geist",
    collapsed
      ? "mx-auto size-11 justify-center hover:bg-sidebar-accent/80"
      : "h-10 w-full gap-3 px-3",
    STATE_CLASS[state],
  );
}

/** Item anak di dalam grup yang terbuka: sejajar sempurna dengan label grup. */
export function subLinkClass(active: boolean) {
  return cn(
    "group/sub relative flex h-9 w-full items-center gap-3 rounded-lg px-3 text-label-13 font-medium transition-colors duration-150 ease-geist",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
      : "text-muted-foreground hover:text-foreground",
  );
}

export const headerNavItemClass =
  "inline-flex h-10 items-center gap-1 rounded-lg px-3 text-button-14 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground";
