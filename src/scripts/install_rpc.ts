import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Installing verify_password function...');

    try {
        // 1. Create schema extension
        await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS extensions;`);
        console.log('Schema extensions created or exists.');

        // 2. Enable pgcrypto (Must be done by superuser, but let's try or assume it's there)
        // Note: In Supabase, pgcrypto is usually enabled by default in extensions schema
        try {
            await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;`);
            console.log('Extension pgcrypto ensured.');
        } catch (e) {
            console.log('Warning: Could not create extension (might require superuser), proceeding assuming it exists or is managed by Supabase.');
        }

        // 3. Create Function
        const sql = `
        CREATE OR REPLACE FUNCTION public.verify_password(user_password_hash text, input_password text)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public, extensions
        AS $$
        BEGIN
          RETURN user_password_hash = crypt(input_password, user_password_hash);
        END;
        $$;
    `;

        await prisma.$executeRawUnsafe(sql);
        console.log('✅ verify_password function created successfully.');

    } catch (error) {
        console.error('Error executing SQL:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
