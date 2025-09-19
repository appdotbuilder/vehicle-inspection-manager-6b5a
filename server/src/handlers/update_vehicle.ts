import { db } from '../db';
import { vehiclesTable } from '../db/schema';
import { type UpdateVehicleInput, type Vehicle } from '../schema';
import { eq, and, ne } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export const updateVehicle = async (input: UpdateVehicleInput): Promise<Vehicle> => {
  try {
    // First, check if vehicle exists
    const existingVehicles = await db.select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.id, input.id))
      .execute();

    if (existingVehicles.length === 0) {
      throw new Error(`Vehicle with id ${input.id} not found`);
    }

    // Check for uniqueness constraints if VIN or license_plate are being updated
    const uniquenessConditions: SQL<unknown>[] = [];

    if (input.vin) {
      uniquenessConditions.push(eq(vehiclesTable.vin, input.vin));
    }

    if (input.license_plate) {
      uniquenessConditions.push(eq(vehiclesTable.license_plate, input.license_plate));
    }

    if (uniquenessConditions.length > 0) {
      // Check if any other vehicle has the same VIN or license plate
      const conflictQuery = db.select()
        .from(vehiclesTable)
        .where(
          and(
            ne(vehiclesTable.id, input.id), // Exclude current vehicle
            ...uniquenessConditions
          )
        );

      const conflicts = await conflictQuery.execute();

      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        if (input.vin && conflict.vin === input.vin) {
          throw new Error(`VIN ${input.vin} is already in use by another vehicle`);
        }
        if (input.license_plate && conflict.license_plate === input.license_plate) {
          throw new Error(`License plate ${input.license_plate} is already in use by another vehicle`);
        }
      }
    }

    // Build update data object with only provided fields
    const updateData: Partial<typeof vehiclesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.make !== undefined) {
      updateData.make = input.make;
    }
    if (input.model !== undefined) {
      updateData.model = input.model;
    }
    if (input.year !== undefined) {
      updateData.year = input.year;
    }
    if (input.vin !== undefined) {
      updateData.vin = input.vin;
    }
    if (input.license_plate !== undefined) {
      updateData.license_plate = input.license_plate;
    }

    // Update the vehicle
    const result = await db.update(vehiclesTable)
      .set(updateData)
      .where(eq(vehiclesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Vehicle update failed:', error);
    throw error;
  }
};