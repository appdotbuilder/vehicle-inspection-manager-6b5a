import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inspectorsTable } from '../db/schema';
import { type UpdateInspectorInput } from '../schema';
import { updateInspector } from '../handlers/update_inspector';
import { eq } from 'drizzle-orm';

describe('updateInspector', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testInspector: { id: number; name: string; employee_id: string; created_at: Date; updated_at: Date };

  beforeEach(async () => {
    // Create a test inspector to update
    const result = await db.insert(inspectorsTable)
      .values({
        name: 'Original Inspector',
        employee_id: 'ORIG001'
      })
      .returning()
      .execute();

    testInspector = result[0];
  });

  it('should update inspector name', async () => {
    const input: UpdateInspectorInput = {
      id: testInspector.id,
      name: 'Updated Inspector'
    };

    const result = await updateInspector(input);

    expect(result.id).toEqual(testInspector.id);
    expect(result.name).toEqual('Updated Inspector');
    expect(result.employee_id).toEqual('ORIG001'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testInspector.updated_at).toBe(true);
  });

  it('should update inspector employee_id', async () => {
    const input: UpdateInspectorInput = {
      id: testInspector.id,
      employee_id: 'NEW001'
    };

    const result = await updateInspector(input);

    expect(result.id).toEqual(testInspector.id);
    expect(result.name).toEqual('Original Inspector'); // Unchanged
    expect(result.employee_id).toEqual('NEW001');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testInspector.updated_at).toBe(true);
  });

  it('should update both name and employee_id', async () => {
    const input: UpdateInspectorInput = {
      id: testInspector.id,
      name: 'Completely Updated Inspector',
      employee_id: 'COMP001'
    };

    const result = await updateInspector(input);

    expect(result.id).toEqual(testInspector.id);
    expect(result.name).toEqual('Completely Updated Inspector');
    expect(result.employee_id).toEqual('COMP001');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testInspector.updated_at).toBe(true);
  });

  it('should save changes to database', async () => {
    const input: UpdateInspectorInput = {
      id: testInspector.id,
      name: 'Database Updated Inspector',
      employee_id: 'DB001'
    };

    await updateInspector(input);

    // Verify changes were saved to database
    const inspectors = await db.select()
      .from(inspectorsTable)
      .where(eq(inspectorsTable.id, testInspector.id))
      .execute();

    expect(inspectors).toHaveLength(1);
    expect(inspectors[0].name).toEqual('Database Updated Inspector');
    expect(inspectors[0].employee_id).toEqual('DB001');
    expect(inspectors[0].updated_at).toBeInstanceOf(Date);
    expect(inspectors[0].updated_at > testInspector.updated_at).toBe(true);
  });

  it('should throw error when inspector not found', async () => {
    const input: UpdateInspectorInput = {
      id: 99999, // Non-existent ID
      name: 'Should Not Work'
    };

    await expect(updateInspector(input)).rejects.toThrow(/Inspector with ID 99999 not found/);
  });

  it('should throw error when employee_id already exists', async () => {
    // Create another inspector with a different employee_id
    await db.insert(inspectorsTable)
      .values({
        name: 'Another Inspector',
        employee_id: 'ANOTHER001'
      })
      .execute();

    const input: UpdateInspectorInput = {
      id: testInspector.id,
      employee_id: 'ANOTHER001' // Try to use existing employee_id
    };

    await expect(updateInspector(input)).rejects.toThrow(/Inspector with employee ID ANOTHER001 already exists/);
  });

  it('should allow updating other fields without changing employee_id', async () => {
    const input: UpdateInspectorInput = {
      id: testInspector.id,
      name: 'Name Only Update'
    };

    const result = await updateInspector(input);

    expect(result.name).toEqual('Name Only Update');
    expect(result.employee_id).toEqual('ORIG001'); // Should remain unchanged
  });

  it('should allow keeping same employee_id when updating other fields', async () => {
    // This should not trigger the uniqueness check since it's the same inspector
    const input: UpdateInspectorInput = {
      id: testInspector.id,
      name: 'Updated Name',
      employee_id: 'ORIG001' // Same employee_id
    };

    const result = await updateInspector(input);

    expect(result.name).toEqual('Updated Name');
    expect(result.employee_id).toEqual('ORIG001');
  });

  it('should handle partial updates correctly', async () => {
    // Test with only ID (should not change anything except updated_at)
    const input: UpdateInspectorInput = {
      id: testInspector.id
    };

    const result = await updateInspector(input);

    expect(result.name).toEqual('Original Inspector'); // Unchanged
    expect(result.employee_id).toEqual('ORIG001'); // Unchanged
    expect(result.updated_at > testInspector.updated_at).toBe(true); // Should be updated
  });
});