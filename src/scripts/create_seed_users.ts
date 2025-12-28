import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Creating seed users (Enfermero & Paciente)...');

    const users = [
        {
            email: 'nurse@geriatricapp.com',
            password: 'nursepassword123', // Human readable password for logging
            plainPassword: 'nursepassword123',
            role: 'enfermero',
            firstName: 'Maria',
            lastName: 'Enfermera',
        },
        {
            email: 'patient@geriatricapp.com',
            password: 'patientpassword123',
            plainPassword: 'patientpassword123',
            role: 'paciente',
            firstName: 'Juan',
            lastName: 'Paciente',
        },
    ];

    // Common salt for bcrypt (though pgcrypto verify relies on its own, we used native crypt for admin. 
    // Ideally we should use native crypt here too to be safe with verify_password, 
    // OR rely on the fact verify_password should work with properly hashed bcrypt strings if it uses crypt/gen_salt logic internally properly.
    // Actually, to be safe and consistent with the admin fix, I will use native SQL insertion with crypt(), 
    // bypassing prisma create slightly or use raw query for password setting.
    // But wait, if I use prisma create, I pass a string.
    // Let's use the same approach as `create_admin_user` but using `crypt` in a raw query update immediately after, or just do raw insert.
    // Raw upsert is cleaner for compatibility.

    for (const user of users) {
        try {
            // 1. Check if user exists
            const existing = await prisma.user.findUnique({
                where: { email: user.email },
            });

            if (existing) {
                console.log(`User ${user.email} exists. Updating password/role...`);
                // Update using raw SQL to ensure password compatibility
                await prisma.$executeRawUnsafe(`
            UPDATE "public"."users"
            SET "role" = '${user.role}',
                "first_name" = '${user.firstName}',
                "last_name" = '${user.lastName}',
                "password_hash" = crypt('${user.plainPassword}', gen_salt('bf')),
                "updated_at" = now()
            WHERE "email" = '${user.email}';
        `);
            } else {
                console.log(`Creating user ${user.email}...`);
                const id = randomUUID();
                // Insert using raw SQL
                await prisma.$executeRawUnsafe(`
            INSERT INTO "public"."users" ("id", "email", "first_name", "last_name", "role", "password_hash", "is_active", "created_at", "updated_at")
            VALUES (
                '${id}',
                '${user.email}',
                '${user.firstName}',
                '${user.lastName}',
                '${user.role}',
                crypt('${user.plainPassword}', gen_salt('bf')),
                true,
                now(),
                now()
            );
        `);
            }
            console.log(`✅ Processed ${user.email} - Role: ${user.role}`);
        } catch (e) {
            console.error(`❌ Error processing ${user.email}:`, e);
        }
    }

    console.log('🎉 Seed users creation complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
