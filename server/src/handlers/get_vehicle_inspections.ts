import { db } from '../db';
import { vehiclesTable, inspectorsTable, inspectionsTable, inspectionItemsTable } from '../db/schema';
import { type GetVehicleInspectionsInput, type InspectionWithDetails } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getVehicleInspections = async (input: GetVehicleInspectionsInput): Promise<InspectionWithDetails[]> => {
  try {
    // Query inspections with all related data using joins
    const results = await db.select()
      .from(inspectionsTable)
      .innerJoin(vehiclesTable, eq(inspectionsTable.vehicle_id, vehiclesTable.id))
      .innerJoin(inspectorsTable, eq(inspectionsTable.inspector_id, inspectorsTable.id))
      .where(eq(inspectionsTable.vehicle_id, input.vehicle_id))
      .orderBy(desc(inspectionsTable.inspection_date))
      .execute();

    // Get inspection items for all inspections
    const inspectionIds = results.map(result => result.inspections.id);
    
    let inspectionItems: any[] = [];
    if (inspectionIds.length > 0) {
      inspectionItems = await db.select()
        .from(inspectionItemsTable)
        .where(eq(inspectionItemsTable.inspection_id, inspectionIds[0]))
        .execute();

      // If there are multiple inspections, get items for all of them
      if (inspectionIds.length > 1) {
        for (let i = 1; i < inspectionIds.length; i++) {
          const items = await db.select()
            .from(inspectionItemsTable)
            .where(eq(inspectionItemsTable.inspection_id, inspectionIds[i]))
            .execute();
          inspectionItems.push(...items);
        }
      }
    }

    // Group inspection items by inspection_id for easier lookup
    const itemsByInspection = inspectionItems.reduce((acc, item) => {
      if (!acc[item.inspection_id]) {
        acc[item.inspection_id] = [];
      }
      acc[item.inspection_id].push(item);
      return acc;
    }, {} as Record<number, any[]>);

    // Transform the joined results into the expected format
    return results.map(result => ({
      id: result.inspections.id,
      vehicle_id: result.inspections.vehicle_id,
      inspector_id: result.inspections.inspector_id,
      inspection_date: result.inspections.inspection_date,
      completed: result.inspections.completed,
      notes: result.inspections.notes,
      created_at: result.inspections.created_at,
      updated_at: result.inspections.updated_at,
      vehicle: {
        id: result.vehicles.id,
        make: result.vehicles.make,
        model: result.vehicles.model,
        year: result.vehicles.year,
        vin: result.vehicles.vin,
        license_plate: result.vehicles.license_plate,
        created_at: result.vehicles.created_at,
        updated_at: result.vehicles.updated_at
      },
      inspector: {
        id: result.inspectors.id,
        name: result.inspectors.name,
        employee_id: result.inspectors.employee_id,
        created_at: result.inspectors.created_at,
        updated_at: result.inspectors.updated_at
      },
      items: itemsByInspection[result.inspections.id] || []
    }));
  } catch (error) {
    console.error('Failed to get vehicle inspections:', error);
    throw error;
  }
};