import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vehiclesTable } from '../db/schema';
import { type CreateVehicleInput } from '../schema';
import { getVehicles } from '../handlers/get_vehicles';

// Test vehicle data
const testVehicle1: CreateVehicleInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: '1HGBH41JXMN109186',
  license_plate: 'ABC123'
};

const testVehicle2: CreateVehicleInput = {
  make: 'Honda',
  model: 'Civic',
  year: 2021,
  vin: '2HGBH41JXMN109187',
  license_plate: 'XYZ789'
};

const testVehicle3: CreateVehicleInput = {
  make: 'Ford',
  model: 'F-150',
  year: 2022,
  vin: '3HGBH41JXMN109188',
  license_plate: 'DEF456'
};

describe('getVehicles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no vehicles exist', async () => {
    const result = await getVehicles();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all vehicles', async () => {
    // Create test vehicles
    await db.insert(vehiclesTable)
      .values([testVehicle1, testVehicle2, testVehicle3])
      .execute();

    const result = await getVehicles();

    expect(result).toHaveLength(3);
    
    // Check all vehicles are returned with correct properties
    const makes = result.map(v => v.make);
    const models = result.map(v => v.model);
    const years = result.map(v => v.year);
    
    expect(makes).toContain('Toyota');
    expect(makes).toContain('Honda');
    expect(makes).toContain('Ford');
    
    expect(models).toContain('Camry');
    expect(models).toContain('Civic');
    expect(models).toContain('F-150');
    
    expect(years).toContain(2020);
    expect(years).toContain(2021);
    expect(years).toContain(2022);

    // Verify all required fields are present
    result.forEach(vehicle => {
      expect(vehicle.id).toBeDefined();
      expect(vehicle.make).toBeDefined();
      expect(vehicle.model).toBeDefined();
      expect(vehicle.year).toBeDefined();
      expect(vehicle.vin).toBeDefined();
      expect(vehicle.license_plate).toBeDefined();
      expect(vehicle.created_at).toBeInstanceOf(Date);
      expect(vehicle.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return vehicles ordered by created_at desc (newest first)', async () => {
    // Insert vehicles one by one to ensure different created_at timestamps
    const vehicle1Result = await db.insert(vehiclesTable)
      .values(testVehicle1)
      .returning()
      .execute();

    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const vehicle2Result = await db.insert(vehiclesTable)
      .values(testVehicle2)
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const vehicle3Result = await db.insert(vehiclesTable)
      .values(testVehicle3)
      .returning()
      .execute();

    const result = await getVehicles();

    expect(result).toHaveLength(3);

    // Verify ordering - newest first (descending created_at)
    const createdAtTimes = result.map(v => v.created_at.getTime());
    
    // Check that each timestamp is greater than or equal to the next
    for (let i = 0; i < createdAtTimes.length - 1; i++) {
      expect(createdAtTimes[i]).toBeGreaterThanOrEqual(createdAtTimes[i + 1]);
    }

    // The most recently inserted vehicle (Ford F-150) should be first
    expect(result[0].make).toEqual('Ford');
    expect(result[0].model).toEqual('F-150');
  });

  it('should handle single vehicle correctly', async () => {
    await db.insert(vehiclesTable)
      .values(testVehicle1)
      .execute();

    const result = await getVehicles();

    expect(result).toHaveLength(1);
    expect(result[0].make).toEqual('Toyota');
    expect(result[0].model).toEqual('Camry');
    expect(result[0].year).toEqual(2020);
    expect(result[0].vin).toEqual('1HGBH41JXMN109186');
    expect(result[0].license_plate).toEqual('ABC123');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should preserve all vehicle data types correctly', async () => {
    await db.insert(vehiclesTable)
      .values(testVehicle1)
      .execute();

    const result = await getVehicles();
    const vehicle = result[0];

    // Type checks
    expect(typeof vehicle.id).toBe('number');
    expect(typeof vehicle.make).toBe('string');
    expect(typeof vehicle.model).toBe('string');
    expect(typeof vehicle.year).toBe('number');
    expect(typeof vehicle.vin).toBe('string');
    expect(typeof vehicle.license_plate).toBe('string');
    expect(vehicle.created_at).toBeInstanceOf(Date);
    expect(vehicle.updated_at).toBeInstanceOf(Date);
  });
});