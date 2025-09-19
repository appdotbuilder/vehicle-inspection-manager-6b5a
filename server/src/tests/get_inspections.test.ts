import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vehiclesTable, inspectorsTable, inspectionsTable } from '../db/schema';
import { getInspections } from '../handlers/get_inspections';

describe('getInspections', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no inspections exist', async () => {
    const result = await getInspections();
    
    expect(result).toEqual([]);
  });

  it('should return all inspections ordered by inspection_date desc', async () => {
    // Create prerequisite data - vehicles and inspectors
    const vehicleResult = await db.insert(vehiclesTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        vin: '1HGBH41JXMN109186',
        license_plate: 'ABC123'
      })
      .returning()
      .execute();

    const inspectorResult = await db.insert(inspectorsTable)
      .values({
        name: 'John Smith',
        employee_id: 'EMP001'
      })
      .returning()
      .execute();

    const vehicle = vehicleResult[0];
    const inspector = inspectorResult[0];

    // Create multiple inspections with different dates
    const inspection1Date = new Date('2024-01-15');
    const inspection2Date = new Date('2024-01-20');
    const inspection3Date = new Date('2024-01-10');

    await db.insert(inspectionsTable)
      .values([
        {
          vehicle_id: vehicle.id,
          inspector_id: inspector.id,
          inspection_date: inspection1Date,
          completed: true,
          notes: 'First inspection'
        },
        {
          vehicle_id: vehicle.id,
          inspector_id: inspector.id,
          inspection_date: inspection2Date,
          completed: false,
          notes: 'Second inspection'
        },
        {
          vehicle_id: vehicle.id,
          inspector_id: inspector.id,
          inspection_date: inspection3Date,
          completed: true,
          notes: null
        }
      ])
      .execute();

    const result = await getInspections();

    // Should return 3 inspections
    expect(result).toHaveLength(3);

    // Should be ordered by inspection_date descending
    expect(result[0].inspection_date).toEqual(inspection2Date); // 2024-01-20
    expect(result[1].inspection_date).toEqual(inspection1Date); // 2024-01-15
    expect(result[2].inspection_date).toEqual(inspection3Date); // 2024-01-10

    // Verify all fields are present and correct
    expect(result[0].vehicle_id).toEqual(vehicle.id);
    expect(result[0].inspector_id).toEqual(inspector.id);
    expect(result[0].completed).toEqual(false);
    expect(result[0].notes).toEqual('Second inspection');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Check null notes handling
    expect(result[2].notes).toBeNull();
  });

  it('should handle single inspection correctly', async () => {
    // Create prerequisite data
    const vehicleResult = await db.insert(vehiclesTable)
      .values({
        make: 'Honda',
        model: 'Accord',
        year: 2022,
        vin: '2HGBH41JXMN109187',
        license_plate: 'XYZ789'
      })
      .returning()
      .execute();

    const inspectorResult = await db.insert(inspectorsTable)
      .values({
        name: 'Jane Doe',
        employee_id: 'EMP002'
      })
      .returning()
      .execute();

    const vehicle = vehicleResult[0];
    const inspector = inspectorResult[0];

    const inspectionDate = new Date('2024-02-01');
    
    await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle.id,
        inspector_id: inspector.id,
        inspection_date: inspectionDate,
        completed: true,
        notes: 'Single inspection test'
      })
      .execute();

    const result = await getInspections();

    expect(result).toHaveLength(1);
    expect(result[0].vehicle_id).toEqual(vehicle.id);
    expect(result[0].inspector_id).toEqual(inspector.id);
    expect(result[0].inspection_date).toEqual(inspectionDate);
    expect(result[0].completed).toEqual(true);
    expect(result[0].notes).toEqual('Single inspection test');
  });

  it('should handle multiple vehicles and inspectors', async () => {
    // Create multiple vehicles and inspectors
    const vehicle1Result = await db.insert(vehiclesTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        vin: '3HGBH41JXMN109188',
        license_plate: 'DEF456'
      })
      .returning()
      .execute();

    const vehicle2Result = await db.insert(vehiclesTable)
      .values({
        make: 'Chevrolet',
        model: 'Malibu',
        year: 2020,
        vin: '4HGBH41JXMN109189',
        license_plate: 'GHI789'
      })
      .returning()
      .execute();

    const inspector1Result = await db.insert(inspectorsTable)
      .values({
        name: 'Mike Johnson',
        employee_id: 'EMP003'
      })
      .returning()
      .execute();

    const inspector2Result = await db.insert(inspectorsTable)
      .values({
        name: 'Sarah Wilson',
        employee_id: 'EMP004'
      })
      .returning()
      .execute();

    const vehicle1 = vehicle1Result[0];
    const vehicle2 = vehicle2Result[0];
    const inspector1 = inspector1Result[0];
    const inspector2 = inspector2Result[0];

    // Create inspections with different combinations
    await db.insert(inspectionsTable)
      .values([
        {
          vehicle_id: vehicle1.id,
          inspector_id: inspector1.id,
          inspection_date: new Date('2024-03-01'),
          completed: false,
          notes: 'Vehicle 1, Inspector 1'
        },
        {
          vehicle_id: vehicle2.id,
          inspector_id: inspector2.id,
          inspection_date: new Date('2024-03-05'),
          completed: true,
          notes: 'Vehicle 2, Inspector 2'
        },
        {
          vehicle_id: vehicle1.id,
          inspector_id: inspector2.id,
          inspection_date: new Date('2024-03-03'),
          completed: true,
          notes: 'Vehicle 1, Inspector 2'
        }
      ])
      .execute();

    const result = await getInspections();

    expect(result).toHaveLength(3);
    
    // Verify ordering by date desc
    expect(result[0].inspection_date).toEqual(new Date('2024-03-05'));
    expect(result[1].inspection_date).toEqual(new Date('2024-03-03'));
    expect(result[2].inspection_date).toEqual(new Date('2024-03-01'));

    // Verify correct associations
    expect(result[0].vehicle_id).toEqual(vehicle2.id);
    expect(result[0].inspector_id).toEqual(inspector2.id);
    expect(result[1].vehicle_id).toEqual(vehicle1.id);
    expect(result[1].inspector_id).toEqual(inspector2.id);
    expect(result[2].vehicle_id).toEqual(vehicle1.id);
    expect(result[2].inspector_id).toEqual(inspector1.id);
  });
});