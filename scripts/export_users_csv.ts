import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportUsers() {
    console.log('📦 Fetching users from database via Prisma...');

    try {
        const users = await prisma.user.findMany({
            orderBy: {
                role: 'asc',
            },
            select: {
                email: true,
                role: true,
                grupoAsignado: true,
                firstName: true,
                lastName: true,
            }
        });

        if (users.length === 0) {
            console.log('⚠️ No users found.');
            return;
        }

        // Define CSV header
        const header = ['Email', 'Password', 'Role', 'Group Assigned', 'Name'];
        const rows = [header.join(',')];

        // Process users
        users.forEach(user => {
            // Default password "123456" as known from previous reset
            const password = '123456';
            const name = `"${user.firstName || ''} ${user.lastName || ''}"`;
            const group = user.grupoAsignado || 'N/A';

            rows.push([
                user.email,
                password,
                user.role,
                group,
                name
            ].join(','));
        });

        const csvContent = rows.join('\n');
        const outputPath = path.resolve(process.cwd(), 'users_export.csv');

        fs.writeFileSync(outputPath, csvContent);
        console.log(`✅ Users exported successfully to: ${outputPath}`);
        console.log(`📊 Total users exported: ${users.length}`);

    } catch (error) {
        console.error('❌ Error fetching users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportUsers();
