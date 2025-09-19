import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vehiclesTable, inspectorsTable, inspectionsTable, inspectionItemsTable } from '../db/schema';
import { type CreateInspectionItemsInput } from '../schema';
import { createInspectionItems } from '../handlers/create_inspection_items';
import { eq } from 'drizzle-orm';

describe('createInspectionItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create multiple inspection items for an inspection', async () => {
    // Create prerequisite data: vehicle, inspector, and inspection
    const [vehicle] = await db.insert(vehiclesTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        vin: '1HGBH41JXMN109186',
        license_plate: 'ABC123'
      })
      .returning()
      .execute();

    const [inspector] = await db.insert(inspectorsTable)
      .values({
        name: 'John Doe',
        employee_id: 'EMP001'
      })
      .returning()
      .execute();

    const [inspection] = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle.id,
        inspector_id: inspector.id,
        inspection_date: new Date(),
        completed: false
      })
      .returning()
      .execute();

    const testInput: CreateInspectionItemsInput = {
      inspection_id: inspection.id,
      items: [
        {
          item_name: 'Engine Oil Level',
          status: 'pass',
          comments: 'Oil level is adequate'
        },
        {
          item_name: 'Brake Pads',
          status: 'fail',
          comments: 'Brake pads need replacement'
        },
        {
          item_name: 'Tire Pressure',
          status: 'pass',
          comments: null
        },
        {
          item_name: 'Air Filter',
          status: 'not_applicable',
          comments: 'Recently replaced'
        }
      ]
    };

    const result = await createInspectionItems(testInput);

    // Verify all items were created
    expect(result).toHaveLength(4);

    // Verify each item has correct data
    expect(result[0].item_name).toEqual('Engine Oil Level');
    expect(result[0].status).toEqual('pass');
    expect(result[0].comments).toEqual('Oil level is adequate');
    expect(result[0].inspection_id).toEqual(inspection.id);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].item_name).toEqual('Brake Pads');
    expect(result[1].status).toEqual('fail');
    expect(result[1].comments).toEqual('Brake pads need replacement');

    expect(result[2].item_name).toEqual('Tire Pressure');
    expect(result[2].status).toEqual('pass');
    expect(result[2].comments).toBeNull();

    expect(result[3].item_name).toEqual('Air Filter');
    expect(result[3].status).toEqual('not_applicable');
    expect(result[3].comments).toEqual('Recently replaced');
  });

  it('should save all inspection items to database', async () => {
    // Create prerequisite data
    const [vehicle] = await db.insert(vehiclesTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2023,
        vin: '2HGFC2F59MH123456',
        license_plate: 'XYZ789'
      })
      .returning()
      .execute();

    const [inspector] = await db.insert(inspectorsTable)
      .values({
        name: 'Jane Smith',
        employee_id: 'EMP002'
      })
      .returning()
      .execute();

    const [inspection] = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle.id,
        inspector_id: inspector.id,
        inspection_date: new Date(),
        completed: false
      })
      .returning()
      .execute();

    const testInput: CreateInspectionItemsInput = {
      inspection_id: inspection.id,
      items: [
        {
          item_name: 'Headlights',
          status: 'pass',
          comments: 'All lights working'
        },
        {
          item_name: 'Battery',
          status: 'fail',
          comments: 'Battery voltage low'
        }
      ]
    };

    const result = await createInspectionItems(testInput);

    // Query database to verify items were saved
    const savedItems = await db.select()
      .from(inspectionItemsTable)
      .where(eq(inspectionItemsTable.inspection_id, inspection.id))
      .execute();

    expect(savedItems).toHaveLength(2);
    
    // Find items by name to verify data
    const headlightItem = savedItems.find(item => item.item_name === 'Headlights');
    const batteryItem = savedItems.find(item => item.item_name === 'Battery');

    expect(headlightItem).toBeDefined();
    expect(headlightItem!.status).toEqual('pass');
    expect(headlightItem!.comments).toEqual('All lights working');
    expect(headlightItem!.created_at).toBeInstanceOf(Date);

    expect(batteryItem).toBeDefined();
    expect(batteryItem!.status).toEqual('fail');
    expect(batteryItem!.comments).toEqual('Battery voltage low');

    // Verify returned items match database items
    expect(result).toHaveLength(savedItems.length);
    result.forEach(returnedItem => {
      const savedItem = savedItems.find(s => s.id === returnedItem.id);
      expect(savedItem).toBeDefined();
      expect(savedItem!.item_name).toEqual(returnedItem.item_name);
      expect(savedItem!.status).toEqual(returnedItem.status);
      expect(savedItem!.comments).toEqual(returnedItem.comments);
    });
  });

  it('should handle items with null comments correctly', async () => {
    // Create prerequisite data
    const [vehicle] = await db.insert(vehiclesTable)
      .values({
        make: 'Ford',
        model: 'Focus',
        year: 2021,
        vin: '1FADP3F24FL123456',
        license_plate: 'DEF456'
      })
      .returning()
      .execute();

    const [inspector] = await db.insert(inspectorsTable)
      .values({
        name: 'Mike Johnson',
        employee_id: 'EMP003'
      })
      .returning()
      .execute();

    const [inspection] = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle.id,
        inspector_id: inspector.id,
        inspection_date: new Date(),
        completed: false
      })
      .returning()
      .execute();

    const testInput: CreateInspectionItemsInput = {
      inspection_id: inspection.id,
      items: [
        {
          item_name: 'Windshield Wipers',
          status: 'pass'
          // comments is optional and not provided
        },
        {
          item_name: 'Horn',
          status: 'pass',
          comments: null // explicitly null
        }
      ]
    };

    const result = await createInspectionItems(testInput);

    expect(result).toHaveLength(2);
    expect(result[0].comments).toBeNull();
    expect(result[1].comments).toBeNull();

    // Verify in database
    const savedItems = await db.select()
      .from(inspectionItemsTable)
      .where(eq(inspectionItemsTable.inspection_id, inspection.id))
      .execute();

    expect(savedItems[0].comments).toBeNull();
    expect(savedItems[1].comments).toBeNull();
  });

  it('should create single inspection item correctly', async () => {
    // Create prerequisite data
    const [vehicle] = await db.insert(vehiclesTable)
      .values({
        make: 'BMW',
        model: 'X5',
        year: 2022,
        vin: '5UXCR6C56M0123456',
        license_plate: 'GHI789'
      })
      .returning()
      .execute();

    const [inspector] = await db.insert(inspectorsTable)
      .values({
        name: 'Sarah Wilson',
        employee_id: 'EMP004'
      })
      .returning()
      .execute();

    const [inspection] = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle.id,
        inspector_id: inspector.id,
        inspection_date: new Date(),
        completed: false
      })
      .returning()
      .execute();

    const testInput: CreateInspectionItemsInput = {
      inspection_id: inspection.id,
      items: [
        {
          item_name: 'Exhaust System',
          status: 'not_applicable',
          comments: 'Vehicle is electric'
        }
      ]
    };

    const result = await createInspectionItems(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].item_name).toEqual('Exhaust System');
    expect(result[0].status).toEqual('not_applicable');
    expect(result[0].comments).toEqual('Vehicle is electric');
    expect(result[0].inspection_id).toEqual(inspection.id);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when inspection does not exist', async () => {
    const testInput: CreateInspectionItemsInput = {
      inspection_id: 99999, // Non-existent inspection ID
      items: [
        {
          item_name: 'Test Item',
          status: 'pass',
          comments: 'Test comment'
        }
      ]
    };

    await expect(createInspectionItems(testInput))
      .rejects.toThrow(/inspection with id 99999 not found/i);
  });

  it('should handle empty items array', async () => {
    // Create prerequisite data
    const [vehicle] = await db.insert(vehiclesTable)
      .values({
        make: 'Tesla',
        model: 'Model 3',
        year: 2023,
        vin: '5YJ3E1EA4NF123456',
        license_plate: 'JKL012'
      })
      .returning()
      .execute();

    const [inspector] = await db.insert(inspectorsTable)
      .values({
        name: 'David Lee',
        employee_id: 'EMP005'
      })
      .returning()
      .execute();

    const [inspection] = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle.id,
        inspector_id: inspector.id,
        inspection_date: new Date(),
        completed: false
      })
      .returning()
      .execute();

    const testInput: CreateInspectionItemsInput = {
      inspection_id: inspection.id,
      items: [] // Empty array
    };

    const result = await createInspectionItems(testInput);

    expect(result).toHaveLength(0);

    // Verify no items were created in database
    const savedItems = await db.select()
      .from(inspectionItemsTable)
      .where(eq(inspectionItemsTable.inspection_id, inspection.id))
      .execute();

    expect(savedItems).toHaveLength(0);
  });

  it('should handle all status types correctly', async () => {
    // Create prerequisite data
    const [vehicle] = await db.insert(vehiclesTable)
      .values({
        make: 'Audi',
        model: 'A4',
        year: 2022,
        vin: 'WAUENAF42MN123456',
        license_plate: 'MNO345'
      })
      .returning()
      .execute();

    const [inspector] = await db.insert(inspectorsTable)
      .values({
        name: 'Lisa Brown',
        employee_id: 'EMP006'
      })
      .returning()
      .execute();

    const [inspection] = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle.id,
        inspector_id: inspector.id,
        inspection_date: new Date(),
        completed: false
      })
      .returning()
      .execute();

    const testInput: CreateInspectionItemsInput = {
      inspection_id: inspection.id,
      items: [
        {
          item_name: 'Pass Item',
          status: 'pass',
          comments: 'This item passed'
        },
        {
          item_name: 'Fail Item',
          status: 'fail',
          comments: 'This item failed'
        },
        {
          item_name: 'Not Applicable Item',
          status: 'not_applicable',
          comments: 'This item is not applicable'
        }
      ]
    };

    const result = await createInspectionItems(testInput);

    expect(result).toHaveLength(3);
    
    const passItem = result.find(item => item.status === 'pass');
    const failItem = result.find(item => item.status === 'fail');
    const naItem = result.find(item => item.status === 'not_applicable');

    expect(passItem).toBeDefined();
    expect(passItem!.item_name).toEqual('Pass Item');
    
    expect(failItem).toBeDefined();
    expect(failItem!.item_name).toEqual('Fail Item');
    
    expect(naItem).toBeDefined();
    expect(naItem!.item_name).toEqual('Not Applicable Item');

    // Verify all items were saved to database with correct status
    const savedItems = await db.select()
      .from(inspectionItemsTable)
      .where(eq(inspectionItemsTable.inspection_id, inspection.id))
      .execute();

    expect(savedItems).toHaveLength(3);
    expect(savedItems.map(item => item.status).sort()).toEqual(['fail', 'not_applicable', 'pass']);
  });
});