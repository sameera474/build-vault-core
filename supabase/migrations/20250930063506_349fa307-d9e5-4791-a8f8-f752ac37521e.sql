-- Allow super admins to update any company
DROP POLICY IF EXISTS "Super admins can update any company" ON public.companies;
CREATE POLICY "Super admins can update any company"
ON public.companies
FOR UPDATE
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Ensure realtime emits full row data for updates
ALTER TABLE public.companies REPLICA IDENTITY FULL;

-- Ensure the companies table is part of the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'companies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
  END IF;
END $$;