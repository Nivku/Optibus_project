import { db } from '../db';
import { vehicles, Vehicle } from '../db/schema';
import { VehicleStatus } from '../types/vehicleModel';
import { randomUUID } from 'crypto';
import { eq, sql, and, ne } from 'drizzle-orm';

// --- פונקציות עזר (פרטיות) ---

const getVehicleById = async (id: string): Promise<Vehicle | undefined> => {
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return result[0];
};

/**
 * פונקציית עזר חדשה לבדיקת קיום מספר רישוי
 */
const getVehicleByPlate = async (plate: string): Promise<Vehicle | undefined> => {
    const result = await db.select().from(vehicles).where(eq(vehicles.licensePlate, plate));
    return result[0];
};


const canMoveToMaintenance = async (): Promise<boolean> => {
    const totalCountResult = await db.select({ count: sql<number>`count(*)` }).from(vehicles);
    const maintenanceCountResult = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.status, VehicleStatus.Maintenance));
    const totalCount = totalCountResult[0].count;
    const maintenanceCount = maintenanceCountResult[0].count;
    if (totalCount === 0) return true;
    return (maintenanceCount + 1) / totalCount <= 0.05;
};


// --- פונקציות השירות (ציבוריות) ---

export const getAllVehicles = async (): Promise<Vehicle[]> => {
    return await db.select().from(vehicles);
};

export const createVehicle = async (licensePlate: string): Promise<Vehicle> => {
    // שלב 1: בדיקה אם מספר הרישוי כבר קיים
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

export const updateVehicle = async (
    id: string,
    data: { licensePlate?: string; status?: VehicleStatus }
): Promise<Vehicle | null> => {

    const { licensePlate, status: newStatus } = data;

    const vehicle = await getVehicleById(id);
    if (!vehicle) {
        return null;
    }

    // שלב 2: בדיקת ייחודיות מספר רישוי אם הוא משתנה
    if (licensePlate && licensePlate !== vehicle.licensePlate) {
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

