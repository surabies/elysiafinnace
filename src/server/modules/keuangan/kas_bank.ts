import { db } from '../core/db';
import { ApiError } from '../core/errors';

export async function getRekeningKas() {
  try {
    const rekeningKas = await db.query('SELECT * FROM rekening_kas');
    return rekeningKas;
  } catch (error) {
    throw new ApiError('UNAUTHORIZED', 'Error getting rekening kas', error.message);
  }
}

export async function getRekeningBank() {
  try {
    const rekeningBank = await db.query('SELECT * FROM rekening_bank');
    return rekeningBank;
  } catch (error) {
    throw new ApiError('UNAUTHORIZED', 'Error getting rekening bank', error.message);
  }
}

export async function postMutasiKas(data) {
  try {
    const mutasiKas = await db.query('INSERT INTO mutasi_kas SET ?', data);
    return mutasiKas;
  } catch (error) {
    throw new ApiError('UNAUTHORIZED', 'Error posting mutasi kas', error.message);
  }
}

export async function postMutasiBank(data) {
  try {
    const mutasiBank = await db.query('INSERT INTO mutasi_bank SET ?', data);
    return mutasiBank;
  } catch (error) {
    throw new ApiError('UNAUTHORIZED', 'Error posting mutasi bank', error.message);
  }
}
