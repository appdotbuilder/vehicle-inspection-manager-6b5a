import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vehiclesTable, inspectorsTable, inspectionsTable, inspectionItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateInspectionItemInput } from '../schema';
import { updateInspectionItem } from '../handlers/update_inspection_item';

describe('updateInspectionItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let vehicleId: number;
  let inspectorId: number;
  let inspectionId: number;
  let inspectionItemId: number;

  beforeEach(async () => {
    // Create prerequisite data: vehicle, inspector, inspection, and inspection item
    const vehicle = await db.insert(vehiclesTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        vin: '1HGBH41JXMN109186',
        license_plate: 'ABC123'
      })
      .returning()
      .execute();
    vehicleId = vehicle[0].id;

    const inspector = await db.insert(inspectorsTable)
      .values({
        name: 'John Doe',
        employee_id: 'EMP001'
      })
      .returning()
      .execute();
    inspectorId = inspector[0].id;

    const inspection = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicleId,
        inspector_id: inspectorId,
        inspection_date: new Date()
      })
      .returning()
      .execute();
    inspectionId = inspection[0].id;

    const inspectionItem = await db.insert(inspectionItemsTable)
      .values({
        inspection_id: inspectionId,
        item_name: 'Brake Pads',
        status: 'pass',
        comments: 'Initial comment'
      })
      .returning()
      .execute();
    inspectionItemId = inspectionItem[0].id;
  });

  it('should update inspection item status', async () => {
    const input: UpdateInspectionItemInput = {
      id: inspectionItemId,
      status: 'fail'
    };

    const result = await updateInspectionItem(input);

    expect(result.id).toEqual(inspectionItemId);
    expect(result.status).toEqual('fail');
    expect(result.item_name).toEqual('Brake Pads');
    expect(result.comments).toEqual('Initial comment');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update inspection item comments', async () => {
    const input: UpdateInspectionItemInput = {
      id: inspectionItemId,
      comments: 'Updated comment'
    };

    const result = await updateInspectionItem(input);

    expect(result.id).toEqual(inspectionItemId);
    expect(result.status).toEqual('pass'); // Should remain unchanged
    expect(result.comments).toEqual('Updated comment');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both status and comments', async () => {
    const input: UpdateInspectionItemInput = {
      id: inspectionItemId,
      status: 'not_applicable',
      comments: 'Item not applicable for this vehicle'
    };

    const result = await updateInspectionItem(input);

    expect(result.id).toEqual(inspectionItemId);
    expect(result.status).toEqual('not_applicable');
    expect(result.comments).toEqual('Item not applicable for this vehicle');
    expect(result.item_name).toEqual('Brake Pads'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set comments to null when explicitly provided', async () => {
    const input: UpdateInspectionItemInput = {
      id: inspectionItemId,
      comments: null
    };

    const result = await updateInspectionItem(input);

    expect(result.id).toEqual(inspectionItemId);
    expect(result.comments).toBeNull();
    expect(result.status).toEqual('pass'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalItem = await db.select()
      .from(inspectionItemsTable)
      .where(eq(inspectionItemsTable.id, inspectionItemId))
      .execute();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateInspectionItemInput = {
      id: inspectionItemId,
      status: 'fail'
    };

    const result = await updateInspectionItem(input);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalItem[0].updated_at.getTime());
  });

  it('should save updated data to database', async () => {
    const input: UpdateInspectionItemInput = {
      id: inspectionItemId,
      status: 'fail',
      comments: 'Failed inspection'
    };

    await updateInspectionItem(input);

    // Verify data was saved to database
    const savedItems = await db.select()
      .from(inspectionItemsTable)
      .where(eq(inspectionItemsTable.id, inspectionItemId))
      .execute();

    expect(savedItems).toHaveLength(1);
    expect(savedItems[0].status).toEqual('fail');
    expect(savedItems[0].comments).toEqual('Failed inspection');
    expect(savedItems[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when inspection item not found', async () => {
    const input: UpdateInspectionItemInput = {
      id: 99999, // Non-existent ID
      status: 'pass'
    };

    await expect(updateInspectionItem(input)).rejects.toThrow(/not found/i);
  });

  it('should only update provided fields', async () => {
    const input: UpdateInspectionItemInput = {
      id: inspectionItemId,
      status: 'fail'
      // comments not provided - should remain unchanged
    };

    const result = await updateInspectionItem(input);

    expect(result.status).toEqual('fail');
    expect(result.comments).toEqual('Initial comment'); // Should remain unchanged
    expect(result.item_name).toEqual('Brake Pads'); // Should remain unchanged
  });
});