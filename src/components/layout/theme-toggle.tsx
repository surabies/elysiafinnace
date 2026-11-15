"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { IconButton } from "./shared/icon-button";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // Tema baru diketahui di client; useSyncExternalStore mengembalikan false saat SSR dan true di client tanpa setState in effect
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <IconButton
      icon={isDark ? <IconSun size={19} /> : <IconMoon size={19} />}
      label={isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn("size-9 sm:size-10", className)}
    />
  );
}
