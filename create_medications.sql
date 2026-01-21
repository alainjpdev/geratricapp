DROP TABLE IF EXISTS public.medications;

CREATE TABLE public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id TEXT NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    medicamento TEXT,
    dosis TEXT,
    via TEXT,
    hora TEXT,
    observacion TEXT,
    recorded_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resident_id, date, medicamento, hora)
);

-- Disable RLS (as per previous agreement for other tables)
ALTER TABLE public.medications DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.medications TO anon;
GRANT ALL ON public.medications TO authenticated;
GRANT ALL ON public.medications TO service_role;

-- Reload schema
NOTIFY pgrst, 'reload schema';
