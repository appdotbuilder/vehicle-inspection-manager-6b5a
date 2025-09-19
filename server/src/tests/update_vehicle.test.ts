import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vehiclesTable } from '../db/schema';
import { type UpdateVehicleInput, type CreateVehicleInput } from '../schema';
import { updateVehicle } from '../handlers/update_vehicle';
import { eq } from 'drizzle-orm';

// Helper function to create a test vehicle
const createTestVehicle = async (overrides?: Partial<CreateVehicleInput>) => {
  const testVehicleData = {
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    vin: '1HGCM82633A123456',
    license_plate: 'ABC123',
    ...overrides
  };

  const result = await db.insert(vehiclesTable)
    .values({
      ...testVehicleData,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning()
    .execute();

  return result[0];
};

describe('updateVehicle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a vehicle with all fields', async () => {
    // Create initial vehicle
    const vehicle = await createTestVehicle();

    const updateInput: UpdateVehicleInput = {
      id: vehicle.id,
      make: 'Honda',
      model: 'Accord',
      year: 2023,
      vin: '2HGCM82633A789012',
      license_plate: 'XYZ789'
    };

    const result = await updateVehicle(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(vehicle.id);
    expect(result.make).toEqual('Honda');
    expect(result.model).toEqual('Accord');
    expect(result.year).toEqual(2023);
    expect(result.vin).toEqual('2HGCM82633A789012');
    expect(result.license_plate).toEqual('XYZ789');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(vehicle.created_at);
  });

  it('should update only specified fields', async () => {
    // Create initial vehicle
    const vehicle = await createTestVehicle();

    const updateInput: UpdateVehicleInput = {
      id: vehicle.id,
      make: 'Honda',
      year: 2023
    };

    const result = await updateVehicle(updateInput);

    // Verify only specified fields were updated
    expect(result.make).toEqual('Honda');
    expect(result.year).toEqual(2023);
    expect(result.model).toEqual(vehicle.model); // Should remain unchanged
    expect(result.vin).toEqual(vehicle.vin); // Should remain unchanged
    expect(result.license_plate).toEqual(vehicle.license_plate); // Should remain unchanged
  });

  it('should update vehicle in database', async () => {
    // Create initial vehicle
    const vehicle = await createTestVehicle();

    const updateInput: UpdateVehicleInput = {
      id: vehicle.id,
      make: 'Updated Make',
      model: 'Updated Model'
    };

    await updateVehicle(updateInput);

    // Verify changes persisted in database
    const dbVehicles = await db.select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.id, vehicle.id))
      .execute();

    expect(dbVehicles).toHaveLength(1);
    expect(dbVehicles[0].make).toEqual('Updated Make');
    expect(dbVehicles[0].model).toEqual('Updated Model');
    expect(dbVehicles[0].year).toEqual(vehicle.year); // Should remain unchanged
  });

  it('should throw error when vehicle not found', async () => {
    const updateInput: UpdateVehicleInput = {
      id: 999999 // Non-existent ID
    };

    await expect(updateVehicle(updateInput)).rejects.toThrow(/vehicle with id 999999 not found/i);
  });

  it('should throw error when VIN conflicts with another vehicle', async () => {
    // Create two vehicles
    const vehicle1 = await createTestVehicle({
      vin: '1HGCM82633A111111',
      license_plate: 'AAA111'
    });

    const vehicle2 = await createTestVehicle({
      vin: '1HGCM82633A222222',
      license_plate: 'BBB222'
    });

    // Try to update vehicle2 with vehicle1's VIN
    const updateInput: UpdateVehicleInput = {
      id: vehicle2.id,
      vin: vehicle1.vin
    };

    await expect(updateVehicle(updateInput)).rejects.toThrow(/vin .* is already in use/i);
  });

  it('should throw error when license plate conflicts with another vehicle', async () => {
    // Create two vehicles
    const vehicle1 = await createTestVehicle({
      vin: '1HGCM82633A111111',
      license_plate: 'AAA111'
    });

    const vehicle2 = await createTestVehicle({
      vin: '1HGCM82633A222222',
      license_plate: 'BBB222'
    });

    // Try to update vehicle2 with vehicle1's license plate
    const updateInput: UpdateVehicleInput = {
      id: vehicle2.id,
      license_plate: vehicle1.license_plate
    };

    await expect(updateVehicle(updateInput)).rejects.toThrow(/license plate .* is already in use/i);
  });

  it('should allow updating vehicle with same VIN and license plate (no change)', async () => {
    // Create vehicle
    const vehicle = await createTestVehicle();

    const updateInput: UpdateVehicleInput = {
      id: vehicle.id,
      vin: vehicle.vin, // Same VIN
      license_plate: vehicle.license_plate, // Same license plate
      make: 'Updated Make'
    };

    const result = await updateVehicle(updateInput);

    // Should succeed and update the make
    expect(result.make).toEqual('Updated Make');
    expect(result.vin).toEqual(vehicle.vin);
    expect(result.license_plate).toEqual(vehicle.license_plate);
  });

  it('should update updated_at timestamp', async () => {
    // Create vehicle
    const vehicle = await createTestVehicle();
    const originalUpdatedAt = vehicle.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateVehicleInput = {
      id: vehicle.id,
      make: 'Updated Make'
    };

    const result = await updateVehicle(updateInput);

    // Verify updated_at was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(result.created_at).toEqual(vehicle.created_at); // Should not change
  });

  it('should handle multiple field updates with uniqueness validation', async () => {
    // Create initial vehicle
    const vehicle = await createTestVehicle();

    const updateInput: UpdateVehicleInput = {
      id: vehicle.id,
      make: 'Honda',
      model: 'Civic',
      year: 2024,
      vin: '3HGCM82633A999999',
      license_plate: 'NEW999'
    };

    const result = await updateVehicle(updateInput);

    // Verify all updates applied correctly
    expect(result.make).toEqual('Honda');
    expect(result.model).toEqual('Civic');
    expect(result.year).toEqual(2024);
    expect(result.vin).toEqual('3HGCM82633A999999');
    expect(result.license_plate).toEqual('NEW999');
  });
});