"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconButton } from "./shared/IconButton";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Tema baru diketahui di client; tunggu mount agar tidak hydration mismatch.
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <IconButton
      icon={isDark ? "solar:sun-bold-duotone" : "tabler:moon"}
      label={isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    />
  );
}
