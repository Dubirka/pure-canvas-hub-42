-- Migration: Create inspections and properties tables with RLS policies for multi-device sync

CREATE TABLE IF NOT EXISTS public.inspections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  property_id TEXT,
  landlord_name TEXT,
  landlord_phone TEXT,
  property_name TEXT,
  property_address TEXT,
  checklist_data JSONB DEFAULT '{}'::jsonb,
  notes JSONB DEFAULT '{}'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  hidden_fields JSONB DEFAULT '[]'::jsonb,
  label_overrides JSONB DEFAULT '{}'::jsonb,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  landlord_name TEXT,
  landlord_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

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
