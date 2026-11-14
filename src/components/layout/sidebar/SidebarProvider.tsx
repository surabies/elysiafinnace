"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  DESKTOP_MEDIA_QUERY,
  SIDEBAR_COOKIE_NAME,
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

let collapsedSnapshot: boolean | undefined;
const collapsedListeners = new Set<() => void>();

function getCollapsedSnapshot() {
  if (collapsedSnapshot !== undefined) return collapsedSnapshot;

  collapsedSnapshot = document.cookie
    .split("; ")
    .some((cookie) => cookie === `${SIDEBAR_COOKIE_NAME}=1`);
  return collapsedSnapshot;
}

function getServerCollapsedSnapshot(initialCollapsed: boolean) {
  return initialCollapsed;
}

function subscribeToCollapsed(listener: () => void) {
  collapsedListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== SIDEBAR_STORAGE_KEY && event.key !== null) return;
    collapsedSnapshot =
      event.key === null ? undefined : event.newValue === "1";
    listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    collapsedListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function setCollapsedPreference(collapsed: boolean) {
  collapsedSnapshot = collapsed;
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${collapsed ? "1" : "0"}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    // Cross-tab synchronization is unavailable when local storage is blocked.
  }
  collapsedListeners.forEach((listener) => listener());
}

export function SidebarProvider({
  children,
  initialCollapsed,
}: {
  children: ReactNode;
  initialCollapsed: boolean;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeToCollapsed,
    getCollapsedSnapshot,
    () => getServerCollapsedSnapshot(initialCollapsed),
  );
  const [mobileState, setMobileState] = useState({ pathname, open: false });
  const mobileOpen =
    mobileState.pathname === pathname && mobileState.open;
  const setMobileOpen = useCallback(
    (open: boolean) => setMobileState({ pathname, open }),
    [pathname],
  );

  const toggleCollapsed = useCallback(() => {
    setCollapsedPreference(!collapsed);
  }, [collapsed]);

  const toggle = useCallback(() => {
    if (window.matchMedia(DESKTOP_MEDIA_QUERY).matches) toggleCollapsed();
    else setMobileOpen(!mobileOpen);
  }, [mobileOpen, setMobileOpen, toggleCollapsed]);

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
    [collapsed, mobileOpen, setMobileOpen, toggleCollapsed, toggle],
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
