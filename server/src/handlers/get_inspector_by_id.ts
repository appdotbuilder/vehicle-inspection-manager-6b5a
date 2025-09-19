import { db } from '../db';
import { inspectorsTable } from '../db/schema';
import { type Inspector } from '../schema';
import { eq } from 'drizzle-orm';

export const getInspectorById = async (id: number): Promise<Inspector | null> => {
  try {
    const result = await db.select()
      .from(inspectorsTable)
      .where(eq(inspectorsTable.id, id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Failed to get inspector by id:', error);
    throw error;
  }
};