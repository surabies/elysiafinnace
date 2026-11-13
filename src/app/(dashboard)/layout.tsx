import AppShell from "@/components/layout/AppShell";
import "@/app/css/globals.css";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}