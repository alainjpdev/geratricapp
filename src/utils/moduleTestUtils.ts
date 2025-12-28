import { Module } from '../types';
import { testModules, createTestModule } from '../data/testModules';

// Función para mostrar información completa de un módulo
export const displayModuleInfo = (module: Module): void => {
  console.log('=== INFORMACIÓN COMPLETA DEL MÓDULO ===');
  console.log(`ID: ${module.id}`);
  console.log(`Título: ${module.title}`);
  console.log(`Descripción: ${module.description}`);
  console.log(`URL: ${module.url}`);
  console.log(`Progreso: ${module.progress}%`);
  console.log(`Lecciones: ${module.completedLessons}/${module.totalLessons}`);
  console.log(`Categoría: ${module.category}`);
  console.log(`Dificultad: ${module.difficulty}`);
  console.log(`Duración: ${module.duration} minutos (${Math.round(module.duration / 60)} horas)`);
  console.log(`Instructor: ${module.instructor}`);
  console.log(`Creado: ${new Date(module.createdAt).toLocaleDateString()}`);
  console.log(`Actualizado: ${new Date(module.updatedAt).toLocaleDateString()}`);
  console.log(`Activo: ${module.isActive ? 'Sí' : 'No'}`);
  console.log(`Publicado: ${module.isPublished ? 'Sí' : 'No'}`);
  console.log(`Orden: ${module.order}`);
  
  console.log('\n=== PREREQUISITOS ===');
  module.prerequisites.forEach((prereq, index) => {
    console.log(`${index + 1}. ${prereq}`);
  });
  
  console.log('\n=== OBJETIVOS DE APRENDIZAJE ===');
  module.learningObjectives.forEach((objective, index) => {
    console.log(`${index + 1}. ${objective}`);
  });
  
  console.log('\n=== ETIQUETAS ===');
  console.log(module.tags.join(', '));
  
  console.log('\n=== RECURSOS ===');
  console.log('Videos:');
  module.resources.videos.forEach((video, index) => {
    console.log(`  ${index + 1}. ${video}`);
  });
  
  console.log('Documentos:');
  module.resources.documents.forEach((doc, index) => {
    console.log(`  ${index + 1}. ${doc}`);
  });
  
  console.log('Enlaces:');
  module.resources.links.forEach((link, index) => {
    console.log(`  ${index + 1}. ${link}`);
  });
  
  console.log('\n=== TAREAS ===');
  module.assignments.forEach((assignment, index) => {
    console.log(`${index + 1}. ${assignment.title}`);
    console.log(`   Descripción: ${assignment.description}`);
    console.log(`   Fecha límite: ${new Date(assignment.dueDate).toLocaleDateString()}`);
    console.log(`   Estado: ${assignment.status}`);
    console.log(`   Clase: ${assignment.className}`);
  });
  
  console.log('\n=== QUIZZES ===');
  module.quizzes.forEach((quiz, index) => {
    console.log(`${index + 1}. ${quiz.title}`);
    console.log(`   Preguntas: ${quiz.questions}`);
    console.log(`   Puntuación mínima: ${quiz.passingScore}%`);
  });
  
  console.log('\n=====================================\n');
};

// Función para filtrar módulos por criterios
export const filterModules = (
  modules: Module[],
  criteria: {
    category?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    instructor?: string;
    isActive?: boolean;
    isPublished?: boolean;
    minDuration?: number;
    maxDuration?: number;
  }
): Module[] => {
  return modules.filter(module => {
    if (criteria.category && module.category !== criteria.category) return false;
    if (criteria.difficulty && module.difficulty !== criteria.difficulty) return false;
    if (criteria.instructor && module.instructor !== criteria.instructor) return false;
    if (criteria.isActive !== undefined && module.isActive !== criteria.isActive) return false;
    if (criteria.isPublished !== undefined && module.isPublished !== criteria.isPublished) return false;
    if (criteria.minDuration && module.duration < criteria.minDuration) return false;
    if (criteria.maxDuration && module.duration > criteria.maxDuration) return false;
    return true;
  });
};

