/**
 * Panel de pruebas para verificar que todas las funciones de la base de datos local funcionan
 * Solo visible en modo desarrollo
 */

import { useState } from 'react';
import { localDB } from '../../db/localDB';
import * as localAuthService from '../../services/localAuthService';
import * as localClassService from '../../services/localClassService';
import * as localStreamService from '../../services/localStreamService';
import * as localAssignmentService from '../../services/localAssignmentService';
import * as localQuizService from '../../services/localQuizService';
import * as localMaterialService from '../../services/localMaterialService';
import { localUserService } from '../../services/localUserService';
import bcrypt from 'bcryptjs';
import { USE_LOCAL_DB } from '../../config/devMode';
import { Check, X, Play, Loader } from 'lucide-react';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export const DBTestPanel = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<{ passed: number; failed: number } | null>(null);

  // Solo mostrar en modo desarrollo con base local
  if (!USE_LOCAL_DB) {
    return null;
  }

  const test = async (name: string, fn: () => Promise<void>): Promise<TestResult> => {
    try {
      await fn();
      return { name, passed: true };
    } catch (error: any) {
      return { name, passed: false, error: error.message || String(error) };
    }
  };

  const runTests = async () => {
    setRunning(true);
    setResults([]);
    setSummary(null);

    const testResults: TestResult[] = [];
    let testUserId = '';
    let testClassId = '';
    let testStreamItemId = '';
    let testAssignmentStreamItemId = '';
    let testQuizStreamItemId = '';
    let testMaterialStreamItemId = '';

    try {
      // TEST 1: Usuarios
      testResults.push(
        await test('1.1 Crear usuario de prueba', async () => {
          const password = 'test123';
          const hashedPassword = await bcrypt.hash(password, 10);
          const user = await localAuthService.saveUserToLocalDB({
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'admin',
            passwordHash: hashedPassword,
            isActive: true,
          });
          testUserId = user.id;
          if (!testUserId) throw new Error('Usuario no creado');
        })
      );

      testResults.push(
        await test('1.2 Login con usuario', async () => {
          const result = await localAuthService.loginWithLocalDB('test@example.com', 'test123');
          if (!result.user || result.user.email !== 'test@example.com') {
            throw new Error('Login fallido');
          }
        })
      );

      testResults.push(
        await test('1.3 Obtener usuario por ID', async () => {
          const user = await localUserService.getUserById(testUserId);
          if (!user || user.email !== 'test@example.com') {
            throw new Error('Usuario no encontrado');
          }
        })
      );

      testResults.push(
        await test('1.4 Obtener todos los estudiantes', async () => {
          const students = await localUserService.getAllStudents();
          if (!Array.isArray(students)) {
            throw new Error('No retorna un array');
          }
        })
      );

      testResults.push(
        await test('1.5 Obtener grupos disponibles', async () => {
          const groups = await localUserService.getAllGroups();
          if (!Array.isArray(groups)) {
            throw new Error('No retorna un array');
          }
        })
      );

      // TEST 2: Clases
      testResults.push(
        await test('2.1 Crear clase', async () => {
          const classData = {
            title: 'Clase de Prueba',
            description: 'Descripción de prueba',
            subject: 'Matemáticas',
            teacherId: testUserId,
          };
          const created = await localClassService.createClassLocal(classData);
          testClassId = created.id;
          if (!testClassId) throw new Error('Clase no creada');
        })
      );

      testResults.push(
        await test('2.2 Cargar clase por ID', async () => {
          const cls = await localClassService.loadClassLocal(testClassId);
          if (!cls || cls.id !== testClassId) {
            throw new Error('Clase no encontrada');
          }
        })
      );

      testResults.push(
        await test('2.3 Cargar todas las clases', async () => {
          const classes = await localClassService.loadClassesLocal(testUserId, true);
          if (!Array.isArray(classes) || classes.length === 0) {
            throw new Error('No se encontraron clases');
          }
        })
      );

      testResults.push(
        await test('2.4 Actualizar clase', async () => {
          const updated = await localClassService.updateClassLocal(testClassId, {
            title: 'Clase Actualizada',
          });
          if (updated.title !== 'Clase Actualizada') {
            throw new Error('Clase no actualizada');
          }
        })
      );

      testResults.push(
        await test('2.5 Archivar clase', async () => {
          await localClassService.archiveClassLocal(testClassId);
          const cls = await localClassService.loadClassLocal(testClassId);
          if (!cls || !cls.isArchived) {
            throw new Error('Clase no archivada');
          }
        })
      );

      testResults.push(
        await test('2.6 Desarchivar clase', async () => {
          await localClassService.unarchiveClassLocal(testClassId);
          const cls = await localClassService.loadClassLocal(testClassId);
          if (!cls || cls.isArchived) {
            throw new Error('Clase no desarchivada');
          }
        })
      );

      // TEST 3: Stream Items
      testResults.push(
        await test('3.1 Crear stream item (announcement)', async () => {
          const streamItem = await localStreamService.saveStreamItemLocal({
            classId: testClassId,
            type: 'announcement',
            title: 'Anuncio de Prueba',
            content: 'Contenido del anuncio',
            authorId: testUserId,
          });
          testStreamItemId = streamItem.id;
          if (!testStreamItemId) throw new Error('Stream item no creado');
        })
      );

      testResults.push(
        await test('3.2 Cargar stream items', async () => {
          const items = await localStreamService.loadStreamItemsLocal(testClassId, false);
          if (!Array.isArray(items) || items.length === 0) {
            throw new Error('No se encontraron stream items');
          }
        })
      );

      testResults.push(
        await test('3.3 Actualizar stream item', async () => {
          const updated = await localStreamService.updateStreamItemLocal(testStreamItemId, {
            title: 'Anuncio Actualizado',
          });
          if (updated.title !== 'Anuncio Actualizado') {
            throw new Error('Stream item no actualizado');
          }
        })
      );

      testResults.push(
        await test('3.4 Archivar stream item', async () => {
          await localStreamService.archiveStreamItemLocal(testStreamItemId);
          const items = await localStreamService.loadStreamItemsLocal(testClassId, false);
          const archived = items.find(item => item.id === testStreamItemId);
          if (archived) {
            throw new Error('Stream item no archivado (aún aparece en lista)');
          }
        })
      );

      testResults.push(
        await test('3.5 Cargar stream items archivados', async () => {
          const archived = await localStreamService.loadArchivedStreamItemsLocal('announcement');
          if (!Array.isArray(archived) || archived.length === 0) {
            throw new Error('No se encontraron stream items archivados');
          }
        })
      );

      testResults.push(
        await test('3.6 Desarchivar stream item', async () => {
          await localStreamService.unarchiveStreamItemLocal(testStreamItemId);
          const items = await localStreamService.loadStreamItemsLocal(testClassId, false);
          const found = items.find(item => item.id === testStreamItemId);
          if (!found) {
            throw new Error('Stream item no desarchivado');
          }
        })
      );

      // TEST 4: Assignments
      testResults.push(
        await test('4.1 Crear stream item para assignment', async () => {
          const streamItem = await localStreamService.saveStreamItemLocal({
            classId: testClassId,
            type: 'assignment',
            title: 'Assignment de Prueba',
            content: 'Instrucciones del assignment',
            authorId: testUserId,
          });
          testAssignmentStreamItemId = streamItem.id;
          if (!testAssignmentStreamItemId) throw new Error('Stream item no creado');
        })
      );

      testResults.push(
        await test('4.2 Guardar assignment', async () => {
          await localAssignmentService.saveAssignmentLocal({
            streamItemId: testAssignmentStreamItemId,
            points: 100,
            dueDate: '2025-12-31',
            instructions: 'Instrucciones de prueba',
            assignToAll: true,
          });
        })
      );

      testResults.push(
        await test('4.3 Obtener assignment por stream item ID', async () => {
          const assignment = await localAssignmentService.getAssignmentByStreamItemIdLocal(
            testAssignmentStreamItemId
          );
          if (!assignment || assignment.points !== 100) {
            throw new Error('Assignment no encontrado o datos incorrectos');
          }
        })
      );

      testResults.push(
        await test('4.4 Obtener todos los assignments', async () => {
          const assignments = await localAssignmentService.getAllAssignmentsLocal();
          if (!Array.isArray(assignments)) {
            throw new Error('No retorna un array');
          }
        })
      );

      testResults.push(
        await test('4.5 Obtener assignments por clase', async () => {
          const assignments = await localAssignmentService.getAssignmentsByClassLocal(
            testClassId,
            false
          );
          if (!Array.isArray(assignments)) {
            throw new Error('No retorna un array');
          }
        })
      );

      testResults.push(
        await test('4.6 Archivar assignment', async () => {
          await localAssignmentService.archiveAssignmentLocal(testAssignmentStreamItemId);
          const assignment = await localAssignmentService.getAssignmentByStreamItemIdLocal(
            testAssignmentStreamItemId
          );
          if (!assignment || !assignment.isArchived) {
            throw new Error('Assignment no archivado');
          }
        })
      );

      // TEST 5: Quizzes
      testResults.push(
        await test('5.1 Crear stream item para quiz', async () => {
          const streamItem = await localStreamService.saveStreamItemLocal({
            classId: testClassId,
            type: 'quiz',
            title: 'Quiz de Prueba',
            authorId: testUserId,
          });
          testQuizStreamItemId = streamItem.id;
          if (!testQuizStreamItemId) throw new Error('Stream item no creado');
        })
      );

      testResults.push(
        await test('5.2 Guardar quiz', async () => {
          await localQuizService.saveQuizLocal({
            streamItemId: testQuizStreamItemId,
            points: 50,
            description: 'Descripción del quiz',
            assignToAll: true,
            questions: [
              {
                title: 'Pregunta 1',
                type: 'multiple-choice',
                required: true,
                points: 10,
                options: ['Opción 1', 'Opción 2'],
              },
            ],
          });
        })
      );

      testResults.push(
        await test('5.3 Obtener quiz por stream item ID', async () => {
          const quiz = await localQuizService.getQuizByStreamItemIdLocal(testQuizStreamItemId);
          if (!quiz || quiz.points !== 50) {
            throw new Error('Quiz no encontrado o datos incorrectos');
          }
        })
      );

      testResults.push(
        await test('5.4 Obtener todos los quizzes', async () => {
          const quizzes = await localQuizService.getAllQuizzesLocal();
          if (!Array.isArray(quizzes)) {
            throw new Error('No retorna un array');
          }
        })
      );

      testResults.push(
        await test('5.5 Obtener quizzes por clase', async () => {
          const quizzes = await localQuizService.getQuizzesByClassLocal(testClassId, false);
          if (!Array.isArray(quizzes)) {
            throw new Error('No retorna un array');
          }
        })
      );

      // TEST 6: Materials
      testResults.push(
        await test('6.1 Crear stream item para material', async () => {
          const streamItem = await localStreamService.saveStreamItemLocal({
            classId: testClassId,
            type: 'material',
            title: 'Material de Prueba',
            authorId: testUserId,
          });
          testMaterialStreamItemId = streamItem.id;
          if (!testMaterialStreamItemId) throw new Error('Stream item no creado');
        })
      );

      testResults.push(
        await test('6.2 Guardar material', async () => {
          await localMaterialService.saveMaterialLocal({
            streamItemId: testMaterialStreamItemId,
            description: 'Descripción del material',
            assignToAll: true,
          });
        })
      );

      testResults.push(
        await test('6.3 Obtener material por stream item ID', async () => {
          const material = await localMaterialService.getMaterialByStreamItemIdLocal(
            testMaterialStreamItemId
          );
          if (!material) {
            throw new Error('Material no encontrado');
          }
        })
      );

      testResults.push(
        await test('6.4 Obtener todos los materials', async () => {
          const materials = await localMaterialService.getAllMaterialsLocal();
          if (!Array.isArray(materials)) {
            throw new Error('No retorna un array');
          }
        })
      );

      testResults.push(
        await test('6.5 Obtener materials por clase', async () => {
          const materials = await localMaterialService.getMaterialsByClassLocal(testClassId, false);
          if (!Array.isArray(materials)) {
            throw new Error('No retorna un array');
          }
        })
      );

      // Limpieza
      testResults.push(
        await test('7.1 Eliminar clase', async () => {
          await localClassService.deleteClassLocal(testClassId);
          const cls = await localClassService.loadClassLocal(testClassId);
          if (cls) {
            throw new Error('Clase no eliminada');
          }
        })
      );

      testResults.push(
        await test('7.2 Eliminar stream item', async () => {
          await localStreamService.deleteStreamItemLocal(testStreamItemId);
        })
      );

    } catch (error: any) {
      testResults.push({
        name: 'Error fatal',
        passed: false,
        error: error.message || String(error),
      });
    }

    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.filter(r => !r.passed).length;

    setResults(testResults);
    setSummary({ passed, failed });
    setRunning(false);
  };

  return (
    <div className="hidden fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🧪 Pruebas de Base Local</h3>
        <button
          onClick={runTests}
          disabled={running}
          className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Ejecutando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Ejecutar Pruebas
            </>
          )}
        </button>
      </div>

      {summary && (
        <div className={`mb-4 p-3 rounded ${summary.failed === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <div className="text-sm font-medium">
            ✅ Exitosas: {summary.passed} | ❌ Fallidas: {summary.failed}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Total: {summary.passed + summary.failed} pruebas
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-2 rounded text-sm ${
                result.passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              <div className="flex items-start gap-2">
                {result.passed ? (
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{result.name}</div>
                  {result.error && (
                    <div className="text-xs mt-1 opacity-75">{result.error}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !running && (
        <div className="text-sm text-gray-500 text-center py-4">
          Haz clic en "Ejecutar Pruebas" para comenzar
        </div>
      )}
    </div>
  );
};

