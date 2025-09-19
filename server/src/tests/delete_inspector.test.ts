import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inspectorsTable, inspectionsTable, vehiclesTable } from '../db/schema';
import { deleteInspector } from '../handlers/delete_inspector';
import { eq } from 'drizzle-orm';

// Test data
const testVehicle = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: '12345678901234567',
  license_plate: 'ABC123'
};

const testInspector = {
  name: 'John Smith',
  employee_id: 'EMP001'
};

const testInspection = {
  inspection_date: new Date(),
  completed: false,
  notes: 'Test inspection'
};

describe('deleteInspector', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an inspector with no associated inspections', async () => {
    // Create inspector
    const inspectorResult = await db.insert(inspectorsTable)
      .values(testInspector)
      .returning()
      .execute();
    
    const inspectorId = inspectorResult[0].id;

    // Delete inspector
    const result = await deleteInspector(inspectorId);

    expect(result.success).toBe(true);

    // Verify inspector was deleted
    const inspectors = await db.select()
      .from(inspectorsTable)
      .where(eq(inspectorsTable.id, inspectorId))
      .execute();

    expect(inspectors).toHaveLength(0);
  });

  it('should throw error when inspector not found', async () => {
    const nonExistentId = 9999;

    await expect(deleteInspector(nonExistentId))
      .rejects
      .toThrow(/Inspector with id 9999 not found/i);
  });

  it('should prevent deletion when inspector has associated inspections', async () => {
    // Create vehicle first (needed for inspection)
    const vehicleResult = await db.insert(vehiclesTable)
      .values(testVehicle)
      .returning()
      .execute();
    
    const vehicleId = vehicleResult[0].id;

    // Create inspector
    const inspectorResult = await db.insert(inspectorsTable)
      .values(testInspector)
      .returning()
      .execute();
    
    const inspectorId = inspectorResult[0].id;

    // Create inspection associated with the inspector
    await db.insert(inspectionsTable)
      .values({
        ...testInspection,
        vehicle_id: vehicleId,
        inspector_id: inspectorId
      })
      .execute();

    // Attempt to delete inspector should fail
    await expect(deleteInspector(inspectorId))
      .rejects
      .toThrow(/Cannot delete inspector with id .+ because they have .+ associated inspection/i);

    // Verify inspector still exists
    const inspectors = await db.select()
      .from(inspectorsTable)
      .where(eq(inspectorsTable.id, inspectorId))
      .execute();

    expect(inspectors).toHaveLength(1);
    expect(inspectors[0].name).toEqual('John Smith');
  });

  it('should prevent deletion when inspector has multiple associated inspections', async () => {
    // Create vehicle first
    const vehicleResult = await db.insert(vehiclesTable)
      .values(testVehicle)
      .returning()
      .execute();
    
    const vehicleId = vehicleResult[0].id;

    // Create inspector
    const inspectorResult = await db.insert(inspectorsTable)
      .values(testInspector)
      .returning()
      .execute();
    
    const inspectorId = inspectorResult[0].id;

    // Create multiple inspections for the same inspector
    await db.insert(inspectionsTable)
      .values([
        {
          ...testInspection,
          vehicle_id: vehicleId,
          inspector_id: inspectorId
        },
        {
          ...testInspection,
          vehicle_id: vehicleId,
          inspector_id: inspectorId,
          inspection_date: new Date('2024-01-02'),
          notes: 'Second inspection'
        },
        {
          ...testInspection,
          vehicle_id: vehicleId,
          inspector_id: inspectorId,
          inspection_date: new Date('2024-01-03'),
          notes: 'Third inspection'
        }
      ])
      .execute();

    // Attempt to delete inspector should fail with proper count
    await expect(deleteInspector(inspectorId))
      .rejects
      .toThrow(/Cannot delete inspector with id .+ because they have 3 associated inspection/i);

    // Verify inspector still exists
    const inspectors = await db.select()
      .from(inspectorsTable)
      .where(eq(inspectorsTable.id, inspectorId))
      .execute();

    expect(inspectors).toHaveLength(1);
  });

  it('should handle database integrity correctly after successful deletion', async () => {
    // Create multiple inspectors
    const inspector1Result = await db.insert(inspectorsTable)
      .values({ name: 'Inspector One', employee_id: 'EMP001' })
      .returning()
      .execute();

    const inspector2Result = await db.insert(inspectorsTable)
      .values({ name: 'Inspector Two', employee_id: 'EMP002' })
      .returning()
      .execute();

    const inspector1Id = inspector1Result[0].id;
    const inspector2Id = inspector2Result[0].id;

    // Delete first inspector
    const result = await deleteInspector(inspector1Id);

    expect(result.success).toBe(true);

    // Verify only first inspector was deleted
    const allInspectors = await db.select()
      .from(inspectorsTable)
      .execute();

    expect(allInspectors).toHaveLength(1);
    expect(allInspectors[0].id).toEqual(inspector2Id);
    expect(allInspectors[0].name).toEqual('Inspector Two');
  });
});