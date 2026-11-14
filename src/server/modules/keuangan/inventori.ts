import { db } from '../core/db';
import { ApiError } from '../core/errors';

export async function getStok() {
  try {
    const stok = await db.query('SELECT * FROM stok');
    return stok;
  } catch (error) {
    throw new ApiError('UNAUTHORIZED', 'Error getting stok', error.message);
  }
}

export async function getGudang() {
  try {
    const gudang = await db.query('SELECT * FROM gudang');
    return gudang;
  } catch (error) {
    throw new ApiError('UNAUTHORIZED', 'Error getting gudang', error.message);
  }
}

export async function postTransferGudang(data) {
  try {
    const transferGudang = await db.query('INSERT INTO transfer_gudang SET ?', data);
    return transferGudang;
  } catch (error) {
    throw new ApiError('UNAUTHORIZED', 'Error posting transfer gudang', error.message);
  }
}

export async function postStokOpname(data) {
  try {
    const stokOpname = await db.query('INSERT INTO stok_opname SET ?', data);
    return stokOpname;
  } catch (error) {
    throw new ApiError('UNAUTHORIZED', 'Error posting stok opname', error.message);
  }
}
