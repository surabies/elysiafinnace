"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconCashRegister,
  IconCheck,
  IconCreditCard,
  IconLoader2,
  IconLock,
  IconMinus,
  IconPlus,
  IconQrcode,
  IconSearch,
  IconShoppingCart,
  IconTrash,
  IconWallet,
} from "@tabler/icons-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getApi } from "@/lib/api-client";
import { BukaShiftDialog } from "./buka-shift-dialog";
import { TutupShiftDialog } from "./tutup-shift-dialog";
import { StrukModal } from "./struk-modal";

export interface RegisterItem {
  id: string;
  kode: string;
  nama: string;
  gudangId: string;
  gudangNama?: string;
  akunKasId: string;
  akunKasNama?: string;
  aktif: boolean;
}

export interface ProductPosItem {
  id: string;
  sku: string;
  barcode?: string | null;
  nama: string;
  satuanId: string;
  hargaJualStandar: string;
}

export interface ShiftPosItem {
  id: string;
  nomor: string;
  registerId: string;
  kasirId: string;
  kasirNama: string;
  kasAwal: string;
  waktuBuka: Date | string;
  status: "BUKA" | "TUTUP";
}

export interface CompletedOrderPos {
  id: string;
  nomorStruk: string;
  namaPelanggan?: string | null;
  subtotal: string;
  diskon?: string | null;
  total: string;
  metodeBayar: string;
  jumlahBayar: string;
  kembalian: string;
  kasirNama?: string | null;
  items: Array<{
    itemId: string;
    namaItem: string;
    kuantitas: string;
    hargaSatuan: string;
    subtotal: string;
  }>;
}

interface OptionPelanggan {
  id: string;
  nama: string;
}

interface PosClientViewProps {
  initialRegisters: RegisterItem[];
  initialProducts: ProductPosItem[];
  pelangganList: OptionPelanggan[];
}

interface CartItem {
  itemId: string;
  namaItem: string;
  sku: string;
  satuanId: string;
  hargaSatuan: number;
  kuantitas: number;
  diskon: number;
}

