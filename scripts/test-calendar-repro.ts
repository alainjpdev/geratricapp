
import { jsonDB } from '../src/db/jsonDatabase.js';
import { getAssignmentsForStudentJSON } from '../src/services/jsonAssignmentService.js';
import { getQuizzesForStudentJSON } from '../src/services/jsonQuizService.js';
import { jsonUserService } from '../src/services/jsonUserService.js';

async function test() {
    await jsonDB.initialize();

    // Find a student with a group
    // Aylar, Tribu3
    const studentId = '091b48c3-3e13-49b0-ae5b-99e52d96c626';
    const groupId = 'Tribu3'; // user.grupoAsignado

    console.log(`Testing for student: ${studentId} (Group: ${groupId})`);

    // Check Classes
    const classMembers = jsonDB.getClassMembers().filter(cm => cm.userId === studentId);
    const classIds = classMembers.map(cm => cm.classId);
    console.log(`Student is member of ${classIds.length} classes:`, classIds);

    // Check Assignments
    const assignments = await getAssignmentsForStudentJSON(studentId, groupId);
    console.log(`found ${assignments.length} assignments`);

    const assignToAllCount = assignments.filter(a => a.assignToAll).length;
    const groupCount = assignments.filter(a => !a.assignToAll && a.assignedGroups.includes(groupId)).length;
    console.log(`- AssignToAll: ${assignToAllCount}`);
    console.log(`- Group Assigned: ${groupCount}`);
    console.log(`- Other/Individual: ${assignments.length - assignToAllCount - groupCount}`);

    // Inspect raw assignments for one of the classes the student IS in
    if (classIds.length > 0) {
        const classId = classIds[0];
        console.log(`\nInspecting assignments for class ${classId}:`);
        const streamItems = jsonDB.getStreamItems().filter(si => si.classId === classId && si.type === 'assignment');
        for (const si of streamItems) {
            const a = jsonDB.getAssignmentByStreamItemId(si.id);
            if (a) {
                const visible = assignments.find(ua => ua.id === a.id);
                console.log(`- [${si.title}] AssignToAll: ${a.assignToAll}, Groups: ${a.assignedGroups}, Visible: ${!!visible}`);
            }
        }
    }

    // Check Quizzes
    try {
        const quizzes = await getQuizzesForStudentJSON(studentId, groupId);
        console.log(`\nfound ${quizzes.length} quizzes`);
        // ... same checks
    } catch (e: any) {
        console.log("Quiz check failed:", e.message);
    }
}

test().catch(console.error);
