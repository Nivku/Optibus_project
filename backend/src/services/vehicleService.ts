import { db } from '../db';
import { vehicles, Vehicle } from '../db/schema';
import { VehicleStatus } from '../types/vehicleModel';
import { randomUUID } from 'crypto';
import { eq, sql, and, like, asc, desc } from 'drizzle-orm';


// Create a new vehicle in the database
const getVehicleById = async (id: string): Promise<Vehicle | undefined> => {
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return result[0];
};

// Retrieve a vehicle in the database
const getVehicleByPlate = async (plate: string): Promise<Vehicle | undefined> => {
    const result = await db.select().from(vehicles).where(eq(vehicles.licensePlate, plate));
    return result[0];
};

// Check if a the license plate is valid
const isValidLicensePlate = (plate: string): boolean => {
    const plateRegex = /^\d{7,8}$/;
    return plateRegex.test(plate);
};

// Check if a vehicle can be moved to maintenance
const canMoveToMaintenance = async (): Promise<boolean> => {
    const totalCountResult = await db.select({ count: sql<number>`count(*)` }).from(vehicles);
    const maintenanceCountResult = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.status, VehicleStatus.Maintenance));
    const totalCount = totalCountResult[0].count;
    const maintenanceCount = maintenanceCountResult[0].count;
    if (totalCount === 0) return true;
    return (maintenanceCount + 1) / totalCount <= 0.05;
};


// Retrieve all vehicles in the database
export const getAllVehicles = async (options: {
    status?: VehicleStatus;
    sortBy?: 'createdAt' | 'status';
    sortOrder?: 'asc' | 'desc';
    searchPlate?: string;
}): Promise<Vehicle[]> => {

    const queryOptions: Parameters<typeof db.query.vehicles.findMany>[0] = {};

    const conditions = [];

    if (options.status) {
        conditions.push(eq(vehicles.status, options.status));
    }

    if (options.searchPlate) {
        conditions.push(like(vehicles.licensePlate, `${options.searchPlate}%`));
    }

    if (conditions.length > 0) {
        queryOptions.where = and(...conditions);
    }

    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';

    const sortColumn = sortBy === 'status' ? vehicles.status : vehicles.createdAt;
    queryOptions.orderBy = [sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)];

    return await db.query.vehicles.findMany(queryOptions);
};


// Create a new vehicle in the database
export const createVehicle = async (licensePlate: string): Promise<Vehicle> => {
    if (!isValidLicensePlate(licensePlate)) {
        throw new Error('Invalid license plate: Must be 7 or 8 digits only.');
    }
    const existingVehicle = await getVehicleByPlate(licensePlate);
    if (existingVehicle) {
        throw new Error(`Vehicle with license plate ${licensePlate} already exists.`);
    }

    const newVehicleData = {
        id: randomUUID(),
        licensePlate: licensePlate,
        status: VehicleStatus.Available,
    };

    const result = await db.insert(vehicles).values(newVehicleData).returning();
    return result[0];
};


// Update an existing vehicle in the database if exist
export const updateVehicle = async (
    id: string,
    data: { licensePlate?: string; status?: VehicleStatus }
): Promise<Vehicle | null> => {

    const { licensePlate, status: newStatus } = data;

    const vehicle = await getVehicleById(id);
    if (!vehicle) {
        return null;
    }

    if (licensePlate && licensePlate !== vehicle.licensePlate) {
        if (!isValidLicensePlate(licensePlate)) {
            throw new Error('Invalid license plate: Must be 7 or 8 digits only.');
        }
        const existingVehicle = await getVehicleByPlate(licensePlate);
        if (existingVehicle) {
            throw new Error(`Vehicle with license plate ${licensePlate} already exists.`);
        }
    }

    const oldStatus = vehicle.status;

    if (newStatus && newStatus !== oldStatus) {
        if (oldStatus === VehicleStatus.Maintenance && newStatus !== VehicleStatus.Available) {
            throw new Error('Vehicle in Maintenance can only be moved to Available status.');
        }
        if (newStatus === VehicleStatus.Maintenance) {
            const allowed = await canMoveToMaintenance();
            if (!allowed) {
                throw new Error('Cannot move to Maintenance. Fleet maintenance capacity (5%) exceeded.');
            }
        }
    }

    const updateData: Partial<Vehicle> = {};
    if (licensePlate) updateData.licensePlate = licensePlate;
    if (newStatus) updateData.status = newStatus;

    const result = await db
        .update(vehicles)
        .set(updateData)
        .where(eq(vehicles.id, id))
        .returning();

    return result[0];
};

// Delete an existing vehicle in the database if exist

export const deleteVehicle = async (id: string): Promise<boolean> => {
    const vehicle = await getVehicleById(id);
    if (!vehicle) {
        return false;
    }
    if (vehicle.status === VehicleStatus.InUse || vehicle.status === VehicleStatus.Maintenance) {
        throw new Error('Vehicle is InUse or in Maintenance and cannot be deleted.');
    }
    const result = await db
        .delete(vehicles)
        .where(eq(vehicles.id, id))
        .returning({ id: vehicles.id });

    return result.length > 0;
};

