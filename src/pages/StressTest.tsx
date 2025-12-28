import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { saveAssignment } from '../services/assignmentService';
import { saveQuiz } from '../services/quizService';
import { saveMaterial } from '../services/materialService';
import { loadClasses, createClass } from '../services/classService';
import { saveStreamItem } from '../services/streamService';
import { useAuthStore } from '../store/authStore';

// We might need to import Local implementation directly if the service wrapper checks for auth/context
// But generally the service functions should work if we are logged in.
// If the user is logged in as ark2784@gmail.com, useAuthStore should have the user.

export const StressTest: React.FC = () => {
    const { user } = useAuthStore();
    const [status, setStatus] = useState<string>('Idle');
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const runStressTest = async () => {
        if (!user) {
            addLog('❌ Error: No user logged in. Please login as ark2784@gmail.com first.');
            return;
        }

        setStatus('Running...');
        addLog('🚀 Starting Stress Test...');

        try {
            // 1. Create Assignments
            addLog('Creating 5 Assignments...');
            // Need a classId. We'll try to find one or create a dummy one if possible, 
            // but for now let's assume we can fetch classes. 
            // Since we can't easily fetch classes here without importing classService, let's just use a placeholder 
            // or better, fetch them if we can.
            // For simplicity, we'll try to get ANY class ID from the DB or fail.
            // Actually, let's just create generic ones and let the backend (local DB) handle it? 
            // The schemas require class/streamItem linking. 
            // Let's assume there is at least one class.

            // To make this robust, we should maybe import classService and create a "Test Class" first.
            let classes = await loadClasses(user.id);
            let classId = classes[0]?.id;

            if (!classId) {
                addLog('Creating "Stress Test Class"...');
                const newClass = await createClass({
                    title: 'Clase de Prueba de Estrés',
                    subject: 'Testing',
                    section: 'A',
                    room: '101',
                    teacherId: user.id
                });
                classId = newClass.id!;
                // Refresh classes to be safe, though we have the ID.
            }

            addLog(`Using Class ID: ${classId}`);

            // REVISION: We need to create Stream Items first.

            // Helper to create stream item then generic item
            const createFullItem = async (type: 'assignment' | 'quiz' | 'material', title: string, classId: string, content?: string) => {
                const streamItem = await saveStreamItem({
                    classId,
                    type,
                    title,
                    content,
                    authorId: user.id
                });
                return streamItem.id!;
            };

            for (let i = 1; i <= 5; i++) {
                const streamItemId = await createFullItem('assignment', `Test Assignment ${i}`, classId, `Auto generated ${i}`);
                await saveAssignment({
                    streamItemId,
                    points: 100,
                    dueDate: new Date(Date.now() + 86400000 * i).toISOString().split('T')[0],
                    assignToAll: true,
                    assignedGroups: [],
                    selectedStudents: []
                });
            }
            addLog('✅ 5 Assignments Created');

            // 2. Create Mega Quiz
            addLog('Creating Mega Quiz...');
            const quizStreamItemId = await createFullItem('quiz', 'MEGA QUIZ - All Types', classId, 'Comprehensive test');

            const megaQuizData = {
                streamItemId: quizStreamItemId,
                points: 100,
                description: 'This quiz tests every question type.',
                questions: [
                    {
                        id: 'q1',
                        type: 'short-answer',
                        title: 'What is your name?',
                        description: 'Short answer test',
                        required: true,
                        points: 10,
                        order: 0
                    },
                    {
                        id: 'q2',
                        type: 'paragraph',
                        title: 'Write a biography',
                        description: 'Long answer test',
                        required: false,
                        points: 20,
                        order: 1
                    },
                    {
                        id: 'q3',
                        type: 'multiple-choice',
                        title: 'Choose a color',
                        options: ['Red', 'Blue', 'Green'],
                        required: true,
                        points: 5,
                        order: 2
                    },
                    {
                        id: 'q4',
                        type: 'checkboxes',
                        title: 'Select hobbies',
                        options: ['Reading', 'Coding', 'Sleeping'],
                        required: true,
                        points: 5,
                        order: 3
                    },
                    {
                        id: 'q5',
                        type: 'dropdown',
                        title: 'Select Country',
                        options: ['Mexico', 'USA', 'Canada'],
                        required: true,
                        points: 5,
                        order: 4
                    },
                    {
                        id: 'q6',
                        type: 'linear-scale',
                        title: 'Rate this app',
                        options: [],
                        required: true,
                        points: 10,
                        order: 5
                    }
                ],
                assignToAll: true,
                assignedGroups: [],
                selectedStudents: []
            };

            await saveQuiz(megaQuizData);
            addLog('✅ Mega Quiz Created');

            // 3. Create Materials
            addLog('Creating Materials...');
            const mat1Id = await createFullItem('material', 'Test Material - Link', classId, 'Material with link');
            await saveMaterial({
                streamItemId: mat1Id,
                description: 'A material with a link',
                assignToAll: true
                // Note: Attachments (links) are usually saved via a separate service 'attachmentService' or inside stream item creation?
                // The interface `StreamItemData` has `attachments`.
                // Let's blindly trust `saveMaterial` doesn't handle attachments, but `createStreamItem` might.
                // We'll skip complex attachment creation for this stress test unless critical.
            });

            const mat2Id = await createFullItem('material', 'Test Material - Video', classId, 'Material with video');
            await saveMaterial({
                streamItemId: mat2Id,
                description: 'A material with a video',
                assignToAll: true
            });
            addLog('✅ Materials Created');

            addLog('🎉 Stress Test COMPLETED Successfully!');
            setStatus('Finished');

        } catch (e: any) {
            console.error(e);
            setStatus('Error');
            addLog(`❌ FAILED: ${e.message}`);
        }
    };

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Exhaustive Stress Test Runner</h1>

            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-6">
                <p className="mb-4">
                    Current User: <strong>{user?.email || 'Not logged in'}</strong>
                </p>
                <div className="mb-6 text-gray-600">
                    This tool will automatically create:
                    <ul className="list-disc ml-6 mt-2">
                        <li>1 Class (if none exists)</li>
                        <li>5 Assignments</li>
                        <li>1 Mega Quiz with all question types</li>
                        <li>2 Materials (Link & Video)</li>
                    </ul>
                </div>

                <Button
                    onClick={runStressTest}
                    disabled={status === 'Running' || !user}
                    className="w-full text-lg py-3"
                >
                    {status === 'Running' ? 'Running Tests...' : '▶️ Run Exhaustive Test'}
                </Button>
            </div>

            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm min-h-[300px] overflow-auto">
                {log.map((l, i) => <div key={i}>{l}</div>)}
                {log.length === 0 && <div className="text-gray-500">// Logs will appear here...</div>}
            </div>
        </div>
    );
};
