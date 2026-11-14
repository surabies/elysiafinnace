import { cn } from "@/lib/utils";

type PanelProps = Omit<React.ComponentProps<"section">, "title"> & {
  title: string;
  description?: string;
  /** Slot kanan header (legenda, status, tombol kecil). */
  action?: React.ReactNode;
};

/**
 * Permukaan standar semua kartu dashboard.
 * Ritme spasi: padding 20px, jarak header→isi 20px. Ubah di sini, berlaku di semua halaman.
 */
export function Panel({
  title,
  description,
  action,
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <section
      aria-label={title}
      className={cn("flex flex-col gap-5 rounded-md border bg-card p-5", className)}
      {...props}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
          {description && (
            <p className="text-[13px] text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex max-w-full flex-wrap items-center justify-end gap-2 sm:shrink-0">
            {action}
          </div>
        )}
      </header>
      {children}
    </section>
  );
}
