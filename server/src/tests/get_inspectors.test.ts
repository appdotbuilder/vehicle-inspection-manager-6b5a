import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inspectorsTable } from '../db/schema';
import { type CreateInspectorInput } from '../schema';
import { getInspectors } from '../handlers/get_inspectors';
import { eq } from 'drizzle-orm';

// Test data
const testInspectors: CreateInspectorInput[] = [
  {
    name: 'Charlie Wilson',
    employee_id: 'EMP003'
  },
  {
    name: 'Alice Johnson',
    employee_id: 'EMP001'
  },
  {
    name: 'Bob Smith',
    employee_id: 'EMP002'
  }
];

describe('getInspectors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no inspectors exist', async () => {
    const result = await getInspectors();

    expect(result).toEqual([]);
  });

  it('should return all inspectors', async () => {
    // Create test inspectors
    await db.insert(inspectorsTable)
      .values(testInspectors)
      .execute();

    const result = await getInspectors();

    expect(result).toHaveLength(3);
    
    // Verify all inspectors are returned with correct fields
    result.forEach(inspector => {
      expect(inspector.id).toBeDefined();
      expect(typeof inspector.name).toBe('string');
      expect(typeof inspector.employee_id).toBe('string');
      expect(inspector.created_at).toBeInstanceOf(Date);
      expect(inspector.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific inspector data
    const inspectorNames = result.map(i => i.name);
    expect(inspectorNames).toContain('Alice Johnson');
    expect(inspectorNames).toContain('Bob Smith');
    expect(inspectorNames).toContain('Charlie Wilson');

    const employeeIds = result.map(i => i.employee_id);
    expect(employeeIds).toContain('EMP001');
    expect(employeeIds).toContain('EMP002');
    expect(employeeIds).toContain('EMP003');
  });

  it('should return inspectors ordered by name alphabetically', async () => {
    // Create test inspectors
    await db.insert(inspectorsTable)
      .values(testInspectors)
      .execute();

    const result = await getInspectors();

    expect(result).toHaveLength(3);
    
    // Verify alphabetical order by name
    expect(result[0].name).toEqual('Alice Johnson');
    expect(result[1].name).toEqual('Bob Smith');
    expect(result[2].name).toEqual('Charlie Wilson');
  });

  it('should handle single inspector correctly', async () => {
    // Create single inspector
    await db.insert(inspectorsTable)
      .values([{
        name: 'Single Inspector',
        employee_id: 'SINGLE001'
      }])
      .execute();

    const result = await getInspectors();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Single Inspector');
    expect(result[0].employee_id).toEqual('SINGLE001');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should verify database persistence', async () => {
    // Create test inspectors
    const insertResult = await db.insert(inspectorsTable)
      .values(testInspectors)
      .returning()
      .execute();

    const result = await getInspectors();

    // Verify results match database records
    expect(result).toHaveLength(insertResult.length);
    
    // Verify each inspector exists in database
    for (const inspector of result) {
      const dbRecord = await db.select()
        .from(inspectorsTable)
        .where(eq(inspectorsTable.id, inspector.id))
        .execute();
      
      expect(dbRecord).toHaveLength(1);
      expect(dbRecord[0].name).toEqual(inspector.name);
      expect(dbRecord[0].employee_id).toEqual(inspector.employee_id);
    }
  });
});