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

interface KontakImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityTitle: string; // "Pelanggan" atau "Pemasok"
  defaultTipe: "PELANGGAN" | "PEMASOK";
  onSuccess: () => void;
}

export function KontakImportDialog({
  open,
  onOpenChange,
  entityTitle,
  defaultTipe,
  onSuccess,
}: KontakImportDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [parsedRows, setParsedRows] = React.useState<Record<string, string>[]>([]);
  const [detectedSheet, setDetectedSheet] = React.useState<string>("");
  const [isParsing, setIsParsing] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  // Reset state saat dialog ditutup
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedFile(null);
      setParsedRows([]);
      setDetectedSheet("");
    }
    onOpenChange(nextOpen);
  };

  // Fungsi unduh template Excel (.xlsx) resmi dengan instruksi pengisian
  const handleDownloadTemplateExcel = () => {
    const dataPelanggan = [
      {
        kode: "CUST-001",
        nama: "PT Makmur Sentosa Abadi",
        tipe: "PELANGGAN",
        email: "finance@makmursentosa.co.id",
        telepon: "021-5551234",
        npwp: "01.234.567.8-012.000",
        nik: "",
        grup: "Distributor",
        kota: "Jakarta Barat",
        termin: "NET-30",
      },
      {
        kode: "CUST-002",
        nama: "CV Bintang Gemilang Nusantara",
        tipe: "PELANGGAN",
        email: "admin@bintangnusantara.com",
        telepon: "0812-3456-7890",
        npwp: "",
        nik: "3174051203900001",
        grup: "Ritel",
        kota: "Surabaya",
        termin: "COD",
      },
    ];

    const dataPemasok = [
      {
        kode: "SUPP-001",
        nama: "PT Pabrik Bahan Baku Prima",
        tipe: "PEMASOK",
        email: "sales@bahanbaku.com",
        telepon: "021-8889999",
        npwp: "02.345.678.9-034.000",
        nik: "",
        grup: "Vendor Utama",
        kota: "Bekasi",
        termin: "NET-30",
      },
      {
        kode: "SUPP-002",
        nama: "CV Logistik Cepat Indonesia",
        tipe: "PEMASOK",
        email: "cs@logistikcepat.co.id",
        telepon: "022-7778888",
        npwp: "",
        nik: "",
        grup: "Ekspedisi",
        kota: "Bandung",
        termin: "COD",
      },
    ];

    const sheetData: ExcelSheetData[] = [
      {
        name: `Data ${entityTitle}`,
        data: defaultTipe === "PELANGGAN" ? dataPelanggan : dataPemasok,
        columnWidths: [14, 32, 14, 28, 16, 22, 18, 16, 16, 12],
      },
      {
        name: "Petunjuk Pengisian",
        data: [
          {
            Kolom: "kode",
            Status: "Wajib",
            Keterangan: "Kode unik kontak (maksimal 30 karakter, tanpa spasi). Contoh: CUST-001",
          },
          {
            Kolom: "nama",
            Status: "Wajib",
            Keterangan: "Nama legal perusahaan atau nama individu kontak.",
          },
          {
            Kolom: "tipe",
            Status: "Wajib",
            Keterangan: "Pilih: PELANGGAN atau PEMASOK.",
          },
          {
            Kolom: "email",
            Status: "Opsional",
            Keterangan: "Alamat email resmi untuk pengiriman tagihan/faktur.",
          },
          {
            Kolom: "telepon",
            Status: "Opsional",
            Keterangan: "Nomor telepon kantor atau WhatsApp penagihan.",
          },
          {
            Kolom: "npwp",
            Status: "Opsional",
            Keterangan: "Nomor Pokok Wajib Pajak 16 digit.",
          },
          {
            Kolom: "nik",
            Status: "Opsional",
            Keterangan: "Nomor KTP untuk kontak perorangan non-NPWP.",
          },
          {
            Kolom: "grup",
            Status: "Opsional",
            Keterangan: "Kategori pengelompokan (Distributor, Ritel, dsb).",
          },
          {
            Kolom: "termin",
            Status: "Opsional",
            Keterangan: "Kode termin pembayaran (misal: COD, NET-30).",
          },
        ],
        columnWidths: [15, 12, 60],
      },
    ];

    downloadExcelFile(`template-import-${defaultTipe.toLowerCase()}-elysia.xlsx`, sheetData);
    toast.success(`Template Excel untuk ${entityTitle} berhasil diunduh.`);
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
        `Berhasil membaca ${activeSheet.rows.length} baris data dari lembar "${activeSheet.sheetName}".`
      );
    } catch {
      toast.error("Gagal membaca berkas Excel. Pastikan format berkas valid (.xlsx/.xls/.csv).");
      setSelectedFile(null);
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleProcessImport = async () => {
    if (parsedRows.length === 0) {
      toast.error("Tidak ada baris data yang siap diimpor.");
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

      const res = await api.keuangan.kontak.import.post({
        csv: csvString,
      });

      if (res.error) {
        const msg = (res.error.value as { message?: string })?.message || "Gagal mengimpor data kontak.";
        toast.error(msg);
        return;
      }

      const dataResponse = res.data?.data as unknown as { totalDiimpor?: number };
      const total = dataResponse?.totalDiimpor ?? parsedRows.length;
      toast.success(`Berhasil mengimpor ${total} data ${entityTitle}.`);
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
                Import {entityTitle} via Excel (.xlsx)
              </DialogTitle>
              <DialogDescription className="sr-only">
                Unggah berkas Excel untuk impor data kontak
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
                Format lengkap dengan contoh isian dan petunjuk tipe data.
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
              onDragOver={handleDragOver}
              onDrop={handleDrop}
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
                  htmlFor="file-upload-excel"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer transition-colors"
                >
                  <IconFileSpreadsheet className="size-4" />
                  Pilih Berkas Excel
                </label>
                <input
                  id="file-upload-excel"
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
                    {parsedRows.length} Baris Siap
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
                      Pratinjau Data (Maks. 5 baris pertama)
                    </span>
                    <span>Total {parsedRows.length} kontak terdeteksi</span>
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
                  Impor {parsedRows.length > 0 ? `${parsedRows.length} ${entityTitle}` : "Data"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
