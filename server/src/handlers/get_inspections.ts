import { db } from '../db';
import { inspectionsTable } from '../db/schema';
import { type Inspection } from '../schema';
import { desc } from 'drizzle-orm';

export const getInspections = async (): Promise<Inspection[]> => {
  try {
    const results = await db.select()
      .from(inspectionsTable)
      .orderBy(desc(inspectionsTable.inspection_date))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch inspections:', error);
    throw error;
  }
};