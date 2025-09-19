import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vehiclesTable, inspectorsTable, inspectionsTable } from '../db/schema';
import { type UpdateInspectionInput } from '../schema';
import { updateInspection } from '../handlers/update_inspection';
import { eq } from 'drizzle-orm';

describe('updateInspection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testVehicleId: number;
  let testInspectorId: number;
  let testInspectionId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const vehicleResult = await db.insert(vehiclesTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '12345678901234567',
        license_plate: 'ABC123'
      })
      .returning()
      .execute();
    testVehicleId = vehicleResult[0].id;

    const inspectorResult = await db.insert(inspectorsTable)
      .values({
        name: 'John Smith',
        employee_id: 'EMP001'
      })
      .returning()
      .execute();
    testInspectorId = inspectorResult[0].id;

    const inspectionResult = await db.insert(inspectionsTable)
      .values({
        vehicle_id: testVehicleId,
        inspector_id: testInspectorId,
        inspection_date: new Date('2024-01-15'),
        completed: false,
        notes: 'Initial inspection notes'
      })
      .returning()
      .execute();
    testInspectionId = inspectionResult[0].id;
  });

  it('should update inspection completed status', async () => {
    const updateInput: UpdateInspectionInput = {
      id: testInspectionId,
      completed: true
    };

    const result = await updateInspection(updateInput);

    // Verify response
    expect(result.id).toEqual(testInspectionId);
    expect(result.completed).toBe(true);
    expect(result.notes).toEqual('Initial inspection notes'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.vehicle_id).toEqual(testVehicleId);
    expect(result.inspector_id).toEqual(testInspectorId);
  });

  it('should update inspection notes', async () => {
    const updateInput: UpdateInspectionInput = {
      id: testInspectionId,
      notes: 'Updated inspection notes with details'
    };

    const result = await updateInspection(updateInput);

    // Verify response
    expect(result.id).toEqual(testInspectionId);
    expect(result.notes).toEqual('Updated inspection notes with details');
    expect(result.completed).toBe(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both completed status and notes', async () => {
    const updateInput: UpdateInspectionInput = {
      id: testInspectionId,
      completed: true,
      notes: 'Inspection completed successfully'
    };

    const result = await updateInspection(updateInput);

    // Verify response
    expect(result.id).toEqual(testInspectionId);
    expect(result.completed).toBe(true);
    expect(result.notes).toEqual('Inspection completed successfully');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set notes to null', async () => {
    const updateInput: UpdateInspectionInput = {
      id: testInspectionId,
      notes: null
    };

    const result = await updateInspection(updateInput);

    // Verify response
    expect(result.notes).toBeNull();
    expect(result.completed).toBe(false); // Should remain unchanged
  });

  it('should save updates to database', async () => {
    const updateInput: UpdateInspectionInput = {
      id: testInspectionId,
      completed: true,
      notes: 'Database verification test'
    };

    await updateInspection(updateInput);

    // Query database directly to verify changes
    const inspections = await db.select()
      .from(inspectionsTable)
      .where(eq(inspectionsTable.id, testInspectionId))
      .execute();

    expect(inspections).toHaveLength(1);
    expect(inspections[0].completed).toBe(true);
    expect(inspections[0].notes).toEqual('Database verification test');
    expect(inspections[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalInspections = await db.select()
      .from(inspectionsTable)
      .where(eq(inspectionsTable.id, testInspectionId))
      .execute();
    const originalTimestamp = originalInspections[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateInspectionInput = {
      id: testInspectionId,
      completed: true
    };

    const result = await updateInspection(updateInput);

    // Verify updated_at timestamp changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should throw error when inspection not found', async () => {
    const updateInput: UpdateInspectionInput = {
      id: 99999, // Non-existent ID
      completed: true
    };

    await expect(updateInspection(updateInput)).rejects.toThrow(/Inspection with id 99999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Update only completed status
    const updateInput1: UpdateInspectionInput = {
      id: testInspectionId,
      completed: true
    };

    const result1 = await updateInspection(updateInput1);
    expect(result1.completed).toBe(true);
    expect(result1.notes).toEqual('Initial inspection notes'); // Should remain unchanged

    // Update only notes in a second call
    const updateInput2: UpdateInspectionInput = {
      id: testInspectionId,
      notes: 'Second update to notes only'
    };

    const result2 = await updateInspection(updateInput2);
    expect(result2.completed).toBe(true); // Should remain from first update
    expect(result2.notes).toEqual('Second update to notes only');
  });
});