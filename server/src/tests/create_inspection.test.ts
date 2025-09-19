import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inspectionsTable, vehiclesTable, inspectorsTable } from '../db/schema';
import { type CreateInspectionInput } from '../schema';
import { createInspection } from '../handlers/create_inspection';
import { eq } from 'drizzle-orm';

// Helper function to create a test vehicle
const createTestVehicle = async () => {
  const vehicleResult = await db.insert(vehiclesTable)
    .values({
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      vin: '1HGBH41JXMN109186',
      license_plate: 'ABC123'
    })
    .returning()
    .execute();

  return vehicleResult[0];
};

// Helper function to create a test inspector
const createTestInspector = async () => {
  const inspectorResult = await db.insert(inspectorsTable)
    .values({
      name: 'John Doe',
      employee_id: 'EMP001'
    })
    .returning()
    .execute();

  return inspectorResult[0];
};

describe('createInspection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an inspection with valid inputs', async () => {
    // Create prerequisite data
    const vehicle = await createTestVehicle();
    const inspector = await createTestInspector();

    const testInput: CreateInspectionInput = {
      vehicle_id: vehicle.id,
      inspector_id: inspector.id,
      inspection_date: new Date('2024-01-15T10:00:00Z'),
      notes: 'Routine inspection'
    };

    const result = await createInspection(testInput);

    // Verify returned inspection data
    expect(result.id).toBeDefined();
    expect(result.vehicle_id).toEqual(vehicle.id);
    expect(result.inspector_id).toEqual(inspector.id);
    expect(result.inspection_date).toEqual(testInput.inspection_date);
    expect(result.completed).toBe(false); // Should default to false
    expect(result.notes).toEqual('Routine inspection');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an inspection without notes', async () => {
    // Create prerequisite data
    const vehicle = await createTestVehicle();
    const inspector = await createTestInspector();

    const testInput: CreateInspectionInput = {
      vehicle_id: vehicle.id,
      inspector_id: inspector.id,
      inspection_date: new Date('2024-01-15T10:00:00Z')
      // notes is optional
    };

    const result = await createInspection(testInput);

    expect(result.notes).toBeNull();
    expect(result.completed).toBe(false);
  });

  it('should save inspection to database', async () => {
    // Create prerequisite data
    const vehicle = await createTestVehicle();
    const inspector = await createTestInspector();

    const testInput: CreateInspectionInput = {
      vehicle_id: vehicle.id,
      inspector_id: inspector.id,
      inspection_date: new Date('2024-01-15T10:00:00Z'),
      notes: 'Database test'
    };

    const result = await createInspection(testInput);

    // Query database to verify inspection was saved
    const inspections = await db.select()
      .from(inspectionsTable)
      .where(eq(inspectionsTable.id, result.id))
      .execute();

    expect(inspections).toHaveLength(1);
    const savedInspection = inspections[0];
    expect(savedInspection.vehicle_id).toEqual(vehicle.id);
    expect(savedInspection.inspector_id).toEqual(inspector.id);
    expect(savedInspection.inspection_date).toEqual(testInput.inspection_date);
    expect(savedInspection.completed).toBe(false);
    expect(savedInspection.notes).toEqual('Database test');
  });

  it('should throw error when vehicle does not exist', async () => {
    // Create only inspector, not vehicle
    const inspector = await createTestInspector();

    const testInput: CreateInspectionInput = {
      vehicle_id: 9999, // Non-existent vehicle ID
      inspector_id: inspector.id,
      inspection_date: new Date('2024-01-15T10:00:00Z'),
      notes: 'Invalid vehicle test'
    };

    await expect(createInspection(testInput)).rejects.toThrow(/vehicle with id 9999 does not exist/i);
  });

  it('should throw error when inspector does not exist', async () => {
    // Create only vehicle, not inspector
    const vehicle = await createTestVehicle();

    const testInput: CreateInspectionInput = {
      vehicle_id: vehicle.id,
      inspector_id: 9999, // Non-existent inspector ID
      inspection_date: new Date('2024-01-15T10:00:00Z'),
      notes: 'Invalid inspector test'
    };

    await expect(createInspection(testInput)).rejects.toThrow(/inspector with id 9999 does not exist/i);
  });

  it('should throw error when both vehicle and inspector do not exist', async () => {
    const testInput: CreateInspectionInput = {
      vehicle_id: 9999,
      inspector_id: 8888,
      inspection_date: new Date('2024-01-15T10:00:00Z'),
      notes: 'Both invalid test'
    };

    // Should fail on vehicle validation first
    await expect(createInspection(testInput)).rejects.toThrow(/vehicle with id 9999 does not exist/i);
  });

  it('should handle different inspection dates correctly', async () => {
    // Create prerequisite data
    const vehicle = await createTestVehicle();
    const inspector = await createTestInspector();

    const futureDate = new Date('2025-06-15T14:30:00Z');
    const testInput: CreateInspectionInput = {
      vehicle_id: vehicle.id,
      inspector_id: inspector.id,
      inspection_date: futureDate,
      notes: 'Future inspection'
    };

    const result = await createInspection(testInput);

    expect(result.inspection_date).toEqual(futureDate);
    expect(result.inspection_date).toBeInstanceOf(Date);
  });
});