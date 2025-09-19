import { db } from '../db';
import { inspectorsTable } from '../db/schema';
import { type UpdateInspectorInput, type Inspector } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const updateInspector = async (input: UpdateInspectorInput): Promise<Inspector> => {
  try {
    // Check if inspector exists
    const existingInspector = await db.select()
      .from(inspectorsTable)
      .where(eq(inspectorsTable.id, input.id))
      .execute();

    if (existingInspector.length === 0) {
      throw new Error(`Inspector with ID ${input.id} not found`);
    }

    // If updating employee_id, check for uniqueness
    if (input.employee_id) {
      const duplicateCheck = await db.select()
        .from(inspectorsTable)
        .where(
          and(
            eq(inspectorsTable.employee_id, input.employee_id),
            ne(inspectorsTable.id, input.id)
          )
        )
        .execute();

      if (duplicateCheck.length > 0) {
        throw new Error(`Inspector with employee ID ${input.employee_id} already exists`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.employee_id !== undefined) {
      updateData.employee_id = input.employee_id;
    }

    // Update inspector record
    const result = await db.update(inspectorsTable)
      .set(updateData)
      .where(eq(inspectorsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Inspector update failed:', error);
    throw error;
  }
};