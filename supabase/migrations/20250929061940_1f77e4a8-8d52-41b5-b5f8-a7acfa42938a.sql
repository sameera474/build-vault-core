-- Helper: current user's role
create or replace function public.current_user_role()
returns text language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid()
$$;

-- Update RLS policies for strict project management

-- SELECT: all tenant users see only their company projects
drop policy if exists "tenant read projects" on public.projects;
create policy "tenant read projects"
on public.projects for select
using (company_id = current_user_company());

-- INSERT: only company admin of that company can create
drop policy if exists "tenant insert projects" on public.projects;
create policy "tenant insert projects"
on public.projects for insert
with check (
  company_id = current_user_company()
  and current_user_role() = 'admin'
);

-- UPDATE: only company admin of that company can update
drop policy if exists "tenant update projects" on public.projects;
create policy "tenant update projects"
on public.projects for update
using (
  company_id = current_user_company()
  and current_user_role() = 'admin'
);

-- DELETE: only company admin can delete
drop policy if exists "tenant delete projects" on public.projects;
create policy "tenant delete projects"
on public.projects for delete
using (
  company_id = current_user_company()
  and current_user_role() = 'admin'
);