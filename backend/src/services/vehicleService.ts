import { db } from '../db';
import { vehicles, Vehicle } from '../db/schema';
import { VehicleStatus } from '../types/vehicleModel';
import { randomUUID } from 'crypto';
// הוספנו את כל הפונקציות הנדרשות מ-drizzle-orm
import { eq, sql, and, like, asc, desc } from 'drizzle-orm';

// --- פונקציות עזר (פרטיות) ---

const getVehicleById = async (id: string): Promise<Vehicle | undefined> => {
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return result[0];
};

const getVehicleByPlate = async (plate: string): Promise<Vehicle | undefined> => {
    const result = await db.select().from(vehicles).where(eq(vehicles.licensePlate, plate));
    return result[0];
};

const isValidLicensePlate = (plate: string): boolean => {
    const plateRegex = /^\d{7,8}$/;
    return plateRegex.test(plate);
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

/**
 * --- זו הפונקציה ששונתה ---
 * היא מקבלת אובייקט אופציות ובונה שאילתה דינמית
 */
export const getAllVehicles = async (options: {
    status?: VehicleStatus;
    sortBy?: 'createdAt' | 'status';
    sortOrder?: 'asc' | 'desc';
    searchPlate?: string;
}): Promise<Vehicle[]> => {

    // שימוש בתחביר db.query לבניית שאילתה דינמית
    const queryOptions: Parameters<typeof db.query.vehicles.findMany>[0] = {};

    // מערך דינמי להוספת תנאי סינון
    const conditions = [];

    // 1. סינון לפי סטטוס
    if (options.status) {
        conditions.push(eq(vehicles.status, options.status));
    }

    // 2. חיפוש לפי מספר רישוי
    if (options.searchPlate) {
        // "like" מאפשר חיפוש חלקי (למשל "123" ימצא "7123456")
        conditions.push(like(vehicles.licensePlate, `%${options.searchPlate}%`));
    }

    // הוספת כל התנאים לפקודת ה-WHERE
    if (conditions.length > 0) {
        queryOptions.where = and(...conditions);
    }

    // 3. מיון
    const sortBy = options.sortBy || 'createdAt'; // ברירת מחדל: תאריך יצירה
    const sortOrder = options.sortOrder || 'desc'; // ברירת מחדל: יורד (החדש ביותר)

    const sortColumn = sortBy === 'status' ? vehicles.status : vehicles.createdAt;
    queryOptions.orderBy = [sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)];

    // הרצת השאילתה עם האובייקט הדינמי
    return await db.query.vehicles.findMany(queryOptions);
};

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

