import { db } from '../core/db';
import { ApiError } from '../core/errors';

export async function getDashboard() {
  try {
    const dashboard = await db.query('SELECT * FROM dashboard');
    return dashboard;
  } catch (error) {
    throw new ApiError('UNAUTHORIZED', 'Error getting dashboard', error.message);
  }
}
