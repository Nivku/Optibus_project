import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../db/schema';
import * as vehicleService from '../services/vehicleService';
import { VehicleStatus } from '../types/vehicleModel';
import { eq, sql } from 'drizzle-orm'; // <-- Import sql here if not already

// --- Test Environment Setup ---

let testDbInstance: BetterSQLite3Database<typeof schema>;
let sqliteDb: Database.Database;

// --- Mocking Setup ---
vi.mock('../db', () => ({
    get db() {
        return testDbInstance;
    }
}));

// Function to run *before* each test
beforeEach(() => {
    sqliteDb = new Database(':memory:');
    testDbInstance = drizzle(sqliteDb, { schema });

    // Create the table (Using direct SQL for simplicity here)
    sqliteDb.exec(`
        CREATE TABLE vehicles (
            id TEXT PRIMARY KEY NOT NULL,
            "licensePlate" TEXT NOT NULL UNIQUE,
            status TEXT CHECK(status IN ('Available', 'InUse', 'Maintenance')) NOT NULL DEFAULT 'Available',
            "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
});

// Function to run after each test
afterEach(() => {
    sqliteDb.close();
    vi.restoreAllMocks();
});

// Test Suite for vehicleService
describe('Vehicle Service', () => {

    // Tests for createVehicle
    describe('createVehicle', () => {

        // These tests don't need many vehicles, run as before
        it('should create a new vehicle successfully', async () => {
            const plate = '1234567';
            const newVehicle = await vehicleService.createVehicle(plate);

            expect(newVehicle).toBeDefined();
            expect(newVehicle.id).toBeTypeOf('string');
            expect(newVehicle.licensePlate).toBe(plate);
            expect(newVehicle.status).toBe(VehicleStatus.Available);
            expect(newVehicle.createdAt).toBeTypeOf('string');

            const vehiclesInDb = await testDbInstance.select().from(schema.vehicles);
            expect(vehiclesInDb).toHaveLength(1);
            expect(vehiclesInDb[0].licensePlate).toBe(plate);
            expect(vehiclesInDb[0].id).toBe(newVehicle.id);
        });

        it('should throw error for invalid license plate (too short)', async () => {
            const plate = '123456';
            await expect(vehicleService.createVehicle(plate))
                .rejects
                .toThrow('Invalid license plate: Must be 7 or 8 digits only.');
        });

        it('should throw error for invalid license plate (non-digit)', async () => {
            const plate = '123456A';
            await expect(vehicleService.createVehicle(plate))
                .rejects
                .toThrow('Invalid license plate: Must be 7 or 8 digits only.');
        });

        it('should throw error for invalid license plate (too long)', async () => {
            const plate = '123456789';
            await expect(vehicleService.createVehicle(plate))
                .rejects
                .toThrow('Invalid license plate: Must be 7 or 8 digits only.');
        });

        it('should throw error for duplicate license plate', async () => {
            const plate = '8765432';
            await vehicleService.createVehicle(plate);
            await expect(vehicleService.createVehicle(plate))
                .rejects
                .toThrow(`Vehicle with license plate ${plate} already exists.`);
        });
    });

    // --- Tests for updateVehicle ---
    describe('updateVehicle', () => {
        let vehicleId: string;
        const initialPlate = '1111111';

        // Add enough vehicles for 5% rule testing
        beforeEach(async () => {

            // Create the main vehicle we'll test with
            const vehicle = await vehicleService.createVehicle(initialPlate);
            vehicleId = vehicle.id;

            // Add 19 dummy vehicles.
            const dummyVehicles = [];
            for (let i = 0; i < 19; i++) {
                dummyVehicles.push({
                    id: `dummy-${i}`,
                    licensePlate: `99999${String(i).padStart(2, '0')}`, // Unique plates
                    status: VehicleStatus.Available,
                    createdAt: new Date().toISOString()
                });
            }
            if (dummyVehicles.length > 0) {
                await testDbInstance.insert(schema.vehicles).values(dummyVehicles);
            }
        });

        it('should update license plate successfully', async () => {
            const newPlate = '2222222';
            const updatedVehicle = await vehicleService.updateVehicle(vehicleId, { licensePlate: newPlate });
            expect(updatedVehicle?.licensePlate).toBe(newPlate);
            const vehicleInDb = await testDbInstance.select().from(schema.vehicles).where(eq(schema.vehicles.id, vehicleId));
            expect(vehicleInDb[0].licensePlate).toBe(newPlate);
        });

        it('should throw error when updating license plate to invalid format', async () => {
            const invalidPlate = 'ABC';
            await expect(vehicleService.updateVehicle(vehicleId, { licensePlate: invalidPlate }))
                .rejects
                .toThrow('Invalid license plate: Must be 7 or 8 digits only.');
        });

        it('should update status successfully (Available to InUse)', async () => {
            const newStatus = VehicleStatus.InUse;
            const updatedVehicle = await vehicleService.updateVehicle(vehicleId, { status: newStatus });
            expect(updatedVehicle?.status).toBe(newStatus);
            const vehicleInDb = await testDbInstance.select().from(schema.vehicles).where(eq(schema.vehicles.id, vehicleId));
            expect(vehicleInDb[0].status).toBe(newStatus);
        });

        it('should update status successfully (Available to Maintenance - allowed now)', async () => {
            const newStatus = VehicleStatus.Maintenance;
            const updatedVehicle = await vehicleService.updateVehicle(vehicleId, { status: newStatus });
            expect(updatedVehicle?.status).toBe(newStatus); // Should succeed now
        });


        it('should return null if vehicle ID does not exist', async () => {
            const nonExistentId = 'non-existent-id';
            const result = await vehicleService.updateVehicle(nonExistentId, { status: VehicleStatus.InUse });
            expect(result).toBeNull();
        });

        it('should throw error when updating to duplicate license plate', async () => {
            // Use one of the dummy plates
            const existingDummyPlate = '9999905';
            await expect(vehicleService.updateVehicle(vehicleId, { licensePlate: existingDummyPlate }))
                .rejects
                .toThrow(`Vehicle with license plate ${existingDummyPlate} already exists.`);
        });

        it('should throw error when moving from Maintenance to InUse', async () => {
            // First, successfully move to Maintenance
            await vehicleService.updateVehicle(vehicleId, { status: VehicleStatus.Maintenance });
            // Now, expect the error when trying to move to InUse
            await expect(vehicleService.updateVehicle(vehicleId, { status: VehicleStatus.InUse }))
                .rejects
                .toThrow('Vehicle in Maintenance can only be moved to Available status.');
        });

        it('should allow moving from Maintenance to Available', async () => {
            // First, successfully move to Maintenance
            await vehicleService.updateVehicle(vehicleId, { status: VehicleStatus.Maintenance });
            // Now, move back to Available
            const updatedVehicle = await vehicleService.updateVehicle(vehicleId, { status: VehicleStatus.Available });
            expect(updatedVehicle?.status).toBe(VehicleStatus.Available);
        });

        it('should throw error when exceeding 5% maintenance capacity', async () => {
            // First vehicle to Maintenance (1 out of 20 = 5% - OK)
            await vehicleService.updateVehicle(vehicleId, { status: VehicleStatus.Maintenance });

            // Try to move a second vehicle (dummy-0) to Maintenance (2 out of 20 = 10% - NOT OK)
            await expect(vehicleService.updateVehicle('dummy-0', { status: VehicleStatus.Maintenance }))
                .rejects
                .toThrow('Cannot move to Maintenance. Fleet maintenance capacity (5%) exceeded.');
        });
    });

    // Tests for deleteVehicle
    describe('deleteVehicle', () => {
        let vehicleId: string;


        beforeEach(async () => {
            const vehicle = await vehicleService.createVehicle('5555555');
            vehicleId = vehicle.id;

            // Add 19 dummy vehicles
            const dummyVehicles = [];
            for (let i = 0; i < 19; i++) {
                dummyVehicles.push({
                    id: `dummy-del-${i}`,
                    licensePlate: `88888${String(i).padStart(2, '0')}`, // Unique plates
                    status: VehicleStatus.Available,
                    createdAt: new Date().toISOString()
                });
            }
            if (dummyVehicles.length > 0) {
                await testDbInstance.insert(schema.vehicles).values(dummyVehicles);
            }
        });

        it('should delete an available vehicle successfully', async () => {
            const success = await vehicleService.deleteVehicle(vehicleId);
            expect(success).toBe(true);
            const vehiclesInDb = await testDbInstance.select().from(schema.vehicles);
            // Expect 19 remaining (the dummies)
            expect(vehiclesInDb).toHaveLength(19);
        });

        it('should return false if vehicle ID does not exist', async () => {
            const nonExistentId = 'non-existent-id';
            const success = await vehicleService.deleteVehicle(nonExistentId);
            expect(success).toBe(false);
        });

        it('should throw error when trying to delete an InUse vehicle', async () => {
            await vehicleService.updateVehicle(vehicleId, { status: VehicleStatus.InUse });
            await expect(vehicleService.deleteVehicle(vehicleId))
                .rejects
                .toThrow('Vehicle is InUse or in Maintenance and cannot be deleted.');
            const vehiclesInDb = await testDbInstance.select().from(schema.vehicles);
            // Expect 20 (original + dummies)
            expect(vehiclesInDb).toHaveLength(20);
        });

        it('should throw error when trying to delete a Maintenance vehicle', async () => {
            // First move to Maintenance (should succeed now with 20 vehicles)
            await vehicleService.updateVehicle(vehicleId, { status: VehicleStatus.Maintenance });
            // Now expect delete to fail
            await expect(vehicleService.deleteVehicle(vehicleId))
                .rejects
                .toThrow('Vehicle is InUse or in Maintenance and cannot be deleted.');
            const vehiclesInDb = await testDbInstance.select().from(schema.vehicles);
            // Expect 20 (original + dummies)
            expect(vehiclesInDb).toHaveLength(20);
        });
    });

    // --- Tests for getAllVehicles ---
    describe('getAllVehicles', () => {
        beforeEach(async () => {
            // Seed data specific to these tests
            await testDbInstance.insert(schema.vehicles).values([
                { id: 'v1', licensePlate: '1000001', status: VehicleStatus.Available, createdAt: '2023-01-01T10:00:00Z' },
                { id: 'v2', licensePlate: '1000002', status: VehicleStatus.InUse, createdAt: '2023-01-03T10:00:00Z' },
                { id: 'v3', licensePlate: '1000003', status: VehicleStatus.Maintenance, createdAt: '2023-01-02T10:00:00Z' },
                { id: 'v4', licensePlate: '2000004', status: VehicleStatus.Available, createdAt: '2023-01-04T10:00:00Z' },
            ]);
        });

        it('should return all vehicles when no options are provided (sorted by createdAt desc by default)', async () => {
            const vehicles = await vehicleService.getAllVehicles({});
            expect(vehicles).toHaveLength(4);
            expect(vehicles[0].licensePlate).toBe('2000004'); // Newest first
            expect(vehicles[3].licensePlate).toBe('1000001'); // Oldest last
        });

        it('should filter by status', async () => {
            const vehicles = await vehicleService.getAllVehicles({ status: VehicleStatus.Available });
            expect(vehicles).toHaveLength(2);
            expect(vehicles.every(v => v.status === VehicleStatus.Available)).toBe(true);
        });

        it('should search by license plate (starts with)', async () => {
            const vehicles = await vehicleService.getAllVehicles({ searchPlate: '1000' });
            expect(vehicles).toHaveLength(3); // v1, v2, v3
            expect(vehicles.every(v => v.licensePlate.startsWith('1000'))).toBe(true);
        });

        it('should sort by status ascending', async () => {
            const vehicles = await vehicleService.getAllVehicles({ sortBy: 'status', sortOrder: 'asc' });
            expect(vehicles).toHaveLength(4);
            expect(vehicles[0].status).toBe(VehicleStatus.Available);
            expect(vehicles[1].status).toBe(VehicleStatus.Available);
            expect(vehicles[2].status).toBe(VehicleStatus.InUse);
            expect(vehicles[3].status).toBe(VehicleStatus.Maintenance);
        });

        it('should sort by createdAt ascending', async () => {
            const vehicles = await vehicleService.getAllVehicles({ sortBy: 'createdAt', sortOrder: 'asc' });
            expect(vehicles).toHaveLength(4);
            expect(vehicles[0].licensePlate).toBe('1000001'); // Oldest first
            expect(vehicles[3].licensePlate).toBe('2000004'); // Newest last
        });

        it('should filter, search, and sort together', async () => {
            const vehicles = await vehicleService.getAllVehicles({
                status: VehicleStatus.Available,
                searchPlate: '1000', // Should only find v1
                sortBy: 'createdAt',
                sortOrder: 'asc'
            });
            expect(vehicles).toHaveLength(1);
            expect(vehicles[0].licensePlate).toBe('1000001');
        });
    });
});

