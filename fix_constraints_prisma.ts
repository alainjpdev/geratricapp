
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing medication constraints...');

    try {
        // 1. Drop existing constraints
        await prisma.$executeRawUnsafe(`ALTER TABLE medications DROP CONSTRAINT IF EXISTS medications_dose1_checker_fkey;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE medications DROP CONSTRAINT IF EXISTS medications_dose2_checker_fkey;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE medications DROP CONSTRAINT IF EXISTS medications_dose3_checker_fkey;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE medications DROP CONSTRAINT IF EXISTS medications_dose4_checker_fkey;`);
        console.log('Dropped old constraints.');

        // 2. Add new constraints referencing auth.users
        await prisma.$executeRawUnsafe(`
      ALTER TABLE medications
        ADD CONSTRAINT medications_dose1_checker_fkey FOREIGN KEY (dose1_checker) REFERENCES auth.users(id);
    `);
        await prisma.$executeRawUnsafe(`
      ALTER TABLE medications
        ADD CONSTRAINT medications_dose2_checker_fkey FOREIGN KEY (dose2_checker) REFERENCES auth.users(id);
    `);
        await prisma.$executeRawUnsafe(`
      ALTER TABLE medications
        ADD CONSTRAINT medications_dose3_checker_fkey FOREIGN KEY (dose3_checker) REFERENCES auth.users(id);
    `);
        await prisma.$executeRawUnsafe(`
      ALTER TABLE medications
        ADD CONSTRAINT medications_dose4_checker_fkey FOREIGN KEY (dose4_checker) REFERENCES auth.users(id);
    `);
        console.log('Added new constraints pointing to auth.users.');

        console.log('SUCCESS: Constraints updated.');
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
