GRANT ALL ON TABLE public.inspections TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.properties TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Owners can read inspections" ON public.inspections;
DROP POLICY IF EXISTS "Owners can create inspections" ON public.inspections;
DROP POLICY IF EXISTS "Owners can update inspections" ON public.inspections;
DROP POLICY IF EXISTS "Owners can delete inspections" ON public.inspections;
DROP POLICY IF EXISTS "Allow public read on inspections" ON public.inspections;
DROP POLICY IF EXISTS "Allow public insert on inspections" ON public.inspections;
DROP POLICY IF EXISTS "Allow public update on inspections" ON public.inspections;
DROP POLICY IF EXISTS "Allow public delete on inspections" ON public.inspections;

CREATE POLICY "Allow public read on inspections" ON public.inspections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert on inspections" ON public.inspections FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update on inspections" ON public.inspections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on inspections" ON public.inspections FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Signed-in users can read properties" ON public.properties;
DROP POLICY IF EXISTS "Signed-in users can create properties" ON public.properties;
DROP POLICY IF EXISTS "Signed-in users can update properties" ON public.properties;
DROP POLICY IF EXISTS "Signed-in users can delete properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can read properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can create properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can update properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can delete properties" ON public.properties;
DROP POLICY IF EXISTS "Allow public read on properties" ON public.properties;
DROP POLICY IF EXISTS "Allow public insert on properties" ON public.properties;
DROP POLICY IF EXISTS "Allow public update on properties" ON public.properties;
DROP POLICY IF EXISTS "Allow public delete on properties" ON public.properties;

CREATE POLICY "Allow public read on properties" ON public.properties FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert on properties" ON public.properties FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update on properties" ON public.properties FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on properties" ON public.properties FOR DELETE TO anon, authenticated USING (true);
