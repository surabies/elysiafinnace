import { getApi } from "./api-client";

/**
 * Mengambil pratinjau (preview) nomor seri otomatis berikutnya untuk prefiks tertentu
 * tanpa menaikkan counter sequence di database.
 * 
 * @param prefiks Prefiks dokumen/master data, misal "CUST", "SUPP", "PRD", "CAT", "GDG", "FJ", "FB"
 * @returns Nomor seri yang terformat, misal "CUST/2026/00001", atau string kosong jika gagal
 */
export async function ambilPratinjauNomor(prefiks: string): Promise<string> {
  try {
    const api = getApi();
    const res = await api.keuangan.penomoran.berikutnya.get({
      query: { prefiks },
    });

    if (res.data?.data && typeof res.data.data === "object" && "nomorBerikutnya" in res.data.data) {
      return String(res.data.data.nomorBerikutnya);
    }
    return "";
  } catch {
    return "";
  }
}
