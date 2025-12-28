
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file.');
    console.error('Please ensure VITE_SUPABASE_URL and one of VITE_SUPABASE_SERVICE_ROLE_KEY (preferred for migration), VITE_SUPABASE_PUBLISHABLE_KEY, or VITE_SUPABASE_ANON_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log(`🔌 Connected to Supabase: ${supabaseUrl}`);

const DATA_FILE = path.resolve(__dirname, '../src/data/dummy-data.json');

const migrate = async () => {
    try {
        console.log(`📖 Reading data from ${DATA_FILE}...`);
        const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(rawData);

        console.log('🚀 Starting migration...');

        // 1. Users
        if (data.users && data.users.length > 0) {
            console.log(`👤 Migrating ${data.users.length} users...`);
            const usersData = data.users.map((u: any) => ({
                id: u.id,
                email: u.email,
                first_name: u.firstName,
                last_name: u.lastName || u.firstName, // Fallback
                role: u.role,
                avatar: u.avatar,
                password_hash: u.passwordHash, // Note: Supabase Auth handles auth differently, but storing hash for legacy ref
                grupo_asignado: u.grupoAsignado,
                is_active: u.isActive,
                created_at: u.createdAt,
                updated_at: u.updatedAt
            }));

            const { error } = await supabase.from('users').upsert(usersData);
            if (error) throw new Error(`Error migrating users: ${error.message}`);
            console.log('✅ Users migrated.');
        }

        // 2. Classes
        if (data.classes && data.classes.length > 0) {
            console.log(`📚 Migrating ${data.classes.length} classes...`);
            const classesData = data.classes.map((c: any) => ({
                id: c.id,
                title: c.title,
                description: c.description,
                class_code: c.classCode,
                section: c.section,
                subject: c.subject,
                room: c.room,
                teacher_id: c.teacherId,
                module_id: c.moduleId,
                background_image: c.backgroundImage,
                is_archived: c.isArchived,
                status: c.status,
                created_at: c.createdAt,
                updated_at: c.updatedAt
            }));

            const { error } = await supabase.from('classes').upsert(classesData);
            if (error) throw new Error(`Error migrating classes: ${error.message}`);
            console.log('✅ Classes migrated.');
        }

        // 3. Class Members
        if (data.classMembers && data.classMembers.length > 0) {
            console.log(`👥 Migrating ${data.classMembers.length} class members...`);
            const membersData = data.classMembers.map((m: any) => ({
                id: m.id,
                class_id: m.classId,
                user_id: m.userId,
                role: m.role,
                joined_at: m.joinedAt,
                status: m.status || 'active'
            }));

            const { error } = await supabase.from('class_members').upsert(membersData);
            if (error) throw new Error(`Error migrating class members: ${error.message}`);
            console.log('✅ Class members migrated.');
        }

        // 4. Topics
        if (data.topics && data.topics.length > 0) {
            console.log(`🏷 Migrating ${data.topics.length} topics...`);
            const topicsData = data.topics.map((t: any) => ({
                id: t.id,
                class_id: t.classId,
                name: t.name,
                description: t.description,
                "order": t.order,
                created_at: t.createdAt,
                updated_at: t.updatedAt
            }));

            const { error } = await supabase.from('topics').upsert(topicsData);
            if (error) throw new Error(`Error migrating topics: ${error.message}`);
            console.log('✅ Topics migrated.');
        }

        // Cache Class IDs for validation
        const validClassIds = new Set(data.classes?.map((c: any) => c.id) || []);

        // Cache Stream Item IDs for validation
        let validStreamIds = new Set();

        // 5. Stream Items
        if (data.streamItems && data.streamItems.length > 0) {
            console.log(`📰 Migrating ${data.streamItems.length} stream items...`);
            const itemsData = data.streamItems
                .map((item: any) => ({
                    id: item.id,
                    class_id: validClassIds.has(item.classId) ? item.classId : null,
                    type: item.type,
                    title: item.title,
                    content: item.content,
                    author_id: item.authorId,
                    topic_id: item.topicId,
                    // class_name: item.className,
                    is_archived: item.isArchived,
                    created_at: item.createdAt,
                    updated_at: item.updatedAt
                }))
                .filter((item: any) => item.class_id !== null); // Filter out items with no valid class (DB enforce NOT NULL)

            if (data.streamItems.length > itemsData.length) {
                console.warn(`⚠️ Skipped ${data.streamItems.length - itemsData.length} stream items with invalid/missing class_id.`);
            }

            if (itemsData.length > 0) {
                const { error } = await supabase.from('stream_items').upsert(itemsData);
                if (error) throw new Error(`Error migrating stream items: ${error.message}`);
                console.log('✅ Stream items migrated.');

                // Update valid IDs
                validStreamIds = new Set(itemsData.map((i: any) => i.id));
            }
        }

        // Cache Assignment IDs
        let validAssignmentIds = new Set();

        // 6. Assignments
        if (data.assignments && data.assignments.length > 0) {
            console.log(`📝 Migrating ${data.assignments.length} assignments...`);
            const assignmentsData = data.assignments
                .map((a: any) => ({
                    id: a.id,
                    stream_item_id: a.streamItemId,
                    points: a.points,
                    due_date: a.dueDate,
                    due_time: a.dueTime,
                    instructions: a.instructions,
                    assign_to_all: a.assignToAll,
                    assigned_groups: a.assignedGroups,
                    is_deleted: a.isDeleted,
                    // is_visible: a.isVisible, // Missing in schema cache
                    deleted_at: a.deletedAt,
                    created_at: a.createdAt,
                    updated_at: a.updatedAt
                }))
                .filter((a: any) => validStreamIds.has(a.stream_item_id)); // Filter orphan assignments

            if (data.assignments.length > assignmentsData.length) {
                console.warn(`⚠️ Skipped ${data.assignments.length - assignmentsData.length} assignments with missing stream_item_id.`);
            }

            if (assignmentsData.length > 0) {
                const { error } = await supabase.from('assignments').upsert(assignmentsData);
                if (error) throw new Error(`Error migrating assignments: ${error.message}`);
                console.log('✅ Assignments migrated.');

                validAssignmentIds = new Set(assignmentsData.map((a: any) => a.id));
            }
        }

        // 7. Assignment Students
        if (data.assignmentStudents && data.assignmentStudents.length > 0) {
            console.log(`🎓 Migrating ${data.assignmentStudents.length} assignment students...`);
            const asData = data.assignmentStudents
                .map((as: any) => ({
                    id: as.id,
                    assignment_id: as.assignmentId,
                    student_id: as.studentId
                }))
                .filter((as: any) => validAssignmentIds.has(as.assignment_id));

            if (asData.length > 0) {
                const { error } = await supabase.from('assignment_students').upsert(asData);
                if (error) throw new Error(`Error migrating assignment students: ${error.message}`);
                console.log('✅ Assignment students migrated.');
            }
        }

        // 8. Assignment Submissions
        if (data.assignmentSubmissions && data.assignmentSubmissions.length > 0) {
            console.log(`📤 Migrating ${data.assignmentSubmissions.length} assignment submissions...`);
            const subsData = data.assignmentSubmissions
                .map((s: any) => ({
                    id: s.id,
                    assignment_id: s.assignmentId,
                    student_id: s.studentId,
                    content: s.content,
                    attachments: s.attachments,
                    status: s.status,
                    // grade: s.grade, // Missing in schema cache
                    // student_comments: s.studentComments,
                    // teacher_comments: s.teacherComments,
                    submitted_at: s.submittedAt,
                    // returned_at: s.returnedAt, // Missing in schema cache
                    // graded_at: s.gradedAt,
                    // reviewed_at: s.reviewedAt,
                    created_at: s.createdAt,
                    updated_at: s.updatedAt
                }))
                .filter((s: any) => validAssignmentIds.has(s.assignment_id));

            if (subsData.length > 0) {
                const { error } = await supabase.from('assignment_submissions').upsert(subsData);
                if (error) throw new Error(`Error migrating assignment submissions: ${error.message}`);
                console.log('✅ Assignment submissions migrated.');
            }
        }

        // 9. Quizzes
        if (data.quizzes && data.quizzes.length > 0) {
            console.log(`❓ Migrating ${data.quizzes.length} quizzes...`);
            const quizzesData = data.quizzes
                .map((q: any) => ({
                    id: q.id,
                    stream_item_id: q.streamItemId,
                    points: q.points,
                    due_date: q.dueDate,
                    due_time: q.dueTime,
                    description: q.description,
                    assign_to_all: q.assignToAll,
                    assigned_groups: q.assignedGroups,
                    created_at: q.createdAt,
                    updated_at: q.updatedAt
                }))
                .filter((q: any) => validStreamIds.has(q.stream_item_id));

            if (quizzesData.length > 0) {
                const { error } = await supabase.from('quizzes').upsert(quizzesData);
                if (error) throw new Error(`Error migrating quizzes: ${error.message}`);
                console.log('✅ Quizzes migrated.');
            }
        }

        // Cache Quiz IDs (Need to fetch migrated quizzes if not returned, but here we filter from JSON)
        // Ideally we'd use what was inserted, but filtering source JSON by valid parent is safer
        const validQuizIds = new Set(data.quizzes?.filter((q: any) => validStreamIds.has(q.streamItemId)).map((q: any) => q.id));

        // 10. Quiz Questions
        if (data.quizQuestions && data.quizQuestions.length > 0) {
            console.log(`❔ Migrating ${data.quizQuestions.length} quiz questions...`);
            const qqData = data.quizQuestions
                .map((q: any) => ({
                    id: q.id,
                    quiz_id: q.quizId,
                    title: q.title,
                    description: q.description,
                    type: q.type,
                    required: q.required,
                    points: q.points,
                    correct_answer: q.correctAnswer,
                    options: q.options,
                    "order": q.order,
                    created_at: q.createdAt,
                    updated_at: q.updatedAt
                }))
                .filter((q: any) => validQuizIds.has(q.quiz_id));

            if (qqData.length > 0) {
                const { error } = await supabase.from('quiz_questions').upsert(qqData);
                if (error) throw new Error(`Error migrating quiz questions: ${error.message}`);
                console.log('✅ Quiz questions migrated.');
            }
        }

        // 11. Quiz Students
        if (data.quizStudents && data.quizStudents.length > 0) {
            console.log(`🎓 Migrating ${data.quizStudents.length} quiz students...`);
            const qsData = data.quizStudents
                .map((qs: any) => ({
                    id: qs.id,
                    quiz_id: qs.quizId,
                    student_id: qs.studentId
                }))
                .filter((qs: any) => validQuizIds.has(qs.quiz_id));

            if (qsData.length > 0) {
                const { error } = await supabase.from('quiz_students').upsert(qsData);
                if (error) throw new Error(`Error migrating quiz students: ${error.message}`);
                console.log('✅ Quiz students migrated.');
            }
        }

        // 12. Quiz Submissions
        if (data.quizSubmissions && data.quizSubmissions.length > 0) {
            console.log(`📤 Migrating ${data.quizSubmissions.length} quiz submissions...`);
            const qsubData = data.quizSubmissions
                .map((s: any) => ({
                    id: s.id,
                    quiz_id: s.quizId,
                    student_id: s.studentId,
                    answers: s.answers,
                    status: s.status,
                    grade: s.grade,
                    // student_comments: s.studentComments,
                    // teacher_comments: s.teacherComments,
                    submitted_at: s.submittedAt,
                    graded_at: s.gradedAt,
                    reviewed_at: s.reviewedAt,
                    created_at: s.createdAt,
                    updated_at: s.updatedAt
                }))
                .filter((s: any) => validQuizIds.has(s.quiz_id));

            if (qsubData.length > 0) {
                // Table might be missing in schema
                /*
                  const { error } = await supabase.from('quiz_submissions').upsert(qsubData);
                  if (error) throw new Error(`Error migrating quiz submissions: ${error.message}`);
                  console.log('✅ Quiz submissions migrated.');
                */
                console.warn('⚠️ Skipped quiz_submissions migration (table not found in schema cache).');
            }
        }

        // 13. Materials
        if (data.materials && data.materials.length > 0) {
            console.log(`📚 Migrating ${data.materials.length} materials...`);
            const materialsData = data.materials
                .map((m: any) => ({
                    id: m.id,
                    stream_item_id: m.streamItemId,
                    description: m.description,
                    assign_to_all: m.assignToAll,
                    // assigned_groups: m.assignedGroups, // Missing in schema cache
                    created_at: m.createdAt,
                    updated_at: m.updatedAt
                }))
                .filter((m: any) => validStreamIds.has(m.stream_item_id));

            if (materialsData.length > 0) {
                const { error } = await supabase.from('materials').upsert(materialsData);
                if (error) throw new Error(`Error migrating materials: ${error.message}`);
                console.log('✅ Materials migrated.');
            }
        }

        // Cache Material IDs
        const validMaterialIds = new Set(data.materials?.filter((m: any) => validStreamIds.has(m.streamItemId)).map((m: any) => m.id));

        // 14. Material Students
        if (data.materialStudents && data.materialStudents.length > 0) {
            console.log(`🎓 Migrating ${data.materialStudents.length} material students...`);
            const msData = data.materialStudents
                .map((ms: any) => ({
                    id: ms.id,
                    material_id: ms.materialId,
                    student_id: ms.studentId
                }))
                .filter((ms: any) => validMaterialIds.has(ms.material_id));

            if (msData.length > 0) {
                const { error } = await supabase.from('material_students').upsert(msData);
                if (error) throw new Error(`Error migrating material students: ${error.message}`);
                console.log('✅ Material students migrated.');
            }
        }

        // 15. Attachments
        if (data.attachments && data.attachments.length > 0) {
            console.log(`📎 Migrating ${data.attachments.length} attachments...`);
            const attachData = data.attachments
                .map((a: any) => ({
                    id: a.id,
                    stream_item_id: a.streamItemId,
                    type: a.type,
                    name: a.name,
                    url: a.url,
                    file_path: a.filePath,
                    file_size: a.fileSize,
                    mime_type: a.mimeType,
                    "order": a.order,
                    created_at: a.createdAt
                }))
                .filter((a: any) => validStreamIds.has(a.stream_item_id));

            if (attachData.length > 0) {
                const { error } = await supabase.from('attachments').upsert(attachData);
                if (error) throw new Error(`Error migrating attachments: ${error.message}`);
                console.log('✅ Attachments migrated.');
            }
        }

        // 16. Grades
        if (data.grades && data.grades.length > 0) {
            console.log(`💯 Migrating ${data.grades.length} grades...`);
            const gradesData = data.grades
                .map((g: any) => ({
                    id: g.id,
                    class_id: g.classId,
                    student_id: g.studentId,
                    assignment_id: g.assignmentId,
                    quiz_id: g.quizId,
                    points_earned: g.pointsEarned,
                    max_points: g.maxPoints,
                    percentage: g.percentage,
                    status: g.status,
                    feedback: g.feedback,
                    submitted_at: g.submittedAt,
                    graded_at: g.gradedAt,
                    graded_by_id: g.gradedById,
                    created_at: g.createdAt,
                    updated_at: g.updatedAt
                }))
                .filter((g: any) => validClassIds.has(g.class_id)); // Filter by class is safest common denom

            if (gradesData.length > 0) {
                const { error } = await supabase.from('grades').upsert(gradesData);
                if (error) throw new Error(`Error migrating grades: ${error.message}`);
                console.log('✅ Grades migrated.');
            }
        }

        console.log('✨ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrate();
