import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Medical Data...');

    // Get Admin User for authoring
    const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' }
    });

    const nurseUser = await prisma.user.findFirst({
        where: { role: 'enfermero' }
    });

    if (!adminUser || !nurseUser) {
        console.error('❌ Users not found. Run create_admin_user.ts first.');
        return;
    }

    // Get Residents
    const residents = await prisma.resident.findMany();
    if (residents.length === 0) {
        console.error('❌ No residents found.');
        return;
    }

    // Common Recorder
    const recorderId = nurseUser.id;

    for (const resident of residents) {
        console.log(`Processing resident: ${resident.firstName} ${resident.lastName}`);

        // 1. Create Nursing Notes
        // Yesterday
        await prisma.nursingNote.create({
            data: {
                residentId: resident.id,
                authorId: recorderId,
                shift: 'Morning',
                category: 'General',
                content: 'Residente amaneció de buen humor. Desayunó completo.',
                severity: 'Low',
                createdAt: new Date(Date.now() - 86400000).toISOString() // Yesterday
            }
        });

        // Today Morning
        await prisma.nursingNote.create({
            data: {
                residentId: resident.id,
                authorId: recorderId,
                shift: 'Morning',
                category: 'Medical',
                content: 'Se administraron medicamentos matutinos sin incidentes.',
                severity: 'Low'
            }
        });

        // 2. Create Vital Signs (Last 3 days)
        for (let i = 0; i < 3; i++) {
            await prisma.vitalSign.create({
                data: {
                    residentId: resident.id,
                    recordedBy: recorderId,
                    recordedAt: new Date(Date.now() - (i * 86400000)).toISOString(),
                    bloodPressureSystolic: 120 + Math.floor(Math.random() * 20),
                    bloodPressureDiastolic: 70 + Math.floor(Math.random() * 10),
                    heartRate: 70 + Math.floor(Math.random() * 10),
                    temperature: 36.5 + (Math.random() * 0.5),
                    oxygenSaturation: 97 + Math.floor(Math.random() * 3),
                    glucose: 90 + Math.floor(Math.random() * 20),
                    weight: 70.0,
                    notes: 'Control rutinario'
                }
            });
        }
    }

    console.log('✅ Medical Data seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
