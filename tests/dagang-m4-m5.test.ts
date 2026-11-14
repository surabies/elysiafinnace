import assert from "node:assert/strict";
import { db } from "../src/server/modules/keuangan/shared/context";
import {
  buatPesananPembelian,
  setujuiPesananPembelian,
  buatFakturPembelian,
  postingFakturPembelian,
  ambilFakturPembelian,
  buatReturPembelian,
  postingReturPembelian,
  ambilPesananPembelian,
} from "../src/server/modules/keuangan/pembelian/service";
import {
  buatPesananPenjualan,
  setujuiPesananPenjualan,
  buatFakturPenjualan,
  postingFakturPenjualan,
  ambilFakturPenjualan,
  buatReturPenjualan,
  postingReturPenjualan,
  ambilPesananPenjualan,
} from "../src/server/modules/keuangan/penjualan/service";
import { buatKontak, ubahKontak } from "../src/server/modules/keuangan/kontak/service";
import { buatItem, buatSatuan } from "../src/server/modules/keuangan/inventori/service";
import { akunByPeran } from "../src/server/modules/keuangan/akun/service";
import { ambilMataUangDasar } from "../src/server/modules/keuangan/mata-uang/service";
import { itemStocks, journalItems } from "@/db/schema/keuangan";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Starting Milestone M4 & M5 End-to-End Verification...");
  const suffix = Math.floor(Math.random() * 89999 + 10000);
  const ts = Date.now();
  const oleh = "test-runner";

  const muDasar = await ambilMataUangDasar();
  assert.ok(muDasar, "Mata uang dasar harus ada");
  const akunPiutang = await akunByPeran("PIUTANG_USAHA");
  assert.ok(akunPiutang, "Akun piutang harus ada");

  // 1. Setup Master Data: Satuan, Item, Pemasok, Pelanggan
  console.log("1. Setting up master data...");
  const satuan = await buatSatuan({ kode: `P${suffix}`, nama: "Pieces" }, oleh);

  const itemA = await buatItem(
    {
      sku: `ITEM-M4-${ts}`,
      nama: `Barang Uji M4 ${ts}`,
      satuanId: satuan.id,
      tipeBarang: "BARANG_PERSEDIAAN",
      hargaBeliStandar: "100000",
      hargaJualStandar: "150000",
    },
    oleh,
  );

  const pemasok = await buatKontak(
    {
      kode: `VEND-${ts}`,
      nama: `Pemasok Utama ${ts}`,
      adalahPemasok: true,
      adalahPelanggan: false,
    },
    oleh,
  );

  const pelanggan = await buatKontak(
    {
      kode: `CUST-${ts}`,
      nama: `Pelanggan Setia ${ts}`,
      adalahPemasok: false,
      adalahPelanggan: true,
      batasKredit: "5000000", // Batas kredit 5 juta
    },
    oleh,
  );

  /* ========================================================== */
  /* A. SIKLUS PEMBELIAN (M4)                                  */
  /* ========================================================== */

  console.log("2. Creating Purchase Order (PO)...");
  // 10 pcs @ 100,000, diskon 50,000, PPN 11%, Ongkir 25,000, Uang Muka 100,000
  // Gross = 1,000,000. DPP = 950,000. PPN = 104,500. Ongkir = 25,000. Tagihan = 1,079,500. Sisa = 979,500.
  const po = await buatPesananPembelian(
    {
      pemasokId: pemasok.id,
      tanggal: "2026-11-14",
      referensi: `REF-PO-${ts}`,
      diskonNominal: "50000",
      persenPpn: "11",
      ongkir: "25000",
      uangMuka: "100000",
      baris: [
        {
          itemId: itemA.id,
          deskripsi: "Barang Dagang Uji M4",
          kuantitas: "10",
          hargaSatuan: "100000",
        },
      ],
    },
    oleh,
  );

  assert.equal(po.status, "DRAFT");
  assert.equal(po.subtotal, "1000000.0000");
  assert.equal(po.diskonNominal, "50000.0000");
  assert.equal(po.ppn, "104500.0000");
  assert.equal(po.ongkir, "25000.0000");
  assert.equal(po.uangMuka, "100000.0000");
  assert.equal(po.total, "979500.0000");
  console.log("   PO created successfully with total:", po.total);

  console.log("3. Approving Purchase Order...");
  const poDisetujui = await setujuiPesananPembelian(po.id, oleh);
  assert.equal(poDisetujui.status, "DISETUJUI");

  console.log("4. Creating Purchase Invoice (Bill)...");
  const bill = await buatFakturPembelian(
    {
      pemasokId: pemasok.id,
      pesananId: po.id,
      nomorFakturPemasok: `INV-SUPPLIER-${ts}`,
      tanggal: "2026-11-14",
      diskonNominal: "50000",
      persenPpn: "11",
      ongkir: "25000",
      uangMuka: "100000",
      baris: [
        {
          itemId: itemA.id,
          barisPesananId: po.baris[0]!.id,
          deskripsi: "Barang Dagang Uji M4",
          kuantitas: "10",
          hargaSatuan: "100000",
        },
      ],
    },
    oleh,
  );

  assert.equal(bill.status, "DRAFT");
  assert.equal(bill.total, "979500.0000");
  assert.equal(bill.sisaTagihan, "979500.0000");

  console.log("5. Posting Purchase Invoice...");
  const billPosted = await postingFakturPembelian(bill.id, oleh);
  assert.equal(billPosted.status, "POSTED");
  assert.ok(billPosted.jurnalId, "Jurnal harus terbuat");

  // Verifikasi Jurnal Faktur Pembelian seimbang debit = kredit
  const barisJurnalBill = await db
    .select()
    .from(journalItems)
    .where(eq(journalItems.jurnalId, billPosted.jurnalId!));
  const totalDebitBill = barisJurnalBill.reduce((sum, b) => sum + BigInt(b.debitDasar.replace(".", "")), BigInt(0));
  const totalKreditBill = barisJurnalBill.reduce((sum, b) => sum + BigInt(b.kreditDasar.replace(".", "")), BigInt(0));
  assert.equal(totalDebitBill, totalKreditBill, "Jurnal Bill harus seimbang Debit = Kredit");

  // Verifikasi Stok Masuk: kuantitas 10, nilai 950,000 (1,000,000 - 50,000 diskon)
  const [stokA] = await db.select().from(itemStocks).where(eq(itemStocks.itemId, itemA.id));
  assert.ok(stokA, "Stok item A harus ada");
  assert.equal(stokA!.kuantitas, "10.0000");
  assert.equal(stokA!.nilai, "950000.0000");
  console.log("   Stock recorded:", stokA!.kuantitas, "units, value:", stokA!.nilai);

  // Verifikasi PO selesai ditagih
  const poCek = await ambilPesananPembelian(po.id);
  assert.equal(poCek.status, "SELESAI");
  assert.equal(poCek.baris[0]!.kuantitasDitagih, "10.0000");

  console.log("6. Creating & Posting Purchase Return (Debit Note)...");
  // Retur subtotal = 200,000, diskon = 10,000, DPP = 190,000, PPN = 20,900, Total = 210,900
  const returBeli = await buatReturPembelian(
    {
      fakturId: bill.id,
      tanggal: "2026-11-14",
      diskonNominal: "10000",
      persenPpn: "11",
      baris: [
        {
          itemId: itemA.id,
          barisFakturId: bill.baris[0]!.id,
          kuantitas: "2",
          hargaSatuan: "100000",
        },
      ],
    },
    oleh,
  );

  assert.equal(returBeli.total, "210900.0000");
  const returBeliPosted = await postingReturPembelian(returBeli.id, oleh);
  assert.equal(returBeliPosted.status, "POSTED");

  // Sisa tagihan faktur harus berkurang: 979,500 - 210,900 = 768,600
  const billSetelahRetur = await ambilFakturPembelian(bill.id);
  assert.equal(billSetelahRetur.sisaTagihan, "768600.0000");
  console.log("   Invoice remaining payable after return:", billSetelahRetur.sisaTagihan);

  // Stok berkurang 2 pcs (tersisa 8 pcs)
  const [stokASetelahReturBeli] = await db.select().from(itemStocks).where(eq(itemStocks.itemId, itemA.id));
  assert.equal(stokASetelahReturBeli!.kuantitas, "8.0000");
  console.log("   Stock after return:", stokASetelahReturBeli!.kuantitas);

  /* ========================================================== */
  /* B. SIKLUS PENJUALAN (M5)                                  */
  /* ========================================================== */

  console.log("7. Creating Sales Order (SO)...");
  // 5 pcs @ 150,000, diskon 25,000, PPN 11%, Ongkir 20,000, Uang Muka 50,000
  // Gross = 750,000. DPP = 725,000. PPN = 79,750. Ongkir = 20,000. Total = 774,750.
  const so = await buatPesananPenjualan(
    {
      pelangganId: pelanggan.id,
      tanggal: "2026-11-14",
      referensi: `REF-SO-${ts}`,
      diskonNominal: "25000",
      persenPpn: "11",
      ongkir: "20000",
      uangMuka: "50000",
      baris: [
        {
          itemId: itemA.id,
          deskripsi: "Penjualan Barang Uji M5",
          kuantitas: "5",
          hargaSatuan: "150000",
        },
      ],
    },
    oleh,
  );

  assert.equal(so.status, "DRAFT");
  assert.equal(so.subtotal, "750000.0000");
  assert.equal(so.diskonNominal, "25000.0000");
  assert.equal(so.ppn, "79750.0000");
  assert.equal(so.ongkir, "20000.0000");
  assert.equal(so.uangMuka, "50000.0000");
  assert.equal(so.total, "774750.0000");
  console.log("   SO created with total:", so.total);

  console.log("8. Approving Sales Order...");
  const soDisetujui = await setujuiPesananPenjualan(so.id, oleh);
  assert.equal(soDisetujui.status, "DISETUJUI");

  console.log("9. Creating Sales Invoice...");
  const inv = await buatFakturPenjualan(
    {
      pelangganId: pelanggan.id,
      pesananId: so.id,
      tanggal: "2026-11-14",
      diskonNominal: "25000",
      persenPpn: "11",
      ongkir: "20000",
      uangMuka: "50000",
      baris: [
        {
          itemId: itemA.id,
          barisPesananId: so.baris[0]!.id,
          deskripsi: "Penjualan Barang Uji M5",
          kuantitas: "5",
          hargaSatuan: "150000",
        },
      ],
    },
    oleh,
  );

  assert.equal(inv.status, "DRAFT");
  assert.equal(inv.total, "774750.0000");
  assert.equal(inv.sisaTagihan, "774750.0000");

  console.log("10. Testing Customer Credit Limit Enforcement...");
  await ubahKontak(pelanggan.id, { batasKredit: "500000" }, oleh);
  let blocked = false;
  try {
    await postingFakturPenjualan(inv.id, oleh);
  } catch (e) {
    blocked = true;
    const err = e as Error;
    assert.ok(err.message.includes("melebihi batas kredit pelanggan"), "Harus menolak karena batas kredit terlampaui");
  }
  assert.ok(blocked, "Posting harus ditolak bila melebihi batas kredit");
  console.log("   Credit limit blocked excessive invoice as expected!");

  // Kembalikan batas kredit dan posting
  await ubahKontak(pelanggan.id, { batasKredit: "5000000" }, oleh);
  const invPosted = await postingFakturPenjualan(inv.id, oleh);
  assert.equal(invPosted.status, "POSTED");
  assert.ok(invPosted.jurnalId, "Jurnal harus terbuat");

  // Verifikasi Jurnal Faktur Penjualan seimbang debit = kredit
  const barisJurnalInv = await db
    .select()
    .from(journalItems)
    .where(eq(journalItems.jurnalId, invPosted.jurnalId!));
  const totalDebitInv = barisJurnalInv.reduce((sum, b) => sum + BigInt(b.debitDasar.replace(".", "")), BigInt(0));
  const totalKreditInv = barisJurnalInv.reduce((sum, b) => sum + BigInt(b.kreditDasar.replace(".", "")), BigInt(0));
  assert.equal(totalDebitInv, totalKreditInv, "Jurnal Invoice harus seimbang Debit = Kredit");

  // Stok berkurang 5 pcs (tersisa 3 pcs dari 8 pcs)
  const [stokASetelahJual] = await db.select().from(itemStocks).where(eq(itemStocks.itemId, itemA.id));
  assert.equal(stokASetelahJual!.kuantitas, "3.0000");
  console.log("   Stock after sales:", stokASetelahJual!.kuantitas);

  // Verifikasi SO selesai ditagih
  const soCek = await ambilPesananPenjualan(so.id);
  assert.equal(soCek.status, "SELESAI");
  assert.equal(soCek.baris[0]!.kuantitasDitagih, "5.0000");

  console.log("11. Creating & Posting Sales Return (Credit Note)...");
  // Retur subtotal = 150,000, diskon = 5,000, DPP = 145,000, PPN = 15,950, Total = 160,950
  const returJual = await buatReturPenjualan(
    {
      fakturId: inv.id,
      tanggal: "2026-11-14",
      diskonNominal: "5000",
      persenPpn: "11",
      baris: [
        {
          itemId: itemA.id,
          barisFakturId: inv.baris[0]!.id,
          kuantitas: "1",
          hargaSatuan: "150000",
        },
      ],
    },
    oleh,
  );

  assert.equal(returJual.total, "160950.0000");
  const returJualPosted = await postingReturPenjualan(returJual.id, oleh);
  assert.equal(returJualPosted.status, "POSTED");

  // Sisa tagihan faktur penjualan harus berkurang: 774,750 - 160,950 = 613,800
  const invSetelahRetur = await ambilFakturPenjualan(inv.id);
  assert.equal(invSetelahRetur.sisaTagihan, "613800.0000");
  console.log("   Invoice remaining receivable after return:", invSetelahRetur.sisaTagihan);

  // Stok bertambah 1 pcs kembali ke persediaan (tersisa 4 pcs dari 3 pcs)
  const [stokASetelahReturJual] = await db.select().from(itemStocks).where(eq(itemStocks.itemId, itemA.id));
  assert.equal(stokASetelahReturJual!.kuantitas, "4.0000");
  console.log("   Stock restored after sales return:", stokASetelahReturJual!.kuantitas);

  console.log("\n>>> ALL M4 & M5 E2E INTEGRATION TESTS PASSED SUCCESSFULLY! <<<");
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
