import type { ComponentType } from "react";
import type { IconProps } from "@tabler/icons-react";
import { IconFileReport, IconCalendar, IconHelpCircle } from "@tabler/icons-react";
import { ROUTES } from "../sidebar/routes";

export interface HeaderLink {
  id: string;
  label: string;
  href: string;
  icon?: ComponentType<IconProps>;
  /** Opsional: prefix URL yang dianggap aktif (untuk halaman yang punya banyak sub-rute). */
  matchPrefix?: string;
}

/** Tautan polos di header, di sebelah menu "Aplikasi". */
export const HEADER_LINKS: HeaderLink[] = [
  {
    id: "reports",
    label: "Laporan",
    href: ROUTES.reports.financial,
    icon: IconFileReport,
    matchPrefix: "/laporan",
  },
  {
    id: "calendar",
    label: "Kalender",
    href: ROUTES.calendar,
    icon: IconCalendar,
  },
  {
    id: "help",
    label: "Bantuan",
    href: ROUTES.help.center,
    icon: IconHelpCircle,
  },
];
