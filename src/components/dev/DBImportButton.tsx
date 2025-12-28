/**
 * Componente para importar usuarios desde CSV a la base de datos local
 * Solo visible en modo desarrollo
 */

import { useState, useRef } from 'react';
import { localDB, LocalUser, LocalClass, LocalStreamItem, LocalAssignment, LocalQuiz, LocalMaterial, LocalAttachment, LocalClassMember, LocalAssignmentStudent, LocalQuizStudent, LocalMaterialStudent } from '../../db/localDB';
import bcrypt from 'bcryptjs';
import { Upload, Check, X, RefreshCw, FileJson } from 'lucide-react';
import { USE_LOCAL_DB } from '../../config/devMode';
import { supabase } from '../../config/supabaseClient';
import { loadDummyData, exportFromSupabase, exportDataToJSON } from '../../db/jsonDataLoader';

export const DBImportButton = () => {
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingJSON, setLoadingJSON] = useState(false);
  const [exportingJSON, setExportingJSON] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Solo mostrar en modo desarrollo con base local
  if (!USE_LOCAL_DB) {
    return null;
  }

  // Debug: verificar que el componente se renderiza
  console.log('🔧 DBImportButton renderizado - USE_LOCAL_DB:', USE_LOCAL_DB);

  const parseCSV = (content: string) => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');

    const emailIndex = headers.findIndex(h => h.includes('Email'));
    const nameIndex = headers.findIndex(h => h.includes('Name'));
    const rolIndex = headers.findIndex(h => h.includes('rol'));
    const grupoIndex = headers.findIndex(h => h.includes('GrupoAsignado'));

    const users = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length < emailIndex + 1) continue;

      const email = values[emailIndex] || '';
      const name = values[nameIndex] || '';
      const rol = values[rolIndex] || '';
      const grupo = values[grupoIndex] || '';

      if (!email || !email.includes('@')) {
        continue;
      }

      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Usuario';
      const lastName = nameParts.slice(1).join(' ') || 'Sin Apellido';

      let role: 'student' | 'teacher' | 'admin' | 'parent' = 'student';
      if (rol.toLowerCase() === 'admin') {
        role = 'admin';
      } else if (rol.toLowerCase() === 'teacher') {
        role = 'teacher';
      } else if (rol.toLowerCase() === 'student') {
        role = 'student';
      } else if (rol.toLowerCase() === 'parent') {
        role = 'parent';
      }

      users.push({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        grupoAsignado: grupo.trim() || null,
      });
    }

    return users;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const usersFromCsv = parseCSV(text);

      let imported = 0;
      let updated = 0;
      let errors = 0;

      for (const userData of usersFromCsv) {
        try {
          const emailPrefix = userData.email.split('@')[0];
          const password = `${emailPrefix}@2025!`;
          const hashedPassword = await bcrypt.hash(password, 10);

          const existingUser = await localDB.users
            .where('email')
            .equals(userData.email)
            .first();

          const userRecord = {
            id: existingUser?.id || crypto.randomUUID(),
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            passwordHash: hashedPassword,
            grupoAsignado: userData.grupoAsignado,
            isActive: true,
            createdAt: existingUser?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (existingUser) {
            await localDB.users.put(userRecord);
            updated++;
          } else {
            await localDB.users.add(userRecord);
            imported++;
          }
        } catch (error) {
          errors++;
          console.error(`Error procesando ${userData.email}:`, error);
        }
      }

      setMessage(`✅ Importados: ${imported}, Actualizados: ${updated}, Errores: ${errors}`);
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error importando:', error);
      setMessage('❌ Error al importar usuarios');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const syncFromSupabase = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      let synced = {
        users: 0,
        classes: 0,
        streamItems: 0,
        assignments: 0,
        quizzes: 0,
        materials: 0,
        attachments: 0,
        classMembers: 0,
        assignmentStudents: 0,
        assignmentSubmissions: 0,
        quizStudents: 0,
        quizQuestions: 0,
        quizSubmissions: 0,
        materialStudents: 0,
        topics: 0,
        grades: 0,
      };

      // 1. Sincronizar usuarios
      console.log('🔄 Sincronizando usuarios...');
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      if (users && users.length > 0) {
        for (const user of users) {
          const localUser: LocalUser = {
            id: user.id,
            email: user.email,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            role: user.role || 'student',
            avatar: user.avatar || undefined,
            passwordHash: user.password_hash || undefined,
            grupoAsignado: user.grupo_asignado || undefined,
            isActive: user.is_active !== false,
            createdAt: user.created_at || new Date().toISOString(),
            updatedAt: user.updated_at || new Date().toISOString(),
          };
          await localDB.users.put(localUser);
          synced.users++;
        }
      }

      // 2. Sincronizar clases
      console.log('🔄 Sincronizando clases...');
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*');

      if (classesError) throw classesError;

      if (classes && classes.length > 0) {
        for (const cls of classes) {
          const localClass: LocalClass = {
            id: cls.id,
            title: cls.title,
            description: cls.description || undefined,
            classCode: cls.class_code || '',
            section: cls.section || undefined,
            subject: cls.subject || undefined,
            room: cls.room || undefined,
            teacherId: cls.teacher_id,
            moduleId: cls.module_id || undefined,
            backgroundImage: cls.background_image || undefined,
            isArchived: cls.is_archived || false,
            status: cls.status || 'active',
            createdAt: cls.created_at || new Date().toISOString(),
            updatedAt: cls.updated_at || new Date().toISOString(),
          };
          await localDB.classes.put(localClass);
          synced.classes++;
        }
      }

      // 3. Sincronizar stream_items
      console.log('🔄 Sincronizando stream items...');
      const { data: streamItems, error: streamItemsError } = await supabase
        .from('stream_items')
        .select(`
          *,
          class:classes!stream_items_class_id_fkey(id, title)
        `);

      if (streamItemsError) throw streamItemsError;

      if (streamItems && streamItems.length > 0) {
        for (const item of streamItems) {
          // Obtener el nombre de la clase si existe
          const className = item.class?.title || undefined;

          const localStreamItem: LocalStreamItem = {
            id: item.id,
            classId: item.class_id,
            type: item.type,
            title: item.title,
            content: item.content || undefined,
            authorId: item.author_id,
            topicId: item.topic_id || undefined,
            className: className, // Incluir el nombre de la clase
            isArchived: item.is_archived || false,
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || new Date().toISOString(),
          };
          await localDB.streamItems.put(localStreamItem);
          synced.streamItems++;
        }
      }

      // 4. Sincronizar assignments
      console.log('🔄 Sincronizando assignments...');
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*');

      if (assignmentsError) throw assignmentsError;

      if (assignments && assignments.length > 0) {
        for (const assignment of assignments) {
          const localAssignment: LocalAssignment = {
            id: assignment.id,
            streamItemId: assignment.stream_item_id,
            points: assignment.points || undefined,
            dueDate: assignment.due_date || undefined,
            dueTime: assignment.due_time || undefined,
            instructions: assignment.instructions || undefined,
            assignToAll: assignment.assign_to_all || false,
            assignedGroups: assignment.assigned_groups || [],
            isDeleted: assignment.is_deleted || false,
            deletedAt: assignment.deleted_at || undefined,
            createdAt: assignment.created_at || new Date().toISOString(),
            updatedAt: assignment.updated_at || new Date().toISOString(),
          };
          await localDB.assignments.put(localAssignment);
          synced.assignments++;
        }
      }

      // 5. Sincronizar quizzes
      console.log('🔄 Sincronizando quizzes...');
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*');

      if (quizzesError) throw quizzesError;

      if (quizzes && quizzes.length > 0) {
        for (const quiz of quizzes) {
          const localQuiz: LocalQuiz = {
            id: quiz.id,
            streamItemId: quiz.stream_item_id,
            description: quiz.description || undefined,
            points: quiz.points || undefined,
            dueDate: quiz.due_date || undefined,
            dueTime: quiz.due_time || undefined,
            assignToAll: quiz.assign_to_all || false,
            assignedGroups: quiz.assigned_groups || [],
            createdAt: quiz.created_at || new Date().toISOString(),
            updatedAt: quiz.updated_at || new Date().toISOString(),
          };
          await localDB.quizzes.put(localQuiz);
          synced.quizzes++;
        }
      }

      // 6. Sincronizar materials
      console.log('🔄 Sincronizando materials...');
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('*');

      if (materialsError) throw materialsError;

      if (materials && materials.length > 0) {
        for (const material of materials) {
          const localMaterial: LocalMaterial = {
            id: material.id,
            streamItemId: material.stream_item_id,
            description: material.description || undefined,
            assignToAll: material.assign_to_all || false,
            createdAt: material.created_at || new Date().toISOString(),
            updatedAt: material.updated_at || new Date().toISOString(),
          };
          await localDB.materials.put(localMaterial);
          synced.materials++;
        }
      }

      // 7. Sincronizar attachments
      console.log('🔄 Sincronizando attachments...');
      const { data: attachments, error: attachmentsError } = await supabase
        .from('attachments')
        .select('*');

      if (attachmentsError) throw attachmentsError;

      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const localAttachment: LocalAttachment = {
            id: attachment.id,
            streamItemId: attachment.stream_item_id,
            type: attachment.type,
            name: attachment.name,
            url: attachment.url || undefined,
            filePath: attachment.file_path || undefined,
            fileSize: attachment.file_size || undefined,
            mimeType: attachment.mime_type || undefined,
            order: attachment.order || 0,
            createdAt: attachment.created_at || new Date().toISOString(),
          };
          await localDB.attachments.put(localAttachment);
          synced.attachments++;
        }
      }

      // 8. Sincronizar class_members
      console.log('🔄 Sincronizando class members...');
      const { data: classMembers, error: classMembersError } = await supabase
        .from('class_members')
        .select('*');

      if (classMembersError) throw classMembersError;

      if (classMembers && classMembers.length > 0) {
        for (const member of classMembers) {
          const localMember: LocalClassMember = {
            id: member.id,
            classId: member.class_id,
            userId: member.user_id,
            role: member.role || 'student',
            joinedAt: member.joined_at || new Date().toISOString(),
            status: member.status || 'active',
          };
          await localDB.classMembers.put(localMember);
          synced.classMembers++;
        }
      }

      // 9. Sincronizar assignment_students
      console.log('🔄 Sincronizando assignment students...');
      const { data: assignmentStudents, error: assignmentStudentsError } = await supabase
        .from('assignment_students')
        .select('*');

      if (assignmentStudentsError) throw assignmentStudentsError;

      if (assignmentStudents && assignmentStudents.length > 0) {
        for (const as of assignmentStudents) {
          const localAS: LocalAssignmentStudent = {
            id: as.id,
            assignmentId: as.assignment_id,
            studentId: as.student_id,
          };
          await localDB.assignmentStudents.put(localAS);
          synced.assignmentStudents++;
        }
      }

      // 10. Sincronizar quiz_students
      console.log('🔄 Sincronizando quiz students...');
      const { data: quizStudents, error: quizStudentsError } = await supabase
        .from('quiz_students')
        .select('*');

      if (quizStudentsError) throw quizStudentsError;

      if (quizStudents && quizStudents.length > 0) {
        for (const qs of quizStudents) {
          const localQS: LocalQuizStudent = {
            id: qs.id,
            quizId: qs.quiz_id,
            studentId: qs.student_id,
          };
          await localDB.quizStudents.put(localQS);
          synced.quizStudents++;
        }
      }

      // 11. Sincronizar material_students
      console.log('🔄 Sincronizando material students...');
      const { data: materialStudents, error: materialStudentsError } = await supabase
        .from('material_students')
        .select('*');

      if (materialStudentsError) throw materialStudentsError;

      if (materialStudents && materialStudents.length > 0) {
        for (const ms of materialStudents) {
          const localMS: LocalMaterialStudent = {
            id: ms.id,
            materialId: ms.material_id,
            studentId: ms.student_id,
          };
          await localDB.materialStudents.put(localMS);
          synced.materialStudents++;
        }
      }

      setMessage(`✅ Sincronizado: ${synced.users} usuarios, ${synced.classes} clases, ${synced.streamItems} stream items, ${synced.assignments} assignments, ${synced.quizzes} quizzes, ${synced.materials} materials`);
      setTimeout(() => setMessage(null), 8000);
    } catch (error: any) {
      console.error('Error sincronizando desde Supabase:', error);
      setMessage(`❌ Error: ${error.message || 'Error al sincronizar'}`);
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadJSON = async () => {
    setLoadingJSON(true);
    setMessage(null);

    try {
      await loadDummyData();
      setMessage('✅ Datos cargados desde dummy-data.json');
      setTimeout(() => {
        setMessage(null);
        window.location.reload(); // Recargar para ver los cambios
      }, 2000);
    } catch (error: any) {
      console.error('Error cargando JSON:', error);
      setMessage(`❌ Error: ${error.message || 'Error al cargar datos desde JSON'}`);
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoadingJSON(false);
    }
  };

  const handleExportToJSON = async (fromSupabase: boolean = false) => {
    setExportingJSON(true);
    setMessage(null);

    try {
      let data: any;

      if (fromSupabase) {
        data = await exportFromSupabase();
        setMessage('✅ Datos exportados desde Supabase');
      } else {
        data = await exportDataToJSON();
        setMessage('✅ Datos exportados desde IndexedDB local');
      }

      // Descargar como archivo
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dummy-data-${fromSupabase ? 'supabase' : 'local'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error exportando JSON:', error);
      setMessage(`❌ Error: ${error.message || 'Error al exportar datos'}`);
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setExportingJSON(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-yellow-100 border border-yellow-400 rounded-lg p-3 shadow-lg">
      <div className="text-xs font-semibold text-yellow-800 mb-2">
        🔧 Modo Desarrollo - Base Local
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={handleLoadJSON}
          disabled={loadingJSON || syncing || importing || exportingJSON}
          className="flex items-center justify-center gap-1 px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 disabled:opacity-50"
        >
          <FileJson className={`w-3 h-3 ${loadingJSON ? 'animate-spin' : ''}`} />
          {loadingJSON ? 'Cargando...' : 'Cargar desde JSON'}
        </button>
        <button
          onClick={() => handleExportToJSON(false)}
          disabled={exportingJSON || syncing || importing || loadingJSON}
          className="flex items-center justify-center gap-1 px-3 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600 disabled:opacity-50"
        >
          <FileJson className={`w-3 h-3 ${exportingJSON ? 'animate-spin' : ''}`} />
          {exportingJSON ? 'Exportando...' : 'Exportar Local → JSON'}
        </button>
        <button
          onClick={() => handleExportToJSON(true)}
          disabled={exportingJSON || syncing || importing || loadingJSON}
          className="flex items-center justify-center gap-1 px-3 py-1 bg-teal-500 text-white text-xs rounded hover:bg-teal-600 disabled:opacity-50"
        >
          <FileJson className={`w-3 h-3 ${exportingJSON ? 'animate-spin' : ''}`} />
          {exportingJSON ? 'Exportando...' : 'Exportar Supabase → JSON'}
        </button>
        <label className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 cursor-pointer disabled:opacity-50">
          <Upload className="w-3 h-3" />
          {importing ? 'Importando...' : 'Importar CSV'}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={importing || syncing || loadingJSON}
            className="hidden"
          />
        </label>
        <button
          onClick={syncFromSupabase}
          disabled={syncing || importing || loadingJSON}
          className="flex items-center justify-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar desde Supabase'}
        </button>
      </div>
      {message && (
        <div className="mt-2 text-xs text-yellow-800 flex items-center gap-1">
          {message.startsWith('✅') ? (
            <Check className="w-3 h-3" />
          ) : (
            <X className="w-3 h-3" />
          )}
          {message}
        </div>
      )}
    </div>
  );
};

