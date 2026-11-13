"use client";

import { IconButton } from "../shared/IconButton";
import { useSidebar } from "./SidebarProvider";

export function SidebarTrigger() {
  const { collapsed, toggle } = useSidebar();

  return (
    <IconButton
      icon="tabler:menu-2"
      label="Ciutkan atau lebarkan sidebar (Ctrl+B)"
      aria-controls="app-sidebar"
      aria-expanded={!collapsed}
      onClick={toggle}
    />
  );
}