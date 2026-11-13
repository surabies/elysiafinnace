import { ROUTES } from "../sidebar/routes";

export interface HeaderLink {
  id: string;
  label: string;
  href: string;
  /** Opsional: prefix URL yang dianggap aktif (untuk halaman yang punya banyak sub-rute). */
  matchPrefix?: string;
}

/** Tautan polos di header, di sebelah menu "Aplikasi". */
export const HEADER_LINKS: HeaderLink[] = [
  {
    id: "reports",
    label: "Laporan",
    href: ROUTES.reports.balanceSheet,
    matchPrefix: ROUTES.reports.prefix,
  },
  { id: "calendar", label: "Kalender", href: ROUTES.calendar },
  { id: "help", label: "Bantuan", href: ROUTES.help.center },
];
