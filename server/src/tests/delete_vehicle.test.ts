import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vehiclesTable, inspectorsTable, inspectionsTable, inspectionItemsTable } from '../db/schema';
import { deleteVehicle } from '../handlers/delete_vehicle';
import { eq } from 'drizzle-orm';

describe('deleteVehicle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing vehicle', async () => {
    // Create test vehicle
    const vehicleResult = await db.insert(vehiclesTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        vin: '1HGCM82633A123456',
        license_plate: 'ABC123'
      })
      .returning()
      .execute();

    const vehicleId = vehicleResult[0].id;

    // Delete the vehicle
    const result = await deleteVehicle(vehicleId);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify vehicle no longer exists in database
    const vehicles = await db.select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.id, vehicleId))
      .execute();

    expect(vehicles).toHaveLength(0);
  });

  it('should cascade delete related inspections and inspection items', async () => {
    // Create test vehicle
    const vehicleResult = await db.insert(vehiclesTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        vin: '2HGFB2F59EH123456',
        license_plate: 'XYZ789'
      })
      .returning()
      .execute();

    const vehicleId = vehicleResult[0].id;

    // Create test inspector
    const inspectorResult = await db.insert(inspectorsTable)
      .values({
        name: 'John Inspector',
        employee_id: 'EMP001'
      })
      .returning()
      .execute();

    const inspectorId = inspectorResult[0].id;

    // Create test inspection
    const inspectionResult = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicleId,
        inspector_id: inspectorId,
        inspection_date: new Date(),
        completed: false,
        notes: 'Test inspection'
      })
      .returning()
      .execute();

    const inspectionId = inspectionResult[0].id;

    // Create test inspection items
    await db.insert(inspectionItemsTable)
      .values([
        {
          inspection_id: inspectionId,
          item_name: 'Brakes',
          status: 'pass',
          comments: 'Good condition'
        },
        {
          inspection_id: inspectionId,
          item_name: 'Tires',
          status: 'fail',
          comments: 'Needs replacement'
        }
      ])
      .execute();

    // Verify inspection and items exist before deletion
    const inspectionsBefore = await db.select()
      .from(inspectionsTable)
      .where(eq(inspectionsTable.vehicle_id, vehicleId))
      .execute();

    const itemsBefore = await db.select()
      .from(inspectionItemsTable)
      .where(eq(inspectionItemsTable.inspection_id, inspectionId))
      .execute();

    expect(inspectionsBefore).toHaveLength(1);
    expect(itemsBefore).toHaveLength(2);

    // Delete the vehicle
    const result = await deleteVehicle(vehicleId);
    expect(result.success).toBe(true);

    // Verify cascade deletion worked
    const vehiclesAfter = await db.select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.id, vehicleId))
      .execute();

    const inspectionsAfter = await db.select()
      .from(inspectionsTable)
      .where(eq(inspectionsTable.vehicle_id, vehicleId))
      .execute();

    const itemsAfter = await db.select()
      .from(inspectionItemsTable)
      .where(eq(inspectionItemsTable.inspection_id, inspectionId))
      .execute();

    expect(vehiclesAfter).toHaveLength(0);
    expect(inspectionsAfter).toHaveLength(0);
    expect(itemsAfter).toHaveLength(0);

    // Verify inspector still exists (should not be deleted)
    const inspectorsAfter = await db.select()
      .from(inspectorsTable)
      .where(eq(inspectorsTable.id, inspectorId))
      .execute();

    expect(inspectorsAfter).toHaveLength(1);
  });

  it('should throw error when vehicle does not exist', async () => {
    const nonExistentId = 99999;

    // Attempt to delete non-existent vehicle
    await expect(deleteVehicle(nonExistentId)).rejects.toThrow(/Vehicle with ID 99999 not found/i);
  });

  it('should handle deletion of vehicle with multiple inspections', async () => {
    // Create test vehicle
    const vehicleResult = await db.insert(vehiclesTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2020,
        vin: '1FTFW1ET5DFC12345',
        license_plate: 'TRUCK1'
      })
      .returning()
      .execute();

    const vehicleId = vehicleResult[0].id;

    // Create test inspector
    const inspectorResult = await db.insert(inspectorsTable)
      .values({
        name: 'Jane Inspector',
        employee_id: 'EMP002'
      })
      .returning()
      .execute();

    const inspectorId = inspectorResult[0].id;

    // Create multiple inspections
    const inspection1Result = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicleId,
        inspector_id: inspectorId,
        inspection_date: new Date('2023-01-01'),
        completed: true,
        notes: 'First inspection'
      })
      .returning()
      .execute();

    const inspection2Result = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicleId,
        inspector_id: inspectorId,
        inspection_date: new Date('2023-06-01'),
        completed: false,
        notes: 'Second inspection'
      })
      .returning()
      .execute();

    const inspection1Id = inspection1Result[0].id;
    const inspection2Id = inspection2Result[0].id;

    // Create inspection items for both inspections
    await db.insert(inspectionItemsTable)
      .values([
        {
          inspection_id: inspection1Id,
          item_name: 'Engine',
          status: 'pass',
          comments: null
        },
        {
          inspection_id: inspection2Id,
          item_name: 'Transmission',
          status: 'not_applicable',
          comments: 'Manual transmission'
        }
      ])
      .execute();

    // Verify multiple inspections exist
    const inspectionsBefore = await db.select()
      .from(inspectionsTable)
      .where(eq(inspectionsTable.vehicle_id, vehicleId))
      .execute();

    expect(inspectionsBefore).toHaveLength(2);

    // Delete the vehicle
    const result = await deleteVehicle(vehicleId);
    expect(result.success).toBe(true);

    // Verify all related data was deleted
    const inspectionsAfter = await db.select()
      .from(inspectionsTable)
      .where(eq(inspectionsTable.vehicle_id, vehicleId))
      .execute();

    const items1After = await db.select()
      .from(inspectionItemsTable)
      .where(eq(inspectionItemsTable.inspection_id, inspection1Id))
      .execute();

    const items2After = await db.select()
      .from(inspectionItemsTable)
      .where(eq(inspectionItemsTable.inspection_id, inspection2Id))
      .execute();

    expect(inspectionsAfter).toHaveLength(0);
    expect(items1After).toHaveLength(0);
    expect(items2After).toHaveLength(0);
  });
});