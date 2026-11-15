"use client";

import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { id } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { IconCalendar } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = "Pilih rentang tanggal...",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const setPreset = (presetRange: DateRange) => {
    onChange?.(presetRange);
    setOpen(false);
  };

  const today = new Date();

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            size="sm"
            className={cn(
              "h-8 justify-start text-left font-normal text-xs",
              !value && "text-muted-foreground"
            )}
          >
            <IconCalendar className="mr-2 size-3.5 text-muted-foreground" aria-hidden="true" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "dd MMM yyyy", { locale: id })} -{" "}
                  {format(value.to, "dd MMM yyyy", { locale: id })}
                </>
              ) : (
                format(value.from, "dd MMM yyyy", { locale: id })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            {/* Presets Sidebar */}
            <div className="flex flex-col border-b border-border p-2 sm:border-b-0 sm:border-r sm:w-36 gap-1 bg-muted/20">
              <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Rentang Cepat
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-7 text-xs font-normal"
                onClick={() => setPreset({ from: today, to: today })}
              >
                Hari Ini
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-7 text-xs font-normal"
                onClick={() => setPreset({ from: subDays(today, 7), to: today })}
              >
                7 Hari Terakhir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-7 text-xs font-normal"
                onClick={() => setPreset({ from: subDays(today, 30), to: today })}
              >
                30 Hari Terakhir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-7 text-xs font-normal"
                onClick={() =>
                  setPreset({
                    from: startOfMonth(today),
                    to: endOfMonth(today),
                  })
                }
              >
                Bulan Ini
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-7 text-xs font-normal"
                onClick={() => {
                  const lastMonth = subMonths(today, 1);
                  setPreset({
                    from: startOfMonth(lastMonth),
                    to: endOfMonth(lastMonth),
                  });
                }}
              >
                Bulan Lalu
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-7 text-xs font-normal"
                onClick={() =>
                  setPreset({
                    from: startOfYear(today),
                    to: today,
                  })
                }
              >
                Tahun Berjalan
              </Button>
            </div>

            {/* Calendar */}
            <div className="p-2">
              <Calendar
                mode="range"
                defaultMonth={value?.from ?? today}
                selected={value}
                onSelect={onChange}
                numberOfMonths={2}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