export function PosClientView({
  initialRegisters,
  initialProducts,
}: PosClientViewProps) {
  const router = useRouter();
  const [registers] = React.useState<RegisterItem[]>(initialRegisters);
  const [selectedRegisterId, setSelectedRegisterId] = React.useState<string>(
    initialRegisters[0]?.id || "",
  );
  const [activeShift, setActiveShift] = React.useState<ShiftPosItem | null>(null);
  const [search, setSearch] = React.useState<string>("");
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [metodeBayar, setMetodeBayar] = React.useState<"TUNAI" | "QRIS" | "DEBIT" | "KREDIT" | "TRANSFER">("TUNAI");
  const [jumlahBayar, setJumlahBayar] = React.useState<string>("");
  const [pelangganNama, setPelangganNama] = React.useState<string>("Pelanggan Umum");

  // Modals
  const [bukaShiftOpen, setBukaShiftOpen] = React.useState(false);
  const [tutupShiftOpen, setTutupShiftOpen] = React.useState(false);
  const [strukOpen, setStrukOpen] = React.useState(false);
  const [completedOrder, setCompletedOrder] = React.useState<CompletedOrderPos | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Ambil shift aktif saat register berubah
  React.useEffect(() => {
    if (!selectedRegisterId) return;

    let isSubscribed = true;
    const fetchAktif = async () => {
      try {
        const res = await getApi().keuangan.pos.shift.aktif({ registerId: selectedRegisterId }).get();
        if (isSubscribed) {
          setActiveShift((res.data as ShiftPosItem) ?? null);
        }
      } catch {
        if (isSubscribed) {
          setActiveShift(null);
        }
      }
    };

    void fetchAktif();

    return () => {
      isSubscribed = false;
    };
  }, [selectedRegisterId]);

  const selectedRegister = registers.find((r) => r.id === selectedRegisterId);

  // Filter Produk
  const filteredProducts = React.useMemo(() => {
    if (!search) return initialProducts;
    const q = search.toLowerCase();
    return initialProducts.filter(
      (p) =>
        p.nama?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q),
    );
  }, [initialProducts, search]);

  // Tambah ke Cart
  const handleAddToCart = (prod: ProductPosItem) => {
    if (!activeShift) {
      toast.error("Buka shift kasir terlebih dahulu untuk mulai transaksi.");
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.itemId === prod.id);
      if (idx >= 0) {
        const next = [...prev];
        const existing = next[idx]!;
        next[idx] = { ...existing, kuantitas: existing.kuantitas + 1 };
        return next;
      }
      return [
        ...prev,
        {
          itemId: prod.id,
          namaItem: prod.nama,
          sku: prod.sku,
          satuanId: prod.satuanId,
          hargaSatuan: Number(prod.hargaJualStandar || 0),
          kuantitas: 1,
          diskon: 0,
        },
      ];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.itemId === itemId) {
            const nextQty = item.kuantitas + delta;
            return nextQty > 0 ? { ...item, kuantitas: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  // Kalkulasi Cart
  const subtotal = cart.reduce(
    (sum, item) => sum + item.kuantitas * item.hargaSatuan - item.diskon,
    0,
  );
  const total = subtotal;

  const bayarNum = metodeBayar !== "TUNAI" ? total : Number(jumlahBayar || 0);
  const kembalian = Math.max(0, bayarNum - total);

  // Eksekusi Checkout
  const handleCheckout = async () => {
    if (!activeShift) {
      toast.error("Shift kasir belum dibuka!");
      return;
    }
    if (cart.length === 0) {
      toast.error("Keranjang belanja masih kosong.");
      return;
    }
    if (bayarNum < total) {
      toast.error("Uang pembayaran kurang dari total belanja.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await getApi().keuangan.pos.order.post({
        shiftId: activeShift.id,
        registerId: selectedRegisterId,
        namaPelanggan: pelangganNama,
        metodeBayar,
        jumlahBayar: bayarNum.toFixed(4),
        baris: cart.map((c) => ({
          itemId: c.itemId,
          namaItem: c.namaItem,
          satuanId: c.satuanId,
          kuantitas: c.kuantitas.toFixed(4),
          hargaSatuan: c.hargaSatuan.toFixed(4),
          diskon: c.diskon.toFixed(4),
        })),
      });

      if (res.error) {
        toast.error((res.error.value as { message?: string })?.message || "Gagal memproses transaksi kasir");
        return;
      }

      toast.success("Transaksi berhasil! Stok dipotong otomatis & Jurnal telah diposting.");
      if (res.data) setCompletedOrder(res.data as unknown as CompletedOrderPos);
      setStrukOpen(true);
      setCart([]);
      setJumlahBayar("");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan transaksi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Register & Shift Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconCashRegister className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Select value={selectedRegisterId} onValueChange={setSelectedRegisterId}>
                <SelectTrigger className="h-8 font-semibold text-sm w-48">
                  <SelectValue placeholder="Pilih Terminal Kasir..." />
                </SelectTrigger>
                <SelectContent>
                  {registers.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nama} ({r.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeShift ? (
                <Badge variant="success" className="gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Shift Aktif: {activeShift.kasirNama}
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  Shift Tertutup
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gudang Toko: {selectedRegister?.gudangNama || "Pusat"} | Akun Kasir: {selectedRegister?.akunKasNama || "Kasir"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeShift ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setTutupShiftOpen(true)}
              className="gap-1.5"
            >
              <IconLock className="size-4" />
              Tutup Shift Kasir
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setBukaShiftOpen(true)}
              className="gap-1.5"
            >
              <IconCashRegister className="size-4" />
              Buka Shift Kasir
            </Button>
          )}
        </div>
      </div>

      {/* POS Screen: Split Grid Catalog + Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Product Catalog (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <InputGroup>
            <InputGroupAddon>
              <IconSearch className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Cari barcode / SKU / nama barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 text-sm"
            />
          </InputGroup>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-muted-foreground border rounded-xl bg-card">
                Tidak ada produk yang cocok dengan pencarian.
              </div>
            ) : (
              filteredProducts.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handleAddToCart(p)}
                  className="flex flex-col text-left p-3.5 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all active:scale-[0.98] group"
                >
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>{p.sku}</span>
                    <IconPlus className="size-4 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                  </div>
                  <h4 className="font-semibold text-xs mt-1.5 line-clamp-2">{p.nama}</h4>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="font-bold text-sm text-primary">
                      Rp {Number(p.hargaJualStandar || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Cart & Payment (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border bg-card shadow-xs sticky top-20">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconShoppingCart className="size-5 text-primary" />
              <h3 className="font-bold text-sm">Keranjang Transaksi</h3>
            </div>
            <span className="text-xs text-muted-foreground">{cart.length} Item</span>
          </div>

          <div className="p-4 border-b space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Nama Pelanggan</label>
              <Input
                size={1}
                value={pelangganNama}
                onChange={(e) => setPelangganNama(e.target.value)}
                placeholder="Pelanggan Umum..."
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto divide-y divide-border">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                Keranjang masih kosong. Pilih item dari katalog di sebelah kiri.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.itemId} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs truncate">{item.namaItem}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Rp {item.hargaSatuan.toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="size-7 p-0"
                      onClick={() => handleUpdateQty(item.itemId, -1)}
                    >
                      <IconMinus className="size-3" />
                    </Button>
                    <span className="w-7 text-center font-bold text-xs">{item.kuantitas}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="size-7 p-0"
                      onClick={() => handleUpdateQty(item.itemId, 1)}
                    >
                      <IconPlus className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0 text-muted-foreground hover:text-rose-500"
                      onClick={() => handleRemoveItem(item.itemId)}
                    >
                      <IconTrash className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Section */}
          <div className="p-4 bg-muted/30 border-t space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal Belanja:</span>
                <span className="font-semibold">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-1 border-t">
                <span>Total Bayar:</span>
                <span className="text-primary">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={metodeBayar === "TUNAI" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMetodeBayar("TUNAI")}
                  className="gap-1 text-xs h-8"
                >
                  <IconWallet className="size-3.5" />
                  Tunai
                </Button>
                <Button
                  type="button"
                  variant={metodeBayar === "QRIS" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMetodeBayar("QRIS")}
                  className="gap-1 text-xs h-8"
                >
                  <IconQrcode className="size-3.5" />
                  QRIS
                </Button>
                <Button
                  type="button"
                  variant={metodeBayar === "DEBIT" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMetodeBayar("DEBIT")}
                  className="gap-1 text-xs h-8"
                >
                  <IconCreditCard className="size-3.5" />
                  EDC/Debit
                </Button>
              </div>
            </div>

            {/* Cash Input */}
            {metodeBayar === "TUNAI" && (
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-muted-foreground">Uang Diterima (Rp)</label>
                <Input
                  type="number"
                  value={jumlahBayar}
                  onChange={(e) => setJumlahBayar(e.target.value)}
                  placeholder="Contoh: 100000"
                  className="h-9 text-sm font-bold"
                />
                <div className="flex gap-2">
                  {[total, 50000, 100000, 200000].map((nominal) => (
                    <Button
                      key={nominal}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setJumlahBayar(nominal.toString())}
                      className="text-[10px] h-6 px-2"
                    >
                      Rp {nominal.toLocaleString("id-ID")}
                    </Button>
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-muted-foreground">Kembalian:</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    Rp {kembalian.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}

            <Button
              size="lg"
              className="w-full gap-2 font-bold text-sm shadow-md"
              disabled={submitting || cart.length === 0 || !activeShift}
              onClick={handleCheckout}
            >
              {submitting ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconCheck className="size-4" />
              )}
              Selesaikan Transaksi & Cetak
            </Button>
          </div>
        </div>
      </div>

      <BukaShiftDialog
        open={bukaShiftOpen}
        onOpenChange={setBukaShiftOpen}
        registerId={selectedRegisterId}
        registerNama={selectedRegister?.nama || "Kasir"}
        onSuccess={(shift) => setActiveShift(shift)}
      />

      <TutupShiftDialog
        open={tutupShiftOpen}
        onOpenChange={setTutupShiftOpen}
        shift={activeShift}
        onSuccess={() => {
          setActiveShift(null);
          router.refresh();
        }}
      />

      <StrukModal
        open={strukOpen}
        onOpenChange={setStrukOpen}
        order={completedOrder}
      />
    </div>
  );
}
