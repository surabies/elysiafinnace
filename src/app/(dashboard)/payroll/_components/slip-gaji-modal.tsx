"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { IconFileText, IconPrinter } from "@tabler/icons-react";
import type { ItemPayroll } from "./payroll-client-view";

interface SlipGajiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: ItemPayroll | null;
}

export function SlipGajiModal({ open, onOpenChange, payroll }: SlipGajiModalProps) {
  if (!payroll) return null;

  const items = payroll.items || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <IconFileText className="size-5 text-primary" />
            <DialogTitle>Detail Batch Payroll: {payroll.kode}</DialogTitle>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 print:hidden">
            <IconPrinter className="size-4" />
            Cetak Laporan
          </Button>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/40 border">
            <div>
              <p className="text-xs text-muted-foreground">Periode</p>
              <p className="font-semibold">{payroll.periodeBulan} / {payroll.periodeTahun}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tanggal Bayar</p>
              <p className="font-semibold">{payroll.tanggalBayar}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={payroll.status === "DIBAYAR" ? "success" : "warning"}>
                {payroll.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Gaji Bersih</p>
              <p className="font-bold text-primary">Rp {Number(payroll.totalGajiBersih || 0).toLocaleString("id-ID")}</p>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground border-b font-medium">
                <tr>
                  <th className="p-2.5">Karyawan</th>
                  <th className="p-2.5 text-right">Gaji Pokok</th>
                  <th className="p-2.5 text-right">Tunjangan</th>
                  <th className="p-2.5 text-right">BPJS</th>
                  <th className="p-2.5 text-right">PPh 21</th>
                  <th className="p-2.5 text-right font-semibold">Gaji Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted-foreground">
                      Tidak ada rincian item karyawan dalam batch ini.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => {
                    const totalBpjs = Number(it.bpjsKesehatan || 0) + Number(it.bpjsKetenagakerjaan || 0);
                    return (
                      <tr key={it.id} className="hover:bg-muted/30">
                        <td className="p-2.5">
                          <p className="font-medium">{it.employeeNama || it.employeeId}</p>
                          <p className="text-[10px] text-muted-foreground">{it.employeeNik || ""}</p>
                        </td>
                        <td className="p-2.5 text-right">Rp {Number(it.gajiPokok || 0).toLocaleString("id-ID")}</td>
                        <td className="p-2.5 text-right">Rp {Number(it.totalTunjangan || 0).toLocaleString("id-ID")}</td>
                        <td className="p-2.5 text-right text-rose-500">- Rp {totalBpjs.toLocaleString("id-ID")}</td>
                        <td className="p-2.5 text-right text-rose-500">- Rp {Number(it.pph21 || 0).toLocaleString("id-ID")}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-600">
                          Rp {Number(it.gajiBersih || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
