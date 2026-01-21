
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const prisma = new PrismaClient();

async function main() {
    const sqlPath = path.join(process.cwd(), 'disable_all_rls.sql');
    try {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        console.log('Reading disable_all_rls.sql...');

        // Split by semicolon and newlines to get individual commands
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

        console.log(`Found ${commands.length} commands to execute.`);

        for (const cmd of commands) {
            try {
                // simple log to avoid huge output
                console.log(`Executing partial: ${cmd.substring(0, 40)}...`);
                await prisma.$executeRawUnsafe(cmd);
            } catch (e: any) {
                console.log(`Warning/Error on command: ${e.message}`);
                // Continue despite errors (e.g. table not found)
            }
        }
        console.log('✅ RLS disabled for all available tables.');
    } catch (error) {
        console.error('❌ Critical Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
