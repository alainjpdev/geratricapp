-- Enable UUID extension (useful for generating new IDs if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE public.users (
    id TEXT PRIMARY KEY, -- Changed to TEXT to support legacy IDs
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin', 'parent')),
    avatar TEXT,
    password_hash TEXT,
    grupo_asignado TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Classes Table
CREATE TABLE public.classes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    class_code TEXT NOT NULL,
    section TEXT,
    subject TEXT,
    room TEXT,
    teacher_id TEXT NOT NULL REFERENCES public.users(id),
    module_id TEXT,
    background_image TEXT,
    is_archived BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Class Members Table
CREATE TABLE public.class_members (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    UNIQUE(class_id, user_id)
);

-- 4. Topics Table
CREATE TABLE public.topics (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Stream Items Table
CREATE TABLE public.stream_items (
    id TEXT PRIMARY KEY,
    class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('announcement', 'assignment', 'quiz', 'material')),
    title TEXT NOT NULL,
    content TEXT,
    author_id TEXT NOT NULL REFERENCES public.users(id),
    topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
    class_name TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Assignments Table
CREATE TABLE public.assignments (
    id TEXT PRIMARY KEY,
    stream_item_id TEXT NOT NULL REFERENCES public.stream_items(id) ON DELETE CASCADE,
    points INTEGER,
    due_date TIMESTAMP WITH TIME ZONE,
    due_time TEXT,
    instructions TEXT,
    assign_to_all BOOLEAN DEFAULT true,
    assigned_groups TEXT[],
    is_deleted BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Assignment Students
CREATE TABLE public.assignment_students (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    UNIQUE(assignment_id, student_id)
);

-- 8. Assignment Submissions
CREATE TABLE public.assignment_submissions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT,
    attachments JSONB,
    status TEXT NOT NULL DEFAULT 'draft',
    grade DECIMAL,
    student_comments TEXT,
    teacher_comments TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- 9. Quizzes Table
CREATE TABLE public.quizzes (
    id TEXT PRIMARY KEY,
    stream_item_id TEXT NOT NULL REFERENCES public.stream_items(id) ON DELETE CASCADE,
    points INTEGER,
    due_date TIMESTAMP WITH TIME ZONE,
    due_time TEXT,
    description TEXT,
    assign_to_all BOOLEAN DEFAULT true,
    assigned_groups TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Quiz Questions
CREATE TABLE public.quiz_questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    required BOOLEAN DEFAULT true,
    points INTEGER DEFAULT 0,
    correct_answer JSONB,
    options JSONB,
    "order" INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Quiz Students
CREATE TABLE public.quiz_students (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    UNIQUE(quiz_id, student_id)
);

-- 12. Quiz Submissions
CREATE TABLE public.quiz_submissions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    answers JSONB,
    status TEXT NOT NULL DEFAULT 'draft',
    grade DECIMAL,
    student_comments TEXT,
    teacher_comments TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quiz_id, student_id)
);

-- 13. Materials Table
CREATE TABLE public.materials (
    id TEXT PRIMARY KEY,
    stream_item_id TEXT NOT NULL REFERENCES public.stream_items(id) ON DELETE CASCADE,
    description TEXT,
    assign_to_all BOOLEAN DEFAULT true,
    assigned_groups TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Material Students
CREATE TABLE public.material_students (
    id TEXT PRIMARY KEY,
    material_id TEXT NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    UNIQUE(material_id, student_id)
);

-- 15. Attachments
CREATE TABLE public.attachments (
    id TEXT PRIMARY KEY,
    stream_item_id TEXT NOT NULL REFERENCES public.stream_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT,
    file_path TEXT,
    file_size BIGINT,
    mime_type TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Grades
CREATE TABLE public.grades (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assignment_id TEXT REFERENCES public.assignments(id) ON DELETE SET NULL,
    quiz_id TEXT REFERENCES public.quizzes(id) ON DELETE SET NULL,
    points_earned DECIMAL,
    max_points DECIMAL,
    percentage DECIMAL,
    status TEXT,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON public.users FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.classes FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.class_members FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.topics FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.stream_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.assignment_students FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.assignment_submissions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.quizzes FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.quiz_questions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.quiz_students FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.quiz_submissions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.materials FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.material_students FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.attachments FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.grades FOR ALL TO authenticated USING (true);

alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.classes;
alter publication supabase_realtime add table public.class_members;
alter publication supabase_realtime add table public.topics;
alter publication supabase_realtime add table public.stream_items;
alter publication supabase_realtime add table public.assignments;
alter publication supabase_realtime add table public.assignment_submissions;
alter publication supabase_realtime add table public.quizzes;
alter publication supabase_realtime add table public.quiz_submissions;
