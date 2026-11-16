ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS user_id text DEFAULT (auth.uid())::text;
DROP POLICY IF EXISTS "Signed-in users can create properties" ON public.properties;
DROP POLICY IF EXISTS "Signed-in users can delete properties" ON public.properties;
DROP POLICY IF EXISTS "Signed-in users can read properties" ON public.properties;
DROP POLICY IF EXISTS "Signed-in users can update properties" ON public.properties;
CREATE POLICY "Owners can create properties" ON public.properties FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid())::text = user_id);
CREATE POLICY "Owners can read properties" ON public.properties FOR SELECT TO authenticated USING ((SELECT auth.uid())::text = user_id);
CREATE POLICY "Owners can update properties" ON public.properties FOR UPDATE TO authenticated USING ((SELECT auth.uid())::text = user_id) WITH CHECK ((SELECT auth.uid())::text = user_id);
CREATE POLICY "Owners can delete properties" ON public.properties FOR DELETE TO authenticated USING ((SELECT auth.uid())::text = user_id);