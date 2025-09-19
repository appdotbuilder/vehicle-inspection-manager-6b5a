import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inspectorsTable } from '../db/schema';
import { type CreateInspectorInput } from '../schema';
import { createInspector } from '../handlers/create_inspector';
import { eq } from 'drizzle-orm';

// Test input for creating an inspector
const testInput: CreateInspectorInput = {
  name: 'John Smith',
  employee_id: 'EMP001'
};

describe('createInspector', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an inspector', async () => {
    const result = await createInspector(testInput);

    // Verify returned inspector data
    expect(result.name).toEqual('John Smith');
    expect(result.employee_id).toEqual('EMP001');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save inspector to database', async () => {
    const result = await createInspector(testInput);

    // Query database to verify inspector was saved
    const inspectors = await db.select()
      .from(inspectorsTable)
      .where(eq(inspectorsTable.id, result.id))
      .execute();

    expect(inspectors).toHaveLength(1);
    expect(inspectors[0].name).toEqual('John Smith');
    expect(inspectors[0].employee_id).toEqual('EMP001');
    expect(inspectors[0].created_at).toBeInstanceOf(Date);
    expect(inspectors[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when employee_id already exists', async () => {
    // Create first inspector
    await createInspector(testInput);

    // Attempt to create second inspector with same employee_id
    const duplicateInput: CreateInspectorInput = {
      name: 'Jane Doe',
      employee_id: 'EMP001' // Same employee_id
    };

    await expect(createInspector(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should allow different employee_ids', async () => {
    // Create first inspector
    const firstResult = await createInspector(testInput);

    // Create second inspector with different employee_id
    const secondInput: CreateInspectorInput = {
      name: 'Jane Doe',
      employee_id: 'EMP002'
    };

    const secondResult = await createInspector(secondInput);

    // Verify both inspectors were created successfully
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.employee_id).toEqual('EMP001');
    expect(secondResult.employee_id).toEqual('EMP002');

    // Verify both exist in database
    const allInspectors = await db.select()
      .from(inspectorsTable)
      .execute();

    expect(allInspectors).toHaveLength(2);
    expect(allInspectors.map(i => i.employee_id).sort()).toEqual(['EMP001', 'EMP002']);
  });

  it('should handle names with special characters', async () => {
    const specialInput: CreateInspectorInput = {
      name: "O'Connor-Smith III",
      employee_id: 'EMP003'
    };

    const result = await createInspector(specialInput);

    expect(result.name).toEqual("O'Connor-Smith III");
    expect(result.employee_id).toEqual('EMP003');

    // Verify in database
    const inspectors = await db.select()
      .from(inspectorsTable)
      .where(eq(inspectorsTable.id, result.id))
      .execute();

    expect(inspectors[0].name).toEqual("O'Connor-Smith III");
  });

  it('should create inspector with timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createInspector(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within expected range
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});