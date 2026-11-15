Buat konten Sheet profil yang muncul saat avatar di navbar diklik. Gambar referensi terlampir.

## ATURAN UTAMA

- Dari gambar, tiru HANYA style visual: tata letak, ukuran, jarak, bentuk, warna, tipografi.
- JANGAN tiru isi konten gambar (John Doe, john@company.com, Team, Invites, Billing, Upgrade Your Plan, Save 30% today, avatar-avatar kartun). Itu hanya template.
- Isi konten disesuaikan dengan proyek (aplikasi baca meter air PDAM Tirtawening, role Superadmin) sesuai bagian "KONTEN" di bawah.
- Ikuti panduan di /docs/STRUKTUR-KODE.md: penamaan PascalCase, folder semantik, jangan dipecah berlebihan.
- Pakai komponen shadcn/ui (Sheet, Avatar, Badge, Separator, Button) dan ikon HugeIcons. Warna dan font memakai token dari globals.css, jangan hardcode kecuali gradien kartu bawah.
- Sebelum menulis kode, baca komponen Navbar dan Sheet yang sudah ada di proyek, lalu sambungkan ke trigger avatar yang ada. Jangan membuat navbar baru.

## SPESIFIKASI VISUAL (tiru seakurat mungkin)

Container Sheet

- Sheet dari sisi kanan (side="right"), lebar tetap ±346px, latar putih (token background), overlay gelap transparan di belakang.
- Tombol close (ikon X) di pojok kiri atas, ±16px dari tepi, tanpa border, ukuran ikon ±18px.
- Padding horizontal konten ±28px.

Header profil (rata tengah)

- Avatar besar bulat ±96px, latar abu sangat muda.
- Badge tombol edit di pojok kanan bawah avatar: lingkaran putih ±28px, border tipis, ikon pensil ±14px, sedikit menimpa tepi avatar.
- Di bawahnya: nama (±18px, font-medium, warna foreground) dan email (±14px, warna muted-foreground), jarak antar keduanya rapat.

Baris avatar akun

- Rata tengah, 4 lingkaran ±40px, gap ±12px.
- 3 avatar akun + 1 tombol "+" berupa lingkaran abu muda dengan ikon plus di tengah.

Pemisah

- Garis horizontal putus-putus (dashed), tipis, warna border muted, lebar penuh, margin vertikal ±16px.

Daftar menu (2 grup)

- Label grup ("Account"/"Platform") ±14px, warna muted-foreground, tanpa bold.
- Setiap item: ikon outline/stroke tipis ±18px di kiri, label ±14px, gap ikon-teks ±12px, tinggi baris ±33px, rata kiri, tanpa background/border. Ada state hover halus.
- Item dengan badge (seperti "Invites"): badge kecil di kanan, bentuk kotak rounded ±4px, border tipis, angka ±12px, tanpa fill.
- Item terakhir ("Sign Out") berwarna merah muda-ke-merah (destructive/rose) pada ikon dan teks.

Kartu bawah (menempel di dasar sheet, margin ±16px dari tepi)

- Rounded ±8px, tinggi ±150px, gradien diagonal dari biru (kiri atas, ±#2b7fff) ke ungu (kanan bawah, ±#a855f7).
- Isi rata tengah vertikal dan horizontal:
  1. Lingkaran ±46px putih transparan (±20% opacity) berisi ikon outline putih ±22px.
  2. Teks kecil huruf kapital, letter-spacing lebar, font mono, ±10px, putih ±60% opacity.
  3. Teks utama putih, ±20px, bold, dengan satu kata/angka penting digarisbawahi.

## KONTEN (sesuaikan proyek, bukan dari gambar)

Header

- Nama dan email diambil dari data user/session yang sudah ada di proyek (jika belum ada, buat konstanta data dummy yang jelas ditandai TODO).
- Tampilkan role pengguna (mis. "Superadmin") sebagai teks kecil muted di bawah email.
- Baris avatar akun: ubah fungsinya menjadi pengganti akun/role hanya jika proyek memang punya fitur itu. Jika tidak ada, hapus baris ini dan jangan menambah fitur baru.

Grup "Akun"

- Lihat Profil
- Pengguna (pengganti "Team")
- Notifikasi dengan badge jumlah belum dibaca (pengganti "Invites")

Grup "Aplikasi"

- Pengaturan
- Bantuan
- Keluar (merah)

Cek route yang sudah ada di proyek. Hanya tampilkan menu yang punya halaman tujuan nyata, sisanya dihilangkan.

Kartu bawah (pengganti promo upgrade)

- Fungsi: akses cepat ke periode baca meter berjalan dan halaman Closing.
- Teks kecil kapital: "PERIODE BACA METER"
- Teks utama: "Closing {Bulan Tahun}" dengan bulan digarisbawahi
- Ikon: pilih dari HugeIcons yang cocok (kalender atau kunci)
- Seluruh kartu dapat diklik menuju halaman Closing, dan sheet tertutup saat diklik.

## OUTPUT

- Satu komponen utama (mis. SheetProfil.tsx) dan satu file data/konstanta bila perlu, di folder sesuai STRUKTUR-KODE.md.
- Sheet harus terbuka saat avatar di navbar diklik dan tertutup lewat tombol X, overlay, dan Esc.
- Responsif: di layar sempit lebar sheet maksimal 100vw.
- Setelah selesai, jelaskan singkat file yang diubah dan menu mana yang dihilangkan karena rutenya belum ada.
