import { cn } from "@/lib/utils";

type RevealProps = React.ComponentProps<"div"> & { index?: number };

/**
 * Satu urutan masuk (stagger) saat halaman dimuat — murni CSS, tanpa JS.
 * `index` menentukan giliran muncul (60ms per langkah).
 */
export function Reveal({ index = 0, className, style, ...props }: RevealProps) {
  return (
    <div
      className={cn("animate-rise", className)}
      style={{ animationDelay: `${index * 60}ms`, ...style }}
      {...props}
    />
  );
}
