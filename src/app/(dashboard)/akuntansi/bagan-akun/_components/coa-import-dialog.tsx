"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  IconCheck,
  IconDownload,
  IconFileSpreadsheet,
  IconFileTypeXls,
  IconLoader2,
  IconTable,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { downloadExcelFile, parseExcelFile, type ExcelSheetData } from "@/lib/excel";
import { getApi } from "@/lib/api-client";

interface CoaImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CoaImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: CoaImportDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [parsedRows, setParsedRows] = React.useState<Record<string, string>[]>([]);
  const [detectedSheet, setDetectedSheet] = React.useState<string>("");
  const [isParsing, setIsParsing] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedFile(null);
      setParsedRows([]);
      setDetectedSheet("");
    }
    onOpenChange(nextOpen);
  };

  const handleDownloadTemplateExcel = () => {
    const dataCoa = [
      {
        kode: "1-10000",
        nama: "ASET LANCAR",
        tipeAkun: "ASET",
        indukKode: "",
        normalBalance: "DEBIT",
        bisaDiposting: "false",
        adalahAkunKontra: "false",
        peranSistem: "",
      },
      {
        kode: "1-10001",
        nama: "Kas Kecil",
        tipeAkun: "ASET",
        indukKode: "1-10000",
        normalBalance: "DEBIT",
        bisaDiposting: "true",
        adalahAkunKontra: "false",
        peranSistem: "KAS_BANK",
      },
      {
        kode: "1-10002",
        nama: "Bank Operasional BCA",
        tipeAkun: "ASET",
        indukKode: "1-10000",
        normalBalance: "DEBIT",
        bisaDiposting: "true",
        adalahAkunKontra: "false",
        peranSistem: "KAS_BANK",
      },
      {
        kode: "1-10100",
        nama: "Piutang Usaha IDR",
        tipeAkun: "ASET",
        indukKode: "1-10000",
        normalBalance: "DEBIT",
        bisaDiposting: "true",
        adalahAkunKontra: "false",
        peranSistem: "PIUTANG_USAHA",
      },
      {
        kode: "2-10000",
        nama: "KEWAJIBAN LANCAR",
        tipeAkun: "KEWAJIBAN",
        indukKode: "",
        normalBalance: "KREDIT",
        bisaDiposting: "false",
        adalahAkunKontra: "false",
        peranSistem: "",
      },
      {
        kode: "2-10001",
        nama: "Hutang Usaha Pemasok",
        tipeAkun: "KEWAJIBAN",
        indukKode: "2-10000",
        normalBalance: "KREDIT",
        bisaDiposting: "true",
        adalahAkunKontra: "false",
        peranSistem: "HUTANG_USAHA",
      },
      {
        kode: "3-10000",
        nama: "Modal Saham Disetor",
        tipeAkun: "EKUITAS",
        indukKode: "",
        normalBalance: "KREDIT",
        bisaDiposting: "true",
        adalahAkunKontra: "false",
        peranSistem: "MODAL_DISETOR",
      },
      {
        kode: "4-10000",
        nama: "Pendapatan Penjualan Produk",
        tipeAkun: "PENDAPATAN",
        indukKode: "",
        normalBalance: "KREDIT",
        bisaDiposting: "true",
        adalahAkunKontra: "false",
        peranSistem: "PENDAPATAN_PENJUALAN",
      },
      {
        kode: "5-10000",
        nama: "Harga Pokok Penjualan (HPP)",
        tipeAkun: "BEBAN",
        indukKode: "",
        normalBalance: "DEBIT",
        bisaDiposting: "true",
        adalahAkunKontra: "false",
        peranSistem: "HARGA_POKOK_PENJUALAN",
      },
    ];

    const sheets: ExcelSheetData[] = [
      {
        name: "Bagan Akun (COA)",
        data: dataCoa,
        columnWidths: [14, 30, 14, 14, 14, 14, 18, 24],
      },
      {
        name: "Panduan Kolom",
        data: [
          { Kolom: "kode", Status: "Wajib", Keterangan: "Kode unik akun (misal: 1-10001)." },
          { Kolom: "nama", Status: "Wajib", Keterangan: "Nama akun akuntansi." },
          { Kolom: "tipeAkun", Status: "Wajib", Keterangan: "ASET | KEWAJIBAN | EKUITAS | PENDAPATAN | BEBAN" },
          { Kolom: "indukKode", Status: "Opsional", Keterangan: "Kode akun induk untuk struktur hierarki pohon." },
          { Kolom: "normalBalance", Status: "Wajib", Keterangan: "DEBIT atau KREDIT." },
          { Kolom: "bisaDiposting", Status: "Wajib", Keterangan: "true (akun detail) atau false (akun header/grup)." },
          { Kolom: "adalahAkunKontra", Status: "Wajib", Keterangan: "true jika akun kontra, false jika normal." },
          { Kolom: "peranSistem", Status: "Opsional", Keterangan: "KAS_BANK, PIUTANG_USAHA, HUTANG_USAHA, dsb." },
        ],
        columnWidths: [16, 12, 60],
      },
    ];

    downloadExcelFile("template-bagan-akun-elysia.xlsx", sheets);
    toast.success("Template Excel Bagan Akun berhasil diunduh.");
  };

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);

    try {
      const sheets = await parseExcelFile(file);
      const activeSheet = sheets[0];
      if (!activeSheet || !activeSheet.rows || activeSheet.rows.length === 0) {
        toast.error("Berkas Excel tidak memiliki baris data yang valid.");
        setSelectedFile(null);
        setParsedRows([]);
        return;
      }

      setDetectedSheet(activeSheet.sheetName);
      setParsedRows(activeSheet.rows);
      toast.success(
        `Berhasil membaca ${activeSheet.rows.length} akun dari lembar "${activeSheet.sheetName}".`
      );
    } catch {
      toast.error("Gagal membaca berkas Excel. Pastikan format berkas valid (.xlsx/.xls/.csv).");
      setSelectedFile(null);
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleProcessImport = async () => {
    if (parsedRows.length === 0) {
      toast.error("Tidak ada baris akun yang siap diimpor.");
      return;
    }

    setIsUploading(true);
    const api = getApi();

    try {
      const firstRow = parsedRows[0];
      if (!firstRow) return;

      const headers = Object.keys(firstRow);
      const csvLines = [headers.join(",")];

      for (const row of parsedRows) {
        const line = headers.map((h) => {
          const val = String(row[h] ?? "").replace(/"/g, '""');
          return val.includes(",") || val.includes("\n") || val.includes('"') ? `"${val}"` : val;
        });
        csvLines.push(line.join(","));
      }

      const csvString = csvLines.join("\n");

      const res = await api.keuangan.akun.import.post({
        csv: csvString,
      });

      if (res.error) {
        const msg = (res.error.value as { message?: string })?.message || "Gagal mengimpor data akun.";
        toast.error(msg);
        return;
      }

      toast.success(`Berhasil mengimpor ${parsedRows.length} akun ke dalam sistem.`);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan sistem saat memproses impor.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        {/* Header Enterprise Modern & Bersih */}
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4.5 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background shadow-xs text-foreground">
              <IconFileTypeXls className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                Import Bagan Akun via Excel (.xlsx)
              </DialogTitle>
              <DialogDescription className="sr-only">
                Unggah berkas Excel untuk impor struktur akun pembukuan
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[500px] overflow-y-auto">
          {/* Bar Aksi Template */}
          <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card p-3.5">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground block">
                Unduh Template Excel Resmi
              </span>
              <p className="text-[11px] text-muted-foreground">
                Format lengkap dengan contoh tipe akun, saldo normal, dan petunjuk pengisian.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplateExcel}
              className="gap-1.5 shrink-0 bg-background text-xs"
            >
              <IconDownload className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Unduh Template Excel
            </Button>
          </div>

          {/* Area Upload Drag-and-Drop */}
          {!selectedFile ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileSelected(file);
              }}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/50 transition-colors bg-card"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                <IconUpload className="size-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                Tarik & Lepas berkas Excel Anda di sini
              </span>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Mendukung format <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">.xlsx</code>, <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">.xls</code>, atau <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">.csv</code>
              </p>

              <div className="mt-4">
                <label
                  htmlFor="file-upload-coa-excel"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer transition-colors"
                >
                  <IconFileSpreadsheet className="size-4" />
                  Pilih Berkas Excel
                </label>
                <input
                  id="file-upload-coa-excel"
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelected(f);
                  }}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Info Berkas Terpilih */}
              <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card p-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <IconFileTypeXls className="size-4" />
                  </span>
                  <div>
                    <span className="text-xs font-medium text-foreground block">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Sheet: <span className="font-semibold text-foreground">{detectedSheet}</span> • {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="success-light" size="sm" className="gap-1">
                    <IconCheck className="size-3" />
                    {parsedRows.length} Akun Terdeteksi
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      setSelectedFile(null);
                      setParsedRows([]);
                    }}
                    title="Ganti Berkas"
                  >
                    <IconX className="size-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Pratinjau Tabel Mini */}
              {parsedRows.length > 0 && parsedRows[0] && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <IconTable className="size-3.5" />
                      Pratinjau Akun (Maks. 5 baris pertama)
                    </span>
                    <span>Total {parsedRows.length} akun siap diproses</span>
                  </div>

                  <div className="max-h-56 overflow-auto rounded-md border border-border/80 text-xs bg-card">
                    <table className="w-full border-collapse">
                      <thead className="bg-muted/50 border-b border-border sticky top-0">
                        <tr>
                          {Object.keys(parsedRows[0]).map((h) => (
                            <th key={h} className="px-2.5 py-1.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                        {parsedRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            {Object.keys(parsedRows[0] || {}).map((h) => (
                              <td key={h} className="px-2.5 py-1 text-foreground truncate max-w-[150px]">
                                {row[h] || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Enterprise dengan Garis Pemisah */}
        <div className="flex items-center justify-between border-t border-border/70 px-6 py-3.5 bg-muted/20">
          <span className="text-[11px] text-muted-foreground">
            Mendukung berkas format .xlsx, .xls, .csv
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isUploading || isParsing}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleProcessImport}
              disabled={isUploading || isParsing || parsedRows.length === 0}
              className="min-w-[125px] gap-1.5"
            >
              {isUploading ? (
                <>
                  <IconLoader2 className="size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <IconCheck className="size-4" />
                  Impor {parsedRows.length > 0 ? `${parsedRows.length} Akun` : "Data"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
