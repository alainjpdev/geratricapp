
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBackendLogic() {
    console.log('🚀 Starting Backend Logic Test...');

    let testClassId: string | null = null;
    let assignmentId: string | null = null;
    let quizId: string | null = null;

    try {
        // 1. Get a test user (author)
        // We look for 'ark2784@gmail.com' as the admin/teacher
        const author = await prisma.user.findUnique({
            where: { email: 'ark2784@gmail.com' }
        });

        if (!author) {
            console.error('❌ Test aborted: User ark2784@gmail.com not found.');
            return;
        }
        console.log(`✅ User found: ${author.email} (${author.id})`);

        // 2. Create a Test Class
        console.log('📦 Creating Test Class...');
        const newClass = await prisma.class.create({
            data: {
                title: 'Test Class Automation',
                classCode: 'TEST-' + Math.random().toString(36).substring(7).toUpperCase(),
                teacherId: author.id,
                description: 'Class created by automated backend test',
                status: 'active'
            }
        });
        testClassId = newClass.id;
        console.log(`✅ Class created: ${newClass.title} (${newClass.id})`);

        // 3. Create an Assignment
        console.log('📝 Creating Assignment...');
        // Assignments are linked to StreamItems. So we must create StreamItem first OR use nested create.
        // The schema shows: StreamItem has one Assignment.

        const assignmentStreamItem = await prisma.streamItem.create({
            data: {
                classId: newClass.id,
                authorId: author.id,
                title: 'Test Assignment',
                type: 'assignment',
                content: 'Instructions for test assignment',
                assignment: {
                    create: {
                        points: 100,
                        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Due in 7 days
                        instructions: 'Complete this test assignment',
                        assignToAll: true
                    }
                }
            },
            include: {
                assignment: true
            }
        });

        if (assignmentStreamItem.assignment) {
            assignmentId = assignmentStreamItem.assignment.id;
            console.log(`✅ Assignment created: ${assignmentStreamItem.title} (${assignmentStreamItem.assignment.id})`);
        } else {
            throw new Error('Assignment relation creation failed');
        }

        // 4. Create a Quiz
        console.log('🧠 Creating Quiz...');
        const quizStreamItem = await prisma.streamItem.create({
            data: {
                classId: newClass.id,
                authorId: author.id,
                title: 'Test Quiz',
                type: 'quiz',
                content: 'Test Quiz Description around here',
                quiz: {
                    create: {
                        points: 50,
                        description: 'A simple test quiz',
                        questions: {
                            create: [
                                {
                                    title: 'What is 2+2?',
                                    type: 'multiple_choice',
                                    points: 10,
                                    options: JSON.stringify(['3', '4', '5']),
                                    correctAnswer: JSON.stringify('4')
                                }
                            ]
                        }
                    }
                }
            },
            include: {
                quiz: {
                    include: {
                        questions: true
                    }
                }
            }
        });

        if (quizStreamItem.quiz) {
            quizId = quizStreamItem.quiz.id;
            console.log(`✅ Quiz created: ${quizStreamItem.title} (${quizStreamItem.quiz.id}) with ${quizStreamItem.quiz.questions.length} questions.`);
        } else {
            throw new Error('Quiz relation creation failed');
        }

        // 5. Create Material
        console.log('📚 Creating Material...');
        const materialStreamItem = await prisma.streamItem.create({
            data: {
                classId: newClass.id,
                authorId: author.id,
                title: 'Test Material',
                type: 'material',
                content: 'Read this test material',
                material: {
                    create: {
                        description: 'Reference docs for test',
                        assignToAll: true
                    }
                }
            },
            include: {
                material: true
            }
        });
        console.log(`✅ Material created: ${materialStreamItem.title} (${materialStreamItem.material?.id})`);

        console.log('\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        // Cleanup
        if (testClassId) {
            console.log('\n🧹 Cleaning up test data...');
            try {
                // Deleting the class should cascade delete stream items, assignments, etc.
                // based on 'onDelete: Cascade' in schema. Let's verify schema first. 
                // schema.prisma says:
                // ClassMember -> onDelete Cascade
                // Topic -> onDelete Cascade
                // StreamItem -> DOES NOT have explicit onDelete cascade from Class in the 'Class' relation definition?
                // Let's check: 
                // model StreamItem { ... class Class? @relation(fields: [classId], references: [id]) ... }
                // It does NOT say onDelete: Cascade in StreamItem.
                // But usually stream items are critical.
                // If I delete class, will stream items hang?
                // Wait, let's look at schema again. 
                // StreamItem -> @relation(fields: [classId], references: [id]) -- NO CASCADE.

                // So I should delete stream items first.

                console.log('Deleting stream items for class...');
                await prisma.streamItem.deleteMany({
                    where: { classId: testClassId }
                });

                console.log('Deleting class...');
                await prisma.class.delete({
                    where: { id: testClassId }
                });
                console.log('✅ Cleanup complete.');
            } catch (cleanupError) {
                console.error('⚠️ Error during cleanup:', cleanupError);
            }
        }
        await prisma.$disconnect();
    }
}

testBackendLogic();
