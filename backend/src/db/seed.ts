import { db } from './index';
import { vehicles } from './schema';
import * as fs from 'fs';
import * as path from 'path';

async function seed() {
    try {
        console.log('Starting to seed the database...');


        const seedFile = path.join(process.cwd(), 'vehicles.json');
        const vehiclesData = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));

        await db.delete(vehicles);
        console.log('Cleared existing vehicles.');

        await db.insert(vehicles).values(vehiclesData);

        console.log(`Database seeded successfully with ${vehiclesData.length} vehicles.`);

    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

seed();
