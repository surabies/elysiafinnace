// Format angka/tanggal standar Indonesia. Satu tempat agar penulisan konsisten di seluruh aplikasi.

const COMPACT_UNITS = [
  [1_000_000_000_000, "T"],
  [1_000_000_000, "M"],
  [1_000_000, "jt"],
] as const;

const integer = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const dateLong = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

/** Rp 48.250.000.000 */
export function formatRupiah(value: number) {
  return `${value < 0 ? "-" : ""}Rp ${integer.format(Math.abs(value))}`;
}

/** Rp 48,3 M — untuk ruang sempit (KPI, sumbu grafik). */
export function formatRupiahCompact(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const unit = COMPACT_UNITS.find(([size]) => abs >= size);
  if (!unit) return `${sign}Rp ${integer.format(abs)}`;
  const [size, suffix] = unit;
  return `${sign}Rp ${oneDecimal.format(abs / size)} ${suffix}`;
}

/** 12,4% — gunakan `signed` untuk +12,4% / -3,1%. */
export function formatPercent(value: number, { signed = false, digits = 1 } = {}) {
  const text = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(value);
  return `${text}%`;
}

/** 12 November 2026 */
export function formatDate(iso: string) {
  return dateLong.format(new Date(iso));
}
