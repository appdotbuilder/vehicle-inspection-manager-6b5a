import { db } from '../db';
import { inspectorsTable, inspectionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteInspector = async (id: number): Promise<{ success: boolean }> => {
  try {
    // First check if inspector exists
    const existingInspector = await db.select()
      .from(inspectorsTable)
      .where(eq(inspectorsTable.id, id))
      .execute();

    if (existingInspector.length === 0) {
      throw new Error(`Inspector with id ${id} not found`);
    }

    // Check if inspector has associated inspections (referential integrity)
    const associatedInspections = await db.select()
      .from(inspectionsTable)
      .where(eq(inspectionsTable.inspector_id, id))
      .execute();

    if (associatedInspections.length > 0) {
      throw new Error(`Cannot delete inspector with id ${id} because they have ${associatedInspections.length} associated inspection(s)`);
    }

    // Delete the inspector
    await db.delete(inspectorsTable)
      .where(eq(inspectorsTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Inspector deletion failed:', error);
    throw error;
  }
};