import { db } from '../db';
import { vehiclesTable } from '../db/schema';
import { type Vehicle } from '../schema';
import { eq } from 'drizzle-orm';

export const getVehicleById = async (id: number): Promise<Vehicle | null> => {
  try {
    const results = await db.select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Get vehicle by ID failed:', error);
    throw error;
  }
};