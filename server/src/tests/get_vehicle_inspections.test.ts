import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vehiclesTable, inspectorsTable, inspectionsTable, inspectionItemsTable } from '../db/schema';
import { type GetVehicleInspectionsInput } from '../schema';
import { getVehicleInspections } from '../handlers/get_vehicle_inspections';

describe('getVehicleInspections', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when vehicle has no inspections', async () => {
    // Create a vehicle without any inspections
    const vehicle = await db.insert(vehiclesTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '12345678901234567',
        license_plate: 'ABC123'
      })
      .returning()
      .execute();

    const input: GetVehicleInspectionsInput = {
      vehicle_id: vehicle[0].id
    };

    const result = await getVehicleInspections(input);

    expect(result).toEqual([]);
  });

  it('should return inspections with complete details', async () => {
    // Create prerequisite data
    const vehicle = await db.insert(vehiclesTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        vin: '12345678901234568',
        license_plate: 'XYZ789'
      })
      .returning()
      .execute();

    const inspector = await db.insert(inspectorsTable)
      .values({
        name: 'John Smith',
        employee_id: 'EMP001'
      })
      .returning()
      .execute();

    // Create inspection
    const inspection = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle[0].id,
        inspector_id: inspector[0].id,
        inspection_date: new Date('2024-01-15'),
        completed: true,
        notes: 'All systems checked'
      })
      .returning()
      .execute();

    // Create inspection items
    await db.insert(inspectionItemsTable)
      .values([
        {
          inspection_id: inspection[0].id,
          item_name: 'Brakes',
          status: 'pass',
          comments: 'Good condition'
        },
        {
          inspection_id: inspection[0].id,
          item_name: 'Lights',
          status: 'fail',
          comments: 'Headlight needs replacement'
        }
      ])
      .execute();

    const input: GetVehicleInspectionsInput = {
      vehicle_id: vehicle[0].id
    };

    const result = await getVehicleInspections(input);

    expect(result).toHaveLength(1);
    
    const inspectionData = result[0];
    
    // Verify inspection data
    expect(inspectionData.id).toBe(inspection[0].id);
    expect(inspectionData.vehicle_id).toBe(vehicle[0].id);
    expect(inspectionData.inspector_id).toBe(inspector[0].id);
    expect(inspectionData.inspection_date).toEqual(new Date('2024-01-15'));
    expect(inspectionData.completed).toBe(true);
    expect(inspectionData.notes).toBe('All systems checked');

    // Verify vehicle data
    expect(inspectionData.vehicle.id).toBe(vehicle[0].id);
    expect(inspectionData.vehicle.make).toBe('Honda');
    expect(inspectionData.vehicle.model).toBe('Civic');
    expect(inspectionData.vehicle.year).toBe(2021);
    expect(inspectionData.vehicle.vin).toBe('12345678901234568');
    expect(inspectionData.vehicle.license_plate).toBe('XYZ789');

    // Verify inspector data
    expect(inspectionData.inspector.id).toBe(inspector[0].id);
    expect(inspectionData.inspector.name).toBe('John Smith');
    expect(inspectionData.inspector.employee_id).toBe('EMP001');

    // Verify inspection items
    expect(inspectionData.items).toHaveLength(2);
    
    const passItem = inspectionData.items.find(item => item.item_name === 'Brakes');
    expect(passItem).toBeDefined();
    expect(passItem!.status).toBe('pass');
    expect(passItem!.comments).toBe('Good condition');

    const failItem = inspectionData.items.find(item => item.item_name === 'Lights');
    expect(failItem).toBeDefined();
    expect(failItem!.status).toBe('fail');
    expect(failItem!.comments).toBe('Headlight needs replacement');
  });

  it('should return multiple inspections ordered by inspection_date desc', async () => {
    // Create prerequisite data
    const vehicle = await db.insert(vehiclesTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2019,
        vin: '12345678901234569',
        license_plate: 'DEF456'
      })
      .returning()
      .execute();

    const inspector = await db.insert(inspectorsTable)
      .values({
        name: 'Jane Doe',
        employee_id: 'EMP002'
      })
      .returning()
      .execute();

    // Create multiple inspections with different dates
    const inspection1 = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle[0].id,
        inspector_id: inspector[0].id,
        inspection_date: new Date('2024-01-10'),
        completed: true,
        notes: 'First inspection'
      })
      .returning()
      .execute();

    const inspection2 = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle[0].id,
        inspector_id: inspector[0].id,
        inspection_date: new Date('2024-01-20'),
        completed: false,
        notes: 'Second inspection'
      })
      .returning()
      .execute();

    const inspection3 = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle[0].id,
        inspector_id: inspector[0].id,
        inspection_date: new Date('2024-01-15'),
        completed: true,
        notes: 'Third inspection'
      })
      .returning()
      .execute();

    // Add items to each inspection
    await db.insert(inspectionItemsTable)
      .values([
        {
          inspection_id: inspection1[0].id,
          item_name: 'Engine',
          status: 'pass',
          comments: null
        },
        {
          inspection_id: inspection2[0].id,
          item_name: 'Transmission',
          status: 'not_applicable',
          comments: null
        },
        {
          inspection_id: inspection3[0].id,
          item_name: 'Tires',
          status: 'fail',
          comments: 'Worn treads'
        }
      ])
      .execute();

    const input: GetVehicleInspectionsInput = {
      vehicle_id: vehicle[0].id
    };

    const result = await getVehicleInspections(input);

    expect(result).toHaveLength(3);

    // Verify ordering (most recent first)
    expect(result[0].inspection_date).toEqual(new Date('2024-01-20'));
    expect(result[0].notes).toBe('Second inspection');
    expect(result[0].completed).toBe(false);

    expect(result[1].inspection_date).toEqual(new Date('2024-01-15'));
    expect(result[1].notes).toBe('Third inspection');
    expect(result[1].completed).toBe(true);

    expect(result[2].inspection_date).toEqual(new Date('2024-01-10'));
    expect(result[2].notes).toBe('First inspection');
    expect(result[2].completed).toBe(true);

    // Verify each inspection has its items
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].item_name).toBe('Transmission');
    expect(result[0].items[0].status).toBe('not_applicable');

    expect(result[1].items).toHaveLength(1);
    expect(result[1].items[0].item_name).toBe('Tires');
    expect(result[1].items[0].status).toBe('fail');

    expect(result[2].items).toHaveLength(1);
    expect(result[2].items[0].item_name).toBe('Engine');
    expect(result[2].items[0].status).toBe('pass');
  });

  it('should only return inspections for the specified vehicle', async () => {
    // Create two vehicles
    const vehicle1 = await db.insert(vehiclesTable)
      .values({
        make: 'BMW',
        model: 'X3',
        year: 2022,
        vin: '12345678901234570',
        license_plate: 'GHI789'
      })
      .returning()
      .execute();

    const vehicle2 = await db.insert(vehiclesTable)
      .values({
        make: 'Audi',
        model: 'A4',
        year: 2023,
        vin: '12345678901234571',
        license_plate: 'JKL012'
      })
      .returning()
      .execute();

    const inspector = await db.insert(inspectorsTable)
      .values({
        name: 'Bob Wilson',
        employee_id: 'EMP003'
      })
      .returning()
      .execute();

    // Create inspections for both vehicles
    await db.insert(inspectionsTable)
      .values([
        {
          vehicle_id: vehicle1[0].id,
          inspector_id: inspector[0].id,
          inspection_date: new Date('2024-01-10'),
          completed: true,
          notes: 'BMW inspection'
        },
        {
          vehicle_id: vehicle2[0].id,
          inspector_id: inspector[0].id,
          inspection_date: new Date('2024-01-11'),
          completed: true,
          notes: 'Audi inspection'
        }
      ])
      .execute();

    // Query inspections for vehicle1 only
    const input: GetVehicleInspectionsInput = {
      vehicle_id: vehicle1[0].id
    };

    const result = await getVehicleInspections(input);

    expect(result).toHaveLength(1);
    expect(result[0].vehicle_id).toBe(vehicle1[0].id);
    expect(result[0].vehicle.make).toBe('BMW');
    expect(result[0].vehicle.model).toBe('X3');
    expect(result[0].notes).toBe('BMW inspection');
  });

  it('should handle inspections with no items', async () => {
    // Create prerequisite data
    const vehicle = await db.insert(vehiclesTable)
      .values({
        make: 'Nissan',
        model: 'Altima',
        year: 2020,
        vin: '12345678901234572',
        license_plate: 'MNO345'
      })
      .returning()
      .execute();

    const inspector = await db.insert(inspectorsTable)
      .values({
        name: 'Alice Brown',
        employee_id: 'EMP004'
      })
      .returning()
      .execute();

    // Create inspection without any items
    const inspection = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle[0].id,
        inspector_id: inspector[0].id,
        inspection_date: new Date('2024-01-12'),
        completed: false,
        notes: null
      })
      .returning()
      .execute();

    const input: GetVehicleInspectionsInput = {
      vehicle_id: vehicle[0].id
    };

    const result = await getVehicleInspections(input);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(inspection[0].id);
    expect(result[0].items).toEqual([]);
    expect(result[0].notes).toBeNull();
    expect(result[0].completed).toBe(false);
  });
});