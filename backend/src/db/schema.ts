import { sql } from 'drizzle-orm';
import { text, sqliteTable } from 'drizzle-orm/sqlite-core';
import { VehicleStatus } from '../types/vehicleModel';

export const vehicles = sqliteTable('vehicles', {
    id: text('id').primaryKey(),

    licensePlate: text('licensePlate').notNull().unique(),

    status: text('status', {
        enum: [VehicleStatus.Available, VehicleStatus.InUse, VehicleStatus.Maintenance],
    })
        .notNull()
        .default(VehicleStatus.Available),

    createdAt: text('createdAt')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
