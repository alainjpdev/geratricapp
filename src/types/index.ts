export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'enfermero' | 'paciente' | 'pariente';
  avatar?: string;
  grupoAsignado?: string;
  createdAt: string;
  hours?: number;
  fontSize?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  setUser: (user: User) => void;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'enfermero' | 'paciente' | 'pariente';
}

export interface Class {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName: string;
  schedule: string;
  students: number;
  maxStudents: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  classId: string;
  className: string;
  isVisible: boolean;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  url: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  prerequisites: string[];
  learningObjectives: string[];
  tags: string[];
  thumbnail?: string;
  instructor: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isPublished: boolean;
  order: number;
  resources: {
    videos: string[];
    documents: string[];
    links: string[];
  };
  assignments: Assignment[];
  quizzes: {
    id: string;
    title: string;
    questions: number;
    passingScore: number;
  }[];
}

export interface QuotationItem {
  productId: string;
  code: string;
  title: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationName: string;
  clientName: string;
  projectName: string;
  total: number;
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'amount';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
  validUntil: string;
  items: QuotationItem[];
  createdById: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateQuotationData {
  quotationName: string;
  clientName: string;
  projectName: string;
  total: number;
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'amount';
  validUntil?: string;
  items: QuotationItem[];
}

export interface Medication {
  id: string;
  residentId: string;
  date: string;
  medicamento: string;
  dosis: string;
  via: string;
  observacion: string;
  dose1Time?: string;
  dose2Time?: string;
  dose3Time?: string;
  dose4Time?: string;
  recordedBy?: string;
}