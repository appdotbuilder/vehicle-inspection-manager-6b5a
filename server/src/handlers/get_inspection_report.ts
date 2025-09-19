import { db } from '../db';
import { inspectionsTable, vehiclesTable, inspectorsTable, inspectionItemsTable } from '../db/schema';
import { type InspectionReport } from '../schema';
import { eq, desc, count } from 'drizzle-orm';

export const getInspectionReport = async (): Promise<InspectionReport> => {
  try {
    // Get inspection statistics
    const totalInspectionsQuery = await db.select({ count: count() })
      .from(inspectionsTable)
      .execute();

    const completedInspectionsQuery = await db.select({ count: count() })
      .from(inspectionsTable)
      .where(eq(inspectionsTable.completed, true))
      .execute();

    const total_inspections = totalInspectionsQuery[0]?.count || 0;
    const completed_inspections = completedInspectionsQuery[0]?.count || 0;
    const pending_inspections = total_inspections - completed_inspections;

    // Get recent inspections with full details (last 10)
    const recentInspectionsResults = await db.select()
      .from(inspectionsTable)
      .innerJoin(vehiclesTable, eq(inspectionsTable.vehicle_id, vehiclesTable.id))
      .innerJoin(inspectorsTable, eq(inspectionsTable.inspector_id, inspectorsTable.id))
      .orderBy(desc(inspectionsTable.created_at))
      .limit(10)
      .execute();

    // Get inspection items for each recent inspection
    const recent_inspections = await Promise.all(
      recentInspectionsResults.map(async (result) => {
        const inspection = result.inspections;
        const vehicle = result.vehicles;
        const inspector = result.inspectors;

        // Get items for this inspection
        const items = await db.select()
          .from(inspectionItemsTable)
          .where(eq(inspectionItemsTable.inspection_id, inspection.id))
          .execute();

        return {
          id: inspection.id,
          vehicle_id: inspection.vehicle_id,
          inspector_id: inspection.inspector_id,
          inspection_date: inspection.inspection_date,
          completed: inspection.completed,
          notes: inspection.notes,
          created_at: inspection.created_at,
          updated_at: inspection.updated_at,
          vehicle: {
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            vin: vehicle.vin,
            license_plate: vehicle.license_plate,
            created_at: vehicle.created_at,
            updated_at: vehicle.updated_at
          },
          inspector: {
            id: inspector.id,
            name: inspector.name,
            employee_id: inspector.employee_id,
            created_at: inspector.created_at,
            updated_at: inspector.updated_at
          },
          items: items.map(item => ({
            id: item.id,
            inspection_id: item.inspection_id,
            item_name: item.item_name,
            status: item.status,
            comments: item.comments,
            created_at: item.created_at,
            updated_at: item.updated_at
          }))
        };
      })
    );

    return {
      total_inspections,
      completed_inspections,
      pending_inspections,
      recent_inspections
    };
  } catch (error) {
    console.error('Inspection report generation failed:', error);
    throw error;
  }
};