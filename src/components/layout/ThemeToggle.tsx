"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { IconButton } from "./shared/IconButton";

const subscribe = () => () => {};

export function ThemeToggle() {
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
      icon={isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
      label={isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    />
  );
}
