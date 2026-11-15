export interface InvoiceCompanyInfo {
  nama: string;
  alamat?: string;
  kota?: string;
  telepon?: string;
  email?: string;
  npwp?: string;
  logoUrl?: string;
}

export interface InvoiceCustomerInfo {
  nama: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  npwp?: string;
}

export interface InvoiceLineItem {
  id: string;
  deskripsi: string;
  kuantitas: number;
  satuan: string;
  hargaSatuan: number;
  diskonPersen?: number;
  diskonNominal?: number;
  pajakPersen?: number;
  total: number;
}

export interface InvoicePaymentInfo {
  namaBank: string;
  nomorRekening: string;
  atasNama: string;
}

export interface InvoiceDocumentData {
  nomorInvoice: string;
  tanggal: string;
  jatuhTempo: string;
  terminPembayaran?: string;
  mataUang: string; // "IDR", "USD", dll.
  status: "DRAFT" | "MENUNGGU_PEMBAYARAN" | "SEBAGIAN" | "LUNAS" | "BATAL";
  perusahaan: InvoiceCompanyInfo;
  pelanggan: InvoiceCustomerInfo;
  items: InvoiceLineItem[];
  subtotal: number;
  diskonGlobal?: number;
  ppnNominal?: number;
  grandTotal: number;
  catatan?: string;
  terbilang?: string;
  rekeningPembayaran?: InvoicePaymentInfo;
}
