import assert from "node:assert/strict";
import {
  buatJadwalTransaksiBerulang,
  daftarJadwalTransaksiBerulang,
  ambilJadwalTransaksiBerulang,
  ubahJadwalTransaksiBerulang,
  eksekusiTransaksiBerulang,
  prosesPengingatJatuhTempo,
  buatApiKey,
  cabutApiKey,
  verifikasiApiKey,
  buatWebhook,
  daftarWebhook,
  ubahWebhook,
  hapusWebhook,
  kirimWebhook,
} from "../src/server/modules/keuangan/otomasi/service";
import { buatKontak } from "../src/server/modules/keuangan/kontak/service";
import { buatItem, buatSatuan } from "../src/server/modules/keuangan/inventori/service";
import { ambilMataUangDasar } from "../src/server/modules/keuangan/mata-uang/service";
import { buatFakturPenjualan, postingFakturPenjualan } from "../src/server/modules/keuangan/penjualan/service";
import { db } from "../src/server/modules/keuangan/shared/context";
import { webhookDeliveries } from "@/db/schema/keuangan";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=== Starting Milestone M13 (Otomasi, Recurring, Reminder & Integrasi) Verification ===");
  const suffix = Math.floor(Math.random() * 89999 + 10000);
  const ts = Date.now();
  const oleh = "test-runner-m13";

  const muDasar = await ambilMataUangDasar();
  assert.ok(muDasar, "Mata uang dasar harus ada");

  // Setup Master Data
  const satuan = await buatSatuan({ kode: `U${suffix}`, nama: "Unit" }, oleh);
  const itemA = await buatItem(
    {
      sku: `SKU-AUTO-${ts}`,
      nama: `Layanan Berlangganan ${ts}`,
      satuanId: satuan.id,
      tipeBarang: "JASA",
      hargaBeliStandar: "100000",
      hargaJualStandar: "250000",
    },
    oleh,
  );

  const pelanggan = await buatKontak(
    {
      kode: `CUST-AUTO-${ts}`,
      nama: `PT Pelanggan Langganan ${ts}`,
      adalahPelanggan: true,
      mataUangId: muDasar.id,
    },
    oleh,
  );

  // ==========================================
  // 1. JADWAL TRANSAKSI BERULANG (RECURRING)
  // ==========================================
  console.log("1. Creating recurring transaction schedule...");
  const jadwal = await buatJadwalTransaksiBerulang(
    {
      nama: `Faktur Bulanan Maintenance ${ts}`,
      jenis: "FAKTUR_PENJUALAN",
      frekuensi: "BULANAN",
      tanggalMulai: "2026-04-01",
      tanggalSelesai: "2026-12-31",
      templatePayload: {
        pelangganId: pelanggan.id,
        mataUangId: muDasar.id,
        kurs: "1",
        baris: [
          {
            itemId: itemA.id,
            deskripsi: "Biaya Pemeliharaan Sistem Bulanan",
            kuantitas: "1",
            hargaSatuan: "250000",
            persenDiskon: "0",
          },
        ],
      },
      catatan: "Penagihan otomatis tanggal 1 setiap bulan",
    },
    oleh,
  );

  assert.ok(jadwal.id, "Jadwal transaksi berulang harus berhasil dibuat");
  assert.equal(jadwal.frekuensi, "BULANAN");
  assert.equal(jadwal.tanggalBerikutnya, "2026-04-01");

  // Daftar dan Detail Jadwal
  const listJadwal = await daftarJadwalTransaksiBerulang({ aktif: true });
  assert.ok(listJadwal.some((j) => j.id === jadwal.id));

  const detailJadwal = await ambilJadwalTransaksiBerulang(jadwal.id);
  assert.equal(detailJadwal.nama, jadwal.nama);
  assert.ok(Array.isArray(detailJadwal.riwayat));

  // Ubah Jadwal
  const ubahJadwal = await ubahJadwalTransaksiBerulang(
    jadwal.id,
    { catatan: "Catatan diperbarui otomatis" },
    oleh,
  );
  assert.equal(ubahJadwal.catatan, "Catatan diperbarui otomatis");

  // ==========================================
  // 2. EKSEKUSI TRANSAKSI BERULANG
  // ==========================================
  console.log("2. Executing recurring transaction generator...");
  // Eksekusi per tanggal 2026-04-02 (jadwal 2026-04-01 harus terpicu)
  const hasilEksekusi = await eksekusiTransaksiBerulang(
    { perTanggal: "2026-04-02", jadwalId: jadwal.id },
    oleh,
  );

  assert.equal(hasilEksekusi.totalDiproses, 1);
  assert.equal(hasilEksekusi.hasil[0]!.sukses, true);
  assert.ok(hasilEksekusi.hasil[0]!.dokumenId, "Dokumen faktur harus terbentuk");
  assert.ok(hasilEksekusi.hasil[0]!.nomorDokumen, "Nomor dokumen faktur harus terbentuk");

  // Verifikasi tanggal berikutnya maju 1 bulan (2026-05-01)
  const jadwalTerupdate = await ambilJadwalTransaksiBerulang(jadwal.id);
  assert.equal(jadwalTerupdate.tanggalBerikutnya, "2026-05-01");
  assert.equal(jadwalTerupdate.totalDijalankan, 1);
  assert.equal(jadwalTerupdate.riwayat.length, 1);

  // ==========================================
  // 3. PENGINGAT JATUH TEMPO (DUE DATE REMINDERS)
  // ==========================================
  console.log("3. Testing due date email reminder engine...");
  // Buat faktur penjualan dengan jatuh tempo 2026-04-10
  const fakturPengingat = await buatFakturPenjualan(
    {
      tanggal: "2026-03-20",
      tanggalJatuhTempo: "2026-04-10",
      pelangganId: pelanggan.id,
      mataUangId: muDasar.id,
      kurs: "1",
      baris: [
        {
          itemId: itemA.id,
          deskripsi: "Tagihan Jatuh Tempo Uji",
          kuantitas: "2",
          hargaSatuan: "250000",
          persenDiskon: "0",
        },
      ],
    },
    oleh,
  );
  await postingFakturPenjualan(fakturPengingat.id, oleh);

  // Jalankan reminder per 2026-04-10 (Hari H: offset 0)
  const hasilPengingat = await prosesPengingatJatuhTempo({
    perTanggal: "2026-04-10",
    offsetsHari: [0],
  });

  assert.ok(hasilPengingat.totalPengingatTerkirim >= 1);
  const logFound = hasilPengingat.daftarLog.find((l) => l.dokumenId === fakturPengingat.id);
  assert.ok(logFound, "Log pengingat harus tercatat");
  assert.equal(logFound.hariOffset, 0);
  assert.ok(logFound.kontenEmail.includes(fakturPengingat.nomor));

  // Jalankan lagi pada tanggal yang sama: tidak boleh mengirim dobel
  const hasilPengingatUlang = await prosesPengingatJatuhTempo({
    perTanggal: "2026-04-10",
    offsetsHari: [0],
  });
  const duplikasi = hasilPengingatUlang.daftarLog.find((l) => l.dokumenId === fakturPengingat.id);
  assert.ok(!duplikasi, "Tidak boleh ada pengiriman pengingat duplikat pada offset yang sama");

  // ==========================================
  // 4. API KEYS (INTEGRASI PIHAK KETIGA)
  // ==========================================
  console.log("4. Testing Third-Party API Key authentication & management...");
  const apiKeyBaru = await buatApiKey(
    {
      nama: `Integrasi Marketplace Toko Online ${ts}`,
      scopes: ["penjualan.kelola", "persediaan.baca"],
      kedaluwarsaHari: 30,
    },
    oleh,
  );

  assert.ok(apiKeyBaru.id);
  assert.ok(apiKeyBaru.kunciRahasia.startsWith("ef_live_"));
  assert.equal(apiKeyBaru.scopes.length, 2);

  // Verifikasi API Key
  const verified = await verifikasiApiKey(apiKeyBaru.kunciRahasia);
  assert.ok(verified, "API key valid harus terverifikasi sukses");
  assert.equal(verified.id, apiKeyBaru.id);

  // Verifikasi kunci invalid
  const invalidKey = await verifikasiApiKey("ef_live_invalidkey1234567890");
  assert.equal(invalidKey, null);

  // Cabut API Key
  await cabutApiKey(apiKeyBaru.id, oleh);
  const revokedKey = await verifikasiApiKey(apiKeyBaru.kunciRahasia);
  assert.equal(revokedKey, null, "API key yang dicabut tidak boleh valid lagi");

  // ==========================================
  // 5. WEBHOOKS & EVENT DISPATCHER
  // ==========================================
  console.log("5. Testing Webhook registration & event dispatching...");
  const webhook = await buatWebhook(
    {
      nama: `Webhook ERP Integrator ${ts}`,
      url: "http://localhost:9999/webhook-receiver-mock",
      events: ["transaksi.berulang.dieksekusi", "pengingat.jatuh_tempo.terkirim"],
    },
    oleh,
  );

  assert.ok(webhook.id);
  assert.ok(webhook.secret.length >= 32);

  const listHooks = await daftarWebhook();
  assert.ok(listHooks.some((w) => w.id === webhook.id));

  // Ubah webhook
  const ubahHook = await ubahWebhook(webhook.id, { nama: "Webhook ERP Updated" }, oleh);
  assert.equal(ubahHook.nama, "Webhook ERP Updated");

  // Trigger dispatching event
  await kirimWebhook("transaksi.berulang.dieksekusi", {
    test: true,
    timestamp: Date.now(),
  });

  // Verifikasi log pengiriman webhook tercatat di DB
  const deliveries = await db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.webhookId, webhook.id));
  assert.ok(deliveries.length >= 1, "Log delivery webhook harus tercatat");
  assert.equal(deliveries[0]!.event, "transaksi.berulang.dieksekusi");

  // Hapus webhook
  const hapus = await hapusWebhook(webhook.id);
  assert.equal(hapus.berhasil, true);

  console.log("\n>>> ALL 5 TEST SCENARIOS FOR MILESTONE M13 PASSED PERFECTLY! <<<");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
