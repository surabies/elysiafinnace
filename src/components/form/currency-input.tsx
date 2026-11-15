"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
  currencyPrefix?: string;
  allowNegative?: boolean;
  decimalPlaces?: number;
}

/**
 * Format string desimal mentah (e.g. "1250000.50") ke tampilan ribuan dengan pemisah titik/koma.
 */
function formatDisplayValue(val: string): string {
  if (!val) return "";
  const isNegative = val.startsWith("-");
  const cleanVal = isNegative ? val.slice(1) : val;

  const [integerPart = "", decimalPart] = cleanVal.split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const result = decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
  return isNegative ? `-${result}` : result;
}

/**
 * Normalisasi input pengguna kembali ke string desimal baku (e.g. "1.250.000,50" -> "1250000.50").
 */
function parseRawValue(displayVal: string, allowNegative: boolean): string {
  if (!displayVal) return "";
  let clean = displayVal.trim();

  const isNegative = allowNegative && clean.startsWith("-");
  // Hapus semua karakter selain digit, titik, koma
  clean = clean.replace(/[^\d.,]/g, "");

  // Deteksi pemisah desimal terakhir (koma atau titik)
  const lastCommaIndex = clean.lastIndexOf(",");
  const lastDotIndex = clean.lastIndexOf(".");

  let integerStr = "";
  let decimalStr = "";

  if (lastCommaIndex !== -1 && lastCommaIndex > lastDotIndex) {
    // Koma adalah pemisah desimal
    integerStr = clean.substring(0, lastCommaIndex).replace(/[.,]/g, "");
    decimalStr = clean.substring(lastCommaIndex + 1).replace(/[.,]/g, "");
  } else if (lastDotIndex !== -1 && lastDotIndex > lastCommaIndex && clean.length - lastDotIndex <= 3) {
    // Kemungkinan titik desimal jika diikuti <= 2 atau 3 digit desimal
    // Tapi jika polanya seperti "10.000" (3 digit di akhir), di Indonesia titik adalah pemisah ribuan
    if (clean.length - lastDotIndex === 3 && lastCommaIndex === -1 && /^\d{1,3}(\.\d{3})+$/.test(clean)) {
      integerStr = clean.replace(/[.,]/g, "");
    } else {
      integerStr = clean.substring(0, lastDotIndex).replace(/[.,]/g, "");
      decimalStr = clean.substring(lastDotIndex + 1).replace(/[.,]/g, "");
    }
  } else {
    integerStr = clean.replace(/[.,]/g, "");
  }

  // Hilangkan leading zeros yang tidak perlu
  if (integerStr.length > 1 && integerStr.startsWith("0")) {
    integerStr = integerStr.replace(/^0+/, "") || "0";
  }

  const raw = decimalStr ? `${integerStr || "0"}.${decimalStr}` : integerStr;
  return isNegative ? `-${raw}` : raw;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      value = "",
      onChange,
      currencyPrefix = "Rp",
      allowNegative = false,
      decimalPlaces = 2,
      disabled,
      placeholder = "0",
      ...props
    },
    ref
  ) => {
    // Internal display string
    const [displayVal, setDisplayVal] = React.useState<string>(() =>
      formatDisplayValue(value)
    );

    // Sinkronisasi saat value prop dari luar berubah
    React.useEffect(() => {
      setDisplayVal(formatDisplayValue(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      const parsed = parseRawValue(rawInput, allowNegative);

      // Batasi jumlah digit desimal jika ditentukan
      if (decimalPlaces !== undefined && parsed.includes(".")) {
        const [, decP] = parsed.split(".");
        if (decP && decP.length > decimalPlaces) {
          return;
        }
      }

      setDisplayVal(formatDisplayValue(parsed));
      onChange?.(parsed);
    };

    return (
      <div className="relative flex w-full items-center">
        {currencyPrefix && (
          <span className="pointer-events-none absolute left-3 select-none text-xs font-semibold text-muted-foreground">
            {currencyPrefix}
          </span>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          disabled={disabled}
          placeholder={placeholder}
          value={displayVal}
          onChange={handleChange}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent py-1 text-sm font-mono tabular-nums transition-colors outline-none",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            currencyPrefix ? "pl-10 pr-3 text-right" : "px-3 text-right",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
