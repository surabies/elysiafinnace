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

export function rupiahToBigInt(value: string | bigint): bigint {
  if (typeof value === "bigint") return value;
  const cocok = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!cocok) throw new Error(`Nilai rupiah tidak valid: "${value}"`);

  const [, tanda, bulat, pecahan = ""] = cocok;
  const rounded =
    BigInt(bulat!) + (Number(pecahan[0] ?? "0") >= 5 ? BigInt(1) : BigInt(0));
  return tanda === "-" ? -rounded : rounded;
}

/** Rp 48.250.000.000 */
export function formatRupiah(value: number | string | bigint) {
  if (typeof value !== "number") {
    const amount = rupiahToBigInt(value);
    return `${amount < 0 ? "-" : ""}Rp ${integer.format(amount < 0 ? -amount : amount)}`;
  }
  return `${value < 0 ? "-" : ""}Rp ${integer.format(Math.abs(value))}`;
}

/** Rp 48,3 M — untuk ruang sempit (KPI, sumbu grafik). */
export function formatRupiahCompact(value: number | string | bigint) {
  if (typeof value !== "number") {
    const amount = rupiahToBigInt(value);
    const negative = amount < 0;
    const abs = negative ? -amount : amount;
    const unit = COMPACT_UNITS.find(([size]) => abs >= BigInt(size));
    if (!unit) return `${negative ? "-" : ""}Rp ${integer.format(abs)}`;

    const [size, suffix] = unit;
    const unitSize = BigInt(size);
    const tenths = (abs * BigInt(10) + unitSize / BigInt(2)) / unitSize;
    const whole = tenths / BigInt(10);
    const fraction = tenths % BigInt(10);
    const decimal = fraction === BigInt(0) ? "" : `,${fraction}`;
    return `${negative ? "-" : ""}Rp ${integer.format(whole)}${decimal} ${suffix}`;
  }

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
