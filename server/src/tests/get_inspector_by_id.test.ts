import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inspectorsTable } from '../db/schema';
import { type CreateInspectorInput } from '../schema';
import { getInspectorById } from '../handlers/get_inspector_by_id';

// Test input for creating inspector
const testInspector: CreateInspectorInput = {
  name: 'John Doe',
  employee_id: 'EMP001'
};

describe('getInspectorById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return inspector when found', async () => {
    // Create test inspector first
    const insertResult = await db.insert(inspectorsTable)
      .values({
        name: testInspector.name,
        employee_id: testInspector.employee_id
      })
      .returning()
      .execute();

    const createdInspector = insertResult[0];

    // Test the handler
    const result = await getInspectorById(createdInspector.id);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdInspector.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.employee_id).toEqual('EMP001');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when inspector not found', async () => {
    // Test with non-existent ID
    const result = await getInspectorById(999);

    expect(result).toBeNull();
  });

  it('should return the correct inspector when multiple exist', async () => {
    // Create multiple inspectors
    const inspector1 = await db.insert(inspectorsTable)
      .values({
        name: 'Inspector One',
        employee_id: 'EMP001'
      })
      .returning()
      .execute();

    const inspector2 = await db.insert(inspectorsTable)
      .values({
        name: 'Inspector Two',
        employee_id: 'EMP002'
      })
      .returning()
      .execute();

    // Test getting specific inspector
    const result = await getInspectorById(inspector2[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(inspector2[0].id);
    expect(result!.name).toEqual('Inspector Two');
    expect(result!.employee_id).toEqual('EMP002');
  });

  it('should handle zero as ID', async () => {
    // Test with ID 0 (should not exist)
    const result = await getInspectorById(0);

    expect(result).toBeNull();
  });

  it('should handle negative ID', async () => {
    // Test with negative ID (should not exist)
    const result = await getInspectorById(-1);

    expect(result).toBeNull();
  });
});