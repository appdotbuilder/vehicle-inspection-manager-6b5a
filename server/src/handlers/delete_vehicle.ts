import { db } from '../db';
import { vehiclesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteVehicle = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Check if vehicle exists first
    const existingVehicle = await db.select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.id, id))
      .limit(1)
      .execute();

    if (existingVehicle.length === 0) {
      throw new Error(`Vehicle with ID ${id} not found`);
    }

    // Delete the vehicle - cascading deletes are handled by database constraints
    const result = await db.delete(vehiclesTable)
      .where(eq(vehiclesTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Vehicle deletion failed:', error);
    throw error;
  }
};