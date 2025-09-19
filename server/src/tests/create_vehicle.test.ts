import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vehiclesTable } from '../db/schema';
import { type CreateVehicleInput } from '../schema';
import { createVehicle } from '../handlers/create_vehicle';
import { eq } from 'drizzle-orm';

// Test input data
const testVehicleInput: CreateVehicleInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2023,
  vin: '1HGBH41JXMN109186',
  license_plate: 'ABC123'
};

const anotherVehicleInput: CreateVehicleInput = {
  make: 'Honda',
  model: 'Civic',
  year: 2022,
  vin: '2HGFC2F59NH123456',
  license_plate: 'XYZ789'
};

describe('createVehicle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a vehicle with all required fields', async () => {
    const result = await createVehicle(testVehicleInput);

    // Verify all fields are properly set
    expect(result.make).toEqual('Toyota');
    expect(result.model).toEqual('Camry');
    expect(result.year).toEqual(2023);
    expect(result.vin).toEqual('1HGBH41JXMN109186');
    expect(result.license_plate).toEqual('ABC123');
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save vehicle to database', async () => {
    const result = await createVehicle(testVehicleInput);

    // Query the database to verify the vehicle was saved
    const vehicles = await db.select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.id, result.id))
      .execute();

    expect(vehicles).toHaveLength(1);
    const savedVehicle = vehicles[0];
    expect(savedVehicle.make).toEqual('Toyota');
    expect(savedVehicle.model).toEqual('Camry');
    expect(savedVehicle.year).toEqual(2023);
    expect(savedVehicle.vin).toEqual('1HGBH41JXMN109186');
    expect(savedVehicle.license_plate).toEqual('ABC123');
    expect(savedVehicle.created_at).toBeInstanceOf(Date);
    expect(savedVehicle.updated_at).toBeInstanceOf(Date);
  });

  it('should prevent duplicate VIN', async () => {
    // Create first vehicle
    await createVehicle(testVehicleInput);

    // Try to create second vehicle with same VIN but different license plate
    const duplicateVinInput: CreateVehicleInput = {
      ...anotherVehicleInput,
      vin: testVehicleInput.vin // Same VIN
    };

    await expect(createVehicle(duplicateVinInput)).rejects.toThrow(/VIN.*already exists/i);
  });

  it('should prevent duplicate license plate', async () => {
    // Create first vehicle
    await createVehicle(testVehicleInput);

    // Try to create second vehicle with same license plate but different VIN
    const duplicatePlateInput: CreateVehicleInput = {
      ...anotherVehicleInput,
      license_plate: testVehicleInput.license_plate // Same license plate
    };

    await expect(createVehicle(duplicatePlateInput)).rejects.toThrow(/license plate.*already exists/i);
  });

  it('should allow creating multiple vehicles with unique VINs and license plates', async () => {
    // Create first vehicle
    const firstResult = await createVehicle(testVehicleInput);

    // Create second vehicle with different VIN and license plate
    const secondResult = await createVehicle(anotherVehicleInput);

    // Verify both vehicles exist in database
    const allVehicles = await db.select().from(vehiclesTable).execute();
    expect(allVehicles).toHaveLength(2);

    // Verify IDs are different
    expect(firstResult.id).not.toEqual(secondResult.id);

    // Verify first vehicle data
    expect(firstResult.make).toEqual('Toyota');
    expect(firstResult.vin).toEqual('1HGBH41JXMN109186');
    expect(firstResult.license_plate).toEqual('ABC123');

    // Verify second vehicle data
    expect(secondResult.make).toEqual('Honda');
    expect(secondResult.vin).toEqual('2HGFC2F59NH123456');
    expect(secondResult.license_plate).toEqual('XYZ789');
  });

  it('should handle edge case VIN formats correctly', async () => {
    const edgeCaseInput: CreateVehicleInput = {
      make: 'Ford',
      model: 'F-150',
      year: 2024,
      vin: 'ABCDEFGHIJKLMNOPQ', // 17 character VIN with all letters
      license_plate: 'EDGE001'
    };

    const result = await createVehicle(edgeCaseInput);

    expect(result.vin).toEqual('ABCDEFGHIJKLMNOPQ');
    expect(result.make).toEqual('Ford');
    expect(result.model).toEqual('F-150');
    expect(result.year).toEqual(2024);
  });

  it('should handle special characters in license plates', async () => {
    const specialPlateInput: CreateVehicleInput = {
      make: 'BMW',
      model: 'X3',
      year: 2023,
      vin: '5UXCR6C0XL9999999',
      license_plate: 'ABC-123' // License plate with hyphen
    };

    const result = await createVehicle(specialPlateInput);

    expect(result.license_plate).toEqual('ABC-123');
    expect(result.make).toEqual('BMW');
    expect(result.model).toEqual('X3');
  });
});