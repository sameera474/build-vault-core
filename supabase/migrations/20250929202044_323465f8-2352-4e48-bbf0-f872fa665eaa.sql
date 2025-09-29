-- Fix infinite recursion in projects RLS policies

-- Drop the problematic policy
DROP POLICY IF EXISTS "projects_modify_admins" ON public.projects;

-- Create separate policies for different operations to avoid recursion
CREATE POLICY "projects_insert_admins" ON public.projects
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles me
    WHERE me.user_id = auth.uid()
      AND (
        me.is_super_admin = true 
        OR me.role IN ('company_admin', 'admin')
      )
      AND (me.is_super_admin = true OR me.company_id = projects.company_id)
  )
);

CREATE POLICY "projects_update_admins" ON public.projects
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles me
    WHERE me.user_id = auth.uid()
      AND (
        me.is_super_admin = true 
        OR me.role IN ('company_admin', 'admin')
      )
      AND (me.is_super_admin = true OR me.company_id = projects.company_id)
  )
);

CREATE POLICY "projects_delete_admins" ON public.projects
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles me
    WHERE me.user_id = auth.uid()
      AND (
        me.is_super_admin = true 
        OR me.role IN ('company_admin', 'admin')
      )
      AND (me.is_super_admin = true OR me.company_id = projects.company_id)
  )
);