
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is missing from environment!");
        process.exit(1);
    }
    console.log("Database URL found (length: " + process.env.DATABASE_URL.length + ")");

    try {
        await prisma.$connect();
        console.log("✅ Connected to database via Prisma.");
    } catch (e) {
        console.error("❌ Failed to connect:", e);
        process.exit(1);
    }

    console.log('Reading logbook_schema_update.sql...');
    // Use process.cwd() as we are running from project root
    const sqlPath = path.join(process.cwd(), 'logbook_schema_update.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon to execute statements one by one
    const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0);

    console.log(`Found ${commands.length} commands to execute.`);

    for (const command of commands) {
        if (command.startsWith('--')) continue;

        // Simple truncation for display
        const displayCmd = command.length > 50 ? command.substring(0, 50) + '...' : command;
        console.log(`Executing: ${displayCmd}`);

        try {
            await prisma.$executeRawUnsafe(command);
            // Small delay to be nice to the DB
            await new Promise(r => setTimeout(r, 200));
        } catch (e: any) {
            console.error(`❌ Error executing command: \n${command}\nError: ${e.message}`);
        }
    }

    console.log('✅ Logbook schema migration completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
