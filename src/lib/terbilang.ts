/**
 * Mengonversi nominal angka ke teks terbilang Bahasa Indonesia
 * Contoh: 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function angkaKeTerbilang(nilai: number): string {
  if (nilai === 0) return "Nol Rupiah";

  const satuan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  function konversi(n: number): string {
    if (n < 12) {
      return satuan[n] ?? "";
    } else if (n < 20) {
      return konversi(n - 10) + " Belas";
    } else if (n < 100) {
      return (
        konversi(Math.floor(n / 10)) +
        " Puluh " +
        konversi(n % 10)
      ).trim();
    } else if (n < 200) {
      return ("Seratus " + konversi(n - 100)).trim();
    } else if (n < 1000) {
      return (
        konversi(Math.floor(n / 100)) +
        " Ratus " +
        konversi(n % 100)
      ).trim();
    } else if (n < 2000) {
      return ("Seribu " + konversi(n - 1000)).trim();
    } else if (n < 1000000) {
      return (
        konversi(Math.floor(n / 1000)) +
        " Ribu " +
        konversi(n % 1000)
      ).trim();
    } else if (n < 1000000000) {
      return (
        konversi(Math.floor(n / 1000000)) +
        " Juta " +
        konversi(n % 1000000)
      ).trim();
    } else if (n < 1000000000000) {
      return (
        konversi(Math.floor(n / 1000000000)) +
        " Miliar " +
        konversi(n % 1000000000)
      ).trim();
    } else {
      return (
        konversi(Math.floor(n / 1000000000000)) +
        " Triliun " +
        konversi(n % 1000000000000)
      ).trim();
    }
  }

  const hasil = konversi(Math.floor(Math.abs(nilai)));
  return `${hasil} Rupiah`;
}
