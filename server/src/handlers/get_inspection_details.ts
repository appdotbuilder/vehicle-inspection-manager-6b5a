import { db } from '../db';
import { inspectionsTable, vehiclesTable, inspectorsTable, inspectionItemsTable } from '../db/schema';
import { type GetInspectionDetailsInput, type InspectionWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const getInspectionDetails = async (input: GetInspectionDetailsInput): Promise<InspectionWithDetails | null> => {
  try {
    // First, get the inspection with vehicle and inspector data
    const inspectionResult = await db.select()
      .from(inspectionsTable)
      .innerJoin(vehiclesTable, eq(inspectionsTable.vehicle_id, vehiclesTable.id))
      .innerJoin(inspectorsTable, eq(inspectionsTable.inspector_id, inspectorsTable.id))
      .where(eq(inspectionsTable.id, input.inspection_id))
      .execute();

    if (inspectionResult.length === 0) {
      return null;
    }

    const result = inspectionResult[0];

    // Get all inspection items for this inspection
    const inspectionItems = await db.select()
      .from(inspectionItemsTable)
      .where(eq(inspectionItemsTable.inspection_id, input.inspection_id))
      .execute();

    // Construct the response with proper structure
    return {
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
      items: inspectionItems.map(item => ({
        id: item.id,
        inspection_id: item.inspection_id,
        item_name: item.item_name,
        status: item.status,
        comments: item.comments,
        created_at: item.created_at,
        updated_at: item.updated_at
      }))
    };
  } catch (error) {
    console.error('Get inspection details failed:', error);
    throw error;
  }
};