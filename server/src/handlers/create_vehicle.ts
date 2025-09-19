import { db } from '../db';
import { vehiclesTable } from '../db/schema';
import { type CreateVehicleInput, type Vehicle } from '../schema';
import { eq, or } from 'drizzle-orm';

export const createVehicle = async (input: CreateVehicleInput): Promise<Vehicle> => {
  try {
    // Check for existing VIN or license plate to ensure uniqueness
    const existingVehicles = await db.select()
      .from(vehiclesTable)
      .where(
        or(
          eq(vehiclesTable.vin, input.vin),
          eq(vehiclesTable.license_plate, input.license_plate)
        )
      )
      .execute();

    if (existingVehicles.length > 0) {
      const existingVehicle = existingVehicles[0];
      if (existingVehicle.vin === input.vin) {
        throw new Error(`Vehicle with VIN ${input.vin} already exists`);
      }
      if (existingVehicle.license_plate === input.license_plate) {
        throw new Error(`Vehicle with license plate ${input.license_plate} already exists`);
      }
    }

    // Insert vehicle record
    const result = await db.insert(vehiclesTable)
      .values({
        make: input.make,
        model: input.model,
        year: input.year,
        vin: input.vin,
        license_plate: input.license_plate
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Vehicle creation failed:', error);
    throw error;
  }
};