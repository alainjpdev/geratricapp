
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const prisma = new PrismaClient();

async function main() {
    const sqlPath = path.join(process.cwd(), 'disable_vitals_rls.sql');
    try {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Executing disable_vitals_rls.sql...');

        const commands = sql.split(';').map(c => c.trim()).filter(c => c.length > 0);
        for (const cmd of commands) {
            await prisma.$executeRawUnsafe(cmd);
        }
        console.log('✅ RLS disabled for vital_signs');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
