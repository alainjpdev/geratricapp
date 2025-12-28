import { Module } from '../types';

export const testModules: Module[] = [
  {
    id: 'mod-001',
    title: 'Introducción a React y TypeScript',
    description: 'Aprende los fundamentos de React con TypeScript desde cero. Este módulo cubre componentes, hooks, props, estado y las mejores prácticas de desarrollo.',
    url: 'https://react-typescript-course.example.com',
    progress: 0,
    totalLessons: 12,
    completedLessons: 0,
    category: 'Frontend Development',
    difficulty: 'beginner',
    duration: 480, // 8 horas
    prerequisites: [
      'Conocimientos básicos de JavaScript',
      'HTML y CSS fundamentales',
      'Conceptos básicos de programación'
    ],
    learningObjectives: [
      'Crear componentes React funcionales',
      'Usar hooks para manejar estado',
      'Implementar TypeScript en React',
      'Construir aplicaciones SPA',
      'Manejar props y eventos'
    ],
    tags: ['React', 'TypeScript', 'JavaScript', 'Frontend', 'SPA'],
    thumbnail: '/images/react-course-thumb.jpg',
    instructor: 'Dr. María González',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    isActive: true,
    isPublished: true,
    order: 1,
    resources: {
      videos: [
        'https://youtube.com/watch?v=react-intro',
        'https://youtube.com/watch?v=typescript-basics',
        'https://youtube.com/watch?v=react-hooks'
      ],
      documents: [
        'https://docs.example.com/react-guide.pdf',
        'https://docs.example.com/typescript-handbook.pdf'
      ],
      links: [
        'https://react.dev',
        'https://typescriptlang.org',
        'https://create-react-app.dev'
      ]
    },
    assignments: [
      {
        id: 'assign-001',
        title: 'Crear tu primer componente',
        description: 'Crea un componente React que muestre información personal',
        dueDate: '2024-02-15T23:59:59Z',
        status: 'pending',
        classId: 'class-001',
        className: 'React Fundamentals'
      }
    ],
    quizzes: [
      {
        id: 'quiz-001',
        title: 'Fundamentos de React',
        questions: 15,
        passingScore: 70
      },
      {
        id: 'quiz-002',
        title: 'TypeScript en React',
        questions: 10,
        passingScore: 80
      }
    ]
  },
  {
    id: 'mod-002',
    title: 'Desarrollo Full Stack con Node.js',
    description: 'Aprende a construir aplicaciones completas con Node.js, Express, MongoDB y React. Incluye autenticación, APIs REST y despliegue.',
    url: 'https://fullstack-nodejs-course.example.com',
    progress: 0,
    totalLessons: 20,
    completedLessons: 0,
    category: 'Full Stack Development',
    difficulty: 'intermediate',
    duration: 1200, // 20 horas
    prerequisites: [
      'JavaScript avanzado',
      'React básico',
      'Conocimientos de bases de datos',
      'Git y control de versiones'
    ],
    learningObjectives: [
      'Crear APIs REST con Express',
      'Implementar autenticación JWT',
      'Conectar con bases de datos MongoDB',
      'Desarrollar aplicaciones full stack',
      'Desplegar aplicaciones en producción'
    ],
    tags: ['Node.js', 'Express', 'MongoDB', 'Full Stack', 'API', 'JWT'],
    thumbnail: '/images/nodejs-course-thumb.jpg',
    instructor: 'Ing. Carlos Mendoza',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-25T16:45:00Z',
    isActive: true,
    isPublished: true,
    order: 2,
    resources: {
      videos: [
        'https://youtube.com/watch?v=nodejs-intro',
        'https://youtube.com/watch?v=express-api',
        'https://youtube.com/watch?v=mongodb-basics'
      ],
      documents: [
        'https://docs.example.com/nodejs-guide.pdf',
        'https://docs.example.com/express-tutorial.pdf',
        'https://docs.example.com/mongodb-handbook.pdf'
      ],
      links: [
        'https://nodejs.org',
        'https://expressjs.com',
        'https://mongodb.com',
        'https://jwt.io'
      ]
    },
    assignments: [
      {
        id: 'assign-002',
        title: 'API REST para e-commerce',
        description: 'Desarrolla una API completa para un sistema de e-commerce',
        dueDate: '2024-03-01T23:59:59Z',
        status: 'pending',
        classId: 'class-002',
        className: 'Full Stack Development'
      }
    ],
    quizzes: [
      {
        id: 'quiz-003',
        title: 'Node.js y Express',
        questions: 20,
        passingScore: 75
      },
      {
        id: 'quiz-004',
        title: 'MongoDB y Mongoose',
        questions: 12,
        passingScore: 80
      }
    ]
  },
  {
    id: 'mod-003',
    title: 'Machine Learning con Python',
    description: 'Introducción práctica al Machine Learning usando Python, scikit-learn, pandas y TensorFlow. Incluye proyectos reales y casos de uso.',
    url: 'https://ml-python-course.example.com',
    progress: 0,
    totalLessons: 25,
    completedLessons: 0,
    category: 'Data Science',
    difficulty: 'advanced',
    duration: 1500, // 25 horas
    prerequisites: [
      'Python intermedio',
      'Matemáticas básicas (álgebra, estadística)',
      'Conocimientos de programación orientada a objetos',
      'Experiencia con Jupyter Notebooks'
    ],
    learningObjectives: [
      'Implementar algoritmos de ML',
      'Preprocesar datos efectivamente',
      'Entrenar modelos de clasificación y regresión',
      'Evaluar rendimiento de modelos',
      'Desplegar modelos en producción'
    ],
    tags: ['Python', 'Machine Learning', 'Data Science', 'TensorFlow', 'scikit-learn', 'Pandas'],
    thumbnail: '/images/ml-course-thumb.jpg',
    instructor: 'Dra. Ana Rodríguez',
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-30T12:15:00Z',
    isActive: true,
    isPublished: true,
    order: 3,
    resources: {
      videos: [
        'https://youtube.com/watch?v=ml-intro',
        'https://youtube.com/watch?v=tensorflow-basics',
        'https://youtube.com/watch?v=scikit-learn'
      ],
      documents: [
        'https://docs.example.com/ml-handbook.pdf',
        'https://docs.example.com/python-data-science.pdf',
        'https://docs.example.com/tensorflow-guide.pdf'
      ],
      links: [
        'https://scikit-learn.org',
        'https://tensorflow.org',
        'https://pandas.pydata.org',
        'https://jupyter.org'
      ]
    },
    assignments: [
      {
        id: 'assign-003',
        title: 'Sistema de recomendación',
        description: 'Desarrolla un sistema de recomendación para una plataforma de streaming',
        dueDate: '2024-03-15T23:59:59Z',
        status: 'pending',
        classId: 'class-003',
        className: 'Machine Learning'
      }
    ],
    quizzes: [
      {
        id: 'quiz-005',
        title: 'Fundamentos de ML',
        questions: 25,
        passingScore: 80
      },
      {
        id: 'quiz-006',
        title: 'TensorFlow y Deep Learning',
        questions: 18,
        passingScore: 85
      }
    ]
  }
];

