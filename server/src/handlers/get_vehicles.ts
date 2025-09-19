import { db } from '../db';
import { vehiclesTable } from '../db/schema';
import { type Vehicle } from '../schema';
import { desc } from 'drizzle-orm';

export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    const results = await db.select()
      .from(vehiclesTable)
      .orderBy(desc(vehiclesTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch vehicles:', error);
    throw error;
  }
};