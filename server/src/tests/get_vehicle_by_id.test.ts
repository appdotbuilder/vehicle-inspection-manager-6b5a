import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vehiclesTable } from '../db/schema';
import { getVehicleById } from '../handlers/get_vehicle_by_id';

describe('getVehicleById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return vehicle when found', async () => {
    // Create a test vehicle
    const testVehicle = {
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      vin: '1HGBH41JXMN109186',
      license_plate: 'ABC123'
    };

    const insertedVehicles = await db.insert(vehiclesTable)
      .values(testVehicle)
      .returning()
      .execute();

    const insertedVehicle = insertedVehicles[0];

    // Test the handler
    const result = await getVehicleById(insertedVehicle.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result?.id).toEqual(insertedVehicle.id);
    expect(result?.make).toEqual('Toyota');
    expect(result?.model).toEqual('Camry');
    expect(result?.year).toEqual(2022);
    expect(result?.vin).toEqual('1HGBH41JXMN109186');
    expect(result?.license_plate).toEqual('ABC123');
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when vehicle not found', async () => {
    // Test with non-existent ID
    const result = await getVehicleById(999);

    expect(result).toBeNull();
  });

  it('should return correct vehicle when multiple vehicles exist', async () => {
    // Create multiple test vehicles
    const testVehicles = [
      {
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        vin: '1HGBH41JXMN109186',
        license_plate: 'ABC123'
      },
      {
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        vin: '2HGFC2F59MH123456',
        license_plate: 'XYZ789'
      },
      {
        make: 'Ford',
        model: 'F-150',
        year: 2023,
        vin: '1FTFW1ET5NFC12345',
        license_plate: 'DEF456'
      }
    ];

    const insertedVehicles = await db.insert(vehiclesTable)
      .values(testVehicles)
      .returning()
      .execute();

    // Test getting the second vehicle
    const targetVehicle = insertedVehicles[1];
    const result = await getVehicleById(targetVehicle.id);

    // Verify we got the correct vehicle
    expect(result).not.toBeNull();
    expect(result?.id).toEqual(targetVehicle.id);
    expect(result?.make).toEqual('Honda');
    expect(result?.model).toEqual('Civic');
    expect(result?.year).toEqual(2021);
    expect(result?.vin).toEqual('2HGFC2F59MH123456');
    expect(result?.license_plate).toEqual('XYZ789');
  });

  it('should handle edge case with ID 0', async () => {
    // Test with ID 0 (which shouldn't exist since serial starts at 1)
    const result = await getVehicleById(0);

    expect(result).toBeNull();
  });

  it('should handle negative ID', async () => {
    // Test with negative ID
    const result = await getVehicleById(-1);

    expect(result).toBeNull();
  });
});