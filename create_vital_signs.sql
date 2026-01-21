-- Drop table if exists to ensure fresh schema
DROP TABLE IF EXISTS public.vital_signs;

-- Create vital_signs table
CREATE TABLE public.vital_signs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id TEXT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    ta TEXT,      -- Tensión Arterial
    fc TEXT,      -- Frecuencia Cardíaca
    fr TEXT,      -- Frecuencia Respiratoria
    temp TEXT,    -- Temperatura
    sato2 TEXT,   -- Saturación O2
    dxtx TEXT,    -- Dextrostix / Glucosa
    recorded_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resident_id, date, time)
);

-- Enable RLS
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all for authenticated users" ON public.vital_signs FOR ALL TO authenticated USING (true);

-- Add to publication for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vital_signs;
NOTIFY pgrst, 'reload schema';