export const createTestModule = (): Module => {
  return {
    id: `mod-${Date.now()}`,
    title: 'Módulo de Prueba Generado',
    description: 'Este es un módulo de prueba creado automáticamente con todos los atributos completos para testing.',
    url: 'https://test-module.example.com',
    progress: 0,
    totalLessons: 8,
    completedLessons: 0,
    category: 'Testing',
    difficulty: 'beginner',
    duration: 240, // 4 horas
    prerequisites: [
      'Conocimientos básicos de programación',
      'Interés en aprender'
    ],
    learningObjectives: [
      'Entender la estructura de módulos',
      'Practicar con datos de ejemplo',
      'Validar funcionalidades del sistema'
    ],
    tags: ['Test', 'Example', 'Demo', 'Learning'],
    thumbnail: '/images/test-module-thumb.jpg',
    instructor: 'Sistema Automático',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    isPublished: true,
    order: 999,
    resources: {
      videos: [
        'https://youtube.com/watch?v=test-video-1',
        'https://youtube.com/watch?v=test-video-2'
      ],
      documents: [
        'https://docs.example.com/test-guide.pdf'
      ],
      links: [
        'https://example.com/test-resources'
      ]
    },
    assignments: [
      {
        id: `assign-${Date.now()}`,
        title: 'Tarea de Prueba',
        description: 'Esta es una tarea de prueba para validar el sistema',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días desde ahora
        status: 'pending',
        classId: 'test-class',
        className: 'Clase de Prueba'
      }
    ],
    quizzes: [
      {
        id: `quiz-${Date.now()}`,
        title: 'Quiz de Prueba',
        questions: 5,
        passingScore: 60
      }
    ]
  };
};
