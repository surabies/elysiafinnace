"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  DESKTOP_MEDIA_QUERY,
  SIDEBAR_STORAGE_KEY,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COLLAPSED,
} from "../types/constants";

interface SidebarContextValue {
  /** Mode ikon saja (hanya berlaku di desktop). */
  collapsed: boolean;
  /** Drawer sidebar di layar kecil. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleCollapsed: () => void;
  /** Desktop: collapse/expand. Mobile: buka/tutup drawer. */
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar harus dipakai di dalam <SidebarProvider>");
  }
  return context;
}

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export function SidebarProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Pulihkan preferensi setelah mount agar HTML server dan client tetap sama.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1");
    } catch {
      /* localStorage tidak tersedia: abaikan */
    }
  }, []);

  // Tutup drawer mobile setiap pindah halaman.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* abaikan */
    }
  }, [collapsed]);

  const toggle = useCallback(() => {
    if (window.matchMedia(DESKTOP_MEDIA_QUERY).matches) toggleCollapsed();
    else setMobileOpen((open) => !open);
  }, [toggleCollapsed]);

  // Pintasan keyboard: Ctrl/Cmd + B.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const value = useMemo(
    () => ({ collapsed, mobileOpen, setMobileOpen, toggleCollapsed, toggle }),
    [collapsed, mobileOpen, toggleCollapsed, toggle],
  );

  // Lebar sidebar dibagikan lewat CSS variable agar konten utama ikut bergeser.
  const style = {
    "--app-sidebar-width": `${collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH}px`,
  } as CSSProperties;

  return (
    <SidebarContext.Provider value={value}>
      <div style={style}>{children}</div>
    </SidebarContext.Provider>
  );
}
