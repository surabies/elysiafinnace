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
  SIDEBAR_OPEN_GROUPS_COOKIE,
  SIDEBAR_OPEN_GROUPS_STORAGE,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COLLAPSED,
} from "../types/constants";
import { SIDEBAR_MENU } from "../navigation/sidebar-menu";
import { hasActiveChild, isNavGroup } from "../navigation/utils";

interface SidebarContextValue {
  /** Mode ikon saja (hanya berlaku di desktop). */
  collapsed: boolean;
  /** Drawer sidebar di layar kecil. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleCollapsed: () => void;
  /** Desktop: collapse/expand. Mobile: buka/tutup drawer. */
  toggle: () => void;
  /** ID grup accordion yang sedang terbuka */
  openGroups: string[];
  toggleGroup: (groupId: string) => void;
  isGroupOpen: (groupId: string) => boolean;
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
  if (typeof document === "undefined") return false;
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
  if (typeof document !== "undefined") {
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${collapsed ? "1" : "0"}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // Cross-tab synchronization is unavailable when local storage is blocked.
    }
  }
  collapsedListeners.forEach((listener) => listener());
}

function persistOpenGroups(groups: string[]) {
  if (typeof document === "undefined") return;
  try {
    const serialized = encodeURIComponent(JSON.stringify(groups));
    document.cookie = `${SIDEBAR_OPEN_GROUPS_COOKIE}=${serialized}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
    localStorage.setItem(SIDEBAR_OPEN_GROUPS_STORAGE, JSON.stringify(groups));
  } catch {
    // Ignore storage errors in private mode
  }
}

function findActiveGroupId(pathname: string): string | null {
  for (const section of SIDEBAR_MENU) {
    for (const item of section.items) {
      if (isNavGroup(item) && hasActiveChild(item, pathname)) {
        return item.id;
      }
    }
  }
  return null;
}

export function SidebarProvider({
  children,
  initialCollapsed,
  initialOpenGroups = [],
}: {
  children: ReactNode;
  initialCollapsed: boolean;
  initialOpenGroups?: string[];
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeToCollapsed,
    getCollapsedSnapshot,
    () => getServerCollapsedSnapshot(initialCollapsed),
  );

  // Inisialisasi daftar grup terbuka dari cookie SSR
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    return Array.from(new Set(initialOpenGroups));
  });

  // Grup aktif dihitung langsung dari pathname (tanpa side-effect setState di useEffect)
  const activeGroupId = useMemo(() => findActiveGroupId(pathname), [pathname]);

  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroups((prev) => {
      const next = prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId];
      persistOpenGroups(next);
      return next;
    });
  }, []);

  const isGroupOpen = useCallback(
    (groupId: string) => {
      return groupId === activeGroupId || openGroups.includes(groupId);
    },
    [activeGroupId, openGroups],
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
    () => ({
      collapsed,
      mobileOpen,
      setMobileOpen,
      toggleCollapsed,
      toggle,
      openGroups,
      toggleGroup,
      isGroupOpen,
    }),
    [collapsed, mobileOpen, setMobileOpen, toggleCollapsed, toggle, openGroups, toggleGroup, isGroupOpen],
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
