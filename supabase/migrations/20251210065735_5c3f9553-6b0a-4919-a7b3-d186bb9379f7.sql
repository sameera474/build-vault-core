-- Add DELETE policy for test_reports
-- Allow users to delete reports from their company's projects
CREATE POLICY "Users can delete test reports from their company"
ON public.test_reports
FOR DELETE
USING (
  (EXISTS (
    SELECT 1
    FROM profiles p
    JOIN projects proj ON proj.company_id = p.company_id
    WHERE p.user_id = auth.uid() AND proj.id = test_reports.project_id
  ))
  OR (is_super_admin(auth.uid()) = true)
);

-- Add UPDATE policy for test_reports
-- Allow users to update reports from their company's projects
CREATE POLICY "Users can update test reports from their company"
ON public.test_reports
FOR UPDATE
USING (
  (EXISTS (
    SELECT 1
    FROM profiles p
    JOIN projects proj ON proj.company_id = p.company_id
    WHERE p.user_id = auth.uid() AND proj.id = test_reports.project_id
  ))
  OR (is_super_admin(auth.uid()) = true)
)
WITH CHECK (
  (EXISTS (
    SELECT 1
    FROM profiles p
    JOIN projects proj ON proj.company_id = p.company_id
    WHERE p.user_id = auth.uid() AND proj.id = test_reports.project_id
  ))
  OR (is_super_admin(auth.uid()) = true)
);

-- Add INSERT policy for test_reports
-- Allow users to insert reports for their company's projects
CREATE POLICY "Users can insert test reports for their company"
ON public.test_reports
FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1
    FROM profiles p
    JOIN projects proj ON proj.company_id = p.company_id
    WHERE p.user_id = auth.uid() AND proj.id = test_reports.project_id
  ))
  OR (is_super_admin(auth.uid()) = true)
  OR (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
);