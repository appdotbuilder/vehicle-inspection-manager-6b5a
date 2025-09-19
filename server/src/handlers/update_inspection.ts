import { db } from '../db';
import { inspectionsTable } from '../db/schema';
import { type UpdateInspectionInput, type Inspection } from '../schema';
import { eq } from 'drizzle-orm';

export const updateInspection = async (input: UpdateInspectionInput): Promise<Inspection> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.completed !== undefined) {
      updateData.completed = input.completed;
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update the inspection record
    const result = await db.update(inspectionsTable)
      .set(updateData)
      .where(eq(inspectionsTable.id, input.id))
      .returning()
      .execute();

    // Check if inspection was found and updated
    if (result.length === 0) {
      throw new Error(`Inspection with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Inspection update failed:', error);
    throw error;
  }
};