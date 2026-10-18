-- Migration: Create inspections and properties tables with complete TryViet audit schema and RLS policies

CREATE TABLE IF NOT EXISTS public.inspections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  property_id TEXT,
  property_name TEXT,
  property_address TEXT,
  neighborhood TEXT,
  unit_floor TEXT,
  maps_url TEXT,
  landlord_name TEXT,
  landlord_phone TEXT,
  landlord_zalo TEXT,
  video_url TEXT,
  verdict_score TEXT,
  verdict_best_for JSONB DEFAULT '[]'::jsonb,
  verdict_catch TEXT,
  checklist_data JSONB DEFAULT '{}'::jsonb,
  notes JSONB DEFAULT '{}'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  hidden_fields JSONB DEFAULT '[]'::jsonb,
  label_overrides JSONB DEFAULT '{}'::jsonb,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- In case table already existed without the new columns, add them safely
DO $$
BEGIN
  ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS neighborhood TEXT;
  ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS unit_floor TEXT;
  ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS maps_url TEXT;
  ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS landlord_zalo TEXT;
  ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS video_url TEXT;
  ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS verdict_score TEXT;
  ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS verdict_best_for JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS verdict_catch TEXT;
END $$;

CREATE TABLE IF NOT EXISTS public.properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  neighborhood TEXT,
  landlord_name TEXT,
  landlord_phone TEXT,
  landlord_zalo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS neighborhood TEXT;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS landlord_zalo TEXT;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Multi-device sync policies: allow client operations
CREATE POLICY "Allow public select on inspections" ON public.inspections FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on inspections" ON public.inspections FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on inspections" ON public.inspections FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on inspections" ON public.inspections FOR DELETE TO public USING (true);

CREATE POLICY "Allow public select on properties" ON public.properties FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on properties" ON public.properties FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on properties" ON public.properties FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on properties" ON public.properties FOR DELETE TO public USING (true);

-- Enable Supabase Realtime for inspections table (if publication exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inspections;
  END IF;
END $$;
