"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconBell,
  IconCalendarEvent,
  IconHelpCircle,
  IconLogout,
  IconPencil,
  IconPlus,
  IconSettings,
  IconUser,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "../sidebar/routes";

interface AccountEntity {
  id: string;
  name: string;
  initial: string;
  active: boolean;
}

const ACCOUNT_ENTITIES: AccountEntity[] = [
  { id: "acc-1", name: "SurabieDev Financial Holdings (Pusat)", initial: "SD", active: true },
  { id: "acc-2", name: "SurabieDev Retail & Distribusi", initial: "SR", active: false },
  { id: "acc-3", name: "SurabieDev Solusi Digital", initial: "SS", active: false },
];

export default function Profile() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  const userName = session?.user?.name || "Superadmin";
  const userEmail = session?.user?.email || "admin@surabiedev.com";

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      setOpen(false);
      router.push("/sign-in");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="shrink-0">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Buka menu profil dan akun"
            className="flex size-9 sm:size-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-accent data-[state=open]:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar className="size-8 sm:size-8.5 ring-1 ring-border/80 transition-transform hover:scale-105">
              <AvatarImage
                src={session?.user?.image || "/images/profile/user-1.jpg"}
                alt={userName}
                className="object-cover"
              />
              <AvatarFallback className="text-xs font-semibold text-primary bg-primary/10">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
        </SheetTrigger>

        <SheetContent
          side="right"
          showCloseButton={false}
          className="inset-y-1.5 right-1.5 sm:inset-y-2 sm:right-2 h-[calc(100dvh-0.75rem)] sm:h-[calc(100dvh-1rem)] w-[calc(100vw-0.75rem)] sm:w-[346px] rounded-xl border border-border/80 bg-background p-0 shadow-2xl flex flex-col justify-between overflow-y-auto"
        >
          <VisuallyHidden>
            <SheetTitle>Profil Pengguna & Entitas Akun</SheetTitle>
          </VisuallyHidden>

          {/* Tombol Close Ikon X di Pojok Kiri Atas ±16px dari tepi, tanpa border */}
          <SheetClose asChild>
            <button
              type="button"
              className="absolute top-4 left-4 p-1.5 rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none cursor-pointer"
              aria-label="Tutup menu profil"
            >
              <IconX size={18} stroke={1.75} />
            </button>
          </SheetClose>

          {/* Konten Utama Sheet (Padding horizontal ±28px / px-7) */}
          <div className="flex-1 px-7 pt-12 pb-4 flex flex-col">
            {/* Header Profil (Rata Tengah) */}
            <div className="flex flex-col items-center text-center">
              {/* Avatar Besar Bulat ±96px (size-24) */}
              <div className="relative">
                <Avatar className="size-24 border-2 border-border/80 bg-muted/30 shadow-xs">
                  <AvatarImage
                    src={session?.user?.image || "/images/profile/user-1.jpg"}
                    alt={userName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-bold text-primary bg-primary/10">
                    {userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Badge Tombol Edit di pojok kanan bawah ±28px (size-7) */}
                <button
                  type="button"
                  title="Ubah Foto Profil"
                  aria-label="Ubah Foto Profil"
                  className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <IconPencil size={14} stroke={1.75} />
                </button>
              </div>

              {/* Nama dan Email (Rapat) */}
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground leading-snug">
                {userName}
              </h3>
              <p className="text-sm text-muted-foreground font-medium leading-tight">
                {userEmail}
              </p>

              {/* Role Pengguna Superadmin */}
              <span className="mt-1.5 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                Superadmin
              </span>
            </div>

            {/* Baris Avatar Akun / Multi-Entitas (Rata Tengah: 4 lingkaran ±40px, gap ±12px) */}
            <div className="mt-5 flex items-center justify-center gap-3">
              {ACCOUNT_ENTITIES.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  title={acc.name}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer",
                    acc.active
                      ? "border-2 border-primary bg-primary/10 text-primary ring-2 ring-primary/25"
                      : "border border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {acc.initial}
                </button>
              ))}
              <button
                type="button"
                title="Tambah Entitas / Akun Baru"
                aria-label="Tambah Entitas Baru"
                className="flex size-10 items-center justify-center rounded-full border border-dashed border-border/80 bg-muted/30 text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/80 hover:text-foreground cursor-pointer"
              >
                <IconPlus size={16} stroke={1.75} />
              </button>
            </div>

            {/* Pemisah Garis Putus-Putus (Dashed) Tipis Lebar Penuh (Margin Vertikal ±16px) */}
            <div className="my-4 border-t border-dashed border-border/80" />

            {/* Daftar Menu: Grup "Akun" */}
            <div className="space-y-1">
              <span className="block text-sm font-normal text-muted-foreground mb-1">
                Akun
              </span>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex h-[33px] items-center gap-3 rounded-lg px-2 text-sm text-foreground transition-colors hover:bg-accent/60"
              >
                <IconUser size={18} stroke={1.75} className="text-muted-foreground shrink-0" />
                <span>Lihat Profil</span>
              </Link>
              <Link
                href={ROUTES.settings.users}
                onClick={() => setOpen(false)}
                className="flex h-[33px] items-center gap-3 rounded-lg px-2 text-sm text-foreground transition-colors hover:bg-accent/60"
              >
                <IconUsers size={18} stroke={1.75} className="text-muted-foreground shrink-0" />
                <span>Pengguna</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-[33px] w-full items-center justify-between rounded-lg px-2 text-sm text-foreground transition-colors hover:bg-accent/60 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <IconBell size={18} stroke={1.75} className="text-muted-foreground shrink-0" />
                  <span>Notifikasi</span>
                </div>
                <span className="rounded border border-border/80 px-1.5 py-0.2 font-mono text-xs text-muted-foreground">
                  5
                </span>
              </button>
            </div>

            {/* Daftar Menu: Grup "Aplikasi" */}
            <div className="mt-3 space-y-1">
              <span className="block text-sm font-normal text-muted-foreground mb-1">
                Aplikasi
              </span>
              <Link
                href={ROUTES.settings.company}
                onClick={() => setOpen(false)}
                className="flex h-[33px] items-center gap-3 rounded-lg px-2 text-sm text-foreground transition-colors hover:bg-accent/60"
              >
                <IconSettings size={18} stroke={1.75} className="text-muted-foreground shrink-0" />
                <span>Pengaturan</span>
              </Link>
              <Link
                href={ROUTES.help.center}
                onClick={() => setOpen(false)}
                className="flex h-[33px] items-center gap-3 rounded-lg px-2 text-sm text-foreground transition-colors hover:bg-accent/60"
              >
                <IconHelpCircle size={18} stroke={1.75} className="text-muted-foreground shrink-0" />
                <span>Bantuan</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex h-[33px] w-full items-center gap-3 rounded-lg px-2 text-sm text-destructive transition-colors hover:bg-destructive/10 cursor-pointer disabled:opacity-50"
              >
                <IconLogout size={18} stroke={1.75} className="shrink-0" />
                <span>{signingOut ? "Keluar..." : "Keluar"}</span>
              </button>
            </div>

            {/* Kartu Bawah: Akses Cepat Periode Tutup Buku & Laporan Keuangan SurabieDev */}
            <div className="mt-6 mb-2">
              <Link
                href={ROUTES.accounting.closing}
                onClick={() => setOpen(false)}
                className="relative flex h-[145px] w-full flex-col items-center justify-center rounded-lg bg-gradient-to-br from-[#2563eb] via-[#4f46e5] to-[#9333ea] p-4 text-center text-white shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="mb-2 flex size-[44px] items-center justify-center rounded-full bg-white/20 backdrop-blur-xs">
                  <IconCalendarEvent size={22} className="text-white" stroke={1.75} />
                </div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/70">
                  LAPORAN KEUANGAN SURABIEDEV
                </span>
                <h4 className="mt-0.5 text-lg font-bold tracking-tight text-white">
                  Tutup Buku{" "}
                  <span className="underline decoration-white/70 underline-offset-4 font-extrabold">
                    November 2026
                  </span>
                </h4>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
