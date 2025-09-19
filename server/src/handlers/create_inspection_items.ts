import { db } from '../db';
import { inspectionItemsTable, inspectionsTable } from '../db/schema';
import { type CreateInspectionItemsInput, type InspectionItem } from '../schema';
import { eq } from 'drizzle-orm';

export const createInspectionItems = async (input: CreateInspectionItemsInput): Promise<InspectionItem[]> => {
  try {
    // First, validate that the inspection exists
    const inspection = await db.select()
      .from(inspectionsTable)
      .where(eq(inspectionsTable.id, input.inspection_id))
      .execute();

    if (inspection.length === 0) {
      throw new Error(`Inspection with id ${input.inspection_id} not found`);
    }

    // Handle empty items array case
    if (input.items.length === 0) {
      return [];
    }

    // Prepare the items for bulk insertion
    const itemsToInsert = input.items.map(item => ({
      inspection_id: input.inspection_id,
      item_name: item.item_name,
      status: item.status,
      comments: item.comments || null
    }));

    // Insert all items at once using bulk insert
    const result = await db.insert(inspectionItemsTable)
      .values(itemsToInsert)
      .returning()
      .execute();

    return result;
  } catch (error) {
    console.error('Inspection items creation failed:', error);
    throw error;
  }
};