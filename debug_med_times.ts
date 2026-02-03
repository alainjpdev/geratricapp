
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecting Medication Times ---');
    // Need to find a medication record to inspect.
    // I'll list the last 5 medications created.

    const meds = await prisma.$queryRaw`
    SELECT id, medicamento, dose1_time, dose2_time, dose3_time 
    FROM medications 
    ORDER BY updated_at DESC 
    LIMIT 5
  `;

    console.log('Last modified medications:', meds);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
