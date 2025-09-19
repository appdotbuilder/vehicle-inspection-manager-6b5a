import { db } from '../db';
import { inspectionItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateInspectionItemInput, type InspectionItem } from '../schema';

export const updateInspectionItem = async (input: UpdateInspectionItemInput): Promise<InspectionItem> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.comments !== undefined) {
      updateData.comments = input.comments;
    }

    // Update the inspection item
    const result = await db.update(inspectionItemsTable)
      .set(updateData)
      .where(eq(inspectionItemsTable.id, input.id))
      .returning()
      .execute();

    // Check if inspection item was found and updated
    if (result.length === 0) {
      throw new Error(`Inspection item with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Inspection item update failed:', error);
    throw error;
  }
};