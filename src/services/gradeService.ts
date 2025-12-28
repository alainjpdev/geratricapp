import { supabase } from '../config/supabaseClient';

export interface StudentGradeItem {
    id: string; // Assignment or Quiz ID
    title: string;
    type: 'assignment' | 'quiz';
    maxPoints: number;
    pointsEarned: number | null;
    status: string; // 'draft', 'submitted', 'reviewed', etc.
    dueDate?: string;
    submittedAt?: string;
    feedback?: string;
}

export const getStudentGrades = async (classId: string, studentId: string): Promise<StudentGradeItem[]> => {
    try {
        // 1. Fetch Assignments for the class
        const { data: assignments, error: assignError } = await supabase
            .from('assignments')
            .select(`
        id,
        points,
        due_date,
        stream_item:stream_items!inner(
            id,
            title, 
            class_id
        )
      `)
            .eq('stream_item.class_id', classId)
            .eq('is_deleted', false);

        if (assignError) throw assignError;

        // 2. Fetch Quizzes for the class
        const { data: quizzes, error: quizError } = await supabase
            .from('quizzes')
            .select(`
        id,
        points,
        due_date,
        stream_item:stream_items!inner(
            id,
            title,
            class_id
        )
      `)
            .eq('stream_item.class_id', classId);

        if (quizError) throw quizError;

        // 3. Fetch Assignment Submissions and Check Direct Assignment
        const assignmentIds = assignments?.map(a => a.id) || [];
        let assignmentSubmissions: any[] = [];
        let studentsAssigned: string[] = []; // List of assignment IDs explicitly assigned to this student

        if (assignmentIds.length > 0) {
            // Fetch submissions
            const { data: subs, error: subError } = await supabase
                .from('assignment_submissions')
                .select('assignment_id, grade, status, teacher_comments, submitted_at')
                .in('assignment_id', assignmentIds)
                .eq('student_id', studentId);

            if (subError) throw subError;
            assignmentSubmissions = subs || [];

            // Fetch explicit assignments (if any assume assign_to_all is false)
            const { data: explicitAssigns, error: explicitError } = await supabase
                .from('assignment_students')
                .select('assignment_id')
                .in('assignment_id', assignmentIds)
                .eq('student_id', studentId);

            if (explicitError) throw explicitError;
            studentsAssigned = explicitAssigns?.map((ea: any) => ea.assignment_id) || [];
        }

        // 4. Fetch Quiz Submissions and Check Direct Assignment
        const quizIds = quizzes?.map(q => q.id) || [];
        let quizSubmissions: any[] = [];
        let quizzesAssigned: string[] = [];

        if (quizIds.length > 0) {
            // Fetch submissions
            const { data: subs, error: subError } = await supabase
                .from('quiz_submissions')
                .select('quiz_id, grade, status, teacher_comments, submitted_at')
                .in('quiz_id', quizIds)
                .eq('student_id', studentId);

            if (subError) throw subError;
            quizSubmissions = subs || [];

            // Fetch explicit assignments
            const { data: explicitQuizzes, error: explicitQError } = await supabase
                .from('quiz_students')
                .select('quiz_id')
                .in('quiz_id', quizIds)
                .eq('student_id', studentId);

            if (explicitQError) throw explicitQError;
            quizzesAssigned = explicitQuizzes?.map((eq: any) => eq.quiz_id) || [];
        }

        // 5. Combine and Format
        const gradeItems: StudentGradeItem[] = [];

        // Process Assignments
        assignments?.forEach((assign: any) => {
            // Filter: Keep if assign_to_all OR explicitly assigned OR has a submission (edge case)
            if (assign.assign_to_all || studentsAssigned.includes(assign.id) || assignmentSubmissions.some(s => s.assignment_id === assign.id)) {
                const sub = assignmentSubmissions.find((s: any) => s.assignment_id === assign.id);
                gradeItems.push({
                    id: assign.id,
                    title: assign.stream_item?.title || 'Untitled Assignment',
                    type: 'assignment',
                    maxPoints: assign.points || 100, // Default to 100 if null, or handle as 0
                    pointsEarned: sub?.grade ? parseFloat(sub.grade) : null,
                    status: sub?.status || 'pending',
                    dueDate: assign.due_date,
                    submittedAt: sub?.submitted_at,
                    feedback: sub?.teacher_comments
                });
            }
        });

        // Process Quizzes
        quizzes?.forEach((quiz: any) => {
            // Filter: Keep if assign_to_all OR explicitly assigned OR has a submission
            if (quiz.assign_to_all || quizzesAssigned.includes(quiz.id) || quizSubmissions.some(s => s.quiz_id === quiz.id)) {
                const sub = quizSubmissions.find((s: any) => s.quiz_id === quiz.id);
                gradeItems.push({
                    id: quiz.id,
                    title: quiz.stream_item?.title || 'Untitled Quiz',
                    type: 'quiz',
                    maxPoints: quiz.points || 100,
                    pointsEarned: sub?.grade ? parseFloat(sub.grade) : null,
                    status: sub?.status || 'pending',
                    dueDate: quiz.due_date,
                    submittedAt: sub?.submitted_at,
                    feedback: sub?.teacher_comments
                });
            }
        });

        return gradeItems;

    } catch (error) {
        console.error('Error fetching student grades:', error);
        throw error;
    }
};
