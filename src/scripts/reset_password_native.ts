import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Resetting password for ark2784@gmail.com using native pgcrypto...');

    const email = 'ark2784@gmail.com';
    const newPassword = '123456';

    try {
        // Update password using Postgres native crypt function to ensure compatibility
        // gen_salt('bf') generates a Blowfish (bcrypt) salt
        const count = await prisma.$executeRawUnsafe(`
        UPDATE "public"."users" 
        SET "password_hash" = crypt('${newPassword}', gen_salt('bf')),
            "updated_at" = now()
        WHERE "email" = '${email}';
    `);

        console.log(`✅ Password updated natively. Rows affected: ${count}`);

        // Verify manually
        // We select the hash and try to verify it using a query to be sure
        const result: any[] = await prisma.$queryRawUnsafe(`
        SELECT email, 
               (password_hash = crypt('${newPassword}', password_hash)) as is_valid
        FROM "public"."users" 
        WHERE email = '${email}';
    `);

        console.log('Verification check:', result);

    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
