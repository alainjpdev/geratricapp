
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Migrating medications to TEXT types and public.users references...');

    try {
        // 1. Drop existing constraints
        const constraints = ['dose1', 'dose2', 'dose3', 'dose4'];
        for (const d of constraints) {
            await prisma.$executeRawUnsafe(`ALTER TABLE medications DROP CONSTRAINT IF EXISTS medications_${d}_checker_fkey`);
        }
        console.log('Dropped old constraints.');

        // 2. Alter columns to TEXT
        for (const d of constraints) {
            // Using "::text" just in case there's data to cast, though uuid->text is implicit usually
            await prisma.$executeRawUnsafe(`ALTER TABLE medications ALTER COLUMN ${d}_checker TYPE TEXT`);
        }
        console.log('Converted columns to TEXT.');

        // 3. Add new constraints referencing public.users
        for (const d of constraints) {
            await prisma.$executeRawUnsafe(`
            ALTER TABLE medications
            ADD CONSTRAINT medications_${d}_checker_fkey FOREIGN KEY (${d}_checker) REFERENCES public.users(id)
        `);
        }
        console.log('Added new constraints pointing to public.users.');
        console.log('SUCCESS: Migration complete.');

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
