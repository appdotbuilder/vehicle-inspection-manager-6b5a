import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vehiclesTable, inspectorsTable, inspectionsTable, inspectionItemsTable } from '../db/schema';
import { type GetInspectionDetailsInput } from '../schema';
import { getInspectionDetails } from '../handlers/get_inspection_details';

describe('getInspectionDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return inspection details with vehicle, inspector, and items', async () => {
    // Create test data
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

    const inspectorResult = await db.insert(inspectorsTable)
      .values({
        name: 'John Inspector',
        employee_id: 'EMP001'
      })
      .returning()
      .execute();

    const inspectionResult = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicleResult[0].id,
        inspector_id: inspectorResult[0].id,
        inspection_date: new Date('2024-01-15'),
        completed: true,
        notes: 'Test inspection notes'
      })
      .returning()
      .execute();

    // Create inspection items
    await db.insert(inspectionItemsTable)
      .values([
        {
          inspection_id: inspectionResult[0].id,
          item_name: 'Engine Oil',
          status: 'pass',
          comments: 'Good condition'
        },
        {
          inspection_id: inspectionResult[0].id,
          item_name: 'Brake Pads',
          status: 'fail',
          comments: 'Need replacement'
        },
        {
          inspection_id: inspectionResult[0].id,
          item_name: 'Turn Signals',
          status: 'not_applicable',
          comments: null
        }
      ])
      .execute();

    const input: GetInspectionDetailsInput = {
      inspection_id: inspectionResult[0].id
    };

    const result = await getInspectionDetails(input);

    // Verify inspection details
    expect(result).toBeDefined();
    expect(result!.id).toEqual(inspectionResult[0].id);
    expect(result!.vehicle_id).toEqual(vehicleResult[0].id);
    expect(result!.inspector_id).toEqual(inspectorResult[0].id);
    expect(result!.inspection_date).toBeInstanceOf(Date);
    expect(result!.completed).toBe(true);
    expect(result!.notes).toEqual('Test inspection notes');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify vehicle data
    expect(result!.vehicle.id).toEqual(vehicleResult[0].id);
    expect(result!.vehicle.make).toEqual('Toyota');
    expect(result!.vehicle.model).toEqual('Camry');
    expect(result!.vehicle.year).toEqual(2020);
    expect(result!.vehicle.vin).toEqual('12345678901234567');
    expect(result!.vehicle.license_plate).toEqual('ABC123');
    expect(result!.vehicle.created_at).toBeInstanceOf(Date);
    expect(result!.vehicle.updated_at).toBeInstanceOf(Date);

    // Verify inspector data
    expect(result!.inspector.id).toEqual(inspectorResult[0].id);
    expect(result!.inspector.name).toEqual('John Inspector');
    expect(result!.inspector.employee_id).toEqual('EMP001');
    expect(result!.inspector.created_at).toBeInstanceOf(Date);
    expect(result!.inspector.updated_at).toBeInstanceOf(Date);

    // Verify inspection items
    expect(result!.items).toHaveLength(3);
    
    const engineOilItem = result!.items.find(item => item.item_name === 'Engine Oil');
    expect(engineOilItem).toBeDefined();
    expect(engineOilItem!.status).toEqual('pass');
    expect(engineOilItem!.comments).toEqual('Good condition');
    expect(engineOilItem!.created_at).toBeInstanceOf(Date);

    const brakePadsItem = result!.items.find(item => item.item_name === 'Brake Pads');
    expect(brakePadsItem).toBeDefined();
    expect(brakePadsItem!.status).toEqual('fail');
    expect(brakePadsItem!.comments).toEqual('Need replacement');

    const turnSignalsItem = result!.items.find(item => item.item_name === 'Turn Signals');
    expect(turnSignalsItem).toBeDefined();
    expect(turnSignalsItem!.status).toEqual('not_applicable');
    expect(turnSignalsItem!.comments).toBeNull();
  });

  it('should return null when inspection does not exist', async () => {
    const input: GetInspectionDetailsInput = {
      inspection_id: 999999
    };

    const result = await getInspectionDetails(input);

    expect(result).toBeNull();
  });

  it('should return inspection with empty items array when no items exist', async () => {
    // Create test data without inspection items
    const vehicleResult = await db.insert(vehiclesTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        vin: '98765432109876543',
        license_plate: 'XYZ789'
      })
      .returning()
      .execute();

    const inspectorResult = await db.insert(inspectorsTable)
      .values({
        name: 'Jane Inspector',
        employee_id: 'EMP002'
      })
      .returning()
      .execute();

    const inspectionResult = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicleResult[0].id,
        inspector_id: inspectorResult[0].id,
        inspection_date: new Date('2024-02-01'),
        completed: false,
        notes: null
      })
      .returning()
      .execute();

    const input: GetInspectionDetailsInput = {
      inspection_id: inspectionResult[0].id
    };

    const result = await getInspectionDetails(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(inspectionResult[0].id);
    expect(result!.completed).toBe(false);
    expect(result!.notes).toBeNull();
    expect(result!.vehicle.make).toEqual('Honda');
    expect(result!.inspector.name).toEqual('Jane Inspector');
    expect(result!.items).toEqual([]);
  });

  it('should handle inspection with mixed item statuses', async () => {
    // Create test data
    const vehicleResult = await db.insert(vehiclesTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2022,
        vin: '11111111111111111',
        license_plate: 'TRUCK1'
      })
      .returning()
      .execute();

    const inspectorResult = await db.insert(inspectorsTable)
      .values({
        name: 'Bob Inspector',
        employee_id: 'EMP003'
      })
      .returning()
      .execute();

    const inspectionResult = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicleResult[0].id,
        inspector_id: inspectorResult[0].id,
        inspection_date: new Date('2024-03-10'),
        completed: true,
        notes: 'Comprehensive inspection completed'
      })
      .returning()
      .execute();

    // Create items with all possible statuses
    await db.insert(inspectionItemsTable)
      .values([
        {
          inspection_id: inspectionResult[0].id,
          item_name: 'Headlights',
          status: 'pass',
          comments: 'Working properly'
        },
        {
          inspection_id: inspectionResult[0].id,
          item_name: 'Windshield',
          status: 'fail',
          comments: 'Crack in upper left corner'
        },
        {
          inspection_id: inspectionResult[0].id,
          item_name: 'Trailer Hitch',
          status: 'not_applicable',
          comments: 'Not equipped'
        }
      ])
      .execute();

    const input: GetInspectionDetailsInput = {
      inspection_id: inspectionResult[0].id
    };

    const result = await getInspectionDetails(input);

    expect(result).toBeDefined();
    expect(result!.items).toHaveLength(3);
    
    // Verify all status types are present
    const statuses = result!.items.map(item => item.status);
    expect(statuses).toContain('pass');
    expect(statuses).toContain('fail');
    expect(statuses).toContain('not_applicable');

    // Verify specific items
    const headlightsItem = result!.items.find(item => item.item_name === 'Headlights');
    expect(headlightsItem!.status).toEqual('pass');
    expect(headlightsItem!.comments).toEqual('Working properly');

    const windshieldItem = result!.items.find(item => item.item_name === 'Windshield');
    expect(windshieldItem!.status).toEqual('fail');
    expect(windshieldItem!.comments).toEqual('Crack in upper left corner');

    const trailerHitchItem = result!.items.find(item => item.item_name === 'Trailer Hitch');
    expect(trailerHitchItem!.status).toEqual('not_applicable');
    expect(trailerHitchItem!.comments).toEqual('Not equipped');
  });

  it('should preserve date types correctly', async () => {
    // Create test data with specific dates
    const testInspectionDate = new Date('2024-06-15T10:30:00Z');

    const vehicleResult = await db.insert(vehiclesTable)
      .values({
        make: 'Nissan',
        model: 'Altima',
        year: 2019,
        vin: '22222222222222222',
        license_plate: 'DATE123'
      })
      .returning()
      .execute();

    const inspectorResult = await db.insert(inspectorsTable)
      .values({
        name: 'Date Inspector',
        employee_id: 'EMP004'
      })
      .returning()
      .execute();

    const inspectionResult = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicleResult[0].id,
        inspector_id: inspectorResult[0].id,
        inspection_date: testInspectionDate,
        completed: false,
        notes: 'Date test inspection'
      })
      .returning()
      .execute();

    const input: GetInspectionDetailsInput = {
      inspection_id: inspectionResult[0].id
    };

    const result = await getInspectionDetails(input);

    expect(result).toBeDefined();
    expect(result!.inspection_date).toBeInstanceOf(Date);
    expect(result!.inspection_date.getTime()).toEqual(testInspectionDate.getTime());
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.vehicle.created_at).toBeInstanceOf(Date);
    expect(result!.vehicle.updated_at).toBeInstanceOf(Date);
    expect(result!.inspector.created_at).toBeInstanceOf(Date);
    expect(result!.inspector.updated_at).toBeInstanceOf(Date);
  });
});