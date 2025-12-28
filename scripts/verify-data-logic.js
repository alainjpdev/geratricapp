
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(__dirname, '../src/data/dummy-data.json');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const studentId = '091b48c3-3e13-49b0-ae5b-99e52d96c626'; // Aylar
const groupId = 'Tribu3';

console.log(`Checking for student ${studentId} in group ${groupId}`);

// 1. Get Student Classes
const classMembers = data.classMembers.filter(cm => cm.userId === studentId);
const classIds = new Set(classMembers.map(cm => cm.classId));
console.log(`Student is in ${classIds.size} classes:`, [...classIds]);

// 2. Get Assignments
const assignments = data.assignments.filter(a => !a.isDeleted);
const streamItems = data.streamItems.filter(si => si.type === 'assignment' && !si.isArchived);

// 3. Filter Logic
const relevantAssignments = assignments.filter(assignment => {
    const streamItem = streamItems.find(si => si.id === assignment.streamItemId);
    if (!streamItem) return false;

    // Class Check
    if (!classIds.has(streamItem.classId)) {
        return false;
    }

    // Include Check
    if (assignment.assignToAll) return true;
    if (assignment.assignedGroups && assignment.assignedGroups.includes(groupId)) return true;

    return false;
});

console.log(`Found ${relevantAssignments.length} visible assignments.`);

relevantAssignments.forEach(a => {
    const si = streamItems.find(s => s.id === a.streamItemId);
    const typeLabel = a.assignToAll ? 'ALL' : `GROUP (${a.assignedGroups})`;
    console.log(`- [${si.title}] (${typeLabel}) Class: ${si.classId}`);
});

// Check for assignments in student's classes that are NOT visible
console.log(`\n--- Checking for assignments in student's classes that are HIDDEN ---`);
for (const classId of classIds) {
    const classStreamItems = streamItems.filter(si => si.classId === classId);
    for (const si of classStreamItems) {
        const assignment = assignments.find(a => a.streamItemId === si.id);
        if (!assignment) continue;

        // Is it visible?
        const isVisible = relevantAssignments.some(ra => ra.id === assignment.id);
        if (!isVisible) {
            console.log(`HIDDEN in Class ${classId}: [${si.title}] (AssignToAll: ${assignment.assignToAll}, Groups: ${assignment.assignedGroups})`);
        }
    }
}

// Check Quizzes
console.log(`\n--- Checking Quizzes ---`);
const quizzes = data.quizzes || [];
const quizStreamItems = data.streamItems.filter(si => si.type === 'quiz' && !si.isArchived);

const relevantQuizzes = quizzes.filter(quiz => {
    const streamItem = quizStreamItems.find(si => si.id === quiz.streamItemId);
    if (!streamItem) return false;
    if (!classIds.has(streamItem.classId)) return false;

    if (quiz.assignToAll) return true;
    if (quiz.assignedGroups && quiz.assignedGroups.includes(groupId)) return true;
    return false;
});

console.log(`Found ${relevantQuizzes.length} visible quizzes.`);
relevantQuizzes.forEach(q => {
    const si = quizStreamItems.find(s => s.id === q.streamItemId);
    const typeLabel = q.assignToAll ? 'ALL' : `GROUP (${q.assignedGroups})`;
    console.log(`- [${si.title}] (${typeLabel}) Class: ${si.classId}`);
});
