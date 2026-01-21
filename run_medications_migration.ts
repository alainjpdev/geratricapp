
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const prisma = new PrismaClient();

async function main() {
    const sqlPath = path.join(process.cwd(), 'create_medications.sql');
    try {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        console.log('Reading create_medications.sql...');

        // Split by semicolon but ignore ones inside comments (basic splitting)
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

        console.log(`Found ${commands.length} commands to execute.`);

        for (const cmd of commands) {
            console.log(`Executing: ${cmd.substring(0, 50)}...`);
            await prisma.$executeRawUnsafe(cmd);
        }
        console.log('✅ Successfully created medications table.');
    } catch (e: any) {
        console.error('❌ Error creating table:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
