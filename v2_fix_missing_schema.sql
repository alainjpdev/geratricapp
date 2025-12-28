-- 1. Fix assignment_submissions table (Add potentially missing columns)
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS grade DECIMAL;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS student_comments TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS teacher_comments TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- 2. Create quiz_submissions table (Missing entirely)
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
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

-- 3. Ensure RLS policies exist (Basic ones for now, can be refined)
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Allow reading/writing own submissions or if teacher/admin
-- Note: complex policies omitted for brevity, ensure you have your standard policies applied if needed.
-- For development/fix, we can add a permissive policy or rely on existing ones if they cover 'public' broadly (not recommended for prod).
-- Assuming previous schema had policies, but if table is new, we might need basic ones.
CREATE POLICY "Enable all access for now" ON public.quiz_submissions FOR ALL USING (true) WITH CHECK (true);
