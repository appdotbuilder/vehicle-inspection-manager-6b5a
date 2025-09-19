import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vehiclesTable, inspectorsTable, inspectionsTable, inspectionItemsTable } from '../db/schema';
import { getInspectionReport } from '../handlers/get_inspection_report';

describe('getInspectionReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty report when no inspections exist', async () => {
    const result = await getInspectionReport();

    expect(result.total_inspections).toBe(0);
    expect(result.completed_inspections).toBe(0);
    expect(result.pending_inspections).toBe(0);
    expect(result.recent_inspections).toHaveLength(0);
  });

  it('should return correct statistics for inspections', async () => {
    // Create test data
    const vehicle = await db.insert(vehiclesTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1HGCM82633A123456',
        license_plate: 'ABC123'
      })
      .returning()
      .execute();

    const inspector = await db.insert(inspectorsTable)
      .values({
        name: 'John Inspector',
        employee_id: 'EMP001'
      })
      .returning()
      .execute();

    // Create completed inspection
    await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle[0].id,
        inspector_id: inspector[0].id,
        inspection_date: new Date(),
        completed: true
      })
      .execute();

    // Create pending inspection
    await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle[0].id,
        inspector_id: inspector[0].id,
        inspection_date: new Date(),
        completed: false
      })
      .execute();

    const result = await getInspectionReport();

    expect(result.total_inspections).toBe(2);
    expect(result.completed_inspections).toBe(1);
    expect(result.pending_inspections).toBe(1);
    expect(result.recent_inspections).toHaveLength(2);
  });

  it('should include full details in recent inspections', async () => {
    // Create test data
    const vehicle = await db.insert(vehiclesTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        vin: '2HGCM82633A123457',
        license_plate: 'XYZ789'
      })
      .returning()
      .execute();

    const inspector = await db.insert(inspectorsTable)
      .values({
        name: 'Jane Inspector',
        employee_id: 'EMP002'
      })
      .returning()
      .execute();

    const inspection = await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle[0].id,
        inspector_id: inspector[0].id,
        inspection_date: new Date('2023-01-15'),
        completed: true,
        notes: 'Test inspection notes'
      })
      .returning()
      .execute();

    // Add inspection items
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
          comments: 'Left headlight out'
        }
      ])
      .execute();

    const result = await getInspectionReport();

    expect(result.recent_inspections).toHaveLength(1);
    
    const recentInspection = result.recent_inspections[0];
    
    // Verify inspection details
    expect(recentInspection.id).toBe(inspection[0].id);
    expect(recentInspection.completed).toBe(true);
    expect(recentInspection.notes).toBe('Test inspection notes');
    expect(recentInspection.inspection_date).toBeInstanceOf(Date);

    // Verify vehicle details
    expect(recentInspection.vehicle.make).toBe('Honda');
    expect(recentInspection.vehicle.model).toBe('Civic');
    expect(recentInspection.vehicle.year).toBe(2021);
    expect(recentInspection.vehicle.vin).toBe('2HGCM82633A123457');
    expect(recentInspection.vehicle.license_plate).toBe('XYZ789');

    // Verify inspector details
    expect(recentInspection.inspector.name).toBe('Jane Inspector');
    expect(recentInspection.inspector.employee_id).toBe('EMP002');

    // Verify inspection items
    expect(recentInspection.items).toHaveLength(2);
    expect(recentInspection.items[0].item_name).toBe('Brakes');
    expect(recentInspection.items[0].status).toBe('pass');
    expect(recentInspection.items[0].comments).toBe('Good condition');
    expect(recentInspection.items[1].item_name).toBe('Lights');
    expect(recentInspection.items[1].status).toBe('fail');
    expect(recentInspection.items[1].comments).toBe('Left headlight out');
  });

  it('should limit recent inspections to 10 and order by creation date', async () => {
    // Create test data
    const vehicle = await db.insert(vehiclesTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2022,
        vin: '3HGCM82633A123458',
        license_plate: 'TEST123'
      })
      .returning()
      .execute();

    const inspector = await db.insert(inspectorsTable)
      .values({
        name: 'Test Inspector',
        employee_id: 'EMP003'
      })
      .returning()
      .execute();

    // Create 15 inspections to test the limit
    const inspectionPromises = [];
    for (let i = 0; i < 15; i++) {
      const inspectionDate = new Date();
      inspectionDate.setDate(inspectionDate.getDate() - i); // Different dates for ordering

      inspectionPromises.push(
        db.insert(inspectionsTable)
          .values({
            vehicle_id: vehicle[0].id,
            inspector_id: inspector[0].id,
            inspection_date: inspectionDate,
            completed: i % 2 === 0, // Alternate between completed and pending
            notes: `Inspection ${i}`
          })
          .execute()
      );
    }

    await Promise.all(inspectionPromises);

    const result = await getInspectionReport();

    // Should only return 10 most recent inspections
    expect(result.recent_inspections).toHaveLength(10);
    expect(result.total_inspections).toBe(15);
    expect(result.completed_inspections).toBe(8); // 8 completed (0,2,4,6,8,10,12,14)
    expect(result.pending_inspections).toBe(7); // 7 pending (1,3,5,7,9,11,13)

    // Verify ordering - most recent first
    const dates = result.recent_inspections.map(inspection => inspection.created_at);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i-1] >= dates[i]).toBe(true);
    }
  });

  it('should handle inspections without items', async () => {
    // Create test data
    const vehicle = await db.insert(vehiclesTable)
      .values({
        make: 'Chevrolet',
        model: 'Malibu',
        year: 2019,
        vin: '4HGCM82633A123459',
        license_plate: 'NOITEM1'
      })
      .returning()
      .execute();

    const inspector = await db.insert(inspectorsTable)
      .values({
        name: 'No Items Inspector',
        employee_id: 'EMP004'
      })
      .returning()
      .execute();

    await db.insert(inspectionsTable)
      .values({
        vehicle_id: vehicle[0].id,
        inspector_id: inspector[0].id,
        inspection_date: new Date(),
        completed: false,
        notes: null
      })
      .execute();

    const result = await getInspectionReport();

    expect(result.total_inspections).toBe(1);
    expect(result.recent_inspections).toHaveLength(1);
    expect(result.recent_inspections[0].items).toHaveLength(0);
    expect(result.recent_inspections[0].notes).toBe(null);
  });

  it('should handle mixed completed and pending inspections correctly', async () => {
    // Create test data
    const vehicle = await db.insert(vehiclesTable)
      .values({
        make: 'Nissan',
        model: 'Altima',
        year: 2020,
        vin: '5HGCM82633A123460',
        license_plate: 'MIX123'
      })
      .returning()
      .execute();

    const inspector = await db.insert(inspectorsTable)
      .values({
        name: 'Mixed Inspector',
        employee_id: 'EMP005'
      })
      .returning()
      .execute();

    // Create 3 completed and 2 pending inspections
    await db.insert(inspectionsTable)
      .values([
        {
          vehicle_id: vehicle[0].id,
          inspector_id: inspector[0].id,
          inspection_date: new Date(),
          completed: true
        },
        {
          vehicle_id: vehicle[0].id,
          inspector_id: inspector[0].id,
          inspection_date: new Date(),
          completed: true
        },
        {
          vehicle_id: vehicle[0].id,
          inspector_id: inspector[0].id,
          inspection_date: new Date(),
          completed: true
        },
        {
          vehicle_id: vehicle[0].id,
          inspector_id: inspector[0].id,
          inspection_date: new Date(),
          completed: false
        },
        {
          vehicle_id: vehicle[0].id,
          inspector_id: inspector[0].id,
          inspection_date: new Date(),
          completed: false
        }
      ])
      .execute();

    const result = await getInspectionReport();

    expect(result.total_inspections).toBe(5);
    expect(result.completed_inspections).toBe(3);
    expect(result.pending_inspections).toBe(2);
    expect(result.recent_inspections).toHaveLength(5);

    // Verify each recent inspection has proper structure
    result.recent_inspections.forEach(inspection => {
      expect(inspection.id).toBeDefined();
      expect(inspection.vehicle).toBeDefined();
      expect(inspection.inspector).toBeDefined();
      expect(inspection.items).toBeDefined();
      expect(typeof inspection.completed).toBe('boolean');
      expect(inspection.created_at).toBeInstanceOf(Date);
      expect(inspection.updated_at).toBeInstanceOf(Date);
      expect(inspection.inspection_date).toBeInstanceOf(Date);
    });
  });
});