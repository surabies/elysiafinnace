import { db } from '../core/db';
import { ApiError } from '../core/errors';

export async function getNeraca() {
  try {
    const neraca = await db.query('SELECT * FROM neraca');
    return neraca;
  } catch (error) {
    throw new ApiError('UNAUTHORIZED', 'Error getting neraca', error.message);
  }
}

export async function getLabaRugi() {
  try {
    const labaRugi = await db.query('SELECT * FROM laba_rugi');
    return labaRugi;
  } catch (error) {
    throw new ApiError('UNAUTHORIZED', 'Error getting laba rugi', error.message);
  }
}

export async function getArusKas() {
  try {
    const arusKas = await db.query('SELECT * FROM arus_kas');
    return arusKas;
  } catch (error) {
    throw new ApiError('UNAUTHORIZED', 'Error getting arus kas', error.message);
  }
}

export async function getKPI() {
  try {
    const kpi = await db.query('SELECT * FROM kpi');
    return kpi;
  } catch (error) {
    throw new ApiError('UNAUTHORIZED', 'Error getting kpi', error.message);
  }
}
