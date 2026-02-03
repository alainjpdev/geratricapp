
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying DB State ---');
    const userId = '94be0b88-88ec-4f91-9131-d66b52682707';

    try {
        // 1. Check Public User
        const publicUsers = await prisma.$queryRaw`SELECT * FROM public.users WHERE id = ${userId}`;
        console.log('Public User Exists:', Array.isArray(publicUsers) && publicUsers.length > 0);

        // 2. Check Auth User (requires permission, public-facing client might fail, but let's try via Prisma raw if connected as admin/postgres)
        // Note: DATABASE_URL usually connects as postgres/admin in Supabase transaction poolers or direct.
        try {
            const authUsers = await prisma.$queryRaw`SELECT id, email FROM auth.users WHERE id = ${userId}::uuid`;
            console.log('Auth User Exists:', Array.isArray(authUsers) && authUsers.length > 0);
        } catch (e) {
            console.log('Could not check auth.users (permission denied?)');
        }

        // 3. Inspect Constraints
        const constraints = await prisma.$queryRaw`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'public.medications'::regclass
    `;
        console.log('Constraints on medications:', constraints);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
