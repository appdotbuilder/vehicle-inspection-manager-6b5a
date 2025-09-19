import { db } from '../db';
import { inspectionsTable, vehiclesTable, inspectorsTable } from '../db/schema';
import { type CreateInspectionInput, type Inspection } from '../schema';
import { eq } from 'drizzle-orm';

export const createInspection = async (input: CreateInspectionInput): Promise<Inspection> => {
  try {
    // Validate that vehicle exists
    const vehicle = await db.select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.id, input.vehicle_id))
      .execute();

    if (vehicle.length === 0) {
      throw new Error(`Vehicle with id ${input.vehicle_id} does not exist`);
    }

    // Validate that inspector exists
    const inspector = await db.select()
      .from(inspectorsTable)
      .where(eq(inspectorsTable.id, input.inspector_id))
      .execute();

    if (inspector.length === 0) {
      throw new Error(`Inspector with id ${input.inspector_id} does not exist`);
    }

    // Insert inspection record
    const result = await db.insert(inspectionsTable)
      .values({
        vehicle_id: input.vehicle_id,
        inspector_id: input.inspector_id,
        inspection_date: input.inspection_date,
        completed: false, // Default to false as specified
        notes: input.notes || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Inspection creation failed:', error);
    throw error;
  }
};