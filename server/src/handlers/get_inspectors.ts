import { db } from '../db';
import { inspectorsTable } from '../db/schema';
import { type Inspector } from '../schema';
import { asc } from 'drizzle-orm';

export const getInspectors = async (): Promise<Inspector[]> => {
  try {
    // Fetch all inspectors ordered by name for better UX
    const results = await db.select()
      .from(inspectorsTable)
      .orderBy(asc(inspectorsTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Get inspectors failed:', error);
    throw error;
  }
};