// Función para buscar módulos por texto
export const searchModules = (modules: Module[], searchTerm: string): Module[] => {
  const term = searchTerm.toLowerCase();
  return modules.filter(module => 
    module.title.toLowerCase().includes(term) ||
    module.description.toLowerCase().includes(term) ||
    module.category.toLowerCase().includes(term) ||
    module.tags.some(tag => tag.toLowerCase().includes(term)) ||
    module.instructor.toLowerCase().includes(term)
  );
};

// Función para obtener estadísticas de módulos
export const getModuleStats = (modules: Module[]) => {
  const stats = {
    total: modules.length,
    byCategory: {} as { [key: string]: number },
    byDifficulty: {} as { [key: string]: number },
    byInstructor: {} as { [key: string]: number },
    totalDuration: 0,
    averageDuration: 0,
    activeModules: 0,
    publishedModules: 0
  };

  modules.forEach(module => {
    // Por categoría
    stats.byCategory[module.category] = (stats.byCategory[module.category] || 0) + 1;
    
    // Por dificultad
    stats.byDifficulty[module.difficulty] = (stats.byDifficulty[module.difficulty] || 0) + 1;
    
    // Por instructor
    stats.byInstructor[module.instructor] = (stats.byInstructor[module.instructor] || 0) + 1;
    
    // Duración total
    stats.totalDuration += module.duration;
    
    // Módulos activos/publicados
    if (module.isActive) stats.activeModules++;
    if (module.isPublished) stats.publishedModules++;
  });

  stats.averageDuration = Math.round(stats.totalDuration / modules.length);

  return stats;
};

// Función para probar todos los módulos
export const testAllModules = (): void => {
  console.log('🧪 PROBANDO MÓDULOS DE PRUEBA\n');
  
  // Mostrar todos los módulos
  console.log('📚 MÓDULOS DISPONIBLES:');
  testModules.forEach((module, index) => {
    console.log(`${index + 1}. ${module.title} (${module.difficulty})`);
  });
  
  console.log('\n📊 ESTADÍSTICAS:');
  const stats = getModuleStats(testModules);
  console.log(`Total de módulos: ${stats.total}`);
  console.log(`Duración total: ${Math.round(stats.totalDuration / 60)} horas`);
  console.log(`Duración promedio: ${Math.round(stats.averageDuration / 60)} horas`);
  console.log(`Módulos activos: ${stats.activeModules}`);
  console.log(`Módulos publicados: ${stats.publishedModules}`);
  
  console.log('\n📈 POR CATEGORÍA:');
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} módulos`);
  });
  
  console.log('\n🎯 POR DIFICULTAD:');
  Object.entries(stats.byDifficulty).forEach(([difficulty, count]) => {
    console.log(`  ${difficulty}: ${count} módulos`);
  });
  
  console.log('\n👨‍🏫 POR INSTRUCTOR:');
  Object.entries(stats.byInstructor).forEach(([instructor, count]) => {
    console.log(`  ${instructor}: ${count} módulos`);
  });
  
  // Crear un módulo de prueba dinámico
  console.log('\n🆕 CREANDO MÓDULO DE PRUEBA DINÁMICO:');
  const newModule = createTestModule();
  displayModuleInfo(newModule);
  
  // Ejemplos de filtrado
  console.log('\n🔍 EJEMPLOS DE FILTRADO:');
  
  const beginnerModules = filterModules(testModules, { difficulty: 'beginner' });
  console.log(`Módulos para principiantes: ${beginnerModules.length}`);
  
  const frontendModules = filterModules(testModules, { category: 'Frontend Development' });
  console.log(`Módulos de Frontend: ${frontendModules.length}`);
  
  const activeModules = filterModules(testModules, { isActive: true });
  console.log(`Módulos activos: ${activeModules.length}`);
  
  // Ejemplos de búsqueda
  console.log('\n🔎 EJEMPLOS DE BÚSQUEDA:');
  
  const reactModules = searchModules(testModules, 'react');
  console.log(`Módulos que contienen "react": ${reactModules.length}`);
  
  const pythonModules = searchModules(testModules, 'python');
  console.log(`Módulos que contienen "python": ${pythonModules.length}`);
};

// Exportar funciones para uso en otros archivos
export {
  testModules,
  createTestModule
};
