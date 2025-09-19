import { db } from '../db';
import { inspectorsTable } from '../db/schema';
import { type CreateInspectorInput, type Inspector } from '../schema';
import { eq } from 'drizzle-orm';

export const createInspector = async (input: CreateInspectorInput): Promise<Inspector> => {
  try {
    // Check if employee_id already exists to ensure uniqueness
    const existingInspector = await db.select()
      .from(inspectorsTable)
      .where(eq(inspectorsTable.employee_id, input.employee_id))
      .execute();

    if (existingInspector.length > 0) {
      throw new Error(`Inspector with employee_id "${input.employee_id}" already exists`);
    }

    // Insert new inspector record
    const result = await db.insert(inspectorsTable)
      .values({
        name: input.name,
        employee_id: input.employee_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Inspector creation failed:', error);
    throw error;
  }
};